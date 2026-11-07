// Order holati va taymer hisob-kitoblari (sof funksiyalar).

export const isReturned = (o) => !!o && o.status === 'PICKING' && !!o.returnedToPickingAt;
export const isInProgress = (o) => !!o && o.status === 'PICKING' && !o.returnedToPickingAt;

// Taymer faqat order QABUL QILINGANDA boshlanadi (backend: deadline = qabul + pickingDuration).
// Qaytarilgan orderda taymer yo'q (vaqt hisoblanmaydi).
//   kind: 'idle' (taymer yo'q) | 'ok' | 'warn' (qolgan vaqt ≤ 25%) | 'late'
export function timerState(order, nowMs) {
  if (!order || isReturned(order) || !order.pickingDeadline || !order.pickingStartedAt) {
    return { kind: 'idle', remainingMs: null, ratio: 0 };
  }
  const start = new Date(order.pickingStartedAt).getTime();
  const deadline = new Date(order.pickingDeadline).getTime();
  const total = Math.max(1, deadline - start);
  const remaining = deadline - nowMs;
  const ratio = Math.min(1, Math.max(0, (nowMs - start) / total));
  if (remaining < 0) return { kind: 'late', remainingMs: remaining, overMs: -remaining, totalMs: total, ratio: 1 };
  const kind = remaining <= total * 0.25 ? 'warn' : 'ok';
  return { kind, remainingMs: remaining, totalMs: total, ratio };
}

// Taymer ranglari: qo'shimcha Tailwind klasslari
export const TIMER_TONES = {
  ok:   { label: 'Vaqt yetarli',    box: 'bg-teal-50 border-teal-100',    text: 'text-teal-700',  bar: 'from-teal-500 to-blue-600', icon: 'text-teal-700' },
  warn: { label: 'Vaqt tugayapti',  box: 'bg-amber-50 border-amber-200',  text: 'text-amber-700', bar: 'from-amber-400 to-orange-500', icon: 'text-amber-700' },
  late: { label: "Muddat o'tdi",    box: 'bg-red-50 border-red-200',      text: 'text-red-700',   bar: 'from-red-500 to-red-600', icon: 'text-red-700' },
};

// Chek-list statistikasi (backend itemStats bilan bir xil ma'noda, lekin ro'yxatdan hisoblanadi)
export function statsFromItems(items = []) {
  const total = items.length;
  let picked = 0;
  let flagged = 0;
  for (const it of items) {
    if (it.picked) picked += 1;
    else if (it.issueType) flagged += 1;
  }
  return { total, picked, flagged, handled: picked + flagged };
}
