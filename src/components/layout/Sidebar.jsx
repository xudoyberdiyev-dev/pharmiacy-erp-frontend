import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Package, Truck, FileText,
  BarChart3, LogOut, ClipboardList, CheckSquare, Tag, ShieldCheck
} from 'lucide-react';

const ROLE_MENUS = {
  ADMIN: [
    { to: '/admin', icon: LayoutDashboard, label: 'Bosh sahifa' },
    { to: '/admin/clients', icon: Users, label: 'Klientlar' },
    { to: '/admin/orders', icon: Package, label: 'Orderlar' },
    { to: '/admin/document', icon: FileText, label: 'Document' },
    { to: '/admin/users', icon: Users, label: 'Xodimlar' },
  ],
  OPERATOR: [
    { to: '/operator', icon: LayoutDashboard, label: 'Bosh sahifa' },
    { to: '/operator/clients', icon: Users, label: 'Klientlar' },
    { to: '/operator/orders', icon: Package, label: 'Orderlar' },
    { to: '/operator/orders/new', icon: ClipboardList, label: 'Yangi order' },
  ],
  PICKER: [
    { to: '/picker', icon: ClipboardList, label: 'Picking panel' },
  ],
  MARKER: [
    { to: '/marker', icon: Tag, label: 'Marking panel' },
  ],
  CHECKER: [
    { to: '/checker', icon: CheckSquare, label: 'Cheking panel' },
  ],
  DRIVER: [
    { to: '/driver', icon: Truck, label: 'Mening orderlarim' },
  ],
  ACCOUNTANT: [
    { to: '/accountant', icon: FileText, label: 'Hujjatlar' },
  ],
  SUPER_ADMIN: [
    { to: '/superadmin', icon: BarChart3, label: 'Statistika' },
    { to: '/superadmin/monitoring', icon: LayoutDashboard, label: 'Monitoring' },
    { to: '/superadmin/activity', icon: ClipboardList, label: 'Faoliyat tarixi' },
  ],
};

const ROLE_LABELS = {
  ADMIN: 'Admin',
  OPERATOR: 'Operator',
  PICKER: 'Picker',
  MARKER: 'Marker',
  CHECKER: 'Checker',
  DRIVER: 'Haydovchi',
  ACCOUNTANT: 'Bugalter',
  SUPER_ADMIN: 'Super Admin',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const menus = ROLE_MENUS[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="font-bold text-sm">ERP Tizim</p>
            <p className="text-xs text-gray-400">{ROLE_LABELS[user?.role]}</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-gray-700">
        <p className="text-sm font-medium truncate">{user?.fullName}</p>
        <p className="text-xs text-gray-400 truncate">{user?.phone}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {menus.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length === 2}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Chiqish
        </button>
      </div>
    </aside>
  );
}
