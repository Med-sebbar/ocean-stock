// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import MainLayout from "./layouts/MainLayout";

// Pages existantes
import Dashboard  from "./pages/Dashboard";
import Products   from "./pages/Products";
import Login      from "./pages/Login";

// Pages complétées
import Fournisseurs from "./pages/Fournisseurs";
import Clients      from "./pages/Clients";
import Lots         from "./pages/Lots";
import Mouvements   from "./pages/Mouvements";
import Factures     from "./pages/Factures";
import Alertes      from "./pages/Alertes";
import Utilisateurs from "./pages/Utilisateurs";
import Parametres   from "./pages/Parametres";

// Nouvelles pages
import Commandes  from "./pages/Commandes";
import Achats     from "./pages/Achats";
import Paiements  from "./pages/Paiements";
import Categories from "./pages/Categories";
import Analytique from "./pages/Analytique";

// 🛡️ PROTECTION DE ROUTE
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsAuthenticated(!!user);
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<Login />} />

      {/* ROUTES PROTÉGÉES */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/"           element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"  element={<Dashboard />} />

        {/* STOCK */}
        <Route path="/produits"   element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/lots"       element={<Lots />} />
        <Route path="/mouvements" element={<Mouvements />} />

        {/* ACHATS */}
        <Route path="/fournisseurs" element={<Fournisseurs />} />
        <Route path="/achats"       element={<Achats />} />

        {/* VENTES */}
        <Route path="/clients"    element={<Clients />} />
        <Route path="/commandes"  element={<Commandes />} />
        <Route path="/factures"   element={<Factures />} />
        <Route path="/paiements"  element={<Paiements />} />

        {/* GÉNÉRAL */}
        <Route path="/alertes"    element={<Alertes />} />
        <Route path="/analytique" element={<Analytique />} />

        {/* ADMINISTRATION */}
        <Route path="/utilisateurs" element={<Utilisateurs />} />
        <Route path="/parametres"   element={<Parametres />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
