import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { User, Lock, Eye, EyeOff, Check, Shield, Phone, BadgeCheck } from 'lucide-react';

const inp = "w-full px-3.5 py-2.5 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 focus:bg-white transition-all pr-11";

export default function OperatorProfile() {
  const { user } = useAuth();
  const [tab, setTab] = useState('info');
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [pw, setPw] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const changePw = useMutation({
    mutationFn: () => authAPI.changePassword({ oldPassword: pw.oldPassword, newPassword: pw.newPassword }),
    onSuccess: () => { toast.success('Parol o\'zgartirildi'); setPw({ oldPassword: '', newPassword: '', confirmPassword: '' }); },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) return toast.error('Parollar mos kelmaydi');
    if (pw.newPassword.length < 6) return toast.error('Kamida 6 ta belgi bo\'lishi kerak');
    changePw.mutate();
  };

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="max-w-md mx-auto space-y-4">

      {/* Avatar + name */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-md shadow-blue-200 shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black text-gray-900 truncate">{user?.fullName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
              <BadgeCheck size={10} /> Operator
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-green-600">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Faol
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1 flex gap-1">
        {[
          { key: 'info', label: 'Ma\'lumotlar', icon: User },
          { key: 'password', label: 'Parol', icon: Lock },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {[
            { icon: User,   label: 'To\'liq ism',    value: user?.fullName },
            { icon: Phone,  label: 'Telefon',         value: user?.phone },
            { icon: Shield, label: 'Rol',             value: 'Operator' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-3.5">
              <Icon size={15} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{label}</p>
                <p className="text-sm font-semibold text-gray-900">{value || '—'}</p>
              </div>
            </div>
          ))}
          <div className="px-5 py-3.5">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              Ism va telefon raqamni o'zgartirish uchun admin bilan bog'laning.
            </p>
          </div>
        </div>
      )}

      {/* Password tab */}
      {tab === 'password' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          {[
            { k: 'oldPassword', label: 'Joriy parol', showK: 'old' },
            { k: 'newPassword', label: 'Yangi parol', showK: 'new' },
            { k: 'confirmPassword', label: 'Tasdiqlang', showK: 'confirm' },
          ].map(({ k, label, showK }) => (
            <div key={k}>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show[showK] ? 'text' : 'password'}
                  value={pw[k]}
                  onChange={e => setPw(p => ({ ...p, [k]: e.target.value }))}
                  required placeholder="••••••••"
                  className={inp}
                />
                <button type="button"
                  onClick={() => setShow(p => ({ ...p, [showK]: !p[showK] }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {show[showK] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {k === 'confirmPassword' && pw.newPassword && pw.confirmPassword && (
                <p className={`text-xs font-semibold mt-1 pl-0.5 flex items-center gap-1 ${pw.newPassword === pw.confirmPassword ? 'text-green-500' : 'text-red-400'}`}>
                  {pw.newPassword === pw.confirmPassword
                    ? <><Check size={11} strokeWidth={3} /> Mos keladi</>
                    : '✗ Mos kelmaydi'}
                </p>
              )}
            </div>
          ))}

          <button type="submit" disabled={changePw.isPending}
            className="w-full py-2.5 rounded-xl font-bold text-sm text-white mt-1
              bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
              shadow-md shadow-blue-200 hover:shadow-lg transition-all flex items-center justify-center gap-2
              disabled:opacity-60">
            {changePw.isPending
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</>
              : <><Check size={14} strokeWidth={2.5} /> Parolni saqlash</>}
          </button>
        </form>
      )}
    </div>
  );
}
