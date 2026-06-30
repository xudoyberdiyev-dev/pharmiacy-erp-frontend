import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { clientAPI, orderAPI, userAPI } from '../../api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowRight, Check, Upload, X, Search,
  Building2, Clock, User, FileSpreadsheet, ChevronDown,
  Package, Timer, Users
} from 'lucide-react';

const inp = "w-full px-3.5 py-2.5 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 focus:bg-white transition-all";

/* ── Client search dropdown ─────────────────────────────────────────────── */
function ClientSelect({ value, onChange }) {
  const [search, setSearch] = useState('');
  const [open, setOpen]   = useState(false);

  const { data } = useQuery({
    queryKey: ['clients-search', search],
    queryFn: () => clientAPI.getAll({ search, limit: 20, isActive: true }),
    select: r => r.data.data,
    enabled: open,
  });
  const { data: selected } = useQuery({
    queryKey: ['client-single', value],
    queryFn: () => clientAPI.getOne(value),
    select: r => r.data.data,
    enabled: !!value && !open,
  });
  const clients = data || [];

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all border-2 bg-gray-50 hover:bg-white ${
          open ? 'border-blue-500 bg-white shadow-sm shadow-blue-100' : 'border-transparent hover:border-gray-200'
        }`}>
        {value && selected ? (
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Building2 size={13} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{selected.orgName}</p>
              <p className="text-xs text-gray-400">INN: {selected.inn} · {selected.phone}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Building2 size={14} />
            <span className="text-sm">Klientni qidiring yoki tanlang...</span>
          </div>
        )}
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ml-2 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-2.5 border-b border-gray-50">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="INN, tashkilot nomi yoki telefon..."
                className="w-full pl-8 pr-4 py-2 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {clients.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">
                <Search size={20} className="mx-auto mb-1.5 text-gray-200" /> Klient topilmadi
              </div>
            ) : clients.map(c => (
              <button key={c.id} type="button"
                onClick={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-blue-50/60 transition-colors text-left ${value === c.id ? 'bg-blue-50' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-700">{c.orgName?.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.orgName}</p>
                  <p className="text-xs text-gray-400">INN: {c.inn} · {c.phone}</p>
                </div>
                {value === c.id && <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0"><Check size={10} className="text-white" strokeWidth={3} /></div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Digit-only time input ──────────────────────────────────────────────── */
function TimeInput({ label, value, onChange, color = 'blue' }) {
  const min = parseInt(value) || 0;
  const h = Math.floor(min / 60);
  const m = min % 60;

  const colors = {
    blue:   { bar: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 border-blue-200',   focus: 'focus:border-blue-400' },
    purple: { bar: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-200', focus: 'focus:border-purple-400' },
    amber:  { bar: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-700 border-amber-200',  focus: 'focus:border-amber-400' },
  };
  const c = colors[color];

  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    onChange(digits);
  };

  return (
    <div className="bg-gray-50 rounded-xl p-3.5 border-2 border-transparent hover:border-gray-200 focus-within:border-blue-300 focus-within:bg-white transition-all">
      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">{label} *</label>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleChange}
          placeholder="15"
          className={`flex-1 bg-white border-2 border-gray-100 rounded-xl px-3 py-2 text-2xl font-black text-gray-900 focus:outline-none focus:shadow-sm transition-all w-0 ${c.focus}`}
        />
        <span className="text-xs font-semibold text-gray-400 shrink-0">daq</span>
      </div>
      {min > 0 && (
        <>
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden mb-1.5">
            <div className={`h-full rounded-full transition-all duration-500 ${c.bar}`} style={{ width: `${Math.min((min / 120) * 100, 100)}%` }} />
          </div>
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold border rounded-lg px-2 py-0.5 ${c.badge}`}>
            <Timer size={10} />
            {h > 0 ? `${h} soat${m > 0 ? ` ${m} daq` : ''}` : `${m} daqiqa`}
          </span>
        </>
      )}
    </div>
  );
}

/* ── Worker select ──────────────────────────────────────────────────────── */
function WorkerSelect({ role, value, onChange, label }) {
  const { data } = useQuery({
    queryKey: ['workers', role],
    queryFn: () => userAPI.getAll({ role }),
    select: r => r.data.data?.filter(u => u.isActive) || [],
  });
  return (
    <div>
      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
        {label} <span className="text-gray-300 normal-case font-medium">(ixtiyoriy)</span>
      </label>
      <select value={value} onChange={e => onChange(e.target.value)} className={inp}>
        <option value="">— Tanlanmagan —</option>
        {(data || []).map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
      </select>
    </div>
  );
}

/* ── Duration summary ───────────────────────────────────────────────────── */
function DurationSummary({ pm, mm, cm }) {
  const stages = [
    { label: 'Picking',  min: pm, color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200' },
    { label: 'Marking',  min: mm, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Checking', min: cm, color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  ];
  const total = pm + mm + cm;
  const th = Math.floor(total / 60), tm = total % 60;
  const fmt = (n) => {
    const h = Math.floor(n / 60), m = n % 60;
    if (n === 0) return '—';
    return h > 0 ? `${h}:${String(m).padStart(2,'0')} soat` : `${m} daq`;
  };
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5 flex items-center gap-2 flex-wrap">
      {stages.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold ${s.bg} ${s.border} ${s.color}`}>
            <Timer size={11} /> {s.label}: {fmt(parseInt(s.min) || 0)}
          </div>
          {i < stages.length - 1 && <span className="text-gray-300 text-xs font-bold">→</span>}
        </div>
      ))}
      {total > 0 && (
        <div className="ml-auto text-xs font-black text-gray-500 bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg">
          Jami: {th > 0 ? `${th}:${String(tm).padStart(2,'0')} soat` : `${tm} daq`}
        </div>
      )}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────── */
export default function OperatorCreateOrder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [excel, setExcel] = useState(null);
  const [form, setForm] = useState({
    clientId: '', contractNumber: '', invoiceNumber: '',
    lotNumber: '', totalAmount: '',
    pickingMinutes: '', markingMinutes: '', checkingMinutes: '',
    assignedPickerId: '', markerId: '', checkerId: '',
  });
  const set = k => v => setForm(p => ({ ...p, [k]: typeof v === 'object' && v?.target ? v.target.value : v }));

  const pm = parseInt(form.pickingMinutes) || 0;
  const mm = parseInt(form.markingMinutes) || 0;
  const cm = parseInt(form.checkingMinutes) || 0;

  const validateStep1 = () => {
    if (!form.clientId) return 'Klient tanlanmagan';
    if (!form.contractNumber.trim()) return 'Shartnoma raqami kiritilmagan';
    if (!form.invoiceNumber.trim()) return 'Faktura raqami kiritilmagan';
    if (!form.lotNumber.trim()) return 'Lot raqami kiritilmagan';
    if (!form.totalAmount || parseFloat(form.totalAmount) < 0) return 'Narx summasi kiritilmagan';
    if (!excel) return 'Excel fayl yuklash shart';
    return null;
  };
  const validateStep2 = () => {
    if (pm < 1) return 'Picking vaqti kiritilmagan';
    if (mm < 1) return 'Marking vaqti kiritilmagan';
    if (cm < 1) return 'Checking vaqti kiritilmagan';
    return null;
  };

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append('productsExcel', excel);
      return orderAPI.create(fd);
    },
    onSuccess: () => { toast.success('Order yaratildi!'); navigate('/operator/orders'); },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const handleAmountChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setForm(p => ({ ...p, totalAmount: digits }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => step === 1 ? navigate('/operator/orders') : setStep(1)}
          className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="text-lg font-black text-gray-900 tracking-tight">Yangi order yaratish</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {step === 1 ? 'Asosiy ma\'lumotlarni kiriting' : 'Vaqt va xodimlarni belgilang'}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center">
        {[1, 2].map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                step > s ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-sm'
                  : step === s ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s ? <Check size={14} strokeWidth={3} /> : s}
              </div>
              <p className={`text-xs font-bold hidden sm:block ${step === s ? 'text-blue-700' : 'text-gray-400'}`}>
                {s === 1 ? 'Asosiy ma\'lumotlar' : 'Vaqt va biriktirish'}
              </p>
            </div>
            {i === 0 && (
              <div className={`flex-1 h-0.5 mx-3 rounded-full transition-all duration-500 ${step > 1 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">

            {/* Klient */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Klient *</label>
              <ClientSelect value={form.clientId} onChange={set('clientId')} />
            </div>

            {/* Hujjat raqamlari */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Hujjat raqamlari</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { k: 'contractNumber', label: 'Shartnoma #', ph: 'SH-2024-001' },
                  { k: 'invoiceNumber',  label: 'Faktura #',   ph: 'FK-001' },
                  { k: 'lotNumber',      label: 'Lot #',       ph: 'LOT-001' },
                ].map(({ k, label, ph }) => (
                  <div key={k}>
                    <label className="block text-[11px] text-gray-400 mb-1">{label} *</label>
                    <input value={form[k]} onChange={set(k)} placeholder={ph} className={inp} />
                  </div>
                ))}
              </div>
            </div>

            {/* Summa */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Narx summasi *</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.totalAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full pl-4 pr-14 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-lg font-black focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">so'm</span>
              </div>
              {form.totalAmount && (
                <p className="mt-1 text-xs font-semibold text-blue-600 pl-1">
                  {parseFloat(form.totalAmount).toLocaleString()} so'm
                </p>
              )}
            </div>

            {/* Excel */}
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">Mahsulotlar ro'yxati *</label>
              {excel ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <FileSpreadsheet size={18} className="text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-green-800 truncate">{excel.name}</p>
                    <p className="text-xs text-green-500">{(excel.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setExcel(null)} className="w-7 h-7 rounded-lg bg-green-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-green-600 transition-colors">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2.5 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <Upload size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-500 group-hover:text-blue-600 transition-colors">Excel fayl yuklash</p>
                    <p className="text-xs text-gray-400 mt-0.5">.xlsx yoki .xls formatda</p>
                  </div>
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setExcel(e.target.files[0])} />
                </label>
              )}
            </div>
          </div>

          <button
            onClick={() => { const e = validateStep1(); if (e) { toast.error(e); return; } setStep(2); }}
            className="w-full py-3 rounded-xl font-bold text-white text-sm
              bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
              shadow-md shadow-blue-200 hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Keyingisi <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="space-y-4">

          {/* Vaqtlar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock size={14} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Bosqich vaqtlari</h3>
                <p className="text-xs text-gray-400">Har bosqich uchun muddat (daqiqada)</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <TimeInput label="Picking"  value={form.pickingMinutes}  onChange={set('pickingMinutes')}  color="blue" />
              <TimeInput label="Marking"  value={form.markingMinutes}  onChange={set('markingMinutes')}  color="purple" />
              <TimeInput label="Checking" value={form.checkingMinutes} onChange={set('checkingMinutes')} color="amber" />
            </div>

            {(pm > 0 || mm > 0 || cm > 0) && (
              <DurationSummary pm={pm} mm={mm} cm={cm} />
            )}
          </div>

          {/* Xodimlar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users size={14} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Xodim biriktirish</h3>
                <p className="text-xs text-gray-400">Ixtiyoriy — oldindan biriktirish</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <WorkerSelect role="PICKER"  value={form.assignedPickerId} onChange={set('assignedPickerId')} label="Picker" />
              <WorkerSelect role="MARKER"  value={form.markerId}         onChange={set('markerId')}         label="Marker" />
              <WorkerSelect role="CHECKER" value={form.checkerId}        onChange={set('checkerId')}        label="Checker" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setStep(1)}
              className="py-3 rounded-xl font-bold border-2 border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
              <ArrowLeft size={15} /> Ortga
            </button>
            <button
              onClick={() => { const e = validateStep2(); if (e) { toast.error(e); return; } mutation.mutate(); }}
              disabled={mutation.isPending}
              className="py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200 hover:shadow-lg
                transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {mutation.isPending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yaratilmoqda...</>
                : <><Check size={15} strokeWidth={2.5} /> Order yaratish</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
