// routes/lots.routes.js
import express from "express";
import {
  listLots,
  createLot,
  updateLot,
  deleteLot,
} from "../controllers/lots.controller.js";

const router = express.Router();

router.get("/",        listLots);
router.post("/",       createLot);
router.put("/:id",     updateLot);    // ✅ Modifier emplacement + date expiration
router.delete("/:id",  deleteLot);   // ✅ Supprimer si qty = 0

export default router;
