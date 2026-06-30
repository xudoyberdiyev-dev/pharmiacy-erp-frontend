import { useQuery } from '@tanstack/react-query';
import { pickerAPI } from '../../api';
import { format } from 'date-fns';
import { AlertCircle, Clock, FileSpreadsheet, MessageSquare } from 'lucide-react';

const ETIROV_COLORS = {
  QUANTITY_MISMATCH: { label: 'Miqdor farqi',      bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  DAMAGED_PRODUCT:   { label: 'Shikastlangan',      bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  WRONG_PRODUCT:     { label: 'Noto\'g\'ri mahsulot', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  EXPIRY_ISSUE:      { label: 'Muddati muammosi',   bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200' },
  OTHER:             { label: 'Boshqa',              bg: 'bg-gray-50',   text: 'text-gray-700',   border: 'border-gray-200' },
};

function EtirovBadge({ type }) {
  const c = ETIROV_COLORS[type] || ETIROV_COLORS.OTHER;
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
}

function EtirozliCard({ order }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm hover:shadow-md transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-2xl px-5 py-4 border-b border-amber-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-base font-black text-gray-900">#{order.orderNumber?.slice(-8)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 border border-amber-300 rounded-xl">
            <MessageSquare size={13} className="text-amber-700" />
            <span className="text-[11px] font-black text-amber-800">{order.etirozlar?.length} ta etirozli</span>
          </div>
        </div>

        {/* Client */}
        <div className="flex items-center gap-2.5 mt-3 p-3 bg-white/80 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
            {order.client?.orgName?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{order.client?.orgName}</p>
            <p className="text-[11px] text-gray-500">Faktura: {order.invoiceNumber} · Lot: {order.lotNumber}</p>
          </div>
        </div>
      </div>

      {/* Etirozlar list */}
      <div className="p-4 space-y-2.5">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">Etirozlar ro'yxati</p>
        {(order.etirozlar || []).map((e, i) => (
          <div key={e.id || i} className="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <EtirovBadge type={e.type} />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-gray-400">
                  {e.fromRole}
                </span>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[10px] text-gray-400">
                  {e.createdAt ? format(new Date(e.createdAt), 'dd.MM HH:mm') : '—'}
                </span>
              </div>
            </div>
            {e.comment && (
              <p className="text-xs text-gray-700 font-medium leading-relaxed">{e.comment}</p>
            )}
          </div>
        ))}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">
              Picking: {order.pickingDeadline ? format(new Date(order.pickingDeadline), 'HH:mm') : '—'}
            </span>
          </div>
          {order.productsExcelUrl && (
            <a
              href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${order.productsExcelUrl}`}
              target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <FileSpreadsheet size={13} /> Excel ko'rish
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PickerEtirozliPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['picker-etirozli'],
    queryFn: pickerAPI.getEtirozli,
    refetchInterval: 30000,
    select: r => r.data.data || [],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          Etirozli orderlar
        </h1>
        <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
          Boshqa bo'limlar tomonidan etirozlar bildirilgan orderlar
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-52 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-12 bg-gray-100 rounded mb-3" />
              <div className="h-16 bg-amber-50 rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <AlertCircle size={28} className="text-amber-200" />
          </div>
          <p className="text-gray-500 text-sm font-semibold">Etirozli orderlar yo'q</p>
          <p className="text-gray-300 text-xs mt-1">Hamma narsa tartibda!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {orders.map(o => <EtirozliCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
