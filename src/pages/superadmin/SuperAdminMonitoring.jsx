import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import { MapPin, Clock, Package, Truck, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_GROUPS = [
  { status: 'NEW', label: 'Yangi', color: 'bg-gray-500' },
  { status: 'PICKING', label: 'Picking', color: 'bg-blue-500' },
  { status: 'MARKING', label: 'Marking', color: 'bg-purple-500' },
  { status: 'CHECKING', label: 'Cheking', color: 'bg-amber-500' },
  { status: 'IN_TRANSIT', label: "Yo'lda", color: 'bg-orange-500' },
];

export default function SuperAdminMonitoring() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['monitoring'],
    queryFn: () => statsAPI.getMonitoring(),
    select: r => r.data.data,
    refetchInterval: 20000,
  });

  const activeOrders = Array.isArray(data) ? data : [];
  const groups = STATUS_GROUPS.reduce((acc, { status }) => {
    acc[status] = activeOrders.filter(o => o.status === status).length;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package size={24} /> Real-time Monitoring
        </h1>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          Yangilash
        </button>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {STATUS_GROUPS.map(({ status, label, color }) => (
          <div key={status} className="bg-white rounded-xl border p-4 text-center shadow-sm">
            <div className={`w-3 h-3 rounded-full ${color} mx-auto mb-2`}></div>
            <p className="text-2xl font-bold">{groups[status] ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Active orders */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3">Faol orderlar ({activeOrders.length})</h2>
        {isLoading && <div className="text-gray-400 text-sm">Yuklanmoqda...</div>}
        {!isLoading && activeOrders.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border">
            Hozirda faol order yo'q
          </div>
        )}
        <div className="space-y-3">
          {activeOrders.map(order => {
            const isLate = checkLate(order);
            return (
              <div key={order.id} className={`bg-white rounded-xl border p-5 shadow-sm ${isLate ? 'border-red-300' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold">#{order.orderNumber?.slice(-8)}</span>
                      <StatusBadge status={order.status} />
                      {isLate && <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full">⚠️ Kechikmoqda</span>}
                    </div>
                    <p className="font-medium text-gray-800 mt-1">{order.client?.orgName}</p>
                    <div className="flex items-start gap-1 text-sm text-gray-500 mt-0.5">
                      <MapPin size={13} className="mt-0.5 flex-shrink-0" />
                      <span className="truncate">{order.client?.address}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-2">
                      {order.assignedPicker && <span>🏃 {order.assignedPicker.fullName}</span>}
                      {order.driver && <span><Truck size={11} className="inline" /> {order.driver.fullName}</span>}
                      {order.vehicle && <span>🚗 {order.vehicle.plateNumber}</span>}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-400 flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Clock size={11} />
                      {format(new Date(order.createdAt), 'dd.MM HH:mm')}
                    </div>
                    <p className="font-medium text-gray-700 mt-1">{order.totalAmount?.toLocaleString()} so'm</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function checkLate(order) {
  const now = new Date();
  if (order.status === 'NEW' || order.status === 'PICKING') {
    return order.pickingDeadline && new Date(order.pickingDeadline) < now;
  }
  if (order.status === 'MARKING') {
    return order.markingDeadline && new Date(order.markingDeadline) < now;
  }
  if (order.status === 'CHECKING') {
    return order.checkingDeadline && new Date(order.checkingDeadline) < now;
  }
  return false;
}
