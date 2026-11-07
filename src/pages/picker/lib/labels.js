// Etiroz turlari (backend EtirozType enum) — dizayndagi qisqa yozuvlar
export const ETIROV_TYPE_LABELS = {
  WRONG_SERIES:          'Seriya mos emas',
  WRONG_QUANTITY:        'Miqdor mos emas',
  DAMAGED:               'Shikastlangan / yaroqsiz',
  WRONG_PRODUCT:         "Noto'g'ri dori",
  MISSING_PRODUCT:       'Dori yetishmayapti',
  WRONG_AMOUNT:          'Summa mos emas',
  WRONG_DOCUMENT_NUMBER: 'Hujjat raqami xato',
  ILLEGIBLE_DOCUMENT:    "Hujjat o'qilmayapti",
  OTHER:                 'Boshqa sabab',
};

// "Nega rad etasiz?" variantlari. `key` — backenddagi responseTypes qiymati (mavjud ro'yxat:
// REJECT_REASON_LABELS), `text` — Telegram/izohga yoziladigan matn. Birinchi variant har bir
// etiroz turi uchun mos keladigan tayyor sabab, qolganlari umumiy ("OTHER" + izoh).
const GENERIC_REJECTS = [
  { id: 'unit',  key: 'OTHER', label: 'Qadoq birligi farq qiladi' },
  { id: 'other', key: 'OTHER', label: 'Boshqa pozitsiya tekshirilgan' },
];
const PRIMARY_REJECT = {
  WRONG_QUANTITY:  { id: 'primary', key: 'WRONG_QUANTITY',  label: "Qayta sanadim — miqdor to'g'ri" },
  WRONG_SERIES:    { id: 'primary', key: 'WRONG_SERIES',    label: "Seriya to'g'ri edi" },
  WRONG_PRODUCT:   { id: 'primary', key: 'WRONG_PRODUCT',   label: "To'g'ri dori olib keldim" },
  DAMAGED:         { id: 'primary', key: 'DAMAGED',         label: 'Dori shikastlanmagan edi' },
  MISSING_PRODUCT: { id: 'primary', key: 'MISSING_PRODUCT', label: 'Barcha mahsulotlar bor edi' },
};
export function rejectOptionsFor(type) {
  const primary = PRIMARY_REJECT[type];
  return [
    ...(primary ? [primary] : []),
    ...GENERIC_REJECTS,
    { id: 'custom', key: 'OTHER', label: 'Boshqa sabab', needsNote: true },
  ];
}

// "Muammo bildirish" turlari (backend ISSUE_LABELS)
export const ISSUE_TYPES = [
  { id: 'NOT_FOUND', label: 'Dori topilmadi' },
  { id: 'SHORTAGE',  label: 'Omborda yetarli emas' },
  { id: 'WRONG_LOT', label: 'Seriya mos emas' },
  { id: 'EXPIRY',    label: 'Yaroqlilik muddati mos emas' },
  { id: 'DAMAGED',   label: 'Shikastlangan / yaroqsiz' },
  { id: 'OTHER',     label: 'Boshqa sabab', needsNote: true },
];
export const ISSUE_LABELS = Object.fromEntries(ISSUE_TYPES.map((t) => [t.id, t.label]));

// Qaytargan rol → ko'rsatiladigan yozuv
export const RETURNER_LABELS = {
  CHECKER: { who: 'Checker', title: 'Checker qaytardi', reason: 'CHECKER SABABI' },
  MARKER:  { who: 'Marker',  title: 'Marker qaytardi',  reason: 'MARKER SABABI' },
};
