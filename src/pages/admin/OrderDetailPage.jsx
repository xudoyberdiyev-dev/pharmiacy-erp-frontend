import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import { FILE_BASE_URL } from '../../api/axios';
import StatusBadge from '../../components/shared/StatusBadge';
import NotFoundState from '../../components/shared/NotFoundState';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { ArrowLeft, CheckCircle, Clock, User, Truck, Package, FileText, MapPin, Undo2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { actionMeta, ROLE_LABELS, ETIROV_TYPE_LABELS } from '../../lib/activityLabels';
import { formatSum } from '../../lib/format';

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

// Order bir vaqtning o'zida faqat bitta "hozir qaytarilgan" holatda bo'ladi
// (returnedTo*At maydonlaridan faqat bittasi to'ldirilgan bo'ladi, tuzatilib
// qayta yuborilganda tozalanadi) — shu sababli birinchi topilgani ko'rsatiladi.
function activeReturn(o) {
  if (o.returnedToMarkingAt) return { label: 'Checker → Marker', at: o.returnedToMarkingAt };
  if (o.returnedToPickingAt) return { label: 'Marker → Picker', at: o.returnedToPickingAt };
  if (o.returnedToCheckingAt) return { label: 'Hujjatchi → Checker', at: o.returnedToCheckingAt };
  if (o.returnedToDocumentAt) return { label: '1-bugalter → Hujjatchi', at: o.returnedToDocumentAt };
  if (o.returnedToAccountant1At) return { label: `2-bugalter → 1-bugalter${o.acct1ConfirmedBy?.fullName ? ` (${o.acct1ConfirmedBy.fullName})` : ''}`, at: o.returnedToAccountant1At };
  if (o.returnedToDocumentByDriverAt) return { label: `Haydovchi${o.returnedToDocumentByDriverUser?.fullName ? ` (${o.returnedToDocumentByDriverUser.fullName})` : ''} → Hujjatchi`, at: o.returnedToDocumentByDriverAt };
  return null;
}

// ── Qaytarish holati — checker/marker/hujjatchi/bugalter/haydovchi zanjiridagi
// hozirgi (hali tuzatilmagan) qaytarish + tovar qaytarilgan/butunlay qaytarilgan
// doimiy holatlar. Order sahifasi "hammasini ko'rish" uchun mo'ljallangan
// bo'lgani sabab, bu ma'lumot boshqa hech qayerda ko'rinmaydi — shu yerda.
function ReturnStatusSection({ o }) {
  const active = activeReturn(o);
  if (!active && !o.hasReturnedGoods && !o.fullyReturnedAt) return null;

  return (
    <div className="card border-2 border-amber-200 bg-amber-50/40 space-y-3">
      <h3 className="font-semibold text-amber-800 flex items-center gap-2">
        <Undo2 size={16} /> Qaytarish holati
      </h3>

      {active && (
        <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-amber-200">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-800">Hozir qaytarilgan: {active.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{format(new Date(active.at), 'dd.MM.yyyy HH:mm')}</p>
            {o.returnReason && <p className="text-sm text-gray-700 mt-1.5 italic">"{o.returnReason}"</p>}
          </div>
        </div>
      )}

      {o.hasReturnedGoods && (
        <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-amber-200">
          <Package size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-amber-800">
              Tovar qaytarilgan{o.returnedAmount ? ` — ${formatSum(o.returnedAmount)} so'm` : ''}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {o.returnedGoodsAt ? format(new Date(o.returnedGoodsAt), 'dd.MM.yyyy HH:mm') : '—'}
              {o.returnedGoodsBy?.fullName ? ` · ${o.returnedGoodsBy.fullName}` : ''}
            </p>
            {o.returnedGoodsNote && <p className="text-sm text-gray-700 mt-1.5 italic">"{o.returnedGoodsNote}"</p>}
          </div>
        </div>
      )}

      {o.fullyReturnedAt && (
        <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-red-200">
          <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-red-700">Butunlay qaytarilgan (RETURNED)</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {format(new Date(o.fullyReturnedAt), 'dd.MM.yyyy HH:mm')}
              {o.fullyReturnedBy?.fullName ? ` · ${o.fullyReturnedBy.fullName}` : ''}
            </p>
            {o.fullyReturnedReason && <p className="text-sm text-gray-700 mt-1.5 italic">"{o.fullyReturnedReason}"</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOne(id),
    select: r => r.data.data,
  });

  const confirmMutation = useMutation({
    mutationFn: () => orderAPI.adminConfirm(id),
    onSuccess: () => { toast.success('Buyurtma tasdiqlandi!'); qc.invalidateQueries(['order', id]); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-gray-400">Yuklanmoqda...</div>
    </div>
  );

  if (!data) return <NotFoundState error={error} />;

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
            <h1 className="text-xl font-bold font-mono">#{o.invoiceNumber}</h1>
            <StatusBadge status={o.status} />
            {o.adminConfirmed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle size={12} /> Admin tasdiqlagan
              </span>
            )}
            {o.acct1Confirmed && o.acct2Confirmed && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                <CheckCircle size={12} /> Bugalterlar tasdiqladi
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

      <ReturnStatusSection o={o} />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Asosiy ma'lumotlar */}
        <Section title="Buyurtma ma'lumotlari" icon={FileText}>
          <InfoRow label="Shartnoma" value={o.contractNumber} mono />
          <InfoRow label="Faktura" value={o.invoiceNumber} mono />
          <InfoRow label="Lot raqami" value={o.lotNumber} mono />
          <InfoRow label="Umumiy summa" value={`${formatSum(o.totalAmount)} so'm`} />
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
        <Section title="Bosqichlar va muddatlar" icon={Clock}>
          <InfoRow label="Yig'ish (Picking) muddati" value={o.pickingDeadline ? format(new Date(o.pickingDeadline), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Yig'ish boshlandi" value={o.pickingStartedAt ? format(new Date(o.pickingStartedAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Yig'ish yakunlandi" value={o.pickingDoneAt ? format(new Date(o.pickingDoneAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Belgilash (Marking) muddati" value={o.markingDeadline ? format(new Date(o.markingDeadline), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Belgilash yakunlandi" value={o.markingDoneAt ? format(new Date(o.markingDoneAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Tekshirish (Checking) muddati" value={o.checkingDeadline ? format(new Date(o.checkingDeadline), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Tekshirish yakunlandi" value={o.checkingDoneAt ? format(new Date(o.checkingDoneAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Mijozga yetkazildi" value={o.deliveredAt ? format(new Date(o.deliveredAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoRow label="Admin tasdiqladi" value={o.confirmedAt ? format(new Date(o.confirmedAt), 'dd.MM.yyyy HH:mm') : null} />
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
      {(o.productsExcelUrl || o.markedExcelUrl || o.deliveryPhotoUrls?.length > 0) && (
        <Section title="Fayllar" icon={Package}>
          <div className="flex flex-wrap gap-3">
            {o.productsExcelUrl && (
              <a href={`${FILE_BASE_URL}${o.productsExcelUrl}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                📥 Mahsulotlar Excel
              </a>
            )}
            {o.markedExcelUrl && (
              <a href={`${FILE_BASE_URL}${o.markedExcelUrl}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 transition-colors">
                📋 Belgilangan Excel
              </a>
            )}
            {o.deliveryPhotoUrls?.map((url, i) => (
              <a key={url} href={`${FILE_BASE_URL}${url}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors">
                📸 Yetkazib berish rasmi {o.deliveryPhotoUrls.length > 1 ? i + 1 : ''}
              </a>
            ))}
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
                  <span className="text-sm font-medium text-red-700">{ETIROV_TYPE_LABELS[e.type] || e.type}</span>
                  <span className="text-xs text-gray-400">{format(new Date(e.createdAt), 'dd.MM HH:mm')}</span>
                </div>
                {e.comment && <p className="text-sm text-gray-600">{e.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">Kimdan: {ROLE_LABELS[e.fromRole] || e.fromRole}</p>
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
              {o.activityLogs.map((log, i) => {
                const meta = actionMeta(log.action);
                return (
                  <div key={i} className="relative">
                    <div className={`absolute -left-7 w-2.5 h-2.5 rounded-full top-1.5 border-2 border-white ${meta.dot}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{meta.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {log.user?.fullName ? `${log.user.fullName}${log.user.role ? ` (${ROLE_LABELS[log.user.role] || log.user.role})` : ''}` : 'Tizim'}
                        {' · '}{format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
