import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Camera, CheckCircle, Navigation, X, Package, Banknote } from 'lucide-react';

const MAX_PHOTOS = 4;

export default function DriverOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [photos, setPhotos] = useState([]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getOne(id),
    select: r => r.data.data,
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
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
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
  if (!order) return <div className="text-center py-20 text-gray-400">Order topilmadi</div>;

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

        {isActive ? (
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
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 cursor-pointer active:bg-gray-50">
                  <Camera size={18} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400 font-bold">{photos.length}/{MAX_PHOTOS}</span>
                  <input type="file" accept="image/*" capture="environment" multiple className="hidden"
                    onChange={e => { addPhotos(e.target.files); e.target.value = ''; }} />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400">Yetkazib berish tasdig'i uchun 1 tadan 4 tagacha rasm oling.</p>

            <button
              onClick={() => deliverMutation.mutate()}
              disabled={photos.length === 0 || deliverMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-[#16A34A] disabled:bg-gray-300 text-white rounded-2xl py-3.5 text-sm font-bold active:opacity-90 transition-colors"
            >
              <CheckCircle size={18} /> {deliverMutation.isPending ? 'Yuborilmoqda...' : 'Yetkazdim'}
            </button>
          </div>
        ) : order.status === 'DELIVERED' ? (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-600 shrink-0" />
            <p className="text-sm font-bold text-green-700">Bu order yetkazib berilgan</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
