import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, LogOut, Users, DatabaseZap, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/system-owner', label: 'Super Adminlar', icon: Users, end: true },
  { to: '/system-owner/data-retention', label: "Ma'lumotlarni tozalash", icon: DatabaseZap, end: false },
  { to: '/system-owner/settings', label: 'Sozlamalar', icon: Settings, end: false },
];

export default function SystemOwnerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      <header className="bg-white/85 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-[60px] flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0 mr-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-md shadow-slate-300">
              <KeyRound size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-gray-900 text-[14px] leading-tight tracking-tight">Pharmacy <span className="text-slate-600">ERP</span></p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Owner</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
                    isActive ? 'bg-slate-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                <Icon size={14} /> {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-semibold text-gray-900 leading-tight">{user?.fullName}</p>
              <p className="text-[10px] text-slate-500 font-bold leading-tight">{user?.phone}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={14} /> Chiqish
            </button>
          </div>
        </div>

        <nav className="md:hidden max-w-screen-xl mx-auto px-4 pb-2 flex items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-colors ${
                  isActive ? 'bg-slate-900 text-white' : 'text-gray-600 bg-gray-100'
                }`
              }
            >
              <Icon size={13} /> {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
