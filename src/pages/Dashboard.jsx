import { useState } from "react";
import {
  Package, Layers, AlertTriangle, Clock, CheckCircle,
  TrendingUp, TrendingDown, ArrowRight, Activity,
  ShoppingCart, FileText, Barcode, FlaskConical,
  ChevronRight, Banknote, BoxSelect, Archive,
  FileCode, BarChart3, RefreshCw,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────
const STATS = {
  totalProducts:  47,
  totalBatches:   128,
  totalQty:       14820,
  expiredCount:   3,
  expiringSoon:   7,
  todayReceipts:  2,
  totalContracts: 18,
  totalValue:     89_430_000,
};

const RECENT_ACTIVITY = [
  { id: 1, type: "receipt",   text: "Paracetamol 500mg kirdi",       sub: "240 dona · SH-2026-045",   time: "2 soat oldin",    color: "green"  },
  { id: 2, type: "expiry",    text: "Vitamin C 1000mg muddati tugayapti", sub: "5 dona qoldi",        time: "Bugun",           color: "yellow" },
  { id: 3, type: "receipt",   text: "Amoxicillin 250mg kirdi",        sub: "80 dona · SH-2026-031",   time: "Kecha",           color: "green"  },
  { id: 4, type: "expired",   text: "Ibuprofen 200mg muddati o'tdi",  sub: "12 dona · F-2026-0188",   time: "2 kun oldin",     color: "red"    },
  { id: 5, type: "contract",  text: "Yangi shartnoma tuzildi",        sub: "SH-2026-049 · Medexport", time: "3 kun oldin",     color: "blue"   },
];

const EXPIRING_SOON = [
  { id: 1, name: "Vitamin C 1000mg",  series: "478011199001",    expiry: "2026-06-25", qty: 5,  daysLeft: 5  },
  { id: 2, name: "Paracetamol 500mg", series: "478001167783022", expiry: "2026-07-10", qty: 18, daysLeft: 20 },
  { id: 3, name: "Aspirin 100mg",     series: "478044556677",    expiry: "2026-07-18", qty: 30, daysLeft: 28 },
];

const EXPIRED = [
  { id: 4, name: "Ibuprofen 200mg",   series: "478044112233", expiry: "2026-06-10", qty: 12 },
  { id: 5, name: "Ampioks 250mg",     series: "478012344321", expiry: "2026-05-30", qty: 4  },
];

const TOP_PRODUCTS = [
  { name: "Paracetamol 500mg", qty: 258,  pct: 95 },
  { name: "Amoxicillin 250mg", qty: 65,   pct: 40 },
  { name: "Aspirin 100mg",     qty: 30,   pct: 22 },
  { name: "Vitamin C 1000mg",  qty: 5,    pct: 8  },
];

const QUICK_LINKS = [
  { label: "Yangi mahsulot",   icon: Package,     color: "blue",   desc: "Karta yarating"     },
  { label: "Partiya qo'shish", icon: Layers,      color: "violet", desc: "Yangi kiraim"       },
  { label: "Shartnoma",        icon: FileText,    color: "teal",   desc: "Hujjat rasmiylashtiring" },
  { label: "Markировка",       icon: Barcode,     color: "amber",  desc: "Kod tekshiring"     },
  { label: "Excel import",     icon: FileCode,    color: "green",  desc: "Fayl yuklang"       },
  { label: "Hisobot",          icon: BarChart3,   color: "rose",   desc: "Ma'lumotlar eksport" },
];

const formatPrice = (p) => {
  if (p >= 1_000_000) return (p / 1_000_000).toFixed(1) + " mln so'm";
  return Number(p).toLocaleString("uz-UZ") + " so'm";
};
const formatDate = (d) => new Date(d).toLocaleDateString("uz-UZ");

function StatCard({ icon: Icon, value, label, accent, trend, trendLabel }) {
  return (
    <div className={`stat-card sc-${accent}`}>
      <div className={`sc-icon sc-icon-${accent}`}><Icon size={20} strokeWidth={2} /></div>
      <div className="sc-body">
        <div className="sc-value">{value}</div>
        <div className="sc-label">{label}</div>
        {trendLabel && (
          <div className={`sc-trend ${trend === "up" ? "t-up" : trend === "down" ? "t-down" : "t-neutral"}`}>
            {trend === "up" ? <TrendingUp size={11} /> : trend === "down" ? <TrendingDown size={11} /> : null}
            {trendLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityIcon({ type }) {
  if (type === "receipt")  return <div className="act-dot dot-green"><CheckCircle size={12} /></div>;
  if (type === "expiry")   return <div className="act-dot dot-yellow"><Clock size={12} /></div>;
  if (type === "expired")  return <div className="act-dot dot-red"><AlertTriangle size={12} /></div>;
  if (type === "contract") return <div className="act-dot dot-blue"><FileText size={12} /></div>;
  return <div className="act-dot dot-gray"><Activity size={12} /></div>;
}

export const Dashboard = () => {
  const [refreshed, setRefreshed] = useState(false);

  const handleRefresh = () => {
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 1200);
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="page">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1><Activity size={24} className="h1-icon" />Bosh sahifa</h1>
            <p className="subtitle">Apteka ombori — umumiy ko'rinish</p>
          </div>
          <div className="header-right">
            <span className="last-update">Yangilangan: {new Date().toLocaleDateString("uz-UZ")}</span>
            <button className={`btn-refresh ${refreshed ? "spinning" : ""}`} onClick={handleRefresh}>
              <RefreshCw size={15} />Yangilash
            </button>
          </div>
        </div>

        {/* Alert bar */}
        {(STATS.expiredCount > 0 || STATS.expiringSoon > 0) && (
          <div className="alert-bar">
            <AlertTriangle size={16} />
            <span>
              {STATS.expiredCount > 0 && <><strong>{STATS.expiredCount} ta mahsulot</strong> muddati o'tgan. </>}
              {STATS.expiringSoon > 0 && <><strong>{STATS.expiringSoon} ta mahsulot</strong> 30 kun ichida tugaydi.</>}
            </span>
            <span className="ab-action">Ko'rish →</span>
          </div>
        )}

        {/* Main stats */}
        <div className="stats-grid">
          <StatCard icon={Package}       value={STATS.totalProducts}               label="Jami mahsulotlar"   accent="blue"   trendLabel="+3 bu oy"   trend="up"      />
          <StatCard icon={Layers}        value={STATS.totalBatches}                label="Faol partiyalar"    accent="violet" trendLabel="128 aktiv"   trend="neutral" />
          <StatCard icon={BoxSelect}     value={STATS.totalQty.toLocaleString()}   label="Ombordagi miqdor"   accent="teal"   trendLabel="+240 bugun"  trend="up"      />
          <StatCard icon={Banknote}      value={formatPrice(STATS.totalValue)}     label="Ombor qiymati"      accent="emerald"                                         />
          <StatCard icon={AlertTriangle} value={STATS.expiredCount}                label="Muddati o'tgan"     accent={STATS.expiredCount > 0 ? "red" : "gray"} trendLabel="Zudlik bilan chiqaring" trend="down" />
          <StatCard icon={Clock}         value={STATS.expiringSoon}                label="30 kunda tugaydi"   accent="amber"  trendLabel="Diqqat!"     trend="down"    />
          <StatCard icon={FileText}      value={STATS.totalContracts}              label="Shartnomalar"       accent="cyan"   trendLabel="18 faol"     trend="neutral" />
          <StatCard icon={ShoppingCart}  value={STATS.todayReceipts}               label="Bugungi kiraim"     accent="indigo" trendLabel="2 partiya"   trend="up"      />
        </div>

        {/* Quick links */}
        <div className="section-title">Tezkor harakatlar</div>
        <div className="quick-links">
          {QUICK_LINKS.map((q, i) => (
            <button key={i} className={`ql-card ql-${q.color}`}>
              <div className={`ql-icon ql-icon-${q.color}`}><q.icon size={18} strokeWidth={2} /></div>
              <div className="ql-text">
                <div className="ql-label">{q.label}</div>
                <div className="ql-desc">{q.desc}</div>
              </div>
              <ChevronRight size={14} className="ql-arrow" />
            </button>
          ))}
        </div>

        {/* Two-col: activity + expiry */}
        <div className="two-col">

          {/* Recent activity */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Activity size={15} />So'nggi faoliyat</span>
              <button className="card-link">Barchasi <ArrowRight size={12} /></button>
            </div>
            <div className="act-list">
              {RECENT_ACTIVITY.map(a => (
                <div key={a.id} className="act-item">
                  <ActivityIcon type={a.type} />
                  <div className="act-body">
                    <div className="act-text">{a.text}</div>
                    <div className="act-sub">{a.sub}</div>
                  </div>
                  <div className="act-time">{a.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiry alerts */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><Clock size={15} />Muddat holati</span>
            </div>

            {EXPIRED.length > 0 && (
              <div className="exp-section">
                <div className="exp-section-label red-label"><AlertTriangle size={11} />Muddati o'tgan</div>
                {EXPIRED.map(e => (
                  <div key={e.id} className="exp-row expired">
                    <div className="exp-name">{e.name}</div>
                    <div className="exp-meta">
                      <span className="exp-series">{e.series}</span>
                      <span className="exp-date red-text">{formatDate(e.expiry)}</span>
                      <span className="exp-qty">{e.qty} dona</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="exp-section">
              <div className="exp-section-label yellow-label"><Clock size={11} />Yaqinda tugaydi</div>
              {EXPIRING_SOON.map(e => (
                <div key={e.id} className="exp-row soon">
                  <div className="exp-name">{e.name}</div>
                  <div className="exp-meta">
                    <span className="exp-series">{e.series}</span>
                    <span className="exp-date yellow-text">{formatDate(e.expiry)}</span>
                    <span className={`days-badge ${e.daysLeft <= 7 ? "days-red" : "days-yellow"}`}>{e.daysLeft} kun</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top products */}
        <div className="card mt16">
          <div className="card-header">
            <span className="card-title"><BarChart3 size={15} />Eng ko'p mavjud mahsulotlar</span>
          </div>
          <div className="top-products">
            {TOP_PRODUCTS.map((p, i) => (
              <div key={i} className="tp-row">
                <div className="tp-rank">{i + 1}</div>
                <div className="tp-name">{p.name}</div>
                <div className="tp-bar-wrap">
                  <div className="tp-bar" style={{ width: `${p.pct}%` }} />
                </div>
                <div className="tp-qty">{p.qty} dona</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
};

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .page { padding: 32px 28px; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background: #f6f8fc; min-height: 100vh; }

  /* header */
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 16px; flex-wrap: wrap; }
  .page-header h1 { font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }
  .h1-icon { color: #2563eb; }
  .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .header-right { display: flex; align-items: center; gap: 12px; }
  .last-update { font-size: 12px; color: #94a3b8; }
  .btn-refresh { display: inline-flex; align-items: center; gap: 6px; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 8px 14px; font-size: 13px; font-weight: 500; cursor: pointer; color: #475569; transition: all 0.15s; }
  .btn-refresh:hover { background: #f1f5f9; }
  .btn-refresh.spinning svg { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* alert bar */
  .alert-bar { display: flex; align-items: center; gap: 10px; background: #fef3c7; border: 1.5px solid #fcd34d; border-radius: 11px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #92400e; }
  .alert-bar svg { flex-shrink: 0; color: #d97706; }
  .ab-action { margin-left: auto; font-weight: 700; cursor: pointer; color: #b45309; white-space: nowrap; }
  .ab-action:hover { text-decoration: underline; }

  /* stats grid */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .stat-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px; display: flex; align-items: center; gap: 14px; transition: box-shadow 0.15s; }
  .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  .sc-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sc-icon-blue    { background: #eff6ff; color: #2563eb; }
  .sc-icon-violet  { background: #f5f3ff; color: #7c3aed; }
  .sc-icon-teal    { background: #f0fdfa; color: #0d9488; }
  .sc-icon-emerald { background: #ecfdf5; color: #059669; }
  .sc-icon-red     { background: #fef2f2; color: #dc2626; }
  .sc-icon-amber   { background: #fffbeb; color: #d97706; }
  .sc-icon-cyan    { background: #ecfeff; color: #0891b2; }
  .sc-icon-indigo  { background: #eef2ff; color: #4f46e5; }
  .sc-icon-gray    { background: #f8fafc; color: #94a3b8; }
  .sc-body { min-width: 0; }
  .sc-value { font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1; }
  .sc-label { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .sc-trend { display: flex; align-items: center; gap: 3px; font-size: 11px; margin-top: 4px; font-weight: 600; }
  .t-up      { color: #16a34a; }
  .t-down    { color: #dc2626; }
  .t-neutral { color: #94a3b8; }

  /* quick links */
  .section-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; margin-top: 4px; }
  .quick-links { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin-bottom: 20px; }
  .ql-card { display: flex; align-items: center; gap: 12px; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 13px 14px; cursor: pointer; text-align: left; transition: all 0.15s; }
  .ql-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.07); transform: translateY(-1px); }
  .ql-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ql-icon-blue   { background: #eff6ff; color: #2563eb; }
  .ql-icon-violet { background: #f5f3ff; color: #7c3aed; }
  .ql-icon-teal   { background: #f0fdfa; color: #0d9488; }
  .ql-icon-amber  { background: #fffbeb; color: #d97706; }
  .ql-icon-green  { background: #f0fdf4; color: #16a34a; }
  .ql-icon-rose   { background: #fff1f2; color: #e11d48; }
  .ql-text { flex: 1; min-width: 0; }
  .ql-label { font-size: 13px; font-weight: 700; color: #0f172a; }
  .ql-desc  { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .ql-arrow { color: #cbd5e1; flex-shrink: 0; }
  .ql-card:hover .ql-arrow { color: #64748b; }

  /* two col */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  @media (max-width: 860px) { .two-col { grid-template-columns: 1fr; } }
  .mt16 { margin-top: 0; }

  /* card */
  .card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px 12px; border-bottom: 1px solid #f1f5f9; }
  .card-title { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; color: #0f172a; }
  .card-title svg { color: #64748b; }
  .card-link { display: flex; align-items: center; gap: 4px; background: none; border: none; color: #2563eb; font-size: 12px; font-weight: 600; cursor: pointer; }

  /* activity */
  .act-list { display: flex; flex-direction: column; }
  .act-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px 18px; border-bottom: 1px solid #f8fafc; }
  .act-item:last-child { border-bottom: none; }
  .act-dot { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .dot-green  { background: #dcfce7; color: #16a34a; }
  .dot-yellow { background: #fef9c3; color: #b45309; }
  .dot-red    { background: #fee2e2; color: #dc2626; }
  .dot-blue   { background: #eff6ff; color: #2563eb; }
  .dot-gray   { background: #f1f5f9; color: #94a3b8; }
  .act-body { flex: 1; min-width: 0; }
  .act-text { font-size: 13px; font-weight: 600; color: #0f172a; }
  .act-sub  { font-size: 11px; color: #94a3b8; margin-top: 2px; font-family: monospace; }
  .act-time { font-size: 11px; color: #cbd5e1; white-space: nowrap; margin-top: 2px; }

  /* expiry */
  .exp-section { padding: 10px 18px 4px; }
  .exp-section-label { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
  .red-label    { color: #dc2626; }
  .yellow-label { color: #b45309; }
  .exp-row { padding: 9px 0; border-bottom: 1px solid #f1f5f9; }
  .exp-row:last-child { border-bottom: none; }
  .exp-name { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 4px; }
  .exp-meta { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .exp-series { font-size: 10px; font-family: monospace; color: #6d28d9; background: #f5f3ff; padding: 2px 6px; border-radius: 4px; }
  .exp-date   { font-size: 11px; font-weight: 700; }
  .red-text    { color: #dc2626; }
  .yellow-text { color: #b45309; }
  .exp-qty    { font-size: 11px; color: #94a3b8; }
  .days-badge { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; }
  .days-red    { background: #fee2e2; color: #dc2626; }
  .days-yellow { background: #fef9c3; color: #b45309; }

  /* top products */
  .top-products { padding: 4px 18px 16px; display: flex; flex-direction: column; gap: 10px; }
  .tp-row { display: flex; align-items: center; gap: 12px; }
  .tp-rank { width: 20px; font-size: 12px; font-weight: 800; color: #cbd5e1; text-align: center; flex-shrink: 0; }
  .tp-name { font-size: 13px; font-weight: 600; color: #0f172a; width: 180px; flex-shrink: 0; }
  .tp-bar-wrap { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
  .tp-bar { height: 100%; background: linear-gradient(90deg, #2563eb, #7c3aed); border-radius: 4px; transition: width 0.6s ease; }
  .tp-qty { font-size: 12px; font-weight: 700; color: #64748b; font-family: monospace; width: 70px; text-align: right; flex-shrink: 0; }

  @media (max-width: 640px) {
    .page { padding: 20px 14px; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .quick-links { grid-template-columns: 1fr 1fr; }
    .page-header { flex-direction: column; }
    .tp-name { width: 120px; }
  }
`;