import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userAPI, vehicleAPI } from '../../api';
import { X, Truck, User2, ArrowRight } from 'lucide-react';
import SearchableSelect from './SearchableSelect';
import { formatSum } from '../../lib/format';

export default function TripModal({ orders, onClose, onConfirm, loading, confirmLabel = 'Safarga chiqarish' }) {
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');

  const { data: drivers } = useQuery({
    queryKey: ['users', 'DRIVER'],
    queryFn: () => userAPI.getAll({ role: 'DRIVER', isActive: true }),
    select: r => r.data.data,
  });
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', 'active'],
    queryFn: () => vehicleAPI.getAll({ isActive: true }),
    select: r => r.data.data,
  });

  const driverOptions = (drivers || []).map(d => ({ value: d.id, label: d.fullName, sub: d.phone }));
  const vehicleOptions = (vehicles || []).map(v => ({ value: v.id, label: v.model, sub: v.plateNumber }));

  const totalAmount = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalBoxes = orders.reduce((s, o) => s + (o.boxCount || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Truck size={16} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Haydovchi va mashina biriktirish</h3>
              <p className="text-xs text-gray-400">{orders.length} ta order · {totalBoxes} quti · {formatSum(totalAmount)} so'm</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="max-h-32 overflow-y-auto space-y-1.5 bg-gray-50 rounded-xl p-2.5">
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between px-2.5 py-1.5 bg-white rounded-lg text-xs">
                <span className="font-mono font-bold text-gray-700">{o.invoiceNumber}</span>
                <span className="text-gray-500 truncate max-w-[160px]">{o.client?.orgName}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Haydovchi *</label>
            <SearchableSelect
              value={driverId}
              onChange={setDriverId}
              options={driverOptions}
              placeholder="Haydovchini qidiring yoki tanlang..."
              icon={User2}
              emptyLabel="Haydovchi topilmadi"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mashina *</label>
            <SearchableSelect
              value={vehicleId}
              onChange={setVehicleId}
              options={vehicleOptions}
              placeholder="Mashinani qidiring yoki tanlang..."
              icon={Truck}
              emptyLabel="Mashina topilmadi"
            />
          </div>
        </div>

        <div className="p-5 border-t border-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Ortga
          </button>
          <button
            onClick={() => onConfirm(driverId, vehicleId)}
            disabled={!driverId || !vehicleId || loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 shadow-md shadow-emerald-200"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Bajarilmoqda...</>
              : <>{confirmLabel} <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
