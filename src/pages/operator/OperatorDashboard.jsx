import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orderAPI, clientAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { format, isToday } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import {
  Package, Plus, TrendingUp, AlertTriangle,
  CheckCircle2, Eye, ArrowRight, Clock,
  BarChart3, Zap, Users
} from 'lucide-react';
import { formatSum } from '../../lib/format';
import { inTransitLabel } from '../../lib/orderStatusLabel';

// ── Animated counter ──────────────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    if (target === prev.current) return;
    const start = prev.current;
    const diff  = target - start;
    const startTime = performance.now();
    const tick = (now) => {
      const t = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(start + diff * ease));
      if (t < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  NEW:        { label: 'Yangi',        color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
  PICKING:    { label: 'Yig\'ilmoqda', color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
  MARKING:    { label: 'Markirovkalash',    color: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6' },
  CHECKING:   { label: 'Tekshiruv',   color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B' },
  LOADING:    { label: 'Yuklanmoqda', color: '#0369A1', bg: '#F0F9FF', dot: '#0EA5E9' },
  IN_TRANSIT: { label: 'Yo\'lda',     color: '#EA580C', bg: '#FFF7ED', dot: '#F97316' },
  DELIVERED:  { label: 'Yetkazildi',  color: '#16A34A', bg: '#F0FDF4', dot: '#22C55E' },
};

function StatusBadge({ status, order }) {
  const c = STATUS_CFG[status] || STATUS_CFG.NEW;
  const label = status === 'IN_TRANSIT' ? inTransitLabel(order) : c.label;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{ color: c.color, background: c.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {label}
    </span>
  );
}

// ── Gradient stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient, sub, onClick }) {
  const count = useCountUp(value || 0);
  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg w-full"
      style={{ background: gradient }}
    >
      <div className="absolute right-4 top-4 opacity-20">
        <Icon size={52} strokeWidth={1} className="text-white" />
      </div>
      <div className="relative z-10">
        <p className="text-4xl font-black text-white tracking-tight">{count}</p>
        <p className="text-white/80 text-sm font-medium mt-1">{label}</p>
        {sub && <p className="text-white/60 text-xs mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

// ── Status ring card ──────────────────────────────────────────────────────────
function StatusCard({ status, count, onClick }) {
  const c = STATUS_CFG[status];
  const n = useCountUp(count || 0);
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
    >
      <div className="relative w-14 h-14">
        <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
          <circle cx="28" cy="28" r="22" fill="none" stroke="#F3F4F6" strokeWidth="5" />
          <circle cx="28" cy="28" r="22" fill="none" stroke={c.dot} strokeWidth="5"
            strokeDasharray={`${Math.min(count * 10, 138)} 138`}
            strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-black" style={{ color: c.color }}>{n}</span>
      </div>
      <span className="text-xs font-semibold text-gray-500 text-center leading-tight group-hover:text-gray-700">{c.label}</span>
    </button>
  );
}

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ['operator-orders'],
    queryFn: () => orderAPI.getAll({ limit: 100 }),
    refetchInterval: 30000,
    select: r => r.data,
  });

  const { data: clientsRes } = useQuery({
    queryKey: ['clients-count'],
    queryFn: () => clientAPI.getAll({ limit: 1 }),
    select: r => r.data,
  });

  const allOrders   = ordersRes?.data || [];
  const total       = ordersRes?.total || 0;
  const todayMine   = allOrders.filter(o => isToday(new Date(o.createdAt)) && o.createdById === user?.id);
  const now         = new Date();

  const lateOrders = allOrders.filter(o => {
    if (['DELIVERED', 'CANCELLED', 'LOADING', 'IN_TRANSIT'].includes(o.status)) return false;
    const d = ['NEW','PICKING'].includes(o.status) ? o.pickingDeadline
      : o.status === 'MARKING' ? o.markingDeadline : o.checkingDeadline;
    return d && new Date(d) < now;
  });

  const byStatus = Object.keys(STATUS_CFG).reduce((a, s) => {
    a[s] = allOrders.filter(o => o.status === s).length; return a;
  }, {});

  const active = allOrders.filter(o => !['DELIVERED','CANCELLED'].includes(o.status));

  return (
    <div className="space-y-6">

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Salom, {user?.fullName?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {format(new Date(), "d MMMM yyyy")} — bugun {todayMine.length} ta order yaratdingiz
          </p>
        </div>
        <button
          onClick={() => navigate('/operator/orders/new')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-white
            bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
            shadow-md shadow-blue-200 hover:shadow-lg transition-all duration-200"
        >
          <Plus size={17} strokeWidth={2.5} /> Yangi order
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Jami orderlar"
          value={total}
          icon={Package}
          gradient="linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)"
          sub={`${todayMine.length} ta bugun menda`}
          onClick={() => navigate('/operator/orders')}
        />
        <StatCard
          label="Faol orderlar"
          value={active.length}
          icon={Zap}
          gradient="linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)"
          onClick={() => navigate('/operator/orders')}
        />
        <StatCard
          label="Kechikkan"
          value={lateOrders.length}
          icon={AlertTriangle}
          gradient={lateOrders.length
            ? "linear-gradient(135deg, #DC2626 0%, #EA580C 100%)"
            : "linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)"}
          onClick={() => navigate('/operator/orders?late=1')}
        />
        <StatCard
          label="Yetkazildi"
          value={byStatus.DELIVERED || 0}
          icon={CheckCircle2}
          gradient="linear-gradient(135deg, #16A34A 0%, #0D9488 100%)"
          sub={`${clientsRes?.pagination?.total || 0} ta klient`}
          onClick={() => navigate('/operator/orders?status=DELIVERED')}
        />
      </div>

      {/* ── Status breakdown ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={17} className="text-blue-500" /> Holat bo'yicha taqsimot
          </h2>
          <button onClick={() => navigate('/operator/orders')} className="text-xs text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1">
            Barchasi <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {['NEW','PICKING','MARKING','CHECKING'].map(s => (
            <StatusCard key={s} status={s} count={byStatus[s] || 0} onClick={() => navigate(`/operator/orders?status=${s}`)} />
          ))}
          {/* LOADING + Yuklanmoqda combined card */}
          <button
            onClick={() => navigate('/operator/orders?status=LOADING')}
            className="col-span-1 flex flex-col items-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 hover:border-sky-200 hover:shadow-md transition-all duration-200 group"
          >
            <div className="relative w-14 h-14">
              <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="#F3F4F6" strokeWidth="5" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="#0EA5E9" strokeWidth="5"
                  strokeDasharray={`${Math.min((byStatus.LOADING || 0) * 10, 138)} 138`}
                  strokeLinecap="round" className="transition-all duration-700" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-sky-600">{byStatus.LOADING || 0}</span>
            </div>
            <span className="text-[10px] font-semibold text-gray-500 text-center leading-tight group-hover:text-gray-700">
              Yuklanmoqda<br />
              <span className="text-gray-400">Hujjat tayyorlanmoqda</span>
            </span>
          </button>
          <StatusCard status="IN_TRANSIT" count={byStatus.IN_TRANSIT || 0} onClick={() => navigate('/operator/orders?status=IN_TRANSIT')} />
          <StatusCard status="DELIVERED"  count={byStatus.DELIVERED  || 0} onClick={() => navigate('/operator/orders?status=DELIVERED')}  />
        </div>
      </div>

      {/* ── Kechikkan orderlar ── */}
      {lateOrders.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-red-700 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-red-500 flex items-center justify-center">
                <AlertTriangle size={14} className="text-white" />
              </div>
              Kechikayotgan orderlar
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{lateOrders.length}</span>
            </h2>
            <button onClick={() => navigate('/operator/orders')} className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1">
              Hammasi <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {lateOrders.slice(0, 4).map(o => {
              let stageLabel = 'Picking muddati';
              let stageColor = 'text-blue-600 bg-blue-50 border-blue-200';
              let deadline;
              if (['NEW','PICKING'].includes(o.status) && o.pickingDeadline) {
                deadline = new Date(o.pickingDeadline);
                stageLabel = 'Picking muddati';
                stageColor = 'text-blue-600 bg-blue-50 border-blue-200';
              } else if (o.status === 'MARKING' && o.markingDeadline) {
                deadline = new Date(o.markingDeadline);
                stageLabel = 'Marking muddati';
                stageColor = 'text-purple-600 bg-purple-50 border-purple-200';
              } else if (o.status === 'CHECKING' && o.checkingDeadline) {
                deadline = new Date(o.checkingDeadline);
                stageLabel = 'Checking muddati';
                stageColor = 'text-amber-600 bg-amber-50 border-amber-200';
              } else {
                deadline = new Date(o.pickingDeadline || o.markingDeadline || o.checkingDeadline);
              }
              const overMin = Math.round((now - deadline) / 60000);
              return (
                <div key={o.id} className="bg-white rounded-xl border border-red-100 px-4 py-3 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer" onClick={() => navigate(`/operator/orders/${o.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <Clock size={14} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">#{o.invoiceNumber}</p>
                      <p className="text-xs text-gray-400">{o.client?.orgName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${stageColor}`}>{stageLabel}</span>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">+{overMin} daq</span>
                    <Eye size={14} className="text-gray-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bugungi orderlarim ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package size={14} className="text-blue-600" />
            </div>
            Bugungi orderlarim
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{todayMine.length}</span>
          </h2>
          <button onClick={() => navigate('/operator/orders')} className="text-xs text-blue-500 font-semibold flex items-center gap-1 hover:text-blue-700">
            Hammasini ko'rish <ArrowRight size={12} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-14 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Yuklanmoqda...</p>
          </div>
        ) : todayMine.length === 0 ? (
          <div className="py-14 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <Package size={28} className="text-gray-200" />
            </div>
            <p className="text-gray-400 text-sm font-medium">Bugun order yaratilmagan</p>
            <button onClick={() => navigate('/operator/orders/new')} className="mt-3 text-blue-500 text-sm font-semibold hover:text-blue-700">
              + Birinchi orderni yarating
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3">Buyurtma #</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3">Klient</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3">Summa</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3">Status</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3">Picking</th>
                  <th className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest px-5 py-3">Vaqt</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {todayMine.map((o, i) => {
                  const late = lateOrders.some(l => l.id === o.id);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/operator/orders/${o.id}`)}
                      className={`border-t border-gray-50 hover:bg-blue-50/40 transition-colors cursor-pointer ${late ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-gray-800">#{o.invoiceNumber}</span>
                          {late && (
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">KECH</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-800 max-w-[130px] truncate">{o.client?.orgName}</p>
                        <p className="text-xs text-gray-400">{o.client?.inn}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-gray-900">{formatSum(o.totalAmount)}</p>
                        <p className="text-[11px] text-gray-400">so'm</p>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.status} order={o} /></td>
                      <td className="px-5 py-3.5">
                        <p className={`text-sm font-semibold ${late ? 'text-red-500' : 'text-gray-600'}`}>
                          {o.pickingDeadline ? format(new Date(o.pickingDeadline), 'HH:mm') : '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 font-medium">
                        {format(new Date(o.createdAt), 'HH:mm')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100">
                          <ArrowRight size={13} className="text-blue-400" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
