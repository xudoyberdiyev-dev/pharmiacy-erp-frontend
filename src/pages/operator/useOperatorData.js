import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { orderAPI } from '../../api';
import { getErrorMessage } from '../../lib/errors';
import { STATUS_ORDER } from './design/tokens';

// ─────────────────────────────────────────────────────────────────────────
// Operator data hooks — the single place the layout badge and the
// Dashboard get their numbers from, so the two can never disagree.
//
// Why not one big "GET /orders?limit=100" like before: everything computed
// from that page (status split, "kechikayotgan", the nav badge) silently
// became a 100-row sample once real volume passed 100, while the "Jami"
// KPI read the server's true total — the two visibly disagreed (141 vs
// 100). The backend has no dedicated summary endpoint and GET /orders only
// matches ONE exact status, so accuracy comes from what it does offer:
//   • counts  — one limit:1 request per status, reading the server's own
//               `total` (exact, tiny payloads)
//   • today   — the server's Asia/Tashkent `date` filter, newest first
//   • late    — the four in-pipeline statuses (NEW/PICKING/MARKING/
//               CHECKING) fetched in full (LATE_CANDIDATE_LIMIT each) and
//               checked against their deadlines. There is no server-side
//               "past deadline" filter, so this part is still evaluated in
//               the browser — but over the whole pipeline, not a slice of
//               all history.
// A dedicated summary endpoint would collapse all of this into one call;
// noted as a recommended backend follow-up rather than done unasked.
// ─────────────────────────────────────────────────────────────────────────

export const PIPELINE_STATUSES = ['NEW', 'PICKING', 'MARKING', 'CHECKING'];
export const LATE_CANDIDATE_LIMIT = 500;
const POLL_MS = 30000;

// Asia/Tashkent calendar day (yyyy-MM-dd), independent of the browser's tz
export function tashkentToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(new Date());
}

export function useOrderCounts() {
  return useQuery({
    queryKey: ['operator-counts'],
    queryFn: async () => {
      const results = await Promise.all(STATUS_ORDER.map(s => orderAPI.getAll({ status: s, limit: 1 })));
      const byStatus = {};
      STATUS_ORDER.forEach((s, i) => { byStatus[s] = results[i].data?.total ?? 0; });
      const total = STATUS_ORDER.reduce((sum, s) => sum + byStatus[s], 0);
      // "Faol" = DELIVERED / CANCELLED bo'lmagan barcha buyurtmalar
      const active = total - byStatus.DELIVERED - byStatus.CANCELLED;
      return { byStatus, total, active };
    },
    refetchInterval: POLL_MS,
  });
}

export function useTodayOrders(limit = 8) {
  const date = tashkentToday();
  return useQuery({
    queryKey: ['operator-today', date],
    queryFn: () => orderAPI.getAll({ date, limit }),
    select: r => ({ rows: r.data?.data || [], total: r.data?.total ?? 0 }),
    refetchInterval: POLL_MS,
  });
}

export function useLatePipeline() {
  return useQuery({
    queryKey: ['operator-late'],
    queryFn: async () => {
      const results = await Promise.all(
        PIPELINE_STATUSES.map(s => orderAPI.getAll({ status: s, limit: LATE_CANDIDATE_LIMIT })),
      );
      const rows = results.flatMap(r => r.data?.data || []);
      const truncated = results.some(r => (r.data?.total ?? 0) > (r.data?.data?.length ?? 0));
      return { rows, truncated };
    },
    refetchInterval: POLL_MS,
  });
}

// The deadline that matters for an order's *current* stage
export function currentDeadline(o) {
  const d = ['NEW', 'PICKING'].includes(o.status) ? o.pickingDeadline
    : o.status === 'MARKING' ? o.markingDeadline
    : o.status === 'CHECKING' ? o.checkingDeadline
    : null;
  return d ? new Date(d) : null;
}

export function lateOrdersFrom(rows, now = new Date()) {
  return rows
    .map(o => ({ o, deadline: currentDeadline(o) }))
    .filter(x => x.deadline && x.deadline < now)
    .sort((a, b) => a.deadline - b.deadline)
    .map(x => ({ ...x, overMin: Math.round((now - x.deadline) / 60000) }));
}

export function invalidateOperatorData(qc) {
  ['operator-counts', 'operator-today', 'operator-late', 'op-orders', 'op-orders-late'].forEach(k =>
    qc.invalidateQueries({ queryKey: [k] }),
  );
}

export function useCancelOrder(onDone) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => orderAPI.cancel(id),
    onSuccess: () => {
      toast.success('Buyurtma bekor qilindi');
      invalidateOperatorData(qc);
      onDone?.();
    },
    onError: e => toast.error(getErrorMessage(e)),
  });
}
