import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck, Package, Route, Users, Wallet, ChevronDown, ChevronRight, ChevronsUpDown, ChevronsDownUp, Repeat2, PackageX,
  FileCheck2, MapPin, ArrowRight, Undo2, TriangleAlert,
} from 'lucide-react';
import { documentAPI } from '../../api';
import { getErrorMessage } from '../../lib/errors';
import { C, FONT } from './design/tokens';
import {
  Page, PageHeader, RefreshControl, Card, SearchInput, Badge, Button, BlankState, ErrorState, SearchEmpty, OfflineBanner,
  ConfirmDialog, notify, RefreshBar, StatusBadge, TONE,
} from './design/ui';
import { AssignTripModal } from './modals';
import { groupByTrip, TripHeaderCells, TripSkeletons } from './DocumentDocumentedPage';
import { money, count, time } from './lib/format';
import { useOnline } from './lib/hooks';

// ─────────────────────────────────────────────────────────────────────────
// Safarga tayyor — hujjati chiqarilgan, haydovchida turgan buyurtmalar
// safarlar bo'yicha. Bitta buyurtmani boshqa haydovchiga o'tkazish yoki
// (haydovchi hali topshirmagan bo'lsa) butunlay qaytarish mumkin.
// ─────────────────────────────────────────────────────────────────────────

const HEAD_GRID = '36px minmax(0,1.35fr) minmax(0,1.1fr) minmax(0,0.85fr) auto minmax(132px,auto)';
const ROW_GRID = 'minmax(120px,150px) 104px minmax(0,1fr) 150px 300px';

function Summary({ orders, groups }) {
  const drivers = new Set(orders.map((o) => o.driverId)).size;
  const sum = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const tiles = [
    [Package, 'Tayyor buyurtmalar', count(orders.length)],
    [Route, 'Safarlar', count(groups.length)],
    [Users, 'Haydovchilar', count(drivers)],
    [Wallet, 'Jami summa', money(sum)],
  ];
  return (
    <Card role="group" aria-label="Umumiy ko‘rsatkichlar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
      {tiles.map(([Icon, label, value], i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderLeft: i ? `1px solid ${C.n200}` : 'none', minWidth: 0 }}>
          <span style={{ width: 36, height: 36, flex: 'none', borderRadius: 7, background: C.p50, color: C.p800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>
          <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{label}</span>
            <span className="tnum dc-ellipsis" style={{ font: `600 18px/24px ${FONT}`, color: C.n900 }}>{value}</span>
          </span>
        </div>
      ))}
    </Card>
  );
}

function TripGroup({ group, open, onToggle, onReassign, onReturn, targetId, online }) {
  const total = group.orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  return (
    <Card as="section" aria-label={`Safar: ${group.driver?.fullName || '—'}, ${group.vehicle?.plateNumber || ''}`} style={{ overflow: 'hidden' }}>
      <div onClick={onToggle} className="dc-hover" style={{ display: 'grid', gridTemplateColumns: HEAD_GRID, gap: 12, alignItems: 'center', minHeight: 64, padding: '10px 16px 10px 12px', background: open ? C.n50 : '#fff', cursor: 'pointer' }}>
        <button
          type="button"
          className="dc-ib"
          aria-expanded={open}
          aria-label={`${open ? 'Yig‘ish' : 'Yoyish'}: ${group.driver?.fullName || ''}`}
          title={`${open ? 'Yig‘ish' : 'Yoyish'}: ${group.driver?.fullName || ''}`}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          style={{ border: `1px solid ${C.n200}`, background: '#fff' }}
        >
          {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>
        <TripHeaderCells group={group} />
        <div style={{ display: 'flex', gap: 6, justifySelf: 'end', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <StatusBadge variant="READY">Safarga tayyor</StatusBadge>
          <Badge icon={Package}>{group.orders.length} ta</Badge>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>Jami summa</span>
          <span className="tnum" style={{ font: `600 14px/20px ${FONT}`, whiteSpace: 'nowrap' }}>{money(total)}</span>
        </div>
      </div>
      {open && (
        <div style={{ overflowX: 'auto', borderTop: `1px solid ${C.n200}` }}>
          <div role="table" aria-label={`${group.driver?.fullName || ''} safari buyurtmalari`} style={{ position: 'relative', minWidth: 880 }}>
            <span aria-hidden="true" style={{ position: 'absolute', left: 29, top: 0, bottom: 24, width: 2, background: C.n200 }} />
            <div role="row" style={{ display: 'grid', gridTemplateColumns: ROW_GRID, gap: 12, alignItems: 'center', height: 36, padding: '0 16px 0 60px', borderBottom: `1px solid ${C.n100}`, font: `600 12px/16px ${FONT}`, color: C.n600 }}>
              <span role="columnheader">Faktura raqami</span>
              <span role="columnheader">Hujjat №</span>
              <span role="columnheader">Tashkilot va manzil</span>
              <span role="columnheader" style={{ textAlign: 'right' }}>Summa</span>
              <span role="columnheader" style={{ textAlign: 'right' }}>Amallar</span>
            </div>
            {group.orders.map((o) => (
              <div key={o.id} role="row" className="dc-soft-row" style={{ display: 'grid', gridTemplateColumns: ROW_GRID, gap: 12, alignItems: 'center', minHeight: 56, padding: '6px 16px 6px 60px', borderBottom: `1px solid ${C.n100}`, background: targetId === o.id ? C.p50 : undefined }}>
                <span role="cell" className="tnum dc-ellipsis" style={{ font: `600 13px/18px ${FONT}`, color: C.p800 }}>{o.invoiceNumber}</span>
                <span role="cell" className="tnum" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, font: `500 13px/18px ${FONT}` }}>
                  <FileCheck2 size={16} aria-hidden="true" style={{ color: C.n600 }} /> № {o.dispatchDocument?.documentNumber ?? '—'}
                </span>
                <span role="cell" style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span className="dc-ellipsis" title={o.client?.orgName} style={{ font: `500 13px/18px ${FONT}` }}>{o.client?.orgName || '—'}</span>
                  {o.client?.address && (
                    <span className="dc-ellipsis" title={o.client.address} style={{ display: 'flex', alignItems: 'center', gap: 4, font: `400 12px/16px ${FONT}`, color: C.n600 }}>
                      <MapPin size={16} aria-hidden="true" style={{ flex: 'none' }} /> <span className="dc-ellipsis">{o.client.address}</span>
                    </span>
                  )}
                </span>
                <span role="cell" className="tnum" style={{ font: `500 13px/18px ${FONT}`, textAlign: 'right' }}>{money(o.totalAmount)}</span>
                <span role="cell" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button variant="tint" size="sm" icon={Repeat2} offline={!online} disabled={!online} title="Haydovchi va mashinani almashtirish" aria-label={`${o.invoiceNumber} — haydovchi va mashinani almashtirish`} onClick={() => onReassign(o.id)}>
                    Almashtirish
                  </Button>
                  <Button variant="danger-outline" size="sm" icon={PackageX} offline={!online} disabled={!online} title="Haydovchi yukni topshirmagan bo‘lsa — buyurtmani butunlay qaytarish" aria-label={`${o.invoiceNumber} — butunlay qaytarish`} onClick={() => onReturn(o.id)}>
                    Butunlay qaytarish
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function DocumentReadyPage() {
  const qc = useQueryClient();
  const online = useOnline();
  const [q, setQ] = useState('');
  const [openSet, setOpenSet] = useState(null); // null → birinchi ikkitasi ochiq
  const [reassignId, setReassignId] = useState(null);
  const [reassignErr, setReassignErr] = useState(null);
  const [returnId, setReturnId] = useState(null);
  const [returnErr, setReturnErr] = useState(null);

  const query = useQuery({
    queryKey: ['document', 'ready'],
    queryFn: documentAPI.getReady,
    select: (r) => r.data.data || [],
    refetchInterval: 15000,
  });
  const orders = useMemo(() => query.data || [], [query.data]);
  const byId = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter((o) => [o.invoiceNumber, o.client?.orgName, o.driver?.fullName, o.vehicle?.plateNumber, String(o.dispatchDocument?.documentNumber ?? '')].some((v) => v?.toLowerCase().includes(s)));
  }, [orders, q]);
  const groups = useMemo(() => groupByTrip(filtered), [filtered]);
  const allGroups = useMemo(() => groupByTrip(orders), [orders]);

  // Modal ochiq turgan buyurtma ID bo'yicha har doim yangi ma'lumotdan olinadi
  const reassignOrder = reassignId ? byId.get(reassignId) : null;
  const returnOrder = returnId ? byId.get(returnId) : null;

  const isOpen = (key, idx) => (q.trim() ? true : openSet ? openSet.has(key) : idx < 2);
  const toggle = (key, idx) => setOpenSet((p) => {
    const base = p || new Set(groups.slice(0, 2).map((g) => g.key));
    const s = new Set(base);
    isOpen(key, idx) ? s.delete(key) : s.add(key);
    return s;
  });

  const reassign = useMutation({
    mutationFn: ({ id, driverId, vehicleId }) => documentAPI.reassignTrip(id, { driverId, vehicleId }),
    onSuccess: (res, v) => {
      const o = byId.get(v.id);
      setReassignId(null);
      qc.invalidateQueries({ queryKey: ['document'] });
      const d = res.data?.data;
      notify({ title: 'Haydovchi almashtirildi', desc: `${o?.invoiceNumber || ''} endi ${d?.driver?.fullName || 'yangi haydovchi'}${d?.vehicle?.model ? ` · ${d.vehicle.model}` : ''} safarida.` });
    },
    onError: (e) => setReassignErr(getErrorMessage(e)),
  });

  const fullReturn = useMutation({
    mutationFn: ({ id, reason }) => documentAPI.fullReturn(id, reason),
    onSuccess: (_r, v) => {
      const o = byId.get(v.id);
      setReturnId(null);
      qc.invalidateQueries({ queryKey: ['document'] });
      notify({ tone: 'warning', icon: Undo2, title: 'Buyurtma butunlay qaytarildi', desc: `${o?.invoiceNumber || ''} «Qaytarilgan» holatiga o‘tdi va ro‘yxatdan chiqarildi.` });
    },
    onError: (e) => setReturnErr(getErrorMessage(e)),
  });

  // Modal ochiq turgan buyurtma ro'yxatdan chiqib ketsa (boshqa hujjatchi yoki
  // haydovchi o'zgartirgan bo'lsa) — oyna yopiladi va xabar beriladi.
  useEffect(() => {
    // O'zimizning so'rovimiz bajarilayotganda buyurtma ro'yxatdan chiqsa — bu
    // "boshqa joyda o'zgardi" emas; natijani onSuccess/onError o'zi ko'rsatadi.
    if (!query.data || reassign.isPending || fullReturn.isPending) return;
    if ((reassignId && !byId.has(reassignId)) || (returnId && !byId.has(returnId))) {
      setReassignId(null);
      setReturnId(null);
      notify({ tone: 'info', title: 'Buyurtma ro‘yxatdan chiqdi', desc: 'Bu buyurtma boshqa joyda o‘zgartirilgan. Ro‘yxat yangilandi.' });
    }
  }, [byId, reassignId, returnId, query.data, reassign.isPending, fullReturn.isPending]);

  const loading = query.isLoading;
  const error = query.isError && !query.data;
  const empty = !loading && !error && orders.length === 0;
  const updated = query.dataUpdatedAt ? time(query.dataUpdatedAt, true) : '—';

  return (
    <Page>
      <PageHeader title="Safarga tayyor" description="Hujjatlashtirilgan va haydovchiga topshirilgan buyurtmalar — safarlar bo‘yicha.">
        <RefreshControl
          label={loading ? 'Yuklanmoqda…' : error ? 'Yangilanmadi' : `${count(orders.length)} ta buyurtma · ${updated}`}
          fetching={query.isFetching}
          offline={!online}
          onRefresh={() => query.refetch()}
          title="Ro‘yxat har 15 soniyada avtomatik yangilanadi"
        />
      </PageHeader>

      {!online && <OfflineBanner text={`Ro‘yxat ${updated} holatida ko‘rsatilmoqda. Aloqa tiklanguncha Almashtirish va Qaytarish o‘chirilgan.`} />}

      {!loading && !error && !empty && <Summary orders={orders} groups={allGroups} />}

      {!error && !empty && (
        <Card style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap' }}>
          <SearchInput value={q} onChange={setQ} placeholder="Faktura, hujjat №, tashkilot, haydovchi yoki mashina raqami" disabled={loading} style={{ flex: '0 1 440px', minWidth: 260 }} />
          {q && <span className="tnum" style={{ font: `400 13px/18px ${FONT}`, color: C.n600 }}>{filtered.length} ta buyurtma · {groups.length} ta safar</span>}
          <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 4 }}>
            <Button variant="ghost" size="sm" icon={ChevronsUpDown} disabled={loading} onClick={() => setOpenSet(new Set(groups.map((g) => g.key)))}>Hammasini yoyish</Button>
            <Button variant="ghost" size="sm" icon={ChevronsDownUp} disabled={loading} onClick={() => setOpenSet(new Set())}>Yig‘ish</Button>
          </span>
        </Card>
      )}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <RefreshBar show={query.isFetching && !loading} />
        {loading ? <TripSkeletons /> : error ? (
          <ErrorState title="Buyurtmalarni yuklab bo‘lmadi" onRetry={() => query.refetch()} />
        ) : empty ? (
          <BlankState icon={Truck} title="Safarga tayyor buyurtmalar yo‘q" text="Hujjatlashtirish bo‘limida hujjat yaratilgan buyurtmalar shu yerda safarlar bo‘yicha ko‘rinadi." />
        ) : groups.length === 0 ? (
          <SearchEmpty text={`«${q}» bo‘yicha faktura, tashkilot, haydovchi yoki mashina raqami topilmadi.`} onClear={() => setQ('')} />
        ) : groups.map((g, i) => (
          <TripGroup
            key={g.key}
            group={g}
            open={isOpen(g.key, i)}
            onToggle={() => toggle(g.key, i)}
            online={online}
            targetId={reassignId || returnId}
            onReassign={(id) => { setReassignErr(null); setReassignId(id); }}
            onReturn={(id) => { setReturnErr(null); setReturnId(id); }}
          />
        ))}
      </div>

      {reassignOrder && (
        <AssignTripModal
          mode="reassign"
          orders={[reassignOrder]}
          busy={reassign.isPending}
          error={reassignErr}
          onClose={() => setReassignId(null)}
          onConfirm={(driverId, vehicleId) => { setReassignErr(null); reassign.mutate({ id: reassignOrder.id, driverId, vehicleId }); }}
        />
      )}
      {returnOrder && (
        <ConfirmDialog
          icon={PackageX}
          tone="danger"
          danger
          width={520}
          title="Buyurtmani butunlay qaytarish?"
          text={<><b className="tnum" style={{ fontWeight: 600, color: C.p800 }}>{returnOrder.invoiceNumber}</b> · {returnOrder.client?.orgName || '—'} · {money(returnOrder.totalAmount)}</>}
          error={returnErr ? `Qaytarib bo‘lmadi. ${returnErr}` : null}
          reason={{ label: 'Qaytarish sababi', required: true, placeholder: 'Masalan: mijoz qabul qilmadi, manzilga yetib borib bo‘lmadi', error: 'Qaytarish sababini kiriting.' }}
          confirmLabel="Butunlay qaytarish"
          confirmIcon={PackageX}
          busyLabel="Qaytarilmoqda…"
          busy={fullReturn.isPending}
          onClose={() => setReturnId(null)}
          onConfirm={(reason) => { setReturnErr(null); fullReturn.mutate({ id: returnOrder.id, reason }); }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, borderRadius: 7, background: C.warning.bg, border: `1px solid ${C.warning.border}`, font: `400 13px/20px ${FONT}`, color: C.warning.text }}>
            <span style={{ display: 'flex', gap: 8 }}><TriangleAlert size={16} aria-hidden="true" style={{ flex: 'none', marginTop: 2 }} /> Faqat haydovchi yukni hali topshirmagan bo‘lsa ishlating.</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingLeft: 24 }}>
              Holat: <StatusBadge variant="READY">Safarga tayyor</StatusBadge> <ArrowRight size={16} aria-hidden="true" /> <Badge {...TONE.warning} icon={Undo2}>Qaytarilgan</Badge>
            </span>
            <span style={{ paddingLeft: 24 }}>Buyurtma haydovchidan va Safarga tayyor ro‘yxatidan chiqadi. <b style={{ fontWeight: 600 }}>Keyin uni faqat Tarix bo‘limidagi «Tiklash» orqali Biriktirishga qaytarish mumkin.</b></span>
          </div>
        </ConfirmDialog>
      )}
    </Page>
  );
}
