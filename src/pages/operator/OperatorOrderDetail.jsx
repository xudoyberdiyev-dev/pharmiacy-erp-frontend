import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI, userAPI, clientAPI } from '../../api';
import { FILE_BASE_URL } from '../../api/axios';
import ClientSelect from '../../components/shared/ClientSelect';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { formatSum } from '../../lib/format';
import {
  ArrowLeft, Pencil, X, Check, Save, Upload, FileSpreadsheet, Clock, User,
  AlertTriangle, XCircle, Lock, Eye, CheckCircle2, ChevronDown, Loader2,
  RefreshCw, FileQuestion, ShieldCheck, Plus, Package, Tag,
} from 'lucide-react';
import { COLOR } from './design/tokens';
import { invalidateOperatorData, useCancelOrder } from './useOperatorData';
import { fmtMinutes as fmtHM } from './format';
import { StatusBadge, Skel, Panel, PanelHeader, EmptyState, ErrorState } from './design/components';

// ─────────────────────────────────────────────────────────────────────────
// Operator Panel — Buyurtma tafsilotlari (Phase 06 of the redesign)
//
// Source: design-import/"Operator Panel - Order Detail.dc.html". Same
// permission rules as before (edit/cancel only on the operator's own Yangi
// order). Not-found is a page-local state here (per the earlier agreed
// decision) rather than the shared NotFoundState.jsx used by 4 other
// panels, so this page's look never drifts their "not found" screen.
// ─────────────────────────────────────────────────────────────────────────

const STAGES = [
  { key: 'PICKING', label: 'Terilmoqda', deadlineKey: 'pickingDeadline', doneKey: 'pickingDoneAt', durationKey: 'pickingDuration' },
  { key: 'MARKING', label: 'Markirovka', deadlineKey: 'markingDeadline', doneKey: 'markingDoneAt', durationKey: 'markingDuration' },
  { key: 'CHECKING', label: 'Tekshirilmoqda', deadlineKey: 'checkingDeadline', doneKey: 'checkingDoneAt', durationKey: 'checkingDuration' },
  { key: 'LOADING', label: 'Yuklanmoqda' },
  { key: 'IN_TRANSIT', label: "Yo'lda" },
  { key: 'DELIVERED', label: 'Yetkazildi' },
];
const STAGE_KEYS = STAGES.map(s => s.key);

const inputCls = "h-10 px-3 rounded-lg text-sm outline-none";
const inputStyle = { border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface };
const cardLabel = { fontSize: 12, color: COLOR.textTertiary };

function InfoRow({ label, children, mono }) {
  return (
    <div className="flex flex-col gap-1 py-3" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
      <span style={cardLabel}>{label}</span>
      <span className="text-sm font-medium" style={{ fontFamily: mono ? "'JetBrains Mono', monospace" : undefined, color: COLOR.textPrimary, fontVariantNumeric: 'tabular-nums' }}>{children}</span>
    </div>
  );
}

// ── Process timeline (6 stages) ───────────────────────────────────────
function ProcessTimeline({ order }) {
  const currentIdx = order.status === 'DELIVERED' ? STAGE_KEYS.length
    : order.status === 'CANCELLED' || order.status === 'RETURNED' ? -2
    : STAGE_KEYS.indexOf(order.status);
  const now = new Date();

  return (
    <Panel>
      <PanelHeader title="Jarayon va muddatlar" description="Buyurtma bosqichlari, belgilangan muddatlar va joriy holat." />
      <div className="pt-6 pb-5 px-5 overflow-x-auto">
        <div className="grid gap-0 relative" style={{ minWidth: 820, gridTemplateColumns: 'repeat(6, minmax(0,1fr))' }}>
          <div className="absolute left-0 right-0 h-0.5 rounded-full" style={{ top: 15, background: COLOR.borderSubtle }} />
          <div className="absolute left-0 h-0.5 rounded-full transition-all" style={{ top: 15, width: `${Math.max(0, Math.min(currentIdx, 6)) / 6 * 100}%`, background: COLOR.success }} />
          {STAGES.map((stage, i) => {
            const done = order.status === 'DELIVERED' || (order[stage.doneKey]) || (currentIdx >= 0 && i < currentIdx);
            const isCurrent = currentIdx === i;
            const cancelled = currentIdx === -2 && !done;
            const deadline = stage.deadlineKey && order[stage.deadlineKey] ? new Date(order[stage.deadlineKey]) : null;
            const doneAt = stage.doneKey && order[stage.doneKey] ? new Date(order[stage.doneKey]) : null;
            const late = isCurrent && deadline && !doneAt && now > deadline;

            return (
              <div key={stage.key} className="flex flex-col gap-3 pr-4 relative">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 relative"
                  style={done
                    ? { background: COLOR.success, color: '#fff', border: `3px solid ${COLOR.surface}`, boxShadow: `0 0 0 1px ${COLOR.success}` }
                    : isCurrent
                      ? { background: COLOR.surface, color: late ? COLOR.danger : COLOR.warning, border: `3px solid ${COLOR.surface}`, boxShadow: `0 0 0 2px ${late ? COLOR.danger : COLOR.warning}` }
                      : { background: COLOR.surface, color: COLOR.textDisabled, border: `3px solid ${COLOR.surface}`, boxShadow: `0 0 0 1px ${COLOR.border}` }}
                >
                  {done ? <Check size={16} /> : isCurrent ? <Clock size={16} /> : <span className="text-xs font-semibold">{i + 1}</span>}
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-[13px]" style={{ fontWeight: isCurrent ? 700 : 600, color: isCurrent ? COLOR.textPrimary : done ? COLOR.textPrimary : COLOR.textTertiary }}>{stage.label}</span>
                  <span
                    className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md w-fit"
                    style={done ? { background: COLOR.successSoft, border: `1px solid ${COLOR.successBorder}`, color: COLOR.success }
                      : isCurrent ? { background: COLOR.warningSoft, border: `1px solid ${COLOR.warningBorder}`, color: COLOR.warning }
                      : { background: COLOR.mutedSurface, border: `1px solid ${COLOR.border}`, color: COLOR.textTertiary }}
                  >
                    {done ? 'Yakunlandi' : isCurrent ? 'Joriy bosqich' : cancelled ? 'Bekor qilindi' : 'Kutilmoqda'}
                  </span>
                  <span className="text-xs" style={{ color: COLOR.textTertiary, fontVariantNumeric: 'tabular-nums' }}>
                    {done && doneAt && order.createdAt ? fmtHM(Math.round((doneAt - new Date(order.createdAt)) / 60000)) || '—'
                      : stage.durationKey && order[stage.durationKey] ? `${fmtHM(order[stage.durationKey])} belgilangan`
                      : !stage.deadlineKey || !order[stage.deadlineKey] ? "Muddat belgilanmagan" : ''}
                  </span>
                  {isCurrent && late && (
                    <span className="text-[11px] font-semibold" style={{ color: COLOR.danger }}>{fmtHM(Math.round((now - deadline) / 60000))} kechikdi</span>
                  )}
                  {done && doneAt && deadline && (
                    <span className="text-[11px] font-medium" style={{ color: doneAt > deadline ? COLOR.danger : COLOR.success }}>
                      {doneAt > deadline ? `${fmtHM(Math.round((doneAt - deadline) / 60000))} kech` : "O'z vaqtida"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

// ── Responsible-employee row ───────────────────────────────────────────
function EmployeeRow({ person, role, done, active }) {
  const initials = person?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
        style={person ? { background: COLOR.infoSoft, color: COLOR.info } : { background: COLOR.mutedSurface, color: COLOR.textMuted }}
      >
        {person ? initials : <User size={16} />}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: person ? COLOR.textPrimary : COLOR.textMuted }}>{person?.fullName || 'Belgilanmagan'}</p>
        <p className="text-xs" style={{ color: COLOR.textTertiary }}>{role}</p>
      </div>
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0"
        style={!person ? { background: COLOR.mutedSurface, border: `1px solid ${COLOR.border}`, color: COLOR.textTertiary }
          : done ? { background: COLOR.successSoft, border: `1px solid ${COLOR.successBorder}`, color: COLOR.success }
          : active ? { background: COLOR.warningSoft, border: `1px solid ${COLOR.warningBorder}`, color: COLOR.warning }
          : { background: COLOR.mutedSurface, border: `1px solid ${COLOR.border}`, color: COLOR.textTertiary }}
      >
        {!person ? 'Ixtiyoriy' : done ? 'Yakunlandi' : active ? 'Jarayonda' : 'Kutilmoqda'}
      </span>
    </div>
  );
}

export default function OperatorOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newExcel, setNewExcel] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOne(id),
    select: r => r.data.data,
  });

  const { data: pickers } = useQuery({ queryKey: ['users-PICKER'], queryFn: () => userAPI.getAll({ role: 'PICKER' }), select: r => r.data.data?.filter(u => u.isActive) || [], enabled: editing });
  const { data: markers } = useQuery({ queryKey: ['users-MARKER'], queryFn: () => userAPI.getAll({ role: 'MARKER' }), select: r => r.data.data?.filter(u => u.isActive) || [], enabled: editing });
  const { data: checkers } = useQuery({ queryKey: ['users-CHECKER'], queryFn: () => userAPI.getAll({ role: 'CHECKER' }), select: r => r.data.data?.filter(u => u.isActive) || [], enabled: editing });

  const startEdit = () => {
    setEditForm({
      clientId: order.clientId,
      contractNumber: order.contractNumber,
      invoiceNumber: order.invoiceNumber,
      lotNumber: order.lotNumber || '',
      totalAmount: order.totalAmount,
      pickingMinutes: order.pickingDuration ? String(order.pickingDuration) : '',
      markingMinutes: order.markingDuration ? String(order.markingDuration) : '',
      checkingMinutes: order.checkingDuration ? String(order.checkingDuration) : '',
      assignedPickerId: order.assignedPickerId || '',
      markerId: order.markerId || '',
      checkerId: order.checkerId || '',
    });
    setNewExcel(null);
    setEditing(true);
  };

  const { data: editClient } = useQuery({
    queryKey: ['client-single', editForm.clientId],
    queryFn: () => clientAPI.getOne(editForm.clientId),
    select: r => r.data.data,
    enabled: !!editForm.clientId && editing,
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('clientId', editForm.clientId);
      fd.append('contractNumber', editForm.contractNumber);
      fd.append('invoiceNumber', editForm.invoiceNumber);
      fd.append('lotNumber', editForm.lotNumber || '');
      fd.append('totalAmount', editForm.totalAmount);
      fd.append('pickingMinutes', String(parseInt(editForm.pickingMinutes, 10)));
      fd.append('markingMinutes', String(parseInt(editForm.markingMinutes, 10)));
      fd.append('checkingMinutes', String(parseInt(editForm.checkingMinutes, 10)));
      if (editForm.assignedPickerId) fd.append('assignedPickerId', editForm.assignedPickerId);
      if (editForm.markerId) fd.append('markerId', editForm.markerId);
      if (editForm.checkerId) fd.append('checkerId', editForm.checkerId);
      if (newExcel) fd.append('productsExcel', newExcel);
      return orderAPI.update(id, fd);
    },
    onSuccess: () => { toast.success('Buyurtma yangilandi'); qc.invalidateQueries({ queryKey: ['order', id] }); invalidateOperatorData(qc); setEditing(false); },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const save = () => {
    const bad = ['pickingMinutes', 'markingMinutes', 'checkingMinutes'].some(k => !(parseInt(editForm[k], 10) > 0));
    if (bad) return toast.error("Barcha bosqich muddatlarini daqiqada kiriting (0 dan katta).");
    updateMutation.mutate();
  };

  const cancelMutation = useCancelOrder(() => { qc.invalidateQueries({ queryKey: ['order', id] }); setCancelOpen(false); });

  const setE = k => e => setEditForm(p => ({ ...p, [k]: typeof e === 'object' && e?.target ? e.target.value : e }));

  // ── Loading ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Panel><div className="p-6 flex flex-col gap-3"><Skel w={80} h={10} /><div className="flex gap-3 items-center"><Skel w={220} h={28} className="!rounded-md" /><Skel w={88} h={24} className="!rounded-md" /></div><Skel w={260} h={10} /></div></Panel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[0, 1].map(i => <Panel key={i}><div className="p-5 flex flex-col gap-3"><Skel w={140} h={12} /><div className="grid grid-cols-2 gap-4">{[0, 1, 2, 3].map(j => <div key={j} className="flex flex-col gap-1.5"><Skel w="60%" h={9} /><Skel w="85%" h={13} /></div>)}</div></div></Panel>)}
        </div>
      </div>
    );
  }

  // ── Error / not-found ────────────────────────────────────────────────
  if (error || !order) {
    const notFound = !error;
    return (
      <Panel className={notFound ? '' : '!border-[#FECACA]'}>
        <div className="flex flex-col items-center justify-center gap-3 text-center py-16 px-6" style={{ minHeight: 280 }}>
          {notFound ? <FileQuestion size={24} style={{ color: COLOR.textMuted }} /> : <AlertTriangle size={24} style={{ color: COLOR.danger }} />}
          <div>
            <p className="text-[15px] font-semibold" style={{ color: COLOR.textPrimary }}>{notFound ? 'Buyurtma topilmadi' : "Buyurtma ma'lumotlarini yuklashda xatolik yuz berdi"}</p>
            <p className="text-[13px] mt-1.5 max-w-[40ch]" style={{ color: COLOR.textTertiary }}>{notFound ? 'Ushbu buyurtma mavjud emas yoki unga kirish imkoniyati yo\'q.' : "Ma'lumotlarni olishning iloji bo'lmadi. Qayta urinib ko'ring."}</p>
          </div>
          <div className="flex gap-2">
            {!notFound && (
              <button onClick={refetch} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>
                <RefreshCw size={16} /> Qayta urinish
              </button>
            )}
            <button onClick={() => navigate('/operator/orders')} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-semibold text-white" style={{ background: COLOR.primary }}>
              <ArrowLeft size={16} /> Buyurtmalarga qaytish
            </button>
          </div>
        </div>
      </Panel>
    );
  }

  const canEdit = order.createdById === user?.id && order.status === 'NEW';
  const isMe = order.createdById === user?.id;
  const inProgress = order.status !== 'NEW' && !['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status);
  const terminal = ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status);
  const showDeadlineCard = !terminal;
  const currentStage = STAGES.find(s => s.key === order.status);
  const now = new Date();
  const currentDeadline = currentStage?.deadlineKey && order[currentStage.deadlineKey] ? new Date(order[currentStage.deadlineKey]) : null;
  const currentLate = currentDeadline && now > currentDeadline;
  const remainingMs = currentDeadline ? currentDeadline - now : null;

  return (
    <div className="flex flex-col gap-5">
      <button onClick={() => navigate('/operator/orders')} className="inline-flex items-center gap-1.5 text-[13px] font-semibold w-fit" style={{ color: COLOR.primary }}>
        <ArrowLeft size={16} /> Buyurtmalarga qaytish
      </button>

      {/* ── Header ── */}
      <Panel>
        <div className="p-6 flex flex-wrap gap-4 items-start justify-between">
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-[11px] font-semibold tracking-widest" style={{ color: COLOR.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>BUYURTMA</span>
            <div className="flex flex-wrap gap-3 items-center">
              <h1 className="text-[26px] sm:text-[30px] font-bold leading-tight" style={{ letterSpacing: '-0.02em', fontFamily: "'JetBrains Mono', monospace", color: COLOR.textPrimary }}>#{order.invoiceNumber}</h1>
              <StatusBadge status={order.status} order={order} large />
            </div>
            <div className="flex flex-wrap gap-4 items-center text-[13px]" style={{ color: COLOR.textTertiary }}>
              <span>{format(new Date(order.createdAt), 'dd MMMM yyyy, HH:mm')} da yaratilgan</span>
              <span className="inline-flex items-center gap-1.5"><User size={14} style={{ color: COLOR.textMuted }} /> {order.client?.orgName}</span>
              {isMe && <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: COLOR.primaryHover }}><User size={14} /> Sizning buyurtmangiz</span>}
            </div>
          </div>
          <div className="flex gap-2 items-center shrink-0">
            {!editing ? (
              canEdit ? (
                <>
                  <button onClick={startEdit} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>
                    <Pencil size={18} /> Tahrirlash
                  </button>
                  <button onClick={() => setCancelOpen(true)} className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${COLOR.dangerBorder}`, color: '#B91C1C', background: COLOR.surface }}>
                    <XCircle size={18} /> Bekor qilish
                  </button>
                </>
              ) : isMe && inProgress ? (
                <span className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs" style={{ background: COLOR.mutedSurface, border: `1px solid ${COLOR.border}`, color: COLOR.textTertiary }}>
                  <Lock size={14} /> Jarayon boshlangan — tahrirlash mumkin emas
                </span>
              ) : !isMe && order.status === 'NEW' ? (
                <span className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs" style={{ background: COLOR.mutedSurface, border: `1px solid ${COLOR.border}`, color: COLOR.textTertiary }}>
                  <Eye size={14} /> Faqat ko'rish uchun ochiq
                </span>
              ) : null
            ) : (
              <>
                <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>
                  <X size={16} /> Bekor
                </button>
                <button onClick={save} disabled={updateMutation.isPending} className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-70" style={{ background: COLOR.primary }}>
                  {updateMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> Saqlanmoqda...</> : <><Save size={16} /> Saqlash</>}
                </button>
              </>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-5">
          <Panel>
            <PanelHeader title="Mijoz ma'lumotlari" />
            {!editing ? (
              <div className="px-5 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <InfoRow label="Tashkilot">{order.client?.orgName}</InfoRow>
                <InfoRow label="INN">{order.client?.inn || '—'}</InfoRow>
                <InfoRow label="Buyurtma raqami" mono>#{order.invoiceNumber}</InfoRow>
                <InfoRow label="Operator">{order.createdBy?.fullName}</InfoRow>
              </div>
            ) : (
              <div className="p-5">
                <ClientEditSelect value={editForm.clientId} onChange={setE('clientId')} original={order.clientId} resolved={editClient} />
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Buyurtma ma'lumotlari" />
            {!editing ? (
              <div className="px-5 pb-3 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <InfoRow label="Shartnoma raqami" mono>{order.contractNumber}</InfoRow>
                <InfoRow label="Faktura raqami" mono>{order.invoiceNumber}</InfoRow>
                <InfoRow label="Lot raqami" mono>{order.lotNumber || '—'}</InfoRow>
                <InfoRow label="Yaratilgan sana">{format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}</InfoRow>
                <div className="flex flex-col gap-1 py-3 col-span-1 sm:col-span-2" style={{ borderTop: `1px solid ${COLOR.borderSubtle}` }}>
                  <span style={cardLabel}>Summa</span>
                  <span className="text-lg font-bold" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{formatSum(order.totalAmount)} <span className="text-xs font-normal" style={{ color: COLOR.textTertiary }}>UZS</span></span>
                </div>
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium" style={{ color: '#334155' }}>Shartnoma raqami</span><input value={editForm.contractNumber} onChange={setE('contractNumber')} className={inputCls} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }} /></label>
                  <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium" style={{ color: '#334155' }}>Faktura raqami</span><input value={editForm.invoiceNumber} onChange={setE('invoiceNumber')} className={inputCls} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }} /></label>
                  <label className="flex flex-col gap-1.5"><span className="text-[13px] font-medium" style={{ color: '#334155' }}>Lot raqami</span><input value={editForm.lotNumber} onChange={setE('lotNumber')} className={inputCls} style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }} /></label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium" style={{ color: '#334155' }}>Summa</span>
                    <span className="flex items-center h-10 rounded-lg overflow-hidden" style={inputStyle}>
                      <input value={editForm.totalAmount} onChange={e => setEditForm(p => ({ ...p, totalAmount: e.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1') }))} className="flex-1 min-w-0 h-full border-0 outline-none px-3 text-sm font-semibold text-right" style={{ fontVariantNumeric: 'tabular-nums' }} />
                      <span className="px-3 h-full flex items-center text-xs font-medium shrink-0" style={{ borderLeft: `1px solid ${COLOR.border}`, background: COLOR.subtleSurface, color: COLOR.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>UZS</span>
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1" style={{ borderTop: `1px solid ${COLOR.borderSubtle}` }}>
                  <DurationField label="Terish muddati" value={editForm.pickingMinutes} onChange={setE('pickingMinutes')} />
                  <DurationField label="Markirovka muddati" value={editForm.markingMinutes} onChange={setE('markingMinutes')} />
                  <DurationField label="Tekshirish muddati" value={editForm.checkingMinutes} onChange={setE('checkingMinutes')} />
                </div>
                <p className="text-xs" style={{ color: COLOR.textMuted }}>Bu vaqt faqat hali boshlanmagan bosqichlarga ta'sir qiladi.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <WorkerEditSelect data={pickers} value={editForm.assignedPickerId} onChange={setE('assignedPickerId')} label="Picker" />
                  <WorkerEditSelect data={markers} value={editForm.markerId} onChange={setE('markerId')} label="Marker" />
                  <WorkerEditSelect data={checkers} value={editForm.checkerId} onChange={setE('checkerId')} label="Checker" />
                </div>
                {order.productsExcelUrl && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[13px] font-medium" style={{ color: '#334155' }}>Excel fayl <span className="text-xs font-normal" style={{ color: COLOR.textMuted }}>(ixtiyoriy — yangi yuklash)</span></span>
                    {newExcel ? (
                      <div className="flex items-center gap-2.5 p-2.5 rounded-lg" style={{ background: COLOR.successSoft, border: `1px solid ${COLOR.successBorder}` }}>
                        <FileSpreadsheet size={16} style={{ color: COLOR.success }} className="shrink-0" />
                        <span className="text-[13px] flex-1 truncate">{newExcel.name}</span>
                        <button onClick={() => setNewExcel(null)}><X size={14} style={{ color: COLOR.textTertiary }} /></button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 p-3 rounded-lg cursor-pointer text-sm" style={{ border: `1px dashed ${COLOR.borderStrong}`, color: COLOR.textTertiary }}>
                        <Upload size={16} /> Yangi Excel yuklash
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setNewExcel(e.target.files[0])} />
                      </label>
                    )}
                  </label>
                )}
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Hujjatlar" />
            <div className="p-5">
              {order.productsExcelUrl ? (
                <div className="flex items-center gap-3 p-3.5 rounded-[10px]" style={{ border: `1px solid ${COLOR.border}` }}>
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR.successSoft, color: COLOR.success }}><FileSpreadsheet size={20} /></span>
                  <div className="flex-1 min-w-0">
                    <a href={`${FILE_BASE_URL}${order.productsExcelUrl}`} target="_blank" rel="noreferrer" className="text-[13px] font-semibold truncate block" style={{ color: COLOR.primaryHover }}>{order.productsExcelUrl.split('/').pop()}</a>
                    <p className="text-xs" style={{ color: COLOR.textTertiary }}>Excel fayl</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold shrink-0" style={{ background: COLOR.successSoft, border: `1px solid ${COLOR.successBorder}`, color: COLOR.success }}>
                    <CheckCircle2 size={13} /> Yuklangan
                  </span>
                </div>
              ) : (
                <p className="text-sm" style={{ color: COLOR.textMuted }}>Excel fayl biriktirilmagan.</p>
              )}
              <p className="text-xs mt-2.5" style={{ color: COLOR.textMuted }}>Buyurtmaga bitta Excel hujjati biriktiriladi.</p>
            </div>
          </Panel>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-5">
          {showDeadlineCard && currentStage && (
            <Panel className={currentLate ? '!border-[#FECACA]' : currentDeadline && remainingMs < 30 * 60000 ? '!border-[#FDE68A]' : ''}>
              <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
                {currentLate ? <AlertTriangle size={18} style={{ color: COLOR.danger }} /> : <Clock size={18} style={{ color: currentDeadline && remainingMs < 30 * 60000 ? COLOR.warning : COLOR.success }} />}
                <span className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>Joriy muddat</span>
              </div>
              <div className="p-5 flex flex-col gap-3.5">
                <div className="flex flex-col gap-1">
                  <span style={cardLabel}>{currentStage.label} bosqichi</span>
                  {currentDeadline ? (
                    <span className="text-2xl font-bold" style={{ letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: currentLate ? COLOR.danger : remainingMs < 30 * 60000 ? COLOR.warning : COLOR.textPrimary }}>
                      {currentLate ? `${fmtHM(Math.round((now - currentDeadline) / 60000))} kechikdi` : `${fmtHM(Math.round(remainingMs / 60000))} qoldi`}
                    </span>
                  ) : (
                    <span className="text-sm" style={{ color: COLOR.textMuted }}>Muddat belgilanmagan</span>
                  )}
                </div>
                {currentDeadline && (
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium" style={currentLate
                    ? { border: `1px solid ${COLOR.dangerBorder}`, background: COLOR.dangerSoft, color: COLOR.danger }
                    : remainingMs < 30 * 60000
                      ? { border: `1px solid ${COLOR.warningBorder}`, background: COLOR.warningSoft, color: COLOR.warning }
                      : { border: `1px solid ${COLOR.successBorder}`, background: COLOR.successSoft, color: COLOR.success }}>
                    {currentLate ? <AlertTriangle size={16} /> : <Clock size={16} />}
                    {currentLate ? "Muddat o'tdi — tekshirish talab qilinadi" : remainingMs < 30 * 60000 ? 'Muddat yaqinlashmoqda' : "O'z vaqtida"}
                  </div>
                )}
                {currentStage.durationKey && order[currentStage.durationKey] && (
                  <div className="flex items-center justify-between text-[13px]"><span style={{ color: COLOR.textTertiary }}>Belgilangan muddat</span><span className="font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtHM(order[currentStage.durationKey])}</span></div>
                )}
              </div>
            </Panel>
          )}

          <Panel>
            <PanelHeader title="Mas'ul xodimlar" />
            <div className="px-5 pb-2">
              <EmployeeRow person={order.assignedPicker} role="Picker" done={!!order.pickingDoneAt} active={order.status === 'PICKING'} />
              <EmployeeRow person={order.marker} role="Marker" done={!!order.markingDoneAt} active={order.status === 'MARKING'} />
              <EmployeeRow person={order.checker} role="Checker" done={!!order.checkingDoneAt} active={order.status === 'CHECKING'} />
              {order.driver && <EmployeeRow person={order.driver} role="Haydovchi" done={order.status === 'DELIVERED'} active={order.status === 'IN_TRANSIT'} />}
            </div>
          </Panel>
        </div>
      </div>

      <ProcessTimeline order={order} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
        <Panel>
          <PanelHeader title="Buyurtma tarixi" />
          <div className="p-5">
            {!order.activityLogs?.length ? (
              <p className="text-sm" style={{ color: COLOR.textMuted }}>Tarix hali mavjud emas.</p>
            ) : (
              <div className="flex flex-col">
                {order.activityLogs.map((log, i) => (
                  <div key={log.id} className="grid gap-3.5" style={{ gridTemplateColumns: '24px 1fr' }}>
                    <div className="flex flex-col items-center">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: COLOR.primarySoft, color: COLOR.primaryHover }}>
                        {i === 0 ? <Plus size={14} /> : i === order.activityLogs.length - 1 ? <Clock size={14} /> : <Package size={14} />}
                      </span>
                      {i < order.activityLogs.length - 1 && <span className="flex-1 w-px mt-1" style={{ background: COLOR.border }} />}
                    </div>
                    <div className={`flex flex-col gap-0.5 ${i < order.activityLogs.length - 1 ? 'pb-5' : ''}`}>
                      <span className="text-xs" style={{ color: COLOR.textTertiary, fontVariantNumeric: 'tabular-nums' }}>{format(new Date(log.createdAt), 'dd.MM, HH:mm')}</span>
                      <span className="text-[13px] font-semibold" style={{ color: COLOR.textPrimary }}>{log.action}</span>
                      {log.user?.fullName && <span className="text-[13px]" style={{ color: COLOR.textSecondary }}>{log.user.fullName}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
            <span className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>E'tirozlar</span>
            {order.etirozlar?.length > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center" style={{ background: COLOR.warningSoft, border: `1px solid ${COLOR.warningBorder}`, color: COLOR.warning }}>{order.etirozlar.length}</span>
            )}
          </div>
          {!order.etirozlar?.length ? (
            <EmptyState icon={ShieldCheck} title="E'tirozlar mavjud emas" description="Ushbu buyurtma bo'yicha qayd etilgan e'tirozlar yo'q." />
          ) : (
            <div className="p-5 flex flex-col gap-3">
              {order.etirozlar.map(e => (
                <div key={e.id} className="rounded-[10px] p-3.5 flex flex-col gap-2" style={{ border: `1px solid ${COLOR.warningBorder}` }}>
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold" style={{ background: COLOR.warningSoft, border: `1px solid ${COLOR.warningBorder}`, color: COLOR.warning }}>
                      <Tag size={11} /> {e.fromRole}
                    </span>
                    <span className="text-xs" style={{ color: COLOR.textTertiary, fontVariantNumeric: 'tabular-nums' }}>{format(new Date(e.createdAt), 'dd.MM, HH:mm')}</span>
                  </div>
                  <p className="text-[13px]" style={{ color: COLOR.textPrimary }}>{e.type}</p>
                  {e.comment && <p className="text-[13px]" style={{ color: COLOR.textSecondary }}>{e.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.40)' }} onClick={() => setCancelOpen(false)}>
          <div role="dialog" aria-modal="true" className="w-full max-w-[440px] rounded-2xl p-6 flex flex-col gap-5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, boxShadow: COLOR.shadowModal }} onClick={e => e.stopPropagation()}>
            <div className="flex gap-3 items-start">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR.dangerSoft, color: COLOR.danger }}><AlertTriangle size={20} /></span>
              <div className="flex-1"><p className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>Buyurtmani bekor qilish</p><p className="text-[13px] mt-1.5" style={{ color: COLOR.textSecondary }}>Ushbu buyurtmani bekor qilishni xohlaysizmi? Bu amalni keyin qaytarib bo'lmaydi.</p></div>
              <button aria-label="Yopish" onClick={() => setCancelOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ border: `1px solid ${COLOR.border}`, color: COLOR.textSecondary }}><X size={16} /></button>
            </div>
            <div className="rounded-[10px] p-3.5 flex flex-col gap-2.5" style={{ border: `1px solid ${COLOR.border}`, background: COLOR.subtleSurface }}>
              <div className="flex items-center justify-between gap-3"><span className="text-xs" style={{ color: COLOR.textTertiary }}>Buyurtma</span><span className="text-[13px] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{order.invoiceNumber}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-xs" style={{ color: COLOR.textTertiary }}>Tashkilot</span><span className="text-[13px] font-medium">{order.client?.orgName}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-xs" style={{ color: COLOR.textTertiary }}>Holat</span><StatusBadge status={order.status} order={order} /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCancelOpen(false)} className="h-10 px-4 rounded-lg text-sm font-semibold" style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}>Ortga</button>
              <button onClick={() => cancelMutation.mutate(id)} disabled={cancelMutation.isPending} className="h-10 px-4 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: COLOR.danger }}>{cancelMutation.isPending ? 'Bekor qilinmoqda...' : 'Bekor qilish'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Small edit-mode helpers ──────────────────────────────────────────────
function DurationField({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium" style={{ color: '#334155' }}>{label}</span>
      <span className="flex items-center h-10 rounded-lg overflow-hidden" style={inputStyle}>
        <input inputMode="numeric" value={value} onChange={e => onChange(e.target.value.replace(/\D/g, ''))} className="flex-1 min-w-0 h-full border-0 outline-none px-3 text-sm font-semibold text-right" style={{ fontVariantNumeric: 'tabular-nums' }} />
        <span className="px-3 h-full flex items-center text-xs font-medium shrink-0" style={{ borderLeft: `1px solid ${COLOR.border}`, background: COLOR.subtleSurface, color: COLOR.textTertiary, fontFamily: "'JetBrains Mono', monospace" }}>daqiqa</span>
      </span>
    </label>
  );
}

function WorkerEditSelect({ data, value, onChange, label }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium" style={{ color: '#334155' }}>{label} <span className="text-xs font-normal" style={{ color: COLOR.textMuted }}>(ixtiyoriy)</span></span>
      <div className="relative">
        <select value={value} onChange={onChange} className="appearance-none w-full h-10 pl-3 pr-8 rounded-lg text-sm" style={inputStyle}>
          <option value="">— Tanlanmagan —</option>
          {(data || []).map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLOR.textTertiary }} />
      </div>
    </label>
  );
}

function ClientEditSelect({ value, onChange, resolved }) {
  // Lightweight inline version (Order Detail edits a client rarely; reuses
  // the same clientAPI-backed pattern as Create Order's ClientSelect —
  // kept local here since a full searchable dropdown isn't needed for a
  // single already-known value most of the time).
  const [open, setOpen] = useState(false);
  return (
    <div>
      <span className="text-[13px] font-medium block mb-1.5" style={{ color: '#334155' }}>Klient</span>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between h-10 px-3 rounded-lg text-sm text-left"
          style={inputStyle}
        >
          <span className="truncate">{resolved?.orgName || 'Yuklanmoqda...'}</span>
          <Pencil size={14} style={{ color: COLOR.textTertiary }} />
        </button>
      ) : (
        <ClientSelect value={value} onChange={v => { onChange(v); setOpen(false); }} />
      )}
    </div>
  );
}
