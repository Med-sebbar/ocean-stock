// controllers/products.controller.js
import { pool } from "../config/db.js";

// GET /api/products/health
export const health = async (req, res) => {
  const [r] = await pool.query("SELECT NOW() as now");
  res.json({ ok: true, db: "mysql", now: r[0].now });
};

// GET /api/products
export const list = async (req, res) => {
  const [rows] = await pool.query(`
    SELECT p.id, p.name, p.sku, p.unit_price, p.min_stock_kg,
           c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ORDER BY p.id DESC
  `);
  res.json({ ok: true, items: rows });
};

// GET /api/products/:id
export const getById = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: "id invalide" });
  const [rows] = await pool.query(
    "SELECT * FROM products WHERE id = ?",
    [id]
  );
  if (!rows.length) return res.status(404).json({ ok: false, error: "Introuvable" });
  res.json({ ok: true, item: rows[0] });
};

// GET /api/products/search?q=&category=
export const search = async (req, res) => {
  const { q = "", category = "" } = req.query;
  const params = [];
  let where = "WHERE 1=1";
  if (q.trim()) {
    where += " AND (p.name LIKE ? OR p.sku LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category.trim()) {
    where += " AND c.name = ?";
    params.push(category);
  }
  const [rows] = await pool.query(
    `
    SELECT p.id, p.name, p.sku, p.unit_price, c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${where}
    ORDER BY p.id DESC
    `,
    params
  );
  res.json({ ok: true, items: rows, count: rows.length });
};

// POST /api/products
export const create = async (req, res) => {
  const {
    name, sku, category_id = null,
    unit_price = 0,
    piece_weight_kg = 0, units_per_carton = 0, carton_weight_kg = 0,
    min_stock_kg = 0
  } = req.body || {};

  if (!name || !sku) {
    return res.status(400).json({ ok: false, error: "name et sku requis" });
  }

  try {
    const [r] = await pool.query(
      `INSERT INTO products
       (name, sku, category_id, unit_price, piece_weight_kg, units_per_carton, carton_weight_kg, min_stock_kg)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, category_id, unit_price, piece_weight_kg, units_per_carton, carton_weight_kg, min_stock_kg]
    );
    res.status(201).json({ ok: true, id: r.insertId });
  } catch (e) {
    if (String(e).includes("ER_DUP_ENTRY")) {
      return res.status(409).json({ ok: false, error: "SKU déjà utilisé" });
    }
    res.status(500).json({ ok: false, error: "DB error", detail: String(e) });
  }
};

// PUT /api/products/:id
export const update = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: "id invalide" });

  const {
    name, sku, category_id = null,
    unit_price = 0,
    piece_weight_kg = 0, units_per_carton = 0, carton_weight_kg = 0,
    min_stock_kg = 0
  } = req.body || {};

  if (!name || !sku) {
    return res.status(400).json({ ok: false, error: "name et sku requis" });
  }

  try {
    const [r] = await pool.query(
      `UPDATE products
       SET name=?, sku=?, category_id=?, unit_price=?,
           piece_weight_kg=?, units_per_carton=?, carton_weight_kg=?, min_stock_kg=?
       WHERE id=?`,
      [name, sku, category_id, unit_price,
       piece_weight_kg, units_per_carton, carton_weight_kg, min_stock_kg,
       id]
    );
    if (!r.affectedRows) return res.status(404).json({ ok: false, error: "Introuvable" });
    res.json({ ok: true });
  } catch (e) {
    if (String(e).includes("ER_DUP_ENTRY")) {
      return res.status(409).json({ ok: false, error: "SKU déjà utilisé" });
    }
    res.status(500).json({ ok: false, error: "DB error", detail: String(e) });
  }
};

// DELETE /api/products/:id
export const remove = async (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ ok: false, error: "id invalide" });
  const [r] = await pool.query("DELETE FROM products WHERE id = ?", [id]);
  if (!r.affectedRows) return res.status(404).json({ ok: false, error: "Introuvable" });
  res.json({ ok: true });
};
