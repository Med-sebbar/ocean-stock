// controllers/auth.controller.js
import { pool } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET  = process.env.JWT_SECRET || "oceanstock_secret_2025";
const JWT_EXPIRES = "8h"; // token valide 8h

/**
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ ok: false, error: "Champs requis manquants" });

  try {
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length > 0)
      return res.status(409).json({ ok: false, error: "Email déjà utilisé" });

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)",
      [username, password_hash, role || "employee", email]
    );

    res.status(201).json({
      ok: true,
      user_id: result.insertId,
      message: "Utilisateur créé avec succès"
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

/**
 * POST /api/auth/login
 * Retourne un JWT token
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ ok: false, error: "Champs requis manquants" });

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0)
      return res.status(404).json({ ok: false, error: "Utilisateur non trouvé" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match)
      return res.status(401).json({ ok: false, error: "Mot de passe incorrect" });

    // ✅ Génération du token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      ok: true,
      message: "Connexion réussie",
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

/**
 * GET /api/auth/users — Admin seulement
 */
export const listUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, username, email, role, created_at
      FROM users ORDER BY created_at DESC
    `);
    res.json({ ok: true, count: rows.length, users: rows });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

/**
 * PUT /api/auth/users/:id
 */
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;

  if (!username || !email)
    return res.status(400).json({ ok: false, error: "Username et email requis" });

  try {
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ? AND id != ?", [email, id]
    );
    if (existing.length > 0)
      return res.status(409).json({ ok: false, error: "Email déjà utilisé" });

    const [result] = await pool.query(
      "UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?",
      [username, email, role || "employee", id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, error: "Utilisateur non trouvé" });

    res.json({ ok: true, message: "Utilisateur mis à jour" });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

/**
 * DELETE /api/auth/users/:id
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, error: "Utilisateur non trouvé" });
    res.json({ ok: true, message: "Utilisateur supprimé" });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

/**
 * PUT /api/auth/users/:id/password
 */
export const resetPassword = async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;

  if (!new_password || new_password.length < 6)
    return res.status(400).json({ ok: false, error: "Minimum 6 caractères" });

  try {
    const [rows] = await pool.query("SELECT id FROM users WHERE id = ?", [id]);
    if (rows.length === 0)
      return res.status(404).json({ ok: false, error: "Utilisateur non trouvé" });

    const password_hash = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash, id]);

    res.json({ ok: true, message: "Mot de passe réinitialisé" });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};
