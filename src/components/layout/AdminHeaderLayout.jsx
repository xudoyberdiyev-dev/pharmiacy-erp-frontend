import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { statsAPI, userAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import {
  LayoutDashboard, Users, Package, Truck, ClipboardCheck, AlertTriangle,
  History, BarChart3, ClipboardList, ShieldCheck, ChevronDown, LogOut,
  UserCog, TrendingUp, MapPinned, Bell as BellIcon, Map, Gauge, Pencil, X,
  ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import NotificationBell from './NotificationBell';

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed';

function ProfileEditModal({ user, onClose }) {
  const { updateUser } = useAuth();
  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '', password: '' });

  const mutation = useMutation({
    mutationFn: () => {
      const data = { fullName: form.fullName, phone: form.phone };
      if (form.password) data.password = form.password;
      return userAPI.updateMe(data);
    },
    onSuccess: (res) => {
      toast.success('Profil yangilandi!');
      updateUser(res.data.data);
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const canSubmit = form.fullName.trim() && form.phone.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-black text-gray-900">Profilni tahrirlash</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">To'liq ism *</label>
            <input className="input" value={form.fullName} onChange={set('fullName')} />
          </div>
          <div>
            <label className="label">Telefon *</label>
            <input className="input" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="label">
              Yangi parol <span className="text-gray-400 font-normal">(o'zgartirmasangiz bo'sh qoldiring)</span>
            </label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !canSubmit} className="btn-primary flex-1 disabled:opacity-50">
            {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

// collapsed=true bo'lsa raqamsiz kichik nuqta sifatida ko'rsatiladi — sidebar
// torayganda ham tasdiqlash/muddati o'tgan bandlari e'tibordan chetda qolmasin.
function Badge({ count, color = 'red', collapsed }) {
  if (!count) return null;
  const c = {
    red: 'bg-red-500 text-white',
    amber: 'bg-amber-400 text-white',
  }[color];
  if (collapsed) {
    return <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${c} animate-pulse`} />;
  }
  return (
    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black rounded-full shrink-0 animate-pulse ${c}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

// Nav guruhlarga bo'lingan — har bir guruh mantiqiy jihatdan bog'liq
// sahifalarni birlashtiradi, sidebar torayganda ham navigatsiya tushunarli bo'lsin.
const ADMIN_NAV_GROUPS = [
  {
    title: 'Asosiy',
    items: [
      { to: '/admin', end: true, label: 'Bosh sahifa', icon: LayoutDashboard },
      { to: '/admin/orders', end: false, label: 'Buyurtmalar', icon: Package },
      { to: '/admin/clients', end: false, label: 'Mijozlar', icon: Users },
    ],
  },
  {
    title: 'Tasdiqlash',
    items: [
      { to: '/admin/approvals', end: false, label: 'Tasdiqlash', icon: ClipboardCheck, badgeKey: 'pending' },
      { to: '/admin/overdue', end: false, label: "Muddati o'tgan", icon: AlertTriangle, badgeKey: 'overdue' },
      { to: '/admin/confirmation-history', end: false, label: 'Tasdiqlash tarixi', icon: History },
    ],
  },
  {
    title: 'Resurslar',
    items: [
      { to: '/admin/vehicles', end: false, label: 'Mashinalar', icon: Truck },
      { to: '/admin/users', end: false, label: 'Xodimlar', icon: Users },
    ],
  },
  {
    title: 'Kuzatuv',
    items: [
      { to: '/admin/monitoring', end: false, label: 'Monitoring', icon: LayoutDashboard },
    ],
  },
];

// SUPER_ADMIN has its own separate panel — none of ADMIN's pages are shared.
// Read-only statistics/monitoring only, plus the one write action: creating ADMIN accounts.
const SUPER_ADMIN_NAV_GROUPS = [
  {
    title: 'Analitika',
    items: [
      { to: '/superadmin', end: true, label: 'Statistika', icon: BarChart3 },
      { to: '/superadmin/sales', end: false, label: 'Sotuv statistikasi', icon: TrendingUp },
      { to: '/superadmin/regions', end: false, label: 'Hudud tahlili', icon: MapPinned },
      { to: '/superadmin/employee-performance', end: false, label: 'Xodimlar samaradorligi', icon: Gauge },
    ],
  },
  {
    title: 'Boshqaruv',
    items: [
      { to: '/superadmin/admins', end: false, label: 'Adminlar', icon: UserCog },
    ],
  },
  {
    title: 'Kuzatuv',
    items: [
      { to: '/superadmin/monitoring', end: false, label: 'Monitoring', icon: LayoutDashboard },
      { to: '/superadmin/alerts', end: false, label: 'Kechikishlar', icon: BellIcon },
      { to: '/superadmin/drivers-map', end: false, label: 'Haydovchilar xaritasi', icon: Map },
      { to: '/superadmin/activity', end: false, label: 'Faoliyat tarixi', icon: ClipboardList },
    ],
  },
];

export default function AdminHeaderLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
  const dropRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const NAV_GROUPS = isSuperAdmin ? SUPER_ADMIN_NAV_GROUPS : ADMIN_NAV_GROUPS;

  // Only ADMIN's nav has the Tasdiqlash/Muddati o'tgan badge counts — skip the query entirely for SUPER_ADMIN.
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsAPI.getStats(),
    select: (r) => r.data.data,
    refetchInterval: 60000,
    enabled: !isSuperAdmin,
  });

  // "Tasdiqlash" belgisi — HAMMA tasdiqlanmagan orderlar (yoshidan qat'iy nazar).
  // "Muddati o'tgan" belgisi — faqat 48 soatdan ko'p kutganlar. Ikkalasini
  // avval bitta songa (faqat >48soat) bog'lab qo'yilgani sabab, haydovchi
  // hozirgina yetkazib bergan orderlar uchun admin panelida hech qanday
  // belgi chiqmay, "tasdiqlash yo'q" degan noto'g'ri taassurot qoldirardi.
  const pendingCount = stats?.pendingAdminConfirmCount ?? 0;
  const overdueCount = stats?.pendingAdminConfirmOverdueCount ?? 0;

  const initials = user?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex">
      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-64'} shrink-0 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen transition-all duration-150 z-40`}
      >
        {/* Logo */}
        <div className={`h-[52px] flex items-center border-b border-gray-100 shrink-0 ${collapsed ? 'justify-center px-2' : 'gap-2 px-3'}`}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
            <ShieldCheck size={14} className="text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-[13.5px] leading-tight tracking-tight truncate">Pharmacy <span className="text-blue-600">ERP</span></p>
              <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest truncate">
                {isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}
              </p>
            </div>
          )}
        </div>

        {/* Nav — guruhlangan */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              {!collapsed && (
                <p className="px-2.5 mb-1 text-[10px] font-black text-gray-400 uppercase tracking-wider">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ to, end, label, icon: Icon, badgeKey }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2.5 rounded-lg text-[13px] font-semibold transition-all ${
                        collapsed ? 'justify-center px-0 py-2' : 'px-2.5 py-1.5'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                      }`
                    }
                  >
                    <Icon size={15} strokeWidth={2} className="shrink-0" />
                    {!collapsed && <span className="truncate flex-1">{label}</span>}
                    {badgeKey === 'pending' && <Badge count={pendingCount} color="amber" collapsed={collapsed} />}
                    {badgeKey === 'overdue' && <Badge count={overdueCount} color="red" collapsed={collapsed} />}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Sidebar'ni kengaytirish" : "Sidebar'ni yig'ish"}
          className="mx-2 mb-2 h-8 rounded-lg border border-gray-100 flex items-center justify-center gap-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 text-[11px] font-bold transition-colors shrink-0"
        >
          {collapsed ? <ChevronsRight size={13} /> : <><ChevronsLeft size={13} /> Yig'ish</>}
        </button>
      </aside>

      {/* ── CONTENT ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header bar — profil (hamma uchun) + bildirishnoma (faqat super admin) */}
        <div className="h-14 flex items-center justify-end gap-2 px-4 border-b border-gray-100 bg-white/85 backdrop-blur-md sticky top-0 z-30 shrink-0">
          {isSuperAdmin && <NotificationBell />}

          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                {initials}
              </div>
              <div className="text-left min-w-0 hidden sm:block">
                <p className="text-[12px] font-semibold text-gray-900 leading-tight truncate">{user?.fullName}</p>
                <p className="text-[10px] text-blue-500 font-bold leading-tight">
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </p>
              </div>
              <ChevronDown size={12} className={`text-gray-400 transition-transform shrink-0 ${dropOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 w-56">
                <div className="px-4 py-2.5 border-b border-gray-50">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{user?.fullName}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.phone}</p>
                </div>
                <button
                  onClick={() => { setShowProfileEdit(true); setDropOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={14} /> Profilni tahrirlash
                </button>
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

        <main className="flex-1 max-w-screen-2xl w-full mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>

      {showProfileEdit && <ProfileEditModal user={user} onClose={() => setShowProfileEdit(false)} />}
    </div>
  );
}
