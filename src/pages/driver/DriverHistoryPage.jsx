import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import { format } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, History, Package, MapPin } from 'lucide-react';
import { formatSum } from '../../lib/format';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function DriverHistoryPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['driver-history', from, to, page],
    queryFn: () => orderAPI.getAll({ status: 'DELIVERED', from, to, page, limit }),
    select: r => r.data,
  });

  const orders = data?.data || [];
  const total = data?.total || 0;
  const pages = data?.pages || 1;
  const totalAmount = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  const setQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setFrom(start.toISOString().slice(0, 10));
    setTo(end.toISOString().slice(0, 10));
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
        <History size={20} className="text-[#3B5BFD]" /> Yetkazish tarixi
      </h1>

      {/* Sana filtri */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3.5 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl">
            <Calendar size={14} className="text-[#3B5BFD] shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-gray-400 font-bold uppercase">Dan</p>
              <input
                type="date"
                value={from}
                max={to}
                onChange={e => { setFrom(e.target.value); setPage(1); }}
                className="text-xs font-bold text-gray-700 outline-none bg-transparent w-full"
              />
            </div>
          </label>
          <label className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-xl">
            <Calendar size={14} className="text-[#3B5BFD] shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-gray-400 font-bold uppercase">Gacha</p>
              <input
                type="date"
                value={to}
                min={from}
                max={today()}
                onChange={e => { setTo(e.target.value); setPage(1); }}
                className="text-xs font-bold text-gray-700 outline-none bg-transparent w-full"
              />
            </div>
          </label>
        </div>
        <div className="flex gap-1.5">
          {[
            { label: 'Bugun', days: 0 },
            { label: '7 kun', days: 7 },
            { label: '30 kun', days: 30 },
          ].map(({ label, days }) => (
            <button key={label} onClick={() => setQuickRange(days)}
              className="flex-1 py-1.5 rounded-lg text-[11px] font-bold bg-gray-50 text-gray-500 active:bg-gray-100 transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-green-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-green-600">{total}</p>
          <p className="text-[10px] text-gray-500 font-bold mt-0.5">Yetkazilgan</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-3 text-center">
          <p className="text-lg font-black text-blue-600 truncate">{formatSum(totalAmount)}</p>
          <p className="text-[10px] text-gray-500 font-bold mt-0.5">Jami summa (shu sahifa)</p>
        </div>
      </div>

      {/* Ro'yxat */}
      {isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Package size={28} className="mx-auto text-gray-200 mb-2" />
          <p className="text-gray-400 text-sm font-medium">Bu oraliqda yetkazilgan order yo'q</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {orders.map(order => (
            <button
              key={order.id}
              onClick={() => navigate(`/driver/orders/${order.id}`)}
              className="w-full bg-white rounded-2xl border border-gray-100 p-3.5 text-left active:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono font-black text-sm text-gray-900">#{order.invoiceNumber}</span>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-sm font-semibold text-gray-700 truncate">{order.client?.orgName}</p>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-1 text-[11px] text-gray-400 min-w-0">
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate">{order.client?.address || '—'}</span>
                </div>
                <span className="text-xs font-bold text-gray-600 shrink-0 ml-2">{formatSum(order.totalAmount)} so'm</span>
              </div>
              {order.deliveredAt && (
                <p className="text-[10px] text-gray-400 mt-1">
                  {format(new Date(order.deliveredAt), 'dd.MM.yyyy HH:mm')}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-400 font-medium">Sahifa {page} / {pages}</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
