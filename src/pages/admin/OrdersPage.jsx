import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = ['', 'NEW', 'PICKING', 'MARKING', 'CHECKING', 'LOADING', 'IN_TRANSIT', 'DELIVERED'];
const STATUS_LABELS = { '': 'Barchasi', NEW: 'Yangi', PICKING: 'Picking', MARKING: 'Marking', CHECKING: 'Cheking', LOADING: 'Yuklanmoqda', IN_TRANSIT: "Yo'lda", DELIVERED: 'Yetkazildi' };

export default function OrdersPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', status],
    queryFn: () => orderAPI.getAll({ status: status || undefined, limit: 50 }),
    select: r => r.data,
  });

  const orders = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orderlar</h1>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Yuklanmoqda...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-6 py-3">Order #</th>
                <th className="px-6 py-3">Klient</th>
                <th className="px-6 py-3">Faktura</th>
                <th className="px-6 py-3">Summa</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Pick deadline</th>
                <th className="px-6 py-3">Sana</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">Orderlar topilmadi</td></tr>
              )}
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-sm font-bold">{order.orderNumber?.slice(-8)}</td>
                  <td className="px-6 py-3 text-sm max-w-[140px] truncate">{order.client?.orgName}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{order.invoiceNumber}</td>
                  <td className="px-6 py-3 text-sm font-medium">{order.totalAmount?.toLocaleString()}</td>
                  <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {order.pickingDeadline ? format(new Date(order.pickingDeadline), 'dd.MM HH:mm') : '—'}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">{format(new Date(order.createdAt), 'dd.MM HH:mm')}</td>
                  <td className="px-6 py-3">
                    <button onClick={() => navigate(`/admin/orders/${order.id}`)} className="text-blue-600 hover:text-blue-700">
                      <Eye size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
