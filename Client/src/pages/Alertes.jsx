// src/pages/Alertes.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";

const API_DASHBOARD = "http://localhost:4000/api/dashboard/kpi";
const API_LOTS = "http://localhost:4000/api/lots";
const API_PRODUCTS = "http://localhost:4000/api/products";

export default function Alertes() {
  const [ruptureProducts, setRuptureProducts] = useState([]);
  const [expiringLots, setExpiringLots] = useState([]);
  const [allLots, setAllLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kpiRes, lotsRes] = await Promise.all([
        axios.get(API_DASHBOARD),
        axios.get(API_LOTS),
      ]);

      // Ruptures depuis le dashboard
      const alertes = kpiRes.data.dashboard?.sections?.alertes;
      setRuptureProducts(alertes?.produits_en_rupture || []);

      // Lots expirant depuis les lots
      const lots = lotsRes.data.lots || [];
      setAllLots(lots);

      const expiring = lots.filter((l) => {
        if (!l.exp_date) return false;
        const diff = Math.ceil((new Date(l.exp_date) - new Date()) / (1000 * 60 * 60 * 24));
        return diff <= 30 && diff >= 0;
      }).sort((a, b) => new Date(a.exp_date) - new Date(b.exp_date));

      setExpiringLots(expiring);
      setLastUpdate(new Date());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getDaysLeft = (expDate) => {
    return Math.ceil((new Date(expDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyStyle = (days) => {
    if (days <= 3) return { color: "bg-red-100 text-red-700 border-red-200", icon: "red" };
    if (days <= 7) return { color: "bg-orange-100 text-orange-700 border-orange-200", icon: "orange" };
    return { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: "yellow" };
  };

  const expiredLots = allLots.filter((l) => {
    if (!l.exp_date) return false;
    return new Date(l.exp_date) < new Date();
  });

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Alertes</h1>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition disabled:opacity-50">
          <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {lastUpdate && (
        <p className="text-xs text-gray-400">
          Dernière mise à jour : {lastUpdate.toLocaleTimeString("fr-FR")}
        </p>
      )}

      {/* KPI ALERTES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow border border-red-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Produits en rupture</p>
              <p className="text-3xl font-semibold text-red-600">{ruptureProducts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-orange-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Lots expirant (30j)</p>
              <p className="text-3xl font-semibold text-orange-500">{expiringLots.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Lots expirés</p>
              <p className="text-3xl font-semibold text-gray-700">{expiredLots.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION RUPTURES */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          Produits en rupture de stock
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : ruptureProducts.length === 0 ? (
          <div className="flex items-center gap-3 py-6 text-green-600">
            <CheckCircleIcon className="w-6 h-6" />
            <span className="font-medium">Aucune rupture de stock détectée ✓</span>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-3">Produit</th>
                <th className="pb-3">Stock actuel (kg)</th>
                <th className="pb-3">Stock minimum (kg)</th>
                <th className="pb-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {ruptureProducts.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-red-50 transition">
                  <td className="py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="py-3 font-semibold text-red-600">{p.stock_actuel}</td>
                  <td className="py-3 text-gray-600">{p.min_stock}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      <ExclamationTriangleIcon className="w-3 h-3" />
                      En rupture
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SECTION LOTS EXPIRANTS */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-orange-500" />
          Lots expirant dans les 30 prochains jours
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : expiringLots.length === 0 ? (
          <div className="flex items-center gap-3 py-6 text-green-600">
            <CheckCircleIcon className="w-6 h-6" />
            <span className="font-medium">Aucun lot n'expire dans les 30 prochains jours ✓</span>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-3">Code lot</th>
                <th className="pb-3">Produit</th>
                <th className="pb-3">Quantité (kg)</th>
                <th className="pb-3">Date expiration</th>
                <th className="pb-3">Urgence</th>
              </tr>
            </thead>
            <tbody>
              {expiringLots.map((l) => {
                const days = getDaysLeft(l.exp_date);
                const style = getUrgencyStyle(days);
                return (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-orange-50 transition">
                    <td className="py-3 font-mono text-blue-700">{l.lot_code || "—"}</td>
                    <td className="py-3 font-medium text-gray-800">{l.product || "—"}</td>
                    <td className="py-3 text-gray-700">{parseFloat(l.qty_kg).toFixed(2)}</td>
                    <td className="py-3 text-gray-600">
                      {new Date(l.exp_date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${style.color}`}>
                        <ClockIcon className="w-3 h-3" />
                        {days === 0 ? "Expire aujourd'hui" : `${days} jour${days > 1 ? "s" : ""}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* LOTS EXPIRÉS */}
      {expiredLots.length > 0 && (
        <div className="bg-white rounded-xl shadow border border-red-200 p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5" />
            Lots expirés ({expiredLots.length})
          </h2>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-3">Code lot</th>
                <th className="pb-3">Produit</th>
                <th className="pb-3">Quantité (kg)</th>
                <th className="pb-3">Date expiration</th>
              </tr>
            </thead>
            <tbody>
              {expiredLots.map((l) => (
                <tr key={l.id} className="border-b last:border-0 bg-red-50">
                  <td className="py-3 font-mono text-red-700">{l.lot_code || "—"}</td>
                  <td className="py-3 text-gray-800">{l.product || "—"}</td>
                  <td className="py-3 text-red-600 font-semibold">{parseFloat(l.qty_kg).toFixed(2)}</td>
                  <td className="py-3 text-red-600">{new Date(l.exp_date).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
