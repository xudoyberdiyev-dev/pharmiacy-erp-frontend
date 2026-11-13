import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Package, ClipboardList, RotateCcw, MessageSquareWarning, History, PackageCheck,
  LogOut, PanelLeftClose, PanelLeftOpen, RefreshCw,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { C, BADGE_TONE, BP } from '../../pages/picker/design/tokens';
import { PICKER_CSS } from '../../pages/picker/design/ui';
import { useViewportWidth, useOnline, usePickerStats } from '../../pages/picker/lib/hooks';

// ─────────────────────────────────────────────────────────────────────────
// Terimchi paneli qobig'i. Bitta PICKER_NAV massividan uch xil navigatsiya:
//   ≥1280 — sidebar (≥1600 da kengaytirilgan, aks holda yig'ilgan; foydalanuvchi
//           tanlovi localStorage'da), 640–1279 — rail, <640 — pastki navigatsiya.
// Badge sonlari GET /picker/stats dan (bitta agregat so'rov).
// ─────────────────────────────────────────────────────────────────────────

const PICKER_NAV = [
  { id: 'available', group: 'Asosiy ish',          to: '/picker',          end: true, icon: Package,              label: 'Navbat',               short: 'Navbat',  title: 'Mavjud buyurtmalar',  badge: 'available',    tone: 'neutral' },
  { id: 'mine',      group: 'Asosiy ish',          to: '/picker/mine',     icon: ClipboardList,        label: 'Mening buyurtmalarim', short: 'Mening',  title: 'Mening buyurtmalarim', badge: 'mineActive',   tone: 'teal' },
  { id: 'returned',  group: 'Diqqat talab qiladi', to: '/picker/returned', icon: RotateCcw,            label: 'Qaytgan buyurtmalar',  short: 'Qaytgan', title: 'Qaytgan buyurtmalar',  badge: 'returned',     tone: 'warning' },
  { id: 'disputes',  group: 'Diqqat talab qiladi', to: '/picker/etirozli', icon: MessageSquareWarning, label: 'E’tirozlar',           short: 'E’tiroz', title: 'E’tirozlar',           badge: 'disputesOpen', tone: 'info' },
  { id: 'history',   group: 'Hisobotlar',          to: '/picker/late',     icon: History,              label: 'Tarix',                short: 'Tarix',   title: 'Tarix',                badge: null },
];

const COLLAPSE_KEY = 'picker.sidebar.collapsed';
const FONT_ID = 'picker-inter-font';

function readCollapsed() {
  try { const v = localStorage.getItem(COLLAPSE_KEY); return v === null ? null : v === 'true'; } catch { return null; }
}

function initials(name) {
  return (name || '?').split(' ').filter(Boolean).map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function formatPhone(p) {
  if (!p) return null;
  const d = String(p).replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('998')) return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`;
  return p;
}

// Badge holati: yuklanmoqda → skeleton, xato → «—», 0 → ko'rsatilmaydi
function badgeOf(item, stats) {
  if (!item.badge) return { show: false };
  if (stats.isLoading) return { loading: true };
  if (stats.isError || !stats.data?.counts) return { show: true, text: '—', error: true };
  const n = stats.data.counts[item.badge] ?? 0;
  return n > 0 ? { show: true, text: n > 99 ? '99+' : String(n), n } : { show: false, zero: true };
}

function ariaOf(item, b) {
  if (!item.badge) return item.title;
  if (b.loading) return `${item.title}, son yuklanmoqda`;
  if (b.error) return `${item.title}, son mavjud emas`;
  return b.n ? `${item.title}, ${b.n} ta` : `${item.title}, yo‘q`;
}

function NavBadge({ b, tone, variant }) {
  if (b.loading) {
    return <span aria-hidden="true" className="pk-skel" style={variant === 'expanded' ? { width: 28, height: 20, borderRadius: 999 } : { position: 'absolute', top: 6, right: 8, width: 18, height: 14, borderRadius: 999 }} />;
  }
  if (!b.show) return null;
  const t = b.error ? ['#F1F5F9', '#475569', '#64748B'] : BADGE_TONE[tone] || BADGE_TONE.neutral;
  if (variant === 'expanded') {
    return <span aria-hidden="true" className="tnum" style={{ minWidth: 24, height: 24, padding: '0 8px', borderRadius: 999, background: t[0], color: t[1], fontSize: 13, fontWeight: 600, display: 'grid', placeItems: 'center' }}>{b.text}</span>;
  }
  const pos = variant === 'bottom'
    ? { top: 2, left: 'calc(50% + 6px)' }
    : variant === 'rail' ? { top: 4, right: 6 } : { top: -2, right: -4 };
  const solid = variant === 'bottom';
  return (
    <span aria-hidden="true" className="tnum" style={{ position: 'absolute', ...pos, minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: solid ? t[2] : t[0], color: solid ? '#FFFFFF' : t[1], border: '2px solid #FFFFFF', fontSize: 12, fontWeight: 700, display: 'grid', placeItems: 'center', lineHeight: 1 }}>
      {b.text}
    </span>
  );
}

function navStyle(isActive) {
  return {
    background: isActive ? C.primarySoft : 'transparent',
    color: isActive ? C.primaryHover : C.text2,
    fontWeight: isActive ? 600 : 500,
    boxShadow: isActive ? `inset 0 0 0 1px ${C.primaryRing}` : 'none',
  };
}

// ── Foydalanuvchi menyusi (desktop popover / mobil pastki varaq) ─────────
function UserMenu({ user, mobile, onClose, onLogout, anchor }) {
  const ref = useRef(null);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    const t = setTimeout(() => ref.current?.querySelector('button')?.focus(), 20);
    return () => { document.removeEventListener('keydown', k); clearTimeout(t); };
  }, [onClose]);

  const phone = formatPhone(user?.phone);
  const head = (size) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span aria-hidden="true" style={{ width: size, height: size, flex: 'none', borderRadius: 999, background: C.primarySoft, color: C.primaryHover, fontWeight: 700, display: 'grid', placeItems: 'center', border: `1px solid ${C.primaryRing}` }}>{initials(user?.fullName)}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: mobile ? 16 : 15, overflowWrap: 'anywhere' }}>{user?.fullName}</div>
        <div style={{ fontSize: mobile ? 14 : 13, color: C.text2 }}>Terimchi{phone ? ` · ${phone}` : ''}</div>
      </div>
    </div>
  );

  if (mobile) {
    return (
      <>
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(15,23,42,.5)' }} />
        <div ref={ref} role="dialog" aria-modal="true" aria-label="Foydalanuvchi menyusi" style={{ position: 'fixed', zIndex: 71, left: 0, right: 0, bottom: 0, background: '#FFFFFF', borderRadius: '16px 16px 0 0', padding: '8px 16px 32px', display: 'flex', flexDirection: 'column', gap: 12, boxShadow: '0 -8px 32px rgba(15,23,42,.16)', animation: 'pk-up .2s ease-out' }}>
          <span aria-hidden="true" style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 999, background: C.borderStrong }} />
          <div style={{ padding: '8px 0' }}>{head(48)}</div>
          <button type="button" className="pk-btn" onClick={onLogout} style={{ height: 52, border: `1px solid ${C.dangerLine}`, background: C.dangerBg, color: C.danger, fontSize: 16 }}><LogOut size={20} aria-hidden="true" />Chiqish</button>
          <button type="button" className="pk-btn pk-outline" onClick={onClose} style={{ height: 48 }}>Yopish</button>
        </div>
      </>
    );
  }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70 }} />
      <div ref={ref} role="menu" aria-label="Foydalanuvchi menyusi" style={{ position: 'fixed', zIndex: 71, ...anchor, width: 288, background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: '0 16px 40px rgba(15,23,42,.16)', overflow: 'hidden' }}>
        <div style={{ padding: 16, borderBottom: `1px solid ${C.border}` }}>{head(44)}</div>
        <div style={{ padding: 8 }}>
          <button type="button" role="menuitem" className="pk-btn pk-logout" onClick={onLogout} style={{ width: '100%', justifyContent: 'flex-start', gap: 12, height: 48, padding: '0 12px', borderRadius: 8, border: 'none', background: 'transparent', color: C.danger, fontSize: 15 }}>
            <LogOut size={20} aria-hidden="true" />Chiqish
          </button>
        </div>
        <div style={{ padding: '10px 16px 14px', fontSize: 13, color: C.text2, background: C.canvas, borderTop: `1px solid ${C.border}` }}>Umumiy kompyuterda ishni tugatgach, albatta chiqing.</div>
      </div>
    </>
  );
}

export default function PickerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const vw = useViewportWidth();
  const online = useOnline();
  const stats = usePickerStats();
  const [pref, setPref] = useState(readCollapsed);
  const [menu, setMenu] = useState(false);

  // Inter shrifti faqat Picker qobig'i uchun yuklanadi
  useEffect(() => {
    if (document.getElementById(FONT_ID)) return;
    const l = document.createElement('link');
    l.id = FONT_ID; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap&subset=latin-ext';
    document.head.appendChild(l);
  }, []);

  useEffect(() => { setMenu(false); }, [location.pathname]);

  const mode = vw < BP.mobile ? 'mobile' : vw < BP.rail ? 'rail' : 'sidebar';
  const expanded = mode === 'sidebar' && (pref === null ? vw >= BP.wide : !pref);
  const toggleCollapse = () => {
    const next = expanded; // hozir yoyilgan bo'lsa — yig'iladi
    setPref(next);
    try { localStorage.setItem(COLLAPSE_KEY, String(next)); } catch { /* storage yo'q */ }
  };

  const doLogout = () => { setMenu(false); logout(); navigate('/login'); };
  const refreshAll = () => qc.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith('picker-') });

  const items = PICKER_NAV.map((it) => ({ ...it, b: badgeOf(it, stats) }));
  const groups = ['Asosiy ish', 'Diqqat talab qiladi', 'Hisobotlar'].map((g) => ({ label: g, items: items.filter((i) => i.group === g) }));
  const userInitials = initials(user?.fullName);
  const outletCtx = { vw, online, stats, user };

  return (
    <div className="picker-shell" style={{ height: '100dvh', display: 'flex', overflow: 'hidden', position: 'relative' }}>
      <style>{PICKER_CSS}</style>
      <a href="#picker-main" className="pk-focus" style={{ position: 'absolute', left: -9999, top: 8, zIndex: 100 }} onFocus={(e) => { e.currentTarget.style.left = '8px'; }} onBlur={(e) => { e.currentTarget.style.left = '-9999px'; }}>Asosiy kontentga o‘tish</a>

      {/* ── Sidebar (≥1280) ── */}
      {mode === 'sidebar' && (
        <aside aria-label="Terimchi paneli" style={{ width: expanded ? 248 : 76, flex: 'none', background: '#FFFFFF', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', transition: 'width .18s ease' }}>
          <div style={{ height: 64, flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: expanded ? '0 20px' : 0, justifyContent: expanded ? 'flex-start' : 'center', borderBottom: `1px solid ${C.border}` }}>
            <span role="img" aria-label="Pharmacy ERP — Terimchi paneli" style={{ width: 40, height: 40, flex: 'none', borderRadius: 10, background: C.primary, color: '#FFFFFF', display: 'grid', placeItems: 'center' }}><PackageCheck size={22} aria-hidden="true" /></span>
            {expanded && <div style={{ lineHeight: 1.25, minWidth: 0 }}><div style={{ fontSize: 13, color: C.text2 }}>Pharmacy ERP</div><div style={{ fontSize: 16, fontWeight: 700 }}>Terimchi paneli</div></div>}
          </div>
          <nav aria-label="Asosiy navigatsiya" style={{ flex: 1, overflowY: 'auto', padding: expanded ? '16px 12px' : '16px 14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {groups.map((g) => (
              <div key={g.label} role="group" aria-label={g.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {expanded
                  ? <div style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, padding: '0 12px 4px' }}>{g.label}</div>
                  : <div aria-hidden="true" style={{ height: 1, background: C.border, margin: '0 8px 8px' }} />}
                {g.items.map((it) => (
                  <NavLink
                    key={it.id} to={it.to} end={it.end} aria-label={ariaOf(it, it.b)} title={expanded ? undefined : it.title}
                    className="pk-nav"
                    style={({ isActive }) => ({
                      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center',
                      gap: 12, height: 48, width: expanded ? 'auto' : 48, alignSelf: expanded ? 'stretch' : 'center',
                      padding: expanded ? '0 12px' : 0, borderRadius: 10, fontSize: 15, ...navStyle(isActive),
                    })}
                  >
                    <it.icon size={20} style={{ flex: 'none' }} aria-hidden="true" />
                    {expanded && <span style={{ flex: 1, minWidth: 0 }}>{it.label}</span>}
                    <NavBadge b={it.b} tone={it.tone} variant={expanded ? 'expanded' : 'collapsed'} />
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          <div style={{ padding: expanded ? '8px 12px' : '8px 14px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'center' }}>
            <button type="button" className="pk-btn pk-ghost" onClick={toggleCollapse} aria-label={expanded ? 'Panelni yig‘ish' : 'Panelni yoyish'} aria-expanded={expanded}
              style={{ flex: 1, maxWidth: expanded ? '100%' : 48, justifyContent: expanded ? 'flex-start' : 'center', gap: 12, height: 48, padding: '0 12px', borderRadius: 10, color: C.text2, fontWeight: 500, fontSize: 14 }}>
              {expanded ? <PanelLeftClose size={20} aria-hidden="true" /> : <PanelLeftOpen size={20} aria-hidden="true" />}
              {expanded && <span>Panelni yig‘ish</span>}
            </button>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, padding: 12, display: 'flex', alignItems: 'center', gap: 10, justifyContent: expanded ? 'flex-start' : 'center' }}>
            {expanded ? (
              <>
                <span aria-hidden="true" style={{ width: 36, height: 36, flex: 'none', borderRadius: 999, background: C.primarySoft, color: C.primaryHover, fontWeight: 700, fontSize: 14, display: 'grid', placeItems: 'center', border: `1px solid ${C.primaryRing}` }}>{userInitials}</span>
                <div style={{ flex: 1, minWidth: 0, lineHeight: 1.25 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.fullName}</div>
                  <div style={{ fontSize: 13, color: C.text2 }}>Terimchi</div>
                </div>
                <button type="button" className="pk-icon pk-logout" onClick={doLogout} aria-label="Chiqish" style={{ border: 'none', background: 'transparent', color: C.text2 }}><LogOut size={20} aria-hidden="true" /></button>
              </>
            ) : (
              <button type="button" className="pk-focus" onClick={() => setMenu(true)} aria-haspopup="menu" aria-expanded={menu} aria-label={`Foydalanuvchi menyusi: ${user?.fullName || ''}, Terimchi`}
                style={{ width: 48, height: 48, borderRadius: 999, border: `1px solid ${C.border}`, background: C.primarySoft, color: C.primaryHover, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{userInitials}</button>
            )}
          </div>
        </aside>
      )}

      {/* ── Rail (640–1279) ── */}
      {mode === 'rail' && (
        <aside aria-label="Terimchi paneli" style={{ width: 80, flex: 'none', background: '#FFFFFF', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ height: 64, flex: 'none', display: 'grid', placeItems: 'center', borderBottom: `1px solid ${C.border}`, width: '100%' }}>
            <span role="img" aria-label="Pharmacy ERP — Terimchi paneli" style={{ width: 40, height: 40, borderRadius: 10, background: C.primary, color: '#FFFFFF', display: 'grid', placeItems: 'center' }}><PackageCheck size={22} aria-hidden="true" /></span>
          </div>
          <nav aria-label="Asosiy navigatsiya" style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4, width: '100%', overflowY: 'auto' }}>
            {items.map((it) => (
              <NavLink key={it.id} to={it.to} end={it.end} aria-label={ariaOf(it, it.b)} title={it.title} className="pk-nav"
                style={({ isActive }) => ({ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, height: 64, borderRadius: 12, ...navStyle(isActive) })}>
                <it.icon size={22} aria-hidden="true" />
                <span aria-hidden="true" style={{ fontSize: 12, lineHeight: 1.2 }}>{it.short}</span>
                <NavBadge b={it.b} tone={it.tone} variant="rail" />
              </NavLink>
            ))}
          </nav>
          <div style={{ padding: '12px 0 16px' }}>
            <button type="button" className="pk-focus" onClick={() => setMenu(true)} aria-haspopup="menu" aria-expanded={menu} aria-label={`Foydalanuvchi menyusi: ${user?.fullName || ''}, Terimchi`}
              style={{ width: 48, height: 48, borderRadius: 999, border: `1px solid ${C.border}`, background: C.primarySoft, color: C.primaryHover, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{userInitials}</button>
          </div>
        </aside>
      )}

      {/* ── Asosiy maydon ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {mode === 'mobile' && (
          <header style={{ height: 60, flex: 'none', background: '#FFFFFF', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 0 16px' }}>
            <span aria-hidden="true" style={{ width: 36, height: 36, flex: 'none', borderRadius: 10, background: C.primary, color: '#FFFFFF', display: 'grid', placeItems: 'center' }}><PackageCheck size={20} /></span>
            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}><div style={{ fontSize: 12, color: C.text2 }}>Pharmacy ERP</div><div style={{ fontSize: 15, fontWeight: 700 }}>Terimchi paneli</div></div>
            <button type="button" className="pk-icon" onClick={refreshAll} disabled={!online} aria-label="Ma’lumotlarni yangilash" style={{ border: 'none', background: 'transparent' }}><RefreshCw size={20} aria-hidden="true" /></button>
            <button type="button" className="pk-focus" onClick={() => setMenu(true)} aria-haspopup="dialog" aria-expanded={menu} aria-label={`Foydalanuvchi menyusi: ${user?.fullName || ''}, Terimchi`}
              style={{ width: 48, height: 48, flex: 'none', display: 'grid', placeItems: 'center', borderRadius: 999, border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 999, background: C.primarySoft, color: C.primaryHover, fontWeight: 700, fontSize: 14, display: 'grid', placeItems: 'center', border: `1px solid ${C.primaryRing}` }}>{userInitials}</span>
            </button>
          </header>
        )}
        <main id="picker-main" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingBottom: mode === 'mobile' ? 'calc(64px + env(safe-area-inset-bottom))' : 0 }}>
          <Outlet context={outletCtx} />
        </main>
      </div>

      {/* ── Mobil pastki navigatsiya (<640) ── */}
      {mode === 'mobile' && (
        <nav aria-label="Asosiy navigatsiya" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 30, background: '#FFFFFF', borderTop: `1px solid ${C.border}`, padding: '4px 4px calc(4px + env(safe-area-inset-bottom))', display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))' }}>
          {items.map((it) => (
            <NavLink key={it.id} to={it.to} end={it.end} aria-label={ariaOf(it, it.b)} className="pk-nav"
              style={({ isActive }) => ({ position: 'relative', minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, color: isActive ? C.primaryHover : C.text2, borderRadius: 10, background: 'transparent' })}>
              {({ isActive }) => (
                <>
                  <span aria-hidden="true" style={{ width: 48, height: 28, borderRadius: 999, background: isActive ? C.primarySoft : 'transparent', display: 'grid', placeItems: 'center' }}><it.icon size={22} /></span>
                  <span aria-hidden="true" style={{ fontSize: 12, fontWeight: isActive ? 600 : 500, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{it.short}</span>
                  <NavBadge b={it.b} tone={it.tone} variant="bottom" />
                </>
              )}
            </NavLink>
          ))}
        </nav>
      )}

      {menu && (
        <UserMenu
          user={user} mobile={mode === 'mobile'} onClose={() => setMenu(false)} onLogout={doLogout}
          anchor={mode === 'rail' ? { left: 88, bottom: 16 } : { left: expanded ? 12 : 84, bottom: 16 }}
        />
      )}
    </div>
  );
}
