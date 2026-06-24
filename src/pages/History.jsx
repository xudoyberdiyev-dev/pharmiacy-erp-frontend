// src/pages/History.jsx — Real API bilan kirim (batch) + chiqim (sales)
import { useState, useEffect, useCallback, useRef } from "react";
import {
  History as HistoryIcon, Search, X, Filter,
  ArrowDownCircle, ArrowUpCircle, FileText,
  Package, Hash, Tag, Calendar, User,
  Eye, Download, CheckCircle, AlertTriangle,
  Layers, Banknote, FileCode, Loader2, RefreshCw,
} from "lucide-react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const api = axios.create({ baseURL: BASE_URL });
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem("token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use(
  r => r.data?.data ?? r.data,
  e => Promise.reject(new Error(e.response?.data?.message || "Xatolik"))
);

const fmt      = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";
const fmtDT    = (d) => d ? new Date(d).toLocaleString("uz-UZ") : "—";
const fmtPrice = (p) => Number(p ?? 0).toLocaleString("uz-UZ") + " so'm";

const TYPE_CFG = {
  receipt: { label: "Kirim",           cls: "green", Icon: ArrowDownCircle, bg: "bg-green"  },
  issue:   { label: "Chiqim (sotuv)",  cls: "blue",  Icon: ArrowUpCircle,   bg: "bg-blue"   },
};

// ─── Modal ─────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const fn = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
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

// ─── Kirim detail (Batch) ──────────────────────────────────────
function ReceiptDetail({ entry, onClose }) {
  return (
    <Modal title="Kirim tafsilotlari" onClose={onClose}>
      <div className="form-body">
        <div className="type-badge-large bg-green"><ArrowDownCircle size={16} />Kirim<span className="date-inline">{fmtDT(entry.createdAt)}</span></div>
        <div className="detail-grid">
          <div className="dg-item dg-full">
            <div className="dg-label"><Package size={11} />Mahsulot</div>
            <div className="dg-val">{entry.product?.name ?? "—"}</div>
          </div>
          {entry.product?.ikpuCode && (
            <div className="dg-item">
              <div className="dg-label"><FileCode size={11} />IKPU</div>
              <div className="dg-val mono">{entry.product.ikpuCode}</div>
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
            <div className="dg-label"><Layers size={11} />Miqdor / Qoldiq</div>
            <div className="dg-val"><span className="qty-pill">{entry.quantity} / {entry.remainingQty} {entry.product?.unit ?? "dona"}</span></div>
          </div>
          <div className="dg-item">
            <div className="dg-label"><Banknote size={11} />Narx</div>
            <div className="dg-val">{fmtPrice(entry.price)}</div>
          </div>
          <div className="dg-item dg-full">
            <div className="dg-label"><Banknote size={11} />Jami summa</div>
            <div className="dg-val dg-total">{fmtPrice(Number(entry.price) * entry.quantity)}</div>
          </div>
          {entry.contract?.contractNumber && (
            <div className="dg-item">
              <div className="dg-label"><FileText size={11} />Shartnoma</div>
              <div className="dg-val mono">{entry.contract.contractNumber}{entry.contract.partyName ? ` · ${entry.contract.partyName}` : ""}</div>
            </div>
          )}
          {entry.invoice?.invoiceNumber && (
            <div className="dg-item">
              <div className="dg-label"><Hash size={11} />Faktura</div>
              <div className="dg-val mono">{entry.invoice.invoiceNumber}</div>
            </div>
          )}
          {entry.expiry && (
            <div className="dg-item">
              <div className="dg-label"><Calendar size={11} />Yaroqlilik muddati</div>
              <div className="dg-val">{fmt(entry.expiry)}</div>
            </div>
          )}
          <div className="dg-item">
            <div className="dg-label"><Tag size={11} />Dozaj</div>
            <div className="dg-val">{entry.mg}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Chiqim detail (Sale) ──────────────────────────────────────
function IssueDetail({ entry, onClose }) {
  return (
    <Modal title="Chiqim tafsilotlari" onClose={onClose}>
      <div className="form-body">
        <div className="type-badge-large bg-blue"><ArrowUpCircle size={16} />Chiqim (Sotuv)<span className="date-inline">{fmtDT(entry.createdAt)}</span></div>
        <div className="detail-grid">
          {entry.customer && (
            <div className="dg-item dg-full">
              <div className="dg-label"><User size={11} />Mijoz</div>
              <div className="dg-val">{entry.customer.name}{entry.customer.phone ? ` · ${entry.customer.phone}` : ""}</div>
            </div>
          )}
          <div className="dg-item dg-full">
            <div className="dg-label"><Banknote size={11} />Jami summa</div>
            <div className="dg-val dg-total">{fmtPrice(entry.totalPrice)}</div>
          </div>
          <div className="dg-item dg-full">
            <div className="dg-label"><Package size={11} />Sotilgan mahsulotlar ({entry.items?.length ?? 0} ta)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
              {(entry.items ?? []).map((it, i) => (
                <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{it.product?.name ?? "—"}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                    <span className="qty-pill">{it.quantity} {it.product?.unit ?? "dona"}</span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{fmtPrice(it.price)} / dona</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{fmtPrice(it.total)}</span>
                  </div>
                  {it.batch && (
                    <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                      <span className="badge-series"><Tag size={9} />{it.batch.series}</span>
                      {it.batch.contract?.contractNumber && (
                        <span className="doc-sh"><FileText size={9} />{it.batch.contract.contractNumber}</span>
                      )}
                      {it.batch.invoice?.invoiceNumber && (
                        <span className="doc-inv"><Hash size={9} />{it.batch.invoice.invoiceNumber}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────
export const History = () => {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [typeFilter,  setTypeFilter]  = useState("all");
  const [search,      setSearch]      = useState("");
  const [detail,      setDetail]      = useState(null);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [dateFrom,    setDateFrom]    = useState("");
  const [dateTo,      setDateTo]      = useState("");
  const searchTimer = useRef();
  const LIMIT = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [batchRes, saleRes] = await Promise.all([
        api.get("/batches", { params: { limit: 200, page: 1 } }),
        api.get("/sales",   { params: { limit: 200, page: 1, ...(dateFrom ? { dateFrom } : {}), ...(dateTo ? { dateTo } : {}) } }),
      ]);

      const batches = (batchRes.items ?? batchRes ?? []).map(b => ({
        _id:       `r_${b.id}`,
        type:      "receipt",
        createdAt: b.createdAt,
        product:   b.product,
        series:    b.series,
        boxSeries: b.boxSeries,
        mg:        b.mg,
        quantity:  b.quantity,
        remainingQty: b.remainingQty,
        price:     b.price,
        expiry:    b.expiry,
        contract:  b.contract,
        invoice:   b.invoice,
        // raw for detail modal
        ...b,
      }));

      const sales = (saleRes.items ?? saleRes ?? []).map(s => ({
        _id:       `i_${s.id}`,
        type:      "issue",
        createdAt: s.createdAt,
        customer:  s.customer,
        totalPrice: s.totalPrice,
        items:     s.items,
        // contract/invoice shown per item
        contract:  s.items?.[0]?.batch?.contract ?? null,
        invoice:   s.items?.[0]?.batch?.invoice  ?? null,
        // raw
        ...s,
      }));

      const all = [...batches, ...sales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(all);
      setTotalPages(Math.ceil(all.length / LIMIT));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadData(); }, [loadData]);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const filtered = items.filter(it => {
    if (typeFilter !== "all" && it.type !== typeFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (it.product?.name ?? it.customer?.name ?? "").toLowerCase().includes(s) ||
      (it.series ?? "").toLowerCase().includes(s) ||
      (it.contract?.contractNumber ?? "").toLowerCase().includes(s) ||
      (it.invoice?.invoiceNumber ?? "").toLowerCase().includes(s) ||
      (it.customer?.phone ?? "").includes(s)
    );
  });

  const paginated = filtered.slice((page - 1) * LIMIT, page * LIMIT);
  const totalReceipts = items.filter(i => i.type === "receipt").reduce((s, i) => s + (i.quantity ?? 0), 0);
  const totalIssues   = items.filter(i => i.type === "issue").length;
  const totalRevenue  = items.filter(i => i.type === "issue").reduce((s, i) => s + (i.totalPrice ?? 0), 0);

  const exportCSV = () => {
    const rows = [
      ["Tur", "Sana", "Mahsulot / Mijoz", "Seriya", "Miqdor", "Narx", "Shartnoma", "Faktura"],
      ...filtered.map(it => [
        TYPE_CFG[it.type]?.label ?? it.type,
        fmtDT(it.createdAt),
        it.type === "receipt" ? (it.product?.name ?? "") : (it.customer?.name ?? ""),
        it.series ?? "",
        it.type === "receipt" ? it.quantity : "",
        it.type === "receipt" ? it.price : it.totalPrice,
        it.contract?.contractNumber ?? "",
        it.invoice?.invoiceNumber ?? "",
      ]),
    ];
    const csv  = rows.map(r => r.map(v => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "tarix.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div className="ph-left">
          <div className="ph-icon"><HistoryIcon size={20} /></div>
          <div>
            <h1 className="ph-title">Operatsiyalar tarixi</h1>
            <p className="ph-sub">Kirim va chiqim operatsiyalari — shartnoma, faktura bo'yicha</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={loadData}><RefreshCw size={14} />Yangilash</button>
          <button className="btn-ghost" onClick={exportCSV}><Download size={14} />CSV</button>
        </div>
      </div>

      {/* Stats */}
      <div className="summary-row">
        <div className="sum-card green">
          <ArrowDownCircle size={18} />
          <div><div className="sum-value">{totalReceipts.toLocaleString("uz-UZ")}</div><div className="sum-label">Kirim (dona)</div></div>
        </div>
        <div className="sum-card blue">
          <ArrowUpCircle size={18} />
          <div><div className="sum-value">{totalIssues}</div><div className="sum-label">Chiqim (sotuv)</div></div>
        </div>
        <div className="sum-card neutral">
          <Banknote size={18} />
          <div><div className="sum-value">{(totalRevenue / 1_000_000).toFixed(1)} mln</div><div className="sum-label">Sotuv summasi</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="toolbar">
        <div className="search-wrap">
          <Search size={14} className="search-icon" />
          <input className="search-input" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Mahsulot, mijoz, seriya, shartnoma, faktura…" />
          {search && <button className="clear-btn" onClick={() => setSearch("")}><X size={13} /></button>}
        </div>
        <input type="date" className="date-input" value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1); }}
          title="Dan" style={{ padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, background: "#fff" }} />
        <input type="date" className="date-input" value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1); }}
          title="Gacha" style={{ padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, background: "#fff" }} />
        <div className="filter-tabs">
          {[["all","Barchasi"],["receipt","Kirim"],["issue","Chiqim"]].map(([val, lbl]) => (
            <button key={val} className={`filter-tab at-${val}${typeFilter === val ? " active" : ""}`}
              onClick={() => { setTypeFilter(val); setPage(1); }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading && (
        <div className="state-box"><Loader2 size={28} style={{ animation: "spin 1s linear infinite", color: "#4f46e5" }} /><span>Yuklanmoqda…</span></div>
      )}
      {error && !loading && (
        <div className="state-box" style={{ color: "#dc2626" }}><AlertTriangle size={24} /><span>{error}</span></div>
      )}
      {!loading && !error && (
        <div className="table-card">
          {paginated.length === 0 ? (
            <div className="state-box"><HistoryIcon size={40} strokeWidth={0.8} style={{ color: "#e2e8f0" }} /><span>Hech narsa topilmadi</span></div>
          ) : (
            <>
              <div className="table-scroll">
                <table className="main-table">
                  <thead>
                    <tr>
                      <th>Tur</th>
                      <th>Sana</th>
                      <th>Mahsulot / Mijoz</th>
                      <th>Seriya</th>
                      <th>Shartnoma / Faktura</th>
                      <th className="center">Miqdor</th>
                      <th>Summa</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(it => {
                      const cfg = TYPE_CFG[it.type] || TYPE_CFG.receipt;
                      return (
                        <tr key={it._id} className={`tr-${it.type}`}>
                          <td>
                            <span className={`type-pill type-${it.type}`}>
                              <cfg.Icon size={11} />{cfg.label}
                            </span>
                          </td>
                          <td className="date-col">{fmtDT(it.createdAt)}</td>
                          <td>
                            {it.type === "receipt" ? (
                              <div className="product-col">
                                <div className="prod-name">{it.product?.name ?? "—"}</div>
                                <div className="prod-meta">
                                  {it.product?.ikpuCode && <span className="pi-badge ikpu"><FileCode size={9} />{it.product.ikpuCode}</span>}
                                  {it.mg && <span className="pi-badge bc">{it.mg}</span>}
                                </div>
                              </div>
                            ) : (
                              <div className="product-col">
                                <div className="prod-name"><User size={11} /> {it.customer?.name ?? "Noma'lum"}</div>
                                {it.customer?.phone && <span className="pi-badge bc">{it.customer.phone}</span>}
                              </div>
                            )}
                          </td>
                          <td>
                            {it.series ? (
                              <div className="series-cell">
                                <span className="badge-series"><Tag size={9} />{it.series}</span>
                                {it.boxSeries && <span className="badge-box">{it.boxSeries}</span>}
                              </div>
                            ) : (
                              <span className="na">—</span>
                            )}
                          </td>
                          <td>
                            {(it.contract?.contractNumber || it.invoice?.invoiceNumber) ? (
                              <div className="doc-cell">
                                {it.contract?.contractNumber && <span className="doc-sh"><FileText size={9} />{it.contract.contractNumber}</span>}
                                {it.invoice?.invoiceNumber  && <span className="doc-inv"><Hash size={9} />{it.invoice.invoiceNumber}</span>}
                              </div>
                            ) : <span className="na">—</span>}
                          </td>
                          <td className="center">
                            <span className={`qty-pill qty-${it.type === "receipt" ? "green" : "blue"}`}>
                              {it.type === "receipt" ? it.quantity : (it.items?.reduce((s, i) => s + i.quantity, 0) ?? "—")}
                            </span>
                          </td>
                          <td className="price-col">
                            {it.type === "receipt"
                              ? fmtPrice(Number(it.price) * it.quantity)
                              : fmtPrice(it.totalPrice)}
                          </td>
                          <td>
                            <button className="icon-btn view" onClick={() => setDetail(it)}>
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{filtered.length} ta operatsiya</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => Math.abs(p - page) <= 2).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: 32, height: 32, border: p === page ? "2px solid #4f46e5" : "1.5px solid #e2e8f0",
                        borderRadius: 8, background: p === page ? "#eef2ff" : "#fff", color: p === page ? "#4f46e5" : "#64748b",
                        fontWeight: p === page ? 700 : 400, cursor: "pointer", fontSize: 13 }}>{p}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Detail modal */}
      {detail && detail.type === "receipt" && <ReceiptDetail entry={detail} onClose={() => setDetail(null)} />}
      {detail && detail.type === "issue"   && <IssueDetail   entry={detail} onClose={() => setDetail(null)} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .page { padding: 28px 32px; max-width: 1400px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .ph-left { display: flex; align-items: center; gap: 16px; }
        .ph-icon { width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; color: #fff; }
        .ph-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; }
        .ph-sub { font-size: 13px; color: #64748b; margin: 2px 0 0; }
        .btn-ghost { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; border: 1.5px solid #e2e8f0; background: #fff; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; color: #334155; transition: all 0.15s; }
        .btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }
        .summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
        .sum-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; display: flex; align-items: center; gap: 16px; }
        .sum-card.green  { border-left: 4px solid #16a34a; } .sum-card.green svg { color: #16a34a; }
        .sum-card.blue   { border-left: 4px solid #2563eb; } .sum-card.blue svg { color: #2563eb; }
        .sum-card.neutral{ border-left: 4px solid #94a3b8; } .sum-card.neutral svg { color: #94a3b8; }
        .sum-value { font-size: 20px; font-weight: 800; color: #0f172a; }
        .sum-label { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
        .search-wrap { position: relative; display: flex; align-items: center; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 11px; flex: 1; min-width: 240px; }
        .search-wrap:focus-within { border-color: #4f46e5; box-shadow: 0 0 0 3px #eef2ff; }
        .search-icon { margin-left: 14px; color: #cbd5e1; flex-shrink: 0; }
        .search-input { flex: 1; border: none; outline: none; padding: 11px 12px; font-size: 14px; background: transparent; color: #0f172a; }
        .search-input::placeholder { color: #cbd5e1; }
        .clear-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0 14px; display: flex; align-items: center; }
        .filter-tabs { display: flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 4px; }
        .filter-tab { border: none; background: none; padding: 7px 14px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; color: #64748b; transition: all 0.15s; }
        .filter-tab.active { background: #fff; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .filter-tab.active.at-all     { color: #4f46e5; }
        .filter-tab.active.at-receipt { color: #16a34a; }
        .filter-tab.active.at-issue   { color: #2563eb; }
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
        .tr-receipt { border-left: 3px solid #86efac; }
        .tr-issue   { border-left: 3px solid #93c5fd; }
        .date-col { color: #64748b; font-size: 12px; white-space: nowrap; }
        .type-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
        .type-receipt { background: #dcfce7; color: #16a34a; }
        .type-issue   { background: #dbeafe; color: #1d4ed8; }
        .product-col { display: flex; flex-direction: column; gap: 4px; }
        .prod-name { font-weight: 700; color: #0f172a; font-size: 13px; display: flex; align-items: center; gap: 4px; }
        .prod-meta { display: flex; gap: 4px; flex-wrap: wrap; }
        .pi-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: 600; }
        .pi-badge.bc   { background: #eff6ff; color: #1d4ed8; }
        .pi-badge.ikpu { background: #f5f3ff; color: #6d28d9; }
        .series-cell { display: flex; flex-direction: column; gap: 3px; }
        .badge-series { display: inline-flex; align-items: center; gap: 3px; background: #ede9fe; color: #6d28d9; font-family: monospace; font-size: 10px; padding: 2px 7px; border-radius: 4px; font-weight: 700; width: fit-content; }
        .badge-box    { display: inline-flex; align-items: center; gap: 3px; background: #eff6ff; color: #2563eb; font-family: monospace; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; width: fit-content; }
        .doc-cell { display: flex; flex-direction: column; gap: 3px; }
        .doc-sh  { font-family: monospace; font-size: 11px; font-weight: 700; color: #166534; background: #f0fdf4; padding: 2px 6px; border-radius: 4px; width: fit-content; display: inline-flex; align-items: center; gap: 3px; }
        .doc-inv { font-family: monospace; font-size: 11px; font-weight: 700; color: #9a3412; background: #fff7ed; padding: 2px 6px; border-radius: 4px; width: fit-content; display: inline-flex; align-items: center; gap: 3px; }
        .na { color: #cbd5e1; }
        .qty-pill { display: inline-block; font-size: 12px; font-weight: 800; padding: 3px 10px; border-radius: 20px; font-family: monospace; }
        .qty-green { background: #dcfce7; color: #16a34a; }
        .qty-blue  { background: #dbeafe; color: #1d4ed8; }
        .price-col { font-weight: 700; color: #0f172a; white-space: nowrap; }
        .icon-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; color: #64748b; }
        .icon-btn.view:hover { background: #eef2ff; border-color: #4f46e5; color: #4f46e5; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 16px; }
        .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 560px; box-shadow: 0 32px 80px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 22px 24px 0; position: sticky; top: 0; background: #fff; z-index: 1; }
        .modal-header h2 { font-size: 17px; font-weight: 800; color: #0f172a; }
        .modal-close { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
        .form-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
        .type-badge-large { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 700; align-self: flex-start; }
        .bg-green { background: #dcfce7; color: #16a34a; }
        .bg-blue  { background: #dbeafe; color: #1d4ed8; }
        .date-inline { font-size: 12px; font-weight: 400; opacity: 0.7; margin-left: 4px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .dg-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px; padding: 10px 12px; }
        .dg-full { grid-column: 1 / -1; }
        .dg-label { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
        .dg-val { font-size: 14px; font-weight: 600; color: #0f172a; }
        .dg-total { font-size: 18px; font-weight: 800; color: #0f172a; }
        .mono { font-family: monospace; }
        @media (max-width: 768px) {
          .page { padding: 16px; }
          .summary-row { grid-template-columns: 1fr; }
          .toolbar { flex-direction: column; align-items: stretch; }
          .detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};
