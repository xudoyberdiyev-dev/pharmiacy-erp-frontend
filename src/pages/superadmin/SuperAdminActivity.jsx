import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import { ClipboardList, Search, X, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import Pagination from '../../components/shared/Pagination';
import { ROLE_LABELS, actionMeta } from '../../lib/activityLabels';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function SuperAdminActivity() {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const LIMIT = 30;

  const { data, isLoading } = useQuery({
    queryKey: ['activity-log', page, dateFilter, search],
    queryFn: () => statsAPI.getActivityLog({ page, limit: LIMIT, date: dateFilter || undefined, search: search || undefined }),
    select: r => r.data,
  });

  const logs = data?.data || [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <ClipboardList size={18} className="text-indigo-600" />
          </div>
          Faoliyat tarixi
        </h1>
        <p className="text-xs text-gray-400 mt-1 ml-12">
          Xodimlar tomonidan bajarilgan barcha real ishlar — yaratish, tahrirlash, o'chirish/bloklash va bosqichlar (kirish hodisalari ko'rsatilmaydi)
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 rounded-2xl p-4">
          <p className="text-3xl font-black text-indigo-600">{total}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Jami faoliyat</p>
        </div>
      </div>

      {/* Qidiruv va filtrlar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Xodim yoki faktura bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-400 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2">
          <Calendar size={15} className="text-blue-500 shrink-0" />
          <input
            type="date"
            value={dateFilter}
            max={today()}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="text-sm font-bold text-gray-700 outline-none cursor-pointer bg-transparent w-[124px]"
          />
        </div>
        <button
          onClick={() => { setDateFilter(dateFilter === today() ? '' : today()); setPage(1); }}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
            dateFilter === today() ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
          }`}
        >
          Bugun
        </button>
        {dateFilter && (
          <button onClick={() => { setDateFilter(''); setPage(1); }} className="text-xs text-blue-600 font-bold hover:underline">
            Sana filtrini tozalash
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-16 animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <ClipboardList size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm font-semibold">
            {search || dateFilter ? 'Filtr bo\'yicha faoliyat topilmadi' : 'Hali faoliyat qayd etilmagan'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => {
              const meta = actionMeta(log.action);
              const Icon = meta.icon;
              return (
                <div key={log.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 ${meta.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon size={17} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${meta.color}`}>{meta.label}</span>
                      {log.order && (
                        <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          #{log.order.invoiceNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-medium text-gray-700">{log.user?.fullName || "Noma'lum"}</span>
                      <span className="text-xs text-gray-400">· {ROLE_LABELS[log.user?.role] || log.user?.role}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 text-right">
                    <p className="font-bold text-gray-600">{format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm')}</p>
                    <p>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: uz })}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100">
            <Pagination page={data?.page || page} pages={data?.pages || 1} total={total} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
