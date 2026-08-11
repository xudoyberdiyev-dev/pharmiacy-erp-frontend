import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { publicAPI } from '../../api';
import { format } from 'date-fns';
import {
  Package, Building2, MapPin, Phone, User2, Truck,
  FileCheck2, AlertTriangle, CheckCircle2, Clock
} from 'lucide-react';
import { formatSum } from '../../lib/format';

function Row({ icon: Icon, label, value, sub }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-indigo-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-gray-900 mt-0.5 break-words">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const fmt = (d) => d ? format(new Date(d), 'dd.MM.yyyy HH:mm') : null;

export default function PublicOrderInfoPage() {
  const { id } = useParams();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['public-order', id],
    queryFn: () => publicAPI.getOrderInfo(id),
    select: r => r.data.data,
    retry: false,
  });

  return (
    <div className="min-h-screen bg-[#F4F6FB] py-6 px-4">
      <div className="max-w-md mx-auto space-y-4">

        <div className="text-center mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-200">
            <Package size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-black text-gray-900">Pharmacy ERP</h1>
          <p className="text-xs text-gray-400 font-medium">Buyurtma ma'lumotlari</p>
        </div>

        {isLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400">Yuklanmoqda...</p>
          </div>
        )}

        {isError && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center px-6">
            <AlertTriangle size={28} className="text-red-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-700">Buyurtma topilmadi</p>
            <p className="text-xs text-gray-400 mt-1">Havola noto'g'ri yoki buyurtma o'chirilgan bo'lishi mumkin</p>
          </div>
        )}

        {order && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-mono font-black text-xl text-gray-900">#{order.invoiceNumber}</h2>
                {order.hasReturnedGoods && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-100">
                    <AlertTriangle size={11} /> Qaytarilgan
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{order.client?.orgName}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Mijoz</h3>
              <Row icon={Building2} label="Tashkilot" value={order.client?.orgName} />
              <Row icon={MapPin} label="Manzil" value={order.client?.address} />
              <Row icon={Phone} label="Telefon" value={order.client?.phone} />
              <Row icon={Package} label="Qutilar / Summa" value={`${order.boxCount ?? '—'} quti · ${formatSum(order.totalAmount)} so'm`}
                sub={order.originalAmount != null ? `Dastlabki: ${formatSum(order.originalAmount)} so'm` : null} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Jarayon</h3>
              <Row icon={User2} label="Buyurtma yaratuvchi" value={order.createdBy} />
              <Row icon={CheckCircle2} label="Picker" value={order.assignedPicker} sub={fmt(order.pickingDoneAt)} />
              <Row icon={CheckCircle2} label="Marker" value={order.marker} sub={fmt(order.markingDoneAt)} />
              <Row icon={CheckCircle2} label="Checker" value={order.checker} sub={fmt(order.checkingDoneAt)} />
              <Row icon={Truck} label="Haydovchi" value={order.driver}
                sub={`${order.vehicle ? order.vehicle + ' · ' : ''}${fmt(order.deliveredAt) || 'hali yetkazilmagan'}`} />
              <Row icon={FileCheck2} label="Hujjatchi" value={order.documentIssuedBy}
                sub={order.documentNumber ? `Hujjat № ${order.documentNumber} · ${fmt(order.documentIssuedAt)}` : null} />
            </div>

            {order.hasReturnedGoods && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                <h3 className="text-xs font-black text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Qaytarilgan tovar
                </h3>
                <Row icon={User2} label="Qayd etdi" value={order.returnedGoodsBy} />
                <Row icon={Clock} label="Sana" value={fmt(order.returnedGoodsAt)} />
                {order.returnedAmount != null && (
                  <Row icon={Package} label="Qaytarilgan summa" value={`${formatSum(order.returnedAmount)} so'm`} />
                )}
                <Row icon={Package} label="Izoh" value={order.returnedGoodsNote} />
              </div>
            )}
          </>
        )}

        <p className="text-center text-[11px] text-gray-300 pt-2">Pharmacy ERP · avtomatik yaratilgan ma'lumot</p>
      </div>
    </div>
  );
}
