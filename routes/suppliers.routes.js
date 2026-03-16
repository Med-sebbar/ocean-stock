// routes/suppliers.routes.js
import express from "express";
import {
  createSupplier,
  listSuppliers,
  updateSupplier,
  deleteSupplier,
} from "../controllers/suppliers.controller.js";

const router = express.Router();

// ✅ Routes CRUD fournisseurs
router.get("/", listSuppliers);        // Lire tous les fournisseurs
router.post("/", createSupplier);      // Ajouter un fournisseur
router.put("/:id", updateSupplier);    // Modifier un fournisseur
router.delete("/:id", deleteSupplier); // Supprimer un fournisseur

export default router;