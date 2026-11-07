import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAvailable, useMine } from '../hooks/usePickerData';
import { usePicker } from '../PickerContext';
import { Chip, Mono, cx } from '../design/ui';
import { clientName } from './Cards';

// Desktop qidiruv: faktura, mijoz, INN yoki skaner (skaner kodni yozib Enter bosadi). "/" bosilsa fokus oladi.
export default function GlobalSearch() {
  const { searchRef } = usePicker();
  const navigate = useNavigate();
  const mine = useMine();
  const available = useAvailable();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);

  const pool = useMemo(() => {
    const map = new Map();
    [...(mine.data || []), ...(available.data?.list || [])].forEach((o) => map.set(o.id, o));
    return [...map.values()];
  }, [mine.data, available.data]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return pool
      .filter((o) => [o.invoiceNumber, o.orderNumber, o.client?.orgName, o.client?.inn, o.contractNumber].some((v) => String(v || '').toLowerCase().includes(s)))
      .slice(0, 8);
  }, [q, pool]);

  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => {
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const go = (o) => {
    setQ(''); setOpen(false);
    searchRef.current?.blur();
    navigate(`/picker/orders/${o.id}`);
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, Math.max(0, results.length - 1))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      // skaner: aniq faktura raqami mos kelsa darhol ochiladi
      const exact = pool.find((o) => String(o.invoiceNumber).toLowerCase() === q.trim().toLowerCase());
      const target = exact || results[active];
      if (target) go(target);
    } else if (e.key === 'Escape') { setQ(''); setOpen(false); e.currentTarget.blur(); }
  };

  return (
    <div className="relative w-full max-w-[520px]" ref={wrapRef}>
      <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      <input
        ref={searchRef} type="search" value={q} autoComplete="off"
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
        placeholder="Faktura, mijoz, INN yoki skaner"
        aria-label="Buyurtmani qidirish" role="combobox" aria-expanded={open && results.length > 0} aria-controls="pk-search-list"
        className="h-10 w-full rounded-xl border border-transparent bg-slate-100 pl-10 pr-10 text-[14px] text-slate-900 placeholder:text-slate-500 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-300 bg-white px-1.5 text-[12px] font-medium text-slate-500">/</kbd>

      {open && q.trim() && (
        <div id="pk-search-list" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
          {results.length === 0 ? (
            <p className="px-4 py-5 text-center text-[13.5px] text-slate-500">Hech narsa topilmadi</p>
          ) : results.map((o, i) => (
            <button
              key={o.id} type="button" role="option" aria-selected={i === active}
              onMouseEnter={() => setActive(i)} onClick={() => go(o)}
              className={cx('flex w-full items-center gap-3 px-4 py-2.5 text-left', i === active ? 'bg-blue-50' : 'hover:bg-slate-50')}
            >
              <Mono className="text-[13px] font-bold text-slate-700">#{o.invoiceNumber}</Mono>
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-slate-900">{clientName(o)}</span>
              {o.status === 'PICKING' ? <Chip tone="sky">Terilmoqda</Chip> : o.isMine ? <Chip tone="blue">Sizga</Chip> : <Chip tone="slate">Navbatda</Chip>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
