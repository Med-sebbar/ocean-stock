// routes/auth.routes.js
import express from "express";
import {
  register,
  login,
  listUsers,
  updateUser,
  deleteUser,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Routes publiques
router.post("/login",    login);

// Routes admin seulement
router.post("/register",              protect, adminOnly, register);
router.get("/users",                  protect, adminOnly, listUsers);
router.put("/users/:id",              protect, adminOnly, updateUser);
router.delete("/users/:id",           protect, adminOnly, deleteUser);
router.put("/users/:id/password",     protect, adminOnly, resetPassword);

export default router;
