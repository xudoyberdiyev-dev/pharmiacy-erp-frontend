import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  PackageOpen, UserCheck, Lock, CircleCheck, CircleDot, Clock, Hourglass, ChevronRight, ArrowRight,
  LoaderCircle, MousePointerClick, Info, RefreshCw, TriangleAlert,
} from 'lucide-react';
import { pickerAPI } from '../../api';
import { C } from './design/tokens';
import {
  Chip, Btn, PageBar, MobileTitle, OfflineBanner, SearchBox, Segment, SortSelect, StateBlock, RetryButton,
  SkeletonRows, ExcelButton, Kbd, FactList, SectionTitle, InspectorBody, InspectorFoot, InspectorPlaceholder,
  Dialog, DialogSummary, DialogAlert, refreshState, classifyError,
} from './design/ui';
import Workspace, { workspaceMode, inspectorWidth } from './design/Workspace';
import { hm, dmy, waitLabel, inn as fmtInn } from './lib/time';
import { useNow } from './lib/hooks';

const ASSIGN = {
  open:  { label: 'Qabul qilish mumkin', short: 'Ochiq', bg: C.successSoft, fg: C.success, Icon: CircleCheck, L: PackageOpen, lb: C.surfaceMuted, lf: C.textBody },
  mine:  { label: 'Menga biriktirilgan', short: 'Menga', bg: C.tealChip, fg: C.primaryHover, Icon: UserCheck, L: UserCheck, lb: C.tealChip, lf: C.primaryHover },
  other: { label: 'Boshqa terimchida', short: 'Band', bg: C.surfaceMuted, fg: C.textBody, Icon: Lock, L: Lock, lb: C.surfaceMuted, lf: C.textMuted },
};

const SORTS = [
  { value: 'oldest', label: 'Eng eski birinchi' },
  { value: 'newest', label: 'Eng yangi birinchi' },
  { value: 'mine',   label: 'Menga biriktirilganlar birinchi' },
];

function navWidth(vw) {
  if (vw < 640) return 0;
  if (vw < 1280) return 80;
  return vw >= 1600 ? 248 : 76;
}

export default function PickerAvailablePage() {
  const { vw, online, user } = useOutletContext();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const now = useNow(30000);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('oldest');
  // "Mening" sahifasidan "Navbatda qabul qilish" bilan kelinsa — o'sha buyurtma tanlangan holda ochiladi
  const [selId, setSelId] = useState(() => location.state?.selectId || null);
  const [flow, setFlow] = useState('');        // '' | confirm | sending | success | error
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState(null);
  const goTimer = useRef(null);

  const query = useQuery({
    queryKey: ['picker-available'],
    queryFn: pickerAPI.getAvailable,
    refetchInterval: 10000,
    select: (r) => r.data.data || [],
  });
  const orders = useMemo(() => query.data || [], [query.data]);

  useEffect(() => () => clearTimeout(goTimer.current), []);

  const assignOf = (o) => (!o.assignedPickerId ? 'open' : o.assignedPickerId === user?.id ? 'mine' : 'other');

  const counts = useMemo(() => {
    const c = { all: orders.length, mine: 0, open: 0, other: 0 };
    orders.forEach((o) => { c[assignOf(o)] += 1; });
    return c;
  }, [orders, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const vis = useMemo(() => {
    const s = q.trim().toLowerCase();
    const sd = s.replace(/\s/g, '');
    const t = (o) => new Date(o.createdAt).getTime();
    let list = orders.filter((o) => (filter === 'all' || assignOf(o) === filter) && (!s
      || String(o.invoiceNumber || '').toLowerCase().includes(s)
      || (o.client?.orgName || '').toLowerCase().includes(s)
      || (sd && String(o.client?.inn || '').includes(sd))));
    list = list.slice().sort((a, b) => {
      if (sort === 'newest') return t(b) - t(a);
      if (sort === 'mine') return ((assignOf(a) === 'mine' ? 0 : 1) - (assignOf(b) === 'mine' ? 0 : 1)) || t(a) - t(b);
      return t(a) - t(b);
    });
    return list;
  }, [orders, q, filter, sort, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sel = orders.find((o) => o.id === selId) || null;
  // Tanlangan buyurtma ro'yxatdan yo'qolsa (boshqasi oldi) — inspectorni tozalaymiz
  useEffect(() => { if (selId && !sel && flow !== 'success' && !query.isFetching) setSelId(null); }, [selId, sel, flow, query.isFetching]);

  const mode = workspaceMode(vw);
  const mobile = mode === 'mobile';
  const queueW = vw - navWidth(vw) - (mode === 'split' ? inspectorWidth(vw, mode) : 0);
  const rowWide = !mobile && queueW >= 860;
  const compactF = mobile || queueW < 760;
  const loading = query.isLoading;
  const isError = query.isError && !query.data;
  const ready = !loading && !isError;
  const rs = refreshState(query, online);

  const selAssign = sel ? assignOf(sel) : 'open';
  const canAccept = !!sel && selAssign !== 'other' && online;
  const reason = !sel ? '' : selAssign === 'other' ? 'Boshqa terimchiga biriktirilgan — qabul qilib bo‘lmaydi'
    : !online ? 'Internet aloqasi yo‘q — qabul qilib bo‘lmaydi'
      : selAssign === 'mine' ? 'Bu buyurtma sizga biriktirilgan' : '';

  const openConfirm = () => { if (!canAccept) return; setErr(null); setFlow('confirm'); };
  const closeDialog = () => { if (flow === 'sending') return; setFlow(''); setErr(null); };

  const confirmAccept = async () => {
    if (flow !== 'confirm' || !sel) return;
    setFlow('sending');
    try {
      await pickerAPI.accept(sel.id);
      setSuccess({ no: sel.invoiceNumber });
      setFlow('success');
      toast.success('Buyurtma qabul qilindi. Terish vaqti boshlandi.');
      qc.invalidateQueries({ queryKey: ['picker-available'] });
      qc.invalidateQueries({ queryKey: ['picker-mine'] });
      qc.invalidateQueries({ queryKey: ['picker-stats'] });
      goTimer.current = setTimeout(() => navigate('/picker/mine'), 1800);
    } catch (e) {
      setErr(classifyError(e));
      setFlow('error');
    }
  };

  const refreshAfterError = () => {
    setFlow(''); setErr(null);
    query.refetch();
    qc.invalidateQueries({ queryKey: ['picker-stats'] });
  };

  const onListKey = (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'Enter') { openConfirm(); return; }
    const ids = vis.map((x) => x.id);
    if (!ids.length) return;
    const i = ids.indexOf(selId);
    const n = e.key === 'ArrowDown' ? Math.min(ids.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1);
    setSelId(ids[n]);
    document.getElementById(`pq-${ids[n]}`)?.scrollIntoView({ block: 'nearest' });
  };

  const filters = [
    { key: 'all', label: 'Barchasi', short: 'Barchasi', count: ready ? counts.all : '—' },
    { key: 'mine', label: 'Menga biriktirilgan', short: 'Menga', count: ready ? counts.mine : '—' },
    { key: 'open', label: 'Qabul qilish mumkin', short: 'Ochiq', count: ready ? counts.open : '—' },
    { key: 'other', label: 'Boshqa terimchida', short: 'Band', count: ready ? counts.other : '—' },
  ];

  const chipLabel = (o, short) => {
    const a = assignOf(o);
    if (a === 'other') return `Band · ${o.assignedPicker?.fullName || 'boshqa terimchi'}`;
    return short ? ASSIGN[a].short : ASSIGN[a].label;
  };

  // ── Ro'yxat ──
  let list;
  if (loading) list = <SkeletonRows n={7} h={rowWide ? 66 : 92} />;
  else if (isError) list = <StateBlock kind="error" title="Buyurtmalarni yuklab bo‘lmadi." desc="Server javob bermadi. Bu navbat bo‘sh degani emas." action={<RetryButton onClick={() => query.refetch()} />} />;
  else if (orders.length === 0) list = <StateBlock icon={PackageOpen} title="Hozircha mavjud buyurtmalar yo‘q." desc="Operator yangi buyurtma yaratganda u shu yerda paydo bo‘ladi." />;
  else if (vis.length === 0) list = <StateBlock kind="search" title="Qidiruv bo‘yicha buyurtma topilmadi." desc="Qidiruv faqat yuklangan ro‘yxat ichida ishlaydi." action={<Btn variant="outline" onClick={() => { setQ(''); setFilter('all'); }}>Filtrlarni tozalash</Btn>} />;
  else {
    list = (
      <>
        {rowWide && (
          <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: '40px minmax(0,1fr) 112px 120px 100px 200px', gap: 16, padding: '0 16px 8px', fontSize: 12, fontWeight: 600, color: C.textMuted }}>
            <span /><span>Faktura · Mijoz</span><span>Yaratilgan</span><span>Kutmoqda</span><span>Berilgan vaqt</span><span>Biriktirish</span>
          </div>
        )}
        <div role="listbox" aria-label="Buyurtmalar" aria-activedescendant={sel ? `pq-${sel.id}` : undefined} tabIndex={0} onKeyDown={onListKey} className="pk-focus"
          style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: online ? 1 : 0.7, borderRadius: 12 }}>
          {vis.map((o) => {
            const a = ASSIGN[assignOf(o)];
            const on = o.id === selId;
            const other = assignOf(o) === 'other';
            const tf = other ? C.text2 : C.text;
            const cf = other ? C.text2 : C.textBody;
            return (
              <div key={o.id} id={`pq-${o.id}`} role="option" aria-selected={on} className="pk-row"
                aria-label={`Faktura ${o.invoiceNumber}, ${o.client?.orgName || ''}, ${other ? 'boshqa terimchiga biriktirilgan' : a.label}, ${waitLabel(o.createdAt, now)} kutmoqda`}
                onClick={() => { setSelId(o.id); if (flow === 'success') setFlow(''); }}
                style={{ background: on ? C.primarySoft : '#FFFFFF', border: `1px solid ${on ? C.primary : C.border}`, borderRadius: 12, padding: rowWide ? '12px 16px' : '12px 14px' }}>
                {rowWide ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '40px minmax(0,1fr) 112px 120px 100px 200px', gap: 16, alignItems: 'center' }}>
                    <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 10, background: a.lb, color: a.lf, display: 'grid', placeItems: 'center' }}><a.L size={20} /></span>
                    <div style={{ minWidth: 0 }}>
                      <div className="tnum" style={{ fontSize: 15, fontWeight: 700, color: tf }}>№ {o.invoiceNumber}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: cf, overflowWrap: 'anywhere' }}>{o.client?.orgName}</div>
                    </div>
                    <div className="tnum" style={{ fontSize: 14 }}><div style={{ fontWeight: 600 }}>{hm(o.createdAt)}</div><div style={{ fontSize: 13, color: C.text2 }}>{dmy(o.createdAt)}</div></div>
                    <div className="tnum" style={{ fontSize: 14, fontWeight: 500, color: C.textBody }}>{waitLabel(o.createdAt, now)}</div>
                    <div className="tnum" style={{ fontSize: 14, color: C.textBody }}>{o.pickingDuration} daq</div>
                    <Chip icon={a.Icon} bg={a.bg} fg={a.fg} style={{ justifySelf: 'start', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chipLabel(o)}</Chip>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {!mobile && <span aria-hidden="true" style={{ width: 40, height: 40, flex: 'none', borderRadius: 10, background: a.lb, color: a.lf, display: 'grid', placeItems: 'center' }}><a.L size={20} /></span>}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="tnum" style={{ fontSize: 16, fontWeight: 700, color: tf }}>№ {o.invoiceNumber}</span>
                        <Chip size="sm" icon={a.Icon} bg={a.bg} fg={a.fg}>{chipLabel(o, true)}</Chip>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 500, color: cf, overflowWrap: 'anywhere' }}>{o.client?.orgName}</div>
                      <div className="tnum" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.text2 }}>
                        <Clock size={14} style={{ flex: 'none' }} aria-hidden="true" />
                        <span style={{ flex: 1 }}>{hm(o.createdAt)} · {waitLabel(o.createdAt, now)} kutmoqda</span>
                        {mobile && <ChevronRight size={18} color={C.textMuted} aria-hidden="true" />}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </>
    );
  }

  // ── Inspector ──
  let inspector = null;
  if (flow === 'success' && success) {
    inspector = (
      <div role="status" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12, padding: 32 }}>
        <span style={{ width: 64, height: 64, borderRadius: 999, background: C.successSoft, color: C.success, display: 'grid', placeItems: 'center' }}><CircleCheck size={30} aria-hidden="true" /></span>
        <div style={{ fontWeight: 700, fontSize: 19 }}>Buyurtma muvaffaqiyatli qabul qilindi</div>
        <div className="tnum" style={{ fontSize: 14, color: C.text2 }}>№ {success.no} · Terish vaqti boshlandi</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.primaryHover, fontWeight: 500 }}><LoaderCircle size={16} className="pk-spin" aria-hidden="true" />Mening buyurtmalarim sahifasiga o‘tilmoqda…</div>
        <Btn variant="primary" onClick={() => { clearTimeout(goTimer.current); navigate('/picker/mine'); }}>Mening buyurtmalarimga o‘tish<ArrowRight size={18} aria-hidden="true" /></Btn>
      </div>
    );
  } else if (sel) {
    const a = ASSIGN[selAssign];
    inspector = (
      <>
        <InspectorBody mobile={mobile}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, color: C.text2, fontWeight: 500 }}>Faktura</div>
            <div className="tnum" style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-.01em', overflowWrap: 'anywhere' }}>№ {sel.invoiceNumber}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Chip size="sm" icon={CircleDot}>Yangi</Chip>
              <Chip size="sm" icon={a.Icon} bg={a.bg} fg={a.fg}>{chipLabel(sel)}</Chip>
            </div>
            <div className="tnum" style={{ fontSize: 14, color: C.text2 }}>Yaratilgan: {dmy(sel.createdAt)}, {hm(sel.createdAt)} · {waitLabel(sel.createdAt, now)} kutmoqda</div>
          </div>
          {selAssign === 'other' && (
            <div role="note" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: C.surfaceMuted, border: `1px solid ${C.borderStrong}`, borderRadius: 12, padding: '12px 14px', color: C.textBody }}>
              <Lock size={20} style={{ flex: 'none', marginTop: 1 }} aria-hidden="true" />
              <div><div style={{ fontWeight: 600, fontSize: 14 }}>Bu buyurtma boshqa terimchiga biriktirilgan.</div><div style={{ fontSize: 13 }}>Biriktirilgan: {sel.assignedPicker?.fullName || '—'}. Tafsilotlarni ko‘rish mumkin, qabul qilish mumkin emas.</div></div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionTitle>Mijoz</SectionTitle>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, overflowWrap: 'anywhere' }}>{sel.client?.orgName}</div>
            <div style={{ display: 'flex', gap: 8, fontSize: 14 }}><span style={{ color: C.text2 }}>INN</span><span className="tnum" style={{ fontWeight: 600 }}>{fmtInn(sel.client?.inn) || 'Ma’lumot mavjud emas'}</span></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionTitle>Hujjatlar</SectionTitle>
            <FactList items={[
              ['Shartnoma', sel.contractNumber || '—'],
              ['Faktura', sel.invoiceNumber || '—'],
              ['Lot', sel.lotNumber || 'Ko‘rsatilmagan', !sel.lotNumber],
            ]} />
            <ExcelButton url={sel.productsExcelUrl} full disabled={!online} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionTitle>Terish vaqti</SectionTitle>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: C.canvas, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
              <Hourglass size={20} color={C.text2} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />
              <div><div className="tnum" style={{ fontWeight: 600, fontSize: 16 }}>Berilgan vaqt: {sel.pickingDuration} daqiqa</div><div style={{ fontSize: 14, color: C.text2 }}>Vaqt buyurtma qabul qilingandan keyin boshlanadi.</div></div>
            </div>
          </div>
        </InspectorBody>
        <InspectorFoot mobile={mobile}>
          {reason && (
            <div id="accept-reason" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textBody, fontWeight: 500 }}>
              {selAssign === 'mine' ? <UserCheck size={16} aria-hidden="true" /> : <Lock size={16} aria-hidden="true" />}{reason}
            </div>
          )}
          <Btn variant="primary" h={52} icon={CircleCheck} onClick={openConfirm} disabled={!canAccept} aria-describedby={reason ? 'accept-reason' : undefined} style={{ width: '100%' }}>Buyurtmani qabul qilish</Btn>
        </InspectorFoot>
      </>
    );
  } else if (mode === 'split') {
    inspector = loading ? (
      <div aria-busy="true" style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="pk-skel" style={{ width: 60, height: 14, borderRadius: 6 }} />
        <span className="pk-skel" style={{ width: 160, height: 28, borderRadius: 8 }} />
        <span className="pk-skel" style={{ height: 72, borderRadius: 12 }} />
        <span className="pk-skel" style={{ height: 120, borderRadius: 12 }} />
      </div>
    ) : (
      <InspectorPlaceholder icon={MousePointerClick} title="Buyurtmani tanlang" desc="Tafsilotlar, hujjatlar va qabul qilish tugmasi shu yerda ochiladi.">
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: C.text2, flexWrap: 'wrap', justifyContent: 'center' }}><Kbd>↑</Kbd><Kbd>↓</Kbd> tanlash · <Kbd>Enter</Kbd> qabul qilish</div>
      </InspectorPlaceholder>
    );
  }

  const dlgOpen = ['confirm', 'sending', 'error'].includes(flow) && !!sel;
  const sending = flow === 'sending';

  return (
    <>
      <Workspace
        vw={vw}
        listLabel="Buyurtmalar navbati"
        bar={<PageBar title="Mavjud buyurtmalar" count={ready ? `${counts.all} ta` : null} rs={rs} onRefresh={() => query.refetch()} refreshing={query.isFetching} refreshDisabled={!online} pad={vw >= 1280 ? 24 : 20} />}
        mobileTitle={<MobileTitle title="Mavjud buyurtmalar" count={ready ? `${counts.all} ta` : null} rs={rs} />}
        toolbar={(
          <>
            {!online && <OfflineBanner note="Ro‘yxat oxirgi yuklangan holatda. Qabul qilish vaqtincha o‘chirilgan." />}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' }}>
              <SearchBox value={q} onChange={setQ} placeholder="Faktura, mijoz yoki INN" label="Faktura, mijoz yoki INN bo‘yicha qidiruv" max={mobile ? 'none' : 420} />
              {mobile && <SortSelect iconOnly value={sort} onChange={setSort} options={SORTS} />}
              <Segment label="Biriktirish bo‘yicha filtr" options={filters} value={filter} onChange={setFilter} compact={compactF} />
              {!mobile && <SortSelect value={sort} onChange={setSort} options={SORTS} />}
            </div>
            {ready && vis.length > 0 && (
              <div style={{ fontSize: 13, color: C.text2 }}>{vis.length} ta ko‘rsatilmoqda{q || filter !== 'all' ? ` · jami ${counts.all}` : ''} · qidiruv yuklangan ro‘yxat ichida</div>
            )}
          </>
        )}
        inspector={inspector}
        insOpen={!!sel || flow === 'success'}
        onCloseIns={() => { setSelId(null); if (flow === 'success') setFlow(''); }}
        insLabel="Buyurtma tafsilotlari"
        insTopTitle={mobile ? 'Buyurtma tafsilotlari' : 'Tafsilotlar'}
      >
        {list}
      </Workspace>

      <Dialog
        open={dlgOpen} onClose={closeDialog} busy={sending} mobile={mobile} labelId="acc-title"
        icon={err ? TriangleAlert : CircleCheck} iconBg={err ? C.warningSoft : C.primarySoft} iconFg={err ? C.warning : C.primary}
        title="Buyurtmani qabul qilasizmi?"
        desc="Buyurtmani qabul qilganingizdan keyin terish vaqti hisoblanishni boshlaydi."
        footer={(
          <>
            <Btn variant="outline" onClick={closeDialog} disabled={sending} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>{err ? 'Yopish' : 'Bekor qilish'}</Btn>
            {err ? (
              <Btn variant="primary" icon={RefreshCw} data-autofocus="true" onClick={refreshAfterError} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>{err.kind === 'unknown' ? 'Holatni tekshirish' : 'Ro‘yxatni yangilash'}</Btn>
            ) : (
              <Btn variant="primary" data-autofocus="true" loading={sending} onClick={confirmAccept} disabled={sending} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>{sending ? 'Yuborilmoqda…' : 'Qabul qilishni tasdiqlash'}</Btn>
            )}
          </>
        )}
      >
        {sel && <DialogSummary no={sel.invoiceNumber} right={`Berilgan vaqt: ${sel.pickingDuration} daqiqa`} client={sel.client?.orgName} />}
        {err && (
          <DialogAlert
            icon={err.kind === 'forbidden' ? Lock : Info}
            title={err.kind === 'forbidden' ? 'Ushbu amalni bajarishga ruxsatingiz yo‘q.' : err.kind === 'unknown' ? 'Natija noma’lum.' : 'Bu buyurtmani qabul qilib bo‘lmadi.'}
            text={err.msg}
          />
        )}
      </Dialog>
    </>
  );
}
