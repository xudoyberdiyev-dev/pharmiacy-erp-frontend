import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Pill,
  Users,
  ShoppingCart,
  ChevronRight,
  Activity,
  LogOut,
  UserCheck,
} from 'lucide-react';
import './sidebar.css';
import { useAuth } from '../layout/AuthProvider';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/products', label: 'Mahsulotlar', icon: Pill },
  { to: '/customers', label: 'Mijozlar', icon: Users },
  { to: '/sales', label: 'Sotuvlar', icon: ShoppingCart },
  { to: '/employees', label: 'Xodimlar', icon: UserCheck },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logoIcon">
          <Activity size={18} />
        </div>
        <div className="logoText">
          <span className="logoName">PharmaCRM</span>
          <span className="logoSub">Dorixona tizimi</span>
        </div>
      </div>

      <nav className="nav">
        <span className="navLabel">Menyu</span>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `navItem ${isActive ? 'active' : ''}`}
          >
            <span className="navIndicator" />
            <Icon size={18} className="navIcon" />
            <span className="navText">{label}</span>
            <ChevronRight size={14} className="navArrow" />
          </NavLink>
        ))}
      </nav>

      <div className="sidebarFooter">
        <div className="footerUser">
          <span className="footerDot" />
          <span className="footerName">{user?.username || 'Admin'}</span>
        </div>
        <button className="logoutBtn" onClick={handleLogout} title="Chiqish">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}