// Etiroz turlari (backend EtirozType enum) — o'zbekcha yorliqlar
export const ETIROV_TYPE_LABELS = {
  WRONG_QUANTITY:        'Dori miqdori noto‘g‘ri',
  WRONG_PRODUCT:         'Noto‘g‘ri dori olib kelindi',
  WRONG_SERIES:          'Dorining seriyasi boshqa',
  DAMAGED:               'Dori shikastlangan',
  MISSING_PRODUCT:       'Dori ro‘yxatda yo‘q',
  WRONG_AMOUNT:          'Summa noto‘g‘ri',
  WRONG_DOCUMENT_NUMBER: 'Hujjat raqami noto‘g‘ri',
  ILLEGIBLE_DOCUMENT:    'Hujjat o‘qib bo‘lmaydi',
  OTHER:                 'Boshqa sabab',
};

export const etirovTypeLabel = (t) => ETIROV_TYPE_LABELS[t] || t || 'Noma’lum tur';

// Rad etish sabablari — backend REJECT_REASON_LABELS bilan bir xil kodlar
export const REJECT_REASONS = [
  { value: 'WRONG_QUANTITY',  label: 'Dori miqdori to‘g‘ri edi' },
  { value: 'WRONG_PRODUCT',   label: 'To‘g‘ri dori olib keldim' },
  { value: 'WRONG_SERIES',    label: 'Seriya to‘g‘ri edi' },
  { value: 'DAMAGED',         label: 'Dori shikastlanmagan edi' },
  { value: 'MISSING_PRODUCT', label: 'Barcha mahsulotlar bor edi' },
  { value: 'OTHER',           label: 'Boshqa' },
];

// Qaytaruvchi / e'tiroz manbasi
export const SOURCE = {
  CHECKER: { short: 'Checker', returned: 'Checker tomonidan qaytarilgan', raised: 'Checker tomonidan bildirilgan' },
  MARKER:  { short: 'Marker',  returned: 'Marker tomonidan qaytarilgan',  raised: 'Marker tomonidan bildirilgan' },
  null:    { short: 'Noma’lum', returned: 'Qaytaruvchi haqida ma’lumot mavjud emas', raised: 'E’tiroz manbasi noma’lum' },
};
export const source = (role) => SOURCE[role] || SOURCE.null;
