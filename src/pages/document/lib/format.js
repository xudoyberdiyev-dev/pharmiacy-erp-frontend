// Hujjatchi paneli uchun raqam va sana formatlari (Design System §04):
// minglik — bo'linmas bo'shliq, kasr — vergul, "so'm" bo'linmas bo'shliq bilan,
// sana DD.MM.YYYY, vaqt 24 soatlik HH:mm.

const NBSP = ' ';

function groupThousands(intStr) {
  return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

// Butun summa kasrsiz ko'rsatiladi; tiyin bo'lsa — har doim 2 xona
// (operator "1002.10" deb kiritgan bo'lsa, "1002,1" bo'lib qolmaydi).
export function money(amount, { suffix = true } = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  const neg = n < 0;
  const abs = Math.abs(Math.round(n * 100) / 100);
  const int = Math.trunc(abs);
  const frac = Math.round((abs - int) * 100);
  let out = groupThousands(String(int));
  if (frac > 0) out += ',' + String(frac).padStart(2, '0');
  if (neg) out = '−' + out;
  return suffix ? `${out}${NBSP}so‘m` : out;
}

export function count(n) {
  const v = Number(n) || 0;
  return groupThousands(String(v));
}

const pad = (v) => String(v).padStart(2, '0');

export function date(d) {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '—';
  return `${pad(x.getDate())}.${pad(x.getMonth() + 1)}.${x.getFullYear()}`;
}

export function time(d, withSeconds = false) {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '—';
  return `${pad(x.getHours())}:${pad(x.getMinutes())}${withSeconds ? ':' + pad(x.getSeconds()) : ''}`;
}

export function dateTime(d) {
  if (!d) return '—';
  return `${date(d)}, ${time(d)}`;
}

// Mahalliy kun (YYYY-MM-DD) — <input type="date"> qiymati bilan solishtirish uchun
export function dayKey(d) {
  if (!d) return '';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

// Bugundan necha kun oldin (0 = bugun)
export function daysAgo(d) {
  if (!d) return Infinity;
  const x = new Date(d);
  const a = new Date(x.getFullYear(), x.getMonth(), x.getDate());
  const now = new Date();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((b - a) / 86400000);
}

// Summa maydoni uchun kiritishni tozalash: faqat raqam va bitta nuqta/vergul
export function cleanAmountInput(v) {
  return String(v).replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1');
}
