// src/pages/Login.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error on change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:4000/api/auth/login",
        form,
        { timeout: 10000 } // Timeout 10s
      );

      if (res.data.ok) {
        // ✅ Stockage sécurisé
        localStorage.setItem("user", JSON.stringify(res.data.user));
        localStorage.setItem("token", res.data.token); // ✅ Vrai token JWT
        
        // ✅ Redirection unique
        navigate("/dashboard");
        
        // ✅ Force refresh si nécessaire
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      // 🛡️ Gestion d'erreur améliorée
      if (err.code === 'ECONNABORTED') {
        setError("Timeout - Le serveur met trop de temps à répondre");
      } else if (err.response?.status === 401) {
        setError("Email ou mot de passe incorrect");
      } else if (err.response?.status === 404) {
        setError("Utilisateur non trouvé");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Erreur de connexion au serveur");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        
        {/* Logo / Titre */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            OceanStock
          </h1>
          <p className="text-gray-600">Gestion de stock - Produits frais</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="admin@gmail.com"
              required
              autoComplete="email"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connexion...
              </span>
            ) : (
              "Se connecter"
            )}
          </button>

          {/* Info de test */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p className="mb-1">Compte de test :</p>
            <p className="font-mono">admin@gmail.com</p>
            <p className="font-mono">Mot de passe : 123456</p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Login;