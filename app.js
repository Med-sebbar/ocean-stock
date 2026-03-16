// app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";

//routes importés
import productsRoutes from "./routes/products.routes.js";
import movementsRoutes from "./routes/movements.routes.js";
import lotsRoutes from "./routes/lots.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import authRoutes from "./routes/auth.routes.js";
import customersRoutes from "./routes/customers.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import orderItemsRoutes from "./routes/orderItems.routes.js";    
import invoicesRoutes from "./routes/invoices.routes.js";
import paymentsRoutes from "./routes/payment.routes.js";
import supplierRoutes from "./routes/suppliers.routes.js";
import purchaseOrdersRoutes from "./routes/purchase_orders.routes.js";
import purchaseItemsRoutes from "./routes/purchase_items.routes.js";
import categoriesRoutes from "./routes/categorie.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import exportRoutes from "./routes/export.routes.js";

const app = express();
//middleware globaux
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

//montages des modules API

app.use("/api/products", productsRoutes); // <- montage du module
app.use("/api/movements", movementsRoutes);
app.use("/api/lots", lotsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/order-items", orderItemsRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase_orders", purchaseOrdersRoutes);
app.use("/api/purchase_items", purchaseItemsRoutes);
app.use("/api/categorie", categoriesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/export", exportRoutes);



//roue d'acceuil
app.get("/", (req, res) => res.send("API PFE-Stock (Étape 2 MVC)"));
//gestion d'erreurs 404
app.use((req, res) => res.status(404).json({ ok: false, error: "Not found" }));

export default app;
