import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import { useDriverLocation } from '../../context/DriverLocationContext';
import StatusBadge from '../../components/shared/StatusBadge';
import NotFoundState from '../../components/shared/NotFoundState';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { ArrowLeft, MapPin, Camera, CheckCircle, Navigation, X, Package, Banknote, AlertCircle, Truck, Images } from 'lucide-react';

const MAX_PHOTOS = 4;

// Backend statsController.js dagi getDriverLocations bilan bir xil formula —
// driver o'zining hozirgi joylashuvidan mijozgacha taxminiy masofa/ETA'ni
// ko'rishi uchun (o'rtacha 35 km/soat tezlik).
const AVERAGE_SPEED_KMH = 35;
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DriverOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [photos, setPhotos] = useState([]);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const { position, error: locationError } = useDriverLocation();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOne(id),
    select: r => r.data.data,
    // Sahifa ochiq turgan payt orderning haqiqiy holati fonda yangilanib
    // turadi — aks holda eskirgan (masalan boshqa sessiyada allaqachon
    // yetkazilgan) holat asosida "Yetkazdim" bosilsa, backend "IN_TRANSIT
    // statusida emas" deb rad etardi.
    refetchInterval: 15000,
  });

  const deliverMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      photos.forEach(p => fd.append('photos', p));
      return orderAPI.deliver(id, fd);
    },
    onSuccess: () => {
      toast.success('Yetkazib berish tasdiqlandi! TG xabar yuborildi.');
      qc.invalidateQueries(['orders']);
      qc.invalidateQueries(['order', id]);
      navigate('/driver');
    },
    onError: e => {
      toast.error(getErrorMessage(e));
      // Holat bilan bog'liq xato bo'lsa (masalan order boshqa joyda
      // allaqachon yetkazilgan) — darhol qayta yuklab haqiqiy holatni
      // ko'rsatamiz, shunda foydalanuvchi eskirgan formaga qarab qayta
      // urinib, xatoni takrorlamaydi.
      qc.invalidateQueries(['order', id]);
    },
  });

  const startDeliveryMutation = useMutation({
    mutationFn: () => orderAPI.startDelivery(id),
    onSuccess: () => {
      toast.success('Yetkazish boshlandi — joylashuvingiz kuzatilmoqda');
      qc.invalidateQueries(['order', id]);
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  const openMaps = () => {
    const lat = order?.client?.latitude;
    const lon = order?.client?.longitude;
    if (lat == null || lon == null) {
      toast.error('Bu mijoz uchun manzil koordinatasi kiritilmagan');
      return;
    }
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
  };

  const addPhotos = (files) => {
    const next = [...photos, ...Array.from(files)].slice(0, MAX_PHOTOS);
    setPhotos(next);
  };

  const removePhoto = (idx) => setPhotos(p => p.filter((_, i) => i !== idx));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#3B5BFD] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!order) return <NotFoundState error={error} backTo="/driver" />;

  const isActive = order.status === 'IN_TRANSIT';

  return (
    <div className="space-y-4 -mx-4 -my-4 min-h-screen bg-[#F5F6FA] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/driver')} className="w-8 h-8 flex items-center justify-center -ml-1">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-mono font-black text-sm text-gray-900 truncate">#{order.invoiceNumber}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Client card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div>
            <p className="font-black text-gray-900 text-base">{order.client?.orgName}</p>
            <div className="flex items-start gap-1.5 text-sm text-gray-500 mt-1">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              <span>{order.client?.address || '—'}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
              <Package size={15} className="text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Qutilar</p>
                <p className="text-sm font-bold text-gray-800">{order.boxCount || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
              <Banknote size={15} className="text-gray-400" />
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Summa</p>
                <p className="text-sm font-bold text-gray-800">{order.totalAmount?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <button onClick={openMaps}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 rounded-2xl py-3.5 text-sm font-bold text-gray-700 active:bg-gray-50">
          <Navigation size={17} className="text-[#3B5BFD]" /> Xaritada ochish
        </button>

        {isActive && !order.driverConfirmedAt && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-700">Bu order hali tasdiqlanmagan</p>
              <p className="text-xs text-amber-600 mt-1">
                Yetkazishni boshlash yoki yakunlash uchun avval bosh sahifadagi ro'yxatdan bu orderni
                "qabul qildim" deb tasdiqlashingiz kerak.
              </p>
              <button onClick={() => navigate('/driver')}
                className="mt-2.5 text-xs font-bold text-amber-800 underline underline-offset-2">
                Bosh sahifaga qaytish →
              </button>
            </div>
          </div>
        )}

        {isActive && order.driverConfirmedAt && !order.deliveryStartedAt && (
          <button
            onClick={() => startDeliveryMutation.mutate()}
            disabled={startDeliveryMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-[#3B5BFD] disabled:opacity-60 text-white rounded-2xl py-3.5 text-sm font-bold active:opacity-90 transition-colors"
          >
            <Truck size={18} /> {startDeliveryMutation.isPending ? 'Boshlanmoqda...' : 'Yetkazyapman — joylashuvni ulashish'}
          </button>
        )}

        {isActive && order.deliveryStartedAt && (
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            {locationError ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0" />
                  <p className="text-sm font-bold text-red-700">GPS ishlamayapti</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {locationError} — joylashuvingiz Super Adminga yuborilmayapti. Telefon sozlamalaridan brauzerga
                  joylashuv (location) ruxsatini bering.
                </p>
              </>
            ) : position ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shrink-0" />
                  <p className="text-sm font-bold text-green-700">GPS faol — joylashuvingiz ko'rinmoqda</p>
                </div>
                {(() => {
                  const clientLat = order.client?.latitude;
                  const clientLon = order.client?.longitude;
                  if (clientLat == null || clientLon == null) {
                    return <p className="text-xs text-gray-400 mt-2">Masofa hisoblanmoqda...</p>;
                  }
                  const km = haversineKm(position.latitude, position.longitude, clientLat, clientLon);
                  const etaMin = Math.round((km / AVERAGE_SPEED_KMH) * 60);
                  return (
                    <p className="text-xs text-gray-500 mt-2">
                      ~{Math.round(km * 10) / 10} km qoldi · ~{etaMin} daqiqada yetib borasiz
                    </p>
                  );
                })()}
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse shrink-0" />
                  <p className="text-sm font-bold text-amber-700">GPS joylashuv aniqlanmoqda...</p>
                </div>
                <p className="text-xs text-gray-400 mt-2">Bir necha soniya kuting</p>
              </>
            )}
          </div>
        )}

        {isActive && order.driverConfirmedAt ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <p className="font-bold text-gray-900 text-sm">Yetkazib berishni tasdiqlash</p>

            <div className="grid grid-cols-4 gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button type="button" onClick={() => setShowPhotoMenu(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 active:bg-gray-50">
                  <Camera size={18} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400 font-bold">{photos.length}/{MAX_PHOTOS}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">Yetkazib berish tasdig'i uchun 1 tadan 4 tagacha rasm oling.</p>

            {/* Kamera bilan bevosita olish uchun — orqa kamera to'g'ridan-to'g'ri
                ochiladi (galereyaga aylanib o'tmasdan). Ikkalasi ham alohida,
                ko'rinmas inputlar — pastdagi tanlov varag'idagi tugmalar orqali
                ishga tushiriladi. */}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => { addPhotos(e.target.files); e.target.value = ''; }} />
            <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => { addPhotos(e.target.files); e.target.value = ''; }} />

            {showPhotoMenu && (
              <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setShowPhotoMenu(false)}>
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative w-full max-w-md bg-white rounded-t-2xl p-4 pb-6 space-y-2.5" onClick={e => e.stopPropagation()}>
                  <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Rasm qo'shish</p>
                  <button type="button"
                    onClick={() => { setShowPhotoMenu(false); cameraInputRef.current?.click(); }}
                    className="w-full flex items-center gap-3 bg-gray-50 rounded-2xl p-4 active:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#3B5BFD]/10 flex items-center justify-center shrink-0">
                      <Camera size={19} className="text-[#3B5BFD]" />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">Kamera bilan olish</span>
                  </button>
                  <button type="button"
                    onClick={() => { setShowPhotoMenu(false); galleryInputRef.current?.click(); }}
                    className="w-full flex items-center gap-3 bg-gray-50 rounded-2xl p-4 active:bg-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#3B5BFD]/10 flex items-center justify-center shrink-0">
                      <Images size={19} className="text-[#3B5BFD]" />
                    </div>
                    <span className="font-bold text-gray-800 text-sm">Galereyadan tanlash</span>
                  </button>
                  <button type="button" onClick={() => setShowPhotoMenu(false)}
                    className="w-full text-center py-3 text-sm font-bold text-gray-400">
                    Bekor qilish
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => deliverMutation.mutate()}
              disabled={photos.length === 0 || deliverMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-[#16A34A] disabled:bg-gray-300 text-white rounded-2xl py-3.5 text-sm font-bold active:opacity-90 transition-colors"
            >
              <CheckCircle size={18} /> {deliverMutation.isPending ? 'Yuborilmoqda...' : 'Yetkazdim'}
            </button>
          </div>
        ) : isActive ? null : order.status === 'DELIVERED' ? (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600 shrink-0" />
            <p className="text-sm font-bold text-green-700">Bu order yetkazib berilgan</p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-600 shrink-0" />
            <p className="text-sm font-bold text-amber-700">
              Bu orderning holati o'zgargan ({order.status}) — yetkazib berish endi mumkin emas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
