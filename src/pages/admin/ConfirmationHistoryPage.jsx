import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import { format } from 'date-fns';
import { Calendar, Package, CheckCircle2, AlertTriangle, Truck, History } from 'lucide-react';
import { formatSum } from '../../lib/format';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
        <Icon size={19} className={color} />
      </div>
      <div>
        <p className={`text-3xl font-black ${color}`}>{value}</p>
        <p className="text-[11px] text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

function OrderRow({ order }) {
  return (
    <div className={`bg-white rounded-2xl border-2 p-4 shadow-sm ${order.wasLate ? 'border-red-200' : 'border-green-200'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="font-mono text-sm font-black text-gray-900">{order.invoiceNumber}</p>
          <p className="text-[11px] text-gray-400">{order.client?.orgName}</p>
        </div>
        {order.wasLate ? (
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200">
            <AlertTriangle size={10} /> {order.hoursToConfirm} soatda (kech)
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg bg-green-50 text-green-600 border border-green-200">
            <CheckCircle2 size={10} /> {order.hoursToConfirm} soatda
          </span>
        )}
      </div>

      {order.driver && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg mb-2 w-fit">
          <Truck size={10} className="text-blue-600" />
          <span className="text-[10px] font-bold text-blue-800">{order.driver.fullName}</span>
        </div>
      )}

      <div className="flex items-center justify-between text-[11px] text-gray-400">
        <span>Yetkazildi: {format(new Date(order.deliveredAt), 'HH:mm')} · Tasdiqlandi: {format(new Date(order.confirmedAt), 'HH:mm')}</span>
        <span className="font-bold text-gray-600">{formatSum(order.totalAmount)} so'm</span>
      </div>
    </div>
  );
}

export default function ConfirmationHistoryPage() {
  const [date, setDate] = useState(today());

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'confirmation-history', date],
    queryFn: () => orderAPI.getConfirmationHistory({ date }),
    select: (r) => r.data,
  });

  const orders = data?.data || [];
  const stats = data?.stats || { total: 0, onTimeCount: 0, lateCount: 0 };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <History size={16} className="text-blue-600" />
            </div>
            Tasdiqlash tarixi
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">Admin tomonidan tasdiqlangan buyurtmalar</p>
        </div>
        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
          <Calendar size={14} className="text-blue-500" />
          <input
            type="date"
            value={date}
            max={today()}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm font-bold text-gray-700 outline-none cursor-pointer bg-transparent"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard icon={Package} label="Jami tasdiqlangan" value={stats.total} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={CheckCircle2} label="O'z vaqtida (48s ichida)" value={stats.onTimeCount} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={AlertTriangle} label="Kechikib tasdiqlangan" value={stats.lateCount} color="text-red-600" bg="bg-red-50" />
      </div>

      {isLoading ? (
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
          <div className="w-14 h-14 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
            <History size={24} className="text-blue-200" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">Bu kunda tasdiqlangan buyurtmalar yo'q</p>
          <p className="text-gray-300 text-xs mt-1">{format(new Date(date + 'T00:00:00'), 'dd.MM.yyyy')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider px-1">
            {orders.length} ta order — {format(new Date(date + 'T00:00:00'), 'dd.MM.yyyy')}
          </p>
          {orders.map((o) => <OrderRow key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
