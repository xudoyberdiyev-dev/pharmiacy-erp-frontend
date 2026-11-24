import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { format, subDays, addDays } from 'date-fns';
import {
  History, Search, X, RefreshCw, CloudOff, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, TimerOff,
  Clock, Package, FileSpreadsheet, SearchX,
} from 'lucide-react';
import { markerAPI } from '../../api';
import { FILE_BASE_URL } from '../../api/axios';
import { formatSum } from '../../lib/format';
import { C, FONT, MONO } from './design/tokens';

// ─────────────────────────────────────────────────────────────────────────
// Tarix — markirovkasi yakunlangan buyurtmalar (dizaynda alohida ekran yo'q,
// Royal Blue tizimi asosida). Backend GET /marker/orders/history?date=YYYY-MM-DD
// kunni server vaqti (UTC) bo'yicha kesadi — Toshkent (UTC+5) bilan 5 soat
// farq. Backendni o'zgartirmaslik uchun tanlangan kun va undan oldingi kun
// olinadi va natija brauzerning mahalliy kuni bo'yicha filtrlanadi.
// ─────────────────────────────────────────────────────────────────────────

const ymd = (d) => format(d, 'yyyy-MM-dd');
const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

const CSS = `
.mkh-out:hover:not(:disabled){background:${C.bgApp};border-color:${C.borderHover}}
.mkh-out:disabled{color:${C.textDisabled};cursor:not-allowed}
.mkh-in:hover{border-color:${C.borderHover}}
.mkh-in:focus{border-color:${C.p700};box-shadow:0 0 0 3px rgba(59,130,246,.25)}
.mkh-row:hover{background:${C.bgApp}}
.mkh-link:hover{background:${C.success.bg};border-color:${C.success.border}}
@keyframes mkspin{to{transform:rotate(360deg)}}
@keyframes mkshimmer{0%{background-position:-480px 0}100%{background-position:480px 0}}
.mkh-shim{background:linear-gradient(90deg,${C.surface2} 0,${C.border} 50%,${C.surface2} 100%);background-size:960px 100%;animation:mkshimmer 1.4s linear infinite}
`;

const COLS = '128px minmax(0,1.4fr) minmax(0,1fr) 96px 96px 150px 128px 48px';
const btn = { height: 36, padding: '0 14px', borderRadius: 6, border: `1px solid ${C.borderStrong}`, background: '#fff', color: C.text, font: `500 14px/20px ${FONT}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' };

export default function MarkerHistoryPage() {
  const todayKey = ymd(new Date());
  const [day, setDay] = useState(todayKey);
  const [q, setQ] = useState('');
  const [result, setResult] = useState('all'); // all | ontime | late
  const prevKey = ymd(subDays(parseYmd(day), 1));

  const [cur, prev] = useQueries({
    queries: [day, prevKey].map((d) => ({
      queryKey: ['marker-history', d],
      queryFn: () => markerAPI.getHistory({ date: d }),
      select: (r) => r.data?.data || [],
      refetchInterval: d === todayKey ? 30000 : false,
    })),
  });

  const isLoading = cur.isLoading || prev.isLoading;
  const isError = (cur.isError && !cur.data) || (prev.isError && !prev.data);
  const isFetching = cur.isFetching || prev.isFetching;
  const refetch = () => { cur.refetch(); prev.refetch(); };
  const updatedAt = Math.max(cur.dataUpdatedAt || 0, prev.dataUpdatedAt || 0);

  // Ikki so'rov natijasi → takrorlarsiz, faqat tanlangan mahalliy kun
  const rows = useMemo(() => {
    const map = new Map();
    [...(prev.data || []), ...(cur.data || [])].forEach((o) => {
      if (o.markingDoneAt && ymd(new Date(o.markingDoneAt)) === day) map.set(o.id, o);
    });
    return [...map.values()].sort((a, b) => new Date(b.markingDoneAt) - new Date(a.markingDoneAt));
  }, [cur.data, prev.data, day]);

  const late = rows.filter((o) => o.isLate);
  const avgLate = late.length ? Math.round(late.reduce((s, o) => s + (o.diffMins || 0), 0) / late.length) : 0;

  const list = rows.filter((o) => {
    if (result === 'ontime' && o.isLate) return false;
    if (result === 'late' && !o.isLate) return false;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [o.invoiceNumber, o.client?.orgName, o.assignedPicker?.fullName, o.contractNumber, o.lotNumber]
      .some((v) => v && String(v).toLowerCase().includes(s));
  });
  const filtersActive = !!(q.trim() || result !== 'all');
  const isToday = day === todayKey;
  const showData = !isLoading && !isError;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0, font: `400 14px/20px ${FONT}`, color: C.text }}>
      <style>{CSS}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h1 style={{ margin: 0, font: `600 24px/32px ${FONT}`, letterSpacing: '-0.01em' }}>Tarix</h1>
          <p style={{ margin: 0, color: C.text2 }}>Markirovkasi yakunlangan buyurtmalar va o'z vaqtidagi natijangiz</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="mkh-out" style={{ ...btn, width: 36, padding: 0 }} aria-label="Oldingi kun" title="Oldingi kun" onClick={() => setDay(ymd(subDays(parseYmd(day), 1)))}>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <label style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <CalendarDays size={16} aria-hidden="true" style={{ position: 'absolute', left: 12, color: C.text2, pointerEvents: 'none' }} />
            <input
              type="date"
              className="mkh-in"
              value={day}
              max={todayKey}
              aria-label="Kun"
              onChange={(e) => e.target.value && setDay(e.target.value)}
              style={{ height: 36, padding: '0 10px 0 36px', border: `1px solid ${C.borderStrong}`, borderRadius: 6, font: `500 14px/20px ${FONT}`, color: C.text, outline: 'none', background: '#fff' }}
            />
          </label>
          <button type="button" className="mkh-out" style={{ ...btn, width: 36, padding: 0 }} aria-label="Keyingi kun" title="Keyingi kun" disabled={isToday} onClick={() => setDay(ymd(addDays(parseYmd(day), 1)))}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          {!isToday && <button type="button" className="mkh-out" style={btn} onClick={() => setDay(todayKey)}>Bugun</button>}
          <button type="button" className="mkh-out" style={btn} onClick={refetch} disabled={isFetching}>
            <RefreshCw size={16} aria-hidden="true" style={isFetching ? { animation: 'mkspin .9s linear infinite' } : undefined} />
            {isFetching ? 'Yangilanmoqda…' : 'Yangilash'}
          </button>
        </div>
      </div>

      {showData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
          <Stat label="Yakunlangan" Icon={Package} value={rows.length} note={format(parseYmd(day), 'dd.MM.yyyy')} />
          <Stat label="O'z vaqtida" Icon={CircleCheck} iconColor={C.success.main} valueColor={C.success.text} value={rows.length - late.length} note="Muddatdan kech qolmagan" />
          <Stat label="Kechikkan" Icon={TimerOff} iconColor={C.danger.main} valueColor={C.danger.text} value={late.length} note="Muddatdan keyin yakunlangan" />
          <Stat label="O'rtacha kechikish" Icon={Clock} iconColor={C.warning.main} value={late.length ? `${avgLate} daq` : '—'} note="Faqat kechikkanlar bo'yicha" />
        </div>
      )}

      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: '1 1 260px', maxWidth: 400 }}>
            <Search size={16} aria-hidden="true" style={{ position: 'absolute', left: 12, color: C.textMuted, pointerEvents: 'none' }} />
            <input className="mkh-in" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Qidiruv" placeholder="Faktura, mijoz, picker, shartnoma yoki lot" disabled={!showData || rows.length === 0} style={{ width: '100%', height: 36, padding: '0 12px 0 36px', border: `1px solid ${C.borderStrong}`, borderRadius: 6, font: `400 14px/20px ${FONT}`, outline: 'none' }} />
          </span>
          <div role="group" aria-label="Natija bo'yicha filtr" style={{ display: 'flex', gap: 4, padding: 4, background: C.surface2, borderRadius: 8 }}>
            {[['all', 'Barchasi', rows.length], ['ontime', "O'z vaqtida", rows.length - late.length], ['late', 'Kechikkan', late.length]].map(([id, label, n]) => (
              <button key={id} type="button" aria-pressed={result === id} onClick={() => setResult(id)} style={{ height: 28, padding: '0 10px', border: 'none', borderRadius: 6, font: `500 13px/18px ${FONT}`, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, background: result === id ? '#fff' : 'transparent', color: result === id ? C.text : C.text2, boxShadow: result === id ? '0 1px 2px rgba(15,23,42,0.06)' : 'none' }}>
                {label}<span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>{showData ? n : '–'}</span>
              </button>
            ))}
          </div>
          {filtersActive && (
            <button type="button" className="mkh-out" onClick={() => { setQ(''); setResult('all'); }} style={{ ...btn, border: 'none', background: 'transparent', padding: '0 10px' }}>
              <X size={16} aria-hidden="true" />Tozalash
            </button>
          )}
          <span className="tnum" style={{ marginLeft: 'auto', font: `400 12px/16px ${FONT}`, color: C.text2, whiteSpace: 'nowrap' }}>
            Oxirgi yangilanish: <span style={{ color: C.text, fontWeight: 500 }}>{updatedAt ? format(new Date(updatedAt), 'HH:mm:ss') : '—'}</span>
          </span>
        </div>

        {isError ? (
          <State role="alert" danger Icon={CloudOff} title="Tarixni yuklab bo'lmadi" desc="Ma'lumotlarni olishda xatolik yuz berdi. Bu ro'yxat bo'sh degani emas — qayta urinib ko'ring.">
            <button type="button" className="mkh-out" style={btn} onClick={refetch} disabled={isFetching}><RefreshCw size={16} aria-hidden="true" />Qayta urinish</button>
          </State>
        ) : showData && rows.length === 0 ? (
          <State Icon={History} title="Bu kunda yakunlangan buyurtmalar yo'q" desc={`${format(parseYmd(day), 'dd.MM.yyyy')} kuni markirovkasini yakunlagan buyurtmalaringiz shu yerda ko'rinadi.`} />
        ) : showData && list.length === 0 ? (
          <State Icon={SearchX} title="Filtrlarga mos buyurtma topilmadi" desc="Qidiruv so'zini o'zgartiring yoki filtrlarni tozalang.">
            <button type="button" className="mkh-out" style={btn} onClick={() => { setQ(''); setResult('all'); }}>Filtrlarni tozalash</button>
          </State>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 900 }}>
              <div style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', height: 40, background: C.bgApp, borderBottom: `1px solid ${C.border}`, font: `600 12px/16px ${FONT}`, color: C.text2 }}>
                <Cell>Faktura №</Cell><Cell>Mijoz</Cell><Cell>Picker</Cell><Cell right>Muddat</Cell><Cell right>Yakunlandi</Cell><Cell>Natija</Cell><Cell right>Summa, so'm</Cell><Cell />
              </div>
              {isLoading
                ? [70, 55, 80, 62].map((w) => (
                  <div key={w} style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', height: 52, borderBottom: `1px solid ${C.border}` }}>
                    {[60, w, 50, 50, 50, 70, 60, 0].map((x, i) => (
                      <span key={i} style={{ padding: '0 12px' }}>{x ? <span className={i === 1 ? 'mkh-shim' : undefined} style={{ display: 'block', height: 10, width: `${x}%`, borderRadius: 4, background: i === 1 ? undefined : C.surface2 }} /> : null}</span>
                    ))}
                  </div>
                ))
                : list.map((o) => (
                  <div key={o.id} className="mkh-row" style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', minHeight: 52, borderBottom: `1px solid ${C.border}` }}>
                    <Cell><span style={{ font: `500 13px/18px ${MONO}` }}>{o.invoiceNumber}</span></Cell>
                    <Cell col>
                      <span className="mk-ellipsis" title={o.client?.orgName} style={{ font: `500 14px/20px ${FONT}` }}>{o.client?.orgName || '—'}</span>
                      <span className="mk-ellipsis" style={{ font: `400 12px/16px ${MONO}`, color: C.textMuted }}>{[o.contractNumber, o.lotNumber].filter(Boolean).join(' · ') || '—'}</span>
                    </Cell>
                    <Cell><span className="mk-ellipsis" style={{ display: 'block', font: `400 13px/18px ${FONT}`, color: o.assignedPicker ? C.text : C.textMuted }}>{o.assignedPicker?.fullName || '—'}</span></Cell>
                    <Cell right><span className="tnum">{o.markingDeadline ? format(new Date(o.markingDeadline), 'HH:mm') : '—'}</span></Cell>
                    <Cell right><span className="tnum" style={{ fontWeight: 500 }}>{format(new Date(o.markingDoneAt), 'HH:mm')}</span></Cell>
                    <Cell><ResultBadge o={o} /></Cell>
                    <Cell right><span className="tnum">{formatSum(o.totalAmount)}</span></Cell>
                    <Cell>
                      {o.markedExcelUrl ? (
                        <a className="mkh-link" href={`${FILE_BASE_URL}${o.markedExcelUrl}`} target="_blank" rel="noreferrer" aria-label={`${o.invoiceNumber} — yuklangan markirovka faylini ochish`} title="Yuklangan markirovka fayli" style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.borderStrong}`, background: '#fff', color: C.success.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileSpreadsheet size={16} aria-hidden="true" />
                        </a>
                      ) : <span title="Fayl yuklanmagan" style={{ color: C.textDisabled, display: 'flex', justifyContent: 'center' }}>—</span>}
                    </Cell>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultBadge({ o }) {
  const late = o.isLate;
  const t = late ? C.danger : C.success;
  const Icon = late ? TimerOff : CircleCheck;
  const mins = o.diffMins || 0;
  const label = late ? `${mins} daq kech` : mins > 0 ? `${mins} daq oldin` : "O'z vaqtida";
  return (
    <span className="tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 8px', borderRadius: 4, font: `500 12px/16px ${FONT}`, background: t.bg, color: t.text, border: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>
      <Icon size={14} aria-hidden="true" />{label}
    </span>
  );
}

function Cell({ children, right, col }) {
  return <span style={{ padding: '0 12px', minWidth: 0, display: col ? 'flex' : 'block', flexDirection: col ? 'column' : undefined, gap: col ? 2 : undefined, textAlign: right ? 'right' : 'left', font: `400 14px/20px ${FONT}` }}>{children}</span>;
}

function Stat({ label, Icon, value, note, iconColor = C.textMuted, valueColor = C.text }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ font: `500 13px/18px ${FONT}`, color: C.text2 }}>{label}</span>
        <Icon size={16} aria-hidden="true" style={{ color: iconColor }} />
      </div>
      <span className="tnum" style={{ font: `700 24px/28px ${FONT}`, color: valueColor }}>{value}</span>
      <span style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>{note}</span>
    </div>
  );
}

function State({ Icon, title, desc, danger, role, children }) {
  return (
    <div role={role} style={{ padding: '56px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      <span style={{ width: 44, height: 44, borderRadius: '50%', background: danger ? C.danger.bg : C.surface2, color: danger ? C.danger.main : C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span style={{ font: `600 16px/24px ${FONT}` }}>{title}</span>
      {desc && <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2, maxWidth: 440 }}>{desc}</span>}
      {children && <div style={{ marginTop: 4 }}>{children}</div>}
    </div>
  );
}
