const STATUS_MAP = {
  NEW:        { label: 'Yangi',        cls: 'badge-new' },
  PICKING:    { label: 'Picking',      cls: 'badge-picking' },
  MARKING:    { label: 'Marking',      cls: 'badge-marking' },
  CHECKING:   { label: 'Cheking',      cls: 'badge-checking' },
  IN_TRANSIT: { label: "Yo'lda",       cls: 'badge-in_transit' },
  DELIVERED:  { label: 'Yetkazildi',   cls: 'badge-delivered' },
  CANCELLED:  { label: 'Bekor',        cls: 'badge-new' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: 'badge-new' };
  return <span className={s.cls}>{s.label}</span>;
}
