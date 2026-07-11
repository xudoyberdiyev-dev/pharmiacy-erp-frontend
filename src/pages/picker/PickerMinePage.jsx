import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pickerAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import {
  CheckCircle2, Clock, FileSpreadsheet, Package,
  AlertTriangle, TrendingUp, Zap, RotateCcw
} from 'lucide-react';

// ── Countdown hook ────────────────────────────────────────────────────────
function useCountdown(deadline, totalMinutes) {
  const [state, setState] = useState(() => calcState(deadline, totalMinutes));
  useEffect(() => {
    const t = setInterval(() => setState(calcState(deadline, totalMinutes)), 1000);
    return () => clearInterval(t);
  }, [deadline, totalMinutes]);
  return state;
}

function calcState(deadline, totalMinutes) {
  const diff = new Date(deadline) - new Date();
  const overdue = diff < 0;
  const abs = Math.abs(diff);
  const totalMs = totalMinutes * 60000;
  const pct = overdue ? 0 : Math.max(0, Math.min(100, (diff / totalMs) * 100));
  return {
    overdue,
    abs,
    h: Math.floor(abs / 3600000),
    m: Math.floor((abs % 3600000) / 60000),
    s: Math.floor((abs % 60000) / 1000),
    pct,
    urgency: overdue ? 'overdue' : diff < 5 * 60000 ? 'critical' : diff < 15 * 60000 ? 'warning' : 'normal',
  };
}

// ── Timer display ─────────────────────────────────────────────────────────
function TimerDisplay({ deadline, totalMinutes }) {
  const { overdue, h, m, s, pct, urgency } = useCountdown(deadline, totalMinutes);

  const colorMap = {
    normal:   { text: 'text-teal-600',  bar: 'bg-gradient-to-r from-teal-400 to-blue-500',  bg: 'bg-teal-50'  },
    warning:  { text: 'text-amber-600', bar: 'bg-gradient-to-r from-amber-400 to-orange-400', bg: 'bg-amber-50' },
    critical: { text: 'text-red-600',   bar: 'bg-gradient-to-r from-red-500 to-orange-500',   bg: 'bg-red-50'   },
    overdue:  { text: 'text-red-700',   bar: 'bg-red-500',                                    bg: 'bg-red-50'   },
  };
  const c = colorMap[urgency];

  return (
    <div className={`rounded-2xl p-4 ${c.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
          {overdue ? 'Vaqt o\'tib ketdi' : 'Qolgan vaqt'}
        </p>
        {overdue && <AlertTriangle size={13} className="text-red-500" />}
      </div>
      <p className={`text-4xl font-black font-mono tracking-tight ${c.text}`}>
        {overdue ? '+' : ''}{h > 0 ? `${h}:` : ''}{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </p>
      {!overdue && (
        <div className="mt-3 h-2 bg-white/70 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${c.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {overdue && (
        <p className="text-xs text-red-600 font-semibold mt-1.5">Kechikkan — tezroq yetkazing!</p>
      )}
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────
function MineCard({ order, blocked }) {
  const qc = useQueryClient();
  const isOverdue = order.pickingDeadline && new Date(order.pickingDeadline) < new Date();
  const dur = order.pickingDuration || 0;

  const completeMut = useMutation({
    mutationFn: () => pickerAPI.complete(order.id),
    onSuccess: () => {
      toast.success('Yig\'ish yakunlandi! Marking bo\'limiga o\'tdi.');
      qc.invalidateQueries(['picker-mine']);
      qc.invalidateQueries(['picker-available']);
      qc.invalidateQueries(['picker-late-active']);
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all duration-200 hover:shadow-md ${
      isOverdue ? 'border-red-300' : 'border-teal-200'
    }`}>
      <div className="p-4">

        {/* Order # + client */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-mono text-base font-black text-gray-900">#{order.invoiceNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Qabul qilindi: {order.pickingStartedAt ? format(new Date(order.pickingStartedAt), 'HH:mm') : '—'}
            </p>
          </div>
          {isOverdue && (
            <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
              <AlertTriangle size={10} /> KECHIKKAN
            </span>
          )}
        </div>

        {/* Client box */}
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0">
            {order.client?.orgName?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{order.client?.orgName}</p>
            <p className="text-[11px] text-gray-400">{order.invoiceNumber}</p>
          </div>
        </div>

        {/* Timer */}
        <TimerDisplay deadline={order.pickingDeadline} totalMinutes={dur} />

        {/* Meta row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">
              Muddat: {order.pickingDeadline ? format(new Date(order.pickingDeadline), 'HH:mm') : '—'}
            </span>
          </div>
          <span className="text-xs font-bold text-gray-700">{order.totalAmount?.toLocaleString()} so'm</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        {order.productsExcelUrl && (
          <a
            href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${order.productsExcelUrl}`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors shrink-0"
          >
            <FileSpreadsheet size={13} /> Excel
          </a>
        )}
        <button
          onClick={() => completeMut.mutate()}
          disabled={completeMut.isPending || blocked}
          title={blocked ? 'Avval markingdan qaytgan orderni yakunlang' : undefined}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold text-white
            bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700
            shadow-md shadow-green-200 hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {completeMut.isPending
            ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</>
            : <><CheckCircle2 size={15} strokeWidth={2.5} /> Yig'ib keldim</>}
        </button>
      </div>
    </div>
  );
}

// ── Stats mini bar ────────────────────────────────────────────────────────
function StatsRow({ orders }) {
  const overdue  = orders.filter(o => o.pickingDeadline && new Date(o.pickingDeadline) < new Date()).length;
  const onTime   = orders.length - overdue;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[
        { label: 'Jami',       val: orders.length, icon: Package,     color: 'text-blue-600',  bg: 'bg-blue-50'  },
        { label: 'O\'z vaqtida', val: onTime,      icon: TrendingUp,  color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Kechikkan',  val: overdue,       icon: AlertTriangle,color: 'text-red-600',  bg: 'bg-red-50'   },
      ].map(({ label, val, icon: Icon, color, bg }) => (
        <div key={label} className={`${bg} rounded-2xl p-3.5 flex items-center gap-3`}>
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Icon size={17} className={color} />
          </div>
          <div>
            <p className={`text-2xl font-black ${color}`}>{val}</p>
            <p className="text-[11px] text-gray-500 font-medium">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function PickerMinePage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['picker-mine'],
    queryFn: pickerAPI.getMine,
    refetchInterval: 15000,
    select: r => r.data.data || [],
  });
  const { data: returned = [] } = useQuery({
    queryKey: ['picker-returned'],
    queryFn: pickerAPI.getReturned,
    refetchInterval: 15000,
    select: r => r.data.data || [],
  });
  const hasReturned = returned.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Mening buyurtmalarim</h1>
        <p className="text-sm text-gray-400 mt-0.5 font-medium">Men qabul qilgan va yig'ayotgan buyurtmalar</p>
      </div>

      {hasReturned && (
        <Link
          to="/picker/returned"
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <RotateCcw size={16} className="text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-amber-800">
              Sizda markingdan qaytgan {returned.length} ta buyurtma bor
            </p>
            <p className="text-xs text-amber-600 font-medium">
              Yangi buyurtmalarni yakunlashdan oldin avval shularni yakunlang →
            </p>
          </div>
        </Link>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-64 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-12 bg-gray-100 rounded mb-3" />
              <div className="h-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
            <Zap size={28} className="text-teal-300" />
          </div>
          <p className="text-gray-500 text-sm font-semibold">Hozircha biriktirilgan buyurtma yo'q</p>
          <p className="text-gray-300 text-xs mt-1">Mavjud buyurtmalardan birini qabul qiling</p>
        </div>
      ) : (
        <>
          <StatsRow orders={orders} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map(o => <MineCard key={o.id} order={o} blocked={hasReturned} />)}
          </div>
        </>
      )}
    </div>
  );
}
