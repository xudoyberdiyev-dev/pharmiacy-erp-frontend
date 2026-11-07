import { Snowflake, TriangleAlert } from 'lucide-react';
import { Checkbox, Mono, cx } from '../design/ui';
import { ISSUE_LABELS } from '../lib/labels';

export function coldText(item) {
  const note = (item.note || '').trim();
  if (/sovuq|холод|cold/i.test(note)) return note;
  return note ? `Sovuq zanjir · ${note}` : 'Sovuq zanjir';
}

export function lotLine(item, { words = true } = {}) {
  const parts = [];
  if (item.lot) parts.push(words ? `Lot ${item.lot}` : item.lot);
  if (item.expiry) parts.push(words ? `Yaroqli ${item.expiry}` : item.expiry);
  return parts.join(' · ');
}

export function issueText(item) {
  if (!item.issueType) return '';
  return `Muammo: ${ISSUE_LABELS[item.issueType] || item.issueType}${item.issueNote ? ` — ${item.issueNote}` : ''}`;
}

export function LocationChip({ value, className = '' }) {
  if (!value) return null;
  return (
    <Mono className={cx('inline-block rounded-md bg-blue-50 px-2 py-[2px] text-[12px] font-bold text-blue-700', className)}>{value}</Mono>
  );
}

// Mobil ro'yxat qatori (6.png)
export function ItemRow({ item, interactive = true, onToggle, number }) {
  const cold = item.coldChain && !item.picked;
  const flagged = !item.picked && !!item.issueType;
  const lot = lotLine(item);
  return (
    <li className={cx('flex items-center gap-3 px-4 py-3.5', cold && 'bg-amber-50', flagged && 'bg-red-50')}>
      {interactive ? (
        <Checkbox checked={!!item.picked} onChange={(v) => onToggle(item, v)} label={`${item.name} — ${item.picked ? 'terilgan' : 'terilmagan'}`} />
      ) : (
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[12px] font-bold text-slate-500">{number ?? item.lineNo}</span>
      )}
      <div className="min-w-0 flex-1">
        <p className={cx('text-[16px] font-semibold leading-snug', item.picked ? 'text-slate-500 line-through' : 'text-slate-900')}>{item.name}</p>
        {item.manufacturer && !item.picked && <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">{item.manufacturer}</p>}
        {cold && (
          <p className="mt-0.5 flex items-center gap-1 text-[14px] font-medium text-amber-800">
            <Snowflake size={14} aria-hidden="true" /> {coldText(item)}
          </p>
        )}
        {lot && <p className="mt-0.5 text-[14px] text-slate-500">{lot}</p>}
        {flagged && (
          <p className="mt-0.5 flex items-start gap-1 text-[13.5px] font-medium text-red-700">
            <TriangleAlert size={14} className="mt-[2px] shrink-0" aria-hidden="true" /> {issueText(item)}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        {item.quantity !== null && item.quantity !== undefined && (
          <p className={cx('pk-nums text-[18px] font-bold', item.picked ? 'text-slate-500' : 'text-slate-900')}>×{item.quantity}</p>
        )}
        <LocationChip value={item.location} className="mt-1" />
      </div>
    </li>
  );
}

// Desktop jadval (2.webp): DORI | LOT · YAROQLILIK | JAVON | SONI
export function ChecklistTable({ remaining, done, interactive = true, onToggle }) {
  const all = [...remaining, ...done];
  const showLot = all.some((i) => i.lot || i.expiry || i.coldChain);
  const showLoc = all.some((i) => i.location);
  // Tor panelda (1024–1279px) ustunlar siqiladi: nom/lot matni qatorga o'raladi, "Soni" hech qachon qirqilmaydi
  const cols = ['32px', 'minmax(110px,1.7fr)', showLot && 'minmax(88px,1.1fr)', showLoc && '80px', '44px'].filter(Boolean).join(' ');

  const row = (item) => {
    const cold = item.coldChain && !item.picked;
    const flagged = !item.picked && !!item.issueType;
    return (
      <li key={item.id} className={cx('grid items-center gap-2 border-t border-slate-100 px-4 py-3 xl:gap-3', cold && 'bg-amber-50', flagged && 'bg-red-50')} style={{ gridTemplateColumns: cols }}>
        {interactive ? (
          <Checkbox checked={!!item.picked} onChange={(v) => onToggle(item, v)} label={`${item.name} — ${item.picked ? 'terilgan' : 'terilmagan'}`} />
        ) : (
          <span className="pk-nums text-[12px] font-bold text-slate-400">{item.lineNo}</span>
        )}
        <div className="min-w-0">
          <p className={cx('text-[15px] font-semibold leading-snug', item.picked ? 'text-slate-500 line-through' : 'text-slate-900')}>{item.name}</p>
          {item.manufacturer && !item.picked && <p className="truncate text-[12.5px] text-slate-500">{item.manufacturer}</p>}
          {flagged && <p className="mt-0.5 text-[12.5px] font-medium text-red-700">{issueText(item)}</p>}
        </div>
        {showLot && (
          <p className={cx('text-[14px]', cold ? 'flex items-center gap-1 font-semibold text-amber-800' : 'text-slate-500')}>
            {cold ? <><Snowflake size={14} aria-hidden="true" /> {coldText(item)}</> : lotLine(item, { words: false }) || '—'}
          </p>
        )}
        {showLoc && <div>{item.location ? <LocationChip value={item.location} /> : <span className="text-slate-300">—</span>}</div>}
        <p className={cx('pk-nums text-right text-[15px] font-bold', item.picked ? 'text-slate-500' : 'text-slate-900')}>
          {item.quantity ?? '—'}
        </p>
      </li>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid items-center gap-2 px-4 py-3 text-[11.5px] font-bold uppercase leading-tight tracking-[0.06em] text-slate-500 xl:gap-3 xl:text-[12px] xl:tracking-[0.08em]" style={{ gridTemplateColumns: cols }}>
        <span aria-hidden="true" />
        <span>Dori</span>
        {showLot && <span>Lot · Yaroqlilik</span>}
        {showLoc && <span>Javon</span>}
        <span className="text-right">Soni</span>
      </div>
      <ul>{remaining.map(row)}{done.map(row)}</ul>
    </div>
  );
}
