# 🌊 Ocean Stock — Système de Gestion de Stock

> Projet Personnel 
> Application web locale complète de gestion de stock

---

## Technologies utilisées

**Backend**
- Node.js + Express.js
- MySQL / MariaDB
- JWT (authentification)
- bcryptjs (hashage des mots de passe)
- Architecture MVC REST API

**Frontend**
- React.js + Vite
- Tailwind CSS
- Axios
- React Router
- Recharts (graphiques)
- Redux

---

##  Fonctionnalités principales

-  **Authentification JWT** — connexion sécurisée avec rôles (Admin / Employé)
- **Gestion des stocks** — produits, catégories, lots, mouvements
-  **Achats fournisseurs** — bons d'achat, réception automatique en stock
- **Ventes** — commandes, factures, paiements
- **Analytique** — graphiques de ventes, achats, stock
- **Alertes** — ruptures de stock, lots expirants
- **Gestion des utilisateurs** — CRUD complet (admin only)
- **Archivage** — logique style Odoo (archivage au lieu de suppression)

## Architecture

Ocean.Stock/
├── controllers/          # Logique métier
│   ├── analytics/        # Statistiques ventes, achats, stock
│   └── ...
├── middlewares/          # JWT auth middleware
├── routes/               # Routes API REST
├── config/               # Configuration DB
├── server.js             # Point d'entrée
└── oceanstock-frontend/  # Application React
    └── src/
        ├── pages/        # Pages de l'application
        ├── layouts/      # Layout principal
        └── hooks/        # Hooks personnalisés

### Prérequis
- Node.js v18+
- MySQL / MariaDB
- npm




## Aperçu

| Dashboard | Analytique | Bons d'achat |
|-----------|-----------|--------------|
| KPIs en temps réel | Graphiques Recharts | Drawer style Odoo |

---

## Auteur

**Mohamed Sebbar**  
Développeur Full stack 
[GitHub](https://github.com/Med-sebbar)
---
> Projet 2026
