import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import {
  FileSpreadsheet, Search, X, CheckSquare, Square,
  RefreshCw, Building2, Truck, Sparkles, Pencil, Check, AlertTriangle
} from 'lucide-react';
import TripModal from './TripModal';
import CheckerEtirovModal from './components/CheckerEtirovModal';

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
        <FileSpreadsheet size={28} className="text-indigo-200" />
      </div>
      <p className="text-gray-400 text-sm font-medium">Hujjatlashtirish uchun order yo'q</p>
      <p className="text-gray-300 text-xs mt-1">Checkingdan o'tgan orderlar shu yerda ko'rinadi</p>
    </div>
  );
}

export default function DocumentPendingPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [etirovOrder, setEtirovOrder] = useState(null);

  const { data: orders = [], isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['document', 'pending'],
    queryFn: () => documentAPI.getPending(),
    select: r => r.data.data || [],
    refetchInterval: 15000,
  });

  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return o.invoiceNumber?.toLowerCase().includes(q)
      || o.contractNumber?.toLowerCase().includes(q)
      || o.lotNumber?.toLowerCase().includes(q)
      || o.client?.orgName?.toLowerCase().includes(q);
  });

  const selectedOrders = orders.filter(o => selected.includes(o.id));
  const totalSelectedAmount = selectedOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  const assignMutation = useMutation({
    mutationFn: ({ driverId, vehicleId }) => documentAPI.assignTrip({ orderIds: selected, driverId, vehicleId }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setSelected([]);
      setShowModal(false);
      qc.invalidateQueries(['document']);
      navigate('/document/documented');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const amountMutation = useMutation({
    mutationFn: ({ id, totalAmount }) => documentAPI.updateAmount(id, totalAmount),
    onSuccess: () => {
      toast.success('Summa yangilandi');
      setEditingId(null);
      qc.invalidateQueries(['document', 'pending']);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const startEditAmount = (o) => {
    setEditingId(o.id);
    setEditValue(String(o.totalAmount ?? ''));
  };

  const saveAmount = (id) => {
    const value = parseFloat(editValue);
    if (Number.isNaN(value) || value < 0) return toast.error("Summani to'g'ri kiriting");
    amountMutation.mutate({ id, totalAmount: value });
  };

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
  const toggleAll = () => setSelected(p => p.length === filtered.length ? [] : filtered.map(o => o.id));
  const allSelected = filtered.length > 0 && selected.length === filtered.length;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileSpreadsheet size={16} className="text-indigo-600" />
            </div>
            Chekingdan o'tgan orderlar
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
            {filtered.length} ta order · {dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries(['document', 'pending'])}
          className={`w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors ${isFetching ? 'animate-spin text-indigo-500' : ''}`}
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
            placeholder="Faktura, shartnoma, lot yoki tashkilot nomi..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-100
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
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
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
                    <button onClick={toggleAll} className="text-gray-400 hover:text-indigo-600 transition-colors">
                      {allSelected ? <CheckSquare size={17} className="text-indigo-600" /> : <Square size={17} />}
                    </button>
                  </th>
                  {['FAKTURA', 'SHARTNOMA', 'LOT', 'TASHKILOT', 'SUMMA', 'AMALLAR'].map(h => (
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
                      className={`border-b border-gray-50 cursor-pointer transition-colors ${isSel ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-gray-50/70'}`}
                    >
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => toggle(o.id)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                          {isSel ? <CheckSquare size={17} className="text-indigo-600" /> : <Square size={17} />}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-mono font-bold text-gray-900">{o.invoiceNumber}</td>
                      <td className="px-5 py-3.5 text-sm font-mono text-gray-500">{o.contractNumber}</td>
                      <td className="px-5 py-3.5 text-sm font-mono text-gray-500">{o.lotNumber}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
                            <Building2 size={12} className="text-indigo-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">{o.client?.orgName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        {editingId === o.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              autoFocus
                              type="text"
                              inputMode="numeric"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value.replace(/[^\d.]/g, ''))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveAmount(o.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              className="w-28 px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            />
                            <button
                              onClick={() => saveAmount(o.id)}
                              disabled={amountMutation.isPending}
                              className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200 transition-colors shrink-0"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="group flex items-center gap-2">
                            <div>
                              {o.originalAmount != null && (
                                <p className="text-[11px] text-gray-400 line-through leading-tight">
                                  {o.originalAmount.toLocaleString()}
                                </p>
                              )}
                              <p className={`text-sm font-black whitespace-nowrap leading-tight ${o.originalAmount != null ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {o.totalAmount?.toLocaleString()}
                              </p>
                              <p className="text-[11px] text-gray-400">so'm</p>
                            </div>
                            <button
                              onClick={() => startEditAmount(o)}
                              className="w-6 h-6 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setEtirovOrder(o)}
                          title="Checkerga etiroz bildirish"
                          className="w-7 h-7 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                        >
                          <AlertTriangle size={14} />
                        </button>
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
                  <Sparkles size={16} className="text-indigo-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{selected.length} ta order tanlandi</p>
                  <p className="text-xs text-gray-400">Jami: {totalSelectedAmount.toLocaleString()} so'm</p>
                </div>
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
                    bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700
                    shadow-lg shadow-indigo-500/30 transition-all"
                >
                  <Truck size={15} /> Haydovchi va mashina biriktirish
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
          confirmLabel="Biriktirish"
        />
      )}

      {etirovOrder && (
        <CheckerEtirovModal
          order={etirovOrder}
          onClose={() => setEtirovOrder(null)}
          onDone={() => setEtirovOrder(null)}
        />
      )}
    </div>
  );
}
