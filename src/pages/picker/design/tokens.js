// ─────────────────────────────────────────────────────────────────────────
// Picker (Terimchi) ish maydoni — dizayn tokenlari (Phase 01, Deep Teal).
// Faqat Picker paneli ichida ishlatiladi; boshqa rollar va global Tailwind
// konfiguratsiyasiga ta'sir qilmaydi.
// ─────────────────────────────────────────────────────────────────────────

export const C = {
  primary:      '#0F766E',
  primaryHover: '#115E59',
  primarySoft:  '#F0FDFA',
  primaryRing:  '#99F6E4',
  tealChip:     '#CCFBF1',

  blue:     '#2563EB',
  blueSoft: '#EFF6FF',

  canvas:       '#F8FAFC',
  surface:      '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  border:       '#E2E8F0',
  borderStrong: '#CBD5E1',
  borderHover:  '#94A3B8',

  text:      '#0F172A',
  text2:     '#475569',
  textMuted: '#64748B',
  textBody:  '#334155',

  success:     '#166534',
  successSoft: '#DCFCE7',
  warning:     '#92400E',
  warningSoft: '#FEF3C7',
  warningBg:   '#FFFBEB',
  warningLine: '#FCD34D',
  danger:      '#B91C1C',
  dangerSoft:  '#FEE2E2',
  dangerBg:    '#FEF2F2',
  dangerLine:  '#FCA5A5',
  overdue:     '#991B1B',
  info:        '#1D4ED8',
  infoSoft:    '#DBEAFE',
  infoLine:    '#BFDBFE',
};

export const FONT = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Fokus halqasi: 2px oq + 2px Deep Teal
export const FOCUS = '0 0 0 2px #FFFFFF, 0 0 0 4px #0F766E';

// Navigatsiya badge ranglari: [desktop fon, desktop matn, mobil fon]
export const BADGE_TONE = {
  neutral: ['#F1F5F9', '#334155', '#475569'],
  teal:    ['#CCFBF1', '#115E59', '#0F766E'],
  warning: ['#FEF3C7', '#92400E', '#92400E'],
  info:    ['#DBEAFE', '#1D4ED8', '#1D4ED8'],
};

// Ekran kengligi chegaralari (dizayn spetsifikatsiyasi)
export const BP = {
  mobile: 640,   // < 640 — mobil (bottom nav, to'liq ekran inspector)
  drawer: 900,   // 640–899 — inspector drawer
  rail:   1280,  // 640–1279 — rail navigatsiya
  wide:   1600,  // ≥ 1600 — kengaytirilgan sidebar, uchinchi ustun
};
