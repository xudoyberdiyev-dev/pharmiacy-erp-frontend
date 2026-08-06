import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../../api';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { MapPin, ChevronRight, CheckSquare, Square, ClipboardCheck, Package } from 'lucide-react';
import { isToday, format } from 'date-fns';

function ConfirmChecklist({ orders, onDone }) {
  const qc = useQueryClient();
  const [checked, setChecked] = useState(() => new Set());

  // Ro'yxat o'zgarsa (masalan hujjatchi yana bir order qo'shsa) — belgilash
  // holatini yo'qotib qo'ymaslik uchun faqat hali ro'yxatda bo'lganlarini saqlaymiz.
  useEffect(() => {
    setChecked(prev => new Set([...prev].filter(id => orders.some(o => o.id === id))));
  }, [orders]);

  const toggle = (id) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allChecked = orders.length > 0 && checked.size === orders.length;

  const mutation = useMutation({
    mutationFn: () => orderAPI.driverConfirm(orders.map(o => o.id)),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Buyurtmalar tasdiqlandi');
      qc.invalidateQueries(['orders', 'driver']);
      onDone?.();
    },
    onError: e => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardCheck size={18} className="text-amber-600 shrink-0" />
        <div>
          <p className="font-black text-amber-900 text-sm">Yangi biriktirilgan buyurtmalar</p>
          <p className="text-xs text-amber-700">
            Safarga chiqishdan oldin har birini ko'zdan kechirib, mashinaga ortilganini belgilang — shunda hech biri
            unutilib qolmaydi.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {orders.map(o => (
          <button
            key={o.id}
            onClick={() => toggle(o.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
              checked.has(o.id) ? 'bg-white border-amber-300' : 'bg-white/60 border-amber-100'
            }`}
          >
            {checked.has(o.id)
              ? <CheckSquare size={20} className="text-amber-600 shrink-0" />
              : <Square size={20} className="text-amber-300 shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="font-mono font-black text-sm text-gray-900">#{o.invoiceNumber}</p>
              <p className="text-xs text-gray-500 truncate">{o.client?.orgName}</p>
            </div>
            {o.boxCount != null && (
              <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                <Package size={12} /> {o.boxCount}
              </div>
            )}
          </button>
        ))}
      </div>

      <button
        onClick={() => mutation.mutate()}
        disabled={!allChecked || mutation.isPending}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 disabled:bg-gray-300 text-white rounded-xl py-3 text-sm font-bold active:opacity-90 transition-colors"
      >
        <ClipboardCheck size={16} />
        {mutation.isPending
          ? 'Tasdiqlanmoqda...'
          : allChecked
            ? `Barchasini tasdiqlayman (${checked.size}/${orders.length})`
            : `Avval hammasini belgilang (${checked.size}/${orders.length})`}
      </button>
    </div>
  );
}

export default function DriverPanel() {
  const navigate = useNavigate();

  // Faol (hali yetkazilmagan) orderlar — alohida, cheklovsiz so'rov bilan
  // olinadi. Muhim: bularni haydovchining eski (yetkazib bo'lingan) tarixi
  // bilan bitta umumiy "limit"ga sig'dirib olishga urinish xato edi — agar
  // haydovchida ko'p tarix bo'lsa, yangi biriktirilgan faol orderlar
  // createdAt bo'yicha saralanganda ro'yxatdan "siqilib chiqib", haydovchi
  // panelida umuman ko'rinmay qolar edi (hujjatchi panelida esa hammasi
  // to'g'ri biriktirilgan bo'lib turaverardi). Shu sabab faol va tarix
  // ro'yxatlari endi butunlay mustaqil so'rovlar orqali olinadi.
  const { data: active, isLoading } = useQuery({
    queryKey: ['orders', 'driver', 'active'],
    queryFn: () => orderAPI.getAll({ status: 'IN_TRANSIT', limit: 1000 }),
    select: r => r.data.data,
    refetchInterval: 20000,
  });

  const { data: deliveredRes } = useQuery({
    queryKey: ['orders', 'driver', 'delivered'],
    queryFn: () => orderAPI.getAll({ status: 'DELIVERED', limit: 10 }),
    select: r => r.data,
    refetchInterval: 30000,
  });

  const { data: deliveredTodayTotal } = useQuery({
    queryKey: ['orders', 'driver', 'delivered-today'],
    queryFn: () => orderAPI.getAll({ status: 'DELIVERED', date: format(new Date(), 'yyyy-MM-dd'), limit: 1 }),
    select: r => r.data.total,
    refetchInterval: 30000,
  });

  const activeOrders = active || [];
  const unconfirmed = activeOrders.filter(o => !o.driverConfirmedAt);
  const confirmedActive = activeOrders.filter(o => o.driverConfirmedAt);
  const done = deliveredRes?.data || [];
  const doneTotal = deliveredRes?.total || 0;
  const deliveredToday = deliveredTodayTotal || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-black text-gray-900">Mening buyurtmalarim</h1>

      {unconfirmed.length > 0 && <ConfirmChecklist orders={unconfirmed} />}

      {/* Kichik statistika */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-orange-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-orange-600">{activeOrders.length}</p>
          <p className="text-[10px] text-gray-500 font-bold mt-0.5">Faol</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-green-600">{deliveredToday}</p>
          <p className="text-[10px] text-gray-500 font-bold mt-0.5">Bugun yetkazilgan</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-blue-600">{doneTotal}</p>
          <p className="text-[10px] text-gray-500 font-bold mt-0.5">Jami yetkazilgan</p>
        </div>
      </div>

      {/* Faol orderlar (tasdiqlangan) */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 mb-2.5 flex items-center gap-2">
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
          Yetkazish kerak ({confirmedActive.length})
        </h2>
        {isLoading && <div className="text-gray-400 text-sm">Yuklanmoqda...</div>}
        <div className="space-y-2.5">
          {confirmedActive.map(order => (
            <button
              key={order.id}
              onClick={() => navigate(`/driver/orders/${order.id}`)}
              className="w-full bg-white rounded-2xl border border-orange-100 p-4 text-left flex items-center gap-3 active:bg-orange-50/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-black text-sm text-gray-900">#{order.invoiceNumber}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="font-bold text-gray-800 text-sm truncate">{order.client?.orgName}</p>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{order.client?.address || '—'}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </button>
          ))}
          {!isLoading && confirmedActive.length === 0 && unconfirmed.length === 0 && (
            <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100 text-sm">
              Faol order yo'q
            </div>
          )}
        </div>
      </div>

      {/* Tugatilgan — so'nggi 10 tasi, jami son yuqoridagi statistikada */}
      {done.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-500 mb-2.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Yetkazilgan (so'nggi {done.length}, jami {doneTotal})
          </h2>
          <div className="space-y-2">
            {done.map(order => (
              <button
                key={order.id}
                onClick={() => navigate(`/driver/orders/${order.id}`)}
                className="w-full bg-white rounded-2xl border border-gray-100 p-3.5 flex items-center justify-between text-left"
              >
                <div className="min-w-0">
                  <span className="font-mono text-sm font-bold text-gray-800">#{order.invoiceNumber}</span>
                  <span className="text-xs text-gray-400 ml-2 truncate">{order.client?.orgName}</span>
                </div>
                <StatusBadge status={order.status} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
