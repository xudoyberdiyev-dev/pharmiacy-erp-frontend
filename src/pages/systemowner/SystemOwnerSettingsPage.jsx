import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { Settings, KeyRound, ShieldCheck, ArrowLeft } from 'lucide-react';

const RESEND_SECONDS = 30;

function OtpStep({ pending, onBack, onDone }) {
  const [code, setCode] = useState('');
  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendSeconds]);

  const confirmMutation = useMutation({
    mutationFn: () => authAPI.confirmCredentialChange({ code: code.trim() }),
    onSuccess: (res) => {
      toast.success('Login ma\'lumotlari yangilandi');
      onDone(res.data.user);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const resendMutation = useMutation({
    mutationFn: () => authAPI.requestCredentialChange(pending),
    onSuccess: () => {
      toast.success('Yangi kod yuborildi');
      setResendSeconds(RESEND_SECONDS);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
        <ShieldCheck size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Telegramga 6 xonali tasdiqlash kodi yuborildi. Kod 5 daqiqa amal qiladi.
        </p>
      </div>

      <div>
        <label className="label">Tasdiqlash kodi</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          autoFocus
          className="input text-center text-lg font-black tracking-[0.3em]"
        />
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
          <ArrowLeft size={14} /> Orqaga
        </button>
        <button
          onClick={() => confirmMutation.mutate()}
          disabled={code.length !== 6 || confirmMutation.isPending}
          className="btn-primary flex-1 disabled:opacity-50"
        >
          {confirmMutation.isPending ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
        </button>
      </div>

      <button
        onClick={() => resendMutation.mutate()}
        disabled={resendSeconds > 0 || resendMutation.isPending}
        className="text-xs font-semibold text-blue-600 disabled:opacity-40 disabled:text-gray-400 mx-auto block"
      >
        {resendSeconds > 0 ? `Qayta yuborish (${resendSeconds}s)` : 'Qayta yuborish'}
      </button>
    </div>
  );
}

export default function SystemOwnerSettingsPage() {
  const { user, updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pending, setPending] = useState(null);

  const requestMutation = useMutation({
    mutationFn: () => {
      const phoneChanged = newPhone.trim() && newPhone.trim() !== user?.phone;
      const passwordChanged = !!newPassword;
      const body = {
        currentPassword,
        newPhone: phoneChanged ? newPhone.trim() : undefined,
        newPassword: passwordChanged ? newPassword : undefined,
      };
      return authAPI.requestCredentialChange(body).then(() => body);
    },
    onSuccess: (body) => {
      toast.success('Tasdiqlash kodi Telegramga yuborildi');
      setPending(body);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentPassword) return toast.error('Joriy parolni kiriting');
    const phoneChanged = newPhone.trim() && newPhone.trim() !== user?.phone;
    if (!phoneChanged && !newPassword) {
      return toast.error("Yangi telefon yoki parol kiriting");
    }
    if (newPassword && newPassword.length < 6) {
      return toast.error('Yangi parol kamida 6 ta belgi bo\'lishi kerak');
    }
    if (newPassword && newPassword !== confirmNewPassword) {
      return toast.error('Yangi parollar mos kelmadi');
    }
    requestMutation.mutate();
  };

  const handleDone = (updatedUser) => {
    updateUser(updatedUser);
    setPending(null);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setNewPhone(updatedUser.phone);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Settings size={18} className="text-slate-700" />
          </div>
          Sozlamalar
        </h1>
        <p className="text-xs text-gray-400 mt-1 ml-12">
          Telefon raqam yoki parolni o'zgartirish Telegramga yuboriladigan tasdiqlash kodi bilan himoyalangan
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 max-w-md">
        {pending ? (
          <OtpStep pending={pending} onBack={() => setPending(null)} onDone={handleDone} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Joriy parol *</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="label">Yangi telefon</label>
              <input
                type="tel"
                className="input"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Yangi parol</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="O'zgartirmasangiz bo'sh qoldiring"
              />
            </div>
            <div>
              <label className="label">Yangi parolni takrorlang</label>
              <input
                type="password"
                className="input"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={!newPassword}
              />
            </div>
            <button
              type="submit"
              disabled={requestMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound size={15} />
              {requestMutation.isPending ? 'Yuborilmoqda...' : 'Kod yuborish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
