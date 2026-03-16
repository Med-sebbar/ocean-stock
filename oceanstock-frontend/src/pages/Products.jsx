// src/pages/Products.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const API          = "http://localhost:4000/api/products";
const API_CATEGORIES = "http://localhost:4000/api/categorie";

const emptyForm = {
  name: "",
  sku: "",
  category_id: "",
  unit_price: "",
  min_stock_kg: "",
  piece_weight_kg: 0,
  units_per_carton: 0,
  carton_weight_kg: 0,
};

export default function Products() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch]         = useState("");
  const [showModal, setShowModal]   = useState(false);
  const [editModal, setEditModal]   = useState(false);
  const [editData, setEditData]     = useState(null);
  const [formData, setFormData]     = useState(emptyForm);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  // ── FETCH ──
  const fetchProducts = async () => {
    try {
      const res = await axios.get(API);
      setProducts(res.data.items || []);
    } catch (err) { console.error(err); }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(API_CATEGORIES);
      setCategories(res.data.categories || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const showMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  // ── AJOUTER ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(API, formData);
      if (res.data.ok) {
        fetchProducts();
        setShowModal(false);
        setFormData(emptyForm);
        showMsg("Produit ajouté avec succès ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout");
    }
  };

  // ── MODIFIER ──
  const handleUpdate = async () => {
    setError("");
    try {
      const res = await axios.put(`${API}/${editData.id}`, editData);
      if (res.data.ok) {
        fetchProducts();
        setEditModal(false);
        showMsg("Produit mis à jour ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la mise à jour");
    }
  };

  // ── SUPPRIMER ──
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce produit ?")) return;
    try {
      const res = await axios.delete(`${API}/${id}`);
      if (res.data.ok) {
        fetchProducts();
        showMsg("Produit supprimé ✓");
      }
    } catch (err) { console.error(err); }
  };

  // ── FILTRAGE ──
  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Produits</h1>
        <button onClick={() => { setShowModal(true); setError(""); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
          + Ajouter un produit
        </button>
      </div>

      {/* MESSAGE SUCCÈS */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
          {success}
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total produits</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Catégories</p>
          <p className="text-3xl font-semibold text-blue-600 mt-1">{categories.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Sous stock minimum</p>
          <p className="text-3xl font-semibold text-red-500 mt-1">
            {products.filter(p => p.min_stock_kg > 0).length}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-3">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Rechercher par nom, SKU ou catégorie..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-sm text-gray-700" />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-3">SKU</th>
              <th className="pb-3">Nom du produit</th>
              <th className="pb-3">Catégorie</th>
              <th className="pb-3">Prix unitaire</th>
              <th className="pb-3">Stock min (kg)</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">Aucun produit trouvé</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="py-3 font-mono text-gray-500">{p.sku}</td>
                  <td className="py-3 font-medium text-gray-800">{p.name}</td>
                  <td className="py-3">
                    {p.category ? (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {p.category}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 text-gray-700">{parseFloat(p.unit_price || 0).toFixed(2)} $</td>
                  <td className="py-3">
                    {p.min_stock_kg > 0 ? (
                      <span className="text-green-600 font-semibold">{p.min_stock_kg} kg</span>
                    ) : (
                      <span className="text-red-500 font-semibold">Non défini</span>
                    )}
                  </td>
                  <td className="py-3 flex gap-3">
                    <button onClick={() => { setEditData({ ...p }); setEditModal(true); setError(""); }}
                      className="text-blue-600 hover:underline">Modifier</button>
                    <button onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:underline">Supprimer</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODAL AJOUTER ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[440px]">
            <h2 className="text-xl font-semibold mb-4">Ajouter un produit</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                <input name="name" type="text" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Crevettes 40/60" required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input name="sku" type="text" value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Ex: CR-4060" required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {/* ✅ SELECT CATÉGORIE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                <select name="category_id" value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Sélectionner une catégorie --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire ($) *</label>
                  <input name="unit_price" type="number" step="0.01" value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    placeholder="Ex: 12.50" required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock min (kg) *</label>
                  <input name="min_stock_kg" type="number" step="0.01" value={formData.min_stock_kg}
                    onChange={(e) => setFormData({ ...formData, min_stock_kg: e.target.value })}
                    placeholder="Ex: 50" required
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poids pièce (kg)</label>
                  <input name="piece_weight_kg" type="number" step="0.001" value={formData.piece_weight_kg}
                    onChange={(e) => setFormData({ ...formData, piece_weight_kg: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unités/carton</label>
                  <input name="units_per_carton" type="number" value={formData.units_per_carton}
                    onChange={(e) => setFormData({ ...formData, units_per_carton: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poids carton (kg)</label>
                  <input name="carton_weight_kg" type="number" step="0.001" value={formData.carton_weight_kg}
                    onChange={(e) => setFormData({ ...formData, carton_weight_kg: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setFormData(emptyForm); setError(""); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuler</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL MODIFIER ── */}
      {editModal && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[440px]">
            <h2 className="text-xl font-semibold mb-4">Modifier le produit</h2>
            <div className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit</label>
                <input type="text" value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input type="text" value={editData.sku}
                  onChange={(e) => setEditData({ ...editData, sku: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              {/* ✅ SELECT CATÉGORIE DANS MODIFIER */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select value={editData.category_id || ""}
                  onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">-- Sélectionner une catégorie --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire ($)</label>
                  <input type="number" step="0.01" value={editData.unit_price}
                    onChange={(e) => setEditData({ ...editData, unit_price: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock min (kg)</label>
                  <input type="number" step="0.01" value={editData.min_stock_kg}
                    onChange={(e) => setEditData({ ...editData, min_stock_kg: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => { setEditModal(false); setError(""); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuler</button>
                <button onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
