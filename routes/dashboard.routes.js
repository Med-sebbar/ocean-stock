// routes/dashboard.routes.js
import express from "express";
import { getMainKPI } from "../controllers/dashboard.controller.js";

const router = express.Router();

// Route principale du dashboard KPI
router.get("/kpi", getMainKPI);

export default router;