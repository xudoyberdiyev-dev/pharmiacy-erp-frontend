import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../../lib/errors';
import Modal from '../../../components/shared/Modal';
import { AlertTriangle, Send, CheckCircle2 } from 'lucide-react';

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
  const [types, setTypes] = useState([]); // bir nechta tur bir vaqtda tanlanishi mumkin
  const [comment, setComment] = useState('');

  const toggleType = (value) => {
    setTypes(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const mutation = useMutation({
    mutationFn: () => documentAPI.raiseCheckerEtirov(order.id, { types, comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success('Etiroz Checkerga yuborildi');
      qc.invalidateQueries({ queryKey: ['document', 'pending'] });
      onDone();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const canSubmit = types.length > 0 && (!types.includes('OTHER') || comment.trim());

  return (
    <Modal title={`Checkerga etiroz — ${order.invoiceNumber}`} onClose={onClose}>
      <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4">
        <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
        <p className="text-sm text-red-800">
          Etiroz yuborilganda checkerga (<b>{order.checker?.fullName || '—'}</b>) <b>5 ball jarima</b> avtomatik yoziladi
          — nechta sabab tanlansa ham jarima bitta marta yoziladi.
        </p>
      </div>

      <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
        Sabab(lar)ni tanlang — bir nechtasi mumkin
      </p>
      <div className="space-y-2 mb-4">
        {CHECKER_ETIROV_TYPES.map((t) => {
          const checked = types.includes(t.value);
          return (
            <button
              key={t.value}
              onClick={() => toggleType(t.value)}
              className={`w-full flex items-center gap-3 text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                checked ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className={`w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center ${
                checked ? 'border-red-500 bg-red-500' : 'border-gray-300'
              }`}>
                {checked && <CheckCircle2 size={11} className="text-white" strokeWidth={3} />}
              </div>
              {t.label}
            </button>
          );
        })}
      </div>

      {types.includes('OTHER') && (
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Sababni yozing..."
          rows={3}
          className="input w-full mb-4"
          autoFocus
        />
      )}
      {types.length > 0 && !types.includes('OTHER') && (
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
          <Send size={15} /> {mutation.isPending ? 'Yuborilmoqda...' : `Yuborish${types.length > 1 ? ` (${types.length} ta)` : ''}`}
        </button>
      </div>
    </Modal>
  );
}
