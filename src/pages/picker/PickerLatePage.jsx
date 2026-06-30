import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pickerAPI } from '../../api';
import { format } from 'date-fns';
import {
  AlertTriangle, TrendingDown, TrendingUp, Clock,
  BarChart3, Calendar, CheckCircle2, Package
} from 'lucide-react';

// ── Time diff label ───────────────────────────────────────────────────────
function timeDiffLabel(diffMs) {
  const abs   = Math.abs(diffMs);
  const h     = Math.floor(abs / 3600000);
  const m     = Math.floor((abs % 3600000) / 60000);
  const late  = diffMs > 0;
  const label = h > 0 ? `${h} soat ${m > 0 ? m + ' daqiqa' : ''}` : `${m} daqiqa`;
  return { late, label };
}

// ── Single late order card ────────────────────────────────────────────────
function LateCard({ order, view }) {
  const now    = new Date();
  const dl     = new Date(order.pickingDeadline);
  const doneAt = order.pickingDoneAt ? new Date(order.pickingDoneAt) : null;
  const still  = !doneAt && ['NEW','PICKING'].includes(order.status);
  const diffMs = doneAt ? doneAt - dl : now - dl;
  const { late, label } = timeDiffLabel(diffMs);

  return (
    <div className={`bg-white rounded-2xl border-2 p-4 transition-all hover:shadow-md ${
      still ? 'border-red-400' : late ? 'border-red-200' : 'border-green-200'
    }`}>
      <div className="flex items-start gap-3">

        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          still ? 'bg-red-100' : late ? 'bg-red-50' : 'bg-green-50'
        }`}>
          {still
            ? <AlertTriangle size={18} className="text-red-500" />
            : late
            ? <TrendingDown size={18} className="text-red-400" />
            : <TrendingUp size={18} className="text-green-500" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono font-black text-gray-900">#{order.orderNumber?.slice(-8)}</p>
            {still && (
              <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-md animate-pulse">
                HALI KELMAGAN
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-700 mt-0.5 truncate">{order.client?.orgName}</p>
          <p className="text-[11px] text-gray-400">{order.invoiceNumber}</p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-gray-500">
              <Clock size={11} /> Muddat: {format(dl, 'dd.MM HH:mm')}
            </span>
            {doneAt && (
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <CheckCircle2 size={11} /> Keldi: {format(doneAt, 'HH:mm')}
              </span>
            )}
          </div>
        </div>

        {/* Time diff badge */}
        <div className={`shrink-0 text-right`}>
          <div className={`text-sm font-black px-3 py-1.5 rounded-xl border ${
            still
              ? 'bg-red-600 text-white border-red-600'
              : late
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {still ? '+' : late ? '+' : '-'}{label}
          </div>
          <p className={`text-[10px] font-semibold mt-1 ${
            still ? 'text-red-500' : late ? 'text-red-400' : 'text-green-500'
          }`}>
            {still ? 'kechikmoqda' : late ? 'kech yig\'ildi' : 'erta yig\'ildi'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Stats cards ───────────────────────────────────────────────────────────
function StatsGrid({ stats }) {
  if (!stats) return null;
  const items = [
    { label: 'Jami',         val: stats.total || 0,      icon: Package,      color: 'text-blue-600',   bg: 'bg-blue-50'  },
    { label: 'Kechikkan',    val: stats.lateCount || 0,  icon: TrendingDown, color: 'text-red-600',    bg: 'bg-red-50'   },
    { label: 'Erta kelgan',  val: stats.earlyCount || 0, icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50' },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ label, val, icon: Icon, color, bg }) => (
        <div key={label} className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Icon size={18} className={color} />
          </div>
          <div>
            <p className={`text-3xl font-black ${color}`}>{val}</p>
            <p className="text-[11px] text-gray-500 font-medium">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Period tabs ───────────────────────────────────────────────────────────
const PERIODS = [
  { key: 'day',   label: '1 kun'    },
  { key: 'week',  label: '1 hafta'  },
  { key: 'month', label: '1 oy'     },
];

// ── Main ──────────────────────────────────────────────────────────────────
export default function PickerLatePage() {
  const [tab, setTab]       = useState('active');
  const [period, setPeriod] = useState('day');

  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ['picker-late-active'],
    queryFn: () => pickerAPI.getLate({ view: 'active' }),
    refetchInterval: 30000,
    select: r => r.data,
    enabled: tab === 'active',
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['picker-late-history', period],
    queryFn: () => pickerAPI.getLate({ view: 'history', period }),
    refetchInterval: 60000,
    select: r => r.data,
    enabled: tab === 'history',
  });

  const isLoading = tab === 'active' ? activeLoading : historyLoading;
  const current   = tab === 'active' ? activeData : historyData;
  const orders    = current?.data || [];
  const stats     = current?.stats;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          Kechikkan orderlar
        </h1>
        <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">Vaqtida yetkazilmagan yoki kechikayotgan orderlar</p>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        {[
          { key: 'active',  label: 'Bugun (aktiv)',   icon: AlertTriangle },
          { key: 'history', label: 'Tarix',            icon: BarChart3 },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === key
                ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md shadow-red-200'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}>
            <Icon size={13} /> {label}
            {key === 'active' && activeData?.data?.length > 0 && (
              <span className="bg-white/30 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{activeData.data.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* History period filter */}
      {tab === 'history' && (
        <div className="flex gap-2">
          {PERIODS.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriod(key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold border transition-all ${
                period === key
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}>
              <Calendar size={12} /> {label}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {!isLoading && stats && <StatsGrid stats={stats} />}

      {/* Active view notice */}
      {tab === 'active' && !isLoading && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-700 font-medium flex items-start gap-2">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>Bu sahifa bugungi kechikkan orderlarni ko'rsatadi. Yig'ib keltirilgan bo'lsa ham ko'rsatiladi va keyingi kunga o'tguncha saqlanadi.</span>
        </div>
      )}

      {/* Orders list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-20 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle2 size={28} className="text-green-300" />
          </div>
          <p className="text-gray-500 text-sm font-semibold">
            {tab === 'active' ? 'Bugun kechikkan order yo\'q!' : 'Bu davrda kechikkan order topilmadi'}
          </p>
          <p className="text-gray-300 text-xs mt-1">Barcha orderlar o'z vaqtida yetkazilgan</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => <LateCard key={o.id} order={o} view={tab} />)}
        </div>
      )}
    </div>
  );
}
