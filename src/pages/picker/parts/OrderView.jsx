import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CircleAlert, CircleCheck, FileSpreadsheet, Lock, PackageCheck } from 'lucide-react';
import { useComplete, useOrder, useReportIssue, useReturned, useToggleItem } from '../hooks/usePickerData';
import useAcceptFlow from '../hooks/useAcceptFlow';
import { usePicker } from '../PickerContext';
import { Btn, Chip, EmptyState, ErrorState, Mono, ProgressBar, Segmented, Sheet, Skeleton, useToast, cx } from '../design/ui';
import MobileHeader from './MobileHeader';
import TimerBox from './TimerBox';
import ReturnedView from './ReturnedView';
import IssueSheet from './IssueSheet';
import { ChecklistTable, ItemRow } from './ChecklistParts';
import { ExcelLink, clientName } from './Cards';
import { compareLocation, fmtInn, fmtSum } from '../lib/format';
import { isReturned, statsFromItems } from '../lib/timer';
import { getErrorMessage } from '../../../lib/errors';

const STATUS_CHIP = {
  NEW:      { tone: 'blue',  label: 'Navbatda' },
  PICKING:  { tone: 'sky',   label: 'Terilmoqda' },
  MARKING:  { tone: 'slate', label: 'Markingda' },
  CHECKING: { tone: 'slate', label: 'Tekshiruvda' },
};
const byLocation = (a, b) => compareLocation(a.location, b.location) || a.lineNo - b.lineNo;

function OrderSkeleton({ variant }) {
  const inner = (
    <div className="space-y-3 p-4">
      <Skeleton className="h-16" /><Skeleton className="h-12" /><Skeleton className="h-24" /><Skeleton className="h-24" />
    </div>
  );
  return variant === 'panel'
    ? <section className="rounded-3xl border border-slate-200 bg-white">{inner}</section>
    : <div className="min-h-screen bg-[#F0F4FF]">{inner}</div>;
}

function ChecklistView({ order, variant }) {
  const { user } = usePicker();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const toggle = useToggleItem(order.id);
  const complete = useComplete();
  const report = useReportIssue(order.id);
  const returnedQ = useReturned();
  const accept = useAcceptFlow();

  const [tab, setTab] = useState('left');
  const [issueOpen, setIssueOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const items = useMemo(() => order.items || [], [order.items]);
  const stats = useMemo(() => statsFromItems(items), [items]);
  const noItems = items.length === 0;
  const isMineActive = order.status === 'PICKING' && order.assignedPickerId === user.id;
  const isNew = order.status === 'NEW';
  const lockedTo = isNew && order.assignedPickerId && order.assignedPickerId !== user.id ? (order.assignedPicker?.fullName || 'boshqa terimchi') : null;
  const interactive = isMineActive;
  const chip = STATUS_CHIP[order.status] || { tone: 'slate', label: 'Yakunlangan' };

  const remaining = useMemo(() => items.filter((i) => !i.picked).sort(byLocation), [items]);
  const done = useMemo(() => items.filter((i) => i.picked), [items]);
  const unhandled = remaining.filter((i) => !i.issueType).length;
  const hasLocations = items.some((i) => i.location);

  const blocking = (returnedQ.data || []).find((o) => o.id !== order.id);
  const canComplete = isMineActive && !blocking && (noItems || unhandled === 0);

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/picker'));
  const onToggle = (item, picked) => toggle.mutate({ itemId: item.id, picked }, { onError: (e) => toast.error(getErrorMessage(e)) });

  const doComplete = () => complete.mutate(order.id, {
    onSuccess: (res) => {
      setConfirm(false);
      toast.success(res?.data?.message || "Yig'ish yakunlandi — buyurtma Marking bosqichiga o'tdi");
      navigate('/picker');
    },
    onError: (e) => { setConfirm(false); toast.error(getErrorMessage(e)); },
  });
  const onPrimary = () => (noItems || stats.flagged > 0 ? setConfirm(true) : doComplete());

  const submitIssue = (payload) => report.mutate(payload, {
    onSuccess: () => { setIssueOpen(false); toast.success('Muammo bildirildi — operatorga xabar yuborildi'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // Tugma ostidagi/yonidagi izoh
  let hint = null;
  if (isMineActive) {
    if (blocking) hint = { tone: 'amber', text: `Avval qaytarilgan #${blocking.invoiceNumber} ni tuzating`, onClick: () => navigate(`/picker/orders/${blocking.id}`) };
    else if (noItems) hint = { tone: 'slate', text: "Ro'yxat Excel faylda — hammasini yig'gach tugmani bosing" };
    else if (unhandled > 0) hint = { tone: 'slate', text: `Yana ${unhandled} ta pozitsiyani belgilang` };
    else hint = { tone: 'green', text: 'Hammasi tayyor — yuborishingiz mumkin' };
  }
  const hintNode = hint && (
    hint.onClick ? (
      <button type="button" onClick={hint.onClick} className="inline-flex items-center gap-1.5 text-[14px] font-medium text-amber-800 hover:underline">
        <Lock size={16} aria-hidden="true" /> {hint.text}
      </button>
    ) : (
      <span className={cx('text-[14px]', hint.tone === 'green' ? 'font-medium text-green-700' : 'text-slate-600')}>{hint.text}</span>
    )
  );

  const metaLine = [
    order.client?.inn && `INN ${fmtInn(order.client.inn)}`,
    order.contractNumber && `Shartnoma ${order.contractNumber}`,
    items.length > 0 && `${items.length} pozitsiya`,
    `${fmtSum(order.totalAmount)} so'm`,
  ].filter(Boolean);

  const noItemsCard = (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <FileSpreadsheet size={22} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" />
      <div>
        <p className="text-[15px] font-semibold text-slate-900">Dorilar ro'yxati Excel faylda</p>
        <p className="mt-1 text-[14px] leading-snug text-slate-600">
          Pozitsiyalar avtomatik o'qilmadi — ro'yxatni Excel faylda ko'rib teriladi.
          {isMineActive ? ' Hammasini yig\'gach «Yig\'ib keldim» tugmasini bosing.' : ''}
        </p>
        <ExcelLink order={order} variant="button" className="mt-3" />
      </div>
    </div>
  );

  const allDoneCard = (
    <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-[15px] font-medium text-green-800">
      <PackageCheck size={22} aria-hidden="true" /> Barcha pozitsiyalar belgilandi
    </div>
  );

  const listCard = (arr) => (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {arr.map((i) => <ItemRow key={i.id} item={i} interactive={interactive} onToggle={onToggle} />)}
    </ul>
  );
  const sectionTitle = (text) => <h2 className="px-1 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">{text}</h2>;

  const confirmSheet = (
    <Sheet
      open={confirm} onClose={() => setConfirm(false)} labelledBy="pk-complete-confirm"
      title={noItems ? "Hammasi yig'ildimi?" : 'Muammoli pozitsiyalar bor'}
      subtitle={noItems
        ? "Pozitsiyalar ro'yxati avtomatik o'qilmadi. Excel faylga qarab hammasini yig'ganingizni tasdiqlang."
        : `${stats.flagged} ta pozitsiya muammo deb belgilangan. Baribir Marking bosqichiga yuborasizmi?`}
      footer={(
        <div className="grid grid-cols-2 gap-3">
          <Btn variant="secondary" size="lg" onClick={() => setConfirm(false)}>Bekor qilish</Btn>
          <Btn variant="success" size="lg" loading={complete.isPending} onClick={doComplete}>Ha, yuborish</Btn>
        </div>
      )}
    />
  );

  const issueSheet = (
    <IssueSheet open={issueOpen} onClose={() => setIssueOpen(false)} items={remaining} onSubmit={submitIssue} submitting={report.isPending} />
  );

  const acceptBtn = canAcceptByMeFn(order, user) && (
    <Btn size="lg" className="w-full" iconRight={ArrowRight} loading={accept.pendingId === order.id} onClick={() => accept.start(order)}>
      Qabul qilish va boshlash
    </Btn>
  );

  // ── Desktop o'ng panel ────────────────────────────────────────────────────
  if (variant === 'panel') {
    return (
      <section className="rounded-3xl border border-teal-200 bg-white p-6 shadow-[0_8px_30px_rgba(20,184,166,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1" style={{ minWidth: 260 }}>
            <div className="flex items-center gap-2">
              <Mono className="text-[14.5px] font-bold text-slate-800">#{order.invoiceNumber}</Mono>
              <Chip tone={chip.tone}>{chip.label}</Chip>
            </div>
            <h2 className="mt-2 text-[26px] font-bold leading-tight text-slate-900">{clientName(order)}</h2>
            <p className="mt-1 text-[14px] text-slate-500">{metaLine.join(' · ')}</p>
          </div>
          {isMineActive && <TimerBox order={order} showMeta={false} className="w-[290px] shrink-0" />}
          {isNew && (
            <div className="w-[260px] shrink-0 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3">
              <p className="text-[12px] text-slate-600">Vaqt beriladi</p>
              <p className="text-[20px] font-bold text-teal-700">{order.pickingDuration} daq</p>
              <p className="mt-0.5 text-[12px] text-slate-600">Taymer qabul qilganingizda boshlanadi</p>
            </div>
          )}
        </div>

        {noItems ? <div className="mt-5">{noItemsCard}</div> : (
          <>
            <div className="mt-6 flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between text-[14px]">
                  <span className="text-slate-700">{isNew ? 'Pozitsiyalar' : 'Teriladi'}</span>
                  <span className="pk-nums font-bold text-slate-900">{isNew ? items.length : `${stats.picked} / ${stats.total}`}</span>
                </div>
                {!isNew && <ProgressBar value={stats.total ? stats.picked / stats.total : 0} height={6} label="Terish jarayoni" />}
              </div>
              <ExcelLink order={order} variant="button" className="!h-11" />
            </div>
            <div className="mt-4">
              <ChecklistTable remaining={interactive ? remaining : [...items].sort((a, b) => a.lineNo - b.lineNo)} done={interactive ? done : []} interactive={interactive} onToggle={onToggle} />
            </div>
          </>
        )}

        <footer className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-5 flex flex-wrap items-center justify-between gap-4 rounded-b-3xl border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="min-w-0">{hintNode}{isNew && lockedTo && <span className="inline-flex items-center gap-1.5 text-[14px] text-slate-600"><Lock size={16} aria-hidden="true" /> {lockedTo} ga biriktirilgan</span>}</div>
          <div className="ml-auto flex items-center gap-3">
            {isMineActive && (
              <>
                <Btn variant="secondary" size="lg" icon={CircleAlert} onClick={() => setIssueOpen(true)}>Muammo bildirish</Btn>
                <Btn variant="success" size="lg" icon={CircleCheck} disabled={!canComplete} loading={complete.isPending} onClick={onPrimary}>Yig'ib keldim</Btn>
              </>
            )}
            {isNew && !lockedTo && <div className="min-w-[260px]">{acceptBtn}</div>}
          </div>
        </footer>
        {confirmSheet}
        {issueSheet}
      </section>
    );
  }

  // ── Mobil to'liq ekran (6.png) ─────────────────────────────────────────────
  const pct = stats.total ? Math.round((stats.picked / stats.total) * 100) : 0;
  const tabs = [
    { value: 'all', label: 'Hammasi', count: stats.total },
    { value: 'left', label: 'Qolgan', count: remaining.length },
    { value: 'done', label: 'Terilgan', count: done.length },
  ];

  let lists;
  if (!isMineActive) {
    lists = <section className="space-y-2">{sectionTitle(`Pozitsiyalar · ${items.length}`)}{listCard([...items].sort((a, b) => a.lineNo - b.lineNo))}</section>;
  } else if (tab === 'all') {
    lists = <section className="space-y-2">{sectionTitle(`Barcha pozitsiyalar · ${items.length}`)}{listCard([...items].sort((a, b) => a.lineNo - b.lineNo))}</section>;
  } else if (tab === 'done') {
    lists = <section className="space-y-2">{sectionTitle(`Terilgan · ${done.length}`)}{done.length ? listCard(done) : <p className="px-1 text-[14px] text-slate-500">Hali hech narsa terilmagan</p>}</section>;
  } else {
    lists = (
      <>
        <section className="space-y-2">
          {sectionTitle(`Qolgan pozitsiyalar${hasLocations ? ' · javon tartibida' : ''}`)}
          {remaining.length ? listCard(remaining) : allDoneCard}
        </section>
        {done.length > 0 && <section className="space-y-2">{sectionTitle(`Terilgan · ${done.length}`)}{listCard(done)}</section>}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4FF] pb-48">
      <MobileHeader
        onBack={goBack} mono title={`#${order.invoiceNumber}`}
        subtitle={<span className="line-clamp-1">{clientName(order)}{order.client?.inn ? ` · INN ${fmtInn(order.client.inn)}` : ''}</span>}
        right={<ExcelLink order={order} />}
      />
      <div className="space-y-3 border-b border-slate-100 bg-white px-4 pb-3 pt-3">
        {isMineActive && <TimerBox order={order} variant="strip" />}
        {isNew && (
          <div className="flex items-center justify-between rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3">
            <span className="text-[13px] text-slate-600">Taymer qabul qilganingizda boshlanadi</span>
            <span className="text-[14px] font-bold text-teal-700">{order.pickingDuration} daq</span>
          </div>
        )}
        {!isMineActive && !isNew && <Chip tone={chip.tone}>{chip.label}</Chip>}
        {isMineActive && !noItems && <Segmented value={tab} onChange={setTab} options={tabs} label="Pozitsiyalar" />}
      </div>

      <div className="space-y-4 px-4 pt-4">
        {noItems ? noItemsCard : (
          <>
            {isMineActive && (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[14px]">
                  <span className="text-slate-600">Terish jarayoni</span>
                  <span className="pk-nums text-slate-600"><b className="text-slate-900">{stats.picked}</b> / {stats.total} · {pct}%</span>
                </div>
                <ProgressBar value={stats.total ? stats.picked / stats.total : 0} height={8} label="Terish jarayoni" />
              </div>
            )}
            {lists}
          </>
        )}
      </div>

      {(isMineActive || isNew) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
          {isMineActive ? (
            <>
              <div className="flex items-center gap-3">
                <Btn variant="secondary" size="lg" icon={CircleAlert} onClick={() => setIssueOpen(true)}>Muammo</Btn>
                <Btn variant="success" size="lg" icon={CircleCheck} className="flex-1" disabled={!canComplete} loading={complete.isPending} onClick={onPrimary}>
                  Yig'ib keldim
                </Btn>
              </div>
              <div className="mt-2 text-center">{hintNode}</div>
            </>
          ) : lockedTo ? (
            <p className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 text-[14px] font-semibold text-slate-600">
              <Lock size={16} aria-hidden="true" /> {lockedTo} ga biriktirilgan
            </p>
          ) : acceptBtn}
        </div>
      )}
      {confirmSheet}
      {issueSheet}
    </div>
  );
}

function canAcceptByMeFn(order, user) {
  return order.status === 'NEW' && (!order.assignedPickerId || order.assignedPickerId === user.id);
}

export default function OrderView({ orderId, variant = 'page' }) {
  const q = useOrder(orderId);
  const navigate = useNavigate();

  if (q.isLoading) return <OrderSkeleton variant={variant} />;
  if (q.isError || !q.data) {
    const notFound = q.error?.response?.status === 404;
    const content = notFound
      ? <EmptyState icon={FileSpreadsheet} title="Buyurtma topilmadi" text="U o'chirilgan yoki havola noto'g'ri bo'lishi mumkin." action={<Btn variant="secondary" size="sm" onClick={() => navigate('/picker')}>Bugun sahifasiga</Btn>} />
      : <ErrorState onRetry={q.refetch} />;
    return variant === 'panel'
      ? <section className="rounded-3xl border border-slate-200 bg-white p-6">{content}</section>
      : <div className="min-h-screen bg-[#F0F4FF]"><MobileHeader onBack={() => navigate('/picker')} title="Buyurtma" /><div className="p-4">{content}</div></div>;
  }
  const order = q.data;
  if (isReturned(order)) return <ReturnedView order={order} variant={variant} />;
  return <ChecklistView order={order} variant={variant} />;
}
