import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI, userAPI, clientAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import ClientSelect from '../../components/shared/ClientSelect';
import { formatSum } from '../../lib/format';
import {
  ArrowLeft, ArrowRight, Check, Upload, X, FileSpreadsheet, CheckCircle2,
  AlertTriangle, Eye, RefreshCw, Trash2, ChevronDown, Loader2,
} from 'lucide-react';
import { COLOR } from './design/tokens';
import { invalidateOperatorData } from './useOperatorData';
import { StatusBadge, Panel } from './design/components';
import { fmtMinutes } from './format';

// ─────────────────────────────────────────────────────────────────────────
// Operator Panel — Yangi buyurtma (Phase 05 of the redesign)
//
// Source: design-import/"Operator Panel - Create Order.dc.html". Same
// two-step wizard and validation rules as before; the surface, the review
// block ("Tekshirish") and the success/error panels are new.
//
// Durations are entered in MINUTES ("daqiqa"), exactly as the backend
// stores them (pickingDuration / markingDuration / checkingDuration) and
// as this form always worked. The design canvas drew these fields in
// "soat" (hours); that was overruled by the product owner — a 20 or
// 45-minute window is a normal case, and minutes need no conversion.
//
// Layout: the form fills the workspace like the Dashboard does (the
// design's 840px centred column is dropped by request); wide screens get
// multi-column field grids instead of stretched single inputs.
// ─────────────────────────────────────────────────────────────────────────

const inputCls = "h-10 px-3 rounded-lg text-sm outline-none transition-colors";
const inputStyle = (error) => ({
  border: `1px solid ${error ? COLOR.danger : COLOR.borderStrong}`,
  color: COLOR.textPrimary,
  background: COLOR.surface,
  boxShadow: error ? `0 0 0 3px rgba(220,38,38,0.12)` : 'none',
});

function Label({ children, required, optional }) {
  return (
    <span className="text-[13px] font-medium flex items-center gap-1.5" style={{ color: '#334155' }}>
      {children}
      {required && <span style={{ color: COLOR.danger }}>*</span>}
      {optional && <span className="text-xs font-normal" style={{ color: COLOR.textMuted }}>(ixtiyoriy)</span>}
    </span>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: '#B91C1C' }}>
      <AlertTriangle size={13} /> {children}
    </span>
  );
}

function DurationInput({ label, value, onChange, error }) {
  const mins = parseInt(value, 10);
  return (
    <label className="flex flex-col gap-1.5">
      <Label required>{label}</Label>
      <span className="flex items-center h-10 rounded-lg overflow-hidden" style={inputStyle(error)}>
        <input
          aria-label={label}
          inputMode="numeric"
          value={value}
          onChange={e => onChange(e.target.value.replace(/D/g, ''))}
          placeholder="Muddatni kiriting"
          className="flex-1 min-w-0 h-full border-0 outline-none px-3 text-sm font-semibold text-right"
          style={{ fontVariantNumeric: 'tabular-nums', color: COLOR.textPrimary }}
        />
        <span className="px-3 h-full flex items-center text-xs font-medium shrink-0" style={{ borderLeft: `1px solid ${COLOR.border}`, background: COLOR.subtleSurface, color: COLOR.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>
          daqiqa
        </span>
      </span>
      {mins >= 60 && !error && <span className="text-xs" style={{ color: COLOR.textMuted }}>= {fmtMinutes(mins)}</span>}
      <FieldError>{error}</FieldError>
    </label>
  );
}

function WorkerSelect({ role, value, onChange, label }) {
  const { data } = useQuery({
    queryKey: ['workers', role],
    queryFn: () => userAPI.getAll({ role }),
    select: r => r.data.data?.filter(u => u.isActive) || [],
  });
  return (
    <label className="flex flex-col gap-1.5">
      <Label optional>{label}</Label>
      <div className="relative">
        <select
          value={value} onChange={e => onChange(e.target.value)}
          className="appearance-none w-full h-10 pl-3 pr-8 rounded-lg text-sm"
          style={{ border: `1px solid ${COLOR.borderStrong}`, background: COLOR.surface, color: value ? COLOR.textPrimary : COLOR.textMuted }}
        >
          <option value="">{label} tanlang</option>
          {(data || []).map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLOR.textTertiary }} />
      </div>
    </label>
  );
}

function StepIndicator({ step }) {
  const items = [
    { n: 1, title: "Buyurtma ma'lumotlari", sub: 'Asosiy ma\'lumotlar' },
    { n: 2, title: 'Jarayon sozlamalari', sub: "Muddatlar va mas'ullar" },
  ];
  return (
    <Panel className="!rounded-xl">
      {/* Mobile: one compact card — title, "1 / 2", two progress bars */}
      <div className="sm:hidden px-4 py-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-[13px] font-semibold" style={{ color: COLOR.textPrimary }}>{items[step - 1].title}</span>
          <span className="text-xs font-medium" style={{ fontFamily: "'JetBrains Mono', monospace", color: COLOR.textTertiary }}>{step} / 2</span>
        </div>
        <div className="flex gap-1.5">
          <span className="flex-1 h-1 rounded-sm" style={{ background: COLOR.primary }} />
          <span className="flex-1 h-1 rounded-sm" style={{ background: step > 1 ? COLOR.primary : COLOR.border }} />
        </div>
        <span className="text-xs inline-flex items-center gap-1.5" style={{ color: step > 1 ? COLOR.success : COLOR.textTertiary }}>
          {step > 1 ? <><Check size={14} /> 1-qadam yakunlandi</> : items[0].sub}
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-4 px-6 py-5">
        {items.map((it, i) => {
          const done = step > it.n, active = step === it.n;
          return (
            <div key={it.n} className="contents">
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                  style={done
                    ? { background: COLOR.successSoft, border: `1px solid ${COLOR.successBorder}`, color: COLOR.success }
                    : active ? { background: COLOR.primary, color: '#fff' } : { background: COLOR.mutedSurface, border: `1px solid ${COLOR.border}`, color: COLOR.textMuted }}
                >
                  {done ? <Check size={18} /> : it.n}
                </span>
                <span className="flex flex-col gap-px">
                  <span className="text-sm font-semibold whitespace-nowrap" style={{ color: active ? COLOR.primaryHover : done ? COLOR.textPrimary : COLOR.textMuted }}>{it.title}</span>
                  <span className="text-xs whitespace-nowrap" style={{ color: done ? COLOR.success : active ? COLOR.textTertiary : COLOR.textDisabled }}>{done ? 'Yakunlandi' : it.sub}</span>
                </span>
              </div>
              {i === 0 && <div className="flex-1 h-0.5 rounded-full min-w-6" style={{ background: step > 1 ? COLOR.primary : COLOR.border }} />}
            </div>
          );
        })}
        <span className="ml-auto text-xs font-medium shrink-0" style={{ fontFamily: "'JetBrains Mono', monospace", color: COLOR.textTertiary }}>{step} / 2</span>
      </div>
    </Panel>
  );
}

export default function OperatorCreateOrder() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [excel, setExcel] = useState(null);
  const [errors, setErrors] = useState({});
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [created, setCreated] = useState(null);

  const [form, setForm] = useState({
    clientId: '', contractNumber: '', invoiceNumber: '', lotNumber: '', totalAmount: '',
    pickingMinutes: '', markingMinutes: '', checkingMinutes: '',
    assignedPickerId: '', markerId: '', checkerId: '',
  });
  const set = k => v => setForm(p => ({ ...p, [k]: typeof v === 'object' && v?.target ? v.target.value : v }));

  const hasStep1Data = !!(form.clientId || form.contractNumber || form.invoiceNumber || form.lotNumber || form.totalAmount || excel);

  // Same query key ClientSelect itself uses internally — React Query
  // dedupes this against its request, so resolving the org name for the
  // review/success panels costs nothing extra once a client is picked.
  const { data: selectedClient } = useQuery({
    queryKey: ['client-single', form.clientId],
    queryFn: () => clientAPI.getOne(form.clientId),
    select: r => r.data.data,
    enabled: !!form.clientId,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('clientId', form.clientId);
      fd.append('contractNumber', form.contractNumber);
      fd.append('invoiceNumber', form.invoiceNumber);
      if (form.lotNumber) fd.append('lotNumber', form.lotNumber);
      fd.append('totalAmount', form.totalAmount);
      fd.append('pickingMinutes', String(parseInt(form.pickingMinutes, 10)));
      fd.append('markingMinutes', String(parseInt(form.markingMinutes, 10)));
      fd.append('checkingMinutes', String(parseInt(form.checkingMinutes, 10)));
      if (form.assignedPickerId) fd.append('assignedPickerId', form.assignedPickerId);
      if (form.markerId) fd.append('markerId', form.markerId);
      if (form.checkerId) fd.append('checkerId', form.checkerId);
      fd.append('productsExcel', excel);
      return orderAPI.create(fd);
    },
    onSuccess: (res) => {
      invalidateOperatorData(qc);
      setSubmitError(null);
      setCreated(res.data?.data || { invoiceNumber: form.invoiceNumber, client: { orgName: selectedClient?.orgName }, status: 'NEW' });
    },
    onError: (e) => setSubmitError(getErrorMessage(e)),
  });

  const validateStep1 = () => {
    const e = {};
    if (!form.clientId) e.clientId = 'Mijozni tanlash majburiy.';
    if (!form.contractNumber.trim()) e.contractNumber = 'Shartnoma raqamini kiriting.';
    if (!form.invoiceNumber.trim()) e.invoiceNumber = 'Faktura raqamini kiriting.';
    if (!form.totalAmount || parseFloat(form.totalAmount) <= 0) e.totalAmount = "Summani to'g'ri kiriting.";
    if (!excel) e.excel = 'Excel fayl yuklash majburiy.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!(parseInt(form.pickingMinutes, 10) > 0)) e.pickingMinutes = 'Muddat 0 dan katta bo\'lishi kerak.';
    if (!(parseInt(form.markingMinutes, 10) > 0)) e.markingMinutes = 'Muddat 0 dan katta bo\'lishi kerak.';
    if (!(parseInt(form.checkingMinutes, 10) > 0)) e.checkingMinutes = 'Muddat 0 dan katta bo\'lishi kerak.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAmountChange = (e) => {
    const cleaned = e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
    setForm(p => ({ ...p, totalAmount: cleaned }));
  };

  const requestLeave = () => hasStep1Data || step === 2 ? setLeaveConfirm(true) : navigate('/operator/orders');
  const confirmLeave = () => navigate('/operator/orders');

  const resetAll = () => {
    setStep(1); setExcel(null); setErrors({}); setSubmitError(null); setCreated(null);
    setForm({ clientId: '', contractNumber: '', invoiceNumber: '', lotNumber: '', totalAmount: '', pickingMinutes: '', markingMinutes: '', checkingMinutes: '', assignedPickerId: '', markerId: '', checkerId: '' });
  };

  // ── Success panel (replaces the wizard) ──────────────────────────────
  if (created) {
    return (
      <div className="w-full">
        <Panel className="!border-[#BBF7D0]">
          <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-x-10 gap-y-5 items-start">
            <div className="flex gap-3 items-start xl:col-start-1 xl:row-start-1">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR.successSoft, color: COLOR.success }}>
                <CheckCircle2 size={20} />
              </span>
              <div>
                <p className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>Buyurtma muvaffaqiyatli yaratildi</p>
                <p className="text-[13px] mt-1" style={{ color: COLOR.textSecondary }}>Buyurtma tizimga qo'shildi va keyingi jarayon uchun tayyor.</p>
              </div>
            </div>
            <div className="rounded-[10px] p-3.5 flex flex-col gap-2.5 xl:col-start-2 xl:row-start-1 xl:row-span-2" style={{ border: `1px solid ${COLOR.border}`, background: COLOR.subtleSurface }}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs" style={{ color: COLOR.textTertiary }}>Buyurtma</span>
                <span className="text-[13px] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{created.invoiceNumber}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs" style={{ color: COLOR.textTertiary }}>Mijoz</span>
                <span className="text-[13px] font-medium">{created.client?.orgName || '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs" style={{ color: COLOR.textTertiary }}>Holat</span>
                <StatusBadge status={created.status || 'NEW'} order={created} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center xl:col-start-1 xl:row-start-2">
              {created.id && (
                <button onClick={() => navigate(`/operator/orders/${created.id}`)} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white" style={{ background: COLOR.primary }}>
                  <Eye size={18} /> Buyurtmani ko'rish
                </button>
              )}
              <button onClick={() => navigate('/operator/orders')} className="h-10 px-4 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>
                Buyurtmalar ro'yxatiga qaytish
              </button>
              <button onClick={resetAll} className="h-10 px-2 text-[13px] font-semibold" style={{ color: COLOR.primary }}>
                Yana buyurtma yaratish
              </button>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-3">
        <button onClick={requestLeave} className="inline-flex items-center gap-1.5 text-[13px] font-semibold w-fit" style={{ color: COLOR.primary }}>
          <ArrowLeft size={16} /> Buyurtmalarga qaytish
        </button>
        <div className="flex flex-col gap-1.5">
          <div className="text-[11px] font-semibold tracking-widest" style={{ color: COLOR.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>OPERATOR WORKSPACE</div>
          <h1 className="text-[30px] font-bold leading-tight" style={{ letterSpacing: '-0.025em', color: COLOR.textPrimary }}>Yangi buyurtma</h1>
          <p className="text-sm" style={{ color: COLOR.textSecondary }}>Buyurtma ma'lumotlarini kiriting va bajarilish jarayonini sozlang.</p>
        </div>
      </div>

      <StepIndicator step={step} />

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <>
          <Panel>
            <div className="px-6 py-5" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
              <p className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>Buyurtma ma'lumotlari</p>
              <p className="text-[13px] mt-1" style={{ color: COLOR.textTertiary }}>Buyurtma va hujjatlar haqidagi asosiy ma'lumotlarni kiriting.</p>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Label required>Mijoz</Label>
                <ClientSelect value={form.clientId} onChange={set('clientId')} />
                <FieldError>{errors.clientId}</FieldError>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <label className="flex flex-col gap-1.5">
                  <Label required>Shartnoma raqami</Label>
                  <input value={form.contractNumber} onChange={set('contractNumber')} placeholder="Masalan: SH-2026-0048" className={inputCls} style={{ ...inputStyle(errors.contractNumber), fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }} />
                  <FieldError>{errors.contractNumber}</FieldError>
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label required>Faktura raqami</Label>
                  <input value={form.invoiceNumber} onChange={set('invoiceNumber')} placeholder="Masalan: INV-2026-0154" className={inputCls} style={{ ...inputStyle(errors.invoiceNumber), fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }} />
                  <FieldError>{errors.invoiceNumber}</FieldError>
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label>Lot raqami</Label>
                  <input value={form.lotNumber} onChange={set('lotNumber')} placeholder="Lot raqamini kiriting" className={inputCls} style={{ ...inputStyle(false), fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <Label required>Summa</Label>
                  <span className="flex items-center h-10 rounded-lg overflow-hidden" style={inputStyle(errors.totalAmount)}>
                    <input value={form.totalAmount} onChange={handleAmountChange} placeholder="0" inputMode="decimal" className="flex-1 min-w-0 h-full border-0 outline-none px-3 text-sm font-semibold text-right" style={{ fontVariantNumeric: 'tabular-nums', color: COLOR.textPrimary }} />
                    <span className="px-3 h-full flex items-center text-xs font-medium shrink-0" style={{ borderLeft: `1px solid ${COLOR.border}`, background: COLOR.subtleSurface, color: COLOR.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>UZS</span>
                  </span>
                  <FieldError>{errors.totalAmount}</FieldError>
                  {form.totalAmount && !errors.totalAmount && <span className="text-xs" style={{ color: COLOR.textMuted }}>{formatSum(parseFloat(form.totalAmount))} so'm</span>}
                </label>
              </div>

              <div className="h-px" style={{ background: COLOR.borderSubtle }} />

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label>Excel fayl</Label>
                  <span className="px-1.5 py-0.5 rounded-md text-[11px] font-semibold" style={{ background: COLOR.dangerSoft, border: `1px solid ${COLOR.dangerBorder}`, color: '#B91C1C' }}>Majburiy</span>
                </div>
                {excel ? (
                  <div className="flex items-center gap-3 p-3.5 rounded-[10px]" style={{ border: `1px solid ${COLOR.successBorder}`, background: COLOR.successSoft }}>
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR.surface, border: `1px solid ${COLOR.successBorder}`, color: COLOR.success }}>
                      <FileSpreadsheet size={20} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: COLOR.textPrimary }}>{excel.name}</p>
                      <p className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: COLOR.success }}><CheckCircle2 size={13} /> Yuklandi · {(excel.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button onClick={() => setExcel(null)} aria-label="Faylni o'chirish" className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ border: `1px solid ${COLOR.successBorder}`, color: COLOR.textSecondary }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 py-6 rounded-[10px] cursor-pointer transition-colors" style={{ border: `1px dashed ${errors.excel ? COLOR.danger : COLOR.borderStrong}`, background: COLOR.subtleSurface }}>
                    <Upload size={22} style={{ color: COLOR.textTertiary }} />
                    <span className="text-xs" style={{ color: COLOR.textTertiary }}>.xlsx yoki .xls formatda</span>
                    <span className="h-9 px-3.5 rounded-lg text-[13px] font-semibold flex items-center" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>Fayl tanlash</span>
                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setExcel(e.target.files[0])} />
                  </label>
                )}
                <FieldError>{errors.excel}</FieldError>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4" style={{ borderTop: `1px solid ${COLOR.border}`, background: COLOR.subtleSurface }}>
              <button onClick={requestLeave} className="h-10 px-4 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>
                Bekor qilish
              </button>
              <button
                onClick={() => validateStep1() && setStep(2)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white"
                style={{ background: COLOR.primary }}
              >
                Davom etish <ArrowRight size={18} />
              </button>
            </div>
          </Panel>
        </>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <>
          <Panel>
            <div className="px-5 py-4 flex flex-col gap-1" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
              <p className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>Jarayon sozlamalari</p>
              <p className="text-[13px]" style={{ color: COLOR.textTertiary }}>Buyurtma bosqichlari uchun muddat va mas'ul xodimlarni belgilang.</p>
            </div>
            <div className="p-5 flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DurationInput label="Terish muddati" value={form.pickingMinutes} onChange={set('pickingMinutes')} error={errors.pickingMinutes} />
                <DurationInput label="Markirovka muddati" value={form.markingMinutes} onChange={set('markingMinutes')} error={errors.markingMinutes} />
                <DurationInput label="Tekshirish muddati" value={form.checkingMinutes} onChange={set('checkingMinutes')} error={errors.checkingMinutes} />
              </div>
              <div className="h-px" style={{ background: COLOR.borderSubtle }} />
              <div className="flex flex-col gap-3.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-semibold" style={{ color: COLOR.textPrimary }}>Mas'ullar</span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: COLOR.mutedSurface, border: `1px solid ${COLOR.border}`, color: COLOR.textSecondary }}>Ixtiyoriy</span>
                </div>
                <p className="text-[13px]" style={{ color: COLOR.textTertiary }}>Har bir bosqich uchun mas'ul xodimni tanlang. Bu maydonlar ixtiyoriy.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <WorkerSelect role="PICKER" value={form.assignedPickerId} onChange={set('assignedPickerId')} label="Picker" />
                  <WorkerSelect role="MARKER" value={form.markerId} onChange={set('markerId')} label="Marker" />
                  <WorkerSelect role="CHECKER" value={form.checkerId} onChange={set('checkerId')} label="Checker" />
                </div>
              </div>
            </div>
          </Panel>

          {/* ── Review ── */}
          <Panel>
            <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
              <Eye size={18} style={{ color: COLOR.textTertiary }} />
              <span className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>Tekshirish</span>
            </div>
            <div className="px-5 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8">
              {[
                ['Mijoz', selectedClient?.orgName || '—'],
                ['Shartnoma raqami', form.contractNumber || '—', true],
                ['Faktura raqami', form.invoiceNumber || '—', true],
                ['Lot raqami', form.lotNumber || '—', true],
                ['Summa', <>{formatSum(parseFloat(form.totalAmount) || 0)} <span style={{ color: COLOR.textTertiary, fontSize: 12 }}>UZS</span></>],
                ['Excel fayl', excel?.name || '—'],
                ['Terish muddati', form.pickingMinutes ? `${form.pickingMinutes} daqiqa${parseInt(form.pickingMinutes, 10) >= 60 ? ` (${fmtMinutes(form.pickingMinutes)})` : ''}` : '—'],
                ['Markirovka muddati', form.markingMinutes ? `${form.markingMinutes} daqiqa${parseInt(form.markingMinutes, 10) >= 60 ? ` (${fmtMinutes(form.markingMinutes)})` : ''}` : '—'],
                ['Tekshirish muddati', form.checkingMinutes ? `${form.checkingMinutes} daqiqa${parseInt(form.checkingMinutes, 10) >= 60 ? ` (${fmtMinutes(form.checkingMinutes)})` : ''}` : '—'],
              ].map(([label, value, mono], i) => (
                <div key={i} className="flex flex-col gap-1 py-3" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
                  <span className="text-xs" style={{ color: COLOR.textTertiary }}>{label}</span>
                  <span className="text-sm font-medium" style={{ fontFamily: mono ? "'JetBrains Mono', monospace" : undefined, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                </div>
              ))}
              <div className="flex flex-col gap-1 py-3">
                <span className="text-xs" style={{ color: COLOR.textTertiary }}>Mas'ullar</span>
                <span className="text-sm font-medium">
                  {[form.assignedPickerId, form.markerId, form.checkerId].filter(Boolean).length === 0
                    ? <span style={{ color: COLOR.textMuted }}>Belgilanmagan</span>
                    : `${[form.assignedPickerId, form.markerId, form.checkerId].filter(Boolean).length} ta belgilangan`}
                </span>
              </div>
            </div>
          </Panel>

          {submitError && (
            <Panel className="!border-[#FECACA]">
              <div className="p-5 flex gap-3 items-start">
                <AlertTriangle size={18} style={{ color: '#B91C1C' }} className="shrink-0 mt-0.5" />
                <div className="flex-1 flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: COLOR.textPrimary }}>Buyurtmani yaratishda xatolik yuz berdi</p>
                    <p className="text-[13px] mt-1" style={{ color: COLOR.textSecondary }}>{submitError} Kiritilgan ma'lumotlar saqlanib turadi.</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => mutation.mutate()} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>
                      <RefreshCw size={14} /> Qayta urinish
                    </button>
                    <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-semibold" style={{ color: COLOR.textSecondary }}>
                      <ArrowLeft size={14} /> Ortga
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>
              <ArrowLeft size={18} /> Ortga
            </button>
            <div className="flex gap-2">
              <button onClick={requestLeave} className="h-10 px-3 text-sm font-semibold" style={{ color: COLOR.textSecondary }}>Bekor qilish</button>
              <button
                onClick={() => validateStep2() && mutation.mutate()}
                disabled={mutation.isPending}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-70"
                style={{ background: COLOR.primary }}
              >
                {mutation.isPending ? <><Loader2 size={18} className="animate-spin" /> Yaratilmoqda...</> : <><Check size={18} /> Buyurtma yaratish</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Leave confirmation ── */}
      {leaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.40)' }} onClick={() => setLeaveConfirm(false)}>
          <div
            role="dialog" aria-modal="true" aria-label="Buyurtma yaratishni bekor qilasizmi?"
            className="w-full max-w-[420px] rounded-2xl p-6 flex flex-col gap-5"
            style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, boxShadow: COLOR.shadowModal }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex gap-3 items-start">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR.warningSoft, color: COLOR.warning }}>
                <AlertTriangle size={20} />
              </span>
              <div className="flex-1">
                <p className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>Buyurtma yaratishni bekor qilasizmi?</p>
                <p className="text-[13px] mt-1.5" style={{ color: COLOR.textSecondary }}>Kiritilgan ma'lumotlar saqlanmaydi.</p>
              </div>
              <button aria-label="Yopish" onClick={() => setLeaveConfirm(false)} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ border: `1px solid ${COLOR.border}`, color: COLOR.textSecondary }}>
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setLeaveConfirm(false)} className="h-10 px-4 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>
                Davom etish
              </button>
              <button onClick={confirmLeave} className="h-10 px-4 rounded-lg text-sm font-semibold text-white" style={{ background: COLOR.danger }}>
                Bekor qilish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
