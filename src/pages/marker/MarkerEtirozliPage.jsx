import { useQuery } from '@tanstack/react-query';
import { markerAPI } from '../../api';
import { format } from 'date-fns';
import { AlertCircle, Clock, CheckCircle2, XCircle, User } from 'lucide-react';

const ETIROV_TYPE_LABELS = {
  WRONG_QUANTITY:  'Dori miqdori noto\'g\'ri',
  WRONG_PRODUCT:   'Noto\'g\'ri dori olib kelindi',
  WRONG_SERIES:    'Dorining seriyasi boshqa',
  DAMAGED:         'Dori shikastlangan',
  MISSING_PRODUCT: 'Dori ro\'yxatda yo\'q',
  OTHER:           'Boshqa sabab',
};

function EtirovStatusBadge({ status }) {
  if (status === 'PENDING')  return <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">Kutilmoqda</span>;
  if (status === 'ACCEPTED') return <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-300">Qabul qilindi</span>;
  if (status === 'REJECTED') return <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-300">Qabul qilinmadi</span>;
  return null;
}

function EtirozliCard({ order }) {
  const etirozlar = order.etirozlar || [];
  const pending   = etirozlar.filter(e => e.status === 'PENDING');
  const accepted  = etirozlar.filter(e => e.status === 'ACCEPTED');
  const rejected  = etirozlar.filter(e => e.status === 'REJECTED');

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm transition-all hover:shadow-md ${
      pending.length  ? 'border-amber-300' :
      accepted.length ? 'border-green-300' :
      rejected.length ? 'border-red-300'   : 'border-gray-100'
    }`}>
      {/* Header */}
      <div className={`rounded-t-2xl px-5 py-4 border-b ${
        pending.length  ? 'bg-amber-50/60 border-amber-100'  :
        accepted.length ? 'bg-green-50/60 border-green-100'  :
        rejected.length ? 'bg-red-50/60 border-red-100'      : 'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-base font-black text-gray-900">#{order.invoiceNumber}</p>
            <p className="text-xs text-gray-500 mt-0.5">{format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {pending.length  > 0 && <span className="text-[11px] font-black text-amber-700">{pending.length} ta kutilmoqda</span>}
            {accepted.length > 0 && <span className="text-[11px] font-black text-green-700">{accepted.length} ta qabul qilindi</span>}
            {rejected.length > 0 && <span className="text-[11px] font-black text-red-700">{rejected.length} ta rad etildi</span>}
          </div>
        </div>

        {/* Client + Picker */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white font-black text-xs shrink-0">
              {order.client?.orgName?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400">Klient</p>
              <p className="text-xs font-bold text-gray-900 truncate">{order.client?.orgName}</p>
            </div>
          </div>
          {order.assignedPicker && (
            <div className="flex items-center gap-2 p-2.5 bg-white/80 rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                <User size={12} className="text-teal-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400">Picker</p>
                <p className="text-xs font-bold text-gray-900 truncate">{order.assignedPicker.fullName}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Etirozlar */}
      <div className="p-4 space-y-2.5">
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">Etirozlar</p>

        {etirozlar.map((e, i) => (
          <div key={e.id || i} className={`rounded-xl p-3.5 border ${
            e.status === 'PENDING'  ? 'bg-amber-50/60 border-amber-100'  :
            e.status === 'ACCEPTED' ? 'bg-green-50/60 border-green-100'  :
            'bg-red-50/60 border-red-100'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-gray-700">
                {ETIROV_TYPE_LABELS[e.type] || e.type}
              </span>
              <EtirovStatusBadge status={e.status} />
            </div>

            {e.comment && (
              <p className="text-[11px] text-gray-600 font-medium mb-2">"{e.comment}"</p>
            )}

            {/* Picker's response if rejected */}
            {e.status === 'REJECTED' && (
              <div className="mt-2 pt-2 border-t border-red-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <XCircle size={11} className="text-red-500" />
                  <p className="text-[10px] font-black text-red-600">Picker javobi:</p>
                </div>
                {e.responseTypes?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {e.responseTypes.map(rt => (
                      <span key={rt} className="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-md font-semibold">
                        {ETIROV_TYPE_LABELS[rt] || rt}
                      </span>
                    ))}
                  </div>
                )}
                {e.responseComment && (
                  <p className="text-[11px] text-gray-600 italic">"{e.responseComment}"</p>
                )}
                {e.resolvedAt && (
                  <p className="text-[10px] text-gray-400 mt-1">{format(new Date(e.resolvedAt), 'dd.MM HH:mm')}</p>
                )}
              </div>
            )}

            {/* Accepted response */}
            {e.status === 'ACCEPTED' && (
              <div className="mt-2 pt-2 border-t border-green-100 flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-green-500" />
                <p className="text-[11px] text-green-700 font-semibold">
                  Picker qabul qildi
                  {e.resolvedAt ? ` · ${format(new Date(e.resolvedAt), 'HH:mm')}` : ''}
                </p>
              </div>
            )}

            <p className="text-[10px] text-gray-400 mt-1.5">
              <Clock size={10} className="inline mr-1" />
              {format(new Date(e.createdAt), 'dd.MM HH:mm')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MarkerEtirozliPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['marker-etirozli'],
    queryFn: markerAPI.getEtirozli,
    refetchInterval: 20000,
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
          Men etirozli bildirgan orderlar va picker javobi
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-52 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-14 bg-gray-100 rounded mb-3" />
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
