// middlewares/authMiddleware.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "oceanstock_secret_2025";

/**
 * Middleware — vérifie le token JWT
 * Utilisé sur toutes les routes protégées
 */
export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Non autorisé — token manquant" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Token invalide ou expiré" });
  }
};

/**
 * Middleware — vérifie que l'utilisateur est admin
 * À utiliser après protect
 */
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ ok: false, error: "Accès refusé — réservé aux administrateurs" });
  }
  next();
};
