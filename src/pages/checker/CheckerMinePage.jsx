import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkerAPI } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  CheckCircle2, Clock, AlertTriangle, Zap, Package,
  TrendingUp, X, User, FileSpreadsheet, Eye, Box, Plus, Minus, Printer, RotateCcw
} from 'lucide-react';

const BOX_TYPES = [
  { value: 'SBOR',     label: 'Sbor' },
  { value: 'ORIGINAL', label: 'Original' },
  { value: 'XALTA',    label: 'Xalta' },
];

// ── Box breakdown (har doim 3 turi ham ko'rinadi: Sbor, Original, Xalta) ──────
// Har bir turning soni alohida, doimiy maydon — checker birontasini
// "kiritmasdan" o'tkazib yubora olmaydi, shuning uchun chop etishda 3 turning
// hammasi (kerakli bo'lganlari) stiker sifatida chiqadi.
function BoxBreakdownSection({ rows, setRows }) {
  const total = rows.reduce((s, r) => s + (r.count || 0), 0);

  const updateCount = (type, count) => {
    setRows(prev => prev.map(r => r.type === type ? { ...r, count: Math.max(0, count) } : r));
  };

  return (
    <div className="bg-sky-50 rounded-xl p-4 border-2 border-sky-200 space-y-3">
      <div className="flex items-center gap-2">
        <Box size={16} className="text-sky-600" />
        <p className="font-black text-sky-900">Qutilar soni (har bir tur bo'yicha)</p>
      </div>
      <p className="text-xs text-gray-500 -mt-1">Sbor, Original va Xalta uchun sonini alohida kiriting (yo'q bo'lsa 0 qoldiring)</p>

      <div className="space-y-2">
        {BOX_TYPES.map(({ value, label }) => {
          const row = rows.find(r => r.type === value) || { count: 0 };
          return (
            <div key={value} className="flex items-center gap-2 bg-white rounded-xl p-2 border border-sky-100">
              <span className="flex-1 px-3 py-2 rounded-lg bg-gray-50 text-sm font-bold text-gray-800">
                {label}
              </span>
              <div className="flex items-center gap-0.5 bg-gray-50 rounded-lg border border-gray-200 shrink-0">
                <button type="button" onClick={() => updateCount(value, row.count - 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-sky-600 transition-colors">
                  <Minus size={13} />
                </button>
                <input
                  type="number" min="0" value={row.count}
                  onChange={e => updateCount(value, parseInt(e.target.value) || 0)}
                  className="w-10 text-center text-sm font-black outline-none bg-transparent"
                />
                <button type="button" onClick={() => updateCount(value, row.count + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-sky-600 transition-colors">
                  <Plus size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-3.5 py-2.5 bg-sky-600 rounded-xl">
        <span className="text-xs font-bold text-sky-100">Jami</span>
        <span className="text-lg font-black text-white">{total} ta quti</span>
      </div>
    </div>
  );
}

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
  const c = {
    normal:   { text: 'text-sky-600',    bar: 'bg-gradient-to-r from-sky-400 to-blue-500',   bg: 'bg-sky-50'   },
    warning:  { text: 'text-amber-600',  bar: 'bg-gradient-to-r from-amber-400 to-orange-400', bg: 'bg-amber-50' },
    critical: { text: 'text-red-600',    bar: 'bg-gradient-to-r from-red-500 to-orange-500',  bg: 'bg-red-50'   },
    overdue:  { text: 'text-red-700',    bar: 'bg-red-500',                                   bg: 'bg-red-50'   },
  }[urgency];
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

// ── Detail Modal ──────────────────────────────────────────────────────────────
// Checker 2 xil rejimdan birini tanlaydi:
//   'print'  — Sbor/Original/Xalta bo'yicha taqsimot kiritiladi, tasdiqdan
//              keyin stiker chop etish sahifasiga o'tadi.
//   'simple' — shunchaki umumiy quti sonini yozadi, stikersiz, checking
//              shu zahoti yakunlanadi (chop etish sahifasiga o'tilmaydi).
function DetailModal({ order, index, onClose, onComplete }) {
  const [mode, setMode] = useState(null); // null | 'print' | 'simple'
  const [rows, setRows] = useState(BOX_TYPES.map(t => ({ type: t.value, count: 0 })));
  const [simpleCount, setSimpleCount] = useState(1);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const qc = useQueryClient();
  const mutation = useMutation({
    // 'print' — faqat soni > 0 bo'lgan turlar yuboriladi (chop etishda shular
    // uchun stiker chiqadi). 'simple' — shunchaki umumiy son yuboriladi.
    mutationFn: () => mode === 'print'
      ? checkerAPI.complete(order.id, { boxes: rows.filter(r => r.count > 0) })
      : checkerAPI.complete(order.id, { boxCount: simpleCount }),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Order tasdiqlandi!');
      onComplete();
      onClose();
      qc.invalidateQueries(['checker-mine']);
      qc.invalidateQueries(['checker-available']);
      if (mode === 'print') navigate(`/checker/print/${order.id}`);
    },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const handleConfirm = () => {
    if (mode === 'print' && !rows.some(r => r.count > 0)) {
      setError('Kamida bitta tur uchun quti sonini kiriting (sbor, original yoki xalta)');
      return;
    }
    if (mode === 'simple' && (!simpleCount || simpleCount < 1)) {
      setError('Qutilar sonini to\'g\'ri kiriting');
      return;
    }
    setError('');
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-black text-gray-900">Order tafsilotlari</h3>
            <p className="text-xs text-gray-400 mt-0.5">#{index + 1} · {order.client?.orgName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Client info */}
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Klient</p>
            <p className="font-black text-gray-900">{order.client?.orgName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{order.client?.address}</p>
            <p className="text-xs text-gray-500">{order.client?.phone}</p>
          </div>

          {/* Doc numbers */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Shartnoma', val: order.contractNumber },
              { label: 'Faktura',   val: order.invoiceNumber  },
              { label: 'Lot',       val: order.lotNumber      },
            ].map(({ label, val }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-black text-gray-900 mt-0.5">{val || '—'}</p>
              </div>
            ))}
          </div>

          {/* Picker + Marker */}
          <div className="grid grid-cols-2 gap-2">
            {order.assignedPicker && (
              <div className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <User size={12} className="text-teal-600" />
                  <p className="text-[10px] font-black text-teal-600 uppercase">Picker</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{order.assignedPicker.fullName}</p>
                {order.pickingDoneAt && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {format(new Date(order.pickingDoneAt), 'dd.MM HH:mm')} da tugatdi
                  </p>
                )}
              </div>
            )}
            {order.marker && (
              <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <User size={12} className="text-purple-600" />
                  <p className="text-[10px] font-black text-purple-600 uppercase">Marker</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{order.marker.fullName}</p>
                {order.markingDoneAt && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {format(new Date(order.markingDoneAt), 'dd.MM HH:mm')} da tugatdi
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Amount + Timer */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl">
            <div>
              <p className="text-[10px] text-gray-400 font-medium">Umumiy summa</p>
              <p className="text-lg font-black text-gray-900">{order.totalAmount?.toLocaleString()} so'm</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-medium">Muddat</p>
              <p className="text-sm font-black text-sky-700">
                {order.checkingDeadline ? format(new Date(order.checkingDeadline), 'HH:mm') : '—'}
              </p>
            </div>
          </div>

          {/* Excel files */}
          <div className="space-y-1.5">
            {order.markedExcelUrl && (
              <a href={`${import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'}${order.markedExcelUrl}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors">
                <FileSpreadsheet size={14} /> Marking Excel ko'rish
              </a>
            )}
          </div>

          {/* Rejim tanlanmagan bo'lsa — 2 ta katta tugma */}
          {mode === null && (
            <div className="grid grid-cols-1 gap-2.5">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Qanday yakunlaysiz?</p>
              <button type="button" onClick={() => setMode('print')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-sky-200 bg-sky-50 hover:bg-sky-100 transition-colors text-left">
                <Printer size={18} className="text-sky-600 shrink-0" />
                <div>
                  <p className="text-sm font-black text-sky-900">Chek chiqarish</p>
                  <p className="text-[11px] text-sky-600">Sbor / Original / Xalta bo'yicha kiritib, stiker chop etish</p>
                </div>
              </button>
              <button type="button" onClick={() => setMode('simple')}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                <Box size={18} className="text-gray-500 shrink-0" />
                <div>
                  <p className="text-sm font-black text-gray-800">Chek chiqarmasdan davom etish</p>
                  <p className="text-[11px] text-gray-500">Faqat umumiy quti sonini yozib yakunlash (stikersiz)</p>
                </div>
              </button>
            </div>
          )}

          {/* Chek bilan — tur bo'yicha taqsimot */}
          {mode === 'print' && (
            <BoxBreakdownSection rows={rows} setRows={r => { setError(''); setRows(r); }} />
          )}

          {/* Cheksiz — shunchaki umumiy son */}
          {mode === 'simple' && (
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 space-y-3">
              <p className="font-black text-gray-800">Qutilar soni</p>
              <p className="text-xs text-gray-500 -mt-2">Chek/stiker chiqarilmaydi, faqat umumiy son saqlanadi</p>
              <div className="flex items-center gap-2 bg-white rounded-xl p-2 border border-gray-200 w-fit">
                <button type="button" onClick={() => { setError(''); setSimpleCount(c => Math.max(1, c - 1)); }}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-sky-600 transition-colors">
                  <Minus size={15} />
                </button>
                <input
                  type="number" min="1" value={simpleCount}
                  onChange={e => { setError(''); setSimpleCount(Math.max(1, parseInt(e.target.value) || 1)); }}
                  className="w-14 text-center text-lg font-black outline-none bg-transparent"
                />
                <button type="button" onClick={() => { setError(''); setSimpleCount(c => c + 1); }}
                  className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-sky-600 transition-colors">
                  <Plus size={15} />
                </button>
              </div>
            </div>
          )}

          {mode !== null && (
            <button type="button" onClick={() => { setMode(null); setError(''); }}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
              ← Orqaga
            </button>
          )}

          {error && <p className="text-xs text-red-600 font-semibold -mt-2">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 shrink-0 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">
            Yopish
          </button>
          {mode !== null && (
            <button
              onClick={handleConfirm}
              disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold
                hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {mutation.isPending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</>
                : mode === 'print'
                  ? <><Printer size={15} /> Tasdiqlash va chek chiqarish</>
                  : <><CheckCircle2 size={15} /> Tasdiqlash</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Order card ────────────────────────────────────────────────────────────────
function MineCard({ order, index }) {
  const [showDetail, setShowDetail] = useState(false);
  const [done, setDone] = useState(false);
  const [returned, setReturned] = useState(false);
  const isOverdue = order.checkingDeadline && new Date(order.checkingDeadline) < new Date();
  const qc = useQueryClient();

  // Orderni checking paneldan chiqarib, qaytadan marking bo'limiga yuboradi —
  // marker uni yana "qabul qilish" orqali olib, eski Excel o'rniga yangisini
  // yuklashi mumkin bo'ladi.
  const returnMut = useMutation({
    mutationFn: () => checkerAPI.returnToMarking(order.id),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Order marking bo\'limiga qaytarildi');
      setReturned(true);
      qc.invalidateQueries(['checker-mine']);
      qc.invalidateQueries(['checker-available']);
    },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const handleReturn = () => {
    if (window.confirm('Bu orderni marking bo\'limiga qaytarmoqchimisiz? Marker uni qaytadan qabul qilib, yangi Excel yuklashi kerak bo\'ladi.')) {
      returnMut.mutate();
    }
  };

  if (returned) {
    return (
      <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
          <RotateCcw size={26} className="text-amber-500" />
        </div>
        <p className="text-sm font-black text-amber-700">Marking bo'limiga qaytarildi!</p>
        <p className="text-xs text-gray-400">#{index + 1}</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border-2 border-green-300 shadow-sm flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <CheckCircle2 size={30} className="text-green-500" />
        </div>
        <p className="text-sm font-black text-green-700">In Transit ga o'tdi!</p>
        <p className="text-xs text-gray-400">#{index + 1}</p>
      </div>
    );
  }

  return (
    <>
      {showDetail && (
        <DetailModal
          order={order}
          index={index}
          onClose={() => setShowDetail(false)}
          onComplete={() => setDone(true)}
        />
      )}

      <div className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all ${
        isOverdue ? 'border-red-300' : 'border-sky-200'
      }`}>
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-mono text-base font-black text-gray-900">#{index + 1}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Qabul: {order.checkingStartedAt ? format(new Date(order.checkingStartedAt), 'HH:mm') : '—'}
              </p>
            </div>
            {isOverdue && (
              <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                <AlertTriangle size={10} /> KECHIKKAN
              </span>
            )}
          </div>

          {/* Client */}
          <div className="flex items-center gap-2 mb-3 p-2.5 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0">
              {order.client?.orgName?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{order.client?.orgName}</p>
              <p className="text-[11px] text-gray-400">{order.invoiceNumber}</p>
            </div>
          </div>

          {/* Picker + Marker */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {order.assignedPicker && (
              <div className="flex items-center gap-1.5 px-2.5 py-2 bg-teal-50 rounded-xl border border-teal-100">
                <User size={11} className="text-teal-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-gray-400 font-bold">PICKER</p>
                  <p className="text-[11px] font-bold text-teal-800 truncate">{order.assignedPicker.fullName}</p>
                </div>
              </div>
            )}
            {order.marker && (
              <div className="flex items-center gap-1.5 px-2.5 py-2 bg-purple-50 rounded-xl border border-purple-100">
                <User size={11} className="text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-gray-400 font-bold">MARKER</p>
                  <p className="text-[11px] font-bold text-purple-800 truncate">{order.marker.fullName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Timer */}
          <TimerDisplay deadline={order.checkingDeadline} totalMinutes={order.checkingDuration} />

          {/* Meta */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">
                Muddat: {order.checkingDeadline ? format(new Date(order.checkingDeadline), 'HH:mm') : '—'}
              </span>
            </div>
            <span className="text-xs font-bold text-gray-700">{order.totalAmount?.toLocaleString()} so'm</span>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-2">
          <button
            onClick={() => setShowDetail(true)}
            disabled={returnMut.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white
              bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700
              shadow-md shadow-sky-200 transition-all disabled:opacity-60"
          >
            <Eye size={15} /> Detail ko'rish va tasdiqlash
          </button>
          <button
            onClick={handleReturn}
            disabled={returnMut.isPending}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold
              border-2 border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all disabled:opacity-60"
          >
            {returnMut.isPending
              ? <><span className="w-3.5 h-3.5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" /> Qaytarilmoqda...</>
              : <><RotateCcw size={13} /> Markinga qaytarish</>}
          </button>
        </div>
      </div>
    </>
  );
}

function StatsRow({ orders }) {
  const overdue = orders.filter(o => o.checkingDeadline && new Date(o.checkingDeadline) < new Date()).length;
  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        { label: 'Jami',         val: orders.length,       icon: Package,      color: 'text-sky-600',   bg: 'bg-sky-50'   },
        { label: 'O\'z vaqtida', val: orders.length - overdue, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Kechikkan',   val: overdue,              icon: AlertTriangle, color: 'text-red-600',   bg: 'bg-red-50'   },
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

export default function CheckerMinePage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['checker-mine'],
    queryFn: checkerAPI.getMine,
    refetchInterval: 15000,
    select: r => r.data.data || [],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight">Mening orderlarim</h1>
        <p className="text-sm text-gray-400 mt-0.5 font-medium">Men qabul qilgan va tekshirayotgan orderlar</p>
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
          <div className="w-16 h-16 mx-auto bg-sky-50 rounded-2xl flex items-center justify-center mb-4">
            <Zap size={28} className="text-sky-300" />
          </div>
          <p className="text-gray-500 text-sm font-semibold">Hozircha biriktrilgan order yo'q</p>
          <p className="text-gray-300 text-xs mt-1">Mavjud orderlardan birini qabul qiling</p>
        </div>
      ) : (
        <>
          <StatsRow orders={orders} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((o, i) => <MineCard key={o.id} order={o} index={i} />)}
          </div>
        </>
      )}
    </div>
  );
}
