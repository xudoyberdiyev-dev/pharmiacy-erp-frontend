import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import { formatSum } from '../../lib/format';
import {
  Search, ChevronDown, ChevronLeft, ChevronRight, Plus, X, SearchX, FilterX, ClipboardList,
} from 'lucide-react';
import { COLOR, STATUS, STATUS_ORDER } from './design/tokens';
import { StatusBadge, Skel, EmptyState, ErrorState, Panel, RowMenu, CancelDialog, focusRing, rowFocus, th, thRight, td, tdRight } from './design/components';
import { useLatePipeline, lateOrdersFrom, useCancelOrder } from './useOperatorData';

// ─────────────────────────────────────────────────────────────────────────
// Operator Panel — Buyurtmalar (Phase 04 of the redesign)
//
// Source: design-import/"Operator Panel - Orders.dc.html". Same product
// rules as before (edit/cancel only on the operator's own NEW orders) —
// only the surface changed.
//
// One added, previously-nonfunctional link now works: the Dashboard's
// "Kechikayotgan buyurtmalar" card has always pointed at
// /operator/orders?late=1, but this page never read that param — clicking
// it just opened the plain, unfiltered list. It's honored here for the
// first time. The backend's /orders endpoint only matches a single exact
// status (no "not delivered/cancelled and past deadline" filter), so this
// mode fetches a larger, unpaginated page (300) and filters client-side —
// fine for what is meant to be a quick, order-of-magnitude late-orders
// view, not a substitute for a real backend query once volume grows well
// past that.
//
// Dropped, matching the design: the cancel confirmation no longer asks for
// a reason (the field was optional before, so nothing that was required is
// lost) — dropdown/actions were rebuilt as a real row menu per the canvas's
// row-action-permission spec, and the row-level "no-menu" affordance is
// dropped for a proper disabled+lock state on Tahrirlash instead.
// ─────────────────────────────────────────────────────────────────────────

function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const list = [...set].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  list.forEach((p, i) => { if (i > 0 && p - list[i - 1] > 1) out.push('…'); out.push(p); });
  return out;
}


export default function OperatorOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState(null);

  const isLateView = searchParams.get('late') === '1';

  // Normal list: server-side status/search/pagination
  const listQ = useQuery({
    queryKey: ['op-orders', statusFilter, search, page],
    queryFn: () => orderAPI.getAll({ status: statusFilter || undefined, search: search || undefined, page, limit: 20 }),
    select: r => r.data,
    enabled: !isLateView,
  });
  // Late view: the same in-pipeline data the Dashboard's late panel uses
  const lateQ = useLatePipeline();
  const lateList = isLateView ? lateOrdersFrom(lateQ.data?.rows || []).map(x => x.o) : [];

  const isLoading = isLateView ? lateQ.isLoading : listQ.isLoading;
  const isError = isLateView ? lateQ.isError : listQ.isError;
  const refetch = isLateView ? lateQ.refetch : listQ.refetch;

  const cancelMut = useCancelOrder(() => setCancelTarget(null));

  const orders = isLateView ? lateList : (listQ.data?.data || []);
  const total = isLateView ? lateList.length : (listQ.data?.total || 0);
  const pages = isLateView ? 1 : (listQ.data?.pages || 1);

  const changeSearch = (v) => { setSearch(v); setPage(1); };
  const changeStatus = (s) => {
    setStatus(s); setPage(1);
    const next = new URLSearchParams(searchParams);
    s ? next.set('status', s) : next.delete('status');
    next.delete('late');
    setSearchParams(next);
  };
  const clearLateView = () => { const next = new URLSearchParams(searchParams); next.delete('late'); setSearchParams(next); };

  const hasFilters = !!search || !!statusFilter || isLateView;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="text-[11px] font-semibold tracking-widest" style={{ color: COLOR.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>OPERATOR WORKSPACE</div>
          <h1 className="text-[30px] font-bold leading-tight" style={{ letterSpacing: '-0.025em', color: COLOR.textPrimary }}>Buyurtmalar</h1>
          <p className="text-sm" style={{ color: COLOR.textSecondary }}>Barcha buyurtmalarni qidiring, holatini tekshiring va boshqaring.</p>
        </div>
        <button
          onClick={() => navigate('/operator/orders/new')}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold text-white shrink-0"
          style={{ background: COLOR.primary }}
          onMouseEnter={e => { e.currentTarget.style.background = COLOR.primaryHover; }}
          onMouseLeave={e => { e.currentTarget.style.background = COLOR.primary; }}
        >
          <Plus size={18} strokeWidth={1.75} /> Yangi buyurtma
        </button>
      </div>

      <Panel>
        {/* ── Toolbar ── */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${COLOR.border}` }}>
          <label className="flex-1 min-w-[280px] flex items-center gap-2 h-10 px-3 rounded-lg" style={{ border: `1px solid ${COLOR.borderStrong}`, background: COLOR.surface }}>
            <Search size={16} style={{ color: COLOR.textMuted }} className="shrink-0" />
            <input
              aria-label="Buyurtmalarni qidirish"
              value={search}
              disabled={isLateView}
              onChange={e => changeSearch(e.target.value)}
              placeholder="Faktura, tashkilot yoki buyurtma raqami bo'yicha qidirish..."
              className="flex-1 min-w-0 bg-transparent outline-none text-sm disabled:opacity-50"
              style={{ color: COLOR.textPrimary }}
            />
          </label>
          <label className="flex items-center gap-2 shrink-0">
            <span className="text-[13px] font-medium" style={{ color: '#334155' }}>Holat</span>
            <div className="relative">
              <select
                value={statusFilter}
                disabled={isLateView}
                onChange={e => changeStatus(e.target.value)}
                className="appearance-none w-[180px] h-10 pl-3 pr-8 rounded-lg text-sm disabled:opacity-50"
                style={{ border: `1px solid ${COLOR.borderStrong}`, background: COLOR.surface, color: COLOR.textPrimary }}
              >
                <option value="">Barchasi</option>
                {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS[s].label}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: COLOR.textTertiary }} />
            </div>
          </label>
          <div className="text-[13px] whitespace-nowrap shrink-0 ml-auto" style={{ color: COLOR.textTertiary, fontVariantNumeric: 'tabular-nums' }}>
            {isLoading ? '…' : `${total} ta buyurtma`}
          </div>
        </div>

        {isLateView && (
          <div className="px-5 py-3 flex flex-wrap gap-2 items-center" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
            <span className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-md text-xs font-semibold" style={{ background: COLOR.warningSoft, border: `1px solid ${COLOR.warningBorder}`, color: COLOR.warning }}>
              Faqat kechikayotganlar
              <button onClick={clearLateView} aria-label="Filtrni olib tashlash"><X size={14} /></button>
            </span>
          </div>
        )}

        {/* ── Table ── */}
        {isError ? (
          <ErrorState description="Buyurtmalarni olishning iloji bo'lmadi. Qayta urinib ko'ring." onRetry={refetch} />
        ) : isLoading ? (
          <div className="p-5 flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skel w={120} h={12} /><Skel w={150} h={12} /><Skel w={100} h={12} /><Skel w={90} h={12} /><Skel w={84} h={22} className="!rounded-md" /><Skel w={92} h={12} />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchX} title="Buyurtmalar topilmadi" description="Qidiruv yoki filtr shartlarini o'zgartirib ko'ring."
              action={
                <button
                  onClick={() => { setSearch(''); setStatus(''); setSearchParams({}); }}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold"
                  style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}
                >
                  <FilterX size={15} /> Filtrlarni tozalash
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={ClipboardList} title="Hozircha buyurtmalar mavjud emas" description="Birinchi buyurtmani yaratishdan boshlang."
              action={
                <button onClick={() => navigate('/operator/orders/new')} className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-sm font-semibold text-white" style={{ background: COLOR.primary }}>
                  <Plus size={16} /> Yangi buyurtma
                </button>
              }
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 1140, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: COLOR.subtleSurface }}>
                  <th style={th}>BUYURTMA</th>
                  <th style={th}>TASHKILOT</th>
                  <th style={th}>SHARTNOMA / FAKTURA</th>
                  <th style={thRight}>SUMMA</th>
                  <th style={th}>HOLAT</th>
                  <th style={th}>YARATILGAN</th>
                  <th style={thRight}>AMALLAR</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const isMe = o.createdById === user?.id;
                  const terminal = ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(o.status);
                  return (
                    <tr key={o.id} tabIndex={0} className={`cursor-pointer transition-colors ${rowFocus}`} onClick={() => navigate(`/operator/orders/${o.id}`)}
                      onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) navigate(`/operator/orders/${o.id}`); }}
                      onMouseEnter={e => { e.currentTarget.style.background = COLOR.subtleSurface; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <td style={td}>
                        <div className="flex flex-col gap-0.5">
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: terminal ? COLOR.textTertiary : COLOR.textPrimary, whiteSpace: 'nowrap' }}>#{o.invoiceNumber}</span>
                          {isMe && <span className="text-[11px] font-medium" style={{ color: COLOR.primaryHover }}>Sizning buyurtmangiz</span>}
                        </div>
                      </td>
                      <td style={{ ...td, fontWeight: 500, color: terminal ? COLOR.textTertiary : COLOR.textPrimary, maxWidth: 220 }}>
                        <span className="block truncate" title={o.client?.orgName}>{o.client?.orgName}</span>
                      </td>
                      <td style={td}>
                        <div className="flex flex-col gap-0.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                          <span style={{ color: COLOR.textPrimary, whiteSpace: 'nowrap' }}>{o.contractNumber || '—'}</span>
                          <span style={{ color: COLOR.textTertiary, whiteSpace: 'nowrap' }}>{o.invoiceNumber}</span>
                        </div>
                      </td>
                      <td style={{ ...tdRight, whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: terminal ? COLOR.textTertiary : COLOR.textPrimary }}>{formatSum(o.totalAmount)}</span>{' '}
                        <span style={{ fontSize: 11, color: COLOR.textMuted }}>UZS</span>
                      </td>
                      <td style={td}><StatusBadge status={o.status} order={o} /></td>
                      <td style={{ ...td, color: COLOR.textTertiary, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{format(new Date(o.createdAt), 'dd.MM HH:mm')}</td>
                      <td style={tdRight} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => navigate(`/operator/orders/${o.id}`)}
                            className="inline-flex items-center h-7 px-2.5 rounded-md text-xs font-semibold"
                            style={{ border: `1px solid ${COLOR.border}`, color: COLOR.textSecondary }}
                          >
                            Ko'rish
                          </button>
                          <RowMenu
                            order={o} isMe={isMe}
                            onEdit={(ord) => navigate(`/operator/orders/${ord.id}`)}
                            onCancel={(ord) => setCancelTarget(ord)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {!isLateView && !isLoading && !isError && orders.length > 0 && pages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3" style={{ borderTop: `1px solid ${COLOR.border}`, background: COLOR.subtleSurface }}>
            <div className="text-xs" style={{ color: COLOR.textTertiary, fontVariantNumeric: 'tabular-nums' }}>
              {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} / {total} ta
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}
              >
                <ChevronLeft size={15} /> Oldingi
              </button>
              {pageList(page, pages).map((p, i) => p === '…' ? (
                <span key={`e${i}`} className="w-8 h-8 flex items-center justify-center text-[13px]" style={{ color: COLOR.textMuted }}>…</span>
              ) : (
                <button
                  key={p} onClick={() => setPage(p)}
                  className="min-w-[32px] h-8 px-1 rounded-lg text-[13px] font-semibold"
                  style={p === page
                    ? { background: COLOR.primary, border: `1px solid ${COLOR.primary}`, color: '#fff' }
                    : { border: `1px solid ${COLOR.border}`, color: '#334155', background: COLOR.surface }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ border: `1px solid ${COLOR.borderStrong}`, color: COLOR.textPrimary, background: COLOR.surface }}
              >
                Keyingi <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </Panel>

      {cancelTarget && (
        <CancelDialog
          order={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={() => cancelMut.mutate(cancelTarget.id)}
          loading={cancelMut.isPending}
        />
      )}
    </div>
  );
}
