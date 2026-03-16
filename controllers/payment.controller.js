// controllers/payment.controller.js
import { pool } from "../config/db.js";

// --- Créer un paiement ---
export const createPayment = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { invoice_id, amount, method, received_at } = req.body;

    if (!invoice_id || !amount)
      return res.status(400).json({ ok: false, error: "invoice_id et amount sont requis" });

    // Vérifier que la facture existe
    const [invoiceRows] = await conn.query(
      "SELECT id, total_ttc, status FROM invoices WHERE id = ?",
      [invoice_id]
    );
    if (invoiceRows.length === 0)
      return res.status(404).json({ ok: false, error: "Facture introuvable" });

    await conn.beginTransaction();

    // Insérer le paiement
    const [result] = await conn.query(
      `INSERT INTO payments (invoice_id, amount, method, received_at)
       VALUES (?, ?, ?, ?)`,
      [invoice_id, amount, method || "cash", received_at || new Date()]
    );

    // Calculer total déjà payé pour cette facture
    const [paidRows] = await conn.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_paid FROM payments WHERE invoice_id = ?",
      [invoice_id]
    );
    const totalPaid = parseFloat(paidRows[0].total_paid);
    const totalTTC  = parseFloat(invoiceRows[0].total_ttc);

    // Si montant payé >= total facture → passer en PAID automatiquement
    if (totalPaid >= totalTTC) {
      await conn.query(
        "UPDATE invoices SET status = 'PAID' WHERE id = ?",
        [invoice_id]
      );
    }

    await conn.commit();

    res.status(201).json({
      ok: true,
      id: result.insertId,
      invoice_paid: totalPaid >= totalTTC,
      message: totalPaid >= totalTTC
        ? "Paiement enregistré — Facture marquée comme PAYÉE ✓"
        : "Paiement enregistré ✓"
    });
  } catch (err) {
    await conn.rollback();
    console.error("Erreur createPayment:", err);
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  } finally {
    conn.release();
  }
};

// --- Obtenir tous les paiements ---
export const getAllPayments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*,
              i.invoice_number,
              i.status    AS invoice_status,
              i.total_ttc AS invoice_total
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id = i.id
       ORDER BY p.received_at DESC`
    );
    res.json({ ok: true, items: rows });
  } catch (err) {
    console.error("Erreur getAllPayments:", err);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};

// --- Mettre à jour un paiement ---
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, method } = req.body;

    const [result] = await pool.query(
      "UPDATE payments SET amount = ?, method = ?, received_at = NOW() WHERE id = ?",
      [amount, method, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, error: "Paiement introuvable" });

    res.json({ ok: true, message: "Paiement mis à jour" });
  } catch (err) {
    console.error("Erreur updatePayment:", err);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};

// --- Supprimer un paiement ---
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM payments WHERE id = ?", [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, error: "Paiement introuvable" });

    res.json({ ok: true, message: "Paiement supprimé" });
  } catch (err) {
    console.error("Erreur deletePayment:", err);
    res.status(500).json({ ok: false, error: "Erreur serveur" });
  }
};
