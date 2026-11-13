// Barcha vaqtlar Asia/Tashkent bo'yicha ko'rsatiladi (brauzer zonasidan qat'i nazar).
const TZ = 'Asia/Tashkent';

const hmFmt  = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });
const ymdFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });

export const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

function valid(d) {
  if (d == null || d === '') return null;
  const x = d instanceof Date ? d : new Date(d);
  return Number.isNaN(x.getTime()) || x.getFullYear() < 2000 ? null : x;
}

// "14:32" (Toshkent)
export function hm(d) {
  const x = valid(d);
  return x ? hmFmt.format(x) : '—';
}

// "2026-11-10" — Toshkent kalendar kuni
export function ymd(d = new Date()) {
  const x = valid(d);
  return x ? ymdFmt.format(x) : '';
}

// "10.11.2026"
export function dmy(d) {
  const s = ymd(d);
  if (!s) return '—';
  const [y, m, dd] = s.split('-');
  return `${dd}.${m}.${y}`;
}

// "10-noyabr, 2026" — ISO kundan
export function dayLabel(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}-${MONTHS[m - 1]}, ${y}`;
}

// ISO kunni ±n kunga surish (Toshkent kuni sifatida)
export function shiftDay(iso, n) {
  const t = new Date(`${iso}T12:00:00+05:00`);
  t.setUTCDate(t.getUTCDate() + n);
  return ymd(t);
}

export function todayISO() {
  return ymd(new Date());
}

// "Bugun, 14:32" / "09.11, 14:32"
export function whenLabel(d) {
  const x = valid(d);
  if (!x) return '—';
  const today = todayISO();
  const day = ymd(x);
  if (day === today) return `Bugun, ${hm(x)}`;
  if (day === shiftDay(today, -1)) return `Kecha, ${hm(x)}`;
  const [, m, dd] = day.split('-');
  return `${dd}.${m}, ${hm(x)}`;
}

// Kutish davomiyligi: "45 daq" / "1 soat 12 daq"
export function waitLabel(fromDate, now = Date.now()) {
  const x = valid(fromDate);
  if (!x) return '—';
  const min = Math.max(0, Math.floor((now - x.getTime()) / 60000));
  if (min < 60) return `${min} daq`;
  if (min < 24 * 60) return `${Math.floor(min / 60)} soat ${min % 60} daq`;
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60);
  return h ? `${d} kun ${h} soat` : `${d} kun`;
}

// Soniyalarni "MM:SS" yoki "H:MM:SS"
export function mmss(sec) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(r)}` : `${p(m)}:${p(r)}`;
}

export function isValidDate(d) {
  return !!valid(d);
}

// Pul summasi: "4 812 000"
export function sum(n) {
  if (n == null || Number.isNaN(Number(n))) return null;
  return Math.round(Number(n)).toLocaleString('ru-RU').replace(/ /g, ' ');
}

// INN: "305 112 478"
export function inn(v) {
  if (!v) return null;
  const d = String(v).replace(/\s/g, '');
  return /^\d{9}$/.test(d) ? d.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : String(v);
}
