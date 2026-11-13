import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pickerAPI } from '../../../api';

// Oyna kengligi — layout rejimini tanlash uchun
export function useViewportWidth() {
  const [w, setW] = useState(() => (typeof window === 'undefined' ? 1440 : window.innerWidth));
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return w;
}

// Brauzer internet holati — oflayn bo'lsa server tasdig'ini talab qiladigan amallar o'chiriladi
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

// Har `ms` da yangilanadigan "hozir" (taymerlar uchun). Yashirin tabdan
// qaytilganda darhol yangilanadi — taymer orqada qolib ketmaydi.
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    const vis = () => { if (!document.hidden) setNow(Date.now()); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); };
  }, [ms]);
  return now;
}

// Navigatsiya badge'lari uchun yagona agregat so'rov (GET /picker/stats)
export function usePickerStats() {
  return useQuery({
    queryKey: ['picker-stats'],
    queryFn: pickerAPI.getStats,
    refetchInterval: 15000,
    select: (r) => r.data.data,
  });
}

// Layout rejimlari (dizayn spetsifikatsiyasi bo'yicha)
export function layoutMode(vw) {
  if (vw < 640) return 'mobile';
  if (vw < 900) return 'drawer';
  return 'split';
}
