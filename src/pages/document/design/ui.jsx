import { useEffect, useId, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Search, X, RefreshCw, CircleAlert, SearchX, WifiOff, ChevronLeft, ChevronRight, ChevronDown,
  Check, Minus, CircleCheck, Info, TriangleAlert, CircleDot, Clock, FileCheck2, Truck, Undo2,
  CircleX, Ban, Inbox,
} from 'lucide-react';
import { C, FONT, FOCUS, FOCUS_DARK, SHADOW, BADGE } from './tokens';

// ─────────────────────────────────────────────────────────────────────────
// Hujjatchi paneli uchun umumiy komponentlar (Design System Phase 01).
// Layout — inline style; hover/focus/disabled holatlari .doc-shell ichida
// scope qilingan dc-* klasslar orqali. Boshqa panellarga ta'sir yo'q.
// ─────────────────────────────────────────────────────────────────────────

export const DOC_CSS = `
.doc-shell{font-family:${FONT};color:${C.n900};font-size:14px;line-height:22px;-webkit-font-smoothing:antialiased;background:${C.n50}}
.doc-shell *{box-sizing:border-box}
.doc-shell button,.doc-shell input,.doc-shell select,.doc-shell textarea{font-family:inherit}
.doc-shell .tnum{font-variant-numeric:tabular-nums}
.doc-shell .dc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 16px;border-radius:7px;font-size:13px;line-height:16px;font-weight:500;cursor:pointer;outline:none;white-space:nowrap;border:1px solid transparent;transition:background .12s,border-color .12s,color .12s;text-decoration:none}
.doc-shell .dc-btn:focus-visible,.doc-shell .dc-ib:focus-visible,.doc-shell .dc-focus:focus-visible{box-shadow:${FOCUS}}
.doc-shell .dc-btn:disabled,.doc-shell .dc-ib:disabled{cursor:not-allowed}
.doc-shell .dc-sm{height:36px;padding:0 12px}
.doc-shell .dc-lg{height:44px;padding:0 18px}
.doc-shell .dc-primary{background:${C.p800};border-color:${C.p800};color:#fff;font-weight:600}
.doc-shell .dc-primary:hover:not(:disabled){background:${C.p900};border-color:${C.p900}}
.doc-shell .dc-primary:active:not(:disabled){background:${C.p950}}
.doc-shell .dc-primary:disabled{background:${C.n200};border-color:${C.n200};color:${C.n500}}
.doc-shell .dc-primary.is-busy:disabled{background:${C.p800};border-color:${C.p800};color:#fff;opacity:.85}
.doc-shell .dc-secondary{background:#fff;border-color:${C.n300};color:${C.n900}}
.doc-shell .dc-secondary:hover:not(:disabled){background:${C.n100}}
.doc-shell .dc-secondary:disabled{color:${C.n500};background:${C.n50}}
.doc-shell .dc-ghost{background:transparent;color:${C.n700}}
.doc-shell .dc-ghost:hover:not(:disabled){background:${C.n100}}
.doc-shell .dc-ghost:disabled{color:${C.n500}}
.doc-shell .dc-link{background:transparent;color:${C.p700};padding:0 10px}
.doc-shell .dc-link:hover:not(:disabled){background:${C.n100}}
.doc-shell .dc-tint{background:${C.p50};border-color:${C.p200};color:${C.p800}}
.doc-shell .dc-tint:hover:not(:disabled){background:${C.p100}}
.doc-shell .dc-danger{background:${C.danger.main};border-color:${C.danger.main};color:#fff;font-weight:600}
.doc-shell .dc-danger:hover:not(:disabled){background:${C.danger.hover};border-color:${C.danger.hover}}
.doc-shell .dc-danger:active:not(:disabled){background:${C.danger.active}}
.doc-shell .dc-danger:disabled{background:${C.n200};border-color:${C.n200};color:${C.n500}}
.doc-shell .dc-danger.is-busy:disabled{background:${C.danger.main};border-color:${C.danger.main};color:#fff;opacity:.85}
.doc-shell .dc-danger-outline{background:#fff;border-color:${C.danger.border};color:${C.danger.text}}
.doc-shell .dc-danger-outline:hover:not(:disabled){background:${C.danger.bg}}
.doc-shell .dc-danger-outline:focus-visible{box-shadow:0 0 0 2px #fff,0 0 0 4px ${C.danger.main}}
.doc-shell .dc-dark-outline{background:transparent;border-color:${C.p500};color:#fff}
.doc-shell .dc-dark-outline:hover:not(:disabled){background:${C.p800}}
.doc-shell .dc-dark-ghost{background:transparent;color:${C.p100}}
.doc-shell .dc-dark-ghost:hover:not(:disabled){background:${C.p800};color:#fff}
.doc-shell .dc-inverse{background:#fff;border-color:#fff;color:${C.p900};font-weight:600}
.doc-shell .dc-inverse:hover:not(:disabled){background:${C.p50}}
.doc-shell .dc-dark-outline:focus-visible,.doc-shell .dc-dark-ghost:focus-visible,.doc-shell .dc-inverse:focus-visible{box-shadow:${FOCUS_DARK}}
.doc-shell .dc-btn:disabled:not(.is-busy){opacity:1}
.doc-shell .dc-off:disabled{opacity:.45}
.doc-shell .dc-ib{width:36px;height:36px;flex:none;display:inline-flex;align-items:center;justify-content:center;border-radius:7px;border:1px solid transparent;background:transparent;color:${C.n700};cursor:pointer;outline:none;padding:0;transition:background .12s,color .12s}
.doc-shell .dc-ib:hover:not(:disabled){background:${C.n200};color:${C.p800}}
.doc-shell .dc-ib.tint{border-color:${C.p200};background:${C.p50};color:${C.p800}}
.doc-shell .dc-ib.tint:hover:not(:disabled){background:${C.p100}}
.doc-shell .dc-ib.danger{color:${C.danger.text}}
.doc-shell .dc-ib.danger:hover:not(:disabled){background:${C.danger.bg};color:${C.danger.text}}
.doc-shell .dc-ib:disabled{opacity:.45}
.doc-shell .dc-input{width:100%;height:40px;padding:0 12px;border:1px solid ${C.n300};border-radius:7px;background:#fff;font-size:14px;line-height:20px;color:${C.n900};outline:none;transition:border-color .12s,box-shadow .12s}
.doc-shell .dc-input::placeholder{color:${C.n600}}
.doc-shell .dc-input:hover:not(:disabled){border-color:${C.n500}}
.doc-shell .dc-input:focus{border-color:${C.p500};box-shadow:0 0 0 3px ${C.p100}}
.doc-shell .dc-input:disabled{background:${C.n50};color:${C.n600};cursor:not-allowed}
.doc-shell .dc-input.has-value{border-color:${C.p300}}
.doc-shell .dc-input.invalid,.doc-shell .dc-input.invalid:hover{border-color:${C.danger.main}}
.doc-shell .dc-input.invalid:focus{box-shadow:0 0 0 3px ${C.danger.bg}}
.doc-shell textarea.dc-input{height:auto;padding:10px 12px;resize:vertical;min-height:84px}
.doc-shell .dc-input.danger-focus:focus{border-color:${C.danger.main};box-shadow:0 0 0 3px ${C.danger.bg}}
.doc-shell .dc-row{transition:background .1s}
.doc-shell .dc-row:hover{background:${C.n100}}
.doc-shell .dc-row.is-sel{background:${C.p50}}
.doc-shell .dc-row.is-sel:hover{background:${C.p100}}
.doc-shell .dc-soft-row:hover{background:${C.n50}}
.doc-shell .dc-soft-row.is-sel{background:${C.p50}}
.doc-shell .dc-soft-row.is-sel:hover{background:${C.p100}}
.doc-shell .dc-hover:hover{background:${C.n100}}
.doc-shell .dc-seg{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 10px;border-radius:5px;border:none;background:transparent;color:${C.n700};font-size:13px;line-height:16px;font-weight:500;cursor:pointer;outline:none;white-space:nowrap}
.doc-shell .dc-seg:hover:not(:disabled){background:${C.n100}}
.doc-shell .dc-seg[aria-checked="true"]{background:${C.p50};color:${C.p800};font-weight:600}
.doc-shell .dc-seg:focus-visible{box-shadow:0 0 0 2px ${C.p500}}
.doc-shell .dc-seg:disabled{cursor:not-allowed;color:${C.n600}}
.doc-shell .dc-tab{display:inline-flex;align-items:center;gap:8px;height:52px;padding:0 12px;border:none;background:transparent;color:${C.neutral.text};font-size:14px;line-height:20px;font-weight:500;cursor:pointer;outline:none;white-space:nowrap}
.doc-shell .dc-tab:hover{color:${C.p800}}
.doc-shell .dc-tab[aria-selected="true"]{color:${C.p800};font-weight:600;box-shadow:inset 0 -2px 0 ${C.p800}}
.doc-shell .dc-tab:focus-visible{box-shadow:inset 0 0 0 2px ${C.p500}}
.doc-shell .dc-opt{width:100%;display:flex;align-items:center;gap:10px;min-height:44px;padding:4px 10px;border:none;border-radius:5px;background:transparent;text-align:left;cursor:pointer;outline:none;color:${C.n900}}
.doc-shell .dc-opt:hover,.doc-shell .dc-opt.is-active{background:${C.n100}}
.doc-shell .dc-opt[aria-selected="true"]{background:${C.p50}}
.doc-shell .dc-nav{display:flex;align-items:center;gap:12px;height:44px;border-radius:7px;text-decoration:none;outline:none;position:relative;font-size:14px;line-height:20px;transition:background .12s,color .12s}
.doc-shell .dc-nav:not([aria-current="page"]){color:${C.p100};font-weight:500}
.doc-shell .dc-nav:not([aria-current="page"]):hover{background:${C.p800};color:#fff}
.doc-shell .dc-nav[aria-current="page"]{background:#fff;color:${C.p900};font-weight:600}
.doc-shell .dc-nav:focus-visible,.doc-shell .dc-side-btn:focus-visible{box-shadow:${FOCUS_DARK}}
.doc-shell .dc-side-btn{border:none;background:transparent;color:${C.p200};cursor:pointer;outline:none;border-radius:7px;display:flex;align-items:center;justify-content:center}
.doc-shell .dc-side-btn:hover{background:${C.p800};color:#fff}
.doc-shell .dc-menu-item{width:100%;display:flex;align-items:center;gap:10px;height:40px;padding:0 12px;border:none;border-radius:5px;background:transparent;color:${C.n900};font-size:13px;cursor:pointer;outline:none;text-align:left}
.doc-shell .dc-menu-item:hover,.doc-shell .dc-menu-item:focus-visible{background:${C.n100}}
.doc-shell .dc-menu-item.danger{color:${C.danger.text}}
.doc-shell .dc-menu-item.danger:hover,.doc-shell .dc-menu-item.danger:focus-visible{background:${C.danger.bg}}
.doc-shell .dc-clamp2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.doc-shell .dc-clamp3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.doc-shell .dc-ellipsis{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@keyframes dcSpin{to{transform:rotate(360deg)}}
@keyframes dcPulse{0%,100%{opacity:1}50%{opacity:.55}}
@keyframes dcBar{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}
.doc-shell .dc-spin{animation:dcSpin .9s linear infinite}
.doc-shell .dc-pulse{animation:dcPulse 1.4s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.doc-shell *{animation-duration:.01ms!important;transition:none!important}}
`;

const LABEL_CAPS = { font: `600 12px/16px ${FONT}`, letterSpacing: '0.04em', color: C.neutral.text, textTransform: 'uppercase' };
export { LABEL_CAPS };

// ── Spinner ──────────────────────────────────────────────────────────────
export function Spinner({ size = 16, color = 'currentColor', track = 'rgba(255,255,255,0.35)' }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block', flex: 'none', width: size, height: size, borderRadius: '50%',
        border: `2px solid ${track}`, borderTopColor: color, animation: 'dcSpin .8s linear infinite',
      }}
    />
  );
}

// ── Button ───────────────────────────────────────────────────────────────
// variant: primary | secondary | ghost | link | tint | danger | danger-outline |
//          dark-outline | dark-ghost | inverse
export function Button({
  variant = 'secondary', size, icon: Icon, iconSize = 16, loading, loadingLabel, children,
  className = '', offline, style, type = 'button', ...rest
}) {
  const track = ['primary', 'danger'].includes(variant) ? 'rgba(255,255,255,0.35)' : C.n300;
  return (
    <button
      type={type}
      className={`dc-btn dc-${variant} ${size === 'sm' ? 'dc-sm' : size === 'lg' ? 'dc-lg' : ''} ${loading ? 'is-busy' : ''} ${offline ? 'dc-off' : ''} ${className}`}
      aria-busy={loading || undefined}
      style={style}
      {...rest}
      disabled={rest.disabled || loading}
    >
      {loading ? <Spinner track={track} /> : Icon ? <Icon size={iconSize} strokeWidth={iconSize <= 16 ? 2 : 1.75} aria-hidden="true" /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}

// ── IconButton (har doim aria-label + tooltip) ───────────────────────────
export function IconButton({ icon: Icon, label, tone, size = 20, className = '', style, ...rest }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`dc-ib ${tone || ''} ${className}`}
      style={style}
      {...rest}
    >
      <Icon size={size} strokeWidth={size <= 16 ? 2 : 1.75} aria-hidden="true" />
    </button>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────
const BADGE_ICONS = { CircleDot, Clock, FileCheck2, Truck, CircleCheck, Undo2, CircleX, Ban };

export function StatusBadge({ variant, children, icon }) {
  const b = BADGE[variant] || BADGE.PENDING;
  const Icon = icon || BADGE_ICONS[b.icon];
  return <Badge bg={b.bg} fg={b.fg} bd={b.bd} icon={Icon}>{children}</Badge>;
}

export function Badge({ bg = C.neutral.bg, fg = C.n700, bd, icon: Icon, children, strong, style }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 8px', borderRadius: 5,
        background: bg, color: fg, border: bd ? `1px solid ${bd}` : '1px solid transparent',
        font: `${strong ? 600 : 500} 12px/16px ${FONT}`, whiteSpace: 'nowrap', flex: 'none', ...style,
      }}
    >
      {Icon && <Icon size={16} strokeWidth={2} aria-hidden="true" />}
      <span className="tnum">{children}</span>
    </span>
  );
}

export const TONE = {
  warning: { bg: C.warning.bg, fg: C.warning.text, bd: C.warning.border },
  success: { bg: C.success.bg, fg: C.success.text, bd: C.success.border },
  danger:  { bg: C.danger.bg,  fg: C.danger.text,  bd: C.danger.border },
  info:    { bg: C.info.bg,    fg: C.info.text,    bd: C.info.border },
  neutral: { bg: C.neutral.bg, fg: C.n700 },
  primary: { bg: C.p800, fg: '#fff', bd: C.p800 },
  tint:    { bg: C.p50, fg: C.p800, bd: C.p200 },
};

// Hisoblagich chip (segment, tab, nav ichida)
export function CountChip({ on, children, tone }) {
  const t = tone === 'danger'
    ? { bg: C.danger.bg, fg: C.danger.text }
    : on ? { bg: C.p800, fg: '#fff' } : { bg: C.neutral.bg, fg: C.neutral.text };
  return (
    <span
      className="tnum"
      style={{
        minWidth: 22, height: 20, padding: '0 6px', borderRadius: 5, display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', font: `600 12px/16px ${FONT}`, background: t.bg, color: t.fg,
      }}
    >
      {children}
    </span>
  );
}

// ── Checkbox (20px, tri-state) ───────────────────────────────────────────
export function Checkbox({ checked, indeterminate, onChange, label, disabled, onDark }) {
  const on = checked || indeterminate;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked ? 'true' : 'false'}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange?.(); }}
      className="dc-focus"
      style={{
        width: 20, height: 20, flex: 'none', borderRadius: 5, padding: 0, outline: 'none',
        border: `1.5px solid ${on ? C.p800 : C.n500}`, background: on ? C.p800 : '#fff', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
        boxShadow: onDark ? undefined : undefined,
      }}
    >
      {indeterminate ? <Minus size={16} strokeWidth={2.5} /> : checked ? <Check size={16} strokeWidth={2.5} /> : null}
    </button>
  );
}

// ── Inputlar ─────────────────────────────────────────────────────────────
export function SearchInput({ value, onChange, placeholder, ariaLabel, disabled, style }) {
  return (
    <span style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 240, ...style }}>
      <span style={{ position: 'absolute', left: 12, color: C.n600, display: 'flex', pointerEvents: 'none' }}>
        <Search size={16} aria-hidden="true" />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || `${placeholder} bo‘yicha qidirish`}
        disabled={disabled}
        className={`dc-input ${value ? 'has-value' : ''}`}
        style={{ paddingLeft: 36, paddingRight: 40 }}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Qidiruvni tozalash"
          title="Qidiruvni tozalash"
          className="dc-ib"
          style={{ position: 'absolute', right: 4, width: 32, height: 32, borderRadius: 5, color: C.n600 }}
        >
          <X size={16} />
        </button>
      )}
    </span>
  );
}

export function Field({ label, required, optional, htmlFor, children, error, hint, hintId, errorId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      {label && (
        <label htmlFor={htmlFor} style={{ font: `500 13px/18px ${FONT}`, color: C.n900 }}>
          {label}
          {required && <span style={{ color: C.danger.text }}> *</span>}
          {optional && <span style={{ color: C.n600, fontWeight: 400 }}> · ixtiyoriy</span>}
        </label>
      )}
      {children}
      {error ? (
        <span id={errorId} role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 12px/16px ${FONT}`, color: C.danger.text }}>
          <CircleAlert size={16} aria-hidden="true" /> {error}
        </span>
      ) : hint ? (
        <span id={hintId} style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{hint}</span>
      ) : null}
    </div>
  );
}

// ── Segmented control ────────────────────────────────────────────────────
export function Segmented({ label, options, value, onChange, disabled }) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={{ display: 'flex', alignItems: 'center', gap: 2, height: 40, padding: 3, border: `1px solid ${C.n300}`, borderRadius: 7, background: disabled ? C.n50 : '#fff', flex: '0 1 auto', maxWidth: '100%', overflowX: 'auto', scrollbarWidth: 'none' }}
    >
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on ? 'true' : 'false'} className="dc-seg" disabled={disabled} onClick={() => onChange(o.value)}>
            {o.label}
            {o.count !== undefined && <CountChip on={on}>{o.count}</CountChip>}
          </button>
        );
      })}
    </div>
  );
}

// ── Sahifa sarlavhasi ────────────────────────────────────────────────────
export function PageHeader({ title, description, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: '1 1 320px' }}>
        <h1 style={{ margin: 0, font: `600 24px/32px ${FONT}`, color: C.n900 }}>{title}</h1>
        {description && <p style={{ margin: 0, font: `400 13px/20px ${FONT}`, color: C.n600 }}>{description}</p>}
      </div>
      {children && <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 'none', flexWrap: 'wrap' }}>{children}</div>}
    </div>
  );
}

// "Yangilangan HH:mm:ss" + Yangilash tugmasi
export function RefreshControl({ label, onRefresh, fetching, offline, title }) {
  const [spin, setSpin] = useState(false);
  useEffect(() => {
    if (!spin) return undefined;
    const t = setTimeout(() => setSpin(false), 900);
    return () => clearTimeout(t);
  }, [spin]);
  const busy = fetching || spin;
  return (
    <>
      <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }} aria-live="polite">{label}</span>
      <button
        type="button"
        className="dc-btn dc-secondary dc-off"
        style={{ padding: '0 14px' }}
        onClick={() => { setSpin(true); onRefresh(); }}
        disabled={offline}
        title={title}
      >
        <RefreshCw size={16} aria-hidden="true" className={busy ? 'dc-spin' : ''} />
        {busy ? 'Yangilanmoqda…' : 'Yangilash'}
      </button>
    </>
  );
}

// ── Sahifa tanasi + pastga yopishgan tanlov paneli ───────────────────────
export function Page({ children, bar, gap = 16 }) {
  const ctx = useOutletContext() || {};
  const pad = ctx.pad ?? 32;
  return (
    <>
      <div style={{ flex: 1, padding: `24px ${pad}px ${pad}px`, display: 'flex', flexDirection: 'column', gap, minWidth: 0 }}>
        {children}
      </div>
      {bar && (
        <div style={{ position: 'sticky', bottom: 0, zIndex: 20, flex: 'none' }}>
          {bar}
        </div>
      )}
    </>
  );
}

export function usePagePad() {
  const ctx = useOutletContext() || {};
  return { pad: ctx.pad ?? 32, vw: ctx.vw ?? 1440 };
}

// Qora tanlov paneli (Design System §18) — Page `bar` sifatida beriladi
export function SelectionBar({ title, meta, onClear, children }) {
  const { pad } = usePagePad();
  return (
    <div role="region" aria-label="Tanlangan buyurtmalar amallari" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: `12px ${pad}px`, background: C.p900, color: '#fff', boxShadow: '0 -4px 16px rgba(13,30,38,0.12)', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span className="tnum" aria-live="polite" style={{ font: `600 14px/20px ${FONT}` }}>{title}</span>
        {meta && <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.p200 }}>{meta}</span>}
      </div>
      <button type="button" className="dc-btn dc-dark-ghost" onClick={onClear} style={{ height: 36, padding: '0 10px' }}>
        <X size={16} aria-hidden="true" /> Tanlovni tozalash
      </button>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
}

// ── Karta ────────────────────────────────────────────────────────────────
export function Card({ children, style, as: Tag = 'div', ...rest }) {
  return (
    <Tag style={{ background: '#fff', border: `1px solid ${C.n200}`, borderRadius: 10, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

// Yuqoridagi yupqa "yangilanmoqda" chizig'i
export function RefreshBar({ show }) {
  if (!show) return null;
  return (
    <div aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: C.p50, overflow: 'hidden', zIndex: 2 }}>
      <div style={{ width: '40%', height: '100%', background: C.p500, animation: 'dcBar 1.1s ease-in-out infinite' }} />
    </div>
  );
}

// ── Bo'sh / xato / qidiruv-bo'sh holatlari ───────────────────────────────
export function BlankState({ icon: Icon = Inbox, tone = 'brand', title, text, action, role, minHeight = 320, bare }) {
  const tones = {
    brand:   [C.p50, C.p800],
    neutral: [C.n100, C.n600],
    danger:  [C.danger.bg, C.danger.main],
    warning: [C.warning.bg, C.warning.main],
  };
  const [bg, fg] = tones[tone] || tones.brand;
  const inner = (
    <div role={role} style={{ flex: 1, minHeight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 10, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
      </div>
      <span style={{ font: `600 16px/24px ${FONT}`, color: C.n900 }}>{title}</span>
      {text && <span style={{ font: `400 13px/20px ${FONT}`, color: C.n600, maxWidth: 440, textWrap: 'pretty' }}>{text}</span>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
  if (bare) return inner;
  return <Card style={{ display: 'flex' }}>{inner}</Card>;
}

export function ErrorState({ title = 'Ma’lumotni yuklab bo‘lmadi', text = 'Server javob bermadi. Ma’lumotlar o‘zgartirilmadi.', onRetry, bare, minHeight }) {
  return (
    <BlankState
      icon={CircleAlert}
      tone="danger"
      role="alert"
      title={title}
      text={text}
      bare={bare}
      minHeight={minHeight}
      action={onRetry && <Button variant="primary" icon={RefreshCw} onClick={onRetry}>Qayta urinish</Button>}
    />
  );
}

export function SearchEmpty({ text, onClear, clearLabel = 'Qidiruvni tozalash', clearIcon = X, bare, minHeight }) {
  return (
    <BlankState
      icon={SearchX}
      tone="neutral"
      role="status"
      title="Hech narsa topilmadi"
      text={text}
      bare={bare}
      minHeight={minHeight}
      action={onClear && <Button variant="secondary" icon={clearIcon} onClick={onClear}>{clearLabel}</Button>}
    />
  );
}

export function OfflineBanner({ at, text }) {
  return (
    <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.warning.bg, border: `1px solid ${C.warning.border}`, borderRadius: 10, padding: '10px 16px', font: `400 13px/20px ${FONT}`, color: C.warning.text }}>
      <WifiOff size={20} aria-hidden="true" style={{ flex: 'none' }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <b style={{ fontWeight: 600 }}>Internet aloqasi yo‘q.</b>{' '}
        {text || `Ro‘yxat ${at || 'oxirgi yuklangan'} holatida ko‘rsatilmoqda. Aloqa tiklanguncha amallar o‘chirilgan.`}
      </span>
    </div>
  );
}

// Inline xabar (qator yoki modal ichida)
export function InlineAlert({ tone = 'danger', title, children, icon, style }) {
  const t = tone === 'warning' ? C.warning : tone === 'info' ? C.info : tone === 'success' ? C.success : C.danger;
  const Icon = icon || (tone === 'warning' ? TriangleAlert : tone === 'info' ? Info : tone === 'success' ? CircleCheck : CircleAlert);
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 7, background: t.bg, border: `1px solid ${t.border}`, color: t.text, font: `400 13px/20px ${FONT}`, ...style }}>
      <Icon size={16} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} />
      <span style={{ minWidth: 0 }}>{title && <b style={{ fontWeight: 600 }}>{title} </b>}{children}</span>
    </div>
  );
}

export function Skel({ w = '100%', h = 12, r = 4, bg = C.n200, style }) {
  return <span aria-hidden="true" style={{ display: 'block', width: w, height: h, borderRadius: r, background: bg, ...style }} />;
}

// ── Sahifalash ───────────────────────────────────────────────────────────
function pageItems(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const arr = [...set].sort((a, b) => a - b);
  const out = [];
  arr.forEach((n, i) => { if (i && n - arr[i - 1] > 1) out.push('…' + n); out.push(n); });
  return out;
}

export function Pagination({ page, pages, size, total, onPage, onSize, disabled }) {
  const from = total ? (page - 1) * size + 1 : 0;
  const to = Math.min(page * size, total);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', borderTop: `1px solid ${C.n200}`, flexWrap: 'wrap' }}>
      <span className="tnum" style={{ font: `400 13px/18px ${FONT}`, color: C.n600 }}>{from}–{to} / {total} ta</span>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, font: `400 13px/18px ${FONT}`, color: C.n600 }}>
        Sahifada
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            aria-label="Sahifadagi qatorlar"
            value={size}
            disabled={disabled}
            onChange={(e) => onSize(Number(e.target.value))}
            className="dc-input"
            style={{ appearance: 'none', height: 36, width: 'auto', padding: '0 30px 0 10px', fontSize: 13 }}
          >
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <ChevronDown size={16} aria-hidden="true" style={{ position: 'absolute', right: 8, pointerEvents: 'none', color: C.n600 }} />
        </span>
      </label>
      <nav aria-label="Sahifalash" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
        <IconButton icon={ChevronLeft} size={16} label="Oldingi sahifa" disabled={disabled || page <= 1} onClick={() => onPage(page - 1)} style={{ border: `1px solid ${C.n300}`, background: '#fff' }} />
        {pageItems(page, pages).map((p) => typeof p === 'string' ? (
          <span key={p} style={{ minWidth: 24, textAlign: 'center', color: C.n600 }}>…</span>
        ) : (
          <button
            key={p}
            type="button"
            aria-label={`${p}-sahifa`}
            aria-current={p === page ? 'page' : undefined}
            disabled={disabled}
            onClick={() => onPage(p)}
            className="dc-focus tnum"
            style={{
              minWidth: 36, height: 36, padding: '0 8px', borderRadius: 7, cursor: 'pointer', outline: 'none',
              border: `1px solid ${p === page ? C.p800 : C.n300}`, background: p === page ? C.p800 : '#fff',
              color: p === page ? '#fff' : C.n900, font: `${p === page ? 600 : 500} 13px/16px ${FONT}`,
            }}
          >
            {p}
          </button>
        ))}
        <IconButton icon={ChevronRight} size={16} label="Keyingi sahifa" disabled={disabled || page >= pages} onClick={() => onPage(page + 1)} style={{ border: `1px solid ${C.n300}`, background: '#fff' }} />
      </nav>
    </div>
  );
}

// ── Modal (fokus tuzog'i, Esc, fokusni qaytarish) ────────────────────────
const FOCUSABLE = 'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
  onClose, busy, width = 560, role = 'dialog', labelledBy, describedBy, initialFocus, children, style,
}) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const busyRef = useRef(busy);
  busyRef.current = busy;

  useEffect(() => {
    const prev = document.activeElement;
    const node = ref.current;
    const first = (initialFocus && node?.querySelector(initialFocus)) || node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE);
    first?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // Ochiq ichki ro'yxat (Picker) Esc'ni o'zi yopadi — modal yopilmaydi
        if (e.target?.closest?.('[data-esc-local]')) return;
        if (!busyRef.current) { e.stopPropagation(); closeRef.current?.(); }
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const els = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!els.length) return;
      const a = els[0];
      const z = els[els.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      if (prev && typeof prev.focus === 'function') prev.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="doc-shell"
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(13,30,38,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose?.(); }}
    >
      <div
        ref={ref}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-busy={busy || undefined}
        style={{
          width, maxWidth: '100%', maxHeight: '100%', background: '#fff', borderRadius: 12,
          boxShadow: '0 24px 64px rgba(13,30,38,0.24)', display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Modal sarlavhasi: ikon plitka + sarlavha + izoh + yopish
export function ModalHeader({ id, icon: Icon, tone = 'brand', title, subtitle, onClose, busy, border = true }) {
  const tones = {
    brand: [C.p50, C.p800], warning: [C.warning.bg, C.warning.main], danger: [C.danger.bg, C.danger.main],
  };
  const [bg, fg] = tones[tone] || tones.brand;
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '20px 24px', borderBottom: border ? `1px solid ${C.n200}` : 'none', flex: 'none' }}>
      {Icon && (
        <div style={{ width: 40, height: 40, flex: 'none', borderRadius: 10, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
        <h2 id={id} style={{ margin: 0, font: `600 18px/26px ${FONT}`, color: C.n900 }}>{title}</h2>
        {subtitle && <div style={{ font: `400 13px/18px ${FONT}`, color: C.n600, minWidth: 0 }}>{subtitle}</div>}
      </div>
      {onClose && <IconButton icon={X} label="Yopish" onClick={onClose} disabled={busy} />}
    </div>
  );
}

export function ModalFooter({ hint, hintIcon: HintIcon = Info, hintTone, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 24px', borderTop: `1px solid ${C.n200}`, background: C.n50, flex: 'none', flexWrap: 'wrap' }}>
      {hint && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 200px', font: `400 12px/16px ${FONT}`, color: hintTone === 'danger' ? C.danger.text : C.n600 }}>
          <HintIcon size={16} aria-hidden="true" style={{ flex: 'none' }} /> {hint}
        </span>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>{children}</div>
    </div>
  );
}

// Inv · org sub-sarlavha
export function OrderRef({ order }) {
  return (
    <span className="dc-ellipsis" style={{ display: 'block' }}>
      <b className="tnum" style={{ fontWeight: 600, color: C.p800 }}>{order?.invoiceNumber}</b>
      {order?.client?.orgName ? ` · ${order.client.orgName}` : ''}
    </span>
  );
}

// ── Tasdiqlash dialogi (ixtiyoriy/majburiy sabab maydoni bilan) ──────────
export function ConfirmDialog({
  icon, tone = 'brand', title, text, summary, note, confirmLabel, confirmIcon, busyLabel = 'Bajarilmoqda…',
  danger, busy, error, onConfirm, onClose, reason, width = 480, children,
}) {
  const uid = useId();
  const [value, setValue] = useState(reason?.initial || '');
  const [tried, setTried] = useState(false);
  const invalid = reason?.required && !value.trim();
  const submit = () => {
    setTried(true);
    if (invalid) return;
    onConfirm(value.trim());
  };
  return (
    <Modal
      onClose={onClose}
      busy={busy}
      role="alertdialog"
      width={width}
      labelledBy={`${uid}-t`}
      describedBy={`${uid}-d`}
      initialFocus={reason ? 'textarea' : danger ? '[data-cancel]' : '[data-confirm]'}
    >
      <ModalHeader id={`${uid}-t`} icon={icon} tone={tone} title={title} border={false} />
      <div style={{ padding: '0 24px 0 80px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
        <p id={`${uid}-d`} style={{ margin: 0, font: `400 14px/22px ${FONT}`, color: C.n700, textWrap: 'pretty' }}>{text}</p>
        {error && <InlineAlert tone="danger">{error}</InlineAlert>}
        {summary && (
          <div style={{ padding: 12, borderRadius: 7, background: C.n50, border: `1px solid ${C.n200}`, display: 'flex', flexDirection: 'column', gap: 6, font: `400 13px/18px ${FONT}` }}>
            {summary.map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: C.n600 }}>{k}</span>
                <b className="tnum" style={{ fontWeight: 600, color: C.n900, textAlign: 'right', minWidth: 0 }}>{v}</b>
              </div>
            ))}
          </div>
        )}
        {children}
        {reason && (
          <Field
            label={reason.label}
            required={reason.required}
            optional={!reason.required}
            htmlFor={`${uid}-r`}
            error={tried && invalid ? reason.error || 'Sababni kiriting.' : null}
            hint={reason.hint}
          >
            <textarea
              id={`${uid}-r`}
              rows={3}
              value={value}
              maxLength={500}
              disabled={busy}
              onChange={(e) => setValue(e.target.value)}
              placeholder={reason.placeholder}
              aria-required={reason.required || undefined}
              aria-invalid={tried && invalid ? 'true' : undefined}
              className={`dc-input ${danger ? 'danger-focus' : ''} ${tried && invalid ? 'invalid' : ''}`}
              style={{ minHeight: 88 }}
            />
          </Field>
        )}
        {note && <p style={{ margin: 0, font: `400 12px/18px ${FONT}`, color: C.n600 }}>{note}</p>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '20px 24px 24px' }}>
        <Button variant="secondary" onClick={onClose} disabled={busy} data-cancel="">Yopish</Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          icon={confirmIcon}
          loading={busy}
          loadingLabel={busyLabel}
          onClick={submit}
          data-confirm=""
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

// ── Toast (pastki o'ng, 380–400px, ikon + sarlavha + izoh) ───────────────
const TOAST_TONE = {
  success: [CircleCheck, C.success.main],
  warning: [TriangleAlert, C.warning.main],
  danger:  [CircleAlert, C.danger.main],
  info:    [Info, C.info.main],
};

export function notify({ tone = 'success', title, desc, icon, color }) {
  const [DefIcon, defColor] = TOAST_TONE[tone] || TOAST_TONE.success;
  const Icon = icon || DefIcon;
  return toast.custom((t) => (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      style={{
        width: 380, maxWidth: 'calc(100vw - 32px)', display: 'flex', gap: 12, alignItems: 'flex-start', background: '#fff',
        border: `1px solid ${C.n200}`, borderRadius: 10, padding: '14px 12px 14px 16px', boxShadow: '0 12px 32px rgba(29,41,51,0.12), 0 2px 6px rgba(29,41,51,0.06)',
        fontFamily: FONT, opacity: t.visible ? 1 : 0, transition: 'opacity .2s',
      }}
    >
      <span style={{ display: 'flex', color: color || defColor, paddingTop: 2, flex: 'none' }}><Icon size={20} aria-hidden="true" /></span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ font: `600 14px/20px ${FONT}`, color: C.n900 }}>{title}</span>
        {desc && <span style={{ font: `400 13px/20px ${FONT}`, color: C.n700, textWrap: 'pretty', overflowWrap: 'anywhere' }}>{desc}</span>}
      </div>
      <button
        type="button"
        aria-label="Yopish"
        title="Yopish"
        onClick={() => toast.dismiss(t.id)}
        style={{ width: 32, height: 32, flex: 'none', borderRadius: 7, border: 'none', background: 'transparent', color: C.n600, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        <X size={16} />
      </button>
    </div>
  ), { position: 'bottom-right', duration: tone === 'danger' ? 10000 : 5000 });
}
