import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PickerProvider } from '../../pages/picker/PickerContext';
import { ToastProvider, ensurePickerStyles } from '../../pages/picker/design/ui';
import { PAGE_BG, ensurePickerFonts } from '../../pages/picker/design/tokens';
import { useIsDesktop, usePickerSocketSync, useRefreshAll } from '../../pages/picker/hooks/usePickerData';
import { eventToNotification, useNotificationCenter } from '../../pages/picker/lib/notifications';
import { Sidebar, TabBar, TopBar } from '../../pages/picker/parts/Shell';

// Picker (terimchi) paneli qobig'i.
//  • Mobil (<1024px): har bir ekran o'z sarlavhasiga ega + pastki tab bar (order/etiroz ekranlarida yashirin).
//  • Desktop (≥1024px): yuqori panel (qidiruv, holat, bildirishnoma, foydalanuvchi) + chap panel.
export default function PickerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesktop = useIsDesktop();
  const refreshAll = useRefreshAll();
  const searchRef = useRef(null);
  const notifications = useNotificationCenter(user?.id);
  const pushNotification = notifications.push;

  useEffect(() => { ensurePickerFonts(); ensurePickerStyles(); }, []);

  const onSocketEvent = useCallback((event, payload) => {
    const n = eventToNotification(event, payload, user?.id);
    if (n) pushNotification(n);
  }, [user?.id, pushNotification]);
  const conn = usePickerSocketSync(onSocketEvent);

  // "/" — qidiruvga o'tish (faqat desktopda qidiruv bor)
  useEffect(() => {
    if (!isDesktop) return undefined;
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isDesktop]);

  const ctx = useMemo(() => ({
    user,
    notifications,
    isOnline: conn.isOnline,
    refreshAll,
    searchRef,
    logout: () => { logout(); navigate('/login'); },
  }), [user, notifications, conn.isOnline, refreshAll, logout, navigate]);

  // Mobilda to'liq ekranli sahifalarda (order, etiroz) tab bar yo'q
  const fullScreen = pathname.startsWith('/picker/orders/') || pathname.startsWith('/picker/etirozlar/');

  return (
    <PickerProvider value={ctx}>
      {/* to'liq ekranli sahifalarda pastda tugmalar paneli bor — toast uning ustida chiqadi */}
      <ToastProvider bottomClass={fullScreen ? 'bottom-[150px] lg:bottom-6' : undefined}>
        <div className="pk-root min-h-screen text-slate-900" style={{ backgroundColor: PAGE_BG }}>
          {isDesktop ? (
            <>
              <TopBar />
              <div className="flex items-start gap-5 px-5 py-5">
                <Sidebar />
                <main className="min-w-0 flex-1" id="pk-main"><Outlet /></main>
              </div>
            </>
          ) : (
            <>
              <main id="pk-main"><Outlet /></main>
              {!fullScreen && <TabBar />}
            </>
          )}
        </div>
      </ToastProvider>
    </PickerProvider>
  );
}
