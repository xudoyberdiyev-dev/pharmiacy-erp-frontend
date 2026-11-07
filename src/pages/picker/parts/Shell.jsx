import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Box, ChevronDown, History, House, Inbox, LogOut, User } from 'lucide-react';
import { usePicker } from '../PickerContext';
import { useNow, useSummary } from '../hooks/usePickerData';
import { fmtClock, initials } from '../lib/format';
import { cx } from '../design/ui';
import BellButton from './Bell';
import GlobalSearch from './GlobalSearch';

function CountBadge({ n, tone = 'red' }) {
  if (!n) return null;
  return (
    <span className={cx('inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold leading-none text-white', tone === 'red' ? 'bg-red-600' : 'bg-slate-700')}>
      {n > 99 ? '99+' : n}
    </span>
  );
}

// Bugun faol: bosh sahifa, order va etiroz ekranlari
export function useActiveTab() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/picker/queue')) return 'queue';
  if (pathname.startsWith('/picker/history')) return 'history';
  if (pathname.startsWith('/picker/profile')) return 'profile';
  return 'today';
}

export function ConnStatus({ className = '' }) {
  const { isOnline } = usePicker();
  const now = useNow(15000);
  return (
    <span className={cx('inline-flex items-center gap-2 text-[13px] text-slate-700', className)} role="status">
      <span className={cx('h-2 w-2 rounded-full', isOnline ? 'bg-green-500' : 'bg-red-500')} aria-hidden="true" />
      {isOnline ? <>Onlayn · <span className="pk-nums">{fmtClock(now)}</span></> : 'Oflayn — ulanish tiklanmoqda'}
    </span>
  );
}

function UserMenu() {
  const { user, logout } = usePicker();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}
        className="flex h-10 items-center gap-2.5 rounded-xl border border-slate-200 bg-white pl-1.5 pr-3 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-[11px] font-bold text-white">{initials(user?.fullName)}</span>
        <span className="max-w-[160px] truncate text-[14px] font-semibold text-slate-900">{user?.fullName}</span>
        <ChevronDown size={16} className={cx('text-slate-500 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <p className="truncate text-[14px] font-semibold text-slate-900">{user?.fullName}</p>
            <p className="text-[12.5px] text-slate-500">{user?.phone}</p>
          </div>
          <Link to="/picker/profile" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-slate-700 hover:bg-slate-50">
            <User size={16} aria-hidden="true" /> Profil
          </Link>
          <button type="button" role="menuitem" onClick={logout} className="flex w-full items-center gap-3 px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50">
            <LogOut size={16} aria-hidden="true" /> Chiqish
          </button>
        </div>
      )}
    </div>
  );
}

// ── Desktop: yuqori panel ────────────────────────────────────────────────────
export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white">
      <div className="flex h-[62px] items-center gap-5 px-5">
        <Link to="/picker" className="flex shrink-0 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Pharmacy ERP — Picker">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-md shadow-teal-200/70" aria-hidden="true">
            <Box size={18} strokeWidth={2.2} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-bold text-slate-900">Pharmacy ERP</span>
            <span className="block text-[12px] text-slate-500">Picker</span>
          </span>
        </Link>
        <div className="flex flex-1 justify-center lg:justify-start lg:pl-4"><GlobalSearch /></div>
        <ConnStatus />
        <BellButton size={40} />
        <UserMenu />
      </div>
    </header>
  );
}

// ── Desktop: yon panel ───────────────────────────────────────────────────────
// 1024–1279px: ikon-rels (matnsiz, belgi burchakda); ≥1280px: to'liq yon panel
function SideItem({ to, icon: Icon, label, active, badge }) {
  return (
    <NavLink
      to={to} end title={label} aria-label={label}
      className={cx(
        'relative flex h-11 items-center justify-center gap-3 rounded-xl text-[15px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 xl:justify-start xl:px-4',
        active ? 'border border-slate-100 bg-white font-semibold text-blue-700 shadow-[0_1px_2px_rgba(15,23,42,0.06)]' : 'text-slate-700 hover:bg-white/70',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={20} strokeWidth={2} aria-hidden="true" />
      <span className="hidden flex-1 xl:block">{label}</span>
      {badge && <span className="absolute right-0.5 top-0.5 xl:static">{badge}</span>}
    </NavLink>
  );
}

export function Sidebar() {
  const tab = useActiveTab();
  const { data: s } = useSummary();
  const c = s?.counts;
  const penalty = s?.month?.points || 0;
  return (
    <aside className="sticky top-[82px] w-[56px] shrink-0 self-start xl:w-[192px]" aria-label="Bo'limlar">
      <nav className="space-y-1">
        <SideItem to="/picker" icon={House} label="Bugun" active={tab === 'today'} badge={<CountBadge n={c?.attention} />} />
        <SideItem
          to="/picker/queue" icon={Inbox} label="Navbat" active={tab === 'queue'}
          badge={c?.queue ? <><span className="pk-nums hidden text-[14px] text-slate-600 xl:inline">{c.queue}</span><span className="xl:hidden"><CountBadge n={c.queue} tone="slate" /></span></> : null}
        />
        <SideItem to="/picker/history" icon={History} label="Tarix" active={tab === 'history'} />
      </nav>
      <div className="my-5 hidden border-t border-slate-200/80 xl:block" />
      <section className="hidden rounded-2xl border border-slate-200 bg-white p-4 xl:block" aria-label="Bugungi natija">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-slate-600">Bugungi natija</h2>
        <dl className="mt-3 space-y-2.5 text-[14px]">
          <div className="flex items-center justify-between"><dt className="text-slate-600">Yakunlangan</dt><dd className="pk-nums font-bold text-slate-900">{s ? s.today.completed : '—'}</dd></div>
          <div className="flex items-center justify-between"><dt className="text-slate-600">O'z vaqtida</dt><dd className="pk-nums font-bold text-green-700">{s && s.today.onTimePercent !== null ? `${s.today.onTimePercent}%` : '—'}</dd></div>
          <div className="flex items-center justify-between"><dt className="text-slate-600">Jarima (oy)</dt><dd className={cx('pk-nums font-bold', penalty > 0 ? 'text-red-700' : 'text-slate-900')}>{s ? (penalty > 0 ? `−${penalty}` : '0') : '—'}</dd></div>
        </dl>
      </section>
    </aside>
  );
}

// ── Mobil: pastki tab bar ────────────────────────────────────────────────────
function TabLink({ to, label, active, children }) {
  return (
    <li>
      <NavLink to={to} end aria-current={active ? 'page' : undefined} className="flex flex-col items-center gap-0.5 px-1 pb-1.5 pt-2 focus:outline-none focus-visible:bg-slate-50">
        <span className={cx('relative inline-flex h-8 w-16 items-center justify-center rounded-full transition-colors', active ? 'bg-blue-100 text-blue-700' : 'text-slate-600')}>
          {children}
        </span>
        <span className={cx('text-[12px]', active ? 'font-bold text-blue-700' : 'font-medium text-slate-600')}>{label}</span>
      </NavLink>
    </li>
  );
}

export function TabBar() {
  const tab = useActiveTab();
  const { user } = usePicker();
  const { data: s } = useSummary();
  const c = s?.counts;
  const badgePos = 'absolute -right-0.5 -top-1';
  return (
    <nav aria-label="Asosiy bo'limlar" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-[560px] grid-cols-4">
        <TabLink to="/picker" label="Bugun" active={tab === 'today'}>
          <House size={22} strokeWidth={2} aria-hidden="true" />
          {c?.attention > 0 && <span className={badgePos}><CountBadge n={c.attention} /></span>}
        </TabLink>
        <TabLink to="/picker/queue" label="Navbat" active={tab === 'queue'}>
          <Inbox size={22} strokeWidth={2} aria-hidden="true" />
          {c?.queue > 0 && <span className={badgePos}><CountBadge n={c.queue} tone="slate" /></span>}
        </TabLink>
        <TabLink to="/picker/history" label="Tarix" active={tab === 'history'}>
          <History size={22} strokeWidth={2} aria-hidden="true" />
        </TabLink>
        <TabLink to="/picker/profile" label="Profil" active={tab === 'profile'}>
          <span className={cx('inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-700 text-[11px] font-bold text-white', tab === 'profile' && 'ring-2 ring-blue-400 ring-offset-1')}>
            {initials(user?.fullName)}
          </span>
        </TabLink>
      </ul>
    </nav>
  );
}
