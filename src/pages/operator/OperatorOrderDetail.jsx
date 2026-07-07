import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI, userAPI } from '../../api';
import { FILE_BASE_URL } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Pencil, X, Check, Save, Upload,
  FileSpreadsheet, Clock, User, Building2, AlertTriangle,
  Activity, Users, Hash
} from 'lucide-react';

const STATUS_CFG = {
  NEW:        { label: 'Yangi',                color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF', border: '#E5E7EB' },
  PICKING:    { label: 'Yig\'ilmoqda',         color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6', border: '#BFDBFE' },
  MARKING:    { label: 'Markalash',             color: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6', border: '#DDD6FE' },
  CHECKING:   { label: 'Tekshiruv',            color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B', border: '#FDE68A' },
  LOADING:    { label: 'Yuklanmoqda / Hujjat', color: '#0369A1', bg: '#F0F9FF', dot: '#0EA5E9', border: '#BAE6FD' },
  IN_TRANSIT: { label: 'Yo\'lda',              color: '#EA580C', bg: '#FFF7ED', dot: '#F97316', border: '#FED7AA' },
  DELIVERED:  { label: 'Yetkazildi',           color: '#16A34A', bg: '#F0FDF4', dot: '#22C55E', border: '#BBF7D0' },
  CANCELLED:  { label: 'Bekor',                color: '#DC2626', bg: '#FEF2F2', dot: '#F87171', border: '#FECACA' },
};

function StatusBadge({ status, large }) {
  const c = STATUS_CFG[status] || STATUS_CFG.NEW;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl font-bold border ${large ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'}`}
      style={{ color: c.color, background: c.bg, borderColor: c.border }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

function DeadlineBar({ label, deadline, doneAt, color = 'blue' }) {
  const now = new Date();
  const d   = new Date(deadline);
  const late = !doneAt && now > d;
  const diffMs  = doneAt ? new Date(doneAt) - d : now - d;
  const absMin  = Math.abs(Math.round(diffMs / 60000));

  const colors = {
    blue:   { icon: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100', label: 'text-blue-700' },
    purple: { icon: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100', label: 'text-purple-700' },
    amber:  { icon: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', label: 'text-amber-700' },
  };
  const c = colors[color];

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border ${late ? 'bg-red-50 border-red-100' : `${c.bg} ${c.border}`}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${late ? 'bg-red-100' : 'bg-white shadow-sm'}`}>
        <Clock size={16} className={late ? 'text-red-500' : c.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-bold mt-0.5 ${late ? 'text-red-600' : 'text-gray-900'}`}>
          {format(d, 'dd.MM.yyyy HH:mm')}
        </p>
      </div>
      <div className="text-right shrink-0">
        {doneAt ? (
          <div>
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${diffMs > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
              {diffMs > 0 ? `+${absMin} daq kech` : `${absMin} daq oldin`}
            </span>
            <p className="text-[11px] text-gray-400 mt-1">{format(new Date(doneAt), 'HH:mm')} da bajarildi</p>
          </div>
        ) : late ? (
          <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">+{absMin} daq o'tdi</span>
        ) : (
          <span className={`text-xs font-semibold ${c.label}`}>Kutilmoqda</span>
        )}
      </div>
    </div>
  );
}

const inp = "w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 focus:bg-white focus:shadow-md focus:shadow-blue-100 transition-all";

export default function OperatorOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [newExcel, setNewExcel] = useState(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOne(id),
    select: r => r.data.data,
  });

  const { data: pickers } = useQuery({ queryKey: ['users-PICKER'], queryFn: () => userAPI.getAll({ role: 'PICKER' }), select: r => r.data.data?.filter(u => u.isActive) || [], enabled: editing });
  const { data: markers } = useQuery({ queryKey: ['users-MARKER'], queryFn: () => userAPI.getAll({ role: 'MARKER' }), select: r => r.data.data?.filter(u => u.isActive) || [], enabled: editing });
  const { data: checkers } = useQuery({ queryKey: ['users-CHECKER'], queryFn: () => userAPI.getAll({ role: 'CHECKER' }), select: r => r.data.data?.filter(u => u.isActive) || [], enabled: editing });

  const startEdit = () => {
    setEditForm({
      contractNumber: order.contractNumber,
      invoiceNumber: order.invoiceNumber,
      lotNumber: order.lotNumber || '',
      totalAmount: order.totalAmount,
      pickingMinutes: order.pickingDuration,
      markingMinutes: order.markingDuration,
      checkingMinutes: order.checkingDuration,
      assignedPickerId: order.assignedPickerId || '',
      markerId: order.markerId || '',
      checkerId: order.checkerId || '',
    });
    setNewExcel(null);
    setEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
      if (newExcel) fd.append('productsExcel', newExcel);
      return orderAPI.update(id, fd);
    },
    onSuccess: () => { toast.success('Order yangilandi'); qc.invalidateQueries(['order', id]); setEditing(false); },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => orderAPI.cancel(id, 'Operator tomonidan bekor qilindi'),
    onSuccess: () => { toast.success('Order bekor qilindi'); navigate('/operator/orders'); },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const setE = k => e => setEditForm(p => ({ ...p, [k]: e.target.value }));

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!order) return <div className="text-center py-20 text-gray-400">Order topilmadi</div>;

  const canEdit   = order.createdById === user?.id;
  const canCancel = order.status === 'NEW' && order.createdById === user?.id;

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/operator/orders')}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shrink-0">
            <ArrowLeft size={17} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-black text-gray-900 font-mono">#{order.invoiceNumber}</h1>
              <StatusBadge status={order.status} large />
            </div>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">{format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')} · {order.createdBy?.fullName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!editing ? (
            <>
              {canEdit && (
                <button onClick={startEdit}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 rounded-xl text-sm font-bold transition-colors">
                  <Pencil size={14} /> Tahrirlash
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => { if (window.confirm('Orderni bekor qilmoqchimisiz?')) cancelMutation.mutate(); }}
                  disabled={cancelMutation.isPending}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                  <X size={14} /> Bekor qilish
                </button>
              )}
            </>
          ) : (
            <>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 px-3.5 py-2 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-bold transition-colors">
                <X size={14} /> Bekor
              </button>
              <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-200 hover:shadow-lg transition-all disabled:opacity-50">
                <Save size={14} /> {updateMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Klient va hujjatlar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <Building2 size={13} className="text-blue-600" />
              </div>
              <h2 className="font-bold text-gray-800 text-sm">Klient va hujjatlar</h2>
            </div>
            <div className="p-5 space-y-0">
              {!editing ? (
                <>
                  {/* Client highlight */}
                  <div className="flex items-center gap-3 p-3.5 bg-blue-50/60 rounded-xl mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0 text-white font-black">
                      {order.client?.orgName?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{order.client?.orgName}</p>
                      <p className="text-xs text-gray-400">INN: {order.client?.inn} · {order.client?.phone}</p>
                      {order.client?.address && <p className="text-xs text-gray-400 mt-0.5">{order.client?.address}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Shartnoma #', val: order.contractNumber },
                      { label: 'Faktura #',   val: order.invoiceNumber },
                      { label: 'Lot #',       val: order.lotNumber },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3.5">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-black text-gray-900 mt-0.5">{val || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3.5 mt-3 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-500">Jami summa</span>
                    <span className="text-xl font-black text-blue-700">{order.totalAmount?.toLocaleString()} <span className="text-sm font-semibold text-blue-400">so'm</span></span>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl text-sm font-semibold text-gray-600">{order.client?.orgName}</div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { k: 'contractNumber', label: 'Shartnoma #', ph: 'SH-2024-001' },
                      { k: 'invoiceNumber',  label: 'Faktura #',   ph: 'FK-001' },
                      { k: 'lotNumber',      label: 'Lot #',       ph: 'LOT-001' },
                    ].map(({ k, label, ph }) => (
                      <div key={k}>
                        <label className="block text-xs text-gray-400 font-bold mb-1.5">{label}</label>
                        <input className={inp} value={editForm[k]} onChange={setE(k)} placeholder={ph} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-bold mb-1.5">Summa (so'm)</label>
                    <input type="text" inputMode="numeric" className={inp} value={editForm.totalAmount}
                      onChange={e => setEditForm(p => ({ ...p, totalAmount: e.target.value.replace(/\D/g, '') }))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 font-bold mb-1.5">Excel fayl (ixtiyoriy — yangi yuklash)</label>
                    {newExcel ? (
                      <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl">
                        <FileSpreadsheet size={16} className="text-green-600 shrink-0" />
                        <span className="text-sm text-green-700 flex-1 truncate">{newExcel.name}</span>
                        <button onClick={() => setNewExcel(null)} className="text-green-400 hover:text-red-400 transition-colors"><X size={14} /></button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2.5 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all text-sm text-gray-400 hover:text-blue-600">
                        <Upload size={16} /> Yangi Excel yuklash
                        <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setNewExcel(e.target.files[0])} />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Muddatlar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock size={13} className="text-amber-600" />
                </div>
                <h2 className="font-bold text-gray-800 text-sm">Bosqich muddatlari</h2>
              </div>
              {order.productsExcelUrl && !editing && (
                <a href={`${FILE_BASE_URL}${order.productsExcelUrl}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-blue-500 font-semibold hover:text-blue-700 transition-colors">
                  <FileSpreadsheet size={13} /> Excel ko'rish
                </a>
              )}
            </div>
            <div className="p-5 space-y-3">
              {!editing ? (
                <>
                  {order.pickingDeadline  && <DeadlineBar label="Picking" deadline={order.pickingDeadline} doneAt={order.pickingDoneAt} color="blue" />}
                  {order.markingDeadline  && <DeadlineBar label="Marking" deadline={order.markingDeadline} doneAt={order.markingDoneAt} color="purple" />}
                  {order.checkingDeadline && <DeadlineBar label="Checking" deadline={order.checkingDeadline} doneAt={order.checkingDoneAt} color="amber" />}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { k: 'pickingMinutes',  label: 'Picking (daq)' },
                      { k: 'markingMinutes',  label: 'Marking (daq)' },
                      { k: 'checkingMinutes', label: 'Checking (daq)' },
                    ].map(({ k, label }) => (
                      <div key={k}>
                        <label className="block text-xs text-gray-400 font-bold mb-1.5">{label}</label>
                        <input type="text" inputMode="numeric" className={inp} value={editForm[k]}
                          onChange={e => setEditForm(p => ({ ...p, [k]: e.target.value.replace(/\D/g, '') }))} />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5 font-medium">
                    Bu vaqt faqat hali boshlanmagan bosqichlarga ta'sir qiladi — allaqachon qabul qilingan
                    bosqichning muddati o'zgarmaydi.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right ── */}
        <div className="space-y-4">

          {/* Xodimlar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users size={13} className="text-purple-600" />
              </div>
              <h2 className="font-bold text-gray-800 text-sm">Xodimlar</h2>
            </div>
            <div className="p-5">
              {!editing ? (
                <div className="space-y-3">
                  {[
                    { label: 'Yaratdi', val: order.createdBy?.fullName, role: 'OPERATOR' },
                    { label: 'Picker',  val: order.assignedPicker?.fullName, role: 'PICKER' },
                    { label: 'Marker',  val: order.marker?.fullName, role: 'MARKER' },
                    { label: 'Checker', val: order.checker?.fullName, role: 'CHECKER' },
                    { label: 'Haydovchi', val: order.driver?.fullName, role: 'DRIVER' },
                  ].map(({ label, val, role }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                      {val ? (
                        <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-black">
                            {val.charAt(0)}
                          </div>
                          {val}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 font-medium">Biriktirilmagan</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { k: 'assignedPickerId', label: 'Picker',  data: pickers },
                    { k: 'markerId',         label: 'Marker',  data: markers },
                    { k: 'checkerId',        label: 'Checker', data: checkers },
                  ].map(({ k, label, data }) => (
                    <div key={k}>
                      <label className="block text-xs text-gray-400 font-bold mb-1.5">{label} (ixtiyoriy)</label>
                      <select className={inp} value={editForm[k]} onChange={setE(k)}>
                        <option value="">— Tanlanmagan —</option>
                        {(data || []).map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Harakatlar tarixi */}
          {order.activityLogs?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Activity size={13} className="text-gray-500" />
                </div>
                <h2 className="font-bold text-gray-800 text-sm">Tarix</h2>
              </div>
              <div className="p-4 max-h-56 overflow-y-auto space-y-2">
                {order.activityLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 leading-snug">{log.action}</p>
                      <p className="text-[11px] text-gray-400">{log.user?.fullName} · {format(new Date(log.createdAt), 'dd.MM HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Etirozlar */}
          {order.etirozlar?.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-amber-100 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-200 flex items-center justify-center">
                  <AlertTriangle size={13} className="text-amber-700" />
                </div>
                <h2 className="font-bold text-amber-800 text-sm">Etirozlar ({order.etirozlar.length})</h2>
              </div>
              <div className="p-4 space-y-2">
                {order.etirozlar.map(e => (
                  <div key={e.id} className="bg-white border border-amber-100 rounded-xl p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">{e.fromRole}</span>
                      <span className="text-[11px] text-gray-400">{format(new Date(e.createdAt), 'dd.MM HH:mm')}</span>
                    </div>
                    <p className="text-xs font-semibold text-gray-700">{e.type}</p>
                    {e.comment && <p className="text-xs text-gray-500 mt-0.5">{e.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
