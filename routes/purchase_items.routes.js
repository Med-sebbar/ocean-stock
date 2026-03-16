// routes/purchase_items.routes.js
import express from "express";
import {
  listPurchaseItems,
  addPurchaseItem,
  updatePurchaseItem,
  deletePurchaseItem,
} from "../controllers/purchase_items.controller.js";

const router = express.Router();

// ✅ Routes CRUD
router.get("/:order_id", listPurchaseItems);  // Liste des articles d'une commande
router.post("/", addPurchaseItem);            // Ajouter un article
router.put("/:id", updatePurchaseItem);       // Modifier un article
router.delete("/:id", deletePurchaseItem);    // Supprimer un article

export default router;