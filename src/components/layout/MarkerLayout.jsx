import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Tag, Package, ClipboardList, History, RotateCcw, MessagesSquare,
  Scale, Lock, PanelLeftClose, PanelLeftOpen, ChevronRight, ChevronDown, ChevronsUpDown, LogOut, User, Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { markerAPI } from '../../api';
import { C, FONT, SHADOW } from '../../pages/marker/design/tokens';

// ─────────────────────────────────────────────────────────────────────────
// Marker ilova qobig'i (Design System Phase 02): doimiy yon panel
// (264 / 72px, yig'iladi), 64px sarlavha, to'liq kenglikdagi ish maydoni.
// Marshrutlar, React Query kalitlari va refetch intervallari o'zgarmagan.
// ─────────────────────────────────────────────────────────────────────────

const SB = { bg: C.p950, line: C.p900, label: C.p300, text: C.p100, icon: C.p200 };

const NAV = [
  {
    id: 'ish', label: 'ISH OQIMI', title: 'Ish oqimi', items: [
      { to: '/marker', end: true, label: 'Mavjud buyurtmalar', icon: Package, countKey: 'available', tone: 'neutral' },
      { to: '/marker/mine', label: 'Mening buyurtmalarim', icon: ClipboardList, countKey: 'mine', tone: 'neutral' },
      { to: '/marker/history', label: 'Tarix', icon: History },
    ],
  },
  {
    id: 'etibor', label: 'E’TIBOR TALAB', title: 'E’tibor talab', items: [
      { to: '/marker/returned', label: 'Qaytgan buyurtmalar', icon: RotateCcw, countKey: 'returned', tone: 'warning' },
      // Phase 06: yagona "E'tirozlar" bandi. Ikkala mavjud route saqlanadi va sahifa
      // ichidagi tablar (MarkerEtirozlarTabs) orqali almashtiriladi.
      {
        to: '/marker/etirozli', label: 'E’tirozlar', icon: MessagesSquare, countKeys: ['etirozli', 'received'],
        match: ['/marker/etirozli', '/marker/etirozlar-received'],
        tabs: [{ to: '/marker/etirozli', label: 'Men bildirganlar' }, { to: '/marker/etirozlar-received', label: 'Menga bildirilganlar' }],
      },
    ],
  },
];

const fmt = (n, cap) => (n > cap ? `${cap}+` : String(n));
const hasPending = (o) => (o.etirozlar || []).some((e) => e.status === 'PENDING');
// "Men bildirganlar": order'da Tekshiruvchi→Marker e'tirozlari ham kelishi mumkin — faqat marker yuborganlari sanaladi
const hasPendingOwn = (o) => (o.etirozlar || []).some((e) => e.status === 'PENDING' && e.fromRole === 'MARKER');

function badgeTone(tone, active) {
  if (tone === 'critical') return [C.danger.main, '#FFFFFF'];
  if (tone === 'warning') return ['#FEF3C7', C.warning.text];
  return active ? ['#FFFFFF', C.p800] : ['rgba(255,255,255,0.14)', '#FFFFFF'];
}

function findActive(pathname) {
  for (const s of NAV) {
    for (const it of s.items) {
      if (it.tabs) {
        const tab = it.tabs.find((t) => pathname.startsWith(t.to));
        if (tab) return { section: s.title, parent: it.label, label: tab.label };
        continue;
      }
      const match = it.end ? pathname === it.to || pathname === `${it.to}/` : pathname.startsWith(it.to);
      if (match) return { section: s.title, parent: null, label: it.label };
    }
  }
  return { section: 'Ish oqimi', parent: null, label: 'Mavjud buyurtmalar' };
}

const readPref = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v === '1'; } catch { return d; } };
const writePref = (k, v) => { try { localStorage.setItem(k, v ? '1' : '0'); } catch { /* ixtiyoriy */ } };

const CSS = `
.mk-shell :focus{outline:none}
.mk-side nav{scrollbar-width:none}
.mk-side nav::-webkit-scrollbar{display:none}
.mk-side :focus-visible{box-shadow:0 0 0 2px ${SB.bg},0 0 0 4px ${C.p300}}
.mk-main :focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 4px ${C.p500}}
.mk-nav{position:relative;height:40px;border-radius:6px;display:flex;align-items:center;gap:10px;color:${SB.text};font:500 14px/20px ${FONT};text-decoration:none;transition:background .12s,color .12s;border:none;background:transparent;cursor:pointer}
.mk-nav:hover{background:rgba(255,255,255,0.08);color:#fff}
.mk-nav.active{background:${C.p700};color:#fff;font-weight:600}
.mk-nav .mk-ic{display:flex;color:${SB.icon}}
.mk-nav.active .mk-ic{color:#fff}
.mk-sbtn{border:none;border-radius:6px;background:transparent;color:${SB.icon};display:flex;align-items:center;justify-content:center;cursor:pointer}
.mk-sbtn:hover{background:rgba(255,255,255,0.08);color:#fff}
.mk-hbtn{border:1px solid transparent;border-radius:6px;background:transparent;cursor:pointer;display:flex;align-items:center}
.mk-hbtn:hover{background:${C.surface2}}
.mk-mi{width:100%;height:36px;padding:0 12px;border:none;border-radius:6px;background:transparent;color:${C.danger.text};font:500 14px/20px ${FONT};display:flex;align-items:center;gap:10px;cursor:pointer;text-align:left}
.mk-mi:hover,.mk-mi:focus-visible{background:${C.danger.bg};box-shadow:none}
.mk-ellipsis{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tnum{font-variant-numeric:tabular-nums}
`;

export default function MarkerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsedPref, setCollapsed] = useState(() => readPref('marker.sidebar.collapsed', false));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menu, setMenu] = useState(null); // 'header' | 'sidebar' | null
  const [tip, setTip] = useState(null);
  const [vw, setVw] = useState(() => window.innerWidth);
  const menuRef = useRef(null);
  const active = findActive(pathname);
  // < 900px: yon panel chiquvchi (drawer) bo'ladi va doim to'liq kenglikda ochiladi
  const isDrawer = vw < 900;
  const collapsed = !isDrawer && collapsedPref;
  const pad = vw >= 1440 ? 32 : vw < 640 ? 16 : 24;
  const expanded = !collapsed;

  // ── Mavjud so'rovlar: kalitlar va intervallar avvalgidek ──
  const { data: available } = useQuery({ queryKey: ['marker-available'], queryFn: markerAPI.getAvailable, refetchInterval: 10000, select: (r) => r.data.data || [] });
  const { data: mine } = useQuery({ queryKey: ['marker-mine'], queryFn: markerAPI.getMine, refetchInterval: 15000, select: (r) => r.data.data || [] });
  const { data: returned } = useQuery({ queryKey: ['marker-returned'], queryFn: markerAPI.getReturned, refetchInterval: 15000, select: (r) => r.data.data || [] });
  const { data: etirozli } = useQuery({ queryKey: ['marker-etirozli'], queryFn: markerAPI.getEtirozli, refetchInterval: 30000, select: (r) => r.data.data || [] });
  const { data: etirozliReceived } = useQuery({ queryKey: ['marker-etirozli-received'], queryFn: markerAPI.getEtirozliReceived, refetchInterval: 30000, select: (r) => r.data.data || [] });

  const counts = {
    available: available?.length || 0,
    mine: mine?.length || 0,
    returned: returned?.length || 0,
    etirozli: etirozli?.filter(hasPendingOwn).length || 0,
    received: etirozliReceived?.filter(hasPending).length || 0,
  };

  useEffect(() => {
    const prev = document.title;
    document.title = 'Pharmacy ERP — Marker';
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { setMenu(null); setDrawerOpen(false); }, [pathname]);
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);


  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(null); };
    const onKey = (e) => { if (e.key === 'Escape') setMenu(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menu]);

  const toggleCollapsed = () => {
    if (isDrawer) { setDrawerOpen(false); return; }
    const n = !collapsedPref; setCollapsed(n); setTip(null); writePref('marker.sidebar.collapsed', n);
  };
  const doLogout = () => { logout(); navigate('/login'); };

  const initials = user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const renderLink = (it, child = false) => {
    const n = it.countKeys ? it.countKeys.reduce((a, k) => a + (counts[k] || 0), 0) : it.countKey ? counts[it.countKey] : 0;
    const tone = it.countKeys ? (counts.received > 0 ? 'critical' : 'warning') : it.tone;
    const forced = it.match ? it.match.some((p) => pathname.startsWith(p)) : false;
    const has = n > 0;
    const tipLabel = child ? `E’tirozlar · ${it.label}` : it.label;
    return (
      <li key={it.to} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <NavLink
          to={it.to}
          end={it.end}
          className={({ isActive }) => `mk-nav${isActive || forced ? ' active' : ''}`}
          aria-label={tipLabel + (has ? `, ${n} ta` : '')}
          onMouseEnter={() => collapsed && setTip(it.to)}
          onMouseLeave={() => setTip(null)}
          onFocus={() => collapsed && setTip(it.to)}
          onBlur={() => setTip(null)}
          style={{ width: collapsed ? 48 : '100%', padding: collapsed ? 0 : child ? '0 10px 0 40px' : '0 10px', justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          {({ isActive: navActive }) => {
            const isActive = navActive || forced;
            const [bBg, bFg] = badgeTone(tone, isActive);
            return (
              <>
                <span className="mk-ic"><it.icon size={child && expanded ? 16 : 20} strokeWidth={child && expanded ? 2 : 1.75} aria-hidden="true" /></span>
                {expanded && <span className="mk-ellipsis" style={{ flex: 1, minWidth: 0 }}>{it.label}</span>}
                {expanded && has && (
                  <span className="tnum" style={{ flex: 'none', minWidth: 24, height: 20, padding: '0 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: `600 12px/16px ${FONT}`, background: bBg, color: bFg }}>{fmt(n, 999)}</span>
                )}
                {collapsed && has && (
                  <span aria-hidden="true" className="tnum" style={{ position: 'absolute', top: 3, right: 3, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: `600 12px/16px ${FONT}`, background: bBg, color: bFg, boxShadow: `0 0 0 2px ${SB.bg}` }}>{fmt(n, 99)}</span>
                )}
              </>
            );
          }}
        </NavLink>
        {collapsed && tip === it.to && <Tooltip label={tipLabel} count={has ? n : null} />}
      </li>
    );
  };

  return (
    <div className="mk-shell" style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden', background: C.bgApp, font: `400 14px/20px ${FONT}`, color: C.text }}>
      <style>{CSS}</style>

      {(!isDrawer || drawerOpen) && (
      <div style={isDrawer ? { position: 'fixed', inset: 0, zIndex: 50, display: 'flex' } : { display: 'contents' }}>
      <aside className="mk-side" aria-label="Asosiy navigatsiya" style={{ width: collapsed ? 72 : 264, flex: 'none', height: '100%', background: SB.bg, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 5, transition: 'width .18s cubic-bezier(.2,0,0,1)', boxShadow: isDrawer ? SHADOW.lg : 'none' }}>
        <div style={{ height: 64, flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: `1px solid ${SB.line}`, justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{ width: 36, height: 36, flex: 'none', borderRadius: 8, background: '#fff', color: C.p700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={20} strokeWidth={1.75} aria-hidden="true" />
          </div>
          {expanded && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                <span style={{ font: `600 14px/18px ${FONT}`, color: '#fff', whiteSpace: 'nowrap' }}>Pharmacy ERP</span>
                <span style={{ font: `600 12px/16px ${FONT}`, letterSpacing: '0.06em', color: SB.label }}>MARKER</span>
              </div>
              <button type="button" className="mk-sbtn" aria-label="Yon panelni yig‘ish" title="Yon panelni yig‘ish" aria-expanded="true" onClick={toggleCollapsed} style={{ width: 36, height: 36 }}>
                <PanelLeftClose size={20} strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
            <button type="button" className="mk-sbtn" aria-label="Yon panelni yoyish" title="Yon panelni yoyish" aria-expanded="false" onClick={toggleCollapsed} style={{ width: 48, height: 40 }}>
              <PanelLeftOpen size={20} strokeWidth={1.75} />
            </button>
          </div>
        )}

        <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '4px 8px 12px' }}>
          {NAV.map((s) => (
            <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 12 }}>
              {expanded
                ? <span id={`mk-nav-${s.id}`} style={{ font: `600 12px/16px ${FONT}`, letterSpacing: '0.06em', color: SB.label, padding: '4px 12px 6px', whiteSpace: 'nowrap' }}>{s.label}</span>
                : <span role="separator" aria-label={s.title} style={{ display: 'block', width: 24, height: 1, background: C.p500, margin: '8px auto 10px' }} />}
              <ul role="list" aria-labelledby={expanded ? `mk-nav-${s.id}` : undefined} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {s.items.map((it) => renderLink(it))}
              </ul>
            </div>
          ))}
        </nav>

        <div style={{ flex: 'none', borderTop: `1px solid ${SB.line}`, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }} ref={menu === 'sidebar' ? menuRef : undefined}>
          {expanded && <span style={{ font: `600 12px/16px ${FONT}`, letterSpacing: '0.06em', color: SB.label, padding: '4px 12px 6px' }}>STATISTIKA</span>}
          {/* Jarimalar: Marker uchun marshrut va backend ma'lumoti hali yo'q — havola emas */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <span
              role="link" aria-disabled="true" tabIndex={0}
              onMouseEnter={() => setTip('pen')} onMouseLeave={() => setTip(null)} onFocus={() => setTip('pen')} onBlur={() => setTip(null)}
              style={{ width: collapsed ? 48 : '100%', height: 40, padding: collapsed ? 0 : '0 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10, justifyContent: collapsed ? 'center' : 'flex-start', color: SB.label, font: `500 14px/20px ${FONT}`, cursor: 'not-allowed' }}
            >
              <Scale size={20} strokeWidth={1.75} aria-hidden="true" />
              {expanded && (
                <>
                  <span className="mk-ellipsis" style={{ flex: 1, minWidth: 0 }}>Jarimalar va ballar</span>
                  <Lock size={16} aria-hidden="true" style={{ flex: 'none' }} />
                </>
              )}
            </span>
            {tip === 'pen' && <Tooltip label="Jarimalar va ballar · Tez orada" note="Marker uchun backend ma'lumoti tayyor bo'lgach ulanadi." left={collapsed ? 60 : 252} />}
          </div>
          <button
            type="button" className="mk-sbtn"
            aria-label={`Profil menyusi: ${user?.fullName || ''}, Marker`} aria-haspopup="menu" aria-expanded={menu === 'sidebar'}
            onClick={() => setMenu((m) => (m === 'sidebar' ? null : 'sidebar'))}
            style={{ gap: 12, width: collapsed ? 48 : '100%', height: 52, margin: '0 auto', padding: collapsed ? 0 : '0 8px', justifyContent: collapsed ? 'center' : 'flex-start', color: '#fff', textAlign: 'left' }}
          >
            <Avatar initials={initials} />
            {expanded && (
              <>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span className="mk-ellipsis" style={{ font: `600 13px/18px ${FONT}` }}>{user?.fullName || '—'}</span>
                  <span style={{ font: `400 12px/16px ${FONT}`, color: C.p200 }}>Marker</span>
                </span>
                <ChevronsUpDown size={16} aria-hidden="true" style={{ color: SB.label }} />
              </>
            )}
          </button>
          {menu === 'sidebar' && <ProfileMenu user={user} onLogout={doLogout} style={collapsed ? { left: 64, bottom: 12 } : { left: 12, bottom: 'calc(100% - 8px)' }} />}
        </div>
      </aside>
      {isDrawer && <div aria-hidden="true" onClick={() => setDrawerOpen(false)} style={{ flex: 1, background: 'rgba(15,23,42,0.45)' }} />}
      </div>
      )}

      <div className="mk-main" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: 64, flex: 'none', background: '#fff', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, padding: `0 ${pad}px` }}>
          {isDrawer && (
            <button type="button" className="mk-hbtn" aria-label="Menyuni ochish" title="Menyuni ochish" onClick={() => setDrawerOpen(true)} style={{ width: 40, height: 40, justifyContent: 'center', color: C.text, flex: 'none' }}>
              <Menu size={20} aria-hidden="true" />
            </button>
          )}
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, font: `400 13px/20px ${FONT}`, color: C.text2, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {vw >= 640 && (
              <>
                <span>Marker</span>
                <ChevronRight size={16} aria-hidden="true" style={{ color: C.textDisabled, flex: 'none' }} />
                <span>{active.section}</span>
                {active.parent && (<><ChevronRight size={16} aria-hidden="true" style={{ color: C.textDisabled, flex: 'none' }} /><span>{active.parent}</span></>)}
                <ChevronRight size={16} aria-hidden="true" style={{ color: C.textDisabled, flex: 'none' }} />
              </>
            )}
            <span aria-current="page" className="mk-ellipsis" style={{ fontWeight: 500, color: C.text }}>{active.label}</span>
          </nav>
          <div style={{ marginLeft: 'auto', position: 'relative', flex: 'none' }} ref={menu === 'header' ? menuRef : undefined}>
            <button type="button" className="mk-hbtn" aria-label="Profil menyusi" aria-haspopup="menu" aria-expanded={menu === 'header'} onClick={() => setMenu((m) => (m === 'header' ? null : 'header'))} style={{ height: 44, padding: '0 8px 0 4px', gap: 10, color: C.text }}>
              <Avatar initials={initials} />
              {vw >= 640 && (
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <span style={{ font: `600 13px/18px ${FONT}` }}>{user?.fullName || '—'}</span>
                  <span style={{ font: `400 12px/16px ${FONT}`, color: C.text2 }}>Marker</span>
                </span>
              )}
              <ChevronDown size={16} aria-hidden="true" style={{ color: C.text2 }} />
            </button>
            {menu === 'header' && <ProfileMenu user={user} onLogout={doLogout} showRole style={{ right: 0, top: 'calc(100% + 6px)' }} />}
          </div>
        </header>

        <main id="marker-main" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: `24px ${pad}px ${pad}px`, flex: 1, minWidth: 0 }}>
            <Outlet context={{ pad, vw }} />
          </div>
        </main>
      </div>
    </div>
  );
}

function Avatar({ initials }) {
  return (
    <span style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', background: C.p100, color: C.p900, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 13px/1 ${FONT}` }}>
      {initials || <User size={16} aria-hidden="true" />}
    </span>
  );
}

function Tooltip({ label, count, note, left = 60 }) {
  return (
    <span role="tooltip" style={{ position: 'absolute', left, top: '50%', transform: 'translateY(-50%)', zIndex: 20, display: 'flex', flexDirection: note ? 'column' : 'row', gap: note ? 2 : 8, width: note ? 240 : undefined, whiteSpace: note ? 'normal' : 'nowrap', background: C.text, color: '#fff', font: `500 12px/16px ${FONT}`, padding: note ? '8px 10px' : '6px 8px', borderRadius: 4, boxShadow: SHADOW.md, pointerEvents: 'none' }}>
      <span style={{ fontWeight: note ? 600 : 500 }}>{label}</span>
      {count != null && <span className="tnum" style={{ color: C.borderStrong }}>{count}</span>}
      {note && <span style={{ color: C.borderStrong, fontWeight: 400 }}>{note}</span>}
    </span>
  );
}

function ProfileMenu({ user, onLogout, showRole, style }) {
  return (
    <div role="menu" aria-label="Profil" style={{ position: 'absolute', zIndex: 30, width: 248, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: SHADOW.md, padding: 4, ...style }}>
      <div style={{ padding: '8px 12px 10px', borderBottom: `1px solid ${C.border}`, marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="mk-ellipsis" style={{ font: `600 13px/18px ${FONT}`, color: C.text }}>{user?.fullName || '—'}</span>
          {user?.phone && <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.text2 }}>{user.phone}</span>}
        </div>
        {showRole && <span style={{ alignSelf: 'flex-start', height: 20, padding: '0 6px', borderRadius: 4, background: C.p50, border: `1px solid ${C.p200}`, color: C.p800, font: `500 12px/16px ${FONT}`, display: 'inline-flex', alignItems: 'center' }}>Marker</span>}
      </div>
      <button type="button" role="menuitem" className="mk-mi" onClick={onLogout} autoFocus>
        <LogOut size={16} aria-hidden="true" /> Chiqish
      </button>
    </div>
  );
}
