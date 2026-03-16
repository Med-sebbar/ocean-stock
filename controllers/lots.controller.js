// controllers/lots.controller.js
import { pool } from "../config/db.js";
import { logAudit } from "../middlewares/auditLogger.js";

/**
 * POST /api/lots
 * Créer un lot manuellement
 */
export const createLot = async (req, res) => {
  try {
    const { product_id, lot_code, qty_kg, exp_date, location } = req.body;

    const [result] = await pool.query(
      "INSERT INTO lots (product_id, lot_code, qty_kg, exp_date, location) VALUES (?, ?, ?, ?, ?)",
      [product_id, lot_code || null, qty_kg, exp_date, location]
    );

    await logAudit(1, "lots", "INSERT", result.insertId, `Ajout du lot pour produit ${product_id}`);

    res.json({ ok: true, message: "Lot ajouté avec succès", lot_id: result.insertId });
  } catch (error) {
    console.error("Erreur createLot:", error);
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(error) });
  }
};

/**
 * GET /api/lots
 * Liste tous les lots avec jointure produit
 */
export const listLots = async (req, res) => {
  try {
    const showAll = req.query.all === "1";
    const whereClause = showAll ? "" : "WHERE (l.archived = 0 OR l.archived IS NULL)";

    const [rows] = await pool.query(`
      SELECT 
        l.id, 
        l.product_id, 
        p.name AS product, 
        l.lot_code, 
        l.qty_kg, 
        l.exp_date, 
        l.location,
        l.archived
      FROM lots l
      LEFT JOIN products p ON p.id = l.product_id
      ${whereClause}
      ORDER BY l.exp_date ASC
    `);
    res.json({ ok: true, lots: rows });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Erreur lors de la récupération des lots", detail: String(error) });
  }
};

/**
 * PUT /api/lots/:id
 * Modifier emplacement et/ou date expiration uniquement
 * La quantité ne se modifie pas directement → passer par un mouvement
 */
export const updateLot = async (req, res) => {
  const { id } = req.params;
  const { location, exp_date, lot_code } = req.body;

  try {
    const [existing] = await pool.query("SELECT * FROM lots WHERE id = ?", [id]);
    if (existing.length === 0)
      return res.status(404).json({ ok: false, error: "Lot introuvable" });

    await pool.query(
      `UPDATE lots 
       SET location = ?, exp_date = ?, lot_code = ?
       WHERE id = ?`,
      [
        location  || existing[0].location,
        exp_date  || existing[0].exp_date,
        lot_code  || existing[0].lot_code,
        id,
      ]
    );

    await logAudit(1, "lots", "UPDATE", id, `Modification lot ${id}`);

    res.json({ ok: true, message: "Lot mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur updateLot:", error);
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(error) });
  }
};

/**
 * DELETE /api/lots/:id
 * Logique Odoo :
 * - Lot sans mouvements + qty = 0 → suppression directe (erreur de saisie)
 * - Lot avec mouvements + qty = 0 → archivage uniquement
 * - Lot avec qty > 0 → bloqué
 */
export const deleteLot = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();

  try {
    const [existing] = await conn.query("SELECT * FROM lots WHERE id = ?", [id]);
    if (existing.length === 0)
      return res.status(404).json({ ok: false, error: "Lot introuvable" });

    const lot = existing[0];

    // ❌ Bloqué si stock > 0
    if (parseFloat(lot.qty_kg) > 0) {
      return res.status(400).json({
        ok: false,
        error: `Impossible — il reste ${parseFloat(lot.qty_kg).toFixed(2)} kg en stock. Faites d'abord une sortie de stock.`
      });
    }

    // Vérifier si des mouvements existent pour ce lot
    const [movements] = await conn.query(
      "SELECT COUNT(*) AS total FROM movements WHERE lot_id = ?", [id]
    );
    const hasMovements = movements[0].total > 0;

    await conn.beginTransaction();

    if (hasMovements) {
      // Lot utilisé → archivage pour garder la traçabilité
      await conn.query("UPDATE lots SET archived = 1 WHERE id = ?", [id]);
      await conn.commit();
      await logAudit(1, "lots", "ARCHIVE", id, `Archivage lot ${id}`);
      return res.json({
        ok: true,
        archived: true,
        message: "Lot archivé — l'historique des mouvements est conservé ✓"
      });
    } else {
      // Lot sans mouvements → suppression directe (créé par erreur)
      await conn.query("DELETE FROM lots WHERE id = ?", [id]);
      await conn.commit();
      await logAudit(1, "lots", "DELETE", id, `Suppression lot ${id} (aucun mouvement)`);
      return res.json({
        ok: true,
        archived: false,
        message: "Lot supprimé avec succès ✓"
      });
    }
  } catch (error) {
    await conn.rollback();
    console.error("Erreur deleteLot:", error);
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(error) });
  } finally {
    conn.release();
  }
};
