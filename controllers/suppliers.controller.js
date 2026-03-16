// controllers/suppliers.controller.js
import { pool } from "../config/db.js";

// GET /api/suppliers — seulement les actifs (archived = 0)
export const listSuppliers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM suppliers WHERE archived = 0 ORDER BY name ASC"
    );
    res.json({ ok: true, suppliers: rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};

// POST /api/suppliers
export const createSupplier = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) return res.status(400).json({ ok: false, error: "Le nom est requis" });

    const [result] = await pool.query(
      "INSERT INTO suppliers (name, phone, email, address, archived) VALUES (?, ?, ?, ?, 0)",
      [name, phone || null, email || null, address || null]
    );
    res.status(201).json({ ok: true, id: result.insertId, message: "Fournisseur ajouté" });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};

// PUT /api/suppliers/:id
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    const [result] = await pool.query(
      "UPDATE suppliers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?",
      [name, phone || null, email || null, address || null, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, error: "Fournisseur introuvable" });

    res.json({ ok: true, message: "Fournisseur mis à jour" });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};

// DELETE /api/suppliers/:id — Logique Odoo
// Aucun bon d'achat → suppression directe
// A des bons d'achat  → archivage (archived = 1)
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si des bons d'achat existent
    const [poRows] = await pool.query(
      "SELECT COUNT(*) AS total FROM purchase_orders WHERE supplier_id = ?", [id]
    );
    const hasPO = poRows[0].total > 0;

    if (hasPO) {
      // ARCHIVAGE — historique conservé
      await pool.query("UPDATE suppliers SET archived = 1 WHERE id = ?", [id]);
      return res.json({ ok: true, archived: true, message: "Fournisseur archivé (bons d'achat conservés)" });
    } else {
      // SUPPRESSION directe — aucun historique
      await pool.query("DELETE FROM suppliers WHERE id = ?", [id]);
      return res.json({ ok: true, archived: false, message: "Fournisseur supprimé" });
    }
  } catch (error) {
    console.error("Erreur deleteSupplier:", error);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};
