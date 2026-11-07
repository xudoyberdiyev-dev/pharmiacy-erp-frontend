import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CheckCircle2, CircleAlert, Loader2, RefreshCw, X } from 'lucide-react';
import { CHIP_TONES, FONT_MONO, avatarTone } from './tokens';
import { initials } from '../lib/format';

// ── Global CSS (faqat Picker paneli ochilganda bir marta qo'shiladi) ─────────
let stylesInjected = false;
export function ensurePickerStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  if (document.getElementById('picker-panel-styles')) { stylesInjected = true; return; }
  const el = document.createElement('style');
  el.id = 'picker-panel-styles';
  el.textContent = `
    @keyframes pkFade { from { opacity: 0 } to { opacity: 1 } }
    @keyframes pkSheetUp { from { transform: translateY(32px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
    @keyframes pkPop { from { transform: translateY(10px) scale(.98); opacity: 0 } to { transform: translateY(0) scale(1); opacity: 1 } }
    @keyframes pkToast { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
    .pk-root { font-family: Inter, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .pk-root button, .pk-root input, .pk-root textarea { font-family: inherit; }
    .pk-nums { font-variant-numeric: tabular-nums; }
    .pk-scroll-x { scrollbar-width: none; }
    .pk-scroll-x::-webkit-scrollbar { display: none; }
    @media (prefers-reduced-motion: reduce) { .pk-root * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
  `;
  document.head.appendChild(el);
  stylesInjected = true;
}

export const cx = (...a) => a.filter(Boolean).join(' ');

export function Mono({ children, className = '', ...rest }) {
  return <span className={className} style={{ fontFamily: FONT_MONO }} {...rest}>{children}</span>;
}

// ── Chip ────────────────────────────────────────────────────────────────────
export function Chip({ tone = 'slate', icon: Icon, children, className = '' }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[12px] font-bold leading-tight whitespace-nowrap', CHIP_TONES[tone] || CHIP_TONES.slate, className)}>
      {Icon && <Icon size={12} strokeWidth={2.4} aria-hidden="true" />}
      {children}
    </span>
  );
}

// ── Tugma ───────────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary:    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-[0_4px_12px_rgba(37,99,235,0.28)]',
  secondary:  'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50 active:bg-slate-100',
  danger:     'bg-red-700 text-white hover:bg-red-800 active:bg-red-900',
  dangerSoft: 'bg-red-50 text-red-700 border border-red-300 hover:bg-red-100 active:bg-red-200',
  success:    'bg-green-700 text-white hover:bg-green-800 active:bg-green-900',
  excel:      'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100',
  dark:       'bg-slate-700 text-white hover:bg-slate-600',
};
const BTN_SIZES = {
  sm: 'h-10 px-4 text-[14px] rounded-xl',
  md: 'h-12 px-5 text-[15px] rounded-xl',
  lg: 'h-[52px] px-5 text-[16px] rounded-2xl',
};
export function Btn({ variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, loading = false, disabled, className = '', children, ...rest }) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cx(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors select-none',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:bg-slate-200 disabled:text-slate-500 disabled:border-transparent disabled:shadow-none disabled:cursor-not-allowed',
        BTN_VARIANTS[variant], BTN_SIZES[size], className,
      )}
      {...rest}
    >
      {loading ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : Icon && <Icon size={18} strokeWidth={2.2} aria-hidden="true" />}
      {children}
      {IconRight && !loading && <IconRight size={18} strokeWidth={2.4} aria-hidden="true" />}
    </button>
  );
}

// Faqat ikonli kvadrat tugma (Excel, yangilash, orqaga...)
export function IconBtn({ label, icon: Icon, tone = 'white', size = 48, className = '', ...rest }) {
  const tones = {
    white: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    green: 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    plain: 'bg-transparent text-slate-800 hover:bg-slate-100',
    slate: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
  };
  return (
    <button
      type="button" aria-label={label} title={label}
      className={cx('inline-flex items-center justify-center rounded-xl shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500', tones[tone], className)}
      style={{ width: size, height: size }}
      {...rest}
    >
      <Icon size={size >= 44 ? 22 : 18} strokeWidth={2} aria-hidden="true" />
    </button>
  );
}

// Rangli kvadrat ichida ikon (diqqat kartalari, jarima kartasi...)
const ICONBOX_TONES = {
  amber: 'bg-amber-200/70 text-amber-800',
  red: 'bg-red-100 text-red-700',
  green: 'bg-green-100 text-green-700',
  teal: 'bg-teal-100 text-teal-700',
  blue: 'bg-blue-100 text-blue-700',
};
export function IconBox({ icon: Icon, tone = 'amber', size = 40, className = '' }) {
  return (
    <span className={cx('inline-flex items-center justify-center rounded-xl shrink-0', ICONBOX_TONES[tone], className)} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.5)} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

export function Avatar({ name, size = 40, className = '' }) {
  return (
    <span
      className={cx('inline-flex items-center justify-center rounded-xl border font-bold shrink-0', avatarTone(name), className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

// ── Bo'lim sarlavhasi ───────────────────────────────────────────────────────
export function SectionLabel({ children, count, right, className = '' }) {
  return (
    <div className={cx('flex items-center justify-between gap-2 px-1', className)}>
      <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-500">
        {children}
        {count !== undefined && count !== null && (
          <span className="rounded-full bg-red-100 px-2 py-[1px] text-[12px] font-bold tracking-normal text-red-700">{count}</span>
        )}
      </h2>
      {right}
    </div>
  );
}

// ── Progress ────────────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, tone = 'teal', height = 8, label, className = '' }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 100)));
  const fill = tone === 'gradient' ? 'bg-gradient-to-r from-teal-500 to-blue-600'
    : tone === 'amber' ? 'bg-gradient-to-r from-amber-400 to-orange-500'
    : tone === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600'
    : 'bg-teal-700';
  return (
    <div
      role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}
      className={cx('w-full overflow-hidden rounded-full bg-slate-200', className)} style={{ height }}
    >
      <div className={cx('h-full rounded-full transition-[width] duration-500', fill)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Segmented (Hammasi / Qolgan / Terilgan) ─────────────────────────────────
export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="tablist" aria-label={label} className="grid rounded-2xl bg-slate-100 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value} type="button" role="tab" aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'h-10 rounded-xl text-[14px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {o.label} <span className="pk-nums">{o.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Checkbox ────────────────────────────────────────────────────────────────
export function Checkbox({ checked, onChange, label, disabled, size = 24 }) {
  return (
    <button
      type="button" role="checkbox" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-md border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2',
        checked ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-400 bg-white hover:border-slate-500',
        disabled && 'cursor-not-allowed opacity-60',
      )}
      style={{ width: size, height: size }}
    >
      {checked && <Check size={Math.round(size * 0.7)} strokeWidth={3.2} aria-hidden="true" />}
    </button>
  );
}

export function Radio({ checked, tone = 'red' }) {
  const ring = checked ? (tone === 'red' ? 'border-red-700' : 'border-blue-600') : 'border-slate-400';
  const dot = tone === 'red' ? 'bg-red-700' : 'bg-blue-600';
  return (
    <span className={cx('inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 bg-white', ring)} aria-hidden="true">
      {checked && <span className={cx('h-3 w-3 rounded-full', dot)} />}
    </span>
  );
}

// ── Skeleton / holatlar ─────────────────────────────────────────────────────
export function Skeleton({ className = '' }) {
  return <div className={cx('animate-pulse rounded-2xl bg-slate-200/70', className)} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon, title, text, action, className = '' }) {
  return (
    <div className={cx('flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center', className)}>
      {Icon && <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><Icon size={24} aria-hidden="true" /></span>}
      <p className="text-[16px] font-semibold text-slate-800">{title}</p>
      {text && <p className="mt-1 max-w-[320px] text-[14px] text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ onRetry, text = "Ma'lumotlarni yuklab bo'lmadi", className = '' }) {
  return (
    <div role="alert" className={cx('flex flex-col items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center', className)}>
      <CircleAlert size={26} className="mb-2 text-red-600" aria-hidden="true" />
      <p className="text-[15px] font-semibold text-red-800">{text}</p>
      <p className="mt-1 text-[13px] text-red-700/80">Internetni tekshirib, qayta urinib ko'ring.</p>
      {onRetry && <Btn variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry} className="mt-4">Qayta urinish</Btn>}
    </div>
  );
}

// ── Sheet (mobil: pastdan chiqadigan varaq, desktop: markaziy oyna) ───────────
export function Sheet({ open, onClose, title, subtitle, children, footer, labelledBy = 'pk-sheet-title' }) {
  const panelRef = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    ensurePickerStyles();
    lastFocus.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      // fokus dialogdan chiqib ketmasin (Tab / Shift+Tab aylanadi)
      const list = [...panelRef.current.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled])')]
        .filter((el) => el.offsetParent !== null);
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0];
      const last = list[list.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="pk-root fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 bg-slate-900/50" style={{ animation: 'pkFade .18s ease-out' }} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={labelledBy}
        className="relative flex max-h-[92vh] w-full flex-col rounded-t-[28px] bg-white shadow-2xl outline-none sm:max-w-[480px] sm:rounded-3xl"
        style={{ animation: 'pkSheetUp .22s ease-out' }}
      >
        <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-slate-300 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            <h2 id={labelledBy} className="text-[22px] font-bold leading-tight text-slate-900">{title}</h2>
            {subtitle && <p className="mt-1 text-[14px] leading-snug text-slate-600">{subtitle}</p>}
          </div>
          {onClose && <IconBtn label="Yopish" icon={X} tone="slate" size={44} onClick={onClose} />}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 sm:px-6">{children}</div>
        {footer && <div className="px-5 pb-6 pt-3 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ── Toast (qora, pastda; "Bekor · 5" bilan) ─────────────────────────────────
const ToastCtx = createContext(null);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children, bottomClass = 'bottom-[88px] lg:bottom-6' }) {
  const [toast, setToast] = useState(null);
  const [left, setLeft] = useState(0);
  const timer = useRef(null);
  const tick = useRef(null);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current); clearInterval(tick.current);
    setToast(null);
  }, []);

  const show = useCallback((t) => {
    clearTimeout(timer.current); clearInterval(tick.current);
    const seconds = t.seconds ?? 4;
    setToast({ id: Date.now() + Math.random(), tone: 'ok', ...t });
    setLeft(seconds);
    tick.current = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    timer.current = setTimeout(() => { clearInterval(tick.current); setToast(null); }, seconds * 1000);
  }, []);

  useEffect(() => () => { clearTimeout(timer.current); clearInterval(tick.current); }, []);

  const api = useMemo(() => ({
    show,
    dismiss,
    success: (text, opts) => show({ text, tone: 'ok', ...opts }),
    error: (text, opts) => show({ text, tone: 'error', seconds: 5, ...opts }),
    undo: ({ text, onUndo, seconds = 5, label = 'Bekor' }) => show({ text, tone: 'ok', seconds, action: { label, onClick: onUndo } }),
  }), [show, dismiss]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {toast && createPortal(
        <div className={cx('pk-root pointer-events-none fixed inset-x-0 z-[90] flex justify-center px-3', bottomClass)}>
          <div
            key={toast.id} role="status" aria-live="polite"
            className="pointer-events-auto flex w-full max-w-[440px] items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-[0_12px_32px_rgba(15,23,42,0.35)]"
            style={{ animation: 'pkToast .2s ease-out' }}
          >
            {toast.tone === 'error'
              ? <CircleAlert size={22} className="shrink-0 text-red-400" aria-hidden="true" />
              : <CheckCircle2 size={22} className="shrink-0 text-teal-300" aria-hidden="true" />}
            <div className="min-w-0 flex-1 text-[13.5px] leading-snug">{toast.text}</div>
            {toast.action && (
              <button
                type="button"
                onClick={() => { const fn = toast.action.onClick; dismiss(); fn?.(); }}
                className="shrink-0 rounded-xl bg-slate-700 px-3.5 py-2.5 text-[14px] font-bold text-white hover:bg-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {toast.action.label}{toast.seconds && left > 0 ? <span className="pk-nums"> · {left}</span> : null}
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}
