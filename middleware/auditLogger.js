// middlewares/auditLogger.js
import { pool } from "../config/db.js";

/**
 * Fonction pour enregistrer une action dans la table audit_logs
 * @param {number} user_id - ID de l'utilisateur (temporaire : 1 pour les tests)
 * @param {string} table_name - Nom de la table concernée (ex: 'lots')
 * @param {string} action - Type d'action ('INSERT', 'UPDATE', 'DELETE')
 * @param {number} record_id - ID de l'enregistrement concerné
 * @param {string} details - Description facultative
 */
export const logAudit = async (user_id, table_name, action, record_id, details = "") => {
  try {
    const sql = `
      INSERT INTO audit_logs (user_id, table_name, action, record_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    await pool.query(sql, [user_id, table_name, action, record_id, details]);
    console.log(`🟢 Log ajouté : ${action} sur ${table_name} (id=${record_id})`);
  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement du log :", error);
  }
};
