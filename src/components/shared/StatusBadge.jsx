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

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: 'badge-new' };
  return <span className={s.cls}>{s.label}</span>;
}
