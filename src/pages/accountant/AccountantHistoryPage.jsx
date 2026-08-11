import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { Calendar, Package, History, Truck, AlertTriangle } from 'lucide-react';
import { formatSum } from '../../lib/format';
import { getErrorMessage } from '../../lib/errors';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function OrderRow({ order, atField }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-mono text-sm font-black text-gray-900">{order.invoiceNumber}</p>
          <p className="text-[11px] text-gray-400">{order.client?.orgName}</p>
        </div>
        <span className="text-sm font-bold text-gray-700">{formatSum(order.totalAmount)} so'm</span>
      </div>

      {order.driver && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg mb-2 w-fit">
          <Truck size={10} className="text-blue-600" />
          <span className="text-[10px] font-bold text-blue-800">{order.driver.fullName}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <span>Yetkazildi: {order.deliveredAt ? format(new Date(order.deliveredAt), 'HH:mm') : '—'}</span>
        <span>Tasdiqlandi: {order[atField] ? format(new Date(order[atField]), 'HH:mm') : '—'}</span>
      </div>
    </div>
  );
}

export default function AccountantHistoryPage() {
  const { user } = useAuth();
  const isStep2 = user?.role === 'ACCOUNTANT2';
  const atField = isStep2 ? 'acct2ConfirmedAt' : 'acct1ConfirmedAt';
  const theme = isStep2
    ? { accent: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-100' }
    : { accent: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100' };

  const [date, setDate] = useState(today());

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['orders', 'accountant-history', user?.role, date],
    queryFn: () => orderAPI.getAccountantHistory({ date }),
    select: (r) => r.data,
  });

  const orders = data?.data || [];
  const total = data?.stats?.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${theme.iconBg} flex items-center justify-center`}>
              <History size={16} className={theme.accent} />
            </div>
            Tarix
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
            {isStep2 ? 'Siz 2-tasdiqlagan' : 'Siz 1-tasdiqlagan'} buyurtmalar
          </p>
        </div>
        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
          <Calendar size={14} className={theme.accent} />
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm font-bold text-gray-700 outline-none cursor-pointer bg-transparent"
          />
        </label>
      </div>

      <div className={`${theme.bg} rounded-2xl p-4 w-fit min-w-[180px] flex items-center gap-3`}>
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <Package size={19} className={theme.accent} />
        </div>
        <div>
          <p className={`text-3xl font-black ${theme.accent}`}>{total}</p>
          <p className="text-[11px] text-gray-500 font-medium">Tasdiqlangan</p>
        </div>
      </div>

      {isError ? (
        <div className="bg-red-50 rounded-2xl border border-red-100 shadow-sm py-16 text-center px-6">
          <div className="w-14 h-14 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-3">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <p className="text-red-600 text-sm font-bold">Tarixni yuklab bo'lmadi</p>
          <p className="text-red-400 text-xs mt-1">{getErrorMessage(error)}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Qayta urinish
          </button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-24 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <div className={`w-14 h-14 mx-auto ${theme.bg} rounded-2xl flex items-center justify-center mb-3`}>
            <History size={24} className={theme.accent} />
          </div>
          <p className="text-gray-400 text-sm font-semibold">Bu kunda tasdiqlangan buyurtmalar yo'q</p>
          <p className="text-gray-300 text-xs mt-1">{format(new Date(date + 'T00:00:00'), 'dd.MM.yyyy')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider px-1">
            {orders.length} ta order — {format(new Date(date + 'T00:00:00'), 'dd.MM.yyyy')}
          </p>
          {orders.map((o) => <OrderRow key={o.id} order={o} atField={atField} />)}
        </div>
      )}
    </div>
  );
}
