import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, Clock, User, Truck, Package, FileText, MapPin } from 'lucide-react';
import { format } from 'date-fns';

function InfoRow({ label, value, mono }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 w-40 flex-shrink-0">{label}</span>
      <span className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card space-y-1">
      <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
        <Icon size={16} className="text-blue-600" />
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOne(id),
    select: r => r.data.data,
  });

  const confirmMutation = useMutation({
    mutationFn: () => orderAPI.adminConfirm(id),
    onSuccess: () => { toast.success('Order tasdiqlandi!'); qc.invalidateQueries(['order', id]); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400">Yuklanmoqda...</div>
    </div>
  );

  if (!data) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400">Order topilmadi</div>
    </div>
  );

  const o = data;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono">#{o.orderNumber}</h1>
            <StatusBadge status={o.status} />
            {o.adminConfirmed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle size={12} /> Admin tasdiqlagan
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(o.createdAt), 'dd.MM.yyyy HH:mm')} · {o.createdBy?.fullName}
          </p>
        </div>
        {o.status === 'DELIVERED' && !o.adminConfirmed && (
          <button
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending}
            className="btn-success flex items-center gap-2"
          >
            <CheckCircle size={17} /> 48s tasdiqlash
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Asosiy ma'lumotlar */}
        <Section title="Buyurtma ma'lumotlari" icon={FileText}>
          <InfoRow label="Shartnoma" value={o.contractNumber} mono />
          <InfoRow label="Faktura" value={o.invoiceNumber} mono />
          <InfoRow label="Lot raqami" value={o.lotNumber} mono />
          <InfoRow label="Umumiy summa" value={`${o.totalAmount?.toLocaleString()} so'm`} />
          <InfoRow label="Qutilar soni" value={o.boxCount} />
        </Section>

        {/* Klient */}
        <Section title="Klient" icon={MapPin}>
          <InfoRow label="Tashkilot" value={o.client?.orgName} />
          <InfoRow label="INN" value={o.client?.inn} mono />
          <InfoRow label="Telefon" value={o.client?.phone} />
          <InfoRow label="Manzil" value={o.client?.address} />
          <InfoRow label="Koordinatlar" value={o.client?.latitude ? `${o.client.latitude?.toFixed(4)}, ${o.client.longitude?.toFixed(4)}` : null} />
        </Section>

        {/* Vaqtlar */}
        <Section title="Muddatlar" icon={Clock}>
          <InfoRow label="Picking deadline" value={o.pickingDeadline ? format(new Date(o.pickingDeadline), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Marking deadline" value={o.markingDeadline ? format(new Date(o.markingDeadline), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Cheking deadline" value={o.checkingDeadline ? format(new Date(o.checkingDeadline), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Picking boshlandi" value={o.pickingStartedAt ? format(new Date(o.pickingStartedAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Picking tugadi" value={o.pickingDoneAt ? format(new Date(o.pickingDoneAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Marking tugadi" value={o.markingDoneAt ? format(new Date(o.markingDoneAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Cheking tugadi" value={o.checkingDoneAt ? format(new Date(o.checkingDoneAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Yetkazildi" value={o.deliveredAt ? format(new Date(o.deliveredAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Tasdiqlandi" value={o.confirmedAt ? format(new Date(o.confirmedAt), 'dd.MM.yyyy HH:mm') : null} />
        </Section>

        {/* Xodimlar */}
        <Section title="Xodimlar" icon={User}>
          <InfoRow label="Picker" value={o.assignedPicker?.fullName} />
          <InfoRow label="Marker" value={o.marker?.fullName} />
          <InfoRow label="Checker" value={o.checker?.fullName} />
          <InfoRow label="Haydovchi" value={o.driver?.fullName} />
          <InfoRow label="Mashina" value={o.vehicle ? `${o.vehicle.model} · ${o.vehicle.plateNumber}` : null} />
        </Section>
      </div>

      {/* Fayllar */}
      {(o.productsExcelUrl || o.markedExcelUrl || o.deliveryPhotoUrl) && (
        <Section title="Fayllar" icon={Package}>
          <div className="flex flex-wrap gap-3">
            {o.productsExcelUrl && (
              <a href={`http://localhost:5000${o.productsExcelUrl}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                📥 Mahsulotlar Excel
              </a>
            )}
            {o.markedExcelUrl && (
              <a href={`http://localhost:5000${o.markedExcelUrl}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition-colors">
                📋 Marked Excel
              </a>
            )}
            {o.deliveryPhotoUrl && (
              <a href={`http://localhost:5000${o.deliveryPhotoUrl}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors">
                📸 Yetkazib berish rasmi
              </a>
            )}
          </div>
        </Section>
      )}

      {/* Etirozlar */}
      {o.etirozlar?.length > 0 && (
        <Section title="Etirozlar tarixi" icon={Package}>
          <div className="space-y-3">
            {o.etirozlar.map((e, i) => (
              <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-red-700">{e.type}</span>
                  <span className="text-xs text-gray-400">{format(new Date(e.createdAt), 'dd.MM HH:mm')}</span>
                </div>
                {e.comment && <p className="text-sm text-gray-600">{e.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">Kimdan: {e.fromRole}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Activity log */}
      {o.activityLogs?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Clock size={16} className="text-blue-600" />
            Faoliyat tarixi
          </h3>
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200"></div>
            <div className="space-y-4 pl-10">
              {o.activityLogs.map((log, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-7 w-2.5 h-2.5 rounded-full bg-blue-500 top-1.5 border-2 border-white"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{log.action}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {log.user?.fullName} · {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
