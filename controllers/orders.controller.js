// controllers/orders.controller.js
import { pool } from "../config/db.js";

/**
 * GET /api/orders
 */
export const listOrders = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.order_number, o.status, o.total_ht, o.total_ttc, o.created_at,
             c.name AS customer_name, c.email AS customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `);
    res.json({ ok: true, count: rows.length, orders: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

/**
 * POST /api/orders
 */
export const createOrder = async (req, res) => {
  const { customer_id, order_number, status, total_ht, total_ttc } = req.body;

  if (!customer_id || !order_number)
    return res.status(400).json({ ok: false, error: "Champs requis manquants" });

  try {
    const [result] = await pool.query(
      `INSERT INTO orders (customer_id, order_number, status, total_ht, total_ttc)
       VALUES (?, ?, ?, ?, ?)`,
      [customer_id, order_number, status || "DRAFT", total_ht || 0, total_ttc || 0]
    );
    res.status(201).json({
      ok: true,
      message: "Commande créée avec succès",
      order_id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

/**
 * GET /api/orders/:id/details
 */
export const getOrderDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const [orderRows] = await pool.query(
      `SELECT o.id, o.order_number, o.status, o.total_ht, o.total_ttc, o.created_at,
              c.name AS customer_name, c.email AS customer_email
       FROM orders o
       LEFT JOIN customers c ON o.customer_id = c.id
       WHERE o.id = ?`,
      [id]
    );

    if (orderRows.length === 0)
      return res.status(404).json({ ok: false, error: "Commande introuvable" });

    const order = orderRows[0];

    const [items] = await pool.query(
      `SELECT oi.id, p.name, oi.qty, oi.uom, oi.unit_price, oi.subtotal
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = ?`,
      [id]
    );

    order.items = items;
    res.json({ ok: true, order });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

/**
 * PUT /api/orders/:id
 * Modifier statut, client, numéro
 */
export const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { status, order_number, customer_id, total_ht, total_ttc } = req.body;

  try {
    const [existing] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
    if (existing.length === 0)
      return res.status(404).json({ ok: false, error: "Commande introuvable" });

    const current = existing[0];

    await pool.query(
      `UPDATE orders 
       SET status = ?, order_number = ?, customer_id = ?, total_ht = ?, total_ttc = ?
       WHERE id = ?`,
      [
        status       || current.status,
        order_number || current.order_number,
        customer_id  || current.customer_id,
        total_ht     !== undefined ? total_ht  : current.total_ht,
        total_ttc    !== undefined ? total_ttc : current.total_ttc,
        id,
      ]
    );

    res.json({ ok: true, message: "Commande mise à jour avec succès" });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

/**
 * DELETE /api/orders/:id
 * Supprimer une commande et ses items
 */
export const deleteOrder = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Supprimer les items d'abord (clé étrangère)
    await conn.query("DELETE FROM order_items WHERE order_id = ?", [id]);
    const [result] = await conn.query("DELETE FROM orders WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "Commande introuvable" });
    }

    await conn.commit();
    res.json({ ok: true, message: "Commande supprimée avec succès" });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  } finally {
    conn.release();
  }
};
