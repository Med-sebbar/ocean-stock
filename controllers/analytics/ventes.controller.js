// controllers/analytics/ventes.controller.js
import { pool } from "../../config/db.js";

export const getVentesStats = async (req, res) => {
  try {
    const { periode = '12' } = req.query;

    // KPI VENTES
    const [kpiRows] = await pool.query(`
      SELECT 
        ROUND(SUM(total_ttc), 2) AS ca_total,
        ROUND(SUM(CASE 
          WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) 
          THEN total_ttc ELSE 0 END), 2) AS ca_mois_cours,
        ROUND(SUM(CASE 
          WHEN MONTH(created_at) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
          THEN total_ttc ELSE 0 END), 2) AS ca_mois_precedent,
        COUNT(*) AS total_factures,
        ROUND(AVG(total_ttc), 2) AS panier_moyen,
        ROUND(MAX(total_ttc), 2) AS plus_grosse_vente,
        ROUND((
          SELECT SUM(total_ttc) 
          FROM invoices 
          WHERE status = 'PAID' 
          AND created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        ), 2) AS ca_30_derniers_jours
      FROM invoices
      WHERE status = 'PAID'
    `);

    const kpi = kpiRows[0];

    const taux_croissance = kpi.ca_mois_precedent > 0 
      ? Number((((kpi.ca_mois_cours - kpi.ca_mois_precedent) / kpi.ca_mois_precedent) * 100).toFixed(1))
      : 0;

    // TOP 10 CLIENTS
    const [clientsRows] = await pool.query(`
      SELECT 
        c.id,
        c.name AS client,
        c.email,
        ROUND(SUM(i.total_ttc), 2) AS total_achats,
        COUNT(i.id) AS nb_commandes,
        ROUND(AVG(i.total_ttc), 2) AS panier_moyen,
        MAX(i.created_at) AS derniere_commande,
        ROUND((
          SELECT SUM(i2.total_ttc)
          FROM invoices i2 
          INNER JOIN orders o2 ON o2.id = i2.order_id
          WHERE o2.customer_id = c.id
          AND i2.created_at BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY) 
          AND DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
          AND i2.status = 'PAID'
        ), 2) AS ca_periode_precedente
      FROM invoices i
      INNER JOIN orders o ON o.id = i.order_id
      INNER JOIN customers c ON c.id = o.customer_id
      WHERE i.status = 'PAID'
      GROUP BY c.id, c.name, c.email
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
        COALESCE(ROUND(SUM(i.total_ttc), 2), 0) AS montant_courant,
        COALESCE((
          SELECT ROUND(SUM(i2.total_ttc), 2)
          FROM invoices i2
          WHERE DATE_FORMAT(i2.created_at, '%Y-%m') = DATE_FORMAT(
            DATE_SUB(STR_TO_DATE(CONCAT(ma.mois, '-01'), '%Y-%m-%d'), INTERVAL 1 YEAR
          ), '%Y-%m')
          AND i2.status = 'PAID'
        ), 0) AS montant_annee_precedente
      FROM mois_annee ma
      LEFT JOIN invoices i ON DATE_FORMAT(i.created_at, '%Y-%m') = ma.mois AND i.status = 'PAID'
      GROUP BY ma.mois
      ORDER BY ma.mois ASC
      LIMIT 12
    `);

    // PERFORMANCE MENSUELLE
    const [performanceRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(i.created_at, '%Y-%m') AS mois,
        COUNT(*) AS nb_ventes,
        ROUND(SUM(i.total_ttc), 2) AS ca_total,
        ROUND(AVG(i.total_ttc), 2) AS panier_moyen,
        ROUND(MAX(i.total_ttc), 2) AS plus_grosse_vente,
        COUNT(DISTINCT o.customer_id) AS clients_uniques
      FROM invoices i
      INNER JOIN orders o ON o.id = i.order_id
      WHERE i.status = 'PAID'
        AND i.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL ? MONTH)
      GROUP BY mois
      ORDER BY mois DESC
      LIMIT 12
    `, [periode]);

    const stats = {
      kpi_principaux: {
        ca_total: kpi.ca_total,
        ca_mois_cours: kpi.ca_mois_cours,
        ca_30_derniers_jours: kpi.ca_30_derniers_jours,
        taux_croissance,
        panier_moyen: kpi.panier_moyen,
        total_factures: kpi.total_factures
      },
      analyses: {
        performance_mensuelle: performanceRows,
        top_clients: clientsRows.map(client => ({
          ...client,
          tendance: client.ca_periode_precedente > 0 
            ? Number((((client.total_achats - client.ca_periode_precedente) / client.ca_periode_precedente) * 100).toFixed(1))
            : null
        }))
      },
      graphiques: {
        historique_ventes: monthlyRows,
        performance_par_mois: performanceRows
      },
      meta: {
        periode_analyse: `${periode} mois`,
        derniere_mise_a_jour: new Date().toISOString(),
        version: "2.0"
      }
    };

    res.json({ ok: true, stats });

  } catch (error) {
    console.error("Erreur getVentesStats:", error);
    res.status(500).json({ 
      ok: false, 
      error: "Erreur lors du calcul des statistiques ventes",
      detail: String(error)
    });
  }
};
