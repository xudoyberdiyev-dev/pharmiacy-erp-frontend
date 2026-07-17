import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { documentAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import {
  Truck, Search, X, RefreshCw, Building2, User2,
  FileCheck2, Clock, MapPin, Repeat2, Ban
} from 'lucide-react';
import TripModal from './TripModal';

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="w-16 h-16 mx-auto bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
        <Truck size={28} className="text-orange-200" />
      </div>
      <p className="text-gray-400 text-sm font-medium">Safarga tayyorlangan order yo'q</p>
      <p className="text-gray-300 text-xs mt-1">"Hujjatlashtirilgan" bo'limidan safarga chiqaring</p>
    </div>
  );
}

function FullReturnModal({ order, onClose, onDone }) {
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => documentAPI.fullReturn(order.id, reason),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Buyurtma butunlay qaytarildi');
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
            <h3 className="font-black text-gray-900">Orderni butunlay qaytarish</h3>
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
            placeholder="Masalan: mijoz qabul qilmadi, manzilga yetib borib bo'lmadi..."
            rows={4}
            className="w-full px-3.5 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm resize-none transition-colors"
          />
          <p className="text-[11px] text-gray-400">
            Haydovchi hali yukni topshirmagan bo'lsa ishlatiladi. Order "Qaytgan" statusiga o'tadi va bu
            haydovchi hamda safarga tayyor ro'yxatidan chiqib ketadi. Bu amalni ortga qaytarib bo'lmaydi.
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
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold
              hover:from-red-600 hover:to-rose-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {mutation.isPending
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Qaytarilmoqda...</>
              : <><Ban size={14} /> Butunlay qaytarish</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ o, onReassign, onFullReturn }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center shrink-0">
        <Building2 size={16} className="text-orange-600" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-black text-gray-900">{o.invoiceNumber}</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <FileCheck2 size={10} /> № {o.dispatchDocument?.documentNumber ?? '—'}
          </span>
        </div>
        <p className="text-sm text-gray-500 truncate mt-0.5">{o.client?.orgName}</p>
        {o.client?.address && (
          <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
            <MapPin size={10} /> {o.client.address}
          </p>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-sky-50 rounded-xl border border-sky-100 shrink-0">
        <User2 size={13} className="text-sky-600" />
        <div className="min-w-0">
          <p className="text-[9px] text-sky-400 font-bold uppercase tracking-wider">Haydovchi</p>
          <p className="text-xs font-bold text-sky-800 truncate max-w-[120px]">{o.driver?.fullName}</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-violet-50 rounded-xl border border-violet-100 shrink-0">
        <Truck size={13} className="text-violet-600" />
        <div className="min-w-0">
          <p className="text-[9px] text-violet-400 font-bold uppercase tracking-wider">Mashina</p>
          <p className="text-xs font-bold text-violet-800 truncate max-w-[130px]">{o.vehicle?.model} · {o.vehicle?.plateNumber}</p>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-1.5 text-gray-400 shrink-0">
        <Clock size={12} />
        <span className="text-xs font-medium whitespace-nowrap">
          {o.dispatchedAt ? format(new Date(o.dispatchedAt), 'dd.MM HH:mm') : '—'}
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onReassign(o)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-sky-700
            bg-sky-50 border border-sky-200 hover:bg-sky-100 transition-colors"
        >
          <Repeat2 size={14} /> Almashtirish
        </button>
        <button
          onClick={() => onFullReturn(o)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-500
            bg-gray-50 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          <Ban size={14} /> Qaytarish
        </button>
      </div>
    </div>
  );
}

export default function DocumentReadyPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [reassignOrder, setReassignOrder] = useState(null);
  const [fullReturnOrder, setFullReturnOrder] = useState(null);

  const { data: orders = [], isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['document', 'ready'],
    queryFn: () => documentAPI.getReady(),
    select: r => r.data.data || [],
    refetchInterval: 15000,
  });

  const reassignMutation = useMutation({
    mutationFn: ({ id, driverId, vehicleId }) => documentAPI.reassignTrip(id, { driverId, vehicleId }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Haydovchi almashtirildi');
      qc.invalidateQueries(['document']);
      setReassignOrder(null);
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return o.invoiceNumber?.toLowerCase().includes(q)
      || o.client?.orgName?.toLowerCase().includes(q)
      || o.driver?.fullName?.toLowerCase().includes(q)
      || o.vehicle?.plateNumber?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
              <Truck size={16} className="text-orange-600" />
            </div>
            Safarga tayyor orderlar
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
            {filtered.length} ta order yo'lda · {dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries(['document', 'ready'])}
          className={`w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:border-orange-300 transition-colors ${isFetching ? 'animate-spin text-orange-500' : ''}`}
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
            placeholder="Faktura, tashkilot, haydovchi yoki mashina raqami..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-orange-100
              transition-all placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
              <X size={12} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Yuklanmoqda...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState />
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(o => (
            <OrderRow key={o.id} o={o} onReassign={setReassignOrder} onFullReturn={setFullReturnOrder} />
          ))}
        </div>
      )}

      {reassignOrder && (
        <TripModal
          orders={[reassignOrder]}
          onClose={() => setReassignOrder(null)}
          onConfirm={(driverId, vehicleId) => reassignMutation.mutate({ id: reassignOrder.id, driverId, vehicleId })}
          loading={reassignMutation.isPending}
          confirmLabel="Qayta biriktirish"
        />
      )}

      {fullReturnOrder && (
        <FullReturnModal
          order={fullReturnOrder}
          onClose={() => setFullReturnOrder(null)}
          onDone={() => qc.invalidateQueries(['document'])}
        />
      )}
    </div>
  );
}
