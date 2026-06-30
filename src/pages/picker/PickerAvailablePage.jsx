import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pickerAPI } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Package, FileSpreadsheet, Clock, Check, Building2,
  Hash, RefreshCw, ChevronRight, AlertTriangle, Zap
} from 'lucide-react';

// ── urgency from deadline ──────────────────────────────────────────────────
function getUrgency(deadline) {
  if (!deadline) return 'normal';
  const rem = new Date(deadline) - new Date();
  if (rem <= 0)            return 'overdue';
  if (rem < 10 * 60000)   return 'critical';
  if (rem < 30 * 60000)   return 'warning';
  return 'normal';
}

const URGENCY_STYLE = {
  normal:   { card: 'border-gray-100',         badge: null,                                  glow: '' },
  warning:  { card: 'border-amber-300',         badge: 'bg-amber-50 text-amber-700 border-amber-300', glow: 'shadow-amber-100' },
  critical: { card: 'border-red-400 animate-pulse-border', badge: 'bg-red-50 text-red-600 border-red-300', glow: 'shadow-red-100' },
  overdue:  { card: 'border-red-500',           badge: 'bg-red-600 text-white border-red-600', glow: 'shadow-red-200' },
};

// ── Remaining time display ────────────────────────────────────────────────
function RemainingTime({ deadline }) {
  const [rem, setRem] = useState(calcRem(deadline));
  useEffect(() => {
    const t = setInterval(() => setRem(calcRem(deadline)), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  if (!deadline) return <span className="text-gray-400 text-xs">—</span>;
  const { overdue, h, m, s } = rem;
  return (
    <span className={`font-mono text-sm font-black ${
      overdue ? 'text-red-600' : rem.total < 10 * 60 ? 'text-red-500' : rem.total < 30 * 60 ? 'text-amber-500' : 'text-teal-600'
    }`}>
      {overdue ? '+' : ''}{h > 0 ? `${h}:` : ''}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </span>
  );
}

function calcRem(deadline) {
  const diff = new Date(deadline) - new Date();
  const abs  = Math.abs(diff);
  const total = Math.floor(abs / 1000);
  return {
    overdue: diff < 0,
    total,
    h: Math.floor(abs / 3600000),
    m: Math.floor((abs % 3600000) / 60000),
    s: Math.floor((abs % 60000) / 1000),
  };
}

// ── Order card ───────────────────────────────────────────────────────────
function OrderCard({ order, onAccepted }) {
  const urgency = getUrgency(order.pickingDeadline);
  const style   = URGENCY_STYLE[urgency];
  const dur     = order.pickingDuration;
  const h       = Math.floor(dur / 60), m = dur % 60;

  const mutation = useMutation({
    mutationFn: () => pickerAPI.accept(order.id),
    onSuccess: () => {
      toast.success('Order qabul qilindi! Picking boshlandi.');
      onAccepted(order.id);
    },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  return (
    <div className={`bg-white rounded-2xl border-2 ${style.card} shadow-sm ${style.glow} hover:shadow-md transition-all duration-200 flex flex-col`}>

      {/* ── Top ── */}
      <div className="p-4 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-mono text-base font-black text-gray-900 tracking-tight">#{order.orderNumber?.slice(-8)}</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}</p>
          </div>
          {urgency !== 'normal' && (
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${style.badge}`}>
              {urgency === 'overdue' ? 'MUDDATI O\'TDI' : urgency === 'critical' ? 'SHOSHILINCH' : 'TEZKOR'}
            </span>
          )}
        </div>

        {/* Client */}
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0">
            {order.client?.orgName?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{order.client?.orgName}</p>
            <p className="text-[11px] text-gray-400">INN: {order.client?.inn}</p>
          </div>
        </div>

        {/* Doc numbers */}
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {[
            { label: 'Shartnoma', val: order.contractNumber },
            { label: 'Faktura',   val: order.invoiceNumber },
            { label: 'Lot',       val: order.lotNumber },
          ].map(({ label, val }) => (
            <div key={label} className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
              <p className="text-[11px] font-black text-gray-800 truncate">{val || '—'}</p>
            </div>
          ))}
        </div>

        {/* Time info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center">
              <Clock size={12} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-medium">Berilgan vaqt</p>
              <p className="text-xs font-black text-gray-800">
                {h > 0 ? `${h}h ` : ''}{m > 0 ? `${m} daq` : `${h} soat`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-medium">Qolgan vaqt</p>
            <RemainingTime deadline={order.pickingDeadline} />
          </div>
        </div>
      </div>

      {/* ── Bottom actions ── */}
      <div className="px-4 pb-4 pt-0 flex items-center gap-2">
        {order.productsExcelUrl && (
          <a
            href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${order.productsExcelUrl}`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <FileSpreadsheet size={13} /> Excel
          </a>
        )}
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold text-white
            bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700
            shadow-md shadow-teal-200 hover:shadow-lg transition-all disabled:opacity-60"
        >
          {mutation.isPending
            ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Qabul qilinmoqda...</>
            : <><Check size={14} strokeWidth={2.5} /> Qabul qilish</>}
        </button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────
export default function PickerAvailablePage() {
  const qc = useQueryClient();
  const [hidden, setHidden] = useState(new Set());

  const { data: orders = [], isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['picker-available'],
    queryFn: pickerAPI.getAvailable,
    refetchInterval: 10000,
    select: r => r.data.data || [],
  });

  const visible = orders.filter(o => !hidden.has(o.id));

  const onAccepted = (id) => {
    setHidden(p => new Set([...p, id]));
    qc.invalidateQueries(['picker-mine']);
    qc.invalidateQueries(['picker-available']);
  };

  // urgency counts
  const urgencyCounts = visible.reduce((acc, o) => {
    acc[getUrgency(o.pickingDeadline)] = (acc[getUrgency(o.pickingDeadline)] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Mavjud orderlar</h1>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">
            {visible.length} ta order · oxirgi yangilanish {format(new Date(dataUpdatedAt), 'HH:mm:ss')}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries(['picker-available'])}
          className={`w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-teal-600 hover:border-teal-300 transition-colors ${isFetching ? 'animate-spin text-teal-500' : ''}`}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Urgency summary */}
      {visible.length > 0 && (urgencyCounts.critical || urgencyCounts.overdue || urgencyCounts.warning) && (
        <div className="flex gap-2 flex-wrap">
          {urgencyCounts.overdue > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200">
              <AlertTriangle size={12} /> {urgencyCounts.overdue} ta muddati o'tgan
            </div>
          )}
          {urgencyCounts.critical > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold">
              <Zap size={12} /> {urgencyCounts.critical} ta shoshilinch
            </div>
          )}
          {urgencyCounts.warning > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold">
              <Clock size={12} /> {urgencyCounts.warning} ta tezkor
            </div>
          )}
        </div>
      )}

      {/* Orders grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-52 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-10 bg-gray-100 rounded mb-3" />
              <div className="h-8 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Package size={28} className="text-gray-200" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">Mavjud orderlar yo'q</p>
          <p className="text-gray-300 text-xs mt-1">Yangi orderlar avtomatik ko'rinadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(o => (
            <OrderCard key={o.id} order={o} onAccepted={onAccepted} />
          ))}
        </div>
      )}
    </div>
  );
}
