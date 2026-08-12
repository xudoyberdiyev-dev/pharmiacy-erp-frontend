import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import { BarChart3, Users, Package, Clock, CheckCircle, AlertCircle, TrendingUp, ChevronRight, Trophy, MapPinned, Footprints, Tag, CheckCircle2, Truck, Calendar, ArrowRight, X, FileCheck, Hourglass, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { regionLabel } from '../../utils/regions';
import OrderDetailModal from './components/OrderDetailModal';
import { formatSum } from '../../lib/format';

function StatCard({ label, value, icon: Icon, color, alert, onClick }) {
  const clickable = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`bg-white rounded-xl border p-5 shadow-sm flex items-start gap-4 text-left w-full transition-all ${
        alert ? 'border-red-300 bg-red-50' : ''
      } ${clickable ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : 'cursor-default'}`}
    >
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      {clickable && <ChevronRight size={18} className="text-gray-300 mt-1" />}
    </button>
  );
}

const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#06B6D4', '#EC4899', '#6366F1', '#84CC16', '#F97316', '#14B8A6', '#A855F7', '#EAB308', '#64748B'];
const RANK_COLORS = ['bg-amber-400', 'bg-slate-400', 'bg-orange-400'];
const CLIENT_PERIODS = [{ value: 'week', label: 'Hafta' }, { value: 'month', label: 'Oy' }];

function rankColor(i) {
  return RANK_COLORS[i] || 'bg-blue-500';
}

function fmtCompact(v) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, '')} mlrd`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')} mln`;
  if (v >= 1e3) return `${Math.round(v / 1e3)} ming`;
  return String(Math.round(v));
}

export default function SuperAdminStats() {
  const [range, setRange] = useState({ start: '', end: '' });
  const [activeCategory, setActiveCategory] = useState(null);
  const [clientPeriod, setClientPeriod] = useState('week');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stats', range],
    queryFn: () => statsAPI.getStats(range.start && range.end ? { startDate: range.start, endDate: range.end } : {}),
    select: r => r.data.data,
  });

  const { data: topClients, isLoading: topClientsLoading } = useQuery({
    queryKey: ['top-clients', clientPeriod],
    queryFn: () => statsAPI.getTopClients({ limit: 10, period: clientPeriod }),
    select: r => r.data.data,
  });

  const { data: regional, isLoading: regionalLoading } = useQuery({
    queryKey: ['regional-stats'],
    queryFn: () => statsAPI.getRegional(),
    select: r => r.data.data,
  });

  const { data: acctStats, isLoading: acctLoading } = useQuery({
    queryKey: ['accountant-stats'],
    queryFn: () => statsAPI.getAccountantStats(),
    select: r => r.data.data,
  });

  const s = data || {};
  const maxClientAmount = Math.max(1, ...(topClients || []).map(c => c.totalAmount));
  const totalRegionalAmount = (regional || []).reduce((sum, r) => sum + r.totalAmount, 0);
  const maxRegionalAmount = Math.max(1, ...(regional || []).map(r => r.totalAmount));

  const hasRange = !!(range.start || range.end);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
              <BarChart3 size={18} className="text-blue-600" />
            </div>
            Statistika
          </h1>
          <p className="text-xs text-gray-400 mt-1 ml-12">Umumiy ko'rsatkichlar, xodimlar samaradorligi va savdo tahlili</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2">
            <Calendar size={15} className="text-blue-500 shrink-0" />
            <input
              type="date"
              className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer w-[124px]"
              value={range.start}
              onChange={e => setRange(p => ({ ...p, start: e.target.value }))}
            />
            <ArrowRight size={13} className="text-gray-300 shrink-0" />
            <input
              type="date"
              className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer w-[124px]"
              value={range.end}
              onChange={e => setRange(p => ({ ...p, end: e.target.value }))}
            />
          </div>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shrink-0"
          >
            Ko'rish
          </button>
          {hasRange && (
            <button
              onClick={() => setRange({ start: '', end: '' })}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
            >
              <X size={14} /> Tozalash
            </button>
          )}
        </div>
      </div>

      {/* Stat cards — bosilganda tegishli orderlar ro'yxati ochiladi */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Jami klientlar" value={s.totalClients} icon={Users} color="bg-purple-600" />
        <StatCard label="Bugungi orderlar" value={s.todayOrders} icon={Package} color="bg-blue-600" onClick={() => setActiveCategory('today')} />
        <StatCard label="Yetkazildi" value={s.completedOrders} icon={CheckCircle} color="bg-green-600" onClick={() => setActiveCategory('delivered')} />
        <StatCard label="Kechikkan orderlar" value={s.lateOrders} icon={AlertCircle} color="bg-red-600" alert={s.lateOrders > 0} onClick={() => setActiveCategory('late')} />
        <StatCard label="Jami orderlar" value={s.totalOrders} icon={TrendingUp} color="bg-gray-600" onClick={() => setActiveCategory('total')} />
        <StatCard label="48s tasdiqlanmagan" value={s.pendingAdminConfirmOverdueCount} icon={Clock} color="bg-amber-500" alert={s.pendingAdminConfirmOverdueCount > 0} onClick={() => setActiveCategory('pending48')} />
      </div>

      {activeCategory && (
        <OrderDetailModal category={activeCategory} range={range} onClose={() => setActiveCategory(null)} />
      )}

      {/* Bugalteriya tasdiqlash statistikasi */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <FileCheck size={17} className="text-amber-600" />
          </div>
          <div>
            <h2 className="font-black text-gray-900 text-sm">Bugalteriya tasdiqlash holati</h2>
            <p className="text-xs text-gray-400">Yetkazilgan orderlar 1- va 2-tasdiqlash bosqichlarida qayerda turibdi</p>
          </div>
        </div>
        {acctLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-amber-50 rounded-xl p-3.5 flex items-center gap-3">
              <Hourglass size={18} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-xl font-black text-amber-700">{acctStats?.acct1Pending ?? 0}</p>
                <p className="text-[11px] text-gray-500 font-medium">1-tasdiq kutmoqda</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3.5 flex items-center gap-3">
              <CheckCircle size={18} className="text-blue-600 shrink-0" />
              <div>
                <p className="text-xl font-black text-blue-700">{acctStats?.acct1Confirmed ?? 0}</p>
                <p className="text-[11px] text-gray-500 font-medium">1-tasdiq bajarilgan</p>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-3.5 flex items-center gap-3">
              <Hourglass size={18} className="text-blue-600 shrink-0" />
              <div>
                <p className="text-xl font-black text-blue-700">{acctStats?.acct2Pending ?? 0}</p>
                <p className="text-[11px] text-gray-500 font-medium">2-tasdiq kutmoqda</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-3.5 flex items-center gap-3">
              <ShieldCheck size={18} className="text-green-600 shrink-0" />
              <div>
                <p className="text-xl font-black text-green-700">{acctStats?.fullyConfirmed ?? 0}</p>
                <p className="text-[11px] text-gray-500 font-medium">To'liq tasdiqlangan</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top mijozlar va hudud taqsimoti */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                <Trophy size={17} className="text-amber-600" />
              </div>
              <div>
                <h2 className="font-black text-gray-900 text-sm">Top 10 mijozlar</h2>
                <p className="text-xs text-gray-400">Eng ko'p buyurtma bergan mijozlar</p>
              </div>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {CLIENT_PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setClientPeriod(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    clientPeriod === p.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {topClientsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
            </div>
          ) : !topClients || topClients.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Bu davrda yetkazilgan order yo'q
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topClients.map((c, i) => {
                const pct = Math.round((c.totalAmount / maxClientAmount) * 100);
                return (
                  <div key={c.client?.id || i} className="flex items-center gap-3 py-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${rankColor(i)}`}>
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-sm truncate">{c.client?.orgName || "Noma'lum"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden max-w-[160px]">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] text-gray-400 shrink-0">{c.orderCount} ta order</span>
                      </div>
                    </div>
                    <span className="text-sm font-black text-green-600 shrink-0">{formatSum(c.totalAmount)} so'm</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
              <MapPinned size={17} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-sm">Hudud bo'yicha savdo taqsimoti</h2>
              <p className="text-xs text-gray-400">Klient manzili (lat/long) bo'yicha aniqlangan</p>
            </div>
          </div>

          {regionalLoading ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Yuklanmoqda...</div>
          ) : !regional || regional.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Ma'lumot yo'q</div>
          ) : (
            <>
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={regional}
                      dataKey="totalAmount"
                      nameKey="region"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {regional.map((entry, i) => (
                        <Cell key={entry.region} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, _name, props) => [
                        `${formatSum(value)} so'm`,
                        regionLabel(props.payload.region),
                      ]}
                      contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-lg font-black text-gray-900">{fmtCompact(totalRegionalAmount)}</p>
                  <p className="text-[10px] text-gray-400">jami savdo</p>
                </div>
              </div>

              <div className="mt-2 space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {regional.map((r, i) => {
                  const pct = Math.round((r.totalAmount / maxRegionalAmount) * 100);
                  return (
                    <div key={r.region} className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs font-bold text-gray-700 w-28 truncate shrink-0">{regionLabel(r.region)}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                      <span className="text-xs font-bold text-gray-500 w-24 text-right shrink-0">{formatSum(r.totalAmount)} so'm</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Xodimlar samaradorligi — eng yaxshi va eng ko'p kechikkanlar */}
      <div className="grid md:grid-cols-2 gap-4">
        <PerformerCard
          icon={Footprints}
          color={ROLE_COLORS.picker}
          title="Pickerlar samaradorligi"
          subtitle="Yetkazilgan orderlar bo'yicha; kechikkan = pick muddatidan keyin yakunlagan"
          entries={s.topPickers}
          slowEntries={s.slowPickers}
        />
        <PerformerCard
          icon={Tag}
          color={ROLE_COLORS.marker}
          title="Markerlar samaradorligi"
          subtitle="Yetkazilgan orderlar bo'yicha; kechikkan = marking muddatidan keyin yakunlagan"
          entries={s.topMarkers}
          slowEntries={s.slowMarkers}
        />
        <PerformerCard
          icon={CheckCircle2}
          color={ROLE_COLORS.checker}
          title="Checkerlar samaradorligi"
          subtitle="Yetkazilgan orderlar bo'yicha; kechikkan = cheking muddatidan keyin yakunlagan"
          entries={s.topCheckers}
          slowEntries={s.slowCheckers}
        />
        <PerformerCard
          icon={Truck}
          color={ROLE_COLORS.driver}
          title="Driverlar samaradorligi"
          subtitle="Yetkazilgan orderlar soni bo'yicha"
          entries={s.topDrivers}
        />
      </div>
    </div>
  );
}

const ROLE_COLORS = {
  picker:  { bg: 'bg-blue-100',   text: 'text-blue-600',   bar: 'bg-blue-500' },
  marker:  { bg: 'bg-purple-100', text: 'text-purple-600', bar: 'bg-purple-500' },
  checker: { bg: 'bg-amber-100',  text: 'text-amber-600',  bar: 'bg-amber-500' },
  driver:  { bg: 'bg-green-100',  text: 'text-green-600',  bar: 'bg-green-500' },
};

function PerformerCard({ icon: Icon, color, title, subtitle, entries, slowEntries }) {
  const top = entries || [];
  const slow = slowEntries || [];
  const maxCount = Math.max(1, ...top.map((p) => p.count));
  const maxLate = Math.max(1, ...slow.map((p) => p.lateCount));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 ${color.bg} rounded-2xl flex items-center justify-center shrink-0`}>
          <Icon size={17} className={color.text} />
        </div>
        <div>
          <h2 className="font-black text-gray-900 text-sm">{title}</h2>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>

      {top.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">Ma'lumot yo'q</p>
      ) : (
        <div className="space-y-2.5">
          {top.map((p, i) => {
            const pct = Math.round((p.count / maxCount) * 100);
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 ${rankColor(i)}`}>
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.user?.fullName || '—'}</p>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-1 max-w-[140px]">
                    <div className={`h-full rounded-full ${color.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className={`text-sm font-black ${color.text} shrink-0`}>{p.count} ta</span>
              </div>
            );
          })}
        </div>
      )}

      {slow.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
            <AlertCircle size={12} /> Ko'p kechikkanlar
          </p>
          <div className="space-y-2.5">
            {slow.map((p, i) => {
              const pct = Math.round((p.lateCount / maxLate) * 100);
              const ratio = Math.round((p.lateCount / p.count) * 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-red-100 text-red-600 text-xs font-black shrink-0">
                    !
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{p.user?.fullName || '—'}</p>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mt-1 max-w-[140px]">
                      <div className="h-full rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-red-600">{p.lateCount} ta kech</p>
                    <p className="text-[10px] text-gray-400">{p.count} tadan {ratio}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
