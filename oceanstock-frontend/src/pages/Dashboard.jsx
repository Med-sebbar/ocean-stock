// src/pages/Dashboard.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CubeIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from "recharts";

const API_DASHBOARD = "http://localhost:4000/api/analytics/dashboard";
const API_STOCK     = "http://localhost:4000/api/analytics/stock";
const API_VENTES    = "http://localhost:4000/api/analytics/ventes";
const API_MOVEMENTS = "http://localhost:4000/api/movements";

const COLORS = ["#3B82F6", "#FB923C", "#22C55E", "#A855F7", "#EF4444", "#06B6D4"];

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [stock, setStock]         = useState(null);
  const [ventes, setVentes]       = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading]     = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [d, s, v, m] = await Promise.allSettled([
      axios.get(API_DASHBOARD),
      axios.get(API_STOCK),
      axios.get(API_VENTES),
      axios.get(API_MOVEMENTS),
    ]);
    if (d.status === "fulfilled") setDashboard(d.value.data.globalReport);
    if (s.status === "fulfilled") setStock(s.value.data.stats);
    if (v.status === "fulfilled") setVentes(v.value.data.stats);
    if (m.status === "fulfilled") setMovements(m.value.data.items || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-96">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  // KPI depuis dashboard global
  const kpiVentes = dashboard?.ventes?.kpi || {};
  const kpiAchats = dashboard?.achats?.kpi || {};
  const kpiStock  = dashboard?.stock?.kpi  || {};

  // Graphique ventes mensuelles
  const ventesGraph = ventes?.graphiques?.historique_ventes || [];

  // Graphique stock par catégorie (top produits)
  const stockProduits = stock?.analyses?.produits_rupture_imminente || [];

  // Alertes — lots expirants + ruptures
  const ruptures   = stock?.analyses?.produits_rupture_imminente || [];
  const nbExpir7j  = stock?.kpi_principaux?.lots_expiration_7j || 0;

  // Mouvements ce mois
  const now = new Date();
  const mvtMois = movements.filter(m => {
    const d = new Date(m.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalEntrees = mvtMois.filter(m => m.type === "IN").reduce((a, m) => a + parseFloat(m.qty_kg || 0), 0);
  const totalSorties = mvtMois.filter(m => m.type === "OUT").reduce((a, m) => a + parseFloat(m.qty_kg || 0), 0);

  // Activité entrepôt pour graphique
  const activite = stock?.analyses?.activite_entrepot || [];

  // Pie chart stock par produit (top 5)
  const topProduits = (stock?.analyses?.produits_faible_rotation || [])
    .slice(0, 5)
    .map(p => ({ name: p.name, value: parseFloat(p.stock_actuel || 0) }))
    .filter(p => p.value > 0);

  const fmt = (val) => `${parseFloat(val || 0).toFixed(2)} $`;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <button onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
          <ArrowPathIcon className="w-4 h-4" /> Actualiser
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-500">Valeur du stock</h3>
            <CubeIcon className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-semibold text-gray-900">{fmt(kpiStock.valeur_stock_total)}</p>
          <p className="text-xs text-gray-400 mt-1">{kpiStock.volume_stock_kg || 0} kg en stock</p>
        </div>

        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-500">Produits en rupture</h3>
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
          </div>
          <p className={`text-3xl font-semibold ${ruptures.length > 0 ? "text-red-600" : "text-gray-400"}`}>
            {ruptures.length} produit{ruptures.length !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-400 mt-1">Sous le stock minimum</p>
        </div>

        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-500">Lots expirant ≤ 7j</h3>
            <ClockIcon className="w-5 h-5 text-orange-400" />
          </div>
          <p className={`text-3xl font-semibold ${nbExpir7j > 0 ? "text-orange-500" : "text-gray-400"}`}>
            {nbExpir7j} lot{nbExpir7j !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-400 mt-1">À traiter en priorité</p>
        </div>

        <div className="bg-white shadow-sm border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm text-gray-500">CA mensuel (factures)</h3>
            <BanknotesIcon className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-semibold text-green-600">{fmt(kpiVentes.ca_mois_cours)}</p>
          <p className="text-xs text-gray-400 mt-1">Total : {fmt(kpiVentes.ca_total)}</p>
        </div>
      </div>

      {/* GRAPHIQUES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ventes mensuelles */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-gray-700 font-semibold mb-4">CA mensuel (12 mois)</h3>
          {ventesGraph.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={ventesGraph}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => `${val} $`} />
                <Bar dataKey="montant_courant" name="CA" fill="#3B82F6" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Aucune facture payée pour le moment
            </div>
          )}
        </div>

        {/* Activité entrepôt */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-gray-700 font-semibold mb-4">Activité entrepôt (30j)</h3>
          {activite.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={[...activite].reverse()}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="entrees" name="Entrées" fill="#22C55E" radius={[4,4,0,0]} />
                <Bar dataKey="sorties" name="Sorties" fill="#EF4444" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              Aucun mouvement ces 30 derniers jours
            </div>
          )}
        </div>
      </div>

      {/* ALERTES + MOUVEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Alertes ruptures */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-gray-700 font-semibold mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
            Alertes stock
          </h3>
          {ruptures.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              ✅ Aucune rupture imminente
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-500 text-left">
                  <th className="pb-2">Produit</th>
                  <th className="pb-2">Stock actuel</th>
                  <th className="pb-2">Stock min</th>
                </tr>
              </thead>
              <tbody>
                {ruptures.slice(0, 5).map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-red-50">
                    <td className="py-2 font-medium text-gray-800">{p.name}</td>
                    <td className="py-2 text-red-600 font-semibold">{parseFloat(p.stock_actuel).toFixed(1)} kg</td>
                    <td className="py-2 text-gray-500">{parseFloat(p.stock_minimum).toFixed(1)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {nbExpir7j > 0 && (
            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-sm text-orange-700">
              <ClockIcon className="w-4 h-4 shrink-0" />
              <span><strong>{nbExpir7j} lot(s)</strong> expirent dans moins de 7 jours</span>
            </div>
          )}
        </div>

        {/* Mouvements ce mois */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h3 className="text-gray-700 font-semibold mb-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />
            Mouvements ce mois
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <p className="text-2xl font-bold text-blue-600">{mvtMois.length}</p>
              <p className="text-xs text-blue-700 mt-1">Total</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-600">{totalEntrees.toFixed(0)}</p>
              <p className="text-xs text-green-700 mt-1">Entrées (kg)</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl text-center">
              <p className="text-2xl font-bold text-red-500">{totalSorties.toFixed(0)}</p>
              <p className="text-xs text-red-700 mt-1">Sorties (kg)</p>
            </div>
          </div>

          {/* Solde */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">Solde net ce mois</span>
            <span className={`text-xl font-bold ${totalEntrees - totalSorties >= 0 ? "text-blue-600" : "text-red-500"}`}>
              {totalEntrees - totalSorties >= 0 ? "+" : ""}{(totalEntrees - totalSorties).toFixed(1)} kg
            </span>
          </div>

          {/* Derniers mouvements */}
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500 font-medium">5 derniers mouvements</p>
            {movements.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                <span className={`px-2 py-0.5 rounded-full font-medium ${
                  m.type === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {m.type === "IN" ? "↑ Entrée" : "↓ Sortie"}
                </span>
                <span className="text-gray-700 font-medium">{m.product}</span>
                <span className="text-gray-500">{parseFloat(m.qty_kg).toFixed(1)} kg</span>
                <span className="text-gray-400">
                  {m.created_at ? new Date(m.created_at).toLocaleDateString("fr-FR") : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
