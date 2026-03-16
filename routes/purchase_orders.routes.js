// routes/purchase_orders.routes.js
import express from "express";
import {
  createPurchaseOrder,
  listPurchaseOrders,
  getPurchaseOrderDetails,
  deletePurchaseOrder,
  receivePurchaseOrder,
} from "../controllers/purchase_orders.controller.js";

const router = express.Router();

// ✅ CRUD routes
router.get("/", listPurchaseOrders);           // Liste des commandes
router.post("/", createPurchaseOrder);         // Créer une commande
router.get("/:id", getPurchaseOrderDetails);   // Voir les détails
router.delete("/:id", deletePurchaseOrder);    // Supprimer
router.put("/:id/receive", receivePurchaseOrder); //Reception d'une commande

export default router;