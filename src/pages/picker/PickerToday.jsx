import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Inbox, PackageCheck } from 'lucide-react';
import { useAvailable, useEtirozli, useIsDesktop, useMine, useNow, useReturned, useSummary } from './hooks/usePickerData';
import useAcceptFlow from './hooks/useAcceptFlow';
import { usePicker } from './PickerContext';
import { Btn, EmptyState, ErrorState, SectionLabel, Skeleton, cx } from './design/ui';
import MobileHeader from './parts/MobileHeader';
import BellButton from './parts/Bell';
import { EtirovCard, InProgressCard, QueueRow, ReturnedCard, waitMinutes } from './parts/Cards';
import OrderView from './parts/OrderView';
import EtirovView from './parts/EtirovView';
import { fmtClock, fmtDayLong } from './lib/format';
import { isInProgress } from './lib/timer';

const QUEUE_PREVIEW = 12;

function StatusLine({ updatedAt }) {
  const { isOnline } = usePicker();
  return (
    <p className="flex items-center gap-2 text-[12px] text-slate-600" role="status">
      <span className={cx('h-2 w-2 rounded-full', isOnline ? 'bg-green-500' : 'bg-red-500')} aria-hidden="true" />
      {isOnline ? <>Onlayn · avtomatik yangilanadi{updatedAt ? <> · <span className="pk-nums">{fmtClock(updatedAt)}</span></> : null}</> : 'Oflayn — ulanish tiklanishi kutilmoqda'}
    </p>
  );
}

export default function PickerToday() {
  const { id, orderId } = useParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const now = useNow(30000);
  const accept = useAcceptFlow();

  const summaryQ = useSummary();
  const mineQ = useMine();
  const returnedQ = useReturned();
  const etirozQ = useEtirozli();
  const availQ = useAvailable();

  const returned = useMemo(() => returnedQ.data || [], [returnedQ.data]);
  const etirozOrders = useMemo(() => (etirozQ.data || []).filter((o) => o.pendingCount > 0), [etirozQ.data]);
  const inProgress = useMemo(() => (mineQ.data || []).filter(isInProgress), [mineQ.data]);
  const queue = availQ.data?.list || [];
  const urgentAfter = availQ.data?.urgentAfterMinutes || 45;
  const attentionCount = returned.length + etirozOrders.length;
  const mineWaiting = summaryQ.data?.counts?.mineWaiting || 0;
  const shift = summaryQ.data?.shift;

  const loading = mineQ.isLoading || returnedQ.isLoading || etirozQ.isLoading;
  const failed = (mineQ.isError && !mineQ.data) || (returnedQ.isError && !returnedQ.data) || (etirozQ.isError && !etirozQ.data);
  const retry = () => { mineQ.refetch(); returnedQ.refetch(); etirozQ.refetch(); summaryQ.refetch(); };

  const openReturned = (o) => navigate(`/picker/orders/${o.id}`);
  const openEtirov = (o) => navigate(`/picker/etirozlar/${o.id}`);

  // ── Mobil: to'liq ekranli ichki sahifalar ───────────────────────────────────
  if (!isDesktop && id) return <OrderView orderId={id} variant="page" />;
  if (!isDesktop && orderId) return <EtirovView orderId={orderId} variant="page" />;

  const attentionSection = attentionCount > 0 && (
    <section className="space-y-2.5">
      <SectionLabel count={isDesktop ? undefined : attentionCount}>
        Diqqat talab qiladi{isDesktop ? ` · ${attentionCount}` : ''}
      </SectionLabel>
      {returned.map((o) => <ReturnedCard key={`r-${o.id}`} order={o} compact={isDesktop} onOpen={() => openReturned(o)} />)}
      {etirozOrders.map((o) => <EtirovCard key={`e-${o.id}`} order={o} compact={isDesktop} onOpen={() => openEtirov(o)} />)}
    </section>
  );

  // ── Mobil: Bugun (1.png) ──────────────────────────────────────────────────
  if (!isDesktop) {
    return (
      <div className="pb-28">
        <MobileHeader
          logo title="Bugun" right={<BellButton />}
          subtitle={`${fmtDayLong(now)}${shift ? ` · Smena ${shift.start}–${shift.end}` : ''}`}
        />
        <div className="space-y-5 px-4 pt-3">
          <StatusLine updatedAt={summaryQ.dataUpdatedAt} />
          {loading ? (
            <div className="space-y-3"><Skeleton className="h-28" /><Skeleton className="h-56" /></div>
          ) : failed ? (
            <ErrorState onRetry={retry} />
          ) : (
            <>
              {attentionSection}
              <section className="space-y-2.5">
                <SectionLabel>Jarayonda</SectionLabel>
                {inProgress.length > 0 ? (
                  inProgress.map((o) => <InProgressCard key={o.id} order={o} onOpen={() => navigate(`/picker/orders/${o.id}`)} />)
                ) : (
                  <EmptyState
                    icon={PackageCheck} title="Hozir terilayotgan buyurtma yo'q"
                    text={queue.length > 0 ? `Navbatda ${queue.length} ta buyurtma kutmoqda.` : "Yangi buyurtma paydo bo'lganda shu yerda ko'rinadi."}
                    action={queue.length > 0 ? <Btn size="md" iconRight={ArrowRight} onClick={() => navigate('/picker/queue')}>Navbatga o'tish</Btn> : null}
                  />
                )}
              </section>
              {mineWaiting > 0 && (
                <Link to="/picker/queue" className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-[14px] text-blue-900 hover:bg-blue-100/70">
                  <Inbox size={20} className="shrink-0 text-blue-700" aria-hidden="true" />
                  <span className="flex-1"><b>{mineWaiting} ta buyurtma</b> sizga biriktirilgan va navbatda kutmoqda</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop: 3 ustunli master-detail (2.webp) ───────────────────────────────
  const rightId = id || null;
  const defaultOrder = inProgress[0] || null;

  let right;
  if (orderId) right = <EtirovView orderId={orderId} variant="panel" />;
  else if (rightId) right = <OrderView orderId={rightId} variant="panel" />;
  else if (defaultOrder) right = <OrderView orderId={defaultOrder.id} variant="panel" />;
  else if (loading) right = <Skeleton className="h-[420px] rounded-3xl" />;
  else {
    right = (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/60 px-6 py-16">
        <EmptyState
          className="border-0 bg-transparent" icon={PackageCheck} title="Hozir terilayotgan buyurtma yo'q"
          text="Navbatdan buyurtma qabul qiling — taymer va pozitsiyalar ro'yxati shu yerda ochiladi."
        />
      </div>
    );
  }

  const visibleQueue = queue.slice(0, QUEUE_PREVIEW);
  return (
    <div className="grid items-start gap-5" style={{ gridTemplateColumns: 'minmax(300px, 340px) minmax(0, 1fr)' }}>
      <div className="min-w-0 space-y-5">
        {failed && <ErrorState onRetry={retry} />}
        {attentionSection}
        <section className="space-y-2.5">
          <SectionLabel right={<span className="text-[12px] text-slate-500">Eng eskisi birinchi</span>}>Navbat · {queue.length}</SectionLabel>
          {availQ.isLoading ? (
            <Skeleton className="h-40" />
          ) : queue.length === 0 ? (
            <EmptyState icon={Inbox} title="Navbat bo'sh" text="Yangi buyurtmalar shu yerda paydo bo'ladi." />
          ) : (
            <>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {visibleQueue.map((o) => {
                  const waiting = waitMinutes(o, now);
                  return (
                    <QueueRow
                      key={o.id} order={o} waiting={waiting} urgent={waiting >= urgentAfter} selected={rightId === o.id}
                      accepting={accept.pendingId === o.id} onAccept={accept.start} onOpen={() => navigate(`/picker/orders/${o.id}`)}
                    />
                  );
                })}
              </ul>
              {queue.length > QUEUE_PREVIEW && (
                <Link to="/picker/queue" className="flex items-center justify-center gap-1.5 text-[13.5px] font-semibold text-blue-700 hover:underline">
                  Barchasini ko'rish ({queue.length}) <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
            </>
          )}
        </section>
      </div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}
