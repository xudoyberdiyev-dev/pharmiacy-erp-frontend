import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, History as HistoryIcon, TriangleAlert } from 'lucide-react';
import { useDayHistory, useIsDesktop, useSummary } from './hooks/usePickerData';
import { Chip, EmptyState, ErrorState, IconBox, Mono, Skeleton, cx } from './design/ui';
import MobileHeader from './parts/MobileHeader';
import { addDays, fmtClock, fmtDayLabel, fmtSum, fmtWait, monthName, ymd } from './lib/format';

function Stat({ label, children, className = '' }) {
  return (
    <div className={cx('rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]', className)}>
      <p className="text-[14px] text-slate-600">{label}</p>
      <p className="mt-1 flex items-baseline gap-1.5">{children}</p>
    </div>
  );
}

function RowChip({ row }) {
  if (row.kind === 'returned') return <Chip tone="amber" className="!text-[13px]">Qaytarilgan</Chip>;
  if (row.kind === 'resubmitted') return <Chip tone="slate" className="!text-[13px]">Qayta yuborilgan</Chip>;
  if (row.kind === 'late') return <Chip tone="red" className="!text-[13px]">{fmtWait(row.lateMinutes)} kech</Chip>;
  return <Chip tone="green" className="!text-[13px]">{row.earlyMinutes > 0 ? `${fmtWait(row.earlyMinutes)} erta` : "O'z vaqtida"}</Chip>;
}

function HistoryRow({ row, onOpen }) {
  const note = row.kind === 'returned' ? 'Hisobga olinmaydi'
    : row.kind === 'resubmitted' ? 'Vaqt hisoblanmaydi'
    : `Yakunlandi ${fmtClock(row.doneAt)}${row.itemCount > 0 ? ` · ${row.itemCount} poz.` : ''}`;
  return (
    <li>
      <button type="button" onClick={onOpen} className="block w-full px-4 py-3.5 text-left hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50">
        <span className="flex items-center justify-between gap-2">
          <Mono className="text-[14px] text-slate-600">#{row.invoiceNumber}</Mono>
          <RowChip row={row} />
        </span>
        <span className="mt-1 block text-[18px] font-semibold leading-snug text-slate-900 lg:text-[16px]">{row.clientName}</span>
        <span className="mt-1 flex items-center justify-between gap-2 text-[14px] text-slate-500">
          <span>{note}</span>
          <span className="pk-nums text-[15px] font-semibold text-slate-800">{fmtSum(row.totalAmount)} so'm</span>
        </span>
      </button>
    </li>
  );
}

// Tarix: kun bo'yicha natija (3.png). Hisob-kitoblar backendda (Samaradorlik/kunlik hisobot bilan bir xil qoidalar).
export default function PickerHistory() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const today = ymd();
  const [date, setDate] = useState(today);
  const q = useDayHistory(date);
  const summaryQ = useSummary();

  const d = q.data;
  const stats = d?.stats;
  const month = summaryQ.data?.month;
  const isToday = date >= today;

  const avg = stats?.avgDiffMinutes;
  const dateNav = (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setDate(addDays(date, -1))} aria-label="Oldingi kun"
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <ChevronLeft size={22} aria-hidden="true" />
      </button>
      <label className="relative flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-[16px] font-semibold text-slate-900 focus-within:ring-2 focus-within:ring-blue-500">
        <Calendar size={20} aria-hidden="true" />
        <span className="truncate">{fmtDayLabel(date, today)}</span>
        <input
          type="date" value={date} max={today} aria-label="Sanani tanlash"
          onChange={(e) => { if (e.target.value) setDate(e.target.value > today ? today : e.target.value); }}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <button type="button" onClick={() => setDate(addDays(date, 1))} disabled={isToday} aria-label="Keyingi kun"
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:text-slate-300 disabled:hover:bg-white">
        <ChevronRight size={22} aria-hidden="true" />
      </button>
    </div>
  );

  const statsGrid = stats && (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Yakunlangan"><span className="pk-nums text-[34px] font-bold leading-none text-slate-900">{stats.completed}</span></Stat>
      <Stat label="O'z vaqtida">
        <span className="pk-nums text-[34px] font-bold leading-none text-green-700">{stats.onTime}</span>
        {stats.onTimePercent !== null && <span className="pk-nums text-[16px] font-bold text-green-700">· {stats.onTimePercent}%</span>}
      </Stat>
      <Stat label="Kechikkan"><span className="pk-nums text-[34px] font-bold leading-none text-red-700">{stats.late}</span></Stat>
      <Stat label="O'rtacha">
        {avg === null ? <span className="text-[34px] font-bold leading-none text-slate-400">—</span> : (
          <>
            <span className={cx('pk-nums text-[34px] font-bold leading-none', avg >= 0 ? 'text-teal-700' : 'text-red-700')}>{Math.abs(avg)} daq</span>
            <span className={cx('text-[16px] font-bold', avg >= 0 ? 'text-teal-700' : 'text-red-700')}>{avg >= 0 ? 'erta' : 'kech'}</span>
          </>
        )}
      </Stat>
    </div>
  );

  const penaltyCard = (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <IconBox icon={TriangleAlert} tone="red" size={44} />
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-bold text-slate-900">Jarima ballari · {month ? monthName(month.key) : 'oy'}</p>
        <p className="mt-0.5 text-[13.5px] leading-snug text-slate-600">
          {month ? `${month.returns} marta qaytarildi · ${month.etirozlar} ta Checker etirozi` : '—'}
        </p>
      </div>
      <p className={cx('pk-nums text-[28px] font-bold', month?.points > 0 ? 'text-red-700' : 'text-slate-400')}>
        {month ? (month.points > 0 ? `−${month.points}` : '0') : '—'}
      </p>
    </div>
  );

  const excludedNote = stats?.excluded > 0 && (
    <p className="px-1 text-[13px] text-slate-500">
      +{stats.excluded} ta buyurtma (qaytarilgan / qayta yuborilgan) hisobga olinmaydi.
    </p>
  );

  let list;
  if (q.isLoading) list = <Skeleton className="h-64" />;
  else if (q.isError && !d) list = <ErrorState onRetry={q.refetch} />;
  else if (!d || d.orders.length === 0) {
    list = <EmptyState icon={HistoryIcon} title="Bu kunda yakunlangan buyurtma yo'q" text="Boshqa kunni tanlab ko'ring." />;
  } else {
    list = (
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {d.orders.map((r) => <HistoryRow key={r.id} row={r} onOpen={() => navigate(`/picker/orders/${r.id}`)} />)}
      </ul>
    );
  }
  const listTitle = <h2 className="px-1 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">Yakunlangan buyurtmalar</h2>;

  const statsBlock = q.isLoading && !d ? <Skeleton className="h-52" /> : <>{statsGrid}{excludedNote}</>;

  if (isDesktop) {
    return (
      <div>
        <h1 className="mb-4 text-[26px] font-bold text-slate-900">Tarix</h1>
        <div className="grid items-start gap-5" style={{ gridTemplateColumns: 'minmax(320px, 400px) minmax(0, 1fr)' }}>
          <div className="space-y-4">
            {dateNav}
            {statsBlock}
            {penaltyCard}
          </div>
          <div className="space-y-2.5">{listTitle}{list}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <MobileHeader title="Tarix" />
      <div className="border-b border-slate-100 bg-white px-4 pb-3">{dateNav}</div>
      <div className="space-y-4 px-4 pt-4">
        {statsBlock}
        {penaltyCard}
        <div className="space-y-2.5">{listTitle}{list}</div>
      </div>
    </div>
  );
}
