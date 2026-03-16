// routes/export.routes.js
import express from "express";
import { exportRapportPDF } from "../controllers/export/pdf.controller.js";

const router = express.Router();

// Route d’export du rapport analytique PDF
router.get("/rapport", exportRapportPDF);

export default router;