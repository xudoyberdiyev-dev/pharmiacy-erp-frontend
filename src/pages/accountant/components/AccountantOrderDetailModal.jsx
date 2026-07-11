import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../../api';
import { FILE_BASE_URL } from '../../../api/axios';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../../lib/errors';
import Modal from '../../../components/shared/Modal';
import StatusBadge from '../../../components/shared/StatusBadge';
import { CheckCircle2, FileSpreadsheet, Image, Clock, AlertTriangle, Undo2 } from 'lucide-react';
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
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Modal title={`Buyurtma ${order.invoiceNumber}`} onClose={onClose} wide>
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
        {order.originalAmount != null && (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle size={12} /> Narx o'zgartirilgan
          </span>
        )}
        {order.hasReturnedGoods && (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
            <Undo2 size={12} /> Tovar qaytarilgan
          </span>
        )}
      </div>

      {/* Hujjatchi tomonidan qilingan o'zgarishlar haqida to'liq ma'lumot */}
      {(order.originalAmount != null || order.hasReturnedGoods) && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
          <p className="text-xs font-black text-amber-700 uppercase tracking-wide">Hujjatchi tomonidan o'zgartirilgan</p>
          {order.originalAmount != null && (
            <p className="text-sm text-amber-800">
              Summa: <span className="line-through text-amber-500">{order.originalAmount.toLocaleString()} so'm</span>
              {' → '}
              <span className="font-bold">{order.totalAmount?.toLocaleString()} so'm</span>
            </p>
          )}
          {order.hasReturnedGoods && (
            <div className="text-sm text-amber-800 space-y-1">
              <p>
                Tovar qaytarilgan{order.returnedAmount ? ` (${order.returnedAmount.toLocaleString()} so'mlik)` : ''}
                {order.returnedGoodsAt ? ` — ${format(new Date(order.returnedGoodsAt), 'dd.MM.yyyy HH:mm')}` : ''}
                {order.returnedGoodsBy?.fullName ? `, ${order.returnedGoodsBy.fullName}` : ''}
              </p>
              {order.returnedGoodsNote && <p className="italic">"{order.returnedGoodsNote}"</p>}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl mb-4">
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
            <FileSpreadsheet size={16} /> Buyurtma Excel faylini yuklab olish
          </a>
        ) : (
          <p className="text-xs text-gray-400 px-1">Buyurtma Excel fayli yuklanmagan</p>
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
        {order.returnedGoodsExcelUrl && (
          <a
            href={`${FILE_BASE_URL}${order.returnedGoodsExcelUrl}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 transition-colors rounded-xl px-3.5 py-2.5 text-sm font-bold text-red-700"
          >
            <Undo2 size={16} /> Tovar qaytarish hujjatini yuklab olish
          </a>
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
