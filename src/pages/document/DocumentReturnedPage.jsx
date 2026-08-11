import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  Undo2, Search, X, RefreshCw, Building2, FileDown, User2, MessageSquare, Banknote, Pencil
} from 'lucide-react';
import { formatSum } from '../../lib/format';

function EmptyState() {
  return (
    <div className="py-20 text-center">
      <div className="w-16 h-16 mx-auto bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <Undo2 size={28} className="text-red-200" />
      </div>
      <p className="text-gray-400 text-sm font-medium">Qaytarilgan order yo'q</p>
      <p className="text-gray-300 text-xs mt-1">"Tarix" bo'limidan orderni qaytarilgan deb belgilang</p>
    </div>
  );
}

function ReturnedRow({ o, onDownload, downloading }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center shrink-0">
          <Building2 size={16} className="text-red-600" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-mono text-sm font-black text-gray-900">{o.invoiceNumber}</span>
          <p className="text-sm text-gray-500 truncate mt-0.5">{o.client?.orgName}</p>
        </div>
        <div className="text-right shrink-0">
          {o.originalAmount != null && (
            <p className="text-[11px] text-gray-400 line-through leading-tight">
              {formatSum(o.originalAmount)}
            </p>
          )}
          <p className="text-sm font-black text-emerald-600 leading-tight">{formatSum(o.totalAmount)}</p>
          <p className="text-[11px] text-gray-400">so'm</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate(`/document/orders/${o.id}/return`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700
              bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            <Pencil size={14} /> Yana qaytarish
          </button>
          <button
            onClick={() => onDownload(o)}
            disabled={downloading === o.id}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white
              bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700
              shadow-sm transition-all disabled:opacity-50"
          >
            <FileDown size={14} /> {downloading === o.id ? 'Yuklanmoqda...' : 'Wordga yuklash'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pl-14">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <User2 size={13} className="text-gray-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Qayd etdi</p>
            <p className="text-xs font-bold text-gray-800 truncate">{o.returnedGoodsBy?.fullName || '—'}</p>
          </div>
        </div>
        {o.returnedAmount != null && (
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <Banknote size={13} className="text-gray-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Qaytarilgan summa</p>
              <p className="text-xs font-bold text-gray-800 truncate">{formatSum(o.returnedAmount)} so'm</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <MessageSquare size={13} className="text-gray-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
              {o.returnedGoodsAt ? format(new Date(o.returnedGoodsAt), 'dd.MM.yyyy HH:mm') : ''}
            </p>
            <p className="text-xs font-bold text-gray-800 truncate">{o.returnedGoodsNote || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentReturnedPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState(null);

  const { data: orders = [], isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['document', 'returned'],
    queryFn: () => documentAPI.getReturned(),
    select: r => r.data.data || [],
    refetchInterval: 20000,
  });

  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return o.invoiceNumber?.toLowerCase().includes(q)
      || o.client?.orgName?.toLowerCase().includes(q)
      || o.returnedGoodsBy?.fullName?.toLowerCase().includes(q);
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
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
              <Undo2 size={16} className="text-red-600" />
            </div>
            Qaytgan buyurtmalar
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
            {filtered.length} ta order · {dataUpdatedAt ? format(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}
          </p>
        </div>
        <button
          onClick={() => qc.invalidateQueries(['document', 'returned'])}
          className={`w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-600 hover:border-red-300 transition-colors ${isFetching ? 'animate-spin text-red-500' : ''}`}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Faktura, tashkilot yoki xodim..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white focus:border-red-100
              transition-all placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
              <X size={12} className="text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Yuklanmoqda...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState />
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(o => <ReturnedRow key={o.id} o={o} onDownload={handleDownload} downloading={downloading} />)}
        </div>
      )}
    </div>
  );
}
