// server.js
import dotenv from "dotenv";
dotenv.config();

import { pingDB } from "./config/db.js";
import app from "./app.js";

const PORT = process.env.PORT || 4000;

app.listen(PORT, async () => {
  await pingDB(); // Test de connexion MySQL
  console.log(`✅ API lancée sur http://localhost:${PORT}`);
});
