// src/pages/Commandes.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/outline";

const API_ORDERS    = "http://localhost:4000/api/orders";
const API_CUSTOMERS = "http://localhost:4000/api/customers";
const API_PRODUCTS  = "http://localhost:4000/api/products";
const API_ITEMS     = "http://localhost:4000/api/order-items";

const STATUS_STYLES = {
  DRAFT:     { label: "Brouillon",  color: "bg-gray-100 text-gray-600" },
  CONFIRMED: { label: "Confirmée", color: "bg-blue-100 text-blue-700" },
  SHIPPED:   { label: "Expédiée",  color: "bg-yellow-100 text-yellow-700" },
  DELIVERED: { label: "Livrée",    color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Annulée",   color: "bg-red-100 text-red-700" },
};

const emptyForm = { customer_id: "", order_number: "", status: "DRAFT" };

export default function Commandes() {
  const [orders, setOrders]           = useState([]);
  const [customers, setCustomers]     = useState([]);
  const [products, setProducts]       = useState([]);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showAdd, setShowAdd]         = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);
  const [editOrder, setEditOrder]     = useState(null); // modal modifier infos commande
  const [formData, setFormData]       = useState(emptyForm);
  const [newItem, setNewItem]         = useState({ product_id: "", qty: "", unit_price: "", uom: "KG" });
  const [editItem, setEditItem]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");

  // ── FETCH ──
  const fetchOrders = async () => {
    try {
      const res = await axios.get(API_ORDERS);
      setOrders(res.data.orders || []);
    } catch (err) { console.error(err); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(API_CUSTOMERS);
      setCustomers(res.data.customers || []);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(API_PRODUCTS);
      setProducts(res.data.items || []);
    } catch (err) { console.error(err); }
  };

  const fetchOrderDetail = async (id) => {
    try {
      const res = await axios.get(`${API_ORDERS}/${id}/details`);
      setDetailOrder(res.data.order);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchOrders(); fetchCustomers(); fetchProducts(); }, []);

  const showMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleProductSelect = (product_id) => {
    const product = products.find(p => String(p.id) === String(product_id));
    setNewItem({ ...newItem, product_id, unit_price: product ? product.unit_price : "" });
  };

  // ── CRÉER COMMANDE ──
  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(API_ORDERS, formData);
      if (res.data.ok) {
        fetchOrders();
        setShowAdd(false);
        setFormData(emptyForm);
        showMsg("Commande créée ✓");
        fetchOrderDetail(res.data.order_id);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création");
    }
    setLoading(false);
  };

  // ── MODIFIER INFOS COMMANDE ──
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.put(`${API_ORDERS}/${editOrder.id}`, editOrder);
      if (res.data.ok) {
        fetchOrders();
        fetchOrderDetail(editOrder.id);
        setEditOrder(null);
        showMsg("Commande mise à jour ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur");
    }
    setLoading(false);
  };

  // ── SUPPRIMER COMMANDE ──
  const handleDeleteOrder = async (id) => {
    if (!window.confirm("Supprimer cette commande et tous ses produits ?")) return;
    try {
      await axios.delete(`${API_ORDERS}/${id}`);
      fetchOrders();
      setDetailOrder(null);
      showMsg("Commande supprimée ✓");
    } catch (err) { console.error(err); }
  };

  // ── CHANGER STATUT ──
  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`${API_ORDERS}/${detailOrder.id}`, { status: newStatus });
      fetchOrderDetail(detailOrder.id);
      fetchOrders();
      showMsg(`Statut → ${STATUS_STYLES[newStatus]?.label} ✓`);
    } catch (err) { console.error(err); }
  };

  // ── AJOUTER PRODUIT ──
  const handleAddItem = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(API_ITEMS, { ...newItem, order_id: detailOrder.id });
      if (res.data.ok) {
        fetchOrderDetail(detailOrder.id);
        fetchOrders();
        setNewItem({ product_id: "", qty: "", unit_price: "", uom: "KG" });
        showMsg("Produit ajouté ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout");
    }
  };

  // ── MODIFIER ITEM ──
  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_ITEMS}/${editItem.id}`, editItem);
      if (res.data.ok) {
        fetchOrderDetail(detailOrder.id);
        fetchOrders();
        setEditItem(null);
        showMsg("Article mis à jour ✓");
      }
    } catch (err) { console.error(err); }
  };

  // ── SUPPRIMER ITEM ──
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Supprimer ce produit de la commande ?")) return;
    try {
      await axios.delete(`${API_ITEMS}/${itemId}`);
      fetchOrderDetail(detailOrder.id);
      fetchOrders();
      showMsg("Produit retiré ✓");
    } catch (err) { console.error(err); }
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalCA = orders.reduce((a, o) => a + parseFloat(o.total_ttc || 0), 0);

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Commandes</h1>
        <button onClick={() => { setShowAdd(true); setError(""); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
          + Nouvelle commande
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total commandes</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Confirmées / Livrées</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">
            {orders.filter(o => o.status === "CONFIRMED" || o.status === "DELIVERED").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">En brouillon</p>
          <p className="text-3xl font-semibold text-gray-400 mt-1">
            {orders.filter(o => o.status === "DRAFT").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">CA total TTC</p>
          <p className="text-3xl font-semibold text-blue-600 mt-1">{totalCA.toFixed(2)} $</p>
        </div>
      </div>

      {/* FILTRES */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Rechercher par numéro ou client..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full outline-none text-sm text-gray-700" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["ALL", "DRAFT", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map((s) => (
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
              <th className="pb-3">N° Commande</th>
              <th className="pb-3">Client</th>
              <th className="pb-3">Total TTC</th>
              <th className="pb-3">Statut</th>
              <th className="pb-3">Date</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Aucune commande trouvée</td></tr>
            ) : (
              filtered.map((o) => {
                const st = STATUS_STYLES[o.status] || { label: o.status, color: "bg-gray-100 text-gray-600" };
                return (
                  <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="py-3 font-mono font-medium text-blue-700">{o.order_number}</td>
                    <td className="py-3 text-gray-800">{o.customer_name || "—"}</td>
                    <td className="py-3 font-semibold text-gray-800">{parseFloat(o.total_ttc || 0).toFixed(2)} $</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {/* Ouvrir détail */}
                        <button onClick={() => fetchOrderDetail(o.id)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition">
                          Ouvrir
                        </button>
                        {/* Modifier infos */}
                        <button onClick={() => { setEditOrder({ ...o }); setError(""); }}
                          className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
                          Modifier
                        </button>
                        {/* Supprimer */}
                        <button onClick={() => handleDeleteOrder(o.id)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition">
                          Supprimer
                        </button>
                      </div>
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
            <h2 className="text-xl font-semibold mb-4">Nouvelle commande</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                <select value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  required className="w-full p-2 border border-gray-300 rounded-lg outline-none">
                  <option value="">-- Sélectionner un client --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Commande *</label>
                <input type="text" value={formData.order_number}
                  onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
                  placeholder="Ex: CMD-2025-001" required
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut initial</label>
                <select value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none">
                  {Object.entries(STATUS_STYLES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-600">
                💡 Après création, ouvrez la commande pour ajouter les produits.
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowAdd(false); setError(""); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuler</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL MODIFIER INFOS COMMANDE ── */}
      {editOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[440px]">
            <h2 className="text-xl font-semibold mb-4">Modifier la commande</h2>
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select value={editOrder.customer_id || ""}
                  onChange={(e) => setEditOrder({ ...editOrder, customer_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none">
                  <option value="">-- Sélectionner --</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">N° Commande</label>
                <input type="text" value={editOrder.order_number || ""}
                  onChange={(e) => setEditOrder({ ...editOrder, order_number: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select value={editOrder.status || "DRAFT"}
                  onChange={(e) => setEditOrder({ ...editOrder, status: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none">
                  {Object.entries(STATUS_STYLES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setEditOrder(null); setError(""); }}
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

      {/* ── VUE DÉTAIL COMMANDE ── */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Commande {detailOrder.order_number}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Client : <span className="font-medium text-gray-700">{detailOrder.customer_name}</span>
                  {detailOrder.customer_email && (
                    <span className="ml-2 text-gray-400">— {detailOrder.customer_email}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Modifier depuis détail */}
                <button onClick={() => { setEditOrder({ ...detailOrder }); setError(""); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition">
                  <PencilIcon className="w-4 h-4" /> Modifier
                </button>
                {/* Supprimer depuis détail */}
                <button onClick={() => handleDeleteOrder(detailOrder.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition">
                  <TrashIcon className="w-4 h-4" /> Supprimer
                </button>
                <button onClick={() => setDetailOrder(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-light ml-2">✕</button>
              </div>
            </div>

            {/* Statut */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500 mr-1">Statut :</span>
                {Object.entries(STATUS_STYLES).map(([k, v]) => (
                  <button key={k} onClick={() => handleStatusChange(k)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-2 transition ${
                      detailOrder.status === k
                        ? `${v.color} border-current`
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Produits */}
            <div className="p-6">
              <h3 className="font-semibold text-gray-700 mb-3">Produits de la commande</h3>

              {detailOrder.items?.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-lg mb-4">
                  Aucun produit — ajoutez-en ci-dessous
                </div>
              ) : (
                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="border-b text-gray-500">
                      <th className="pb-2 text-left">Produit</th>
                      <th className="pb-2 text-right">Qté</th>
                      <th className="pb-2 text-right">Prix unit.</th>
                      <th className="pb-2 text-right">Sous-total</th>
                      <th className="pb-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailOrder.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 font-medium text-gray-800">{item.name}</td>
                        <td className="py-2 text-right text-gray-600">
                          {editItem?.id === item.id ? (
                            <input type="number" value={editItem.qty}
                              onChange={(e) => setEditItem({ ...editItem, qty: e.target.value })}
                              className="w-16 p-1 border rounded text-right text-sm" />
                          ) : `${item.qty} ${item.uom || "kg"}`}
                        </td>
                        <td className="py-2 text-right text-gray-600">
                          {editItem?.id === item.id ? (
                            <input type="number" step="0.01" value={editItem.unit_price}
                              onChange={(e) => setEditItem({ ...editItem, unit_price: e.target.value })}
                              className="w-20 p-1 border rounded text-right text-sm" />
                          ) : `${parseFloat(item.unit_price).toFixed(2)} $`}
                        </td>
                        <td className="py-2 text-right font-semibold text-gray-800">
                          {parseFloat(item.subtotal).toFixed(2)} $
                        </td>
                        <td className="py-2 text-right">
                          {editItem?.id === item.id ? (
                            <div className="flex justify-end gap-1">
                              <button onClick={handleUpdateItem}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-xs">✓</button>
                              <button onClick={() => setEditItem(null)}
                                className="px-2 py-1 bg-gray-200 rounded text-xs">✕</button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditItem({ ...item })}
                                className="text-blue-500 hover:text-blue-700">
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteItem(item.id)}
                                className="text-red-500 hover:text-red-700">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Totaux */}
              <div className="flex justify-end mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1 min-w-[220px]">
                  <div className="flex justify-between text-gray-500">
                    <span>Sous-total HT</span>
                    <span>{detailOrder.items?.reduce((a, i) => a + parseFloat(i.subtotal || 0), 0).toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>TVA (20%)</span>
                    <span>{(detailOrder.items?.reduce((a, i) => a + parseFloat(i.subtotal || 0), 0) * 0.2).toFixed(2)} $</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-800 border-t pt-1 text-base">
                    <span>Total TTC</span>
                    <span className="text-blue-700">{parseFloat(detailOrder.total_ttc || 0).toFixed(2)} $</span>
                  </div>
                </div>
              </div>

              {/* Ajouter produit */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" /> Ajouter un produit
                </h4>
                <form onSubmit={handleAddItem} className="grid grid-cols-4 gap-2 items-end">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Produit *</label>
                    <select value={newItem.product_id}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      required className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none">
                      <option value="">-- Sélectionner --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Qté (kg) *</label>
                    <input type="number" step="0.01" value={newItem.qty}
                      onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })}
                      placeholder="0" required
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Prix ($) *</label>
                    <input type="number" step="0.01" value={newItem.unit_price}
                      onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                      placeholder="0.00" required
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none" />
                  </div>
                  <div className="col-span-4 flex justify-end">
                    <button type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
                      <PlusIcon className="w-4 h-4" /> Ajouter
                    </button>
                  </div>
                </form>
                {error && <div className="mt-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <p className="text-xs text-gray-400">
                Créée le {detailOrder.created_at ? new Date(detailOrder.created_at).toLocaleDateString("fr-FR") : "—"}
              </p>
              <button onClick={() => setDetailOrder(null)}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
