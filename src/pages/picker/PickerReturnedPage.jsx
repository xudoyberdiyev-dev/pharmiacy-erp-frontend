import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pickerAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import {
  CheckCircle2, RotateCcw, User, MessageSquare, Package, FileSpreadsheet,
} from 'lucide-react';

// ── Order card ────────────────────────────────────────────────────────────────
function ReturnedCard({ order }) {
  const qc = useQueryClient();
  const [done, setDone] = useState(false);

  const completeMut = useMutation({
    mutationFn: () => pickerAPI.complete(order.id),
    onSuccess: () => {
      setDone(true);
      setTimeout(() => {
        toast.success('Qayta yig\'ib yuborildi! Marking bo\'limiga o\'tdi.');
        qc.invalidateQueries(['picker-returned']);
        qc.invalidateQueries(['picker-mine']);
        qc.invalidateQueries(['picker-available']);
      }, 1200);
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  if (done) {
    return (
      <div className="bg-white rounded-2xl border-2 border-green-300 shadow-sm flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <CheckCircle2 size={30} className="text-green-500" />
        </div>
        <p className="text-sm font-black text-green-700">Qayta yuborildi! Marking bo'limiga o'tdi.</p>
        <p className="text-xs text-gray-400">#{order.invoiceNumber}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm hover:shadow-md transition-all">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-mono text-base font-black text-gray-900">#{order.invoiceNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Qaytarildi: {order.returnedToPickingAt ? format(new Date(order.returnedToPickingAt), 'dd.MM HH:mm') : '—'}
            </p>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
            <RotateCcw size={10} /> QAYTARILGAN
          </span>
        </div>

        {/* Client */}
        <div className="flex items-center gap-2 mb-2 p-2.5 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0">
            {order.client?.orgName?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{order.client?.orgName}</p>
            <p className="text-[11px] text-gray-400">{order.invoiceNumber}</p>
          </div>
        </div>

        {/* Marker */}
        {order.marker && (
          <div className="flex items-center gap-2 mb-2 px-2.5 py-2 bg-purple-50 rounded-xl border border-purple-100">
            <User size={12} className="text-purple-600 shrink-0" />
            <span className="text-xs font-bold text-purple-800">{order.marker.fullName}</span>
            <span className="text-[10px] text-gray-400 ml-auto">marker</span>
          </div>
        )}

        {/* Marker sababi */}
        <div className="flex items-start gap-2 mb-3 p-3 bg-red-50 rounded-xl border border-red-200">
          <MessageSquare size={14} className="text-red-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-0.5">Marker sababi</p>
            <p className="text-sm font-semibold text-red-800 break-words">{order.returnReason || '—'}</p>
          </div>
        </div>

        {/* Excel */}
        {order.productsExcelUrl && (
          <a
            href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${order.productsExcelUrl}`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 mb-3 bg-teal-50 border border-teal-200 rounded-xl text-xs font-bold text-teal-700 hover:bg-teal-100 transition-colors"
          >
            <FileSpreadsheet size={14} /> Buyurtma Excelini ko'rish
          </a>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between mt-1 mb-3">
          <span className="text-xs text-gray-500 font-medium">Faktura: {order.invoiceNumber}</span>
          <span className="text-xs font-bold text-gray-700">{order.totalAmount?.toLocaleString()} so'm</span>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => completeMut.mutate()}
          disabled={completeMut.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white
            bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700
            shadow-md shadow-green-200 transition-all disabled:opacity-70"
        >
          {completeMut.isPending
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yuborilmoqda...</>
            : <><CheckCircle2 size={15} /> Yig'ib bo'ldim, qayta yubordim</>}
        </button>
      </div>
    </div>
  );
}

export default function PickerReturnedPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['picker-returned'],
    queryFn: pickerAPI.getReturned,
    refetchInterval: 15000,
    select: r => r.data.data || [],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          
          Markingdan qaytganlar
        </h1>
        <p className="text-sm text-gray-400 mt-0.5  font-medium">
          Marker qaytargan orderlar — qayta yig'ib yuboring (vaqt hisoblanmaydi)
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-72 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-12 bg-gray-100 rounded mb-3" />
              <div className="h-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <Package size={28} className="text-amber-300" />
          </div>
          <p className="text-gray-500 text-sm font-semibold">Hozircha qaytgan order yo'q</p>
          <p className="text-gray-300 text-xs mt-1">Marker orderni qaytarsa shu yerda ko'rinadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map(o => <ReturnedCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
