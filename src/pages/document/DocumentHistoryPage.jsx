import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  History, Search, X, RefreshCw, Building2, FileCheck2,
  Undo2, FileDown, AlertTriangle, CalendarDays, Ban
} from 'lucide-react';

const NON_CANCELLABLE_STATUSES = ['DELIVERED', 'CANCELLED'];

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
        <History size={28} className="text-indigo-200" />
      </div>
      <p className="text-gray-400 text-sm font-medium">Hujjatlashtirilgan order yo'q</p>
      <p className="text-gray-300 text-xs mt-1">Hujjat chiqarilgan barcha orderlar shu yerda ko'rinadi</p>
    </div>
  );
}

function HistoryRow({ o, onDownload, downloading, onCancel, cancelling }) {
  const navigate = useNavigate();
  const canCancel = !NON_CANCELLABLE_STATUSES.includes(o.status);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-4 flex-wrap">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
        <Building2 size={16} className="text-indigo-600" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-black text-gray-900">{o.invoiceNumber}</span>
          <StatusBadge status={o.status} />
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <FileCheck2 size={10} /> № {o.dispatchDocument?.documentNumber ?? '—'}
          </span>
          {o.hasReturnedGoods && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-100">
              <AlertTriangle size={10} /> Qaytarilgan tovarlar mavjud
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate mt-0.5">{o.client?.orgName}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {o.dispatchedAt ? format(new Date(o.dispatchedAt), 'dd.MM.yyyy HH:mm') : '—'}
        </p>
      </div>

      <div className="text-right shrink-0">
        {o.originalAmount != null && (
          <p className="text-[11px] text-gray-400 line-through leading-tight">
            {o.originalAmount.toLocaleString()}
          </p>
        )}
        <p className={`text-sm font-black leading-tight ${o.originalAmount != null ? 'text-emerald-600' : 'text-gray-900'}`}>
          {o.totalAmount?.toLocaleString()}
        </p>
        <p className="text-[11px] text-gray-400">so'm</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {o.hasReturnedGoods && (
          <button
            onClick={() => onDownload(o)}
            disabled={downloading === o.id}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white
              bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700
              shadow-sm transition-all disabled:opacity-50"
          >
            <FileDown size={14} /> {downloading === o.id ? 'Yuklanmoqda...' : 'Wordga yuklash'}
          </button>
        )}
        <button
          onClick={() => navigate(`/document/orders/${o.id}/return`)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700
            bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
        >
          <Undo2 size={14} /> {o.hasReturnedGoods ? 'Yana qaytarish' : 'Qaytarilgan mavjud'}
        </button>
        {canCancel && (
          <button
            onClick={() => onCancel(o)}
            disabled={cancelling === o.id}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-500
              bg-gray-50 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50"
          >
            <Ban size={14} /> {cancelling === o.id ? 'Bekor qilinmoqda...' : 'Bekor qilish'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function DocumentHistoryPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [dateFilter, setDateFilter] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const { data: orders = [], isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['document', 'history', dateFilter],
    queryFn: () => documentAPI.getHistory(dateFilter),
    select: r => r.data.data || [],
    refetchInterval: 20000,
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => documentAPI.cancelOrder(id),
    onSuccess: () => {
      toast.success('Order bekor qilindi');
      qc.invalidateQueries(['document']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
    onSettled: () => setCancellingId(null),
  });

  const handleCancel = (o) => {
    if (!window.confirm(`#${o.invoiceNumber} orderni butunlay bekor qilmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`)) return;
    setCancellingId(o.id);
    cancelMutation.mutate(o.id);
  };

  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return o.invoiceNumber?.toLowerCase().includes(q)
      || o.client?.orgName?.toLowerCase().includes(q)
      || o.driver?.fullName?.toLowerCase().includes(q);
  });

  const handleDownload = async (o) => {
    setDownloading(o.id);
    try {
      const res = await documentAPI.downloadReturnReport(o.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `qaytarilgan-${o.invoiceNumber}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Hisobotni yuklab bo\'lmadi');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <History size={16} className="text-indigo-600" />
            </div>
            Tarix
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
            {filtered.length} ta hujjatlashtirilgan order · {dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries(['document', 'history'])}
          className={`w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-300 transition-colors ${isFetching ? 'animate-spin text-indigo-500' : ''}`}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Search + date filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Faktura, tashkilot yoki haydovchi..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-100
              transition-all placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
              <X size={12} className="text-gray-500" />
            </button>
          )}
        </div>
        <div className="relative sm:w-56">
          <CalendarDays size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full pl-11 pr-9 py-3 bg-gray-50 border border-transparent rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-100
              transition-all text-gray-700"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
              <X size={12} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Yuklanmoqda...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState />
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(o => (
            <HistoryRow
              key={o.id}
              o={o}
              onDownload={handleDownload}
              downloading={downloading}
              onCancel={handleCancel}
              cancelling={cancellingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
