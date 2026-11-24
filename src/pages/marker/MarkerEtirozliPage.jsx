import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, CheckCheck, MessageSquareWarning } from 'lucide-react';
import { markerAPI } from '../../api';
import { C, FONT, MONO } from './design/tokens';
import {
  EtirozlarHeader, StatusBadge, Segmented, CardSkeleton, StateBox, ErrorState, SHARED_CSS,
  TYPE_LABELS, REJECT_LABELS, statusLabel, dt,
} from './etirozlar/shared';

// Route: /marker/etirozli — "Men bildirganlar" (Phase 06).
// Backend getEtirozli: markerId=me va kamida bitta fromRole='MARKER' e'tiroz bor
// orderlar. Diqqat: include'dagi `etirozlar` filtrsiz — bitta orderda Tekshiruvchi→Marker
// e'tirozlari ham kelishi mumkin. Shu tab faqat fromRole==='MARKER' ni ko'rsatadi.
// Sana: e'tirozning o'z `createdAt` qiymati (buyurtma sanasi emas).

export default function MarkerEtirozliPage() {
  const [filter, setFilter] = useState('all');
  const { data: orders = [], isLoading, isError, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['marker-etirozli'],
    queryFn: markerAPI.getEtirozli,
    refetchInterval: 30000,
    select: (r) => r.data.data || [],
  });

  const cards = useMemo(() => orders.map((o) => ({ o, et: (o.etirozlar || []).filter((e) => e.fromRole === 'MARKER') })).filter((c) => c.et.length), [orders]);
  const all = cards.flatMap((c) => c.et);
  const count = (s) => all.filter((e) => e.status === s).length;
  const visible = cards.map((c) => ({ ...c, shown: c.et.filter((e) => filter === 'all' || e.status === filter) })).filter((c) => c.shown.length);
  const ok = !isLoading && !isError;

  return (
    <div className="mke" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0, font: `400 14px/20px ${FONT}`, color: C.text }}>
      <style>{SHARED_CSS}</style>
      <EtirozlarHeader dataUpdatedAt={dataUpdatedAt} isFetching={isFetching} onRefresh={() => refetch()} />

      {ok && all.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2 }}>Picker'ga yuborgan e'tirozlaringiz va Picker javoblari</span>
          <Segmented label="Holat bo'yicha filtr" value={filter} onChange={setFilter}
            items={[['all', 'Barchasi', all.length], ['PENDING', statusLabel('PENDING'), count('PENDING')], ['ACCEPTED', statusLabel('ACCEPTED'), count('ACCEPTED')], ['REJECTED', statusLabel('REJECTED'), count('REJECTED')]]} />
        </div>
      )}

      {isLoading && [0, 1].map((i) => <CardSkeleton key={i} />)}
      {isError && <ErrorState onRetry={() => refetch()} isFetching={isFetching} />}

      {ok && visible.map(({ o, et, shown }) => (
        <article key={o.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
            <span style={{ font: `500 13px/18px ${MONO}`, color: C.text2, whiteSpace: 'nowrap', flex: 'none' }}>№ {o.invoiceNumber}</span>
            <span className="mk-ellipsis" style={{ font: `600 15px/22px ${FONT}`, minWidth: 0 }}>{o.client?.orgName || '—'}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `400 13px/18px ${FONT}`, color: C.text2, whiteSpace: 'nowrap' }}><User size={14} aria-hidden="true" />Picker: <span style={{ color: C.text, fontWeight: 500 }}>{o.assignedPicker?.fullName || '—'}</span></span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['PENDING', 'ACCEPTED', 'REJECTED'].map((s) => { const n = et.filter((e) => e.status === s).length; return n ? <span key={s} className="tnum" style={{ font: `500 12px/16px ${FONT}`, color: C.text2 }}>{n} ta {statusLabel(s).toLowerCase()}</span> : null; })}
            </span>
          </header>
          {shown.map((e) => (
            <div key={e.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '16px 24px', padding: '14px 16px', borderTop: `1px solid ${C.surface2}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ font: `600 14px/20px ${FONT}` }}>{TYPE_LABELS[e.type] || e.type}</span><StatusBadge status={e.status} /></span>
                {e.comment && <span style={{ font: `400 13px/18px ${FONT}`, color: C.textBody, overflowWrap: 'anywhere' }}>{e.comment}</span>}
                <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>Yuborildi: {dt(e.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <span style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>Picker javobi</span>
                {e.status === 'PENDING' && <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2 }}>Hali javob bermagan</span>}
                {e.status === 'ACCEPTED' && <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: `400 13px/18px ${FONT}`, color: C.success.text }}><CheckCheck size={16} aria-hidden="true" />Picker e'tirozni qabul qildi · <span className="tnum">{dt(e.resolvedAt)}</span></span>}
                {e.status === 'REJECTED' && (
                  <div style={{ padding: '10px 12px', borderRadius: 6, background: C.bgApp, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {e.responseTypes?.length > 0 && <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{e.responseTypes.map((t) => <span key={t} style={{ height: 22, padding: '0 8px', borderRadius: 4, background: '#fff', border: `1px solid ${C.borderStrong}`, font: `500 12px/16px ${FONT}`, color: C.textBody, display: 'inline-flex', alignItems: 'center' }}>{REJECT_LABELS[t] || t}</span>)}</span>}
                    {e.responseComment && <span style={{ font: `400 13px/18px ${FONT}`, overflowWrap: 'anywhere' }}>{e.responseComment}</span>}
                    <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>{dt(e.resolvedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </article>
      ))}

      {ok && all.length > 0 && visible.length === 0 && <StateBox compact title="Bu holatdagi e'tiroz yo'q" />}
      {ok && all.length === 0 && <StateBox Icon={MessageSquareWarning} title="Siz bildirgan e'tirozlar yo'q" desc={'"Mening buyurtmalarim" sahifasida e\'tiroz bildirsangiz, u shu yerda ko\'rinadi.'} />}
    </div>
  );
}
