import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI, userAPI, vehicleAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { Truck, Package, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentPanel() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState([]);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', 'IN_TRANSIT'],
    queryFn: () => orderAPI.getAll({ status: 'IN_TRANSIT', limit: 100 }),
    select: r => r.data.data,
    refetchInterval: 15000,
  });

  const { data: drivers } = useQuery({
    queryKey: ['users', 'DRIVER'],
    queryFn: () => userAPI.getAll({ role: 'DRIVER' }),
    select: r => r.data.data,
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehicleAPI.getAll(),
    select: r => r.data.data,
  });

  const assignMutation = useMutation({
    mutationFn: () => orderAPI.assignDriver({ driverId, vehicleId, orderIds: selected }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setSelected([]);
      setDriverId('');
      setVehicleId('');
      qc.invalidateQueries(['orders']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const orders = ordersData || [];

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    const unassigned = orders.filter(o => !o.driverId).map(o => o.id);
    setSelected(prev => prev.length === unassigned.length ? [] : unassigned);
  };

  const unassignedOrders = orders.filter(o => !o.driverId);
  const assignedOrders = orders.filter(o => o.driverId);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Truck size={24} /> Document Panel
      </h1>

      {/* Haydovchi biriktirish paneli */}
      {unassignedOrders.length > 0 && (
        <div className="card space-y-5">
          <h2 className="font-semibold text-gray-700">Haydovchi biriktirish</h2>

          {/* Select all */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
              {selected.length === unassignedOrders.length && unassignedOrders.length > 0
                ? <CheckSquare size={18} className="text-blue-600" />
                : <Square size={18} />
              }
              Hammasini tanlash ({unassignedOrders.length})
            </button>
            {selected.length > 0 && (
              <span className="text-sm font-medium text-blue-600">{selected.length} ta tanlandi</span>
            )}
          </div>

          {/* Orders list */}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {isLoading && <div className="text-gray-400 text-sm">Yuklanmoqda...</div>}
            {unassignedOrders.map(order => (
              <label key={order.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected.includes(order.id) ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="checkbox"
                  checked={selected.includes(order.id)}
                  onChange={() => toggleSelect(order.id)}
                  className="mt-0.5 text-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">#{order.orderNumber?.slice(-8)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{order.client?.orgName}</p>
                  <p className="text-xs text-gray-500 truncate">{order.client?.address}</p>
                  <div className="flex gap-3 text-xs text-gray-400 mt-1">
                    <span>Faktura: {order.invoiceNumber}</span>
                    <span>Qutilar: {order.boxCount || '—'}</span>
                    <span>{order.totalAmount?.toLocaleString()} so'm</span>
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Driver + Vehicle */}
          {selected.length > 0 && (
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Haydovchi *</label>
                  <select className="input" value={driverId} onChange={e => setDriverId(e.target.value)}>
                    <option value="">— Haydovchi tanlang —</option>
                    {(drivers || []).map(d => (
                      <option key={d.id} value={d.id}>{d.fullName} · {d.phone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Mashina *</label>
                  <select className="input" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
                    <option value="">— Mashina tanlang —</option>
                    {(vehicles || []).map(v => (
                      <option key={v.id} value={v.id}>{v.model} · {v.plateNumber}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => assignMutation.mutate()}
                disabled={!driverId || !vehicleId || assignMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Truck size={18} />
                {assignMutation.isPending ? 'Biriktirilmoqda...' : `${selected.length} ta orderni haydovchiga biriktirish`}
              </button>
            </div>
          )}
        </div>
      )}

      {unassignedOrders.length === 0 && !isLoading && (
        <div className="card text-center py-10 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p>Haydovchi kutayotgan order yo'q</p>
        </div>
      )}

      {/* Haydovchiga biriktirilgan */}
      {assignedOrders.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Haydovchiga biriktirilgan ({assignedOrders.length})</h2>
          <div className="space-y-2">
            {assignedOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">#{order.orderNumber?.slice(-8)}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 truncate">{order.client?.orgName}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p className="font-medium">{order.driver?.fullName}</p>
                  <p className="text-xs">{order.vehicle?.plateNumber}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
