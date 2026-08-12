import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { LogOut, Phone, User, Lock, Eye, EyeOff, Check } from 'lucide-react';

const inp = "w-full px-3.5 py-2.5 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:outline-none focus:border-[#3B5BFD] focus:bg-white transition-all pr-11";

export default function DriverProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-[#3B5BFD] flex items-center justify-center text-white text-2xl font-black mb-3">
          {initials}
        </div>
        <p className="font-black text-gray-900 text-lg">{user?.fullName}</p>
        <p className="text-sm text-gray-400">{user?.phone}</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-1 flex gap-1">
        {[
          { key: 'info', label: 'Ma\'lumotlar', icon: User },
          { key: 'password', label: 'Parol', icon: Lock },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === key ? 'bg-[#3B5BFD] text-white' : 'text-gray-500'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          <div className="flex items-center gap-3 p-4">
            <User size={17} className="text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Rol</p>
              <p className="text-sm font-bold text-gray-800">Haydovchi</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <Phone size={17} className="text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Telefon</p>
              <p className="text-sm font-bold text-gray-800">{user?.phone}</p>
            </div>
          </div>
          <div className="p-4">
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              Ism va telefon raqamni o'zgartirish uchun admin bilan bog'laning.
            </p>
          </div>
        </div>
      )}

      {tab === 'password' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
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
            className="w-full py-3 rounded-xl font-bold text-sm text-white mt-1 bg-[#3B5BFD] active:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
            {changePw.isPending
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</>
              : <><Check size={14} strokeWidth={2.5} /> Parolni saqlash</>}
          </button>
        </form>
      )}

      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-2xl py-3.5 text-sm font-bold active:bg-red-100 transition-colors"
      >
        <LogOut size={17} /> Chiqish
      </button>
    </div>
  );
}
