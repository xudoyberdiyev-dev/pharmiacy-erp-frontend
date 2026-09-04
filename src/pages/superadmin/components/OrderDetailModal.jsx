import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../../api';
import Modal from '../../../components/shared/Modal';
import StatusBadge from '../../../components/shared/StatusBadge';
import Pagination from '../../../components/shared/Pagination';
import { MapPin, Clock } from 'lucide-react';
import { formatSum } from '../../../lib/format';

const CATEGORY_TITLES = {
  today: 'Bugungi orderlar',
  delivered: 'Yetkazilgan orderlar',
  late: 'Kechikkan orderlar',
  pending48: "48 soatdan ko'p tasdiqlanmagan orderlar",
  total: 'Barcha orderlar',
};

const STAGE_LABELS = {
  PICKING: 'Picking',
  MARKING: 'Marking',
  CHECKING: 'Cheking',
};

export default function OrderDetailModal({ category, range, onClose }) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['orders-detail', category, range, page],
    queryFn: () => statsAPI.getOrdersDetail({
      category,
      ...(range?.start && range?.end ? { startDate: range.start, endDate: range.end } : {}),
      page,
      limit: 20,
    }),
    select: (r) => r.data,
  });

  const orders = data?.data || [];

  return (
    <Modal title={CATEGORY_TITLES[category] || 'Orderlar'} onClose={onClose} wide>
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-10">Ma'lumot yo'q</p>
      )}

      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-sm">{o.invoiceNumber}</span>
                  <StatusBadge status={o.status} order={o} />
                </div>
                <p className="font-medium text-gray-800 mt-1">{o.client?.orgName}</p>
                <div className="flex items-start gap-1 text-xs text-gray-500 mt-0.5">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span>{o.client?.address}</span>
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p className="font-bold text-gray-800 text-sm">{formatSum(o.totalAmount)} so'm</p>
                <p>Shartnoma: {o.contractNumber}</p>
                <p>Lot: {o.lotNumber}</p>
              </div>
            </div>

            {category === 'late' && o.lateInfo && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                <Clock size={12} />
                {STAGE_LABELS[o.lateInfo.stage] || o.lateInfo.stage} bosqichida {o.lateInfo.hoursLate} soat kechikmoqda
              </div>
            )}

            {category === 'pending48' && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                  <Clock size={12} />
                  {o.hoursSinceDelivered} soatdan beri tasdiqlanmagan
                </span>
                {o.driver && <span className="text-xs text-gray-400">Haydovchi: {o.driver.fullName}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      <Pagination page={data?.page || page} pages={data?.pages || 1} total={data?.total} onChange={setPage} />
    </Modal>
  );
}
