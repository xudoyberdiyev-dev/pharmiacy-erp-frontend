import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import { TrendingUp, ArrowUp, ArrowDown, XCircle, Calendar, ArrowRight, PieChart as PieIcon } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
} from 'recharts';

const PERIODS = [
  { value: 'week', label: 'Hafta' },
  { value: 'month', label: 'Oy' },
  { value: '3months', label: '3 oy' },
  { value: '6months', label: '6 oy' },
  { value: 'year', label: 'Yil' },
  { value: 'custom', label: 'Sana tanlash' },
];

const STATUS_META = {
  NEW: { label: 'Yangi', color: '#6B7280' },
  PICKING: { label: 'Picking', color: '#3B82F6' },
  MARKING: { label: 'Marking', color: '#8B5CF6' },
  CHECKING: { label: 'Cheking', color: '#F59E0B' },
  LOADING: { label: 'Yuklanmoqda', color: '#0EA5E9' },
  IN_TRANSIT: { label: "Yo'lda", color: '#F97316' },
  DELIVERED: { label: 'Yetkazildi', color: '#10B981' },
  CANCELLED: { label: 'Bekor qilingan', color: '#EF4444' },
};

function fmtSum(v) {
  return v.toLocaleString('uz-UZ');
}

function fmtCompact(v) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1).replace(/\.0$/, '')} mlrd`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1).replace(/\.0$/, '')} mln`;
  if (v >= 1e3) return `${Math.round(v / 1e3)} ming`;
  return String(Math.round(v));
}

function ChangeBadge({ pct }) {
  if (pct === undefined || pct === null) return null;
  if (pct === 0) return <span className="text-xs font-bold text-gray-400">o'zgarishsiz</span>;
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-black shrink-0 ${up ? 'text-green-600' : 'text-red-500'}`}>
      {up ? <ArrowUp size={12} /> : <ArrowDown size={12} />} {Math.abs(pct)}%
    </span>
  );
}

export default function SuperAdminSalesPage() {
  const [period, setPeriod] = useState('month');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['sales-stats', period, customRange],
    queryFn: () => statsAPI.getSales(
      period === 'custom'
        ? (customRange.start && customRange.end ? { period, startDate: customRange.start, endDate: customRange.end } : { period: 'month' })
        : { period }
    ),
    select: (r) => r.data.data,
  });

  const buckets = data?.buckets || [];
  const comparison = data?.comparison || {};
  const statusBreakdown = data?.statusBreakdown || [];
  const cancelledCount = data?.cancelledCount || 0;

  const totalOrders = buckets.reduce((s, b) => s + b.orderCount, 0);
  const totalAmount = buckets.reduce((s, b) => s + b.totalAmount, 0);
  const avgOrder = totalOrders > 0 ? Math.round(totalAmount / totalOrders) : 0;
  const totalStatusOrders = statusBreakdown.reduce((s, x) => s + x.count, 0);
  const cancelledPct = totalStatusOrders > 0 ? Math.round((cancelledCount / totalStatusOrders) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-green-100 rounded-2xl flex items-center justify-center">
            <TrendingUp size={18} className="text-green-600" />
          </div>
          Sotuv statistikasi
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === p.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2">
              <Calendar size={15} className="text-blue-500 shrink-0" />
              <input
                type="date"
                className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer w-[124px]"
                value={customRange.start}
                onChange={(e) => setCustomRange((p) => ({ ...p, start: e.target.value }))}
              />
              <ArrowRight size={13} className="text-gray-300 shrink-0" />
              <input
                type="date"
                className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer w-[124px]"
                value={customRange.end}
                onChange={(e) => setCustomRange((p) => ({ ...p, end: e.target.value }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI qatori — o'sish/pasayish oldingi shu uzunlikdagi davrga solishtirilgan */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-3xl font-black text-blue-600">{totalOrders}</p>
            <ChangeBadge pct={comparison.orderCountChangePct} />
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Yetkazilgan orderlar</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-2xl font-black text-green-600">{fmtSum(totalAmount)}</p>
            <ChangeBadge pct={comparison.totalAmountChangePct} />
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Jami summa (so'm)</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4">
          <p className="text-2xl font-black text-amber-600">{fmtSum(avgOrder)}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">O'rtacha order summasi</p>
        </div>
      </div>

      {/* Savdo dinamikasi — order soni + summa birgalikda */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-black text-gray-900 text-sm mb-1">Savdo dinamikasi</h2>
        <p className="text-xs text-gray-400 mb-3">Order soni (ustunlar) va savdo summasi (chiziq) vaqt bo'yicha</p>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center text-gray-400 text-sm">Yuklanmoqda...</div>
        ) : buckets.every((b) => b.orderCount === 0) ? (
          <div className="h-80 flex items-center justify-center text-gray-400 text-sm">Bu davr uchun ma'lumot yo'q</div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <ComposedChart data={buckets} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
              <Tooltip
                formatter={(value, name) => name === 'totalAmount' ? [`${fmtSum(value)} so'm`, 'Summa'] : [value, 'Orderlar']}
                labelStyle={{ fontWeight: 700, color: '#111827' }}
                contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', fontSize: 12 }}
              />
              <Legend formatter={(v) => (v === 'orderCount' ? 'Orderlar' : 'Summa')} wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="orderCount" name="orderCount" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" dataKey="totalAmount" name="totalAmount" stroke="#10B981" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Holat taqsimoti va bekor qilinganlar */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
              <PieIcon size={17} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-sm">Buyurtmalar holati taqsimoti</h2>
              <p className="text-xs text-gray-400">Tanlangan davrda yaratilgan orderlar bo'yicha</p>
            </div>
          </div>
          {isLoading ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Yuklanmoqda...</div>
          ) : statusBreakdown.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">Ma'lumot yo'q</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                    {statusBreakdown.map((s) => (
                      <Cell key={s.status} fill={STATUS_META[s.status]?.color || '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, props) => [`${value} ta`, STATUS_META[props.payload.status]?.label || props.payload.status]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #F1F5F9', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusBreakdown.map((s) => (
                  <div key={s.status} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_META[s.status]?.color || '#94A3B8' }} />
                    <span className="flex-1 font-bold text-gray-600 truncate">{STATUS_META[s.status]?.label || s.status}</span>
                    <span className="font-black text-gray-800">{s.count} ta</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-3">
            <XCircle size={26} className="text-red-500" />
          </div>
          <p className="text-3xl font-black text-red-500">{cancelledCount}</p>
          <p className="text-sm text-gray-700 font-bold mt-1">Bekor qilingan orderlar</p>
          <p className="text-xs text-gray-400 mt-2">
            Tanlangan davrdagi {totalStatusOrders} ta orderning {cancelledPct}% i bekor qilingan
          </p>
        </div>
      </div>
    </div>
  );
}
