import { useState, useEffect, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, Phone, Lock, QrCode, ArrowLeft,
  Scan, CheckCircle, Zap
} from 'lucide-react';

const ROLE_REDIRECTS = {
  ADMIN: '/admin', SUPER_ADMIN: '/superadmin',
  OPERATOR: '/operator',
  PICKER: '/picker', MARKER: '/marker',
  CHECKER: '/checker', DRIVER: '/driver',
  ACCOUNTANT1: '/accountant1', ACCOUNTANT2: '/accountant2',
  DOCUMENT: '/document',
};

// ─── Parol bilan kirish ────────────────────────────────────────────────────
function PasswordForm({ onSwitchQr }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ phone: '+998', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.phone.trim() || !form.password) {
      return toast.error("Barcha maydonlarni to'ldiring");
    }
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Phone */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(186,210,255,0.8)' }}>
          Telefon raqam
        </label>
        <div className="relative">
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(148,187,255,0.5)' }} />
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+998 90 123 45 67"
            autoFocus
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#fff',
            }}
            onFocus={e => {
              e.target.style.background = 'rgba(255,255,255,0.12)';
              e.target.style.borderColor = 'rgba(96,165,250,0.7)';
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
            }}
            onBlur={e => {
              e.target.style.background = 'rgba(255,255,255,0.08)';
              e.target.style.borderColor = 'rgba(255,255,255,0.14)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(186,210,255,0.8)' }}>
          Parol
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(148,187,255,0.5)' }} />
          <input
            type={showPass ? 'text' : 'password'}
            value={form.password}
            onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            placeholder="••••••••"
            className="w-full rounded-xl pl-10 pr-11 py-2.5 text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: '#fff',
            }}
            onFocus={e => {
              e.target.style.background = 'rgba(255,255,255,0.12)';
              e.target.style.borderColor = 'rgba(96,165,250,0.7)';
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
            }}
            onBlur={e => {
              e.target.style.background = 'rgba(255,255,255,0.08)';
              e.target.style.borderColor = 'rgba(255,255,255,0.14)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <button
            type="button"
            onClick={() => setShowPass(p => !p)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'rgba(148,187,255,0.5)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(186,210,255,0.9)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(148,187,255,0.5)'}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 mt-2"
        style={{
          background: loading
            ? 'rgba(59,130,246,0.5)'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          boxShadow: loading ? 'none' : '0 4px 20px rgba(59,130,246,0.35)',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
            Tekshirilmoqda...
          </>
        ) : 'Kirish'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 py-0.5">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        <span className="text-xs" style={{ color: 'rgba(148,187,255,0.4)' }}>yoki</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* QR button */}
      <button
        type="button"
        onClick={onSwitchQr}
        className="w-full rounded-xl py-2.5 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(186,210,255,0.8)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.color = 'rgba(186,210,255,0.8)';
        }}
      >
        <QrCode size={16} />
        QR skaner bilan kirish
      </button>
    </form>
  );
}

// ─── QR Skaner (jismoniy skaner qurilmasi) ─────────────────────────────────
function QrScannerPanel({ onBack }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const bufferRef = useRef('');
  const timerRef = useRef(null);
  const [status, setStatus] = useState('waiting'); // waiting | processing | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [lastScanned, setLastScanned] = useState('');

  // Jismoniy skaner — tez klaviatura kirish → Enter
  const processToken = async (token) => {
    if (!token || token.length < 6) return;
    setStatus('processing');
    setLastScanned(token.slice(0, 12) + '...');
    try {
      const res = await authAPI.qrLogin({ qrToken: token });
      const { token: jwt, user } = res.data;
      localStorage.setItem('erp_token', jwt);
      useAuthStore.setState({ token: jwt, user });
      setStatus('success');
      toast.success(`Xush kelibsiz, ${user.fullName}!`);
      setTimeout(() => navigate(ROLE_REDIRECTS[user.role] || '/'), 900);
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.response?.data?.message || 'QR kod xato yoki eskirgan');
      setTimeout(() => {
        setStatus('waiting');
        setErrorMsg('');
        setLastScanned('');
        if (inputRef.current) {
          inputRef.current.value = '';
          inputRef.current.focus();
        }
      }, 2500);
    }
  };

  useEffect(() => {
    // Hidden input ga fokus
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const val = bufferRef.current.trim();
      bufferRef.current = '';
      if (inputRef.current) inputRef.current.value = '';
      if (val) processToken(val);
    }
  };

  const handleInput = (e) => {
    bufferRef.current = e.target.value;
    // Auto-submit agar 36+ belgi bo'lsa (UUID format)
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const val = bufferRef.current.trim();
      if (val.length >= 20) {
        bufferRef.current = '';
        if (inputRef.current) inputRef.current.value = '';
        processToken(val);
      }
    }, 150);
  };

  return (
    <div className="flex flex-col items-center gap-5">

      {/* Hidden input — skaner shu yerga yozadi */}
      <input
        ref={inputRef}
        type="text"
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        autoFocus
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        aria-label="QR skaner uchun input"
        tabIndex={0}
      />

      {/* Scanner visual box */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="relative w-64 h-56 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer select-none"
        style={{
          background: status === 'success'
            ? 'rgba(16,52,32,0.95)'
            : status === 'error'
            ? 'rgba(52,16,16,0.95)'
            : status === 'processing'
            ? 'rgba(16,32,64,0.95)'
            : 'rgba(10,18,38,0.8)',
          border: status === 'success'
            ? '1.5px solid rgba(34,197,94,0.4)'
            : status === 'error'
            ? '1.5px solid rgba(239,68,68,0.4)'
            : '1.5px solid rgba(96,165,250,0.2)',
        }}
      >
        {/* Corner frames */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-3 left-3 w-6 h-6" style={{ borderTop: '2.5px solid #60a5fa', borderLeft: '2.5px solid #60a5fa', borderRadius: '3px 0 0 0', opacity: status === 'waiting' ? 1 : 0.3 }} />
          <div className="absolute top-3 right-3 w-6 h-6" style={{ borderTop: '2.5px solid #60a5fa', borderRight: '2.5px solid #60a5fa', borderRadius: '0 3px 0 0', opacity: status === 'waiting' ? 1 : 0.3 }} />
          <div className="absolute bottom-3 left-3 w-6 h-6" style={{ borderBottom: '2.5px solid #60a5fa', borderLeft: '2.5px solid #60a5fa', borderRadius: '0 0 0 3px', opacity: status === 'waiting' ? 1 : 0.3 }} />
          <div className="absolute bottom-3 right-3 w-6 h-6" style={{ borderBottom: '2.5px solid #60a5fa', borderRight: '2.5px solid #60a5fa', borderRadius: '0 0 3px 0', opacity: status === 'waiting' ? 1 : 0.3 }} />
        </div>

        {/* Waiting state */}
        {status === 'waiting' && (
          <>
            <div className="relative">
              <Scan size={44} style={{ color: 'rgba(96,165,250,0.6)' }} />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-semibold" style={{ color: 'rgba(186,210,255,0.9)' }}>
                Skanerga tayyor
              </p>
              <p className="text-xs mt-1" style={{ color: 'rgba(148,187,255,0.45)' }}>
                QR kodni skaner qurilmasiga ushlaing
              </p>
            </div>
            {/* Scan line */}
            <div className="absolute left-6 right-6 h-0.5 rounded-full" style={{
              background: 'linear-gradient(90deg, transparent, #60a5fa, transparent)',
              animation: 'scanLine 2s ease-in-out infinite',
              top: '40%',
            }} />
          </>
        )}

        {/* Processing */}
        {status === 'processing' && (
          <>
            <div className="w-12 h-12 border-2 rounded-full animate-spin"
              style={{ borderColor: 'rgba(96,165,250,0.2)', borderTopColor: '#60a5fa' }} />
            <div className="text-center px-4">
              <p className="text-sm font-semibold text-blue-300">Tekshirilmoqda...</p>
              {lastScanned && (
                <p className="text-xs mt-1 font-mono" style={{ color: 'rgba(148,187,255,0.5)' }}>
                  {lastScanned}
                </p>
              )}
            </div>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(34,197,94,0.2)' }}>
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <p className="text-sm font-semibold text-green-300">Kirish tasdiqlandi!</p>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
              style={{ background: 'rgba(239,68,68,0.2)' }}>
              ✕
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-semibold text-red-300">Xato!</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(252,165,165,0.7)' }}>{errorMsg}</p>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { top: 25%; opacity: 0.8; }
          50% { top: 70%; opacity: 0.3; }
        }
      `}</style>

      {/* Status hint */}
      <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(148,187,255,0.45)' }}>
        <Zap size={12} />
        <span>Skaner shu oynaga avtomatik yozadi</span>
      </div>

      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'rgba(96,165,250,0.7)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(96,165,250,0.7)'}
      >
        <ArrowLeft size={14} /> Parol bilan kirish
      </button>
    </div>
  );
}

// ─── Asosiy Login sahifasi ─────────────────────────────────────────────────
export default function LoginPage() {
  const [mode, setMode] = useState('password');

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#080e1e' }}>

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full"
          style={{ background: 'rgba(37,99,235,0.12)', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-48 -right-32 w-[450px] h-[450px] rounded-full"
          style={{ background: 'rgba(67,56,202,0.12)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: 'rgba(29,78,216,0.06)', filter: 'blur(100px)' }} />
        {/* Grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: '44px 44px',
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-5">

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', boxShadow: '0 8px 32px rgba(59,130,246,0.4)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z"
                stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M12 8V16M8 12H16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Farmatsiya ERP</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(148,187,255,0.5)' }}>
            Boshqaruv tizimiga kirish
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(0,0,0,0.3)' }}>
            {[
              { key: 'password', icon: Lock, label: 'Parol' },
              { key: 'qr', icon: QrCode, label: 'QR Skaner' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={mode === key ? {
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  color: '#fff',
                  boxShadow: '0 2px 12px rgba(59,130,246,0.4)',
                } : {
                  color: 'rgba(148,187,255,0.5)',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Panel */}
          {mode === 'password' ? (
            <PasswordForm onSwitchQr={() => setMode('qr')} />
          ) : (
            <QrScannerPanel onBack={() => setMode('password')} />
          )}
        </div>

        {/* Footer hints */}
        <div className="mt-5 text-center space-y-1.5">
          <p className="text-xs" style={{ color: 'rgba(148,187,255,0.3)' }}>
            QR skaner bilan: Picker · Marker · Checker
          </p>
          <p className="text-xs" style={{ color: 'rgba(148,187,255,0.22)' }}>
            Parol bilan: Admin · Operator · Haydovchi · Bugalter 1 · Bugalter 2 · Hujjatchi
          </p>
        </div>
      </div>
    </div>
  );
}
