// ─────────────────────────────────────────────────────────────────────────
// Picker (terimchi) paneli — dizayn tokenlari
//
// Manba: yangi Picker dizayni (mobil: Bugun/Navbat/Tarix/Etirozlar/Qaytarilgan/Chek-list,
// desktop: 3 ustunli Bugun). Bu modul faqat Picker paneli uchun: tailwind.config.js
// barcha rollar uchun umumiy, shuning uchun ranglar oddiy Tailwind klasslari va
// arbitrary-value (bg-[#F0F4FF]) orqali ishlatiladi — umumiy konfigga tegilmaydi.
// ─────────────────────────────────────────────────────────────────────────

export const FONT_SANS = "Inter, 'Helvetica Neue', Arial, sans-serif";
export const FONT_MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

export const PAGE_BG = '#F0F4FF';

// Inter — interfeys, JetBrains Mono — faktura raqami va javon belgilari.
// index.html teginilmaydi (boshqa rollar eski shriftda qoladi): <link> faqat Picker
// paneli ochilganda bir marta qo'shiladi.
let fontsInjected = false;
export function ensurePickerFonts() {
  if (fontsInjected || typeof document === 'undefined') return;
  if (document.getElementById('picker-panel-fonts')) { fontsInjected = true; return; }
  const link = document.createElement('link');
  link.id = 'picker-panel-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap';
  document.head.appendChild(link);
  fontsInjected = true;
}

// Chip ranglari (Tailwind klasslari)
export const CHIP_TONES = {
  blue:   'bg-blue-50 text-blue-700',
  sky:    'bg-blue-100 text-blue-700',
  amber:  'bg-amber-100 text-amber-800',
  red:    'bg-red-100 text-red-700',
  green:  'bg-green-100 text-green-700',
  teal:   'bg-teal-50 text-teal-700',
  orange: 'bg-orange-100 text-orange-700',
  slate:  'bg-slate-100 text-slate-600',
  dark:   'bg-slate-900 text-white',
};

// Mijoz nomi bosh harflari uchun avatar ranglari (nomdan barqaror tanlanadi)
const AVATAR_TONES = [
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-amber-50 text-amber-800 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
];
export function avatarTone(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}
