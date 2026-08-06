import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI, checkerAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { ArrowLeft, Printer, Building2, MapPin, FileSpreadsheet, Package, Pencil, X, Minus, Plus, Save, Box } from 'lucide-react';
import NotFoundState from '../../components/shared/NotFoundState';

const BOX_TYPE_LABELS = { SBOR: 'Sbor', ORIGINAL: 'Original', XALTA: 'Xalta' };
const BOX_TYPES = [
  { value: 'SBOR',     label: 'Sbor' },
  { value: 'ORIGINAL', label: 'Original' },
  { value: 'XALTA',    label: 'Xalta' },
];
const BOX_TYPE_COLORS = {
  SBOR:     { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' },
  ORIGINAL: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
  XALTA:    { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
};

function buildLabels(boxBreakdown) {
  const flat = [];
  (boxBreakdown || []).forEach(({ type, count }) => {
    for (let i = 0; i < count; i++) flat.push({ type });
  });
  const total = flat.length;
  return flat.map((l, idx) => ({ ...l, index: idx + 1, total }));
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDateTime(value) {
  const d = value ? new Date(value) : new Date();
  const date = `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return { date, time };
}

function Label({ order, box }) {
  const color = BOX_TYPE_COLORS[box.type] || BOX_TYPE_COLORS.SBOR;
  const { date, time } = formatDateTime(order.checkingDoneAt);

  return (
    <div
      className="label-card"
      style={{
        width: '6cm', height: '6cm', boxSizing: 'border-box',
        border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden',
        background: '#fff', display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ padding: '0.26cm 0.3cm', borderBottom: '1px solid #E5E7EB' }} className="overflow-hidden">
        <p className="text-[18px] font-black text-gray-900 leading-tight truncate">
          {order.client?.orgName}
        </p>
        <p className="text-[14px] text-gray-500 leading-tight truncate mt-0.5">
          {order.client?.address || '—'}
        </p>
      </div>

      <div style={{ padding: '0.22cm 0.3cm', borderBottom: '1px solid #E5E7EB' }} className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Faktura</p>
          <p className="text-[16px] font-black text-gray-900 leading-tight truncate">{order.invoiceNumber}</p>
        </div>
        <div className="min-w-0 text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Shartnoma</p>
          <p className="text-[16px] font-black text-gray-900 leading-tight truncate">{order.contractNumber || '—'}</p>
        </div>
      </div>

      <div
        style={{ padding: '0.22cm 0.3cm', borderBottom: '1px solid #E5E7EB' }}
        className="flex-1 flex items-center justify-between"
      >
        <span
          style={{ background: color.bg, color: color.text, border: `1.5px solid ${color.border}` }}
          className="text-[15px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg"
        >
          {BOX_TYPE_LABELS[box.type] || box.type}
        </span>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Soni</p>
          <span className="text-[30px] font-black text-gray-900 leading-none">{box.index}/{box.total}</span>
        </div>
      </div>

      <div style={{ padding: '0.2cm 0.3cm' }} className="flex items-center justify-between">
        <div>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Sana</p>
          <p className="text-[13px] font-bold text-gray-700">{date}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Vaqt</p>
          <p className="text-[13px] font-bold text-gray-700">{time}</p>
        </div>
      </div>
    </div>
  );
}

// ── Qutilar sonini/tarkibini tahrirlash paneli — chek chiqarilgandan keyin ham
// checker qutilar sonida xato payqasa shu yerdan tuzatib qayta saqlashi mumkin.
// Order breakdown (Sbor/Original/Xalta) bilan chiqarilgan bo'lsa — 3 turli
// hisoblagich, "oddiy son" rejimida chiqarilgan bo'lsa — bitta son maydoni.
function EditBoxesPanel({ order, onClose }) {
  const qc = useQueryClient();
  const hasBreakdown = Array.isArray(order.boxBreakdown) && order.boxBreakdown.length > 0;

  const [rows, setRows] = useState(() =>
    BOX_TYPES.map(t => ({
      type: t.value,
      count: (order.boxBreakdown || []).find(b => b.type === t.value)?.count || 0,
    }))
  );
  const [simpleCount, setSimpleCount] = useState(order.boxCount || 1);
  const [useBreakdown, setUseBreakdown] = useState(hasBreakdown);

  const total = rows.reduce((s, r) => s + (r.count || 0), 0);

  const updateCount = (type, count) => {
    setRows(prev => prev.map(r => r.type === type ? { ...r, count: Math.max(0, count) } : r));
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (useBreakdown) {
        const boxes = rows.filter(r => r.count > 0);
        return checkerAPI.updateBoxes(order.id, { boxes });
      }
      return checkerAPI.updateBoxes(order.id, { boxCount: simpleCount });
    },
    onSuccess: () => {
      toast.success('Qutilar soni yangilandi');
      qc.invalidateQueries({ queryKey: ['order', order.id] });
      qc.invalidateQueries({ queryKey: ['checker-history'] });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const canSave = useBreakdown ? total > 0 : simpleCount > 0;

  return (
    <div className="no-print bg-white rounded-2xl border-2 border-sky-200 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
            <Box size={15} className="text-sky-600" />
          </div>
          <p className="font-black text-gray-900">Qutilar sonini tahrirlash</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1 w-fit">
        <button
          onClick={() => setUseBreakdown(true)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${useBreakdown ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500'}`}
        >
          Tur bo'yicha
        </button>
        <button
          onClick={() => setUseBreakdown(false)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${!useBreakdown ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-500'}`}
        >
          Oddiy son
        </button>
      </div>

      {useBreakdown ? (
        <div className="space-y-2">
          {BOX_TYPES.map(({ value, label }) => {
            const row = rows.find(r => r.type === value) || { count: 0 };
            return (
              <div key={value} className="flex items-center gap-2 bg-sky-50 rounded-xl p-2 border border-sky-100">
                <span className="flex-1 px-3 py-2 rounded-lg bg-white text-sm font-bold text-gray-800">
                  {label}
                </span>
                <div className="flex items-center gap-0.5 bg-white rounded-lg border border-gray-200 shrink-0">
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
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-sky-600 rounded-xl">
            <span className="text-xs font-bold text-sky-100">Jami</span>
            <span className="text-lg font-black text-white">{total} ta quti</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-sky-50 rounded-xl p-2 border border-sky-100 w-fit">
          <button type="button" onClick={() => setSimpleCount(c => Math.max(1, c - 1))}
            className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-sky-600 transition-colors">
            <Minus size={14} />
          </button>
          <input
            type="number" min="1" value={simpleCount}
            onChange={e => setSimpleCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 text-center text-lg font-black outline-none bg-transparent"
          />
          <button type="button" onClick={() => setSimpleCount(c => c + 1)}
            className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-sky-600 transition-colors">
            <Plus size={14} />
          </button>
          <span className="text-sm font-bold text-gray-500 ml-1">ta quti</span>
        </div>
      )}

      <div className="flex gap-2.5 pt-1">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors">
          Bekor qilish
        </button>
        <button
          onClick={() => mutation.mutate()}
          disabled={!canSave || mutation.isPending}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-md shadow-sky-200 transition-all disabled:opacity-50"
        >
          <Save size={15} /> {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </div>
  );
}

export default function CheckerPrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOne(id),
    select: r => r.data.data,
  });

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!order) {
    return <NotFoundState error={error} backTo="/checker/mine" />;
  }

  const labels = buildLabels(order.boxBreakdown);

  return (
    <div className="space-y-5">
      <style>{`
        @media print {
          @page { size: 6cm 6cm; margin: 0; }
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; top: 0; left: 0; }
          .label-card { page-break-after: always; }
          .label-card:last-child { page-break-after: auto; }
        }
      `}</style>

      {/* Header — screen only */}
      <div className="no-print flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-sky-600 hover:border-sky-300 transition-colors">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
                <Printer size={16} className="text-sky-600" />
              </div>
              Chek qog'oz chiqarish
            </h1>
            <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
              Faktura: {order.invoiceNumber} · {order.client?.orgName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(v => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
              editing ? 'text-sky-700 bg-sky-100' : 'text-sky-600 bg-sky-50 hover:bg-sky-100'
            }`}
          >
            <Pencil size={15} /> Tahrirlash
          </button>
          <button
            onClick={() => window.print()}
            disabled={labels.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white
              bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700
              shadow-md shadow-sky-200 transition-all disabled:opacity-50"
          >
            <Printer size={16} /> Chop etish ({labels.length} ta)
          </button>
        </div>
      </div>

      {editing && <EditBoxesPanel order={order} onClose={() => setEditing(false)} />}

      {/* Order summary — screen only */}
      <div className="no-print bg-white rounded-2xl border border-gray-100 shadow-sm p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Tashkilot</p>
            <p className="text-sm font-bold text-gray-800 truncate max-w-[140px]">{order.client?.orgName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Manzil</p>
            <p className="text-sm font-bold text-gray-800 truncate max-w-[140px]">{order.client?.address || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={14} className="text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Faktura</p>
            <p className="text-sm font-bold text-gray-800">{order.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Package size={14} className="text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Jami quti</p>
            <p className="text-sm font-bold text-gray-800">{order.boxCount ?? labels.length} ta</p>
          </div>
        </div>
      </div>

      {labels.length === 0 ? (
        <div className="no-print bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Package size={28} className="text-gray-200 mx-auto mb-3" />
          {order.boxCount > 0 ? (
            <>
              <p className="text-gray-500 text-sm font-bold">Bu order {order.boxCount} ta quti sifatida (oddiy son) qayd etilgan</p>
              <p className="text-gray-400 text-xs mt-1">Stiker chop etish uchun "Tahrirlash" tugmasi orqali tur bo'yicha (Sbor/Original/Xalta) taqsimlang</p>
            </>
          ) : (
            <p className="text-gray-400 text-sm font-medium">Bu order uchun quti ma'lumoti topilmadi</p>
          )}
        </div>
      ) : (
        <div id="print-area" className="flex flex-wrap gap-4">
          {labels.map((box, i) => <Label key={i} order={order} box={box} />)}
        </div>
      )}
    </div>
  );
}
