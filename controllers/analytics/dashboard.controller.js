// controllers/analytics/dashboard.controller.js
import { pool } from "../../config/db.js";

/**
 * GET /api/analytics/dashboard
 * Rapport global combiné - Optimisé pour performance
 */
export const getGlobalAnalytics = async (req, res) => {
  try {
    // 🎯 EXÉCUTION PARALLÈLE pour meilleure performance
    const [ventes, achats, stock] = await Promise.allSettled([
      getVentesData(),
      getAchatsData(), 
      getStockData()
    ]);

    // ✅ STRUCTURE ROBUSTE avec fallback
    const globalReport = {
      ventes: ventes.status === 'fulfilled' ? ventes.value : { error: "Données ventes indisponibles" },
      achats: achats.status === 'fulfilled' ? achats.value : { error: "Données achats indisponibles" },
      stock: stock.status === 'fulfilled' ? stock.value : { error: "Données stock indisponibles" },
      meta: {
        date_generation: new Date().toISOString(),
        version: "2.0",
        generateur: "OceanStock Global Analytics",
        statut: "complet"
      }
    };

    res.json({ ok: true, globalReport });

  } catch (error) {
    console.error("Erreur getGlobalAnalytics:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Erreur lors de la génération du rapport global"
    });
  }
};

// 🎯 FONCTIONS SPÉCIALISÉES DIRECTES
const getVentesData = async () => {
  const [kpiRows] = await pool.query(`
    SELECT 
      ROUND(SUM(total_ttc), 2) AS ca_total,
      ROUND(SUM(CASE 
        WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) 
        THEN total_ttc ELSE 0 END), 2) AS ca_mois_cours
    FROM invoices
    WHERE status = 'PAID'
  `);
  return { kpi: kpiRows[0] };
};

const getAchatsData = async () => {
  const [kpiRows] = await pool.query(`
    SELECT 
      ROUND(SUM(total_amount), 2) AS total_achats,
      COUNT(*) AS total_commandes
    FROM purchase_orders
    WHERE status = 'RECEIVED'
  `);
  return { kpi: kpiRows[0] };
};

const getStockData = async () => {
  const [kpiRows] = await pool.query(`
    SELECT 
      ROUND(SUM(l.qty_kg * p.unit_price), 2) AS valeur_stock_total,
      ROUND(SUM(l.qty_kg), 2) AS volume_stock_kg
    FROM lots l
    INNER JOIN products p ON p.id = l.product_id
    WHERE l.qty_kg > 0
  `);
  return { kpi: kpiRows[0] };
};