import express from "express";
import { listInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice } from "../controllers/invoices.controller.js";

const router = express.Router();

// Liste de toutes les factures
router.get("/", listInvoices);

// Détails d'une facture spécifique
router.get("/:id", getInvoiceById);
router.post("/", createInvoice);
router.put("/:id", updateInvoice);
router.delete("/:id", deleteInvoice);
export default router;