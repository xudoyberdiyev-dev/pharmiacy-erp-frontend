import { useState } from "react";
import {
  Search, X, Plus, Pencil, Trash2, Filter,
  Package, AlertTriangle, Clock, CheckCircle,
  BoxSelect, FlaskConical, Tag, Calendar,
  Banknote, ShieldAlert, Loader2, QrCode,
  FileCode, Hash, ChevronDown, Download,
  FileText, Layers,
} from "lucide-react";

let mockBatchId = 500;

const mockProducts = [
  { id: 1, name: "Paracetamol 500mg", barcode: "4780123456789", ikpu: "10006001001000000", unit: "dona" },
  { id: 2, name: "Amoxicillin 250mg", barcode: "4780198765432", ikpu: "10006001002000000", unit: "qadoq" },
  { id: 3, name: "Ibuprofen 400mg",   barcode: null,            ikpu: "",                unit: "dona" },
  { id: 4, name: "Vitamin C 1000mg",  barcode: "4780111222333", ikpu: "10006001003000000", unit: "dona" },
];

const initialBatches = [
  { id: 1,  productId: 1, series: "478001167783021", boxSeries: "MK-2026-001", mg: "500mg", quantity: 240, remaining: 240, price: 12000, expiry: "2027-03-15", contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0892" },
  { id: 2,  productId: 1, series: "478001167783022", boxSeries: "MK-2026-002", mg: "500mg", quantity: 18,  remaining: 18,  price: 12500, expiry: "2026-07-10", contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0910" },
  { id: 3,  productId: 2, series: "478019988771",    boxSeries: null,           mg: "250mg", quantity: 80,  remaining: 65,  price: 24000, expiry: "2026-12-01", contractNumber: "SH-2026-031", invoiceNumber: "F-2026-0411" },
  { id: 4,  productId: 4, series: "478011199001",    boxSeries: "MK-2025-450",  mg: "1000mg",quantity: 5,   remaining: 5,   price: 18000, expiry: "2026-06-25", contractNumber: "SH-2025-188", invoiceNumber: "F-2025-2201" },
];

const formatDate  = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";
const formatPrice = (p) => Number(p).toLocaleString("uz-UZ") + " so'm";

function isExpired(expiry)     { return expiry ? new Date(expiry) < new Date() : false; }
function isExpiringSoon(expiry){ if (!expiry) return false; const d = (new Date(expiry) - new Date()) / 86400000; return d > 0 && d <= 30; }

function Toast({ msg, type, onClose }) {
  useState(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); });
  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-icon">{type === "success" ? <CheckCircle size={17} /> : <ShieldAlert size={17} />}</span>
      <span>{msg}</span>
      <button className="toast-close" onClick={onClose}><X size={14} /></button>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
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

function BatchForm({ initial = {}, onSave, onCancel, saving }) {
  const [productId,      setProductId]      = useState(initial.productId      || "");
  const [series,         setSeries]         = useState(initial.series         || "");
  const [boxSeries,      setBoxSeries]      = useState(initial.boxSeries      || "");
  const [mg,             setMg]             = useState(initial.mg             || "");
  const [quantity,       setQuantity]       = useState(initial.quantity       ?? "");
  const [price,          setPrice]          = useState(initial.price          ?? "");
  const [expiry,         setExpiry]         = useState(
    initial.expiry ? new Date(initial.expiry).toISOString().split("T")[0] : ""
  );
  const [contractNumber, setContractNumber] = useState(initial.contractNumber || "");
  const [invoiceNumber,  setInvoiceNumber]  = useState(initial.invoiceNumber  || "");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!productId)           return setErr("Mahsulot tanlansin");
    if (!series.trim())       return setErr("Seriya raqami kiritilsin");
    if (!mg.trim())           return setErr("Dozaj kiritilsin");
    if (quantity === "")      return setErr("Miqdor kiritilsin");
    if (price === "")         return setErr("Narx kiritilsin");
    if (!expiry)              return setErr("Yaroqlilik muddati kiritilsin");
    if (Number(quantity) < 0) return setErr("Miqdor manfiy bo'lmasin");
    if (Number(price)    < 0) return setErr("Narx manfiy bo'lmasin");
    setErr("");
    onSave({
      productId: Number(productId), series: series.trim(),
      boxSeries: boxSeries.trim() || null, mg: mg.trim(),
      quantity: Number(quantity), remaining: initial.id ? initial.remaining : Number(quantity),
      price: Number(price), expiry,
      contractNumber: contractNumber.trim(), invoiceNumber: invoiceNumber.trim(),
    });
  };

  const selectedProduct = mockProducts.find(p => p.id === Number(productId));

  return (
    <div className="form-body">
      {err && <div className="form-error"><ShieldAlert size={14} />{err}</div>}

      <div className="section-divider"><span>Hujjatlar</span></div>
      <div className="form-row">
        <Field label="Shartnoma raqami" icon={FileText} hint="Kiruvchi shartnoma raqami">
          <input className="input mono" value={contractNumber} onChange={e => setContractNumber(e.target.value)} placeholder="SH-2026-001" />
        </Field>
        <Field label="Faktura raqami" icon={Hash} hint="Yetkazib beruvchi fakturasi">
          <input className="input mono" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="F-2026-0001" />
        </Field>
      </div>

      <div className="section-divider"><span>Mahsulot</span></div>
      <Field label="Mahsulot" icon={Package} required>
        <select className="input" value={productId} onChange={e => setProductId(e.target.value)} autoFocus>
          <option value="">— Tanlang —</option>
          {mockProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>

      {selectedProduct && (
        <div className="product-info-strip">
          {selectedProduct.barcode && <span className="pi-badge bc"><Hash size={10} />{selectedProduct.barcode}</span>}
          {selectedProduct.ikpu    && <span className="pi-badge ikpu"><FileCode size={10} />{selectedProduct.ikpu}</span>}
          <span className="pi-badge unit"><BoxSelect size={10} />{selectedProduct.unit}</span>
        </div>
      )}

      <div className="section-divider"><span>Marking / Series</span></div>
      <div className="series-info-box">
        <div className="sib-row">
          <div className="sib-item">
            <Tag size={13} className="sib-icon sib-blue" />
            <div>
              <div className="sib-label">Drug series (barcode) <span className="req">*</span></div>
              <div className="sib-desc">Series number on the outer box barcode</div>
            </div>
          </div>
          <div className="sib-item">
            <QrCode size={13} className="sib-icon sib-violet" />
            <div>
              <div className="sib-label">Marking code (QR)</div>
              <div className="sib-desc">Series from the marking QR code (optional)</div>
            </div>
          </div>
        </div>
      </div>
      <div className="form-row">
        <Field label="Dori seriyasi (barcode)" icon={Tag} required>
          <input className="input mono" value={series} onChange={e => setSeries(e.target.value)} placeholder="478001167783021" />
        </Field>
        <Field label="Marking series (QR)" icon={QrCode}>
          <input className="input mono" value={boxSeries} onChange={e => setBoxSeries(e.target.value)} placeholder="MK-2026-001" />
        </Field>
      </div>

      <div className="section-divider"><span>Partiya ma'lumotlari</span></div>
      <div className="form-row">
        <Field label="Dozaj" icon={FlaskConical} required>
          <input className="input" value={mg} onChange={e => setMg(e.target.value)} placeholder="500mg" />
        </Field>
        <Field label="Kiruvchi miqdor" icon={BoxSelect} required>
          <input className="input" type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="100" />
        </Field>
      </div>
      <div className="form-row">
        <Field label="Narx (so'm)" icon={Banknote} required>
          <input className="input" type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="15000" />
        </Field>
        <Field label="Yaroqlilik muddati" icon={Calendar} required>
          <input className="input" type="date" value={expiry} onChange={e => setExpiry(e.target.value)} />
        </Field>
      </div>

      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel} type="button">Bekor</button>
        <button className="btn-primary" onClick={submit} disabled={saving} type="button">
          {saving ? <><Loader2 size={15} className="spin" /> Saqlanmoqda…</> : "Saqlash"}
        </button>
      </div>
    </div>
  );
}

function StatusBadge({ expiry }) {
  if (isExpired(expiry))     return <span className="badge-status red"><AlertTriangle size={10} /> Muddati o'tgan</span>;
  if (isExpiringSoon(expiry)) return <span className="badge-status yellow"><Clock size={10} /> Tugayapti</span>;
  return <span className="badge-status green"><CheckCircle size={10} /> Yaxshi</span>;
}

export const Batch = () => {
  const [batches, setBatches] = useState(initialBatches);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);
  const [addModal,  setAddModal]  = useState(false);
  const [editModal, setEditModal] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const handleCreate = (data) => {
    setSaving(true);
    setTimeout(() => {
      setBatches(prev => [{ id: ++mockBatchId, ...data }, ...prev]);
      showToast("Partiya qo'shildi!");
      setAddModal(false);
      setSaving(false);
    }, 400);
  };

  const handleUpdate = (data) => {
    setSaving(true);
    setTimeout(() => {
      setBatches(prev => prev.map(b => b.id === editModal.id ? { ...b, ...data } : b));
      showToast("Partiya yangilandi");
      setEditModal(null);
      setSaving(false);
    }, 400);
  };

  const handleDelete = (batch) => {
    const p = mockProducts.find(p => p.id === batch.productId);
    if (!window.confirm(`"${p?.name || ""}" — "${batch.series}" partiyasini o'chirasizmi?`)) return;
    setBatches(prev => prev.filter(b => b.id !== batch.id));
    showToast("Partiya o'chirildi");
  };

  const filtered = batches.filter(b => {
    const prod = mockProducts.find(p => p.id === b.productId);
    const matchSearch =
      (prod?.name         || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.series           || "").includes(search) ||
      (b.boxSeries        || "").includes(search) ||
      (b.contractNumber   || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.invoiceNumber    || "").toLowerCase().includes(search.toLowerCase()) ||
      (prod?.barcode      || "").includes(search) ||
      (prod?.ikpu         || "").includes(search);
    const matchFilter =
      filter === "all"     ? true :
      filter === "expired" ? isExpired(b.expiry) :
      filter === "soon"    ? isExpiringSoon(b.expiry) :
      filter === "ok"      ? (!isExpired(b.expiry) && !isExpiringSoon(b.expiry)) : true;
    return matchSearch && matchFilter;
  });

  const totalExpired = batches.filter(b => isExpired(b.expiry)).length;
  const totalSoon    = batches.filter(b => isExpiringSoon(b.expiry)).length;
  const totalOk      = batches.filter(b => !isExpired(b.expiry) && !isExpiringSoon(b.expiry)).length;

  const exportCSV = () => {
    const rows = [
      ["Mahsulot", "Barcode", "IKPU", "Seriya", "QR Seriya", "Dozaj", "Kirim", "Qoldiq", "Narx", "Muddat", "Shartnoma", "Faktura"],
      ...filtered.map(b => {
        const p = mockProducts.find(x => x.id === b.productId);
        return [
          p?.name || "", p?.barcode || "", p?.ikpu || "",
          `'${b.series}`, b.boxSeries ? `'${b.boxSeries}` : "",
          b.mg, b.quantity, b.remaining, b.price,
          b.expiry, b.contractNumber || "", b.invoiceNumber || "",
        ];
      }),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "partiyalar.csv"; a.click();
    URL.revokeObjectURL(url);
    showToast("CSV yuklab olindi");
  };

  return (
    <>
      <style>{STYLES}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page">
        <div className="page-header">
          <div className="header-text">
            <h1><Layers size={24} strokeWidth={2.2} className="h1-icon" />Partiyalar</h1>
            <p className="subtitle">Barcha kiruvchi tovar partiyalari — hujjatlar va muddatlar</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={exportCSV}><Download size={15} />Excel/CSV</button>
            <button className="btn-primary" onClick={() => setAddModal(true)}><Plus size={16} strokeWidth={2.5} />Partiya qo'shish</button>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card stat-blue"   onClick={() => setFilter("all")}     style={{ cursor:"pointer" }}>
            <div className="stat-icon-wrap stat-icon-blue"><Layers size={18} /></div>
            <div><div className="stat-value">{batches.length}</div><div className="stat-label">Jami partiyalar</div></div>
          </div>
          <div className="stat-card stat-green"  onClick={() => setFilter("ok")}      style={{ cursor:"pointer" }}>
            <div className="stat-icon-wrap stat-icon-green"><CheckCircle size={18} /></div>
            <div><div className="stat-value">{totalOk}</div><div className="stat-label">Yaxshi holat</div></div>
          </div>
          <div className="stat-card stat-yellow" onClick={() => setFilter("soon")}    style={{ cursor:"pointer" }}>
            <div className="stat-icon-wrap stat-icon-yellow"><Clock size={18} /></div>
            <div><div className="stat-value">{totalSoon}</div><div className="stat-label">Muddat tugayapti</div></div>
          </div>
          <div className="stat-card"            onClick={() => setFilter("expired")} style={{ cursor:"pointer" }}>
            <div className={`stat-icon-wrap ${totalExpired > 0 ? "stat-icon-red" : "stat-icon-gray"}`}><AlertTriangle size={18} /></div>
            <div><div className="stat-value">{totalExpired}</div><div className="stat-label">Muddati o'tgan</div></div>
          </div>
        </div>

        <div className="toolbar">
          <div className="search-wrap">
            <Search size={15} className="search-icon" strokeWidth={2} />
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nom, seriya, barcode, IKPU, shartnoma, faktura…" />
            {search && <button className="clear-btn" onClick={() => setSearch("")}><X size={14} /></button>}
          </div>
          <div className="filter-tabs">
            {[["all","Barchasi"],["ok","Yaxshi"],["soon","Tugayapti"],["expired","O'tgan"]].map(([val, label]) => (
              <button key={val} className={`filter-tab ${filter === val ? "active" : ""}`} onClick={() => setFilter(val)}>{label}</button>
            ))}
          </div>
        </div>

        <div className="table-card">
          {filtered.length === 0 ? (
            <div className="state-box">
              <Layers size={40} strokeWidth={1} className="text-muted" />
              <p>{search || filter !== "all" ? "Mos partiya topilmadi" : "Partiya yo'q. Yangi qo'shing!"}</p>
              {!search && filter === "all" && (
                <button className="btn-primary" onClick={() => setAddModal(true)}><Plus size={15} />Partiya qo'shish</button>
              )}
            </div>
          ) : (
            <div className="table-scroll">
              <table className="main-table">
                <thead>
                  <tr>
                    <th>Mahsulot</th>
                    <th>Seriya / QR</th>
                    <th>Shartnoma / Faktura</th>
                    <th>Dozaj</th>
                    <th className="center">Kirim</th>
                    <th className="center">Qoldiq</th>
                    <th>Narx</th>
                    <th>Muddat</th>
                    <th className="center">Holat</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(b => {
                    const prod = mockProducts.find(p => p.id === b.productId);
                    const expired = isExpired(b.expiry);
                    const soon    = isExpiringSoon(b.expiry);
                    return (
                      <tr key={b.id} className={expired ? "row-expired" : soon ? "row-soon" : ""}>
                        <td>
                          <div className="product-col">
                            <div className="product-name">{prod?.name || "—"}</div>
                            <div className="product-meta">
                              {prod?.barcode && <span className="badge-bc"><Hash size={9} />{prod.barcode}</span>}
                              {prod?.ikpu    && <span className="badge-ikpu"><FileCode size={9} />{prod.ikpu}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="series-cell">
                            <span className="badge-series"><Tag size={10} />{b.series}</span>
                            {b.boxSeries && <span className="badge-box-series"><QrCode size={10} />{b.boxSeries}</span>}
                          </div>
                        </td>
                        <td>
                          <div className="doc-cell">
                            {b.contractNumber && <span className="doc-badge sh"><FileText size={9} />{b.contractNumber}</span>}
                            {b.invoiceNumber  && <span className="doc-badge inv"><Hash size={9} />{b.invoiceNumber}</span>}
                          </div>
                        </td>
                        <td className="mono">{b.mg}</td>
                        <td className="center"><span className="qty-chip">{b.quantity}</span></td>
                        <td className="center">
                          <span className={`qty-chip ${b.remaining < b.quantity * 0.2 ? "qty-low" : ""}`}>{b.remaining}</span>
                        </td>
                        <td className="mono price-col">{formatPrice(b.price)}</td>
                        <td>
                          <span className={`expiry-pill ${expired ? "exp-red" : soon ? "exp-yellow" : "exp-green"}`}>
                            {expired ? <AlertTriangle size={11} /> : soon ? <Clock size={11} /> : <CheckCircle size={11} />}
                            {formatDate(b.expiry)}
                          </span>
                        </td>
                        <td className="center"><StatusBadge expiry={b.expiry} /></td>
                        <td>
                          <div className="row-actions">
                            <button className="icon-btn edit" onClick={() => setEditModal(b)}><Pencil size={14} strokeWidth={2} /></button>
                            <button className="icon-btn del"  onClick={() => handleDelete(b)}><Trash2 size={14} strokeWidth={2} /></button>
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

      {addModal && (
        <Modal title="Yangi partiya qo'shish" onClose={() => setAddModal(false)}>
          <BatchForm onSave={handleCreate} onCancel={() => setAddModal(false)} saving={saving} />
        </Modal>
      )}
      {editModal && (
        <Modal title="Partiyani tahrirlash" onClose={() => setEditModal(null)}>
          <BatchForm initial={editModal} onSave={handleUpdate} onCancel={() => setEditModal(null)} saving={saving} />
        </Modal>
      )}
    </>
  );
};

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .page { padding: 32px 28px; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; background: #f6f8fc; min-height: 100vh; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .header-text h1 { font-size: 24px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }
  .h1-icon { color: #2563eb; }
  .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .btn-primary { display: inline-flex; align-items: center; gap: 7px; background: #7c3aed; color: #fff; border: none; border-radius: 10px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; white-space: nowrap; box-shadow: 0 1px 3px rgba(124,58,237,0.25); }
  .btn-primary:hover:not(:disabled) { background: #6d28d9; }
  .btn-primary:disabled { background: #c4b5fd; cursor: not-allowed; }
  .btn-secondary { display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
  .btn-secondary:hover { background: #f8fafc; }
  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px; }
  .stat-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; transition: border-color 0.15s; }
  .stat-card:hover { border-color: #c4b5fd; }
  .stat-icon-wrap { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .stat-icon-blue   { background: #eff6ff; color: #2563eb; }
  .stat-icon-green  { background: #dcfce7; color: #16a34a; }
  .stat-icon-yellow { background: #fef9c3; color: #b45309; }
  .stat-icon-red    { background: #fef2f2; color: #dc2626; }
  .stat-icon-gray   { background: #f8fafc; color: #94a3b8; }
  .stat-value { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
  .stat-label { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
  .search-wrap { position: relative; display: flex; align-items: center; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 11px; flex: 1; min-width: 240px; transition: border-color 0.15s, box-shadow 0.15s; }
  .search-wrap:focus-within { border-color: #7c3aed; box-shadow: 0 0 0 3px #ede9fe; }
  .search-icon { margin-left: 14px; color: #cbd5e1; flex-shrink: 0; }
  .search-input { flex: 1; border: none; outline: none; padding: 11px 12px; font-size: 14px; background: transparent; color: #0f172a; }
  .search-input::placeholder { color: #cbd5e1; }
  .clear-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0 14px; display: flex; align-items: center; }
  .filter-tabs { display: flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 4px; }
  .filter-tab { border: none; background: none; padding: 7px 14px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; color: #64748b; transition: all 0.15s; white-space: nowrap; }
  .filter-tab.active { background: #fff; color: #7c3aed; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .table-scroll { overflow-x: auto; }
  .state-box { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 72px 24px; color: #94a3b8; font-size: 15px; }
  .text-muted { color: #cbd5e1; }
  .main-table { width: 100%; border-collapse: collapse; min-width: 900px; }
  .main-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
  .main-table th { padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; text-align: left; white-space: nowrap; }
  .main-table th.center { text-align: center; }
  .main-table td.center { text-align: center; }
  .main-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
  .main-table tbody tr:last-child { border-bottom: none; }
  .main-table tbody tr:hover { background: #faf5ff; }
  .main-table td { padding: 12px 16px; font-size: 13px; color: #334155; vertical-align: middle; }
  .row-expired td { background: #fff5f5 !important; }
  .row-soon    td { background: #fffbeb !important; }
  .product-col { display: flex; flex-direction: column; gap: 4px; }
  .product-name { font-weight: 700; color: #0f172a; font-size: 13px; white-space: nowrap; }
  .product-meta { display: flex; gap: 4px; flex-wrap: wrap; }
  .badge-bc   { display: inline-flex; align-items: center; gap: 3px; background: #eff6ff; color: #1d4ed8; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  .badge-ikpu { display: inline-flex; align-items: center; gap: 3px; background: #f5f3ff; color: #6d28d9; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  .series-cell { display: flex; flex-direction: column; gap: 4px; }
  .badge-series { display: inline-flex; align-items: center; gap: 4px; background: #ede9fe; color: #6d28d9; font-family: monospace; font-size: 11px; padding: 3px 8px; border-radius: 5px; font-weight: 700; width: fit-content; }
  .badge-box-series { display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; color: #2563eb; font-family: monospace; font-size: 10px; padding: 2px 7px; border-radius: 5px; font-weight: 600; width: fit-content; }
  .doc-cell { display: flex; flex-direction: column; gap: 3px; }
  .doc-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; padding: 2px 7px; border-radius: 4px; font-family: monospace; font-weight: 600; width: fit-content; }
  .doc-badge.sh  { background: #f0fdf4; color: #166534; }
  .doc-badge.inv { background: #fff7ed; color: #9a3412; }
  .mono { font-family: monospace; }
  .price-col { font-weight: 600; color: #0f172a; white-space: nowrap; }
  .qty-chip { display: inline-block; background: #f1f5f9; color: #334155; font-weight: 700; font-size: 13px; padding: 2px 10px; border-radius: 20px; }
  .qty-low { background: #fef2f2; color: #dc2626; }
  .expiry-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; padding: 4px 9px; border-radius: 20px; white-space: nowrap; }
  .exp-green  { background: #dcfce7; color: #16a34a; }
  .exp-yellow { background: #fef9c3; color: #b45309; }
  .exp-red    { background: #fee2e2; color: #dc2626; }
  .badge-status { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
  .badge-status.red    { background: #fee2e2; color: #dc2626; }
  .badge-status.yellow { background: #fef9c3; color: #b45309; }
  .badge-status.green  { background: #dcfce7; color: #16a34a; }
  .row-actions { display: flex; gap: 6px; }
  .icon-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; color: #64748b; }
  .icon-btn.edit:hover { background: #fefce8; border-color: #f59e0b; color: #b45309; }
  .icon-btn.del:hover  { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 16px; }
  .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 640px; box-shadow: 0 32px 80px rgba(0,0,0,0.2); animation: popIn 0.18s ease; max-height: 90vh; overflow-y: auto; }
  @keyframes popIn { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 22px 24px 0; position: sticky; top: 0; background: #fff; z-index: 1; }
  .modal-header h2 { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; }
  .modal-close { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
  .modal-close:hover { background: #e2e8f0; }
  .section-divider { display: flex; align-items: center; gap: 10px; margin: 4px 0 2px; }
  .section-divider span { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap; }
  .section-divider::before,.section-divider::after { content:''; flex:1; height:1px; background:#e2e8f0; }
  .form-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
  .form-error { display: flex; align-items: center; gap: 7px; background: #fef2f2; color: #dc2626; font-size: 13px; padding: 10px 14px; border-radius: 9px; border: 1px solid #fecaca; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #475569; letter-spacing: 0.02em; text-transform: uppercase; }
  .field-hint { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .req { color: #ef4444; }
  .input { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px 13px; font-size: 14px; outline: none; color: #0f172a; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; font-family: inherit; }
  .input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px #ede9fe; }
  .input::placeholder { color: #cbd5e1; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
  .product-info-strip { display: flex; gap: 6px; flex-wrap: wrap; padding: 10px 14px; background: #f8fafc; border-radius: 10px; border: 1.5px solid #e2e8f0; }
  .pi-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; padding: 3px 8px; border-radius: 5px; font-family: monospace; font-weight: 600; }
  .pi-badge.bc   { background: #eff6ff; color: #1d4ed8; }
  .pi-badge.ikpu { background: #f5f3ff; color: #6d28d9; }
  .pi-badge.unit { background: #f0fdf4; color: #166534; font-family: inherit; }
  .series-info-box { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 11px; padding: 12px 14px; }
  .sib-row { display: flex; gap: 16px; flex-wrap: wrap; }
  .sib-item { display: flex; align-items: flex-start; gap: 8px; flex: 1; min-width: 160px; }
  .sib-icon { margin-top: 2px; flex-shrink: 0; }
  .sib-blue   { color: #2563eb; }
  .sib-violet { color: #7c3aed; }
  .sib-label { font-size: 12px; font-weight: 700; color: #334155; }
  .sib-desc  { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .toast { position: fixed; bottom: 28px; right: 28px; z-index: 2000; padding: 14px 18px; border-radius: 14px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; box-shadow: 0 12px 40px rgba(0,0,0,0.18); animation: slideUp 0.22s ease; max-width: 360px; }
  .toast-success { background: #0f172a; color: #fff; }
  .toast-error   { background: #dc2626; color: #fff; }
  .toast-icon { display: flex; align-items: center; }
  .toast-close { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.7); padding: 0; margin-left: auto; display: flex; align-items: center; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  .spin { animation: spinAnim 0.7s linear infinite; }
  @keyframes spinAnim { to { transform: rotate(360deg); } }
  @media (max-width: 640px) {
    .page { padding: 20px 14px; }
    .stats-row { grid-template-columns: 1fr 1fr; }
    .form-row { grid-template-columns: 1fr; }
    .toolbar { flex-direction: column; }
    .search-wrap { min-width: unset; width: 100%; }
    .filter-tabs { width: 100%; overflow-x: auto; }
    .header-actions { flex-direction: column; width: 100%; }
  }
`;