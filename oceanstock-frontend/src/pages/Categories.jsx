// src/pages/Categories.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const API = "http://localhost:4000/api/categorie";

const emptyForm = { name: "", description: "" };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch]         = useState("");
  const [showAdd, setShowAdd]       = useState(false);
  const [editData, setEditData]     = useState(null);
  const [formData, setFormData]     = useState(emptyForm);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const fetchCategories = async () => {
    try {
      const res = await axios.get(API);
      setCategories(res.data.categories || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const showMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(API, formData);
      if (res.data.ok) {
        fetchCategories();
        setShowAdd(false);
        setFormData(emptyForm);
        showMsg("Catégorie ajoutée ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout");
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.put(`${API}/${editData.id}`, editData);
      if (res.data.ok) {
        fetchCategories();
        setEditData(null);
        showMsg("Catégorie mise à jour ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la mise à jour");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette catégorie ?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchCategories();
      showMsg("Catégorie supprimée ✓");
    } catch (err) { console.error(err); }
  };

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Catégories</h1>
        <button onClick={() => { setShowAdd(true); setError(""); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
          + Ajouter une catégorie
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>
      )}

      <div className="bg-white rounded-xl shadow border border-gray-100 p-5 flex items-center gap-2">
        <p className="text-sm text-gray-500">Total catégories :</p>
        <p className="text-xl font-semibold text-blue-600">{categories.length}</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-3">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Rechercher une catégorie..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-sm text-gray-700" />
      </div>

      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-3">Nom</th>
              <th className="pb-3">Description</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={3} className="py-8 text-center text-gray-400">Aucune catégorie trouvée</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="py-3 text-gray-500">{c.description || "—"}</td>
                  <td className="py-3 flex gap-3">
                    <button onClick={() => { setEditData({ ...c }); setError(""); }}
                      className="text-blue-600 hover:underline text-sm">Modifier</button>
                    <button onClick={() => handleDelete(c.id)}
                      className="text-red-600 hover:underline text-sm">Supprimer</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL AJOUTER */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[400px]">
            <h2 className="text-xl font-semibold mb-4">Ajouter une catégorie</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input type="text" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Poissons" required
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description optionnelle..." rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg outline-none resize-none" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowAdd(false); setFormData(emptyForm); setError(""); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuler</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MODIFIER */}
      {editData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[400px]">
            <h2 className="text-xl font-semibold mb-4">Modifier la catégorie</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input type="text" value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required className="w-full p-2 border border-gray-300 rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={editData.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3} className="w-full p-2 border border-gray-300 rounded-lg outline-none resize-none" />
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
