import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination from '../../components/shared/Pagination';
import { MapPin, Clock, Package, Truck, RefreshCw, Calendar, Footprints, Tag, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { format } from 'date-fns';

const STAGES = ['NEW', 'PICKING', 'MARKING', 'CHECKING', 'IN_TRANSIT'];
const STAGE_META = {
  NEW: { label: 'Yangi', color: '#6B7280', bg: 'bg-gray-100', text: 'text-gray-600', icon: Package },
  PICKING: { label: 'Picking', color: '#3B82F6', bg: 'bg-blue-100', text: 'text-blue-600', icon: Footprints },
  MARKING: { label: 'Marking', color: '#8B5CF6', bg: 'bg-purple-100', text: 'text-purple-600', icon: Tag },
  CHECKING: { label: 'Cheking', color: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-600', icon: CheckCircle2 },
  IN_TRANSIT: { label: "Yo'lda", color: '#F97316', bg: 'bg-orange-100', text: 'text-orange-600', icon: Truck },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function StagePipeline({ status }) {
  const currentIdx = STAGES.indexOf(status);
  return (
    <div className="flex items-center shrink-0" title={STAGE_META[status]?.label}>
      {STAGES.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: i <= currentIdx ? STAGE_META[s].color : '#E5E7EB' }} />
          {i < STAGES.length - 1 && (
            <div className="w-3 h-0.5 shrink-0" style={{ background: i < currentIdx ? STAGE_META[STAGES[i + 1]].color : '#E5E7EB' }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function SuperAdminMonitoring() {
  const [date, setDate] = useState(today());
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['monitoring', date, status, page],
    queryFn: () => statsAPI.getMonitoring({ date, status: status || undefined, page, limit }),
    select: r => r.data,
    refetchInterval: 20000,
  });

  const activeOrders = data?.data || [];
  const counts = data?.counts || {};
  const totalActive = STAGES.reduce((s, k) => s + (counts[k] || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Package size={18} className="text-blue-600" />
            </div>
            Real-time Monitoring
          </h1>
          <p className="text-xs text-gray-400 mt-1 ml-12 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Har 20 soniyada avtomatik yangilanadi — orderlar bosqichma-bosqich kuzatiladi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2">
            <Calendar size={15} className="text-blue-500 shrink-0" />
            <input
              type="date"
              value={date}
              max={today()}
              onChange={e => { setDate(e.target.value); setPage(1); }}
              className="text-sm font-bold text-gray-700 outline-none cursor-pointer bg-transparent"
            />
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200 hover:shadow-lg transition-all disabled:opacity-60"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            Yangilash
          </button>
        </div>
      </div>

      {/* Status counterlari — bosqichlar bo'yicha, bosilganda pastdagi ro'yxat filtrlanadi */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <button
          onClick={() => { setStatus(''); setPage(1); }}
          className={`bg-white rounded-2xl border-2 p-4 text-left shadow-sm transition-all ${
            status === '' ? 'border-gray-800' : 'border-transparent hover:border-gray-200'
          }`}
        >
          <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center mb-2">
            <Layers size={16} className="text-white" />
          </div>
          <p className="text-2xl font-black text-gray-900">{totalActive}</p>
          <p className="text-xs text-gray-500 font-medium">Jami faol</p>
        </button>
        {STAGES.map((s) => {
          const meta = STAGE_META[s];
          const Icon = meta.icon;
          const isSelected = status === s;
          return (
            <button
              key={s}
              onClick={() => { setStatus(prev => prev === s ? '' : s); setPage(1); }}
              className={`bg-white rounded-2xl border-2 p-4 text-left shadow-sm transition-all ${
                isSelected ? '' : 'border-transparent hover:border-gray-200'
              }`}
              style={isSelected ? { borderColor: meta.color } : undefined}
            >
              <div className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon size={16} className={meta.text} />
              </div>
              <p className="text-2xl font-black text-gray-900">{counts[s] ?? 0}</p>
              <p className="text-xs text-gray-500 font-medium">{meta.label}</p>
            </button>
          );
        })}
      </div>

      {/* Active orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-gray-900 text-sm">
            Faol orderlar ({data?.total ?? 0}) — {format(new Date(date + 'T00:00:00'), 'dd.MM.yyyy')}
          </h2>
          {status && (
            <button onClick={() => { setStatus(''); setPage(1); }} className="text-xs text-blue-600 font-bold hover:underline">
              Filtrini tozalash
            </button>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        )}

        {!isLoading && activeOrders.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Package size={28} className="mx-auto mb-2 text-gray-300" />
            {date === today() ? "Bugun faol order yo'q" : 'Bu kunda faol order yo\'q'}
          </div>
        )}

        <div className="space-y-2.5">
          {activeOrders.map(order => {
            const isLate = checkLate(order);
            const meta = STAGE_META[order.status];
            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex ${isLate ? 'border-red-200' : 'border-gray-100'}`}
              >
                <div className="w-1.5 shrink-0" style={{ background: isLate ? '#EF4444' : meta?.color || '#E5E7EB' }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-black text-sm text-gray-900">{order.invoiceNumber}</span>
                        <StatusBadge status={order.status} />
                        <StagePipeline status={order.status} />
                        {isLate && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <AlertTriangle size={11} /> Kechikmoqda
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-gray-800 mt-1.5 truncate">{order.client?.orgName}</p>
                      <div className="flex items-start gap-1 text-xs text-gray-400 mt-0.5">
                        <MapPin size={12} className="mt-0.5 shrink-0" />
                        <span className="truncate">{order.client?.address}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400 mt-2">
                        {order.assignedPicker && <span className="flex items-center gap-1"><Footprints size={11} /> {order.assignedPicker.fullName}</span>}
                        {order.marker && <span className="flex items-center gap-1"><Tag size={11} /> {order.marker.fullName}</span>}
                        {order.checker && <span className="flex items-center gap-1"><CheckCircle2 size={11} /> {order.checker.fullName}</span>}
                        {order.driver && <span className="flex items-center gap-1"><Truck size={11} /> {order.driver.fullName}</span>}
                        {order.vehicle && <span>🚗 {order.vehicle.plateNumber}</span>}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400 shrink-0">
                      <div className="flex items-center gap-1 justify-end">
                        <Clock size={11} />
                        {format(new Date(order.createdAt), 'dd.MM HH:mm')}
                      </div>
                      <p className="font-black text-gray-800 text-sm mt-1">{order.totalAmount?.toLocaleString()} so'm</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {activeOrders.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 mt-3">
            <Pagination
              page={data?.page || page}
              pages={data?.pages || 1}
              total={data?.total}
              onChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function checkLate(order) {
  const now = new Date();
  if (order.status === 'NEW' || order.status === 'PICKING') {
    return order.pickingDeadline && new Date(order.pickingDeadline) < now;
  }
  if (order.status === 'MARKING') {
    return order.markingDeadline && new Date(order.markingDeadline) < now;
  }
  if (order.status === 'CHECKING') {
    return order.checkingDeadline && new Date(order.checkingDeadline) < now;
  }
  return false;
}
