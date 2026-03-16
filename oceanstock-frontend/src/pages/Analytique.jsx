// src/pages/Analytique.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { ArrowPathIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";

const API_VENTES = "http://localhost:4000/api/analytics/ventes";
const API_ACHATS = "http://localhost:4000/api/analytics/achats";
const API_STOCK  = "http://localhost:4000/api/analytics/stock";

const COLORS = ["#3B82F6", "#22C55E", "#FB923C", "#A855F7", "#EF4444", "#06B6D4"];

export default function Analytique() {
  const [ventesData, setVentesData] = useState(null);
  const [achatsData, setAchatsData] = useState(null);
  const [stockData, setStockData]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("ventes");
  const [errors, setErrors]         = useState({});

  const fetchAll = async () => {
    setLoading(true);
    setErrors({});
    const [v, a, s] = await Promise.allSettled([
      axios.get(API_VENTES),
      axios.get(API_ACHATS),
      axios.get(API_STOCK),
    ]);
    if (v.status === "fulfilled") setVentesData(v.value.data.stats);
    else setErrors(e => ({ ...e, ventes: "Erreur chargement ventes" }));

    if (a.status === "fulfilled") setAchatsData(a.value.data.stats);
    else setErrors(e => ({ ...e, achats: "Erreur chargement achats" }));

    if (s.status === "fulfilled") setStockData(s.value.data.stats);
    else setErrors(e => ({ ...e, stock: "Erreur chargement stock" }));

    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const fmt  = (val) => `${parseFloat(val || 0).toFixed(2)} $`;
  const fmtN = (val) => parseFloat(val || 0).toLocaleString("fr-FR");

  const KpiCard = ({ label, value, color = "text-gray-900", sub }) => (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  const tabs = [
    { id: "ventes", label: "📈 Ventes" },
    { id: "achats", label: "🛒 Achats" },
    { id: "stock",  label: "📦 Stock"  },
  ];

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Analytique</h1>
        <button onClick={fetchAll} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
          <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* TABS */}
          <div className="flex gap-2 border-b border-gray-200">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── VENTES ── */}
          {activeTab === "ventes" && (
            errors.ventes ? (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">{errors.ventes}</div>
            ) : ventesData ? (
              <div className="space-y-6">

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="CA Total (factures payées)"
                    value={fmt(ventesData.kpi_principaux?.ca_total)}
                    color="text-gray-900" />
                  <KpiCard label="CA ce mois"
                    value={fmt(ventesData.kpi_principaux?.ca_mois_cours)}
                    color="text-blue-600" />
                  <KpiCard label="Croissance vs mois dernier"
                    value={`${ventesData.kpi_principaux?.taux_croissance ?? 0} %`}
                    color={ventesData.kpi_principaux?.taux_croissance >= 0 ? "text-green-600" : "text-red-500"} />
                  <KpiCard label="Panier moyen"
                    value={fmt(ventesData.kpi_principaux?.panier_moyen)}
                    color="text-purple-600"
                    sub={`${ventesData.kpi_principaux?.total_factures ?? 0} factures payées`} />
                </div>

                {/* Graphique historique ventes */}
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Évolution du CA mensuel (12 mois)</h3>
                  {ventesData.graphiques?.historique_ventes?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={ventesData.graphiques.historique_ventes}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(val) => `${val} $`} />
                        <Legend />
                        <Bar dataKey="montant_courant"          name="CA actuel" fill="#3B82F6" radius={[6,6,0,0]} />
                        <Bar dataKey="montant_annee_precedente" name="CA N-1"    fill="#CBD5E1" radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-400 py-10">Aucune donnée — créez des factures payées pour voir le graphique</p>
                  )}
                </div>

                {/* Top clients */}
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Top 10 clients</h3>
                  {ventesData.analyses?.top_clients?.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="pb-2">#</th>
                          <th className="pb-2">Client</th>
                          <th className="pb-2">Total achats</th>
                          <th className="pb-2">Nb commandes</th>
                          <th className="pb-2">Panier moyen</th>
                          <th className="pb-2">Tendance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ventesData.analyses.top_clients.map((c, i) => (
                          <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-2 font-bold text-gray-400">{i + 1}</td>
                            <td className="py-2 font-medium text-gray-800">{c.client}</td>
                            <td className="py-2 font-semibold text-blue-600">{fmt(c.total_achats)}</td>
                            <td className="py-2 text-gray-600">{c.nb_commandes}</td>
                            <td className="py-2 text-gray-600">{fmt(c.panier_moyen)}</td>
                            <td className="py-2">
                              {c.tendance !== null && c.tendance !== undefined ? (
                                <span className={`flex items-center gap-1 text-xs font-medium ${c.tendance >= 0 ? "text-green-600" : "text-red-500"}`}>
                                  {c.tendance >= 0
                                    ? <ArrowTrendingUpIcon className="w-3 h-3" />
                                    : <ArrowTrendingDownIcon className="w-3 h-3" />}
                                  {c.tendance} %
                                </span>
                              ) : <span className="text-gray-400 text-xs">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-gray-400 py-6">Aucun client avec des factures payées</p>
                  )}
                </div>
              </div>
            ) : null
          )}

          {/* ── ACHATS ── */}
          {activeTab === "achats" && (
            errors.achats ? (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">{errors.achats}</div>
            ) : achatsData ? (
              <div className="space-y-6">

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="Total achats (reçus)"
                    value={fmt(achatsData.kpi_principaux?.total_achats)}
                    color="text-gray-900" />
                  <KpiCard label="Achats ce mois"
                    value={fmt(achatsData.kpi_principaux?.achats_mois_cours)}
                    color="text-blue-600" />
                  <KpiCard label="Commande moyenne"
                    value={fmt(achatsData.kpi_principaux?.commande_moyenne)}
                    color="text-orange-500" />
                  <KpiCard label="Fournisseurs actifs"
                    value={achatsData.kpi_principaux?.fournisseurs_actifs ?? 0}
                    color="text-green-600" />
                </div>

                {/* Graphique achats mensuels */}
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Évolution des achats mensuels (12 mois)</h3>
                  {achatsData.analyses?.performance_mensuelle?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={achatsData.analyses.performance_mensuelle}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(val) => `${val} $`} />
                        <Legend />
                        <Line type="monotone" dataKey="montant_courant"          name="Achats"  stroke="#FB923C" strokeWidth={2} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="montant_annee_precedente" name="N-1"     stroke="#CBD5E1" strokeWidth={2} strokeDasharray="5 5" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-400 py-10">Aucune donnée — réceptionnez des bons d'achat pour voir le graphique</p>
                  )}
                </div>

                {/* Top fournisseurs */}
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Top fournisseurs</h3>
                  {achatsData.analyses?.top_fournisseurs?.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="pb-2">#</th>
                          <th className="pb-2">Fournisseur</th>
                          <th className="pb-2">Total achats</th>
                          <th className="pb-2">Nb commandes</th>
                          <th className="pb-2">Commande moy.</th>
                          <th className="pb-2">Dernière commande</th>
                        </tr>
                      </thead>
                      <tbody>
                        {achatsData.analyses.top_fournisseurs.map((f, i) => (
                          <tr key={f.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="py-2 font-bold text-gray-400">{i + 1}</td>
                            <td className="py-2 font-medium text-gray-800">{f.fournisseur}</td>
                            <td className="py-2 font-semibold text-orange-500">{fmt(f.total_achats)}</td>
                            <td className="py-2 text-gray-600">{f.nb_commandes}</td>
                            <td className="py-2 text-gray-600">{fmt(f.commande_moyenne)}</td>
                            <td className="py-2 text-gray-500 text-xs">
                              {f.derniere_commande ? new Date(f.derniere_commande).toLocaleDateString("fr-FR") : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-center text-gray-400 py-6">Aucun fournisseur avec des commandes reçues</p>
                  )}
                </div>
              </div>
            ) : null
          )}

          {/* ── STOCK ── */}
          {activeTab === "stock" && (
            errors.stock ? (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4">{errors.stock}</div>
            ) : stockData ? (
              <div className="space-y-6">

                {/* KPI */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <KpiCard label="Valeur stock total"
                    value={fmt(stockData.kpi_principaux?.valeur_stock_total)}
                    color="text-gray-900" />
                  <KpiCard label="Volume (kg)"
                    value={`${stockData.kpi_principaux?.volume_stock_total_kg ?? 0} kg`}
                    color="text-blue-600" />
                  <KpiCard label="Jours de couverture"
                    value={`${stockData.kpi_principaux?.jours_couverture ?? "—"} j`}
                    color="text-green-600" />
                  <KpiCard label="Rotation annuelle"
                    value={`${stockData.kpi_principaux?.taux_rotation_annuel ?? 0} x`}
                    color="text-purple-600" />
                  <KpiCard label="Produits sous stock min"
                    value={stockData.kpi_principaux?.produits_sous_stock_min ?? 0}
                    color={stockData.kpi_principaux?.produits_sous_stock_min > 0 ? "text-red-500" : "text-gray-400"} />
                  <KpiCard label="Lots expirant ≤ 7j"
                    value={stockData.kpi_principaux?.lots_expiration_7j ?? 0}
                    color={stockData.kpi_principaux?.lots_expiration_7j > 0 ? "text-orange-500" : "text-gray-400"} />
                </div>

                {/* Rupture imminente */}
                {stockData.analyses?.produits_rupture_imminente?.length > 0 && (
                  <div className="bg-white rounded-xl shadow border border-red-100 p-6">
                    <h3 className="font-semibold text-red-600 mb-4">⚠️ Produits en rupture imminente</h3>
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="pb-2">Produit</th>
                          <th className="pb-2">SKU</th>
                          <th className="pb-2">Stock actuel</th>
                          <th className="pb-2">Stock minimum</th>
                          <th className="pb-2">Écart</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockData.analyses.produits_rupture_imminente.map((p) => (
                          <tr key={p.id} className="border-b last:border-0 hover:bg-red-50">
                            <td className="py-2 font-medium text-gray-800">{p.name}</td>
                            <td className="py-2 font-mono text-gray-500 text-xs">{p.sku}</td>
                            <td className="py-2 font-semibold text-red-600">{parseFloat(p.stock_actuel).toFixed(2)} kg</td>
                            <td className="py-2 text-gray-600">{parseFloat(p.stock_minimum).toFixed(2)} kg</td>
                            <td className="py-2 text-red-500 text-xs font-medium">
                              -{parseFloat(Math.max(0, p.stock_minimum - p.stock_actuel)).toFixed(2)} kg
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Activité entrepôt */}
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Activité entrepôt (30 derniers jours)</h3>
                  {stockData.analyses?.activite_entrepot?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={[...stockData.analyses.activite_entrepot].reverse()}>
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
                    <p className="text-center text-gray-400 py-10">Aucun mouvement ces 30 derniers jours</p>
                  )}
                </div>

                {/* Faible rotation */}
                {stockData.analyses?.produits_faible_rotation?.length > 0 && (
                  <div className="bg-white rounded-xl shadow border border-yellow-100 p-6">
                    <h3 className="font-semibold text-yellow-700 mb-4">🐌 Produits à faible rotation</h3>
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="pb-2">Produit</th>
                          <th className="pb-2">SKU</th>
                          <th className="pb-2">Stock actuel</th>
                          <th className="pb-2">Rotation trimestrielle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockData.analyses.produits_faible_rotation.map((p) => (
                          <tr key={p.id} className="border-b last:border-0 hover:bg-yellow-50">
                            <td className="py-2 font-medium text-gray-800">{p.name}</td>
                            <td className="py-2 font-mono text-gray-500 text-xs">{p.sku}</td>
                            <td className="py-2 text-gray-600">{parseFloat(p.stock_actuel).toFixed(2)} kg</td>
                            <td className="py-2">
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                {p.rotation_trimestrielle ?? 0} x
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null
          )}
        </>
      )}
    </div>
  );
}
