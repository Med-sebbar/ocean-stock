// routes/orderItems.routes.js
import express from "express";
import {
  listOrderItems,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
} from "../controllers/orderItems.controller.js";

const router = express.Router();

router.get("/",      listOrderItems);
router.post("/",     addOrderItem);
router.put("/:id",   updateOrderItem);
router.delete("/:id", deleteOrderItem); // ✅ DELETE au lieu de POST

export default router;
