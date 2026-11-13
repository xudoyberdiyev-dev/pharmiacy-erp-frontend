import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MessageSquareWarning, ShieldCheck, Tag, CircleHelp, ChevronRight, Clock, TriangleAlert, Info, CircleCheck,
  CircleX, ThumbsUp, ThumbsDown, WifiOff, Copy, RefreshCw, Lock, MousePointerClick, ArrowRight, Inbox,
} from 'lucide-react';
import { pickerAPI } from '../../api';
import { C } from './design/tokens';
import {
  Chip, Btn, PageBar, MobileTitle, OfflineBanner, SearchBox, Segment, SortSelect, StateBlock, RetryButton,
  SkeletonRows, ExcelButton, InspectorBody, InspectorFoot, InspectorPlaceholder, Dialog, DialogAlert,
  refreshState, classifyError,
} from './design/ui';
import Workspace, { workspaceMode } from './design/Workspace';
import { hm, whenLabel } from './lib/time';
import { etirovTypeLabel, REJECT_REASONS, source } from './lib/labels';

const SRC_ICON = { CHECKER: ShieldCheck, MARKER: Tag };
const SORTS = [
  { value: 'oldest', label: 'Eng eski e’tiroz' },
  { value: 'newest', label: 'Eng yangi e’tiroz' },
];

const pendingOf = (o) => (o.etirozlar || []).filter((e) => e.status === 'PENDING').sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

export default function PickerEtirozliPage() {
  const { vw, online } = useOutletContext();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('oldest');
  const [selId, setSelId] = useState(null);
  const [objId, setObjId] = useState(null);
  const [res, setRes] = useState(null);           // { title, type, orderDone, no }
  const [flow, setFlow] = useState('');           // '' | accept | reject | sending | error
  const [kind, setKind] = useState('accept');
  const [reasons, setReasons] = useState([]);
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState(null);

  const query = useQuery({ queryKey: ['picker-etirozli'], queryFn: pickerAPI.getEtirozli, refetchInterval: 15000, select: (r) => r.data.data || [] });

  const orders = useMemo(() => (query.data || []).map((o) => ({ ...o, pending: pendingOf(o) })).filter((o) => o.pending.length > 0), [query.data]);

  const counts = useMemo(() => {
    const c = { all: orders.length, MARKER: 0, CHECKER: 0 };
    orders.forEach((o) => {
      if (o.pending.some((e) => e.fromRole === 'MARKER')) c.MARKER += 1;
      if (o.pending.some((e) => e.fromRole === 'CHECKER')) c.CHECKER += 1;
    });
    return c;
  }, [orders]);
  const objTotal = orders.reduce((s, o) => s + o.pending.length, 0);

  const vis = useMemo(() => {
    const s = q.trim().toLowerCase();
    const t = (o) => new Date(o.pending[0].createdAt).getTime();
    return orders
      .filter((o) => (filter === 'all' || o.pending.some((e) => e.fromRole === filter)) && (!s || String(o.invoiceNumber || '').toLowerCase().includes(s) || (o.client?.orgName || '').toLowerCase().includes(s)))
      .sort((a, b) => (sort === 'newest' ? t(b) - t(a) : t(a) - t(b)));
  }, [orders, q, filter, sort]);

  const mode = workspaceMode(vw);
  const mobile = mode === 'mobile';
  const sel = orders.find((o) => o.id === selId) || null;
  const ob = sel ? sel.pending.find((e) => e.id === objId) || sel.pending[0] : null;
  const obIdx = sel && ob ? sel.pending.indexOf(ob) : -1;

  useEffect(() => {
    if (res?.orderDone) return;
    if (selId && !sel && !query.isFetching) setSelId(null);
    if (!selId && mode === 'split' && vis.length) setSelId(vis[0].id);
  }, [selId, sel, vis, mode, res, query.isFetching]);
  useEffect(() => { if (sel && (!objId || !sel.pending.some((e) => e.id === objId))) setObjId(sel.pending[0]?.id || null); }, [sel, objId]);

  const loading = query.isLoading;
  const isError = query.isError && !query.data;
  const ready = !loading && !isError;
  const rs = refreshState(query, online);

  const pickOrder = (id) => { setSelId(id); setObjId(null); setRes(null); };

  const open = (k) => { if (!ob || !online) return; setKind(k); setReasons([]); setNote(''); setTried(false); setErr(null); setFlow(k); };
  const closeDialog = () => { if (flow === 'sending') return; setFlow(''); setErr(null); };

  const otherOn = reasons.includes('OTHER');
  const reasonErr = kind === 'reject' && tried && reasons.length === 0;
  const noteErr = kind === 'reject' && tried && otherOn && !note.trim();

  const confirm = async () => {
    if (!ob || !sel) return;
    if (kind === 'reject') {
      setTried(true);
      if (!reasons.length || (otherOn && !note.trim())) return;
    }
    setFlow('sending');
    const typeText = `E’tiroz ${obIdx + 1} — ${etirovTypeLabel(ob.type)}`;
    try {
      if (kind === 'accept') await pickerAPI.acceptEtirov(ob.id);
      else await pickerAPI.rejectEtirov(ob.id, { responseTypes: reasons, responseComment: note.trim() || undefined });
      const left = sel.pending.filter((e) => e.id !== ob.id);
      setRes({ title: kind === 'reject' ? 'E’tiroz rad etildi.' : 'E’tiroz tan olindi.', type: typeText, orderDone: left.length === 0, no: sel.invoiceNumber, orderId: sel.id });
      setObjId(left[0]?.id || null);
      setFlow('');
      toast.success(kind === 'reject' ? 'E’tiroz rad etildi.' : 'E’tiroz tan olindi.');
      qc.invalidateQueries({ queryKey: ['picker-etirozli'] });
      qc.invalidateQueries({ queryKey: ['picker-stats'] });
    } catch (e) {
      setErr(classifyError(e));
      setFlow('error');
    }
  };
  const recheck = () => { setFlow(''); setErr(null); query.refetch(); };

  const onListKey = (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const ids = vis.map((x) => x.id); if (!ids.length) return;
    const i = ids.indexOf(selId);
    const n = e.key === 'ArrowDown' ? Math.min(ids.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1);
    pickOrder(ids[n]);
  };

  const filters = [
    { key: 'all', label: 'Barchasi', count: ready ? counts.all : '—' },
    { key: 'MARKER', label: 'Marker', count: ready ? counts.MARKER : '—' },
    { key: 'CHECKER', label: 'Checker', count: ready ? counts.CHECKER : '—' },
  ];

  let list;
  if (loading) list = <SkeletonRows n={4} h={120} />;
  else if (isError) list = <StateBlock kind="error" title="E’tirozlarni yuklab bo‘lmadi." desc="Bu javobsiz e’tirozlar yo‘q degani emas." action={<RetryButton onClick={() => query.refetch()} />} />;
  else if (orders.length === 0) list = <StateBlock icon={Inbox} title="Hozircha javobsiz e’tirozlar yo‘q." desc="Ko‘rib chiqilishi kerak bo‘lgan e’tiroz mavjud emas." />;
  else if (vis.length === 0) list = <StateBlock kind="search" title="Qidiruvga mos e’tiroz topilmadi." action={<Btn variant="outline" onClick={() => { setQ(''); setFilter('all'); }}>Filtrlarni tozalash</Btn>} />;
  else {
    list = (
      <div role="listbox" aria-label="E’tirozli buyurtmalar" tabIndex={0} onKeyDown={onListKey} className="pk-focus" style={{ display: 'flex', flexDirection: 'column', gap: 6, borderRadius: 12, opacity: online ? 1 : 0.7 }}>
        {vis.map((o) => {
          const on = o.id === selId;
          const sc = {};
          o.pending.forEach((e) => { const k = source(e.fromRole).short; sc[k] = (sc[k] || 0) + 1; });
          const types = [...new Set(o.pending.map((e) => etirovTypeLabel(e.type)))].join(' · ');
          return (
            <div key={o.id} role="option" aria-selected={on} className="pk-row" aria-label={`Faktura ${o.invoiceNumber}, ${o.client?.orgName || ''}, ${o.pending.length} ta javobsiz e’tiroz: ${types}`}
              onClick={() => pickOrder(o.id)}
              style={{ background: on ? C.primarySoft : '#FFFFFF', border: `1px solid ${on ? C.primary : C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {!mobile && <span aria-hidden="true" style={{ width: 40, height: 40, flex: 'none', borderRadius: 10, background: on ? C.tealChip : C.infoSoft, color: on ? C.primaryHover : C.info, display: 'grid', placeItems: 'center' }}><MessageSquareWarning size={20} /></span>}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <span className="tnum" style={{ fontSize: 16, fontWeight: 700 }}>№ {o.invoiceNumber}</span>
                  <span className="tnum" style={{ fontSize: 13, color: C.text2 }}>{whenLabel(o.pending[0].createdAt)}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 500, color: C.textBody, overflowWrap: 'anywhere' }}>{o.client?.orgName}</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Chip size="sm" icon={MessageSquareWarning} bg={C.infoSoft} fg={C.info}>{o.pending.length} ta e’tiroz</Chip>
                  {Object.entries(sc).map(([k, v]) => <Chip key={k} size="sm">{v > 1 ? `${k} · ${v}` : k}</Chip>)}
                </div>
                <span style={{ fontSize: 13, color: C.text2, overflowWrap: 'anywhere' }}>{types}</span>
              </div>
              {mobile && <ChevronRight size={18} color={C.textMuted} style={{ flex: 'none', alignSelf: 'center' }} aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    );
  }

  let inspector = null;
  if (res?.orderDone && (!sel || sel.id === res.orderId)) {
    const next = vis.find((o) => o.id !== res.orderId);
    inspector = (
      <div role="status" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, padding: 32 }}>
        <span style={{ width: 64, height: 64, borderRadius: 999, background: C.successSoft, color: C.success, display: 'grid', placeItems: 'center' }}><CircleCheck size={30} aria-hidden="true" /></span>
        <div style={{ fontWeight: 700, fontSize: 19 }}>{res.title}</div>
        <div className="tnum" style={{ fontSize: 14, color: C.text2, maxWidth: '36ch' }}>№ {res.no} · {res.type} · buyurtmadagi barcha e’tirozlarga javob berildi</div>
        {next && <Btn variant="primary" onClick={() => pickOrder(next.id)}>Keyingi e’tirozli buyurtma<ArrowRight size={18} aria-hidden="true" /></Btn>}
      </div>
    );
  } else if (sel && ob) {
    const src = source(ob.fromRole);
    const SI = SRC_ICON[ob.fromRole] || CircleHelp;
    const dupWith = ob.comment ? sel.pending.map((e, i) => (e.id !== ob.id && e.comment && e.comment.trim() === ob.comment.trim() ? `E’tiroz ${i + 1}` : null)).filter(Boolean) : [];
    const checker = ob.fromRole === 'CHECKER';
    const pen = checker
      ? { title: 'Checker e’tirozi · 5 ball jarima', text: 'Checker e’tirozi uchun 5 ball jarima qo‘llanadi. Javob berish jarimani avtomatik bekor qilmaydi.', chip: ob.penalty ? (ob.penalty.voided ? 'Jarima bekor qilingan.' : `${ob.penalty.points} ball jarima qayd etilgan.`) : 'Qayd holati serverdan olinmagan', bg: C.warningBg, bd: C.warningLine, ic: C.warning, Icon: TriangleAlert }
      : ob.fromRole === 'MARKER'
        ? { title: 'Marker e’tirozi', text: 'Marker e’tiroziga alohida jarima qo‘llanmaydi.', bg: '#FFFFFF', bd: C.border, ic: C.text2, Icon: Info }
        : { title: 'Manba noma’lum', text: 'E’tiroz manbasi aniqlanmagani uchun jarima haqida ma’lumot ko‘rsatilmaydi.', bg: '#FFFFFF', bd: C.border, ic: C.text2, Icon: CircleHelp };
    inspector = (
      <>
        <InspectorBody mobile={mobile}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 13, color: C.text2, fontWeight: 500 }}>Faktura</span>
              <h2 className="tnum" style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1.1, overflowWrap: 'anywhere' }}>№ {sel.invoiceNumber}</h2>
              <div style={{ fontSize: 16, fontWeight: 500, color: C.textBody, overflowWrap: 'anywhere' }}>{sel.client?.orgName}</div>
            </div>
            <ExcelButton url={sel.productsExcelUrl} label="Excel" disabled={!online} />
          </div>

          {res && !res.orderDone && res.orderId === sel.id && (
            <div role="status" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.successSoft, color: C.success, borderRadius: 12, padding: '12px 14px', fontSize: 14 }}>
              <CircleCheck size={20} style={{ flex: 'none' }} aria-hidden="true" />
              <span><strong style={{ fontWeight: 600 }}>{res.title}</strong> {res.type} · server tasdiqladi. Qolgan e’tirozlar o‘zgarmadi.</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Javobsiz e’tirozlar · {sel.pending.length}</h3>
              <span style={{ fontSize: 13, color: C.text2 }}>har biriga alohida qaror</span>
            </div>
            <div role="tablist" aria-label="Buyurtmadagi e’tirozlar" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sel.pending.map((e, i) => {
                const on = e.id === ob.id;
                return (
                  <button key={e.id} type="button" role="tab" aria-selected={on} className="pk-row" onClick={() => { setObjId(e.id); setRes(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '8px 12px', borderRadius: 12, border: `1px solid ${on ? C.primary : C.border}`, background: on ? C.primarySoft : '#FFFFFF', textAlign: 'left', color: C.text }}>
                    <span className="tnum" style={{ width: 28, height: 28, flex: 'none', borderRadius: 999, background: on ? C.primary : C.surfaceMuted, color: on ? '#FFFFFF' : C.textBody, fontWeight: 700, fontSize: 13, display: 'grid', placeItems: 'center' }}>{i + 1}</span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600, fontSize: 14, overflowWrap: 'anywhere' }}>{etirovTypeLabel(e.type)}</span>
                      <span className="tnum" style={{ fontSize: 13, color: C.text2 }}>{source(e.fromRole).short} · {hm(e.createdAt)}</span>
                    </span>
                    <Chip size="sm" icon={Clock} bg={C.infoSoft} fg={C.info}>Javob kutilmoqda</Chip>
                  </button>
                );
              })}
            </div>
          </div>

          <section role="tabpanel" aria-labelledby="pd-obj-h" style={{ border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px 12px', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, background: C.canvas }}>
              <h3 id="pd-obj-h" style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>E’tiroz {obIdx + 1} — {etirovTypeLabel(ob.type)}</h3>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textBody, fontWeight: 500 }}><SI size={16} aria-hidden="true" />{src.raised} · {whenLabel(ob.createdAt).toLowerCase()}</span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ob.comment
                ? <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, maxWidth: '62ch', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{ob.comment}</p>
                : <p style={{ margin: 0, fontSize: 15, color: C.textMuted, fontStyle: 'italic' }}>Izoh qoldirilmagan.</p>}
              {dupWith.length > 0 && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.text2 }}><Copy size={16} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />Bu izoh {dupWith.join(', ')} da ham bir xil — qaror har biri uchun alohida.</div>}
            </div>
          </section>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', border: `1px solid ${pen.bd}`, background: pen.bg, borderRadius: 12, padding: '14px 16px' }}>
            <pen.Icon size={20} color={pen.ic} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontWeight: 600, fontSize: 15 }}>{pen.title}</span>{pen.chip && <Chip size="sm" bg="#FFFFFF" border={C.warningLine} fg={C.warning}>{pen.chip}</Chip>}</div>
              <span style={{ fontSize: 14, color: C.textBody }}>{pen.text}</span>
            </div>
          </div>
        </InspectorBody>
        <InspectorFoot mobile={mobile}>
          <div id="pd-dec" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.text2, fontWeight: 500 }}>
            {online ? <Info size={16} aria-hidden="true" /> : <WifiOff size={16} aria-hidden="true" />}
            {online ? `Qaror faqat E’tiroz ${obIdx + 1} — ${etirovTypeLabel(ob.type)} ga tegishli.` : 'Aloqa tiklanguncha javob yuborib bo‘lmaydi.'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Btn variant="outline" h={52} icon={ThumbsUp} iconColor={C.primary} onClick={() => open('accept')} disabled={!online} aria-describedby="pd-dec" style={{ padding: '0 12px', borderColor: C.primary, color: C.primaryHover }}>E’tirozni tan olish</Btn>
            <Btn variant="danger" h={52} icon={ThumbsDown} onClick={() => open('reject')} disabled={!online} aria-describedby="pd-dec" style={{ padding: '0 12px' }}>E’tirozni rad etish</Btn>
          </div>
        </InspectorFoot>
      </>
    );
  } else if (mode === 'split') {
    inspector = <InspectorPlaceholder icon={MousePointerClick} title="E’tirozni ko‘rish uchun buyurtmani tanlang." desc="E’tirozlar, jarima qoidasi va javob tugmalari shu yerda." />;
  }

  const isRej = kind === 'reject';
  const sending = flow === 'sending';
  const dlgOpen = ['accept', 'reject', 'sending', 'error'].includes(flow) && !!ob;

  return (
    <>
      <Workspace
        vw={vw}
        listLabel="E’tirozli buyurtmalar navbati"
        bar={<PageBar title="E’tirozlar" count={ready ? `${objTotal} ta javobsiz · ${orders.length} buyurtma` : null} countBg={C.infoSoft} countFg={C.info} rs={rs} onRefresh={() => query.refetch()} refreshing={query.isFetching} refreshDisabled={!online} pad={vw >= 1280 ? 24 : 20} />}
        mobileTitle={<MobileTitle title="E’tirozlar" count={ready ? `${objTotal} ta javobsiz` : null} countBg={C.infoSoft} countFg={C.info} rs={rs} />}
        toolbar={(
          <>
            {!online && <OfflineBanner note="Ro‘yxat oxirgi yuklangan holatda. Javob yuborish aloqa tiklanguncha o‘chirilgan." />}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' }}>
              <SearchBox value={q} onChange={setQ} placeholder="Faktura yoki mijoz" label="Faktura yoki mijoz bo‘yicha qidiruv" max={mobile ? 'none' : 360} />
              {mobile && <SortSelect iconOnly value={sort} onChange={setSort} options={SORTS} />}
              <Segment label="E’tiroz manbasi bo‘yicha filtr" options={filters} value={filter} onChange={setFilter} compact={mobile} />
              {!mobile && <SortSelect value={sort} onChange={setSort} options={SORTS} />}
            </div>
            {ready && vis.length > 0 && <div style={{ fontSize: 13, color: C.text2 }}>{vis.length} ta buyurtma · {objTotal} ta javobsiz e’tiroz · qidiruv yuklangan ro‘yxat ichida</div>}
          </>
        )}
        inspector={inspector}
        insOpen={!!sel || !!res?.orderDone}
        onCloseIns={() => { setSelId(null); setRes(null); }}
        insLabel="E’tiroz tafsilotlari"
        insTopTitle="E’tiroz"
      >
        {list}
      </Workspace>

      <Dialog
        open={dlgOpen} onClose={closeDialog} busy={sending} mobile={mobile} labelId="pd-dlg-title"
        icon={isRej ? CircleX : CircleCheck} iconBg={isRej ? C.dangerSoft : C.primarySoft} iconFg={isRej ? C.danger : C.primary}
        title={isRej ? 'E’tirozni rad etish' : 'E’tirozni tan olasizmi?'}
        desc={isRej ? 'Rad etish sababini tanlang va qaroringizni tasdiqlang.' : 'Ushbu e’tirozni tan olishingizni tasdiqlang. Javobingiz tizimda qayd etiladi.'}
        footer={(
          <>
            <Btn variant="outline" onClick={closeDialog} disabled={sending} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>{err ? 'Yopish' : 'Bekor qilish'}</Btn>
            {err
              ? <Btn variant="primary" icon={RefreshCw} data-autofocus="true" onClick={recheck} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>Holatni tekshirish</Btn>
              : <Btn variant={isRej ? 'danger-solid' : 'primary'} data-autofocus={isRej ? undefined : 'true'} loading={sending} disabled={sending} onClick={confirm} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>{sending ? 'Yuborilmoqda…' : isRej ? 'Rad etishni tasdiqlash' : 'Tan olishni tasdiqlash'}</Btn>}
          </>
        )}
      >
        {ob && sel && (
          <dl style={{ margin: 0, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden', fontSize: 14 }}>
            {[['Faktura', `№ ${sel.invoiceNumber}`], ['E’tiroz turi', `${obIdx + 1} · ${etirovTypeLabel(ob.type)}`], ['Manba', source(ob.fromRole).short]].map(([k, v], i) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 14px', borderTop: i ? `1px solid ${C.border}` : 'none' }}><dt style={{ color: C.text2 }}>{k}</dt><dd className="tnum" style={{ margin: 0, fontWeight: 600, textAlign: 'right' }}>{v}</dd></div>
            ))}
          </dl>
        )}
        {ob?.fromRole === 'CHECKER' && (
          <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.warning, background: C.warningBg, border: `1px solid ${C.warningLine}`, borderRadius: 12, padding: '10px 12px' }}>
            <TriangleAlert size={16} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />Checker e’tirozi: tan olish yoki rad etish 5 ball jarimani avtomatik bekor qilmaydi.
          </div>
        )}
        {isRej && !err && (
          <>
            <fieldset aria-describedby={reasonErr ? 'pd-reason-err' : undefined} style={{ margin: 0, padding: 0, border: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, padding: 0 }}>Rad etish sababi <span style={{ fontWeight: 400, color: C.text2 }}>· bir nechtasini tanlash mumkin</span></legend>
              {REJECT_REASONS.map((r) => {
                const on = reasons.includes(r.value);
                return (
                  <label key={r.value} style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 48, padding: '8px 12px', borderRadius: 12, border: `1px solid ${on ? C.primary : C.border}`, background: on ? C.primarySoft : '#FFFFFF', cursor: sending ? 'default' : 'pointer' }}>
                    <input type="checkbox" checked={on} disabled={sending} onChange={() => setReasons((p) => (p.includes(r.value) ? p.filter((x) => x !== r.value) : [...p, r.value]))}
                      style={{ width: 20, height: 20, accentColor: C.primary, flex: 'none' }} />
                    <span style={{ fontSize: 15 }}>{r.label}</span>
                  </label>
                );
              })}
              {reasonErr && <div id="pd-reason-err" role="alert" style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: C.danger, fontWeight: 500 }}><CircleX size={16} aria-hidden="true" />Rad etish sababini tanlang.</div>}
            </fieldset>
            {otherOn && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Qo‘shimcha izoh <span style={{ color: C.danger }}>*</span></span>
                <textarea rows={3} value={note} maxLength={500} disabled={sending} onChange={(e) => setNote(e.target.value)} aria-invalid={noteErr} aria-describedby={noteErr ? 'pd-note-err' : undefined}
                  placeholder="Rad etish sababini batafsil yozing" className="pk-input"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${noteErr ? C.danger : C.borderStrong}`, fontSize: 15, resize: 'vertical', color: C.text }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  {noteErr ? <span id="pd-note-err" role="alert" style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: C.danger, fontWeight: 500 }}><CircleX size={16} aria-hidden="true" />Iltimos, rad etish sababini yozing.</span> : <span />}
                  <span className="tnum" style={{ fontSize: 13, color: C.text2 }}>{note.length}/500</span>
                </div>
              </label>
            )}
          </>
        )}
        {sending && <div role="status" style={{ fontSize: 14, color: C.text2 }}>E’tirozga javob yuborilmoqda...</div>}
        {err && <DialogAlert icon={err.kind === 'forbidden' ? Lock : Info} title={err.kind === 'unknown' ? 'Natija noma’lum.' : 'Javobni yuborib bo‘lmadi.'} text={err.msg} />}
      </Dialog>
    </>
  );
}
