import { pool } from "../config/db.js"; 
import { logAudit } from "../middlewares/auditLogger.js";

/**
 * GET /api/movements
 * Liste tous les mouvements
 */
export const listMovements = async (req, res) => {
  const [rows] = await pool.query(`
    SELECT m.id, m.type, m.qty_kg, m.ref, m.created_at,
           p.name AS product, l.lot_code, l.exp_date
    FROM movements m
    LEFT JOIN products p ON p.id = m.product_id
    LEFT JOIN lots l ON l.id = m.lot_id
    ORDER BY m.created_at DESC
  `);
  res.json({ ok: true, items: rows });
};

/**
 * POST /api/movements/in
 * Ajouter un lot (entrée de stock)
 */
export const addLot = async (req, res) => {
  const { product_id, lot_code, qty_kg, exp_date, location } = req.body;
  if (!product_id || !lot_code || !qty_kg || !exp_date || !location) 
  {
    return res.status(400).json({ ok: false, error: "Champs requis manquants" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1️⃣ créer le lot
   const [lotResult] = await conn.query(
  `INSERT INTO lots (product_id, lot_code, qty_kg, exp_date, location)
   VALUES (?, ?, ?, ?, ?)`,
  [product_id, lot_code, qty_kg, exp_date, location]
);  
  console.log("lot ajouté avec succés :", lot_code)        


    // 2️⃣ créer le mouvement d’entrée
    await conn.query(
      `INSERT INTO movements (product_id, lot_id, type, qty_kg, ref, reason, uom)
       VALUES (?, ?, 'IN', ?, 'lot', 'Réception', 'KG')`,
      [product_id, lotResult.insertId, qty_kg]
    );


// ...
await logAudit(1, "lots", "INSERT", lotResult.insertId, `Ajout du lot ${lot_code}`);


    await conn.commit();
    res.status(201).json({ ok: true, lot_id: lotResult.insertId });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ ok: false, error: "Erreur DB", detail: String(e) });
  } finally {
    conn.release();
  }
};

/**
 * POST /api/movements/out
 * Sortie FEFO automatique (First Expired, First Out)
 */
export const fefoOut = async (req, res) => {
  const { product_id, qty_kg } = req.body;
  if (!product_id || !qty_kg) 
    
    {
    return res.status(400).json({ ok: false, error: "product_id et qty_kg requis" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1️⃣ récupérer les lots dosponibles, triés par date d’expiration (FEFO)
    const [lots] = await conn.query(
      `SELECT * FROM lots
       WHERE product_id = ? AND qty_kg > 0
       ORDER BY exp_date ASC`,
      [product_id]
    );
    if (lots.length === 0) {
        return res.status(404).json({ok: false, error:"Aucun lot disponible pour ce produit"});
    }
     //calcul du stock restant a sortir 
    let remaining = qty_kg;
    for (const lot of lots) {
      if (remaining <= 0) break;

      //on prend la plus petite quantité possible (lot ou reste a sortir)
      const take = Math.min(remaining, lot.qty_kg);

      // 2️⃣ décrémenter le lot
      await conn.query(
        `UPDATE lots SET qty_kg = qty_kg - ? WHERE id = ?`,
        [take, lot.id]
      );

      // 3️⃣ enregistrer le mouvement de sortie
      await conn.query(
        `INSERT INTO movements (product_id, lot_id, type, qty_kg, ref, reason, uom)
         VALUES (?, ?, 'OUT', ?, 'FEFO', 'Sortie automatique', 'KG')`,
        [product_id, lot.id, take]
      );

      await logAudit(1, "movement", "OUT", lot.id, `Sortie FEFO ${take} kg du lot ${lot.lot_code}`);


      remaining -= take;
    }

    await conn.commit();
      console.log("Sortie FEFO terminée pour le produit :", product_id);
    res.json({ ok: true, message: `Sortie FEFO effectuée`, restant: remaining > 0 ? `${remaining} kg non trouvés` : "Tout retiré" });
  } 
    catch (e) {
    await conn.rollback();
    res.status(500).json({ ok: false, error: "Erreur DB", detail: String(e) });
  } finally {
    conn.release();
  }
};


