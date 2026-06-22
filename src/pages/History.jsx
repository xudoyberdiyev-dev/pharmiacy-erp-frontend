import { useState } from "react";
import {
  History as HistoryIcon, Search, X, Filter,
  ArrowDownCircle, ArrowUpCircle, FileText,
  Package, Hash, Tag, Calendar, User,
  ChevronRight, Eye, Download, CheckCircle,
  Clock, AlertTriangle, Layers, Banknote, FileCode,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────
const HISTORY = [
  { id: 1,  type: "receipt",  date: "2026-06-18", product: "Paracetamol 500mg", barcode: "4780123456789", ikpu: "10006001001000000", series: "478001167783021", boxSeries: "MK-2026-001", quantity: 240, price: 12000, totalAmount: 2880000, contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0892", operator: "Aliyev A.", note: "" },
  { id: 2,  type: "receipt",  date: "2026-06-18", product: "Paracetamol 500mg", barcode: "4780123456789", ikpu: "10006001001000000", series: "478001167783022", boxSeries: "MK-2026-002", quantity: 18,  price: 12500, totalAmount: 225000,  contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0910", operator: "Aliyev A.", note: "" },
  { id: 3,  type: "receipt",  date: "2026-06-10", product: "Amoxicillin 250mg", barcode: "4780198765432", ikpu: "10006001002000000", series: "478019988771",    boxSeries: null,           quantity: 80,  price: 24000, totalAmount: 1920000, contractNumber: "SH-2026-031", invoiceNumber: "F-2026-0411", operator: "Karimov B.", note: "" },
  { id: 4,  type: "issue",    date: "2026-06-15", product: "Amoxicillin 250mg", barcode: "4780198765432", ikpu: "10006001002000000", series: "478019988771",    boxSeries: null,           quantity: 15,  price: 24000, totalAmount: 360000,  contractNumber: "", invoiceNumber: "", operator: "Rahimov C.", note: "Muassasa: 1-son klinika" },
  { id: 5,  type: "receipt",  date: "2025-11-05", product: "Vitamin C 1000mg",  barcode: "4780111222333", ikpu: "10006001003000000", series: "478011199001",    boxSeries: "MK-2025-450", quantity: 5,   price: 18000, totalAmount: 90000,   contractNumber: "SH-2025-188", invoiceNumber: "F-2025-2201", operator: "Aliyev A.", note: "" },
  { id: 6,  type: "writeoff", date: "2026-06-12", product: "Ibuprofen 200mg",   barcode: "4780044556677", ikpu: "",                 series: "478004455xx1",    boxSeries: null,           quantity: 12,  price: 8500,  totalAmount: 102000,  contractNumber: "", invoiceNumber: "", operator: "Karimov B.", note: "Muddati o'tgan — hisobdan chiqarildi" },
  { id: 7,  type: "issue",    date: "2026-06-08", product: "Paracetamol 500mg", barcode: "4780123456789", ikpu: "10006001001000000", series: "478001167783021", boxSeries: "MK-2026-001", quantity: 30,  price: 12000, totalAmount: 360000,  contractNumber: "", invoiceNumber: "", operator: "Rahimov C.", note: "Dispanser" },
  { id: 8,  type: "adjust",   date: "2026-06-01", product: "Aspirin 100mg",     barcode: "4780044112233", ikpu: "10006001004000000", series: "478004422001",    boxSeries: null,           quantity: 5,   price: 4500,  totalAmount: 22500,   contractNumber: "", invoiceNumber: "", operator: "Aliyev A.", note: "Inventarizatsiya farqi" },
];

const TYPE_CFG = {
  receipt:  { label: "Kiraim",         cls: "green",  Icon: ArrowDownCircle, bg: "bg-green"  },
  issue:    { label: "Chiqim",         cls: "blue",   Icon: ArrowUpCircle,  bg: "bg-blue"   },
  writeoff: { label: "Hisobdan chiqim", cls: "red",   Icon: X,              bg: "bg-red"    },
  adjust:   { label: "Tuzatish",       cls: "yellow", Icon: FileText,       bg: "bg-yellow" },
};

const formatDate  = (d) => new Date(d).toLocaleDateString("uz-UZ");
const formatPrice = (p) => Number(p).toLocaleString("uz-UZ") + " so'm";

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DetailModal({ entry, onClose }) {
  const cfg = TYPE_CFG[entry.type] || TYPE_CFG.receipt;
  return (
    <Modal title="Operatsiya tafsilotlari" onClose={onClose}>
      <div className="form-body">
        <div className={`type-badge-large ${cfg.bg}`}>
          <cfg.Icon size={16} strokeWidth={2} />
          {cfg.label}
          <span className="date-inline">{formatDate(entry.date)}</span>
        </div>

        <div className="detail-grid">
          <div className="dg-item">
            <div className="dg-label"><Package size={11} />Mahsulot</div>
            <div className="dg-val">{entry.product}</div>
          </div>
          {entry.barcode && (
            <div className="dg-item">
              <div className="dg-label"><Hash size={11} />Barcode</div>
              <div className="dg-val mono">{entry.barcode}</div>
            </div>
          )}
          {entry.ikpu && (
            <div className="dg-item">
              <div className="dg-label"><FileCode size={11} />IKPU</div>
              <div className="dg-val mono">{entry.ikpu}</div>
            </div>
          )}
          <div className="dg-item">
            <div className="dg-label"><Tag size={11} />Dori seriyasi</div>
            <div className="dg-val mono">{entry.series}</div>
          </div>
          {entry.boxSeries && (
            <div className="dg-item">
              <div className="dg-label"><Tag size={11} />QR seriya</div>
              <div className="dg-val mono">{entry.boxSeries}</div>
            </div>
          )}
          <div className="dg-item">
            <div className="dg-label"><Layers size={11} />Miqdor</div>
            <div className="dg-val"><span className="qty-pill">{entry.quantity} dona</span></div>
          </div>
          <div className="dg-item">
            <div className="dg-label"><Banknote size={11} />Birlik narx</div>
            <div className="dg-val">{formatPrice(entry.price)}</div>
          </div>
          <div className="dg-item dg-full">
            <div className="dg-label"><Banknote size={11} />Jami summa</div>
            <div className="dg-val dg-total">{formatPrice(entry.totalAmount)}</div>
          </div>
          {entry.contractNumber && (
            <div className="dg-item">
              <div className="dg-label"><FileText size={11} />Shartnoma</div>
              <div className="dg-val mono">{entry.contractNumber}</div>
            </div>
          )}
          {entry.invoiceNumber && (
            <div className="dg-item">
              <div className="dg-label"><Hash size={11} />Faktura</div>
              <div className="dg-val mono">{entry.invoiceNumber}</div>
            </div>
          )}
          <div className="dg-item">
            <div className="dg-label"><User size={11} />Operator</div>
            <div className="dg-val">{entry.operator}</div>
          </div>
          {entry.note && (
            <div className="dg-item dg-full">
              <div className="dg-label">Izoh</div>
              <div className="dg-val note-val">{entry.note}</div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export const History = () => {
  const [search,    setSearch]    = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewEntry, setViewEntry] = useState(null);

  const filtered = HISTORY.filter(h => {
    const q = search.toLowerCase();
    const matchSearch =
      (h.product        || "").toLowerCase().includes(q) ||
      (h.series         || "").includes(search) ||
      (h.barcode        || "").includes(search) ||
      (h.ikpu           || "").includes(search) ||
      (h.contractNumber || "").toLowerCase().includes(q) ||
      (h.invoiceNumber  || "").toLowerCase().includes(q) ||
      (h.operator       || "").toLowerCase().includes(q);
    const matchType = typeFilter === "all" || h.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalReceipt  = HISTORY.filter(h => h.type === "receipt").reduce((s,h)  => s + h.totalAmount, 0);
  const totalIssue    = HISTORY.filter(h => h.type === "issue").reduce((s,h)    => s + h.totalAmount, 0);
  const totalWriteoff = HISTORY.filter(h => h.type === "writeoff").reduce((s,h) => s + h.totalAmount, 0);

  const exportCSV = () => {
    const rows = [
      ["Sana","Tur","Mahsulot","Barcode","IKPU","Seriya","QR Seriya","Miqdor","Narx","Jami","Shartnoma","Faktura","Operator","Izoh"],
      ...filtered.map(h => [
        h.date, TYPE_CFG[h.type]?.label || h.type, h.product,
        h.barcode ? `'${h.barcode}` : "", h.ikpu ? `'${h.ikpu}` : "",
        `'${h.series}`, h.boxSeries ? `'${h.boxSeries}` : "",
        h.quantity, h.price, h.totalAmount,
        h.contractNumber || "", h.invoiceNumber || "", h.operator, h.note,
      ]),
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "tarix.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <style>{STYLES}</style>

      <div className="page">
        <div className="page-header">
          <div className="header-text">
            <h1><HistoryIcon size={24} className="h1-icon" />Operatsiyalar tarixi</h1>
            <p className="subtitle">Barcha kiraim, chiqim va tuzatish operatsiyalari</p>
          </div>
          <button className="btn-secondary" onClick={exportCSV}><Download size={15} />Excel/CSV</button>
        </div>

        {/* Summary */}
        <div className="summary-row">
          <div className="sum-card green">
            <ArrowDownCircle size={18} />
            <div>
              <div className="sum-value">{formatPrice(totalReceipt)}</div>
              <div className="sum-label">Jami kiraim</div>
            </div>
          </div>
          <div className="sum-card blue">
            <ArrowUpCircle size={18} />
            <div>
              <div className="sum-value">{formatPrice(totalIssue)}</div>
              <div className="sum-label">Jami chiqim</div>
            </div>
          </div>
          <div className="sum-card red">
            <X size={18} />
            <div>
              <div className="sum-value">{formatPrice(totalWriteoff)}</div>
              <div className="sum-label">Hisobdan chiqim</div>
            </div>
          </div>
          <div className="sum-card neutral">
            <HistoryIcon size={18} />
            <div>
              <div className="sum-value">{HISTORY.length}</div>
              <div className="sum-label">Jami operatsiyalar</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <Search size={15} className="search-icon" strokeWidth={2} />
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Mahsulot, seriya, barcode, shartnoma, operator…" />
            {search && <button className="clear-btn" onClick={() => setSearch("")}><X size={14} /></button>}
          </div>
          <div className="filter-tabs">
            {[["all","Barchasi"],["receipt","Kiraim"],["issue","Chiqim"],["writeoff","Hisobdan"],["adjust","Tuzatish"]].map(([v,l]) => (
              <button key={v} className={`filter-tab ${typeFilter === v ? `active at-${v}` : ""}`} onClick={() => setTypeFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          {filtered.length === 0 ? (
            <div className="state-box">
              <HistoryIcon size={40} strokeWidth={1} style={{ color: "#cbd5e1" }} />
              <p>Mos operatsiya topilmadi</p>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="main-table">
                <thead>
                  <tr>
                    <th>Sana</th>
                    <th>Tur</th>
                    <th>Mahsulot</th>
                    <th>Seriya / QR</th>
                    <th>Shartnoma / Faktura</th>
                    <th className="center">Miqdor</th>
                    <th>Jami summa</th>
                    <th>Operator</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(h => {
                    const cfg = TYPE_CFG[h.type] || TYPE_CFG.receipt;
                    return (
                      <tr key={h.id} className={`tr-${h.type}`}>
                        <td className="date-col">{formatDate(h.date)}</td>
                        <td>
                          <span className={`type-pill type-${h.type}`}>
                            <cfg.Icon size={11} strokeWidth={2.5} />
                            {cfg.label}
                          </span>
                        </td>
                        <td>
                          <div className="product-col">
                            <div className="prod-name">{h.product}</div>
                            <div className="prod-meta">
                              {h.barcode && <span className="pi-badge bc"><Hash size={9} />{h.barcode}</span>}
                              {h.ikpu    && <span className="pi-badge ikpu"><FileCode size={9} />{h.ikpu}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="series-cell">
                            <span className="badge-series"><Tag size={10} />{h.series}</span>
                            {h.boxSeries && <span className="badge-box"><Tag size={9} />{h.boxSeries}</span>}
                          </div>
                        </td>
                        <td>
                          <div className="doc-cell">
                            {h.contractNumber && <span className="doc-sh">{h.contractNumber}</span>}
                            {h.invoiceNumber  && <span className="doc-inv">{h.invoiceNumber}</span>}
                            {!h.contractNumber && !h.invoiceNumber && <span className="na">—</span>}
                          </div>
                        </td>
                        <td className="center">
                          <span className={`qty-pill ${h.type === "receipt" ? "qty-green" : h.type === "writeoff" ? "qty-red" : "qty-blue"}`}>
                            {h.type === "receipt" ? "+" : h.type === "issue" || h.type === "writeoff" ? "-" : "±"}{h.quantity}
                          </span>
                        </td>
                        <td className="price-col mono">{formatPrice(h.totalAmount)}</td>
                        <td>
                          <div className="operator-cell">
                            <span className="op-avatar">{h.operator.charAt(0)}</span>
                            {h.operator}
                          </div>
                        </td>
                        <td>
                          <button className="icon-btn view" onClick={() => setViewEntry(h)} title="Ko'rish">
                            <Eye size={14} strokeWidth={2} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {viewEntry && <DetailModal entry={viewEntry} onClose={() => setViewEntry(null)} />}
    </>
  );
};

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .page { padding: 32px 28px; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background: #f6f8fc; min-height: 100vh; }
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
  .header-text h1 { font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }
  .h1-icon { color: #4f46e5; }
  .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .btn-secondary { display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
  .btn-secondary:hover { background: #f8fafc; }
  .summary-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .sum-card { display: flex; align-items: center; gap: 12px; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; }
  .sum-card.green  { border-left: 4px solid #16a34a; }
  .sum-card.green svg { color: #16a34a; }
  .sum-card.blue   { border-left: 4px solid #2563eb; }
  .sum-card.blue svg { color: #2563eb; }
  .sum-card.red    { border-left: 4px solid #dc2626; }
  .sum-card.red svg { color: #dc2626; }
  .sum-card.neutral { border-left: 4px solid #94a3b8; }
  .sum-card.neutral svg { color: #94a3b8; }
  .sum-value { font-size: 16px; font-weight: 800; color: #0f172a; }
  .sum-label { font-size: 12px; color: #94a3b8; margin-top: 2px; }
  .toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
  .search-wrap { position: relative; display: flex; align-items: center; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 11px; flex: 1; min-width: 240px; transition: border-color 0.15s, box-shadow 0.15s; }
  .search-wrap:focus-within { border-color: #4f46e5; box-shadow: 0 0 0 3px #eef2ff; }
  .search-icon { margin-left: 14px; color: #cbd5e1; flex-shrink: 0; }
  .search-input { flex: 1; border: none; outline: none; padding: 11px 12px; font-size: 14px; background: transparent; color: #0f172a; }
  .search-input::placeholder { color: #cbd5e1; }
  .clear-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0 14px; display: flex; align-items: center; }
  .filter-tabs { display: flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 4px; overflow-x: auto; }
  .filter-tab { border: none; background: none; padding: 7px 14px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; color: #64748b; transition: all 0.15s; white-space: nowrap; }
  .filter-tab.active { background: #fff; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .filter-tab.active.at-all      { color: #4f46e5; }
  .filter-tab.active.at-receipt  { color: #16a34a; }
  .filter-tab.active.at-issue    { color: #2563eb; }
  .filter-tab.active.at-writeoff { color: #dc2626; }
  .filter-tab.active.at-adjust   { color: #b45309; }
  .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .table-scroll { overflow-x: auto; }
  .state-box { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 72px 24px; color: #94a3b8; }
  .main-table { width: 100%; border-collapse: collapse; min-width: 860px; }
  .main-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
  .main-table th { padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; text-align: left; white-space: nowrap; }
  .main-table th.center { text-align: center; }
  .main-table td.center { text-align: center; }
  .main-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
  .main-table tbody tr:last-child { border-bottom: none; }
  .main-table tbody tr:hover { background: #f8fafc; }
  .main-table td { padding: 12px 16px; font-size: 13px; color: #334155; vertical-align: middle; }
  .tr-receipt  { border-left: 3px solid #86efac; }
  .tr-issue    { border-left: 3px solid #93c5fd; }
  .tr-writeoff { border-left: 3px solid #fca5a5; }
  .tr-adjust   { border-left: 3px solid #fde68a; }
  .date-col { color: #64748b; font-size: 12px; white-space: nowrap; }
  .type-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
  .type-receipt  { background: #dcfce7; color: #16a34a; }
  .type-issue    { background: #dbeafe; color: #1d4ed8; }
  .type-writeoff { background: #fee2e2; color: #dc2626; }
  .type-adjust   { background: #fef9c3; color: #b45309; }
  .product-col { display: flex; flex-direction: column; gap: 4px; }
  .prod-name { font-weight: 700; color: #0f172a; font-size: 13px; }
  .prod-meta { display: flex; gap: 4px; flex-wrap: wrap; }
  .pi-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: 600; }
  .pi-badge.bc   { background: #eff6ff; color: #1d4ed8; }
  .pi-badge.ikpu { background: #f5f3ff; color: #6d28d9; }
  .series-cell { display: flex; flex-direction: column; gap: 3px; }
  .badge-series { display: inline-flex; align-items: center; gap: 3px; background: #ede9fe; color: #6d28d9; font-family: monospace; font-size: 10px; padding: 2px 7px; border-radius: 4px; font-weight: 700; width: fit-content; }
  .badge-box    { display: inline-flex; align-items: center; gap: 3px; background: #eff6ff; color: #2563eb; font-family: monospace; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; width: fit-content; }
  .doc-cell { display: flex; flex-direction: column; gap: 3px; }
  .doc-sh  { font-family: monospace; font-size: 11px; font-weight: 700; color: #166534; background: #f0fdf4; padding: 2px 6px; border-radius: 4px; width: fit-content; }
  .doc-inv { font-family: monospace; font-size: 11px; font-weight: 700; color: #9a3412; background: #fff7ed; padding: 2px 6px; border-radius: 4px; width: fit-content; }
  .na { color: #cbd5e1; }
  .qty-pill { display: inline-block; font-size: 12px; font-weight: 800; padding: 3px 10px; border-radius: 20px; font-family: monospace; }
  .qty-green { background: #dcfce7; color: #16a34a; }
  .qty-blue  { background: #dbeafe; color: #1d4ed8; }
  .qty-red   { background: #fee2e2; color: #dc2626; }
  .price-col { font-weight: 700; color: #0f172a; white-space: nowrap; }
  .operator-cell { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #334155; }
  .op-avatar { width: 26px; height: 26px; border-radius: 50%; background: #4f46e5; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
  .icon-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; color: #64748b; }
  .icon-btn.view:hover { background: #eef2ff; border-color: #4f46e5; color: #4f46e5; }
  /* modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 16px; }
  .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 560px; box-shadow: 0 32px 80px rgba(0,0,0,0.2); animation: popIn 0.18s ease; max-height: 90vh; overflow-y: auto; }
  @keyframes popIn { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 22px 24px 0; position: sticky; top: 0; background: #fff; z-index: 1; }
  .modal-header h2 { font-size: 17px; font-weight: 800; color: #0f172a; }
  .modal-close { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
  .modal-close:hover { background: #e2e8f0; }
  .form-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
  .type-badge-large { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 700; align-self: flex-start; }
  .bg-green  { background: #dcfce7; color: #16a34a; }
  .bg-blue   { background: #dbeafe; color: #1d4ed8; }
  .bg-red    { background: #fee2e2; color: #dc2626; }
  .bg-yellow { background: #fef9c3; color: #b45309; }
  .date-inline { font-size: 12px; font-weight: 400; opacity: 0.7; margin-left: 4px; }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .dg-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px; padding: 10px 12px; }
  .dg-full { grid-column: 1 / -1; }
  .dg-label { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .dg-val { font-size: 14px; font-weight: 600; color: #0f172a; }
  .dg-total { font-size: 18px; font-weight: 800; color: #0f172a; }
  .note-val { font-size: 13px; font-weight: 400; color: #475569; font-style: italic; }
  .qty-pill { display: inline-block; font-size: 13px; font-weight: 700; padding: 2px 10px; border-radius: 20px; background: #f1f5f9; color: #334155; }
  @media (max-width: 640px) {
    .page { padding: 20px 14px; }
    .summary-row { grid-template-columns: 1fr 1fr; }
    .toolbar { flex-direction: column; }
    .detail-grid { grid-template-columns: 1fr; }
    .filter-tabs { overflow-x: auto; }
  }
`;