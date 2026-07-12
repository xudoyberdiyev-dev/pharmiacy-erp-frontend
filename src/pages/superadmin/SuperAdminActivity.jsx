import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import {
  ClipboardList, Search, X, Calendar, Plus, Pencil, Trash2, CheckCircle2,
  PlayCircle, PackageCheck, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import Pagination from '../../components/shared/Pagination';

const CATEGORY_META = {
  create:   { color: 'text-blue-600', bg: 'bg-blue-100', icon: Plus },
  update:   { color: 'text-amber-600', bg: 'bg-amber-100', icon: Pencil },
  delete:   { color: 'text-red-600', bg: 'bg-red-100', icon: Trash2 },
  activate: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  progress: { color: 'text-purple-600', bg: 'bg-purple-100', icon: PlayCircle },
  success:  { color: 'text-green-600', bg: 'bg-green-100', icon: PackageCheck },
  confirm:  { color: 'text-teal-600', bg: 'bg-teal-100', icon: ShieldCheck },
  warning:  { color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertTriangle },
  default:  { color: 'text-gray-500', bg: 'bg-gray-100', icon: ClipboardList },
};

const ACTION_META = {
  ORDER_CREATED: { label: 'Buyurtma yaratildi', cat: 'create' },
  CLIENT_CREATED: { label: "Klient qo'shildi", cat: 'create' },
  USER_CREATED: { label: "Xodim qo'shildi", cat: 'create' },
  VEHICLE_CREATED: { label: "Mashina qo'shildi", cat: 'create' },

  ORDER_UPDATED: { label: 'Buyurtma tahrirlandi', cat: 'update' },
  CLIENT_UPDATED: { label: 'Klient tahrirlandi', cat: 'update' },
  VEHICLE_UPDATED: { label: 'Mashina tahrirlandi', cat: 'update' },
  SYSTEM_OWNER_CREDENTIALS_CHANGED: { label: "System Owner login ma'lumotlarini o'zgartirdi", cat: 'update' },

  ORDER_CANCELLED: { label: 'Buyurtma bekor qilindi', cat: 'delete' },
  CLIENT_DEACTIVATED: { label: "Klient o'chirildi", cat: 'delete' },
  USER_BLOCKED: { label: 'Xodim bloklandi', cat: 'delete' },
  VEHICLE_DEACTIVATED: { label: 'Mashina bloklandi', cat: 'delete' },
  VEHICLE_DELETED: { label: "Mashina o'chirildi", cat: 'delete' },
  ETIROV_REJECTED_BY_PICKER: { label: 'Etiroz rad etildi', cat: 'delete' },
  SUPER_ADMIN_CASCADE_BLOCKED: { label: "Super Admin bloklandi — butun tizim to'xtatildi", cat: 'delete' },
  OLD_ORDERS_PURGED: { label: "Eski buyurtmalar zaxiralanib o'chirildi", cat: 'delete' },

  CLIENT_ACTIVATED: { label: 'Klient faollashtirildi', cat: 'activate' },
  USER_ACTIVATED: { label: 'Xodim faollashtirildi', cat: 'activate' },
  VEHICLE_ACTIVATED: { label: 'Mashina faollashtirildi', cat: 'activate' },
  SUPER_ADMIN_CASCADE_UNBLOCKED: { label: 'Super Admin qayta faollashtirildi — tizim tiklandi', cat: 'activate' },

  PICKING_STARTED: { label: 'Picking boshlandi', cat: 'progress' },
  PICKING_COMPLETED: { label: 'Picking yakunlandi', cat: 'progress' },
  MARKING_STARTED: { label: 'Marking boshlandi', cat: 'progress' },
  MARKING_COMPLETED: { label: 'Marking yakunlandi', cat: 'progress' },
  CHECKING_STARTED: { label: 'Cheking boshlandi', cat: 'progress' },
  CHECKING_COMPLETED: { label: 'Cheking yakunlandi', cat: 'progress' },
  DRIVER_ASSIGNED: { label: 'Haydovchi biriktirildi', cat: 'progress' },
  DELIVERY_STARTED: { label: 'Haydovchi yetkazishni boshladi', cat: 'progress' },
  TRIP_ASSIGNED: { label: 'Reys biriktirildi', cat: 'progress' },
  DOCUMENT_ISSUED: { label: 'Hujjat chiqarildi', cat: 'progress' },
  DELIVERED: { label: 'Yetkazildi', cat: 'success' },

  ADMIN_CONFIRMED: { label: 'Admin tasdiqladi', cat: 'confirm' },
  ACCOUNTANT1_CONFIRMED: { label: 'Bugalter 1-tasdiq', cat: 'confirm' },
  ACCOUNTANT2_CONFIRMED: { label: 'Bugalter 2-tasdiq', cat: 'confirm' },
  ETIROV_ACCEPTED_BY_PICKER: { label: 'Etiroz qabul qilindi', cat: 'confirm' },

  ETIROV_RAISED: { label: 'Etiroz bildirildi', cat: 'warning' },
  ETIROV_SUBMITTED: { label: 'Etiroz yuborildi', cat: 'warning' },

  RETURNED_TO_MARKING: { label: "Checker Marker'ga qaytardi (jarima)", cat: 'warning' },
  RETURNED_TO_PICKING: { label: "Marker Picker'ga qaytardi (jarima)", cat: 'warning' },
  PICKING_RESUBMITTED: { label: 'Picking qayta topshirildi', cat: 'progress' },
  MARKING_RESUBMITTED: { label: 'Marking qayta topshirildi', cat: 'progress' },
  GOODS_RETURNED: { label: 'Tovar qaytarish hujjati yuklandi', cat: 'update' },
};

const ROLE_LABELS = {
  SYSTEM_OWNER: 'System Owner',
  ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin', OPERATOR: 'Operator', PICKER: 'Picker',
  MARKER: 'Marker', CHECKER: 'Checker', DRIVER: 'Haydovchi',
  ACCOUNTANT1: 'Bugalter 1', ACCOUNTANT2: 'Bugalter 2', DOCUMENT: 'Hujjatchi',
};

function actionMeta(action) {
  const a = ACTION_META[action] || { label: action, cat: 'default' };
  return { ...a, ...CATEGORY_META[a.cat] };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function SuperAdminActivity() {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');
  const LIMIT = 30;

  const { data, isLoading } = useQuery({
    queryKey: ['activity-log', page, dateFilter, search],
    queryFn: () => statsAPI.getActivityLog({ page, limit: LIMIT, date: dateFilter || undefined, search: search || undefined }),
    select: r => r.data,
  });

  const logs = data?.data || [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-2xl flex items-center justify-center">
            <ClipboardList size={18} className="text-indigo-600" />
          </div>
          Faoliyat tarixi
        </h1>
        <p className="text-xs text-gray-400 mt-1 ml-12">
          Xodimlar tomonidan bajarilgan barcha real ishlar — yaratish, tahrirlash, o'chirish/bloklash va bosqichlar (kirish hodisalari ko'rsatilmaydi)
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-indigo-50 rounded-2xl p-4">
          <p className="text-3xl font-black text-indigo-600">{total}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Jami faoliyat</p>
        </div>
      </div>

      {/* Qidiruv va filtrlar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Xodim yoki faktura bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-400 transition-all"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl shadow-sm px-3 py-2">
          <Calendar size={15} className="text-blue-500 shrink-0" />
          <input
            type="date"
            value={dateFilter}
            max={today()}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            className="text-sm font-bold text-gray-700 outline-none cursor-pointer bg-transparent w-[124px]"
          />
        </div>
        <button
          onClick={() => { setDateFilter(dateFilter === today() ? '' : today()); setPage(1); }}
          className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
            dateFilter === today() ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
          }`}
        >
          Bugun
        </button>
        {dateFilter && (
          <button onClick={() => { setDateFilter(''); setPage(1); }} className="text-xs text-blue-600 font-bold hover:underline">
            Sana filtrini tozalash
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-16 animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <ClipboardList size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm font-semibold">
            {search || dateFilter ? 'Filtr bo\'yicha faoliyat topilmadi' : 'Hali faoliyat qayd etilmagan'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => {
              const meta = actionMeta(log.action);
              const Icon = meta.icon;
              return (
                <div key={log.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 ${meta.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    <Icon size={17} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-bold text-sm ${meta.color}`}>{meta.label}</span>
                      {log.order && (
                        <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          #{log.order.invoiceNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-medium text-gray-700">{log.user?.fullName || "Noma'lum"}</span>
                      <span className="text-xs text-gray-400">· {ROLE_LABELS[log.user?.role] || log.user?.role}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 text-right">
                    <p className="font-bold text-gray-600">{format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm')}</p>
                    <p>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: uz })}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100">
            <Pagination page={data?.page || page} pages={data?.pages || 1} total={total} onChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
