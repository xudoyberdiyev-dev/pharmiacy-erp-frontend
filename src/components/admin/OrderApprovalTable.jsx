import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { AlertTriangle, Clock, Truck, CheckCircle2, MapPin, Package, Search, X } from 'lucide-react';
import Pagination from '../shared/Pagination';

const OVERDUE_HOURS = 48;

function hoursSince(dateString) {
  return (Date.now() - new Date(dateString).getTime()) / 3600000;
}

function OrderCard({ order, onConfirm, isConfirming }) {
  const hours = hoursSince(order.deliveredAt);
  const isOverdue = hours > OVERDUE_HOURS;

  return (
    <div
      className={`bg-white rounded-2xl border-2 p-4 shadow-sm transition-all ${
        isOverdue ? 'border-red-200 bg-red-50/40' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Faktura</p>
          <p className="font-mono text-base font-black text-gray-900">{order.invoiceNumber}</p>
        </div>
        <span
          className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1.5 rounded-lg ${
            isOverdue ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}
        >
          {isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
          {Math.round(hours)} soat kutmoqda
        </span>
      </div>

      <div className="mb-3">
        <p className="font-bold text-gray-900">{order.client?.orgName || '—'}</p>
        {order.client?.address && (
          <div className="flex items-start gap-1.5 mt-1 text-sm text-gray-500">
            <MapPin size={13} className="mt-0.5 flex-shrink-0 text-gray-400" />
            <span>{order.client.address}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {[
          { l: 'Shartnoma', v: order.contractNumber },
          { l: 'Lot', v: order.lotNumber },
          { l: 'Quti', v: order.boxCount != null ? order.boxCount : '—', icon: Package },
          { l: 'Summa', v: `${(order.totalAmount ?? 0).toLocaleString()} so'm` },
        ].map(({ l, v }) => (
          <div key={l} className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
            <p className="text-[9px] text-gray-400 font-bold uppercase">{l}</p>
            <p className="text-[11px] font-black text-gray-800 truncate">{v}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 rounded-lg">
          <Truck size={12} className="text-blue-600" />
          <span className="text-[11px] font-bold text-blue-800">{order.driver?.fullName || '—'}</span>
          {order.vehicle && <span className="text-[10px] text-blue-500">· {order.vehicle.plateNumber}</span>}
        </div>
        <span className="text-[11px] text-gray-400">
          Yetkazildi: {order.deliveredAt ? format(new Date(order.deliveredAt), 'dd.MM HH:mm') : '—'}
        </span>
      </div>

      <button
        onClick={onConfirm}
        disabled={isConfirming}
        className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-blue-200 hover:shadow-lg transition-all disabled:opacity-50"
      >
        Tasdiqlash
      </button>
    </div>
  );
}

export default function OrderApprovalTable({ overdueOnly = false }) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'pending-approval', overdueOnly, page, debouncedSearch],
    queryFn: () => orderAPI.getAll({
      status: 'DELIVERED',
      adminConfirmed: false,
      overdueOnly: overdueOnly || undefined,
      search: debouncedSearch || undefined,
      page,
      limit,
    }),
    select: (r) => r.data,
    refetchInterval: 60000,
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => orderAPI.adminConfirm(id),
    onSuccess: () => {
      toast.success('Order tasdiqlandi!');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const orders = data?.data || [];

  const searchBar = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="INN, faktura, shartnoma yoki tashkilot nomi..."
          className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-transparent rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-100
            transition-all placeholder:text-gray-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
          >
            <X size={12} className="text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {searchBar}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-56 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-5 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        {searchBar}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm text-center py-16">
          <div className="w-14 h-14 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-3">
            <CheckCircle2 size={24} className="text-green-400" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">
            {debouncedSearch
              ? 'Qidiruvga mos order topilmadi'
              : overdueOnly ? 'Muddati o\'tgan order yo\'q' : 'Tasdiqlash kutilayotgan order yo\'q'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchBar}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onConfirm={() => confirmMutation.mutate(order.id)}
            isConfirming={confirmMutation.isPending}
          />
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100">
        <Pagination
          page={data?.page || page}
          pages={data?.pages || 1}
          total={data?.total}
          onChange={setPage}
        />
      </div>
    </div>
  );
}
