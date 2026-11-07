import { LogOut, Phone, RefreshCw, TriangleAlert } from 'lucide-react';
import { useIsDesktop, useSummary } from './hooks/usePickerData';
import { usePicker } from './PickerContext';
import { Btn, Chip, IconBox, cx } from './design/ui';
import MobileHeader from './parts/MobileHeader';
import { initials, monthName } from './lib/format';

function Tile({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[13px] text-slate-600">{label}</p>
      <p className={cx('pk-nums mt-0.5 text-[26px] font-bold leading-tight', tone)}>{value}</p>
    </div>
  );
}

// Profil: ma'lumotlar, bugungi natija, oylik jarima va chiqish. (Parol almashtirish yo'q: Picker QR-nishon bilan kiradi.)
export default function PickerProfile() {
  const { user, logout, isOnline, refreshAll } = usePicker();
  const isDesktop = useIsDesktop();
  const { data: s } = useSummary();
  const penalty = s?.month?.points || 0;

  const identity = (
    <section className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[22px] font-bold text-white" aria-hidden="true">{initials(user?.fullName)}</span>
      <div className="min-w-0">
        <h2 className="truncate text-[20px] font-bold text-slate-900">{user?.fullName}</h2>
        {user?.phone && <p className="mt-0.5 flex items-center gap-1.5 text-[14px] text-slate-600"><Phone size={14} aria-hidden="true" /> {user.phone}</p>}
        <Chip tone="teal" className="mt-1.5">Terimchi (Picker)</Chip>
      </div>
    </section>
  );

  const today = (
    <section aria-label="Bugungi natija">
      <h3 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Bugungi natija</h3>
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Yakunlangan" value={s ? s.today.completed : '—'} />
        <Tile label="O'z vaqtida" value={s && s.today.onTimePercent !== null ? `${s.today.onTimePercent}%` : '—'} tone="text-green-700" />
        <Tile label="Kechikkan" value={s ? s.today.late : '—'} tone={s?.today.late > 0 ? 'text-red-700' : 'text-slate-900'} />
      </div>
    </section>
  );

  const penaltyCard = (
    <section className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <IconBox icon={TriangleAlert} tone="red" size={44} />
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-bold text-slate-900">Jarima ballari · {s ? monthName(s.month.key) : 'oy'}</p>
        <p className="text-[13.5px] text-slate-600">{s ? `${s.month.returns} marta qaytarildi · ${s.month.etirozlar} ta Checker etirozi` : '—'}</p>
      </div>
      <p className={cx('pk-nums text-[28px] font-bold', penalty > 0 ? 'text-red-700' : 'text-slate-400')}>{s ? (penalty > 0 ? `−${penalty}` : '0') : '—'}</p>
    </section>
  );

  const connection = (
    <section className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="flex items-center gap-2 text-[14px] text-slate-700" role="status">
        <span className={cx('h-2.5 w-2.5 shrink-0 rounded-full', isOnline ? 'bg-green-500' : 'bg-red-500')} aria-hidden="true" />
        {isOnline ? "Onlayn — ma'lumotlar avtomatik yangilanadi" : 'Oflayn — ulanish tiklanishi kutilmoqda'}
      </p>
      <Btn variant="secondary" size="sm" icon={RefreshCw} onClick={refreshAll}>Yangilash</Btn>
    </section>
  );

  const logoutBtn = <Btn variant="dangerSoft" size="lg" icon={LogOut} className="w-full" onClick={logout}>Chiqish</Btn>;

  if (isDesktop) {
    return (
      <div>
        <h1 className="mb-4 text-[26px] font-bold text-slate-900">Profil</h1>
        <div className="grid items-start gap-5" style={{ gridTemplateColumns: 'minmax(320px, 420px) minmax(0, 1fr)' }}>
          <div className="space-y-4">{identity}{connection}{logoutBtn}</div>
          <div className="space-y-4">{today}{penaltyCard}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="pb-28">
      <MobileHeader title="Profil" />
      <div className="space-y-4 px-4 pt-4">{identity}{today}{penaltyCard}{connection}{logoutBtn}</div>
    </div>
  );
}
