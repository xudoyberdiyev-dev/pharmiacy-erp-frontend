// ─────────────────────────────────────────────────────────────────────────
// Operator Panel — Design tokens
//
// Source of truth: design-import/"Operator Panel - Design Foundation.dc.html"
// (Phase 01 of the Operator redesign canvas). Token NAMES are the contract —
// hex values live only here. This module is Operator-exclusive: nothing
// outside src/pages/operator/ and src/components/layout/OperatorLayout.jsx
// should import it, so changes here can never affect another role's panel.
//
// Deliberately NOT added to tailwind.config.js: that file is shared by all
// 9 other role panels (e.g. its existing `primary` token is a different
// blue used elsewhere). Operator components apply these tokens via inline
// style / Tailwind arbitrary-value classes instead, the same way the rest
// of this codebase already handles per-status colors.
// ─────────────────────────────────────────────────────────────────────────

export const COLOR = {
  // Brand / primary (indigo — distinct from the app-wide `primary` blue in
  // tailwind.config.js, intentionally: this is Operator's own accent)
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  primaryActive: '#3730A3',
  primarySoft: '#EEF2FF',
  primarySubtle: '#F5F3FF',
  primaryForeground: '#FFFFFF',

  // Application surfaces
  appBg: '#F8FAFC',
  surface: '#FFFFFF',
  subtleSurface: '#F8FAFC',
  mutedSurface: '#F1F5F9',
  hoverSurface: '#F1F5F9',
  selectedSurface: '#EEF2FF',
  pressedSurface: '#E0E7FF',

  // Borders
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderStrong: '#CBD5E1',
  borderFocus: '#818CF8',
  focusRing: 'rgba(79,70,229,0.28)',
  focusRingSoft: 'rgba(79,70,229,0.14)',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  textInverse: '#FFFFFF',
  textLink: '#4F46E5',

  // Semantic (never used as a full-bleed card fill — solid/soft/border trio)
  success: '#16A34A', successSoft: '#F0FDF4', successBorder: '#BBF7D0',
  warning: '#D97706', warningSoft: '#FFFBEB', warningBorder: '#FDE68A',
  danger: '#DC2626', dangerSoft: '#FEF2F2', dangerBorder: '#FECACA',
  info: '#0284C7', infoSoft: '#F0F9FF', infoBorder: '#BAE6FD',

  // Elevation (border-first system — shadows only for floating elements)
  shadowSubtle: '0 1px 2px rgba(15,23,42,0.04)',
  shadowDropdown: '0 4px 12px rgba(15,23,42,0.06)',
  shadowModal: '0 12px 32px rgba(15,23,42,0.10)',
};

// Radius scale — XS4/SM6/MD8/LG10/XL12/2XL16. Tailwind's built-in scale
// doesn't hit 10px, so LG is applied via arbitrary value (rounded-[10px]).
export const RADIUS = { xs: 4, sm: 6, md: 8, lg: 10, xl: 12, xxl: 16 };

// ── Order status — single source of truth for the whole Operator panel ────
// 8 values match the existing backend OrderStatus enum 1:1 (frontend label
// text renamed only, per user's confirmation — backend enum untouched).
// RETURNED is a 9th backend enum value neither the old Operator UI nor the
// original design canvas assigned a color to (existing, pre-redesign gap —
// without this, RETURNED orders silently render as "Yangi"). Added here at
// the user's explicit request, in the same solid/soft/border shape as the
// other statuses, sitting between warning-amber and danger-red.
export const STATUS = {
  NEW:        { label: 'Yangi',           text: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE', dot: '#4F46E5' },
  PICKING:    { label: 'Terilmoqda',      text: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', dot: '#2563EB' },
  MARKING:    { label: 'Markirovka',      text: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE', dot: '#7C3AED' },
  CHECKING:   { label: 'Tekshirilmoqda',  text: '#B45309', bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706' },
  LOADING:    { label: 'Yuklanmoqda',     text: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD', dot: '#0284C7' },
  IN_TRANSIT: { label: "Yo'lda",          text: '#0E7490', bg: '#ECFEFF', border: '#A5F3FC', dot: '#0891B2' },
  DELIVERED:  { label: 'Yetkazildi',      text: '#15803D', bg: '#F0FDF4', border: '#BBF7D0', dot: '#16A34A' },
  CANCELLED:  { label: 'Bekor qilingan',  text: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', dot: '#DC2626' },
  // New addition (see note above) — orange, between CHECKING/amber and CANCELLED/red.
  RETURNED:   { label: 'Qaytarilgan',     text: '#C2410C', bg: '#FFF7ED', border: '#FED7AA', dot: '#EA580C' },
};

// Workflow order, as rendered in filters/history (design canvas §04)
export const STATUS_ORDER = ['NEW', 'PICKING', 'MARKING', 'CHECKING', 'LOADING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED'];

export function statusConfig(status) {
  return STATUS[status] || STATUS.NEW;
}

// ── Typography ──────────────────────────────────────────────────────────
// Inter for interface text, JetBrains Mono for reference numbers/tokens.
// Loaded scoped (see useOperatorFonts below) — index.html stays untouched
// so the other 9 role panels keep their current default font stack.
export const FONT_SANS = "Inter, 'Helvetica Neue', Arial, sans-serif";
export const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";

export const TYPE = {
  kpi:        { fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 },
  pageTitle:  { fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
  sectionTitle:{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em' },
  cardTitle:  { fontSize: 15, fontWeight: 600 },
  body:       { fontSize: 14, fontWeight: 400, lineHeight: 1.6, color: COLOR.textPrimary },
  secondary:  { fontSize: 13, fontWeight: 400, lineHeight: 1.6, color: COLOR.textSecondary },
  label:      { fontSize: 13, fontWeight: 500, color: '#334155' },
  caption:    { fontSize: 12, fontWeight: 400, color: COLOR.textTertiary },
  tableHeader:{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', color: COLOR.textTertiary, fontFamily: FONT_MONO, textTransform: 'uppercase' },
  numeric:    { fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' },
  monoRef:    { fontSize: 13, fontWeight: 500, fontFamily: FONT_MONO },
};

// ── Fonts loader ────────────────────────────────────────────────────────
// Injects the Google Fonts <link> tags once, scoped to when an Operator
// page is mounted — never touches index.html (shared by every other role).
let fontsInjected = false;
export function ensureOperatorFonts() {
  if (fontsInjected || typeof document === 'undefined') return;
  if (document.getElementById('operator-panel-fonts')) { fontsInjected = true; return; }
  const link = document.createElement('link');
  link.id = 'operator-panel-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
  document.head.appendChild(link);
  fontsInjected = true;
}
