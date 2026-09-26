import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw, Loader2, Eye, Pencil, XCircle, Lock, MoreHorizontal, X } from 'lucide-react';
import { COLOR, statusConfig } from './tokens';
import { inTransitLabel } from '../../../lib/orderStatusLabel';

// ─────────────────────────────────────────────────────────────────────────
// Small, reusable pieces shared across Operator's redesigned pages only.
// Mirrors the design canvas's component inventory (StatusBadge, EmptyState,
// ErrorState, LoadingSkeleton, ...) closely enough to keep every page
// visually identical without re-deriving the same markup five times.
// ─────────────────────────────────────────────────────────────────────────

// Keyboard-focus treatment from the design canvas (3px indigo ring). Kept
// as full literal class strings so Tailwind's scanner picks them up.
export const focusRing = 'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(79,70,229,0.28)]';
export const rowFocus = 'focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_3px_rgba(79,70,229,0.28)]';

// ── Status badge — single source of truth for how a status renders ───────
// IN_TRANSIT keeps the existing inTransitLabel() sub-states (Yuklanmoqda /
// Safarga tayyorlanmoqda / Yo'lda) when a concrete order is passed — real
// operational detail the design canvas's flat "Yo'lda" token doesn't carry
// per-order, and dropping it would be a functional regression, not just a
// visual one. Aggregate contexts (distribution legend, filters) that have
// no single order fall back to the plain status label.
export function StatusBadge({ status, order, large = false }) {
  const c = statusConfig(status);
  const label = status === 'IN_TRANSIT' && order ? inTransitLabel(order) : c.label;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold whitespace-nowrap ${large ? 'px-3 py-1.5 text-[13px]' : 'px-2.5 py-[3px] text-xs'}`}
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      {label}
    </span>
  );
}

// ── Shimmering skeleton block ─────────────────────────────────────────────
export function Skel({ w, h = 12, className = '' }) {
  return (
    <div
      className={`rounded animate-pulse ${className}`}
      style={{ width: w, height: h, background: COLOR.mutedSurface }}
    />
  );
}

export function Spinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin" style={{ color: COLOR.primary }} />;
}

// ── Empty state — dashed border, icon, title, description, optional action ─
export function EmptyState({ icon: Icon, title, description, action, tone = 'neutral' }) {
  const good = tone === 'good';
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-2.5 text-center py-10 px-6 rounded-[10px]"
      style={{
        border: `1px dashed ${good ? COLOR.successBorder : COLOR.borderStrong}`,
        background: good ? COLOR.successSoft : COLOR.surface,
        minHeight: 180,
      }}
    >
      {Icon && <Icon size={24} style={{ color: good ? COLOR.success : COLOR.textMuted }} />}
      <div>
        <p className="text-sm font-semibold" style={{ color: good ? COLOR.textPrimary : COLOR.textSecondary }}>{title}</p>
        {description && <p className="text-[13px] mt-1" style={{ color: good ? COLOR.textSecondary : COLOR.textMuted }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Error state — retry affordance, never replaces the shell ─────────────
export function ErrorState({ title = "Ma'lumotlarni yuklashda xatolik yuz berdi.", description, onRetry }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-10 px-6"
      style={{ minHeight: 180 }}
    >
      <AlertTriangle size={24} style={{ color: COLOR.danger }} />
      <div>
        <p className="text-sm font-semibold" style={{ color: COLOR.textPrimary }}>{title}</p>
        {description && <p className="text-[13px] mt-1" style={{ color: COLOR.textTertiary }}>{description}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-semibold transition-colors"
          style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}
        >
          <RefreshCw size={14} /> Qayta urinish
        </button>
      )}
    </div>
  );
}

// ── Secondary "outline" button (table header actions, etc.) ──────────────
export function SecondaryButton({ children, onClick, icon: Icon, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors shrink-0 ${focusRing} ${className}`}
      style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}
      onMouseEnter={e => { e.currentTarget.style.background = COLOR.subtleSurface; }}
      onMouseLeave={e => { e.currentTarget.style.background = COLOR.surface; }}
    >
      {children}{Icon && <Icon size={16} />}
    </button>
  );
}

// ── Section card shell (white panel, header row + body) ──────────────────
export function Panel({ children, className = '' }) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
      {children}
    </div>
  );
}

export function PanelHeader({ title, description, action, icon: Icon, iconColor }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-5" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={18} style={{ color: iconColor || COLOR.textTertiary }} />}
          <span className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>{title}</span>
        </div>
        {description && <p className="text-[13px]" style={{ color: COLOR.textTertiary }}>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export const th = { textAlign: 'left', padding: '10px 24px', borderBottom: `1px solid ${COLOR.border}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: COLOR.textTertiary, whiteSpace: 'nowrap' };
export const thRight = { ...th, textAlign: 'right' };
export const td = { padding: '12px 24px', borderBottom: `1px solid ${COLOR.borderSubtle}`, fontSize: 13 };
export const tdRight = { ...td, textAlign: 'right' };

// ── Row action menu ────────────────────────────────────────────────────
export function RowMenu({ order, isMe, onEdit, onCancel }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  const btnRef = useRef(null);

  // The menu is position:fixed (measured from the trigger) rather than
  // absolute: tables sit in an overflow-x-auto container, which would clip
  // or scroll an absolutely-positioned menu opened from the last rows.
  const toggle = () => {
    if (open) return setOpen(false);
    const r = btnRef.current.getBoundingClientRect();
    const MENU_H = 200, MENU_W = 256;
    const below = window.innerHeight - r.bottom;
    setPos({
      top: below < MENU_H && r.top > MENU_H ? r.top - 6 - MENU_H : r.bottom + 6,
      left: Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8)),
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', h);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const isNew = order.status === 'NEW';
  const terminal = ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status);

  return (
    <div className="relative" ref={ref}>
      <button
        ref={btnRef}
        aria-label="Qo'shimcha amallar" title="Qo'shimcha amallar" aria-haspopup="menu" aria-expanded={open}
        onClick={toggle}
        className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${focusRing}`}
        style={{ border: `1px solid ${COLOR.border}`, color: COLOR.textSecondary }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className="fixed w-64 rounded-[10px] p-2 z-50"
          style={{ top: pos?.top, left: pos?.left, background: COLOR.surface, border: `1px solid ${COLOR.border}`, boxShadow: COLOR.shadowDropdown }}
        >
          <div className="px-2.5 pt-1 pb-1.5 text-[11px] font-semibold tracking-wide" style={{ color: COLOR.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
            #{order.invoiceNumber}
          </div>
          <button
            onClick={() => { setOpen(false); onEdit(order); }}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px]"
            style={{ color: COLOR.textPrimary, background: COLOR.mutedSurface }}
          >
            <Eye size={16} /> Ko'rish
          </button>

          {isNew && isMe && (
            <>
              <button onClick={() => { setOpen(false); onEdit(order); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px]" style={{ color: '#334155' }}>
                <Pencil size={16} /> Tahrirlash
              </button>
              <div className="h-px my-1" style={{ background: COLOR.borderSubtle }} />
              <button onClick={() => { setOpen(false); onCancel(order); }} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px]" style={{ color: COLOR.danger }}>
                <XCircle size={16} /> Bekor qilish
              </button>
            </>
          )}
          {isNew && !isMe && (
            <>
              <div className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px]" style={{ color: COLOR.textDisabled }}>
                <Pencil size={16} /> Tahrirlash <Lock size={14} className="ml-auto" />
              </div>
              <p className="px-2.5 pb-1 text-xs" style={{ color: COLOR.textMuted }}>Faqat o'z buyurtmangizni tahrirlashingiz mumkin.</p>
            </>
          )}
          {!isNew && (
            <p className="px-2.5 pt-1 pb-0.5 text-xs" style={{ color: COLOR.textMuted }}>
              {terminal ? 'Yakunlangan buyurtmalar faqat ko\'rish uchun ochiladi.' : 'Jarayon boshlangach buyurtma tahrirlanmaydi va bekor qilinmaydi.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Cancel confirmation dialog ─────────────────────────────────────────
export function CancelDialog({ order, onClose, onConfirm, loading }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.40)' }} onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-label="Buyurtmani bekor qilish"
        className="w-full max-w-[440px] rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, boxShadow: COLOR.shadowModal }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-3 items-start">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR.dangerSoft, color: COLOR.danger }}>
            <AlertTriangle size={20} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>Buyurtmani bekor qilish</p>
            <p className="text-[13px] mt-1.5" style={{ color: COLOR.textSecondary }}>Ushbu buyurtmani bekor qilishni xohlaysizmi? Bu amalni keyin qaytarib bo'lmaydi.</p>
          </div>
          <button aria-label="Yopish" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ border: `1px solid ${COLOR.border}`, color: COLOR.textSecondary }}>
            <X size={16} />
          </button>
        </div>

        <div className="rounded-[10px] p-3.5 flex flex-col gap-2.5" style={{ border: `1px solid ${COLOR.border}`, background: COLOR.subtleSurface }}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: COLOR.textTertiary }}>Buyurtma</span>
            <span className="text-[13px] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: COLOR.textPrimary }}>#{order.invoiceNumber}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: COLOR.textTertiary }}>Tashkilot</span>
            <span className="text-[13px] font-medium" style={{ color: COLOR.textPrimary }}>{order.client?.orgName}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs" style={{ color: COLOR.textTertiary }}>Holat</span>
            <StatusBadge status={order.status} order={order} />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="h-10 px-4 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>
            Ortga
          </button>
          <button
            onClick={onConfirm} disabled={loading}
            className="h-10 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: COLOR.danger, border: `1px solid ${COLOR.danger}` }}
          >
            {loading ? 'Bekor qilinmoqda...' : 'Bekor qilish'}
          </button>
        </div>
      </div>
    </div>
  );
}
