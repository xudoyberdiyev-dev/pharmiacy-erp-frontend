import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Check, Search, SearchX } from 'lucide-react';
import { C, FONT } from './tokens';
import { Spinner } from './ui';

// ─────────────────────────────────────────────────────────────────────────
// Qidiruvli tanlov (SearchableSelect, Design System §09).
// ↑↓ — harakat, Enter — tanlash, Esc — yopish. `allowNone` bo'lsa birinchi
// variant har doim "Tanlanmagan" — tanlovni tozalash mumkin.
// Variant: { value, label, sub?, current? } — current bo'lsa "Joriy" chip.
// ─────────────────────────────────────────────────────────────────────────

const NONE = '__none__';

export default function Picker({
  label, required, optional, icon: Icon, value, onChange, options, loading, disabled,
  placeholder = 'Qidiring yoki tanlang', emptyLabel = 'Topilmadi', allowNone, searchPlaceholder = 'Qidirish',
  openUp, invalid, onOpenChange,
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const wrap = useRef(null);
  const listRef = useRef(null);
  const trigRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const f = s ? options.filter((o) => o.label?.toLowerCase().includes(s) || o.sub?.toLowerCase().includes(s)) : options;
    return allowNone && !s ? [{ value: NONE, label: 'Tanlanmagan' }, ...f] : f;
  }, [options, q, allowNone]);

  useEffect(() => { setActive(0); }, [q, open]);
  useEffect(() => { onOpenChange?.(open); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const pick = (o) => {
    onChange(o.value === NONE ? '' : o.value);
    setOpen(false);
    setQ('');
    trigRef.current?.focus();
  };

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (list[active]) pick(list[active]); }
    else if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); trigRef.current?.focus(); }
  };

  const OptIcon = Icon;
  return (
    <div ref={wrap} data-esc-local={open ? '' : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', minWidth: 0 }}>
      {label && (
        <span id={`${uid}-l`} style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 13px/18px ${FONT}`, color: C.n900 }}>
          {Icon && <Icon size={16} aria-hidden="true" style={{ color: C.n600 }} />}
          {label}
          {required && <span style={{ color: C.danger.text }}>*</span>}
          {optional && <span style={{ color: C.n600, fontWeight: 400 }}>· ixtiyoriy</span>}
        </span>
      )}
      <button
        ref={trigRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${uid}-l` : undefined}
        disabled={disabled || loading}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); }
          if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); }
        }}
        style={{
          width: '100%', height: 48, padding: '0 12px', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 10,
          border: `1px solid ${invalid ? C.danger.main : open ? C.p500 : C.n300}`,
          boxShadow: open ? `0 0 0 3px ${C.p100}` : 'none', background: loading || disabled ? C.n50 : '#fff',
          cursor: disabled || loading ? 'not-allowed' : 'pointer', outline: 'none', textAlign: 'left', color: C.n900,
        }}
      >
        {loading ? (
          <>
            <Spinner color={C.p500} track={C.n300} />
            <span style={{ flex: 1, font: `400 14px/20px ${FONT}`, color: C.n600 }}>Ro‘yxat yuklanmoqda…</span>
          </>
        ) : selected ? (
          <>
            {OptIcon && (
              <span style={{ width: 28, height: 28, flex: 'none', borderRadius: '50%', background: C.p50, color: C.p800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <OptIcon size={16} aria-hidden="true" />
              </span>
            )}
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <span className="dc-ellipsis" style={{ font: `500 13px/18px ${FONT}` }}>{selected.label}</span>
              {selected.sub && <span className="dc-ellipsis tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{selected.sub}</span>}
            </span>
          </>
        ) : (
          <span style={{ flex: 1, font: `400 14px/20px ${FONT}`, color: C.n600 }}>{allowNone ? 'Tanlanmagan' : placeholder}</span>
        )}
        {open ? <ChevronUp size={16} aria-hidden="true" style={{ color: C.n600 }} /> : <ChevronDown size={16} aria-hidden="true" style={{ color: C.n600 }} />}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', left: 0, right: 0, zIndex: 10, background: '#fff', border: `1px solid ${C.n200}`, borderRadius: 8,
            boxShadow: '0 12px 32px rgba(29,41,51,0.14), 0 2px 6px rgba(29,41,51,0.06)', overflow: 'hidden',
            ...(openUp ? { bottom: 'calc(100% - 22px)' } : { top: 'calc(100% + 4px)' }),
          }}
        >
          <div style={{ padding: 8, borderBottom: `1px solid ${C.n200}` }}>
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: 10, color: C.n600 }} />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder={searchPlaceholder}
                aria-label={`${label || ''} qidirish`.trim()}
                aria-controls={`${uid}-lb`}
                aria-activedescendant={list[active] ? `${uid}-o${active}` : undefined}
                className="dc-input"
                style={{ height: 36, paddingLeft: 32, fontSize: 13 }}
              />
            </span>
          </div>
          <div id={`${uid}-lb`} ref={listRef} role="listbox" aria-label={label} style={{ maxHeight: 200, overflowY: 'auto', padding: 4 }}>
            {list.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px 8px', font: `400 13px/18px ${FONT}`, color: C.n600 }}>
                <SearchX size={20} aria-hidden="true" /> {emptyLabel}
              </div>
            ) : list.map((o, i) => {
              const isSel = o.value === NONE ? !value : o.value === value;
              return (
                <button
                  key={o.value}
                  id={`${uid}-o${i}`}
                  data-idx={i}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  className={`dc-opt ${i === active ? 'is-active' : ''}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o)}
                >
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <span className="dc-ellipsis" style={{ font: `${isSel ? 600 : 500} 13px/18px ${FONT}`, color: o.value === NONE ? C.n600 : C.n900 }}>{o.label}</span>
                    {o.sub && <span className="dc-ellipsis tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{o.sub}</span>}
                  </span>
                  {o.current && (
                    <span style={{ height: 20, padding: '0 6px', borderRadius: 4, background: C.neutral.bg, color: C.neutral.text, font: `500 12px/20px ${FONT}`, flex: 'none' }}>Joriy</span>
                  )}
                  {isSel && <Check size={16} aria-hidden="true" style={{ color: C.p800, flex: 'none' }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
