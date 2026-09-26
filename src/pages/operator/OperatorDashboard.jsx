import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ClipboardList, CalendarDays, Truck, AlertTriangle, Plus, ArrowRight,
  PieChart, CheckCircle2, Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatSum } from '../../lib/format';
import { COLOR, STATUS, STATUS_ORDER } from './design/tokens';
import {
  StatusBadge, Skel, Spinner, EmptyState, ErrorState, SecondaryButton, Panel, PanelHeader,
  RowMenu, CancelDialog, focusRing, rowFocus, th, thRight, td, tdRight, tableCls,
} from './design/components';
import {
  useOrderCounts, useTodayOrders, useLatePipeline, lateOrdersFrom, useCancelOrder, LATE_CANDIDATE_LIMIT,
} from './useOperatorData';

// ─────────────────────────────────────────────────────────────────────────
// Operator Panel — Dashboard
//
// Source: design-import/"Operator Panel - Dashboard.dc.html".
//
// Data (see useOperatorData.js for the reasoning): every number here comes
// from GET /orders — status totals from the server's own `total` per
// status, "bugungi" from its Asia/Tashkent `date` filter, "kechikayotgan"
// evaluated over the full in-pipeline set. Nothing is hardcoded or
// sampled from a fixed first page any more.
//
// Scope call: "Bugungi buyurtmalar" is system-wide (all operators), not
// only the signed-in operator's — the design's copy reads as a shared
// workspace view and the KPI tile and table must share one scope.
// ─────────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, iconBg, iconColor, sub, warn, onClick, loading, unavailable }) {
  if (loading) {
    return (
      <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
        <div className="flex items-start justify-between gap-3">
          <Skel w={104} h={12} />
          <Skel w={32} h={32} className="!rounded-lg" />
        </div>
        <Skel w={88} h={32} className="!rounded-md" />
        <Skel w={140} h={10} />
      </div>
    );
  }
  if (unavailable) {
    return (
      <div className="rounded-xl p-5 flex flex-col gap-3" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
        <div className="flex items-start justify-between gap-3">
          <span className="text-[13px] font-medium" style={{ color: COLOR.textSecondary }}>{label}</span>
          <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: COLOR.mutedSurface, color: COLOR.textMuted }}>
            <Icon size={18} strokeWidth={1.75} />
          </span>
        </div>
        <div className="text-[32px] font-bold leading-none" style={{ letterSpacing: '-0.03em', color: COLOR.textDisabled }}>—</div>
        <div className="text-xs" style={{ color: COLOR.textMuted }}>Ma'lumot mavjud emas</div>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl p-5 flex flex-col gap-3 transition-all ${focusRing}`}
      style={{ background: COLOR.surface, border: `1px solid ${warn ? COLOR.warningBorder : COLOR.border}` }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = warn ? COLOR.warning : '#A5B4FC'; e.currentTarget.style.boxShadow = COLOR.shadowDropdown; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = warn ? COLOR.warningBorder : COLOR.border; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium" style={{ color: COLOR.textSecondary }}>{label}</span>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: iconBg, color: iconColor }}>
          <Icon size={18} strokeWidth={1.75} />
        </span>
      </div>
      <div className="text-[32px] font-bold leading-none" style={{ letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: warn ? COLOR.warning : COLOR.textPrimary }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: COLOR.textTertiary }}>{sub}</div>
    </button>
  );
}

function StatusDistribution({ query }) {
  const header = (total) => (
    <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-5" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>Buyurtmalar holati</h2>
        <p className="text-[13px]" style={{ color: COLOR.textTertiary }}>Buyurtmalarning joriy jarayon bo'yicha taqsimoti.</p>
      </div>
      {total != null && (
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold" style={{ fontVariantNumeric: 'tabular-nums', color: COLOR.textPrimary }}>{total}</span>
          <span className="text-xs" style={{ color: COLOR.textTertiary }}>jami</span>
        </div>
      )}
    </div>
  );

  if (query.isLoading) {
    return (
      <Panel>
        {header(null)}
        <div className="p-5 flex flex-col gap-5">
          <Skel w="100%" h={12} className="!rounded-md" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5"><Skel w="70%" h={10} /><Skel w="40%" h={14} /></div>
            ))}
          </div>
        </div>
      </Panel>
    );
  }
  if (query.isError) {
    return (
      <Panel className="!border-[#FECACA]">
        {header(null)}
        <ErrorState description="Server bilan aloqa uzildi." onRetry={query.refetch} />
      </Panel>
    );
  }

  const { byStatus, total } = query.data;
  if (total === 0) {
    return (
      <Panel>
        {header(0)}
        <div className="p-5">
          <EmptyState icon={PieChart} title="Holatlar bo'yicha ma'lumot topilmadi." description="Buyurtmalar yaratilgach taqsimot ko'rinadi." />
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      {header(total)}
      <div className="px-6 py-5 flex flex-col gap-5">
        <div className="flex h-3 rounded-md overflow-hidden gap-[2px]" style={{ background: COLOR.mutedSurface }}>
          {STATUS_ORDER.filter(s => byStatus[s] > 0).map(s => (
            <div key={s} style={{ width: `${(byStatus[s] / total) * 100}%`, background: STATUS[s].dot }} title={`${STATUS[s].label}: ${byStatus[s]}`} />
          ))}
        </div>
        {/* All nine statuses, always — 9 divides evenly into 3 columns, so
            the grid never ends on an empty cell whatever the counts are. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-lg overflow-hidden" style={{ background: COLOR.borderSubtle, border: `1px solid ${COLOR.borderSubtle}` }}>
          {STATUS_ORDER.map(s => {
            const count = byStatus[s];
            const pct = (count / total) * 100;
            return (
              <div key={s} className="p-3.5 flex items-center justify-between gap-2 sm:flex-col sm:items-stretch sm:justify-start" style={{ background: COLOR.surface }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: STATUS[s].dot }} />
                  <span className="text-[13px] font-medium truncate" style={{ color: COLOR.textSecondary }}>{STATUS[s].label}</span>
                </div>
                <div className="flex items-baseline gap-2 sm:justify-between">
                  <span className="text-lg font-semibold" style={{ fontVariantNumeric: 'tabular-nums', color: count ? COLOR.textPrimary : COLOR.textMuted }}>{count}</span>
                  <span className="text-xs" style={{ fontVariantNumeric: 'tabular-nums', color: COLOR.textMuted }}>{pct.toFixed(1)}%</span>
                </div>
                <div className="hidden sm:block h-1 rounded-full overflow-hidden" style={{ background: COLOR.mutedSurface }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: STATUS[s].dot }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function fmtDuration(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h > 0) return `${h} soat${m > 0 ? ` ${m} daq` : ''}`;
  return `${m} daqiqa`;
}

function responsibleFor(o) {
  if (['NEW', 'PICKING'].includes(o.status)) return o.assignedPicker?.fullName;
  if (o.status === 'MARKING') return o.marker?.fullName;
  if (o.status === 'CHECKING') return o.checker?.fullName;
  return null;
}

function ViewButton({ onClick, block }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md text-xs font-semibold ${focusRing} ${block ? 'w-full h-10 rounded-lg text-[13px]' : 'h-7 px-2.5'}`}
      style={{ border: `1px solid ${block ? COLOR.borderStrong : COLOR.border}`, color: block ? COLOR.textPrimary : COLOR.textSecondary, background: COLOR.surface }}
    >
      <Eye size={13} /> Ko'rish
    </button>
  );
}

function SkeletonRows({ n = 4, w = 60 }) {
  return (
    <div className="p-5 flex flex-col gap-3.5">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex items-center gap-3"><Skel w="100%" h={12} /><Skel w={w} h={12} /></div>
      ))}
    </div>
  );
}

export default function OperatorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cancelTarget, setCancelTarget] = useState(null);

  const counts = useOrderCounts();
  const today = useTodayOrders(8);
  const pipeline = useLatePipeline();
  const cancelMut = useCancelOrder(() => setCancelTarget(null));

  const now = new Date();
  const late = pipeline.data ? lateOrdersFrom(pipeline.data.rows, now) : [];
  const goView = (o) => navigate(`/operator/orders/${o.id}`);
  const rowProps = (o) => ({
    tabIndex: 0,
    onClick: () => goView(o),
    onKeyDown: (e) => { if (e.key === 'Enter' && e.target === e.currentTarget) goView(o); },
    onMouseEnter: (e) => { e.currentTarget.style.background = COLOR.subtleSurface; },
    onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; },
  });

  return (
    <div className="flex flex-col gap-8">

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-end justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="text-[11px] font-semibold tracking-widest" style={{ color: COLOR.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>OPERATOR WORKSPACE</div>
          <h1 className="text-[24px] sm:text-[30px] font-bold leading-tight" style={{ letterSpacing: '-0.025em', color: COLOR.textPrimary }}>Dashboard</h1>
          <p className="text-sm" style={{ color: COLOR.textSecondary }}>Buyurtmalar va kundalik faoliyatni bir joydan boshqaring.</p>
        </div>
        <button
          onClick={() => navigate('/operator/orders/new')}
          className={`inline-flex items-center justify-center gap-2 h-11 sm:h-10 px-4 rounded-lg text-sm font-semibold text-white shrink-0 transition-colors ${focusRing}`}
          style={{ background: COLOR.primary }}
          onMouseEnter={e => { e.currentTarget.style.background = COLOR.primaryHover; }}
          onMouseLeave={e => { e.currentTarget.style.background = COLOR.primary; }}
        >
          <Plus size={18} strokeWidth={1.75} /> Yangi buyurtma
        </button>
      </div>

      {/* ── KPI cards — each one loads / fails independently ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Jami buyurtmalar" icon={ClipboardList} iconBg={COLOR.mutedSurface} iconColor={COLOR.textSecondary}
          loading={counts.isLoading} unavailable={counts.isError}
          value={counts.data?.total} sub="Barcha buyurtmalar" onClick={() => navigate('/operator/orders')}
        />
        <KpiCard
          label="Bugungi buyurtmalar" icon={CalendarDays} iconBg={COLOR.primarySoft} iconColor={COLOR.primaryHover}
          loading={today.isLoading} unavailable={today.isError}
          value={today.data?.total} sub="Bugun yaratilgan buyurtmalar" onClick={() => navigate('/operator/orders')}
        />
        <KpiCard
          label="Jarayondagi buyurtmalar" icon={Truck} iconBg={COLOR.infoSoft} iconColor={COLOR.info}
          loading={counts.isLoading} unavailable={counts.isError}
          value={counts.data?.byStatus.IN_TRANSIT} sub="Yetkazib berish jarayonida" onClick={() => navigate('/operator/orders?status=IN_TRANSIT')}
        />
        <KpiCard
          label="Kechikayotgan buyurtmalar" icon={AlertTriangle} iconBg={COLOR.warningSoft} iconColor={COLOR.warning} warn
          loading={pipeline.isLoading} unavailable={pipeline.isError}
          value={late.length} sub="Muddatni tekshirish kerak" onClick={() => navigate('/operator/orders?late=1')}
        />
      </div>

      {/* ── Status distribution ── */}
      <StatusDistribution query={counts} />

      {/* ── Late orders ── */}
      <Panel className={pipeline.isError ? '!border-[#FECACA]' : ''}>
        <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-5" style={{ borderBottom: `1px solid ${COLOR.borderSubtle}` }}>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <AlertTriangle size={18} style={{ color: COLOR.warning }} />
              <h2 className="text-base font-semibold" style={{ color: COLOR.textPrimary }}>Kechikayotgan buyurtmalar</h2>
              {late.length > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center" style={{ background: COLOR.warningSoft, border: `1px solid ${COLOR.warningBorder}`, color: COLOR.warning, fontVariantNumeric: 'tabular-nums' }}>
                  {late.length}
                </span>
              )}
            </div>
            <p className="text-[13px]" style={{ color: COLOR.textTertiary }}>Muddatidan o'tgan yoki tekshirish talab qilinadigan buyurtmalar.</p>
          </div>
          {late.length > 0 && (
            <SecondaryButton icon={ArrowRight} onClick={() => navigate('/operator/orders?late=1')}>Barchasini ko'rish</SecondaryButton>
          )}
        </div>

        {pipeline.isLoading ? <SkeletonRows /> : pipeline.isError ? (
          <ErrorState description="Kechikish ro'yxatini olish imkoni bo'lmadi." onRetry={pipeline.refetch} />
        ) : late.length === 0 ? (
          <div className="p-5 flex"><EmptyState tone="good" icon={CheckCircle2} title="Kechikayotgan buyurtmalar mavjud emas." description="Barcha buyurtmalar muddat ichida." /></div>
        ) : (
          <>
            {/* desktop / tablet: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className={`w-full ${tableCls}`} style={{ minWidth: 820, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: COLOR.subtleSurface }}>
                    <th style={th}>BUYURTMA</th><th style={th}>TASHKILOT</th><th style={th}>HOLAT</th>
                    <th style={thRight}>KECHIKISH</th><th style={th}>MAS'UL XODIM</th><th style={thRight}>AMAL</th>
                  </tr>
                </thead>
                <tbody>
                  {late.slice(0, 8).map(({ o, overMin }) => {
                    const severe = overMin >= 120;
                    return (
                      <tr key={o.id} className={`cursor-pointer transition-colors ${rowFocus}`} {...rowProps(o)}>
                        <td style={{ ...td, borderLeft: `3px solid ${severe ? COLOR.danger : COLOR.warning}`, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: COLOR.textPrimary, whiteSpace: 'nowrap' }}>#{o.invoiceNumber}</td>
                        <td style={{ ...td, fontWeight: 500 }}>{o.client?.orgName}</td>
                        <td style={td}><StatusBadge status={o.status} order={o} /></td>
                        <td style={{ ...tdRight, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: severe ? '#B91C1C' : '#B45309', whiteSpace: 'nowrap' }}>{fmtDuration(overMin)}</td>
                        <td style={{ ...td, color: COLOR.textSecondary, whiteSpace: 'nowrap' }}>{responsibleFor(o) || '—'}</td>
                        <td style={tdRight} onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 justify-end">
                            <ViewButton onClick={() => goView(o)} />
                            <RowMenu order={o} isMe={o.createdById === user?.id} onEdit={goView} onCancel={setCancelTarget} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* mobile: record cards — the urgency marker survives the transform */}
            <div className="md:hidden p-4 flex flex-col gap-3">
              {late.slice(0, 8).map(({ o, overMin }) => {
                const severe = overMin >= 120;
                return (
                  <div key={o.id} className="rounded-[10px] p-3.5 flex flex-col gap-2.5" style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}`, borderLeft: `3px solid ${severe ? COLOR.danger : COLOR.warning}` }}>
                    <div className="flex items-center justify-between gap-2.5">
                      <span className="text-[13px] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{o.invoiceNumber}</span>
                      <StatusBadge status={o.status} order={o} />
                    </div>
                    <div className="text-[13px] font-medium">{o.client?.orgName}</div>
                    <div className="flex items-center justify-between gap-2.5 text-xs" style={{ color: COLOR.textTertiary }}>
                      <span>{responsibleFor(o) || '—'}</span>
                      <span className="font-semibold" style={{ color: severe ? '#B91C1C' : '#B45309', fontVariantNumeric: 'tabular-nums' }}>{fmtDuration(overMin)}</span>
                    </div>
                    <ViewButton block onClick={() => goView(o)} />
                  </div>
                );
              })}
              <SecondaryButton onClick={() => navigate('/operator/orders?late=1')} className="!w-full !h-10 justify-center">Barchasini ko'rish</SecondaryButton>
            </div>
            {pipeline.data?.truncated && (
              <p className="px-6 py-3 text-xs" style={{ borderTop: `1px solid ${COLOR.border}`, background: COLOR.subtleSurface, color: COLOR.textTertiary }}>
                Har bosqichda eng ko'pi bilan {LATE_CANDIDATE_LIMIT} ta buyurtma tekshirildi.
              </p>
            )}
          </>
        )}
      </Panel>

      {/* ── Today's orders (all operators) ── */}
      <Panel className={today.isError ? '!border-[#FECACA]' : ''}>
        <PanelHeader
          title="Bugungi buyurtmalar"
          description="Bugun yaratilgan va jarayonda bo'lgan buyurtmalar."
          action={<SecondaryButton icon={ArrowRight} onClick={() => navigate('/operator/orders')}>Barcha buyurtmalar</SecondaryButton>}
        />
        {today.isLoading ? (
          <>
            <SkeletonRows w={80} />
            <div className="px-5 pb-5 -mt-2 flex items-center gap-2"><Spinner size={16} /><span className="text-[13px]" style={{ color: COLOR.textTertiary }}>Yuklanmoqda</span></div>
          </>
        ) : today.isError ? (
          <ErrorState description="Bugungi buyurtmalarni olish imkoni bo'lmadi." onRetry={today.refetch} />
        ) : today.data.rows.length === 0 ? (
          <div className="p-5 flex">
            <EmptyState
              icon={ClipboardList} title="Buguncha buyurtmalar mavjud emas." description="Yangi buyurtma yaratib boshlang."
              action={
                <button onClick={() => navigate('/operator/orders/new')} className={`inline-flex items-center gap-2 h-8 px-3 rounded-lg text-[13px] font-semibold text-white ${focusRing}`} style={{ background: COLOR.primary }}>
                  <Plus size={16} /> Yangi buyurtma
                </button>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className={`w-full ${tableCls}`} style={{ minWidth: 820, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: COLOR.subtleSurface }}>
                    <th style={th}>BUYURTMA</th><th style={th}>TASHKILOT</th><th style={thRight}>SUMMA</th>
                    <th style={th}>HOLAT</th><th style={thRight}>VAQT</th><th style={thRight}>AMAL</th>
                  </tr>
                </thead>
                <tbody>
                  {today.data.rows.map(o => (
                    <tr key={o.id} className={`cursor-pointer transition-colors ${rowFocus}`} {...rowProps(o)}>
                      <td style={{ ...td, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, color: COLOR.textPrimary, whiteSpace: 'nowrap' }}>#{o.invoiceNumber}</td>
                      <td style={{ ...td, fontWeight: 500 }}>{o.client?.orgName}</td>
                      <td style={{ ...tdRight, fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatSum(o.totalAmount)}</td>
                      <td style={td}><StatusBadge status={o.status} order={o} /></td>
                      <td style={{ ...tdRight, color: COLOR.textTertiary, fontVariantNumeric: 'tabular-nums' }}>{format(new Date(o.createdAt), 'HH:mm')}</td>
                      <td style={tdRight} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5 justify-end">
                          <ViewButton onClick={() => goView(o)} />
                          <RowMenu order={o} isMe={o.createdById === user?.id} onEdit={goView} onCancel={setCancelTarget} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden p-4 flex flex-col gap-3">
              {today.data.rows.map(o => (
                <button key={o.id} onClick={() => goView(o)} className={`text-left rounded-[10px] p-3.5 flex flex-col gap-2.5 ${focusRing}`} style={{ background: COLOR.surface, border: `1px solid ${COLOR.border}` }}>
                  <div className="flex items-center justify-between gap-2.5">
                    <span className="text-[13px] font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{o.invoiceNumber}</span>
                    <span className="text-xs" style={{ color: COLOR.textTertiary, fontVariantNumeric: 'tabular-nums' }}>{format(new Date(o.createdAt), 'HH:mm')}</span>
                  </div>
                  <div className="text-[13px] font-medium">{o.client?.orgName}</div>
                  <div className="flex items-center justify-between gap-2.5">
                    <StatusBadge status={o.status} order={o} />
                    <span className="text-sm font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatSum(o.totalAmount)}</span>
                  </div>
                </button>
              ))}
              <SecondaryButton onClick={() => navigate('/operator/orders')} className="!w-full !h-10 justify-center">Barcha buyurtmalar</SecondaryButton>
            </div>
            <div className="px-6 py-3 text-xs" style={{ borderTop: `1px solid ${COLOR.border}`, background: COLOR.subtleSurface, color: COLOR.textTertiary }}>
              {today.data.total > today.data.rows.length ? `Oxirgi ${today.data.rows.length} ta ko'rsatilmoqda, jami ${today.data.total} ta. ` : ''}Barcha summalar so'mda (UZS).
            </div>
          </>
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
