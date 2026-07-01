import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI, userAPI, vehicleAPI } from '../../api';
import toast from 'react-hot-toast';
import { FileSpreadsheet, Truck, CheckSquare, Square, FileCheck2, AlertTriangle } from 'lucide-react';

export default function DocumentPendingPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState([]);
  const [driverId, setDriverId] = useState('');
  const [vehicleId, setVehicleId] = useState('');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['document', 'pending'],
    queryFn: () => documentAPI.getPending(),
    select: r => r.data.data,
    refetchInterval: 15000,
  });

  const { data: drivers } = useQuery({
    queryKey: ['users', 'DRIVER'],
    queryFn: () => userAPI.getAll({ role: 'DRIVER', isActive: true }),
    select: r => r.data.data,
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles', 'active'],
    queryFn: () => vehicleAPI.getAll({ isActive: true }),
    select: r => r.data.data,
  });

  const orders = ordersData || [];
  const selectedOrders = orders.filter(o => selected.includes(o.id));
  const hasSelection = selectedOrders.length > 0;
  const allDocumented = hasSelection && selectedOrders.every(o => o.dispatchDocumentId);
  const allUndocumented = hasSelection && selectedOrders.every(o => !o.dispatchDocumentId);
  const mixed = hasSelection && !allDocumented && !allUndocumented;

  const exportMutation = useMutation({
    mutationFn: () => documentAPI.exportExcel(selected),
    onSuccess: (res) => {
      const disposition = res.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : 'hujjat.xlsx';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Hujjat yaratildi va yuklab olindi');
      qc.invalidateQueries(['document', 'pending']);
    },
    onError: async (e) => {
      const msg = e.response?.data instanceof Blob
        ? JSON.parse(await e.response.data.text()).message
        : e.response?.data?.message;
      toast.error(msg || 'Xato yuz berdi');
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => documentAPI.assignTrip({ orderIds: selected, driverId, vehicleId }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setSelected([]);
      setDriverId('');
      setVehicleId('');
      qc.invalidateQueries(['document']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    setSelected(prev => prev.length === orders.length ? [] : orders.map(o => o.id));
  };

  const totalSelectedAmount = selectedOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chekingdan o'tgan orderlar</h1>
        <p className="text-gray-500 text-sm mt-0.5">Hujjatlashtirish va safarga tayyorlash</p>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Yuklanmoqda...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-14 text-gray-400">
            <FileSpreadsheet size={40} className="mx-auto mb-3 opacity-30" />
            <p>Hujjatlashtirish uchun order yo'q</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleAll} className="text-gray-500 hover:text-indigo-600">
                    {selected.length === orders.length && orders.length > 0
                      ? <CheckSquare size={17} className="text-indigo-600" />
                      : <Square size={17} />}
                  </button>
                </th>
                <th className="px-3 py-3">№</th>
                <th className="px-4 py-3">Faktura</th>
                <th className="px-4 py-3">Shartnoma</th>
                <th className="px-4 py-3">Lot</th>
                <th className="px-4 py-3">Tashkilot nomi</th>
                <th className="px-4 py-3 text-right">Summa</th>
                <th className="px-4 py-3">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o, i) => (
                <tr
                  key={o.id}
                  onClick={() => toggleSelect(o.id)}
                  className={`cursor-pointer transition-colors ${selected.includes(o.id) ? 'bg-indigo-50/60' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(o.id)} className="text-gray-500 hover:text-indigo-600">
                      {selected.includes(o.id)
                        ? <CheckSquare size={17} className="text-indigo-600" />
                        : <Square size={17} />}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-mono font-medium">{o.invoiceNumber}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{o.contractNumber}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{o.lotNumber}</td>
                  <td className="px-4 py-3 text-sm">{o.client?.orgName}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-right">{o.totalAmount?.toLocaleString()} so'm</td>
                  <td className="px-4 py-3">
                    {o.dispatchDocumentId ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <FileCheck2 size={11} /> Hujjat № {o.dispatchDocument?.documentNumber}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Hujjatlashtirilmagan</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {mixed && (
        <div className="card flex items-center gap-3 border-amber-200 bg-amber-50 text-amber-800">
          <AlertTriangle size={18} className="shrink-0" />
          <p className="text-sm">Hujjatlashtirilgan va hujjatlashtirilmagan orderlarni birga tanlamang.</p>
        </div>
      )}

      {allUndocumented && (
        <div className="card flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">{selected.length} ta order tanlandi</p>
            <p className="text-xs text-gray-500 mt-0.5">Jami summa: {totalSelectedAmount.toLocaleString()} so'm</p>
          </div>
          <button
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            <FileSpreadsheet size={17} />
            {exportMutation.isPending ? 'Yuklanmoqda...' : "Excel'ga yuklash"}
          </button>
        </div>
      )}

      {allDocumented && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck2 size={18} className="text-green-600" />
            <h2 className="font-semibold text-gray-800">
              {selected.length} ta order hujjatlashtirilgan — safarga tayyorlash
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Haydovchi *</label>
              <select className="input" value={driverId} onChange={e => setDriverId(e.target.value)}>
                <option value="">— Haydovchi tanlang —</option>
                {(drivers || []).map(d => (
                  <option key={d.id} value={d.id}>{d.fullName} · {d.phone}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Mashina *</label>
              <select className="input" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
                <option value="">— Mashina tanlang —</option>
                {(vehicles || []).map(v => (
                  <option key={v.id} value={v.id}>{v.model} · {v.plateNumber}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => assignMutation.mutate()}
            disabled={!driverId || !vehicleId || assignMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Truck size={18} />
            {assignMutation.isPending ? 'Biriktirilmoqda...' : `${selected.length} ta orderni safarga chiqarish`}
          </button>
        </div>
      )}
    </div>
  );
}
