import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

const ROLE_REDIRECTS = {
  ADMIN: '/admin',
  PICKER: '/picker',
  MARKER: '/marker',
  CHECKER: '/checker',
  DRIVER: '/driver',
  ACCOUNTANT: '/accountant',
  SUPER_ADMIN: '/superadmin',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone || !form.password) return toast.error("Barcha maydonlarni to'ldiring");
    setLoading(true);
    try {
      const user = await login(form.phone, form.password);
      toast.success(`Xush kelibsiz, ${user.fullName}!`);
      navigate(ROLE_REDIRECTS[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login yoki parol xato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ERP Tizim</h1>
          <p className="text-gray-400 mt-1">Tizimga kirish</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Telefon raqam</label>
              <input
                type="tel"
                className="input"
                placeholder="+998901234567"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                autoFocus
              />
            </div>

            <div>
              <label className="label">Parol</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? 'Kirish...' : 'Kirish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
