import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from "../layout/AuthProvider";
import "./login.css";

// ─── MOCK CREDENTIALS (API hali ulanmagan) ─────────────────
const MOCK_ADMIN = { username: "admin", password: "admin123" };

export default function AdminLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ── Mock login — backend ulanganda authAPI.loginAdmin(form) bilan almashtiriladi ──
    setTimeout(() => {
      if (
        form.username === MOCK_ADMIN.username &&
        form.password === MOCK_ADMIN.password
      ) {
        loginAdmin("mock-admin-token", {
          username: form.username,
          role: "admin",
        });
        navigate("/");
      } else {
        setError("Login yoki parol noto'g'ri (test: admin / admin123)");
      }
      setLoading(false);
    }, 500);
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

        {error && <div className="loginError">{error}</div>}

        <form onSubmit={handleSubmit} className="loginForm">
          <div className="inputGroup">
            <label className="inputLabel">Foydalanuvchi nomi</label>
            <div className="inputWrap">
              <User size={16} className="inputIcon" />
              <input
                name="username"
                type="text"
                placeholder="admin"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="inputGroup">
            <label className="inputLabel">Parol</label>
            <div className="inputWrap">
              <Lock size={16} className="inputIcon" />
              <input
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="passToggle"
                onClick={() => setShowPass((v) => !v)}
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
        <p className="loginHint">Test uchun: <b>admin</b> / <b>admin123</b></p>
      </div>
    </div>
  );
}