// src/pages/Fournisseurs.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRole } from "../hooks/useRole";

const API = "http://localhost:4000/api/suppliers";
const emptyForm = { name: "", phone: "", email: "", address: "" };

const FIELDS = [
  { label: "Nom *",     name: "name",    type: "text",  placeholder: "Ex: OceanFish Inc.",       required: true },
  { label: "Téléphone", name: "phone",   type: "text",  placeholder: "Ex: +1 514 000 0000" },
  { label: "Email",     name: "email",   type: "email", placeholder: "Ex: contact@oceanfish.com" },
  { label: "Adresse",   name: "address", type: "text",  placeholder: "Ex: 123 Rue du Port" },
];

// ✅ Drawer EN DEHORS du composant principal
const Drawer = ({ open, onClose, title, subtitle, formId, onSubmit, data, onChange, loading, submitLabel }) => (
  <>
    <div
      className={`fixed inset-0 bg-[#0F2D4A] transition-opacity duration-300 z-40 ${
        open ? "opacity-20 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
    />
    <div className={`fixed top-0 right-0 h-full w-[440px] bg-white shadow-2xl z-50 flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${open ? "translate-x-0" : "translate-x-full"}`}>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-500">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <form id={formId} onSubmit={onSubmit} className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                name={f.name}
                type={f.type}
                value={data[f.name] || ""}
                onChange={onChange}
                placeholder={f.placeholder}
                required={f.required}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          ))}
        </form>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
        <button type="button" onClick={onClose}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition">
          Annuler
        </button>
        <button type="submit" form={formId} disabled={loading}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-medium">
          {loading ? "..." : submitLabel}
        </button>
      </div>
    </div>
  </>
);

// ✅ Composant principal
export default function Fournisseurs() {
  const { isAdmin } = useRole();
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch]       = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [editData, setEditData]   = useState(null);
  const [formData, setFormData]   = useState(emptyForm);
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState("");

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(API);
      setSuppliers(res.data.suppliers || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const showMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const openAdd  = () => { setFormData(emptyForm); setShowDrawer(true); };
  const closeAdd = () => { setShowDrawer(false); };
  const openEdit  = (s) => { setEditData({ ...s }); };
  const closeEdit = () => { setEditData(null); };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(API, formData);
      if (res.data.ok) { fetchSuppliers(); closeAdd(); showMsg("Fournisseur ajouté ✓"); }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put(`${API}/${editData.id}`, editData);
      if (res.data.ok) { fetchSuppliers(); closeEdit(); showMsg("Fournisseur mis à jour ✓"); }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`${API}/${id}`);
      fetchSuppliers();
      if (res.data.archived) {
        showMsg("Fournisseur archivé — historique conservé ✓");
      } else {
        showMsg("Fournisseur supprimé ✓");
      }
    } catch (err) { console.error(err); }
  };

  const filtered = suppliers.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Fournisseurs</h1>
        {isAdmin && (
          <button onClick={openAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
            + Ajouter un fournisseur
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Total fournisseurs</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{suppliers.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Avec email</p>
          <p className="text-3xl font-semibold text-blue-600 mt-1">{suppliers.filter(s => s.email).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Avec téléphone</p>
          <p className="text-3xl font-semibold text-green-600 mt-1">{suppliers.filter(s => s.phone).length}</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-3">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Rechercher un fournisseur..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-sm text-gray-700" />
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
              {isAdmin && <th className="pb-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">Aucun fournisseur trouvé</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                <td className="py-3 font-medium text-gray-800">{s.name}</td>
                <td className="py-3 text-gray-600">{s.phone || "—"}</td>
                <td className="py-3 text-gray-600">{s.email || "—"}</td>
                <td className="py-3 text-gray-600">{s.address || "—"}</td>
                {isAdmin && (
                  <td className="py-3 flex gap-3">
                    <button onClick={() => openEdit(s)} className="text-blue-600 hover:underline text-sm">Modifier</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline text-sm">Supprimer</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DRAWER AJOUTER */}
      <Drawer
        open={showDrawer}
        onClose={closeAdd}
        title="Ajouter un fournisseur"
        subtitle="Remplissez les informations du fournisseur"
        formId="form-add-supplier"
        onSubmit={handleAdd}
        data={formData}
        onChange={(e) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        loading={loading}
        submitLabel="Ajouter"
      />

      {/* DRAWER MODIFIER */}
      {editData && (
        <Drawer
          open={!!editData}
          onClose={closeEdit}
          title="Modifier le fournisseur"
          subtitle={`Modification de ${editData.name}`}
          formId="form-edit-supplier"
          onSubmit={handleUpdate}
          data={editData}
          onChange={(e) => setEditData({ ...editData, [e.target.name]: e.target.value })}
          loading={loading}
          submitLabel="Enregistrer"
        />
      )}

    </div>
  );
}
