import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const ACTION_LABELS = {
  ORDER_CREATED: { label: 'Order yaratildi', color: 'bg-blue-100 text-blue-700' },
  PICKING_STARTED: { label: 'Picking boshlandi', color: 'bg-blue-100 text-blue-700' },
  PICKING_COMPLETED: { label: 'Picking yakunlandi', color: 'bg-purple-100 text-purple-700' },
  MARKING_COMPLETED: { label: 'Marking yakunlandi', color: 'bg-amber-100 text-amber-700' },
  ETIROV_SUBMITTED: { label: 'Etiroz yuborildi', color: 'bg-red-100 text-red-700' },
  CHECKING_COMPLETED: { label: 'Cheking yakunlandi', color: 'bg-orange-100 text-orange-700' },
  DRIVER_ASSIGNED: { label: 'Haydovchi biriktirildi', color: 'bg-gray-100 text-gray-700' },
  DELIVERED: { label: 'Yetkazildi', color: 'bg-green-100 text-green-700' },
  ADMIN_CONFIRMED: { label: 'Admin tasdiqladi', color: 'bg-green-100 text-green-700' },
  ACCOUNTANT1_CONFIRMED: { label: 'Bugalter 1-tasdiq', color: 'bg-teal-100 text-teal-700' },
  ACCOUNTANT2_CONFIRMED: { label: 'Bugalter 2-tasdiq', color: 'bg-teal-100 text-teal-700' },
};

const ROLE_LABELS = {
  ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin', PICKER: 'Picker',
  MARKER: 'Marker', CHECKER: 'Checker', DRIVER: 'Haydovchi', ACCOUNTANT: 'Bugalter',
};

export default function SuperAdminActivity() {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const LIMIT = 30;

  const { data, isLoading } = useQuery({
    queryKey: ['activity-log', page, dateFilter],
    queryFn: () => statsAPI.getActivityLog({ page, limit: LIMIT, date: dateFilter || undefined }),
    select: r => r.data,
  });

  const logs = Array.isArray(data) ? data : (data?.data || []);
  const total = data?.total || logs.length;
  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList size={24} /> Faoliyat Tarixi
        </h1>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input w-40 text-sm"
            value={dateFilter}
            onChange={e => { setDateFilter(e.target.value); setPage(1); }}
          />
          {dateFilter && (
            <button onClick={() => { setDateFilter(''); setPage(1); }} className="btn-secondary text-sm">
              Tozalash
            </button>
          )}
        </div>
      </div>

      {isLoading && <div className="text-gray-400 text-sm">Yuklanmoqda...</div>}

      {!isLoading && logs.length === 0 && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">
          Faoliyat topilmadi
        </div>
      )}

      <div className="space-y-2">
        {logs.map((log, i) => {
          const meta = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700' };
          return (
            <div key={log.id || i} className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                    {meta.label}
                  </span>
                  {log.order && (
                    <span className="font-mono text-xs text-gray-500">
                      #{log.order?.invoiceNumber}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium text-gray-700">{log.user?.fullName}</span>
                  <span className="text-xs text-gray-400">· {ROLE_LABELS[log.user?.role] || log.user?.role}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 flex-shrink-0 text-right">
                {format(new Date(log.createdAt), 'dd.MM.yyyy')}
                <br />
                {format(new Date(log.createdAt), 'HH:mm')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Jami: {total} ta</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary p-2 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium px-3">{page} / {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="btn-secondary p-2 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
