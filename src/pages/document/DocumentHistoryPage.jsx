import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  History, CalendarDays, FilterX, PackageMinus, FileDown, CircleX, RotateCcw, ChevronDown, FileCheck2, Truck,
} from 'lucide-react';
import { documentAPI } from '../../api';
import { getErrorMessage } from '../../lib/errors';
import { C, FONT } from './design/tokens';
import {
  Page, PageHeader, RefreshControl, Card, SearchInput, Badge, TONE, StatusBadge, IconButton, Button, BlankState,
  ErrorState, SearchEmpty, OfflineBanner, Skel, Pagination, ConfirmDialog, notify, RefreshBar, Spinner,
} from './design/ui';
import { money, dateTime, time, count } from './lib/format';
import { useOnline, useDebounced, saveBlob } from './lib/hooks';

// ─────────────────────────────────────────────────────────────────────────
// Tarix — hujjat chiqarilgan barcha buyurtmalar (server tomonida
// sahifalanadi, qidiruv/holat/sana filtrlari bilan). Bu yerdan: qaytarilgan
// tovarni qayd etish, Word hisobot, bekor qilish va tiklash.
// ─────────────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'IN_TRANSIT', label: 'Safarda (yetkazilmagan)' },
  { value: 'DELIVERED', label: 'Yetkazilgan' },
  { value: 'HAS_RETURNED_GOODS', label: 'Qaytarilgan tovari bor' },
  { value: 'RETURNED', label: 'To‘liq qaytarilgan' },
  { value: 'CANCELLED', label: 'Bekor qilingan' },
];

export function OrderStatus({ o }) {
  if (o.status === 'DELIVERED') return <StatusBadge variant="APPROVED">Yetkazildi</StatusBadge>;
  if (o.status === 'RETURNED') return <StatusBadge variant="RETURNED">Qaytarilgan</StatusBadge>;
  if (o.status === 'CANCELLED') return <StatusBadge variant="CANCELLED">Bekor qilingan</StatusBadge>;
  if (o.status === 'IN_TRANSIT') {
    if (o.deliveryStartedAt) return <Badge {...TONE.info} icon={Truck}>Yo‘lda</Badge>;
    return <StatusBadge variant="READY">Safarga tayyor</StatusBadge>;
  }
  return <StatusBadge variant="PENDING">{o.status}</StatusBadge>;
}

const TH = { position: 'sticky', top: 0, zIndex: 1, background: C.n50, borderBottom: `1px solid ${C.n200}`, padding: '0 12px', height: 44, textAlign: 'left', font: `600 12px/16px ${FONT}`, color: C.n700, whiteSpace: 'nowrap' };
const TD = { padding: '8px 12px', borderBottom: `1px solid ${C.n200}`, verticalAlign: 'middle' };

export default function DocumentHistoryPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const online = useOnline();
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [downloading, setDownloading] = useState(null);
  const [cancelOrder, setCancelOrder] = useState(null);
  const [restoreOrder, setRestoreOrder] = useState(null);
  const [actionErr, setActionErr] = useState(null);

  const params = { page, pageSize, ...(dq ? { q: dq } : {}), ...(date ? { date } : {}), ...(status ? { status } : {}) };
  const query = useQuery({
    queryKey: ['document', 'history', params],
    queryFn: () => documentAPI.getHistory(params),
    select: (r) => ({ rows: r.data.data || [], total: r.data.total ?? 0 }),
    placeholderData: keepPreviousData,
    refetchInterval: 30000,
  });
  const rows = query.data?.rows || [];
  const total = query.data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  // Oxirgi sahifadagi yagona buyurtma ro'yxatdan chiqsa (masalan "Tiklash"dan
  // keyin) — bo'sh sahifada qolib ketmaslik uchun oxirgi mavjud sahifaga o'tamiz.
  useEffect(() => {
    if (!query.isPlaceholderData && total > 0 && page > pages) setPage(pages);
  }, [page, pages, total, query.isPlaceholderData]);

  const filtersActive = !!(q || date || status);
  const clearFilters = () => { setQ(''); setDate(''); setStatus(''); setPage(1); };

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }) => documentAPI.cancelOrder(id, reason || undefined),
    onSuccess: (_r, v) => {
      setCancelOrder(null);
      qc.invalidateQueries({ queryKey: ['document'] });
      notify({ tone: 'warning', icon: CircleX, title: 'Buyurtma bekor qilindi', desc: `${v.inv} «Bekor qilingan» holatiga o‘tdi. Kerak bo‘lsa «Tiklash» orqali qaytarish mumkin.` });
    },
    onError: (e) => setActionErr(getErrorMessage(e)),
  });
  const restoreMut = useMutation({
    mutationFn: ({ id, reason }) => documentAPI.restoreOrder(id, reason || undefined),
    onSuccess: (_r, v) => {
      setRestoreOrder(null);
      qc.invalidateQueries({ queryKey: ['document'] });
      notify({ icon: RotateCcw, title: 'Buyurtma tiklandi', desc: `${v.inv} Biriktirish bo‘limiga qaytdi — qaytadan haydovchi biriktirib, hujjatlashtiring.` });
    },
    onError: (e) => setActionErr(getErrorMessage(e)),
  });

  const download = async (o) => {
    setDownloading(o.id);
    try {
      const res = await documentAPI.downloadReturnReport(o.id);
      saveBlob(res.data, `qaytarilgan-${o.invoiceNumber}.docx`);
      notify({ title: 'Hisobot yuklab olindi', desc: `qaytarilgan-${o.invoiceNumber}.docx` });
    } catch {
      notify({ tone: 'danger', title: 'Hisobotni yuklab bo‘lmadi', desc: 'Qayta urinib ko‘ring.' });
    } finally {
      setDownloading(null);
    }
  };

  const loading = query.isLoading;
  const error = query.isError && !query.data;
  const updated = query.dataUpdatedAt ? time(query.dataUpdatedAt, true) : '—';
  const emptyAll = !loading && !error && total === 0 && !filtersActive;

  return (
    <Page>
      <PageHeader title="Tarix" description="Hujjat chiqarilgan barcha buyurtmalar: holati, qaytarilgan tovarlar, bekor qilish va tiklash.">
        <RefreshControl
          label={loading ? 'Yuklanmoqda…' : error ? 'Yangilanmadi' : `${count(total)} ta · yangilangan ${updated}`}
          fetching={query.isFetching}
          offline={!online}
          onRefresh={() => query.refetch()}
          title="Ro‘yxat har 30 soniyada avtomatik yangilanadi"
        />
      </PageHeader>

      {!online && <OfflineBanner at={updated} />}

      {error ? (
        <ErrorState title="Tarixni yuklab bo‘lmadi" text="Server javob bermadi. Bu buyurtmalar yo‘q degani emas — qayta urinib ko‘ring." onRetry={() => query.refetch()} />
      ) : emptyAll ? (
        <BlankState icon={History} title="Hujjatlashtirilgan buyurtmalar yo‘q" text="Hujjat chiqarilgan barcha buyurtmalar shu yerda ko‘rinadi." />
      ) : (
        <Card as="section" aria-label="Tarix" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <RefreshBar show={query.isFetching && !loading} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C.n200}`, flexWrap: 'wrap' }}>
            <SearchInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Faktura, hujjat №, tashkilot yoki haydovchi" disabled={loading} style={{ flex: '0 1 380px' }} />
            <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                aria-label="Holat"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className={`dc-input ${status ? 'has-value' : ''}`}
                style={{ appearance: 'none', width: 'auto', paddingRight: 32, fontSize: 13, fontWeight: 500, background: status ? C.p50 : '#fff', color: status ? C.p800 : C.n900 }}
              >
                {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <ChevronDown size={16} aria-hidden="true" style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: C.n600 }} />
            </span>
            <label style={{ position: 'relative', display: 'flex', alignItems: 'center' }} title="Safarga biriktirilgan sana">
              <CalendarDays size={16} aria-hidden="true" style={{ position: 'absolute', left: 12, color: date ? C.p800 : C.n600, pointerEvents: 'none' }} />
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setPage(1); }}
                aria-label="Safarga biriktirilgan sana"
                className={`dc-input ${date ? 'has-value' : ''}`}
                style={{ width: 176, paddingLeft: 36, fontSize: 13, background: date ? C.p50 : undefined, color: date ? C.p800 : undefined }}
              />
            </label>
            {filtersActive && <Button variant="link" icon={FilterX} onClick={clearFilters}>Filtrlarni tozalash</Button>}
          </div>

          {!loading && rows.length === 0 ? (
            <SearchEmpty bare minHeight={280} text="Tanlangan qidiruv va filtrlarga mos buyurtma topilmadi." onClear={clearFilters} clearLabel="Filtrlarni tozalash" clearIcon={FilterX} />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 1000, tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
                <colgroup>
                  <col style={{ width: 148 }} />
                  <col />
                  <col style={{ width: 240 }} />
                  <col style={{ width: 156 }} />
                  <col style={{ width: 176 }} />
                  <col style={{ width: 148 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" style={{ ...TH, paddingLeft: 16 }}>Faktura / hujjat</th>
                    <th scope="col" style={TH}>Tashkilot</th>
                    <th scope="col" style={TH}>Safar: haydovchi · sana</th>
                    <th scope="col" style={{ ...TH, textAlign: 'right' }}>Summa</th>
                    <th scope="col" style={TH}>Holat</th>
                    <th scope="col" style={{ ...TH, textAlign: 'right', paddingRight: 16 }}>Amallar</th>
                  </tr>
                </thead>
                <tbody aria-busy={loading || undefined}>
                  {loading ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="dc-pulse" style={{ height: 60 }}>
                      <td style={{ ...TD, paddingLeft: 16 }}><Skel w="70%" /><Skel w={60} h={10} bg={C.n100} style={{ marginTop: 8 }} /></td>
                      <td style={TD}><Skel w={`${45 + (i % 3) * 15}%`} /></td>
                      <td style={TD}><Skel w="70%" /><Skel w={80} h={10} bg={C.n100} style={{ marginTop: 8 }} /></td>
                      <td style={TD}><Skel w="70%" style={{ marginLeft: 'auto' }} /></td>
                      <td style={TD}><Skel w={96} h={24} r={5} bg={C.n100} /></td>
                      <td style={TD}><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>{[0, 1, 2].map((k) => <Skel key={k} w={36} h={36} r={7} bg={C.n100} />)}</div></td>
                    </tr>
                  )) : rows.map((o) => {
                    const canCancel = !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.status);
                    const canRestore = ['CANCELLED', 'RETURNED'].includes(o.status);
                    const canRecordReturn = !['CANCELLED', 'RETURNED'].includes(o.status);
                    return (
                      <tr key={o.id} className="dc-row">
                        <td style={{ ...TD, paddingLeft: 16 }}>
                          <div className="tnum dc-ellipsis" style={{ font: `600 13px/18px ${FONT}`, color: C.p800 }}>{o.invoiceNumber}</div>
                          <div className="tnum" style={{ display: 'flex', alignItems: 'center', gap: 4, font: `400 12px/16px ${FONT}`, color: C.n600 }}><FileCheck2 size={16} aria-hidden="true" /> № {o.dispatchDocument?.documentNumber ?? '—'}</div>
                        </td>
                        <td style={TD}>
                          <div className="dc-ellipsis" title={o.client?.orgName} style={{ font: `500 13px/18px ${FONT}` }}>{o.client?.orgName || '—'}</div>
                        </td>
                        <td style={TD}>
                          <div className="dc-ellipsis" style={{ font: `400 13px/18px ${FONT}` }}>{o.driver?.fullName || '—'}</div>
                          <div className="dc-ellipsis tnum" title={o.vehicle ? `${o.vehicle.model} · ${o.vehicle.plateNumber}` : undefined} style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{o.vehicle?.plateNumber || '—'} · {dateTime(o.dispatchedAt)}</div>
                        </td>
                        <td style={{ ...TD, textAlign: 'right' }}>
                          {o.originalAmount != null && o.originalAmount !== o.totalAmount && (
                            <div className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.n600, textDecoration: 'line-through' }}>{money(o.originalAmount)}</div>
                          )}
                          <div className="tnum" style={{ font: `500 13px/18px ${FONT}`, whiteSpace: 'nowrap' }}>{money(o.totalAmount)}</div>
                          {o.returnedAmount != null && (
                            <div className="tnum" style={{ font: `500 12px/16px ${FONT}`, color: C.warning.text }}>−{money(o.returnedAmount)}</div>
                          )}
                        </td>
                        <td style={TD}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            <OrderStatus o={o} />
                            {o.hasReturnedGoods && <Badge {...TONE.warning} icon={PackageMinus}>Tovar qaytgan</Badge>}
                          </div>
                        </td>
                        <td style={{ ...TD, paddingRight: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                            {canRecordReturn && (
                              <IconButton icon={PackageMinus} label={`${o.invoiceNumber} — ${o.hasReturnedGoods ? 'yana tovar qaytarishni qayd etish' : 'tovar qaytarishni qayd etish'}`} disabled={!online} onClick={() => navigate(`/document/orders/${o.id}/return`)} />
                            )}
                            {o.hasReturnedGoods && (
                              downloading === o.id
                                ? <span className="dc-ib" aria-label="Yuklanmoqda" style={{ cursor: 'default' }}><Spinner color={C.p500} track={C.n300} /></span>
                                : <IconButton icon={FileDown} tone="tint" label={`${o.invoiceNumber} — qaytarish hisobotini Word (.docx) yuklab olish`} disabled={!online} onClick={() => download(o)} />
                            )}
                            {canCancel && (
                              <IconButton icon={CircleX} tone="danger" label={`${o.invoiceNumber} — bekor qilish`} disabled={!online} onClick={() => { setActionErr(null); setCancelOrder(o); }} />
                            )}
                            {canRestore && (
                              <IconButton icon={RotateCcw} label={`${o.invoiceNumber} — tiklash`} disabled={!online} onClick={() => { setActionErr(null); setRestoreOrder(o); }} />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && rows.length > 0 && (
            <Pagination page={Math.min(page, pages)} pages={pages} size={pageSize} total={total} onPage={setPage} onSize={(s) => { setPageSize(s); setPage(1); }} />
          )}
        </Card>
      )}

      {cancelOrder && (
        <ConfirmDialog
          icon={CircleX}
          tone="danger"
          danger
          title="Buyurtmani bekor qilish?"
          text={`${cancelOrder.invoiceNumber} «Bekor qilingan» holatiga o‘tadi va barcha ro‘yxatlar hamda hisob-kitoblardan chiqadi. Kerak bo‘lsa keyinroq «Tiklash» orqali qaytarish mumkin.`}
          summary={[['Tashkilot', cancelOrder.client?.orgName || '—'], ['Summa', money(cancelOrder.totalAmount)]]}
          reason={{ label: 'Bekor qilish sababi', required: false, placeholder: 'Masalan: mijoz buyurtmadan voz kechdi', hint: 'Sabab faoliyat jurnalida saqlanadi.' }}
          confirmLabel="Bekor qilish"
          confirmIcon={CircleX}
          busyLabel="Bekor qilinmoqda…"
          busy={cancelMut.isPending}
          error={actionErr}
          onClose={() => setCancelOrder(null)}
          onConfirm={(reason) => { setActionErr(null); cancelMut.mutate({ id: cancelOrder.id, reason, inv: cancelOrder.invoiceNumber }); }}
        />
      )}
      {restoreOrder && (
        <ConfirmDialog
          icon={RotateCcw}
          title="Buyurtmani tiklash?"
          text={`${restoreOrder.invoiceNumber} haydovchi va hujjatsiz Biriktirish bo‘limiga qaytadi — qaytadan haydovchi biriktirib, hujjatlashtirish kerak bo‘ladi.`}
          summary={[['Tashkilot', restoreOrder.client?.orgName || '—'], ['Hozirgi holat', restoreOrder.status === 'CANCELLED' ? 'Bekor qilingan' : 'To‘liq qaytarilgan'], ['Summa', money(restoreOrder.totalAmount)]]}
          reason={{ label: 'Tiklash sababi', required: false, placeholder: 'Masalan: mijoz tovarni qabul qildi', hint: 'Sabab faoliyat jurnalida va Telegram xabarida ko‘rsatiladi.' }}
          confirmLabel="Tiklash"
          confirmIcon={RotateCcw}
          busyLabel="Tiklanmoqda…"
          busy={restoreMut.isPending}
          error={actionErr}
          onClose={() => setRestoreOrder(null)}
          onConfirm={(reason) => { setActionErr(null); restoreMut.mutate({ id: restoreOrder.id, reason, inv: restoreOrder.invoiceNumber }); }}
        />
      )}
    </Page>
  );
}
