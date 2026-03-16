// controllers/categorie.controller.js
import { pool } from "../config/db.js";

// ✅ ⿡ Créer une catégorie
export const createCategory = async (req, res) => {
  const { name, description } = req.body;
  if (!name)
    return res.status(400).json({ ok: false, error: "Le nom de la catégorie est requis" });

  try {
    const [result] = await pool.query(
      "INSERT INTO categories (name, description) VALUES (?, ?)",
      [name, description || null]
    );

    res.status(201).json({
      ok: true,
      message: "Catégorie ajoutée avec succès",
      category_id: result.insertId,
    });
  } catch (err) {
    console.error("Erreur createCategory :", err);
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

// ✅ ⿢ Lister toutes les catégories
export const listCategories = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    res.json({ ok: true, count: rows.length, categories: rows });
  } catch (err) {
    console.error("Erreur listCategories :", err);
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

// ✅ ⿣ Mettre à jour une catégorie
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE categories SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, error: "Catégorie non trouvée" });

    res.json({ ok: true, message: "Catégorie mise à jour avec succès" });
  } catch (err) {
    console.error("Erreur updateCategory :", err);
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};

// ✅ ⿤ Supprimer une catégorie
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query("DELETE FROM categories WHERE id = ?", [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ ok: false, error: "Catégorie non trouvée" });

    res.json({ ok: true, message: "Catégorie supprimée avec succès" });
  } catch (err) {
    console.error("Erreur deleteCategory :", err);
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
};
