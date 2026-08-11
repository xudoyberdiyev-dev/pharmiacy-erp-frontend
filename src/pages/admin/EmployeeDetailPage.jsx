import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI, orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import {
  ArrowLeft, Package, Clock, AlertTriangle, AlertOctagon, CheckCircle2,
  X, RotateCcw, MessageSquare, User as UserIcon, ChevronDown, ChevronUp,
} from 'lucide-react';

const ROLE_LABELS = {
  PICKER: 'Picker', MARKER: 'Marker', CHECKER: 'Checker',
  DOCUMENT: 'Hujjatchi', ACCOUNTANT1: '1-bugalter', ACCOUNTANT2: '2-bugalter',
};
const ROLE_STAGE = { PICKER: 'PICKING', MARKER: 'MARKING', CHECKER: 'CHECKING' };
// Bu rollarda "deadline" tushunchasi yo'q — kechikish hisoblanmaydi.
const NO_LATENESS_ROLES = ['DOCUMENT', 'ACCOUNTANT1', 'ACCOUNTANT2'];
const ETIROV_TYPE_LABELS = {
  WRONG_SERIES: 'Seriya boshqa', WRONG_QUANTITY: 'Miqdor noto\'g\'ri', DAMAGED: 'Shikastlangan',
  WRONG_PRODUCT: 'Noto\'g\'ri dori', MISSING_PRODUCT: 'Mahsulot yo\'q', OTHER: 'Boshqa sabab',
};

// ── Sabab yozib bekor qilish/tasdiqlash uchun umumiy modal ───────────────────
function ReasonModal({ title, description, confirmLabel, confirmColor, onClose, onConfirm, isPending }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-black text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-2.5">
          {description && <p className="text-xs text-gray-400">{description}</p>}
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="Sababni yozing..."
            className="w-full px-3.5 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm resize-none transition-colors"
          />
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Yopish
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || isPending}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all ${confirmColor}`}
          >
            {isPending
              ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <RotateCcw size={14} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Kechikish vaqtini tuzatish modali ─────────────────────────────────────────
function AdjustLatenessModal({ order, userId, stage, onClose, onDone }) {
  const [minutes, setMinutes] = useState(String(order.effectiveLateMinutes));
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => orderAPI.adjustLateness(order.id, {
      userId, stage, adjustedLateMinutes: parseInt(minutes) || 0, reason: reason.trim(),
    }),
    onSuccess: () => { toast.success('Kechikish vaqti tuzatildi'); onDone(); onClose(); },
    onError: e => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900">Kechikish vaqtini tuzatish</h3>
            <p className="text-xs text-gray-400 mt-0.5">#{order.invoiceNumber} · asli {order.originalLateMinutes} daqiqa kech</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Tuzatilgan kechikish (daqiqa)</p>
            <input
              type="number" min="0" value={minutes}
              onChange={e => setMinutes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm font-bold"
            />
            <p className="text-[11px] text-gray-400 mt-1">0 kiritsangiz — kechikish to'liq bekor qilinadi</p>
          </div>
          <div>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Sababi</p>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)} rows={3}
              placeholder="Nima uchun tuzatilmoqda..."
              className="w-full px-3.5 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 outline-none text-sm resize-none"
            />
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
            Bekor qilish
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!reason.trim() || minutes === '' || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending
              ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <CheckCircle2 size={14} />}
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}

// ── "Admin tomonidan bekor qilingan" izoh ko'rsatkichi ────────────────────────
function VoidedNote({ label, byName, reason }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1.5 text-[11px] text-gray-500">
      <div className="flex items-center gap-1.5">
        <UserIcon size={11} />
        <span>{label} — Admin {byName || '—'} tomonidan</span>
        <button onClick={() => setOpen(v => !v)} className="text-blue-600 font-bold flex items-center gap-0.5 hover:underline">
          Izohni ko'rish {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
      </div>
      {open && <p className="mt-1 p-2 bg-gray-50 rounded-lg italic">"{reason}"</p>}
    </div>
  );
}

// ── Bitta order kartasi ────────────────────────────────────────────────────────
function OrderCard({ order, userId, stage, showLateness }) {
  const qc = useQueryClient();
  const [showAdjust, setShowAdjust] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null); // { kind: 'penalty'|'etirov', item }

  const invalidate = () => qc.invalidateQueries({ queryKey: ['employee-performance'] });

  const voidPenaltyMut = useMutation({
    mutationFn: (reason) => userAPI.voidPenalty(voidTarget.item.id, reason),
    onSuccess: () => { toast.success('Jarima bekor qilindi'); invalidate(); setVoidTarget(null); },
    onError: e => toast.error(getErrorMessage(e)),
  });
  const voidEtirovMut = useMutation({
    mutationFn: (reason) => userAPI.voidEtirov(voidTarget.item.id, reason),
    onSuccess: () => { toast.success('Etiroz bekor qilindi'); invalidate(); setVoidTarget(null); },
    onError: e => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      {voidTarget && (
        <ReasonModal
          title={voidTarget.kind === 'penalty' ? 'Jarimani bekor qilish' : 'Etirozni bekor qilish'}
          description="Bu amal xodim samaradorligi hisobidan chiqariladi, lekin yozuv o'chirilmaydi."
          confirmLabel="Ha, bekor qilish"
          confirmColor="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
          onClose={() => setVoidTarget(null)}
          isPending={voidTarget.kind === 'penalty' ? voidPenaltyMut.isPending : voidEtirovMut.isPending}
          onConfirm={(reason) => (voidTarget.kind === 'penalty' ? voidPenaltyMut.mutate(reason) : voidEtirovMut.mutate(reason))}
        />
      )}
      {showAdjust && (
        <AdjustLatenessModal
          order={order} userId={userId} stage={stage}
          onClose={() => setShowAdjust(false)}
          onDone={invalidate}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono font-black text-sm text-gray-900">#{order.invoiceNumber}</p>
          <p className="text-xs text-gray-400">{order.client?.orgName}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Lateness — faqat deadline tushunchasi bor rollarda ko'rsatiladi */}
      {showLateness && (
        <>
          <div className={`flex items-center justify-between p-3 rounded-xl ${order.isLate ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className="flex items-center gap-2">
              {order.isLate
                ? <AlertTriangle size={14} className="text-red-500 shrink-0" />
                : <CheckCircle2 size={14} className="text-green-500 shrink-0" />}
              <span className={`text-sm font-bold ${order.isLate ? 'text-red-700' : 'text-green-700'}`}>
                {order.isLate ? `${order.effectiveLateMinutes} daqiqa kech yakunlangan` : 'O\'z vaqtida / erta yakunlangan'}
              </span>
            </div>
            {order.effectiveLateMinutes > 0 && (
              <button onClick={() => setShowAdjust(true)} className="text-xs font-bold text-blue-600 hover:underline shrink-0">
                {order.adjustment ? 'Qayta tuzatish' : 'Tuzatish'}
              </button>
            )}
          </div>
          {order.adjustment && (
            <VoidedNote label={`Asl kechikish: ${order.adjustment.originalLateMinutes} daq.`} byName={order.adjustment.adjustedBy?.fullName} reason={order.adjustment.reason} />
          )}
        </>
      )}

      {/* Etirozlar */}
      {order.etirozlar.map(e => (
        <div key={e.id} className={`p-3 rounded-xl border ${e.voided ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <MessageSquare size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-black text-amber-800">{ETIROV_TYPE_LABELS[e.type] || e.type}</p>
                {e.comment && <p className="text-xs text-gray-600 mt-0.5 break-words">{e.comment}</p>}
              </div>
            </div>
            {!e.voided && (
              <button onClick={() => setVoidTarget({ kind: 'etirov', item: e })} className="text-[11px] font-bold text-red-600 hover:underline shrink-0">
                Uzrli bekor qilish
              </button>
            )}
          </div>
          {e.voided && <VoidedNote label="Bekor qilingan" byName={e.voidedBy?.fullName} reason={e.voidReason} />}
        </div>
      ))}

      {/* Penalties */}
      {order.penalties.map(p => (
        <div key={p.id} className={`p-3 rounded-xl border ${p.voided ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <AlertOctagon size={14} className="text-red-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-black text-red-700">-{p.points} ball</p>
                <p className="text-xs text-gray-600 mt-0.5 break-words">{p.reason}</p>
              </div>
            </div>
            {!p.voided && (
              <button onClick={() => setVoidTarget({ kind: 'penalty', item: p })} className="text-[11px] font-bold text-red-600 hover:underline shrink-0">
                Uzrli bekor qilish
              </button>
            )}
          </div>
          {p.voided && <VoidedNote label="Bekor qilingan" byName={p.voidedBy?.fullName} reason={p.voidReason} />}
        </div>
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className={`${bg} rounded-2xl p-4 flex items-center gap-3`}>
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
        <p className="text-[11px] text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');

  const { data, isLoading } = useQuery({
    queryKey: ['employee-performance', id, period],
    queryFn: () => userAPI.getPerformance(id, { period }),
    select: r => r.data,
  });

  if (isLoading) {
    return <div className="text-center py-20 text-gray-400">Yuklanmoqda...</div>;
  }
  if (!data?.user) {
    return <div className="text-center py-20 text-gray-400">Xodim topilmadi</div>;
  }

  const { user, stats } = data;
  const orders = data.data || [];
  const stage = ROLE_STAGE[user.role];
  const showLateness = !NO_LATENESS_ROLES.includes(user.role);

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-800">
        <ArrowLeft size={16} /> Orqaga
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-sm">
            {user.fullName?.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">{user.fullName}</h1>
            <p className="text-sm text-gray-400">{ROLE_LABELS[user.role]} · {user.phone}</p>
          </div>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {[{ v: 'week', l: 'Hafta' }, { v: 'month', l: 'Oy' }, { v: 'all', l: 'Hammasi' }].map(f => (
            <button key={f.v} onClick={() => setPeriod(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === f.v ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Package} label="Jami order" value={stats.totalOrders} color="text-blue-600" bg="bg-blue-50" />
        {showLateness && (
          <StatCard icon={Clock} label="O'rtacha kechikish (daq.)" value={stats.avgLateMinutes} color="text-amber-600" bg="bg-amber-50" />
        )}
        <StatCard icon={AlertOctagon} label="Jarima balli" value={stats.totalPenaltyPoints} color="text-red-600" bg="bg-red-50" />
        <StatCard icon={MessageSquare} label={showLateness ? 'Etirozlar' : 'Qaytarish/etiroz'} value={stats.etirovCount} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Package size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm font-semibold">Shu davrda order yo'q</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map(o => <OrderCard key={o.id} order={o} userId={user.id} stage={stage} showLateness={showLateness} />)}
        </div>
      )}
    </div>
  );
}
