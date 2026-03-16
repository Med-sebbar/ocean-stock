// src/pages/Clients.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const API = "http://localhost:4000/api/customers";

const emptyForm = { name: "", phone: "", email: "", address: "" };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await axios.get(API);
      setClients(res.data.customers || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchClients(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleEditChange = (e) => setEditData({ ...editData, [e.target.name]: e.target.value });

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(API, formData);
      if (res.data.ok) { fetchClients(); setShowModal(false); setFormData(emptyForm); }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put(`${API}/${editData.id}`, editData);
      if (res.data.ok) { fetchClients(); setEditData(null); }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce client ?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchClients();
    } catch (err) { console.error(err); }
  };

  const filtered = clients.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const fields = [
    { label: "Nom *", name: "name", type: "text", placeholder: "Ex: Restaurant Le Port", required: true },
    { label: "Téléphone", name: "phone", type: "text", placeholder: "Ex: +1 514 000 0000" },
    { label: "Email *", name: "email", type: "email", placeholder: "Ex: contact@resto.com", required: true },
    { label: "Adresse", name: "address", type: "text", placeholder: "Ex: 456 Rue du Marché" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Clients</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          + Ajouter un client
        </button>
      </div>

      {/* KPI rapide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total clients</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{clients.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Avec email</p>
          <p className="text-3xl font-semibold text-blue-600 mt-1">
            {clients.filter(c => c.email).length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Avec téléphone</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">
            {clients.filter(c => c.phone).length}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-3">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-sm text-gray-700"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-3">Nom</th>
              <th className="pb-3">Téléphone</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Adresse</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  Aucun client trouvé
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                  <td className="py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="py-3 text-gray-600">{c.phone || "—"}</td>
                  <td className="py-3 text-gray-600">{c.email || "—"}</td>
                  <td className="py-3 text-gray-600">{c.address || "—"}</td>
                  <td className="py-3 flex gap-3">
                    <button onClick={() => setEditData({ ...c })}
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

      {/* MODAL AJOUT */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[420px]">
            <h2 className="text-xl font-semibold mb-4">Ajouter un client</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input name={f.name} type={f.type} value={formData[f.name]}
                    onChange={handleChange} placeholder={f.placeholder} required={f.required}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowModal(false); setFormData(emptyForm); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">Annuler</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ÉDITION */}
      {editData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[420px]">
            <h2 className="text-xl font-semibold mb-4">Modifier le client</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              {fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input name={f.name} type={f.type} value={editData[f.name] || ""}
                    onChange={handleEditChange} required={f.required}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setEditData(null)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition">Annuler</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
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
