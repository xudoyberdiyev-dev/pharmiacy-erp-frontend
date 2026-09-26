import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/errors';
import {
  User, Phone, Lock, Eye, EyeOff, CheckCircle2, XCircle, Circle,
  AlertTriangle, RefreshCw, X, Loader2, Save,
} from 'lucide-react';
import { COLOR } from './design/tokens';
import { Panel, PanelHeader } from './design/components';

// ─────────────────────────────────────────────────────────────────────────
// Operator Panel — Profil (Phase 07 of the redesign, final page)
//
// Source: design-import/"Operator Panel - Profile.dc.html". Same scope as
// before — read-only account info, three-field password change — no
// avatar, no preferences. Read-only rows are plain text on a white row,
// never a disabled-looking input (the design explicitly calls out a
// disabled input here as the wrong pattern, since it reads as "temporarily
// blocked" rather than "not yours to edit").
// ─────────────────────────────────────────────────────────────────────────

function PasswordField({ label, value, onChange, show, onToggleShow, error, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium flex items-center gap-1" style={{ color: '#334155' }}>{label} <span style={{ color: COLOR.danger }}>*</span></span>
      <span
        className="flex items-center gap-2 h-10 pl-3 pr-2 rounded-lg transition-colors"
        style={{ border: `1px solid ${error ? COLOR.danger : COLOR.borderStrong}`, background: COLOR.surface, boxShadow: error ? '0 0 0 3px rgba(220,38,38,0.12)' : 'none' }}
      >
        <Lock size={16} style={{ color: error ? COLOR.danger : COLOR.textTertiary }} className="shrink-0" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={label}
          className="flex-1 min-w-0 border-0 outline-none text-sm bg-transparent"
          style={{ color: COLOR.textPrimary }}
        />
        <button type="button" aria-label="Parolni ko'rsatish" onClick={onToggleShow} className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ color: error ? COLOR.danger : COLOR.textTertiary }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
      {error && <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: '#B91C1C' }}><AlertTriangle size={13} /> {error}</span>}
      {hint}
    </label>
  );
}

export default function OperatorProfile() {
  const { user } = useAuth();
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [pw, setPw] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const changePw = useMutation({
    mutationFn: () => authAPI.changePassword({ oldPassword: pw.oldPassword, newPassword: pw.newPassword }),
    onSuccess: () => {
      setSubmitError(null);
      setSuccess(true);
      setPw({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    },
    onError: e => setSubmitError(getErrorMessage(e)),
  });

  const lengthOk = pw.newPassword.length >= 8;
  const matchOk = pw.newPassword && pw.confirmPassword && pw.newPassword === pw.confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(false);
    const errs = {};
    if (!pw.oldPassword) errs.oldPassword = 'Joriy parolni kiriting.';
    if (!pw.newPassword) errs.newPassword = 'Yangi parolni kiriting.';
    else if (!lengthOk) errs.newPassword = 'Yangi parol kamida 8 ta belgidan iborat bo\'lishi kerak.';
    if (!pw.confirmPassword) errs.confirmPassword = 'Yangi parolni tasdiqlang.';
    else if (pw.newPassword && pw.confirmPassword !== pw.newPassword) errs.confirmPassword = 'Parollar mos kelmadi.';
    setErrors(errs);
    if (Object.keys(errs).length === 0) changePw.mutate();
  };

  const resetForm = () => { setPw({ oldPassword: '', newPassword: '', confirmPassword: '' }); setErrors({}); setSubmitError(null); };

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  const canSubmit = pw.oldPassword && pw.newPassword && pw.confirmPassword;

  return (
    <div className="max-w-[880px] mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <div className="text-[11px] font-semibold tracking-widest" style={{ color: COLOR.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>ACCOUNT SETTINGS</div>
        <h1 className="text-[30px] font-bold leading-tight" style={{ letterSpacing: '-0.025em', color: COLOR.textPrimary }}>Profil</h1>
        <p className="text-sm" style={{ color: COLOR.textSecondary }}>Hisob ma'lumotlaringizni ko'ring va parolingizni boshqaring.</p>
      </div>

      {/* ── Overview ── */}
      <Panel>
        <div className="p-5 flex flex-wrap gap-4 items-center">
          <span className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-semibold shrink-0" style={{ background: COLOR.primarySoft, border: `1px solid #C7D2FE`, color: COLOR.primaryHover }}>{initials}</span>
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <p className="text-lg font-semibold" style={{ letterSpacing: '-0.01em', color: COLOR.textPrimary }}>{user?.fullName}</p>
            <div className="flex flex-wrap gap-3 items-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold" style={{ background: COLOR.primarySoft, border: `1px solid #C7D2FE`, color: COLOR.primaryHover }}>
                <User size={12} /> Operator
              </span>
              <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: COLOR.textSecondary }}>
                <Phone size={14} style={{ color: COLOR.textMuted }} /> {user?.phone}
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs shrink-0" style={{ background: COLOR.mutedSurface, border: `1px solid ${COLOR.border}`, color: COLOR.textTertiary }}>
            <Lock size={14} /> Ma'lumotlar faqat ko'rish uchun
          </span>
        </div>
      </Panel>

      {/* ── Account info (read-only rows) ── */}
      <Panel>
        <PanelHeader title="Hisob ma'lumotlari" description="Bu ma'lumotlarni administrator o'zgartiradi." />
        <div className="px-5 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {[
            ['Ism', user?.fullName],
            ['Telefon raqami', user?.phone],
            ['Rol', 'Operator'],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-1 py-3" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
              <span className="text-xs" style={{ color: COLOR.textTertiary }}>{label}</span>
              <span className="text-sm font-semibold" style={{ color: COLOR.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{value || '—'}</span>
            </div>
          ))}
          <div className="flex flex-col gap-1 py-3" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
            <span className="text-xs" style={{ color: COLOR.textTertiary }}>Hisob holati</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold w-fit" style={{ background: COLOR.successSoft, border: `1px solid ${COLOR.successBorder}`, color: COLOR.success }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: COLOR.success }} /> Faol
            </span>
          </div>
        </div>
      </Panel>

      {/* ── Password change ── */}
      <Panel>
        <PanelHeader title="Parolni o'zgartirish" description="Hisobingiz xavfsizligi uchun yangi parolni kiriting." />
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          {success && (
            <div className="flex gap-3 items-start rounded-[10px] p-3.5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.successBorder}` }}>
              <CheckCircle2 size={18} style={{ color: COLOR.success }} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: COLOR.textPrimary }}>Parol muvaffaqiyatli yangilandi</p>
                <p className="text-[13px] mt-0.5" style={{ color: COLOR.textSecondary }}>Hisobingiz paroli yangilandi.</p>
              </div>
              <button type="button" aria-label="Yopish" onClick={() => setSuccess(false)} className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ color: COLOR.textTertiary }}><X size={16} /></button>
            </div>
          )}
          {submitError && (
            <div className="flex gap-3 items-start rounded-[10px] p-3.5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.dangerBorder}` }}>
              <AlertTriangle size={18} style={{ color: COLOR.danger }} className="shrink-0 mt-0.5" />
              <div className="flex-1 flex flex-col gap-2.5">
                <div>
                  <p className="text-sm font-semibold" style={{ color: COLOR.textPrimary }}>Parolni yangilashda xatolik yuz berdi</p>
                  <p className="text-[13px] mt-0.5" style={{ color: COLOR.textSecondary }}>{submitError}</p>
                </div>
                <button type="submit" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-semibold w-fit" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>
                  <RefreshCw size={14} /> Qayta urinish
                </button>
              </div>
            </div>
          )}

          <div className="max-w-[440px] flex flex-col gap-4">
            <PasswordField
              label="Joriy parol" value={pw.oldPassword} show={show.old}
              onChange={e => setPw(p => ({ ...p, oldPassword: e.target.value }))}
              onToggleShow={() => setShow(s => ({ ...s, old: !s.old }))}
              error={errors.oldPassword}
            />
            <PasswordField
              label="Yangi parol" value={pw.newPassword} show={show.new}
              onChange={e => setPw(p => ({ ...p, newPassword: e.target.value }))}
              onToggleShow={() => setShow(s => ({ ...s, new: !s.new }))}
              error={errors.newPassword}
              hint={
                <span className="flex flex-col gap-1.5 p-2.5 rounded-lg mt-0.5" style={{ border: `1px solid ${pw.newPassword && lengthOk ? COLOR.successBorder : COLOR.border}`, background: pw.newPassword && lengthOk ? COLOR.successSoft : COLOR.subtleSurface }}>
                  <span className="inline-flex items-center gap-2 text-xs" style={{ color: pw.newPassword ? (lengthOk ? COLOR.success : COLOR.danger) : COLOR.textTertiary }}>
                    {pw.newPassword ? (lengthOk ? <CheckCircle2 size={14} /> : <XCircle size={14} />) : <Circle size={14} style={{ color: COLOR.textMuted }} />}
                    Kamida 8 ta belgi{pw.newPassword && !lengthOk ? ` — hozir ${pw.newPassword.length} ta` : ''}
                  </span>
                  <span className="inline-flex items-center gap-2 text-xs" style={{ color: COLOR.textTertiary }}>
                    <Circle size={14} style={{ color: COLOR.textMuted }} /> Yangi parolni tasdiqlash kerak
                  </span>
                </span>
              }
            />
            <PasswordField
              label="Yangi parolni tasdiqlang" value={pw.confirmPassword} show={show.confirm}
              onChange={e => setPw(p => ({ ...p, confirmPassword: e.target.value }))}
              onToggleShow={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
              error={errors.confirmPassword}
              hint={pw.confirmPassword && !errors.confirmPassword && matchOk && (
                <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: COLOR.success }}><CheckCircle2 size={13} /> Parollar mos keldi</span>
              )}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-end pt-1" style={{ borderTop: `1px solid ${COLOR.borderSubtle}` }}>
            <button type="button" onClick={resetForm} className="h-10 px-4 rounded-lg text-sm font-semibold mt-4" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>
              Bekor qilish
            </button>
            <button
              type="submit" disabled={!canSubmit || changePw.isPending}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white mt-4 disabled:opacity-60"
              style={{ background: canSubmit ? COLOR.primary : COLOR.mutedSurface, color: canSubmit ? '#fff' : COLOR.textMuted, border: `1px solid ${canSubmit ? COLOR.primary : COLOR.border}` }}
            >
              {changePw.isPending ? <><Loader2 size={16} className="animate-spin" /> Yangilanmoqda...</> : <><Save size={16} /> Parolni yangilash</>}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
