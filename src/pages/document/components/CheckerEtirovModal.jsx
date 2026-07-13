import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../../lib/errors';
import Modal from '../../../components/shared/Modal';
import { AlertTriangle, Send } from 'lucide-react';

const CHECKER_ETIROV_TYPES = [
  { value: 'WRONG_QUANTITY', label: "Dori miqdori noto'g'ri" },
  { value: 'WRONG_PRODUCT', label: "Noto'g'ri dori topshirilgan" },
  { value: 'WRONG_SERIES', label: "Dorining seriyasi boshqa" },
  { value: 'DAMAGED', label: "Dori shikastlangan/yaroqsiz" },
  { value: 'MISSING_PRODUCT', label: "Mahsulot yo'q edi" },
  { value: 'OTHER', label: "Boshqa sabab (qo'lda yozing)" },
];

export default function CheckerEtirovModal({ order, onClose, onDone }) {
  const qc = useQueryClient();
  const [type, setType] = useState('');
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () => documentAPI.raiseCheckerEtirov(order.id, { type, comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success('Etiroz Checkerga yuborildi');
      qc.invalidateQueries({ queryKey: ['document', 'pending'] });
      onDone();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const canSubmit = type && (type !== 'OTHER' || comment.trim());

  return (
    <Modal title={`Checkerga etiroz — ${order.invoiceNumber}`} onClose={onClose}>
      <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4">
        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-800">
          Etiroz yuborilganda checkerga (<b>{order.checker?.fullName || '—'}</b>) <b>5 ball jarima</b> avtomatik yoziladi.
        </p>
      </div>

      <div className="space-y-2 mb-4">
        {CHECKER_ETIROV_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setType(t.value)}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
              type === t.value ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {type === 'OTHER' && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Sababni yozing..."
          rows={3}
          className="input w-full mb-4"
          autoFocus
        />
      )}
      {type && type !== 'OTHER' && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Qo'shimcha izoh (ixtiyoriy)"
          rows={2}
          className="input w-full mb-4"
        />
      )}

      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit || mutation.isPending}
          className="flex-1 rounded-xl font-bold text-sm py-2.5 text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          <Send size={15} /> {mutation.isPending ? 'Yuborilmoqda...' : 'Yuborish'}
        </button>
      </div>
    </Modal>
  );
}
