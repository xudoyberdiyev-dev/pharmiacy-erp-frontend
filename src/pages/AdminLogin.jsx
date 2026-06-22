import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from "../layout/AuthProvider";
import "./css/login.css";
import { authAPI } from "../api/auth.api";

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const username = form.username.trim();
    const password = form.password;

    if (!username || !password) {
      setError("Iltimos, barcha maydonlarni to'ldiring");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { token, user } = await authAPI.adminLogin(username, password);
      loginAdmin(token, user);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login yoki parol noto'g'ri");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginCard">
        <div className="loginLogo">
          <div className="loginLogoIcon">
            <Activity size={22} />
          </div>
          <div>
            <h1 className="loginAppName">PharmaCRM</h1>
            <p className="loginAppSub">Admin paneli</p>
          </div>
        </div>

        <div className="loginDivider" />

        <h2 className="loginTitle">Xush kelibsiz</h2>
        <p className="loginDesc">Davom etish uchun hisobingizga kiring</p>

        {error && <div className="loginError" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="loginForm" noValidate>
          <div className="inputGroup">
            <label className="inputLabel" htmlFor="username">Foydalanuvchi nomi</label>
            <div className="inputWrap">
              <User size={16} className="inputIcon" />
              <input
                id="username"
                name="username"
                type="text"
                placeholder="admin"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                autoFocus
              />
            </div>
          </div>

          <div className="inputGroup">
            <label className="inputLabel" htmlFor="password">Parol</label>
            <div className="inputWrap">
              <Lock size={16} className="inputIcon" />
              <input
                id="password"
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="passToggle"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                aria-label={showPass ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="loginBtn" disabled={loading}>
            {loading ? <span className="spinner" /> : "Kirish"}
          </button>
        </form>

        <p className="loginFooter">
          Xodim sifatida kirish uchun{" "}
          <a href="/employee-login">QR kod skanerlash</a> sahifasiga o'ting
        </p>
      </div>
    </div>
  );
}