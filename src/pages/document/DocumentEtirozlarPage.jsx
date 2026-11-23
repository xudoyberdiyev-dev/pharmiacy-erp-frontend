import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquareWarning, Clock, CircleCheck, Calculator, ChevronDown, ChevronUp, CornerDownRight, Send, CalendarDays, FilterX,
} from 'lucide-react';
import { documentAPI } from '../../api';
import { getErrorMessage } from '../../lib/errors';
import { C, FONT } from './design/tokens';
import {
  Page, PageHeader, RefreshControl, Card, SearchInput, Segmented, Badge, TONE, Button, BlankState, ErrorState, SearchEmpty,
  OfflineBanner, Skel, notify, RefreshBar, InlineAlert,
} from './design/ui';
import { dateTime, time, daysAgo } from './lib/format';
import { useOnline } from './lib/hooks';

// ─────────────────────────────────────────────────────────────────────────
// E'tirozlar — buxgalterlar hujjatlaringizga bildirgan e'tirozlar,
// buyurtma bo'yicha guruhlangan; javob kutayotganlar birinchi.
// Javob qoralamasi e'tiroz ID bo'yicha sahifa darajasida saqlanadi —
// 20 soniyalik avto-yangilanish yozilayotgan matnni o'chirib yubormaydi.
// ─────────────────────────────────────────────────────────────────────────

const TYPE = {
  WRONG_AMOUNT: 'Hujjatdagi summa noto‘g‘ri',
  WRONG_DOCUMENT_NUMBER: 'Hujjat raqami yoki sanasi noto‘g‘ri',
  ILLEGIBLE_DOCUMENT: 'Hujjat sifatsiz / o‘qib bo‘lmaydi',
  OTHER: 'Boshqa sabab',
};
const ROLE = { ACCOUNTANT1: 'Buxgalter 1', ACCOUNTANT2: 'Buxgalter 2' };
const answered = (e) => e.status === 'ACCEPTED' || !!e.responseComment;

function Comment({ text }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 140;
  return (
    <div style={{ padding: '10px 12px', borderRadius: 7, background: C.n50, border: `1px solid ${C.n200}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ font: `500 12px/16px ${FONT}`, color: C.n600 }}>Buxgalter izohi</span>
      <p className={open ? '' : 'dc-clamp3'} style={{ margin: 0, font: `400 13px/20px ${FONT}`, color: C.n900, overflowWrap: 'anywhere' }}>{text}</p>
      {long && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="dc-btn dc-link"
          style={{ height: 28, padding: '0 6px', marginLeft: -6, alignSelf: 'flex-start', fontSize: 12 }}
        >
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />} {open ? 'Qisqartirish' : 'To‘liq o‘qish'}
        </button>
      )}
    </div>
  );
}

function EtirozRow({ e, order, draft, setDraft, online }) {
  const qc = useQueryClient();
  const [err, setErr] = useState(null);
  const done = answered(e);
  const label = TYPE[e.type] || e.type;
  const mut = useMutation({
    mutationFn: () => documentAPI.respondEtirov(e.id, { responseComment: draft.trim() }),
    onSuccess: () => {
      setDraft('');
      notify({ title: 'Javob saqlandi', desc: `${order.invoiceNumber} · ${label}` });
      qc.invalidateQueries({ queryKey: ['document-etirozli'] });
      qc.invalidateQueries({ queryKey: ['document', 'counts'] });
    },
    onError: (x) => {
      setErr(`Javob yuborilmadi: ${getErrorMessage(x)} Matn saqlandi — qayta urinib ko‘ring.`);
      if (x?.response?.status === 409) qc.invalidateQueries({ queryKey: ['document-etirozli'] });
    },
  });
  const busy = mut.isPending;
  const empty = !draft.trim();
  const hintId = `et-h-${e.id}`;
  const hint = busy ? 'Yuborilmoqda — oynani yopmang.' : !online ? 'Aloqa tiklangach yuborish mumkin.' : empty ? 'Yuborish uchun javob matnini kiriting.' : 'Javob buxgalterga yuboriladi.';
  return (
    <article aria-label={`${label}, ${done ? 'javob berilgan' : 'javob kutilmoqda'}`} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24, padding: 16, borderBottom: `1px solid ${C.n100}` }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ font: `600 14px/20px ${FONT}`, color: C.n900 }}>{label}</span>
          {done
            ? <Badge {...TONE.success} icon={CircleCheck}>Javob berildi</Badge>
            : <Badge {...TONE.warning} icon={Clock}>Javob kutilmoqda</Badge>}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', font: `400 12px/16px ${FONT}`, color: C.n600 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calculator size={16} aria-hidden="true" /> {ROLE[e.fromRole] || e.fromRole}</span>
          <span className="tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={16} aria-hidden="true" /> {dateTime(e.createdAt)}</span>
        </div>
        {e.comment && <Comment text={e.comment} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {done ? (
          <div style={{ padding: '10px 12px', borderRadius: 7, background: C.success.bg, border: `1px solid ${C.success.border}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: `600 12px/16px ${FONT}`, color: C.success.text }}><CornerDownRight size={16} aria-hidden="true" /> Sizning javobingiz</span>
            <span style={{ font: `400 13px/20px ${FONT}`, color: C.n900, overflowWrap: 'anywhere' }}>{e.responseComment || '—'}</span>
          </div>
        ) : (
          <>
            <label htmlFor={`et-in-${e.id}`} style={{ font: `500 13px/18px ${FONT}`, color: C.n900 }}>Javob</label>
            <textarea
              id={`et-in-${e.id}`}
              rows={3}
              maxLength={1000}
              value={draft}
              disabled={busy}
              aria-describedby={hintId}
              onChange={(ev) => { setDraft(ev.target.value); setErr(null); }}
              placeholder="E’tiroz bo‘yicha javob yozing..."
              className={`dc-input ${err ? 'invalid' : ''}`}
              style={{ background: busy ? C.n50 : '#fff' }}
            />
            {err && <InlineAlert>{err}</InlineAlert>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span id={hintId} style={{ flex: 1, font: `400 12px/16px ${FONT}`, color: C.n600 }}>{hint}</span>
              <Button variant="primary" icon={Send} loading={busy} loadingLabel="Yuborilmoqda…" disabled={empty || !online} onClick={() => { setErr(null); mut.mutate(); }}>
                {err ? 'Qayta yuborish' : 'Javob yuborish'}
              </Button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export default function DocumentEtirozlarPage() {
  const online = useOnline();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [when, setWhen] = useState('all');
  const [drafts, setDrafts] = useState({});

  const query = useQuery({
    queryKey: ['document-etirozli'],
    queryFn: documentAPI.getEtirozli,
    refetchInterval: 20000,
    select: (r) => r.data.data || [],
  });
  const orders = useMemo(() => query.data || [], [query.data]);
  const all = useMemo(() => orders.flatMap((o) => o.etirozlar || []), [orders]);
  const stats = { total: all.length, pending: all.filter((e) => !answered(e)).length };
  stats.done = stats.total - stats.pending;

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    return orders
      .filter((o) => !s || [o.invoiceNumber, o.client?.orgName].some((v) => v?.toLowerCase().includes(s)))
      .map((o) => {
        const items = (o.etirozlar || []).filter((e) => {
          if (status === 'pending' && answered(e)) return false;
          if (status === 'done' && !answered(e)) return false;
          const d = daysAgo(e.createdAt);
          if (when === 'today' && d !== 0) return false;
          if (when === 'week' && d > 6) return false;
          return true;
        });
        const pending = (o.etirozlar || []).filter((e) => !answered(e)).length;
        return { o, items, pending, total: (o.etirozlar || []).length };
      })
      .filter((g) => g.items.length > 0)
      .sort((a, b) => (b.pending > 0) - (a.pending > 0));
  }, [orders, q, status, when]);
  const shownCount = groups.reduce((s, g) => s + g.items.length, 0);

  const loading = query.isLoading;
  const error = query.isError && !query.data;
  const empty = !loading && !error && all.length === 0;
  const ctrlDis = loading || error || empty;
  const filtersActive = !!(q || status !== 'all' || when !== 'all');
  const clear = () => { setQ(''); setStatus('all'); setWhen('all'); };
  const updated = query.dataUpdatedAt ? time(query.dataUpdatedAt, true) : '—';

  return (
    <Page>
      <PageHeader title="E’tirozlar" description="Buxgalterlar hujjatlaringiz bo‘yicha bildirgan e’tirozlar va javob kutilayotgan masalalar.">
        <RefreshControl
          label={loading ? 'Yuklanmoqda…' : error ? 'Yangilanmadi' : `Yangilangan ${updated}`}
          fetching={query.isFetching}
          offline={!online}
          onRefresh={() => query.refetch()}
          title="Ro‘yxat har 20 soniyada avtomatik yangilanadi"
        />
      </PageHeader>

      {!online && <OfflineBanner text={`Ro‘yxat ${updated} holatida. Yozilgan javoblar saqlanadi, lekin aloqa tiklanguncha yuborib bo‘lmaydi.`} />}

      {!ctrlDis && (
        <Card role="group" aria-label="Umumiy ko‘rsatkichlar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          {[
            [MessageSquareWarning, 'Jami e’tirozlar', stats.total, C.neutral.bg, C.n700],
            [Clock, 'Javob kutilmoqda', stats.pending, C.warning.bg, C.warning.main],
            [CircleCheck, 'Javob berilgan', stats.done, C.success.bg, C.success.main],
          ].map(([Icon, l, v, bg, fg], i) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderLeft: i ? `1px solid ${C.n200}` : 'none' }}>
              <span style={{ width: 36, height: 36, borderRadius: 7, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>
              <span style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{l}</span>
                <span className="tnum" style={{ font: `600 18px/24px ${FONT}` }}>{v}</span>
              </span>
            </div>
          ))}
        </Card>
      )}

      {!error && !empty && (
        <Card style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
          <SearchInput value={q} onChange={setQ} placeholder="Faktura yoki tashkilot" disabled={ctrlDis} style={{ flex: '0 1 340px' }} />
          <Segmented
            label="Holat"
            value={status}
            onChange={setStatus}
            disabled={ctrlDis}
            options={[
              { value: 'all', label: 'Barchasi', count: loading ? '–' : stats.total },
              { value: 'pending', label: 'Javob kutilmoqda', count: loading ? '–' : stats.pending },
              { value: 'done', label: 'Javob berilgan', count: loading ? '–' : stats.done },
            ]}
          />
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <CalendarDays size={16} aria-hidden="true" style={{ position: 'absolute', left: 12, pointerEvents: 'none', color: when !== 'all' ? C.p800 : C.n600 }} />
            <select
              aria-label="E’tiroz sanasi"
              value={when}
              disabled={ctrlDis}
              onChange={(ev) => setWhen(ev.target.value)}
              className={`dc-input ${when !== 'all' ? 'has-value' : ''}`}
              style={{ appearance: 'none', width: 'auto', padding: '0 32px 0 36px', fontSize: 13, fontWeight: 500, background: when !== 'all' ? C.p50 : '#fff', color: when !== 'all' ? C.p800 : C.n900 }}
            >
              <option value="all">Barcha sanalar</option>
              <option value="today">Bugun</option>
              <option value="week">Oxirgi 7 kun</option>
            </select>
            <ChevronDown size={16} aria-hidden="true" style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: C.n600 }} />
          </span>
          {filtersActive && !ctrlDis && <Button variant="link" icon={FilterX} onClick={clear}>Filtrlarni tozalash</Button>}
          {!ctrlDis && <span className="tnum" style={{ marginLeft: 'auto', font: `400 13px/18px ${FONT}`, color: C.n600 }}>{shownCount} ta e’tiroz · {groups.length} ta buyurtma</span>}
        </Card>
      )}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <RefreshBar show={query.isFetching && !loading} />
        {loading ? (
          <div aria-busy="true" aria-label="Yuklanmoqda" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1].map((i) => (
              <Card key={i} className="dc-pulse" style={{ overflow: 'hidden' }}>
                <div style={{ height: 60, background: C.n50, display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px' }}>
                  <Skel w={140} /><Skel w="30%" h={10} bg={C.n100} /><Skel w={110} h={24} r={5} bg={C.neutral.bg} style={{ marginLeft: 'auto' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 16 }}>
                  <div><Skel w="50%" /><Skel w="35%" h={10} bg={C.n100} style={{ marginTop: 8 }} /><Skel h={56} r={7} bg={C.n50} style={{ marginTop: 8 }} /></div>
                  <div><Skel w="20%" h={10} bg={C.n100} /><Skel h={84} r={7} bg={C.n50} style={{ marginTop: 8 }} /></div>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          <ErrorState title="E’tirozlarni yuklab bo‘lmadi" text="Server javob bermadi. Bu e’tirozlar yo‘q degani emas — qayta urinib ko‘ring." onRetry={() => query.refetch()} />
        ) : empty ? (
          <BlankState icon={MessageSquareWarning} title="E’tirozlar mavjud emas" text="Buxgalter hujjatlaringiz bo‘yicha e’tiroz bildirsa, u shu yerda buyurtma bo‘yicha guruhlab ko‘rsatiladi." />
        ) : groups.length === 0 ? (
          <SearchEmpty text="Tanlangan qidiruv va filtrlarga mos e’tiroz yo‘q." onClear={clear} clearLabel="Filtrlarni tozalash" clearIcon={FilterX} />
        ) : groups.map(({ o, items, pending, total }) => (
          <Card as="section" key={o.id} aria-label={`${o.invoiceNumber} buyurtmasi e’tirozlari`} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, minHeight: 60, padding: '10px 16px', background: C.n50, borderBottom: `1px solid ${C.n200}`, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                <span className="tnum" style={{ font: `600 14px/20px ${FONT}`, color: C.p800, whiteSpace: 'nowrap' }}>{o.invoiceNumber}</span>
                <span className="dc-ellipsis" title={o.client?.orgName} style={{ font: `400 13px/18px ${FONT}`, color: C.n700 }}>{o.client?.orgName || '—'}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge icon={MessageSquareWarning}>{total} ta e’tiroz</Badge>
                {pending > 0
                  ? <Badge {...TONE.warning} icon={Clock}>{pending} ta javob kutilmoqda</Badge>
                  : <Badge {...TONE.success} icon={CircleCheck}>Barchasiga javob berildi</Badge>}
              </div>
            </div>
            {items.map((e) => (
              <EtirozRow
                key={e.id}
                e={e}
                order={o}
                online={online}
                draft={drafts[e.id] || ''}
                setDraft={(v) => setDrafts((p) => ({ ...p, [e.id]: v }))}
              />
            ))}
          </Card>
        ))}
      </div>
    </Page>
  );
}
