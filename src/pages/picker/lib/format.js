// Picker paneli uchun formatlash yordamchilari. Barcha vaqtlar O'ZBEKISTON vaqtida
// (Asia/Tashkent) ko'rsatiladi — backendning "bugun" chegarasi ham shu vaqt bo'yicha.

const TZ = 'Asia/Tashkent';
const WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];

const pad2 = (n) => String(n).padStart(2, '0');

// Toshkent vaqti bo'yicha { y, m, d, hh, mm, ss, wd } (m: 1..12, wd: 0=yakshanba)
export function tzParts(input) {
  const d = input instanceof Date ? input : new Date(input);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hourCycle: 'h23', weekday: 'short',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(d).reduce((a, p) => { a[p.type] = p.value; return a; }, {});
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { y: +parts.year, m: +parts.month, d: +parts.day, hh: +parts.hour, mm: +parts.minute, ss: +parts.second, wd };
}

// 'YYYY-MM-DD' (Toshkent kuni)
export function ymd(input = new Date()) {
  const p = tzParts(input);
  return `${p.y}-${pad2(p.m)}-${pad2(p.d)}`;
}

export function addDays(ymdStr, delta) {
  const [y, m, d] = ymdStr.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + delta, 12));
  return `${t.getUTCFullYear()}-${pad2(t.getUTCMonth() + 1)}-${pad2(t.getUTCDate())}`;
}

// "03:14"
export function fmtClock(input) {
  if (!input) return '—';
  const p = tzParts(input);
  return `${pad2(p.hh)}:${pad2(p.mm)}`;
}

// "Payshanba, 5-noyabr"
export function fmtDayLong(input = new Date()) {
  const p = tzParts(input);
  const wd = WEEKDAYS[p.wd];
  return `${wd[0].toUpperCase()}${wd.slice(1)}, ${p.d}-${MONTHS[p.m - 1]}`;
}

// "bugun 02:58" | "4-noyabr 02:58"
export function fmtWhen(input, nowInput = new Date()) {
  if (!input) return '—';
  const p = tzParts(input);
  if (ymd(input) === ymd(nowInput)) return `bugun ${fmtClock(input)}`;
  return `${p.d}-${MONTHS[p.m - 1]} ${fmtClock(input)}`;
}

// Tarix sarlavhasi: "Bugun, 5-noyabr" | "Kecha, 4-noyabr" | "3-noyabr, dushanba"
export function fmtDayLabel(ymdStr, todayStr = ymd()) {
  const [, m, d] = ymdStr.split('-').map(Number);
  const base = `${d}-${MONTHS[m - 1]}`;
  if (ymdStr === todayStr) return `Bugun, ${base}`;
  if (ymdStr === addDays(todayStr, -1)) return `Kecha, ${base}`;
  const wd = WEEKDAYS[tzParts(`${ymdStr}T12:00:00+05:00`).wd];
  return `${base}, ${wd}`;
}

// 'YYYY-MM' → "noyabr"
export function monthName(key) {
  const m = Number(String(key || '').split('-')[1]);
  return MONTHS[m - 1] || '';
}

// Taymer: 1122000 ms → "18:42"; 1 soatdan ko'p bo'lsa "1:05:12"
export function fmtCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(s)}` : `${pad2(m)}:${pad2(s)}`;
}

// Kutish vaqti: 72 → "1 s 12 d" (qisqa) / "1 s 12 daq"; 48 → "48 daq"
export function fmtWait(minutes, { short = false } = {}) {
  const m = Math.max(0, Math.round(minutes || 0));
  if (m < 60) return `${m} daq`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h >= 24) {
    // bir sutkadan ko'p kutgan: "2 kun 5 s" (qisqa: "2 k 5 s")
    const d = Math.floor(h / 24);
    const hh = h % 24;
    return short ? `${d} k${hh ? ` ${hh} s` : ''}` : `${d} kun${hh ? ` ${hh} s` : ''}`;
  }
  if (!r) return `${h} s`;
  return short ? `${h} s ${r} d` : `${h} s ${r} daq`;
}

// "8 450 000" (bo'linmas bo'shliq bilan — satr o'rtasidan uzilib qolmasin)
export function fmtSum(n) {
  const v = Math.round(Number(n) || 0);
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// INN: "305112447" → "305 112 447"
export function fmtInn(inn) {
  const s = String(inn || '').replace(/\s+/g, '');
  if (!/^\d+$/.test(s)) return String(inn || '');   // faqat raqamli INN guruhlanadi
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function initials(name = '') {
  const w = String(name).replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (!w.length) return '?';
  return (w.length === 1 ? w[0].slice(0, 2) : w[0][0] + w[1][0]).toUpperCase();
}

// "Sardor Rahimov" → "S. Rahimov"
export function shortPerson(name = '') {
  const w = String(name).trim().split(/\s+/).filter(Boolean);
  if (w.length < 2) return w[0] || '';
  return `${w[0][0].toUpperCase()}. ${w[w.length - 1]}`;
}

// "D. Karimov" → "D. Karimovga" (k/q dan keyin -ka/-qa)
export function withGa(name = '') {
  const last = name.slice(-1).toLowerCase();
  if (last === 'k') return `${name}a`;
  if (last === 'q') return `${name}a`;
  return `${name}ga`;
}

// Kunlik/oylik "daqiqa farqi" chipi uchun: 8 → "8 daq erta", -4 → "4 daq kech"
export function fmtDiff(diffMinutes) {
  const m = Math.abs(Math.round(diffMinutes || 0));
  return diffMinutes >= 0 ? `${fmtWait(m)} erta` : `${fmtWait(m)} kech`;
}

// Javon bo'yicha tabiiy tartib: "A-03-2" < "A-05-1" < "B-01-1"; javonsiz pozitsiyalar oxirida
export function compareLocation(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return String(a).localeCompare(String(b), 'en', { numeric: true, sensitivity: 'base' });
}

export function pluralPoz(n) {
  return `${n} poz.`;
}
