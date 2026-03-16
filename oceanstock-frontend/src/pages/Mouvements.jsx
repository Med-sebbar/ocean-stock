// src/pages/Mouvements.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { ArrowUpIcon, ArrowDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const API_MOVEMENTS = "http://localhost:4000/api/movements";
const API_PRODUCTS  = "http://localhost:4000/api/products";
const API_IN        = "http://localhost:4000/api/movements/in";
const API_OUT       = "http://localhost:4000/api/movements/out";

const PERIODS = [
  { key: "TODAY",  label: "Aujourd'hui" },
  { key: "WEEK",   label: "Cette semaine" },
  { key: "MONTH",  label: "Ce mois" },
  { key: "YEAR",   label: "Cette année" },
  { key: "ALL",    label: "Tout" },
];

export default function Mouvements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");   // ALL | IN | OUT
  const [period, setPeriod]       = useState("MONTH");   // par défaut ce mois
  const [modal, setModal]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState("");
  const [error, setError]         = useState("");

  const [formIn, setFormIn]   = useState({ product_id: "", lot_code: "", qty_kg: "", exp_date: "", location: "" });
  const [formOut, setFormOut] = useState({ product_id: "", qty_kg: "" });

  const fetchMovements = async () => {
    try {
      const res = await axios.get(API_MOVEMENTS);
      setMovements(res.data.items || []);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_PRODUCTS);
      setProducts(res.data.items || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchMovements(); fetchProducts(); }, []);

  const showMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  // ── FILTRE PAR PÉRIODE ──
  const isInPeriod = (dateStr) => {
    if (period === "ALL") return true;
    if (!dateStr) return false;
    const date  = new Date(dateStr);
    const now   = new Date();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (period === "TODAY") {
      return date >= today;
    }
    if (period === "WEEK") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
      return date >= startOfWeek;
    }
    if (period === "MONTH") {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    if (period === "YEAR") {
      return date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // ── FILTRAGE COMPLET ──
  const filtered = movements.filter((m) => {
    const matchSearch =
      m.product?.toLowerCase().includes(search.toLowerCase()) ||
      m.lot_code?.toLowerCase().includes(search.toLowerCase());
    const matchType   = typeFilter === "ALL" || m.type === typeFilter;
    const matchPeriod = isInPeriod(m.created_at);
    return matchSearch && matchType && matchPeriod;
  });

  // KPI calculés sur la période sélectionnée
  const periodMovements = movements.filter(m => isInPeriod(m.created_at));
  const totalEntrees = periodMovements.filter(m => m.type === "IN").reduce((a, m) => a + parseFloat(m.qty_kg || 0), 0);
  const totalSorties = periodMovements.filter(m => m.type === "OUT").reduce((a, m) => a + parseFloat(m.qty_kg || 0), 0);
  const soldeName    = totalEntrees - totalSorties;

  // ── ENTRÉE ──
  const handleIn = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(API_IN, formIn);
      if (res.data.ok) {
        fetchMovements();
        setModal(null);
        setFormIn({ product_id: "", lot_code: "", qty_kg: "", exp_date: "", location: "" });
        showMsg("Entrée de stock enregistrée ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'entrée");
    }
    setLoading(false);
  };

  // ── SORTIE FEFO ──
  const handleOut = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(API_OUT, formOut);
      if (res.data.ok) {
        fetchMovements();
        setModal(null);
        setFormOut({ product_id: "", qty_kg: "" });
        showMsg("Sortie FEFO enregistrée ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Stock insuffisant ou produit introuvable");
    }
    setLoading(false);
  };

  const periodLabel = PERIODS.find(p => p.key === period)?.label || "";

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Mouvements de stock</h1>
        <div className="flex gap-3">
          <button onClick={() => { setModal("in"); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            <ArrowUpIcon className="w-4 h-4" /> Entrée
          </button>
          <button onClick={() => { setModal("out"); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
            <ArrowDownIcon className="w-4 h-4" /> Sortie FEFO
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>
      )}

      {/* FILTRE PÉRIODE */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
        <p className="text-xs text-gray-500 mb-2 font-medium">Période d'affichage</p>
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                period === p.key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI — calculés sur la période */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Mouvements ({periodLabel})</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{periodMovements.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Entrées (kg)</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">{totalEntrees.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Sorties (kg)</p>
          <p className="text-3xl font-semibold text-red-500 mt-1">{totalSorties.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Solde net (kg)</p>
          <p className={`text-3xl font-semibold mt-1 ${soldeName >= 0 ? "text-blue-600" : "text-red-600"}`}>
            {soldeName >= 0 ? "+" : ""}{soldeName.toFixed(1)}
          </p>
        </div>
      </div>

      {/* SEARCH + FILTRE TYPE */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher par produit ou code lot..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm text-gray-700" />
        </div>
        <div className="flex gap-2">
          {[
            { key: "ALL", label: "Tous" },
            { key: "IN",  label: "Entrées" },
            { key: "OUT", label: "Sorties" },
          ].map(f => (
            <button key={f.key} onClick={() => setTypeFilter(f.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                typeFilter === f.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{filtered.length}</span> mouvement(s) — {periodLabel}
          </p>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-3">Type</th>
              <th className="pb-3">Produit</th>
              <th className="pb-3">Code lot</th>
              <th className="pb-3">Quantité (kg)</th>
              <th className="pb-3">Référence</th>
              <th className="pb-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400">
                  Aucun mouvement pour cette période
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      m.type === "IN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {m.type === "IN"
                        ? <ArrowUpIcon className="w-3 h-3" />
                        : <ArrowDownIcon className="w-3 h-3" />}
                      {m.type === "IN" ? "Entrée" : "Sortie"}
                    </span>
                  </td>
                  <td className="py-3 font-medium text-gray-800">{m.product || "—"}</td>
                  <td className="py-3 font-mono text-blue-700">{m.lot_code || "—"}</td>
                  <td className="py-3 font-semibold text-gray-700">{parseFloat(m.qty_kg).toFixed(2)} kg</td>
                  <td className="py-3 text-gray-500">{m.ref || "—"}</td>
                  <td className="py-3 text-gray-500">
                    {m.created_at ? new Date(m.created_at).toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL ENTRÉE */}
      {modal === "in" && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[440px]">
            <h2 className="text-xl font-semibold mb-1 text-green-700">Entrée de stock</h2>
            <p className="text-sm text-gray-500 mb-4">Réceptionner un nouveau lot</p>
            <form onSubmit={handleIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
                <select value={formIn.product_id}
                  onChange={(e) => setFormIn({ ...formIn, product_id: e.target.value })}
                  required className="w-full p-2 border border-gray-300 rounded-lg outline-none">
                  <option value="">-- Sélectionner --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code lot *</label>
                <input type="text" value={formIn.lot_code}
                  onChange={(e) => setFormIn({ ...formIn, lot_code: e.target.value })}
                  placeholder="Ex: LOT-2025-001" required
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité (kg) *</label>
                  <input type="number" step="0.01" value={formIn.qty_kg}
                    onChange={(e) => setFormIn({ ...formIn, qty_kg: e.target.value })}
                    placeholder="100" required
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date expiration *</label>
                  <input type="date" value={formIn.exp_date}
                    onChange={(e) => setFormIn({ ...formIn, exp_date: e.target.value })}
                    required className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emplacement *</label>
                <input type="text" value={formIn.location}
                  onChange={(e) => setFormIn({ ...formIn, location: e.target.value })}
                  placeholder="Ex: Entrepôt A" required
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setModal(null)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuler</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {loading ? "Enregistrement..." : "Confirmer l'entrée"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SORTIE FEFO */}
      {modal === "out" && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[400px]">
            <h2 className="text-xl font-semibold mb-1 text-red-600">Sortie FEFO</h2>
            <p className="text-sm text-gray-500 mb-4">
              Stock prélevé automatiquement selon <strong>First Expired, First Out</strong>
            </p>
            <form onSubmit={handleOut} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
                <select value={formOut.product_id}
                  onChange={(e) => setFormOut({ ...formOut, product_id: e.target.value })}
                  required className="w-full p-2 border border-gray-300 rounded-lg outline-none">
                  <option value="">-- Sélectionner --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité à sortir (kg) *</label>
                <input type="number" step="0.01" value={formOut.qty_kg}
                  onChange={(e) => setFormOut({ ...formOut, qty_kg: e.target.value })}
                  placeholder="Ex: 50" required
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-700">
                ⚠️ Les lots les plus proches de leur expiration seront prélevés en premier.
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setModal(null)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuler</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50">
                  {loading ? "Traitement..." : "Confirmer la sortie"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
