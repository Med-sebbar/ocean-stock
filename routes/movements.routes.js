import express from "express";
import {
  listMovements,
  addLot,
  fefoOut
} from "../controllers/movements.controller.js";

const router = express.Router();

router.get("/", listMovements);
router.post("/in", addLot);
router.post("/out", fefoOut);

export default router;
