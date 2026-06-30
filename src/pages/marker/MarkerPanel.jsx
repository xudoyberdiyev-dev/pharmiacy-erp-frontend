import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { Upload, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const ETIROV_REASONS = [
  { value: 'WRONG_SERIES', label: 'Seriya raqami noto\'g\'ri' },
  { value: 'WRONG_QUANTITY', label: 'Miqdori noto\'g\'ri' },
  { value: 'DAMAGED', label: 'Mahsulot shikastlangan' },
  { value: 'WRONG_PRODUCT', label: 'Boshqa mahsulot keltirilgan' },
  { value: 'OTHER', label: 'Boshqa sabab' },
];

function EtirovModal({ orderId, onClose }) {
  const qc = useQueryClient();
  const [type, setType] = useState('');
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () => orderAPI.submitEtirov(orderId, { type, comment }),
    onSuccess: () => {
      toast.success('Etiroz yuborildi, order picking paneliga qaytdi');
      qc.invalidateQueries(['orders']);
      onClose();
    },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            <h2 className="font-semibold">Etiroz bildirish</h2>
          </div>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">Sabab tanlang *</label>
            <div className="space-y-2">
              {ETIROV_REASONS.map(r => (
                <label key={r.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${type === r.value ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="etirov" value={r.value} checked={type === r.value} onChange={e => setType(e.target.value)} className="text-red-600" />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
          </div>
          {type === 'OTHER' || !type ? (
            <div>
              <label className="label">Qo'shimcha izoh</label>
              <textarea className="input resize-none" rows={3} placeholder="Batafsil yozing..." value={comment} onChange={e => setComment(e.target.value)} />
            </div>
          ) : null}
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
          <button onClick={() => mutation.mutate()} disabled={!type || mutation.isPending} className="btn-danger flex-1">
            {mutation.isPending ? 'Yuborilmoqda...' : 'Etiroz yuborish'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarkerPanel() {
  const qc = useQueryClient();
  const [etirovOrderId, setEtirovOrderId] = useState(null);
  const [files, setFiles] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['orders', 'marking'],
    queryFn: () => orderAPI.getAll({ status: 'MARKING', limit: 50 }),
    select: r => r.data.data,
    refetchInterval: 15000,
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, skipExcel }) => {
      const fd = new FormData();
      if (files[id]) fd.append('markedExcel', files[id]);
      fd.append('skipExcel', skipExcel ? 'true' : 'false');
      return orderAPI.completeMarking(id, fd);
    },
    onSuccess: () => { toast.success('Marking yakunlandi!'); qc.invalidateQueries(['orders']); },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const orders = data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Marking Panel</h1>

      {isLoading && <div className="text-gray-400">Yuklanmoqda...</div>}

      {!isLoading && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border">Marking uchun order yo'q</div>
      )}

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold">#{order.orderNumber?.slice(-8)}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="font-medium">{order.client?.orgName}</p>
                <div className="text-xs text-gray-500 mt-1 space-x-3">
                  <span>Faktura: {order.invoiceNumber}</span>
                  <span>Lot: {order.lotNumber}</span>
                  <span>Shartnoma: {order.contractNumber}</span>
                </div>
                <p className="text-sm font-semibold mt-1">{order.totalAmount?.toLocaleString()} so'm</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Mark deadline: {order.markingDeadline ? format(new Date(order.markingDeadline), 'dd.MM HH:mm') : '—'}
                </p>
              </div>
              {order.productsExcelUrl && (
                <a href={`http://localhost:5000${order.productsExcelUrl}`} className="text-blue-600 text-sm hover:underline" target="_blank" rel="noreferrer">
                  📥 Mahsulotlar
                </a>
              )}
            </div>

            {/* Excel yuklash */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Marked Excel yuklash</p>
              {files[order.id] ? (
                <div className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm text-green-700 flex-1">{files[order.id].name}</span>
                  <button onClick={() => setFiles(p => ({ ...p, [order.id]: null }))}><X size={15} className="text-green-500" /></button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 text-sm text-gray-500">
                  <Upload size={16} /> Excel yuklash
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setFiles(p => ({ ...p, [order.id]: e.target.files[0] }))} />
                </label>
              )}
            </div>

            {/* Tugmalar */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEtirovOrderId(order.id)}
                className="btn-danger flex items-center gap-2 text-sm"
              >
                <AlertTriangle size={15} /> Etiroz bildirish
              </button>
              <button
                onClick={() => completeMutation.mutate({ id: order.id, skipExcel: true })}
                disabled={completeMutation.isPending}
                className="btn-secondary text-sm"
              >
                Excel yuklamasdan
              </button>
              <button
                onClick={() => completeMutation.mutate({ id: order.id, skipExcel: false })}
                disabled={completeMutation.isPending}
                className="btn-success flex items-center gap-2 text-sm flex-1"
              >
                <CheckCircle size={15} /> Tasdiqlash
              </button>
            </div>
          </div>
        ))}
      </div>

      {etirovOrderId && (
        <EtirovModal orderId={etirovOrderId} onClose={() => setEtirovOrderId(null)} />
      )}
    </div>
  );
}
