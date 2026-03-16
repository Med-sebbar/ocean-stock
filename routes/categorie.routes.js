// routes/categories.routes.js
import express from "express";
import {
  createCategory,
  listCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/categorie.controller.js";

const router = express.Router();

// ➕ Ajouter une catégorie
router.post("/", createCategory);

// 📋 Lister toutes les catégories
router.get("/", listCategories);

// ✏ Modifier une catégorie
router.put("/:id", updateCategory);

// 🗑 Supprimer une catégorie
router.delete("/:id", deleteCategory);

export default router;