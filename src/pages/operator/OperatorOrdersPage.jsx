import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Plus, Search, Eye, Pencil, Trash2,
  Package, X, AlertTriangle, ArrowRight,
  Clock, Filter, ChevronLeft, ChevronRight
} from 'lucide-react';

const STATUS_CFG = {
  NEW:        { label: 'Yangi',                          color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF', border: '#E5E7EB' },
  PICKING:    { label: 'Yig\'ilmoqda',                  color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6', border: '#BFDBFE' },
  MARKING:    { label: 'Markalash',                      color: '#7C3AED', bg: '#F5F3FF', dot: '#8B5CF6', border: '#DDD6FE' },
  CHECKING:   { label: 'Tekshiruv',                     color: '#D97706', bg: '#FFFBEB', dot: '#F59E0B', border: '#FDE68A' },
  LOADING:    { label: 'Yuklanmoqda / Hujjat',           color: '#0369A1', bg: '#F0F9FF', dot: '#0EA5E9', border: '#BAE6FD' },
  IN_TRANSIT: { label: 'Yo\'lda',                       color: '#EA580C', bg: '#FFF7ED', dot: '#F97316', border: '#FED7AA' },
  DELIVERED:  { label: 'Yetkazildi',                    color: '#16A34A', bg: '#F0FDF4', dot: '#22C55E', border: '#BBF7D0' },
  CANCELLED:  { label: 'Bekor',                         color: '#DC2626', bg: '#FEF2F2', dot: '#F87171', border: '#FECACA' },
};

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.NEW;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border"
      style={{ color: c.color, background: c.bg, borderColor: c.border }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

function CancelModal({ order, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100">
        <div className="p-5 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2 size={16} className="text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900">Orderni bekor qilish</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-sm text-amber-800 flex gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <span>Order bekor qilinadi, lekin <strong>tarixda saqlanib qoladi</strong>. Faqat NEW statusdagi orderlarni bekor qilish mumkin.</span>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5 space-y-1">
            <p className="text-xs text-gray-400">Order</p>
            <p className="font-mono font-bold text-gray-900">#{order.invoiceNumber}</p>
            <p className="text-sm text-gray-600">{order.client?.orgName}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sabab (ixtiyoriy)</label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none bg-gray-50 hover:bg-white transition-colors"
              rows={3}
              placeholder="Nima uchun bekor qilmoqdasiz?"
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
          </div>
        </div>
        <div className="p-5 border-t border-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Ortga qaytish
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl text-sm font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 shadow-md shadow-red-200"
          >
            {loading ? 'Bekor qilinmoqda...' : 'Ha, bekor qilish'}
          </button>
        </div>
      </div>
    </div>
  );
}

const ALL_STATUSES = Object.entries(STATUS_CFG);

export default function OperatorOrdersPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState(searchParams.get('status') || '');
  const [cancelTarget, setCancel]   = useState(null);
  const [page, setPage]             = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['op-orders', statusFilter, page],
    queryFn: () => orderAPI.getAll({ status: statusFilter || undefined, page, limit: 15 }),
    select: r => r.data,
  });

  const cancelMut = useMutation({
    mutationFn: ({ id, reason }) => orderAPI.cancel(id, reason),
    onSuccess: () => {
      toast.success('Order bekor qilindi');
      qc.invalidateQueries(['op-orders']);
      qc.invalidateQueries(['operator-orders']);
      setCancel(null);
    },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const orders = data?.data || [];
  const total  = data?.total || 0;
  const pages  = data?.pages || 1;
  const now    = new Date();

  const isLate = (o) => {
    if (['DELIVERED','CANCELLED'].includes(o.status)) return false;
    const d = ['NEW','PICKING'].includes(o.status) ? o.pickingDeadline
      : o.status === 'MARKING' ? o.markingDeadline : o.checkingDeadline;
    return d && new Date(d) < now;
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.orderNumber?.toLowerCase().includes(q)
      || o.client?.orgName?.toLowerCase().includes(q)
      || o.invoiceNumber?.toLowerCase().includes(q)
      || o.contractNumber?.toLowerCase().includes(q);
  });

  const changeStatus = (s) => {
    setStatus(s); setPage(1);
    s ? setSearchParams({ status: s }) : setSearchParams({});
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Orderlar</h1>
          <p className="text-sm text-gray-400 mt-0.5 font-medium">Jami {total} ta order</p>
        </div>
        <button
          onClick={() => navigate('/operator/orders/new')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-white
            bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
            shadow-md shadow-blue-200 hover:shadow-lg transition-all"
        >
          <Plus size={15} strokeWidth={2.5} /> Yangi order
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Order #, klient nomi, faktura, shartnoma raqami..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-100
              transition-all placeholder:text-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
              <X size={12} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => changeStatus('')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !statusFilter
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
            }`}
          >
            Barchasi
          </button>
          {ALL_STATUSES.map(([s, c]) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                statusFilter === s
                  ? 'shadow-md'
                  : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
              }`}
              style={statusFilter === s ? { color: c.color, background: c.bg, borderColor: c.border } : {}}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Yuklanmoqda...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <Package size={28} className="text-gray-200" />
            </div>
            <p className="text-gray-400 text-sm font-medium">Orderlar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  {['ORDER #','KLIENT','FAKTURA','SUMMA','STATUS','PICKING','YARATDI','SANA',''].map(h => (
                    <th key={h} className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const late    = isLate(o);
                  const canEdit = o.status === 'NEW' && o.createdById === user?.id;
                  const canDel  = o.status === 'NEW' && o.createdById === user?.id;
                  const isMe    = o.createdById === user?.id;
                  return (
                    <tr
                      key={o.id}
                      className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors group ${late ? 'bg-red-50/20' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-gray-900">#{o.invoiceNumber}</span>
                          {late && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                              <AlertTriangle size={9} /> KECH
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-gray-800 max-w-[120px] truncate">{o.client?.orgName}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[120px]">{o.client?.inn}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 font-medium">{o.invoiceNumber}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-black text-gray-900 whitespace-nowrap">{o.totalAmount?.toLocaleString()}</p>
                        <p className="text-[11px] text-gray-400">so'm</p>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                      <td className="px-5 py-3.5">
                        <p className={`text-sm font-semibold ${late ? 'text-red-500' : 'text-gray-600'}`}>
                          {o.pickingDeadline ? format(new Date(o.pickingDeadline), 'dd.MM HH:mm') : '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className={`text-sm font-semibold ${isMe ? 'text-blue-600' : 'text-gray-600'}`}>
                          {o.createdBy?.fullName || '—'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400 font-medium whitespace-nowrap">
                        {format(new Date(o.createdAt), 'dd.MM HH:mm')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/operator/orders/${o.id}`)}
                            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-500 transition-colors"
                            title="Ko'rish"
                          >
                            <Eye size={13} />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => navigate(`/operator/orders/${o.id}`)}
                              className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 flex items-center justify-center text-amber-500 transition-colors"
                              title="Tahrirlash"
                            >
                              <Pencil size={13} />
                            </button>
                          )}
                          {canDel && (
                            <button
                              onClick={() => setCancel(o)}
                              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 transition-colors"
                              title="Bekor qilish"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">Sahifa {page} / {pages}</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg border text-xs font-bold transition-colors ${
                    page === p
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {cancelTarget && (
        <CancelModal
          order={cancelTarget}
          onClose={() => setCancel(null)}
          onConfirm={reason => cancelMut.mutate({ id: cancelTarget.id, reason })}
          loading={cancelMut.isPending}
        />
      )}
    </div>
  );
}
