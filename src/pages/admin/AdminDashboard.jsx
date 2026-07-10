import { useQuery } from '@tanstack/react-query';
import { orderAPI, statsAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import { Package, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

function StatCard({ label, value, icon: Icon, color, sub, onClick }) {
  return (
    <div
      className={`card flex items-start gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: statsRes } = useQuery({
    queryKey: ['stats'],
    queryFn: () => statsAPI.getStats(),
    select: (r) => r.data.data,
  });

  const { data: ordersRes } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => orderAPI.getAll({ limit: 10 }),
  });

  const orders = ordersRes?.data?.data || [];
  const pendingCount = statsRes?.pendingAdminConfirm?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bosh sahifa</h1>
          <p className="text-gray-500 text-sm">{format(new Date(), 'dd.MM.yyyy')}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Jami Buyurtmalar" value={statsRes?.totalOrders} icon={Package} color="bg-blue-600" />
        <StatCard label="Mijozlar" value={statsRes?.totalClients} icon={Users} color="bg-purple-600" />
        <StatCard label="Bugungi Buyurtmalar" value={statsRes?.todayOrders} icon={Clock} color="bg-amber-500" />
        <StatCard label="Yetkazildi" value={statsRes?.completedOrders} icon={CheckCircle} color="bg-green-600" />
        <StatCard
          label="48 soatda tasdiqlanmagan"
          value={pendingCount}
          icon={AlertTriangle}
          color="bg-red-600"
          sub={pendingCount > 0 ? 'Ko\'rish uchun bosing' : undefined}
          onClick={() => navigate('/admin/overdue')}
        />
      </div>

      {/* Recent orders */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">So'nggi buyurtmalar</h2>
          <button onClick={() => navigate('/admin/orders')} className="text-blue-600 text-sm hover:underline">
            Hammasini ko'rish
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-6 py-3">Faktura</th>
                <th className="px-6 py-3">Mijoz</th>
                <th className="px-6 py-3">Summa</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Sana</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Orderlar topilmadi</td></tr>
              )}
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-sm font-medium">{order.invoiceNumber}</td>
                  <td className="px-6 py-3 text-sm">{order.client?.orgName || '—'}</td>
                  <td className="px-6 py-3 text-sm font-medium">{order.totalAmount?.toLocaleString()} so'm</td>
                  <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-6 py-3 text-sm text-gray-500">{format(new Date(order.createdAt), 'dd.MM HH:mm')}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                      className="text-blue-600 text-xs hover:underline"
                    >
                      Ko'rish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
