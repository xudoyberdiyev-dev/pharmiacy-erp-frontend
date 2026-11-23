import { useId, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet, Truck, ClipboardCheck, UserCog, Building2, ShieldCheck, Package, Boxes, Wallet, CircleAlert, Info,
} from 'lucide-react';
import { userAPI } from '../../api';
import { C, FONT } from './design/tokens';
import { Modal, ModalHeader, ModalFooter, Button, InlineAlert, LABEL_CAPS } from './design/ui';
import Picker from './design/Picker';
import { money, count } from './lib/format';

// ─────────────────────────────────────────────────────────────────────────
// Hujjat (Excel) yaratish oynasi: jadval ustunlari, pastki imzo qatorlari,
// ixtiyoriy Buxgalter va Tasdiqlovchi (Admin). Kamida bitta ustun majburiy.
// ─────────────────────────────────────────────────────────────────────────

const COLUMN_OPTIONS = [
  { key: 'phone',    label: 'Telefon raqami' },
  { key: 'inn',      label: 'INN raqami' },
  { key: 'faktura',  label: 'Faktura raqami' },
  { key: 'contract', label: 'Shartnoma raqami' },
  { key: 'boxCount', label: 'Qutilar soni' },
  { key: 'amount',   label: 'Summa' },
];

const uniq = (arr) => [...new Set(arr.filter(Boolean))].join(', ');

function CheckCard({ checked, onToggle, label, sub, icon: Icon, invalid, disabled }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className="dc-focus"
      style={{
        display: 'flex', alignItems: 'center', gap: 10, minHeight: sub ? 56 : 44, padding: '8px 12px', borderRadius: 7, textAlign: 'left',
        border: `1px solid ${checked ? C.p300 : invalid ? C.danger.border : C.n300}`, background: checked ? C.p50 : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer', outline: 'none', color: C.n900, minWidth: 0,
      }}
    >
      <span aria-hidden="true" style={{ width: 20, height: 20, flex: 'none', borderRadius: 5, border: `1.5px solid ${checked ? C.p800 : C.n500}`, background: checked ? C.p800 : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{checked ? '✓' : ''}</span>
      {Icon && <Icon size={16} aria-hidden="true" style={{ color: C.n600, flex: 'none' }} />}
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ font: `500 13px/18px ${FONT}` }}>{label}</span>
        {sub && <span className="dc-ellipsis" title={sub} style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{sub}</span>}
      </span>
    </button>
  );
}

export default function DocumentBuilderModal({ orders, onClose, onConfirm, loading, error }) {
  const uid = useId();
  const [columns, setColumns] = useState(() => Object.fromEntries(COLUMN_OPTIONS.map((c) => [c.key, true])));
  const [footer, setFooter] = useState({ documenter: true, deliverer: true, checker: true, creator: true });
  const [accountantId, setAccountantId] = useState('');
  const [adminId, setAdminId] = useState('');

  const acc1 = useQuery({ queryKey: ['users', 'ACCOUNTANT1', 'active'], queryFn: () => userAPI.getAll({ role: 'ACCOUNTANT1', isActive: true }), select: (r) => r.data.data || [], staleTime: 60000 });
  const acc2 = useQuery({ queryKey: ['users', 'ACCOUNTANT2', 'active'], queryFn: () => userAPI.getAll({ role: 'ACCOUNTANT2', isActive: true }), select: (r) => r.data.data || [], staleTime: 60000 });
  const admins = useQuery({ queryKey: ['users', 'ADMIN', 'active'], queryFn: () => userAPI.getAll({ role: 'ADMIN', isActive: true }), select: (r) => r.data.data || [], staleTime: 60000 });

  const accOptions = useMemo(() => [...(acc1.data || []), ...(acc2.data || [])].map((a) => ({ value: a.id, label: a.fullName, sub: a.phone })), [acc1.data, acc2.data]);
  const adminOptions = useMemo(() => (admins.data || []).map((a) => ({ value: a.id, label: a.fullName, sub: a.phone })), [admins.data]);

  const selectedCount = COLUMN_OPTIONS.filter((c) => columns[c.key]).length;
  const invalid = selectedCount === 0;
  const sum = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const boxes = orders.reduce((s, o) => s + (o.boxCount || 0), 0);
  const drivers = uniq(orders.map((o) => o.driver?.fullName));
  const vehicles = uniq(orders.map((o) => (o.vehicle ? `${o.vehicle.model} · ${o.vehicle.plateNumber}` : null)));

  const submit = () => {
    if (invalid || loading) return;
    onConfirm(
      COLUMN_OPTIONS.filter((c) => columns[c.key]).map((c) => c.key),
      { ...footer, accountantId: accountantId || null, adminId: adminId || null },
    );
  };

  const meta = (
    <span style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Package size={16} aria-hidden="true" /><b className="tnum" style={{ fontWeight: 600, color: C.n900 }}>{count(orders.length)}</b> ta buyurtma</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Boxes size={16} aria-hidden="true" /><b className="tnum" style={{ fontWeight: 600, color: C.n900 }}>{count(boxes)}</b> quti</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Wallet size={16} aria-hidden="true" /><b className="tnum" style={{ fontWeight: 600, color: C.n900 }}>{money(sum)}</b></span>
    </span>
  );

  return (
    <Modal onClose={onClose} busy={loading} width={760} labelledBy={`${uid}-t`}>
      <ModalHeader id={`${uid}-t`} icon={FileSpreadsheet} title="Hujjatlashtirish" subtitle={meta} onClose={onClose} busy={loading} />
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', minHeight: 0 }}>
        {error && <InlineAlert tone="danger" title="Hujjat yaratilmadi.">{error} Tanlov va sozlamalar saqlandi.</InlineAlert>}

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

        <fieldset style={{ border: 'none', margin: 0, padding: 0 }} disabled={loading}>
          <legend style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginBottom: 8, padding: 0 }}>
            <span style={{ ...LABEL_CAPS, color: invalid ? C.danger.text : LABEL_CAPS.color }}>Jadval ustunlari</span>
            <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{selectedCount} / {COLUMN_OPTIONS.length} tanlandi</span>
          </legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
            {COLUMN_OPTIONS.map((c) => (
              <CheckCard key={c.key} checked={columns[c.key]} invalid={invalid} disabled={loading} label={c.label} onToggle={() => setColumns((p) => ({ ...p, [c.key]: !p[c.key] }))} />
            ))}
          </div>
          {invalid && (
            <span role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, font: `500 12px/16px ${FONT}`, color: C.danger.text }}>
              <CircleAlert size={16} aria-hidden="true" /> Hujjat uchun kamida bitta ustunni tanlang.
            </span>
          )}
        </fieldset>

        <fieldset style={{ border: 'none', margin: 0, padding: 0 }} disabled={loading}>
          <legend style={{ ...LABEL_CAPS, marginBottom: 8, padding: 0 }}>Pastki ma’lumotlar</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 8 }}>
            <CheckCard checked={footer.documenter} disabled={loading} icon={FileSpreadsheet} label="Hujjatlashtiruvchi" sub="Siz" onToggle={() => setFooter((p) => ({ ...p, documenter: !p.documenter }))} />
            <CheckCard checked={footer.deliverer} disabled={loading} icon={Truck} label="Yetkazib beruvchi" sub={`${drivers || '—'}${vehicles ? ` · ${vehicles}` : ''}`} onToggle={() => setFooter((p) => ({ ...p, deliverer: !p.deliverer }))} />
            <CheckCard checked={footer.checker} disabled={loading} icon={ClipboardCheck} label="Tekshiruvchi" sub={uniq(orders.map((o) => o.checker?.fullName)) || '—'} onToggle={() => setFooter((p) => ({ ...p, checker: !p.checker }))} />
            <CheckCard checked={footer.creator} disabled={loading} icon={UserCog} label="Buyurtma yaratuvchi" sub={uniq(orders.map((o) => o.createdBy?.fullName)) || '—'} onToggle={() => setFooter((p) => ({ ...p, creator: !p.creator }))} />
          </div>
        </fieldset>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }}>
          <Picker label="Buxgalter" optional icon={Building2} value={accountantId} onChange={setAccountantId} options={accOptions} loading={acc1.isLoading || acc2.isLoading} disabled={loading} allowNone openUp searchPlaceholder="Ism yoki telefon" emptyLabel="Buxgalter topilmadi" />
          <Picker label="Tasdiqlovchi (Admin)" optional icon={ShieldCheck} value={adminId} onChange={setAdminId} options={adminOptions} loading={admins.isLoading} disabled={loading} allowNone openUp searchPlaceholder="Ism yoki telefon" emptyLabel="Admin topilmadi" />
        </div>
      </div>
      <ModalFooter
        hint={loading ? 'Hujjat yaratilmoqda. Oynani yopmang.' : invalid ? 'Davom etish uchun kamida bitta ustun kerak.' : 'Hujjat Excel fayli sifatida yuklab olinadi.'}
        hintIcon={invalid ? CircleAlert : Info}
        hintTone={invalid ? 'danger' : undefined}
      >
        <Button variant="secondary" onClick={onClose} disabled={loading}>Ortga</Button>
        <Button variant="primary" icon={FileSpreadsheet} loading={loading} loadingLabel="Yaratilmoqda…" disabled={invalid} onClick={submit}>
          {error ? 'Qayta urinish' : 'Hujjat yaratish'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
