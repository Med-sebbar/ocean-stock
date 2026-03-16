// src/pages/Paiements.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, BanknotesIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

const API          = "http://localhost:4000/api/payments";
const API_INVOICES = "http://localhost:4000/api/invoices";

const METHOD_LABELS = {
  cash:     "Espèces",
  card:     "Carte",
  transfer: "Virement",
  check:    "Chèque",
};

const METHOD_STYLES = {
  cash:     "bg-green-100 text-green-700",
  card:     "bg-blue-100 text-blue-700",
  transfer: "bg-purple-100 text-purple-700",
  check:    "bg-yellow-100 text-yellow-700",
};

export default function Paiements() {
  const [payments, setPayments]         = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [search, setSearch]             = useState("");
  const [encaisserData, setEncaisserData] = useState(null); // modal encaissement rapide
  const [editData, setEditData]         = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");

  // ── FETCH ──
  const fetchPayments = async () => {
    try {
      const res = await axios.get(API);
      setPayments(res.data.items || []);
    } catch (err) { console.error(err); }
  };

  const fetchUnpaidInvoices = async () => {
    try {
      const res = await axios.get(API_INVOICES);
      const all = res.data.invoices || [];
      setUnpaidInvoices(all.filter(i => i.status === "UNPAID" || i.status === "DRAFT"));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchPayments(); fetchUnpaidInvoices(); }, []);

  const showMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 4000); };

  // Ouvrir modal encaissement avec montant pré-rempli
  const openEncaisser = (invoice) => {
    setEncaisserData({
      invoice_id:  invoice.id,
      invoice_number: invoice.invoice_number || `#${invoice.id}`,
      amount:      invoice.total_ttc || "",
      method:      "cash",
      received_at: new Date().toISOString().split("T")[0],
    });
    setError("");
  };

  // ── ENCAISSER ──
  const handleEncaisser = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(API, encaisserData);
      if (res.data.ok) {
        fetchPayments();
        fetchUnpaidInvoices();
        setEncaisserData(null);
        showMsg(res.data.message || "Paiement enregistré ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement");
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
        fetchPayments();
        setEditData(null);
        showMsg("Paiement mis à jour ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur");
    }
    setLoading(false);
  };

  // ── SUPPRIMER ──
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce paiement ?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchPayments();
      fetchUnpaidInvoices();
      showMsg("Paiement supprimé ✓");
    } catch (err) { console.error(err); }
  };

  const filtered = payments.filter((p) =>
    p.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.method?.toLowerCase().includes(search.toLowerCase())
  );

  const totalRecu      = payments.reduce((a, p) => a + parseFloat(p.amount || 0), 0);
  const totalCash      = payments.filter(p => p.method === "cash").reduce((a, p) => a + parseFloat(p.amount || 0), 0);
  const totalVirement  = payments.filter(p => p.method === "transfer").reduce((a, p) => a + parseFloat(p.amount || 0), 0);

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Paiements</h1>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <CheckCircleIcon className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total paiements</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{payments.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Montant total reçu</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">{totalRecu.toFixed(2)} $</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">En espèces</p>
          <p className="text-3xl font-semibold text-blue-600 mt-1">{totalCash.toFixed(2)} $</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Par virement</p>
          <p className="text-3xl font-semibold text-purple-600 mt-1">{totalVirement.toFixed(2)} $</p>
        </div>
      </div>

      {/* ── FACTURES À ENCAISSER (style Odoo) ── */}
      {unpaidInvoices.length > 0 && (
        <div className="bg-white rounded-xl shadow border border-orange-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BanknotesIcon className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-gray-800">
              Factures à encaisser
              <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs">
                {unpaidInvoices.length}
              </span>
            </h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-3">N° Facture</th>
                <th className="pb-3">Commande</th>
                <th className="pb-3">Montant TTC</th>
                <th className="pb-3">Échéance</th>
                <th className="pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {unpaidInvoices.map((inv) => {
                const isOverdue = inv.due_date && new Date(inv.due_date) < new Date();
                return (
                  <tr key={inv.id} className="border-b last:border-0 hover:bg-orange-50 transition">
                    <td className="py-3 font-mono font-medium text-blue-700">
                      {inv.invoice_number || `#${inv.id}`}
                    </td>
                    <td className="py-3 text-gray-600">{inv.order_number || "—"}</td>
                    <td className="py-3 font-semibold text-gray-800">
                      {parseFloat(inv.total_ttc || 0).toFixed(2)} $
                    </td>
                    <td className="py-3">
                      {inv.due_date ? (
                        <span className={isOverdue ? "text-red-600 font-semibold" : "text-gray-500"}>
                          {isOverdue ? "⚠ " : ""}{new Date(inv.due_date).toLocaleDateString("fr-FR")}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => openEncaisser(inv)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition">
                        <BanknotesIcon className="w-4 h-4" />
                        Encaisser
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-3">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Rechercher par facture ou mode de paiement..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-sm text-gray-700" />
      </div>

      {/* TABLE PAIEMENTS */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Historique des paiements</h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-3">Facture</th>
              <th className="pb-3">Montant</th>
              <th className="pb-3">Mode</th>
              <th className="pb-3">Date reçu</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">Aucun paiement enregistré</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="py-3 font-mono text-blue-700">
                    {p.invoice_number || `Facture #${p.invoice_id}`}
                  </td>
                  <td className="py-3 font-semibold text-green-600">
                    {parseFloat(p.amount).toFixed(2)} $
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${METHOD_STYLES[p.method] || "bg-gray-100 text-gray-600"}`}>
                      {METHOD_LABELS[p.method] || p.method}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">
                    {p.received_at ? new Date(p.received_at).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="py-3 flex gap-3">
                    <button onClick={() => { setEditData({ ...p }); setError(""); }}
                      className="text-blue-600 hover:underline text-sm">Modifier</button>
                    <button onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:underline text-sm">Supprimer</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL ENCAISSEMENT RAPIDE ── */}
      {encaisserData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[400px]">
            <div className="flex items-center gap-2 mb-1">
              <BanknotesIcon className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold">Encaisser le paiement</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Facture : <span className="font-mono font-medium text-blue-700">{encaisserData.invoice_number}</span>
            </p>
            <form onSubmit={handleEncaisser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant ($) *</label>
                <input type="number" step="0.01" value={encaisserData.amount}
                  onChange={(e) => setEncaisserData({ ...encaisserData, amount: e.target.value })}
                  required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-lg font-semibold" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode de paiement</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(METHOD_LABELS).map(([key, label]) => (
                    <button key={key} type="button"
                      onClick={() => setEncaisserData({ ...encaisserData, method: key })}
                      className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition ${
                        encaisserData.method === key
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      {key === "cash" ? "💵" : key === "card" ? "💳" : key === "transfer" ? "🏦" : "📝"} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de réception</label>
                <input type="date" value={encaisserData.received_at}
                  onChange={(e) => setEncaisserData({ ...encaisserData, received_at: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>

              <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-xs text-green-700">
                ✅ Si le montant couvre la totalité de la facture, elle sera automatiquement marquée comme <strong>Payée</strong>.
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setEncaisserData(null); setError(""); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuler</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                  <BanknotesIcon className="w-4 h-4" />
                  {loading ? "Enregistrement..." : "Confirmer le paiement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL MODIFIER ── */}
      {editData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[380px]">
            <h2 className="text-xl font-semibold mb-4">Modifier le paiement</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant ($) *</label>
                <input type="number" step="0.01" value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                  required className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                <select value={editData.method}
                  onChange={(e) => setEditData({ ...editData, method: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none">
                  {Object.entries(METHOD_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
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
