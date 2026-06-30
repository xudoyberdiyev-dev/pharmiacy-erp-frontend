import { useQuery } from '@tanstack/react-query';
import { orderAPI, clientAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { Package, Users, Clock, CheckCircle, AlertCircle, Plus, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const STATUS_GROUPS = [
  { status: 'NEW', label: 'Yangi', color: 'bg-gray-500' },
  { status: 'PICKING', label: 'Picking', color: 'bg-blue-500' },
  { status: 'MARKING', label: 'Marking', color: 'bg-purple-500' },
  { status: 'CHECKING', label: 'Cheking', color: 'bg-amber-500' },
  { status: 'IN_TRANSIT', label: "Yo'lda", color: 'bg-orange-500' },
  { status: 'DELIVERED', label: 'Yetkazildi', color: 'bg-green-500' },
];

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function OperatorPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: ordersRes, isLoading } = useQuery({
    queryKey: ['orders', 'operator'],
    queryFn: () => orderAPI.getAll({ limit: 50 }),
    refetchInterval: 20000,
  });

  const { data: clientsRes } = useQuery({
    queryKey: ['clients', 'count'],
    queryFn: () => clientAPI.getAll({ limit: 1 }),
  });

  const orders = ordersRes?.data?.data || [];
  const total = ordersRes?.data?.total || 0;
  const totalClients = clientsRes?.data?.total || 0;

  const byStatus = STATUS_GROUPS.reduce((acc, g) => {
    acc[g.status] = orders.filter(o => o.status === g.status).length;
    return acc;
  }, {});

  const lateOrders = orders.filter(o => {
    const now = new Date();
    if (o.status === 'NEW' || o.status === 'PICKING') return o.pickingDeadline && new Date(o.pickingDeadline) < now;
    if (o.status === 'MARKING') return o.markingDeadline && new Date(o.markingDeadline) < now;
    if (o.status === 'CHECKING') return o.checkingDeadline && new Date(o.checkingDeadline) < now;
    return false;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operator paneli</h1>
          <p className="text-gray-500 text-sm mt-0.5">Xush kelibsiz, {user?.fullName}</p>
        </div>
        <button
          onClick={() => navigate('/operator/orders/new')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Yangi order
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Jami orderlar" value={total} icon={Package} color="bg-blue-600" />
        <StatCard label="Klientlar" value={totalClients} icon={Users} color="bg-purple-600" />
        <StatCard label="Kechikkan" value={lateOrders.length} icon={AlertCircle} color="bg-red-500" />
        <StatCard label="Yetkazildi" value={byStatus['DELIVERED']} icon={CheckCircle} color="bg-green-600" />
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {STATUS_GROUPS.map(({ status, label, color }) => (
          <div key={status} className="bg-white rounded-xl border p-3 text-center shadow-sm">
            <div className={`w-2.5 h-2.5 rounded-full ${color} mx-auto mb-1.5`} />
            <p className="text-xl font-bold text-gray-900">{byStatus[status] ?? 0}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Kechikkan orderlar */}
      {lateOrders.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
            <AlertCircle size={17} /> Kechikayotgan orderlar ({lateOrders.length})
          </h2>
          <div className="space-y-2">
            {lateOrders.map(o => (
              <div key={o.id} className="bg-white rounded-lg border border-red-200 p-3 flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-bold">#{o.orderNumber?.slice(-8)}</span>
                  <span className="text-sm text-gray-600 ml-2">{o.client?.orgName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <button
                    onClick={() => navigate(`/operator/orders/${o.id}`)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* So'nggi orderlar */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">So'nggi orderlar</h2>
          <button
            onClick={() => navigate('/operator/orders')}
            className="text-blue-600 text-sm hover:underline"
          >
            Hammasini ko'rish
          </button>
        </div>
        {isLoading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Yuklanmoqda...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                  <th className="px-6 py-3">Order #</th>
                  <th className="px-6 py-3">Klient</th>
                  <th className="px-6 py-3">Summa</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Pick deadline</th>
                  <th className="px-6 py-3">Sana</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-400">Orderlar topilmadi</td></tr>
                )}
                {orders.map(order => {
                  const isLate = lateOrders.some(l => l.id === order.id);
                  return (
                    <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${isLate ? 'bg-red-50/50' : ''}`}>
                      <td className="px-6 py-3 font-mono text-sm font-bold">
                        {order.orderNumber?.slice(-8)}
                        {isLate && <span className="ml-1 text-red-500 text-xs">⚠</span>}
                      </td>
                      <td className="px-6 py-3 text-sm max-w-[130px] truncate">{order.client?.orgName}</td>
                      <td className="px-6 py-3 text-sm font-medium">{order.totalAmount?.toLocaleString()}</td>
                      <td className="px-6 py-3"><StatusBadge status={order.status} /></td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {order.pickingDeadline ? format(new Date(order.pickingDeadline), 'dd.MM HH:mm') : '—'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {format(new Date(order.createdAt), 'dd.MM HH:mm')}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => navigate(`/operator/orders/${order.id}`)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
