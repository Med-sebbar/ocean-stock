// routes/orders.routes.js
import express from "express";
import {
  listOrders,
  createOrder,
  getOrderDetails,
  updateOrder,
  deleteOrder,
} from "../controllers/orders.controller.js";

const router = express.Router();

router.get("/",              listOrders);
router.post("/",             createOrder);
router.get("/:id/details",   getOrderDetails);
router.put("/:id",           updateOrder);   // ✅ Modifier statut + infos
router.delete("/:id",        deleteOrder);   // ✅ Supprimer

export default router;
