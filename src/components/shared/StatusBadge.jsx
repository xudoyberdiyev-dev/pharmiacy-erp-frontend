import { inTransitLabel } from '../../lib/orderStatusLabel';

const STATUS_MAP = {
  NEW:        { label: 'Yangi',        cls: 'badge-new' },
  PICKING:    { label: "Yig'ilmoqda",  cls: 'badge-picking' },
  MARKING:    { label: 'Markalash',    cls: 'badge-marking' },
  CHECKING:   { label: 'Tekshiruv',    cls: 'badge-checking' },
  LOADING:    { label: 'Yuklanmoqda',   cls: 'badge-loading' },
  IN_TRANSIT: { label: "Yo'lda",       cls: 'badge-in_transit' },
  DELIVERED:  { label: 'Yetkazildi',   cls: 'badge-delivered' },
  CANCELLED:  { label: 'Bekor',        cls: 'badge-new' },
  RETURNED:   { label: 'Qaytgan',      cls: 'badge-new' },
};

// `order` — ixtiyoriy: berilsa va IN_TRANSIT statusida bo'lsa, haydovchiga
// biriktirilgan/tasdiqlangan bosqichiga qarab aniqroq label ko'rsatiladi
// ("Yuklanmoqda" / "Safarga tayyorlanmoqda" / "Yo'lda"). Berilmasa — eski
// (status'gagina qarab) xatti-harakat saqlanadi, hech joy buzilmaydi.
export default function StatusBadge({ status, order }) {
  const s = STATUS_MAP[status] || { label: status, cls: 'badge-new' };
  const label = status === 'IN_TRANSIT' ? inTransitLabel(order) : s.label;
  return <span className={s.cls}>{label}</span>;
}
