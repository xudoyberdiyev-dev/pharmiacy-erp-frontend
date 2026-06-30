import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { MapPin, Camera, CheckCircle, Navigation } from 'lucide-react';

export default function DriverPanel() {
  const qc = useQueryClient();
  const [photos, setPhotos] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'driver'],
    queryFn: () => orderAPI.getAll({ limit: 50 }),
    select: r => r.data.data,
    refetchInterval: 20000,
  });

  const deliverMutation = useMutation({
    mutationFn: ({ id }) => {
      const fd = new FormData();
      fd.append('photo', photos[id]);
      return orderAPI.deliver(id, fd);
    },
    onSuccess: () => { toast.success('Yetkazib berish tasdiqlandi! TG xabar yuborildi.'); qc.invalidateQueries(['orders']); },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const orders = data || [];
  const active = orders.filter(o => o.status === 'IN_TRANSIT');
  const done = orders.filter(o => o.status === 'DELIVERED');

  const openMaps = (lat, lon, name) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${name}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mening Orderlarim</h1>

      {/* Faol orderlar */}
      <div>
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
          Yetkazish kerak ({active.length})
        </h2>
        {isLoading && <div className="text-gray-400 text-sm">Yuklanmoqda...</div>}
        <div className="space-y-4">
          {active.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-orange-200 p-5 shadow-sm space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold">#{order.orderNumber?.slice(-8)}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="font-medium text-gray-800">{order.client?.orgName}</p>
                <div className="flex items-start gap-1 text-sm text-gray-500 mt-1">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{order.client?.address}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1 space-x-2">
                  <span>Faktura: {order.invoiceNumber}</span>
                  <span>Qutilar: {order.boxCount || '—'}</span>
                  <span>Summa: {order.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <button
                  onClick={() => openMaps(order.client?.latitude, order.client?.longitude, order.client?.orgName)}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                >
                  <Navigation size={16} /> Xaritada ochish
                </button>

                {/* Rasm yuklash */}
                <div>
                  {photos[order.id] ? (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <Camera size={16} className="text-green-600" />
                      <span className="text-sm text-green-700 flex-1">{photos[order.id].name}</span>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-400 text-sm text-gray-500">
                      <Camera size={16} /> Yetkazib berish rasmini olish *
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => setPhotos(p => ({ ...p, [order.id]: e.target.files[0] }))} />
                    </label>
                  )}
                </div>

                <button
                  onClick={() => deliverMutation.mutate({ id: order.id })}
                  disabled={!photos[order.id] || deliverMutation.isPending}
                  className="btn-success w-full flex items-center justify-center gap-2"
                >
                  <CheckCircle size={17} /> Topshirildi
                </button>
              </div>
            </div>
          ))}
          {!isLoading && active.length === 0 && (
            <div className="text-center py-8 text-gray-400 bg-white rounded-xl border">Faol order yo'q</div>
          )}
        </div>
      </div>

      {/* Tugatilgan */}
      {done.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Yetkazilgan ({done.length})
          </h2>
          <div className="space-y-2">
            {done.slice(0, 5).map(order => (
              <div key={order.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-bold">#{order.orderNumber?.slice(-8)}</span>
                  <span className="text-sm text-gray-500 ml-2">{order.client?.orgName}</span>
                </div>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
