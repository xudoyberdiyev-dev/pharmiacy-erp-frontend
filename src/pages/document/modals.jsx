import { useId, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardCheck, Repeat2, User, Truck, Package, Boxes, Wallet, Pencil, Flag, TriangleAlert, CircleAlert,
} from 'lucide-react';
import { userAPI, vehicleAPI } from '../../api';
import { C, FONT } from './design/tokens';
import {
  Modal, ModalHeader, ModalFooter, Button, InlineAlert, Field, OrderRef, LABEL_CAPS, Segmented,
} from './design/ui';
import Picker from './design/Picker';
import { money, count, cleanAmountInput } from './lib/format';

// ─────────────────────────────────────────────────────────────────────────
// Hujjatchi paneli modallari: haydovchi/mashina biriktirish (va almashtirish),
// summani o'zgartirish (aniq summa yoki chegirma), checkerga e'tiroz.
// ─────────────────────────────────────────────────────────────────────────

export function useDriversAndVehicles(enabled = true) {
  const drivers = useQuery({
    queryKey: ['users', 'DRIVER', 'active'],
    queryFn: () => userAPI.getAll({ role: 'DRIVER', isActive: true }),
    select: (r) => r.data.data || [],
    enabled,
    staleTime: 60000,
  });
  const vehicles = useQuery({
    queryKey: ['vehicles', 'active'],
    queryFn: () => vehicleAPI.getAll({ isActive: true }),
    select: (r) => r.data.data || [],
    enabled,
    staleTime: 60000,
  });
  return { drivers, vehicles };
}

function OrdersMiniList({ orders }) {
  return (
    <div>
      <div style={{ ...LABEL_CAPS, marginBottom: 8 }}>Tanlangan buyurtmalar</div>
      <div style={{ maxHeight: 132, overflowY: 'auto', border: `1px solid ${C.n200}`, borderRadius: 7 }}>
        {orders.map((o, i) => (
          <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr) auto', gap: 12, alignItems: 'center', height: 36, padding: '0 12px', borderTop: i ? `1px solid ${C.n100}` : 'none', font: `400 13px/18px ${FONT}` }}>
            <span className="tnum dc-ellipsis" style={{ fontWeight: 600, color: C.p800 }}>{o.invoiceNumber}</span>
            <span className="dc-ellipsis" title={o.client?.orgName}>{o.client?.orgName || '—'}</span>
            <span className="tnum" style={{ color: C.n700 }}>{money(o.totalAmount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaRow({ orders }) {
  const sum = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const boxes = orders.reduce((s, o) => s + (o.boxCount || 0), 0);
  const item = (Icon, b, t) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Icon size={16} aria-hidden="true" /> <b className="tnum" style={{ fontWeight: 600, color: C.n900 }}>{b}</b>{t}
    </span>
  );
  return (
    <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      {item(Package, count(orders.length), ' ta buyurtma')}
      {item(Boxes, count(boxes), ' quti')}
      {item(Wallet, money(sum), '')}
    </span>
  );
}

// ── Haydovchi va mashina biriktirish / almashtirish ──────────────────────
// mode: 'assign' (Biriktirish bo'limidan, bir nechta buyurtma) yoki
//       'reassign' (Safarga tayyor, bitta buyurtma — joriy qiymatlar belgilanadi)
export function AssignTripModal({ mode = 'assign', orders, onClose, onConfirm, busy, error }) {
  const uid = useId();
  const reassign = mode === 'reassign';
  const cur = reassign ? orders[0] : null;
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const { drivers, vehicles } = useDriversAndVehicles(true);
  const [openPicker, setOpenPicker] = useState(null);

  const driverOptions = useMemo(() => (drivers.data || []).map((d) => ({
    value: d.id, label: d.fullName, sub: d.phone, current: cur?.driver?.id === d.id || cur?.driverId === d.id,
  })), [drivers.data, cur]);
  const vehicleOptions = useMemo(() => (vehicles.data || []).map((v) => ({
    value: v.id, label: v.model, sub: v.plateNumber, current: cur?.vehicle?.id === v.id || cur?.vehicleId === v.id,
  })), [vehicles.data, cur]);

  const same = reassign && driverId && vehicleId
    && driverId === (cur?.driver?.id || cur?.driverId) && vehicleId === (cur?.vehicle?.id || cur?.vehicleId);
  const canSave = driverId && vehicleId && !busy && !same;
  const listError = drivers.isError || vehicles.isError;

  return (
    <Modal onClose={onClose} busy={busy} width={560} labelledBy={`${uid}-t`}>
      <ModalHeader
        id={`${uid}-t`}
        icon={reassign ? Repeat2 : ClipboardCheck}
        title={reassign ? 'Haydovchi va mashinani almashtirish' : 'Haydovchi va mashina biriktirish'}
        subtitle={reassign ? <OrderRef order={cur} /> : <MetaRow orders={orders} />}
        onClose={onClose}
        busy={busy}
      />
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', minHeight: 0 }}>
        {error && (
          <InlineAlert tone="danger" title={reassign ? 'Almashtirib bo‘lmadi.' : 'Biriktirib bo‘lmadi.'}>
            {error}
          </InlineAlert>
        )}
        {listError && <InlineAlert tone="danger">Haydovchi yoki mashinalar ro‘yxatini yuklab bo‘lmadi. Oynani yopib qayta oching.</InlineAlert>}
        {reassign ? (
          <div>
            <div style={{ ...LABEL_CAPS, marginBottom: 8 }}>Joriy biriktirish</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 12, borderRadius: 7, background: C.n50, border: `1px solid ${C.n200}` }}>
              {[[User, 'Haydovchi', cur?.driver?.fullName], [Truck, 'Mashina', cur?.vehicle ? `${cur.vehicle.model} · ${cur.vehicle.plateNumber}` : null]].map(([Icon, k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8, minWidth: 0 }}>
                  <Icon size={16} aria-hidden="true" style={{ color: C.n600, flex: 'none', marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{k}</div>
                    <div className="dc-ellipsis tnum" style={{ font: `500 13px/18px ${FONT}` }}>{v || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <OrdersMiniList orders={orders} />
        )}
        <Picker
          label={reassign ? 'Yangi haydovchi' : 'Haydovchi'}
          required
          icon={User}
          value={driverId}
          onChange={setDriverId}
          options={driverOptions}
          loading={drivers.isLoading}
          disabled={busy}
          placeholder="Haydovchini qidiring yoki tanlang"
          searchPlaceholder="Ism yoki telefon"
          emptyLabel="Haydovchi topilmadi"
          onOpenChange={(o) => setOpenPicker((p) => (o ? 'driver' : p === 'driver' ? null : p))}
        />
        <Picker
          label={reassign ? 'Yangi mashina' : 'Mashina'}
          required
          icon={Truck}
          value={vehicleId}
          onChange={setVehicleId}
          options={vehicleOptions}
          loading={vehicles.isLoading}
          disabled={busy}
          placeholder="Mashinani qidiring yoki tanlang"
          searchPlaceholder="Model yoki davlat raqami"
          emptyLabel="Mashina topilmadi"
          onOpenChange={(o) => setOpenPicker((p) => (o ? 'vehicle' : p === 'vehicle' ? null : p))}
        />
        {openPicker && <div style={{ height: openPicker === 'driver' ? 160 : 240, flex: 'none' }} aria-hidden="true" />}
      </div>
      <ModalFooter
        hint={same
          ? 'Tanlangan haydovchi va mashina joriy biriktirish bilan bir xil.'
          : reassign ? 'Faqat shu buyurtma yangi safarga o‘tkaziladi.' : 'Buyurtmalar Hujjatlashtirish bo‘limiga o‘tadi.'}
      >
        <Button variant="secondary" onClick={onClose} disabled={busy}>Ortga</Button>
        <Button
          variant="primary"
          icon={reassign ? Repeat2 : ClipboardCheck}
          loading={busy}
          loadingLabel="Saqlanmoqda…"
          disabled={!canSave}
          onClick={() => onConfirm(driverId, vehicleId)}
        >
          {error ? 'Qayta urinish' : reassign ? 'Qayta biriktirish' : 'Biriktirish'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ── Summani o'zgartirish: aniq summa yoki chegirma (% / so'm) ────────────
export function AmountModal({ order, onClose, onSave, busy, error }) {
  const uid = useId();
  const base = Number(order.totalAmount) || 0;
  const [mode, setMode] = useState('exact'); // exact | percent | fixed
  const [value, setValue] = useState(mode === 'exact' ? String(base) : '');
  const [tried, setTried] = useState(false);

  const num = parseFloat(value);
  const round2 = (n) => Math.round(n * 100) / 100;
  let next = null;
  let err = null;
  if (value === '' || Number.isNaN(num)) err = 'Qiymatni kiriting.';
  else if (mode === 'exact') {
    next = round2(num);
    if (next <= 0) err = 'Summa 0 dan katta bo‘lishi kerak.';
    else if (next === base) err = 'Yangi summa joriy summa bilan bir xil.';
  } else if (mode === 'percent') {
    if (num <= 0 || num >= 100) err = 'Chegirma foizi 0 dan katta va 100 dan kichik bo‘lishi kerak.';
    else next = round2(base - base * (num / 100));
  } else {
    if (num <= 0) err = 'Chegirma summasi 0 dan katta bo‘lishi kerak.';
    else if (num >= base) err = 'Chegirma joriy summadan kichik bo‘lishi kerak.';
    else next = round2(base - num);
  }
  const switchMode = (m) => { setMode(m); setValue(m === 'exact' ? String(base) : ''); setTried(false); };
  const submit = () => { setTried(true); if (!err && next != null) onSave(next); };

  return (
    <Modal onClose={onClose} busy={busy} width={480} labelledBy={`${uid}-t`} initialFocus="input">
      <ModalHeader id={`${uid}-t`} icon={Pencil} title="Summani o‘zgartirish" subtitle={<OrderRef order={order} />} onClose={onClose} busy={busy} />
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <InlineAlert tone="danger" title="Saqlab bo‘lmadi.">{error}</InlineAlert>}
        <Segmented
          label="O‘zgartirish turi"
          value={mode}
          onChange={switchMode}
          disabled={busy}
          options={[{ value: 'exact', label: 'Aniq summa' }, { value: 'percent', label: 'Chegirma, %' }, { value: 'fixed', label: 'Chegirma, so‘m' }]}
        />
        <Field
          label={mode === 'exact' ? 'Yangi summa' : mode === 'percent' ? 'Chegirma foizi' : 'Chegirma summasi'}
          required
          htmlFor={`${uid}-v`}
          error={tried && err ? err : null}
          hint={order.originalAmount != null ? `Dastlabki summa: ${money(order.originalAmount)}` : 'Hujjat chiqarilgach summa o‘zgarmaydi.'}
        >
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id={`${uid}-v`}
              inputMode="decimal"
              value={value}
              disabled={busy}
              onChange={(e) => setValue(cleanAmountInput(e.target.value))}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder={mode === 'percent' ? '10' : '0'}
              aria-invalid={tried && err ? 'true' : undefined}
              className={`dc-input tnum ${tried && err ? 'invalid' : ''}`}
              style={{ paddingRight: 52, textAlign: 'right', fontWeight: 500 }}
            />
            <span style={{ position: 'absolute', right: 12, font: `400 12px/16px ${FONT}`, color: C.n600 }}>{mode === 'percent' ? '%' : 'so‘m'}</span>
          </span>
        </Field>
        <div style={{ padding: 12, borderRadius: 7, background: C.n50, border: `1px solid ${C.n200}`, display: 'flex', flexDirection: 'column', gap: 6, font: `400 13px/18px ${FONT}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.n600 }}>Joriy summa</span><span className="tnum">{money(base)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: C.n600 }}>Farq</span>
            <span className="tnum">{next != null ? money(next - base) : '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: `1px solid ${C.n200}` }}>
            <b style={{ fontWeight: 600 }}>Yangi summa</b>
            <b className="tnum" style={{ fontWeight: 600 }}>{next != null && !err ? money(next) : '—'}</b>
          </div>
        </div>
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Yopish</Button>
        <Button variant="primary" icon={Pencil} loading={busy} loadingLabel="Saqlanmoqda…" onClick={submit} disabled={tried && !!err}>Saqlash</Button>
      </ModalFooter>
    </Modal>
  );
}

// ── Checkerga e'tiroz ────────────────────────────────────────────────────
const CHECKER_ETIROZ_TYPES = [
  { value: 'WRONG_QUANTITY', label: 'Dori miqdori noto‘g‘ri' },
  { value: 'WRONG_PRODUCT', label: 'Noto‘g‘ri dori topshirilgan' },
  { value: 'WRONG_SERIES', label: 'Dorining seriyasi boshqa' },
  { value: 'DAMAGED', label: 'Dori shikastlangan / yaroqsiz' },
  { value: 'MISSING_PRODUCT', label: 'Mahsulot yo‘q edi' },
  { value: 'OTHER', label: 'Boshqa sabab (izoh majburiy)' },
];

export function CheckerEtirozModal({ order, onClose, onSend, busy, error }) {
  const uid = useId();
  const [types, setTypes] = useState([]);
  const [comment, setComment] = useState('');
  const [tried, setTried] = useState(false);
  const toggle = (v) => setTypes((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));
  const needComment = types.includes('OTHER');
  const typeErr = types.length === 0 ? 'Kamida bitta sababni tanlang.' : null;
  const commentErr = needComment && !comment.trim() ? '«Boshqa sabab» uchun izoh yozing.' : null;
  const already = order.etirozlar?.length || 0;
  const submit = () => {
    setTried(true);
    if (typeErr || commentErr) return;
    onSend({ types, comment: comment.trim() || undefined });
  };
  return (
    <Modal onClose={onClose} busy={busy} width={560} labelledBy={`${uid}-t`}>
      <ModalHeader id={`${uid}-t`} icon={Flag} tone="danger" title="Tekshiruvchiga e’tiroz bildirish" subtitle={<OrderRef order={order} />} onClose={onClose} busy={busy} />
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', minHeight: 0 }}>
        {error && <InlineAlert tone="danger" title="Yuborib bo‘lmadi.">{error}</InlineAlert>}
        <InlineAlert tone="warning" icon={TriangleAlert}>
          Yuborilganda tekshiruvchiga (<b style={{ fontWeight: 600 }}>{order.checker?.fullName || '—'}</b>) <b style={{ fontWeight: 600 }}>5 ball jarima</b> avtomatik yoziladi — nechta sabab tanlansa ham bir marta.
          {already > 0 && <> Bu buyurtma bo‘yicha avval <b style={{ fontWeight: 600 }}>{already} ta</b> e’tiroz yuborilgan — yangi e’tiroz yana jarima yozadi.</>}
        </InlineAlert>
        <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <legend style={{ ...LABEL_CAPS, marginBottom: 8, color: tried && typeErr ? C.danger.text : LABEL_CAPS.color }}>Sabablar — bir nechtasini tanlash mumkin</legend>
          {CHECKER_ETIROZ_TYPES.map((t) => {
            const on = types.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={busy}
                onClick={() => toggle(t.value)}
                className="dc-focus"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 12px', borderRadius: 7, cursor: 'pointer', outline: 'none', textAlign: 'left',
                  border: `1px solid ${on ? C.p300 : tried && typeErr ? C.danger.border : C.n300}`, background: on ? C.p50 : '#fff', font: `500 13px/18px ${FONT}`, color: C.n900,
                }}
              >
                <span aria-hidden="true" style={{ width: 20, height: 20, borderRadius: 5, flex: 'none', border: `1.5px solid ${on ? C.p800 : C.n500}`, background: on ? C.p800 : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{on ? '✓' : ''}</span>
                {t.label}
              </button>
            );
          })}
          {tried && typeErr && <span role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 12px/16px ${FONT}`, color: C.danger.text }}><CircleAlert size={16} /> {typeErr}</span>}
        </fieldset>
        <Field label="Izoh" required={needComment} optional={!needComment} htmlFor={`${uid}-c`} error={tried && commentErr ? commentErr : null}>
          <textarea
            id={`${uid}-c`}
            rows={3}
            maxLength={500}
            value={comment}
            disabled={busy}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Masalan: 3-qutida 2 ta mahsulot yetishmaydi"
            className={`dc-input ${tried && commentErr ? 'invalid' : ''}`}
          />
        </Field>
      </div>
      <ModalFooter hint="E’tiroz tekshiruvchining «E’tirozlar» bo‘limiga tushadi.">
        <Button variant="secondary" onClick={onClose} disabled={busy}>Yopish</Button>
        <Button variant="danger" icon={Flag} loading={busy} loadingLabel="Yuborilmoqda…" onClick={submit}>
          {types.length > 1 ? `E’tiroz yuborish (${types.length} ta)` : 'E’tiroz yuborish'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
