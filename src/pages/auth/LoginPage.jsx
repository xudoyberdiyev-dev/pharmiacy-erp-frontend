import { useState, useEffect, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Phone, Lock, QrCode, ArrowLeft, Scan, CheckCircle } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

class QrErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center gap-5">
          <div className="w-64 h-64 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-3">
            <Scan size={36} className="text-blue-400/40" />
            <p className="text-white/50 text-xs text-center px-6">Kamera ruxsati kerak yoki qurilmangiz QR skanerni qo'llab-quvvatlamaydi</p>
          </div>
          <button onClick={this.props.onBack} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-white transition-colors">
            <ArrowLeft size={15} /> Parol bilan kirish
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ROLE_REDIRECTS = {
  ADMIN: '/admin',
  PICKER: '/picker',
  MARKER: '/marker',
  CHECKER: '/checker',
  DRIVER: '/driver',
  ACCOUNTANT: '/accountant',
  SUPER_ADMIN: '/admin',
};

const ROLE_LABELS = {
  ADMIN: 'Administrator',
  SUPER_ADMIN: 'Super Administrator',
  PICKER: 'Picker',
  MARKER: 'Marker',
  CHECKER: 'Checker',
  DRIVER: 'Haydovchi',
  ACCOUNTANT: 'Bugalter',
};

// QR Scanner komponenti
function QrScanner({ onBack }) {
  const html5QrRef = useRef(null);
  const [status, setStatus] = useState('starting'); // starting | active | scanning | success | error | no-camera
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const startCamera = async (html5Qr) => {
    try {
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 200, height: 200 } },
        async (decodedText) => {
          try {
            await html5Qr.stop().catch(() => {});
            setStatus('scanning');
            const res = await authAPI.qrLogin({ qrToken: decodedText });
            const { token, user } = res.data;
            localStorage.setItem('erp_token', token);
            useAuthStore.setState({ token, user });
            setStatus('success');
            toast.success(`Xush kelibsiz, ${user.fullName}!`);
            setTimeout(() => navigate(ROLE_REDIRECTS[user.role] || '/'), 900);
          } catch (err) {
            setStatus('error');
            setErrorMsg(err.response?.data?.message || 'QR kod xato yoki eskirgan');
            setTimeout(async () => {
              setStatus('active');
              setErrorMsg('');
              await startCamera(html5Qr).catch(() => {});
            }, 2500);
          }
        },
        () => {}
      );
      setStatus('active');
    } catch {
      setStatus('no-camera');
    }
  };

  useEffect(() => {
    let html5Qr;
    try {
      html5Qr = new Html5Qrcode('qr-reader-box');
      html5QrRef.current = html5Qr;
      startCamera(html5Qr);
    } catch {
      setStatus('no-camera');
    }
    return () => {
      if (html5Qr) html5Qr.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-5">

      {/* Scanner box */}
      <div className="relative w-64 h-64 rounded-2xl overflow-hidden bg-black/40 border border-white/10">

        {/* Camera feed container */}
        <div id="qr-reader-box" className="w-full h-full" />

        {/* Corner frame overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {/* top-left */}
          <div className="absolute top-3 left-3 w-7 h-7" style={{ borderTop: '3px solid #60a5fa', borderLeft: '3px solid #60a5fa', borderRadius: '4px 0 0 0' }} />
          {/* top-right */}
          <div className="absolute top-3 right-3 w-7 h-7" style={{ borderTop: '3px solid #60a5fa', borderRight: '3px solid #60a5fa', borderRadius: '0 4px 0 0' }} />
          {/* bottom-left */}
          <div className="absolute bottom-3 left-3 w-7 h-7" style={{ borderBottom: '3px solid #60a5fa', borderLeft: '3px solid #60a5fa', borderRadius: '0 0 0 4px' }} />
          {/* bottom-right */}
          <div className="absolute bottom-3 right-3 w-7 h-7" style={{ borderBottom: '3px solid #60a5fa', borderRight: '3px solid #60a5fa', borderRadius: '0 0 4px 0' }} />

          {/* Scan line animation */}
          {status === 'active' && (
            <div
              className="absolute left-4 right-4 h-0.5 bg-blue-400/70"
              style={{ animation: 'scanLine 2s ease-in-out infinite', top: '30%' }}
            />
          )}
        </div>

        {/* Starting overlay */}
        {status === 'starting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
            <p className="text-white/60 text-xs">Kamera ochilmoqda...</p>
          </div>
        )}

        {/* Scanning */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
            <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
            <p className="text-white text-sm font-medium">Tekshirilmoqda...</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-green-900/90">
            <div className="w-14 h-14 rounded-full bg-green-500/30 flex items-center justify-center">
              <CheckCircle size={36} className="text-green-400" />
            </div>
            <p className="text-white text-sm font-semibold">Kirish tasdiqlandi!</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-red-900/90 p-4">
            <div className="w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center text-2xl">✕</div>
            <p className="text-white text-xs font-medium text-center">{errorMsg}</p>
          </div>
        )}

        {/* No camera */}
        {status === 'no-camera' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-4">
            <Scan size={32} className="text-blue-400/50" />
            <p className="text-white/60 text-xs text-center">Kamera mavjud emas yoki ruxsat berilmagan</p>
          </div>
        )}
      </div>

      {/* Scan line CSS */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 20%; opacity: 1; }
          50% { top: 75%; opacity: 0.5; }
        }
      `}</style>

      <p className="text-xs text-blue-300/50 text-center px-4">
        QR kodni kameraga to'g'rilang — avtomatik aniqlanadi
      </p>

      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={15} /> Parol bilan kirish
      </button>
    </div>
  );
}

// Parol bilan kirish
function PasswordForm({ onSwitchQr }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone.trim() || !form.password) return toast.error("Barcha maydonlarni to'ldiring");
    setLoading(true);
    try {
      const user = await login(form.phone.trim(), form.password);
      toast.success(`Xush kelibsiz, ${user.fullName}!`);
      navigate(ROLE_REDIRECTS[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login yoki parol xato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Phone */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-blue-100">Telefon raqam</label>
        <div className="relative">
          <Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/60" />
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+998 90 123 45 67"
            autoFocus
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-blue-100">Parol</label>
        <div className="relative">
          <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-300/60" />
          <input
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            placeholder="••••••••"
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-12 py-3 text-white placeholder-blue-300/40 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-200 transition-colors"
          >
            {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Kirish...
          </>
        ) : 'Kirish'}
      </button>

      {/* Divider */}
      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-blue-300/50">yoki</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* QR login button */}
      <button
        type="button"
        onClick={onSwitchQr}
        className="w-full bg-white/8 hover:bg-white/15 border border-white/15 text-blue-100 hover:text-white font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        <QrCode size={18} />
        QR kod bilan kirish
      </button>
    </form>
  );
}

export default function LoginPage() {
  const [mode, setMode] = useState('password'); // password | qr

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0f1e]">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-auto px-4">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-2xl shadow-blue-900/50"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Farmatsiya ERP</h1>
          <p className="text-blue-300/60 text-sm mt-1">Boshqaruv tizimiga kirish</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7 shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Mode toggle tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(0,0,0,0.25)' }}>
            <button
              onClick={() => setMode('password')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'password'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-blue-300/60 hover:text-blue-200'
              }`}
            >
              <Lock size={14} /> Parol
            </button>
            <button
              onClick={() => setMode('qr')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'qr'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'text-blue-300/60 hover:text-blue-200'
              }`}
            >
              <QrCode size={14} /> QR Kod
            </button>
          </div>

          {/* Content */}
          {mode === 'password' ? (
            <PasswordForm onSwitchQr={() => setMode('qr')} />
          ) : (
            <QrErrorBoundary onBack={() => setMode('password')}>
              <QrScanner onBack={() => setMode('password')} />
            </QrErrorBoundary>
          )}
        </div>

        {/* Role hints */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-xs text-blue-300/40">QR kod bilan kirish: Picker · Marker · Checker</p>
          <p className="text-xs text-blue-300/30">Parol bilan kirish: Admin · Haydovchi · Bugalter</p>
        </div>
      </div>
    </div>
  );
}
