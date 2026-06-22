import { useState, useRef } from "react";
import {
  QrCode, Search, X, Plus, Pencil, Trash2,
  CheckCircle, AlertTriangle, Clock, ShieldAlert,
  Loader2, Download, Upload, Package, Tag,
  Hash, FileCode, Layers, ScanBarcode, Eye,
  Copy, Check,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────
let mockMarkId = 600;

const initialMarkings = [
  {
    id: 1, productId: 1,
    productName: "Paracetamol 500mg",
    barcode: "4780123456789",
    ikpu: "10006001001000000",
    markingCode: "010046073245681121Kl7HEVpkAHOKj1-RxkvXg==",
    series: "478001167783021",
    boxSeries: "MK-2026-001",
    status: "verified",
    importedAt: "2026-03-05",
  },
  {
    id: 2, productId: 1,
    productName: "Paracetamol 500mg",
    barcode: "4780123456789",
    ikpu: "10006001001000000",
    markingCode: "010046073245681121Kl7HEVpkAHOKj2-RxkvXg==",
    series: "478001167783022",
    boxSeries: "MK-2026-002",
    status: "verified",
    importedAt: "2026-03-10",
  },
  {
    id: 3, productId: 2,
    productName: "Amoxicillin 250mg",
    barcode: "4780198765432",
    ikpu: "10006001002000000",
    markingCode: "010046073245681122AbCdEfGhIjKlMn==",
    series: "478019988771",
    boxSeries: null,
    status: "pending",
    importedAt: "2026-02-20",
  },
  {
    id: 4, productId: 4,
    productName: "Vitamin C 1000mg",
    barcode: "4780111222333",
    ikpu: "10006001003000000",
    markingCode: "010046073245681124VitCXyzAbcDef==",
    series: "478011199001",
    boxSeries: "MK-2025-450",
    status: "expired",
    importedAt: "2025-11-05",
  },
];

const STATUS_CFG = {
  verified: { label: "Tasdiqlangan", cls: "green",  Icon: CheckCircle  },
  pending:  { label: "Tekshirilmoqda", cls: "yellow", Icon: Clock       },
  expired:  { label: "Muddati o'tgan", cls: "red",  Icon: AlertTriangle },
  rejected: { label: "Rad etilgan",   cls: "gray",  Icon: X            },
};

function Toast({ msg, type, onClose }) {
  useState(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); });
  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{type === "success" ? <CheckCircle size={17} /> : <ShieldAlert size={17} />}</span>
      <span>{msg}</span>
      <button className="toast-close" onClick={onClose}><X size={14} /></button>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box${wide ? " modal-wide" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, required, hint, children }) {
  return (
    <div className="field">
      <label className="field-label">
        {Icon && <Icon size={13} strokeWidth={2.5} />}{label}
        {required && <span className="req">*</span>}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={copy} title="Nusxa olish">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function MarkingForm({ initial = {}, onSave, onCancel, saving }) {
  const [productName,  setProductName]  = useState(initial.productName  || "");
  const [barcode,      setBarcode]      = useState(initial.barcode      || "");
  const [ikpu,         setIkpu]         = useState(initial.ikpu         || "");
  const [markingCode,  setMarkingCode]  = useState(initial.markingCode  || "");
  const [series,       setSeries]       = useState(initial.series       || "");
  const [boxSeries,    setBoxSeries]    = useState(initial.boxSeries    || "");
  const [status,       setStatus]       = useState(initial.status       || "pending");
  const [err,          setErr]          = useState("");

  const submit = () => {
    if (!productName.trim()) return setErr("Product name is required");
    if (!markingCode.trim()) return setErr("Marking code is required");
    if (!series.trim())      return setErr("Drug series is required");
    setErr("");
    onSave({
      productName: productName.trim(), barcode: barcode.trim() || null,
      ikpu: ikpu.trim(), markingCode: markingCode.trim(),
      series: series.trim(), boxSeries: boxSeries.trim() || null,
      status, importedAt: initial.importedAt || new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="form-body">
      {err && <div className="form-error"><ShieldAlert size={14} />{err}</div>}

      <div className="section-divider"><span>Product Information</span></div>
      <Field label="Product Name" icon={Package} required>
        <input className="input" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Paracetamol 500mg" autoFocus />
      </Field>
      <div className="form-row">
        <Field label="Barcode" icon={Hash} hint="Product barcode (GTIN)">
          <input className="input mono" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="4780123456789" />
        </Field>
        <Field label="IKPU Code" icon={FileCode} hint="National product code">
          <input className="input mono" value={ikpu} onChange={e => setIkpu(e.target.value)} placeholder="10006001001000000" />
        </Field>
      </div>

      <div className="section-divider"><span>Marking Data</span></div>
      <Field label="Marking Code" icon={QrCode} required hint="Full marking code from QR (DataMatrix)">
        <textarea className="input" rows={3} value={markingCode} onChange={e => setMarkingCode(e.target.value)}
          placeholder="010046073245681121Kl7HEVpkAHOKj..." style={{ resize: "vertical", fontFamily: "monospace", fontSize: 12 }} />
      </Field>
      <div className="form-row">
        <Field label="Drug Series (Barcode)" icon={Tag} required hint="Series from outer box barcode">
          <input className="input mono" value={series} onChange={e => setSeries(e.target.value)} placeholder="478001167783021" />
        </Field>
        <Field label="Box Series (QR)" icon={QrCode} hint="Series from marking QR code">
          <input className="input mono" value={boxSeries} onChange={e => setBoxSeries(e.target.value)} placeholder="MK-2026-001" />
        </Field>
      </div>

      <div className="section-divider"><span>Verification Status</span></div>
      <Field label="Status" icon={CheckCircle}>
        <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
          {Object.entries(STATUS_CFG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </Field>

      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel} type="button">Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={saving} type="button">
          {saving ? <><Loader2 size={15} className="spin" /> Saving…</> : "Save"}
        </button>
      </div>
    </div>
  );
}

function DetailModal({ marking, onClose }) {
  const cfg = STATUS_CFG[marking.status] || STATUS_CFG.pending;
  return (
    <Modal title="Marking Code Detail" onClose={onClose} wide>
      <div className="form-body">
        <div className="detail-product-strip">
          <Package size={14} />
          <span className="dps-name">{marking.productName}</span>
          {marking.barcode && <span className="pi-badge bc"><Hash size={10} />{marking.barcode}</span>}
          {marking.ikpu    && <span className="pi-badge ikpu"><FileCode size={10} />{marking.ikpu}</span>}
        </div>

        <div className="section-divider"><span>Marking Code (DataMatrix)</span></div>
        <div className="marking-code-box">
          <div className="mcb-qr"><QrCode size={48} strokeWidth={1} /></div>
          <div className="mcb-code">{marking.markingCode}</div>
          <CopyButton value={marking.markingCode} />
        </div>

        <div className="section-divider"><span>Series</span></div>
        <div className="series-detail-row">
          <div className="sdr-item">
            <div className="sdr-label"><Tag size={11} />Drug Series (Barcode)</div>
            <div className="sdr-val mono">{marking.series}</div>
          </div>
          {marking.boxSeries && (
            <div className="sdr-item">
              <div className="sdr-label"><QrCode size={11} />Box Series (QR)</div>
              <div className="sdr-val mono">{marking.boxSeries}</div>
            </div>
          )}
        </div>

        <div className="section-divider"><span>Status</span></div>
        <div className={`status-detail badge-status ${cfg.cls}`}><cfg.Icon size={13} />{cfg.label}</div>

        <div className="import-date-row">
          <span className="id-label">Import date:</span>
          <span className="id-val">{new Date(marking.importedAt).toLocaleDateString("uz-UZ")}</span>
        </div>
      </div>
    </Modal>
  );
}

export const Markirovka = () => {
  const [markings,  setMarkings]  = useState(initialMarkings);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all");
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);
  const [addModal,  setAddModal]  = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const fileRef = useRef();

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const handleCreate = (data) => {
    setSaving(true);
    setTimeout(() => {
      setMarkings(prev => [{ id: ++mockMarkId, productId: mockMarkId, ...data }, ...prev]);
      showToast("Marking code added!");
      setAddModal(false);
      setSaving(false);
    }, 400);
  };

  const handleUpdate = (data) => {
    setSaving(true);
    setTimeout(() => {
      setMarkings(prev => prev.map(m => m.id === editModal.id ? { ...m, ...data } : m));
      showToast("Marking code updated");
      setEditModal(null);
      setSaving(false);
    }, 400);
  };

  const handleDelete = (m) => {
    if (!window.confirm(`Delete marking for "${m.productName}"?`)) return;
    setMarkings(prev => prev.filter(x => x.id !== m.id));
    showToast("Marking code deleted");
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Mock import: parse CSV/TXT (first column = marking code)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split("\n").filter(Boolean).slice(1); // skip header
      let added = 0;
      lines.forEach(line => {
        const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
        if (cols[0]) {
          setMarkings(prev => [{
            id: ++mockMarkId, productId: 0,
            productName: cols[1] || "Unknown Product",
            barcode:     cols[2] || null,
            ikpu:        cols[3] || "",
            markingCode: cols[0],
            series:      cols[4] || "",
            boxSeries:   cols[5] || null,
            status:      "pending",
            importedAt:  new Date().toISOString().split("T")[0],
          }, ...prev]);
          added++;
        }
      });
      showToast(`${added} ta marking kodi import qilindi!`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExport = () => {
    const rows = [
      ["Marking Code", "Product Name", "Barcode", "IKPU", "Drug Series", "Box Series", "Status", "Import Date"],
      ...filtered.map(m => [
        `'${m.markingCode}`, m.productName, m.barcode ? `'${m.barcode}` : "",
        m.ikpu ? `'${m.ikpu}` : "", m.series ? `'${m.series}` : "",
        m.boxSeries || "", STATUS_CFG[m.status]?.label || m.status, m.importedAt,
      ]),
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "markings.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("Export ready");
  };

  const filtered = markings.filter(m => {
    const q = search.toLowerCase();
    const matchSearch =
      (m.productName  || "").toLowerCase().includes(q) ||
      (m.markingCode  || "").includes(search) ||
      (m.series       || "").includes(search) ||
      (m.boxSeries    || "").includes(search) ||
      (m.barcode      || "").includes(search) ||
      (m.ikpu         || "").includes(search);
    const matchFilter = filter === "all" || m.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = { all: markings.length, ...Object.fromEntries(Object.keys(STATUS_CFG).map(s => [s, markings.filter(m => m.status === s).length])) };

  return (
    <>
      <style>{STYLES}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleImport} />

      <div className="page">
        <div className="page-header">
          <div className="header-text">
            <h1><QrCode size={24} className="h1-icon" />Marking Codes</h1>
            <p className="subtitle">Apteka ombori — barcha marking kodlari boshqaruvi</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => fileRef.current?.click()}><Upload size={15} />Import CSV</button>
            <button className="btn-secondary" onClick={handleExport}><Download size={15} />Export</button>
            <button className="btn-primary" onClick={() => setAddModal(true)}><Plus size={16} strokeWidth={2.5} />Add Marking</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {[
            ["all", "Jami", Layers, "blue"],
            ["verified", "Tasdiqlangan", CheckCircle, "green"],
            ["pending",  "Tekshirilmoqda", Clock, "yellow"],
            ["expired",  "Muddati o'tgan", AlertTriangle, "red"],
          ].map(([s, label, Icon, accent]) => (
            <div key={s} className={`stat-card sc-${accent}`} onClick={() => setFilter(s)} style={{ cursor: "pointer" }}>
              <div className={`sc-icon sc-icon-${accent}`}><Icon size={18} strokeWidth={2} /></div>
              <div><div className="sc-value">{counts[s] ?? 0}</div><div className="sc-label">{label}</div></div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <ScanBarcode size={15} className="search-icon" strokeWidth={2} />
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Marking code, barcode, IKPU, series bo'yicha qidiring…" />
            {search && <button className="clear-btn" onClick={() => setSearch("")}><X size={14} /></button>}
          </div>
          <div className="filter-tabs">
            {[["all","Barchasi"],["verified","Tasdiqlangan"],["pending","Tekshirilmoqda"],["expired","O'tgan"],["rejected","Rad etilgan"]].map(([v,l]) => (
              <button key={v} className={`filter-tab ${filter === v ? "active" : ""}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="table-card">
          {filtered.length === 0 ? (
            <div className="state-box">
              <QrCode size={40} strokeWidth={1} style={{ color: "#cbd5e1" }} />
              <p>{search || filter !== "all" ? "No matching records found" : "No marking codes. Add or import!"}</p>
              {!search && filter === "all" && (
                <div className="empty-actions">
                  <button className="btn-secondary" onClick={() => fileRef.current?.click()}><Upload size={14} />Import CSV</button>
                  <button className="btn-primary" onClick={() => setAddModal(true)}><Plus size={14} />Add Marking</button>
                </div>
              )}
            </div>
          ) : (
            <div className="table-scroll">
              <table className="main-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Marking Code</th>
                    <th>Drug Series</th>
                    <th>Box Series (QR)</th>
                    <th>Status</th>
                    <th>Import Date</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => {
                    const cfg = STATUS_CFG[m.status] || STATUS_CFG.pending;
                    return (
                      <tr key={m.id}>
                        <td>
                          <div className="product-col">
                            <div className="prod-name">{m.productName}</div>
                            <div className="prod-meta">
                              {m.barcode && <span className="pi-badge bc"><Hash size={9} />{m.barcode}</span>}
                              {m.ikpu    && <span className="pi-badge ikpu"><FileCode size={9} />{m.ikpu}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="mc-cell">
                            <span className="mc-code">{m.markingCode.slice(0, 28)}…</span>
                            <CopyButton value={m.markingCode} />
                          </div>
                        </td>
                        <td><span className="badge-series"><Tag size={10} />{m.series}</span></td>
                        <td>{m.boxSeries ? <span className="badge-box"><QrCode size={10} />{m.boxSeries}</span> : <span className="na">—</span>}</td>
                        <td><span className={`badge-status ${cfg.cls}`}><cfg.Icon size={10} />{cfg.label}</span></td>
                        <td className="date-col">{new Date(m.importedAt).toLocaleDateString("uz-UZ")}</td>
                        <td>
                          <div className="row-actions">
                            <button className="icon-btn view" onClick={() => setViewModal(m)} title="View"><Eye size={14} strokeWidth={2} /></button>
                            <button className="icon-btn edit" onClick={() => setEditModal(m)} title="Edit"><Pencil size={14} strokeWidth={2} /></button>
                            <button className="icon-btn del"  onClick={() => handleDelete(m)} title="Delete"><Trash2 size={14} strokeWidth={2} /></button>
                          </div>
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

      {addModal  && <Modal title="Add Marking Code" onClose={() => setAddModal(false)} wide><MarkingForm onSave={handleCreate} onCancel={() => setAddModal(false)} saving={saving} /></Modal>}
      {editModal && <Modal title="Edit Marking Code" onClose={() => setEditModal(null)} wide><MarkingForm initial={editModal} onSave={handleUpdate} onCancel={() => setEditModal(null)} saving={saving} /></Modal>}
      {viewModal && <DetailModal marking={viewModal} onClose={() => setViewModal(null)} />}
    </>
  );
};

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .page { padding: 32px 28px; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background: #f6f8fc; min-height: 100vh; }
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
  .header-text h1 { font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }
  .h1-icon { color: #d97706; }
  .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .btn-primary  { display: inline-flex; align-items: center; gap: 7px; background: #d97706; color: #fff; border: none; border-radius: 10px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.15s; }
  .btn-primary:hover:not(:disabled) { background: #b45309; }
  .btn-primary:disabled { background: #fcd34d; cursor: not-allowed; }
  .btn-secondary { display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
  .btn-secondary:hover { background: #f8fafc; }
  .stats-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .stat-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; transition: border-color 0.15s; }
  .stat-card:hover { border-color: #fcd34d; }
  .sc-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .sc-icon-blue   { background: #eff6ff; color: #2563eb; }
  .sc-icon-green  { background: #dcfce7; color: #16a34a; }
  .sc-icon-yellow { background: #fef9c3; color: #b45309; }
  .sc-icon-red    { background: #fef2f2; color: #dc2626; }
  .sc-value { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
  .sc-label { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
  .search-wrap { position: relative; display: flex; align-items: center; background: #fff; border: 2px solid #d97706; border-radius: 11px; flex: 1; min-width: 240px; transition: box-shadow 0.15s; }
  .search-wrap:focus-within { box-shadow: 0 0 0 3px #fef9c3; }
  .search-icon { margin-left: 14px; color: #d97706; flex-shrink: 0; }
  .search-input { flex: 1; border: none; outline: none; padding: 11px 12px; font-size: 14px; background: transparent; color: #0f172a; }
  .search-input::placeholder { color: #fed7aa; }
  .clear-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0 14px; display: flex; align-items: center; }
  .filter-tabs { display: flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 4px; overflow-x: auto; }
  .filter-tab { border: none; background: none; padding: 7px 12px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; color: #64748b; transition: all 0.15s; white-space: nowrap; }
  .filter-tab.active { background: #fff; color: #d97706; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .table-scroll { overflow-x: auto; }
  .state-box { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 72px 24px; color: #94a3b8; }
  .empty-actions { display: flex; gap: 10px; }
  .main-table { width: 100%; border-collapse: collapse; min-width: 860px; }
  .main-table thead tr { background: #fffbeb; border-bottom: 1.5px solid #fde68a; }
  .main-table th { padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #92400e; text-align: left; white-space: nowrap; }
  .main-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
  .main-table tbody tr:last-child { border-bottom: none; }
  .main-table tbody tr:hover { background: #fffbeb; }
  .main-table td { padding: 12px 16px; font-size: 13px; color: #334155; vertical-align: middle; }
  .product-col { display: flex; flex-direction: column; gap: 4px; }
  .prod-name { font-weight: 700; color: #0f172a; font-size: 13px; }
  .prod-meta { display: flex; gap: 4px; flex-wrap: wrap; }
  .pi-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: 600; }
  .pi-badge.bc   { background: #eff6ff; color: #1d4ed8; }
  .pi-badge.ikpu { background: #f5f3ff; color: #6d28d9; }
  .mc-cell { display: flex; align-items: center; gap: 6px; }
  .mc-code { font-family: monospace; font-size: 11px; color: #475569; background: #f8fafc; padding: 4px 8px; border-radius: 5px; border: 1px solid #e2e8f0; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .copy-btn { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 5px; padding: 4px 6px; cursor: pointer; color: #64748b; display: flex; align-items: center; transition: all 0.15s; flex-shrink: 0; }
  .copy-btn:hover { background: #e2e8f0; }
  .copy-btn.copied { background: #dcfce7; border-color: #86efac; color: #16a34a; }
  .badge-series  { display: inline-flex; align-items: center; gap: 4px; background: #ede9fe; color: #6d28d9; font-family: monospace; font-size: 11px; padding: 3px 8px; border-radius: 5px; font-weight: 700; }
  .badge-box     { display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; color: #2563eb; font-family: monospace; font-size: 10px; padding: 2px 7px; border-radius: 5px; font-weight: 600; }
  .badge-status  { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
  .badge-status.green  { background: #dcfce7; color: #16a34a; }
  .badge-status.yellow { background: #fef9c3; color: #b45309; }
  .badge-status.red    { background: #fee2e2; color: #dc2626; }
  .badge-status.gray   { background: #f1f5f9; color: #64748b; }
  .na { color: #cbd5e1; font-size: 14px; }
  .date-col { color: #64748b; font-size: 12px; white-space: nowrap; }
  .row-actions { display: flex; gap: 6px; }
  .icon-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; color: #64748b; }
  .icon-btn.view:hover { background: #fffbeb; border-color: #d97706; color: #d97706; }
  .icon-btn.edit:hover { background: #fefce8; border-color: #f59e0b; color: #b45309; }
  .icon-btn.del:hover  { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 16px; }
  .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 540px; box-shadow: 0 32px 80px rgba(0,0,0,0.2); animation: popIn 0.18s ease; max-height: 90vh; overflow-y: auto; }
  .modal-wide { max-width: 680px; }
  @keyframes popIn { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 22px 24px 0; position: sticky; top: 0; background: #fff; z-index: 1; }
  .modal-header h2 { font-size: 17px; font-weight: 800; color: #0f172a; }
  .modal-close { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
  .modal-close:hover { background: #e2e8f0; }
  .section-divider { display: flex; align-items: center; gap: 10px; margin: 4px 0 2px; }
  .section-divider span { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap; }
  .section-divider::before,.section-divider::after { content:''; flex:1; height:1px; background:#e2e8f0; }
  .form-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
  .form-error { display: flex; align-items: center; gap: 7px; background: #fef2f2; color: #dc2626; font-size: 13px; padding: 10px 14px; border-radius: 9px; border: 1px solid #fecaca; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #475569; letter-spacing: 0.02em; text-transform: uppercase; }
  .field-hint { font-size: 11px; color: #94a3b8; }
  .req { color: #ef4444; }
  .input { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px 13px; font-size: 14px; outline: none; color: #0f172a; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; font-family: inherit; }
  .input:focus { border-color: #d97706; box-shadow: 0 0 0 3px #fef9c3; }
  .input::placeholder { color: #cbd5e1; }
  .mono { font-family: monospace; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
  /* detail modal */
  .detail-product-strip { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 10px 14px; }
  .dps-name { font-weight: 700; font-size: 14px; color: #0f172a; flex: 1; }
  .marking-code-box { display: flex; align-items: flex-start; gap: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; }
  .mcb-qr { color: #d97706; flex-shrink: 0; }
  .mcb-code { flex: 1; font-family: monospace; font-size: 12px; color: #0f172a; word-break: break-all; line-height: 1.6; }
  .series-detail-row { display: flex; gap: 16px; flex-wrap: wrap; }
  .sdr-item { flex: 1; min-width: 140px; }
  .sdr-label { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .sdr-val { font-size: 13px; font-weight: 700; color: #0f172a; }
  .status-detail { align-self: flex-start; }
  .import-date-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
  .id-label { color: #94a3b8; }
  .id-val { font-weight: 600; color: #334155; }
  .toast { position: fixed; bottom: 28px; right: 28px; z-index: 2000; padding: 14px 18px; border-radius: 14px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; box-shadow: 0 12px 40px rgba(0,0,0,0.18); animation: slideUp 0.22s ease; max-width: 360px; }
  .toast-success { background: #0f172a; color: #fff; }
  .toast-error   { background: #dc2626; color: #fff; }
  .toast-icon { display: flex; align-items: center; }
  .toast-close { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.7); padding: 0; margin-left: auto; display: flex; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  .spin { animation: spinAnim 0.7s linear infinite; }
  @keyframes spinAnim { to { transform: rotate(360deg); } }
  @media (max-width: 640px) {
    .page { padding: 20px 14px; }
    .stats-row { grid-template-columns: 1fr 1fr; }
    .form-row { grid-template-columns: 1fr; }
    .header-actions { flex-direction: column; }
    .toolbar { flex-direction: column; }
  }
`;