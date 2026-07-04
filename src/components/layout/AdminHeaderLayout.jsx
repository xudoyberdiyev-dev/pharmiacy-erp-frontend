import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import {
  LayoutDashboard, Users, Package, Truck, ClipboardCheck, AlertTriangle,
  History, BarChart3, ClipboardList, ShieldCheck, ChevronDown, LogOut,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function Badge({ count, color = 'red' }) {
  if (!count) return null;
  const c = {
    red: 'bg-red-500 text-white animate-pulse',
    amber: 'bg-amber-400 text-white',
  }[color];
  return (
    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full ${c}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

const ADMIN_NAV = [
  { to: '/admin', end: true, label: 'Bosh sahifa', icon: LayoutDashboard },
  { to: '/admin/clients', end: false, label: 'Klientlar', icon: Users },
  { to: '/admin/orders', end: false, label: 'Orderlar', icon: Package },
  { to: '/admin/approvals', end: false, label: 'Tasdiqlash', icon: ClipboardCheck, badgeKey: 'pending' },
  { to: '/admin/overdue', end: false, label: "Muddati o'tgan", icon: AlertTriangle, badgeKey: 'overdue' },
  { to: '/admin/confirmation-history', end: false, label: 'Tasdiqlash tarixi', icon: History },
  { to: '/admin/vehicles', end: false, label: 'Mashinalar', icon: Truck },
  { to: '/admin/users', end: false, label: 'Xodimlar', icon: Users },
  { to: '/admin/monitoring', end: false, label: 'Monitoring', icon: LayoutDashboard },
];

// SUPER_ADMIN has its own separate panel — none of ADMIN's pages are shared.
// What else lives here will be defined in a future task.
const SUPER_ADMIN_NAV = [
  { to: '/superadmin', end: true, label: 'Statistika', icon: BarChart3 },
  { to: '/superadmin/activity', end: false, label: 'Faoliyat tarixi', icon: ClipboardList },
];

export default function AdminHeaderLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const NAV = isSuperAdmin ? SUPER_ADMIN_NAV : ADMIN_NAV;

  // Only ADMIN's nav has the Tasdiqlash/Muddati o'tgan badge counts — skip the query entirely for SUPER_ADMIN.
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsAPI.getStats(),
    select: (r) => r.data.data,
    refetchInterval: 60000,
    enabled: !isSuperAdmin,
  });

  const pendingCount = stats?.pendingAdminConfirm?.length ?? 0;
  const overdueCount = pendingCount; // pendingAdminConfirm from /stats is already the >48h subset

  const initials = user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <header className="bg-white/85 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 h-[60px] flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0 mr-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200">
              <ShieldCheck size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-gray-900 text-[14px] leading-tight tracking-tight">Pharmacy <span className="text-blue-600">ERP</span></p>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                {isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
            {NAV.map(({ to, end, label, icon: Icon, badgeKey }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                <Icon size={14} strokeWidth={2} />
                <span className="hidden lg:inline">{label}</span>
                {badgeKey === 'pending' && <Badge count={pendingCount} color="amber" />}
                {badgeKey === 'overdue' && <Badge count={overdueCount} color="red" />}
              </NavLink>
            ))}
          </nav>

          <div className="relative shrink-0" ref={dropRef}>
            <button
              onClick={() => setDropOpen((v) => !v)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-semibold text-gray-900 leading-tight">{user?.fullName}</p>
                <p className="text-[10px] text-blue-500 font-bold leading-tight">
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              <ChevronDown size={12} className={`text-gray-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50">
                <div className="px-4 py-2.5 border-b border-gray-50">
                  <p className="text-[13px] font-semibold text-gray-900">{user?.fullName}</p>
                  <p className="text-[11px] text-gray-400">{user?.phone}</p>
                </div>
                <div className="mx-3 border-t border-gray-100 my-1" />
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors rounded-b-2xl"
                >
                  <LogOut size={14} /> Chiqish
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
