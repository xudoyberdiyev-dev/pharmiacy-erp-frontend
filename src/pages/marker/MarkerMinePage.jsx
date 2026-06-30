import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { markerAPI } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  CheckCircle2, Clock, Upload, ArrowRight, AlertCircle,
  AlertTriangle, Zap, Package, TrendingUp, X, FileSpreadsheet, User, File
} from 'lucide-react';

// ── Etirov types ──────────────────────────────────────────────────────────────
const ETIROV_TYPES = [
  { value: 'WRONG_QUANTITY',   label: 'Dori miqdori noto\'g\'ri (kam yoki ko\'p)' },
  { value: 'WRONG_PRODUCT',    label: 'Noto\'g\'ri dori olib kelindi' },
  { value: 'WRONG_SERIES',     label: 'Dorining seriyasi boshqa' },
  { value: 'DAMAGED',          label: 'Dori shikastlangan / yaroqsiz' },
  { value: 'MISSING_PRODUCT',  label: 'Dori ro\'yxatdagi mahsulot yo\'q' },
  { value: 'OTHER',            label: 'Boshqa sabab (qo\'lda yozing)' },
];

// ── Countdown ─────────────────────────────────────────────────────────────────
function calcState(deadline, totalMinutes) {
  const diff    = new Date(deadline) - new Date();
  const overdue = diff < 0;
  const abs     = Math.abs(diff);
  const totalMs = totalMinutes * 60000;
  const pct     = overdue ? 0 : Math.max(0, Math.min(100, (diff / totalMs) * 100));
  return {
    overdue, abs,
    h: Math.floor(abs / 3600000),
    m: Math.floor((abs % 3600000) / 60000),
    s: Math.floor((abs % 60000) / 1000),
    pct,
    urgency: overdue ? 'overdue' : diff < 5*60000 ? 'critical' : diff < 15*60000 ? 'warning' : 'normal',
  };
}
function useCountdown(deadline, totalMinutes) {
  const [state, setState] = useState(() => calcState(deadline, totalMinutes));
  useEffect(() => {
    const t = setInterval(() => setState(calcState(deadline, totalMinutes)), 1000);
    return () => clearInterval(t);
  }, [deadline, totalMinutes]);
  return state;
}

function TimerDisplay({ deadline, totalMinutes }) {
  const { overdue, h, m, s, pct, urgency } = useCountdown(deadline, totalMinutes);
  const colorMap = {
    normal:   { text: 'text-purple-600', bar: 'bg-gradient-to-r from-purple-400 to-violet-500', bg: 'bg-purple-50' },
    warning:  { text: 'text-amber-600',  bar: 'bg-gradient-to-r from-amber-400 to-orange-400',  bg: 'bg-amber-50'  },
    critical: { text: 'text-red-600',    bar: 'bg-gradient-to-r from-red-500 to-orange-500',    bg: 'bg-red-50'    },
    overdue:  { text: 'text-red-700',    bar: 'bg-red-500',                                     bg: 'bg-red-50'    },
  };
  const c = colorMap[urgency];
  return (
    <div className={`rounded-2xl p-4 ${c.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">
          {overdue ? 'Vaqt o\'tib ketdi' : 'Qolgan vaqt'}
        </p>
        {overdue && <AlertTriangle size={13} className="text-red-500" />}
      </div>
      <p className={`text-4xl font-black font-mono tracking-tight ${c.text}`}>
        {overdue ? '+' : ''}{h > 0 ? `${h}:` : ''}{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
      </p>
      {!overdue && (
        <div className="mt-3 h-2 bg-white/70 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${c.bar}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      {overdue && <p className="text-xs text-red-600 font-semibold mt-1.5">Kechikkan — tezroq yakunlang!</p>}
    </div>
  );
}

// ── Etirov Modal ──────────────────────────────────────────────────────────────
function EtirovModal({ order, onClose, onDone }) {
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () => markerAPI.raiseEtirov(order.id, { type: selected, comment: comment.trim() || undefined }),
    onSuccess: () => {
      toast.success('Etirozni picker ga yuborildi');
      onDone();
      onClose();
    },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-gray-900">Etirozni bildirish</h3>
            <p className="text-xs text-gray-400 mt-0.5">#{order.orderNumber?.slice(-8)} · {order.client?.orgName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-2.5">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">Sabab tanlang</p>
          {ETIROV_TYPES.map(t => (
            <button key={t.value} onClick={() => setSelected(t.value)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 text-left transition-all ${
                selected === t.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-100 hover:border-purple-200 hover:bg-purple-50/50'
              }`}>
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                selected === t.value ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
              }`}>
                {selected === t.value && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <span className={`text-sm font-semibold ${selected === t.value ? 'text-purple-800' : 'text-gray-700'}`}>
                {t.label}
              </span>
            </button>
          ))}

          {selected === 'OTHER' && (
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Batafsil izoh yozing..."
              rows={3}
              className="w-full mt-2 px-3.5 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-sm resize-none transition-colors"
            />
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            Bekor qilish
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!selected || (selected === 'OTHER' && !comment.trim()) || mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white text-sm font-bold
              hover:from-purple-600 hover:to-violet-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {mutation.isPending
              ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yuborilmoqda...</>
              : 'Etirozni yuborish'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────
function MineCard({ order }) {
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const [showEtirov, setShowEtirov] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [done, setDone] = useState(false);
  const isOverdue = order.markingDeadline && new Date(order.markingDeadline) < new Date();

  const completeMut = useMutation({
    mutationFn: (formData) => markerAPI.complete(order.id, formData),
    onSuccess: (_, formData) => {
      const hasFile = [...formData.keys()].length > 0;
      setDone(true);
      setTimeout(() => {
        toast.success(hasFile ? 'Marking fayli yuklandi! Checking bo\'limiga o\'tdi.' : 'Order checking bo\'limiga o\'tdi.');
        qc.invalidateQueries(['marker-mine']);
        qc.invalidateQueries(['marker-available']);
      }, 1200);
    },
    onError: e => {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.error(e.response?.data?.message || 'Xato');
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleConfirmUpload = () => {
    const fd = new FormData();
    fd.append('markedExcel', selectedFile);
    completeMut.mutate(fd);
  };

  const handleNoFile = () => {
    completeMut.mutate(new FormData());
  };

  const cancelFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Success overlay
  if (done) {
    return (
      <div className="bg-white rounded-2xl border-2 border-green-300 shadow-sm flex flex-col items-center justify-center py-12 gap-3 transition-all">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <CheckCircle2 size={30} className="text-green-500" />
        </div>
        <p className="text-sm font-black text-green-700">Checking bo'limiga o'tdi!</p>
        <p className="text-xs text-gray-400">#{order.orderNumber?.slice(-8)}</p>
      </div>
    );
  }

  return (
    <>
      {showEtirov && (
        <EtirovModal
          order={order}
          onClose={() => setShowEtirov(false)}
          onDone={() => qc.invalidateQueries(['marker-mine'])}
        />
      )}

      <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all hover:shadow-md ${
        isOverdue ? 'border-red-300' : 'border-purple-200'
      }`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-mono text-base font-black text-gray-900">#{order.orderNumber?.slice(-8)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Qabul qilindi: {order.markingStartedAt ? format(new Date(order.markingStartedAt), 'HH:mm') : '—'}
              </p>
            </div>
            {isOverdue && (
              <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                <AlertTriangle size={10} /> KECHIKKAN
              </span>
            )}
          </div>

          {/* Client */}
          <div className="flex items-center gap-2 mb-2 p-2.5 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white font-black text-sm shrink-0">
              {order.client?.orgName?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{order.client?.orgName}</p>
              <p className="text-[11px] text-gray-400">{order.invoiceNumber}</p>
            </div>
          </div>

          {/* Picker */}
          {order.assignedPicker && (
            <div className="flex items-center gap-2 mb-3 px-2.5 py-2 bg-teal-50 rounded-xl border border-teal-100">
              <User size={12} className="text-teal-600 shrink-0" />
              <span className="text-xs font-bold text-teal-800">{order.assignedPicker.fullName}</span>
              <span className="text-[10px] text-gray-400 ml-auto">
                {order.pickingDoneAt ? format(new Date(order.pickingDoneAt), 'HH:mm') + ' da keldi' : ''}
              </span>
            </div>
          )}

          {/* Timer */}
          <TimerDisplay deadline={order.markingDeadline} totalMinutes={order.markingDuration} />

          {/* Meta */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">
                Muddat: {order.markingDeadline ? format(new Date(order.markingDeadline), 'HH:mm') : '—'}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-700">{order.totalAmount?.toLocaleString()} so'm</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-2">

          {/* File selected — show name + confirm */}
          {selectedFile ? (
            <div className="space-y-2">
              {/* File preview */}
              <div className="flex items-center gap-2.5 p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={15} className="text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-purple-900 truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-purple-500 font-medium">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                {!completeMut.isPending && (
                  <button onClick={cancelFile} className="w-6 h-6 rounded-lg hover:bg-purple-200 flex items-center justify-center transition-colors shrink-0">
                    <X size={13} className="text-purple-500" />
                  </button>
                )}
              </div>

              {/* Confirm upload */}
              <button
                onClick={handleConfirmUpload}
                disabled={completeMut.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white
                  bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700
                  shadow-md shadow-purple-200 transition-all disabled:opacity-70"
              >
                {completeMut.isPending
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yuklanmoqda...</>
                  : <><Upload size={15} /> Marking yuklash</>}
              </button>
            </div>
          ) : (
            /* Default buttons */
            <div className="grid grid-cols-2 gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={completeMut.isPending}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white
                  bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700
                  shadow-md shadow-purple-200 transition-all disabled:opacity-60"
              >
                <Upload size={13} /> Marking yuklash
              </button>
              <button
                onClick={handleNoFile}
                disabled={completeMut.isPending}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold
                  bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all disabled:opacity-60"
              >
                <ArrowRight size={13} /> Yuklamasdan o'tkazish
              </button>
            </div>
          )}

          {/* Etirov button */}
          <button
            onClick={() => setShowEtirov(true)}
            disabled={completeMut.isPending}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold
              border-2 border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all disabled:opacity-60"
          >
            <AlertCircle size={13} /> Etirozni bildirish
          </button>
        </div>
      </div>
    </>
  );
}

function StatsRow({ orders }) {
  const overdue = orders.filter(o => o.markingDeadline && new Date(o.markingDeadline) < new Date()).length;
  const onTime  = orders.length - overdue;
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Jami',          val: orders.length, icon: Package,      color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'O\'z vaqtida',  val: onTime,        icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50'  },
        { label: 'Kechikkan',    val: overdue,        icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50'    },
      ].map(({ label, val, icon: Icon, color, bg }) => (
        <div key={label} className={`${bg} rounded-2xl p-3.5 flex items-center gap-3`}>
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Icon size={17} className={color} />
          </div>
          <div>
            <p className={`text-2xl font-black ${color}`}>{val}</p>
            <p className="text-[11px] text-gray-500 font-medium">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MarkerMinePage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['marker-mine'],
    queryFn: markerAPI.getMine,
    refetchInterval: 15000,
    select: r => r.data.data || [],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Mening orderlarim</h1>
        <p className="text-sm text-gray-400 mt-0.5 font-medium">Men qabul qilgan va marklayotgan orderlar</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-72 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-12 bg-gray-100 rounded mb-3" />
              <div className="h-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
            <Zap size={28} className="text-purple-300" />
          </div>
          <p className="text-gray-500 text-sm font-semibold">Hozircha biriktrilgan order yo'q</p>
          <p className="text-gray-300 text-xs mt-1">Mavjud orderlardan birini qabul qiling</p>
        </div>
      ) : (
        <>
          <StatsRow orders={orders} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map(o => <MineCard key={o.id} order={o} />)}
          </div>
        </>
      )}
    </div>
  );
}
