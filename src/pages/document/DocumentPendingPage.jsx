import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck, Pencil, Flag, CornerUpLeft, CalendarDays, FilterX, ArrowDown, ArrowUp, Inbox, Undo2,
} from 'lucide-react';
import { documentAPI } from '../../api';
import { getErrorMessage } from '../../lib/errors';
import { C, FONT } from './design/tokens';
import {
  Page, PageHeader, RefreshControl, Card, SearchInput, Segmented, Checkbox, Badge, TONE, StatusBadge, IconButton,
  Button, BlankState, ErrorState, SearchEmpty, OfflineBanner, Skel, Pagination, SelectionBar, ConfirmDialog, notify,
  RefreshBar, usePagePad,
} from './design/ui';
import { AssignTripModal, AmountModal, CheckerEtirozModal } from './modals';
import { money, count, dateTime, time, dayKey } from './lib/format';
import { useOnline, usePaged, useSelection } from './lib/hooks';

// ─────────────────────────────────────────────────────────────────────────
// Biriktirish — tekshiruvdan o'tgan, haydovchisiz va hujjatsiz buyurtmalar.
// Tanlangan buyurtmalarga haydovchi va mashina biriktiriladi → ular
// Hujjatlashtirish bo'limiga o'tadi.
// ─────────────────────────────────────────────────────────────────────────

const TH = { position: 'sticky', top: 0, zIndex: 1, background: C.n50, borderBottom: `1px solid ${C.n200}`, padding: '0 12px', height: 44, textAlign: 'left', font: `600 12px/16px ${FONT}`, color: C.n700, whiteSpace: 'nowrap' };
const TD = { padding: '8px 12px', borderBottom: `1px solid ${C.n200}`, verticalAlign: 'middle' };

export default function DocumentPendingPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const online = useOnline();
  const { vw } = usePagePad();
  const [q, setQ] = useState('');
  const [seg, setSeg] = useState('all'); // all | new | driver | etiroz
  const [day, setDay] = useState('');
  const [desc, setDesc] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignErr, setAssignErr] = useState(null);
  const [amountId, setAmountId] = useState(null);
  const [amountErr, setAmountErr] = useState(null);
  const [etirozId, setEtirozId] = useState(null);
  const [etirozErr, setEtirozErr] = useState(null);
  const [returnId, setReturnId] = useState(null);
  const [returnErr, setReturnErr] = useState(null);

  const query = useQuery({
    queryKey: ['document', 'pending'],
    queryFn: documentAPI.getPending,
    select: (r) => r.data.data || [],
    refetchInterval: 15000,
  });
  const orders = useMemo(() => query.data || [], [query.data]);
  const byId = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);

  const isDriver = (o) => !!o.returnedToDocumentByDriverAt;
  const hasEtiroz = (o) => (o.etirozlar?.length || 0) > 0;
  const counts = useMemo(() => ({
    all: orders.length,
    new: orders.filter((o) => !isDriver(o)).length,
    driver: orders.filter(isDriver).length,
    etiroz: orders.filter(hasEtiroz).length,
  }), [orders]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = orders.filter((o) => {
      if (seg === 'new' && isDriver(o)) return false;
      if (seg === 'driver' && !isDriver(o)) return false;
      if (seg === 'etiroz' && !hasEtiroz(o)) return false;
      if (day && dayKey(o.checkingDoneAt) !== day) return false;
      if (!s) return true;
      return [o.invoiceNumber, o.contractNumber, o.lotNumber, o.client?.orgName].some((v) => v?.toLowerCase().includes(s));
    });
    list = list.slice().sort((a, b) => {
      const d = new Date(a.checkingDoneAt || 0) - new Date(b.checkingDoneAt || 0);
      return desc ? -d : d;
    });
    return list;
  }, [orders, q, seg, day, desc]);

  const paged = usePaged(filtered, 20);
  const sel = useSelection(useMemo(() => orders.map((o) => o.id), [orders]));
  const selOrders = sel.selected.map((id) => byId.get(id)).filter(Boolean);
  const selSum = selOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const selBoxes = selOrders.reduce((s, o) => s + (o.boxCount || 0), 0);
  const pageIds = paged.items.map((o) => o.id);
  const pageSel = pageIds.filter((id) => sel.has(id)).length;
  const allPage = pageIds.length > 0 && pageSel === pageIds.length;

  const filtersActive = !!(q || seg !== 'all' || day);
  const clearFilters = () => { setQ(''); setSeg('all'); setDay(''); paged.reset(); };
  const invalidate = () => qc.invalidateQueries({ queryKey: ['document'] });

  const assign = useMutation({
    mutationFn: ({ driverId, vehicleId }) => documentAPI.assignTrip({ orderIds: sel.selected, driverId, vehicleId }),
    onSuccess: (res) => {
      const n = sel.selected.length;
      const driver = res.data?.data?.driverName;
      setAssignOpen(false);
      sel.clear();
      invalidate();
      notify({ title: 'Haydovchi biriktirildi', desc: `${n} ta buyurtma${driver ? ` (${driver})` : ''} Hujjatlashtirish bo‘limiga o‘tdi.` });
      navigate('/document/documented');
    },
    onError: (e) => setAssignErr(getErrorMessage(e)),
  });

  const amount = useMutation({
    mutationFn: ({ id, totalAmount }) => documentAPI.updateAmount(id, totalAmount),
    onSuccess: (_r, v) => {
      const o = byId.get(v.id);
      setAmountId(null);
      qc.invalidateQueries({ queryKey: ['document', 'pending'] });
      notify({ title: 'Summa yangilandi', desc: `${o?.invoiceNumber || ''} · yangi summa ${money(v.totalAmount)}` });
    },
    onError: (e) => setAmountErr(getErrorMessage(e)),
  });

  const etiroz = useMutation({
    mutationFn: ({ id, body }) => documentAPI.raiseCheckerEtirov(id, body),
    onSuccess: (_r, v) => {
      const o = byId.get(v.id);
      setEtirozId(null);
      qc.invalidateQueries({ queryKey: ['document', 'pending'] });
      notify({ tone: 'warning', icon: Flag, title: 'E’tiroz yuborildi', desc: `${o?.invoiceNumber || ''} · tekshiruvchiga 5 ball jarima yozildi.` });
    },
    onError: (e) => setEtirozErr(getErrorMessage(e)),
  });

  const ret = useMutation({
    mutationFn: ({ id, reason }) => documentAPI.returnToChecking(id, reason),
    onSuccess: (_r, v) => {
      const o = byId.get(v.id);
      setReturnId(null);
      invalidate();
      notify({ tone: 'warning', icon: CornerUpLeft, title: 'Tekshiruvchiga qaytarildi', desc: `${o?.invoiceNumber || ''} Biriktirish ro‘yxatidan chiqarildi.` });
    },
    onError: (e) => setReturnErr(getErrorMessage(e)),
  });

  const amountOrder = amountId && byId.get(amountId);
  const etirozOrder = etirozId && byId.get(etirozId);
  const returnOrder = returnId && byId.get(returnId);

  const loading = query.isLoading;
  const error = query.isError && !query.data;
  const empty = !loading && !error && orders.length === 0;
  const ctrlDis = loading || error || empty;
  const showQty = vw >= 1440;
  const updated = query.dataUpdatedAt ? time(query.dataUpdatedAt, true) : '—';

  const bar = sel.selected.length > 0 && !error ? (
    <SelectionBar
      title={`${sel.selected.length} ta buyurtma tanlandi`}
      meta={`${count(selBoxes)} quti · ${money(selSum)}`}
      onClear={sel.clear}
    >
      <Button variant="inverse" icon={ClipboardCheck} iconSize={20} offline={!online} disabled={!online} onClick={() => { setAssignErr(null); setAssignOpen(true); }}>
        Haydovchi va mashina biriktirish
      </Button>
    </SelectionBar>
  ) : null;

  return (
    <Page bar={bar}>
      <PageHeader title="Biriktirish" description="Tekshiruvdan o‘tgan buyurtmalarga haydovchi va mashina biriktirish.">
        <RefreshControl
          label={loading ? 'Yuklanmoqda…' : error ? 'Yangilanmadi' : `Yangilangan ${updated}`}
          fetching={query.isFetching}
          offline={!online}
          onRefresh={() => query.refetch()}
          title="Ro‘yxat har 15 soniyada avtomatik yangilanadi"
        />
      </PageHeader>

      {!online && <OfflineBanner at={updated} />}

      {error ? (
        <ErrorState title="Buyurtmalarni yuklab bo‘lmadi" text="Server javob bermadi. Bu buyurtmalar yo‘q degani emas — qayta urinib ko‘ring." onRetry={() => query.refetch()} />
      ) : empty ? (
        <BlankState icon={Inbox} title="Hozircha biriktirish uchun buyurtmalar yo‘q" text="Tekshiruvchi buyurtmani yakunlagach, u shu ro‘yxatda paydo bo‘ladi." />
      ) : (
        <Card as="section" aria-label="Biriktirish uchun buyurtmalar" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          <RefreshBar show={query.isFetching && !loading} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C.n200}`, flexWrap: 'wrap' }}>
            <SearchInput
              value={q}
              onChange={(v) => { setQ(v); paged.reset(); }}
              placeholder="Faktura, shartnoma, lot yoki tashkilot"
              disabled={ctrlDis}
              style={{ flex: '0 1 340px' }}
            />
            <Segmented
              label="Holat"
              value={seg}
              onChange={(v) => { setSeg(v); paged.reset(); }}
              disabled={ctrlDis}
              options={[
                { value: 'all', label: 'Barchasi', count: loading ? '–' : counts.all },
                { value: 'new', label: 'Yangi', count: loading ? '–' : counts.new },
                { value: 'driver', label: 'Haydovchidan qaytgan', count: loading ? '–' : counts.driver },
                { value: 'etiroz', label: 'E’tiroz yuborilgan', count: loading ? '–' : counts.etiroz },
              ]}
            />
            <label style={{ position: 'relative', display: 'flex', alignItems: 'center' }} title="Tekshiruvdan o‘tgan sana">
              <CalendarDays size={16} aria-hidden="true" style={{ position: 'absolute', left: 12, color: day ? C.p800 : C.n600, pointerEvents: 'none' }} />
              <input
                type="date"
                value={day}
                onChange={(e) => { setDay(e.target.value); paged.reset(); }}
                aria-label="Tekshiruvdan o‘tgan sana"
                disabled={ctrlDis}
                className={`dc-input ${day ? 'has-value' : ''}`}
                style={{ width: 176, paddingLeft: 36, fontSize: 13, background: day ? C.p50 : undefined, color: day ? C.p800 : undefined }}
              />
            </label>
            {filtersActive && !ctrlDis && (
              <Button variant="link" icon={FilterX} onClick={clearFilters}>Filtrlarni tozalash</Button>
            )}
          </div>

          {!loading && filtered.length === 0 ? (
            <SearchEmpty
              bare
              minHeight={280}
              text={q ? `«${q}» bo‘yicha tanlangan filtrlarda buyurtma topilmadi. Qidiruv yoki filtrlarni o‘zgartiring.` : 'Tanlangan filtrlarga mos buyurtma yo‘q.'}
              onClear={clearFilters}
              clearLabel="Filtrlarni tozalash"
              clearIcon={FilterX}
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: showQty ? 1040 : 940, tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: 0 }}>
                <colgroup>
                  <col style={{ width: 48 }} />
                  <col style={{ width: 132 }} />
                  <col style={{ minWidth: 200 }} />
                  {showQty && <col style={{ width: 80 }} />}
                  <col style={{ width: 140 }} />
                  <col style={{ width: 164 }} />
                  <col style={{ width: 172 }} />
                  <col style={{ width: 148 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" style={{ ...TH, padding: '0 0 0 16px' }}>
                      <Checkbox
                        checked={allPage}
                        indeterminate={pageSel > 0 && !allPage}
                        onChange={() => sel.setMany(pageIds, !allPage)}
                        label="Sahifadagi barcha buyurtmalarni tanlash"
                        disabled={loading || pageIds.length === 0}
                      />
                    </th>
                    <th scope="col" style={TH}>Faktura / lot</th>
                    <th scope="col" style={TH}>Tashkilot / shartnoma</th>
                    {showQty && <th scope="col" style={{ ...TH, textAlign: 'right' }}>Qutilar</th>}
                    <th scope="col" style={{ ...TH, textAlign: 'right' }}>Summa</th>
                    <th scope="col" aria-sort={desc ? 'descending' : 'ascending'} style={{ ...TH, padding: '0 8px' }}>
                      <button
                        type="button"
                        onClick={() => setDesc((d) => !d)}
                        title={desc ? 'Yangilari birinchi' : 'Eskilari birinchi'}
                        className="dc-focus dc-hover"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 4px', borderRadius: 5, border: 'none', background: 'transparent', color: C.p800, font: `600 12px/16px ${FONT}`, cursor: 'pointer', outline: 'none' }}
                      >
                        Tekshirilgan {desc ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
                      </button>
                    </th>
                    <th scope="col" style={TH}>Holat</th>
                    <th scope="col" style={{ ...TH, textAlign: 'right', paddingRight: 16 }}>Amallar</th>
                  </tr>
                </thead>
                <tbody aria-busy={loading || undefined}>
                  {loading
                    ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="dc-pulse" style={{ height: 60 }}>
                        <td style={{ ...TD, paddingLeft: 16 }}><Skel w={20} h={20} r={5} bg={C.n100} /></td>
                        <td style={TD}><Skel w="72%" /><Skel w={60} h={10} bg={C.n100} style={{ marginTop: 8 }} /></td>
                        <td style={TD}><Skel w={`${50 + (i % 3) * 12}%`} /><Skel w={96} h={10} bg={C.n100} style={{ marginTop: 8 }} /></td>
                        {showQty && <td style={TD}><Skel w={32} style={{ marginLeft: 'auto' }} /></td>}
                        <td style={TD}><Skel w="70%" style={{ marginLeft: 'auto' }} /></td>
                        <td style={TD}><Skel w={110} /><Skel w={80} h={10} bg={C.n100} style={{ marginTop: 8 }} /></td>
                        <td style={TD}><Skel w={84} h={24} r={5} bg={C.n100} /></td>
                        <td style={TD}><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>{[0, 1, 2, 3].map((k) => <Skel key={k} w={36} h={36} r={7} bg={C.n100} />)}</div></td>
                      </tr>
                    ))
                    : paged.items.map((o) => {
                      const on = sel.has(o.id);
                      const drv = isDriver(o);
                      const et = o.etirozlar?.length || 0;
                      return (
                        <tr key={o.id} aria-selected={on} className={`dc-row ${on ? 'is-sel' : ''}`} onClick={() => sel.toggle(o.id)} style={{ cursor: 'pointer' }}>
                          <td style={{ ...TD, paddingLeft: 16, boxShadow: on ? `inset 3px 0 0 ${C.p800}` : 'none' }}>
                            <Checkbox checked={on} onChange={() => sel.toggle(o.id)} label={`${o.invoiceNumber} buyurtmasini tanlash`} />
                          </td>
                          <td style={TD}>
                            <div className="tnum dc-ellipsis" style={{ font: `600 13px/18px ${FONT}`, color: C.p800 }}>{o.invoiceNumber}</div>
                            <div className="tnum dc-ellipsis" style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{o.lotNumber ? `Lot ${o.lotNumber}` : '—'}</div>
                          </td>
                          <td style={TD}>
                            <div className="dc-ellipsis" title={o.client?.orgName} style={{ font: `500 13px/18px ${FONT}` }}>{o.client?.orgName || '—'}</div>
                            {drv && o.returnReason ? (
                              <div className="dc-ellipsis" title={`Haydovchi sababi: ${o.returnReason}`} style={{ font: `400 12px/16px ${FONT}`, color: C.warning.text }}>Sabab: {o.returnReason}</div>
                            ) : (
                              <div className="tnum dc-ellipsis" style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{o.contractNumber ? `Shartnoma ${o.contractNumber}` : '—'}</div>
                            )}
                          </td>
                          {showQty && <td className="tnum" style={{ ...TD, textAlign: 'right', font: `400 13px/18px ${FONT}` }}>{o.boxCount ?? '—'}</td>}
                          <td style={{ ...TD, textAlign: 'right' }}>
                            {o.originalAmount != null && o.originalAmount !== o.totalAmount && (
                              <div className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.n600, textDecoration: 'line-through' }}>{money(o.originalAmount)}</div>
                            )}
                            <div className="tnum" style={{ font: `500 13px/18px ${FONT}`, whiteSpace: 'nowrap' }}>{money(o.totalAmount)}</div>
                          </td>
                          <td style={TD}>
                            <div className="tnum" style={{ font: `400 13px/18px ${FONT}`, whiteSpace: 'nowrap' }}>{dateTime(o.checkingDoneAt)}</div>
                            <div className="dc-ellipsis" title={`Tekshiruvchi: ${o.checker?.fullName || '—'}`} style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{o.checker?.fullName || '—'}</div>
                          </td>
                          <td style={TD}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {drv
                                ? <Badge {...TONE.warning} icon={Undo2}>Haydovchidan qaytgan</Badge>
                                : <StatusBadge variant="NEW">Yangi</StatusBadge>}
                              {et > 0 && <Badge {...TONE.danger} icon={Flag}>{et > 1 ? `${et} ta e’tiroz` : 'E’tiroz yuborilgan'}</Badge>}
                            </div>
                          </td>
                          <td style={{ ...TD, paddingRight: 16 }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                              <IconButton icon={Pencil} label={`${o.invoiceNumber} — summani o‘zgartirish`} disabled={!online} onClick={() => { setAmountErr(null); setAmountId(o.id); }} />
                              <IconButton icon={Flag} tone="danger" label={`${o.invoiceNumber} — tekshiruvchiga e’tiroz bildirish`} disabled={!online} onClick={() => { setEtirozErr(null); setEtirozId(o.id); }} />
                              <IconButton icon={CornerUpLeft} label={`${o.invoiceNumber} — tekshiruvchiga qaytarish`} disabled={!online} onClick={() => { setReturnErr(null); setReturnId(o.id); }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <Pagination page={paged.page} pages={paged.pages} size={paged.size} total={paged.total} onPage={paged.setPage} onSize={paged.setSize} />
          )}
        </Card>
      )}

      {assignOpen && (
        <AssignTripModal
          orders={selOrders}
          busy={assign.isPending}
          error={assignErr}
          onClose={() => setAssignOpen(false)}
          onConfirm={(driverId, vehicleId) => { setAssignErr(null); assign.mutate({ driverId, vehicleId }); }}
        />
      )}
      {amountOrder && (
        <AmountModal
          order={amountOrder}
          busy={amount.isPending}
          error={amountErr}
          onClose={() => setAmountId(null)}
          onSave={(totalAmount) => { setAmountErr(null); amount.mutate({ id: amountOrder.id, totalAmount }); }}
        />
      )}
      {etirozOrder && (
        <CheckerEtirozModal
          order={etirozOrder}
          busy={etiroz.isPending}
          error={etirozErr}
          onClose={() => setEtirozId(null)}
          onSend={(body) => { setEtirozErr(null); etiroz.mutate({ id: etirozOrder.id, body }); }}
        />
      )}
      {returnOrder && (
        <ConfirmDialog
          icon={CornerUpLeft}
          tone="warning"
          title="Tekshiruvchiga qaytarilsinmi?"
          text={`${returnOrder.invoiceNumber} buyurtmasi uni tekshirgan tekshiruvchiga qaytariladi va Biriktirish ro‘yxatidan chiqadi.`}
          summary={[
            ['Tashkilot', returnOrder.client?.orgName || '—'],
            ['Tekshiruvchi', returnOrder.checker?.fullName || '—'],
            ['Summa', money(returnOrder.totalAmount)],
          ]}
          note="Tekshiruvchiga 5 ball jarima yoziladi. Qutilar soni tozalanadi va qayta sanaladi."
          reason={{ label: 'Qaytarish sababi', required: true, placeholder: 'Masalan: qutilar soni noto‘g‘ri, mahsulot yetishmayapti', error: 'Qaytarish sababini kiriting.' }}
          confirmLabel="Qaytarish"
          confirmIcon={CornerUpLeft}
          busyLabel="Qaytarilmoqda…"
          busy={ret.isPending}
          error={returnErr}
          onClose={() => setReturnId(null)}
          onConfirm={(reason) => { setReturnErr(null); ret.mutate({ id: returnOrder.id, reason }); }}
        />
      )}
    </Page>
  );
}
