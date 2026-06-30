import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Clock, Play, CheckCircle } from 'lucide-react';

export default function PickerPanel() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'picker'],
    queryFn: () => orderAPI.getAll({ limit: 50 }),
    select: r => r.data.data,
    refetchInterval: 15000,
  });

  const startMutation = useMutation({
    mutationFn: (id) => orderAPI.startPicking(id),
    onSuccess: () => { toast.success('Picking boshlandi!'); qc.invalidateQueries(['orders']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const doneMutation = useMutation({
    mutationFn: (id) => orderAPI.completePicking(id),
    onSuccess: () => { toast.success('Picking yakunlandi! Marking bo\'limiga o\'tdi.'); qc.invalidateQueries(['orders']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const newOrders = (data || []).filter(o => o.status === 'NEW');
  const myOrders = (data || []).filter(o => o.status === 'PICKING');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Picking Panel</h1>

      {/* Yangi orderlar */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
          Yangi orderlar ({newOrders.length})
        </h2>
        {isLoading && <div className="text-gray-400 text-sm">Yuklanmoqda...</div>}
        <div className="space-y-3">
          {newOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              action={<button onClick={() => startMutation.mutate(order.id)} disabled={startMutation.isPending} className="btn-primary flex items-center gap-2 text-sm">
                <Play size={15} /> Boshlash
              </button>}
            />
          ))}
          {!isLoading && newOrders.length === 0 && (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border">Yangi orderlar yo'q</div>
          )}
        </div>
      </div>

      {/* Mening orderlarim (PICKING) */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Picking jarayonida ({myOrders.length})
        </h2>
        <div className="space-y-3">
          {myOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              action={<button onClick={() => doneMutation.mutate(order.id)} disabled={doneMutation.isPending} className="btn-success flex items-center gap-2 text-sm">
                <CheckCircle size={15} /> Yakunlash
              </button>}
            />
          ))}
          {myOrders.length === 0 && (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border">Jarayonda order yo'q</div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, action }) {
  const isLate = order.pickingDeadline && new Date(order.pickingDeadline) < new Date();

  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm ${isLate ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono font-bold text-gray-900">#{order.orderNumber?.slice(-8)}</span>
            <StatusBadge status={order.status} />
            {isLate && <span className="text-xs text-red-600 font-medium">⚠️ Kechikmoqda</span>}
          </div>
          <p className="font-medium text-gray-800">{order.client?.orgName}</p>
          <p className="text-sm text-gray-500 mt-1">{order.client?.address}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Pick: {order.pickingDeadline ? format(new Date(order.pickingDeadline), 'dd.MM HH:mm') : '—'}
            </span>
            <span>Faktura: {order.invoiceNumber}</span>
            <span>Lot: {order.lotNumber}</span>
          </div>
          <p className="text-sm font-semibold text-gray-800 mt-1">{order.totalAmount?.toLocaleString()} so'm</p>
        </div>
        <div className="flex-shrink-0">{action}</div>
      </div>
    </div>
  );
}
