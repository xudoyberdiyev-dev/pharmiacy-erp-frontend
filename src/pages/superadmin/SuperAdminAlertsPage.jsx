import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { notificationAPI } from '../../api';
import toast from 'react-hot-toast';
import { AlertTriangle, Bell, CheckCircle2, Search, X, CheckCheck, Footprints, Tag } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination from '../../components/shared/Pagination';

const STAGES = [
  { key: 'Picking', label: 'Picking', color: '#3B82F6', bg: 'bg-blue-100', text: 'text-blue-600', icon: Footprints },
  { key: 'Marking', label: 'Marking', color: '#8B5CF6', bg: 'bg-purple-100', text: 'text-purple-600', icon: Tag },
  { key: 'Cheking', label: 'Cheking', color: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-600', icon: CheckCircle2 },
];

function stageMeta(title) {
  return STAGES.find((s) => title?.startsWith(s.key)) || null;
}

export default function SuperAdminAlertsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [stage, setStage] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [search, setSearch] = useState('');
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['alerts-history', page, stage, unreadOnly, search],
    queryFn: () => notificationAPI.getAll({
      page, limit,
      stage: stage || undefined,
      unreadOnly: unreadOnly ? 'true' : undefined,
      search: search || undefined,
    }),
    select: (r) => r.data,
  });

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;
  const stageBreakdown = data?.stageBreakdown || [];
  const stageCount = (key) => stageBreakdown.find((s) => s.title?.startsWith(key))?.count || 0;

  const markRead = (id) => {
    notificationAPI.markRead(id).then(() => {
      qc.invalidateQueries({ queryKey: ['alerts-history'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    });
  };

  const markAllMutation = useMutation({
    mutationFn: () => notificationAPI.markAllRead(),
    onSuccess: () => {
      toast.success('Barchasi o\'qilgan deb belgilandi');
      qc.invalidateQueries({ queryKey: ['alerts-history'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-2xl flex items-center justify-center">
              <Bell size={18} className="text-red-600" />
            </div>
            Kechikishlar
          </h1>
          <p className="text-xs text-gray-400 mt-1 ml-12">
            Picking/Marking/Cheking bosqichlarida muddatidan kechikkan buyurtmalar bo'yicha barcha ogohlantirishlar tarixi
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200 hover:shadow-lg transition-all disabled:opacity-60"
          >
            <CheckCheck size={16} /> Barchasini o'qildi deb belgilash
          </button>
        )}
      </div>

      {/* KPI qatori */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-red-50 rounded-2xl p-4">
          <p className="text-3xl font-black text-red-500">{data?.total ?? 0}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Jami ogohlantirishlar</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4">
          <p className="text-3xl font-black text-amber-600">{unreadCount}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">O'qilmagan</p>
        </div>
        {STAGES.map((s) => (
          <div key={s.key} className={`${s.bg} rounded-2xl p-4`}>
            <p className="text-3xl font-black" style={{ color: s.color }}>{stageCount(s.key)}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label} kechikishlari</p>
          </div>
        ))}
      </div>

      {/* Qidiruv va filtrlar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Faktura yoki mijoz nomi bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-400 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => { setStage(''); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!stage ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Barchasi
          </button>
          {STAGES.map((s) => (
            <button
              key={s.key}
              onClick={() => { setStage((p) => p === s.key ? '' : s.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${stage === s.key ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              style={stage === s.key ? { color: s.color } : undefined}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setUnreadOnly((p) => !p); setPage(1); }}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
            unreadOnly ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
          }`}
        >
          Faqat o'qilmaganlar
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="w-14 h-14 mx-auto bg-green-50 rounded-2xl flex items-center justify-center mb-3">
            <CheckCircle2 size={24} className="text-green-400" />
          </div>
          <p className="text-gray-400 text-sm font-semibold">
            {stage || search || unreadOnly ? 'Filtr bo\'yicha ogohlantirish topilmadi' : 'Hech qanday kechikish qayd etilmagan'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => {
              const meta = stageMeta(n.title);
              const Icon = meta?.icon || AlertTriangle;
              return (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={`w-full text-left bg-white rounded-2xl border-2 p-4 shadow-sm flex items-start gap-3 transition-all ${
                    n.isRead ? 'border-gray-100' : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  <div className={`w-9 h-9 ${meta?.bg || 'bg-red-100'} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon size={16} className={meta?.text || 'text-red-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{n.title}</p>
                      {n.order && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                          hozirgi holat: <StatusBadge status={n.order.status} order={n.order} />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-xs text-gray-400">{format(new Date(n.createdAt), 'dd.MM.yyyy HH:mm')}</p>
                      <span className="text-gray-300">·</span>
                      <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: uz })}</p>
                    </div>
                  </div>
                  {!n.isRead && <span className="text-[10px] font-black text-red-500 uppercase shrink-0 mt-1">Yangi</span>}
                </button>
              );
            })}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100">
            <Pagination page={data?.page || page} pages={data?.pages || 1} total={data?.total} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
