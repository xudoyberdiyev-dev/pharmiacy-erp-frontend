import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  FilePen, ClipboardCheck, Truck, History, Undo2, MessageSquareWarning, PanelLeftClose, PanelLeftOpen,
  ChevronRight, ChevronDown, ChevronsUpDown, User, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { C, FONT, SHADOW } from '../../pages/document/design/tokens';
import { DOC_CSS } from '../../pages/document/design/ui';
import { useDocCounts, useOnline, useViewportWidth } from '../../pages/document/lib/hooks';

// ─────────────────────────────────────────────────────────────────────────
// Hujjatchi ilova qobig'i (Design System Phase 02): doimiy yon panel
// (256 / 72px, yig'iladi), 64px sarlavha, to'liq kenglikdagi ish maydoni.
// <900px da yon panel chiquvchi (drawer) bo'ladi.
// ─────────────────────────────────────────────────────────────────────────

const NAV = [
  {
    id: 'ish', label: 'ISH OQIMI', title: 'Ish oqimi', items: [
      { to: '/document', end: true, label: 'Biriktirish', icon: ClipboardCheck, countKey: 'pending' },
      { to: '/document/documented', label: 'Hujjatlashtirish', icon: FilePen, countKey: 'awaiting' },
      { to: '/document/ready', label: 'Safarga tayyor', icon: Truck, countKey: 'ready' },
      { to: '/document/history', label: 'Tarix', icon: History },
    ],
  },
  {
    id: 'etibor', label: 'E’TIBOR TALAB', title: 'E’tibor talab', attention: true, items: [
      { to: '/document/returned', label: 'Qaytganlar', icon: Undo2, countKey: 'returned' },
      { to: '/document/etirozlar', label: 'E’tirozlar', icon: MessageSquareWarning, countKey: 'etirozPending' },
    ],
  },
];

const fmtCount = (n, cap) => (n > cap ? `${cap}+` : String(n));

function findActive(pathname) {
  if (/^\/document\/orders\/[^/]+\/return/.test(pathname)) {
    return { section: 'Tarix', label: 'Qaytarilgan tovarni qayd etish' };
  }
  for (const s of NAV) {
    for (const it of s.items) {
      const match = it.end ? pathname === it.to || pathname === `${it.to}/` : pathname.startsWith(it.to);
      if (match) return { section: s.title, label: it.label };
    }
  }
  return { section: 'Ish oqimi', label: 'Biriktirish' };
}

function readCollapsed() {
  try { return localStorage.getItem('doc.sidebar.collapsed') === '1'; } catch { return false; }
}

export default function DocumentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const vw = useViewportWidth();
  const online = useOnline();
  const { data: counts } = useDocCounts();
  const isDrawer = vw < 900;
  const [collapsedPref, setCollapsedPref] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menu, setMenu] = useState(null); // 'header' | 'sidebar' | null
  const [tip, setTip] = useState(null);
  const menuRef = useRef(null);
  const collapsed = !isDrawer && collapsedPref;
  const active = findActive(pathname);
  const pad = vw >= 1440 ? 32 : vw < 640 ? 16 : 24;

  useEffect(() => {
    const prev = document.title;
    document.title = 'Pharmacy ERP — Hujjatchi';
    return () => { document.title = prev; };
  }, []);

  useEffect(() => { setDrawerOpen(false); setMenu(null); }, [pathname]);

  useEffect(() => {
    if (!menu && !drawerOpen) return undefined;
    const onDown = (e) => { if (menu && menuRef.current && !menuRef.current.contains(e.target)) setMenu(null); };
    const onKey = (e) => { if (e.key === 'Escape') { setMenu(null); setDrawerOpen(false); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menu, drawerOpen]);

  const toggleCollapsed = () => {
    const next = !collapsedPref;
    setCollapsedPref(next);
    setTip(null);
    try { localStorage.setItem('doc.sidebar.collapsed', next ? '1' : '0'); } catch { /* saqlash ixtiyoriy */ }
  };

  const doLogout = () => { logout(); navigate('/login'); };

  const sbW = collapsed ? 72 : 256;
  const expanded = !collapsed;

  const sidebar = (
    <aside
      aria-label="Asosiy navigatsiya"
      style={{
        width: sbW, flex: 'none', height: '100%', background: C.p900, display: 'flex', flexDirection: 'column',
        position: 'relative', zIndex: 5, transition: 'width .18s ease',
      }}
    >
      <div style={{ height: 64, flex: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: `0 ${collapsed ? 18 : 16}px`, borderBottom: `1px solid ${C.p800}`, justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <div style={{ width: 36, height: 36, flex: 'none', borderRadius: 8, background: '#fff', color: C.p800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FilePen size={20} strokeWidth={1.75} aria-hidden="true" />
        </div>
        {expanded && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
              <span style={{ font: `600 14px/18px ${FONT}`, color: '#fff', whiteSpace: 'nowrap' }}>Pharmacy ERP</span>
              <span style={{ font: `500 12px/16px ${FONT}`, color: C.p200, whiteSpace: 'nowrap' }}>Hujjatchi</span>
            </div>
            {isDrawer ? (
              <button type="button" className="dc-side-btn" aria-label="Menyuni yopish" title="Menyuni yopish" onClick={() => setDrawerOpen(false)} style={{ width: 36, height: 36 }}>
                <X size={20} />
              </button>
            ) : (
              <button type="button" className="dc-side-btn" aria-label="Yon panelni yig‘ish" title="Yon panelni yig‘ish" aria-expanded="true" onClick={toggleCollapsed} style={{ width: 36, height: 36 }}>
                <PanelLeftClose size={20} strokeWidth={1.75} />
              </button>
            )}
          </>
        )}
      </div>
      {collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <button type="button" className="dc-side-btn" aria-label="Yon panelni yoyish" title="Yon panelni yoyish" aria-expanded="false" onClick={toggleCollapsed} style={{ width: 48, height: 40 }}>
            <PanelLeftOpen size={20} strokeWidth={1.75} />
          </button>
        </div>
      )}

      <nav style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', padding: '8px 12px 12px' }}>
        {NAV.map((s) => (
          <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 12 }}>
            {expanded
              ? <span id={`nav-${s.id}`} style={{ font: `600 12px/16px ${FONT}`, letterSpacing: '0.04em', color: C.p300, padding: '4px 12px 6px', whiteSpace: 'nowrap' }}>{s.label}</span>
              : <span role="separator" aria-label={s.title} style={{ display: 'block', width: 24, height: 1, background: C.p500, margin: '8px auto 10px' }} />}
            <ul role="list" aria-labelledby={expanded ? `nav-${s.id}` : undefined} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {s.items.map((it) => {
                const n = it.countKey && counts ? counts[it.countKey] : null;
                const has = n != null && n > 0;
                return (
                  <li key={it.to} style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <NavLink
                      to={it.to}
                      end={it.end}
                      className="dc-nav"
                      aria-label={it.label + (has ? `, ${n} ta` : '')}
                      onMouseEnter={() => collapsed && setTip(it.to)}
                      onMouseLeave={() => setTip(null)}
                      onFocus={() => collapsed && setTip(it.to)}
                      onBlur={() => setTip(null)}
                      style={{ width: collapsed ? 48 : '100%', padding: collapsed ? 0 : '0 12px', justifyContent: collapsed ? 'center' : 'flex-start' }}
                    >
                      {({ isActive }) => {
                        const bBg = isActive ? C.p800 : s.attention ? C.warning.bg : C.p700;
                        const bFg = isActive ? '#fff' : s.attention ? C.warning.text : '#fff';
                        return (
                          <>
                            <span style={{ display: 'flex', color: isActive ? C.p800 : 'inherit' }}><it.icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>
                            {expanded && (
                              <>
                                <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>
                                {has && (
                                  <span className="tnum" style={{ flex: 'none', minWidth: 24, height: 20, padding: '0 6px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: `600 12px/16px ${FONT}`, background: bBg, color: bFg }}>
                                    {fmtCount(n, 999)}
                                  </span>
                                )}
                              </>
                            )}
                            {collapsed && has && (
                              <span aria-hidden="true" className="tnum" style={{ position: 'absolute', top: 4, right: 4, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', font: `600 12px/16px ${FONT}`, background: bBg, color: bFg, boxShadow: `0 0 0 2px ${isActive ? '#fff' : C.p900}` }}>
                                {fmtCount(n, 99)}
                              </span>
                            )}
                          </>
                        );
                      }}
                    </NavLink>
                    {collapsed && tip === it.to && (
                      <span role="tooltip" style={{ position: 'absolute', left: 58, top: '50%', transform: 'translateY(-50%)', zIndex: 20, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', background: C.n900, color: '#fff', font: `500 12px/16px ${FONT}`, padding: '6px 8px', borderRadius: 5, boxShadow: SHADOW.l2, pointerEvents: 'none' }}>
                        {it.label}
                        {has && <span className="tnum" style={{ color: C.n300 }}>{n}</span>}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div style={{ flex: 'none', borderTop: `1px solid ${C.p800}`, padding: 12, display: 'flex', justifyContent: 'center', position: 'relative' }} ref={menu === 'sidebar' ? menuRef : undefined}>
        <button
          type="button"
          className="dc-side-btn"
          aria-label={`Profil menyusi: ${user?.fullName || ''}, Hujjatchi`}
          aria-haspopup="menu"
          aria-expanded={menu === 'sidebar'}
          onClick={() => setMenu((m) => (m === 'sidebar' ? null : 'sidebar'))}
          style={{ gap: 12, width: collapsed ? 48 : '100%', height: 52, padding: collapsed ? 0 : '0 8px', justifyContent: collapsed ? 'center' : 'flex-start', color: '#fff', textAlign: 'left' }}
        >
          <span style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', background: C.p100, color: C.p900, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 13px/1 ${FONT}` }}>
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={16} />}
          </span>
          {expanded && (
            <>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="dc-ellipsis" style={{ font: `600 13px/18px ${FONT}` }}>{user?.fullName || '—'}</span>
                <span style={{ font: `400 12px/16px ${FONT}`, color: C.p200 }}>Hujjatchi</span>
              </span>
              <ChevronsUpDown size={16} aria-hidden="true" style={{ color: C.p200 }} />
            </>
          )}
        </button>
        {menu === 'sidebar' && <ProfileMenu user={user} onLogout={doLogout} style={{ left: 12, bottom: 'calc(100% + 4px)', ...(collapsed ? { left: 64, bottom: 12 } : {}) }} />}
      </div>
    </aside>
  );

  return (
    <div className="doc-shell" style={{ display: 'flex', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <style>{DOC_CSS}</style>

      {!isDrawer && sidebar}
      {isDrawer && drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
          <div style={{ height: '100%', boxShadow: SHADOW.l3 }}>{sidebar}</div>
          <div style={{ flex: 1, background: 'rgba(13,30,38,0.48)' }} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: 64, flex: 'none', background: '#fff', borderBottom: `1px solid ${C.n200}`, display: 'flex', alignItems: 'center', gap: 12, padding: `0 ${pad}px` }}>
          {isDrawer && (
            <button type="button" className="dc-ib" aria-label="Menyuni ochish" title="Menyuni ochish" onClick={() => setDrawerOpen(true)}>
              <Menu size={20} />
            </button>
          )}
          <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, font: `400 13px/20px ${FONT}`, color: C.n600, whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {vw >= 640 && (
              <>
                <span>Hujjatchi</span>
                <ChevronRight size={16} aria-hidden="true" style={{ color: C.n500, flex: 'none' }} />
                <span>{active.section}</span>
                <ChevronRight size={16} aria-hidden="true" style={{ color: C.n500, flex: 'none' }} />
              </>
            )}
            <span aria-current="page" className="dc-ellipsis" style={{ fontWeight: 500, color: C.n900 }}>{active.label}</span>
          </nav>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
            <span
              role="status"
              style={{
                display: 'flex', alignItems: 'center', gap: 8, height: 32, padding: '0 10px', borderRadius: 7,
                border: `1px solid ${online ? C.n200 : C.warning.border}`, background: online ? '#fff' : C.warning.bg,
                font: `500 12px/16px ${FONT}`, color: online ? C.n700 : C.warning.text,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: online ? C.success.main : C.warning.main }} />
              {online ? 'Onlayn' : 'Oflayn'}
            </span>
            <span style={{ width: 1, height: 24, background: C.n200 }} />
            <div style={{ position: 'relative' }} ref={menu === 'header' ? menuRef : undefined}>
              <button
                type="button"
                className="dc-btn dc-ghost"
                aria-label="Profil menyusi"
                aria-haspopup="menu"
                aria-expanded={menu === 'header'}
                onClick={() => setMenu((m) => (m === 'header' ? null : 'header'))}
                style={{ padding: '0 8px 0 4px', gap: 8 }}
              >
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: C.p100, color: C.p900, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `600 13px/1 ${FONT}` }}>
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={16} />}
                </span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              {menu === 'header' && <ProfileMenu user={user} onLogout={doLogout} style={{ right: 0, top: 'calc(100% + 6px)' }} />}
            </div>
          </div>
        </header>

        <main id="doc-main" style={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <Outlet context={{ pad, vw }} />
        </main>
      </div>
    </div>
  );
}

function ProfileMenu({ user, onLogout, style }) {
  return (
    <div role="menu" style={{ position: 'absolute', zIndex: 30, width: 240, background: '#fff', border: `1px solid ${C.n200}`, borderRadius: 8, boxShadow: SHADOW.l2, padding: 4, ...style }}>
      <div style={{ padding: '8px 12px 10px', borderBottom: `1px solid ${C.n200}`, marginBottom: 4 }}>
        <div className="dc-ellipsis" style={{ font: `600 13px/18px ${FONT}`, color: C.n900 }}>{user?.fullName || '—'}</div>
        <div className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{user?.phone || ''}</div>
      </div>
      <button type="button" role="menuitem" className="dc-menu-item danger" onClick={onLogout} autoFocus>
        <LogOut size={16} aria-hidden="true" /> Chiqish
      </button>
    </div>
  );
}
