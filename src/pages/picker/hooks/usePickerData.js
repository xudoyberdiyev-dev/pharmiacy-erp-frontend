import { useCallback, useEffect, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pickerAPI } from '../../../api';
import socket from '../../../lib/socket';
import { statsFromItems } from '../lib/timer';

// ── Server soati ────────────────────────────────────────────────────────────
// Taymerlar qurilma soatiga emas, serverga nisbatan hisoblanadi (qurilma soati noto'g'ri
// bo'lsa ham "qoldi" to'g'ri ko'rinsin). Har bir javobdagi serverTime orqali siljish yangilanadi.
let clockOffset = 0;
export function syncServerTime(iso) {
  const t = iso ? new Date(iso).getTime() : NaN;
  if (Number.isFinite(t)) clockOffset = t - Date.now();
}
export const serverNow = () => Date.now() + clockOffset;

// 1 soniyada bir yangilanadigan "hozir" (server vaqtida)
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    setNow(serverNow());
    const id = setInterval(() => setNow(serverNow()), intervalMs);
    const onVisible = () => { if (document.visibilityState === 'visible') setNow(serverNow()); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [intervalMs]);
  return now;
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

// ── So'rovlar ───────────────────────────────────────────────────────────────
// Kesh: har bir so'rov HTTP javobning body'sini ({ success, data, serverTime, ... }) saqlaydi.
function useApiQuery(key, fn, options = {}) {
  return useQuery({
    queryKey: ['picker', ...key],
    queryFn: async () => {
      const res = await fn();
      syncServerTime(res.data?.serverTime);
      return res.data;
    },
    staleTime: 5000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    ...options,
  });
}

const selectData = (r) => r.data;
const selectList = (r) => r.data || [];
const selectAvailable = (r) => ({ list: r.data || [], urgentAfterMinutes: r.urgentAfterMinutes });

export const useSummary = () => useApiQuery(['summary'], pickerAPI.getSummary, { select: selectData });
export const useAvailable = () => useApiQuery(['available'], pickerAPI.getAvailable, { select: selectAvailable });
export const useMine = () => useApiQuery(['mine'], pickerAPI.getMine, { select: selectList });
export const useReturned = () => useApiQuery(['returned'], pickerAPI.getReturned, { select: selectList });
export const useEtirozli = () => useApiQuery(['etirozli'], pickerAPI.getEtirozli, { select: selectList });
export const useOrder = (id) =>
  useApiQuery(['order', id], () => pickerAPI.getOrder(id), { select: selectData, enabled: !!id, refetchInterval: 20000 });
export const useDayHistory = (date) =>
  useApiQuery(['history', date], () => pickerAPI.getDayHistory(date), {
    select: selectData, placeholderData: keepPreviousData, refetchInterval: 60000,
  });

// ── Jonli sinxronlash (socket) ──────────────────────────────────────────────
const SYNC_EVENTS = [
  'order:new', 'order:accepted', 'order:released', 'order:cancelled', 'order:returned:picking',
  'order:etirov:raised', 'order:etirov:responded', 'order:picking:done', 'order:status:update', 'order:picker:issue',
];

// Hodisalar kelganda barcha Picker so'rovlari bir marta (debounce) yangilanadi; ulanish holatini qaytaradi.
export function usePickerSocketSync(onEvent) {
  const qc = useQueryClient();
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;
  const [connected, setConnected] = useState(socket.connected);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    let timer = null;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => qc.invalidateQueries({ queryKey: ['picker'] }), 350);
    };
    const offs = SYNC_EVENTS.map((ev) => {
      const h = (payload) => { refresh(); handlerRef.current?.(ev, payload); };
      socket.on(ev, h);
      return () => socket.off(ev, h);
    });
    const onConnect = () => { setConnected(true); refresh(); };
    const onDisconnect = () => setConnected(false);
    const onOnline = () => { setOnline(true); refresh(); };
    const onOffline = () => setOnline(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    setConnected(socket.connected);
    return () => {
      clearTimeout(timer);
      offs.forEach((off) => off());
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [qc]);

  return { connected, online, isOnline: connected && online };
}

// ── Amallar ─────────────────────────────────────────────────────────────────
export function useRefreshAll() {
  const qc = useQueryClient();
  return useCallback(() => qc.invalidateQueries({ queryKey: ['picker'] }), [qc]);
}

// DIQQAT: promise QAYTARILMAYDI. Hook darajasidagi onSettled promise qaytarsa, React Query mutate()
// darajasidagi onSuccess/onError'ni qayta yuklash tugashini kutib chaqiradi — shu orada ekran
// (masalan ReturnedView → ChecklistView) almashib, komponent o'chib ketadi va yo'naltirish/toast ishlamay qoladi.
function useInvalidateAll() {
  const qc = useQueryClient();
  return useCallback(() => { qc.invalidateQueries({ queryKey: ['picker'] }); }, [qc]);
}

export function useAccept() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id) => pickerAPI.accept(id), onSettled: invalidate });
}

export function useUndoAccept() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id) => pickerAPI.undoAccept(id), onSettled: invalidate });
}

export function useComplete() {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (id) => pickerAPI.complete(id), onSettled: invalidate });
}

export function useRespondEtirov() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, action, data }) => (action === 'accept' ? pickerAPI.acceptEtirov(id) : pickerAPI.rejectEtirov(id, data)),
    onSettled: invalidate,
  });
}

// Pozitsiyani belgilash — optimistik: katak darhol o'zgaradi, xato bo'lsa orqaga qaytadi.
function patchOrderItem(order, itemId, patch) {
  if (!order?.items) return order;
  const items = order.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it));
  return { ...order, items, itemStats: statsFromItems(items) };
}

export function useToggleItem(orderId) {
  const qc = useQueryClient();
  const key = ['picker', 'order', orderId];
  const mutationKey = ['picker', 'toggle', orderId];
  return useMutation({
    mutationKey,
    mutationFn: ({ itemId, picked }) => pickerAPI.toggleItem(orderId, itemId, picked),
    onMutate: async ({ itemId, picked }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old) => old && {
        ...old,
        data: patchOrderItem(old.data, itemId, picked
          ? { picked: true, issueType: null, issueNote: null }
          : { picked: false }),
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev); },
    onSettled: () => {
      // bir nechta belgilash ketma-ket bosilganda oxirgisi tugagach bir marta yangilaymiz
      if (qc.isMutating({ mutationKey }) <= 1) qc.invalidateQueries({ queryKey: ['picker'] });
    },
  });
}

export function useReportIssue(orderId) {
  const invalidate = useInvalidateAll();
  return useMutation({ mutationFn: (data) => pickerAPI.reportIssue(orderId, data), onSettled: invalidate });
}
