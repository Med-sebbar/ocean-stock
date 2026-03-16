// src/layouts/MainLayout.jsx
import { Link, useLocation, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  HomeIcon, CubeIcon, InboxStackIcon, ArrowsRightLeftIcon,
  ExclamationTriangleIcon, UsersIcon, UserCircleIcon, UserGroupIcon,
  DocumentTextIcon, Cog6ToothIcon, ArrowRightStartOnRectangleIcon,
  ShoppingCartIcon, TruckIcon, BanknotesIcon, TagIcon, ChartBarIcon,
} from "@heroicons/react/24/outline";

export default function MainLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // VÉRIFICATION CONNEXION
  const user  = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");
  if (!user || !token) return <Navigate to="/login" />;

  const isAdmin = user.role === "admin";

  // DÉCONNEXION
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const userName = user?.username || "Utilisateur";
  const userRole = isAdmin ? "Administrateur" : "Employé";

  const getPageTitle = () => {
    const titles = {
      "/":             "Tableau de bord",
      "/dashboard":    "",
      "/produits":     "Produits",
      "/lots":         "Lots",
      "/mouvements":   "Mouvements",
      "/fournisseurs": "Fournisseurs",
      "/clients":      "Clients",
      "/commandes":    "Commandes",
      "/factures":     "Factures",
      "/paiements":    "Paiements",
      "/achats":       "Achats fournisseurs",
      "/categories":   "Catégories",
      "/alertes":      "Alertes",
      "/analytique":   "Analytique",
      "/utilisateurs": "Utilisateurs",
      "/parametres":   "Paramètres",
    };
    return titles[location.pathname] || "";
  };

  const SidebarLink = ({ to, icon: Icon, label }) => (
    <li>
      <Link to={to}
        className={
          "flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm " +
          (location.pathname === to ? "bg-[#163A5B]" : "hover:bg-[#163A5B]")
        }>
        <Icon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </Link>
    </li>
  );

  const SidebarSection = ({ label }) => (
    <li className="pt-4 pb-1 px-4">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
    </li>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ── SIDEBAR ── */}
      <div className="w-64 bg-[#0F2D4A] text-white min-h-screen flex flex-col shrink-0">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-[#163A5B]">
          <h2 className="text-lg font-bold tracking-wide">🌊 Ocean Stock</h2>
          <p className="text-xs text-gray-400 mt-0.5">Gestion de stock</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          <ul className="space-y-0.5">

            {/* GÉNÉRAL */}
            <SidebarSection label="Général" />
            <li>
              <Link to="/dashboard"
                className={
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition text-sm " +
                  (location.pathname === "/" || location.pathname === "/dashboard"
                    ? "bg-[#163A5B]" : "hover:bg-[#163A5B]")
                }>
                <HomeIcon className="w-4 h-4 shrink-0" />
                <span>Tableau de bord</span>
              </Link>
            </li>
            {/* Analytique — admin seulement */}
            {isAdmin && (
              <SidebarLink to="/analytique" icon={ChartBarIcon} label="Analytique" />
            )}
            <SidebarLink to="/alertes" icon={ExclamationTriangleIcon} label="Alertes" />

            {/* STOCK */}
            <SidebarSection label="Stock" />
            <SidebarLink to="/produits"   icon={CubeIcon}            label="Produits" />
            <SidebarLink to="/categories" icon={TagIcon}             label="Catégories" />
            <SidebarLink to="/lots"       icon={InboxStackIcon}      label="Lots" />
            <SidebarLink to="/mouvements" icon={ArrowsRightLeftIcon} label="Mouvements" />

            {/* ACHATS */}
            <SidebarSection label="Achats" />
            <SidebarLink to="/fournisseurs" icon={UserCircleIcon} label="Fournisseurs" />
            <SidebarLink to="/achats"       icon={TruckIcon}      label="Bons d'achat" />

            {/* VENTES */}
            <SidebarSection label="Ventes" />
            <SidebarLink to="/clients"   icon={UsersIcon}        label="Clients" />
            <SidebarLink to="/commandes" icon={ShoppingCartIcon} label="Commandes" />
            <SidebarLink to="/factures"  icon={DocumentTextIcon} label="Factures" />
            <SidebarLink to="/paiements" icon={BanknotesIcon}    label="Paiements" />

            {/* ADMINISTRATION — admin seulement */}
            {isAdmin && (
              <>
                <SidebarSection label="Administration" />
                <SidebarLink to="/utilisateurs" icon={UserGroupIcon} label="Utilisateurs" />
                <SidebarLink to="/parametres"   icon={Cog6ToothIcon} label="Paramètres" />
              </>
            )}

          </ul>
        </nav>

        {/* BAS SIDEBAR */}
        <div className="px-3 py-4 border-t border-[#163A5B]">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-red-300 hover:bg-red-900/20 hover:text-white rounded-lg transition text-sm">
            <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
          <div className="mt-3 px-4">
            <p className="text-sm font-medium text-gray-300">{userName}</p>
            <p className="text-xs text-gray-500">{userRole}</p>
          </div>
        </div>
      </div>

      {/* ── ZONE CENTRALE ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold text-gray-700">{getPageTitle()}</h1>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{userRole}</p>
            </div>

            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="font-medium text-gray-900 text-sm">{userName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                      isAdmin ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {userRole}
                    </span>
                  </div>
                  <ul className="py-1">
                    {isAdmin && (
                      <li onClick={() => { navigate("/parametres"); setMenuOpen(false); }}
                        className="px-4 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                        Paramètres
                      </li>
                    )}
                    <li onClick={handleLogout}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer flex items-center gap-2">
                      <ArrowRightStartOnRectangleIcon className="w-4 h-4" />
                      Déconnexion
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENU PAGE */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>

      </div>
    </div>
  );
}
