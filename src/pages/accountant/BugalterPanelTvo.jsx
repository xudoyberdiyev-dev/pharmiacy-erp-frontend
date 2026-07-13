import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import AccountantOrderDetailModal from './components/AccountantOrderDetailModal';
import OrderChangeBadges from './components/OrderChangeBadges';
import SearchBar from '../../components/shared/SearchBar';
import Pagination from '../../components/shared/Pagination';
import { FileCheck, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const LIMIT = 20;

export default function BugalterPanelTvo() {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'accountant', 2, search, from, to, page],
    queryFn: () => orderAPI.getAll({
      status: 'DELIVERED', acct1Confirmed: true, acct2Confirmed: false,
      search: search || undefined, from: from || undefined, to: to || undefined,
      page, limit: LIMIT,
    }),
    select: (r) => r.data,
    refetchInterval: 30000,
  });

  const orders = data?.data || [];
  const hasDateFilter = from || to;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center">
              <FileCheck size={18} className="text-blue-600" />
            </div>
            Bugalteriya — 2-tasdiqlash
          </h1>
          <p className="text-xs text-gray-400 mt-1 ml-12">1-bugalter tomonidan tasdiqlangan orderlarni yakuniy tekshirib tasdiqlang</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
            <Calendar size={14} className="text-blue-500" />
            <span className="text-xs font-semibold text-gray-400">Dan</span>
            <input type="date" value={from} max={to || undefined} onChange={e => { setFrom(e.target.value); setPage(1); }} className="text-sm font-bold text-gray-700 outline-none cursor-pointer bg-transparent" />
          </label>
          <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl shadow-sm cursor-pointer hover:border-blue-300 transition-colors">
            <Calendar size={14} className="text-blue-500" />
            <span className="text-xs font-semibold text-gray-400">Gacha</span>
            <input type="date" value={to} min={from || undefined} onChange={e => { setTo(e.target.value); setPage(1); }} className="text-sm font-bold text-gray-700 outline-none cursor-pointer bg-transparent" />
          </label>
          {hasDateFilter && (
            <button onClick={() => { setFrom(''); setTo(''); setPage(1); }} className="text-xs font-bold text-gray-400 hover:text-red-500 px-2">
              Tozalash
            </button>
          )}
        </div>
      </div>

      <SearchBar
        value={search}
        onChange={v => { setSearch(v); setPage(1); }}
        placeholder="Faktura, shartnoma yoki klient nomi bo'yicha qidirish..."
      />

      <div className="bg-blue-50 rounded-2xl p-4 w-fit min-w-[180px]">
        <p className="text-3xl font-black text-blue-600">{data?.total ?? 0}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">Tasdiqlash kutmoqda</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <FileCheck size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm font-semibold">
            {search || hasDateFilter ? 'Qidiruv bo\'yicha order topilmadi' : '2-tasdiqlash uchun order yo\'q'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-6 py-3">Faktura</th>
                <th className="px-6 py-3">Mijoz</th>
                <th className="px-6 py-3">Shartnoma</th>
                <th className="px-6 py-3">Summa</th>
                <th className="px-6 py-3">Yetkazilgan sana</th>
                <th className="px-6 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-mono font-bold text-sm text-gray-900">
                    {o.invoiceNumber}
                    <OrderChangeBadges order={o} />
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">{o.client?.orgName}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{o.contractNumber}</td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-800">{o.totalAmount?.toLocaleString()} so'm</td>
                  <td className="px-6 py-3 text-xs text-gray-400">{o.deliveredAt ? format(new Date(o.deliveredAt), 'dd.MM.yyyy HH:mm') : '—'}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => setSelected(o)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <Eye size={13} /> Batafsil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data?.page || page} pages={data?.pages || 1} total={data?.total} onChange={setPage} />
        </div>
      )}

      {selected && <AccountantOrderDetailModal order={selected} step={2} onClose={() => setSelected(null)} />}
    </div>
  );
}
