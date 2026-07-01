import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI, userAPI, vehicleAPI } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FileCheck2, Search, X, CheckSquare, Square,
  RefreshCw, Building2, Truck, User2, ArrowRight
} from 'lucide-react';

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
        <FileCheck2 size={28} className="text-emerald-200" />
      </div>
      <p className="text-gray-400 text-sm font-medium">Hujjatlashtirilgan order yo'q</p>
      <p className="text-gray-300 text-xs mt-1">"Chekingdan o'tganlar" bo'limida hujjat chiqaring</p>
    </div>
  );
}

function TripModal({ orders, onClose, onConfirm, loading }) {
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
              <h3 className="font-bold text-gray-900">Safarga chiqarish</h3>
              <p className="text-xs text-gray-400">{orders.length} ta order · {totalBoxes} quti · {totalAmount.toLocaleString()} so'm</p>
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
            <select
              value={driverId}
              onChange={e => setDriverId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-colors"
            >
              <option value="">— Haydovchi tanlang —</option>
              {(drivers || []).map(d => (
                <option key={d.id} value={d.id}>{d.fullName} · {d.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Mashina *</label>
            <select
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-colors"
            >
              <option value="">— Mashina tanlang —</option>
              {(vehicles || []).map(v => (
                <option key={v.id} value={v.id}>{v.model} · {v.plateNumber}</option>
              ))}
            </select>
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
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Biriktirilmoqda...</>
              : <>Safarga chiqarish <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentDocumentedPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data: orders = [], isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['document', 'documented'],
    queryFn: () => documentAPI.getPending(),
    select: r => (r.data.data || []).filter(o => !!o.dispatchDocumentId),
    refetchInterval: 15000,
  });

  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return o.invoiceNumber?.toLowerCase().includes(q)
      || o.client?.orgName?.toLowerCase().includes(q)
      || String(o.dispatchDocument?.documentNumber).includes(q);
  });

  const selectedOrders = orders.filter(o => selected.includes(o.id));

  const assignMutation = useMutation({
    mutationFn: ({ driverId, vehicleId }) => documentAPI.assignTrip({ orderIds: selected, driverId, vehicleId }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setSelected([]);
      setShowModal(false);
      qc.invalidateQueries(['document']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const toggleAll = () => setSelected(p => p.length === filtered.length ? [] : filtered.map(o => o.id));
  const allSelected = filtered.length > 0 && selected.length === filtered.length;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <FileCheck2 size={16} className="text-emerald-600" />
            </div>
            Hujjatlashtirilgan orderlar
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
            {filtered.length} ta order · {dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries(['document', 'documented'])}
          className={`w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors ${isFetching ? 'animate-spin text-emerald-500' : ''}`}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Faktura, tashkilot yoki hujjat raqami..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-100
              transition-all placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
              <X size={12} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-5 py-3.5 w-10">
                    <button onClick={toggleAll} className="text-gray-400 hover:text-emerald-600 transition-colors">
                      {allSelected ? <CheckSquare size={17} className="text-emerald-600" /> : <Square size={17} />}
                    </button>
                  </th>
                  {['HUJJAT №', 'FAKTURA', 'TASHKILOT', 'QUTILAR', 'SUMMA'].map(h => (
                    <th key={h} className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const isSel = selected.includes(o.id);
                  return (
                    <tr
                      key={o.id}
                      onClick={() => toggle(o.id)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${isSel ? 'bg-emerald-50/60 hover:bg-emerald-50' : 'hover:bg-gray-50/70'}`}
                    >
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggle(o.id)} className="text-gray-400 hover:text-emerald-600 transition-colors">
                          {isSel ? <CheckSquare size={17} className="text-emerald-600" /> : <Square size={17} />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <FileCheck2 size={11} /> № {o.dispatchDocument?.documentNumber}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold text-gray-900">{o.invoiceNumber}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shrink-0">
                            <Building2 size={12} className="text-emerald-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{o.client?.orgName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-600">{o.boxCount ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-black text-gray-900 whitespace-nowrap">{o.totalAmount?.toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400">so'm</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky selection bar */}
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
          <div className="max-w-screen-xl mx-auto px-5 pb-5">
            <div className="pointer-events-auto bg-gray-900 rounded-2xl shadow-2xl shadow-gray-900/30 px-5 py-4 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <User2 size={16} className="text-emerald-300" />
                </div>
                <p className="text-sm font-bold text-white">{selected.length} ta order tanlandi</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelected([])}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-300 hover:bg-white/10 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white
                    bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700
                    shadow-lg shadow-emerald-500/30 transition-all"
                >
                  <Truck size={15} /> Safarga chiqarish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <TripModal
          orders={selectedOrders}
          onClose={() => setShowModal(false)}
          onConfirm={(driverId, vehicleId) => assignMutation.mutate({ driverId, vehicleId })}
          loading={assignMutation.isPending}
        />
      )}
    </div>
  );
}
