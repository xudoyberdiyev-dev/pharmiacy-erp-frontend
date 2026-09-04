import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import Pagination from '../../components/shared/Pagination';
import OrderChangeBadges from '../accountant/components/OrderChangeBadges';
import { MapPin, Clock, Package, Truck, RefreshCw, Calendar, Footprints, Tag, CheckCircle2, AlertTriangle, Layers, ArrowRight, Hourglass, Wallet, TimerOff, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { formatSum } from '../../lib/format';

// Har bir bosqichda joriy order aynan QAYSI deadline maydoniga qarab
// "kechikkan/qolgan vaqt" hisoblanishini belgilaydi — checkLate funksiyasi
// bilan bir xil mantiq (NEW va PICKING ikkalasi ham pickingDeadline'ga qarab).
const DEADLINE_FIELD = { NEW: 'pickingDeadline', PICKING: 'pickingDeadline', MARKING: 'markingDeadline', CHECKING: 'checkingDeadline' };

// Bosqichda qancha vaqt qolgani/kechikkanini daqiqada hisoblaydi. IN_TRANSIT
// uchun aniq muddat (deadline) tushunchasi yo'q — shuning uchun "kechikkan"
// emas, safarga chiqqanidan/yo'lga chiqqanidan beri o'tgan vaqt ko'rsatiladi
// (informatsion, qizil emas).
function timeInfo(order, nowTs) {
  const field = DEADLINE_FIELD[order.status];
  if (field && order[field]) {
    const diffMin = Math.round((nowTs - new Date(order[field]).getTime()) / 60000);
    if (diffMin >= 0) return { late: true, minutes: diffMin, text: `${diffMin} daq kechikdi` };
    return { late: false, minutes: -diffMin, text: `${-diffMin} daq qoldi` };
  }
  if (order.status === 'IN_TRANSIT') {
    const since = order.deliveryStartedAt || order.dispatchedAt;
    if (since) {
      const elapsedMin = Math.max(0, Math.round((nowTs - new Date(since).getTime()) / 60000));
      return {
        late: false, elapsed: true, minutes: elapsedMin,
        text: order.deliveryStartedAt ? `${elapsedMin} daqiqadan beri yo'lda` : `${elapsedMin} daqiqadan beri safarga tayyor`,
      };
    }
  }
  return null;
}

function TimeInfoBadge({ order, nowTs }) {
  const info = timeInfo(order, nowTs);
  if (!info) return null;
  if (info.elapsed) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
        <Timer size={10} /> {info.text}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
      info.late ? 'text-red-600 bg-red-50' : 'text-blue-600 bg-blue-50'
    }`}>
      {info.late ? <TimerOff size={10} /> : <Timer size={10} />} {info.text}
    </span>
  );
}

// IN_TRANSIT'ni ikkiga ajratamiz — hujjatlashtirilib safarga tayyor
// (haydovchi hali yo'lga chiqmagan) va haqiqatan yo'lda (Sales sahifasidagi
// bilan bir xil mantiq, backend ham shu ikki sun'iy kalitni qaytaradi).
const STAGES = ['NEW', 'PICKING', 'MARKING', 'CHECKING', 'IN_TRANSIT_READY', 'IN_TRANSIT_ACTIVE'];
const STAGE_META = {
  NEW: { label: 'Yangi', color: '#6B7280', bg: 'bg-gray-100', text: 'text-gray-600', icon: Package },
  PICKING: { label: 'Picking', color: '#3B82F6', bg: 'bg-blue-100', text: 'text-blue-600', icon: Footprints },
  MARKING: { label: 'Marking', color: '#8B5CF6', bg: 'bg-purple-100', text: 'text-purple-600', icon: Tag },
  CHECKING: { label: 'Cheking', color: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-600', icon: CheckCircle2 },
  IN_TRANSIT_READY: { label: 'Safarga tayyor', color: '#EAB308', bg: 'bg-yellow-100', text: 'text-yellow-600', icon: Hourglass },
  IN_TRANSIT_ACTIVE: { label: "Yo'lda", color: '#F97316', bg: 'bg-orange-100', text: 'text-orange-600', icon: Truck },
};
// StagePipeline chizig'i uchun — statusning haqiqiy Order.status qiymatiga mosligi
const REAL_STATUS_ORDER = ['NEW', 'PICKING', 'MARKING', 'CHECKING', 'IN_TRANSIT'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function StagePipeline({ status, deliveryStartedAt }) {
  const currentIdx = REAL_STATUS_ORDER.indexOf(status);
  // IN_TRANSIT bosqichida ikki holatning qaysinisi ekaniga qarab rang tanlanadi
  const inTransitMeta = deliveryStartedAt ? STAGE_META.IN_TRANSIT_ACTIVE : STAGE_META.IN_TRANSIT_READY;
  const dotMeta = (s) => (s === 'IN_TRANSIT' ? inTransitMeta : STAGE_META[s]);
  return (
    <div className="flex items-center shrink-0" title={status === 'IN_TRANSIT' ? inTransitMeta.label : STAGE_META[status]?.label}>
      {REAL_STATUS_ORDER.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: i <= currentIdx ? dotMeta(s).color : '#E5E7EB' }} />
          {i < REAL_STATUS_ORDER.length - 1 && (
            <div className="w-3 h-0.5 shrink-0" style={{ background: i < currentIdx ? dotMeta(REAL_STATUS_ORDER[i + 1]).color : '#E5E7EB' }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function SuperAdminMonitoring() {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Har bir orderning "N daqiqa qoldi/kechikdi" matni jonli (ma'lumot qayta
  // so'ralmasa ham) yangilanib tursin uchun — 30s'da bir marta qayta render.
  const [nowTs, setNowTs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['monitoring', from, to, status, page],
    queryFn: () => statsAPI.getMonitoring({ from, to, status: status || undefined, page, limit }),
    select: r => r.data,
    refetchInterval: 20000,
  });

  const activeOrders = data?.data || [];
  const lateCounts = data?.lateCounts || {};
  const counts = data?.counts || {};
  const priceSummary = data?.priceSummary || { totalAmount: 0, changedCount: 0 };
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
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2">
            <Calendar size={15} className="text-blue-500 shrink-0" />
            <input
              type="date"
              value={from}
              max={to}
              onChange={e => { setFrom(e.target.value); setPage(1); }}
              className="text-sm font-bold text-gray-700 outline-none cursor-pointer bg-transparent w-[124px]"
            />
            <ArrowRight size={13} className="text-gray-300 shrink-0" />
            <input
              type="date"
              value={to}
              min={from}
              max={today()}
              onChange={e => { setTo(e.target.value); setPage(1); }}
              className="text-sm font-bold text-gray-700 outline-none cursor-pointer bg-transparent w-[124px]"
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
          const lateCount = lateCounts[s] || 0;
          return (
            <button
              key={s}
              title={lateCount > 0 ? `${lateCount} ta muddati o'tgan — bosing, ro'yxatda ko'ring` : `${meta.label} bosqichidagi orderlarni ko'rish uchun bosing`}
              onClick={() => { setStatus(prev => prev === s ? '' : s); setPage(1); }}
              className={`bg-white rounded-2xl border-2 p-4 text-left shadow-sm transition-all relative ${
                isSelected ? '' : 'border-transparent hover:border-gray-200'
              }`}
              style={isSelected ? { borderColor: meta.color } : undefined}
            >
              {lateCount > 0 && (
                <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-0.5 text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full animate-pulse">
                  <TimerOff size={9} /> {lateCount}
                </span>
              )}
              <div className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center mb-2`}>
                <Icon size={16} className={meta.text} />
              </div>
              <p className="text-2xl font-black text-gray-900">{counts[s] ?? 0}</p>
              <p className="text-xs text-gray-500 font-medium">{meta.label}</p>
              {lateCount > 0 && (
                <p className="text-[10px] text-red-500 font-bold mt-0.5">{lateCount} ta kechikkan</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Narx statistikasi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
            <Wallet size={19} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-700">{formatSum(priceSummary.totalAmount)} so'm</p>
            <p className="text-xs text-gray-500 font-medium">Tanlangan davrdagi umumiy narx</p>
          </div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle size={19} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-700">{priceSummary.changedCount}</p>
            <p className="text-xs text-gray-500 font-medium">Hujjatchi narxini o'zgartirgan orderlar</p>
          </div>
        </div>
      </div>

      {/* Active orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-black text-gray-900 text-sm">
            Faol orderlar ({data?.total ?? 0}) — {format(new Date(from + 'T00:00:00'), 'dd.MM.yyyy')}
            {from !== to && <> — {format(new Date(to + 'T00:00:00'), 'dd.MM.yyyy')}</>}
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
            {from === today() && to === today() ? "Bugun faol order yo'q" : 'Bu davrda faol order yo\'q'}
          </div>
        )}

        <div className="space-y-2.5">
          {activeOrders.map(order => {
            const info = timeInfo(order, nowTs);
            const isLate = !!info?.late;
            const meta = order.status === 'IN_TRANSIT'
              ? (order.deliveryStartedAt ? STAGE_META.IN_TRANSIT_ACTIVE : STAGE_META.IN_TRANSIT_READY)
              : STAGE_META[order.status];
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
                        <StatusBadge status={order.status} order={order} />
                        <StagePipeline status={order.status} deliveryStartedAt={order.deliveryStartedAt} />
                        <OrderChangeBadges order={order} />
                        <TimeInfoBadge order={order} nowTs={nowTs} />
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
                      {order.originalAmount != null && (
                        <p className="text-[11px] text-gray-400 line-through">{formatSum(order.originalAmount)} so'm</p>
                      )}
                      <p className={`font-black text-sm mt-0.5 ${
                        order.originalAmount != null
                          ? (order.totalAmount < order.originalAmount ? 'text-green-600' : 'text-red-600')
                          : 'text-gray-800'
                      }`}>
                        {formatSum(order.totalAmount)} so'm
                      </p>
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

