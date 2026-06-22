import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  Boxes,
  ShoppingCart,
  Tag,
  FileSpreadsheet,
  BarChart3,
  FileText,
  UserCheck,
  LogOut,
  Activity,
  User,
  History,
} from 'lucide-react';
import './header.css';
import { useAuth } from '../layout/AuthProvider';

const navItems = [
  { to: '/',          label: 'Dashboard',    icon: LayoutDashboard, end: true, roles: ['ADMIN'] },
  { to: '/products',  label: 'Mahsulotlar',  icon: Pill },
  { to: '/batches',   label: 'Partiyalar',   icon: Boxes },
  { to: '/customers', label: 'Mijozlar',     icon: User },
  { to: '/sales',     label: 'Sotuv',        icon: ShoppingCart },
  { to: '/marking',   label: 'Markirovka',   icon: Tag },
  { to: '/import',    label: 'Excel import', icon: FileSpreadsheet },
  { to: '/reports',   label: 'Hisobotlar',   icon: BarChart3, roles: ['ADMIN'] },
  { to: '/contract',  label: 'Shartnoma',    icon: FileText },
  { to: '/employees', label: 'Xodimlar',     icon: UserCheck,role:['ADMIN']},
  { to: '/history',   label: 'Xarakatlar Tarixi', icon: History, roles: ['ADMIN'] },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );
  

  const handleLogout = () => {
    const loginPath = user?.role === 'employee' ? '/employee-login' : '/admin-login';
    logout();
    navigate(loginPath);
  };

  return (
    <header className="header">
      <div className="headerInner">
        {/* BRAND */}
        <div className="brand">
          <div className="brandIcon">
            <Activity size={17} />
          </div>
          <span className="brandName">PharmaCRM</span>
        </div>

        <div className="divider" />

        {/* NAV — admin/employee rolega qarab filtrlanadi */}
        <nav className="navRow">
          {visibleItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `navBtn ${isActive ? 'active' : ''}`}
            >
              <Icon size={15} className="navBtnIcon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* RIGHT */}
        <div className="right">
          <button className="logoutBtn" onClick={handleLogout} title="Chiqish">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}