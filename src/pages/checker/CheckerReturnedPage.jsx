import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkerAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import {
  CheckCircle2, RotateCcw, MessageSquare, Package, Minus, Plus,
} from 'lucide-react';
import { formatSum } from '../../lib/format';

// ── Order card ────────────────────────────────────────────────────────────────
function ReturnedCard({ order }) {
  const qc = useQueryClient();
  const [boxCount, setBoxCount] = useState(order.boxCount || 1);
  const [done, setDone] = useState(false);

  const completeMut = useMutation({
    mutationFn: () => checkerAPI.complete(order.id, { boxCount }),
    onSuccess: () => {
      setDone(true);
      setTimeout(() => {
        toast.success('Buyurtma tuzatilib, hujjatchiga qayta yuborildi!');
        qc.invalidateQueries(['checker-returned']);
        qc.invalidateQueries(['checker-mine']);
        qc.invalidateQueries(['checker-available']);
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
        <p className="text-sm font-black text-green-700">Qayta yuborildi!</p>
        <p className="text-xs text-gray-400">#{order.invoiceNumber}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm hover:shadow-md transition-all">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-mono text-base font-black text-gray-900">#{order.invoiceNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Qaytarildi: {order.returnedToCheckingAt ? format(new Date(order.returnedToCheckingAt), 'dd.MM HH:mm') : '—'}
            </p>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
            <RotateCcw size={10} /> QAYTARILGAN
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2 p-2.5 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0">
            {order.client?.orgName?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{order.client?.orgName}</p>
            <p className="text-[11px] text-gray-400">{order.invoiceNumber}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 mb-3 p-3 bg-red-50 rounded-xl border border-red-200">
          <MessageSquare size={14} className="text-red-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-0.5">Hujjatchi sababi</p>
            <p className="text-sm font-semibold text-red-800 break-words">{order.returnReason || '—'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1 mb-3">
          <span className="text-xs text-gray-500 font-medium">Faktura: {order.invoiceNumber}</span>
          <span className="text-xs font-bold text-gray-700">{formatSum(order.totalAmount)} so'm</span>
        </div>

        <div className="p-3 bg-sky-50 rounded-xl border border-sky-100">
          <p className="text-[10px] font-black text-sky-600 uppercase tracking-wider mb-2">Qutilar sonini tuzating</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setBoxCount(v => Math.max(1, v - 1))}
              className="w-9 h-9 rounded-xl bg-white border border-sky-200 text-sky-600 flex items-center justify-center hover:bg-sky-100 transition-colors"
            >
              <Minus size={15} />
            </button>
            <span className="text-2xl font-black text-sky-800 w-12 text-center">{boxCount}</span>
            <button
              onClick={() => setBoxCount(v => v + 1)}
              className="w-9 h-9 rounded-xl bg-white border border-sky-200 text-sky-600 flex items-center justify-center hover:bg-sky-100 transition-colors"
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={() => completeMut.mutate()}
          disabled={completeMut.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white
            bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700
            shadow-md shadow-sky-200 transition-all disabled:opacity-70"
        >
          {completeMut.isPending
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yuborilmoqda...</>
            : <><CheckCircle2 size={15} /> Tuzatib hujjatchiga qayta yuborish</>}
        </button>
      </div>
    </div>
  );
}

export default function CheckerReturnedPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['checker-returned'],
    queryFn: checkerAPI.getReturned,
    refetchInterval: 15000,
    select: r => r.data.data || [],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <RotateCcw size={16} className="text-amber-600" />
          </div>
          Qaytgan buyurtmalar
        </h1>
        <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
          Hujjatchi qaytargan orderlar — qutilarni tuzating va qayta yuboring (vaqt hisoblanmaydi)
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
          <p className="text-gray-300 text-xs mt-1">Hujjatchi orderni qaytarsa shu yerda ko'rinadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map(o => <ReturnedCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
