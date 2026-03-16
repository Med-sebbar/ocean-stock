// controllers/audit.controller.js
import { pool } from "../config/db.js";

// ✅ Récupérer tous les logs avec filtres facultatifs
export const getAuditLogs = async (req, res) => {
  try {
    const { user_id, table, action } = req.query;

    let sql = `
      SELECT 
        a.id,
        a.user_id,
        u.username,
        a.table_name,
        a.action,
        a.record_id,
        a.details,
        a.created_at
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (user_id) {
      sql += " AND a.user_id = ?";
      params.push(user_id);
    }

    if (table) {
      sql += " AND a.table_name = ?";
      params.push(table);
    }

    if (action) {
      sql += " AND a.action = ?";
      params.push(action);
    }

    sql += " ORDER BY a.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ ok: true, logs: rows });
  } catch (error) {
    console.error("Erreur lors de la récupération des logs :", error);
    res.status(500).json({
      ok: false,
      error: "Erreur lors de la récupération des logs",
      details: String(error),
    });
  }
};