// controllers/dashboard.controller.js
import { pool } from "../config/db.js";

/**
 * GET /api/dashboard/kpi
 * Dashboard principal – Version hybride optimale
 */
export const getMainKPI = async (req, res) => {
  try {
    // ⿡ Valeur totale du stock + coût mensuel
    const [stockValueRows] = await pool.query(`
      SELECT 
        ROUND(SUM(l.qty_kg * p.unit_price), 2) AS valeur_stock_total,
        ROUND(SUM(l.qty_kg * p.unit_price) * 0.025, 2) AS couts_possession_mensuels
      FROM lots l
      INNER JOIN products p ON p.id = l.product_id
      WHERE l.qty_kg > 0
    `);
    const valeur_stock_total = stockValueRows[0]?.valeur_stock_total || 0;
    const couts_possession_mensuels = stockValueRows[0]?.couts_possession_mensuels || 0;

    // ⿢ Produits en rupture de stock
    const [ruptureRows] = await pool.query(`
      SELECT 
        p.id, 
        p.name, 
        COALESCE(SUM(l.qty_kg), 0) as stock_actuel,
        p.min_stock_kg
      FROM products p
      LEFT JOIN lots l ON p.id = l.product_id
      GROUP BY p.id, p.name, p.min_stock_kg
      HAVING stock_actuel <= p.min_stock_kg
      LIMIT 3
    `);
    const produits_en_rupture = ruptureRows || [];

    // ⿣ Lots expirant dans les 7 prochains jours
    const [expRows] = await pool.query(`
      SELECT l.id, p.name AS produit, l.exp_date
      FROM lots l
      INNER JOIN products p ON p.id = l.product_id
      WHERE l.exp_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND l.qty_kg > 0
      ORDER BY l.exp_date ASC
    `);
    const lots_expirant_7j = expRows || [];

    // ⿤ Chiffre d'affaires du mois en cours
    const [caRows] = await pool.query(`
      SELECT ROUND(SUM(total_ttc), 2) AS chiffre_affaires_mensuel
      FROM invoices
      WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
        AND status = 'PAID'
    `);
    const chiffre_affaires_mensuel = caRows[0]?.chiffre_affaires_mensuel || 0;

    // ==========================
    // ✅ VERSION HYBRIDE OPTIMALE
    // ==========================
    const dashboard = {
      // 🎯 KPI RAPIDES - Pour cartes dashboard (accès direct)
      kpi_principaux: {
        valeur_stock_total,
        chiffre_affaires_mensuel,
        produits_rupture_imminente: produits_en_rupture.length,
        lots_expiration_7jours: lots_expirant_7j.length
      },
      
      // 📊 SECTIONS DÉTAILLÉES - Pour analyses approfondies
      sections: {
        // 💰 FINANCE
        finance: {
          valeur_stock_total,
          couts_possession_mensuels,
          chiffre_affaires_mensuel
        },
        
        // ⚠️ ALERTES
        alertes: {
          produits_en_rupture: produits_en_rupture.map(p => ({
            id: p.id,
            name: p.name,
            stock_actuel: p.stock_actuel,
            min_stock: p.min_stock_kg,
            statut: "rupture"
          })),
          lots_expirant_7j: lots_expirant_7j.map(l => ({
            id: l.id,
            produit: l.produit,
            exp_date: l.exp_date
          }))
        }
      },
      
      // 🔧 MÉTADONNÉES
      meta: {
        derniere_mise_a_jour: new Date().toISOString(),
        version: "2.0",
        generateur: "OceanStock KPI Engine"
      }
    };

    res.json({ ok: true, dashboard });

  } catch (error) {
    console.error("Erreur KPI:", error);
    res.status(500).json({ ok: false, error: "Erreur serveur", detail: String(error) });
  }
};