// controllers/purchase_items.controller.js
import { pool } from "../config/db.js";

// ✅ Lister les articles d’un bon de commande
export const listPurchaseItems = async (req, res) => {
  const { order_id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT i.*, p.name AS product 
       FROM purchase_items i
       LEFT JOIN products p ON p.id = i.product_id
       WHERE i.purchase_order_id = ?`,
      [order_id]
    );
    res.json({ ok: true, items: rows });
  } catch (error) {
    console.error("Erreur listPurchaseItems:", error);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};

// ✅ Ajouter un article à un bon d’achat existant
export const addPurchaseItem = async (req, res) => {
  const { purchase_order_id, product_id, uom, qty, unit_price } = req.body;

  if (!purchase_order_id || !product_id || !qty || !unit_price) {
    return res.status(400).json({ ok: false, error: "Champs manquants" });
  }

  try {
    const subtotal = qty * unit_price;

    const [result] = await pool.query(
      `INSERT INTO purchase_items (purchase_order_id, product_id, uom, qty, unit_price, subtotal)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [purchase_order_id, product_id, uom || "KG", qty, unit_price, subtotal]
    );

    // 🔄 Mise à jour automatique du total dans purchase_orders
    await pool.query(
      `UPDATE purchase_orders 
       SET total_amount = (SELECT SUM(subtotal) FROM purchase_items WHERE purchase_order_id = ?) 
       WHERE id = ?`,
      [purchase_order_id, purchase_order_id]
    );

    res.status(201).json({ ok: true, message: "Article ajouté", id: result.insertId });
  } catch (error) {
    console.error("Erreur addPurchaseItem:", error);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};

// ✅ Mettre à jour un article
export const updatePurchaseItem = async (req, res) => {
  const { id } = req.params;
  const { qty, unit_price } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE purchase_items 
       SET qty = ?, unit_price = ?, subtotal = ? * ? 
       WHERE id = ?`,
      [qty, unit_price, qty, unit_price, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, error: "Article non trouvé" });

    res.json({ ok: true, message: "Article mis à jour" });
  } catch (error) {
    console.error("Erreur updatePurchaseItem:", error);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};

// ✅ Supprimer un article
export const deletePurchaseItem = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM purchase_items WHERE id = ?', [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, error: "Article introuvable" });

    res.json({ ok: true, message: "Article supprimé" });
  } catch (error) {
    console.error("Erreur deletePurchaseItem:", error);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};
