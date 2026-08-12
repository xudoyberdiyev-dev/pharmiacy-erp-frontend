import { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DriverLocationProvider, useDriverLocation } from '../../context/DriverLocationContext';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import { Package, User, Smartphone, History } from 'lucide-react';

function isMobileDevice() {
  const ua = navigator.userAgent || navigator.vendor || '';
  const uaIsMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone|BlackBerry|IEMobile|Opera Mini|webOS/i.test(ua);
  // Touch capability is the most reliable signal — it works even when a
  // browser's "Desktop site" mode swaps the user-agent string to a desktop one.
  const isTouchDevice =
    (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches) ||
    navigator.maxTouchPoints > 0 ||
    'ontouchstart' in window;
  const narrowViewport = window.innerWidth <= 900;
  return uaIsMobile || isTouchDevice || narrowViewport;
}

function DesktopBlockedScreen() {
  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
          <Smartphone size={28} className="text-blue-600" />
        </div>
        <h1 className="text-lg font-black text-gray-900 mb-2">Faqat mobil qurilmalar uchun</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Haydovchi paneli faqat mobil telefonlardan ochiladi. Iltimos, shu sahifani telefoningizdan oching.
        </p>
      </div>
    </div>
  );
}

// Haydovchi "Yetkazyapman" tugmasini bosgan (deliveryStartedAt bor) orderlariga
// DriverLocationProvider'dan kelayotgan joylashuvni davriy yuboradi — shu
// orqali SuperAdmin "Haydovchilar xaritasi" sahifasida real vaqtda ko'rinadi.
// Tugma bosilmagan IN_TRANSIT orderlar uchun GPS yuborilmaydi.
function useShareLocation() {
  const { position } = useDriverLocation();

  const { data: startedOrders } = useQuery({
    queryKey: ['driver-active-orders-for-location'],
    queryFn: () => orderAPI.getAll({ status: 'IN_TRANSIT', limit: 50 }),
    select: r => (r.data.data || []).filter(o => o.deliveryStartedAt),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!position || !startedOrders?.length) return;
    startedOrders.forEach(order => {
      orderAPI.updateLocation({ orderId: order.id, latitude: position.latitude, longitude: position.longitude }).catch(() => {});
    });
  }, [position, startedOrders]);
}

function DriverMobileLayoutInner({ user, isDetailPage }) {
  useShareLocation();

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  const TABS = [
    { to: '/driver', end: true, label: 'Buyurtmalar', icon: Package },
    { to: '/driver/history', end: true, label: 'Tarix', icon: History },
    { to: '/driver/profile', end: true, label: 'Profil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      {!isDetailPage && (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#3B5BFD] flex items-center justify-center text-white font-black text-sm">
                {initials}
              </div>
              <div>
                <p className="text-[13px] font-bold text-gray-900 leading-tight">{user?.fullName}</p>
                <p className="text-[10px] text-gray-400 font-semibold leading-tight">Haydovchi</p>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="px-4 py-4">
          <Outlet />
        </div>
      </main>

      {!isDetailPage && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-stretch z-40"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {TABS.map(({ to, end, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold transition-colors ${
                  isActive ? 'text-[#3B5BFD]' : 'text-gray-400'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function DriverMobileLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [allowed, setAllowed] = useState(() => isMobileDevice());

  useEffect(() => {
    const onResize = () => setAllowed(isMobileDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!allowed) return <DesktopBlockedScreen />;

  const isDetailPage = /^\/driver\/orders\//.test(location.pathname);

  return (
    <DriverLocationProvider enabled={allowed}>
      <DriverMobileLayoutInner user={user} isDetailPage={isDetailPage} />
    </DriverLocationProvider>
  );
}
