import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination from '../../components/shared/Pagination';
import SearchBar from '../../components/shared/SearchBar';
import { useNavigate } from 'react-router-dom';
import { Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = ['', 'NEW', 'PICKING', 'MARKING', 'CHECKING', 'LOADING', 'IN_TRANSIT', 'DELIVERED'];
const STATUS_LABELS = { '': 'Barchasi', NEW: 'Yangi', PICKING: 'Picking', MARKING: 'Marking', CHECKING: 'Cheking', LOADING: 'Yuklanmoqda', IN_TRANSIT: "Yo'lda", DELIVERED: 'Yetkazildi' };

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [date, setDate] = useState(today());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['orders', status, date, search, page],
    queryFn: () => orderAPI.getAll({ status: status || undefined, date, search: search || undefined, page, limit }),
    select: r => r.data,
  });

  const orders = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Buyurtmalar</h1>
        <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
          <Calendar size={14} className="text-blue-500" />
          <input
            type="date"
            value={date}
            max={today()}
            onChange={e => { setDate(e.target.value); setPage(1); }}
            className="text-sm font-bold text-gray-700 outline-none cursor-pointer bg-transparent"
          />
        </label>
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={v => { setSearch(v); setPage(1); }}
        placeholder="Faktura yoki klient nomi bo'yicha qidirish..."
      />

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              status === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'
            }`}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Yuklanmoqda...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                    <th className="px-6 py-3">Faktura</th>
                    <th className="px-6 py-3">Klient</th>
                    <th className="px-6 py-3">Summa</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Pick deadline</th>
                    <th className="px-6 py-3">Sana</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                      {date === today() ? 'Bugun uchun buyurtmalar topilmadi' : 'Bu kunda buyurtmalar topilmadi'}
                    </td></tr>
                  )}
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-sm font-bold">{order.invoiceNumber}</td>
                      <td className="px-6 py-3 text-sm max-w-[140px] truncate">{order.client?.orgName}</td>
                      <td className="px-6 py-3 text-sm font-medium">{order.totalAmount?.toLocaleString()}</td>
                      <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {order.pickingDeadline ? format(new Date(order.pickingDeadline), 'dd.MM HH:mm') : '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">{format(new Date(order.createdAt), 'dd.MM HH:mm')}</td>
                      <td className="px-6 py-3">
                        <button onClick={() => navigate(`/admin/orders/${order.id}`)} className="text-blue-600 hover:text-blue-700">
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data?.page || page}
              pages={data?.pages || 1}
              total={data?.total}
              onChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
