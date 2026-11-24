import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format, formatDistanceStrict } from 'date-fns';
import {
  Package, Hourglass, Banknote, CalendarClock, Info, X, Search, SearchX, ChevronDown, ChevronRight,
  ArrowUpDown, RefreshCw, Timer, FileSpreadsheet, Check, LoaderCircle, Inbox, CloudOff,
} from 'lucide-react';
import { markerAPI } from '../../api';
import { getErrorMessage } from '../../lib/errors';
import { FILE_BASE_URL } from '../../api/axios';
import { formatSum } from '../../lib/format';
import { C, FONT, MONO, SHADOW, BADGE } from './design/tokens';

// ─────────────────────────────────────────────────────────────────────────
// Mavjud buyurtmalar (Design System Phase 03).
// Backend: GET /marker/orders/available — status=MARKING, markerId=null,
// orderBy markingDeadline asc. Har bir orderda `urgency` (markingDeadline'dan).
// Diqqat: order yaratilganda deadline'lar null — markingDeadline faqat
// marker accept qilganda hisoblanadi. Shu sabab bu ro'yxatda `urgency`
// deyarli har doim 'normal'; agar qiymat bo'lsa, u "rejali muddat" sifatida
// ko'rsatiladi va markerning shaxsiy taymeri bilan aralashtirilmaydi.
// ─────────────────────────────────────────────────────────────────────────

const API_ORIGIN = FILE_BASE_URL;
const COLS = '32px 92px minmax(0,1.3fr) 112px minmax(0,1fr) 148px 196px';

const PLANNED = {
  overdue:  { label: "Muddat o'tgan", bg: C.danger.bg,  fg: C.danger.text,  bd: C.danger.border },
  critical: { label: '10 daq qoldi',  bg: C.warning.bg, fg: C.warning.text, bd: C.warning.border },
  warning:  { label: '30 daq qoldi',  bg: C.warning.bg, fg: C.warning.text, bd: C.warning.border },
};
const hasPlanned = (o) => !!o.markingDeadline && !!PLANNED[o.urgency];

const SORTS = {
  server: null, // backend tartibi (markingDeadline asc) saqlanadi
  oldest: (a, b) => new Date(a.pickingDoneAt || a.createdAt) - new Date(b.pickingDoneAt || b.createdAt),
  newest: (a, b) => new Date(b.pickingDoneAt || b.createdAt) - new Date(a.pickingDoneAt || a.createdAt),
  amount: (a, b) => (b.totalAmount || 0) - (a.totalAmount || 0),
};

const fmtDuration = (min) => {
  const h = Math.floor(min / 60), m = min % 60;
  return [h ? `${h} soat` : '', m ? `${m} daq` : ''].filter(Boolean).join(' ') || '—';
};
// 90 daq → "1 soat 30 daq"; 30 soatdan oshsa → "2 kun 6 soat"
const fmtSince = (ms) => {
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 60) return `${m} daq`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat${m % 60 ? ` ${m % 60} daq` : ''}`;
  const d = Math.floor(h / 24);
  return `${d} kun${h % 24 ? ` ${h % 24} soat` : ''}`;
};
const fmtAgo = (d, now) => {
  const ms = now - new Date(d);
  if (ms < 60000) return 'hozirgina';
  return `${fmtSince(ms)} oldin`;
};

const S = {
  card: { background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8 },
  input: { height: 36, border: `1px solid ${C.borderStrong}`, borderRadius: 6, font: `400 14px/20px ${FONT}`, color: C.text, background: '#fff', outline: 'none' },
  btnOutline: { height: 36, padding: '0 14px', borderRadius: 6, border: `1px solid ${C.borderStrong}`, background: '#fff', color: C.text, font: `500 14px/20px ${FONT}`, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  muted: { font: `400 12px/16px ${FONT}`, color: C.textMuted },
};

const CSS = `
.mka-row:hover{background:${C.bgApp}}
.mka-in:hover{border-color:${C.borderHover}}
.mka-in:focus{border-color:${C.p700};box-shadow:0 0 0 3px rgba(59,130,246,.25)}
.mka-out:hover{background:${C.bgApp};border-color:${C.borderHover}}
.mka-ib:hover{background:${C.border};color:${C.text}}
.mka-xl:hover{background:${C.success.bg};border-color:${C.success.border}}
.mka-pri:hover:not(:disabled){background:${C.p800};border-color:${C.p800}}
.mka-pri:active:not(:disabled){background:${C.p900}}
.mka-ghost:hover{background:${C.surface2};color:${C.text}}
@keyframes mkspin{to{transform:rotate(360deg)}}
@keyframes mkshimmer{0%{background-position:-480px 0}100%{background-position:480px 0}}
.mka-shim{background:linear-gradient(90deg,${C.surface2} 0,${C.border} 50%,${C.surface2} 100%);background-size:960px 100%;animation:mkshimmer 1.4s linear infinite}
`;

export default function MarkerAvailablePage() {
  const qc = useQueryClient();
  const [hidden, setHidden] = useState(new Set());
  const [q, setQ] = useState('');
  const [picker, setPicker] = useState('');
  const [plannedOnly, setPlannedOnly] = useState(false);
  const [sort, setSort] = useState('server');
  const [open, setOpen] = useState({});
  const [noteOpen, setNoteOpen] = useState(true);

  // Kalit, interval va select avvalgidek (MarkerLayout bilan bir xil kesh)
  const { data: orders = [], isLoading, isError, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['marker-available'],
    queryFn: markerAPI.getAvailable,
    refetchInterval: 10000,
    select: (r) => r.data.data || [],
  });

  const now = dataUpdatedAt || Date.now();
  const all = useMemo(() => orders.filter((o) => !hidden.has(o.id)), [orders, hidden]);
  const pickers = useMemo(() => [...new Set(all.map((o) => o.assignedPicker?.fullName).filter(Boolean))].sort(), [all]);
  const plannedCount = all.filter(hasPlanned).length;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let out = all.filter((o) => {
      if (picker && o.assignedPicker?.fullName !== picker) return false;
      if (plannedOnly && !hasPlanned(o)) return false;
      if (!s) return true;
      return [o.invoiceNumber, o.client?.orgName, o.assignedPicker?.fullName, o.contractNumber, o.lotNumber]
        .some((v) => v && String(v).toLowerCase().includes(s));
    });
    if (SORTS[sort]) out = [...out].sort(SORTS[sort]);
    return out;
  }, [all, q, picker, plannedOnly, sort]);

  const filtersActive = !!(q.trim() || picker || plannedOnly || sort !== 'server');
  const resetFilters = () => { setQ(''); setPicker(''); setPlannedOnly(false); setSort('server'); };

  const onAccepted = (id) => {
    setHidden((p) => new Set([...p, id]));
    qc.invalidateQueries({ queryKey: ['marker-mine'] });
    qc.invalidateQueries({ queryKey: ['marker-available'] });
  };
  const onConflict = (id) => {
    setHidden((p) => new Set([...p, id]));
    qc.invalidateQueries({ queryKey: ['marker-available'] });
  };

  const longest = all.length
    ? Math.max(...all.map((o) => now - new Date(o.pickingDoneAt || o.createdAt)))
    : 0;
  const totalSum = all.reduce((a, o) => a + (Number(o.totalAmount) || 0), 0);
  const showData = !isLoading && !isError;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0, font: `400 14px/20px ${FONT}`, color: C.text }}>
      <style>{CSS}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <h1 style={{ margin: 0, font: `600 24px/32px ${FONT}`, letterSpacing: '-0.01em' }}>Mavjud buyurtmalar</h1>
          <p style={{ margin: 0, font: `400 14px/20px ${FONT}`, color: C.text2 }}>Markirovka uchun qabul qilish mumkin bo'lgan buyurtmalar</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <span style={{ font: `400 12px/16px ${FONT}`, color: C.text2 }}>
              Oxirgi yangilanish: <span className="tnum" style={{ color: C.text, fontWeight: 500 }}>{dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}</span>
            </span>
            <span style={S.muted}>Har 10 soniyada avtomatik yangilanadi</span>
          </span>
          {/* Faqat shu so'rov qayta olinadi (oldin invalidateQueries(['…']) v5'da barcha so'rovlarni yangilardi) */}
          <button type="button" className="mka-out" onClick={() => refetch()} disabled={isFetching} aria-label="Ro'yxatni yangilash" style={S.btnOutline}>
            <RefreshCw size={16} aria-hidden="true" style={isFetching ? { animation: 'mkspin .9s linear infinite' } : undefined} />
            {isFetching ? 'Yangilanmoqda…' : 'Yangilash'}
          </button>
        </div>
      </div>

      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ ...S.card, padding: 16, height: 104, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ height: 10, width: '45%', borderRadius: 4, background: C.surface2 }} />
              <span className="mka-shim" style={{ height: 20, width: '30%', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      {showData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          <Stat label="Mavjud buyurtmalar" icon={Package} value={all.length} note="Qabul qilishni kutmoqda" />
          <Stat label="Eng uzoq kutayotgan" icon={Hourglass} value={all.length ? fmtSince(longest) : '—'} note="Picker topshirganidan beri" />
          <Stat label="Umumiy summa" icon={Banknote} value={formatSum(totalSum)} note="so'm · mavjud buyurtmalar bo'yicha" />
          {plannedCount > 0 && <Stat label="Rejali muddati belgilangan" icon={CalendarClock} iconColor={C.warning.main} valueColor={C.warning.text} value={plannedCount} note="Server urgency qiymati bo'yicha" />}
        </div>
      )}

      {showData && noteOpen && all.length > 0 && (
        <div role="note" style={{ background: C.info.bg, border: `1px solid ${C.info.border}`, borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Info size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: C.info.main, flex: 'none' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
            <span style={{ font: `600 14px/20px ${FONT}`, color: '#0C4A6E' }}>Markirovka vaqti qabul qilgan paytingizdan boshlanadi</span>
            <span style={{ font: `400 13px/18px ${FONT}`, color: C.info.text }}>"Markirovka vaqti" ustunida sizga beriladigan muddat ko'rsatilgan. "Rejali muddat" — buyurtmaga avvaldan belgilangan muddat, u sizning shaxsiy taymeringiz emas.</span>
          </div>
          <button type="button" aria-label="Eslatmani yopish" onClick={() => setNoteOpen(false)} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', color: C.info.text, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ ...S.card, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 280px', maxWidth: 400 }}>
            <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: 12, color: C.textMuted, pointerEvents: 'none' }} />
            <input className="mka-in" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Qidiruv" placeholder="Faktura, mijoz, picker, shartnoma yoki lot" style={{ ...S.input, width: '100%', padding: '0 12px 0 36px' }} />
          </span>
          <SelectBox value={picker} onChange={setPicker} label="Picker bo'yicha filtr" minWidth={168}>
            <option value="">Barcha pickerlar</option>
            {pickers.map((p) => <option key={p} value={p}>{p}</option>)}
          </SelectBox>
          {plannedCount > 0 && (
            <button type="button" aria-pressed={plannedOnly} onClick={() => setPlannedOnly((v) => !v)} style={{ ...S.btnOutline, padding: '0 12px', background: plannedOnly ? C.warning.bg : '#fff', color: plannedOnly ? C.warning.text : C.text, borderColor: plannedOnly ? C.warning.border : C.borderStrong }}>
              <CalendarClock size={16} aria-hidden="true" /> Faqat rejali muddatlilar
            </button>
          )}
          <SelectBox value={sort} onChange={setSort} label="Saralash" icon={ArrowUpDown}>
            <option value="server">Standart tartib</option>
            <option value="oldest">Eng uzoq kutayotgan</option>
            <option value="newest">Eng so'nggi topshirilgan</option>
            <option value="amount">Summa: kattadan kichikka</option>
          </SelectBox>
          {filtersActive && (
            <button type="button" className="mka-ghost" onClick={resetFilters} style={{ height: 36, padding: '0 10px', border: 'none', borderRadius: 6, background: 'transparent', color: C.textBody, font: `500 14px/20px ${FONT}`, display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <X size={16} aria-hidden="true" /> Tozalash
            </button>
          )}
          {showData && (
            <span className="tnum" style={{ marginLeft: 'auto', font: `400 13px/18px ${FONT}`, color: C.text2, whiteSpace: 'nowrap' }}>
              {filtersActive ? `${list.length} / ${all.length} ta` : `${all.length} ta buyurtma`}
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 820 }}>
            <div style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', height: 40, background: C.bgApp, borderBottom: `1px solid ${C.border}`, font: `600 12px/16px ${FONT}`, color: C.text2 }}>
              <span /><Th>Faktura №</Th><Th>Mijoz</Th><Th right>Summa, so'm</Th><Th>Picker · topshirdi</Th><Th>Markirovka vaqti</Th><Th right>Amallar</Th>
            </div>
            {isLoading && [70, 55, 80, 62, 48].map((w) => <SkeletonRow key={w} w={w} />)}
            {showData && list.map((o) => (
              <OrderRow
                key={o.id} order={o} now={now} open={!!open[o.id]}
                onToggle={() => setOpen((p) => ({ ...p, [o.id]: !p[o.id] }))}
                onAccepted={onAccepted} onConflict={onConflict}
              />
            ))}
          </div>
        </div>

        {showData && all.length > 0 && list.length === 0 && (
          <State icon={SearchX} title="Filtrlarga mos buyurtma topilmadi" desc="Qidiruv so'zini o'zgartiring yoki filtrlarni tozalang.">
            <button type="button" className="mka-out" onClick={resetFilters} style={S.btnOutline}>Filtrlarni tozalash</button>
          </State>
        )}
        {showData && all.length === 0 && (
          <State icon={Inbox} title="Hozircha mavjud buyurtmalar yo'q" desc="Yangi buyurtmalar kelib tushganda ular shu yerda ko'rinadi." />
        )}
        {/* API xatosi hech qachon bo'sh ro'yxat sifatida ko'rsatilmaydi */}
        {isError && (
          <State role="alert" danger icon={CloudOff} title="Buyurtmalarni yuklab bo'lmadi" desc="Ma'lumotlarni olishda xatolik yuz berdi. Qayta urinib ko'ring.">
            <button type="button" className="mka-out" onClick={() => refetch()} disabled={isFetching} style={S.btnOutline}>
              <RefreshCw size={16} aria-hidden="true" style={isFetching ? { animation: 'mkspin .9s linear infinite' } : undefined} /> Qayta urinish
            </button>
          </State>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order: o, now, open, onToggle, onAccepted, onConflict }) {
  const P = hasPlanned(o) ? PLANNED[o.urgency] : null;
  const doneAt = o.pickingDoneAt || null;

  const mutation = useMutation({
    mutationFn: () => markerAPI.accept(o.id),
    onSuccess: () => {
      toast.success((t) => (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 500 }}>Buyurtma qabul qilindi</span>
          <span style={{ fontSize: 12, color: C.text2 }}>№ {o.invoiceNumber} · Markirovka vaqti boshlandi: {fmtDuration(o.markingDuration)}</span>
          <Link to="/marker/mine" onClick={() => toast.dismiss(t.id)} style={{ fontSize: 13, fontWeight: 500, color: C.p700 }}>Mening buyurtmalarimga o'tish →</Link>
        </span>
      ), { duration: 5000 });
      onAccepted(o.id);
    },
    onError: (e) => {
      const status = e?.response?.status;
      // 403 — boshqa marker oldi; 400 — order MARKING statusida emas; 404 — topilmadi.
      // Hammasida order bu ro'yxatda endi mavjud emas — qatorni olib tashlab, ro'yxatni yangilaymiz.
      if (status === 403 || status === 400 || status === 404 || status === 409) {
        toast.error(`№ ${o.invoiceNumber}: ${getErrorMessage(e)}. Ro'yxat yangilandi.`, { duration: Infinity });
        onConflict(o.id);
      } else {
        toast.error(getErrorMessage(e));
      }
    },
  });

  const pending = mutation.isPending;
  const details = [
    ['Shartnoma', o.contractNumber, true],
    ['Lot', o.lotNumber, true],
    ['Mijoz telefoni', o.client?.phone],
    ['Picker telefoni', o.assignedPicker?.phone],
    ['Picker topshirgan vaqt', doneAt && format(new Date(doneAt), 'dd.MM.yyyy HH:mm')],
    ['Buyurtma yaratilgan', o.createdAt && format(new Date(o.createdAt), 'dd.MM.yyyy HH:mm')],
    ['Operator', o.createdBy?.fullName],
    ['Rejali muddat', o.markingDeadline ? format(new Date(o.markingDeadline), 'dd.MM.yyyy HH:mm') : 'Belgilanmagan'],
  ];

  return (
    <div style={{ borderBottom: `1px solid ${C.border}`, background: open ? C.bgApp : '#fff' }}>
      <div className="mka-row" style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', minHeight: 56 }}>
        <span style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="button" className="mka-ib" onClick={onToggle} aria-expanded={open} aria-label={open ? 'Tafsilotlarni yopish' : 'Tafsilotlarni ochish'} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', color: C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .18s' }}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </span>
        <Td><span style={{ font: `500 13px/18px ${MONO}` }}>{o.invoiceNumber}</span></Td>
        <Td col>
          <span className="mk-ellipsis" style={{ font: `500 14px/20px ${FONT}` }}>{o.client?.orgName || '—'}</span>
          <span className="mk-ellipsis" style={S.muted}>{o.client?.inn ? `INN ${o.client.inn}` : "INN ko'rsatilmagan"}</span>
        </Td>
        <Td right><span className="tnum">{formatSum(o.totalAmount)}</span></Td>
        <Td col>
          <span className="mk-ellipsis" style={{ font: `500 13px/18px ${FONT}`, color: o.assignedPicker ? C.text : C.textMuted }}>{o.assignedPicker?.fullName || '—'}</span>
          <span className="mk-ellipsis" style={S.muted}>
            {doneAt ? <><span className="tnum" style={{ color: C.textBody }}>{format(new Date(doneAt), 'HH:mm')}</span> · {fmtAgo(doneAt, now)}</> : 'Topshirilgan vaqt yo‘q'}
          </span>
        </Td>
        <Td col>
          <span className="tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `500 13px/18px ${FONT}`, whiteSpace: 'nowrap' }}><Timer size={16} aria-hidden="true" style={{ color: C.text2 }} />{fmtDuration(o.markingDuration)}</span>
          {P && (
            <span title={`Rejali muddat: ${format(new Date(o.markingDeadline), 'HH:mm')}. Sizning markirovka vaqtingiz qabul qilgandan keyin alohida hisoblanadi.`} style={{ alignSelf: 'flex-start', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4, height: 20, padding: '0 6px', borderRadius: 4, font: `500 12px/16px ${FONT}`, background: P.bg, color: P.fg, border: `1px solid ${P.bd}`, whiteSpace: 'nowrap' }}>
              <CalendarClock size={12} aria-hidden="true" />Rejali: {P.label}
            </span>
          )}
        </Td>
        <span style={{ padding: '0 12px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {o.productsExcelUrl && (
            <a className="mka-xl" href={`${API_ORIGIN}${o.productsExcelUrl}`} target="_blank" rel="noreferrer" aria-label="Mahsulotlar Excel faylini ochish" title="Mahsulotlar Excel fayli" style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.borderStrong}`, background: '#fff', color: C.success.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={16} aria-hidden="true" />
            </a>
          )}
          <button type="button" className="mka-pri" onClick={() => { if (!pending) mutation.mutate(); }} disabled={pending} aria-busy={pending} style={{ height: 32, minWidth: 124, padding: '0 12px', borderRadius: 6, border: `1px solid ${pending ? C.p800 : C.p700}`, background: pending ? C.p800 : C.p700, color: '#fff', font: `500 13px/18px ${FONT}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: pending ? 'progress' : 'pointer' }}>
            {pending ? <LoaderCircle size={16} aria-hidden="true" style={{ animation: 'mkspin .9s linear infinite' }} /> : <Check size={16} aria-hidden="true" />}
            {pending ? 'Qabul qilinmoqda…' : 'Qabul qilish'}
          </button>
        </span>
      </div>
      {open && (
        <div style={{ padding: '4px 16px 16px 48px', display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '12px 24px' }}>
          {details.map(([k, v, mono]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span style={S.muted}>{k}</span>
              <span className="mk-ellipsis" style={{ font: `500 13px/18px ${mono ? MONO : FONT}`, color: v && v !== 'Belgilanmagan' ? C.text : C.textMuted }}>{v || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, icon: Icon, value, note, iconColor = C.textMuted, valueColor = C.text }) {
  return (
    <div style={{ ...S.card, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: `500 13px/18px ${FONT}`, color: C.text2 }}>{label}</span>
        <Icon size={16} aria-hidden="true" style={{ color: iconColor }} />
      </div>
      <span className="tnum" style={{ font: `700 24px/28px ${FONT}`, color: valueColor, overflowWrap: 'anywhere' }}>{value}</span>
      <span style={S.muted}>{note}</span>
    </div>
  );
}

function SelectBox({ value, onChange, label, icon: Icon, minWidth, children }) {
  return (
    <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      {Icon && <Icon size={16} aria-hidden="true" style={{ position: 'absolute', left: 12, color: C.text2, pointerEvents: 'none' }} />}
      <select className="mka-in" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} style={{ ...S.input, appearance: 'none', padding: `0 32px 0 ${Icon ? 36 : 12}px`, cursor: 'pointer', minWidth }}>
        {children}
      </select>
      <ChevronDown size={16} aria-hidden="true" style={{ position: 'absolute', right: 10, color: C.text2, pointerEvents: 'none' }} />
    </span>
  );
}

function Th({ children, right, pad = 12 }) {
  return <span style={{ padding: `0 ${pad}px`, textAlign: right ? 'right' : 'left' }}>{children}</span>;
}
function Td({ children, right, col }) {
  return <span style={{ padding: '0 12px', minWidth: 0, display: col ? 'flex' : 'block', flexDirection: col ? 'column' : undefined, gap: col ? 2 : undefined, textAlign: right ? 'right' : 'left', font: `400 14px/20px ${FONT}` }}>{children}</span>;
}

function SkeletonRow({ w }) {
  const bar = (width, extra) => <span style={{ display: 'block', height: 10, width, borderRadius: 4, background: C.surface2, ...extra }} />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', height: 56, borderBottom: `1px solid ${C.border}` }}>
      <span />
      <span style={{ padding: '0 12px' }}>{bar('70%')}</span>
      <span style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}><span className="mka-shim" style={{ display: 'block', height: 10, width: `${w}%`, borderRadius: 4 }} />{bar('35%', { height: 8 })}</span>
      <span style={{ padding: '0 12px' }}>{bar('70%', { marginLeft: 'auto' })}</span>
      <span style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>{bar('60%')}{bar('40%', { height: 8 })}</span>
      <span style={{ padding: '0 12px' }}>{bar('60%')}</span>
      <span style={{ padding: '0 12px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <span style={{ width: 32, height: 32, borderRadius: 6, background: C.surface2 }} />
        <span style={{ width: 124, height: 32, borderRadius: 6, background: C.surface2 }} />
      </span>
    </div>
  );
}

function State({ icon: Icon, title, desc, danger, role, children }) {
  return (
    <div role={role} style={{ padding: '56px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      <span style={{ width: 44, height: 44, borderRadius: '50%', background: danger ? C.danger.bg : C.surface2, color: danger ? C.danger.main : C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span style={{ font: `600 16px/24px ${FONT}` }}>{title}</span>
      <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2 }}>{desc}</span>
      {children && <div style={{ marginTop: 4 }}>{children}</div>}
    </div>
  );
}
