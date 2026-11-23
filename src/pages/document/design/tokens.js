// ─────────────────────────────────────────────────────────────────────────
// Hujjatchi paneli — dizayn tokenlari (Design System Phase 01, "Deep Petrol").
// Faqat Hujjatchi paneli ichida ishlatiladi; boshqa rollarga va global
// Tailwind konfiguratsiyasiga ta'sir qilmaydi.
// ─────────────────────────────────────────────────────────────────────────

export const C = {
  // Primary · Deep Petrol
  p950: '#0A303B',
  p900: '#0D3C49',
  p800: '#124B5A', // brend · asosiy amal
  p700: '#176577', // havolalar, faol matn
  p500: '#278596', // fokus halqasi, ikonlar
  p300: '#8FBCC4',
  p200: '#B8D6DB',
  p100: '#D6E8EB',
  p50:  '#EAF3F4',

  // Neytral
  white: '#FFFFFF',
  n50:  '#F7F9FA', // canvas, jadval sarlavhasi
  n100: '#F1F4F6', // hover, skeleton
  n200: '#E8EDF0', // standart chegara
  n300: '#CBD5DC', // boshqaruv elementi chegarasi
  n500: '#87949F', // disabled, matn emas
  n600: '#647482', // ikkinchi darajali matn
  n700: '#34434E', // kuchli matn, ikonlar
  n900: '#1D2933', // asosiy matn

  // Semantik — main / text / bg / border
  success: { main: '#16845B', text: '#0F6B49', bg: '#E8F5EE', border: '#B5DEC8' },
  warning: { main: '#B7791F', text: '#8A5A12', bg: '#FFF5E5', border: '#F0D3A4' },
  danger:  { main: '#C43D4B', text: '#A8303D', bg: '#FCEBED', border: '#F2C0C6', hover: '#A8303D', active: '#8F2632' },
  info:    { main: '#3576B8', text: '#2A619A', bg: '#EAF2FB', border: '#BFD6EE' },
  neutral: { main: '#647482', text: '#4F5E6B', bg: '#EEF1F3', border: '#D5DCE1' },
};

export const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

export const FOCUS = `0 0 0 2px #FFFFFF, 0 0 0 4px ${C.p500}`;
export const FOCUS_DARK = `0 0 0 2px ${C.p900}, 0 0 0 4px ${C.p300}`;

export const SHADOW = {
  l1: '0 1px 2px rgba(29,41,51,0.06)',
  l2: '0 4px 12px rgba(29,41,51,0.08), 0 1px 3px rgba(29,41,51,0.06)',
  l3: '0 16px 40px rgba(13,30,38,0.16)',
};

export const RADIUS = { badge: 5, control: 7, dropdown: 8, card: 10, modal: 12 };

// Status badge variantlari — rang + ikon + yorliq (bitta ma'no, bitta ko'rinish).
// Ikon nomlari lucide-react komponent nomlari (ui.jsx'da xaritalanadi).
export const BADGE = {
  NEW:        { bg: C.info.bg,    fg: C.info.text,    bd: C.info.border,    icon: 'CircleDot' },
  PENDING:    { bg: C.neutral.bg, fg: C.neutral.text, bd: C.neutral.border, icon: 'Clock' },
  DOCUMENTED: { bg: C.p50,        fg: C.p800,         bd: C.p200,           icon: 'FileCheck2' },
  READY:      { bg: C.p800,       fg: '#FFFFFF',      bd: C.p800,           icon: 'Truck' },
  APPROVED:   { bg: C.success.bg, fg: C.success.text, bd: C.success.border, icon: 'CircleCheck' },
  RETURNED:   { bg: C.warning.bg, fg: C.warning.text, bd: C.warning.border, icon: 'Undo2' },
  CANCELLED:  { bg: C.n700,       fg: '#FFFFFF',      bd: C.n700,           icon: 'CircleX' },
  REJECTED:   { bg: C.danger.bg,  fg: C.danger.text,  bd: C.danger.border,  icon: 'Ban' },
};
