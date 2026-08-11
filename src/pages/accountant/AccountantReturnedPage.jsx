import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import { RotateCcw, Building2, MessageSquare, Package, CheckCircle2 } from 'lucide-react';
import { formatSum } from '../../lib/format';

function ReturnedCard({ order }) {
  const qc = useQueryClient();

  const confirmMut = useMutation({
    mutationFn: () => orderAPI.accountantConfirm(order.id),
    onSuccess: () => {
      toast.success('Qayta ko\'rib chiqilib tasdiqlandi!');
      qc.invalidateQueries(['orders']);
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm hover:shadow-md transition-all p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-mono text-base font-black text-gray-900">#{order.invoiceNumber}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Qaytarildi: {order.returnedToAccountant1At ? format(new Date(order.returnedToAccountant1At), 'dd.MM HH:mm') : '—'}
          </p>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
          <RotateCcw size={10} /> QAYTARILGAN
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2 p-2.5 bg-gray-50 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-black text-sm shrink-0">
          <Building2 size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{order.client?.orgName}</p>
          <p className="text-[11px] text-gray-400">{order.invoiceNumber}</p>
        </div>
      </div>

      <div className="flex items-start gap-2 mb-3 p-3 bg-red-50 rounded-xl border border-red-200">
        <MessageSquare size={14} className="text-red-500 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-0.5">2-bugalter sababi</p>
          <p className="text-sm font-semibold text-red-800 break-words">{order.returnReason || '—'}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium">Summa</span>
        <span className="text-sm font-black text-gray-800">{formatSum(order.totalAmount)} so'm</span>
      </div>

      <button
        onClick={() => confirmMut.mutate()}
        disabled={confirmMut.isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white
          bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700
          shadow-md shadow-amber-200 transition-all disabled:opacity-70"
      >
        {confirmMut.isPending
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yuborilmoqda...</>
          : <><CheckCircle2 size={15} /> Qayta ko'rib chiqib tasdiqlash</>}
      </button>
    </div>
  );
}

export default function AccountantReturnedPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', 'accountant', 'returned-from-accountant2'],
    queryFn: () => orderAPI.getReturnedFromAccountant2(),
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
          Qaytganlar
        </h1>
        <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
          2-bugalter qaytargan orderlar — qayta ko'rib chiqib tasdiqlang
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-56 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-12 bg-gray-100 rounded mb-3" />
              <div className="h-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <Package size={28} className="text-amber-300" />
          </div>
          <p className="text-gray-500 text-sm font-semibold">Hozircha qaytgan order yo'q</p>
          <p className="text-gray-300 text-xs mt-1">2-bugalter orderni qaytarsa shu yerda ko'rinadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map(o => <ReturnedCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
