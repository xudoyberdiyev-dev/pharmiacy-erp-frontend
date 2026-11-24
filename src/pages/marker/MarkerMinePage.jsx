import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ClipboardList, Clock, TimerOff, Timer, CirclePause, ClockAlert, Search, SearchX, X, RefreshCw, CloudOff,
  FileSpreadsheet, FileX, Upload, LoaderCircle, MessageSquareWarning, Undo2, TriangleAlert, Check, Send, CircleAlert,
} from 'lucide-react';
import { markerAPI } from '../../api';
import { getErrorMessage } from '../../lib/errors';
import { FILE_BASE_URL } from '../../api/axios';
import { formatSum } from '../../lib/format';
import { C, FONT, MONO, SHADOW } from './design/tokens';

// ─────────────────────────────────────────────────────────────────────────
// Mening buyurtmalarim (Design System Phase 04).
// Backend manbasi: markerController.js
//  - getMine: status=MARKING, markerId=me, returnedToMarkingAt=null; deadline bo'yicha.
//  - getUrgency: <0 overdue · <10 critical · <30 warning (daqiqa).
//  - completeMark: multer `markedExcel` (.xlsx/.xls, 10 MB); fayl ixtiyoriy;
//    javob: { message, result: { doneAt, deadlineAt, isLate, hasFile } }.
//  - openEtirovWindow: bir martalik, ETIROV_WINDOW_MS = 2 daqiqa; ochilishi
//    bilan etirovWindowUsed=true. Ochiq paytda markingDeadline O'ZGARMAYDI —
//    close/raise paytida min(o'tgan vaqt, 2 daq)ga suriladi.
//  - returnToPicking: sabab majburiy; Picker'ga 5 jarima bali; status→PICKING.
// ─────────────────────────────────────────────────────────────────────────

const API_ORIGIN = FILE_BASE_URL;
const MIN = 60000;
const WINDOW_MS = 2 * MIN;                    // backend ETIROV_WINDOW_MS bilan bir xil
const URGENCY_MIN = { warning: 30, critical: 10 }; // backend getUrgency bilan bir xil
const MAX_FILE = 10 * 1024 * 1024;           // backend uploadExcel limits.fileSize
const EXT = ['.xlsx', '.xls'];               // backend uploadExcel fileFilter

const ETIROV_TYPES = [
  { value: 'WRONG_QUANTITY', label: "Dori miqdori noto'g'ri (kam yoki ko'p)" },
  { value: 'WRONG_PRODUCT', label: "Noto'g'ri dori olib kelindi" },
  { value: 'WRONG_SERIES', label: 'Dorining seriyasi boshqa' },
  { value: 'DAMAGED', label: 'Dori shikastlangan / yaroqsiz' },
  { value: 'MISSING_PRODUCT', label: "Dori ro'yxatdagi mahsulot yo'q" },
  { value: 'OTHER', label: 'Boshqa sabab' },
];

const pad2 = (n) => String(n).padStart(2, '0');
const clock = (ms) => { const a = Math.abs(ms), h = Math.floor(a / 3600000), m = Math.floor((a % 3600000) / 60000), s = Math.floor((a % 60000) / 1000); return `${h ? `${h}:` : ''}${pad2(m)}:${pad2(s)}`; };
const mss = (ms) => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(t / 60)}:${pad2(t % 60)}`; };
const fmtDuration = (min) => [Math.floor(min / 60) ? `${Math.floor(min / 60)} soat` : '', min % 60 ? `${min % 60} daq` : ''].filter(Boolean).join(' ');
const hm = (d) => (d ? format(new Date(d), 'HH:mm') : '—');

// Backend semantikasiga mos taymer holati. Oyna ochiq bo'lsa — qolgan vaqt muzlaydi.
export function timerOf(o, now) {
  const deadline = o.markingDeadline ? new Date(o.markingDeadline).getTime() : null;
  if (!deadline) return { left: null, paused: false };
  if (o.etirovWindowOpenedAt) {
    const opened = new Date(o.etirovWindowOpenedAt).getTime();
    if (now - opened < WINDOW_MS) return { paused: true, left: deadline - opened, winLeft: opened + WINDOW_MS - now, deadline };
    // Oyna muddati o'tgan, lekin hali yopilmagan: backend yopganda max 2 daq qo'shadi
    return { paused: false, left: deadline + WINDOW_MS - now, deadline: deadline + WINDOW_MS };
  }
  return { paused: false, left: deadline - now, deadline };
}
const urgencyOf = (t) => {
  if (t.paused) return 'paused';
  if (t.left == null) return 'normal';
  const m = t.left / MIN;
  return m < 0 ? 'overdue' : m < URGENCY_MIN.critical ? 'critical' : m < URGENCY_MIN.warning ? 'warning' : 'normal';
};

const TONE = {
  normal:   { label: 'Qolgan vaqt', Icon: Timer, fg: C.text, sub: C.text2, bg: C.bgApp, bar: C.p700, border: C.border },
  warning:  { label: 'Muddat yaqinlashmoqda', Icon: Timer, fg: C.warning.text, sub: C.warning.text, bg: C.warning.bg, bar: C.warning.main, border: C.border, badge: ['Muddat yaqin', Clock, 'warning'] },
  critical: { label: 'Muddat yaqinlashmoqda', Icon: Timer, fg: C.warning.text, sub: C.warning.text, bg: C.warning.bg, bar: C.warning.main, border: C.warning.border, badge: ['10 daqiqadan kam', ClockAlert, 'warning'] },
  overdue:  { label: 'Kechikkan', Icon: TimerOff, fg: C.danger.text, sub: C.danger.text, bg: C.danger.bg, bar: null, border: C.danger.border, badge: ['Kechikkan', TimerOff, 'danger'] },
  paused:   { label: "Taymer to'xtatilgan", Icon: CirclePause, fg: C.textBody, sub: C.text2, bg: C.surface2, bar: C.textDisabled, border: C.borderStrong, badge: ["Taymer to'xtatilgan", CirclePause, 'neutral'] },
};

function useNow(ms = 500) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

const CSS = `
.mkm-out:hover:not(:disabled){background:${C.bgApp};border-color:${C.borderHover}}
.mkm-pri:hover:not(:disabled){background:${C.p800};border-color:${C.p800}}
.mkm-dng:hover:not(:disabled){background:${C.danger.hover};border-color:${C.danger.hover}}
.mkm-dngo:hover:not(:disabled){background:${C.danger.bg}}
.mkm-drop:hover:not(:disabled){border-color:${C.p700};background:${C.p50}}
.mkm-ib:hover{background:${C.surface2}}
.mkm-in:focus{border-color:${C.p700};box-shadow:0 0 0 3px rgba(59,130,246,.25)}
.mkm-shell button:disabled{cursor:not-allowed}
.mkm-grid{display:grid;grid-template-columns:248px minmax(0,1fr) 288px}
.mkm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
@media (max-width:1100px){.mkm-grid{grid-template-columns:minmax(0,1fr)}.mkm-grid>*{border-left:none!important;border-right:none!important;border-top:1px solid ${C.border}}.mkm-grid>*:first-child{border-top:none}}
@media (max-width:640px){.mkm-info{grid-template-columns:minmax(0,1fr)!important}}
@keyframes mkspin{to{transform:rotate(360deg)}}
`;
const btn = (kind, h = 36) => {
  const base = { height: h, padding: '0 14px', borderRadius: 6, font: `500 ${h >= 36 ? 14 : 13}px/20px ${FONT}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' };
  if (kind === 'primary') return { ...base, border: `1px solid ${C.p700}`, background: C.p700, color: '#fff' };
  if (kind === 'danger') return { ...base, border: `1px solid ${C.danger.main}`, background: C.danger.main, color: '#fff' };
  if (kind === 'dangerOutline') return { ...base, border: `1px solid ${C.danger.border}`, background: '#fff', color: C.danger.text };
  return { ...base, border: `1px solid ${C.borderStrong}`, background: '#fff', color: C.text };
};
const disabledBtn = { background: C.surface2, color: C.textDisabled, borderColor: C.border };

export default function MarkerMinePage() {
  const qc = useQueryClient();
  const now = useNow(500);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [dlg, setDlg] = useState(null); // { type, order, window? }

  const { data: orders = [], isLoading, isError, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['marker-mine'],
    queryFn: markerAPI.getMine,
    refetchInterval: 15000,
    select: (r) => r.data.data || [],
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['marker-mine'] });
    qc.invalidateQueries({ queryKey: ['marker-available'] });
  };

  const enriched = useMemo(() => orders.map((o) => { const t = timerOf(o, now); return { o, t, u: urgencyOf(t) }; }), [orders, now]);
  const n = (f) => enriched.filter(f).length;
  const nSoon = n((e) => e.u === 'warning' || e.u === 'critical');
  const nLate = n((e) => e.u === 'overdue');
  const nPaused = n((e) => e.u === 'paused');

  const list = enriched.filter(({ o, u }) => {
    if (filter === 'soon' && !(u === 'warning' || u === 'critical')) return false;
    if (filter === 'late' && u !== 'overdue') return false;
    if (filter === 'paused' && u !== 'paused') return false;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [o.invoiceNumber, o.client?.orgName, o.assignedPicker?.fullName, o.contractNumber, o.lotNumber].some((v) => v && String(v).toLowerCase().includes(s));
  });

  const showData = !isLoading && !isError;

  return (
    <div className="mkm-shell" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0, font: `400 14px/20px ${FONT}`, color: C.text }}>
      <style>{CSS}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ margin: 0, font: `600 24px/32px ${FONT}`, letterSpacing: '-0.01em' }}>Mening buyurtmalarim</h1>
          <p style={{ margin: 0, color: C.text2 }}>Qabul qilingan buyurtmalar va markirovka jarayoni</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, font: `400 12px/16px ${FONT}` }}>
            <span style={{ color: C.text2 }}>Oxirgi yangilanish: <span className="tnum" style={{ color: C.text, fontWeight: 500 }}>{dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}</span></span>
            <span style={{ color: C.textMuted }}>Har 15 soniyada avtomatik yangilanadi</span>
          </span>
          <button type="button" className="mkm-out" onClick={() => refetch()} disabled={isFetching} style={btn('outline')}>
            <RefreshCw size={16} aria-hidden="true" style={isFetching ? { animation: 'mkspin .9s linear infinite' } : undefined} />{isFetching ? 'Yangilanmoqda…' : 'Yangilash'}
          </button>
        </div>
      </div>

      {showData && (
        <div className="mkm-stats">
          <Stat label="Faol buyurtmalar" Icon={ClipboardList} value={orders.length} note="Markirovka jarayonida" />
          <Stat label="Muddati yaqin" Icon={Clock} iconColor={C.warning.main} valueColor={C.warning.text} value={nSoon} note="30 daqiqadan kam qolgan" />
          <Stat label="Kechikkan" Icon={TimerOff} iconColor={C.danger.main} valueColor={C.danger.text} value={nLate} note="Markirovka muddati o'tgan, hali yakunlanmagan" />
          {nPaused > 0 && <Stat label="Taymer to'xtatilgan" Icon={CirclePause} value={nPaused} note="E'tiroz oynasi ochiq" />}
        </div>
      )}

      {showData && orders.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 280px', maxWidth: 400 }}>
            <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: 12, color: C.textMuted }} />
            <input className="mkm-in" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Qidiruv" placeholder="Faktura, mijoz, picker, shartnoma yoki lot" style={{ width: '100%', height: 36, padding: '0 12px 0 36px', border: `1px solid ${C.borderStrong}`, borderRadius: 6, font: `400 14px/20px ${FONT}`, outline: 'none' }} />
          </span>
          <div role="group" aria-label="Holat bo'yicha filtr" style={{ display: 'flex', gap: 4, padding: 4, background: C.surface2, borderRadius: 8 }}>
            {[['all', 'Barchasi', orders.length], ['soon', 'Muddati yaqin', nSoon], ['late', 'Kechikkan', nLate], ...(nPaused ? [['paused', "To'xtatilgan", nPaused]] : [])].map(([id, label, c]) => (
              <button key={id} type="button" aria-pressed={filter === id} onClick={() => setFilter(id)} style={{ height: 28, padding: '0 10px', border: 'none', borderRadius: 6, font: `500 13px/18px ${FONT}`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, background: filter === id ? '#fff' : 'transparent', color: filter === id ? C.text : C.text2, boxShadow: filter === id ? SHADOW.sm : 'none' }}>
                {label}<span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>{c}</span>
              </button>
            ))}
          </div>
          {(q || filter !== 'all') && (
            <button type="button" className="mkm-ib" onClick={() => { setQ(''); setFilter('all'); }} style={{ ...btn('outline'), border: 'none', background: 'transparent', padding: '0 10px' }}><X size={16} aria-hidden="true" />Tozalash</button>
          )}
        </div>
      )}

      {isLoading && [0, 1].map((i) => <div key={i} style={{ height: 252, borderRadius: 8, border: `1px solid ${C.border}`, background: `linear-gradient(90deg,${C.surface2} 0,${C.border} 50%,${C.surface2} 100%)`, opacity: 0.6 }} />)}

      {showData && list.map(({ o, t, u }) => (
        <OrderCard key={o.id} order={o} t={t} u={u} onDialog={setDlg} onDone={invalidate} />
      ))}

      {showData && orders.length > 0 && list.length === 0 && (
        <EmptyBox Icon={SearchX} title="Filtrlarga mos buyurtma topilmadi">
          <button type="button" className="mkm-out" style={btn('outline')} onClick={() => { setQ(''); setFilter('all'); }}>Filtrlarni tozalash</button>
        </EmptyBox>
      )}
      {showData && orders.length === 0 && (
        <EmptyBox Icon={ClipboardList} title="Hozircha faol buyurtmalar yo'q" desc="Yangi buyurtmani qabul qilganingizdan keyin u shu yerda ko'rinadi." />
      )}
      {isError && (
        <EmptyBox role="alert" danger Icon={CloudOff} title="Buyurtmalarni yuklab bo'lmadi" desc="Ma'lumotlarni olishda xatolik yuz berdi. Qayta urinib ko'ring.">
          <button type="button" className="mkm-out" style={btn('outline')} onClick={() => refetch()} disabled={isFetching}><RefreshCw size={16} aria-hidden="true" />Qayta urinish</button>
        </EmptyBox>
      )}

      {dlg?.type === 'fileless' && <FilelessDialog order={dlg.order} onClose={() => setDlg(null)} onDone={invalidate} />}
      {dlg?.type === 'etWarn' && <EtirovWarnDialog order={dlg.order} onClose={() => setDlg(null)} onOpened={(w) => { setDlg({ type: 'etiroz', order: dlg.order, window: w }); qc.invalidateQueries({ queryKey: ['marker-mine'] }); }} />}
      {dlg?.type === 'etiroz' && <EtirovDialog order={dlg.order} window={dlg.window} now={now} onClose={() => { setDlg(null); qc.invalidateQueries({ queryKey: ['marker-mine'] }); }} />}
      {dlg?.type === 'return' && <ReturnDialog order={dlg.order} onClose={() => setDlg(null)} onDone={invalidate} />}
    </div>
  );
}

// Bitta yakunlash mutatsiyasi — fayl bilan ham, faylsiz ham (mavjud API: markerAPI.complete(id, FormData))
function useComplete(order, onDone) {
  return useMutation({
    mutationFn: (fd) => markerAPI.complete(order.id, fd),
    onSuccess: (res) => {
      const r = res?.data?.result;
      let line = res?.data?.message;
      if (r?.doneAt && r?.deadlineAt) {
        const mins = Math.abs(Math.round((new Date(r.doneAt) - new Date(r.deadlineAt)) / MIN));
        line = r.isLate ? `muddatdan ${mins} daqiqa kech yakunlandi` : mins > 0 ? `muddatdan ${mins} daqiqa oldin yakunlandi` : "o'z vaqtida yakunlandi";
      }
      const title = r?.hasFile ? 'Marking fayli yuklandi' : "Marking yuklamasdan o'tkazildi";
      (r?.isLate ? toast : toast.success)(`${title}. № ${order.invoiceNumber} · ${line}. Buyurtma Tekshiruv bo'limiga o'tdi.`, { duration: 6000 });
      onDone();
    },
    onError: (e) => toast.error(getErrorMessage(e), { duration: Infinity }),
  });
}

function OrderCard({ order: o, t, u, onDialog, onDone }) {
  const T = TONE[u];
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState(null);
  const complete = useComplete(o, onDone);
  const busy = complete.isPending;
  const blocked = busy || t.paused;
  const pending = (o.etirozlar || []).filter((e) => e.status === 'PENDING' && e.fromRole === 'MARKER').length;
  const pct = t.left != null ? Math.max(0, Math.min(100, (t.left / (o.markingDuration * MIN)) * 100)) : 0;

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
    if (!EXT.includes(ext)) { setFile(null); setFileErr('Faqat .xlsx yoki .xls fayl yuklash mumkin'); return; }
    if (f.size > MAX_FILE) { setFile(null); setFileErr('Fayl hajmi 10 MB dan oshmasligi kerak'); return; }
    setFileErr(null); setFile(f);
  };
  const upload = () => {
    if (!file) { inputRef.current?.click(); return; }
    if (busy) return;
    const fd = new FormData();
    fd.append('markedExcel', file);
    complete.mutate(fd, { onError: () => setFile(null) });
  };

  const info = [
    ['Shartnoma', o.contractNumber, true], ['Lot', o.lotNumber, true],
    ['Summa', `${formatSum(o.totalAmount)} so'm`], ['Mijoz INN', o.client?.inn],
    ['Mijoz telefoni', o.client?.phone], ['Picker', o.assignedPicker?.fullName],
    ['Picker telefoni', o.assignedPicker?.phone], ['Picker topshirdi', o.pickingDoneAt && hm(o.pickingDoneAt)],
  ];

  return (
    <article aria-label={`Buyurtma ${o.invoiceNumber}`} style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        <span style={{ font: `500 13px/18px ${MONO}`, color: C.text2, whiteSpace: 'nowrap', flex: 'none' }}>№ {o.invoiceNumber}</span>
        <span className="mk-ellipsis" style={{ font: `600 16px/24px ${FONT}`, minWidth: 0 }}>{o.client?.orgName || '—'}</span>
        <Badge tone="brand" Icon={LoaderCircle}>Jarayonda</Badge>
        {T.badge && <Badge tone={T.badge[2]} Icon={T.badge[1]}>{T.badge[0]}</Badge>}
        <span style={{ marginLeft: 'auto', font: `400 12px/16px ${FONT}`, color: C.text2, whiteSpace: 'nowrap' }}>Qabul qilindi <span className="tnum" style={{ color: C.text, fontWeight: 500 }}>{hm(o.markingStartedAt)}</span></span>
        {o.productsExcelUrl && (
          <a className="mkm-out" href={`${API_ORIGIN}${o.productsExcelUrl}`} target="_blank" rel="noreferrer" style={{ ...btn('outline', 32), padding: '0 10px', textDecoration: 'none' }}>
            <FileSpreadsheet size={16} aria-hidden="true" style={{ color: C.success.main }} />Mahsulotlar Excel
          </a>
        )}
      </header>

      <div className="mkm-grid">
        <div style={{ background: T.bg, padding: 16, display: 'flex', flexDirection: 'column', gap: 10, borderRight: `1px solid ${C.border}` }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: `600 13px/18px ${FONT}`, color: T.sub }}><T.Icon size={16} aria-hidden="true" />{T.label}</span>
          <span role="timer" className="tnum" style={{ font: `600 32px/36px ${FONT}`, letterSpacing: '-0.01em', color: T.fg }}>
            {t.left == null ? '—' : `${u === 'overdue' ? '+' : ''}${clock(t.left)}`}
          </span>
          {T.bar && u !== 'overdue' && t.left != null && (
            <span style={{ display: 'block', height: 4, borderRadius: 999, background: C.border, overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${pct}%`, background: T.bar }} /></span>
          )}
          <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.text2 }}>Muddat: {t.deadline ? format(new Date(t.deadline), 'HH:mm') : '—'} · Jami {fmtDuration(o.markingDuration)}</span>
          {t.paused && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: `1px solid ${C.borderStrong}` }}>
              <span style={{ font: `400 12px/16px ${FONT}`, color: C.textBody }}>E'tiroz oynasi ochiq. Oyna yopilishiga <b className="tnum" style={{ fontWeight: 600 }}>{mss(t.winLeft)}</b></span>
              <button type="button" className="mkm-out" style={btn('outline', 32)} onClick={() => onDialog({ type: 'etiroz', order: o, window: { openedAt: o.etirovWindowOpenedAt, expiresAt: new Date(new Date(o.etirovWindowOpenedAt).getTime() + WINDOW_MS).toISOString() } })}>
                E'tiroz oynasiga qaytish
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div className="mkm-info" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px 20px' }}>
            {info.map(([k, v, mono]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>{k}</span>
                <span className="mk-ellipsis tnum" style={{ font: `500 13px/18px ${mono ? MONO : FONT}`, color: v ? C.text : C.textMuted }}>{v || '—'}</span>
              </div>
            ))}
          </div>
          {pending > 0 && <span style={{ alignSelf: 'flex-start' }}><Badge tone="warning" Icon={MessageSquareWarning}>{pending} ta e'tiroz Picker javobini kutmoqda</Badge></span>}
        </div>

        <div style={{ padding: 16, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={pick} hidden />
          {!file ? (
            <button type="button" className="mkm-drop" onClick={() => inputRef.current?.click()} disabled={blocked} style={{ border: `1.5px dashed ${C.borderStrong}`, borderRadius: 8, padding: '10px 12px', background: C.bgApp, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>
              <span style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', background: '#fff', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.p700 }}><Upload size={16} aria-hidden="true" /></span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ font: `500 13px/18px ${FONT}`, color: C.p700 }}>Markirovka faylini tanlang</span><span style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>.xlsx yoki .xls · 10 MB gacha</span></span>
            </button>
          ) : (
            <div style={{ border: `1px solid ${C.p200}`, background: C.p50, borderRadius: 8, padding: '8px 8px 8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileSpreadsheet size={20} aria-hidden="true" style={{ color: C.success.main }} />
              <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}><span className="mk-ellipsis" style={{ font: `500 13px/18px ${FONT}` }}>{file.name}</span><span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.text2 }}>{(file.size / 1024).toFixed(1)} KB</span></span>
              <button type="button" className="mkm-ib" disabled={busy} onClick={() => setFile(null)} aria-label="Faylni olib tashlash" style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', color: C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
            </div>
          )}
          {fileErr && <span role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 12px/16px ${FONT}`, color: C.danger.text }}><CircleAlert size={14} aria-hidden="true" />{fileErr}</span>}
          <button type="button" className="mkm-pri" onClick={upload} disabled={blocked} aria-busy={busy} style={{ ...btn('primary', 40), ...(t.paused ? disabledBtn : null) }}>
            {busy ? <LoaderCircle size={16} aria-hidden="true" style={{ animation: 'mkspin .9s linear infinite' }} /> : <Upload size={16} aria-hidden="true" />}
            {busy ? 'Yuklanmoqda…' : file ? 'Markirovka yuklash va yakunlash' : 'Faylni tanlang va yakunlang'}
          </button>
          <button type="button" className="mkm-out" onClick={() => onDialog({ type: 'fileless', order: o })} disabled={blocked} style={{ ...btn('outline'), ...(blocked ? { color: C.textDisabled } : null) }}>
            <FileX size={16} aria-hidden="true" />Yuklamasdan o'tkazish
          </button>
          {t.paused && <span style={{ font: `400 12px/16px ${FONT}`, color: C.text2 }}>E'tiroz oynasi yopilmaguncha yakunlash va qaytarish o'chirilgan.</span>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
            <button type="button" className="mkm-out" disabled={busy || o.etirovWindowUsed} title={o.etirovWindowUsed ? "Bu buyurtma uchun e'tiroz bildirish imkoniyati ishlatilgan" : "E'tiroz oynasi bir marta, 2 daqiqaga ochiladi"} onClick={() => onDialog({ type: 'etWarn', order: o })} style={{ ...btn('outline', 32), padding: '0 8px', gap: 6, color: busy || o.etirovWindowUsed ? C.textDisabled : C.textBody, whiteSpace: 'nowrap' }}>
              <MessageSquareWarning size={14} aria-hidden="true" />{o.etirovWindowUsed ? "E'tiroz imkoniyati ishlatilgan" : "E'tiroz bildirish"}
            </button>
            <button type="button" className="mkm-dngo" disabled={blocked} onClick={() => onDialog({ type: 'return', order: o })} style={{ ...btn('dangerOutline', 32), padding: '0 8px', gap: 6, whiteSpace: 'nowrap', ...(blocked ? { color: C.textDisabled, borderColor: C.border } : null) }}>
              <Undo2 size={14} aria-hidden="true" />Pikingga qaytarish
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Dialog({ labelId, alert, width = 480, onEscape, children }) {
  const ref = useRef(null);
  // onEscape har renderda yangi funksiya bo'ladi (e'tiroz oynasi har 0.5s qayta
  // chiziladi) — effekt qayta ishga tushib fokusni o'g'irlamasligi uchun ref orqali.
  const escRef = useRef(onEscape);
  escRef.current = onEscape;
  useEffect(() => {
    const prev = document.activeElement;
    const auto = ref.current?.querySelector('[data-autofocus]');
    if (auto) auto.focus(); else ref.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); escRef.current?.(); }
      if (e.key === 'Tab' && ref.current) {
        const els = [...ref.current.querySelectorAll('button:not(:disabled),textarea:not(:disabled),input:not(:disabled),a[href]')];
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div ref={ref} tabIndex={-1} role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={labelId} style={{ width: '100%', maxWidth: width, maxHeight: 'calc(100vh - 48px)', overflow: 'auto', background: '#fff', borderRadius: 12, boxShadow: SHADOW.lg, outline: 'none' }}>
        {children}
      </div>
    </div>
  );
}
function DialogHead({ id, title, order, Icon, tone, onClose }) {
  const bg = tone === 'danger' ? C.danger.bg : C.warning.bg, fg = tone === 'danger' ? C.danger.main : C.warning.main;
  return (
    <div style={{ padding: '20px 24px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {Icon && <span style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <span id={id} style={{ font: `600 18px/26px ${FONT}` }}>{title}</span>
        <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2 }}>№ {order.invoiceNumber} · {order.client?.orgName}</span>
      </div>
      <button type="button" className="mkm-ib" aria-label="Yopish" onClick={onClose} style={{ width: 32, height: 32, border: 'none', borderRadius: 6, background: 'transparent', color: C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
    </div>
  );
}
const footer = { padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 };

function FilelessDialog({ order, onClose, onDone }) {
  const complete = useComplete(order, () => { onDone(); onClose(); });
  const close = () => { if (!complete.isPending) onClose(); };
  return (
    <Dialog labelId="mk-fl" onEscape={close} width={460}>
      <DialogHead id="mk-fl" title="Fayl yuklamasdan yakunlash" order={order} Icon={FileX} onClose={close} />
      <div style={{ padding: '0 24px 20px', color: C.textBody }}>Buyurtma markirovka fayli yuklanmasdan Tekshiruv bo'limiga o'tkaziladi. Markirovka yakunlangan vaqt hozirgi vaqt bilan qayd etiladi.</div>
      <div style={footer}>
        <button type="button" className="mkm-out" style={btn('outline', 40)} onClick={close} disabled={complete.isPending}>Bekor qilish</button>
        <button type="button" className="mkm-pri" data-autofocus style={btn('primary', 40)} disabled={complete.isPending} onClick={() => complete.mutate(new FormData())}>
          {complete.isPending ? <LoaderCircle size={16} aria-hidden="true" style={{ animation: 'mkspin .9s linear infinite' }} /> : <Check size={16} aria-hidden="true" />}
          {complete.isPending ? "O'tkazilmoqda…" : 'Yuklamasdan yakunlash'}
        </button>
      </div>
    </Dialog>
  );
}

function EtirovWarnDialog({ order, onClose, onOpened }) {
  const [opening, setOpening] = useState(false);
  // Server chaqiruvi faqat foydalanuvchi bosganda (StrictMode effect takrorlanishidan himoya — mavjud qaror saqlangan)
  const open = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const res = await markerAPI.openEtirovWindow(order.id);
      onOpened(res.data.window);
    } catch (e) {
      toast.error(e.response?.data?.message || "E'tiroz oynasini ochib bo'lmadi");
      onClose();
    } finally { setOpening(false); }
  };
  return (
    <Dialog labelId="mk-ew" alert onEscape={() => !opening && onClose()}>
      <DialogHead id="mk-ew" title="E'tiroz oynasini ochish" order={order} Icon={MessageSquareWarning} onClose={() => !opening && onClose()} />
      <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: C.warning.bg, border: `1px solid ${C.warning.border}`, borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, font: `500 13px/18px ${FONT}`, color: '#78350F' }}>
          <TriangleAlert size={16} aria-hidden="true" style={{ color: C.warning.main, flex: 'none', marginTop: 1 }} />Bu imkoniyat har bir buyurtma uchun faqat bir marta beriladi.
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, font: `400 13px/18px ${FONT}`, color: C.textBody }}>
          <li>Oynani ochishning o'zi imkoniyatni ishlatadi — e'tiroz yubormasangiz ham.</li>
          <li>Oyna <b style={{ fontWeight: 600 }}>2 daqiqa</b> ochiq turadi.</li>
          <li>Oyna ochiq paytda markirovka taymeri to'xtatiladi va keyin davom etadi.</li>
          <li>Oynani yopsangiz yoki vaqt tugasa, imkoniyat qaytarilmaydi.</li>
        </ul>
      </div>
      <div style={footer}>
        <button type="button" className="mkm-out" style={btn('outline', 40)} onClick={onClose} disabled={opening} data-autofocus>Bekor qilish</button>
        <button type="button" className="mkm-pri" style={btn('primary', 40)} onClick={open} disabled={opening}>
          {opening ? <LoaderCircle size={16} aria-hidden="true" style={{ animation: 'mkspin .9s linear infinite' }} /> : <MessageSquareWarning size={16} aria-hidden="true" />}
          {opening ? 'Ochilmoqda…' : 'Oynani ochish'}
        </button>
      </div>
    </Dialog>
  );
}

function EtirovDialog({ order, window: w, now, onClose }) {
  const [sel, setSel] = useState([]);
  const [comment, setComment] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const resolved = useRef(false);
  const openedAt = new Date(w.openedAt).getTime();
  const winLeft = new Date(w.expiresAt).getTime() - now;
  const timeUp = winLeft <= 0;
  const frozen = order.markingDeadline ? new Date(order.markingDeadline).getTime() - openedAt : null;

  const closeWindow = () => {
    if (resolved.current) return;
    resolved.current = true;
    markerAPI.closeEtirovWindow(order.id).catch(() => {}); // backend idempotent
  };
  useEffect(() => { if (timeUp) closeWindow(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [timeUp]);

  const mutation = useMutation({
    mutationFn: () => markerAPI.raiseEtirov(order.id, { types: sel, comment: comment.trim() || undefined }),
    onSuccess: () => {
      resolved.current = true;
      toast.success(`E'tiroz Picker'ga yuborildi · № ${order.invoiceNumber}. Taymer davom etmoqda.`);
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e), { duration: Infinity }),
  });

  const needComment = sel.includes('OTHER') && !comment.trim();
  const askClose = () => { if (mutation.isPending) return; if (timeUp) onClose(); else setConfirmClose(true); };
  const reallyClose = () => { closeWindow(); onClose(); };
  const tone = timeUp ? C.danger : C.warning;

  return (
    <Dialog labelId="mk-et" width={560} onEscape={askClose}>
      <div style={{ padding: '20px 24px 12px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <span id="mk-et" style={{ font: `600 18px/26px ${FONT}` }}>E'tiroz bildirish</span>
          <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2 }}>№ {order.invoiceNumber} · {order.client?.orgName}</span>
        </div>
        <button type="button" className="mkm-ib" aria-label="Yopish" onClick={askClose} style={{ width: 32, height: 32, border: 'none', borderRadius: 6, background: 'transparent', color: C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
      </div>
      <div style={{ margin: '0 24px', padding: '10px 14px', borderRadius: 8, border: `1px solid ${tone.border}`, background: tone.bg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ font: `600 13px/18px ${FONT}`, color: tone.text }}>{timeUp ? 'Vaqt tugadi — oyna yopildi' : 'Oyna yopilishiga qolgan vaqt'}</span>
          {frozen != null && <span style={{ font: `400 12px/16px ${FONT}`, color: C.text2 }}>Markirovka taymeri to'xtatilgan: <b className="tnum" style={{ fontWeight: 500, color: C.text }}>{clock(frozen)}</b> qoldi</span>}
        </span>
        <span role="timer" className="tnum" style={{ font: `600 24px/28px ${FONT}`, color: tone.text }}>{timeUp ? '0:00' : mss(winLeft)}</span>
      </div>
      {confirmClose && !timeUp && (
        <div role="alert" style={{ margin: '12px 24px 0', padding: '12px 14px', borderRadius: 8, border: `1px solid ${C.danger.border}`, background: C.danger.bg, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ font: `400 13px/18px ${FONT}`, color: '#7F1D1D' }}><b style={{ fontWeight: 600 }}>Oynani yopasizmi?</b> E'tiroz yuborilmaydi va bu buyurtma uchun imkoniyat qaytarilmaydi. Markirovka taymeri davom etadi.</span>
          <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="mkm-out" style={btn('outline', 32)} onClick={() => setConfirmClose(false)} data-autofocus>Davom etish</button>
            <button type="button" className="mkm-dng" style={btn('danger', 32)} onClick={reallyClose}>Ha, yopish</button>
          </span>
        </div>
      )}
      <div style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ font: `500 13px/18px ${FONT}`, color: C.textBody }}>Sabablarni tanlang <span style={{ fontWeight: 400, color: C.textMuted }}>— bir nechtasini tanlash mumkin</span></span>
        <div role="group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ETIROV_TYPES.map((tp) => {
            const on = sel.includes(tp.value);
            return (
              <label key={tp.value} style={{ minHeight: 40, padding: '8px 12px', borderRadius: 6, border: `1px solid ${on ? C.p700 : C.border}`, background: on ? C.p50 : '#fff', display: 'flex', alignItems: 'center', gap: 10, cursor: timeUp ? 'not-allowed' : 'pointer' }}>
                <input type="checkbox" checked={on} disabled={timeUp || mutation.isPending} onChange={() => setSel((p) => (on ? p.filter((v) => v !== tp.value) : [...p, tp.value]))} style={{ width: 16, height: 16, accentColor: C.p700 }} />
                {tp.label}
              </label>
            );
          })}
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: `500 13px/18px ${FONT}`, color: C.textBody }}>Izoh <span style={{ fontWeight: 400, color: C.textMuted }}>· {sel.includes('OTHER') ? 'Majburiy — "Boshqa sabab" tanlangan' : 'Ixtiyoriy'}</span></span>
          <textarea className="mkm-in" value={comment} onChange={(e) => setComment(e.target.value)} disabled={timeUp || mutation.isPending} rows={3} placeholder="Qaysi pozitsiya, qanday farq…" aria-invalid={needComment} style={{ padding: '8px 12px', border: `1px solid ${needComment ? C.danger.main : C.borderStrong}`, borderRadius: 6, font: `400 14px/20px ${FONT}`, resize: 'vertical', outline: 'none' }} />
        </label>
      </div>
      <div style={{ ...footer, justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>Yuborilgach taymer davom etadi.</span>
        <span style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="mkm-out" style={btn('outline', 40)} onClick={askClose} disabled={mutation.isPending}>Yopish</button>
          <button type="button" className="mkm-pri" style={btn('primary', 40)} disabled={timeUp || mutation.isPending || !sel.length || needComment} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <LoaderCircle size={16} aria-hidden="true" style={{ animation: 'mkspin .9s linear infinite' }} /> : <Send size={16} aria-hidden="true" />}
            {mutation.isPending ? 'Yuborilmoqda…' : `E'tirozni yuborish${sel.length > 1 ? ` (${sel.length} ta)` : ''}`}
          </button>
        </span>
      </div>
    </Dialog>
  );
}

function ReturnDialog({ order, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [ack, setAck] = useState(false);
  const mutation = useMutation({
    mutationFn: () => markerAPI.returnToPicking(order.id, reason.trim()),
    onSuccess: (res) => { toast.success(`${res?.data?.message || "Buyurtma picking bo'limiga qaytarildi"}. № ${order.invoiceNumber}`); onDone(); onClose(); },
    onError: (e) => toast.error(getErrorMessage(e), { duration: Infinity }),
  });
  const close = () => { if (!mutation.isPending) onClose(); };
  return (
    <Dialog labelId="mk-rt" alert width={500} onEscape={close}>
      <DialogHead id="mk-rt" title="Pikingga qaytarish" order={order} Icon={Undo2} tone="danger" onClose={close} />
      <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ background: C.warning.bg, border: `1px solid ${C.warning.border}`, borderRadius: 8, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, color: '#78350F' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, font: `600 13px/18px ${FONT}` }}><TriangleAlert size={16} aria-hidden="true" style={{ color: C.warning.main }} />Oqibatlari</span>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, font: `400 13px/18px ${FONT}` }}>
            <li>Buyurtma Picking bo'limiga qaytadi va sizdan olinadi.</li>
            <li>Picker <b style={{ fontWeight: 600 }}>{order.assignedPicker?.fullName || '—'}</b>ga <b style={{ fontWeight: 600 }}>5 jarima bali</b> darhol yoziladi.</li>
            <li>Picker uni "Markingdan qaytganlar" sahifasida ko'radi.</li>
          </ul>
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: `500 13px/18px ${FONT}`, color: C.textBody }}>Qaytarish sababi <span style={{ color: C.danger.text }}>*</span></span>
          <textarea className="mkm-in" data-autofocus value={reason} onChange={(e) => setReason(e.target.value)} rows={3} disabled={mutation.isPending} placeholder="Masalan: mahsulot to'liq yig'ilmagan, miqdori noto'g'ri…" style={{ padding: '8px 12px', border: `1px solid ${C.borderStrong}`, borderRadius: 6, font: `400 14px/20px ${FONT}`, resize: 'vertical', outline: 'none' }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, font: `400 13px/18px ${FONT}`, color: C.textBody, cursor: 'pointer' }}>
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} disabled={mutation.isPending} style={{ width: 16, height: 16, marginTop: 1, accentColor: C.p700 }} />
          Oqibatlarini tushunaman va buyurtmani qaytarishni tasdiqlayman
        </label>
      </div>
      <div style={footer}>
        <button type="button" className="mkm-out" style={btn('outline', 40)} onClick={close} disabled={mutation.isPending}>Bekor qilish</button>
        <button type="button" className="mkm-dng" style={{ ...btn('danger', 40), ...(!reason.trim() || !ack ? disabledBtn : null) }} disabled={mutation.isPending || !reason.trim() || !ack} onClick={() => mutation.mutate()}>
          {mutation.isPending ? <LoaderCircle size={16} aria-hidden="true" style={{ animation: 'mkspin .9s linear infinite' }} /> : <Undo2 size={16} aria-hidden="true" />}
          {mutation.isPending ? 'Qaytarilmoqda…' : 'Pikingga qaytarish'}
        </button>
      </div>
    </Dialog>
  );
}

function Badge({ tone, Icon, children }) {
  const t = { brand: [C.p50, C.p800, C.p200], warning: [C.warning.bg, C.warning.text, C.warning.border], danger: [C.danger.bg, C.danger.text, C.danger.border], neutral: [C.surface2, C.textBody, C.borderStrong] }[tone];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 8px', borderRadius: 4, font: `500 12px/16px ${FONT}`, background: t[0], color: t[1], border: `1px solid ${t[2]}`, whiteSpace: 'nowrap' }}>{Icon && <Icon size={14} aria-hidden="true" />}{children}</span>;
}
function Stat({ label, Icon, value, note, iconColor = C.textMuted, valueColor = C.text }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ font: `500 13px/18px ${FONT}`, color: C.text2 }}>{label}</span><Icon size={16} aria-hidden="true" style={{ color: iconColor }} /></div>
      <span className="tnum" style={{ font: `700 24px/28px ${FONT}`, color: valueColor }}>{value}</span>
      <span style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>{note}</span>
    </div>
  );
}
function EmptyBox({ Icon, title, desc, danger, role, children }) {
  return (
    <div role={role} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '56px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      <span style={{ width: 44, height: 44, borderRadius: '50%', background: danger ? C.danger.bg : C.surface2, color: danger ? C.danger.main : C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>
      <span style={{ font: `600 16px/24px ${FONT}` }}>{title}</span>
      {desc && <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2 }}>{desc}</span>}
      {children && <div style={{ marginTop: 4 }}>{children}</div>}
    </div>
  );
}
