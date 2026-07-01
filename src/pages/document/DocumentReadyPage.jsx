import { useQuery } from '@tanstack/react-query';
import { documentAPI } from '../../api';
import { Truck, User2, FileCheck2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentReadyPage() {
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['document', 'ready'],
    queryFn: () => documentAPI.getReady(),
    select: r => r.data.data,
    refetchInterval: 15000,
  });

  const orders = ordersData || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Safarga tayyor orderlar</h1>
        <p className="text-gray-500 text-sm mt-0.5">Haydovchi va mashinaga biriktirilgan, yo'lda</p>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Yuklanmoqda...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <Truck size={40} className="mx-auto mb-3 opacity-30" />
            <p>Safarga tayyorlangan order yo'q</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-4 py-3">Faktura</th>
                <th className="px-4 py-3">Tashkilot nomi</th>
                <th className="px-4 py-3">Hujjat №</th>
                <th className="px-4 py-3">Haydovchi</th>
                <th className="px-4 py-3">Mashina</th>
                <th className="px-4 py-3">Chiqqan vaqti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono font-medium">{o.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm">{o.client?.orgName}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      <FileCheck2 size={11} /> № {o.dispatchDocument?.documentNumber ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      <User2 size={13} className="text-gray-400" />
                      {o.driver?.fullName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {o.vehicle?.model} · {o.vehicle?.plateNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {o.dispatchedAt ? format(new Date(o.dispatchedAt), 'dd.MM.yyyy HH:mm') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
