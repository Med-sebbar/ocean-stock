// src/pages/Achats.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRole } from "../hooks/useRole";

const API_PO        = "http://localhost:4000/api/purchase_orders";
const API_SUPPLIERS = "http://localhost:4000/api/suppliers";
const API_PRODUCTS  = "http://localhost:4000/api/products";

const STATUS_STYLES = {
  DRAFT:     { label: "Brouillon", color: "bg-gray-100 text-gray-600" },
  SENT:      { label: "Envoyé",    color: "bg-blue-100 text-blue-700" },
  RECEIVED:  { label: "Reçu",     color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Annulé",   color: "bg-red-100 text-red-700" },
};

const TABS = [
  { id: "actifs",   label: "En cours",  statuses: ["DRAFT", "SENT"] },
  { id: "recus",    label: "Reçus",     statuses: ["RECEIVED"] },
  { id: "annules",  label: "Annulés",   statuses: ["CANCELLED"] },
  { id: "tous",     label: "Tous",      statuses: [] },
];

const emptyForm = {
  supplier_id: "", po_number: "", status: "DRAFT",
  items: [{ product_id: "", qty: "", unit_price: "", uom: "KG" }],
};

export default function Achats() {
  const { isAdmin } = useRole();
  const [orders, setOrders]           = useState([]);
  const [suppliers, setSuppliers]     = useState([]);
  const [products, setProducts]       = useState([]);
  const [search, setSearch]           = useState("");
  const [activeTab, setActiveTab]     = useState("actifs");
  const [showDrawer, setShowDrawer]   = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [formData, setFormData]       = useState(emptyForm);

  const fetchOrders    = async () => { try { const r = await axios.get(API_PO);        setOrders(r.data.orders || []); } catch(e) {} };
  const fetchSuppliers = async () => { try { const r = await axios.get(API_SUPPLIERS); setSuppliers(r.data.suppliers || []); } catch(e) {} };
  const fetchProducts  = async () => { try { const r = await axios.get(API_PRODUCTS);  setProducts(r.data.items || []); } catch(e) {} };
  const fetchDetail    = async (id) => {
    try { const r = await axios.get(`${API_PO}/${id}`); setDetailOrder({ order: r.data.order, items: r.data.items }); } catch(e) {}
  };

  useEffect(() => { fetchOrders(); fetchSuppliers(); fetchProducts(); }, []);

  const showMsg  = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const addItem    = () => setFormData({ ...formData, items: [...formData.items, { product_id: "", qty: "", unit_price: "", uom: "KG" }] });
  const removeItem = (i) => setFormData({ ...formData, items: formData.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...formData.items]; items[i] = { ...items[i], [field]: val };
    setFormData({ ...formData, items });
  };

  const totalFormData = formData.items.reduce((acc, item) =>
    acc + (parseFloat(item.qty || 0) * parseFloat(item.unit_price || 0)), 0);

  const openDrawer  = () => { setFormData(emptyForm); setError(""); setShowDrawer(true); };
  const closeDrawer = () => { setShowDrawer(false); setError(""); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(API_PO, formData);
      if (res.data.ok) { fetchOrders(); closeDrawer(); showMsg("Bon d'achat créé ✓"); }
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
    setLoading(false);
  };

  const handleReceive = async (id) => {
    try {
      const res = await axios.put(`${API_PO}/${id}/receive`);
      if (res.data.ok) { fetchOrders(); showMsg("Commande reçue — stock mis à jour ✓"); }
    } catch(e) {}
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`${API_PO}/${id}`);
      fetchOrders();
      showMsg(res.data.archived ? "Commande archivée ✓" : "Commande supprimée ✓");
    } catch(e) {}
  };

  // Filtrer par onglet actif
  const currentTab = TABS.find(t => t.id === activeTab);
  const filtered = orders.filter((o) => {
    const matchTab    = currentTab.statuses.length === 0 || currentTab.statuses.includes(o.status);
    const matchSearch = o.po_number?.toLowerCase().includes(search.toLowerCase()) ||
                        o.supplier?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalAchats = orders.filter(o => o.status === "RECEIVED")
    .reduce((a, o) => a + parseFloat(o.total_amount || 0), 0);

  const tabCount = (tab) => {
    if (tab.statuses.length === 0) return orders.length;
    return orders.filter(o => tab.statuses.includes(o.status)).length;
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Achats fournisseurs</h1>
        {isAdmin && (
          <button onClick={openDrawer}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
            + Nouveau bon d'achat
          </button>
        )}
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>}

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total bons d'achat", value: orders.length,                                                      color: "text-gray-900" },
          { label: "En cours",           value: orders.filter(o => ["DRAFT","SENT"].includes(o.status)).length,     color: "text-yellow-500" },
          { label: "Reçus",              value: orders.filter(o => o.status === "RECEIVED").length,                 color: "text-green-600" },
          { label: "Total achats reçus", value: `${totalAchats.toFixed(2)} $`,                                      color: "text-blue-600" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <p className="text-sm text-gray-500">{k.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ONGLETS style Odoo */}
      <div className="bg-white rounded-xl shadow border border-gray-100">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-4">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"
              }`}>
                {tabCount(tab)}
              </span>
            </button>
          ))}

          {/* Recherche dans la barre d'onglets */}
          <div className="flex items-center gap-2 ml-auto py-2">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Rechercher..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm text-gray-700 w-48" />
          </div>
        </div>

        {/* TABLE */}
        <div className="p-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="pb-3">N° Bon</th>
                <th className="pb-3">Fournisseur</th>
                <th className="pb-3">Montant</th>
                <th className="pb-3">Statut</th>
                <th className="pb-3">Date</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">Aucun bon d'achat</td></tr>
              ) : filtered.map((o) => {
                const st = STATUS_STYLES[o.status] || { label: o.status, color: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="py-3 font-mono font-medium text-blue-700">{o.po_number || `#${o.id}`}</td>
                    <td className="py-3 text-gray-800">{o.supplier || "—"}</td>
                    <td className="py-3 font-semibold">{parseFloat(o.total_amount || 0).toFixed(2)} $</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="py-3 flex gap-2">
                      <button onClick={() => fetchDetail(o.id)} className="text-blue-600 hover:underline text-sm">Détails</button>
                      {isAdmin && o.status !== "RECEIVED" && o.status !== "CANCELLED" && (
                        <button onClick={() => handleReceive(o.id)} className="text-green-600 hover:underline text-sm">Réceptionner</button>
                      )}
                      {isAdmin && (o.status === "DRAFT" || o.status === "RECEIVED") && (
                        <button onClick={() => handleDelete(o.id)} className="text-red-500 hover:underline text-sm">
                          {o.status === "RECEIVED" ? "Archiver" : "Supprimer"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DRAWER NOUVEAU BON D'ACHAT ── */}
      <div
        className={`fixed inset-0 bg-[#0F2D4A] transition-opacity duration-300 z-40 ${
          showDrawer ? "opacity-20 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
      />
      <div className={`fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-50 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${showDrawer ? "translate-x-0" : "translate-x-full"}`}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Nouveau bon d'achat</h2>
            <p className="text-xs text-gray-400 mt-0.5">Remplissez les informations ci-dessous</p>
          </div>
          <button onClick={closeDrawer} className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="form-achat" onSubmit={handleAdd} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur *</label>
                <select value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  required className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Sélectionner --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Bon *</label>
                <input type="text" value={formData.po_number}
                  onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                  placeholder="Ex: PO-2025-001" required
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-gray-700">Produits *</label>
                <button type="button" onClick={addItem}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition">
                  + Ajouter une ligne
                </button>
              </div>
              <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 mb-1 px-1">
                <span className="col-span-5">Produit</span>
                <span className="col-span-3">Quantité (kg)</span>
                <span className="col-span-3">Prix ($)</span>
                <span className="col-span-1"></span>
              </div>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                    <select value={item.product_id}
                      onChange={(e) => updateItem(index, "product_id", e.target.value)}
                      required className="col-span-5 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                      <option value="">-- Produit --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input type="number" step="0.01" min="0" placeholder="0.00" value={item.qty}
                      onChange={(e) => updateItem(index, "qty", e.target.value)}
                      required className="col-span-3 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                    <input type="number" step="0.01" min="0" placeholder="0.00" value={item.unit_price}
                      onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                      required className="col-span-3 p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                    {formData.items.length > 1 ? (
                      <button type="button" onClick={() => removeItem(index)}
                        className="col-span-1 flex justify-center text-red-400 hover:text-red-600">
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    ) : <span className="col-span-1" />}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-end">
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm">
                  <span className="text-gray-500">Total : </span>
                  <span className="font-bold text-blue-700 text-base">{totalFormData.toFixed(2)} $</span>
                </div>
              </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={closeDrawer}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition">
            Annuler
          </button>
          <button type="submit" form="form-achat" disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
            {loading ? "Création..." : "Créer le bon d'achat"}
          </button>
        </div>
      </div>

      {/* MODAL DÉTAILS */}
      {detailOrder && (
        <div className="fixed inset-0 bg-[#0F2D4A] bg-opacity-30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[520px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Bon {detailOrder.order?.po_number || `#${detailOrder.order?.id}`}</h2>
              <button onClick={() => setDetailOrder(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Fournisseur</span>
                <span className="font-medium">{detailOrder.order?.supplier}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Statut</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[detailOrder.order?.status]?.color}`}>
                  {STATUS_STYLES[detailOrder.order?.status]?.label}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold text-blue-700">{parseFloat(detailOrder.order?.total_amount || 0).toFixed(2)} $</span>
              </div>
            </div>
            <h3 className="font-semibold text-gray-700 mb-2 text-sm">Produits commandés</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-gray-400 text-xs">
                  <th className="pb-2 text-left">Produit</th>
                  <th className="pb-2 text-right">Qté</th>
                  <th className="pb-2 text-right">Prix unit.</th>
                  <th className="pb-2 text-right">Sous-total</th>
                </tr>
              </thead>
              <tbody>
                {detailOrder.items?.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2">{item.product}</td>
                    <td className="py-2 text-right">{item.qty} {item.uom}</td>
                    <td className="py-2 text-right">{parseFloat(item.unit_price).toFixed(2)} $</td>
                    <td className="py-2 text-right font-medium">{parseFloat(item.subtotal).toFixed(2)} $</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end mt-4">
              <button onClick={() => setDetailOrder(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
