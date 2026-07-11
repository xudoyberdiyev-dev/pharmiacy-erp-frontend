import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pickerAPI } from '../../api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { AlertCircle, Clock, FileSpreadsheet, CheckCircle2, XCircle, X } from 'lucide-react';

const ETIROV_TYPE_LABELS = {
  WRONG_QUANTITY:  'Dori miqdori noto\'g\'ri',
  WRONG_PRODUCT:   'Noto\'g\'ri dori olib kelindi',
  WRONG_SERIES:    'Dorining seriyasi boshqa',
  DAMAGED:         'Dori shikastlangan',
  MISSING_PRODUCT: 'Dori ro\'yxatda yo\'q',
  OTHER:           'Boshqa sabab',
};

const REJECT_REASONS = [
  { value: 'WRONG_QUANTITY',  label: 'Dori miqdori to\'g\'ri edi' },
  { value: 'WRONG_PRODUCT',   label: 'To\'g\'ri dori olib keldim' },
  { value: 'WRONG_SERIES',    label: 'Seriya to\'g\'ri edi' },
  { value: 'DAMAGED',         label: 'Dori shikastlanmagan edi' },
  { value: 'MISSING_PRODUCT', label: 'Barcha mahsulotlar bor edi' },
  { value: 'OTHER',           label: 'Boshqa izoh yozish' },
];

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ etirov, onClose, onDone }) {
  const [selected, setSelected] = useState([]);
  const [comment, setComment] = useState('');

  const toggle = v => setSelected(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  const mutation = useMutation({
    mutationFn: () => pickerAPI.rejectEtirov(etirov.id, {
      responseTypes: selected,
      responseComment: comment.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success('Etirozni qabul qilmadingiz');
      onDone();
      onClose();
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const canSubmit = selected.length > 0 || comment.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900">Etirozni qabul qilmaslik</h3>
            <p className="text-xs text-gray-400 mt-0.5">Sabab(lar)ni belgilang</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-2">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">Sabab tanlang (bir nechta tanlash mumkin)</p>
          {REJECT_REASONS.map(r => (
            <button key={r.value} onClick={() => toggle(r.value)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 text-left transition-all ${
                selected.includes(r.value)
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-100 hover:border-red-200 hover:bg-red-50/30'
              }`}>
              <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-all ${
                selected.includes(r.value) ? 'border-red-500 bg-red-500' : 'border-gray-300'
              }`}>
                {selected.includes(r.value) && (
                  <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                  </svg>
                )}
              </div>
              <span className={`text-sm font-semibold ${selected.includes(r.value) ? 'text-red-800' : 'text-gray-700'}`}>
                {r.label}
              </span>
            </button>
          ))}

          {selected.includes('OTHER') && (
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Batafsil izoh yozing..."
              rows={3}
              className="w-full mt-2 px-3.5 py-3 rounded-xl border-2 border-gray-200 focus:border-red-400 outline-none text-sm resize-none"
            />
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
            Bekor qilish
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold
              hover:from-red-600 hover:to-rose-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {mutation.isPending
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Yuborilmoqda...</>
              : 'Qabul qilmaslik'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Single etirov action row ───────────────────────────────────────────────────
function EtirovActions({ etirov, onDone }) {
  const qc = useQueryClient();
  const [showReject, setShowReject] = useState(false);

  const acceptMut = useMutation({
    mutationFn: () => pickerAPI.acceptEtirov(etirov.id),
    onSuccess: () => {
      toast.success('Etirozni qabul qildingiz');
      onDone();
      qc.invalidateQueries(['picker-etirozli']);
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  if (etirov.status !== 'PENDING') return null;

  return (
    <>
      {showReject && (
        <RejectModal etirov={etirov} onClose={() => setShowReject(false)} onDone={() => qc.invalidateQueries(['picker-etirozli'])} />
      )}
      <div className="flex gap-2 mt-2">
        <button
          onClick={() => acceptMut.mutate()}
          disabled={acceptMut.isPending}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-all disabled:opacity-60"
        >
          {acceptMut.isPending
            ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <CheckCircle2 size={12} />}
          Qabul qilish
        </button>
        <button
          onClick={() => setShowReject(true)}
          disabled={acceptMut.isPending}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all"
        >
          <XCircle size={12} /> Qabul qilmaslik
        </button>
      </div>
    </>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────
function EtirozliCard({ order }) {
  const qc = useQueryClient();
  // faqat PENDING etirozlarni ko'rsat
  const etirozlar = (order.etirozlar || []).filter(e => e.status === 'PENDING');
  const hasPending = etirozlar.length > 0;

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all ${
      hasPending ? 'border-amber-300' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className={`rounded-t-2xl px-5 py-4 border-b ${hasPending ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-base font-black text-gray-900">#{order.invoiceNumber}</p>
            <p className="text-xs text-gray-500 mt-0.5">{format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}</p>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            hasPending
              ? 'bg-amber-100 border-amber-300'
              : 'bg-gray-100 border-gray-200'
          }`}>
            <AlertCircle size={13} className={hasPending ? 'text-amber-700' : 'text-gray-500'} />
            <span className={`text-[11px] font-black ${hasPending ? 'text-amber-800' : 'text-gray-600'}`}>
              {etirozlar.length} ta etirozli
            </span>
          </div>
        </div>

        {/* Client */}
        <div className="flex items-center gap-2.5 mt-3 p-3 bg-white/80 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
            {order.client?.orgName?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{order.client?.orgName}</p>
            <p className="text-[11px] text-gray-500">Faktura: {order.invoiceNumber} · Lot: {order.lotNumber}</p>
          </div>
        </div>
      </div>

      {/* Etirozlar list */}
      <div className="p-4 space-y-3">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Etirozlar ro'yxati</p>
        {etirozlar.map((e, i) => (
          <div key={e.id || i} className={`rounded-xl p-3.5 border ${
            e.status === 'PENDING'  ? 'bg-amber-50/60 border-amber-100'  :
            e.status === 'ACCEPTED' ? 'bg-green-50/60 border-green-100'  :
            'bg-red-50/60 border-red-100'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black text-gray-800">
                {ETIROV_TYPE_LABELS[e.type] || e.type}
              </span>
              {e.status === 'PENDING'  && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">Kutilmoqda</span>}
              {e.status === 'ACCEPTED' && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-green-100 text-green-700 border border-green-200">Qabul qilindi ✓</span>}
              {e.status === 'REJECTED' && <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-red-100 text-red-700 border border-red-200">Qabul qilinmadi ✗</span>}
            </div>
            {e.comment && <p className="text-[11px] text-gray-600 font-medium mb-1">"{e.comment}"</p>}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-medium">Marker · {format(new Date(e.createdAt), 'dd.MM HH:mm')}</span>
            </div>

            {/* Action buttons for PENDING etirovlar */}
            <EtirovActions etirov={e} onDone={() => qc.invalidateQueries(['picker-etirozli'])} />
          </div>
        ))}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">
              Picking: {order.pickingDeadline ? format(new Date(order.pickingDeadline), 'HH:mm') : '—'}
            </span>
          </div>
          {order.productsExcelUrl && (
            <a
              href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${order.productsExcelUrl}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <FileSpreadsheet size={13} /> Excel
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PickerEtirozliPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['picker-etirozli'],
    queryFn: pickerAPI.getEtirozli,
    refetchInterval: 15000,
    // faqat PENDING etirozli orderlarni ko'rsat
    select: r => (r.data.data || []).filter(o =>
      (o.etirozlar || []).some(e => e.status === 'PENDING')
    ),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          Etirozli orderlar
        </h1>
        <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
          Marker tomonidan etirozlar bildirilgan orderlaringiz
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-52 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-12 bg-gray-100 rounded mb-3" />
              <div className="h-16 bg-amber-50 rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-amber-200" />
          </div>
          <p className="text-gray-500 text-sm font-semibold">Etirozli orderlar yo'q</p>
          <p className="text-gray-300 text-xs mt-1">Hamma narsa tartibda!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map(o => <EtirozliCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
