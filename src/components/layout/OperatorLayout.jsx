import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ClipboardList, Plus, Box, PanelLeftClose, PanelLeftOpen,
  Menu, X, ChevronRight, ChevronDown, MoreVertical, User, LogOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { COLOR, ensureOperatorFonts, FONT_SANS, FONT_MONO } from '../../pages/operator/design/tokens';
import { useOrderCounts } from '../../pages/operator/useOperatorData';

// ─────────────────────────────────────────────────────────────────────────
// Operator Panel — Application Shell (Phase 02 of the redesign)
//
// Replaces the previous sticky header-nav with the design canvas's white
// sidebar (256px expanded / 72px collapsed rail) + workspace header +
// breadcrumb. This file is Operator-exclusive (verified: only App.jsx's
// /operator route references it), so this rewrite cannot affect any other
// role's panel.
//
// Deliberately NOT included: a notification bell. The design canvas's
// TopHeader spec calls for one, but GET /notifications on the backend is
// restricted to SUPER_ADMIN only (routes/index.js) — there is no working
// endpoint for the Operator role yet. Wiring a bell here would either 403
// or need new backend work, neither of which was asked for in this phase.
// ─────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/operator', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/operator/orders', label: 'Buyurtmalar', icon: ClipboardList, badgeKey: 'activeOrders' },
];

const BREADCRUMB_LABELS = {
  '/operator': 'Dashboard',
  '/operator/orders': 'Buyurtmalar',
  '/operator/orders/new': 'Yangi buyurtma',
  '/operator/profile': 'Profil',
};

const SIDEBAR_STORAGE_KEY = 'operator-sidebar-collapsed';

// Workspace content cap. The design canvas states 1200px, but it was drawn
// at a 1440px reference where that cap is invisible; on the 1920px+
// monitors people actually use it left ~230px dead gutters either side.
// Data pages now fill the workspace up to this ceiling (only ultra-wide
// screens see side margins). The form pages (Yangi buyurtma 840px, Profil
// 880px) keep their own narrower centred column exactly as designed.
const CONTENT_MAX_WIDTH = 1800;

function useViewport() {
  const get = () => ({
    isMobile: typeof window !== 'undefined' && window.innerWidth < 768,
    isTablet: typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1280,
  });
  const [vp, setVp] = useState(get);
  useEffect(() => {
    const onResize = () => setVp(get());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return vp;
}

function breadcrumbFor(pathname) {
  if (BREADCRUMB_LABELS[pathname]) return BREADCRUMB_LABELS[pathname];
  if (/^\/operator\/orders\/[^/]+$/.test(pathname)) return 'Buyurtma tafsiloti';
  return 'Dashboard';
}

// ── User menu (shared between sidebar footer and header chip) ────────────
function UserMenu({ user, open, onToggle, onClose, onLogout, variant = 'sidebar', collapsed = false }) {
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open, onClose]);

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className={`relative ${collapsed ? 'flex justify-center' : ''}`} ref={ref}>
      {variant === 'sidebar' && collapsed ? (
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold"
          style={{ background: COLOR.primarySoft, color: COLOR.primaryHover }}
        >
          {initials}
        </button>
      ) : variant === 'sidebar' ? (
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors"
          style={{ background: open ? COLOR.subtleSurface : 'transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = COLOR.subtleSurface; }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
        >
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ background: COLOR.primarySoft, color: COLOR.primaryHover }}
          >
            {initials}
          </span>
          <span className="flex flex-col items-start min-w-0 flex-1">
            <span className="text-[13px] font-semibold truncate w-full text-left" style={{ color: COLOR.textPrimary }}>{user?.fullName}</span>
            <span className="text-xs" style={{ color: COLOR.textTertiary }}>Operator</span>
          </span>
          <MoreVertical size={16} style={{ color: COLOR.textTertiary }} className="shrink-0" />
        </button>
      ) : (
        <button
          onClick={onToggle}
          className="flex items-center gap-2 h-9 pl-1.5 pr-2 rounded-lg border transition-colors"
          style={{ borderColor: COLOR.border, background: COLOR.surface }}
        >
          <span
            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-semibold"
            style={{ background: COLOR.primarySoft, color: COLOR.primaryHover }}
          >
            {initials}
          </span>
          <ChevronDown size={16} style={{ color: COLOR.textTertiary }} />
        </button>
      )}

      {open && (
        <div
          className={`absolute ${variant === 'sidebar' ? (collapsed ? 'bottom-0 left-full ml-2' : 'bottom-full mb-2 left-0') : 'top-full mt-2 right-0'} w-52 rounded-xl border overflow-hidden z-50`}
          style={{ background: COLOR.surface, borderColor: COLOR.border, boxShadow: COLOR.shadowDropdown }}
        >
          <div className="px-4 py-2.5 border-b" style={{ borderColor: COLOR.borderSubtle }}>
            <p className="text-[13px] font-semibold" style={{ color: COLOR.textPrimary }}>{user?.fullName}</p>
            <p className="text-xs" style={{ color: COLOR.textTertiary }}>{user?.phone}</p>
          </div>
          <button
            onClick={() => { navigate('/operator/profile'); onClose(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors"
            style={{ color: COLOR.textSecondary }}
            onMouseEnter={e => { e.currentTarget.style.background = COLOR.subtleSurface; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <User size={14} style={{ color: COLOR.textTertiary }} /> Mening profilim
          </button>
          <button
            onClick={() => { onClose(); onLogout(); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-colors"
            style={{ color: COLOR.danger }}
            onMouseEnter={e => { e.currentTarget.style.background = COLOR.dangerSoft; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={14} /> Chiqish
          </button>
        </div>
      )}
    </div>
  );
}

// ── Single nav item (expanded + collapsed variants) ───────────────────────
function NavItem({ item, collapsed, badgeCount }) {
  const Icon = item.icon;
  const [hover, setHover] = useState(false);

  if (collapsed) {
    return (
      <div className="relative flex justify-center" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
        <NavLink
          to={item.to}
          end={item.end}
          aria-label={item.label}
          className={({ isActive }) => 'relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors'}
          style={({ isActive }) => ({
            background: isActive ? COLOR.primarySoft : 'transparent',
            color: isActive ? COLOR.primary : COLOR.textTertiary,
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="absolute -left-3 top-2.5 w-[3px] h-5 rounded-r-[2px]"
                  style={{ background: COLOR.primary }}
                />
              )}
              <Icon size={20} strokeWidth={1.75} />
            </>
          )}
        </NavLink>
        {hover && (
          <span
            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap px-2.5 py-1.5 rounded-md text-xs font-medium z-50"
            style={{ background: COLOR.textPrimary, color: COLOR.textInverse }}
          >
            {item.label}{item.badgeKey && typeof badgeCount === 'number' ? ` · ${badgeCount}` : ''}
          </span>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className="relative flex items-center gap-2.5 h-10 px-3 rounded-lg text-sm transition-colors"
      style={({ isActive }) => ({
        background: isActive ? COLOR.primarySoft : 'transparent',
        color: isActive ? COLOR.primaryHover : COLOR.textSecondary,
        fontWeight: isActive ? 600 : 500,
        marginLeft: isActive ? 3 : 0,
      })}
      onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.background = COLOR.subtleSurface; }}
      onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.background = 'transparent'; }}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute -left-[3px] top-2.5 w-[3px] h-5 rounded-[2px]" style={{ background: COLOR.primary }} />
          )}
          <Icon size={18} strokeWidth={1.75} style={{ color: isActive ? COLOR.primary : COLOR.textTertiary }} />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badgeKey && typeof badgeCount === 'number' && (
            <span
              className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0"
              style={{
                background: isActive ? COLOR.surface : COLOR.mutedSurface,
                color: isActive ? COLOR.primaryHover : COLOR.textSecondary,
                border: isActive ? `1px solid #C7D2FE` : 'none',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {badgeCount}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ── Sidebar content (reused by desktop rail and mobile drawer) ────────────
function SidebarContent({ collapsed, user, badgeCount, userMenuOpen, onToggleUserMenu, onCloseUserMenu, onLogout, navigate, mobile }) {
  return (
    <>
      <div className={`flex items-center gap-2.5 ${collapsed ? 'flex-col py-4' : 'px-4 pt-5 pb-4'}`}>
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: COLOR.primary, color: COLOR.textInverse }}
        >
          <Box size={18} strokeWidth={1.75} />
        </span>
        {!collapsed && (
          <span className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate" style={{ color: COLOR.textPrimary }}>Pharmacy ERP</span>
            <span className="text-xs" style={{ color: COLOR.textTertiary }}>Operator</span>
          </span>
        )}
      </div>
      <div className="h-px mx-4" style={{ background: COLOR.borderSubtle }} />

      <nav className={`flex flex-col gap-0.5 ${collapsed ? 'items-center py-4' : 'px-3 pt-4 pb-3'}`}>
        {!collapsed && (
          <div className="px-2 pb-2 text-[11px] font-semibold tracking-widest" style={{ color: COLOR.textMuted, fontFamily: FONT_MONO }}>
            ASOSIY
          </div>
        )}
        {collapsed && <div className="flex flex-col gap-1 items-center w-full">
          {NAV_ITEMS.map(item => (
            <NavItem key={item.to} item={item} collapsed badgeCount={item.badgeKey ? badgeCount : undefined} />
          ))}
        </div>}
        {!collapsed && NAV_ITEMS.map(item => (
          <NavItem key={item.to} item={item} collapsed={false} badgeCount={item.badgeKey ? badgeCount : undefined} />
        ))}
      </nav>

      <div className={collapsed ? 'flex justify-center pb-3' : 'px-3 pb-0'}>
        {collapsed ? (
          <button
            onClick={() => navigate('/operator/orders/new')}
            aria-label="Yangi buyurtma"
            title="Yangi buyurtma"
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: COLOR.primary, color: COLOR.textInverse }}
            onMouseEnter={e => { e.currentTarget.style.background = COLOR.primaryHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = COLOR.primary; }}
          >
            <Plus size={20} strokeWidth={1.75} />
          </button>
        ) : (
          <button
            onClick={() => navigate('/operator/orders/new')}
            className={`w-full flex items-center justify-center gap-2 rounded-lg font-semibold text-sm transition-colors ${mobile ? 'h-11' : 'h-10'}`}
            style={{ background: COLOR.primary, color: COLOR.textInverse }}
            onMouseEnter={e => { e.currentTarget.style.background = COLOR.primaryHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = COLOR.primary; }}
          >
            <Plus size={18} strokeWidth={1.75} /> Yangi buyurtma
          </button>
        )}
      </div>

      <div className="flex-1" />

      <div className={`border-t ${collapsed ? 'flex justify-center pt-3' : 'p-3'}`} style={{ borderColor: COLOR.border }}>
        <UserMenu
          user={user} open={userMenuOpen} onToggle={onToggleUserMenu} onClose={onCloseUserMenu}
          onLogout={onLogout} variant="sidebar" collapsed={collapsed}
        />
      </div>
    </>
  );
}

export default function OperatorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet } = useViewport();

  const [manualCollapsed, setManualCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'; } catch { return false; }
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Two independent triggers render a UserMenu at once (sidebar footer +
  // header chip) — separate state each, so opening one never opens both.
  const [sidebarMenuOpen, setSidebarMenuOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => { ensureOperatorFonts(); }, []);

  // Tablet width forces the collapsed rail regardless of the stored
  // preference (design canvas §09); desktop respects the manual toggle.
  const collapsed = isTablet ? true : manualCollapsed;

  const toggleCollapsed = () => {
    const next = !manualCollapsed;
    setManualCollapsed(next);
    try { localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
  };

  // Close the mobile drawer whenever the route changes
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Escape closes the drawer; minimal focus trap while it's open
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
      if (e.key === 'Tab' && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll('button, a[href]');
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    drawerRef.current?.querySelector('button')?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Nav badge — "faol buyurtmalar" (DELIVERED / CANCELLED bo'lmaganlar).
  // Same hook the Dashboard uses (exact server totals per status, shared
  // cache entry), so the badge and the Dashboard can never disagree.
  const { data: counts } = useOrderCounts();
  const activeOrders = counts?.active;

  const breadcrumb = breadcrumbFor(location.pathname);
  const sidebarWidth = collapsed ? 72 : 256;

  return (
    <div className="min-h-screen flex" style={{ background: COLOR.appBg, fontFamily: FONT_SANS, color: COLOR.textPrimary }}>

      {/* ── Desktop / tablet sidebar ── */}
      {!isMobile && (
        <aside
          className="shrink-0 flex flex-col sticky top-0 h-screen border-r transition-[width] duration-150"
          style={{ width: sidebarWidth, background: COLOR.surface, borderColor: COLOR.border }}
        >
          <SidebarContent
            collapsed={collapsed}
            user={user}
            badgeCount={activeOrders}
            userMenuOpen={sidebarMenuOpen}
            onToggleUserMenu={() => setSidebarMenuOpen(v => !v)}
            onCloseUserMenu={() => setSidebarMenuOpen(false)}
            onLogout={handleLogout}
            navigate={navigate}
          />
        </aside>
      )}

      {/* ── Mobile drawer ── */}
      {isMobile && drawerOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0" style={{ background: 'rgba(15,23,42,0.40)' }} onClick={() => setDrawerOpen(false)} />
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            className="absolute top-0 bottom-0 left-0 w-[288px] flex flex-col"
            style={{ background: COLOR.surface, boxShadow: COLOR.shadowModal }}
          >
            <div className="flex items-center justify-between gap-2.5 p-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR.primary, color: COLOR.textInverse }}>
                  <Box size={18} strokeWidth={1.75} />
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate" style={{ color: COLOR.textPrimary }}>Pharmacy ERP</span>
                  <span className="text-xs" style={{ color: COLOR.textTertiary }}>Operator</span>
                </span>
              </div>
              <button
                aria-label="Menyuni yopish"
                onClick={() => setDrawerOpen(false)}
                className="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0"
                style={{ borderColor: COLOR.border, color: COLOR.textSecondary }}
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div className="h-px mx-4" style={{ background: COLOR.borderSubtle }} />
            <nav className="flex flex-col gap-1 px-3 pt-4 pb-3">
              <div className="px-2 pb-2 text-[11px] font-semibold tracking-widest" style={{ color: COLOR.textMuted, fontFamily: FONT_MONO }}>ASOSIY</div>
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className="relative flex items-center justify-between gap-2.5 h-11 px-3 rounded-lg text-sm"
                    style={({ isActive }) => ({
                      background: isActive ? COLOR.primarySoft : 'transparent',
                      color: isActive ? COLOR.primaryHover : COLOR.textSecondary,
                      fontWeight: isActive ? 600 : 500,
                      marginLeft: isActive ? 3 : 0,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute -left-[3px] top-3 w-[3px] h-5 rounded-[2px]" style={{ background: COLOR.primary }} />}
                        <span className="flex items-center gap-2.5">
                          <Icon size={18} strokeWidth={1.75} style={{ color: isActive ? COLOR.primary : COLOR.textTertiary }} />
                          {item.label}
                        </span>
                        {item.badgeKey && typeof activeOrders === 'number' && (
                          <span
                            className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center"
                            style={{ background: isActive ? COLOR.surface : COLOR.mutedSurface, color: isActive ? COLOR.primaryHover : COLOR.textSecondary, border: isActive ? '1px solid #C7D2FE' : 'none' }}
                          >
                            {activeOrders}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
            <div className="px-3">
              <button
                onClick={() => navigate('/operator/orders/new')}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg font-semibold text-sm"
                style={{ background: COLOR.primary, color: COLOR.textInverse }}
              >
                <Plus size={18} strokeWidth={1.75} /> Yangi buyurtma
              </button>
            </div>
            <div className="flex-1" />
            <div className="border-t p-3" style={{ borderColor: COLOR.border }}>
              <UserMenu user={user} open={sidebarMenuOpen} onToggle={() => setSidebarMenuOpen(v => !v)} onClose={() => setSidebarMenuOpen(false)} onLogout={handleLogout} variant="sidebar" />
            </div>
          </aside>
        </div>
      )}

      {/* ── Main column ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className="shrink-0 sticky top-0 z-30 flex items-center justify-between gap-4 border-b"
          style={{ height: isMobile ? 64 : 68, background: COLOR.surface, borderColor: COLOR.border, padding: isMobile ? '0 16px' : '0 24px' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {isMobile ? (
              <button
                aria-label="Menyuni ochish"
                onClick={() => setDrawerOpen(true)}
                className="w-10 h-10 rounded-lg border flex items-center justify-center shrink-0"
                style={{ borderColor: COLOR.border, color: COLOR.textSecondary }}
              >
                <Menu size={20} strokeWidth={1.75} />
              </button>
            ) : (
              <button
                aria-label={collapsed ? "Menyuni yoyish" : "Menyuni yig'ish"}
                title={collapsed ? "Menyuni yoyish" : "Menyuni yig'ish"}
                onClick={toggleCollapsed}
                disabled={isTablet}
                className="w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: COLOR.border, color: COLOR.textSecondary }}
              >
                {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.75} /> : <PanelLeftClose size={18} strokeWidth={1.75} />}
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 text-[13px] min-w-0 whitespace-nowrap overflow-hidden" style={{ color: COLOR.textTertiary }}>
              <span>Operator</span>
              <ChevronRight size={14} style={{ color: COLOR.borderStrong }} />
              <span className="font-medium truncate" style={{ color: COLOR.textPrimary }}>{breadcrumb}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Notification bell intentionally omitted — see file header note */}
            {/* Mobile keeps the user identity inside the drawer only (matches
                the design canvas's mobile header, which carries no avatar chip) */}
            {!isMobile && (
              <UserMenu user={user} open={headerMenuOpen} onToggle={() => setHeaderMenuOpen(v => !v)} onClose={() => setHeaderMenuOpen(false)} onLogout={handleLogout} variant="header" />
            )}
          </div>
        </header>

        <main className="flex-1 min-w-0">
          <div
            className="mx-auto w-full"
            style={{ maxWidth: CONTENT_MAX_WIDTH, padding: isMobile ? '20px 16px' : isTablet ? '24px' : '32px' }}
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
