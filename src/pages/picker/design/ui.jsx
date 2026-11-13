import { useEffect, useRef } from 'react';
import {
  Search, ChevronDown, ArrowUpDown, RefreshCw, LoaderCircle, Clock, CircleX, WifiOff,
  FileSpreadsheet, X, ArrowLeft, ServerCrash, Inbox, SearchX,
} from 'lucide-react';
import { C, FONT } from './tokens';
import { hm } from '../lib/time';
import { FILE_BASE_URL } from '../../../api/axios';

// ─────────────────────────────────────────────────────────────────────────
// Picker paneli uchun umumiy, kichik komponentlar. Layout uchun inline
// style, hover/focus holatlari uchun esa .picker-shell ichida scope
// qilingan CSS klasslar (pk-*) ishlatiladi — boshqa panellarga ta'sir yo'q.
// ─────────────────────────────────────────────────────────────────────────

export const PICKER_CSS = `
.picker-shell{font-family:${FONT};color:${C.text};font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;background:${C.canvas}}
.picker-shell *{box-sizing:border-box}
.picker-shell button,.picker-shell input,.picker-shell select,.picker-shell textarea{font:inherit}
.picker-shell .tnum{font-variant-numeric:tabular-nums}
.picker-shell .pk-focus:focus-visible,.picker-shell .pk-btn:focus-visible,.picker-shell .pk-nav:focus-visible,.picker-shell .pk-row:focus-visible,.picker-shell .pk-input:focus-visible{outline:none;box-shadow:0 0 0 2px #FFFFFF,0 0 0 4px ${C.primary}}
.picker-shell .pk-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;font-weight:600;cursor:pointer;outline:none;transition:background .15s,border-color .15s;white-space:nowrap;text-decoration:none}
.picker-shell .pk-btn:disabled{cursor:not-allowed}
.picker-shell .pk-primary{background:${C.primary};border:1px solid ${C.primary};color:#FFFFFF}
.picker-shell .pk-primary:hover:not(:disabled){background:${C.primaryHover}}
.picker-shell .pk-primary:disabled{background:${C.surfaceMuted};border-color:${C.border};color:${C.textMuted}}
.picker-shell .pk-outline{background:#FFFFFF;border:1px solid ${C.borderStrong};color:${C.text}}
.picker-shell .pk-outline:hover:not(:disabled){background:${C.canvas}}
.picker-shell .pk-outline:disabled{color:${C.textMuted}}
.picker-shell .pk-danger{background:#FFFFFF;border:1px solid ${C.danger};color:${C.danger}}
.picker-shell .pk-danger:hover:not(:disabled){background:${C.dangerBg}}
.picker-shell .pk-danger:disabled{border-color:${C.border};color:${C.textMuted}}
.picker-shell .pk-danger-solid{background:${C.danger};border:1px solid ${C.danger};color:#FFFFFF}
.picker-shell .pk-danger-solid:hover:not(:disabled){background:#991B1B}
.picker-shell .pk-danger-solid:disabled{background:${C.surfaceMuted};border-color:${C.border};color:${C.textMuted}}
.picker-shell .pk-warn-outline{background:transparent;border:1px solid ${C.warning};color:${C.warning}}
.picker-shell .pk-warn-outline:hover{background:#FDE68A}
.picker-shell .pk-ghost{background:transparent;border:1px solid transparent;color:${C.text}}
.picker-shell .pk-ghost:hover:not(:disabled){background:${C.surfaceMuted}}
.picker-shell .pk-icon{width:48px;height:48px;flex:none;display:grid;place-items:center;border-radius:12px;border:1px solid ${C.border};background:#FFFFFF;color:${C.text};cursor:pointer;outline:none}
.picker-shell .pk-icon:hover:not(:disabled){background:${C.canvas}}
.picker-shell .pk-icon:disabled{color:${C.textMuted};cursor:not-allowed}
.picker-shell .pk-ins-body>*{flex-shrink:0}
.picker-shell .pk-row{cursor:pointer;transition:background .12s,border-color .12s;outline:none}
.picker-shell .pk-row:hover{border-color:${C.borderHover}!important}
.picker-shell .pk-nav{outline:none;transition:background .15s;text-decoration:none}
.picker-shell .pk-nav:hover{background:${C.surfaceMuted}}
.picker-shell .pk-nav[aria-current="page"]:hover{background:${C.primarySoft}}
.picker-shell .pk-input{outline:none}
.picker-shell .pk-input:focus{border-color:${C.primary}}
.picker-shell .pk-logout:hover{background:${C.dangerBg}!important;color:${C.danger}!important}
.picker-shell .pk-tr{cursor:pointer;outline:none}
.picker-shell .pk-tr:hover td{background:${C.canvas}}
.picker-shell .pk-tr[aria-selected="true"]:hover td{background:${C.primarySoft}}
.picker-shell .pk-tr:focus-visible td{box-shadow:inset 0 0 0 2px ${C.primary}}
@keyframes pk-spin{to{transform:rotate(360deg)}}
@keyframes pk-shimmer{0%{opacity:.55}50%{opacity:1}100%{opacity:.55}}
@keyframes pk-in{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
@keyframes pk-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.picker-shell .pk-spin{animation:pk-spin .9s linear infinite}
.picker-shell .pk-skel{background:${C.border};animation:pk-shimmer 1.4s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.picker-shell *{animation:none!important;transition:none!important}}
`;

// ── Chip / pill ──────────────────────────────────────────────────────────
export function Chip({ icon: Icon, children, bg = C.surfaceMuted, fg = C.textBody, border, size = 'md', style }) {
  const sm = size === 'sm';
  return (
    <span
      className="tnum"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: sm ? 5 : 6, minHeight: sm ? 26 : 28,
        padding: sm ? '1px 9px' : '2px 10px', borderRadius: 999, background: bg, color: fg,
        border: border ? `1px solid ${border}` : undefined, fontSize: 13, fontWeight: 600,
        whiteSpace: 'nowrap', ...style,
      }}
    >
      {Icon && <Icon size={sm ? 14 : 16} strokeWidth={2} style={{ flex: 'none' }} aria-hidden="true" />}
      {children}
    </span>
  );
}

// ── Tugma ────────────────────────────────────────────────────────────────
export function Btn({ variant = 'primary', h = 48, icon: Icon, iconColor, loading, children, style, className = '', ...rest }) {
  return (
    <button
      type="button"
      className={`pk-btn pk-${variant} ${className}`}
      style={{ height: h, padding: '0 18px', fontSize: h >= 52 ? 16 : 15, ...style }}
      aria-busy={loading ? 'true' : undefined}
      {...rest}
    >
      {loading
        ? <LoaderCircle size={18} className="pk-spin" aria-hidden="true" />
        : Icon && <Icon size={20} aria-hidden="true" style={iconColor ? { color: iconColor } : undefined} />}
      {children}
    </button>
  );
}

// ── Yangilanish holati (React Query dan) ─────────────────────────────────
export function refreshState(q, online) {
  if (!online) {
    const t = q?.dataUpdatedAt ? hm(q.dataUpdatedAt) : null;
    return { text: t ? `Oflayn · so‘nggi: ${t}` : 'Oflayn', Icon: WifiOff, color: C.warning, spin: false };
  }
  if (q?.isFetching) return { text: 'Yangilanmoqda…', Icon: LoaderCircle, color: C.text2, spin: true };
  if (q?.isError) return { text: 'Yangilashda xatolik', Icon: CircleX, color: C.danger, spin: false };
  if (q?.dataUpdatedAt) return { text: `So‘nggi yangilanish: ${hm(q.dataUpdatedAt)}`, Icon: Clock, color: C.text2, spin: false };
  return { text: 'Hali yuklanmagan', Icon: Clock, color: C.text2, spin: false };
}

export function RefreshStatus({ rs, style }) {
  const { Icon } = rs;
  return (
    <span role="status" aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: rs.color, whiteSpace: 'nowrap', minWidth: 0, ...style }}>
      <Icon size={16} className={rs.spin ? 'pk-spin' : ''} style={{ flex: 'none' }} aria-hidden="true" />
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{rs.text}</span>
    </span>
  );
}

export function RefreshButton({ onClick, busy, disabled, label = 'Ro‘yxatni yangilash', bare }) {
  return (
    <button
      type="button" className="pk-icon" onClick={onClick} disabled={disabled || busy}
      aria-label={label} aria-busy={busy ? 'true' : 'false'}
      style={bare ? { border: 'none', background: 'transparent' } : undefined}
    >
      <RefreshCw size={20} className={busy ? 'pk-spin' : ''} aria-hidden="true" />
    </button>
  );
}

// ── Sahifa sarlavha paneli (desktop/planshet, 64px) ──────────────────────
export function PageBar({ title, sub, count, countBg = C.surfaceMuted, countFg = C.textBody, children, rs, onRefresh, refreshing, refreshDisabled, pad = 24 }) {
  return (
    <div style={{ height: 64, flex: 'none', background: '#FFFFFF', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, padding: `0 ${pad}px` }}>
      {sub ? (
        <div style={{ minWidth: 0, lineHeight: 1.25 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h1>
          <div style={{ fontSize: 13, color: C.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
        </div>
      ) : (
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, whiteSpace: 'nowrap', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', flex: '0 1 auto' }}>{title}</h1>
      )}
      {count != null && (
        <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: countFg, background: countBg, borderRadius: 999, padding: '2px 10px', whiteSpace: 'nowrap' }}>{count}</span>
      )}
      {children}
      <span style={{ flex: 1 }} />
      {rs && <RefreshStatus rs={rs} style={{ flex: '0 1 auto' }} />}
      {onRefresh && <RefreshButton onClick={onRefresh} busy={refreshing} disabled={refreshDisabled} />}
    </div>
  );
}

// ── Mobil sarlavha (kontent ichida) ──────────────────────────────────────
export function MobileTitle({ title, count, countBg = C.surfaceMuted, countFg = C.textBody, rs, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.25 }}>{title}</h1>
        {count != null && <span className="tnum" style={{ fontSize: 13, fontWeight: 600, color: countFg, background: countBg, borderRadius: 999, padding: '2px 10px' }}>{count}</span>}
      </div>
      {sub && <span style={{ fontSize: 14, color: C.text2 }}>{sub}</span>}
      {rs && <RefreshStatus rs={rs} />}
    </div>
  );
}

// ── Oflayn banner ────────────────────────────────────────────────────────
export function OfflineBanner({ note }) {
  return (
    <div role="alert" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.text, color: '#FFFFFF', borderRadius: 12, padding: '12px 14px' }}>
      <WifiOff size={20} style={{ flex: 'none', marginTop: 1 }} aria-hidden="true" />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>Internet aloqasi uzildi. Ma’lumotlar yangilanmayapti.</div>
        {note && <div style={{ fontSize: 13, color: C.border }}>{note}</div>}
      </div>
    </div>
  );
}

// ── Qidiruv ──────────────────────────────────────────────────────────────
export function SearchBox({ value, onChange, placeholder, label, max = 420 }) {
  return (
    <label style={{ position: 'relative', flex: '1 1 220px', minWidth: 0, maxWidth: max, display: 'block' }}>
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{label}</span>
      <Search size={20} style={{ position: 'absolute', left: 14, top: 14, color: C.text2, pointerEvents: 'none' }} aria-hidden="true" />
      <input
        type="search" className="pk-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', height: 48, padding: '0 14px 0 44px', borderRadius: 12, border: `1px solid ${C.borderStrong}`, background: '#FFFFFF', color: C.text, fontSize: 15 }}
      />
    </label>
  );
}

// ── Segment filtr (radiogroup) ───────────────────────────────────────────
export function Segment({ options, value, onChange, compact, label }) {
  return (
    <div
      role="radiogroup" aria-label={label}
      style={{
        display: 'grid', gridTemplateColumns: compact ? `repeat(${options.length},minmax(0,1fr))` : `repeat(${options.length},auto)`,
        gap: 4, padding: 4, background: C.surfaceMuted, borderRadius: 12, flex: compact ? '1 1 100%' : '0 1 auto',
      }}
    >
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button
            key={o.key} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.key)} className="pk-focus"
            style={{
              minHeight: 48, padding: '4px 12px', borderRadius: 9, border: 'none', background: on ? '#FFFFFF' : 'transparent',
              color: on ? C.text : C.text2, boxShadow: on ? '0 1px 2px rgba(15,23,42,.12)' : 'none', fontWeight: 600, fontSize: 13,
              cursor: 'pointer', display: 'flex', flexDirection: compact ? 'column' : 'row', alignItems: 'center', justifyContent: 'center',
              gap: compact ? 0 : 8, whiteSpace: 'nowrap',
            }}
          >
            <span>{compact && o.short ? o.short : o.label}</span>
            <span className="tnum" style={{ color: on ? C.primary : C.textMuted, fontWeight: 600 }}>{o.count ?? '—'}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Saralash ─────────────────────────────────────────────────────────────
export function SortSelect({ value, onChange, options, iconOnly }) {
  if (iconOnly) {
    return (
      <label style={{ position: 'relative', width: 48, height: 48, flex: 'none', borderRadius: 12, border: `1px solid ${C.borderStrong}`, background: '#FFFFFF', display: 'grid', placeItems: 'center' }}>
        <ArrowUpDown size={20} color={C.text} aria-hidden="true" />
        <select aria-label="Saralash" value={value} onChange={(e) => onChange(e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
    );
  }
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
      <span style={{ fontSize: 13, color: C.text2, whiteSpace: 'nowrap' }}>Saralash</span>
      <span style={{ position: 'relative', display: 'block' }}>
        <select
          className="pk-input pk-focus" value={value} onChange={(e) => onChange(e.target.value)}
          style={{ appearance: 'none', height: 48, padding: '0 40px 0 14px', borderRadius: 12, border: `1px solid ${C.borderStrong}`, background: '#FFFFFF', color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={20} style={{ position: 'absolute', right: 12, top: 14, color: C.text2, pointerEvents: 'none' }} aria-hidden="true" />
      </span>
    </label>
  );
}

// ── Holat bloklari: bo'sh / qidiruv bo'sh / xato ─────────────────────────
export function StateBlock({ kind = 'empty', icon, title, desc, action }) {
  const err = kind === 'error';
  const Icon = icon || (err ? ServerCrash : kind === 'search' ? SearchX : Inbox);
  return (
    <div
      role={err ? 'alert' : undefined}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10,
        padding: err ? '48px 16px' : '56px 16px',
        ...(err ? { background: '#FFFFFF', border: `1px solid ${C.dangerLine}`, borderRadius: 16 } : {}),
      }}
    >
      <span style={{ width: 56, height: 56, borderRadius: 999, background: err ? C.dangerSoft : C.surfaceMuted, color: err ? C.danger : C.text2, display: 'grid', placeItems: 'center' }}>
        <Icon size={24} aria-hidden="true" />
      </span>
      <div style={{ fontWeight: 600, fontSize: 17 }}>{title}</div>
      {desc && <div style={{ fontSize: 14, color: C.text2, maxWidth: '40ch' }}>{desc}</div>}
      {action}
    </div>
  );
}

export function RetryButton({ onClick }) {
  return <Btn variant="primary" icon={RefreshCw} onClick={onClick}>Qayta urinish</Btn>;
}

// ── Skeleton qatorlar ────────────────────────────────────────────────────
export function SkeletonRows({ n = 6, h = 92 }) {
  return (
    <div aria-busy="true" aria-label="Yuklanmoqda" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} style={{ height: h, borderRadius: 12, border: `1px solid ${C.border}`, background: '#FFFFFF', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className="pk-skel" style={{ width: 40, height: 40, borderRadius: 10, flex: 'none' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="pk-skel" style={{ width: 96, height: 16, borderRadius: 6 }} />
            <span className="pk-skel" style={{ width: '70%', height: 13, borderRadius: 6 }} />
          </div>
          <span className="pk-skel" style={{ width: 90, height: 26, borderRadius: 999 }} />
        </div>
      ))}
    </div>
  );
}

// ── Excel tugmasi ────────────────────────────────────────────────────────
export function excelHref(url) {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${FILE_BASE_URL}${url}`;
}

export function ExcelButton({ url, label = 'Excel faylini ochish', full, disabled, style }) {
  const href = excelHref(url);
  if (!href) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.textMuted, ...style }}>
        <FileSpreadsheet size={18} aria-hidden="true" /> Excel fayl biriktirilmagan
      </div>
    );
  }
  return (
    <a
      href={disabled ? undefined : href} target="_blank" rel="noreferrer" aria-disabled={disabled ? 'true' : undefined}
      className="pk-btn pk-outline"
      style={{ height: 48, padding: '0 16px', fontSize: 15, width: full ? '100%' : undefined, pointerEvents: disabled ? 'none' : undefined, opacity: disabled ? 0.6 : 1, ...style }}
    >
      <FileSpreadsheet size={20} color={C.success} aria-hidden="true" />
      {label}
    </a>
  );
}

// ── Kalit tugmasi belgisi ────────────────────────────────────────────────
export function Kbd({ children }) {
  return <kbd style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 600, border: `1px solid ${C.borderStrong}`, borderBottomWidth: 2, borderRadius: 6, padding: '1px 7px', background: C.canvas }}>{children}</kbd>;
}

// ── Ta'rif ro'yxati (dl) ─────────────────────────────────────────────────
export function FactList({ items }) {
  return (
    <dl style={{ margin: 0, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
      {items.map(([k, v, muted], i) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
          <dt style={{ color: C.text2, fontSize: 14 }}>{k}</dt>
          <dd className="tnum" style={{ margin: 0, fontWeight: 600, fontSize: 14, textAlign: 'right', color: muted ? C.textMuted : C.text, overflowWrap: 'anywhere' }}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionTitle({ children, as: Tag = 'h2' }) {
  return <Tag style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text2 }}>{children}</Tag>;
}

// ── Inspector qobig'i (split / drawer / full-screen) ─────────────────────
// mode: 'split' — ro'yxat yonida doimiy ustun; 'drawer' — o'ngdan chiquvchi
// panel (scrim bilan); 'mobile' — to'liq ekran.
export function Inspector({ mode, open, width, onClose, topTitle, label, children }) {
  useEffect(() => {
    if (mode === 'split' || !open) return undefined;
    const k = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [mode, open, onClose]);

  if (mode !== 'split' && !open) return null;
  const full = mode === 'mobile';
  return (
    <>
      {mode === 'drawer' && <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(15,23,42,.4)' }} />}
      <aside
        aria-label={label}
        style={{
          position: mode === 'split' ? 'relative' : 'fixed', top: 0, right: 0, bottom: 0, left: full ? 0 : 'auto',
          width: full ? '100%' : width, flex: 'none', zIndex: mode === 'split' ? 1 : 41, background: '#FFFFFF',
          borderLeft: `1px solid ${C.border}`, boxShadow: mode === 'drawer' ? '-16px 0 40px rgba(15,23,42,.16)' : 'none',
          display: 'flex', flexDirection: 'column', animation: mode === 'split' ? 'none' : 'pk-in .2s ease-out', minHeight: 0,
        }}
      >
        {mode !== 'split' && (
          <div style={{ height: 60, flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', borderBottom: `1px solid ${C.border}` }}>
            <button type="button" className="pk-icon" style={{ border: 'none' }} onClick={onClose} aria-label={full ? 'Ro‘yxatga qaytish' : 'Tafsilotlarni yopish'}>
              {full ? <ArrowLeft size={22} aria-hidden="true" /> : <X size={22} aria-hidden="true" />}
            </button>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{topTitle}</span>
          </div>
        )}
        {children}
      </aside>
    </>
  );
}

// Inspector ichidagi aylanuvchi kontent + pastki yopishqoq harakat hududi
export function InspectorBody({ mobile, children }) {
  return <div className="pk-ins-body" style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: mobile ? '20px 16px' : 24, display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>;
}
export function InspectorFoot({ mobile, children }) {
  return <div style={{ flex: 'none', borderTop: `1px solid ${C.border}`, background: '#FFFFFF', padding: `16px ${mobile ? 16 : 24}px ${mobile ? 24 : 16}px`, display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>;
}

export function InspectorPlaceholder({ icon: Icon, title, desc, children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, padding: 32 }}>
      <span style={{ width: 64, height: 64, borderRadius: 16, background: C.surfaceMuted, color: C.text2, display: 'grid', placeItems: 'center' }}><Icon size={28} aria-hidden="true" /></span>
      <div style={{ fontWeight: 600, fontSize: 17 }}>{title}</div>
      {desc && <div style={{ fontSize: 14, color: C.text2, maxWidth: '30ch' }}>{desc}</div>}
      {children}
    </div>
  );
}

// ── Tasdiqlash dialogi ───────────────────────────────────────────────────
// Escape yopadi (yuborish paytida emas), Tab dialog ichida aylanadi,
// yopilgach fokus ochgan elementga qaytadi. Mobilda pastki varaq.
export function Dialog({ open, onClose, busy, mobile, icon: Icon, iconBg = C.primarySoft, iconFg = C.primary, title, desc, children, footer, labelId }) {
  const ref = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    lastFocus.current = document.activeElement;
    const t = setTimeout(() => {
      const el = ref.current?.querySelector('[data-autofocus]') || ref.current?.querySelector('button:not(:disabled)');
      el?.focus();
    }, 30);
    return () => {
      clearTimeout(t);
      const f = lastFocus.current;
      if (f && typeof f.focus === 'function') setTimeout(() => f.focus(), 0);
    };
  }, [open]);

  if (!open) return null;

  const onKey = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); if (!busy) onClose(); return; }
    if (e.key !== 'Tab' || !ref.current) return;
    const els = [...ref.current.querySelectorAll('button,textarea,input,select,a[href]')].filter((x) => !x.disabled);
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  return (
    <div
      onClick={() => { if (!busy) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(15,23,42,.55)', display: 'flex', alignItems: mobile ? 'flex-end' : 'center', justifyContent: 'center', padding: mobile ? 0 : 16 }}
    >
      <div
        ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelId} onClick={(e) => e.stopPropagation()} onKeyDown={onKey}
        style={{
          width: '100%', maxWidth: mobile ? 'none' : 500, maxHeight: mobile ? '92vh' : 'calc(100vh - 32px)', overflow: 'auto',
          background: '#FFFFFF', borderRadius: mobile ? '16px 16px 0 0' : 16, padding: `24px 24px ${mobile ? 28 : 24}px`,
          boxShadow: '0 16px 40px rgba(15,23,42,.16)', display: 'flex', flexDirection: 'column', gap: 16,
          animation: mobile ? 'pk-up .2s ease-out' : 'none',
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          {Icon && <span style={{ width: 48, height: 48, flex: 'none', borderRadius: 12, background: iconBg, color: iconFg, display: 'grid', placeItems: 'center' }}><Icon size={24} aria-hidden="true" /></span>}
          <div style={{ minWidth: 0 }}>
            <h2 id={labelId} style={{ margin: 0, fontSize: 18, fontWeight: 600, lineHeight: 1.35 }}>{title}</h2>
            {desc && <p style={{ margin: '4px 0 0', fontSize: 14, color: C.text2 }}>{desc}</p>}
          </div>
        </div>
        {children}
        {footer && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  );
}

// Dialog ichidagi buyurtma xulosasi
export function DialogSummary({ no, right, client }) {
  return (
    <div style={{ background: C.canvas, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <span className="tnum" style={{ fontWeight: 700, fontSize: 16 }}>№ {no}</span>
        {right && <span className="tnum" style={{ fontSize: 14, color: C.text2 }}>{right}</span>}
      </div>
      {client && <div style={{ fontSize: 14, color: C.textBody, overflowWrap: 'anywhere' }}>{client}</div>}
    </div>
  );
}

export function DialogAlert({ title, text, tone = 'danger', icon: Icon }) {
  const t = tone === 'danger' ? [C.dangerBg, C.dangerLine, C.danger] : [C.warningBg, C.warningLine, C.warning];
  return (
    <div role="alert" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: t[0], border: `1px solid ${t[1]}`, color: t[2], borderRadius: 12, padding: '12px 14px' }}>
      {Icon && <Icon size={20} style={{ flex: 'none', marginTop: 1 }} aria-hidden="true" />}
      <div style={{ fontSize: 14 }}>
        {title && <div style={{ fontWeight: 600 }}>{title}</div>}
        {text && <div>{text}</div>}
      </div>
    </div>
  );
}

// Server xatosini tasnifi — 403 ruxsat, 409/400 konflikt, tarmoq xatosi noma'lum natija
export function classifyError(e) {
  const st = e?.response?.status;
  const msg = e?.response?.data?.message;
  if (!e?.response) return { kind: 'unknown', status: null, msg: 'Server javob bermadi. Amal bajarilgan-bajarilmaganini tekshiring.' };
  if (st === 403) return { kind: 'forbidden', status: st, msg: msg || 'Ushbu amalni bajarishga ruxsatingiz yo‘q.' };
  if (st === 409 || st === 400 || st === 404) return { kind: 'conflict', status: st, msg: msg || 'Holat o‘zgargan bo‘lishi mumkin.' };
  return { kind: 'server', status: st, msg: msg || 'Serverda xatolik yuz berdi.' };
}
