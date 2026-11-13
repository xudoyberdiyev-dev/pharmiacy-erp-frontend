import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  RotateCcw, ShieldCheck, Tag, CircleHelp, ChevronRight, ChevronDown, ChevronUp, MessageSquareText, CircleAlert,
  CirclePause, Scale, ArrowRight, WifiOff, CircleCheck, Send, Lock, Info, RefreshCw, MousePointerClick, Inbox,
} from 'lucide-react';
import { pickerAPI } from '../../api';
import { C } from './design/tokens';
import {
  Chip, Btn, PageBar, MobileTitle, OfflineBanner, SearchBox, Segment, SortSelect, StateBlock, RetryButton,
  SkeletonRows, ExcelButton, FactList, InspectorBody, InspectorFoot, InspectorPlaceholder,
  Dialog, DialogSummary, DialogAlert, refreshState, classifyError,
} from './design/ui';
import Workspace, { workspaceMode } from './design/Workspace';
import { whenLabel, sum as fmtSum, inn as fmtInn } from './lib/time';
import { source } from './lib/labels';

const BY_ICON = { CHECKER: ShieldCheck, MARKER: Tag };
const LIM = 180;

const SORTS = [
  { value: 'oldest', label: 'Eng oldin qaytarilgan' },
  { value: 'newest', label: 'Eng yaqinda qaytarilgan' },
];

export default function PickerReturnedPage() {
  const { vw, online } = useOutletContext();
  const location = useLocation();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('oldest');
  const [selId, setSelId] = useState(() => location.state?.selectId || null);
  const [expanded, setExpanded] = useState(false);
  const [flow, setFlow] = useState('');
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);

  const query = useQuery({ queryKey: ['picker-returned'], queryFn: pickerAPI.getReturned, refetchInterval: 15000, select: (r) => r.data.data || [] });
  const orders = useMemo(() => query.data || [], [query.data]);
  const roleOf = (o) => o.returnedBy?.role || null;

  const counts = useMemo(() => {
    const c = { all: orders.length, MARKER: 0, CHECKER: 0 };
    orders.forEach((o) => { const r = roleOf(o); if (r) c[r] += 1; });
    return c;
  }, [orders]);

  const vis = useMemo(() => {
    const s = q.trim().toLowerCase();
    const t = (o) => new Date(o.returnedToPickingAt).getTime();
    return orders
      .filter((o) => (filter === 'all' || roleOf(o) === filter) && (!s || String(o.invoiceNumber || '').toLowerCase().includes(s) || (o.client?.orgName || '').toLowerCase().includes(s)))
      .sort((a, b) => (sort === 'newest' ? t(b) - t(a) : t(a) - t(b)));
  }, [orders, q, filter, sort]);

  const mode = workspaceMode(vw);
  const mobile = mode === 'mobile';
  const sel = orders.find((o) => o.id === selId) || null;

  // Split rejimda birinchi buyurtma avtomatik tanlanadi (sabab birinchi ko'rinsin)
  useEffect(() => {
    if (flow === 'success') return;
    if (selId && !sel && !query.isFetching) setSelId(null);
    if (!selId && mode === 'split' && vis.length) setSelId(vis[0].id);
  }, [selId, sel, vis, mode, flow, query.isFetching]);
  useEffect(() => { setExpanded(false); }, [selId]);

  const loading = query.isLoading;
  const isError = query.isError && !query.data;
  const ready = !loading && !isError;
  const rs = refreshState(query, online);

  const openConfirm = () => { if (!sel || !online) return; setErr(null); setFlow('confirm'); };
  const closeDialog = () => { if (flow === 'sending') return; setFlow(''); setErr(null); };
  const confirmSubmit = async () => {
    if (flow !== 'confirm' || !sel) return;
    setFlow('sending');
    try {
      const res = await pickerAPI.complete(sel.id);
      const st = res.data?.data?.status;
      setDone({ no: sel.invoiceNumber, client: sel.client?.orgName, status: st === 'MARKING' || !st ? 'Markirovkada (MARKING)' : st });
      setFlow('success');
      setSelId(null);
      toast.success('Buyurtma qayta yuborildi.');
      ['picker-returned', 'picker-mine', 'picker-stats', 'picker-history'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    } catch (e) {
      setErr(classifyError(e));
      setFlow('error');
    }
  };
  const recheck = () => { setFlow(''); setErr(null); query.refetch(); qc.invalidateQueries({ queryKey: ['picker-stats'] }); };

  const onListKey = (e) => {
    if (!['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const ids = vis.map((x) => x.id); if (!ids.length) return;
    const i = ids.indexOf(selId);
    const n = e.key === 'ArrowDown' ? Math.min(ids.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1);
    setSelId(ids[n]);
  };

  const filters = [
    { key: 'all', label: 'Barchasi', count: ready ? counts.all : '—' },
    { key: 'MARKER', label: 'Marker', count: ready ? counts.MARKER : '—' },
    { key: 'CHECKER', label: 'Checker', count: ready ? counts.CHECKER : '—' },
  ];

  let list;
  if (loading) list = <SkeletonRows n={5} h={112} />;
  else if (isError) list = <StateBlock kind="error" title="Qaytgan buyurtmalarni yuklab bo‘lmadi." desc="Bu qaytgan buyurtmalar yo‘q degani emas." action={<RetryButton onClick={() => query.refetch()} />} />;
  else if (orders.length === 0) list = <StateBlock icon={Inbox} title="Hozircha qaytgan buyurtmalar yo‘q." desc="Qayta yig‘ish talab qiladigan buyurtmalar mavjud emas." action={<Link to="/picker/mine" className="pk-btn pk-outline" style={{ height: 48, padding: '0 18px' }}>Mening buyurtmalarim</Link>} />;
  else if (vis.length === 0) list = <StateBlock kind="search" title="Qidiruvga mos buyurtma topilmadi." action={<Btn variant="outline" onClick={() => { setQ(''); setFilter('all'); }}>Filtrlarni tozalash</Btn>} />;
  else {
    list = (
      <div role="listbox" aria-label="Qaytgan buyurtmalar" tabIndex={0} onKeyDown={onListKey} className="pk-focus" style={{ display: 'flex', flexDirection: 'column', gap: 6, borderRadius: 12, opacity: online ? 1 : 0.7 }}>
        {vis.map((o) => {
          const role = roleOf(o), src = source(role), on = o.id === selId;
          const BI = BY_ICON[role] || CircleHelp;
          return (
            <div key={o.id} role="option" aria-selected={on} className="pk-row" aria-label={`Faktura ${o.invoiceNumber}, ${o.client?.orgName || ''}, ${src.returned}, ${whenLabel(o.returnedToPickingAt)}`}
              onClick={() => { setSelId(o.id); if (flow === 'success') setFlow(''); }}
              style={{ background: on ? C.primarySoft : '#FFFFFF', border: `1px solid ${on ? C.primary : C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {!mobile && <span aria-hidden="true" style={{ width: 40, height: 40, flex: 'none', borderRadius: 10, background: on ? C.tealChip : C.warningSoft, color: on ? C.primaryHover : C.warning, display: 'grid', placeItems: 'center' }}><RotateCcw size={20} /></span>}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <span className="tnum" style={{ fontSize: 16, fontWeight: 700 }}>№ {o.invoiceNumber}</span>
                  <span className="tnum" style={{ fontSize: 13, color: C.text2 }}>{whenLabel(o.returnedToPickingAt)}</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 500, color: C.textBody, overflowWrap: 'anywhere' }}>{o.client?.orgName}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}>
                  <Chip size="sm" icon={BI}>{src.short}</Chip>
                  <span style={{ fontSize: 13, color: o.returnReason ? C.text2 : C.textMuted, fontStyle: o.returnReason ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {o.returnReason ? o.returnReason.replace(/\n/g, ' ') : 'Sabab ko‘rsatilmagan'}
                  </span>
                </div>
              </div>
              {mobile && <ChevronRight size={18} color={C.textMuted} style={{ flex: 'none', alignSelf: 'center' }} aria-hidden="true" />}
            </div>
          );
        })}
      </div>
    );
  }

  let inspector = null;
  if (flow === 'success' && done) {
    const remaining = orders.filter((o) => o.invoiceNumber !== done.no);
    inspector = (
      <div role="status" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, padding: 24 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ width: 52, height: 52, flex: 'none', borderRadius: 999, background: C.successSoft, color: C.success, display: 'grid', placeItems: 'center' }}><CircleCheck size={26} aria-hidden="true" /></span>
          <div><div style={{ fontWeight: 700, fontSize: 19 }}>Buyurtma qayta yuborildi.</div><div className="tnum" style={{ fontSize: 14, color: C.text2 }}>№ {done.no} · {done.client}</div></div>
        </div>
        <FactList items={[['Server javobidagi holat', done.status], ['Qolgan qaytgan buyurtmalar', `${remaining.length} ta`]]} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {remaining.length > 0 && <Btn variant="primary" onClick={() => { setFlow(''); setDone(null); setSelId(remaining[0].id); }}>Keyingi buyurtma<ArrowRight size={18} aria-hidden="true" /></Btn>}
          <Link to="/picker/mine" className="pk-btn pk-outline" style={{ height: 48, padding: '0 18px' }}>Mening buyurtmalarim</Link>
        </div>
      </div>
    );
  } else if (sel) {
    const role = roleOf(sel), src = source(role);
    const BI = BY_ICON[role] || CircleHelp;
    const text = sel.returnReason || '';
    const long = text.length > LIM;
    const shown = long && !expanded ? `${text.slice(0, LIM).replace(/\s+\S*$/, '')}…` : text;
    const pen = sel.penalty;
    const penChip = pen ? (pen.voided ? 'Bekor qilingan' : `Qayd etilgan: −${pen.points} ball`) : 'Holat serverdan olinmagan';
    const penNote = pen
      ? (pen.voided ? 'Bu jarima administrator tomonidan bekor qilingan.' : 'Jarima server ma’lumotiga ko‘ra qayd etilgan. Hisoblash backend vakolatida; Checker e’tirozi jarimasi alohida hodisa.')
      : 'Bu umumiy qoida. Jarimaning haqiqiy holati server tomonidan qaytarilmagan.';
    inspector = (
      <>
        <InspectorBody mobile={mobile}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, color: C.text2, fontWeight: 500 }}>Faktura</span><Chip size="sm" icon={RotateCcw} bg={C.warningSoft} fg={C.warning}>Qaytarilgan</Chip></div>
            <h2 className="tnum" style={{ margin: 0, fontSize: 28, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-.01em', overflowWrap: 'anywhere' }}>№ {sel.invoiceNumber}</h2>
            <div style={{ fontSize: 16, fontWeight: 500, color: C.textBody, overflowWrap: 'anywhere' }}>{sel.client?.orgName}</div>
          </div>

          <section aria-labelledby="pr-reason-h" style={{ border: `1px solid ${C.warningLine}`, borderRadius: 14, background: C.warningBg, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px 12px', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.warningLine}` }}>
              <h3 id="pr-reason-h" style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.warning, display: 'flex', alignItems: 'center', gap: 8 }}><MessageSquareText size={18} aria-hidden="true" />Qaytarish sababi</h3>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: role ? C.textBody : C.text2, fontWeight: 500 }}><BI size={16} aria-hidden="true" />{src.returned} · {whenLabel(sel.returnedToPickingAt).toLowerCase()}</span>
            </div>
            <div style={{ padding: 16, background: '#FFFFFF' }}>
              {text ? (
                <>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, maxWidth: '62ch', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{shown}</p>
                  {long && (
                    <button type="button" className="pk-btn pk-ghost" onClick={() => setExpanded((x) => !x)} aria-expanded={expanded} style={{ height: 48, padding: '0 8px', marginTop: 4, color: C.primary, fontSize: 14 }}>
                      {expanded ? 'Qisqartirish' : 'To‘liq o‘qish'}{expanded ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                    </button>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', gap: 8, fontSize: 14, color: C.textBody }}><CircleAlert size={18} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" /><span><strong style={{ fontWeight: 600 }}>Qaytarish sababi ko‘rsatilmagan.</strong> Aniqlashtirish uchun qaytaruvchi bilan bog‘laning.</span></div>
              )}
            </div>
          </section>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.canvas, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, color: C.textBody }}>
            <CirclePause size={20} color={C.text2} style={{ flex: 'none' }} aria-hidden="true" />
            <span><strong style={{ fontWeight: 600 }}>Qayta terish jarayoni.</strong> Qaytarilgan buyurtma uchun vaqt hisoblanmaydi.</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: C.text2 }}>Hujjatlar</h3>
            <ExcelButton url={sel.productsExcelUrl} full disabled={!online} />
            <FactList items={[
              ['Faktura', sel.invoiceNumber || '—'],
              ['Shartnoma', sel.contractNumber || '—'],
              ['Lot', sel.lotNumber || 'Ko‘rsatilmagan', !sel.lotNumber],
              ['Summa', fmtSum(sel.totalAmount) != null ? `${fmtSum(sel.totalAmount)} so‘m` : '—'],
              ['Mijoz INN', fmtInn(sel.client?.inn) || '—', !sel.client?.inn],
            ]} />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <Scale size={20} color={C.text2} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><span style={{ fontWeight: 600, fontSize: 15 }}>Jarima qoidasi</span><Chip size="sm" bg={pen ? C.surfaceMuted : C.canvas} border={pen ? undefined : C.border}>{penChip}</Chip></div>
              <span style={{ fontSize: 14, color: C.textBody }}>Buyurtma qaytarilishi uchun 5 ball jarima qo‘llanadi.</span>
              <span style={{ fontSize: 13, color: C.text2 }}>{penNote}</span>
            </div>
          </div>
        </InspectorBody>
        <InspectorFoot mobile={mobile}>
          <div id="pr-foot" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: online ? C.text2 : C.textBody, fontWeight: 500 }}>
            {online ? <ArrowRight size={16} aria-hidden="true" /> : <WifiOff size={16} aria-hidden="true" />}
            {online ? 'Server tasdiqlagach buyurtma keyingi bosqichga o‘tadi.' : 'Aloqa tiklanguncha qayta yuborib bo‘lmaydi.'}
          </div>
          <Btn variant="primary" h={52} icon={Send} onClick={openConfirm} disabled={!online} aria-describedby="pr-foot" style={{ width: '100%' }}>Qayta yig‘ib, yuborish</Btn>
        </InspectorFoot>
      </>
    );
  } else if (mode === 'split') {
    inspector = <InspectorPlaceholder icon={MousePointerClick} title="Tafsilotlarni ko‘rish uchun buyurtmani tanlang." desc="Qaytarish sababi, hujjatlar va qayta yuborish shu yerda." />;
  }

  const sending = flow === 'sending';
  const errTitle = err?.kind === 'forbidden' ? 'Ushbu amalni bajarishga ruxsatingiz yo‘q.' : err?.kind === 'unknown' ? 'Natija noma’lum.' : 'Buyurtmani qayta yuborib bo‘lmadi.';

  return (
    <>
      <Workspace
        vw={vw}
        listLabel="Qaytgan buyurtmalar navbati"
        bar={<PageBar title="Qaytgan buyurtmalar" count={ready ? `${counts.all} ta` : null} countBg={C.warningSoft} countFg={C.warning} rs={rs} onRefresh={() => query.refetch()} refreshing={query.isFetching} refreshDisabled={!online} pad={vw >= 1280 ? 24 : 20} />}
        mobileTitle={<MobileTitle title="Qaytgan buyurtmalar" count={ready ? `${counts.all} ta` : null} countBg={C.warningSoft} countFg={C.warning} rs={rs} />}
        toolbar={(
          <>
            {!online && <OfflineBanner note="Ro‘yxat oxirgi yuklangan holatda. Qayta yuborish aloqa tiklanguncha o‘chirilgan." />}
            {ready && orders.length > 0 && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.warningBg, border: `1px solid ${C.warningLine}`, color: C.warning, borderRadius: 12, padding: '10px 14px', fontSize: 14 }}>
                <Lock size={18} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />
                <span>Qaytgan buyurtmalar qayta yuborilmaguncha <strong style={{ fontWeight: 600 }}>Mening buyurtmalarim</strong>dagi boshqa buyurtmalarni yakunlab bo‘lmaydi.</span>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' }}>
              <SearchBox value={q} onChange={setQ} placeholder="Faktura yoki mijoz" label="Faktura yoki mijoz bo‘yicha qidiruv" max={mobile ? 'none' : 360} />
              {mobile && <SortSelect iconOnly value={sort} onChange={setSort} options={SORTS} />}
              <Segment label="Qaytaruvchi bo‘yicha filtr" options={filters} value={filter} onChange={setFilter} compact={mobile} />
              {!mobile && <SortSelect value={sort} onChange={setSort} options={SORTS} />}
            </div>
            {ready && vis.length > 0 && <div style={{ fontSize: 13, color: C.text2 }}>{vis.length} ta ko‘rsatilmoqda · qidiruv yuklangan ro‘yxat ichida</div>}
          </>
        )}
        inspector={inspector}
        insOpen={!!sel || flow === 'success'}
        onCloseIns={() => { setSelId(null); if (flow === 'success') setFlow(''); }}
        insLabel="Qaytgan buyurtma tafsilotlari"
        insTopTitle="Qaytgan buyurtma"
      >
        {list}
      </Workspace>

      <Dialog
        open={['confirm', 'sending', 'error'].includes(flow) && !!sel} onClose={closeDialog} busy={sending} mobile={mobile} labelId="pr-dlg-title"
        icon={err ? RotateCcw : Send} iconBg={err ? C.warningSoft : C.primarySoft} iconFg={err ? C.warning : C.primary}
        title="Buyurtmani qayta yuborasizmi?"
        desc="Qaytarish sababini tekshirib, dorilarni qayta yig‘ganingizni tasdiqlang."
        footer={(
          <>
            <Btn variant="outline" onClick={closeDialog} disabled={sending} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>{err ? 'Yopish' : 'Bekor qilish'}</Btn>
            {err
              ? <Btn variant="primary" icon={RefreshCw} data-autofocus="true" onClick={recheck} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>Holatni tekshirish</Btn>
              : <Btn variant="primary" data-autofocus="true" loading={sending} disabled={sending} onClick={confirmSubmit} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>{sending ? 'Yuborilmoqda…' : 'Qayta yuborishni tasdiqlash'}</Btn>}
          </>
        )}
      >
        {sel && <DialogSummary no={sel.invoiceNumber} right={source(roleOf(sel)).returned} client={sel.returnReason ? sel.returnReason.replace(/\n/g, ' ') : 'Qaytarish sababi ko‘rsatilmagan.'} />}
        {sending && <div role="status" style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: C.text2 }}><Info size={16} aria-hidden="true" />Buyurtma yuborilmoqda... Oynani yopmang.</div>}
        {err && <DialogAlert icon={err.kind === 'forbidden' ? Lock : Info} title={errTitle} text={err.msg} />}
      </Dialog>
    </>
  );
}
