// controllers/export/pdf.controller.js
import PDFDocument from "pdfkit";
import { pool } from "../../config/db.js";

/**
 * GET /api/export/rapport
 * Génère un PDF professionnel du rapport analytique global
 */
export const exportRapportPDF = async (req, res) => {
  try {
    // 🎯 RÉCUPÉRATION DIRECTE DES DONNÉES (optimisé)
    const [ventes, achats, stock] = await Promise.all([
      getVentesData(),
      getAchatsData(),
      getStockData()
    ]);

    // Crée le document PDF
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Rapport Analytique OceanStock',
        Author: 'OceanStock Analytics Engine',
        CreationDate: new Date()
      }
    });

    const filename = `Rapport_Analytique_OceanStock_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    doc.pipe(res);

    // 🎨 EN-TÊTE PROFESSIONNEL
    doc.fillColor("#1B4B72")
       .fontSize(20)
       .font('Helvetica-Bold')
       .text("RAPPORT ANALYTIQUE GLOBAL", { align: "center" });
    
    doc.moveDown(0.3);
    doc.fillColor("#666")
       .fontSize(10)
       .font('Helvetica')
       .text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, { align: "center" });
    
    doc.moveDown(1.5);

    // 📊 SECTION VENTES
    doc.addPage()
       .fillColor("#0B5345")
       .fontSize(16)
       .font('Helvetica-Bold')
       .text("📊 PERFORMANCE COMMERCIALE", { underline: true });
    
    doc.moveDown(0.5);
    doc.fillColor("black")
       .fontSize(11)
       .font('Helvetica')
       .text(`Chiffre d'affaires total: ${formatMontant(ventes.ca_total)}`)
       .text(`CA mensuel: ${formatMontant(ventes.ca_mois_cours)}`)
       .text(`Panier moyen: ${formatMontant(ventes.panier_moyen)}`)
       .text(`Total factures: ${ventes.total_factures}`);

    // 📈 TABLEAU TOP CLIENTS
    if (ventes.top_clients && ventes.top_clients.length > 0) {
      doc.moveDown(0.5)
         .font('Helvetica-Bold')
         .text("TOP 5 CLIENTS:");
      
      ventes.top_clients.forEach((client, index) => {
        doc.font('Helvetica')
           .text(`${index + 1}. ${client.client} - ${formatMontant(client.total_achats)}`);
      });
    }

    // 📦 SECTION ACHATS
    doc.addPage()
       .fillColor("#154360")
       .fontSize(16)
       .font('Helvetica-Bold')
       .text("📦 PERFORMANCE ACHATS", { underline: true });
    
    doc.moveDown(0.5);
    doc.fillColor("black")
       .fontSize(11)
       .text(`Total achats: ${formatMontant(achats.total_achats)}`)
       .text(`Achats mensuels: ${formatMontant(achats.achats_mois_cours)}`)
       .text(`Commande moyenne: ${formatMontant(achats.commande_moyenne)}`)
       .text(`Fournisseurs actifs: ${achats.fournisseurs_actifs}`);

    // 🏭 SECTION STOCK
    doc.addPage()
       .fillColor("#633974")
       .fontSize(16)
       .font('Helvetica-Bold')
       .text("🏭 GESTION DE STOCK", { underline: true });
    
    doc.moveDown(0.5);
    doc.fillColor("black")
       .fontSize(11)
       .text(`Valeur stock: ${formatMontant(stock.valeur_stock_total)}`)
       .text(`Volume stock: ${stock.volume_stock_total_kg} kg`)
       .text(`Jours couverture: ${stock.jours_couverture} jours`)
       .text(`Rotation annuelle: ${stock.taux_rotation_annuel} x`)
       .text(`Alertes actives: ${stock.produits_sous_stock_min + stock.lots_expiration_7j}`);

    // 📋 PIED DE PAGE
    doc.addPage()
       .fillColor("#999")
       .fontSize(9)
       .text("Rapport généré automatiquement par OceanStock Analytics Engine", { align: "center" })
       .text(`© ${new Date().getFullYear()} - Document confidentiel`, { align: "center" });

    doc.end();

  } catch (error) {
    console.error("Erreur export PDF:", error);
    
    // 🛡️ GESTION D'ERREUR PROFESSIONNELLE
    if (!res.headersSent) {
      res.status(500).json({ 
        ok: false, 
        error: "Erreur lors de la génération du rapport PDF",
        reference: `ERR-${Date.now()}`
      });
    }
  }
};

// 🎯 FONCTIONS DE DONNÉES OPTIMISÉES
const getVentesData = async () => {
  const [kpiRows] = await pool.query(`
    SELECT 
      ROUND(SUM(total_ttc), 2) AS ca_total,
      ROUND(SUM(CASE 
        WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) 
        THEN total_ttc ELSE 0 END), 2) AS ca_mois_cours,
      COUNT(*) AS total_factures,
      ROUND(AVG(total_ttc), 2) AS panier_moyen
    FROM invoices
    WHERE status = 'PAID'
  `);

  const [clientsRows] = await pool.query(`
    SELECT c.name AS client, ROUND(SUM(i.total_ttc), 2) AS total_achats
    FROM invoices i
    INNER JOIN orders o ON o.id = i.order_id
    INNER JOIN customers c ON c.id = o.customer_id
    WHERE i.status = 'PAID'
    GROUP BY c.id
    ORDER BY total_achats DESC
    LIMIT 5
  `);

  return { 
    ...kpiRows[0], 
    top_clients: clientsRows 
  };
};

const getAchatsData = async () => {
  const [kpiRows] = await pool.query(`
    SELECT 
      ROUND(SUM(total_amount), 2) AS total_achats,
      ROUND(SUM(CASE 
        WHEN MONTH(created_at) = MONTH(CURRENT_DATE()) 
        THEN total_amount ELSE 0 END), 2) AS achats_mois_cours,
      COUNT(*) AS total_commandes,
      ROUND(AVG(total_amount), 2) AS commande_moyenne,
      COUNT(DISTINCT supplier_id) AS fournisseurs_actifs
    FROM purchase_orders
    WHERE status = 'RECEIVED'
  `);

  return kpiRows[0];
};

const getStockData = async () => {
  const [kpiRows] = await pool.query(`
    SELECT 
      ROUND(SUM(l.qty_kg * p.unit_price), 2) AS valeur_stock_total,
      ROUND(SUM(l.qty_kg), 2) AS volume_stock_total_kg,
      ROUND((
        SELECT ABS(SUM(m.qty_kg)) 
        FROM movements m 
        WHERE m.type = 'OUT' 
        AND m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ) / NULLIF(SUM(l.qty_kg), 0) * 30, 1) AS jours_couverture,
      ROUND((
        SELECT ABS(SUM(m.qty_kg)) 
        FROM movements m 
        WHERE m.type = 'OUT' 
        AND m.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ) / NULLIF(SUM(l.qty_kg), 0) * 12, 1) AS taux_rotation_annuel,
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

  return kpiRows[0];
};

// 🎨 FORMATAGE PROFESSIONNEL
const formatMontant = (montant) => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 2 
  }).format(montant || 0);
};