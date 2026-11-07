import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleCheck, ShieldAlert } from 'lucide-react';
import { useComplete } from '../hooks/usePickerData';
import { Btn, Chip, IconBox, Mono, Sheet, useToast, cx } from '../design/ui';
import MobileHeader from './MobileHeader';
import { ExcelLink, clientName } from './Cards';
import { RETURNER_LABELS } from '../lib/labels';
import { fmtInn, fmtSum, fmtWhen, shortPerson } from '../lib/format';
import { getErrorMessage } from '../../../lib/errors';

// Marker/Checker qaytargan order: sabab, tuzatish ro'yxati (bo'lsa), taymer/jarima holati va qayta yuborish.
export default function ReturnedView({ order, variant = 'page' }) {
  const navigate = useNavigate();
  const toast = useToast();
  const complete = useComplete();
  const [confirm, setConfirm] = useState(false);

  const role = order.returnedBy?.role;
  const L = (role && RETURNER_LABELS[role]) || { who: 'Marker/Checker', title: 'Buyurtma qaytarildi', reason: 'QAYTARISH SABABI' };
  const issues = Array.isArray(order.returnIssues) ? order.returnIssues : [];
  const penalty = order.penaltyPoints || 0;
  const when = fmtWhen(order.returnedAt || order.returnedToPickingAt);

  const submit = () => {
    complete.mutate(order.id, {
      onSuccess: (res) => {
        setConfirm(false);
        toast.success(res?.data?.message || 'Qayta yuborildi — buyurtma Marking bosqichiga o\'tdi');
        navigate('/picker');
      },
      onError: (e) => { setConfirm(false); toast.error(getErrorMessage(e)); },
    });
  };

  const body = (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-amber-300 bg-amber-50">
        <div className="flex items-center gap-3 bg-amber-100 px-4 py-3.5">
          <IconBox icon={ShieldAlert} tone="amber" size={44} />
          <div className="min-w-0">
            <p className="text-[17px] font-bold text-amber-950">{L.title}</p>
            <p className="truncate text-[14px] text-amber-800">
              {[order.returnedBy?.name && shortPerson(order.returnedBy.name), when].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="border-t border-amber-200 px-4 py-4">
          <p className="text-[12px] font-bold tracking-[0.08em] text-amber-900">{L.reason}</p>
          <p className="mt-2 whitespace-pre-wrap break-words text-[17px] leading-relaxed text-slate-900">{order.returnReason || '—'}</p>
        </div>
      </section>

      {issues.length > 0 && (
        <section>
          <h2 className="px-1 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Tuzatish kerak · {issues.length} pozitsiya</h2>
          <ul className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {issues.map((it, i) => (
              <li key={`${it.lineNo ?? 'x'}-${i}`} className="flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
                <span className="mt-0.5 inline-flex h-7 min-w-[28px] items-center justify-center rounded-lg bg-red-100 px-1 text-[13px] font-bold text-red-700">{it.lineNo ?? i + 1}</span>
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold leading-snug text-slate-900">{it.title}</p>
                  {it.hint && <p className="mt-0.5 text-[14px] text-red-700">{it.hint}</p>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[13px] text-slate-600">Taymer</p>
          <p className="text-[16px] font-bold text-slate-900">Hisoblanmaydi</p>
        </div>
        <div className={cx('rounded-2xl border px-4 py-3', penalty > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white')}>
          <p className={cx('text-[13px]', penalty > 0 ? 'text-red-700' : 'text-slate-600')}>Jarima</p>
          <p className={cx('text-[16px] font-bold', penalty > 0 ? 'text-red-700' : 'text-slate-900')}>
            {penalty > 0 ? `−${penalty} ball qayd etildi` : 'Qayd etilmagan'}
          </p>
        </div>
      </div>
    </div>
  );

  const confirmSheet = (
    <Sheet
      open={confirm} onClose={() => setConfirm(false)} labelledBy="pk-return-confirm"
      title="Qayta yuborilsinmi?"
      subtitle={issues.length > 0
        ? `${issues.length === 2 ? 'Ikkala' : `${issues.length} ta`} pozitsiyani tuzatganingizni tasdiqlang. Buyurtma qayta Marking bosqichidan o'tadi va uni o'zgartira olmaysiz.`
        : "Tuzatishlarni bajarganingizni tasdiqlang. Buyurtma qayta Marking bosqichidan o'tadi va uni o'zgartira olmaysiz."}
      footer={(
        <div className="grid grid-cols-2 gap-3">
          <Btn variant="secondary" size="lg" onClick={() => setConfirm(false)}>Bekor qilish</Btn>
          <Btn variant="success" size="lg" loading={complete.isPending} onClick={submit}>Ha, yuborish</Btn>
        </div>
      )}
    >
      {issues.length > 0 && (
        <ul className="mt-2 space-y-2.5 rounded-2xl bg-slate-50 px-4 py-3.5">
          {issues.map((it, i) => (
            <li key={`c-${i}`} className="flex items-start gap-2.5 text-[15px] text-slate-800">
              <CircleCheck size={20} className="mt-0.5 shrink-0 text-green-700" aria-hidden="true" />
              <span>{it.lineNo ? `${it.lineNo} · ` : ''}{it.title}</span>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );

  const sendBtn = (
    <Btn variant="success" size="lg" icon={CircleCheck} className="w-full" onClick={() => setConfirm(true)}>
      Tuzatdim — qayta yuborish
    </Btn>
  );

  if (variant === 'panel') {
    return (
      <section className="rounded-3xl border border-amber-200 bg-white p-6 shadow-[0_8px_30px_rgba(245,158,11,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Mono className="text-[14.5px] font-bold text-slate-800">#{order.invoiceNumber}</Mono>
              <Chip tone="amber">Qaytarilgan</Chip>
            </div>
            <h2 className="mt-2 text-[26px] font-bold leading-tight text-slate-900">{clientName(order)}</h2>
            <p className="mt-1 text-[14px] text-slate-500">
              {[order.client?.inn && `INN ${fmtInn(order.client.inn)}`, order.contractNumber && `Shartnoma ${order.contractNumber}`, `${fmtSum(order.totalAmount)} so'm`].filter(Boolean).join(' · ')}
            </p>
          </div>
          <ExcelLink order={order} variant="button" />
        </div>
        <div className="mt-5">{body}</div>
        <div className="mt-5 flex justify-end">{sendBtn}</div>
        {confirmSheet}
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4FF] pb-32">
      <MobileHeader
        onBack={() => navigate('/picker')} title="Qaytarilgan buyurtma"
        subtitle={<><Mono className="font-bold">#{order.invoiceNumber}</Mono> · {clientName(order)}</>}
        right={<ExcelLink order={order} />}
      />
      <div className="px-4 pt-4">{body}</div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
        {sendBtn}
      </div>
      {confirmSheet}
    </div>
  );
}
