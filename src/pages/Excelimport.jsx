import { useState, useRef, useCallback } from "react";
import {
  Upload, FileSpreadsheet, CheckCircle, AlertTriangle,
  X, Download, Eye, Package, Hash, Tag, QrCode,
  FileCode, Layers, Calendar, Banknote, ChevronRight,
  Info, ShieldAlert, Loader2, Trash2, RefreshCw,
} from "lucide-react";

// ─── Template columns ─────────────────────────────────────
const TEMPLATE_COLUMNS = [
  { key: "productName",    label: "Mahsulot nomi",           required: true,  hint: "Masalan: Paracetamol 500mg" },
  { key: "barcode",        label: "Barcode (GTIN)",          required: false, hint: "Qisqartirilmasin — TEXT formatida" },
  { key: "ikpu",           label: "IKPU kodi",               required: false, hint: "17 raqamli milliy kod" },
  { key: "markingCode",    label: "Marking Code",            required: false, hint: "DataMatrix to'liq kodi" },
  { key: "series",         label: "Dori seriyasi",           required: true,  hint: "Tashqi barkod seriyasi" },
  { key: "boxSeries",      label: "QR seriya (Marking)",     required: false, hint: "Markirovka QR seriyasi" },
  { key: "mg",             label: "Dozaj",                   required: true,  hint: "Masalan: 500mg" },
  { key: "quantity",       label: "Miqdor",                  required: true,  hint: "Butun son" },
  { key: "price",          label: "Narx (so'm)",             required: true,  hint: "Raqam, bo'sh joy yo'q" },
  { key: "expiry",         label: "Yaroqlilik muddati",      required: true,  hint: "YYYY-MM-DD formatida" },
  { key: "contractNumber", label: "Shartnoma raqami",        required: false, hint: "Masalan: SH-2026-001" },
  { key: "invoiceNumber",  label: "Faktura raqami",          required: false, hint: "Masalan: F-2026-0001" },
  { key: "manufacturer",   label: "Ishlab chiqaruvchi",      required: false, hint: "Kompaniya nomi" },
  { key: "unit",           label: "O'lchov birligi",         required: false, hint: "dona, qadoq, blister…" },
];

// ─── Sample mock CSV data (as if parsed) ─────────────────
const SAMPLE_ROWS = [
  { productName: "Paracetamol 500mg", barcode: "4780123456789", ikpu: "10006001001000000", markingCode: "010046073245681121Kl7HEVp==", series: "478001167783021", boxSeries: "MK-2026-001", mg: "500mg", quantity: "240", price: "12000", expiry: "2027-03-15", contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0892", manufacturer: "Medexport UZ", unit: "dona" },
  { productName: "Amoxicillin 250mg", barcode: "4780198765432", ikpu: "10006001002000000", markingCode: "010046073245681122AbCdEf==", series: "478019988771",    boxSeries: "",            mg: "250mg", quantity: "80",  price: "24000", expiry: "2026-12-01", contractNumber: "SH-2026-031", invoiceNumber: "F-2026-0411", manufacturer: "Pharmaville",  unit: "qadoq" },
  { productName: "Vitamin C 1000mg",  barcode: "4780111222333", ikpu: "10006001003000000", markingCode: "",                            series: "478011199001",    boxSeries: "MK-2025-450", mg: "1000mg",quantity: "5",   price: "18000", expiry: "2026-06-25", contractNumber: "SH-2025-188", invoiceNumber: "F-2025-2201", manufacturer: "VitaPharm",    unit: "dona"  },
];

function validateRow(row, i) {
  const errs = [];
  if (!row.productName?.trim())                              errs.push("Mahsulot nomi bo'sh");
  if (!row.series?.trim())                                   errs.push("Seriya bo'sh");
  if (!row.mg?.trim())                                       errs.push("Dozaj bo'sh");
  if (!row.quantity || isNaN(Number(row.quantity)))          errs.push("Miqdor noto'g'ri");
  if (!row.price    || isNaN(Number(row.price)))             errs.push("Narx noto'g'ri");
  if (!row.expiry   || !/^\d{4}-\d{2}-\d{2}$/.test(row.expiry)) errs.push("Muddat formati noto'g'ri (YYYY-MM-DD)");
  if (row.barcode   && !/^\d+$/.test(row.barcode.trim()))    errs.push("Barcode faqat raqamdan iborat bo'lishi kerak");
  if (row.ikpu      && row.ikpu.trim().length !== 17)        errs.push("IKPU 17 raqam bo'lishi kerak");
  return errs;
}

function downloadTemplate() {
  const header = TEMPLATE_COLUMNS.map(c => c.label).join(",");
  const sample = TEMPLATE_COLUMNS.map(c => {
    const ex = SAMPLE_ROWS[0];
    return `"${ex[c.key] || ""}"`;
  }).join(",");
  const csv  = [header, sample].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url; a.download = "import-shablon.csv"; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  // Map header labels → keys
  const keyMap = {};
  TEMPLATE_COLUMNS.forEach(col => {
    const idx = headers.findIndex(h => h.toLowerCase() === col.label.toLowerCase() || h.toLowerCase() === col.key.toLowerCase());
    if (idx >= 0) keyMap[col.key] = idx;
  });
  return lines.slice(1).map(line => {
    // Simple CSV parse (handles quoted fields)
    const cols = [];
    let cur = "", inQ = false;
    for (const ch of line + ",") {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { cols.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    const row = {};
    TEMPLATE_COLUMNS.forEach(col => {
      const idx = keyMap[col.key];
      let val = idx !== undefined ? (cols[idx] || "") : "";
      // Preserve leading zeros: strip Excel apostrophe prefix
      val = val.replace(/^'/, "");
      row[col.key] = val;
    });
    return row;
  }).filter(r => Object.values(r).some(v => v));
}

export const Excelimport = () => {
  const [stage,       setStage]       = useState("idle"); // idle | preview | importing | done
  const [rows,        setRows]        = useState([]);
  const [fileName,    setFileName]    = useState("");
  const [importing,   setImporting]   = useState(false);
  const [imported,    setImported]    = useState([]);
  const [progress,    setProgress]    = useState(0);
  const [viewRow,     setViewRow]     = useState(null);
  const [dragOver,    setDragOver]    = useState(false);
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      const withValidation = parsed.map((row, i) => ({
        ...row,
        _id: i + 1,
        _errors: validateRow(row, i),
      }));
      setRows(withValidation);
      setStage("preview");
    };
    reader.readAsText(file, "utf-8");
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = () => {
    const valid = rows.filter(r => r._errors.length === 0);
    if (valid.length === 0) return;
    setImporting(true);
    setProgress(0);
    const step = () => {
      setProgress(p => {
        if (p >= 100) {
          setImported(valid);
          setStage("done");
          setImporting(false);
          return 100;
        }
        return p + Math.ceil(100 / valid.length / 2);
      });
    };
    const interval = setInterval(() => {
      step();
      setProgress(p => { if (p >= 100) clearInterval(interval); return p; });
    }, 60);
  };

  const reset = () => { setStage("idle"); setRows([]); setFileName(""); setProgress(0); setImported([]); };

  const validRows   = rows.filter(r => r._errors.length === 0);
  const invalidRows = rows.filter(r => r._errors.length > 0);

  const formatDate = (d) => { try { return new Date(d).toLocaleDateString("uz-UZ"); } catch { return d; } };

  return (
    <>
      <style>{STYLES}</style>
      <div className="page">
        <div className="page-header">
          <div className="header-text">
            <h1><FileSpreadsheet size={24} className="h1-icon" />Excel / CSV Import</h1>
            <p className="subtitle">Mahsulotlar va partiyalarni fayl orqali ommaviy yuklash</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={downloadTemplate}><Download size={15} />Shablon yuklab olish</button>
            {stage !== "idle" && <button className="btn-secondary" onClick={reset}><RefreshCw size={15} />Yangi import</button>}
          </div>
        </div>

        {/* Rules banner */}
        <div className="rules-banner">
          <Info size={15} className="rb-icon" />
          <div className="rb-content">
            <div className="rb-title">Import qilishdan oldin e'tibor bering</div>
            <div className="rb-list">
              <span>Barcode va IKPU ustunlari Excel'da <strong>TEXT</strong> formatida bo'lsin — oldingi nollar saqlansin</span>
              <span>Yaroqlilik muddati <strong>YYYY-MM-DD</strong> formatida kiriting (2026-12-31)</span>
              <span>Uzun raqamli kodlar (GTIN, Marking) <strong>eksponent ko'rinishga</strong> o'tib ketmasligi uchun <code>'</code> apostrofini qo'shing</span>
              <span>Marking Code maydonini to'liq kiriting — qisqartirish mumkin emas</span>
            </div>
          </div>
        </div>

        {/* Stage: idle → drop zone */}
        {stage === "idle" && (
          <div
            className={`drop-zone ${dragOver ? "dz-over" : ""}`}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => handleFile(e.target.files?.[0])} />
            <div className="dz-icon"><Upload size={36} strokeWidth={1.5} /></div>
            <div className="dz-title">CSV faylni shu yerga tashlang</div>
            <div className="dz-sub">yoki bosing va faylni tanlang</div>
            <div className="dz-formats">.csv · .txt · UTF-8</div>
          </div>
        )}

        {/* Stage: preview */}
        {stage === "preview" && (
          <div className="preview-wrap">
            <div className="pv-header">
              <div className="pv-file">
                <FileSpreadsheet size={18} className="pv-file-icon" />
                <span className="pv-file-name">{fileName}</span>
                <span className="pv-file-count">{rows.length} qator</span>
              </div>
              <div className="pv-stats">
                <span className="pv-stat green"><CheckCircle size={12} />{validRows.length} tayyor</span>
                {invalidRows.length > 0 && <span className="pv-stat red"><AlertTriangle size={12} />{invalidRows.length} xato</span>}
              </div>
            </div>

            {invalidRows.length > 0 && (
              <div className="error-list">
                <div className="el-title"><AlertTriangle size={13} />Quyidagi qatorlarda xato bor — import qilinmaydi:</div>
                {invalidRows.map(r => (
                  <div key={r._id} className="el-row">
                    <span className="el-num">#{r._id}</span>
                    <span className="el-prod">{r.productName || "—"}</span>
                    <span className="el-errs">{r._errors.join(" · ")}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="table-card">
              <div className="table-scroll">
                <table className="main-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Mahsulot nomi</th>
                      <th>Barcode (GTIN)</th>
                      <th>IKPU</th>
                      <th>Marking Code</th>
                      <th>Seriya</th>
                      <th>Dozaj</th>
                      <th className="center">Miqdor</th>
                      <th>Narx</th>
                      <th>Muddat</th>
                      <th>Shartnoma</th>
                      <th>Holat</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r._id} className={r._errors.length > 0 ? "tr-error" : "tr-ok"}>
                        <td className="row-num">{r._id}</td>
                        <td className="prod-name-cell">{r.productName || <span className="na">—</span>}</td>
                        <td><span className="code-val">{r.barcode || <span className="na">—</span>}</span></td>
                        <td><span className="code-val ikpu-val">{r.ikpu || <span className="na">—</span>}</span></td>
                        <td>
                          {r.markingCode
                            ? <span className="mc-short" title={r.markingCode}>{r.markingCode.slice(0, 20)}…</span>
                            : <span className="na">—</span>}
                        </td>
                        <td><span className="badge-series"><Tag size={9} />{r.series || "—"}</span></td>
                        <td className="mono">{r.mg}</td>
                        <td className="center"><span className="qty-pill">{r.quantity}</span></td>
                        <td className="mono">{r.price ? Number(r.price).toLocaleString("uz-UZ") + " so'm" : "—"}</td>
                        <td className="date-col">{r.expiry ? formatDate(r.expiry) : <span className="na">—</span>}</td>
                        <td className="mono">{r.contractNumber || <span className="na">—</span>}</td>
                        <td>
                          {r._errors.length === 0
                            ? <span className="badge-ok"><CheckCircle size={10} />OK</span>
                            : <span className="badge-err"><AlertTriangle size={10} />{r._errors.length} xato</span>}
                        </td>
                        <td>
                          <button className="icon-btn view" onClick={() => setViewRow(r)} title="Ko'rish"><Eye size={13} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="import-actions">
              <button className="btn-secondary" onClick={reset}>Bekor qilish</button>
              <button className="btn-primary" onClick={handleImport} disabled={validRows.length === 0 || importing}>
                {importing ? <><Loader2 size={15} className="spin" />Import qilinmoqda…</> : <><Upload size={15} />{validRows.length} ta qatorni import qilish</>}
              </button>
            </div>

            {importing && (
              <div className="progress-bar-wrap">
                <div className="pb-label">Import qilinmoqda… {Math.min(progress, 100)}%</div>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
              </div>
            )}
          </div>
        )}

        {/* Stage: done */}
        {stage === "done" && (
          <div className="done-wrap">
            <div className="done-icon"><CheckCircle size={48} strokeWidth={1.5} /></div>
            <h2 className="done-title">{imported.length} ta mahsulot muvaffaqiyatli import qilindi!</h2>
            <p className="done-sub">Barcha partiyalar tizimga qo'shildi va hujjatlar bilan bog'landi.</p>

            <div className="done-stats">
              <div className="ds-item"><span className="ds-val">{imported.length}</span><span className="ds-label">Import qilindi</span></div>
              <div className="ds-item"><span className="ds-val">{invalidRows.length}</span><span className="ds-label">O'tkazib yuborildi</span></div>
              <div className="ds-item"><span className="ds-val">{imported.filter(r => r.markingCode).length}</span><span className="ds-label">Marking kodi bor</span></div>
              <div className="ds-item"><span className="ds-val">{imported.filter(r => r.contractNumber).length}</span><span className="ds-label">Shartnoma bog'landi</span></div>
            </div>

            <div className="done-table-card">
              <table className="done-table">
                <thead>
                  <tr>
                    <th>Mahsulot</th>
                    <th>Barcode</th>
                    <th>IKPU</th>
                    <th>Seriya</th>
                    <th>Miqdor</th>
                    <th>Shartnoma</th>
                  </tr>
                </thead>
                <tbody>
                  {imported.map((r, i) => (
                    <tr key={i}>
                      <td className="prod-name-cell">{r.productName}</td>
                      <td><span className="code-val">{r.barcode || "—"}</span></td>
                      <td><span className="code-val ikpu-val">{r.ikpu || "—"}</span></td>
                      <td><span className="badge-series"><Tag size={9} />{r.series}</span></td>
                      <td className="center"><span className="qty-pill">{r.quantity}</span></td>
                      <td className="mono">{r.contractNumber || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="done-actions">
              <button className="btn-secondary" onClick={reset}><RefreshCw size={15} />Yangi import</button>
            </div>
          </div>
        )}

        {/* Column guide */}
        {stage === "idle" && (
          <div className="col-guide">
            <div className="cg-title">Ustunlar ro'yxati (shablon formati)</div>
            <div className="cg-grid">
              {TEMPLATE_COLUMNS.map(c => (
                <div key={c.key} className={`cg-item ${c.required ? "cg-req" : ""}`}>
                  <div className="cg-name">{c.label} {c.required && <span className="req">*</span>}</div>
                  <div className="cg-hint">{c.hint}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {viewRow && (
        <div className="modal-overlay" onClick={() => setViewRow(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Qator #{viewRow._id} tafsilotlari</h2>
              <button className="modal-close" onClick={() => setViewRow(null)}><X size={18} /></button>
            </div>
            <div className="form-body">
              {viewRow._errors.length > 0 && (
                <div className="row-errors">
                  {viewRow._errors.map((e, i) => (
                    <div key={i} className="re-item"><AlertTriangle size={12} />{e}</div>
                  ))}
                </div>
              )}
              <div className="detail-grid">
                {TEMPLATE_COLUMNS.map(c => (
                  <div key={c.key} className="dg-item">
                    <div className="dg-label">{c.label}</div>
                    <div className="dg-val mono">{viewRow[c.key] || <span className="na">—</span>}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .page { padding: 32px 28px; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background: #f6f8fc; min-height: 100vh; }
  .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
  .header-text h1 { font-size: 24px; font-weight: 800; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }
  .h1-icon { color: #16a34a; }
  .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .header-actions { display: flex; gap: 10px; }
  .btn-primary { display: inline-flex; align-items: center; gap: 7px; background: #16a34a; color: #fff; border: none; border-radius: 10px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.15s; }
  .btn-primary:hover:not(:disabled) { background: #15803d; }
  .btn-primary:disabled { background: #86efac; cursor: not-allowed; }
  .btn-secondary { display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; white-space: nowrap; }
  .btn-secondary:hover { background: #f8fafc; }
  .rules-banner { display: flex; gap: 12px; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 12px; padding: 14px 16px; margin-bottom: 20px; }
  .rb-icon { color: #2563eb; flex-shrink: 0; margin-top: 2px; }
  .rb-title { font-size: 13px; font-weight: 700; color: #1d4ed8; margin-bottom: 6px; }
  .rb-list { display: flex; flex-direction: column; gap: 4px; }
  .rb-list span { font-size: 12px; color: #1e40af; }
  .rb-list code { background: #dbeafe; padding: 1px 4px; border-radius: 3px; font-family: monospace; }
  .drop-zone { border: 2px dashed #86efac; border-radius: 16px; background: #f0fdf4; padding: 56px 32px; text-align: center; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 24px; }
  .drop-zone:hover, .dz-over { border-color: #16a34a; background: #dcfce7; }
  .dz-icon { color: #16a34a; }
  .dz-title { font-size: 18px; font-weight: 700; color: #166534; }
  .dz-sub   { font-size: 14px; color: #4ade80; }
  .dz-formats { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #86efac; text-transform: uppercase; margin-top: 4px; }
  .preview-wrap { display: flex; flex-direction: column; gap: 14px; }
  .pv-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .pv-file { display: flex; align-items: center; gap: 8px; }
  .pv-file-icon { color: #16a34a; }
  .pv-file-name { font-size: 14px; font-weight: 700; color: #0f172a; }
  .pv-file-count { font-size: 12px; color: #94a3b8; background: #f1f5f9; padding: 2px 8px; border-radius: 10px; }
  .pv-stats { display: flex; gap: 8px; margin-left: auto; }
  .pv-stat { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
  .pv-stat.green { background: #dcfce7; color: #16a34a; }
  .pv-stat.red   { background: #fee2e2; color: #dc2626; }
  .error-list { background: #fff5f5; border: 1.5px solid #fecaca; border-radius: 12px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
  .el-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: #dc2626; margin-bottom: 4px; }
  .el-row { display: flex; align-items: baseline; gap: 10px; font-size: 12px; }
  .el-num { font-weight: 800; color: #dc2626; min-width: 28px; font-family: monospace; }
  .el-prod { font-weight: 600; color: #0f172a; min-width: 140px; }
  .el-errs { color: #b91c1c; }
  .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
  .table-scroll { overflow-x: auto; }
  .main-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
  .main-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
  .main-table th { padding: 10px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; text-align: left; white-space: nowrap; }
  .main-table th.center { text-align: center; }
  .main-table td.center { text-align: center; }
  .main-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
  .main-table tbody tr:last-child { border-bottom: none; }
  .tr-ok    { border-left: 3px solid #86efac; }
  .tr-error { border-left: 3px solid #fca5a5; background: #fff5f5 !important; }
  .main-table td { padding: 10px 14px; font-size: 12px; color: #334155; vertical-align: middle; }
  .row-num { font-weight: 800; color: #94a3b8; font-family: monospace; }
  .prod-name-cell { font-weight: 700; color: #0f172a; white-space: nowrap; }
  .code-val { font-family: monospace; font-size: 11px; color: #1d4ed8; background: #eff6ff; padding: 2px 6px; border-radius: 4px; white-space: nowrap; }
  .ikpu-val { background: #f5f3ff; color: #6d28d9; }
  .mc-short { font-family: monospace; font-size: 10px; color: #475569; cursor: help; }
  .badge-series { display: inline-flex; align-items: center; gap: 3px; background: #ede9fe; color: #6d28d9; font-family: monospace; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700; white-space: nowrap; }
  .qty-pill { display: inline-block; background: #f1f5f9; color: #334155; font-weight: 700; font-size: 12px; padding: 2px 9px; border-radius: 20px; }
  .date-col { font-size: 11px; color: #64748b; white-space: nowrap; }
  .mono { font-family: monospace; }
  .na { color: #cbd5e1; }
  .badge-ok  { display: inline-flex; align-items: center; gap: 3px; background: #dcfce7; color: #16a34a; font-size: 10px; padding: 3px 8px; border-radius: 20px; font-weight: 700; }
  .badge-err { display: inline-flex; align-items: center; gap: 3px; background: #fee2e2; color: #dc2626; font-size: 10px; padding: 3px 8px; border-radius: 20px; font-weight: 700; }
  .icon-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 7px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; color: #64748b; }
  .icon-btn.view:hover { background: #eff6ff; border-color: #2563eb; color: #2563eb; }
  .import-actions { display: flex; gap: 10px; justify-content: flex-end; }
  .progress-bar-wrap { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; }
  .pb-label { font-size: 13px; font-weight: 600; color: #16a34a; margin-bottom: 8px; }
  .progress-track { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #16a34a, #4ade80); border-radius: 4px; transition: width 0.1s; }
  /* done */
  .done-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px 0; }
  .done-icon { color: #16a34a; }
  .done-title { font-size: 20px; font-weight: 800; color: #0f172a; text-align: center; }
  .done-sub   { font-size: 14px; color: #64748b; text-align: center; max-width: 480px; }
  .done-stats { display: flex; gap: 24px; flex-wrap: wrap; justify-content: center; }
  .ds-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
  .ds-val   { font-size: 28px; font-weight: 800; color: #16a34a; }
  .ds-label { font-size: 12px; color: #94a3b8; }
  .done-table-card { width: 100%; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; max-width: 900px; }
  .done-table { width: 100%; border-collapse: collapse; }
  .done-table thead tr { background: #f0fdf4; }
  .done-table th { padding: 10px 14px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #166534; letter-spacing: 0.07em; text-align: left; }
  .done-table td { padding: 10px 14px; font-size: 12px; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .done-table tbody tr:last-child td { border-bottom: none; }
  .done-actions { display: flex; gap: 10px; justify-content: center; }
  /* col guide */
  .col-guide { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 20px 22px; }
  .cg-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 14px; }
  .cg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
  .cg-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px; padding: 10px 12px; }
  .cg-req  { border-left: 3px solid #16a34a; }
  .cg-name { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 3px; }
  .cg-hint { font-size: 11px; color: #94a3b8; }
  .req { color: #ef4444; }
  /* modal */
  .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 16px; }
  .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 680px; box-shadow: 0 32px 80px rgba(0,0,0,0.2); animation: popIn 0.18s ease; max-height: 90vh; overflow-y: auto; }
  @keyframes popIn { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 22px 24px 0; position: sticky; top: 0; background: #fff; z-index: 1; }
  .modal-header h2 { font-size: 17px; font-weight: 800; color: #0f172a; }
  .modal-close { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; }
  .form-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
  .row-errors { display: flex; flex-direction: column; gap: 6px; background: #fef2f2; border: 1.5px solid #fecaca; border-radius: 10px; padding: 12px 14px; }
  .re-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #dc2626; }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .dg-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 9px; padding: 10px 12px; }
  .dg-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .dg-val { font-size: 13px; font-weight: 600; color: #0f172a; word-break: break-all; }
  .spin { animation: spinAnim 0.7s linear infinite; }
  @keyframes spinAnim { to { transform: rotate(360deg); } }
  @media (max-width: 640px) {
    .page { padding: 20px 14px; }
    .cg-grid { grid-template-columns: 1fr 1fr; }
    .detail-grid { grid-template-columns: 1fr; }
    .header-actions { flex-direction: column; }
  }
`;