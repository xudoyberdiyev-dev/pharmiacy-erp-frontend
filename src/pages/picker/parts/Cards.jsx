import { ArrowRight, ChevronRight, FileSpreadsheet, Lock, MessageSquareWarning, RotateCcw, TriangleAlert } from 'lucide-react';
import { FILE_BASE_URL } from '../../../api/axios';
import { Avatar, Btn, Chip, IconBox, Mono, ProgressBar, cx } from '../design/ui';
import TimerBox from './TimerBox';
import { RETURNER_LABELS } from '../lib/labels';
import { fmtInn, fmtSum, fmtWait, shortPerson, withGa } from '../lib/format';

export const waitMinutes = (order, nowMs) => Math.max(0, Math.floor((nowMs - new Date(order.createdAt).getTime()) / 60000));
export const clientName = (o) => o.client?.orgName || '—';

// ── Excel havolasi ───────────────────────────────────────────────────────────
export function ExcelLink({ order, variant = 'icon', size = 48, className = '' }) {
  const href = order.productsExcelUrl ? `${FILE_BASE_URL}${order.productsExcelUrl}` : null;
  const label = `Excel faylni ochish (#${order.invoiceNumber})`;
  if (variant === 'button') {
    const base = 'inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-[14px] font-semibold transition-colors';
    return href ? (
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
        className={cx(base, 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100', className)}>
        <FileSpreadsheet size={18} aria-hidden="true" /> Excel
      </a>
    ) : (
      <span className={cx(base, 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400', className)} aria-disabled="true">
        <FileSpreadsheet size={18} aria-hidden="true" /> Excel yo'q
      </span>
    );
  }
  const base = 'inline-flex shrink-0 items-center justify-center rounded-xl border transition-colors';
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title="Excel faylni ochish"
      className={cx(base, 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100', className)} style={{ width: size, height: size }}>
      <FileSpreadsheet size={Math.round(size * 0.46)} aria-hidden="true" />
    </a>
  ) : (
    <span aria-disabled="true" className={cx(base, 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400', className)} style={{ width: size, height: size }}>
      <FileSpreadsheet size={Math.round(size * 0.46)} aria-hidden="true" />
    </span>
  );
}

// ── DIQQAT: qaytarilgan buyurtma (amber) ─────────────────────────────────────
export function ReturnedCard({ order, onOpen, compact = false }) {
  const role = order.returnedBy?.role;
  const who = role ? RETURNER_LABELS[role]?.who : null;
  if (compact) {
    return (
      <button type="button" onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-left transition-colors hover:bg-amber-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
        <IconBox icon={RotateCcw} tone="amber" size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold text-slate-900">Qaytarilgan{who ? ` · ${who}` : ''}</span>
          <span className="block truncate text-[12.5px] text-slate-700"><Mono className="font-bold">#{order.invoiceNumber}</Mono> · {clientName(order)}</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-amber-800" aria-hidden="true" />
      </button>
    );
  }
  return (
    <button type="button" onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-amber-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
      <IconBox icon={RotateCcw} tone="amber" size={44} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-bold text-slate-900">Qaytarilgan buyurtma</span>
        {who && <Chip tone="amber" className="mt-1">{who} qaytardi</Chip>}
        <span className="mt-1 block truncate text-[13.5px] text-slate-700"><Mono className="font-bold">#{order.invoiceNumber}</Mono> · {clientName(order)}</span>
        <span className="mt-1 block text-[13.5px] leading-snug text-red-700">Tuzatmaguningizcha boshqa buyurtmani yakunlab bo'lmaydi</span>
      </span>
      <ChevronRight size={20} className="shrink-0 self-center text-amber-800" aria-hidden="true" />
    </button>
  );
}

// ── DIQQAT: javob kutayotgan etirozlar (qizil) ───────────────────────────────
export function EtirovCard({ order, onOpen, compact = false }) {
  const pending = (order.etirozlar || []).filter((e) => e.status === 'PENDING' && !e.voided);
  const fromChecker = pending.some((e) => e.fromRole === 'CHECKER');
  const note = fromChecker
    ? `Checker etirozi: ${order.checkerPenaltyPoints || 5} ball jarima allaqachon yozilgan`
    : "Marker etirozi — jarimasiz";
  if (compact) {
    return (
      <button type="button" onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-left transition-colors hover:bg-red-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
        <IconBox icon={MessageSquareWarning} tone="red" size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold text-slate-900">{pending.length} ta etiroz</span>
          <span className="block truncate text-[12.5px] text-slate-700"><Mono className="font-bold">#{order.invoiceNumber}</Mono> · {clientName(order)}</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-red-700" aria-hidden="true" />
      </button>
    );
  }
  return (
    <button type="button" onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-red-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500">
      <IconBox icon={MessageSquareWarning} tone="red" size={44} />
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-bold text-slate-900">{pending.length} ta etiroz javob kutmoqda</span>
        <span className="mt-1 block truncate text-[13.5px] text-slate-700"><Mono className="font-bold">#{order.invoiceNumber}</Mono> · {clientName(order)}</span>
        <span className="mt-1 block text-[13.5px] leading-snug text-red-700">{note}</span>
      </span>
      <ChevronRight size={20} className="shrink-0 self-center text-red-700" aria-hidden="true" />
    </button>
  );
}

// ── JARAYONDA: terilayotgan order kartasi (mobil Bugun) ──────────────────────
export function InProgressCard({ order, onOpen }) {
  const stats = order.itemStats;
  const hasItems = stats && stats.total > 0;
  const meta = [order.client?.inn && `INN ${fmtInn(order.client.inn)}`, order.itemCount > 0 && `${order.itemCount} pozitsiya`, `${fmtSum(order.totalAmount)} so'm`].filter(Boolean).join(' · ');
  return (
    <article className="rounded-2xl border border-teal-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <button type="button" onClick={onOpen} className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg">
        <span className="flex items-center justify-between gap-2">
          <Mono className="text-[14px] font-bold text-slate-800">#{order.invoiceNumber}</Mono>
          <Chip tone="sky">Terilmoqda</Chip>
        </span>
        <span className="mt-3 block text-[17px] font-semibold leading-snug text-slate-900">{clientName(order)}</span>
        <span className="mt-0.5 block text-[13px] text-slate-500">{meta}</span>
      </button>
      <TimerBox order={order} className="mt-3" />
      <div className="mt-3 flex items-center gap-3">
        {hasItems ? (
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex justify-between text-[12px] text-slate-600">
              <span>Teriladi</span>
              <span className="pk-nums font-semibold text-slate-800">{stats.handled} / {stats.total}</span>
            </div>
            <ProgressBar value={stats.total ? stats.handled / stats.total : 0} height={6} label="Terish jarayoni" />
          </div>
        ) : <span className="flex-1" />}
        <Btn size="md" variant="primary" iconRight={ArrowRight} onClick={onOpen}>Davom etish</Btn>
      </div>
    </article>
  );
}

function Tile({ label, value, tone = 'slate', valueClass = '' }) {
  const tones = { slate: 'bg-slate-50 border-slate-100', teal: 'bg-teal-50 border-teal-100' };
  const valueTone = tone === 'teal' ? 'text-teal-700' : 'text-slate-900';
  return (
    <div className={cx('rounded-xl border px-3 py-2', tones[tone])}>
      <p className="text-[11.5px] text-slate-600">{label}</p>
      <p className={cx('pk-nums whitespace-nowrap text-[17px] font-bold leading-tight', valueTone, valueClass)}>{value}</p>
    </div>
  );
}

// ── NAVBAT: katta karta (mobil Navbat, desktop Navbat gridi) ─────────────────
export function QueueCard({ order, waiting, urgent, onAccept, accepting, onOpen }) {
  const mine = !!order.isMine;
  const locked = !!order.assignedPickerId && !mine;
  const lockedName = order.assignedPicker?.fullName ? withGa(shortPerson(order.assignedPicker.fullName)) : 'boshqa terimchiga';
  const name = clientName(order);
  return (
    <article className={cx('rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]', mine ? 'border-blue-200' : 'border-slate-200')}>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <Mono className="shrink-0 whitespace-nowrap text-[13.5px] font-bold text-slate-800">#{order.invoiceNumber}</Mono>
        <span className="flex flex-wrap items-center justify-end gap-1.5">
          {mine && <Chip tone="sky">Sizga biriktirilgan</Chip>}
          {urgent && <Chip tone="amber" icon={TriangleAlert}>Shoshilinch</Chip>}
          {locked && <Chip tone="slate" icon={Lock}>{lockedName} biriktirilgan</Chip>}
        </span>
      </div>
      <button type="button" onClick={onOpen} className="mt-3 flex w-full items-center gap-3 rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <Avatar name={name} size={40} />
        <span className="min-w-0">
          <span className="block truncate text-[16px] font-semibold text-slate-900">{name}</span>
          <span className="block truncate text-[12.5px] text-slate-500">
            {order.client?.inn ? `INN ${fmtInn(order.client.inn)}` : ''}{order.client?.inn && order.contractNumber ? ' · ' : ''}{order.contractNumber ? `Shartnoma ${order.contractNumber}` : ''}
          </span>
        </span>
      </button>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Tile label="Kutmoqda" value={fmtWait(waiting, { short: true })} valueClass={urgent ? '!text-orange-700' : ''} />
        <Tile label="Pozitsiya" value={order.itemCount > 0 ? order.itemCount : '—'} />
        <Tile label="Vaqt beriladi" value={`${order.pickingDuration} daq`} tone="teal" />
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <ExcelLink order={order} />
        {locked ? (
          <div className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-[14px] font-semibold text-slate-500">
            <Lock size={16} aria-hidden="true" /> Qabul qilib bo'lmaydi
          </div>
        ) : (
          <Btn size="md" className="flex-1" iconRight={ArrowRight} loading={accepting} onClick={() => onAccept(order)}>
            Qabul qilish va boshlash
          </Btn>
        )}
      </div>
    </article>
  );
}

// ── NAVBAT: ixcham qator (desktop Bugun o'rta ustun) ─────────────────────────
export function QueueRow({ order, waiting, urgent, selected, onAccept, accepting, onOpen }) {
  const mine = !!order.isMine;
  const locked = !!order.assignedPickerId && !mine;
  const lockedName = order.assignedPicker?.fullName ? withGa(shortPerson(order.assignedPicker.fullName)) : 'boshqa terimchiga';
  return (
    <li className={cx('flex items-center gap-3 px-4 py-3', locked && 'bg-slate-50', selected && 'bg-blue-50/60')}>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Mono className="text-[13.5px] font-bold text-slate-700">#{order.invoiceNumber}</Mono>
          {mine && <Chip tone="blue">Sizga</Chip>}
          {urgent && <Chip tone="amber">Shoshilinch</Chip>}
        </span>
        <span className="mt-0.5 block truncate text-[15px] font-semibold text-slate-900">{clientName(order)}</span>
        {locked ? (
          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-600"><Lock size={14} aria-hidden="true" /> {lockedName} biriktirilgan</span>
        ) : (
          <span className="mt-0.5 block text-[13px] text-slate-500">Kutmoqda {fmtWait(waiting)}{order.itemCount > 0 ? ` · ${order.itemCount} poz.` : ''}</span>
        )}
      </button>
      {!locked && (
        <Btn size="sm" loading={accepting} onClick={() => onAccept(order)} aria-label={`#${order.invoiceNumber} ni qabul qilish`}>
          Qabul qilish
        </Btn>
      )}
    </li>
  );
}
