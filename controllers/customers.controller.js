// controllers/customers.controller.js
import { pool } from "../config/db.js";

/**
 * 📌 GET /api/customers
 * Liste de tous les clients
 */
export const listCustomers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, phone, email, address
      FROM customers
      ORDER BY id DESC
    `);
    res.json({ ok: true, count: rows.length, customers: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur lors du chargement des clients", detail: String(err) });
  }
};

/**
 * 📌 POST /api/customers
 * Ajouter un nouveau client
 */
export const createCustomer = async (req, res) => {
  const { name, phone, email, address } = req.body;

  if (!name || !email)
    return res.status(400).json({ ok: false, error: "Le nom et l'email sont requis" });

  try {
    const [result] = await pool.query(
      "INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)",
      [name, phone || null, email, address || null]
    );       
    res.status(201).json({
      ok: true,
      message: "Client ajouté avec succès",
      customer_id: result.insertId
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur lors de l'ajout du client", detail: String(err) });
  }
};

/**
 * 📌 PUT /api/customers/:id
 * Modifier un client
 */
export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, address } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE customers SET name=?, phone=?, email=?, address=? WHERE id=?",
      [name, phone, email, address, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, error: "Client non trouvé" });

    res.json({ ok: true, message: "Client mis à jour avec succès" });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur lors de la mise à jour", detail: String(err) });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM customers WHERE id = ?", [id]);

    if (rows.length === 0)
      return res.status(404).json({ ok: false, error: "Client non trouvé" });

    res.json({ ok: true, customer: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};
/**
 * 📌 DELETE /api/customers/:id
 * Supprimer un client
 */
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM customers WHERE id=?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, error: "Client non trouvé" });

    res.json({ ok: true, message: "Client supprimé avec succès" });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur lors de la suppression", detail: String(err) });
  }
};
