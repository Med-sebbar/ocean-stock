// controllers/purchase_orders.controller.js
import { pool } from "../config/db.js";

// GET /api/purchase_orders — seulement les non archivés
export const listPurchaseOrders = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.po_number, o.status, o.total_amount, o.created_at, o.archived,
             s.name AS supplier
      FROM purchase_orders o
      LEFT JOIN suppliers s ON s.id = o.supplier_id
      WHERE o.archived = 0
      ORDER BY o.created_at DESC
    `);
    res.json({ ok: true, orders: rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};

// POST /api/purchase_orders
export const createPurchaseOrder = async (req, res) => {
  const { supplier_id, po_number, status, items } = req.body;
  if (!supplier_id || !items || items.length === 0)
    return res.status(400).json({ ok: false, error: "Données incomplètes" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let total = 0;
    for (const item of items) total += (item.qty || 0) * (item.unit_price || 0);

    const [orderResult] = await conn.query(
      "INSERT INTO purchase_orders (supplier_id, po_number, status, total_amount, archived) VALUES (?, ?, ?, ?, 0)",
      [supplier_id, po_number || null, status || "DRAFT", total]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await conn.query(
        "INSERT INTO purchase_items (purchase_order_id, product_id, uom, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
        [orderId, item.product_id, item.uom || "KG", item.qty, item.unit_price, (item.qty || 0) * (item.unit_price || 0)]
      );
    }

    await conn.commit();
    res.status(201).json({ ok: true, message: "Commande créée", order_id: orderId, total });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  } finally {
    conn.release();
  }
};

// GET /api/purchase_orders/:id
export const getPurchaseOrderDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const [orders] = await pool.query(`
      SELECT o.*, s.name AS supplier FROM purchase_orders o
      LEFT JOIN suppliers s ON s.id = o.supplier_id WHERE o.id = ?`, [id]);
    if (orders.length === 0) return res.status(404).json({ ok: false, error: "Commande introuvable" });

    const [items] = await pool.query(`
      SELECT i.*, p.name AS product FROM purchase_items i
      LEFT JOIN products p ON p.id = i.product_id WHERE i.purchase_order_id = ?`, [id]);

    res.json({ ok: true, order: orders[0], items });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};

// DELETE /api/purchase_orders/:id — Logique Odoo
// DRAFT → suppression directe
// RECEIVED → archivage
export const deletePurchaseOrder = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query("SELECT * FROM purchase_orders WHERE id = ?", [id]);
    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "Commande introuvable" });
    }

    const order = orders[0];

    if (order.status === "RECEIVED") {
      // ARCHIVAGE — stock déjà mis à jour, on garde l'historique
      await conn.query("UPDATE purchase_orders SET archived = 1 WHERE id = ?", [id]);
      await conn.commit();
      return res.json({ ok: true, archived: true, message: "Commande archivée" });
    } else {
      // SUPPRESSION directe — DRAFT ou CANCELLED
      await conn.query("DELETE FROM purchase_items WHERE purchase_order_id = ?", [id]);
      await conn.query("DELETE FROM purchase_orders WHERE id = ?", [id]);
      await conn.commit();
      return res.json({ ok: true, archived: false, message: "Commande supprimée" });
    }
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  } finally {
    conn.release();
  }
};

// PUT /api/purchase_orders/:id/receive
export const receivePurchaseOrder = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orders] = await conn.query("SELECT * FROM purchase_orders WHERE id = ?", [id]);
    if (orders.length === 0) return res.status(404).json({ ok: false, error: "Commande introuvable" });
    if (orders[0].status === "RECEIVED") return res.status(400).json({ ok: false, error: "Déjà reçue" });

    const [items] = await conn.query("SELECT * FROM purchase_items WHERE purchase_order_id = ?", [id]);
    if (items.length === 0) return res.status(400).json({ ok: false, error: "Aucun article" });

    for (const item of items) {
      const lotCode = `LOT-${Date.now()}-${item.product_id}`;
      const [lotResult] = await conn.query(
        "INSERT INTO lots (product_id, lot_code, qty_kg, exp_date, location) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 6 MONTH), 'Warehouse')",
        [item.product_id, lotCode, item.qty]
      );
      await conn.query(
        "INSERT INTO movements (product_id, lot_id, type, qty_kg, ref, reason, uom) VALUES (?, ?, 'IN', ?, 'PO', 'Réception fournisseur', 'KG')",
        [item.product_id, lotResult.insertId, item.qty]
      );
    }

    await conn.query("UPDATE purchase_orders SET status = 'RECEIVED' WHERE id = ?", [id]);
    await conn.commit();
    res.json({ ok: true, message: "Commande reçue et stock mis à jour" });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  } finally {
    conn.release();
  }
};
