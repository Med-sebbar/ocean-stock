// routes/payment.routes.js
import express from "express";
import {
  createPayment,
  getAllPayments,
  updatePayment,
  deletePayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/", createPayment);
router.get("/", getAllPayments);
router.put("/:id", updatePayment);
router.delete("/:id", deletePayment);

export default router;