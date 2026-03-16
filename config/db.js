// config/db.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "stockdb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// petit test de connexion au démarrage (log console)
export async function pingDB() {
  const conn = await pool.getConnection();
  const [rows] = await conn.query("SELECT NOW() as now");
  conn.release();
  console.log("🟢 MySQL OK, time:", rows[0].now);
}
