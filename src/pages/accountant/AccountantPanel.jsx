import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import { FILE_BASE_URL } from '../../api/axios';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, FileCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function AccountantPanel() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'accountant'],
    queryFn: () => orderAPI.getAll({ status: 'DELIVERED', limit: 100 }),
    select: r => r.data.data,
    refetchInterval: 30000,
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, step }) => orderAPI.accountantConfirm(id, step),
    onSuccess: (_, vars) => {
      toast.success(`Bugalter ${vars.step}-tasdiqlash amalga oshirildi!`);
      qc.invalidateQueries(['orders']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const orders = data || [];
  const pending1 = orders.filter(o => !o.acct1Confirmed);
  const pending2 = orders.filter(o => o.acct1Confirmed && !o.acct2Confirmed);
  const done = orders.filter(o => o.acct1Confirmed && o.acct2Confirmed);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FileCheck size={24} /> Bugalteriya Paneli
      </h1>

      {isLoading && <div className="text-gray-400">Yuklanmoqda...</div>}

      {/* 1-tasdiqlash kerak */}
      <Section
        title="1-tasdiqlash kutmoqda"
        count={pending1.length}
        color="amber"
        empty="1-tasdiqlash uchun hujjat yo'q"
      >
        {pending1.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            step={1}
            onConfirm={() => confirmMutation.mutate({ id: order.id, step: 1 })}
            isPending={confirmMutation.isPending}
          />
        ))}
      </Section>

      {/* 2-tasdiqlash kerak */}
      <Section
        title="2-tasdiqlash kutmoqda"
        count={pending2.length}
        color="blue"
        empty="2-tasdiqlash uchun hujjat yo'q"
      >
        {pending2.map(order => (
          <OrderCard
            key={order.id}
            order={order}
            step={2}
            onConfirm={() => confirmMutation.mutate({ id: order.id, step: 2 })}
            isPending={confirmMutation.isPending}
          />
        ))}
      </Section>

      {/* Tugatilgan */}
      {done.length > 0 && (
        <Section title="Tasdiqlangan" count={done.length} color="green">
          {done.slice(0, 10).map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-green-200 p-4 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-sm">#{order.orderNumber?.slice(-8)}</span>
                <span className="text-sm text-gray-600 ml-2">{order.client?.orgName}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <CheckCircle size={16} className="text-green-500" />
                <StatusBadge status={order.status} />
              </div>
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, count, color, empty, children }) {
  const colors = {
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
  };
  return (
    <div>
      <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <span className={`w-2 h-2 ${colors[color]} rounded-full`}></span>
        {title} ({count})
      </h2>
      <div className="space-y-3">
        {count === 0 && empty ? (
          <div className="text-center py-8 text-gray-400 bg-white rounded-xl border">{empty}</div>
        ) : children}
      </div>
    </div>
  );
}

function OrderCard({ order, step, onConfirm, isPending }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono font-bold">#{order.orderNumber?.slice(-8)}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="font-medium">{order.client?.orgName}</p>
          <div className="text-xs text-gray-500 mt-1 space-x-3">
            <span>Faktura: {order.invoiceNumber}</span>
            <span>Shartnoma: {order.contractNumber}</span>
            <span>Summa: {order.totalAmount?.toLocaleString()} so'm</span>
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            <Clock size={11} />
            Yetkazildi: {order.deliveredAt ? format(new Date(order.deliveredAt), 'dd.MM.yyyy HH:mm') : '—'}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${order.acct1Confirmed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <CheckCircle size={11} /> 1-tasdiqlash
            </span>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${order.acct2Confirmed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              <CheckCircle size={11} /> 2-tasdiqlash
            </span>
            {order.adminConfirmed && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                <CheckCircle size={11} /> Admin
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {order.deliveryPhotoUrl && (
            <a href={`${FILE_BASE_URL}${order.deliveryPhotoUrl}`} target="_blank" rel="noreferrer"
              className="text-xs text-blue-600 hover:underline">📸 Rasm</a>
          )}
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="btn-success flex items-center gap-2 text-sm"
          >
            <CheckCircle size={15} /> {step}-tasdiqlash
          </button>
        </div>
      </div>
    </div>
  );
}
