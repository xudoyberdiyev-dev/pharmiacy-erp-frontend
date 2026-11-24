import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Clock, CheckCheck, CircleX, RefreshCw, CloudOff } from 'lucide-react';
import { markerAPI } from '../../../api';
import { C, FONT, SHADOW } from '../design/tokens';

// ─────────────────────────────────────────────────────────────────────────
// E'tirozlar (Design System Phase 06) — umumiy qismlar.
// Ikkala route o'zgarishsiz qoladi; tablar ularni NavLink orqali ochadi.
// Har bir tab o'z so'rovi va kalitidan foydalanadi — ma'lumotlar aralashmaydi.
// ─────────────────────────────────────────────────────────────────────────

export const TYPE_LABELS = {
  WRONG_QUANTITY: "Dori miqdori noto'g'ri", WRONG_PRODUCT: "Noto'g'ri dori olib kelindi", WRONG_SERIES: 'Dorining seriyasi boshqa',
  DAMAGED: 'Dori shikastlangan', MISSING_PRODUCT: "Dori ro'yxatda yo'q", OTHER: 'Boshqa sabab',
};
export const REJECT_REASONS = [
  { value: 'WRONG_QUANTITY', label: "Dori miqdori to'g'ri edi" }, { value: 'WRONG_PRODUCT', label: "To'g'ri dori olib keldim" },
  { value: 'WRONG_SERIES', label: "Seriya to'g'ri edi" }, { value: 'DAMAGED', label: 'Dori shikastlanmagan edi' },
  { value: 'MISSING_PRODUCT', label: 'Barcha mahsulotlar bor edi' }, { value: 'OTHER', label: 'Boshqa izoh' },
];
export const REJECT_LABELS = Object.fromEntries(REJECT_REASONS.map((r) => [r.value, r.label]));

// Yagona holat terminlari (Phase 01 badge tizimi)
const STATUS = {
  PENDING: { label: 'Kutilmoqda', Icon: Clock, bg: C.warning.bg, fg: C.warning.text, bd: C.warning.border },
  ACCEPTED: { label: 'Qabul qilingan', Icon: CheckCheck, bg: C.success.bg, fg: C.success.text, bd: C.success.border },
  REJECTED: { label: 'Rad etilgan', Icon: CircleX, bg: C.danger.bg, fg: C.danger.text, bd: C.danger.border },
};
export function StatusBadge({ status }) {
  const s = STATUS[status];
  if (!s) return null;
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 8px', borderRadius: 4, font: `500 12px/16px ${FONT}`, background: s.bg, color: s.fg, border: `1px solid ${s.bd}`, whiteSpace: 'nowrap' }}><s.Icon size={14} aria-hidden="true" />{s.label}</span>;
}
export const statusLabel = (s) => STATUS[s]?.label || s;
export const dt = (d) => (d ? format(new Date(d), 'dd.MM.yyyy, HH:mm') : '—');

const hasPending = (o, filter) => (o.etirozlar || []).filter(filter).some((e) => e.status === 'PENDING');

// Sahifa sarlavhasi + tablar. Hisoblagichlar MarkerLayout bilan bir xil kesh kalitlaridan olinadi.
export function EtirozlarHeader({ dataUpdatedAt, isFetching, onRefresh }) {
  const { data: sent = [] } = useQuery({ queryKey: ['marker-etirozli'], queryFn: markerAPI.getEtirozli, refetchInterval: 30000, select: (r) => r.data.data || [] });
  const { data: recv = [] } = useQuery({ queryKey: ['marker-etirozli-received'], queryFn: markerAPI.getEtirozliReceived, refetchInterval: 30000, select: (r) => r.data.data || [] });
  const nSent = sent.filter((o) => hasPending(o, (e) => e.fromRole === 'MARKER')).length;
  const nRecv = recv.filter((o) => hasPending(o, () => true)).length;
  const tabs = [
    { to: '/marker/etirozli', label: 'Men bildirganlar', n: nSent, tone: [C.warning.bg ? '#FEF3C7' : '', C.warning.text] },
    { to: '/marker/etirozlar-received', label: 'Menga bildirilganlar', n: nRecv, tone: [C.danger.main, '#fff'] },
  ];
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ margin: 0, font: `600 24px/32px ${FONT}`, letterSpacing: '-0.01em' }}>E'tirozlar</h1>
          <p style={{ margin: 0, color: C.text2 }}>Siz bildirgan va sizga bildirilgan e'tirozlar</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ font: `400 12px/16px ${FONT}`, color: C.text2 }}>Oxirgi yangilanish: <span className="tnum" style={{ color: C.text, fontWeight: 500 }}>{dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}</span></span>
          <button type="button" className="mke-out" onClick={onRefresh} disabled={isFetching} style={btnOutline()}>
            <RefreshCw size={16} aria-hidden="true" style={isFetching ? { animation: 'mkspin .9s linear infinite' } : undefined} />{isFetching ? 'Yangilanmoqda…' : 'Yangilash'}
          </button>
        </div>
      </div>
      <nav role="tablist" aria-label="E'tirozlar bo'limlari" style={{ display: 'flex', alignItems: 'flex-end', gap: 4, borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} role="tab" className="mke-tab"
            style={({ isActive }) => ({ height: 44, padding: '0 14px', marginBottom: -1, borderBottom: `2px solid ${isActive ? C.p700 : 'transparent'}`, color: isActive ? C.p700 : C.text2, font: `${isActive ? 600 : 500} 14px/20px ${FONT}`, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' })}>
            {({ isActive }) => (
              <>
                <span aria-current={isActive ? 'page' : undefined}>{t.label}</span>
                {t.n > 0 && <span className="tnum" style={{ minWidth: 20, height: 20, padding: '0 6px', borderRadius: 999, background: t.tone[0], color: t.tone[1], font: `600 12px/16px ${FONT}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{t.n}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export const btnOutline = (h = 36) => ({ height: h, padding: '0 14px', borderRadius: 6, border: `1px solid ${C.borderStrong}`, background: '#fff', color: C.text, font: `500 ${h >= 36 ? 14 : 13}px/20px ${FONT}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' });
export const btnPrimary = (h = 40) => ({ ...btnOutline(h), border: `1px solid ${C.p700}`, background: C.p700, color: '#fff' });
export const btnDisabled = { background: C.surface2, color: C.textDisabled, borderColor: C.border };

export const SHARED_CSS = `
.mke-out:hover:not(:disabled){background:${C.bgApp};border-color:${C.borderHover}}
.mke-pri:hover:not(:disabled){background:${C.p800};border-color:${C.p800}}
.mke-tab:hover{color:${C.text}!important}
.mke-ib:hover{background:${C.surface2}}
.mke-in:focus{border-color:${C.p700};box-shadow:0 0 0 3px rgba(59,130,246,.25)}
.mke button:disabled{cursor:not-allowed}
@keyframes mkspin{to{transform:rotate(360deg)}}
@keyframes mkshimmer{0%{background-position:-480px 0}100%{background-position:480px 0}}
.mke-shim{background:linear-gradient(90deg,${C.surface2} 0,${C.border} 50%,${C.surface2} 100%);background-size:960px 100%;animation:mkshimmer 1.4s linear infinite}
`;

export function Segmented({ items, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} style={{ marginLeft: 'auto', display: 'flex', gap: 4, padding: 4, background: C.surface2, borderRadius: 8 }}>
      {items.map(([id, text, n]) => (
        <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} style={{ height: 28, padding: '0 10px', border: 'none', borderRadius: 6, font: `500 13px/18px ${FONT}`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, background: value === id ? '#fff' : 'transparent', color: value === id ? C.text : C.text2, boxShadow: value === id ? SHADOW.sm : 'none' }}>
          {text}<span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>{n}</span>
        </button>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ height: 52, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}><span style={{ width: 80, height: 12, borderRadius: 4, background: C.surface2 }} /><span className="mke-shim" style={{ width: 220, height: 12, borderRadius: 4 }} /></div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>{['40%', '70%', '30%'].map((w) => <span key={w} style={{ width: w, height: 10, borderRadius: 4, background: C.surface2 }} />)}</div>
    </div>
  );
}

export function StateBox({ Icon, title, desc, tone = 'neutral', role, children, compact }) {
  const t = { neutral: [C.surface2, C.text2], success: [C.success.bg, C.success.main], danger: [C.danger.bg, C.danger.main] }[tone];
  return (
    <div role={role} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: compact ? '40px 24px' : '56px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      {Icon && <span style={{ width: 44, height: 44, borderRadius: '50%', background: t[0], color: t[1], display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>}
      <span style={{ font: `600 16px/24px ${FONT}` }}>{title}</span>
      {desc && <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2, maxWidth: 440 }}>{desc}</span>}
      {children && <div style={{ marginTop: 4 }}>{children}</div>}
    </div>
  );
}

export function ErrorState({ onRetry, isFetching }) {
  return (
    <StateBox role="alert" tone="danger" Icon={CloudOff} title="E'tirozlarni yuklab bo'lmadi" desc="Ma'lumotlarni olishda xatolik yuz berdi. Qayta urinib ko'ring.">
      <button type="button" className="mke-out" style={btnOutline()} onClick={onRetry} disabled={isFetching}><RefreshCw size={16} aria-hidden="true" />Qayta urinish</button>
    </StateBox>
  );
}
