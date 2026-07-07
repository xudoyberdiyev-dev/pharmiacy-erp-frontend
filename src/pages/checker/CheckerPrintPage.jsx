import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import { ArrowLeft, Printer, Building2, MapPin, FileSpreadsheet, Package } from 'lucide-react';

const BOX_TYPE_LABELS = { SBOR: 'Sbor', ORIGINAL: 'Original', XALTA: 'Xalta' };
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
      <div style={{ padding: '0.28cm 0.32cm', borderBottom: '1px solid #E5E7EB' }} className="overflow-hidden">
        <p className="text-[14px] font-black text-gray-900 leading-tight break-words">
          {order.client?.orgName}
        </p>
        <p className="text-[12px] text-gray-500 leading-tight break-words mt-0.5">
          {order.client?.address || '—'}
        </p>
      </div>

      <div
        style={{ padding: '0.28cm 0.32cm', borderBottom: '1px solid #E5E7EB' }}
        className="flex-1 flex flex-col justify-center gap-2"
      >
        <div className="flex items-start justify-between">
          <span className="text-xl font-black text-gray-900 leading-none">{box.total}/{box.index}</span>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Faktura</p>
            <p className="text-[12px] font-bold text-gray-800 leading-tight">{order.invoiceNumber}</p>
          </div>
        </div>
        <span
          style={{ background: color.bg, color: color.text, border: `1px solid ${color.border}` }}
          className="self-start text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md"
        >
          {BOX_TYPE_LABELS[box.type] || box.type}
        </span>
      </div>

      <div style={{ padding: '0.24cm 0.32cm' }} className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Sana</p>
          <p className="text-[12px] font-bold text-gray-800">{date}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Vaqt</p>
          <p className="text-[12px] font-bold text-gray-800">{time}</p>
        </div>
      </div>
    </div>
  );
}

export default function CheckerPrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
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
    return <div className="py-20 text-center text-gray-400">Order topilmadi</div>;
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
            <p className="text-sm font-bold text-gray-800">{labels.length} ta</p>
          </div>
        </div>
      </div>

      {labels.length === 0 ? (
        <div className="no-print bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Package size={28} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">Bu order uchun quti ma'lumoti topilmadi</p>
        </div>
      ) : (
        <div id="print-area" className="flex flex-wrap gap-4">
          {labels.map((box, i) => <Label key={i} order={order} box={box} />)}
        </div>
      )}
    </div>
  );
}
