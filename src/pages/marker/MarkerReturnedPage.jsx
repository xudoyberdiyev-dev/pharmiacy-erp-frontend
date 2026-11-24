import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FILE_BASE_URL } from '../../api/axios';
import {
  Undo2, Info, RefreshCw, CloudOff, CircleCheck, FileSpreadsheet, ExternalLink, Upload, X, FileX,
  LoaderCircle, Send, TriangleAlert, CircleAlert, MessageSquareQuote, UserCheck,
} from 'lucide-react';
import { markerAPI } from '../../api';
import { getErrorMessage } from '../../lib/errors';
import { formatSum } from '../../lib/format';
import { C, FONT, MONO, SHADOW } from './design/tokens';

// ─────────────────────────────────────────────────────────────────────────
// Qaytgan buyurtmalar (Design System Phase 05).
// Backend: GET /marker/orders/returned — status=MARKING, markerId=me,
// returnedToMarkingAt != null, returnedToMarkingAt desc. Vaqt hisoblanmaydi.
// Qayta yuborish: PATCH /marker/orders/:id/complete (multer `markedExcel`,
// .xlsx/.xls, 10 MB). Fayl ixtiyoriy; fayl yuborilmasa avvalgi markedExcelUrl
// saqlanib qoladi. Muvaffaqiyatda: status→CHECKING, returnedToMarkingAt/returnReason=null.
// ─────────────────────────────────────────────────────────────────────────

const API_ORIGIN = FILE_BASE_URL;
// date-fns standart (inglizcha) o'rniga — "5 daqiqa", "2 soat 10 daqiqa", "3 kun"
const ago = (d) => {
  const m = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 60000));
  if (m < 1) return 'hozirgina';
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat${m % 60 ? ` ${m % 60} daqiqa` : ''} oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
};
const MAX_FILE = 10 * 1024 * 1024;
const EXT = ['.xlsx', '.xls'];

const CSS = `
.mkr-out:hover:not(:disabled){background:${C.bgApp};border-color:${C.borderHover}}
.mkr-pri:hover:not(:disabled){background:${C.p800};border-color:${C.p800}}
.mkr-drop:hover:not(:disabled){border-color:${C.p700};background:${C.p50}}
.mkr-ib:hover{background:${C.surface2}}
.mkr-shell button:disabled{cursor:not-allowed}
.mkr-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) 300px}
@media (max-width:1100px){.mkr-grid{grid-template-columns:minmax(0,1fr)}.mkr-grid>*{border-left:none!important;border-top:1px solid ${C.border}}.mkr-grid>*:first-child{border-top:none}}
@keyframes mkspin{to{transform:rotate(360deg)}}
@keyframes mkshimmer{0%{background-position:-480px 0}100%{background-position:480px 0}}
.mkr-shim{background:linear-gradient(90deg,${C.surface2} 0,${C.border} 50%,${C.surface2} 100%);background-size:960px 100%;animation:mkshimmer 1.4s linear infinite}
`;
const btn = (kind, h = 36) => ({
  height: h, padding: '0 14px', borderRadius: 6, font: `500 ${h >= 36 ? 14 : 13}px/20px ${FONT}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
  ...(kind === 'primary' ? { border: `1px solid ${C.p700}`, background: C.p700, color: '#fff' } : { border: `1px solid ${C.borderStrong}`, background: '#fff', color: C.text }),
});
const dis = { background: C.surface2, color: C.textDisabled, borderColor: C.border };
const fileUrl = (u) => `${API_ORIGIN}${u}`;
const fileName = (u) => (u ? decodeURIComponent(u.split('/').pop()) : '');

export default function MarkerReturnedPage() {
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState(null);

  const { data: orders = [], isLoading, isError, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['marker-returned'],
    queryFn: markerAPI.getReturned,
    refetchInterval: 15000,
    select: (r) => r.data.data || [],
  });

  // Faqat API muvaffaqiyatidan keyin — kesh qayta olinadi, karta o'zi yo'qoladi
  const onDone = () => {
    qc.invalidateQueries({ queryKey: ['marker-returned'] });
    qc.invalidateQueries({ queryKey: ['marker-mine'] });
  };
  const showData = !isLoading && !isError;
  const latest = orders.length ? orders[0].returnedToMarkingAt : null; // backend desc tartibida

  return (
    <div className="mkr-shell" style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0, font: `400 14px/20px ${FONT}`, color: C.text }}>
      <style>{CSS}</style>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, font: `600 24px/32px ${FONT}`, letterSpacing: '-0.01em' }}>Qaytgan buyurtmalar</h1>
            {showData && orders.length > 0 && (
              <span className="tnum" style={{ height: 24, padding: '0 8px', borderRadius: 4, background: C.attention.bg, border: `1px solid ${C.attention.border}`, color: C.attention.text, font: `600 13px/18px ${FONT}`, display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap', flex: 'none' }}>{orders.length} ta</span>
            )}
          </div>
          <p style={{ margin: 0, color: C.text2 }}>Tekshiruvchi tomonidan qaytarilgan buyurtmalarni qayta ishlash</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, font: `400 12px/16px ${FONT}` }}>
            <span style={{ color: C.text2 }}>Oxirgi yangilanish: <span className="tnum" style={{ color: C.text, fontWeight: 500 }}>{dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}</span></span>
            <span style={{ color: C.textMuted }}>Har 15 soniyada avtomatik yangilanadi</span>
          </span>
          <button type="button" className="mkr-out" onClick={() => refetch()} disabled={isFetching} style={btn('outline')}>
            <RefreshCw size={16} aria-hidden="true" style={isFetching ? { animation: 'mkspin .9s linear infinite' } : undefined} />{isFetching ? 'Yangilanmoqda…' : 'Yangilash'}
          </button>
        </div>
      </div>

      {showData && orders.length > 0 && (
        <div role="note" style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Info size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: C.info.main }} />
          <span style={{ flex: 1, minWidth: 260, font: `400 13px/18px ${FONT}`, color: C.textBody }}>Qaytgan buyurtmalarda markirovka vaqti hisoblanmaydi. Tekshiruvchi sababini o'qing, Excel faylni tuzating va qayta yuboring — buyurtma Tekshiruv bo'limiga qaytadi.</span>
          {latest && <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.text2, whiteSpace: 'nowrap' }}>Oxirgi qaytarilgan: {format(new Date(latest), 'dd.MM.yyyy, HH:mm')}</span>}
        </div>
      )}

      {isLoading && [0, 1].map((i) => (
        <div key={i} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ height: 56, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}>
            <span style={{ width: 80, height: 12, borderRadius: 4, background: C.surface2 }} /><span className="mkr-shim" style={{ width: 200, height: 12, borderRadius: 4 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr) 300px', minHeight: 180 }}>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}><span style={{ width: '40%', height: 10, borderRadius: 4, background: C.surface2 }} /><span style={{ height: 72, borderRadius: 8, background: C.bgApp }} /></div>
            <div style={{ padding: 16 }} />
            <div style={{ padding: 16, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}><span style={{ height: 44, borderRadius: 6, background: C.surface2 }} /><span style={{ height: 40, borderRadius: 6, background: C.surface2 }} /></div>
          </div>
        </div>
      ))}

      {showData && orders.map((o) => <ReturnedCard key={o.id} order={o} onDone={onDone} onNoFile={() => setConfirm(o)} />)}

      {showData && orders.length === 0 && (
        <StateBox Icon={CircleCheck} iconBg={C.success.bg} iconFg={C.success.main} title="Qaytgan buyurtmalar yo'q" desc="Tekshiruvchi buyurtmani sizga qaytarsa, u sababi bilan shu yerda ko'rinadi." />
      )}
      {isError && (
        <StateBox role="alert" Icon={CloudOff} iconBg={C.danger.bg} iconFg={C.danger.main} title="Buyurtmalarni yuklab bo'lmadi" desc="Ma'lumotlarni olishda xatolik yuz berdi. Qayta urinib ko'ring.">
          <button type="button" className="mkr-out" style={btn('outline')} onClick={() => refetch()} disabled={isFetching}><RefreshCw size={16} aria-hidden="true" />Qayta urinish</button>
        </StateBox>
      )}

      {confirm && <NoFileDialog order={confirm} onClose={() => setConfirm(null)} onDone={onDone} />}
    </div>
  );
}

function useResubmit(order, onDone) {
  const [progress, setProgress] = useState(null);
  const mutation = useMutation({
    // Mavjud API: markerAPI.complete(id, FormData). Progress uchun axios onUploadProgress
    // mavjud bo'lsa ishlatiladi; api/index.js uni qabul qilmasa — progress ko'rsatilmaydi.
    mutationFn: (fd) => markerAPI.complete(order.id, fd, { onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)) }),
    onSuccess: (res) => {
      toast.success(`${res?.data?.message || "Buyurtma qayta yuborildi. Buyurtma checking bo'limiga o'tdi"} · № ${order.invoiceNumber}`, { duration: 6000 });
      onDone();
    },
    onError: (e) => toast.error(`№ ${order.invoiceNumber}: ${getErrorMessage(e)}`, { duration: Infinity }),
    onSettled: () => setProgress(null),
  });
  return { ...mutation, progress };
}

function ReturnedCard({ order: o, onDone, onNoFile }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileErr, setFileErr] = useState(null);
  const submit = useResubmit(o, onDone);
  const busy = submit.isPending;

  const pick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
    if (!EXT.includes(ext)) { setFile(null); setFileErr('Faqat .xlsx yoki .xls fayl yuklash mumkin'); return; }
    if (f.size > MAX_FILE) { setFile(null); setFileErr('Fayl hajmi 10 MB dan oshmasligi kerak'); return; }
    setFileErr(null); setFile(f);
  };
  const primary = () => {
    if (busy) return;
    if (!file) { inputRef.current?.click(); return; }
    const fd = new FormData();
    fd.append('markedExcel', file);
    submit.mutate(fd, { onSuccess: () => setFile(null) });
  };

  const info = [['Shartnoma', o.contractNumber, true], ['Lot', o.lotNumber, true], ['Mijoz INN', o.client?.inn], ['Picker', o.assignedPicker?.fullName]];

  return (
    <article aria-label={`Qaytgan buyurtma ${o.invoiceNumber}`} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        <span style={{ font: `500 13px/18px ${MONO}`, color: C.text2, whiteSpace: 'nowrap', flex: 'none' }}>№ {o.invoiceNumber}</span>
        <span className="mk-ellipsis" style={{ font: `600 16px/24px ${FONT}`, minWidth: 0 }}>{o.client?.orgName || '—'}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 8px', borderRadius: 4, font: `500 12px/16px ${FONT}`, background: C.attention.bg, color: C.attention.text, border: `1px solid ${C.attention.border}` }}><Undo2 size={14} aria-hidden="true" />Qaytarilgan</span>
        <span className="tnum" style={{ marginLeft: 'auto', font: `600 14px/20px ${FONT}`, whiteSpace: 'nowrap' }}>{formatSum(o.totalAmount)} so'm</span>
        {o.productsExcelUrl && (
          <a className="mkr-out" href={fileUrl(o.productsExcelUrl)} target="_blank" rel="noreferrer" style={{ ...btn('outline', 32), padding: '0 10px', textDecoration: 'none' }}>
            <FileSpreadsheet size={16} aria-hidden="true" style={{ color: C.success.main }} />Mahsulotlar Excel
          </a>
        )}
      </header>

      <div className="mkr-grid">
        <section aria-label="Qaytarish sababi" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: `600 13px/18px ${FONT}` }}><MessageSquareQuote size={16} aria-hidden="true" style={{ color: C.attention.main }} />Tekshiruvchining qaytarish sababi</span>
            {o.returnedToMarkingAt && (
              <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.text2 }}>
                {format(new Date(o.returnedToMarkingAt), 'dd.MM.yyyy, HH:mm')} · {ago(o.returnedToMarkingAt)}
              </span>
            )}
          </span>
          {o.returnReason?.trim() ? (
            <blockquote style={{ margin: 0, padding: '12px 14px', borderRadius: 8, background: C.attention.bg, border: `1px solid ${C.attention.border}`, font: `400 14px/22px ${FONT}`, color: '#431407', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 176, overflow: 'auto' }}>
              {o.returnReason}
            </blockquote>
          ) : (
            <div style={{ padding: '12px 14px', borderRadius: 8, background: C.bgApp, border: `1px dashed ${C.borderStrong}`, font: `400 13px/18px ${FONT}`, color: C.text2 }}>
              Tekshiruvchi sabab ko'rsatmagan. Aniqlik uchun Tekshiruvchi bilan bog'laning.
            </div>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, font: `400 12px/16px ${FONT}`, color: C.text2 }}>
            <UserCheck size={14} aria-hidden="true" style={{ color: C.textMuted }} />{o.checker?.fullName ? `Tekshiruvchi: ${o.checker.fullName}` : "Tekshiruvchi ma'lumoti yo'q"}
          </span>
        </section>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, borderLeft: `1px solid ${C.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '12px 20px' }}>
            {info.map(([k, v, mono]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>{k}</span>
                <span className="mk-ellipsis" style={{ font: `500 13px/18px ${mono ? MONO : FONT}`, color: v ? C.text : C.textMuted }}>{v || '—'}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, borderTop: `1px solid ${C.surface2}` }}>
            <span style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>Avval yuklangan markirovka fayli</span>
            {o.markedExcelUrl ? (
              <a href={fileUrl(o.markedExcelUrl)} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.bgApp, color: C.text, textDecoration: 'none', minWidth: 0 }}>
                <FileSpreadsheet size={16} aria-hidden="true" style={{ color: C.success.main }} />
                <span className="mk-ellipsis" style={{ flex: 1, minWidth: 0, font: `500 13px/18px ${FONT}` }}>{fileName(o.markedExcelUrl)}</span>
                <ExternalLink size={14} aria-hidden="true" style={{ color: C.text2 }} />
              </a>
            ) : <span style={{ font: `400 13px/18px ${FONT}`, color: C.textMuted }}>Oldingi yuborishda fayl yuklanmagan</span>}
          </div>
        </div>

        <div style={{ padding: 16, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8, background: '#FCFCFD' }}>
          <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={pick} hidden />
          {!file ? (
            <button type="button" className="mkr-drop" onClick={() => inputRef.current?.click()} disabled={busy} style={{ border: `1.5px dashed ${C.borderStrong}`, borderRadius: 8, padding: '10px 12px', background: '#fff', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer', font: 'inherit' }}>
              <span style={{ width: 32, height: 32, flex: 'none', borderRadius: '50%', background: C.p50, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.p700 }}><Upload size={16} aria-hidden="true" /></span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><span style={{ font: `500 13px/18px ${FONT}`, color: C.p700 }}>Tuzatilgan faylni tanlang</span><span style={{ font: `400 12px/16px ${FONT}`, color: C.textMuted }}>.xlsx yoki .xls · 10 MB gacha</span></span>
            </button>
          ) : (
            <div style={{ border: `1px solid ${C.p200}`, background: C.p50, borderRadius: 8, padding: '8px 8px 8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileSpreadsheet size={20} aria-hidden="true" style={{ color: C.success.main }} />
                <span style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}><span className="mk-ellipsis" style={{ font: `500 13px/18px ${FONT}` }}>{file.name}</span><span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.text2 }}>{(file.size / 1024).toFixed(1)} KB</span></span>
                <button type="button" className="mkr-ib" disabled={busy} onClick={() => setFile(null)} aria-label="Faylni olib tashlash" style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: 'transparent', color: C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
              </div>
              {busy && submit.progress != null && (
                <div role="progressbar" aria-valuenow={submit.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Yuklash jarayoni" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ flex: 1, height: 4, borderRadius: 999, background: C.p100, overflow: 'hidden' }}><span style={{ display: 'block', height: '100%', width: `${submit.progress}%`, background: C.p700 }} /></span>
                  <span className="tnum" style={{ font: `400 12px/16px ${FONT}`, color: C.p800, width: 32, textAlign: 'right' }}>{submit.progress}%</span>
                </div>
              )}
            </div>
          )}
          {fileErr && <span role="alert" style={{ display: 'flex', alignItems: 'center', gap: 6, font: `500 12px/16px ${FONT}`, color: C.danger.text }}><CircleAlert size={14} aria-hidden="true" />{fileErr}</span>}
          <button type="button" className="mkr-pri" onClick={primary} disabled={busy} aria-busy={busy} style={btn('primary', 40)}>
            {busy ? <LoaderCircle size={16} aria-hidden="true" style={{ animation: 'mkspin .9s linear infinite' }} /> : <Upload size={16} aria-hidden="true" />}
            {busy ? 'Yuklanmoqda…' : file ? 'Yuklash va qayta yuborish' : 'Excel faylni qayta yuklash'}
          </button>
          <button type="button" className="mkr-out" onClick={onNoFile} disabled={busy} style={{ ...btn('outline'), ...(busy ? dis : null) }}>
            <FileX size={16} aria-hidden="true" />Yuklamasdan o'tkazish
          </button>
        </div>
      </div>
    </article>
  );
}

function NoFileDialog({ order, onClose, onDone }) {
  const submit = useResubmit(order, () => { onDone(); onClose(); });
  const close = () => { if (!submit.isPending) onClose(); };
  return (
    <div onKeyDown={(e) => e.key === 'Escape' && close()} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(15,23,42,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="mkr-nf" style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 12, boxShadow: SHADOW.lg }}>
        <div style={{ padding: '20px 24px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ width: 36, height: 36, flex: 'none', borderRadius: '50%', background: C.warning.bg, color: C.warning.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileX size={20} strokeWidth={1.75} aria-hidden="true" /></span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <span id="mkr-nf" style={{ font: `600 18px/26px ${FONT}` }}>Yangi fayl yuklamasdan yuborish</span>
            <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2 }}>№ {order.invoiceNumber} · {order.client?.orgName}</span>
          </div>
          <button type="button" className="mkr-ib" aria-label="Yopish" onClick={close} style={{ width: 32, height: 32, border: 'none', borderRadius: 6, background: 'transparent', color: C.text2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 12, color: C.textBody }}>
          <span>Buyurtma yangi markirovka fayli yuklanmasdan Tekshiruv bo'limiga qayta yuboriladi.</span>
          {order.markedExcelUrl ? (
            <div style={{ background: C.warning.bg, border: `1px solid ${C.warning.border}`, borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10, font: `400 13px/18px ${FONT}`, color: '#78350F' }}>
              <TriangleAlert size={16} aria-hidden="true" style={{ color: C.warning.main, flex: 'none', marginTop: 1 }} />
              <span>Avval yuklangan <b style={{ fontWeight: 600 }}>{fileName(order.markedExcelUrl)}</b> fayli o'zgarishsiz qoladi va Tekshiruvchi aynan shu faylni qayta ko'radi.</span>
            </div>
          ) : (
            <div style={{ background: C.bgApp, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 12px', font: `400 13px/18px ${FONT}`, color: C.text2 }}>Bu buyurtmada avval yuklangan markirovka fayli yo'q.</div>
          )}
        </div>
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="mkr-out" style={btn('outline', 40)} onClick={close} disabled={submit.isPending}>Bekor qilish</button>
          <button type="button" className="mkr-pri" autoFocus style={btn('primary', 40)} disabled={submit.isPending} onClick={() => submit.mutate(new FormData())}>
            {submit.isPending ? <LoaderCircle size={16} aria-hidden="true" style={{ animation: 'mkspin .9s linear infinite' }} /> : <Send size={16} aria-hidden="true" />}
            {submit.isPending ? 'Yuborilmoqda…' : 'Yuklamasdan yuborish'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StateBox({ Icon, iconBg, iconFg, title, desc, role, children }) {
  return (
    <div role={role} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 8, padding: '56px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
      <span style={{ width: 44, height: 44, borderRadius: '50%', background: iconBg, color: iconFg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} strokeWidth={1.75} aria-hidden="true" /></span>
      <span style={{ font: `600 16px/24px ${FONT}` }}>{title}</span>
      <span style={{ font: `400 13px/18px ${FONT}`, color: C.text2, maxWidth: 420 }}>{desc}</span>
      {children && <div style={{ marginTop: 4 }}>{children}</div>}
    </div>
  );
}
