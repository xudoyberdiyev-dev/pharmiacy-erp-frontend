import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, RefreshCw, Search } from 'lucide-react';
import { useAvailable, useIsDesktop, useNow, useRefreshAll } from './hooks/usePickerData';
import useAcceptFlow from './hooks/useAcceptFlow';
import { EmptyState, ErrorState, Skeleton, cx } from './design/ui';
import MobileHeader from './parts/MobileHeader';
import { QueueCard, waitMinutes } from './parts/Cards';

const BIG_AFTER = 20; // "Katta" — 20 va undan ko'p pozitsiya

function Chips({ value, onChange, options }) {
  return (
    <div className="pk-scroll-x -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0" role="tablist" aria-label="Filtr">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value} type="button" role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={cx(
              'h-10 shrink-0 rounded-full border px-4 text-[14px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {o.label} <span className="pk-nums">{o.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// Navbat: eng eskisi birinchi. Mobil — 7.png, desktop — kartalar to'ri.
export default function PickerQueue() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const q = useAvailable();
  const refresh = useRefreshAll();
  const accept = useAcceptFlow();
  const now = useNow(30000);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const urgentAfter = q.data?.urgentAfterMinutes || 45;
  const rows = useMemo(() => (q.data?.list || []).map((o) => {
    const waiting = waitMinutes(o, now);
    return { o, waiting, urgent: waiting >= urgentAfter };
  }), [q.data, now, urgentAfter]);

  const counts = useMemo(() => ({
    all: rows.length,
    mine: rows.filter((r) => r.o.isMine).length,
    urgent: rows.filter((r) => r.urgent).length,
    big: rows.filter((r) => r.o.itemCount >= BIG_AFTER).length,
  }), [rows]);
  const hasItemInfo = rows.some((r) => r.o.itemCount > 0);

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    return rows.filter(({ o, urgent }) => {
      if (filter === 'mine' && !o.isMine) return false;
      if (filter === 'urgent' && !urgent) return false;
      if (filter === 'big' && !(o.itemCount >= BIG_AFTER)) return false;
      if (!s) return true;
      return [o.invoiceNumber, o.client?.orgName, o.client?.inn, o.contractNumber].some((v) => String(v || '').toLowerCase().includes(s));
    });
  }, [rows, search, filter]);

  const options = [
    { value: 'all', label: 'Hammasi', count: counts.all },
    { value: 'mine', label: 'Sizga', count: counts.mine },
    { value: 'urgent', label: 'Shoshilinch', count: counts.urgent },
    ...(hasItemInfo ? [{ value: 'big', label: 'Katta', count: counts.big }] : []),
  ];

  const refreshBtn = (
    <button
      type="button" onClick={refresh} aria-label="Yangilash" title="Yangilash"
      className="inline-flex shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      style={{ width: isDesktop ? 44 : 48, height: isDesktop ? 44 : 48 }}
    >
      <RefreshCw size={22} className={q.isFetching ? 'animate-spin' : ''} aria-hidden="true" />
    </button>
  );
  const subtitle = `${counts.all} ta buyurtma · eng eskisi birinchi`;

  const searchBox = (
    <div className="relative">
      <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      <input
        type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Faktura, mijoz yoki INN"
        aria-label="Navbatdan qidirish"
        className="h-12 w-full rounded-2xl border border-transparent bg-slate-100 pl-11 pr-4 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );

  let body;
  if (q.isLoading) body = <div className="space-y-3"><Skeleton className="h-60" /><Skeleton className="h-60" /></div>;
  else if (q.isError && !q.data) body = <ErrorState onRetry={q.refetch} />;
  else if (rows.length === 0) body = <EmptyState icon={Inbox} title="Navbat bo'sh" text="Yangi buyurtmalar paydo bo'lganda shu yerda ko'rinadi." />;
  else if (visible.length === 0) body = <EmptyState icon={Search} title="Hech narsa topilmadi" text="Qidiruv yoki filtrni o'zgartirib ko'ring." />;
  else {
    body = (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visible.map(({ o, waiting, urgent }) => (
          <QueueCard
            key={o.id} order={o} waiting={waiting} urgent={urgent}
            accepting={accept.pendingId === o.id} onAccept={accept.start}
            onOpen={() => navigate(`/picker/orders/${o.id}`)}
          />
        ))}
      </div>
    );
  }

  if (isDesktop) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900">Navbat</h1>
            <p className="text-[14px] text-slate-600">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-[320px]">{searchBox}</div>
            {refreshBtn}
          </div>
        </div>
        <Chips value={filter} onChange={setFilter} options={options} />
        {body}
      </div>
    );
  }

  return (
    <div className="pb-28">
      <MobileHeader title="Navbat" subtitle={subtitle} right={refreshBtn} />
      <div className="space-y-3 border-b border-slate-100 bg-white px-4 pb-3">
        {searchBox}
        <Chips value={filter} onChange={setFilter} options={options} />
      </div>
      <div className="px-4 pt-4">{body}</div>
    </div>
  );
}
