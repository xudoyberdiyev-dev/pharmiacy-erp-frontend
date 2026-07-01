import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkerAPI } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ClipboardCheck, Clock, Check, RefreshCw, User } from 'lucide-react';

const URGENCY_STYLE = {
  normal:   { card: 'border-gray-100',   badge: null },
  warning:  { card: 'border-amber-300',  badge: 'bg-amber-50 text-amber-700 border-amber-300' },
  critical: { card: 'border-red-400',    badge: 'bg-red-50 text-red-600 border-red-300' },
  overdue:  { card: 'border-red-500',    badge: 'bg-red-600 text-white border-red-600' },
};

function OrderCard({ order, index, onAccepted }) {
  const style = URGENCY_STYLE[order.urgency] || URGENCY_STYLE.normal;
  const dur = order.checkingDuration;
  const h = Math.floor(dur / 60), m = dur % 60;

  const mutation = useMutation({
    mutationFn: () => checkerAPI.accept(order.id),
    onSuccess: () => {
      toast.success('Order qabul qilindi! Checking boshlandi.');
      onAccepted(order.id);
    },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  return (
    <div className={`bg-white rounded-2xl border-2 ${style.card} shadow-sm hover:shadow-md transition-all flex flex-col`}>
      <div className="p-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-mono text-base font-black text-gray-900">#{index + 1}</p>
            <p className="text-xs text-gray-400 mt-0.5">{format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}</p>
          </div>
          {order.urgency !== 'normal' && style.badge && (
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${style.badge}`}>
              {order.urgency === 'overdue' ? 'MUDDATI O\'TDI' : order.urgency === 'critical' ? 'SHOSHILINCH' : 'TEZKOR'}
            </span>
          )}
        </div>

        {/* Client */}
        <div className="flex items-center gap-2 mb-3 p-2.5 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0">
            {order.client?.orgName?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{order.client?.orgName}</p>
            <p className="text-[11px] text-gray-400">Faktura: {order.invoiceNumber}</p>
          </div>
        </div>

        {/* Picker + Marker */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          {order.assignedPicker && (
            <div className="flex items-center gap-1.5 px-2.5 py-2 bg-teal-50 rounded-xl border border-teal-100">
              <User size={11} className="text-teal-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] text-gray-400 font-bold uppercase">Picker</p>
                <p className="text-[11px] font-bold text-teal-800 truncate">{order.assignedPicker.fullName}</p>
              </div>
            </div>
          )}
          {order.marker && (
            <div className="flex items-center gap-1.5 px-2.5 py-2 bg-purple-50 rounded-xl border border-purple-100">
              <User size={11} className="text-purple-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] text-gray-400 font-bold uppercase">Marker</p>
                <p className="text-[11px] font-bold text-purple-800 truncate">{order.marker.fullName}</p>
              </div>
            </div>
          )}
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

        {/* Duration */}
        <div className="flex items-center gap-1.5 p-2.5 bg-sky-50 rounded-xl">
          <div className="w-6 h-6 rounded-md bg-sky-100 flex items-center justify-center shrink-0">
            <Clock size={12} className="text-sky-600" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-medium">Berilgan vaqt</p>
            <p className="text-sm font-black text-sky-700">
              {h > 0 ? `${h} soat ` : ''}{m > 0 ? `${m} daqiqa` : ''}
            </p>
          </div>
          <p className="ml-auto text-[11px] text-gray-400 font-medium">Qabul qilgandan boshlanadi</p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white
            bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700
            shadow-md shadow-sky-200 hover:shadow-lg transition-all disabled:opacity-60"
        >
          {mutation.isPending
            ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Qabul qilinmoqda...</>
            : <><Check size={14} strokeWidth={2.5} /> Qabul qilish</>}
        </button>
      </div>
    </div>
  );
}

export default function CheckerAvailablePage() {
  const qc = useQueryClient();
  const [hidden, setHidden] = useState(new Set());

  const { data: orders = [], isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['checker-available'],
    queryFn: checkerAPI.getAvailable,
    refetchInterval: 10000,
    select: r => r.data.data || [],
  });

  const visible = orders.filter(o => !hidden.has(o.id));

  const onAccepted = id => {
    setHidden(p => new Set([...p, id]));
    qc.invalidateQueries(['checker-mine']);
    qc.invalidateQueries(['checker-available']);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
              <ClipboardCheck size={16} className="text-sky-600" />
            </div>
            Mavjud orderlar
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
            {visible.length} ta order · {dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries(['checker-available'])}
          className={`w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-sky-600 hover:border-sky-300 transition-colors ${isFetching ? 'animate-spin text-sky-500' : ''}`}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-64 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
              <div className="h-10 bg-gray-100 rounded mb-3" />
              <div className="h-8 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-sky-50 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardCheck size={28} className="text-sky-200" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">Mavjud checking orderlar yo'q</p>
          <p className="text-gray-300 text-xs mt-1">Yangi orderlar avtomatik ko'rinadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((o, i) => <OrderCard key={o.id} order={o} index={i} onAccepted={onAccepted} />)}
        </div>
      )}
    </div>
  );
}
