import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import { RotateCcw, Building2, MessageSquare, Package, Pencil, Check, Send } from 'lucide-react';
import { formatSum } from '../../lib/format';

function ReturnedCard({ order }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(order.totalAmount ?? ''));
  const [done, setDone] = useState(false);

  const resendMut = useMutation({
    mutationFn: () => documentAPI.resendToAccountant(order.id, editing ? amount : undefined),
    onSuccess: () => {
      setDone(true);
      setTimeout(() => {
        toast.success('Buyurtma tuzatilib, bugalterga qayta yuborildi!');
        qc.invalidateQueries(['document']);
      }, 1000);
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  if (done) {
    return (
      <div className="bg-white rounded-2xl border-2 border-green-300 shadow-sm flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <Check size={30} className="text-green-500" />
        </div>
        <p className="text-sm font-black text-green-700">Qayta yuborildi!</p>
        <p className="text-xs text-gray-400">#{order.invoiceNumber}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm hover:shadow-md transition-all p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-mono text-base font-black text-gray-900">#{order.invoiceNumber}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Qaytarildi: {order.returnedToDocumentAt ? format(new Date(order.returnedToDocumentAt), 'dd.MM HH:mm') : '—'}
          </p>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
          <RotateCcw size={10} /> QAYTARILGAN
        </span>
      </div>

      <div className="flex items-center gap-2 mb-2 p-2.5 bg-gray-50 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-black text-sm shrink-0">
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
          <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-0.5">Bugalter sababi</p>
          <p className="text-sm font-semibold text-red-800 break-words">{order.returnReason || '—'}</p>
        </div>
      </div>

      <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Summa</p>
          {!editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800">
              <Pencil size={11} /> Tuzatish
            </button>
          )}
        </div>
        {editing ? (
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))}
            className="w-full px-3 py-2 rounded-lg border-2 border-indigo-200 focus:border-indigo-400 outline-none text-sm font-bold"
          />
        ) : (
          <p className="text-lg font-black text-indigo-800">{formatSum(order.totalAmount)} so'm</p>
        )}
      </div>

      <button
        onClick={() => resendMut.mutate()}
        disabled={resendMut.isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white
          bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700
          shadow-md shadow-indigo-200 transition-all disabled:opacity-70"
      >
        {resendMut.isPending
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yuborilmoqda...</>
          : <><Send size={15} /> Tuzatib bugalterga qayta yuborish</>}
      </button>
    </div>
  );
}

export default function DocumentReturnedFromAccountantPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['document', 'returned-from-accountant'],
    queryFn: () => documentAPI.getReturnedFromAccountant(),
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
          Bugalterdan qaytganlar
        </h1>
        <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
          1-bugalter hujjatda xato topib qaytargan orderlar — tuzating va qayta yuboring
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-64 animate-pulse">
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
          <p className="text-gray-300 text-xs mt-1">Bugalter orderni qaytarsa shu yerda ko'rinadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map(o => <ReturnedCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
