// src/pages/Lots.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, ExclamationTriangleIcon, ArchiveBoxIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

const API_LOTS     = "http://localhost:4000/api/lots";
const API_PRODUCTS = "http://localhost:4000/api/products";
const API_IN       = "http://localhost:4000/api/movements/in";

const emptyForm = { product_id: "", lot_code: "", qty_kg: "", exp_date: "", location: "" };

export default function Lots() {
  const [lots, setLots]         = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch]     = useState("");
  const [filterTab, setFilterTab] = useState("ACTIFS");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);   // modal modifier
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const fetchLots     = async () => {
    try { const res = await axios.get(API_LOTS); setLots(res.data.lots || []); }
    catch (err) { console.error(err); }
  };
  const fetchProducts = async () => {
    try { const res = await axios.get(API_PRODUCTS); setProducts(res.data.items || []); }
    catch (err) { console.error(err); }
  };

  useEffect(() => { fetchLots(); fetchProducts(); }, []);

  const showMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  // ── STATUT EXPIRATION ──
  const getExpiryInfo = (expDate) => {
    if (!expDate) return { label: "—", color: "bg-gray-100 text-gray-400", days: null, isExpired: false, isExpiring: false };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const exp   = new Date(expDate); exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)   return { label: "Expiré",         color: "bg-red-100 text-red-700",      days: diffDays, isExpired: true,  isExpiring: false };
    if (diffDays <= 7)  return { label: `⚠ ${diffDays}j`, color: "bg-orange-100 text-orange-700", days: diffDays, isExpired: false, isExpiring: true  };
    if (diffDays <= 30) return { label: `${diffDays}j`,   color: "bg-yellow-100 text-yellow-700", days: diffDays, isExpired: false, isExpiring: false };
    return                     { label: "✓ OK",            color: "bg-green-100 text-green-700",   days: diffDays, isExpired: false, isExpiring: false };
  };

  // ── ONGLETS ──
  const tabs = [
    { key: "ACTIFS",    label: "Actifs",         count: lots.filter(l => !getExpiryInfo(l.exp_date).isExpired && parseFloat(l.qty_kg) > 0).length },
    { key: "EXPIRANTS", label: "Expirant ≤ 30j", count: lots.filter(l => { const i = getExpiryInfo(l.exp_date); return !i.isExpired && i.days !== null && i.days <= 30; }).length },
    { key: "EXPIRES",   label: "Expirés",        count: lots.filter(l => getExpiryInfo(l.exp_date).isExpired).length },
    { key: "TOUS",      label: "Tous",           count: lots.length },
  ];

  const filtered = lots.filter((l) => {
    const info = getExpiryInfo(l.exp_date);
    const matchSearch =
      l.product?.toLowerCase().includes(search.toLowerCase()) ||
      l.lot_code?.toLowerCase().includes(search.toLowerCase()) ||
      l.location?.toLowerCase().includes(search.toLowerCase());
    let matchTab = true;
    if (filterTab === "ACTIFS")    matchTab = !info.isExpired && parseFloat(l.qty_kg) > 0;
    if (filterTab === "EXPIRANTS") matchTab = !info.isExpired && info.days !== null && info.days <= 30;
    if (filterTab === "EXPIRES")   matchTab = info.isExpired;
    return matchSearch && matchTab;
  });

  // ── RÉCEPTIONNER LOT ──
  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(API_IN, formData);
      if (res.data.ok) {
        fetchLots();
        setShowModal(false);
        setFormData(emptyForm);
        showMsg("Lot réceptionné — entrée de stock créée ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la réception");
    }
    setLoading(false);
  };

  // ── MODIFIER LOT ──
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.put(`${API_LOTS}/${editData.id}`, editData);
      if (res.data.ok) {
        fetchLots();
        setEditData(null);
        showMsg("Lot mis à jour ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la modification");
    }
    setLoading(false);
  };

  // ── SUPPRIMER LOT ──
  const handleDelete = async (lot) => {
    if (parseFloat(lot.qty_kg) > 0) {
      alert(`⚠ Impossible de supprimer ce lot — il reste ${parseFloat(lot.qty_kg).toFixed(2)} kg en stock.\n\nFaites d'abord une sortie de stock dans la page Mouvements.`);
      return;
    }
    if (!window.confirm(`Supprimer le lot ${lot.lot_code || `#${lot.id}`} ?`)) return;
    try {
      const res = await axios.delete(`${API_LOTS}/${lot.id}`);
      if (res.data.ok) {
        fetchLots();
        showMsg("Lot supprimé ✓");
      }
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de la suppression");
    }
  };

  // KPI
  const stockTotal  = lots.filter(l => !getExpiryInfo(l.exp_date).isExpired).reduce((a, l) => a + parseFloat(l.qty_kg || 0), 0);
  const nbExpires   = lots.filter(l => getExpiryInfo(l.exp_date).isExpired).length;
  const nbExpirants = lots.filter(l => { const i = getExpiryInfo(l.exp_date); return !i.isExpired && i.days !== null && i.days <= 7; }).length;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Lots</h1>
        <button onClick={() => { setShowModal(true); setError(""); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
          + Réceptionner un lot
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>
      )}

      {/* ALERTE expirés */}
      {nbExpires > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-700">
            <span className="font-semibold">{nbExpires} lot(s) expiré(s)</span> — consultez l'onglet <strong>"Expirés"</strong>. Faites une sortie de stock puis supprimez-les.
          </p>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total lots</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{lots.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Stock actif (kg)</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">{stockTotal.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Expirant ≤ 7j</p>
          <p className={`text-3xl font-semibold mt-1 ${nbExpirants > 0 ? "text-orange-500" : "text-gray-400"}`}>{nbExpirants}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Lots expirés</p>
          <p className={`text-3xl font-semibold mt-1 ${nbExpires > 0 ? "text-red-600" : "text-gray-400"}`}>{nbExpires}</p>
        </div>
      </div>

      {/* ONGLETS + SEARCH */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-4 space-y-3">
        <div className="flex gap-1 border-b border-gray-100 pb-3 flex-wrap">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setFilterTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                filterTab === tab.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                filterTab === tab.key ? "bg-blue-500 text-white" : "bg-white text-gray-500"
              }`}>{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher par produit, code lot ou emplacement..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm text-gray-700" />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 flex flex-col items-center gap-2">
            <ArchiveBoxIcon className="w-10 h-10 text-gray-300" />
            <p>{filterTab === "EXPIRES" ? "Aucun lot expiré 🎉" : "Aucun lot trouvé"}</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-3">Code lot</th>
                <th className="pb-3">Produit</th>
                <th className="pb-3">Quantité (kg)</th>
                <th className="pb-3">Emplacement</th>
                <th className="pb-3">Date expiration</th>
                <th className="pb-3">Statut</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const info = getExpiryInfo(l.exp_date);
                const qtyZero = parseFloat(l.qty_kg) <= 0;
                return (
                  <tr key={l.id} className={`border-b last:border-0 transition ${
                    info.isExpired ? "bg-red-50" : "hover:bg-gray-50"
                  }`}>
                    <td className="py-3 font-mono text-blue-700 font-medium">{l.lot_code || "—"}</td>
                    <td className="py-3 font-medium text-gray-800">{l.product || "—"}</td>
                    <td className="py-3">
                      <span className={qtyZero ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                        {parseFloat(l.qty_kg).toFixed(2)} kg
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{l.location || "—"}</td>
                    <td className="py-3 text-gray-600">
                      {l.exp_date ? new Date(l.exp_date).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
                        {info.isExpired && <ExclamationTriangleIcon className="w-3 h-3" />}
                        {info.label}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {/* Modifier — toujours disponible */}
                        <button onClick={() => { setEditData({ ...l, exp_date: l.exp_date ? l.exp_date.split("T")[0] : "" }); setError(""); }}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100 transition">
                          <PencilIcon className="w-3 h-3" /> Modifier
                        </button>
                        {/* Supprimer — affiché toujours, bloqué si qty > 0 */}
                        <button onClick={() => handleDelete(l)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition ${
                            qtyZero
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}>
                          <TrashIcon className="w-3 h-3" />
                          {qtyZero ? "Supprimer" : "Stock > 0"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL RÉCEPTIONNER */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[440px]">
            <h2 className="text-xl font-semibold mb-1">Réceptionner un lot</h2>
            <p className="text-sm text-gray-500 mb-4">Crée le lot et enregistre une entrée de stock</p>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produit *</label>
                <select value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  required className="w-full p-2 border border-gray-300 rounded-lg outline-none">
                  <option value="">-- Sélectionner un produit --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code lot *</label>
                <input type="text" value={formData.lot_code}
                  onChange={(e) => setFormData({ ...formData, lot_code: e.target.value })}
                  placeholder="Ex: LOT-2025-001" required
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité (kg) *</label>
                  <input type="number" step="0.01" value={formData.qty_kg}
                    onChange={(e) => setFormData({ ...formData, qty_kg: e.target.value })}
                    placeholder="100" required
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date expiration *</label>
                  <input type="date" value={formData.exp_date}
                    onChange={(e) => setFormData({ ...formData, exp_date: e.target.value })}
                    required className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emplacement *</label>
                <input type="text" value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ex: Entrepôt A - Zone 3" required
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setFormData(emptyForm); setError(""); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuler</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Réception..." : "Réceptionner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFIER */}
      {editData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[420px]">
            <h2 className="text-xl font-semibold mb-1">Modifier le lot</h2>
            <p className="text-sm text-gray-500 mb-4">
              Lot : <span className="font-mono font-medium text-blue-700">{editData.lot_code || `#${editData.id}`}</span>
              {" — "}<span className="text-gray-600">{editData.product}</span>
            </p>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code lot</label>
                <input type="text" value={editData.lot_code || ""}
                  onChange={(e) => setEditData({ ...editData, lot_code: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emplacement</label>
                <input type="text" value={editData.location || ""}
                  onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  placeholder="Ex: Entrepôt A - Zone 3"
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date expiration</label>
                <input type="date" value={editData.exp_date || ""}
                  onChange={(e) => setEditData({ ...editData, exp_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                ⚠️ La quantité ne peut pas être modifiée directement. Pour ajuster le stock, utilisez un mouvement d'entrée ou de sortie.
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setEditData(null); setError(""); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuler</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Sauvegarde..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
