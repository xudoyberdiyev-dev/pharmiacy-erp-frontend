import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UserCheck, Scale, CircleSlash, Check, X, Send, LoaderCircle, CircleAlert, CircleCheck } from 'lucide-react';
import { markerAPI } from '../../api';
import { getErrorMessage } from '../../lib/errors';
import { C, FONT, MONO, SHADOW } from './design/tokens';
import {
  EtirozlarHeader, StatusBadge, Segmented, CardSkeleton, StateBox, ErrorState, SHARED_CSS,
  TYPE_LABELS, REJECT_REASONS, REJECT_LABELS, dt, btnOutline, btnPrimary, btnDisabled,
} from './etirozlar/shared';

// Route: /marker/etirozlar-received — "Menga bildirilganlar" (Phase 06).
// Backend getEtirozliReceived: markerId=me orderlar, etirozlar where fromRole=CHECKER,
// toRole=MARKER (barcha holatlar). Javob: PATCH /marker/etirozlar/:id/accept|reject —
// atomik (faqat PENDING), takroriy javobga 409.
// Jarima: checkerController.raiseEtirov har bir e'tiroz uchun CHECKER_ETIROV_PENALTY_POINTS = 5
// ni RAISE paytida yozadi; javob jarimani bekor qilmaydi. Jarima yozuvi API'da qaytmaydi —
// faqat e'tirozning `voided` belgisi ko'rinadi.
const PENALTY_POINTS = 5;

export default function MarkerEtirozlarReceivedPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('pending');
  const [dlg, setDlg] = useState(null); // { type: 'accept'|'reject', etirov, order }

  const { data: orders = [], isLoading, isError, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['marker-etirozli-received'],
    queryFn: markerAPI.getEtirozliReceived,
    refetchInterval: 30000,
    // Avval faqat PENDING orderlar saqlanardi — javob berilganlari yo'qolib qolardi.
    // Endi barcha ma'lumot saqlanadi, filtrlash UI'da.
    select: (r) => r.data.data || [],
  });

  const all = useMemo(() => orders.flatMap((o) => (o.etirozlar || []).map((e) => ({ e, o }))), [orders]);
  // Backend (checkerController.raiseEtirov) bitta bildirishda bir nechta sabab
  // bo'lsa ham jarimani BIR MARTA yozadi. Bir vaqtda (5 soniya ichida) yaratilgan
  // e'tirozlar bitta bildirish hisoblanadi — "−5 ball" faqat birinchisida ko'rsatiladi.
  const penaltyHead = useMemo(() => {
    const ids = new Set();
    orders.forEach((o) => {
      // Yangidan eskiga (sahifadagi tartib) — har guruhning birinchi ko'rinadigan qatoriga
      const list = [...(o.etirozlar || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      let last = null;
      list.forEach((e) => {
        const t = new Date(e.createdAt).getTime();
        if (last == null || last - t > 5000) ids.add(e.id);
        last = t;
      });
    });
    return ids;
  }, [orders]);
  const nPending = all.filter(({ e }) => e.status === 'PENDING').length;
  const nAnswered = all.length - nPending;
  const visible = orders.map((o) => ({ o, et: (o.etirozlar || []).filter((e) => (filter === 'pending' ? e.status === 'PENDING' : e.status !== 'PENDING')) })).filter((c) => c.et.length);
  const ok = !isLoading && !isError;
  const refresh = () => qc.invalidateQueries({ queryKey: ['marker-etirozli-received'] });

  return (
    <div className="mke" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0, font: `400 14px/20px ${FONT}`, color: C.text }}>
      <style>{SHARED_CSS}</style>
      <EtirozlarHeader dataUpdatedAt={dataUpdatedAt} isFetching={isFetching} onRefresh={() => refetch()} />

      {ok && all.length > 0 && (
        <div role="note" style={{ background: C.warning.bg, border: `1px solid ${C.warning.border}`, borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Scale size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: C.warning.main, flex: 'none' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ font: `600 14px/20px ${FONT}`, color: '#78350F' }}>Har bir bildirish uchun {PENALTY_POINTS} jarima bali darhol yoziladi</span>
            <span style={{ font: `400 13px/18px ${FONT}`, color: C.warning.text }}>Tekshiruvchi bir bildirishda bir nechta sabab ko'rsatsa ham jarima bir marta yoziladi. "Roziman" ham, "Roziman emasman" ham jarimani bekor qilmaydi — javobingiz izoh sifatida saqlanadi.</span>
          </div>
        </div>
      )}

      {ok && all.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2 }}>Tekshiruvchi sizga bildirgan e'tirozlar</span>
          <Segmented label="Javob holati" value={filter} onChange={setFilter} items={[['pending', 'Javob kutilmoqda', nPending], ['answered', 'Javob berilgan', nAnswered]]} />
        </div>
      )}

      {isLoading && [0, 1].map((i) => <CardSkeleton key={i} />)}
      {isError && <ErrorState onRetry={() => refetch()} isFetching={isFetching} />}

      {ok && visible.map(({ o, et }) => (
        <article key={o.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
            <span style={{ font: `500 13px/18px ${MONO}`, color: C.text2, whiteSpace: 'nowrap', flex: 'none' }}>№ {o.invoiceNumber}</span>
            <span className="mk-ellipsis" style={{ font: `600 15px/22px ${FONT}`, minWidth: 0 }}>{o.client?.orgName || '—'}</span>
            <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, font: `400 13px/18px ${FONT}`, color: C.text2, whiteSpace: 'nowrap' }}><UserCheck size={14} aria-hidden="true" />Tekshiruvchi: <span style={{ color: C.text, fontWeight: 500 }}>{o.checker?.fullName || '—'}</span></span>
          </header>
          {et.map((e) => (
            <div key={e.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: '16px 24px', padding: '14px 16px', borderTop: `1px solid ${C.surface2}`, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ font: `600 14px/20px ${FONT}` }}>{TYPE_LABELS[e.type] || e.type}</span>
                  <StatusBadge status={e.status} />
                  {(e.voided || penaltyHead.has(e.id)) && <PenaltyChip voided={e.voided} />}
                </span>
                {e.comment && <span style={{ font: `400 13px/18px ${FONT}`, color: C.textBody, overflowWrap: 'anywhere' }}>{e.comment}</span>}
                <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>Bildirildi: {dt(e.createdAt)}</span>
              </div>
              {e.status === 'PENDING' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button type="button" className="mke-out" style={{ ...btnOutline(), padding: '0 10px', whiteSpace: 'nowrap' }} onClick={() => setDlg({ type: 'accept', etirov: e, order: o })}><Check size={16} aria-hidden="true" style={{ color: C.success.main }} />Roziman</button>
                  <button type="button" className="mke-out" style={{ ...btnOutline(), padding: '0 10px', whiteSpace: 'nowrap' }} onClick={() => setDlg({ type: 'reject', etirov: e, order: o })}><X size={16} aria-hidden="true" style={{ color: C.danger.main }} />Roziman emasman</button>
                </div>
              ) : (
                <div style={{ padding: '10px 12px', borderRadius: 6, background: C.bgApp, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>Sizning javobingiz</span>
                  <span style={{ font: `600 13px/18px ${FONT}` }}>{e.status === 'ACCEPTED' ? 'Roziman' : 'Roziman emasman'}</span>
                  {e.responseTypes?.length > 0 && <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{e.responseTypes.map((t) => <span key={t} style={{ height: 22, padding: '0 8px', borderRadius: 4, background: '#fff', border: `1px solid ${C.borderStrong}`, font: `500 12px/16px ${FONT}`, color: C.textBody, display: 'inline-flex', alignItems: 'center' }}>{REJECT_LABELS[t] || t}</span>)}</span>}
                  {e.responseComment && <span style={{ font: `400 13px/18px ${FONT}`, color: C.textBody, overflowWrap: 'anywhere' }}>{e.responseComment}</span>}
                  <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>{dt(e.resolvedAt)}</span>
                </div>
              )}
            </div>
          ))}
        </article>
      ))}

      {ok && all.length > 0 && visible.length === 0 && <StateBox compact title={filter === 'pending' ? "Javob kutayotgan e'tiroz yo'q" : "Hali hech bir e'tirozga javob bermagansiz"} />}
      {ok && all.length === 0 && <StateBox tone="success" Icon={CircleCheck} title="Sizga bildirilgan e'tirozlar yo'q" desc="Tekshiruvchi e'tiroz bildirsa, u shu yerda ko'rinadi." />}

      {dlg?.type === 'accept' && <AcceptDialog {...dlg} onClose={() => setDlg(null)} onDone={refresh} />}
      {dlg?.type === 'reject' && <RejectDialog {...dlg} onClose={() => setDlg(null)} onDone={refresh} />}
    </div>
  );
}

function PenaltyChip({ voided }) {
  const s = voided ? [C.surface2, C.text2, C.borderStrong, CircleSlash, "E'tiroz bekor qilingan", "Administrator bu e'tirozni bekor qilgan"] : [C.danger.bg, C.danger.text, C.danger.border, Scale, `−${PENALTY_POINTS} ball`, "E'tiroz bildirilganda yozilgan jarima"];
  const Icon = s[3];
  return <span title={s[5]} className="tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 22, padding: '0 6px', borderRadius: 4, font: `600 12px/16px ${FONT}`, background: s[0], color: s[1], border: `1px solid ${s[2]}` }}><Icon size={12} aria-hidden="true" />{s[4]}</span>;
}

function useRespond(etirov, order, action, onSuccess) {
  return useMutation({
    mutationFn: (body) => (action === 'accept' ? markerAPI.acceptEtirov(etirov.id) : markerAPI.rejectEtirov(etirov.id, body)),
    onSuccess: () => {
      toast.success(`${action === 'accept' ? "E'tirozga rozilik bildirildi" : 'Javobingiz saqlandi'} · № ${order.invoiceNumber}`);
      onSuccess();
    },
    onError: (e) => {
      // 409 — e'tirozga allaqachon javob berilgan (backend atomik tekshiruvi)
      toast.error(`№ ${order.invoiceNumber}: ${getErrorMessage(e)}`, { duration: Infinity });
      if (e?.response?.status === 409) onSuccess();
    },
  });
}

function Modal({ labelId, alert, width, onClose, busy, children }) {
  useEffect(() => {
    const k = (ev) => { if (ev.key === 'Escape' && !busy) onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [busy, onClose]);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div role={alert ? 'alertdialog' : 'dialog'} aria-modal="true" aria-labelledby={labelId} style={{ width: '100%', maxWidth: width, maxHeight: 'calc(100vh - 48px)', overflow: 'auto', background: '#fff', borderRadius: 12, boxShadow: SHADOW.lg }}>{children}</div>
    </div>
  );
}
const head = (id, title, sub, onClose, busy, Icon, tone) => (
  <div style={{ padding: '20px 24px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
    {Icon && <span style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: tone[0], color: tone[1], display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>}
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}><span id={id} style={{ font: `600 18px/26px ${FONT}` }}>{title}</span><span style={{ font: `400 13px/18px ${FONT}`, color: C.text2 }}>{sub}</span></div>
    <button type="button" className="mke-ib" aria-label="Yopish" disabled={busy} onClick={onClose} style={{ width: 32, height: 32, border: 'none', borderRadius: 6, background: 'transparent', color: C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
  </div>
);
const footer = { padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 };

function AcceptDialog({ etirov, order, onClose, onDone }) {
  const m = useRespond(etirov, order, 'accept', () => { onDone(); onClose(); });
  return (
    <Modal labelId="mke-ac" alert width={480} onClose={onClose} busy={m.isPending}>
      {head('mke-ac', "E'tirozga rozilik bildirish", `№ ${order.invoiceNumber} · ${order.client?.orgName || ''}`, onClose, m.isPending, Check, [C.success.bg, C.success.main])}
      <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: '10px 12px', borderRadius: 6, background: C.bgApp, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ font: `600 14px/20px ${FONT}` }}>{TYPE_LABELS[etirov.type] || etirov.type}</span>
          {etirov.comment && <span style={{ font: `400 13px/18px ${FONT}`, color: C.textBody }}>{etirov.comment}</span>}
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, font: `400 13px/18px ${FONT}`, color: C.textBody }}>
          <li>Tekshiruvchining e'tirozi to'g'ri deb qayd etiladi.</li>
          <li>Bildirish paytida yozilgan {PENALTY_POINTS} jarima bali o'z kuchida qoladi.</li>
          <li>Javob yuborilgach uni o'zgartirib bo'lmaydi.</li>
        </ul>
      </div>
      <div style={footer}>
        <button type="button" className="mke-out" style={btnOutline(40)} onClick={onClose} disabled={m.isPending}>Bekor qilish</button>
        <button type="button" className="mke-pri" autoFocus style={btnPrimary(40)} onClick={() => m.mutate()} disabled={m.isPending}>
          {m.isPending ? <LoaderCircle size={16} aria-hidden="true" style={{ animation: 'mkspin .9s linear infinite' }} /> : <Check size={16} aria-hidden="true" />}
          {m.isPending ? 'Yuborilmoqda…' : 'Ha, roziman'}
        </button>
      </div>
    </Modal>
  );
}

function RejectDialog({ etirov, order, onClose, onDone }) {
  const [sel, setSel] = useState([]);
  const [comment, setComment] = useState('');
  const m = useRespond(etirov, order, 'reject', () => { onDone(); onClose(); });
  const needComment = sel.includes('OTHER') && !comment.trim();
  // Backend qoidasi: kamida bitta sabab YOKI izoh. Frontend qo'shimcha: "Boshqa izoh" bo'lsa izoh shart.
  const invalid = needComment || (!sel.length && !comment.trim());
  const submit = () => { if (!invalid && !m.isPending) m.mutate({ responseTypes: sel, responseComment: comment.trim() || undefined }); };
  return (
    <Modal labelId="mke-rj" width={520} onClose={onClose} busy={m.isPending}>
      {head('mke-rj', 'Roziman emasman', `№ ${order.invoiceNumber} · ${TYPE_LABELS[etirov.type] || etirov.type}`, onClose, m.isPending)}
      <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2 }}>Kamida bitta sabab tanlang yoki izoh yozing. Jarima bekor bo'lmaydi — javobingiz izoh sifatida saqlanadi.</span>
        <div role="group" aria-label="Sabablar" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {REJECT_REASONS.map((r) => {
            const on = sel.includes(r.value);
            return (
              <label key={r.value} style={{ minHeight: 40, padding: '8px 12px', borderRadius: 6, border: `1px solid ${on ? C.p700 : C.border}`, background: on ? C.p50 : '#fff', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={on} disabled={m.isPending} onChange={() => setSel((p) => (on ? p.filter((v) => v !== r.value) : [...p, r.value]))} style={{ width: 16, height: 16, accentColor: C.p700 }} />{r.label}
              </label>
            );
          })}
        </div>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ font: `500 13px/18px ${FONT}`, color: C.textBody }}>Izoh <span style={{ fontWeight: 400, color: C.textMuted }}>· {sel.includes('OTHER') ? 'Majburiy — "Boshqa izoh" tanlangan' : 'Ixtiyoriy'}</span></span>
          <textarea className="mke-in" value={comment} onChange={(e) => setComment(e.target.value)} disabled={m.isPending} rows={3} aria-invalid={needComment} placeholder="Nima uchun e'tiroz noto'g'ri deb hisoblaysiz…" style={{ padding: '8px 12px', border: `1px solid ${needComment ? C.danger.main : C.borderStrong}`, borderRadius: 6, font: `400 14px/20px ${FONT}`, resize: 'vertical', outline: 'none' }} />
          {needComment && <span role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 12px/16px ${FONT}`, color: C.danger.text }}><CircleAlert size={14} aria-hidden="true" />"Boshqa izoh" uchun izoh yozish shart</span>}
        </label>
      </div>
      <div style={footer}>
        <button type="button" className="mke-out" style={btnOutline(40)} onClick={onClose} disabled={m.isPending}>Bekor qilish</button>
        <button type="button" className="mke-pri" style={{ ...btnPrimary(40), ...(invalid && !m.isPending ? btnDisabled : null) }} onClick={submit} disabled={invalid || m.isPending}>
          {m.isPending ? <LoaderCircle size={16} aria-hidden="true" style={{ animation: 'mkspin .9s linear infinite' }} /> : <Send size={16} aria-hidden="true" />}
          {m.isPending ? 'Yuborilmoqda…' : 'Javobni yuborish'}
        </button>
      </div>
    </Modal>
  );
}
