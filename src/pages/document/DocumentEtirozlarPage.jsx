import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../../api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { AlertCircle, Send, CheckCircle2 } from 'lucide-react';

const ETIROV_TYPE_LABELS = {
  WRONG_AMOUNT: "Hujjatdagi summa noto'g'ri",
  WRONG_DOCUMENT_NUMBER: "Hujjat raqami yoki sanasi noto'g'ri",
  ILLEGIBLE_DOCUMENT: "Hujjat sifatsiz / o'qib bo'lmaydi",
  OTHER: 'Boshqa sabab',
};

const FROM_ROLE_LABELS = { ACCOUNTANT1: 'Bugalter 1', ACCOUNTANT2: 'Bugalter 2' };

function RespondForm({ etirov }) {
  const qc = useQueryClient();
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () => documentAPI.respondEtirov(etirov.id, { responseComment: comment.trim() }),
    onSuccess: () => {
      toast.success('Javob saqlandi');
      qc.invalidateQueries({ queryKey: ['document-etirozli'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="mt-2.5 flex gap-2">
      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Javob yozing..."
        className="input flex-1 text-sm"
      />
      <button
        onClick={() => mutation.mutate()}
        disabled={!comment.trim() || mutation.isPending}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
      >
        <Send size={13} /> Javob berish
      </button>
    </div>
  );
}

function EtirozCard({ order }) {
  const etirozlar = order.etirozlar || [];
  return (
    <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm">
      <div className="rounded-t-2xl px-5 py-4 border-b border-amber-100 bg-amber-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-base font-black text-gray-900">#{order.invoiceNumber}</p>
            <p className="text-xs text-gray-500 mt-0.5">{order.client?.orgName}</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-[11px] font-black text-amber-800">
            <AlertCircle size={13} /> {etirozlar.length} ta etiroz
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {etirozlar.map((e) => (
          <div
            key={e.id}
            className={`rounded-xl p-3.5 border ${e.status === 'ACCEPTED' ? 'bg-green-50/60 border-green-100' : 'bg-amber-50/60 border-amber-100'}`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-gray-800">{ETIROV_TYPE_LABELS[e.type] || e.type}</span>
              {e.status === 'ACCEPTED' ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Javob berildi
                </span>
              ) : (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200">Javob kutilmoqda</span>
              )}
            </div>
            {e.comment && <p className="text-[11px] text-gray-600 font-medium mb-1">"{e.comment}"</p>}
            <span className="text-[10px] text-gray-400 font-medium">
              {FROM_ROLE_LABELS[e.fromRole] || e.fromRole} · {format(new Date(e.createdAt), 'dd.MM.yyyy HH:mm')}
            </span>

            {e.responseComment ? (
              <div className="mt-2 pt-2 border-t border-gray-200/70">
                <p className="text-[11px] text-gray-500">
                  <b className="text-gray-700">Javobingiz:</b> {e.responseComment}
                </p>
              </div>
            ) : (
              <RespondForm etirov={e} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DocumentEtirozlarPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['document-etirozli'],
    queryFn: documentAPI.getEtirozli,
    refetchInterval: 20000,
    select: (r) => r.data.data || [],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          Etirozlar
        </h1>
        <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
          Bugalterlar tomonidan hujjatlaringizga bildirilgan etirozlar
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-40 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-amber-200" />
          </div>
          <p className="text-gray-500 text-sm font-semibold">Etirozlar yo'q</p>
          <p className="text-gray-300 text-xs mt-1">Hamma narsa tartibda!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map((o) => <EtirozCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
