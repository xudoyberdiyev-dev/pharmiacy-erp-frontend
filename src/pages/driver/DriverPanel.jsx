import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import { MapPin, ChevronRight } from 'lucide-react';

export default function DriverPanel() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'driver'],
    queryFn: () => orderAPI.getAll({ limit: 50 }),
    select: r => r.data.data,
    refetchInterval: 20000,
  });

  const orders = data || [];
  const active = orders.filter(o => o.status === 'IN_TRANSIT');
  const done = orders.filter(o => o.status === 'DELIVERED');

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black text-gray-900">Mening buyurtmalarim</h1>

      {/* Faol orderlar */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 mb-2.5 flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
          Yetkazish kerak ({active.length})
        </h2>
        {isLoading && <div className="text-gray-400 text-sm">Yuklanmoqda...</div>}
        <div className="space-y-2.5">
          {active.map(order => (
            <button
              key={order.id}
              onClick={() => navigate(`/driver/orders/${order.id}`)}
              className="w-full bg-white rounded-2xl border border-orange-100 p-4 text-left flex items-center gap-3 active:bg-orange-50/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-black text-sm text-gray-900">#{order.invoiceNumber}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="font-bold text-gray-800 text-sm truncate">{order.client?.orgName}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{order.client?.address || '—'}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </button>
          ))}
          {!isLoading && active.length === 0 && (
            <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100 text-sm">
              Faol order yo'q
            </div>
          )}
        </div>
      </div>

      {/* Tugatilgan */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Yetkazilgan ({done.length})
          </h2>
          <div className="space-y-2">
            {done.slice(0, 10).map(order => (
              <button
                key={order.id}
                onClick={() => navigate(`/driver/orders/${order.id}`)}
                className="w-full bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center justify-between text-left"
              >
                <div className="min-w-0">
                  <span className="font-mono text-sm font-bold text-gray-800">#{order.invoiceNumber}</span>
                  <span className="text-xs text-gray-400 ml-2 truncate">{order.client?.orgName}</span>
                </div>
                <StatusBadge status={order.status} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
