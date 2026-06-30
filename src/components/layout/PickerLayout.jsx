import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { pickerAPI } from '../../api';
import {
  Package, Zap, AlertTriangle, AlertCircle,
  Activity, ChevronDown, LogOut, User
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

function Badge({ count, color = 'gray' }) {
  if (!count) return null;
  const c = {
    blue:  'bg-blue-500 text-white',
    red:   'bg-red-500 text-white animate-pulse',
    amber: 'bg-amber-400 text-white',
    green: 'bg-green-500 text-white',
    gray:  'bg-gray-400 text-white',
  }[color];
  return (
    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full ${c}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function PickerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const { data: available } = useQuery({
    queryKey: ['picker-available'],
    queryFn: pickerAPI.getAvailable,
    refetchInterval: 10000,
    select: r => r.data.data || [],
  });
  const { data: mine } = useQuery({
    queryKey: ['picker-mine'],
    queryFn: pickerAPI.getMine,
    refetchInterval: 15000,
    select: r => r.data.data || [],
  });
  const { data: lateData } = useQuery({
    queryKey: ['picker-late-active'],
    queryFn: () => pickerAPI.getLate({ view: 'active' }),
    refetchInterval: 30000,
    select: r => r.data,
  });
  const { data: etirozli } = useQuery({
    queryKey: ['picker-etirozli'],
    queryFn: pickerAPI.getEtirozli,
    refetchInterval: 30000,
    select: r => r.data.data || [],
  });

  const lateCount     = lateData?.data?.length || 0;
  const etirozliCount = etirozli?.length || 0;
  const mineCount     = mine?.length || 0;
  const availCount    = available?.length || 0;

  const NAV = [
    { to: '/picker',           end: true, label: 'Mavjud orderlar', icon: Package,      badge: availCount,    badgeColor: 'blue'  },
    { to: '/picker/mine',      end: false, label: 'Mening orderlarim', icon: Zap,        badge: mineCount,     badgeColor: 'green' },
    { to: '/picker/late',      end: false, label: 'Kechikkan',       icon: AlertTriangle, badge: lateCount,    badgeColor: 'red'   },
    { to: '/picker/etirozli',  end: false, label: 'Etirozli',        icon: AlertCircle,  badge: etirozliCount, badgeColor: 'amber' },
  ];

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-[#F0F4FF] flex flex-col">
      {/* ── HEADER ── */}
      <header className="bg-white/85 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-[60px] flex items-center gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0 mr-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-md shadow-teal-200">
              <Activity size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-gray-900 text-[14px] leading-tight tracking-tight">Pharmacy <span className="text-teal-600">ERP</span></p>
              <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">Picker Panel</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
            {NAV.map(({ to, end, label, icon: Icon, badge, badgeColor }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md shadow-teal-200'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                  }`
                }
              >
                <Icon size={14} strokeWidth={2} />
                <span className="hidden sm:inline">{label}</span>
                <Badge count={badge} color={badgeColor} />
              </NavLink>
            ))}
          </nav>

          {/* User */}
          <div className="relative shrink-0" ref={dropRef}>
            <button onClick={() => setDropOpen(v => !v)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[12px] font-semibold text-gray-900 leading-tight">{user?.fullName}</p>
                <p className="text-[10px] text-teal-500 font-bold leading-tight">Picker</p>
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
                <button onClick={() => { logout(); navigate('/login'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-500 hover:bg-red-50 transition-colors rounded-b-2xl">
                  <LogOut size={14} /> Chiqish
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── CONTENT ── */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
