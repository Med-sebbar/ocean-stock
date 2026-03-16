import express from "express";
import { getVentesStats } from "../controllers/analytics/ventes.controller.js";
import { getAchatsStats } from "../controllers/analytics/achats.controller.js";
import { getStockStats } from "../controllers/analytics/stock.controller.js";
import { getGlobalAnalytics } from "../controllers/analytics/dashboard.controller.js";

const router = express.Router();

router.get("/ventes", getVentesStats);
router.get("/achats", getAchatsStats);
router.get("/stock", getStockStats);
router.get("/dashboard", getGlobalAnalytics);
export default router;
