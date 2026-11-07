import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEtirozli, useRespondEtirov } from '../hooks/usePickerData';
import { Btn, Chip, EmptyState, ErrorState, Mono, Radio, Sheet, Skeleton, useToast, cx } from '../design/ui';
import MobileHeader from './MobileHeader';
import { clientName } from './Cards';
import { ETIROV_TYPE_LABELS, rejectOptionsFor } from '../lib/labels';
import { fmtWhen, shortPerson } from '../lib/format';
import { getErrorMessage } from '../../../lib/errors';

const REJECT_TEXT = {
  WRONG_QUANTITY: "Miqdor to'g'ri edi", WRONG_PRODUCT: "To'g'ri dori olib keldim", WRONG_SERIES: "Seriya to'g'ri edi",
  DAMAGED: 'Shikastlanmagan edi', MISSING_PRODUCT: 'Barcha mahsulotlar bor edi', OTHER: 'Boshqa sabab',
};

function StatusChip({ e }) {
  if (e.voided) return <Chip tone="slate">Bekor qilingan</Chip>;
  if (e.status === 'PENDING') return <Chip tone="amber">Javob kutilmoqda</Chip>;
  if (e.status === 'ACCEPTED') return <Chip tone="green">Tan olindi</Chip>;
  return <Chip tone="red">Rad etildi</Chip>;
}

function RejectSheet({ etirov, onClose, onSubmit, submitting }) {
  const options = useMemo(() => rejectOptionsFor(etirov?.type), [etirov?.type]);
  const [optId, setOptId] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => { if (etirov) { setOptId(options[0].id); setNote(''); } }, [etirov, options]);

  const opt = options.find((o) => o.id === optId) || options[0];
  const canSubmit = !submitting && (!opt.needsNote || note.trim().length > 0);

  const submit = () => {
    const n = note.trim();
    let responseComment;
    if (opt.id === 'primary') responseComment = n || undefined;
    else if (opt.needsNote) responseComment = n;
    else responseComment = n ? `${opt.label}. ${n}` : opt.label;
    onSubmit({ responseTypes: [opt.key], responseComment });
  };

  return (
    <Sheet
      open={!!etirov} onClose={onClose} labelledBy="pk-reject-title"
      title="Nega rad etasiz?"
      subtitle={etirov ? `Etiroz: ${ETIROV_TYPE_LABELS[etirov.type] || etirov.type}` : ''}
      footer={(
        <div className="grid grid-cols-2 gap-3">
          <Btn variant="secondary" size="lg" onClick={onClose}>Bekor qilish</Btn>
          <Btn variant="danger" size="lg" loading={submitting} disabled={!canSubmit} onClick={submit}>Rad etish</Btn>
        </div>
      )}
    >
      <div className="space-y-2 pt-2">
        {options.map((o) => {
          const active = o.id === optId;
          return (
            <label
              key={o.id}
              className={cx(
                'flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3.5 text-[16px] text-slate-900 transition-colors',
                active ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:bg-slate-50',
              )}
            >
              <input type="radio" name="pk-reject" className="sr-only" checked={active} onChange={() => setOptId(o.id)} />
              <Radio checked={active} tone="red" />
              {o.label}
            </label>
          );
        })}
      </div>
      <div className="pb-2 pt-4">
        <label htmlFor="pk-reject-note" className="mb-1.5 block text-[14px] font-semibold text-slate-700">
          Izoh <span className="font-normal text-slate-500">(«Boshqa sabab»da majburiy)</span>
        </label>
        <textarea
          id="pk-reject-note" rows={2} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)}
          placeholder="Masalan: javon A-05-1 da qayta sanaldi"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100"
        />
      </div>
    </Sheet>
  );
}

function EtirovItem({ e, order, busy, onAccept, onReject }) {
  const pending = e.status === 'PENDING' && !e.voided;
  const fromChecker = e.fromRole === 'CHECKER';
  const raiser = [fromChecker ? 'Checker' : 'Marker', e.raisedBy && shortPerson(e.raisedBy), fmtWhen(e.createdAt)].filter(Boolean).join(' · ');
  const penalty = order.checkerPenaltyPoints || 5;
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-[17px] font-bold text-slate-900">{ETIROV_TYPE_LABELS[e.type] || e.type}</h3>
        <StatusChip e={e} />
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-[16px] leading-relaxed text-slate-700">
        {e.comment ? `«${e.comment}»` : <span className="text-slate-400">Izoh yozilmagan</span>}
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-[14px] text-slate-500">
        <ShieldCheck size={16} aria-hidden="true" /> {raiser}
      </p>

      {pending && (fromChecker ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-[14px] text-red-800">
          <TriangleAlert size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          Jarima (−{penalty} ball) bildirilgan zahoti yozilgan — javobingiz uni bekor qilmaydi.
        </p>
      ) : (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-[14px] text-slate-700">
          <Info size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          Marker etirozi — jarimasiz. Javobingiz faqat kelishuv uchun.
        </p>
      ))}

      {!pending && e.status === 'REJECTED' && !e.voided && (e.responseTypes?.length > 0 || e.responseComment) && (
        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-[14px] text-slate-600">
          <span className="font-semibold text-slate-700">Javobingiz: </span>
          {[...(e.responseTypes || []).map((k) => REJECT_TEXT[k] || k).filter((t) => !(t === 'Boshqa sabab' && e.responseComment)), e.responseComment].filter(Boolean).join(' — ')}
        </p>
      )}

      {pending && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Btn variant="secondary" size="lg" disabled={busy} onClick={() => onAccept(e)}>Tan olaman</Btn>
          <Btn variant="dangerSoft" size="lg" disabled={busy} onClick={() => onReject(e)}>Rad etaman</Btn>
        </div>
      )}
    </article>
  );
}

export default function EtirovView({ orderId, variant = 'page' }) {
  const navigate = useNavigate();
  const toast = useToast();
  const q = useEtirozli();
  const respond = useRespondEtirov();
  const [rejecting, setRejecting] = useState(null);

  const order = q.data?.find((o) => o.id === orderId);
  const list = useMemo(() => {
    if (!order) return [];
    return [...order.etirozlar].sort((a, b) => {
      const pa = a.status === 'PENDING' && !a.voided ? 0 : 1;
      const pb = b.status === 'PENDING' && !b.voided ? 0 : 1;
      return pa - pb || new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [order]);
  const pendingCount = list.filter((e) => e.status === 'PENDING' && !e.voided).length;
  const goBack = () => navigate('/picker');

  const done = (msg) => {
    toast.success(msg);
    if (pendingCount - 1 <= 0 && variant === 'page') goBack();
  };
  const onAccept = (e) => respond.mutate({ id: e.id, action: 'accept' }, {
    onSuccess: () => done('Etirozni tan oldingiz'),
    onError: (err) => toast.error(getErrorMessage(err)),
  });
  const onRejectSubmit = (data) => respond.mutate({ id: rejecting.id, action: 'reject', data }, {
    onSuccess: () => { setRejecting(null); done('Etirozni rad etdingiz'); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  let content;
  if (q.isLoading) content = <div className="space-y-3"><Skeleton className="h-44" /><Skeleton className="h-44" /></div>;
  else if (q.isError) content = <ErrorState onRetry={q.refetch} />;
  else if (!order) {
    content = (
      <EmptyState
        icon={ShieldCheck} title="Bu buyurtma bo'yicha etiroz yo'q" text="Etirozlarga javob berilgan yoki buyurtma topilmadi."
        action={<Btn variant="secondary" size="sm" onClick={goBack}>Bugun sahifasiga qaytish</Btn>}
      />
    );
  } else {
    content = (
      <div className="space-y-3">
        {list.map((e) => <EtirovItem key={e.id} e={e} order={order} busy={respond.isPending} onAccept={onAccept} onReject={setRejecting} />)}
      </div>
    );
  }

  const subtitle = order
    ? <><Mono className="font-bold">#{order.invoiceNumber}</Mono> · {clientName(order)}{pendingCount > 0 ? ` · ${pendingCount} ta javobsiz` : ''}</>
    : undefined;

  const sheet = <RejectSheet etirov={rejecting} onClose={() => setRejecting(null)} onSubmit={onRejectSubmit} submitting={respond.isPending} />;

  if (variant === 'panel') {
    return (
      <section className="rounded-3xl border border-red-200 bg-white p-6 shadow-[0_8px_30px_rgba(239,68,68,0.06)]">
        <h2 className="text-[22px] font-bold text-slate-900">Etirozlar</h2>
        {subtitle && <p className="mt-1 text-[14px] text-slate-600">{subtitle}</p>}
        <div className="mt-4">{content}</div>
        {sheet}
      </section>
    );
  }
  return (
    <div className="min-h-screen bg-[#F0F4FF] pb-10">
      <MobileHeader onBack={goBack} title="Etirozlar" subtitle={subtitle} />
      <div className="px-4 pt-4">{content}</div>
      {sheet}
    </div>
  );
}
