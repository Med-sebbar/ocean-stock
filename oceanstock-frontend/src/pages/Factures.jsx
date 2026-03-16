// src/pages/Factures.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const API        = "http://localhost:4000/api/invoices";
const API_ORDERS = "http://localhost:4000/api/orders";

const STATUS_STYLES = {
  PAID:      { label: "Payée",     color: "bg-green-100 text-green-700" },
  UNPAID:    { label: "Non payée", color: "bg-red-100 text-red-700" },
  DRAFT:     { label: "Brouillon", color: "bg-gray-100 text-gray-600" },
  CANCELLED: { label: "Annulée",   color: "bg-orange-100 text-orange-700" },
};

const emptyForm = {
  order_id: "",
  invoice_number: "",
  total_ht: "",
  total_ttc: "",
  due_date: "",
};

export default function Factures() {
  const [invoices, setInvoices]   = useState([]);
  const [orders, setOrders]       = useState([]);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showAdd, setShowAdd]     = useState(false);
  const [editData, setEditData]   = useState(null);
  const [formData, setFormData]   = useState(emptyForm);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  // ── FETCH ──
  const fetchInvoices = async () => {
    try {
      const res = await axios.get(API);
      setInvoices(res.data.invoices || []);
    } catch (err) { console.error(err); }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(API_ORDERS);
      setOrders(res.data.orders || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchInvoices(); fetchOrders(); }, []);

  const showMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  // ── CRÉER ──
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(API, formData);
      if (res.data.ok) {
        fetchInvoices();
        setShowAdd(false);
        setFormData(emptyForm);
        showMsg("Facture créée avec succès ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création");
    }
    setLoading(false);
  };

  // ── MODIFIER ──
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.put(`${API}/${editData.id}`, editData);
      if (res.data.ok) {
        fetchInvoices();
        setEditData(null);
        showMsg("Facture mise à jour ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la mise à jour");
    }
    setLoading(false);
  };

  // ── SUPPRIMER ──
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette facture ?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchInvoices();
      showMsg("Facture supprimée ✓");
    } catch (err) { console.error(err); }
  };

  // Quand on choisit une commande → auto-remplir les montants
  const handleOrderSelect = (order_id) => {
    const order = orders.find(o => String(o.id) === String(order_id));
    if (order) {
      setFormData({
        ...formData,
        order_id,
        total_ht:  order.total_ht  || "",
        total_ttc: order.total_ttc || "",
      });
    } else {
      setFormData({ ...formData, order_id });
    }
  };

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.order_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalUnpaid = invoices
    .filter(i => i.status === "UNPAID")
    .reduce((a, i) => a + parseFloat(i.total_ttc || 0), 0);
  const totalPaid = invoices
    .filter(i => i.status === "PAID")
    .reduce((a, i) => a + parseFloat(i.total_ttc || 0), 0);

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Factures</h1>
        <button onClick={() => { setShowAdd(true); setError(""); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
          + Nouvelle facture
        </button>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {success}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total factures</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Payées</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">
            {invoices.filter(i => i.status === "PAID").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Non payées</p>
          <p className="text-3xl font-semibold text-red-600 mt-1">
            {invoices.filter(i => i.status === "UNPAID").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Montant dû</p>
          <p className="text-3xl font-semibold text-orange-500 mt-1">{totalUnpaid.toFixed(2)} $</p>
        </div>
      </div>

      {/* FILTRES + SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher par numéro de facture ou commande..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm text-gray-700" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "PAID", "UNPAID", "DRAFT", "CANCELLED"].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterStatus === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {s === "ALL" ? "Toutes" : STATUS_STYLES[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-3">N° Facture</th>
              <th className="pb-3">Commande</th>
              <th className="pb-3">Total HT</th>
              <th className="pb-3">Total TTC</th>
              <th className="pb-3">Échéance</th>
              <th className="pb-3">Statut</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-gray-400">Aucune facture trouvée</td></tr>
            ) : (
              filtered.map((inv) => {
                const st = STATUS_STYLES[inv.status] || { label: inv.status, color: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="py-3 font-mono font-medium text-blue-700">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-4 h-4" />
                        {inv.invoice_number || `#${inv.id}`}
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{inv.order_number || "—"}</td>
                    <td className="py-3 text-gray-700">{parseFloat(inv.total_ht || 0).toFixed(2)} $</td>
                    <td className="py-3 font-semibold text-gray-800">{parseFloat(inv.total_ttc || 0).toFixed(2)} $</td>
                    <td className="py-3 text-gray-500">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3 flex gap-3">
                      <button onClick={() => { setEditData({ ...inv }); setError(""); }}
                        className="text-blue-600 hover:underline text-sm">Modifier</button>
                      <button onClick={() => handleDelete(inv.id)}
                        className="text-red-600 hover:underline text-sm">Supprimer</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL CRÉER ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[440px]">
            <h2 className="text-xl font-semibold mb-4">Nouvelle facture</h2>
            <form onSubmit={handleCreate} className="space-y-4">

              {/* Sélection commande → auto-remplit les montants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commande liée *</label>
                <select value={formData.order_id}
                  onChange={(e) => handleOrderSelect(e.target.value)}
                  required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Sélectionner une commande --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} — {o.customer_name || "Client"} — {parseFloat(o.total_ttc || 0).toFixed(2)} $
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Facture *</label>
                <input type="text" value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  placeholder="Ex: FAC-2025-001" required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total HT ($)</label>
                  <input type="number" step="0.01" value={formData.total_ht}
                    onChange={(e) => setFormData({ ...formData, total_ht: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total TTC ($)</label>
                  <input type="number" step="0.01" value={formData.total_ttc}
                    onChange={(e) => setFormData({ ...formData, total_ttc: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <input type="date" value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-600">
                💡 La facture sera créée avec le statut <strong>Non payée</strong> par défaut.
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowAdd(false); setFormData(emptyForm); setError(""); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuler</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Création..." : "Créer la facture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL MODIFIER ── */}
      {editData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[420px]">
            <h2 className="text-xl font-semibold mb-1">Modifier la facture</h2>
            <p className="text-sm text-gray-500 mb-4 font-mono">{editData.invoice_number}</p>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none">
                  <option value="UNPAID">Non payée</option>
                  <option value="PAID">Payée</option>
                  <option value="DRAFT">Brouillon</option>
                  <option value="CANCELLED">Annulée</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total HT ($)</label>
                  <input type="number" step="0.01" value={editData.total_ht || ""}
                    onChange={(e) => setEditData({ ...editData, total_ht: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total TTC ($)</label>
                  <input type="number" step="0.01" value={editData.total_ttc || ""}
                    onChange={(e) => setEditData({ ...editData, total_ttc: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date échéance</label>
                <input type="date" value={editData.due_date ? editData.due_date.split("T")[0] : ""}
                  onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
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
