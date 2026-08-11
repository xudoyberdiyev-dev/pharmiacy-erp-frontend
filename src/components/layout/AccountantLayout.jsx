import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FileCheck, History, LogOut, ChevronDown, Activity, RotateCcw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

// Bugalter 1 va 2 uchun umumiy header-navigatsiyali layout — DocumentLayout
// bilan bir xil naqsh (boshqa barcha rol panellari kabi), sidebar o'rniga.
export default function AccountantLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);

  const isStep2 = user?.role === 'ACCOUNTANT2';
  const basePath = isStep2 ? '/accountant2' : '/accountant1';
  const theme = isStep2
    ? { grad: 'from-blue-600 to-indigo-600', accent: 'text-blue-600', active: 'bg-blue-50 text-blue-700', border: 'border-blue-100', shadow: 'shadow-blue-200', roleLabel: 'Bugalter 2' }
    : { grad: 'from-amber-500 to-orange-600', accent: 'text-amber-600', active: 'bg-amber-50 text-amber-700', border: 'border-amber-100', shadow: 'shadow-amber-200', roleLabel: 'Bugalter 1' };

  const NAV_LINKS = [
    { to: basePath,               label: isStep2 ? '2-tasdiqlash' : '1-tasdiqlash', icon: FileCheck, end: true },
    ...(!isStep2 ? [{ to: `${basePath}/returned`, label: 'Qaytganlar', icon: RotateCcw }] : []),
    { to: `${basePath}/history`,  label: 'Tarix',                                    icon: History },
  ];

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col">
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-5 h-[62px] flex items-center gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0 mr-2">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.grad} flex items-center justify-center shadow-md ${theme.shadow}`}>
              <Activity size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-gray-900 text-[15px] tracking-tight hidden sm:block">
              Pharmacy <span className={theme.accent}>ERP</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
            {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? `${theme.active} font-semibold`
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setDropOpen(v => !v)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${theme.grad} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                  {user?.fullName?.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[13px] font-semibold text-gray-900 leading-tight">{user?.fullName}</p>
                  <p className={`text-[11px] font-medium leading-tight ${theme.accent}`}>{theme.roleLabel}</p>
                </div>
                <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-gray-50">
                    <p className="text-[13px] font-semibold text-gray-900">{user?.fullName}</p>
                    <p className="text-[11px] text-gray-400">{user?.phone}</p>
                  </div>
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
        </div>
      </header>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-7">
        <Outlet />
      </main>
    </div>
  );
}
