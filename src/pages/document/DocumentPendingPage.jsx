import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import {
  FileSpreadsheet, Search, X, CheckSquare, Square,
  RefreshCw, Building2, Truck, Sparkles, Pencil, Check, AlertTriangle, Percent, RotateCcw
} from 'lucide-react';
import TripModal from './TripModal';
import CheckerEtirovModal from './components/CheckerEtirovModal';
import { formatSum } from '../../lib/format';

// ── Chegirma berish modali — foiz yoki aniq summada, yangi narx avtomatik
// hisoblanadi va mavjud updateAmount so'rovi orqali saqlanadi (originalAmount
// backendning o'zida birinchi o'zgarishda avtomatik saqlab qo'yiladi). ───────
function DiscountModal({ order, onClose, onApply, isPending }) {
  const [mode, setMode] = useState('percent'); // 'percent' | 'fixed'
  const [value, setValue] = useState('');

  const base = order.totalAmount;
  const num = parseFloat(value) || 0;
  // Tiyingacha (2 xona) aniqlikda — butun somga yaxlitlanmaydi, faqat
  // suzuvchi nuqta arifmetikasi shovqinining (masalan 100.20999999998) oldi olinadi.
  const round2 = (n) => Math.round(n * 100) / 100;
  const discountAmount = mode === 'percent' ? round2(base * (num / 100)) : num;
  const newTotal = Math.max(0, round2(base - discountAmount));
  const canApply = num > 0 && newTotal < base;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900">Chegirma berish</h3>
            <p className="text-xs text-gray-400 mt-0.5">#{order.invoiceNumber} · {order.client?.orgName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setMode('percent'); setValue(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'percent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
            >
              Foizda (%)
            </button>
            <button
              onClick={() => { setMode('fixed'); setValue(''); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'fixed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
            >
              Aniq summada
            </button>
          </div>

          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
              {mode === 'percent' ? 'Chegirma foizi' : "Chegirma summasi (so'm)"}
            </label>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              value={value}
              onChange={e => setValue(e.target.value.replace(/[^\d.]/g, ''))}
              placeholder={mode === 'percent' ? '10' : '50000'}
              className="w-full mt-1 px-3.5 py-2.5 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm font-bold"
            />
          </div>

          <div className="bg-indigo-50 rounded-xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Joriy narx</span>
              <span className="font-bold text-gray-700">{formatSum(base)} so'm</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Chegirma</span>
              <span className="font-bold text-red-500">−{formatSum(discountAmount)} so'm</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1 border-t border-indigo-100">
              <span className="font-black text-gray-800">Yangi narx</span>
              <span className="font-black text-indigo-700">{formatSum(newTotal)} so'm</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Bekor qilish
          </button>
          <button
            onClick={() => onApply(newTotal)}
            disabled={!canApply || isPending}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-bold hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 transition-all"
          >
            {isPending ? 'Saqlanmoqda...' : 'Chegirmani qo\'llash'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Checkingga qaytarish modali (sababi so'raladi) ────────────────────────────
function ReturnToCheckingModal({ order, onClose, onDone }) {
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => documentAPI.returnToChecking(order.id, reason),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Buyurtma checking bo\'limiga qaytarildi');
      onDone();
      onClose();
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900">Orderni checkingga qaytarish</h3>
            <p className="text-xs text-gray-400 mt-0.5">#{order.invoiceNumber} · {order.client?.orgName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-2.5">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Qaytarish sababi</p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Masalan: qutilar soni noto'g'ri, mahsulot yetishmayapti..."
            rows={4}
            className="w-full px-3.5 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 outline-none text-sm resize-none transition-colors"
          />
          <p className="text-[11px] text-gray-400">
            Bu buyurtma aynan shu buyurtmani tekshirgan checker'ning "Qaytganlar" sahifasiga tushadi va
            checker'ga 5 jarima bali beriladi.
          </p>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Bekor qilish
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!reason.trim() || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold
              hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {mutation.isPending
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Qaytarilmoqda...</>
              : <><RotateCcw size={14} /> Qaytarish</>}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [discountOrder, setDiscountOrder] = useState(null);
  const [returnOrder, setReturnOrder] = useState(null);

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
                                  {formatSum(o.originalAmount)}
                                </p>
                              )}
                              <p className={`text-sm font-black whitespace-nowrap leading-tight ${o.originalAmount != null ? 'text-emerald-600' : 'text-gray-900'}`}>
                                {formatSum(o.totalAmount)}
                              </p>
                              <p className="text-[11px] text-gray-400">so'm</p>
                            </div>
                            <button
                              onClick={() => startEditAmount(o)}
                              title="Qo'lda tahrirlash"
                              className="w-6 h-6 rounded-lg text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => setDiscountOrder(o)}
                              title="Chegirma berish"
                              className="w-6 h-6 rounded-lg text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <Percent size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEtirovOrder(o)}
                            title="Checkerga etiroz bildirish"
                            className="w-7 h-7 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                          >
                            <AlertTriangle size={14} />
                          </button>
                          <button
                            onClick={() => setReturnOrder(o)}
                            title="Checkingga qaytarish"
                            className="w-7 h-7 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 flex items-center justify-center transition-colors"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
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
                  <p className="text-xs text-gray-400">Jami: {formatSum(totalSelectedAmount)} so'm</p>
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

      {discountOrder && (
        <DiscountModal
          order={discountOrder}
          isPending={amountMutation.isPending}
          onClose={() => setDiscountOrder(null)}
          onApply={(newTotal) => amountMutation.mutate(
            { id: discountOrder.id, totalAmount: newTotal },
            { onSuccess: () => setDiscountOrder(null) }
          )}
        />
      )}

      {returnOrder && (
        <ReturnToCheckingModal
          order={returnOrder}
          onClose={() => setReturnOrder(null)}
          onDone={() => qc.invalidateQueries(['document'])}
        />
      )}
    </div>
  );
}
