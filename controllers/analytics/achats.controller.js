// controllers/analytics/achats.controller.js
import { pool } from "../../config/db.js";

export const getAchatsStats = async (req, res) => {
  try {
    const { periode = '12' } = req.query;

    // KPI ACHATS
    const [kpiRows] = await pool.query(`
      SELECT 
        ROUND(SUM(total_amount), 2) AS total_achats,
        ROUND(SUM(CASE 
          WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) 
          THEN total_amount ELSE 0 END), 2) AS achats_mois_cours,
        ROUND(SUM(CASE 
          WHEN MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
          THEN total_amount ELSE 0 END), 2) AS achats_mois_precedent,
        COUNT(*) AS total_commandes,
        ROUND(AVG(total_amount), 2) AS montant_moyen_commande,
        ROUND(MAX(total_amount), 2) AS plus_grosse_commande,
        COUNT(DISTINCT supplier_id) AS fournisseurs_actifs
      FROM purchase_orders
      WHERE status = 'RECEIVED'
    `);

    const kpi = kpiRows[0];

    const taux_croissance = kpi.achats_mois_precedent > 0 
      ? Number((((kpi.achats_mois_cours - kpi.achats_mois_precedent) / kpi.achats_mois_precedent) * 100).toFixed(1))
      : 0;

    // TOP 10 FOURNISSEURS
    const [fournisseursRows] = await pool.query(`
      SELECT 
        s.id,
        s.name AS fournisseur,
        s.email,
        COUNT(p.id) AS nb_commandes,
        ROUND(SUM(p.total_amount), 2) AS total_achats,
        ROUND(AVG(p.total_amount), 2) AS commande_moyenne,
        MAX(p.created_at) AS derniere_commande
      FROM purchase_orders p
      INNER JOIN suppliers s ON s.id = p.supplier_id
      WHERE p.status = 'RECEIVED'
      GROUP BY s.id, s.name, s.email
      ORDER BY total_achats DESC
      LIMIT 10
    `);

    // HISTORIQUE 12 MOIS
    const [monthlyRows] = await pool.query(`
      WITH mois_annee AS (
        SELECT DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL n MONTH), '%Y-%m') AS mois
        FROM (SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 
              UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
              UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11) mois
      )
      SELECT 
        ma.mois,
        COALESCE(ROUND(SUM(p.total_amount), 2), 0) AS montant_courant,
        COALESCE((
          SELECT ROUND(SUM(p2.total_amount), 2)
          FROM purchase_orders p2
          WHERE DATE_FORMAT(p2.created_at, '%Y-%m') = DATE_FORMAT(
            DATE_SUB(STR_TO_DATE(CONCAT(ma.mois, '-01'), '%Y-%m-%d'), INTERVAL 1 YEAR
          ), '%Y-%m')
          AND p2.status = 'RECEIVED'
        ), 0) AS montant_annee_precedente
      FROM mois_annee ma
      LEFT JOIN purchase_orders p ON DATE_FORMAT(p.created_at, '%Y-%m') = ma.mois AND p.status = 'RECEIVED'
      GROUP BY ma.mois
      ORDER BY ma.mois ASC
      LIMIT 12
    `);

    const stats = {
      kpi_principaux: {
        total_achats: kpi.total_achats,
        achats_mois_cours: kpi.achats_mois_cours,
        taux_croissance,
        commande_moyenne: kpi.montant_moyen_commande,
        fournisseurs_actifs: kpi.fournisseurs_actifs
      },
      analyses: {
        top_fournisseurs: fournisseursRows,
        performance_mensuelle: monthlyRows
      },
      meta: {
        periode_analyse: `${periode} mois`,
        derniere_mise_a_jour: new Date().toISOString(),
        version: "2.0"
      }
    };

    res.json({ ok: true, stats });

  } catch (error) {
    console.error("Erreur getAchatsStats:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Erreur lors du calcul des statistiques achats",
      detail: String(error)
    });
  }
};
