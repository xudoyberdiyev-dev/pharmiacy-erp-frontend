import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import AccountantOrderDetailModal from './components/AccountantOrderDetailModal';
import { FileCheck, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function BugalterPanelOne() {
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'accountant', 1],
    queryFn: () => orderAPI.getAll({ status: 'DELIVERED', acct1Confirmed: false, limit: 100 }),
    select: (r) => r.data.data,
    refetchInterval: 30000,
  });

  const orders = data || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-2xl flex items-center justify-center">
            <FileCheck size={18} className="text-amber-600" />
          </div>
          Bugalteriya — 1-tasdiqlash
        </h1>
        <p className="text-xs text-gray-400 mt-1 ml-12">Yetkazilgan orderlarni birinchi bo'lib tekshiring va tasdiqlang</p>
      </div>

      <div className="bg-amber-50 rounded-2xl p-4 w-fit min-w-[180px]">
        <p className="text-3xl font-black text-amber-600">{orders.length}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">Tasdiqlash kutmoqda</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <FileCheck size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm font-semibold">1-tasdiqlash uchun order yo'q</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-6 py-3">Faktura</th>
                <th className="px-6 py-3">Mijoz</th>
                <th className="px-6 py-3">Shartnoma</th>
                <th className="px-6 py-3">Summa</th>
                <th className="px-6 py-3">Yetkazilgan sana</th>
                <th className="px-6 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-mono font-bold text-sm text-gray-900">{o.invoiceNumber}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{o.client?.orgName}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{o.contractNumber}</td>
                  <td className="px-6 py-3 text-sm font-bold text-gray-800">{o.totalAmount?.toLocaleString()} so'm</td>
                  <td className="px-6 py-3 text-xs text-gray-400">{o.deliveredAt ? format(new Date(o.deliveredAt), 'dd.MM.yyyy HH:mm') : '—'}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => setSelected(o)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                    >
                      <Eye size={13} /> Batafsil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <AccountantOrderDetailModal order={selected} step={1} onClose={() => setSelected(null)} />}
    </div>
  );
}
