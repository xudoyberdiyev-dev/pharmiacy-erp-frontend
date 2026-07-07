import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../../api';
import { FILE_BASE_URL } from '../../../api/axios';
import toast from 'react-hot-toast';
import Modal from '../../../components/shared/Modal';
import StatusBadge from '../../../components/shared/StatusBadge';
import { CheckCircle2, FileSpreadsheet, Image, Clock } from 'lucide-react';
import { format } from 'date-fns';

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-gray-800 truncate">{value ?? '—'}</p>
    </div>
  );
}

export default function AccountantOrderDetailModal({ order, step, onClose }) {
  const qc = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: () => orderAPI.accountantConfirm(order.id),
    onSuccess: () => {
      toast.success(`${step}-tasdiqlash amalga oshirildi!`);
      qc.invalidateQueries({ queryKey: ['orders', 'accountant'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  return (
    <Modal title={`Order ${order.invoiceNumber}`} onClose={onClose} wide>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <StatusBadge status={order.status} />
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${order.acct1Confirmed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          <CheckCircle2 size={12} /> 1-tasdiqlash
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${order.acct2Confirmed ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          <CheckCircle2 size={12} /> 2-tasdiqlash
        </span>
        {order.adminConfirmed && (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
            <CheckCircle2 size={12} /> Admin tasdiqlagan
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl mb-4">
        <InfoRow label="Mijoz" value={order.client?.orgName} />
        <InfoRow label="Manzil" value={order.client?.address} />
        <InfoRow label="Shartnoma" value={order.contractNumber} />
        <InfoRow label="Lot" value={order.lotNumber} />
        <InfoRow label="Faktura" value={order.invoiceNumber} />
        <InfoRow label="Summasi" value={`${order.totalAmount?.toLocaleString()} so'm`} />
        <InfoRow label="Haydovchi" value={order.driver?.fullName} />
        <InfoRow label="Mashina" value={order.vehicle ? `${order.vehicle.plateNumber} · ${order.vehicle.model}` : '—'} />
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <Clock size={12} />
        Yetkazildi: {order.deliveredAt ? format(new Date(order.deliveredAt), 'dd.MM.yyyy HH:mm') : '—'}
      </div>

      {/* Excel va rasm fayllar */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Fayllar</p>
        {order.productsExcelUrl ? (
          <a
            href={`${FILE_BASE_URL}${order.productsExcelUrl}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-green-50 hover:bg-green-100 transition-colors rounded-xl px-3.5 py-2.5 text-sm font-bold text-green-700"
          >
            <FileSpreadsheet size={16} /> Order Excel faylini yuklab olish
          </a>
        ) : (
          <p className="text-xs text-gray-400 px-1">Order Excel fayli yuklanmagan</p>
        )}
        {order.markedExcelUrl ? (
          <a
            href={`${FILE_BASE_URL}${order.markedExcelUrl}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 transition-colors rounded-xl px-3.5 py-2.5 text-sm font-bold text-purple-700"
          >
            <FileSpreadsheet size={16} /> Marking Excel faylini yuklab olish
          </a>
        ) : (
          <p className="text-xs text-gray-400 px-1">Marking Excel fayli yuklanmagan</p>
        )}
        {order.deliveryPhotoUrls?.map((url, i) => (
          <a
            key={url}
            href={`${FILE_BASE_URL}${url}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 transition-colors rounded-xl px-3.5 py-2.5 text-sm font-bold text-blue-700"
          >
            <Image size={16} /> Yetkazish rasmini ko'rish {order.deliveryPhotoUrls.length > 1 ? i + 1 : ''}
          </a>
        ))}
      </div>

      <button
        onClick={() => confirmMutation.mutate()}
        disabled={confirmMutation.isPending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md shadow-green-200 hover:shadow-lg transition-all disabled:opacity-60"
      >
        <CheckCircle2 size={17} /> {confirmMutation.isPending ? 'Saqlanmoqda...' : `${step}-tasdiqlash`}
      </button>
    </Modal>
  );
}
