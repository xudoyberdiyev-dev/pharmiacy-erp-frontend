// ─────────────────────────────────────────────────────────────────────────
// Marker paneli — dizayn tokenlari (Design System Phase 01, "Royal Blue").
// Faqat Marker paneli ichida ishlatiladi; boshqa rollarga va global
// Tailwind konfiguratsiyasiga ta'sir qilmaydi.
// ─────────────────────────────────────────────────────────────────────────

export const C = {
  // Primary · Royal Blue
  p950: '#172554', // yon panel foni (Phase 02)
  p900: '#1E3A8A', // active (bosilgan)
  p800: '#1E40AF', // hover, havolalar, faol matn
  p700: '#1D4ED8', // brend · asosiy amal
  p600: '#2563EB', // ikonlar
  p500: '#3B82F6', // fokus halqasi
  p400: '#60A5FA',
  p300: '#93C5FD',
  p200: '#BFDBFE', // tanlangan chegara
  p100: '#DBEAFE', // faol nav hisoblagichi
  p50:  '#EFF6FF', // tanlangan qator, faol nav

  // Neytral
  bgApp: '#F8FAFC',
  surface: '#FFFFFF',
  surface2: '#F1F5F9',   // hover, skeleton
  border: '#E2E8F0',
  borderStrong: '#CBD5E1', // input, outline tugma
  borderHover: '#94A3B8',
  text: '#0F172A',
  textBody: '#334155',
  text2: '#475569',
  textMuted: '#64748B',   // 4.8:1 — minimal matn rangi
  textDisabled: '#94A3B8', // faqat disabled

  // Semantik — main / text / bg / border
  success:   { main: '#16A34A', text: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
  warning:   { main: '#D97706', text: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  danger:    { main: '#DC2626', text: '#991B1B', bg: '#FEF2F2', border: '#FECACA', hover: '#B91C1C' },
  info:      { main: '#0284C7', text: '#075985', bg: '#F0F9FF', border: '#BAE6FD' },
  attention: { main: '#EA580C', text: '#9A3412', bg: '#FFF7ED', border: '#FED7AA' },
  neutral:   { main: '#64748B', text: '#334155', bg: '#F1F5F9', border: '#CBD5E1' },
};

export const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";

// [size, lineHeight, weight]
export const TYPE = {
  page:       [24, 32, 600],
  section:    [18, 26, 600],
  subsection: [16, 24, 600],
  body:       [14, 20, 400],
  bodyStrong: [14, 20, 500],
  small:      [13, 18, 400],
  label:      [13, 18, 500],
  caption:    [12, 16, 500],
  th:         [12, 16, 600],
  kpi:        [24, 28, 700],
};
export const NUM = { fontVariantNumeric: 'tabular-nums' };

export const SPACE = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48, 16: 64 };

export const SIZE = {
  control: { sm: 32, md: 36, lg: 40 },
  controlPadX: { sm: 10, md: 14, lg: 16 },
  tableHeader: 40, tableRow: 44, tableRowDense: 36, cellPadX: 12,
  cardPad: 16, cardPadLg: 20,
  modalPad: 24, modalSm: 440, modalMd: 560,
  sidebar: 240, topbar: 56,
  icon: { sm: 16, md: 20, lg: 24 },
};

export const ICON_STROKE = { 16: 2, 20: 1.75, 24: 1.5 };

export const RADIUS = { badge: 4, control: 6, card: 8, modal: 12, full: 999 };

export const SHADOW = {
  sm: '0 1px 2px rgba(15,23,42,0.06)',
  md: '0 4px 12px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)',
  lg: '0 16px 40px rgba(15,23,42,0.16), 0 2px 6px rgba(15,23,42,0.08)',
};

export const FOCUS = `0 0 0 2px #FFFFFF, 0 0 0 4px ${C.p500}`;
export const FOCUS_DANGER = `0 0 0 2px #FFFFFF, 0 0 0 4px ${C.danger.main}`;
export const FOCUS_INPUT = '0 0 0 3px rgba(59,130,246,0.25)';
export const ERROR_INPUT = '0 0 0 3px rgba(220,38,38,0.12)';

export const MOTION = { fast: '120ms', base: '180ms', ease: 'cubic-bezier(.2,0,0,1)' };

// Holat belgilari — rang + ikon + yorliq. Yangi biznes-holat qo'shilmaydi:
// har bir kalit mavjud frontend manbasiga bog'lanadi (izohda).
export const BADGE = {
  NEW:         { label: 'Yangi',          bg: C.info.bg,      fg: C.info.text,      bd: C.info.border,      icon: 'CircleDot' },      // markerAPI.getAvailable
  IN_PROGRESS: { label: 'Jarayonda',      bg: C.p50,          fg: C.p800,           bd: C.p200,             icon: 'LoaderCircle' },   // markerAPI.getMine (MARKING)
  PENDING:     { label: 'Kutilmoqda',     bg: C.warning.bg,   fg: C.warning.text,   bd: C.warning.border,   icon: 'Clock' },          // etirov.status === 'PENDING'
  ON_TIME:     { label: "O'z vaqtida",    bg: C.success.bg,   fg: C.success.text,   bd: C.success.border,   icon: 'CircleCheck' },    // order.isLate === false
  LATE:        { label: 'Kechikkan',      bg: C.danger.bg,    fg: C.danger.text,    bd: C.danger.border,    icon: 'TimerOff' },       // order.isLate === true
  RETURNED:    { label: 'Qaytarilgan',    bg: C.attention.bg, fg: C.attention.text, bd: C.attention.border, icon: 'Undo2' },          // markerAPI.getReturned
  ACCEPTED:    { label: 'Qabul qilingan', bg: C.success.bg,   fg: C.success.text,   bd: C.success.border,   icon: 'CheckCheck' },     // etirov.status === 'ACCEPTED'
  REJECTED:    { label: 'Rad etilgan',    bg: C.danger.bg,    fg: C.danger.text,    bd: C.danger.border,    icon: 'CircleX' },        // etirov.status === 'REJECTED'
  DONE:        { label: 'Yakunlangan',    bg: C.neutral.bg,   fg: C.neutral.text,   bd: C.neutral.border,   icon: 'CircleCheckBig' }, // markerAPI.getHistory
};

// Navigatsiya hisoblagichlari — pulsatsiyasiz.
export const COUNT_TONE = {
  neutral: [C.surface2, C.textBody],
  active:  [C.p100, C.p800],
  warning: ['#FEF3C7', C.warning.text],
  urgent:  [C.danger.main, '#FFFFFF'],
};

// Navigatsiya ikonlari (lucide-react). Har bir tushuncha — alohida ikon.
export const NAV_ICON = {
  available: 'Package',
  mine: 'ClipboardList',
  returned: 'RotateCcw',
  etirozGroup: 'MessagesSquare',
  etirozli: 'MessageSquareWarning',
  etirozlarReceived: 'MessageSquareReply',
  history: 'History',
  penalties: 'Scale', // faqat backend ma'lumot qaytarsa
};

// Taymer: qolgan ulush bo'yicha
export const TIMER_TONE = {
  normal:  { fg: C.text, bar: C.p700 },
  warning: { fg: C.warning.text, bar: C.warning.main }, // ≤ 25%
  overdue: { fg: C.danger.text, bar: C.danger.main },   // muddati o'tgan, "+" bilan
};
