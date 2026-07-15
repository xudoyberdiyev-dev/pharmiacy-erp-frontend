import {
  ClipboardList, Plus, Pencil, Trash2, CheckCircle2,
  PlayCircle, PackageCheck, ShieldCheck, AlertTriangle,
} from 'lucide-react';

export const CATEGORY_META = {
  create:   { color: 'text-blue-600', bg: 'bg-blue-100', dot: 'bg-blue-500', icon: Plus },
  update:   { color: 'text-amber-600', bg: 'bg-amber-100', dot: 'bg-amber-500', icon: Pencil },
  delete:   { color: 'text-red-600', bg: 'bg-red-100', dot: 'bg-red-500', icon: Trash2 },
  activate: { color: 'text-green-600', bg: 'bg-green-100', dot: 'bg-green-500', icon: CheckCircle2 },
  progress: { color: 'text-purple-600', bg: 'bg-purple-100', dot: 'bg-purple-500', icon: PlayCircle },
  success:  { color: 'text-green-600', bg: 'bg-green-100', dot: 'bg-green-500', icon: PackageCheck },
  confirm:  { color: 'text-teal-600', bg: 'bg-teal-100', dot: 'bg-teal-500', icon: ShieldCheck },
  warning:  { color: 'text-orange-600', bg: 'bg-orange-100', dot: 'bg-orange-500', icon: AlertTriangle },
  default:  { color: 'text-gray-500', bg: 'bg-gray-100', dot: 'bg-gray-400', icon: ClipboardList },
};

export const ACTION_META = {
  ORDER_CREATED: { label: 'Buyurtma yaratildi', cat: 'create' },
  CLIENT_CREATED: { label: "Klient qo'shildi", cat: 'create' },
  USER_CREATED: { label: "Xodim qo'shildi", cat: 'create' },
  VEHICLE_CREATED: { label: "Mashina qo'shildi", cat: 'create' },

  ORDER_UPDATED: { label: 'Buyurtma tahrirlandi', cat: 'update' },
  CLIENT_UPDATED: { label: 'Klient tahrirlandi', cat: 'update' },
  VEHICLE_UPDATED: { label: 'Mashina tahrirlandi', cat: 'update' },
  SYSTEM_OWNER_CREDENTIALS_CHANGED: { label: "System Owner login ma'lumotlarini o'zgartirdi", cat: 'update' },
  AMOUNT_EDITED: { label: "Summa tahrirlandi", cat: 'update' },
  GOODS_RETURNED: { label: 'Tovar qaytarish hujjati yuklandi', cat: 'update' },

  ORDER_CANCELLED: { label: 'Buyurtma bekor qilindi', cat: 'delete' },
  CLIENT_DEACTIVATED: { label: "Klient o'chirildi", cat: 'delete' },
  USER_BLOCKED: { label: 'Xodim bloklandi', cat: 'delete' },
  VEHICLE_DEACTIVATED: { label: 'Mashina bloklandi', cat: 'delete' },
  VEHICLE_DELETED: { label: "Mashina o'chirildi", cat: 'delete' },
  ETIROV_REJECTED_BY_PICKER: { label: 'Etiroz rad etildi', cat: 'delete' },
  DOCUMENT_ETIROV_RAISED: { label: 'Bugalter hujjatga etiroz bildirdi', cat: 'delete' },
  CHECKER_ETIROV_RAISED: { label: 'Hujjatchi checkerga etiroz bildirdi', cat: 'delete' },
  SUPER_ADMIN_CASCADE_BLOCKED: { label: "Super Admin bloklandi — butun tizim to'xtatildi", cat: 'delete' },
  OLD_ORDERS_PURGED: { label: "Eski buyurtmalar zaxiralanib o'chirildi", cat: 'delete' },

  CLIENT_ACTIVATED: { label: 'Klient faollashtirildi', cat: 'activate' },
  USER_ACTIVATED: { label: 'Xodim faollashtirildi', cat: 'activate' },
  VEHICLE_ACTIVATED: { label: 'Mashina faollashtirildi', cat: 'activate' },
  SUPER_ADMIN_CASCADE_UNBLOCKED: { label: 'Super Admin qayta faollashtirildi — tizim tiklandi', cat: 'activate' },

  PICKING_STARTED: { label: 'Yig\'ish (Picking) boshlandi', cat: 'progress' },
  PICKING_COMPLETED: { label: 'Yig\'ish (Picking) yakunlandi', cat: 'progress' },
  MARKING_STARTED: { label: 'Belgilash (Marking) boshlandi', cat: 'progress' },
  MARKING_COMPLETED: { label: 'Belgilash (Marking) yakunlandi', cat: 'progress' },
  CHECKING_STARTED: { label: 'Tekshirish (Checking) boshlandi', cat: 'progress' },
  CHECKING_COMPLETED: { label: 'Tekshirish (Checking) yakunlandi', cat: 'progress' },
  DRIVER_ASSIGNED: { label: 'Haydovchi biriktirildi', cat: 'progress' },
  DELIVERY_STARTED: { label: 'Haydovchi yetkazishni boshladi', cat: 'progress' },
  TRIP_ASSIGNED: { label: 'Reys biriktirildi', cat: 'progress' },
  DOCUMENT_ISSUED: { label: 'Hujjat chiqarildi', cat: 'progress' },
  PICKING_RESUBMITTED: { label: "Yig'ish qayta topshirildi", cat: 'progress' },
  MARKING_RESUBMITTED: { label: 'Belgilash qayta topshirildi', cat: 'progress' },
  DELIVERED: { label: 'Mijozga yetkazildi', cat: 'success' },

  ADMIN_CONFIRMED: { label: 'Admin tasdiqladi', cat: 'confirm' },
  ACCOUNTANT1_CONFIRMED: { label: 'Bugalter 1-tasdiq', cat: 'confirm' },
  ACCOUNTANT2_CONFIRMED: { label: 'Bugalter 2-tasdiq', cat: 'confirm' },
  ETIROV_ACCEPTED_BY_PICKER: { label: 'Etiroz qabul qilindi', cat: 'confirm' },

  ETIROV_RAISED: { label: 'Etiroz bildirildi', cat: 'warning' },
  ETIROV_SUBMITTED: { label: 'Etiroz yuborildi', cat: 'warning' },
  RETURNED_TO_MARKING: { label: "Checker Marker'ga qaytardi (jarima)", cat: 'warning' },
  RETURNED_TO_PICKING: { label: "Marker Picker'ga qaytardi (jarima)", cat: 'warning' },
  CHECKER_RETURNED_TO_PICKING: { label: "Checker Picker'ga qaytardi (jarima)", cat: 'warning' },
};

export const ROLE_LABELS = {
  SYSTEM_OWNER: 'System Owner',
  ADMIN: 'Admin', SUPER_ADMIN: 'Super Admin', OPERATOR: 'Operator', PICKER: 'Picker',
  MARKER: 'Marker', CHECKER: 'Checker', DRIVER: 'Haydovchi',
  ACCOUNTANT1: 'Bugalter 1', ACCOUNTANT2: 'Bugalter 2', DOCUMENT: 'Hujjatchi',
};

export const ETIROV_TYPE_LABELS = {
  WRONG_SERIES: 'Noto\'g\'ri seriya',
  WRONG_QUANTITY: 'Noto\'g\'ri miqdor',
  DAMAGED: 'Shikastlangan',
  WRONG_PRODUCT: 'Noto\'g\'ri mahsulot',
  MISSING_PRODUCT: 'Mahsulot yetishmayapti',
  WRONG_AMOUNT: 'Noto\'g\'ri summa',
  WRONG_DOCUMENT_NUMBER: 'Noto\'g\'ri hujjat raqami',
  ILLEGIBLE_DOCUMENT: 'Hujjat o\'qib bo\'lmaydi',
  OTHER: 'Boshqa sabab',
};

export function actionMeta(action) {
  const a = ACTION_META[action] || { label: action, cat: 'default' };
  return { ...a, ...CATEGORY_META[a.cat] };
}
