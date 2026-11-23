import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { documentAPI } from '../../../api';

// Brauzer internet holati — oflayn bo'lsa server talab qiladigan amallar o'chiriladi
export function useOnline() {
  const [on, setOn] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  useEffect(() => {
    const up = () => setOn(true);
    const down = () => setOn(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return on;
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// Blob javobni fayl sifatida yuklab berish
export function saveBlob(data, filename) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function useViewportWidth() {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return w;
}

// Navigatsiya badge'lari uchun yagona yengil so'rov (GET /document/counts)
export function useDocCounts() {
  return useQuery({
    queryKey: ['document', 'counts'],
    queryFn: documentAPI.getCounts,
    refetchInterval: 20000,
    select: (r) => r.data.data,
  });
}

// Mijoz tomonida sahifalash (ro'yxat to'liq keladigan endpointlar uchun).
// Filtr o'zgarsa yoki ro'yxat qisqarsa sahifa chegaradan chiqib ketmaydi.
export function usePaged(list, initialSize = 20) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(initialSize);
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const cur = Math.min(page, pages);
  const items = useMemo(() => list.slice((cur - 1) * size, cur * size), [list, cur, size]);
  return {
    items, page: cur, size, total, pages,
    setPage,
    setSize: (s) => { setSize(s); setPage(1); },
    reset: () => setPage(1),
  };
}

// Tanlov: faqat hozir ro'yxatda mavjud bo'lgan ID'larni saqlaydi —
// refetch'dan keyin yo'qolgan buyurtmalar tanlovda "osilib" qolmaydi.
export function useSelection(availableIds) {
  const [raw, setRaw] = useState(() => new Set());
  const avail = useMemo(() => new Set(availableIds), [availableIds]);
  const selected = useMemo(() => [...raw].filter((id) => avail.has(id)), [raw, avail]);
  useEffect(() => {
    if (selected.length !== raw.size) setRaw(new Set(selected));
  }, [selected, raw]);
  const has = (id) => raw.has(id) && avail.has(id);
  return {
    selected,
    has,
    toggle: (id) => setRaw((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }),
    setMany: (ids, on) => setRaw((p) => { const n = new Set(p); ids.forEach((id) => (on ? n.add(id) : n.delete(id))); return n; }),
    clear: () => setRaw(new Set()),
  };
}
