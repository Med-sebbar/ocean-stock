import { pool } from "../config/db.js";

// Lister toutes les factures
export const listInvoices = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, o.order_number
      FROM invoices i
      LEFT JOIN orders o ON i.order_id = o.id
      ORDER BY i.created_at DESC
    `);
    res.json({ ok: true, count: rows.length, invoices: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

// Afficher une seule facture
export const getInvoiceById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT i.*, o.order_number FROM invoices i
       LEFT JOIN orders o ON i.order_id = o.id
       WHERE i.id = ?`,
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ ok: false, error: "Facture non trouvée" });

    res.json({ ok: true, invoice: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

// Créer une nouvelle facture

export const createInvoice = async (req, res) => {
  const { order_id, invoice_number, total_ht, total_ttc, due_date } = req.body;

  // Vérifier les champs obligatoires
  if (!order_id || !invoice_number)
    return res.status(400).json({ ok: false, error: "Champs requis manquants" });

  try {
    const [result] = await pool.query(
      `INSERT INTO invoices (order_id, invoice_number, status, total_ht, total_ttc, due_date)
       VALUES (?, ?, 'UNPAID', ?, ?, ?)`,
      [order_id, invoice_number, total_ht, total_ttc, due_date]
    );

    res.status(201).json({
      ok: true,
      message: "Facture créée avec succès",
      invoice_id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "Erreur serveur",
      detail: String(err),
    });
  }
};

/**
 * PUT /api/invoices/:id
 * Met à jour une facture existante
 */

export const updateInvoice = async (req, res) => {
  const { id } = req.params;
  console.log(" body recu:", req.body);
  const { status, total_ht, total_ttc, due_date } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE invoices 
       SET status = ?, total_ht = ?, total_ttc = ?, due_date = ?
       WHERE id = ?`,
      [status, total_ht, total_ttc, due_date, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Facture non trouvée" });
    }

    res.json({ ok: true, message: "Facture mise à jour avec succès" });
  } catch (err) {
    console.error("Erreur SQL :", err);
    res.status(500).json({ ok: false, error: "Erreur serveur", details: err.message });
  }
};
/**
 * DELETE /api/invoices/:id
 * Supprime une facture
 */
export const deleteInvoice = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM invoices WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Facture non trouvée" });
    }

    res.json({ ok: true, message: "Facture supprimée avec succès" });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};