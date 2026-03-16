// routes/customers.routes.js
import express from "express";
import {
  listCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById
} from "../controllers/customers.controller.js";

const router = express.Router();
// récupérer un client par ID 
router.get("/:id", getCustomerById);
// 📌 Lister tous les clients
router.get("/", listCustomers);

// 📌 Obtenir un client par son ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM customers WHERE id = ?", [id]);

    if (rows.length === 0)
      return res.status(404).json({ ok: false, error: "Client non trouvé" });

    res.json({ ok: true, customer: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(err) });
  }
});

// 📌 Ajouter un client
router.post("/", createCustomer);

// 📌 Modifier un client
router.put("/:id", updateCustomer);

// 📌 Supprimer un client
router.delete("/:id", deleteCustomer);

export default router;