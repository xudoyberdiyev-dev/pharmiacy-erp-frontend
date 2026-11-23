import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileSpreadsheet, FileCheck2, Undo2, Package, Truck, User, ChevronDown, ChevronRight, ChevronsUpDown, ChevronsDownUp,
} from 'lucide-react';
import { documentAPI } from '../../api';
import { DEFAULT_ERROR_MESSAGE, getErrorMessage } from '../../lib/errors';
import { C, FONT } from './design/tokens';
import {
  Page, PageHeader, RefreshControl, Card, SearchInput, Checkbox, Badge, Button, BlankState, ErrorState, SearchEmpty,
  OfflineBanner, Skel, SelectionBar, ConfirmDialog, notify, RefreshBar,
} from './design/ui';
import DocumentBuilderModal from './DocumentBuilderModal';
import { money, count, dateTime, time } from './lib/format';
import { useOnline, useSelection } from './lib/hooks';

// ─────────────────────────────────────────────────────────────────────────
// Hujjatlashtirish — haydovchi biriktirilgan, hujjat kutayotgan buyurtmalar
// safarlar (haydovchi + mashina + biriktirish vaqti) bo'yicha guruhlangan.
// ─────────────────────────────────────────────────────────────────────────

export function groupByTrip(orders) {
  const map = new Map();
  for (const o of orders) {
    const key = `${o.driverId}__${o.vehicleId}__${o.dispatchedAt}`;
    if (!map.has(key)) map.set(key, { key, driver: o.driver, vehicle: o.vehicle, dispatchedAt: o.dispatchedAt, orders: [] });
    map.get(key).orders.push(o);
  }
  return [...map.values()].sort((a, b) => new Date(b.dispatchedAt) - new Date(a.dispatchedAt));
}

export function PlateChip({ children }) {
  return (
    <span className="tnum" style={{ display: 'inline-flex', alignItems: 'center', height: 20, padding: '0 6px', borderRadius: 4, border: `1px solid ${C.n300}`, background: C.n50, font: `600 12px/16px ${FONT}`, letterSpacing: '0.04em', color: C.n700, whiteSpace: 'nowrap' }}>
      {children || '—'}
    </span>
  );
}

export function TripHeaderCells({ group }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: C.p50, color: C.p800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} aria-hidden="true" /></span>
        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span className="dc-ellipsis" title={group.driver?.fullName} style={{ font: `600 14px/20px ${FONT}`, color: C.n900 }}>{group.driver?.fullName || '—'}</span>
          <span style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>Haydovchi</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <Truck size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: C.n600, flex: 'none' }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, alignItems: 'flex-start' }}>
          <span className="dc-ellipsis" title={group.vehicle?.model} style={{ font: `500 13px/18px ${FONT}`, maxWidth: '100%' }}>{group.vehicle?.model || '—'}</span>
          <PlateChip>{group.vehicle?.plateNumber}</PlateChip>
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>Biriktirilgan</span>
        <span className="tnum" style={{ font: `400 13px/18px ${FONT}`, whiteSpace: 'nowrap' }}>{dateTime(group.dispatchedAt)}</span>
      </div>
    </>
  );
}

const ROW_GRID = '20px minmax(140px,180px) minmax(0,1fr) 180px';
const HEAD_GRID = '36px 20px minmax(0,1.35fr) minmax(0,1.1fr) minmax(0,0.85fr) auto minmax(132px,auto)';

function TripGroup({ group, sel, open, onToggleOpen }) {
  const ids = group.orders.map((o) => o.id);
  const n = ids.filter((id) => sel.has(id)).length;
  const all = n === ids.length;
  const some = n > 0 && !all;
  const total = group.orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  return (
    <section
      aria-label={`Safar: ${group.driver?.fullName || '—'}, ${group.vehicle?.plateNumber || ''}`}
      style={{
        background: '#fff', borderRadius: 10, overflow: 'hidden',
        border: `1px solid ${all ? C.p300 : some ? C.p200 : C.n200}`,
        boxShadow: all ? `inset 3px 0 0 ${C.p800}` : some ? `inset 3px 0 0 ${C.p300}` : 'none',
      }}
    >
      <div
        onClick={onToggleOpen}
        className={all ? '' : 'dc-hover'}
        style={{
          display: 'grid', gridTemplateColumns: HEAD_GRID, gap: 12, alignItems: 'center', minHeight: 64, padding: '10px 16px 10px 8px',
          background: all ? C.p50 : open ? C.n50 : '#fff', cursor: 'pointer',
        }}
      >
        <button
          type="button"
          className="dc-ib"
          aria-expanded={open}
          aria-label={`${open ? 'Yig‘ish' : 'Yoyish'}: ${group.driver?.fullName || ''}`}
          title={`${open ? 'Yig‘ish' : 'Yoyish'}: ${group.driver?.fullName || ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleOpen(); }}
          style={{ border: `1px solid ${C.n200}`, background: '#fff' }}
        >
          {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        <Checkbox
          checked={all}
          indeterminate={some}
          onChange={() => sel.setMany(ids, !all)}
          label={`${group.driver?.fullName || ''} safaridagi barcha buyurtmalarni tanlash`}
        />
        <TripHeaderCells group={group} />
        <div style={{ display: 'flex', gap: 6, justifySelf: 'end', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Badge icon={Package}>{group.orders.length} ta buyurtma</Badge>
          {n > 0 && <Badge bg={C.p800} fg="#fff" strong>{n} / {ids.length} tanlandi</Badge>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>Jami summa</span>
          <span className="tnum" style={{ font: `600 14px/20px ${FONT}`, whiteSpace: 'nowrap' }}>{money(total)}</span>
        </div>
      </div>
      {open && (
        <div role="table" aria-label={`${group.driver?.fullName || ''} safari buyurtmalari`} style={{ borderTop: `1px solid ${C.n200}`, position: 'relative' }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: 25, top: 0, bottom: 24, width: 2, background: C.n200 }} />
          <div role="row" style={{ display: 'grid', gridTemplateColumns: ROW_GRID, gap: 12, alignItems: 'center', height: 36, padding: '0 16px 0 56px', borderBottom: `1px solid ${C.n100}`, font: `600 12px/16px ${FONT}`, color: C.n600 }}>
            <span role="columnheader" aria-label="Tanlash" />
            <span role="columnheader">Faktura raqami</span>
            <span role="columnheader">Tashkilot</span>
            <span role="columnheader" style={{ textAlign: 'right' }}>Summa</span>
          </div>
          {group.orders.map((o) => {
            const on = sel.has(o.id);
            return (
              <div
                key={o.id}
                role="row"
                aria-selected={on}
                onClick={() => sel.toggle(o.id)}
                className={`dc-soft-row ${on ? 'is-sel' : ''}`}
                style={{ display: 'grid', gridTemplateColumns: ROW_GRID, gap: 12, alignItems: 'center', height: 48, padding: '0 16px 0 56px', borderBottom: `1px solid ${C.n100}`, cursor: 'pointer', position: 'relative' }}
              >
                <span role="cell"><Checkbox checked={on} onChange={() => sel.toggle(o.id)} label={`${o.invoiceNumber} buyurtmasini tanlash`} /></span>
                <span role="cell" className="tnum dc-ellipsis" style={{ font: `600 13px/18px ${FONT}`, color: C.p800 }}>{o.invoiceNumber}</span>
                <span role="cell" className="dc-ellipsis" title={o.client?.orgName} style={{ font: `400 13px/18px ${FONT}` }}>{o.client?.orgName || '—'}</span>
                <span role="cell" className="tnum" style={{ font: `500 13px/18px ${FONT}`, textAlign: 'right' }}>{money(o.totalAmount)}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function TripSkeletons({ n = 4 }) {
  const widths = [[50, 60], [64, 48], [44, 56], [58, 64]];
  return (
    <div aria-busy="true" aria-label="Yuklanmoqda" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: n }).map((_, i) => (
        <Card key={i} className="dc-pulse" style={{ display: 'grid', gridTemplateColumns: HEAD_GRID, gap: 12, alignItems: 'center', minHeight: 64, padding: '10px 16px 10px 8px' }}>
          <Skel w={36} h={36} r={7} bg={C.n100} />
          <Skel w={20} h={20} r={5} bg={C.n100} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Skel w={36} h={36} r={18} bg={C.n100} /><Skel w={`${widths[i % 4][0]}%`} /></div>
          <Skel w={`${widths[i % 4][1]}%`} />
          <Skel w="70%" />
          <Skel w={104} h={24} r={5} bg={C.n100} />
          <Skel w={120} h={14} style={{ justifySelf: 'end' }} />
        </Card>
      ))}
    </div>
  );
}

export default function DocumentDocumentedPage() {
  const qc = useQueryClient();
  const online = useOnline();
  const [q, setQ] = useState('');
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderErr, setBuilderErr] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [returnErr, setReturnErr] = useState(null);

  const query = useQuery({
    queryKey: ['document', 'awaiting'],
    queryFn: documentAPI.getAwaitingDocument,
    select: (r) => r.data.data || [],
    refetchInterval: 15000,
  });
  const orders = useMemo(() => query.data || [], [query.data]);
  const byId = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter((o) => [o.invoiceNumber, o.client?.orgName, o.driver?.fullName, o.vehicle?.plateNumber].some((v) => v?.toLowerCase().includes(s)));
  }, [orders, q]);
  const groups = useMemo(() => groupByTrip(filtered), [filtered]);
  const sel = useSelection(useMemo(() => orders.map((o) => o.id), [orders]));
  const selOrders = sel.selected.map((id) => byId.get(id)).filter(Boolean);
  const selTrips = new Set(selOrders.map((o) => `${o.driverId}__${o.vehicleId}__${o.dispatchedAt}`)).size;
  const selSum = selOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const selBoxes = selOrders.reduce((s, o) => s + (o.boxCount || 0), 0);

  const exportMut = useMutation({
    mutationFn: ({ columns, footer }) => documentAPI.exportExcel(sel.selected, columns, footer),
    onSuccess: (res) => {
      const n = sel.selected.length;
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      const filename = match ? decodeURIComponent(match[1]) : 'hujjat.xlsx';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setBuilderOpen(false);
      sel.clear();
      qc.invalidateQueries({ queryKey: ['document'] });
      notify({ title: 'Hujjat yaratildi va yuklab olindi', desc: `Fayl: ${filename} · ${n} ta buyurtma Safarga tayyor bo‘limiga o‘tdi.` });
    },
    onError: async (e) => {
      let msg = null;
      try {
        msg = e.response?.data instanceof Blob ? JSON.parse(await e.response.data.text()).message : e.response?.data?.message;
      } catch { msg = null; }
      setBuilderErr(msg || (e.response ? DEFAULT_ERROR_MESSAGE : 'Server javob bermadi.'));
    },
  });

  const returnMut = useMutation({
    mutationFn: () => documentAPI.returnToPending(sel.selected),
    onSuccess: () => {
      const n = sel.selected.length;
      setConfirmOpen(false);
      sel.clear();
      qc.invalidateQueries({ queryKey: ['document'] });
      notify({ tone: 'warning', icon: Undo2, title: 'Buyurtmalar qaytarildi', desc: `${n} ta buyurtma Biriktirish bo‘limiga o‘tkazildi.` });
    },
    onError: (e) => setReturnErr(getErrorMessage(e)),
  });

  const loading = query.isLoading;
  const error = query.isError && !query.data;
  const empty = !loading && !error && orders.length === 0;
  const updated = query.dataUpdatedAt ? time(query.dataUpdatedAt, true) : '—';
  const toggleOpen = (key) => setCollapsed((p) => { const s = new Set(p); s.has(key) ? s.delete(key) : s.add(key); return s; });
  const forceOpen = !!q.trim();

  const bar = sel.selected.length > 0 && !error ? (
    <SelectionBar
      title={`${sel.selected.length} ta buyurtma tanlandi`}
      meta={`${selTrips} ta safar · ${count(selBoxes)} quti · ${money(selSum)}`}
      onClear={sel.clear}
    >
      <Button variant="dark-outline" icon={Undo2} iconSize={20} offline={!online} disabled={!online || returnMut.isPending} onClick={() => { setReturnErr(null); setConfirmOpen(true); }}>
        Orqaga qaytarish
      </Button>
      <Button variant="inverse" icon={FileSpreadsheet} iconSize={20} offline={!online} disabled={!online || returnMut.isPending} onClick={() => { setBuilderErr(null); setBuilderOpen(true); }}>
        Hujjatlashtirish
      </Button>
    </SelectionBar>
  ) : null;

  return (
    <Page bar={bar}>
      <PageHeader title="Hujjatlashtirish" description="Haydovchi biriktirilgan buyurtmalar uchun hujjat (Excel) yaratish.">
        <RefreshControl
          label={loading ? 'Yuklanmoqda…' : error ? 'Yangilanmadi' : `Yangilangan ${updated}`}
          fetching={query.isFetching}
          offline={!online}
          onRefresh={() => query.refetch()}
          title="Ro‘yxat har 15 soniyada avtomatik yangilanadi"
        />
      </PageHeader>

      {!online && <OfflineBanner at={updated} />}

      {!error && !empty && (
        <Card style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', flexWrap: 'wrap' }}>
          <SearchInput value={q} onChange={setQ} placeholder="Faktura, tashkilot, haydovchi yoki mashina raqami" disabled={loading} style={{ flex: '0 1 420px' }} />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20, font: `400 13px/18px ${FONT}`, color: C.n600, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Package size={16} aria-hidden="true" /><b className="tnum" style={{ fontWeight: 600, color: C.n900 }}>{loading ? '–' : filtered.length}</b> ta buyurtma</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Truck size={16} aria-hidden="true" /><b className="tnum" style={{ fontWeight: 600, color: C.n900 }}>{loading ? '–' : groups.length}</b> ta safar</span>
            <span style={{ display: 'inline-flex', gap: 4 }}>
              <Button variant="ghost" size="sm" icon={ChevronsUpDown} disabled={loading} onClick={() => setCollapsed(new Set())}>Hammasini yoyish</Button>
              <Button variant="ghost" size="sm" icon={ChevronsDownUp} disabled={loading} onClick={() => setCollapsed(new Set(groups.map((g) => g.key)))}>Yig‘ish</Button>
            </span>
          </div>
        </Card>
      )}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <RefreshBar show={query.isFetching && !loading} />
        {loading ? <TripSkeletons /> : error ? (
          <ErrorState title="Buyurtmalarni yuklab bo‘lmadi" onRetry={() => query.refetch()} />
        ) : empty ? (
          <BlankState icon={FileCheck2} title="Hujjatlashtirish uchun buyurtmalar yo‘q" text="Biriktirish bo‘limida buyurtmalarga haydovchi va mashina biriktirilgach, ular shu yerda safarlar bo‘yicha ko‘rinadi." />
        ) : groups.length === 0 ? (
          <SearchEmpty text={`«${q}» bo‘yicha faktura, tashkilot, haydovchi yoki mashina topilmadi.`} onClear={() => setQ('')} />
        ) : groups.map((g) => (
          <TripGroup key={g.key} group={g} sel={sel} open={forceOpen || !collapsed.has(g.key)} onToggleOpen={() => toggleOpen(g.key)} />
        ))}
      </div>

      {builderOpen && (
        <DocumentBuilderModal
          orders={selOrders}
          loading={exportMut.isPending}
          error={builderErr}
          onClose={() => setBuilderOpen(false)}
          onConfirm={(columns, footer) => { setBuilderErr(null); exportMut.mutate({ columns, footer }); }}
        />
      )}
      {confirmOpen && (
        <ConfirmDialog
          icon={Undo2}
          tone="warning"
          title="Buyurtmalar Biriktirish bosqichiga qaytarilsinmi?"
          text={`${selOrders.length} ta buyurtma haydovchi va mashinadan ajratiladi va Biriktirish bo‘limiga qaytariladi. U yerda ularga qayta haydovchi biriktirish mumkin.`}
          summary={[['Buyurtmalar', `${selOrders.length} ta`], ['Safarlar', `${selTrips} ta`], ['Jami summa', money(selSum)]]}
          note="Buyurtmalar bekor qilinmaydi va «Qaytarilgan» holatiga o‘tmaydi."
          confirmLabel="Orqaga qaytarish"
          confirmIcon={Undo2}
          busyLabel="Qaytarilmoqda…"
          busy={returnMut.isPending}
          error={returnErr}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => { setReturnErr(null); returnMut.mutate(); }}
        />
      )}
    </Page>
  );
}
