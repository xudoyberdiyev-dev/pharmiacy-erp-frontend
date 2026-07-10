import { AlertTriangle, Undo2 } from 'lucide-react';

// Hujjatchi orderga narx yoki tovar qaytarish bo'yicha o'zgartirish kiritgan
// bo'lsa, buni bugalter ro'yxatda (status yonida) darhol ko'rishi uchun.
export default function OrderChangeBadges({ order }) {
  if (order.originalAmount == null && !order.hasReturnedGoods) return null;
  return (
    <span className="inline-flex items-center gap-1 ml-2">
      {order.originalAmount != null && (
        <span title="Narx o'zgartirilgan" className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
          <AlertTriangle size={10} /> Narx
        </span>
      )}
      {order.hasReturnedGoods && (
        <span title="Tovar qaytarilgan" className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
          <Undo2 size={10} /> Qaytgan
        </span>
      )}
    </span>
  );
}
