// src/pages/Parametres.jsx
import { useState } from "react";
import axios from "axios";
import {
  UserCircleIcon, BellIcon, ShieldCheckIcon, InformationCircleIcon,
} from "@heroicons/react/24/outline";

const API_USERS = "http://localhost:4000/api/auth/users";

export default function Parametres() {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [activeTab, setActiveTab] = useState("profil");
  const [success, setSuccess]     = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const [profil, setProfil] = useState({
    username: currentUser.username || "",
    email:    currentUser.email    || "",
  });

  const [passwords, setPasswords] = useState({
    nouveau: "", confirm: "",
  });

  const [notifs, setNotifs] = useState({
    alertes_rupture: true, alertes_expiration: true, rapport_hebdo: false,
  });

  const showMsg = (msg) => { setSuccess(msg); setError("");   setTimeout(() => setSuccess(""), 3000); };
  const showErr = (msg) => { setError(msg);   setSuccess(""); setTimeout(() => setError(""), 4000);   };

  const handleSaveProfil = async () => {
    setLoading(true);
    try {
      const res = await axios.put(`${API_USERS}/${currentUser.id}`, {
        username: profil.username, email: profil.email, role: currentUser.role,
      });
      if (res.data.ok) {
        localStorage.setItem("user", JSON.stringify({ ...currentUser, username: profil.username, email: profil.email }));
        showMsg("Profil mis à jour ✓");
      }
    } catch (err) { showErr(err.response?.data?.error || "Erreur"); }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (!passwords.nouveau || passwords.nouveau.length < 6) return showErr("Minimum 6 caractères");
    if (passwords.nouveau !== passwords.confirm) return showErr("Les mots de passe ne correspondent pas");
    setLoading(true);
    try {
      const res = await axios.put(`${API_USERS}/${currentUser.id}/password`, { new_password: passwords.nouveau });
      if (res.data.ok) { setPasswords({ nouveau: "", confirm: "" }); showMsg("Mot de passe changé ✓"); }
    } catch (err) { showErr(err.response?.data?.error || "Erreur"); }
    setLoading(false);
  };

  const tabs = [
    { id: "profil",   label: "Profil",       icon: UserCircleIcon },
    { id: "securite", label: "Sécurité",      icon: ShieldCheckIcon },
    { id: "notifs",   label: "Notifications", icon: BellIcon },
    { id: "a-propos", label: "À propos",      icon: InformationCircleIcon },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Paramètres</h1>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">{success}</div>}
      {error   && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div className="flex gap-6">
        <div className="w-52 shrink-0">
          <div className="bg-white rounded-xl shadow border border-gray-100 p-2 space-y-1">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(""); setSuccess(""); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  activeTab === tab.id ? "bg-blue-600 text-white font-medium" : "text-gray-600 hover:bg-gray-100"
                }`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow border border-gray-100 p-6">

          {activeTab === "profil" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Informations du profil</h2>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                  {profil.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{profil.username}</p>
                  <p className="text-sm text-gray-500">{currentUser.role === "admin" ? "Administrateur" : "Employé"}</p>
                  <p className="text-sm text-gray-400">{profil.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
                  <input type="text" value={profil.username}
                    onChange={(e) => setProfil({ ...profil, username: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={profil.email}
                    onChange={(e) => setProfil({ ...profil, email: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                  <input type="text" value={currentUser.role === "admin" ? "Administrateur" : "Employé"} disabled
                    className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed" />
                </div>
              </div>
              <div className="pt-4 border-t">
                <button onClick={handleSaveProfil} disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Sauvegarde..." : "Sauvegarder"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "securite" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Changer le mot de passe</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-700">
                ⚠️ Après le changement, reconnectez-vous avec le nouveau mot de passe.
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe *</label>
                  <input type="password" value={passwords.nouveau}
                    onChange={(e) => setPasswords({ ...passwords, nouveau: e.target.value })}
                    placeholder="Min. 6 caractères"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer *</label>
                  <input type="password" value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    placeholder="Répétez le mot de passe"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="pt-4 border-t">
                <button onClick={handleChangePassword} disabled={loading}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Changement..." : "Changer le mot de passe"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "notifs" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Préférences de notifications</h2>
              <div className="space-y-3">
                {[
                  { key: "alertes_rupture",    label: "Alertes de rupture",      desc: "Produit sous le stock minimum" },
                  { key: "alertes_expiration", label: "Alertes d'expiration",    desc: "Lot expire dans les 7 jours" },
                  { key: "rapport_hebdo",      label: "Rapport hebdomadaire",    desc: "Résumé chaque semaine" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{n.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.desc}</p>
                    </div>
                    <button onClick={() => setNotifs({ ...notifs, [n.key]: !notifs[n.key] })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${notifs[n.key] ? "bg-blue-600" : "bg-gray-200"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifs[n.key] ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t">
                <button onClick={() => showMsg("Préférences sauvegardées ✓")}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Sauvegarder
                </button>
              </div>
            </div>
          )}

          {activeTab === "a-propos" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">À propos de Ocean Stock</h2>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-2xl font-bold text-blue-700">🌊 Ocean Stock</p>
                <p className="text-sm text-blue-600 mt-1">Système de gestion de stock — Projet personnel </p>
              </div>
              {[
                { label: "Version",          value: "1.0.0" },
                { label: "Backend",          value: "Node.js / Express / MySQL" },
                { label: "Frontend",         value: "React / Vite / Tailwind CSS" },
                { label: "Architecture",     value: "MVC REST API + JWT" },
                { label: "Base de données",  value: "stockdb (MariaDB)" },
                { label: "Port API",         value: "http://localhost:4000" },
                { label: "Authentification", value: "JWT — 8h de session" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
