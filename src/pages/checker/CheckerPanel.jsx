import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { CheckCircle, Package } from 'lucide-react';
import { format } from 'date-fns';

export default function CheckerPanel() {
  const qc = useQueryClient();
  const [boxCounts, setBoxCounts] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'checking'],
    queryFn: () => orderAPI.getAll({ status: 'CHECKING', limit: 50 }),
    select: r => r.data.data,
    refetchInterval: 15000,
  });

  const completeMutation = useMutation({
    mutationFn: ({ id }) => orderAPI.completeChecking(id, { boxCount: boxCounts[id] }),
    onSuccess: () => { toast.success('Cheking yakunlandi! Safarga tayyor.'); qc.invalidateQueries(['orders']); },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const orders = data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cheking Panel</h1>

      {isLoading && <div className="text-gray-400">Yuklanmoqda...</div>}
      {!isLoading && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">Cheking uchun order yo'q</div>
      )}

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold">#{order.orderNumber?.slice(-8)}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="font-medium">{order.client?.orgName}</p>
                <p className="text-sm text-gray-500">{order.client?.address}</p>
                <div className="text-xs text-gray-500 mt-1 space-x-3">
                  <span>Faktura: {order.invoiceNumber}</span>
                  <span>Lot: {order.lotNumber}</span>
                  <span>Summa: {order.totalAmount?.toLocaleString()} so'm</span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Chekin deadline: {order.checkingDeadline ? format(new Date(order.checkingDeadline), 'dd.MM HH:mm') : '—'}
                </p>
              </div>
              <div className="flex gap-2">
                {order.productsExcelUrl && (
                  <a href={`http://localhost:5000${order.productsExcelUrl}`} className="text-blue-600 text-xs hover:underline" target="_blank" rel="noreferrer">
                    📥 Mahsulotlar
                  </a>
                )}
                {order.markedExcelUrl && (
                  <a href={`http://localhost:5000${order.markedExcelUrl}`} className="text-purple-600 text-xs hover:underline" target="_blank" rel="noreferrer">
                    📋 Marked
                  </a>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-end gap-4">
                <div className="flex-1 max-w-xs">
                  <label className="label flex items-center gap-1">
                    <Package size={14} /> Jami qutilar soni *
                  </label>
                  <input
                    type="number"
                    className="input"
                    placeholder="0"
                    min="1"
                    value={boxCounts[order.id] || ''}
                    onChange={e => setBoxCounts(p => ({ ...p, [order.id]: e.target.value }))}
                  />
                </div>
                <button
                  onClick={() => completeMutation.mutate({ id: order.id })}
                  disabled={!boxCounts[order.id] || completeMutation.isPending}
                  className="btn-success flex items-center gap-2"
                >
                  <CheckCircle size={17} /> Safarga tayyor
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
