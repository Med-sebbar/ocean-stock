// controllers/analytics/stock.controller.js
import { pool } from "../../config/db.js";

export const getStockStats = async (req, res) => {
  try {
    const { periode = '6' } = req.query;

    // KPI STOCK COMPLETS
    const [kpiRows] = await pool.query(`
      SELECT 
        -- VALEUR & VOLUME
        ROUND(SUM(l.qty_kg * p.unit_price), 2) AS valeur_stock_total,
        ROUND(SUM(l.qty_kg), 2) AS volume_stock_total_kg,
        COUNT(DISTINCT l.product_id) AS produits_differents,
        
        -- PERFORMANCE STOCK
        ROUND((
          SELECT ABS(SUM(m.qty_kg)) 
          FROM movements m 
          WHERE m.type = 'OUT' 
          AND m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ) / NULLIF(SUM(l.qty_kg), 0) * 30, 1) AS jours_couverture,
        
        -- ROTATION REELLE
        ROUND((
          SELECT ABS(SUM(m.qty_kg)) 
          FROM movements m 
          WHERE m.type = 'OUT' 
          AND m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ) / NULLIF(SUM(l.qty_kg), 0) * 12, 1) AS taux_rotation_annuel,

        -- ALERTES STOCK
        COUNT(DISTINCT CASE 
          WHEN l.qty_kg <= p.min_stock_kg AND l.qty_kg > 0 
          THEN p.id END) AS produits_sous_stock_min,
          
        COUNT(DISTINCT CASE 
          WHEN l.exp_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
          THEN l.id END) AS lots_expiration_7j

      FROM lots l
      INNER JOIN products p ON p.id = l.product_id
      WHERE l.qty_kg > 0
    `);
    
    const kpi = kpiRows[0];

    // PRODUITS FAIBLE ROTATION
    const [lowRotationRows] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(SUM(l.qty_kg), 0) AS stock_actuel,
        ROUND((
          SELECT ABS(SUM(m.qty_kg)) 
          FROM movements m 
          WHERE m.product_id = p.id 
          AND m.type = 'OUT'
          AND m.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
        ) / NULLIF(SUM(l.qty_kg), 0) * 4, 1) AS rotation_trimestrielle
      FROM products p
      LEFT JOIN lots l ON p.id = l.product_id AND l.qty_kg > 0
      GROUP BY p.id, p.name, p.sku
      HAVING rotation_trimestrielle < 1.0 OR rotation_trimestrielle IS NULL
      ORDER BY rotation_trimestrielle ASC
      LIMIT 10
    `);

    // ACTIVITE ENTREPOT
    const [activiteRows] = await pool.query(`
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS total_mouvements,
        SUM(CASE WHEN type = 'IN' THEN 1 ELSE 0 END) AS entrees,
        SUM(CASE WHEN type = 'OUT' THEN 1 ELSE 0 END) AS sorties
      FROM movements
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    // PRODUITS RUPTURE IMMINENTE
    const [ruptureRows] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.sku,
        COALESCE(SUM(l.qty_kg), 0) AS stock_actuel,
        p.min_stock_kg AS stock_minimum
      FROM products p
      LEFT JOIN lots l ON p.id = l.product_id
      GROUP BY p.id, p.name, p.sku, p.min_stock_kg
      HAVING stock_actuel <= p.min_stock_kg
      ORDER BY stock_actuel ASC
      LIMIT 10
    `);

    // STRUCTURE PROFESSIONNELLE
    const stats = {
      kpi_principaux: {
        valeur_stock_total: kpi.valeur_stock_total,
        volume_stock_total_kg: kpi.volume_stock_total_kg,
        jours_couverture: kpi.jours_couverture,
        taux_rotation_annuel: kpi.taux_rotation_annuel,
        produits_sous_stock_min: kpi.produits_sous_stock_min,
        lots_expiration_7j: kpi.lots_expiration_7j
      },
      analyses: {
        produits_faible_rotation: lowRotationRows,
        produits_rupture_imminente: ruptureRows,
        activite_entrepot: activiteRows
      },
      meta: {
        periode_analyse: `${periode} mois`,
        derniere_mise_a_jour: new Date().toISOString(),
        version: "2.0"
      }
    };

    res.json({ ok: true, stats });

  } catch (error) {
    console.error("Erreur getStockStats:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Erreur lors du calcul des statistiques stock",
      detail: process.env.NODE_ENV === 'development' ? String(error) : undefined
    });
  }
};