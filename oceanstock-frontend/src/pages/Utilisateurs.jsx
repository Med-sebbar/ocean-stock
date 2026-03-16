// src/pages/Utilisateurs.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

const API     = "http://localhost:4000/api/auth/users";
const API_REG = "http://localhost:4000/api/auth/register";

const ROLE_STYLES = {
  admin:    { label: "Administrateur", color: "bg-purple-100 text-purple-700" },
  employee: { label: "Employé",        color: "bg-blue-100 text-blue-700" },
};

const emptyForm = { username: "", email: "", password: "", role: "employee" };

export default function Utilisateurs() {
  const [users, setUsers]             = useState([]);
  const [search, setSearch]           = useState("");
  const [showAdd, setShowAdd]         = useState(false);
  const [editData, setEditData]       = useState(null);
  const [resetData, setResetData]     = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [formData, setFormData]       = useState(emptyForm);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchUsers = async () => {
    try {
      const res = await axios.get(API);
      setUsers(res.data.users || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const showMsg = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  // AJOUTER
  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.post(API_REG, formData);
      if (res.data.ok) {
        fetchUsers();
        setShowAdd(false);
        setFormData(emptyForm);
        showMsg("Utilisateur créé avec succès ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création");
    }
    setLoading(false);
  };

  // MODIFIER
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.put(`${API}/${editData.id}`, editData);
      if (res.data.ok) {
        fetchUsers();
        setEditData(null);
        showMsg("Utilisateur mis à jour ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la modification");
    }
    setLoading(false);
  };

  // SUPPRIMER
  const handleDelete = async (id) => {
    if (id === currentUser.id)
      return alert("Vous ne pouvez pas supprimer votre propre compte !");
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await axios.delete(`${API}/${id}`);
      fetchUsers();
      showMsg("Utilisateur supprimé ✓");
    } catch (err) { console.error(err); }
  };

  // RESET MOT DE PASSE
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await axios.put(`${API}/${resetData.id}/password`, {
        new_password: newPassword,
      });
      if (res.data.ok) {
        setResetData(null);
        setNewPassword("");
        showMsg("Mot de passe réinitialisé ✓");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la réinitialisation");
    }
    setLoading(false);
  };

  const filtered = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Utilisateurs</h1>
        {currentUser.role === "admin" && (
          <button onClick={() => { setShowAdd(true); setError(""); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
            + Ajouter un utilisateur
          </button>
        )}
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
          <p className="text-sm text-gray-500">Total utilisateurs</p>
          <p className="text-3xl font-semibold text-gray-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Administrateurs</p>
          <p className="text-3xl font-semibold text-purple-600 mt-1">
            {users.filter(u => u.role === "admin").length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Employés</p>
          <p className="text-3xl font-semibold text-blue-600 mt-1">
            {users.filter(u => u.role === "employee").length}
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 flex items-center gap-3">
        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Rechercher un utilisateur..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none text-sm text-gray-700" />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-3">Utilisateur</th>
              <th className="pb-3">Email</th>
              <th className="pb-3">Rôle</th>
              <th className="pb-3">Créé le</th>
              {currentUser.role === "admin" && <th className="pb-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-gray-400">Aucun utilisateur trouvé</td></tr>
            ) : (
              filtered.map((u) => {
                const role = ROLE_STYLES[u.role] || { label: u.role, color: "bg-gray-100 text-gray-600" };
                const isMe = u.id === currentUser.id;
                return (
                  <tr key={u.id} className={`border-b last:border-0 transition ${isMe ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                          {u.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">
                          {u.username}
                          {isMe && <span className="ml-2 text-xs text-blue-400">(vous)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-gray-600">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${role.color}`}>
                        {role.label}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    {currentUser.role === "admin" && (
                      <td className="py-3 flex gap-3">
                        <button onClick={() => { setEditData({ ...u }); setError(""); }}
                          className="text-blue-600 hover:underline text-sm">Modifier</button>
                        <button onClick={() => { setResetData(u); setNewPassword(""); setError(""); }}
                          className="text-orange-500 hover:underline text-sm">Mot de passe</button>
                        {!isMe && (
                          <button onClick={() => handleDelete(u.id)}
                            className="text-red-600 hover:underline text-sm">Supprimer</button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL AJOUTER */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[420px]">
            <h2 className="text-xl font-semibold mb-4">Ajouter un utilisateur</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
                <input type="text" value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Ex: john.doe" required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ex: john@oceanstock.com" required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <input type="password" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 6 caractères" required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="employee">Employé</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowAdd(false); setFormData(emptyForm); setError(""); }}
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

      {/* MODAL MODIFIER */}
      {editData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[420px]">
            <h2 className="text-xl font-semibold mb-4">Modifier l'utilisateur</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur *</label>
                <input type="text" value={editData.username}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select value={editData.role}
                  onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="employee">Employé</option>
                  <option value="admin">Administrateur</option>
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

      {/* MODAL RESET MOT DE PASSE */}
      {resetData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[400px]">
            <h2 className="text-xl font-semibold mb-1">Réinitialiser le mot de passe</h2>
            <p className="text-sm text-gray-500 mb-4">
              Utilisateur : <span className="font-medium text-gray-800">{resetData.username}</span>
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe *</label>
                <input type="password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 caractères" required minLength={6}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setResetData(null); setNewPassword(""); setError(""); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Annuler</button>
                <button type="submit" disabled={loading}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                  {loading ? "Réinitialisation..." : "Réinitialiser"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
