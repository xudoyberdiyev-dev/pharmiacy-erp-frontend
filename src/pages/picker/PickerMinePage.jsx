import { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Clock, TriangleAlert, OctagonAlert, Hourglass, RotateCcw, CircleHelp, Package, ArrowRight, Lock, WifiOff,
  CircleCheck, PackageCheck, ClipboardList, RefreshCw, Info,
} from 'lucide-react';
import { pickerAPI } from '../../api';
import { C } from './design/tokens';
import {
  Chip, Btn, PageBar, MobileTitle, OfflineBanner, StateBlock, RetryButton, ExcelButton,
  Dialog, DialogSummary, DialogAlert, refreshState, classifyError,
} from './design/ui';
import { hm, mmss, todayISO, sum as fmtSum, inn as fmtInn, isValidDate } from './lib/time';
import { useNow } from './lib/hooks';

// Shoshilinchlik chegaralari — backend getUrgency bilan bir xil (30 / 10 daqiqa)
const WARN_SEC = 30 * 60;
const CRIT_SEC = 10 * 60;

const T = {
  normal:   { label: 'Vaqt yetarli', Icon: Clock, tf: C.primary, cb: C.primarySoft, cf: C.primaryHover, tbd: C.border, tbg: C.canvas, pb: C.primarySoft, pf: C.primaryHover, pbd: C.primaryRing },
  warning:  { label: 'Vaqt kamaymoqda', Icon: TriangleAlert, tf: C.warning, cb: C.warningSoft, cf: C.warning, tbd: C.warningLine, tbg: C.warningBg, pb: C.warningSoft, pf: C.warning, pbd: C.warningLine },
  critical: { label: 'Kritik — 10 daqiqadan kam qoldi', Icon: OctagonAlert, tf: C.danger, cb: C.dangerSoft, cf: C.danger, tbd: C.dangerLine, tbg: C.dangerBg, pb: C.dangerSoft, pf: C.danger, pbd: C.dangerLine },
  overdue:  { label: 'Muddat o‘tdi', Icon: TriangleAlert, tf: C.overdue, cb: C.dangerBg, cf: C.overdue, tbd: C.overdue, tbg: C.dangerBg, pb: C.overdue, pf: '#FFFFFF', pbd: C.overdue },
  assigned: { pb: C.surfaceMuted, pf: C.textBody, pbd: C.border, Icon: Hourglass },
  returned: { pb: C.warningSoft, pf: C.warning, pbd: C.warningLine, Icon: RotateCcw },
  invalid:  { pb: C.surfaceMuted, pf: C.textBody, pbd: C.border, Icon: CircleHelp },
};

const STATUS = {
  picking:  ['Terilmoqda', C.tealChip, C.primaryHover, Package],
  assigned: ['Qabul qilish kutilmoqda', C.surfaceMuted, C.textBody, Hourglass],
  returned: ['Qaytarilgan', C.warningSoft, C.warning, RotateCcw],
};

function kindOf(o) {
  if (o.returnedToPickingAt) return 'returned';
  if (o.status === 'NEW') return 'assigned';
  return 'picking';
}

// Qolgan soniyalar (server muddati bo'yicha); yaroqsiz bo'lsa null
function remainingSec(o, now) {
  if (kindOf(o) !== 'picking' || !isValidDate(o.pickingDeadline)) return null;
  return (new Date(o.pickingDeadline).getTime() - now) / 1000;
}

function tstate(o, now) {
  const k = kindOf(o);
  if (k !== 'picking') return k;
  const r = remainingSec(o, now);
  if (r == null || !Number.isFinite(r) || Math.abs(r) > 24 * 3600) return 'invalid';
  if (r < 0) return 'overdue';
  if (r <= CRIT_SEC) return 'critical';
  if (r <= WARN_SEC) return 'warning';
  return 'normal';
}

function resultText(result) {
  if (!result || result.diffMinutes == null) return { text: 'Server natija qaytarmadi', color: C.text2 };
  const d = Math.round(result.diffMinutes);
  if (d > 0) return { text: `${d} daqiqa kech yakunlandi`, color: C.danger };
  if (d < 0) return { text: `${-d} daqiqa erta yakunlandi`, color: C.success };
  return { text: 'Muddatida yakunlandi', color: C.success };
}

function TodayStats({ st, compact }) {
  const cells = [['Yakunlangan', st?.total, C.text], ['O‘z vaqtida', st?.earlyCount, C.success], ['Kechikkan', st?.lateCount, C.danger]];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: compact ? 6 : 8 }}>
      {cells.map(([k, v, c]) => (
        <div key={k} style={{ background: C.canvas, border: `1px solid ${C.border}`, borderRadius: 12, padding: compact ? '10px 12px' : '12px 14px' }}>
          <div style={{ fontSize: 13, color: C.text2 }}>{k}</div>
          <div className="tnum" style={{ fontSize: compact ? 20 : 24, fontWeight: 700, color: v == null ? C.textMuted : c }}>{v ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}

export default function PickerMinePage() {
  const { vw, online } = useOutletContext();
  const qc = useQueryClient();
  const now = useNow(1000);
  const [selId, setSelId] = useState(null);
  const [flow, setFlow] = useState('');   // '' | confirm | sending | success | error
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);

  const mineQ = useQuery({ queryKey: ['picker-mine'], queryFn: pickerAPI.getMine, refetchInterval: 15000, select: (r) => r.data.data || [] });
  const retQ = useQuery({ queryKey: ['picker-returned'], queryFn: pickerAPI.getReturned, refetchInterval: 15000, select: (r) => r.data.data || [] });
  const today = todayISO();
  const histQ = useQuery({ queryKey: ['picker-history', today], queryFn: () => pickerAPI.getHistory({ date: today }), refetchInterval: 60000, select: (r) => r.data });

  const orders = useMemo(() => {
    const list = [...(retQ.data || []), ...(mineQ.data || [])];
    const rank = (o) => {
      const s = tstate(o, now);
      if (s === 'returned') return [0, 0];
      if (s === 'assigned') return [3, 0];
      if (s === 'invalid') return [2, 0];
      return [1, remainingSec(o, now)];
    };
    return list.sort((a, b) => { const x = rank(a), y = rank(b); return x[0] - y[0] || x[1] - y[1]; });
  }, [mineQ.data, retQ.data, now]);

  const hasReturned = (retQ.data || []).length > 0;
  const activeCount = orders.filter((o) => kindOf(o) === 'picking').length;

  // Tanlov: mavjud bo'lmasa — birinchi faol terish
  useEffect(() => {
    if (flow === 'success') return;
    if (selId && orders.some((o) => o.id === selId)) return;
    const first = orders.find((o) => kindOf(o) === 'picking') || orders[0];
    setSelId(first ? first.id : null);
  }, [orders, selId, flow]);

  const sel = orders.find((o) => o.id === selId) || null;
  const mobile = vw < 640;
  const desk = vw >= 1024;
  const wide = vw >= 1600;
  const loading = mineQ.isLoading || retQ.isLoading;
  const isError = (mineQ.isError && !mineQ.data) || (retQ.isError && !retQ.data);
  const hasData = !loading && !isError && orders.length > 0;
  const rs = refreshState({ ...mineQ, isFetching: mineQ.isFetching || retQ.isFetching }, online);
  const refetchAll = () => { mineQ.refetch(); retQ.refetch(); histQ.refetch(); };

  const ts = sel ? tstate(sel, now) : 'normal';
  const valid = ['normal', 'warning', 'critical', 'overdue'].includes(ts);
  const r = sel ? remainingSec(sel, now) : null;
  const canCompleteType = sel && kindOf(sel) === 'picking';
  const blocked = !!(canCompleteType && hasReturned);
  const offlineBlocked = !!(canCompleteType && !online);
  const completeDisabled = !canCompleteType || blocked || offlineBlocked;

  const reason = blocked ? { Icon: Lock, color: C.warning, bg: C.warningBg, title: 'Yakunlash vaqtincha cheklangan.', text: 'Avval qaytgan buyurtmani qayta yig‘ib yuborishingiz kerak.' }
    : offlineBlocked ? { Icon: WifiOff, color: C.textBody, bg: C.canvas, title: 'Aloqa yo‘q.', text: 'Internet tiklanguncha yakunlab bo‘lmaydi.' }
      : { Icon: ArrowRight, color: C.text2, bg: '#FFFFFF', title: 'Keyingi bosqich: Marking', text: 'Tasdiqlagandan so‘ng buyurtma markirovkaga o‘tadi.' };

  const openConfirm = () => { if (completeDisabled) return; setErr(null); setFlow('confirm'); };
  const closeDialog = () => { if (flow === 'sending') return; setFlow(''); setErr(null); };
  const confirmComplete = async () => {
    if (flow !== 'confirm' || !sel) return;
    setFlow('sending');
    try {
      const res = await pickerAPI.complete(sel.id);
      setDone({ no: sel.invoiceNumber, client: sel.client?.orgName, result: res.data?.result, status: res.data?.data?.status });
      setFlow('success');
      setSelId(null);
      toast.success('Buyurtma Marking bo‘limiga yuborildi.');
      ['picker-mine', 'picker-returned', 'picker-stats', 'picker-history'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    } catch (e) {
      setErr(classifyError(e));
      setFlow('error');
    }
  };
  const recheck = () => { setFlow(''); setErr(null); refetchAll(); qc.invalidateQueries({ queryKey: ['picker-stats'] }); };

  const st = histQ.data?.stats;
  const remainingPicking = orders.filter((o) => kindOf(o) === 'picking');

  // ── Ro'yxat (navbat) ──
  const queue = hasData && (
    <section aria-label="Faol buyurtmalar ro‘yxati" style={{ gridArea: 'queue', minHeight: 0, overflow: desk ? 'auto' : 'visible', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '0 2px' }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{mobile || !desk ? 'Barcha faol buyurtmalar' : 'Ish navbati'}</h2>
        <span style={{ fontSize: 13, color: C.text2 }}>Muddat bo‘yicha</span>
      </div>
      <div role="listbox" aria-label="Faol buyurtmalar" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {orders.map((o) => {
          const s = tstate(o, now), t = T[s], rem = remainingSec(o, now), on = o.id === selId;
          const ptext = s === 'assigned' ? 'Kutilmoqda' : s === 'returned' ? 'Qaytgan' : s === 'invalid' ? '—' : s === 'overdue' ? `+${mmss(-rem)}` : mmss(rem);
          const words = s === 'assigned' ? 'qabul qilish kutilmoqda' : s === 'returned' ? 'qaytarilgan' : s === 'invalid' ? 'vaqt ma’lumoti yo‘q' : s === 'overdue' ? `muddatdan ${Math.ceil(-rem / 60)} daqiqa o‘tgan` : `${Math.ceil(rem / 60)} daqiqa qoldi`;
          const go = () => { setSelId(o.id); if (flow === 'success') setFlow(''); if (!desk) document.getElementById('pm-scroll')?.scrollTo({ top: 0, behavior: 'smooth' }); };
          return (
            <div key={o.id} role="option" aria-selected={on} tabIndex={0} className="pk-row" aria-label={`Faktura ${o.invoiceNumber}, ${o.client?.orgName || ''}, ${words}`}
              onClick={go} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }}
              style={{ background: on ? C.primarySoft : '#FFFFFF', border: `1px solid ${on ? C.primary : C.border}`, borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start', opacity: online ? 1 : 0.75 }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span className="tnum" style={{ fontSize: 15, fontWeight: 700 }}>№ {o.invoiceNumber}</span>
                <span style={{ fontSize: 14, color: C.textBody, overflowWrap: 'anywhere' }}>{o.client?.orgName}</span>
              </div>
              <Chip icon={t.Icon} bg={t.pb} fg={t.pf} border={t.pbd} style={{ fontWeight: 700 }}>{ptext}</Chip>
            </div>
          );
        })}
      </div>
    </section>
  );

  // ── Asosiy (hero) ──
  let hero = null;
  if (loading) {
    hero = (
      <div aria-busy="true" aria-label="Yuklanmoqda" style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <span className="pk-skel" style={{ width: 140, height: 28, borderRadius: 8 }} />
        <span className="pk-skel" style={{ width: '60%', height: 16, borderRadius: 6 }} />
        <div style={{ fontSize: 14, color: C.text2 }}>Vaqt ma’lumoti yuklanmoqda…</div>
        <span className="pk-skel" style={{ height: 160, borderRadius: 14 }} />
      </div>
    );
  } else if (isError) {
    hero = <StateBlock kind="error" title="Buyurtmalarni yuklab bo‘lmadi." desc="Server javob bermadi. Faol buyurtmalaringiz yo‘q degani emas." action={<RetryButton onClick={refetchAll} />} />;
  } else if (flow === 'success' && done) {
    const res = resultText(done.result);
    hero = (
      <div role="status" style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 16, padding: mobile ? 16 : 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ width: 52, height: 52, flex: 'none', borderRadius: 999, background: C.successSoft, color: C.success, display: 'grid', placeItems: 'center' }}><CircleCheck size={26} aria-hidden="true" /></span>
          <div><div style={{ fontWeight: 700, fontSize: 19 }}>Buyurtma yig‘ildi va Marking bo‘limiga yuborildi.</div><div className="tnum" style={{ fontSize: 14, color: C.text2 }}>№ {done.no} · {done.client}</div></div>
        </div>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 8 }}>
          <div style={{ background: C.canvas, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}><dt style={{ fontSize: 13, color: C.text2 }}>Holat</dt><dd style={{ margin: 0, fontWeight: 600 }}>{done.status === 'MARKING' || !done.status ? 'Markirovkada' : done.status}</dd></div>
          <div style={{ background: C.canvas, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}><dt style={{ fontSize: 13, color: C.text2 }}>Server natijasi</dt><dd className="tnum" style={{ margin: 0, fontWeight: 600, color: res.color }}>{res.text}</dd></div>
        </dl>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {remainingPicking.length > 0 && <Btn variant="primary" onClick={() => { setFlow(''); setDone(null); setSelId(remainingPicking[0].id); }}>Keyingi buyurtmaga o‘tish<ArrowRight size={18} aria-hidden="true" /></Btn>}
          <Link to="/picker/late" className="pk-btn pk-outline" style={{ height: 48, padding: '0 18px' }}>Tarixni ko‘rish</Link>
        </div>
      </div>
    );
  } else if (!hasData) {
    hero = (
      <StateBlock icon={ClipboardList} title="Hozircha faol buyurtmalaringiz yo‘q." desc="Navbatdan buyurtma qabul qilganingizda u shu yerda paydo bo‘ladi."
        action={<Link to="/picker" className="pk-btn pk-primary" style={{ height: 48, padding: '0 18px' }}>Mavjud buyurtmalarni ko‘rish<ArrowRight size={18} aria-hidden="true" /></Link>} />
    );
  } else if (sel) {
    const k = kindOf(sel);
    const S = STATUS[k];
    const t = T[ts] || {};
    const elapsed = valid && isValidDate(sel.pickingStartedAt) ? (now - new Date(sel.pickingStartedAt).getTime()) / 1000 : 0;
    const given = sel.pickingDuration || 0;
    const pct = valid && given ? Math.min(100, Math.max(0, (elapsed / (given * 60)) * 100)) : 0;
    const timerText = ts === 'overdue' ? `+${mmss(-r)}` : valid ? mmss(r) : '';
    const heroPad = mobile ? 16 : 24;
    const timerSize = mobile ? 56 : vw >= 1280 ? 80 : 72;
    hero = (
      <article aria-labelledby="pm-hero-title" style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: '0 1px 2px rgba(15,23,42,.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: heroPad, display: 'flex', flexDirection: 'column', gap: mobile ? 16 : 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: C.text2, fontWeight: 500 }}>Faktura</span>
                <Chip size="sm" icon={S[3]} bg={S[1]} fg={S[2]}>{S[0]}</Chip>
              </div>
              <h2 id="pm-hero-title" className="tnum" style={{ margin: 0, fontSize: mobile ? 26 : 32, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-.01em', overflowWrap: 'anywhere' }}>№ {sel.invoiceNumber}</h2>
              <div style={{ fontSize: 16, fontWeight: 500, color: C.textBody, overflowWrap: 'anywhere' }}>{sel.client?.orgName}</div>
            </div>
            {!mobile && <ExcelButton url={sel.productsExcelUrl} label="Excel" disabled={!online} />}
          </div>

          {valid && (
            <div style={{ border: `1px solid ${t.tbd}`, borderRadius: 14, background: t.tbg, padding: mobile ? 16 : 24, display: 'grid', gridTemplateColumns: vw >= 1280 ? 'minmax(0,1fr) 240px' : 'minmax(0,1fr)', gap: '16px 24px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <Chip icon={t.Icon} bg={t.cb} fg={t.cf} style={{ alignSelf: 'flex-start' }}>{t.label}</Chip>
                <div role="timer" aria-live="off" aria-label={ts === 'overdue' ? `Muddatdan ${Math.ceil(-r / 60)} daqiqa o‘tdi` : `Qolgan vaqt ${Math.ceil(r / 60)} daqiqa`}
                  className="tnum" style={{ fontSize: timerSize, fontWeight: 700, lineHeight: 1, letterSpacing: '-.02em', color: t.tf }}>{timerText}</div>
                <div style={{ fontSize: 14, color: ts === 'overdue' ? C.overdue : C.text2, fontWeight: ts === 'overdue' ? 600 : 500 }}>
                  {ts === 'overdue' ? `Muddatdan ${mmss(-r)} o‘tdi. Terishni imkon qadar tezroq yakunlang.` : 'Qolgan vaqt'}
                </div>
                <div aria-hidden="true" style={{ height: 8, borderRadius: 999, background: '#FFFFFF', border: `1px solid ${C.border}`, overflow: 'hidden', marginTop: 4 }}>
                  <div style={{ height: '100%', width: `${pct.toFixed(1)}%`, background: t.tf, borderRadius: 999, transition: 'width 1s linear' }} />
                </div>
                <div className="tnum" style={{ fontSize: 13, color: C.text2 }}>Vaqt: {Math.floor(elapsed / 60)} / {given} daq</div>
              </div>
              <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: vw >= 1280 ? '1fr' : 'repeat(3,minmax(0,1fr))', gap: 10 }}>
                {[['Qabul qilingan', hm(sel.pickingStartedAt)], ['Berilgan vaqt', `${given} daqiqa`], ['Tugash muddati', hm(sel.pickingDeadline)]].map(([a, b]) => (
                  <div key={a} style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px' }}>
                    <dt style={{ fontSize: 13, color: C.text2 }}>{a}</dt><dd className="tnum" style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{b}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {ts === 'assigned' && (
            <div style={{ border: `1px dashed ${C.borderStrong}`, borderRadius: 14, background: C.canvas, padding: 20, display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <span style={{ width: 44, height: 44, flex: 'none', borderRadius: 12, background: C.surfaceMuted, color: C.textBody, display: 'grid', placeItems: 'center' }}><Hourglass size={22} aria-hidden="true" /></span>
              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>Terish hali boshlanmagan</div>
                <div style={{ fontSize: 14, color: C.text2 }}>Buyurtmani qabul qilgandan keyin vaqt hisoblanadi. Operator biriktirgan — berilgan vaqt: {given} daqiqa.</div>
              </div>
              <Link to="/picker" state={{ selectId: sel.id }} className="pk-btn pk-primary" style={{ height: 48, padding: '0 16px' }}>Navbatda qabul qilish<ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
          )}

          {ts === 'returned' && (
            <div style={{ border: `1px solid ${C.warningLine}`, borderRadius: 14, background: C.warningBg, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: C.warning }}>
                <RotateCcw size={22} style={{ flex: 'none', marginTop: 1 }} aria-hidden="true" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>Qaytarilgan · vaqt hisoblanmaydi</div>
                  <div style={{ fontSize: 14, color: C.textBody, overflowWrap: 'anywhere' }}>{sel.returnReason ? `«${sel.returnReason}»` : 'Qaytarish sababi ko‘rsatilmagan.'}</div>
                  {sel.penalty && !sel.penalty.voided && <div style={{ fontSize: 13, marginTop: 2 }}>Qaytarilganda −{sel.penalty.points} ball qo‘llangan.</div>}
                </div>
              </div>
              <Link to="/picker/returned" state={{ selectId: sel.id }} className="pk-btn pk-primary" style={{ alignSelf: 'flex-start', height: 48, padding: '0 16px' }}>Qaytgan buyurtmalarga o‘tish<ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
          )}

          {ts === 'invalid' && (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.canvas, padding: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <CircleHelp size={22} color={C.text2} style={{ flex: 'none' }} aria-hidden="true" />
              <div><div style={{ fontWeight: 600, fontSize: 16 }}>Vaqt ma’lumoti mavjud emas.</div><div style={{ fontSize: 14, color: C.text2 }}>Server muddatni qaytarmadi — taxminiy vaqt ko‘rsatilmaydi. Yakunlash ruxsati serverdagi holatga asoslanadi.</div></div>
            </div>
          )}

          <dl style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: '6px 24px', fontSize: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}><dt style={{ color: C.text2 }}>INN</dt><dd className="tnum" style={{ margin: 0, fontWeight: 600 }}>{fmtInn(sel.client?.inn) || '—'}</dd></div>
            <div style={{ display: 'flex', gap: 8 }}><dt style={{ color: C.text2 }}>Buyurtma summasi</dt><dd className="tnum" style={{ margin: 0, fontWeight: 600 }}>{fmtSum(sel.totalAmount) != null ? `${fmtSum(sel.totalAmount)} so‘m` : '—'}</dd></div>
          </dl>
          {mobile && <ExcelButton url={sel.productsExcelUrl} full disabled={!online} />}
        </div>

        {k === 'picking' && !mobile && (
          <div style={{ borderTop: `1px solid ${C.border}`, padding: `16px ${heroPad}px`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 20px', background: reason.bg, borderRadius: '0 0 16px 16px' }}>
            <div id="pm-reason" style={{ flex: '1 1 260px', minWidth: 0, display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: reason.color }}>
              <reason.Icon size={20} style={{ flex: 'none', marginTop: 1 }} aria-hidden="true" />
              <span><strong style={{ fontWeight: 600, display: 'block' }}>{reason.title}</strong>{reason.text}</span>
            </div>
            <Btn variant="primary" h={52} icon={PackageCheck} onClick={openConfirm} disabled={completeDisabled} aria-describedby="pm-reason" style={{ minWidth: 240, fontSize: 17, padding: '0 24px' }}>Yig‘ib keldim</Btn>
          </div>
        )}
      </article>
    );
  }

  const mobileAction = mobile && hasData && sel && kindOf(sel) === 'picking' && flow !== 'success';
  const showStrip = hasData && !wide && vw >= 1280 && st;
  const cols = desk ? (wide ? `360px minmax(0,1fr) 320px` : `${vw < 1280 ? 300 : 340}px minmax(0,1fr)`) : 'minmax(0,1fr)';
  const areas = desk ? (wide ? `'banner banner banner' 'queue hero ctx'` : `'banner banner' 'queue hero'`) : `'banner' 'hero' 'queue' 'ctx'`;

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {!mobile && (
        <PageBar title="Mening buyurtmalarim" count={hasData ? `${activeCount} ta faol` : null} countBg={C.tealChip} countFg={C.primaryHover}
          rs={rs} onRefresh={refetchAll} refreshing={mineQ.isFetching || retQ.isFetching} refreshDisabled={!online} pad={vw >= 1280 ? 24 : 20}>
          {showStrip && (
            <div aria-label="Bugungi natijalar" className="tnum" style={{ display: 'flex', alignItems: 'center', gap: '6px 14px', marginLeft: 8, paddingLeft: 16, borderLeft: `1px solid ${C.border}`, fontSize: 13, color: C.text2, whiteSpace: 'nowrap' }}>
              <span>Bugun:</span>
              <span><strong style={{ color: C.text, fontWeight: 600 }}>{st.total}</strong> yakunlangan</span>
              <span><strong style={{ color: C.success, fontWeight: 600 }}>{st.earlyCount}</strong> o‘z vaqtida</span>
              <span><strong style={{ color: C.danger, fontWeight: 600 }}>{st.lateCount}</strong> kechikkan</span>
            </div>
          )}
        </PageBar>
      )}
      <div id="pm-scroll" style={{ flex: 1, minHeight: 0, overflow: desk ? 'hidden' : 'auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: cols, gridTemplateRows: desk ? 'auto minmax(0,1fr)' : 'auto', gridTemplateAreas: areas,
          gap: mobile ? 16 : 20, padding: mobile ? `16px 16px ${mobileAction ? (blocked || offlineBlocked ? 132 : 96) : 24}px` : vw >= 1280 ? 24 : 20,
          height: desk ? '100%' : 'auto', maxWidth: 1760, margin: '0 auto',
        }}>
          <div style={{ gridArea: 'banner', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            {mobile && <MobileTitle title="Mening buyurtmalarim" count={hasData ? `${activeCount} ta faol` : null} countBg={C.tealChip} countFg={C.primaryHover} rs={rs} />}
            {!online && <OfflineBanner note="Ko‘rsatilgan vaqtlar eskirgan bo‘lishi mumkin. «Yig‘ib keldim» aloqa tiklanguncha o‘chirilgan." />}
            {hasReturned && (
              <div role="alert" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center', background: C.warningSoft, color: C.warning, border: `1px solid ${C.warningLine}`, borderRadius: 12, padding: '10px 10px 10px 16px' }}>
                <RotateCcw size={20} style={{ flex: 'none' }} aria-hidden="true" />
                <div style={{ flex: '1 1 220px', minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 14 }}>Sizda qayta terilishi kerak bo‘lgan buyurtma mavjud.</div><div style={{ fontSize: 13 }}>Qaytgan buyurtma yig‘ib yuborilmaguncha boshqa buyurtmalarni yakunlab bo‘lmaydi.</div></div>
                <Link to="/picker/returned" className="pk-btn pk-warn-outline" style={{ height: 48, padding: '0 14px', fontSize: 14, borderRadius: 10 }}>Qaytgan buyurtmani ko‘rish</Link>
              </div>
            )}
          </div>
          {queue}
          <section aria-label="Tanlangan buyurtma" style={{ gridArea: 'hero', minHeight: 0, overflow: desk ? 'auto' : 'visible', minWidth: 0 }}>{hero}</section>
          {wide && hasData && (
            <aside aria-label="Bugungi natijalar" style={{ gridArea: 'ctx', minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Bugun</h2><span className="tnum" style={{ fontSize: 13, color: C.text2 }}>{today.split('-').reverse().join('.')} · server</span></div>
                <TodayStats st={st} />
                <div style={{ fontSize: 13, color: C.text2 }}>Qaytarilganlar «o‘z vaqtida»ga qo‘shilmaydi.</div>
              </div>
              <div style={{ background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Qoidalar</h2>
                {[[Lock, 'Qaytgan buyurtma bo‘lsa, boshqasini yakunlab bo‘lmaydi.'], [ArrowRight, '«Yig‘ib keldim» buyurtmani Marking bosqichiga o‘tkazadi.'], [Info, 'Dorilar ro‘yxati — Excel faylda.']].map(([I, txt]) => (
                  <div key={txt} style={{ display: 'flex', gap: 8, color: C.textBody }}><I size={16} style={{ flex: 'none', marginTop: 3, color: C.text2 }} aria-hidden="true" />{txt}</div>
                ))}
              </div>
            </aside>
          )}
          {!desk && hasData && (
            <div style={{ gridArea: 'ctx', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Bugun</h2><span style={{ fontSize: 13, color: C.text2 }}>server ma’lumoti</span></div>
              <TodayStats st={st} compact />
            </div>
          )}
        </div>
      </div>

      {mobileAction && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(64px + env(safe-area-inset-bottom))', zIndex: 25, background: '#FFFFFF', borderTop: `1px solid ${C.border}`, padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 -4px 16px rgba(15,23,42,.06)' }}>
          {blocked && <div id="pm-reason-m" style={{ display: 'flex', gap: 8, fontSize: 13, color: C.warning }}><Lock size={16} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" /><span><strong style={{ fontWeight: 600 }}>Yakunlash vaqtincha cheklangan.</strong> Avval qaytgan buyurtmani qayta yig‘ib yuborishingiz kerak.</span></div>}
          {offlineBlocked && <div style={{ display: 'flex', gap: 8, fontSize: 13, color: C.textBody }}><WifiOff size={16} aria-hidden="true" />Aloqa tiklanguncha yakunlab bo‘lmaydi.</div>}
          <Btn variant="primary" h={52} icon={PackageCheck} onClick={openConfirm} disabled={completeDisabled} aria-describedby={blocked ? 'pm-reason-m' : undefined} style={{ width: '100%', fontSize: 17 }}>Yig‘ib keldim</Btn>
        </div>
      )}

      <Dialog
        open={['confirm', 'sending', 'error'].includes(flow) && !!sel} onClose={closeDialog} busy={flow === 'sending'} mobile={mobile} labelId="pm-dlg-title"
        icon={err ? TriangleAlert : PackageCheck} iconBg={err ? C.warningSoft : C.primarySoft} iconFg={err ? C.warning : C.primary}
        title="Buyurtmani yig‘ishni yakunlaysizmi?"
        desc="Dorilarni yig‘ishni tugatganingizni tasdiqlang. Buyurtma keyingi bosqichga o‘tkaziladi."
        footer={(
          <>
            <Btn variant="outline" onClick={closeDialog} disabled={flow === 'sending'} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>{err ? 'Yopish' : 'Bekor qilish'}</Btn>
            {err
              ? <Btn variant="primary" icon={RefreshCw} data-autofocus="true" onClick={recheck} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>Holatni qayta tekshirish</Btn>
              : <Btn variant="primary" data-autofocus="true" loading={flow === 'sending'} disabled={flow === 'sending'} onClick={confirmComplete} style={{ flex: mobile ? '1 1 100%' : '0 0 auto' }}>{flow === 'sending' ? 'Yuborilmoqda…' : 'Yakunlashni tasdiqlash'}</Btn>}
          </>
        )}
      >
        {sel && <DialogSummary no={sel.invoiceNumber} client={sel.client?.orgName} right={ts === 'overdue' ? `Muddatdan ${mmss(-r)} o‘tdi` : valid ? `Qolgan vaqt: ${mmss(r)}` : 'Vaqt ma’lumoti mavjud emas'} />}
        {err && <DialogAlert icon={err.kind === 'forbidden' ? Lock : Info} title="Buyurtmani yakunlab bo‘lmadi." text={err.msg} />}
      </Dialog>
    </div>
  );
}
