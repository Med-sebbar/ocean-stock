// routes/products.routes.js
import { Router } from "express";
import {
  health, list, getById, search,
  create, update, remove
} from "../controllers/products.controller.js";

const r = Router();

r.get("/health", health);
r.get("/", list);
r.get("/search", search);  
r.get("/:id", getById);
r.post("/", create);
r.put("/:id", update);
r.delete("/:id", remove);

export default r;
