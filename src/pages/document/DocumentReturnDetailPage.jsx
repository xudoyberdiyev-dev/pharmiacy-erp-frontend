import { useEffect, useId, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, Users, FileSpreadsheet, Upload, X, PackageMinus, CircleCheck, ExternalLink, CircleAlert,
} from 'lucide-react';
import { documentAPI } from '../../api';
import { FILE_BASE_URL } from '../../api/axios';
import { getErrorMessage } from '../../lib/errors';
import { C, FONT } from './design/tokens';
import {
  Page, Card, Button, IconButton, Field, InlineAlert, ErrorState, Skel, notify, Badge, TONE, LABEL_CAPS, usePagePad,
} from './design/ui';
import { OrderStatus } from './DocumentHistoryPage';
import { money, dateTime, cleanAmountInput } from './lib/format';
import { useOnline } from './lib/hooks';

// ─────────────────────────────────────────────────────────────────────────
// Qaytarilgan tovarni qayd etish (bir buyurtma). Chapda — buyurtma va
// jarayon ishtirokchilari, o'ngda — qayd etish formasi. Asl marking Excel
// hech qachon o'zgarmaydi; qaytarish hujjati alohida saqlanadi.
// ─────────────────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }) {
  return (
    <Card as="section" aria-label={title} style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${C.n200}` }}>
        <span style={{ width: 32, height: 32, borderRadius: 7, background: C.p50, color: C.p800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} aria-hidden="true" /></span>
        <h2 style={{ margin: 0, font: `600 14px/20px ${FONT}`, color: C.n900 }}>{title}</h2>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </Card>
  );
}

function Info({ label, value, sub }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 7, background: C.n50, border: `1px solid ${C.n200}`, minWidth: 0 }}>
      <div style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{label}</div>
      <div className="tnum dc-ellipsis" title={typeof value === 'string' ? value : undefined} style={{ font: `500 13px/18px ${FONT}`, color: C.n900 }}>{value ?? '—'}</div>
      {sub && <div className="tnum dc-ellipsis" style={{ font: `400 12px/16px ${FONT}`, color: C.n600 }}>{sub}</div>}
    </div>
  );
}

export default function DocumentReturnDetailPage() {
  const uid = useId();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const online = useOnline();
  const { vw } = usePagePad();
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [amount, setAmount] = useState('');
  const [tried, setTried] = useState(false);
  const [err, setErr] = useState(null);

  const query = useQuery({
    queryKey: ['document', 'order', id],
    queryFn: () => documentAPI.getOrderFull(id),
    select: (r) => r.data.data,
  });
  const order = query.data;

  useEffect(() => { if (order?.returnedGoodsNote) setNote(order.returnedGoodsNote); }, [order?.returnedGoodsNote]);

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/document/history'));

  const parsed = amount !== '' ? parseFloat(amount) : null;
  const total = order?.totalAmount ?? 0;
  const amountErr = parsed == null ? null
    : Number.isNaN(parsed) || parsed <= 0 ? 'Qaytarilgan summa 0 dan katta bo‘lishi kerak.'
      : parsed > total ? 'Qaytarilgan summa faktura summasidan katta bo‘lishi mumkin emas.' : null;
  const noteErr = !note.trim() ? 'Izoh yozish majburiy.' : null;
  const blocked = order && ['CANCELLED', 'RETURNED'].includes(order.status);

  const mut = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('returnedGoodsNote', note.trim());
      if (parsed != null) fd.append('returnedAmount', String(parsed));
      if (file) fd.append('markedExcel', file);
      return documentAPI.submitReturn(id, fd);
    },
    onSuccess: () => {
      notify({ icon: PackageMinus, title: order.hasReturnedGoods ? 'Ma’lumot yangilandi' : 'Qaytarilgan tovar qayd etildi', desc: `${order.invoiceNumber}${parsed != null ? ` · −${money(parsed)}` : ''}` });
      qc.invalidateQueries({ queryKey: ['document'] });
      goBack();
    },
    onError: (e) => setErr(getErrorMessage(e)),
  });

  const submit = () => {
    setTried(true);
    if (noteErr || amountErr) return;
    setErr(null);
    mut.mutate();
  };

  const header = (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <IconButton icon={ArrowLeft} label="Orqaga" onClick={goBack} style={{ border: `1px solid ${C.n300}`, background: '#fff', flex: 'none' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 className="tnum" style={{ margin: 0, font: `600 24px/32px ${FONT}`, color: C.n900 }}>{order ? order.invoiceNumber : 'Buyurtma'}</h1>
          {order && <OrderStatus o={order} />}
          {order?.hasReturnedGoods && <Badge {...TONE.warning} icon={PackageMinus}>Tovar qaytgan</Badge>}
        </div>
        <p style={{ margin: 0, font: `400 13px/20px ${FONT}`, color: C.n600 }}>Qaytarilgan tovarni qayd etish</p>
      </div>
    </div>
  );

  if (query.isLoading) {
    return (
      <Page>
        {header}
        <div className="dc-pulse" aria-busy="true" aria-label="Yuklanmoqda" style={{ display: 'grid', gridTemplateColumns: vw >= 1100 ? 'minmax(0,1fr) 440px' : '1fr', gap: 16 }}>
          <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}><Skel w="40%" /><Skel h={56} r={7} bg={C.n100} /><Skel h={56} r={7} bg={C.n100} /></Card>
          <Card style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}><Skel w="50%" /><Skel h={40} r={7} bg={C.n100} /><Skel h={88} r={7} bg={C.n100} /></Card>
        </div>
      </Page>
    );
  }
  if (!order) {
    const notFound = query.error?.response?.status === 404;
    return (
      <Page>
        {header}
        <ErrorState
          title={notFound ? 'Buyurtma topilmadi' : 'Buyurtmani yuklab bo‘lmadi'}
          text={notFound ? 'Bu buyurtma o‘chirilgan yoki havola noto‘g‘ri.' : 'Server javob bermadi. Qayta urinib ko‘ring.'}
          onRetry={notFound ? undefined : () => query.refetch()}
        />
      </Page>
    );
  }

  const newTotal = parsed != null && !amountErr ? total - parsed : null;
  const at = (d) => (d ? dateTime(d) : null);

  return (
    <Page>
      {header}
      <div style={{ display: 'grid', gridTemplateColumns: vw >= 1100 ? 'minmax(0,1fr) 440px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <Section icon={Building2} title="Buyurtma ma’lumotlari">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ font: `600 14px/20px ${FONT}` }}>{order.client?.orgName || '—'}</span>
                <span className="tnum" style={{ font: `400 13px/18px ${FONT}`, color: C.n600 }}>{[order.client?.phone, order.client?.address].filter(Boolean).join(' · ') || '—'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 8 }}>
                <Info label="Shartnoma" value={order.contractNumber} />
                <Info label="Lot" value={order.lotNumber} />
                <Info label="Qutilar" value={order.boxCount} />
                <Info label="Joriy summa" value={money(order.totalAmount)} sub={order.originalAmount != null ? `Dastlabki: ${money(order.originalAmount)}` : null} />
                {order.returnedAmount != null && <Info label="Jami qaytarilgan" value={`−${money(order.returnedAmount)}`} />}
              </div>
            </div>
          </Section>
          <Section icon={Users} title="Jarayon ishtirokchilari">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
              <Info label="Buyurtma yaratuvchi" value={order.createdBy?.fullName} />
              <Info label="Yig‘uvchi" value={order.assignedPicker?.fullName} sub={at(order.pickingDoneAt)} />
              <Info label="Markirovkachi" value={order.marker?.fullName} sub={at(order.markingDoneAt)} />
              <Info label="Tekshiruvchi" value={order.checker?.fullName} sub={at(order.checkingDoneAt)} />
              <Info label="Haydovchi" value={order.driver?.fullName} sub={order.vehicle ? `${order.vehicle.model} · ${order.vehicle.plateNumber}` : null} />
              <Info label="Hujjatchi" value={order.dispatchDocument?.issuedBy?.fullName} sub={order.dispatchDocument ? `Hujjat № ${order.dispatchDocument.documentNumber}` : null} />
            </div>
          </Section>
        </div>

        <Section icon={PackageMinus} title={order.hasReturnedGoods ? 'Yana tovar qaytarishni qayd etish' : 'Tovar qaytarishni qayd etish'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {order.hasReturnedGoods && (
              <InlineAlert tone="success" icon={CircleCheck}>
                Avval qayd etilgan: {order.returnedGoodsBy?.fullName || '—'}, {dateTime(order.returnedGoodsAt)}. Yangi summa avvalgisiga qo‘shiladi.
              </InlineAlert>
            )}
            {blocked && <InlineAlert tone="warning">Bu buyurtma {order.status === 'CANCELLED' ? 'bekor qilingan' : 'to‘liq qaytarilgan'} — tovar qaytarishni qayd etib bo‘lmaydi.</InlineAlert>}
            {err && <InlineAlert title="Saqlab bo‘lmadi.">{err}</InlineAlert>}

            {(order.markedExcelUrl || order.returnedGoodsExcelUrl) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={LABEL_CAPS}>Fayllar</span>
                {order.markedExcelUrl && (
                  <a href={`${FILE_BASE_URL}${order.markedExcelUrl}`} target="_blank" rel="noreferrer" className="dc-btn dc-secondary" style={{ justifyContent: 'flex-start' }}>
                    <FileSpreadsheet size={16} aria-hidden="true" /> Asl markirovka Excel (o‘zgarmaydi) <ExternalLink size={16} aria-hidden="true" style={{ marginLeft: 'auto', color: C.n600 }} />
                  </a>
                )}
                {order.returnedGoodsExcelUrl && (
                  <a href={`${FILE_BASE_URL}${order.returnedGoodsExcelUrl}`} target="_blank" rel="noreferrer" className="dc-btn dc-secondary" style={{ justifyContent: 'flex-start' }}>
                    <FileSpreadsheet size={16} aria-hidden="true" /> Joriy qaytarish hujjati <ExternalLink size={16} aria-hidden="true" style={{ marginLeft: 'auto', color: C.n600 }} />
                  </a>
                )}
              </div>
            )}

            <Field label="Qaytarish hujjati (Excel)" optional hint="Asl markirovka Excel'iga tegmaydi.">
              {file ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, padding: '0 8px 0 12px', borderRadius: 7, border: `1px solid ${C.success.border}`, background: C.success.bg }}>
                  <FileSpreadsheet size={16} aria-hidden="true" style={{ color: C.success.main }} />
                  <span className="dc-ellipsis" style={{ flex: 1, font: `500 13px/18px ${FONT}`, color: C.success.text }}>{file.name}</span>
                  <IconButton icon={X} size={16} label="Faylni olib tashlash" onClick={() => setFile(null)} disabled={mut.isPending} />
                </div>
              ) : (
                <label className="dc-hover" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: 7, border: `1px dashed ${C.n300}`, cursor: blocked ? 'not-allowed' : 'pointer', font: `500 13px/18px ${FONT}`, color: C.p700 }}>
                  <Upload size={16} aria-hidden="true" /> Excel faylni tanlash (.xlsx, .xls)
                  <input type="file" accept=".xlsx,.xls" disabled={blocked} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              )}
            </Field>

            <Field label="Qaytarilgan summa" optional htmlFor={`${uid}-a`} error={tried && amountErr ? amountErr : null} hint="Kiritilsa, faktura summasidan ayiriladi.">
              <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id={`${uid}-a`}
                  inputMode="decimal"
                  value={amount}
                  disabled={blocked || mut.isPending}
                  onChange={(e) => setAmount(cleanAmountInput(e.target.value))}
                  placeholder="0"
                  aria-invalid={tried && amountErr ? 'true' : undefined}
                  className={`dc-input tnum ${tried && amountErr ? 'invalid' : ''}`}
                  style={{ paddingRight: 52, textAlign: 'right' }}
                />
                <span style={{ position: 'absolute', right: 12, font: `400 12px/16px ${FONT}`, color: C.n600 }}>so‘m</span>
              </span>
            </Field>
            {parsed != null && (
              <div className="tnum" style={{ padding: 12, borderRadius: 7, background: C.n50, border: `1px solid ${C.n200}`, display: 'flex', flexDirection: 'column', gap: 6, font: `400 13px/18px ${FONT}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.n600 }}>Joriy summa</span><span>{money(total)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: C.n600 }}>Qaytarilgan</span><span style={{ color: C.warning.text }}>{amountErr ? '—' : `−${money(parsed)}`}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: `1px solid ${C.n200}` }}><b style={{ fontWeight: 600 }}>Yangi summa</b><b style={{ fontWeight: 600 }}>{newTotal != null ? money(newTotal) : '—'}</b></div>
              </div>
            )}

            <Field label="Izoh" required htmlFor={`${uid}-n`} error={tried && noteErr ? noteErr : null}>
              <textarea
                id={`${uid}-n`}
                rows={4}
                maxLength={1000}
                value={note}
                disabled={blocked || mut.isPending}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nima uchun va qancha miqdorda tovar qaytarildi..."
                aria-invalid={tried && noteErr ? 'true' : undefined}
                className={`dc-input ${tried && noteErr ? 'invalid' : ''}`}
              />
            </Field>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: `1px solid ${C.n200}` }}>
              <Button variant="secondary" onClick={goBack} disabled={mut.isPending} style={{ marginTop: 12 }}>Yopish</Button>
              <Button variant="primary" icon={PackageMinus} loading={mut.isPending} loadingLabel="Saqlanmoqda…" disabled={blocked || !online} offline={!online} onClick={submit} style={{ marginTop: 12 }}>
                {order.hasReturnedGoods ? 'Yana qayd etish' : 'Qayd etish'}
              </Button>
            </div>
            {tried && (noteErr || amountErr) && (
              <span role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 12px/16px ${FONT}`, color: C.danger.text }}>
                <CircleAlert size={16} aria-hidden="true" /> {[noteErr, amountErr].filter(Boolean).length} ta maydonni to‘g‘rilang.
              </span>
            )}
          </div>
        </Section>
      </div>
    </Page>
  );
}
