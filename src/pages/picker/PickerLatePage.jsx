import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft, ChevronRight, CalendarDays, PackageCheck, CircleCheck, Check, TriangleAlert, Clock, CircleHelp,
  RotateCcw, Info, Eye, CalendarX, MousePointerClick,
} from 'lucide-react';
import { pickerAPI } from '../../api';
import { C } from './design/tokens';
import {
  Chip, Btn, RefreshButton, RefreshStatus, OfflineBanner, SearchBox, Segment, SortSelect, StateBlock, RetryButton,
  SkeletonRows, FactList, InspectorBody, InspectorPlaceholder, refreshState,
} from './design/ui';
import Workspace, { workspaceMode, inspectorWidth } from './design/Workspace';
import { hm, dayLabel, shiftDay, todayISO, sum as fmtSum } from './lib/time';

const R = {
  early:    [CircleCheck, C.successSoft, C.success],
  ontime:   [Check, C.successSoft, C.success],
  late:     [TriangleAlert, C.dangerSoft, C.danger],
  unknown:  [CircleHelp, C.surfaceMuted, C.textBody],
  returned: [RotateCcw, C.warningSoft, C.warning],
};

function resultOf(o) {
  if (o.wasReturned) return { res: 'returned', n: null };
  if (o.diffMinutes == null) return { res: 'unknown', n: null };
  if (o.diffMinutes > 0) return { res: 'late', n: o.diffMinutes };
  if (o.diffMinutes < 0) return { res: 'early', n: -o.diffMinutes };
  return { res: 'ontime', n: 0 };
}

function rtext(res, n) {
  if (res === 'early') return `${n} daqiqa erta`;
  if (res === 'ontime') return 'Muddatida';
  if (res === 'late') return `${n} daqiqa kech`;
  if (res === 'returned') return 'Qaytarilgan';
  return 'Natija mavjud emas';
}

const SORTS = [
  { value: 'newest', label: 'Eng yangi' },
  { value: 'oldest', label: 'Eng eski' },
  { value: 'result', label: 'Kechikish bo‘yicha' },
];

function navWidth(vw) {
  if (vw < 640) return 0;
  if (vw < 1280) return 80;
  return vw >= 1600 ? 248 : 76;
}

export default function PickerLatePage() {
  const { vw, online } = useOutletContext();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [selId, setSelId] = useState(null);

  const query = useQuery({
    queryKey: ['picker-history', date],
    queryFn: () => pickerAPI.getHistory({ date }),
    select: (r) => r.data,
    refetchInterval: date === today ? 60000 : false,
  });

  useEffect(() => { setSelId(null); }, [date]);

  const recs = useMemo(() => (query.data?.data || []).map((o) => ({ ...o, ...resultOf(o) })), [query.data]);
  const st = query.data?.stats;
  const cnt = useMemo(() => {
    const c = { early: 0, ontime: 0, late: 0, unknown: 0, returned: 0 };
    recs.forEach((r) => { c[r.res] += 1; });
    return c;
  }, [recs]);
  const onTime = cnt.early + cnt.ontime;

  const vis = useMemo(() => {
    const s = q.trim().toLowerCase();
    const t = (o) => new Date(o.pickingDoneAt).getTime();
    const list = recs.filter((r) => {
      if (filter === 'ontime' && !(r.res === 'early' || r.res === 'ontime')) return false;
      if (filter !== 'all' && filter !== 'ontime' && r.res !== filter) return false;
      return !s || String(r.invoiceNumber || '').toLowerCase().includes(s) || (r.client?.orgName || '').toLowerCase().includes(s);
    });
    return list.sort((a, b) => {
      if (sort === 'oldest') return t(a) - t(b);
      if (sort === 'result') return ((b.res === 'late' ? b.n : -1) - (a.res === 'late' ? a.n : -1)) || t(b) - t(a);
      return t(b) - t(a);
    });
  }, [recs, q, filter, sort]);

  const mode = workspaceMode(vw);
  const mobile = mode === 'mobile';
  const listW = vw - navWidth(vw) - (mode === 'split' ? inspectorWidth(vw, mode) : 0);
  const showTable = !mobile && listW >= 700;
  const showSumCol = listW >= 900;
  const compactF = mobile || listW < 820;
  const sel = recs.find((r) => r.id === selId) || null;

  const loading = query.isLoading;
  const isError = query.isError && !query.data;
  const ready = !loading && !isError;
  const rs = refreshState(query, online);
  const statsOk = ready && !!st;

  const timedLate = recs.filter((r) => r.res === 'late');
  const avgLate = timedLate.length ? Math.round(timedLate.reduce((s, r) => s + r.n, 0) / timedLate.length) : null;
  const kpis = [
    ['Jami', statsOk ? recs.length - cnt.returned : '—', statsOk ? 'ta' : '', PackageCheck, C.text2],
    ['O‘z vaqtida', statsOk ? onTime : '—', statsOk ? 'ta' : '', CircleCheck, C.success],
    ['Kechikkan', statsOk ? cnt.late : '—', statsOk ? 'ta' : '', TriangleAlert, C.danger],
    ['O‘rtacha kechikish', statsOk ? (avgLate == null ? '—' : avgLate) : '—', statsOk && avgLate != null ? 'daq' : '', Clock, C.text2],
  ];
  const tot = recs.length || 1;
  const dist = [['Erta / muddatida', onTime, C.primary], ['Kechikkan', cnt.late, C.danger], ['Aniqlanmagan', cnt.unknown, '#94A3B8'], ['Qaytarish hodisasi', cnt.returned, C.warning]]
    .filter((d) => d[1] > 0).map(([label, n, c]) => ({ label, n, c, w: `${((n / tot) * 100).toFixed(1)}%` }));

  const filters = [
    { key: 'all', label: 'Barchasi', short: 'Barchasi', count: ready ? recs.length : '—' },
    { key: 'ontime', label: 'O‘z vaqtida', short: 'O‘z vaqtida', count: ready ? onTime : '—' },
    { key: 'late', label: 'Kechikkan', short: 'Kechikkan', count: ready ? cnt.late : '—' },
    { key: 'unknown', label: 'Aniqlanmagan', short: 'Noma’lum', count: ready ? cnt.unknown : '—' },
    { key: 'returned', label: 'Qaytarilgan', short: 'Qaytgan', count: ready ? cnt.returned : '—' },
  ];

  const goDate = (iso) => { if (!iso || iso > today) return; setDate(iso); };

  const dateNav = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      <div role="group" aria-label="Sana navigatsiyasi" style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#FFFFFF', border: `1px solid ${C.borderStrong}`, borderRadius: 12, padding: 0, flex: mobile ? '1 1 100%' : '0 0 auto' }}>
        <button type="button" className="pk-icon" style={{ border: 'none', background: 'transparent' }} onClick={() => goDate(shiftDay(date, -1))} disabled={!online} aria-label="Oldingi kun"><ChevronLeft size={20} aria-hidden="true" /></button>
        <label style={{ position: 'relative', flex: 1, minWidth: 170, display: 'flex', alignItems: 'center', gap: 10, height: 48, padding: '0 8px', cursor: 'pointer' }}>
          <CalendarDays size={20} color={C.primary} aria-hidden="true" />
          <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span className="tnum" style={{ fontWeight: 600, fontSize: 15 }}>{dayLabel(date)}</span>
            <span style={{ fontSize: 12, color: C.text2 }}>Toshkent · UTC+5</span>
          </span>
          <input type="date" aria-label="Sanani tanlash" value={date} max={today} disabled={!online} onChange={(e) => goDate(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }} />
        </label>
        <button type="button" className="pk-icon" style={{ border: 'none', background: 'transparent' }} onClick={() => goDate(shiftDay(date, 1))} disabled={!online || date >= today} aria-label="Keyingi kun"><ChevronRight size={20} aria-hidden="true" /></button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[['Bugun', today], ['Kecha', shiftDay(today, -1)]].map(([l, iso]) => {
          const on = date === iso;
          return (
            <button key={l} type="button" className="pk-btn" aria-pressed={on} onClick={() => goDate(iso)} disabled={!online}
              style={{ height: 48, padding: '0 16px', fontSize: 14, border: `1px solid ${on ? C.primary : C.borderStrong}`, background: on ? C.primarySoft : '#FFFFFF', color: on ? C.primaryHover : C.text }}>{l}</button>
          );
        })}
      </div>
    </div>
  );

  const kpiPanel = (
    <section aria-label="Kunlik natijalar" style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 16, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,minmax(0,1fr))' : 'repeat(4,minmax(0,1fr))', gap: mobile ? '12px 0' : 0, padding: mobile ? '12px 4px' : '14px 4px' }}>
        {kpis.map(([label, value, unit, Icon, ic], i) => (
          <div key={label} style={{ padding: mobile ? '0 12px' : '0 16px', borderLeft: i === 0 || (mobile && i === 2) ? 'none' : `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.text2, whiteSpace: 'nowrap' }}><Icon size={16} color={ic} aria-hidden="true" />{label}</span>
            {loading
              ? <span className="pk-skel" style={{ width: 48, height: 26, borderRadius: 6 }} />
              : <span className="tnum" style={{ fontSize: mobile ? 22 : 26, fontWeight: 700, lineHeight: 1.15, color: statsOk ? C.text : C.textMuted }}>{value}<span style={{ fontSize: 14, fontWeight: 500, color: C.text2 }}> {unit}</span></span>}
          </div>
        ))}
      </div>
      {ready && recs.length > 0 && dist.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div role="img" aria-label={`Taqsimot: ${dist.map((d) => `${d.label} ${d.n}`).join(', ')}`} style={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', gap: 2 }}>
            {dist.map((d) => <span key={d.label} style={{ width: d.w, background: d.c }} />)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: 13, color: C.text2 }}>
            {dist.map((d) => <span key={d.label} className="tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 2, background: d.c }} />{d.label} · {d.n}</span>)}
          </div>
        </div>
      )}
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: C.text2 }}>
        <Info size={16} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />
        <span>Qaytarish hodisalari «Jami» va «O‘z vaqtida»ga kirmaydi. O‘rtacha kechikish faqat kechikkan buyurtmalar bo‘yicha. Filtrlar ko‘rsatkichlarni o‘zgartirmaydi.</span>
      </div>
    </section>
  );

  let body;
  if (loading) body = <SkeletonRows n={6} h={showTable ? 56 : 92} />;
  else if (isError) body = <StateBlock kind="error" title="Buyurtmalar tarixini yuklab bo‘lmadi." desc="Server javob bermadi. Bu sanada yozuv yo‘q degani emas." action={<RetryButton onClick={() => query.refetch()} />} />;
  else if (recs.length === 0) body = <StateBlock icon={CalendarX} title="Bu sanada yakunlangan buyurtmalar yo‘q." desc={`${dayLabel(date)} · Toshkent vaqti`} action={date !== today ? <Btn variant="outline" onClick={() => setDate(today)}>Bugunga qaytish</Btn> : null} />;
  else if (vis.length === 0) body = <StateBlock kind="search" title="Qidiruvga mos buyurtma topilmadi." desc={`Qidiruv faqat ${dayLabel(date)} yozuvlari ichida.`} action={<Btn variant="outline" onClick={() => { setQ(''); setFilter('all'); }}>Filtrlarni tozalash</Btn>} />;
  else if (showTable) {
    const th = { textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.textMuted, padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: C.canvas, position: 'sticky', top: 0, whiteSpace: 'nowrap' };
    body = (
      <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', opacity: online ? 1 : 0.75 }}>
        <table aria-label="Buyurtmalar tarixi" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr>
            <th scope="col" style={th}>Faktura</th><th scope="col" style={th}>Mijoz</th><th scope="col" style={th}>Yakunlangan</th><th scope="col" style={th}>Muddat</th><th scope="col" style={th}>Vaqt natijasi</th>
            {showSumCol && <th scope="col" style={{ ...th, textAlign: 'right' }}>Summa</th>}
          </tr></thead>
          <tbody>
            {vis.map((r) => {
              const [I, bg, fg] = R[r.res];
              const on = r.id === selId;
              const td = { padding: '12px 14px', borderBottom: `1px solid ${C.border}`, background: on ? C.primarySoft : '#FFFFFF', verticalAlign: 'middle' };
              const s = fmtSum(r.totalAmount);
              return (
                <tr key={r.id} className="pk-tr" aria-selected={on} tabIndex={0} onClick={() => setSelId(r.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelId(r.id); } }}>
                  <td className="tnum" style={{ ...td, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: on ? `inset 3px 0 0 ${C.primary}` : 'none' }}>№ {r.invoiceNumber}</td>
                  <td style={{ ...td, color: C.textBody, overflowWrap: 'anywhere' }}>{r.client?.orgName}</td>
                  <td className="tnum" style={td}>{hm(r.pickingDoneAt)}</td>
                  <td className="tnum" style={{ ...td, color: r.wasReturned ? C.textMuted : C.text }}>{r.wasReturned ? '—' : hm(r.pickingDeadline)}</td>
                  <td style={td}><Chip size="sm" icon={I} bg={bg} fg={fg}>{rtext(r.res, r.n)}</Chip></td>
                  {showSumCol && <td className="tnum" style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap', color: s ? C.text : C.textMuted }}>{s ? `${s} so‘m` : '—'}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  } else {
    body = (
      <div role="list" aria-label="Buyurtmalar tarixi" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {vis.map((r) => {
          const [I, bg, fg] = R[r.res];
          const on = r.id === selId;
          return (
            <div role="listitem" key={r.id}>
              <button type="button" className="pk-row" aria-pressed={on} onClick={() => setSelId(r.id)}
                aria-label={`Faktura ${r.invoiceNumber}, ${r.client?.orgName || ''}, yakunlangan ${hm(r.pickingDoneAt)}, ${rtext(r.res, r.n)}`}
                style={{ width: '100%', textAlign: 'left', background: on ? C.primarySoft : '#FFFFFF', border: `1px solid ${on ? C.primary : C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'center', color: C.text }}>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="tnum" style={{ fontSize: 16, fontWeight: 700 }}>№ {r.invoiceNumber}</span>
                    <Chip size="sm" icon={I} bg={bg} fg={fg}>{rtext(r.res, r.n)}</Chip>
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: C.textBody, overflowWrap: 'anywhere' }}>{r.client?.orgName}</span>
                  <span className="tnum" style={{ fontSize: 13, color: C.text2 }}>Yakunlangan {hm(r.pickingDoneAt)} · muddat {r.wasReturned ? '—' : hm(r.pickingDeadline)}</span>
                </span>
                {mobile && <ChevronRight size={18} color={C.textMuted} aria-hidden="true" />}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  let inspector = null;
  if (sel) {
    const [I, bg, fg] = R[sel.res];
    const s = fmtSum(sel.totalAmount);
    const notes = {
      unknown: 'Muddat maydoni bo‘sh — vaqt natijasini aniqlab bo‘lmadi.',
      returned: 'Qaytarish hodisasida vaqt natijasi hisoblanmaydi.',
    };
    const tbg = sel.res === 'late' ? C.dangerBg : sel.res === 'returned' ? C.warningBg : C.canvas;
    const tbd = sel.res === 'late' ? C.dangerLine : sel.res === 'returned' ? C.warningLine : C.border;
    const na = 'Ma’lumot mavjud emas';
    inspector = (
      <InspectorBody mobile={mobile}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, color: C.text2, fontWeight: 500 }}>Faktura</span><Chip size="sm" icon={Eye}>Faqat ko‘rish uchun</Chip></div>
          <h2 className="tnum" style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1.1, overflowWrap: 'anywhere' }}>№ {sel.invoiceNumber}</h2>
          <div style={{ fontSize: 16, fontWeight: 500, color: C.textBody, overflowWrap: 'anywhere' }}>{sel.client?.orgName}</div>
          <div className="tnum" style={{ fontSize: 14, color: C.text2 }}>Yakunlangan: {dayLabel(date)}, {hm(sel.pickingDoneAt)} (Toshkent)</div>
        </div>
        <section aria-labelledby="ph-tp" style={{ border: `1px solid ${tbd}`, background: tbg, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <h3 id="ph-tp" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Vaqt natijasi</h3>
            <Chip icon={I} bg={bg} fg={fg}>{rtext(sel.res, sel.n)}</Chip>
          </div>
          <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
            {[
              ['Qabul qilingan', sel.pickingStartedAt ? hm(sel.pickingStartedAt) : na],
              ['Berilgan vaqt', sel.pickingDuration ? `${sel.pickingDuration} daqiqa` : na],
              ['Muddat', sel.wasReturned ? na : sel.pickingDeadline ? hm(sel.pickingDeadline) : na],
              ['Yakunlangan', hm(sel.pickingDoneAt)],
            ].map(([k, v]) => (
              <div key={k} style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px' }}>
                <dt style={{ fontSize: 13, color: C.text2 }}>{k}</dt>
                <dd className="tnum" style={{ margin: 0, fontWeight: 600, color: v === na ? C.textMuted : C.text, fontSize: v === na ? 13 : 15 }}>{v}</dd>
              </div>
            ))}
          </dl>
          {notes[sel.res] && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.textBody }}><Info size={16} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" /><span>{notes[sel.res]}</span></div>}
        </section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text2 }}>Hujjatlar va summa</h3>
          <FactList items={[
            ['Shartnoma', sel.contractNumber || '—'],
            ['Faktura', sel.invoiceNumber || '—'],
            ['Lot', sel.lotNumber || 'Ko‘rsatilmagan', !sel.lotNumber],
            ['Buyurtma summasi', s ? `${s} so‘m` : na, !s],
          ]} />
        </div>
        {sel.wasReturned && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.warningBg, border: `1px solid ${C.warningLine}`, color: C.warning, borderRadius: 12, padding: '12px 14px', fontSize: 14 }}>
            <RotateCcw size={18} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />
            <span><strong style={{ fontWeight: 600, display: 'block' }}>Qaytarish hodisasi</strong>
              {sel.returnedBy?.role ? `${sel.returnedBy.role === 'CHECKER' ? 'Checker' : 'Marker'} qaytargan buyurtma qayta yuborilgan. ` : ''}
              Bu yozuv yakuniy terish natijasi emas — «erta» deb hisoblanmaydi va KPI ga kirmaydi.</span>
          </div>
        )}
      </InspectorBody>
    );
  } else if (mode === 'split') {
    inspector = (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <InspectorPlaceholder icon={MousePointerClick} title="Tafsilotlarni ko‘rish uchun yozuvni tanlang." />
        <div style={{ margin: '0 24px 24px', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: C.textBody }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Ko‘rsatkichlar qanday hisoblanadi</div>
          <div><strong style={{ fontWeight: 600 }}>Jami</strong> — tanlangan kunda yakunlangan terishlar. Qaytarish hodisalari kirmaydi.</div>
          <div><strong style={{ fontWeight: 600 }}>O‘z vaqtida</strong> — erta yoki muddatida yakunlanganlar.</div>
          <div><strong style={{ fontWeight: 600 }}>O‘rtacha kechikish</strong> — faqat kechikkan buyurtmalar bo‘yicha.</div>
          <div style={{ color: C.text2 }}>Manba: server. Kun chegarasi — Toshkent vaqti.</div>
        </div>
      </div>
    );
  }

  const bar = (
    <div style={{ height: 64, flex: 'none', background: '#FFFFFF', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, padding: `0 ${vw >= 1280 ? 24 : 20}px` }}>
      <div style={{ minWidth: 0, lineHeight: 1.25 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, whiteSpace: 'nowrap' }}>Buyurtmalar tarixi</h1>
        <div style={{ fontSize: 13, color: C.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Yakunlangan ishlaringiz va vaqt natijalari</div>
      </div>
      <span style={{ flex: 1 }} />
      <RefreshStatus rs={rs} />
      <RefreshButton onClick={() => query.refetch()} busy={query.isFetching} disabled={!online} label="Ma’lumotlarni yangilash" />
    </div>
  );

  return (
    <Workspace
      vw={vw}
      listLabel="Buyurtmalar tarixi"
      scrollAll
      bar={bar}
      mobileTitle={(
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, lineHeight: 1.25 }}>Buyurtmalar tarixi</h1>
          <span style={{ fontSize: 14, color: C.text2 }}>Yakunlangan ishlaringiz va vaqt natijalari</span>
          <RefreshStatus rs={rs} />
        </div>
      )}
      toolbar={(
        <>
          {!online && <OfflineBanner note="Ko‘rsatilgan tarix oxirgi yuklangan holatda. Boshqa sanaga o‘tish aloqa tiklanguncha ishlamaydi." />}
          {dateNav}
          {kpiPanel}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' }}>
            <SearchBox value={q} onChange={setQ} placeholder="Faktura yoki mijoz" label="Faktura yoki mijoz bo‘yicha qidiruv" max={mobile ? 'none' : 320} />
            {mobile && <SortSelect iconOnly value={sort} onChange={setSort} options={SORTS} />}
            <Segment label="Vaqt natijasi bo‘yicha filtr" options={filters} value={filter} onChange={setFilter} compact={compactF} />
            {!mobile && <SortSelect value={sort} onChange={setSort} options={SORTS} />}
          </div>
          {ready && recs.length > 0 && <div style={{ fontSize: 13, color: C.text2 }}>{vis.length} ta yozuv · qidiruv faqat shu kun ichida</div>}
        </>
      )}
      inspector={inspector}
      insOpen={!!sel}
      onCloseIns={() => setSelId(null)}
      insLabel="Yozuv tafsilotlari"
      insTopTitle="Yozuv tafsilotlari"
    >
      {body}
    </Workspace>
  );
}
