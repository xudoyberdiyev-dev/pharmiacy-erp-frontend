import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import { BarChart3, Users, Package, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, alert }) {
  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm flex items-start gap-4 ${alert ? 'border-red-300 bg-red-50' : ''}`}>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function SuperAdminStats() {
  const [range, setRange] = useState({ start: '', end: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['stats', range],
    queryFn: () => statsAPI.getStats(range.start && range.end ? { startDate: range.start, endDate: range.end } : {}),
    select: r => r.data.data,
  });

  const s = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 size={24} /> Statistika</h1>
        <div className="flex items-center gap-2">
          <input type="date" className="input w-40 text-sm" value={range.start} onChange={e => setRange(p => ({ ...p, start: e.target.value }))} />
          <span className="text-gray-400">—</span>
          <input type="date" className="input w-40 text-sm" value={range.end} onChange={e => setRange(p => ({ ...p, end: e.target.value }))} />
          <button onClick={() => refetch()} className="btn-primary text-sm">Ko'rish</button>
          <button onClick={() => setRange({ start: '', end: '' })} className="btn-secondary text-sm">Tozalash</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Jami klientlar" value={s.totalClients} icon={Users} color="bg-purple-600" />
        <StatCard label="Bugungi orderlar" value={s.todayOrders} icon={Package} color="bg-blue-600" />
        <StatCard label="Yetkazildi" value={s.completedOrders} icon={CheckCircle} color="bg-green-600" />
        <StatCard label="Kechikkan orderlar" value={s.lateOrders} icon={AlertCircle} color="bg-red-600" alert={s.lateOrders > 0} />
        <StatCard label="Jami orderlar" value={s.totalOrders} icon={TrendingUp} color="bg-gray-600" />
        <StatCard label="48s tasdiqlanmagan" value={s.pendingAdminConfirm?.length} icon={Clock} color="bg-amber-500" alert={s.pendingAdminConfirm?.length > 0} />
      </div>

      {/* 48 soat tasdiqlanmaganlar */}
      {s.pendingAdminConfirm?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertCircle size={18} /> 48 soat ichida tasdiqlanmagan orderlar
          </h2>
          <div className="space-y-2">
            {s.pendingAdminConfirm.map(o => (
              <div key={o.id} className="flex items-center justify-between bg-white rounded-lg border border-red-200 p-3">
                <div>
                  <span className="font-mono text-sm font-bold">#{o.orderNumber?.slice(-8)}</span>
                  <span className="text-sm text-gray-600 ml-2">{o.client?.orgName}</span>
                </div>
                <span className="text-xs text-gray-500">{o.driver?.fullName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top performers */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-semibold mb-4">🏃 Eng faol pickerlar</h2>
          {(s.topPickers || []).length === 0 ? (
            <p className="text-gray-400 text-sm">Ma'lumot yo'q</p>
          ) : (
            <div className="space-y-2">
              {s.topPickers.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                    <span className="text-sm">{p.user?.fullName || '—'}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-4">🚗 Eng faol driverlar</h2>
          {(s.topDrivers || []).length === 0 ? (
            <p className="text-gray-400 text-sm">Ma'lumot yo'q</p>
          ) : (
            <div className="space-y-2">
              {s.topDrivers.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                    <span className="text-sm">{d.user?.fullName || '—'}</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{d.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
