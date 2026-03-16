// controllers/orderItems.controller.js
import { pool } from "../config/db.js";

// Recalcule et met à jour total_ht + total_ttc de la commande (TVA 20%)
const recalcOrderTotal = async (conn, order_id) => {
  const [rows] = await conn.query(
    "SELECT COALESCE(SUM(subtotal), 0) AS total FROM order_items WHERE order_id = ?",
    [order_id]
  );
  const total_ht  = parseFloat(rows[0].total);
  const total_ttc = parseFloat((total_ht * 1.2).toFixed(2));
  await conn.query(
    "UPDATE orders SET total_ht = ?, total_ttc = ? WHERE id = ?",
    [total_ht, total_ttc, order_id]
  );
  return { total_ht, total_ttc };
};

/**
 * GET /api/order-items
 */
export const listOrderItems = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT oi.*, p.name AS product_name
      FROM order_items oi
      LEFT JOIN products p ON p.id = oi.product_id
    `);
    res.json({ ok: true, count: rows.length, items: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

/**
 * POST /api/order-items
 * Ajoute un produit à une commande + recalcule le total
 */
export const addOrderItem = async (req, res) => {
  const { order_id, product_id, uom, qty, unit_price } = req.body;

  if (!order_id || !product_id || !qty || !unit_price)
    return res.status(400).json({ ok: false, error: "Champs requis manquants" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const subtotal = parseFloat(qty) * parseFloat(unit_price);

    const [result] = await conn.query(
      `INSERT INTO order_items (order_id, product_id, uom, qty, unit_price, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [order_id, product_id, uom || "KG", qty, unit_price, subtotal]
    );

    // ✅ Recalcul automatique du total commande
    const totals = await recalcOrderTotal(conn, order_id);

    await conn.commit();
    res.status(201).json({
      ok: true,
      id: result.insertId,
      message: "Produit ajouté à la commande",
      ...totals,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  } finally {
    conn.release();
  }
};

/**
 * PUT /api/order-items/:id
 * Modifier quantité ou prix + recalcule le total
 */
export const updateOrderItem = async (req, res) => {
  const { id } = req.params;
  const { qty, unit_price } = req.body;

  if (!qty && !unit_price)
    return res.status(400).json({ ok: false, error: "Aucune modification fournie" });

  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.query("SELECT * FROM order_items WHERE id = ?", [id]);
    if (existing.length === 0)
      return res.status(404).json({ ok: false, error: "Article non trouvé" });

    await conn.beginTransaction();

    const newQty      = parseFloat(qty      || existing[0].qty);
    const newPrice    = parseFloat(unit_price || existing[0].unit_price);
    const newSubtotal = parseFloat((newQty * newPrice).toFixed(2));

    await conn.query(
      "UPDATE order_items SET qty = ?, unit_price = ?, subtotal = ? WHERE id = ?",
      [newQty, newPrice, newSubtotal, id]
    );

    // ✅ Recalcul automatique du total commande
    const totals = await recalcOrderTotal(conn, existing[0].order_id);

    await conn.commit();
    res.json({ ok: true, message: "Article mis à jour", subtotal: newSubtotal, ...totals });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  } finally {
    conn.release();
  }
};

/**
 * DELETE /api/order-items/:id
 * Supprime un article + recalcule le total
 */
export const deleteOrderItem = async (req, res) => {
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    const [existing] = await conn.query("SELECT * FROM order_items WHERE id = ?", [id]);
    if (existing.length === 0)
      return res.status(404).json({ ok: false, error: "Article non trouvé" });

    await conn.beginTransaction();

    await conn.query("DELETE FROM order_items WHERE id = ?", [id]);

    // ✅ Recalcul automatique du total commande
    const totals = await recalcOrderTotal(conn, existing[0].order_id);

    await conn.commit();
    res.json({ ok: true, message: "Article supprimé avec succès", ...totals });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  } finally {
    conn.release();
  }
};
