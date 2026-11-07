import { useCallback, useEffect, useMemo, useState } from 'react';

// Qo'ng'iroq (bell) bildirishnomalari: faqat shu qurilmada (localStorage), socket hodisalaridan hosil bo'ladi.
// Serverda "picker bildirishnomalari" jadvali yo'q — shuning uchun yangi hodisalar yo'qolib ketmasligi uchun
// oxirgi 30 tasi saqlanadi.
const MAX = 30;

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch { return []; }
}
function save(key, items) {
  try { localStorage.setItem(key, JSON.stringify(items.slice(0, MAX))); } catch { /* private mode / quota */ }
}

// Socket hodisasi → bildirishnoma (yoki null — bu picker'ga tegishli emas)
export function eventToNotification(event, p = {}, meId) {
  const at = Date.now();
  if (event === 'order:new') {
    return { id: `new:${p.orderId}`, kind: 'new', title: 'Yangi buyurtma navbatda', text: p.clientName || '', orderId: p.orderId, at };
  }
  if (event === 'order:returned:picking' && p.pickerId === meId) {
    const who = p.checkerName ? `Checker ${p.checkerName}` : p.markerName ? `Marker ${p.markerName}` : 'Buyurtma';
    return { id: `ret:${p.orderId}:${at}`, kind: 'returned', title: 'Buyurtma qaytarildi', text: `${who} qaytardi — tuzatib qayta yuboring`, orderId: p.orderId, at };
  }
  if (event === 'order:etirov:raised' && (p.pickerId === meId || (p.target === 'PICKER' && p.targetUserId === meId))) {
    return { id: `et:${p.orderId}:${at}`, kind: 'etirov', title: 'Yangi etiroz', text: 'Javob berishingiz kerak', orderId: p.orderId, at };
  }
  return null;
}

export function useNotificationCenter(userId) {
  const key = `picker-notifs:${userId || 'anon'}`;
  const [items, setItems] = useState(() => load(key));

  useEffect(() => { setItems(load(key)); }, [key]);
  useEffect(() => { save(key, items); }, [key, items]);

  const push = useCallback((n) => {
    setItems((prev) => (prev.some((x) => x.id === n.id) ? prev : [{ ...n, read: false }, ...prev].slice(0, MAX)));
  }, []);
  const markAllRead = useCallback(() => setItems((prev) => prev.map((x) => (x.read ? x : { ...x, read: true }))), []);
  const markRead = useCallback((id) => setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x))), []);
  const clear = useCallback(() => setItems([]), []);

  return useMemo(() => ({
    items,
    unread: items.filter((x) => !x.read).length,
    push, markAllRead, markRead, clear,
  }), [items, push, markAllRead, markRead, clear]);
}

// "2 daq oldin", "1 s oldin", "kecha"
export function timeAgo(at, now = Date.now()) {
  const m = Math.max(0, Math.round((now - at) / 60000));
  if (m < 1) return 'hozir';
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} s oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}
