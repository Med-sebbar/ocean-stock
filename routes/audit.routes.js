import express from "express";
import { getAuditLogs } from "../controllers/audit.controller.js";

const router = express.Router();

// 🔹 Voir tous les logs (ou filtrés)
router.get("/", getAuditLogs);
export default router;
