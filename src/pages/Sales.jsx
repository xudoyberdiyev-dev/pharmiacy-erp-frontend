import { useState, useEffect, useCallback, useRef } from "react";
import {
  User, Package, Layers, Tag, FlaskConical, Banknote,
  Calendar, Search, X, ChevronRight, CheckCircle,
  ShieldAlert, Loader2, Plus, Minus, Scan, ClipboardList,
  Trash2, Download, ReceiptText, TrendingUp, ShoppingCart,
  History, ArrowLeft, RefreshCw, BarChart3, Phone, QrCode,
  AlertTriangle,
} from "lucide-react";
import { customersApi } from "../api/customerApi";
import { productsApi }  from "../api/productApi";
import { salesApi }     from "../api/salesApi";
import * as XLSX from "xlsx";

// ─── Utils ────────────────────────────────────────────────
const fmt   = (p) => Number(p).toLocaleString("uz-UZ") + " so'm";
const fmtD  = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";
const fmtDT = (d) => d ? new Date(d).toLocaleString("uz-UZ") : "—";

// ─── GS1 parser ───────────────────────────────────────────
function parseGS1(code) {
  if (!code) return { type: "unknown", original: code };
  const c = code.trim();

  if (c.startsWith("01") && c.length >= 18) {
    const rawGtin = c.substring(2, 16);
    const gtin    = rawGtin.replace(/^0+/, "") || rawGtin;
    const rest    = c.substring(16);
    let serial    = null;
    if (rest.startsWith("21")) serial = rest.substring(2);
    return { type: "qr", gtin, rawGtin, serial, original: c };
  }

  return { type: "barcode", barcode: c, original: c };
}

function norm(s) {
  return String(s || "").replace(/^0+/, "").toLowerCase().trim();
}

function checkMatch(parsed, batch, unitsPerBox) {
  const bSeriesNorm    = norm(batch.series);
  const bBoxSeriesNorm = batch.boxSeries ? norm(batch.boxSeries) : null;

  if (parsed.type === "qr") {
    const gtinNorm = norm(parsed.gtin);
    const match    = gtinNorm === bSeriesNorm ||
                     (bBoxSeriesNorm && gtinNorm === bBoxSeriesNorm);
    return { match, scanType: "qr", addQty: 1, extracted: parsed.gtin, original: parsed.original };
  }

  if (parsed.type === "barcode") {
    const bcNorm = norm(parsed.barcode);
    const match  = bcNorm === bSeriesNorm ||
                   (bBoxSeriesNorm && bcNorm === bBoxSeriesNorm);
    return { match, scanType: "barcode", addQty: unitsPerBox, extracted: parsed.barcode, original: parsed.original };
  }

  return { match: false, scanType: "unknown", addQty: null, extracted: parsed.original, original: parsed.original };
}

// ─── Beep ─────────────────────────────────────────────────
function beep(freq = 880, dur = 0.15) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch {}
}
const beepOk  = () => beep(880, 0.12);
const beepErr = () => {
  beep(180, 0.25);

  setTimeout(() => {
    beep(180, 0.25);
  }, 250);

  setTimeout(() => {
    beep(180, 0.25);
  }, 500);
};
// ─── Toast ────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-icon">
        {type === "success" ? <CheckCircle size={16} strokeWidth={2.5} />
          : type === "warn" ? <AlertTriangle size={16} strokeWidth={2.5} />
          : <ShieldAlert size={16} strokeWidth={2.5} />}
      </span>
      <span className="toast-msg">{msg}</span>
      <button className="toast-x" onClick={onClose}><X size={13} /></button>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-head modal-head-warn">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={18} style={{ color: "#d97706" }} />
            <h2 className="modal-title" style={{ color: "#92400e" }}>{title}</h2>
          </div>
        </div>
        <div className="modal-body">
          <p className="confirm-msg">{message}</p>
          <div className="confirm-actions">
            <button className="sf-btn-back" onClick={onCancel}>Bekor</button>
            <button className="sf-btn-warn" onClick={onConfirm}>
              <CheckCircle size={15} strokeWidth={2.5} /> Baribir qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────
function Modal({ title, onClose, children, size = "md" }) {
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="overlay" onClick={onClose}>
      <div className={`modal modal-${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-x" onClick={onClose} aria-label="Yopish"><X size={17} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─── Searchable Dropdown ──────────────────────────────────
function Dropdown({ value, placeholder, loadFn, renderItem, renderSelected, onSelect, resetKey }) {
  const [open, setOpen] = useState(false);
  const [q,    setQ]    = useState("");
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => { setQ(""); setList([]); setOpen(false); }, [resetKey]);

  const load = useCallback(async (query) => {
    setBusy(true);
    try { const d = await loadFn(query || undefined); setList(Array.isArray(d) ? d : []); }
    catch { setList([]); }
    finally { setBusy(false); }
  }, [loadFn]);

  useEffect(() => { if (open) load(q); }, [open, q, load]);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div className="dd-wrap" ref={ref}>
      <div className={`dd-trigger${open ? " dd-open" : ""}${value ? " dd-has-val" : ""}`}
        onClick={() => setOpen(v => !v)}>
        {value ? renderSelected(value) : <span className="dd-ph">{placeholder}</span>}
        <ChevronRight size={14} className={`dd-arr${open ? " dd-arr-open" : ""}`} strokeWidth={2.5} />
      </div>
      {open && (
        <div className="dd-drop">
          <div className="dd-search-wrap">
            <Search size={14} className="dd-search-icon" strokeWidth={2} />
            <input className="dd-search" placeholder="Qidirish…" value={q}
              onChange={e => setQ(e.target.value)} autoFocus />
            {q && <button className="dd-clear" onClick={() => setQ("")}><X size={12} /></button>}
          </div>
          <div className="dd-list">
            {busy
              ? <div className="dd-state"><Loader2 size={18} className="spin" /> Yuklanmoqda…</div>
              : list.length === 0
                ? <div className="dd-state"><Search size={18} strokeWidth={1.5} /> Topilmadi</div>
                : list.map((item, i) => (
                  <div key={item.id ?? i}
                    className={`dd-item${value?.id === item.id ? " dd-active" : ""}`}
                    onClick={() => { onSelect(item); setOpen(false); setQ(""); }}>
                    {renderItem(item)}
                  </div>
                ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────
function Pagination({ total, page, perPage, onChange }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  const nums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <div className="pag">
      <button className="pag-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ChevronRight size={13} style={{ transform: "rotate(180deg)" }} />
      </button>
      {nums.map((n, i) =>
        n === "…"
          ? <span key={i} className="pag-dots">…</span>
          : <button key={n} className={`pag-btn${n === page ? " pag-active" : ""}`}
              onClick={() => onChange(n)}>{n}</button>
      )}
      <button className="pag-btn" disabled={page === pages} onClick={() => onChange(page + 1)}>
        <ChevronRight size={13} />
      </button>
    </div>
  );
}

// ─── Excel export: Sotuvlar tarixi ───────────────────────
function exportSalesExcel(sales, filename) {
  const rows = [];
  sales.forEach(sale => {
    sale.items.forEach(item => {
      // Har bir scan log qatori alohida chiqadi
      if (item.scanLog && Array.isArray(item.scanLog) && item.scanLog.length > 0) {
        item.scanLog.forEach(log => {
          rows.push({
            "Sotuv #":       sale.id,
            "Mijoz":         sale.customer.name,
            "Telefon":       sale.customer.phone,
            "Sana":          fmtDT(sale.createdAt),
            "Mahsulot":      item.product.name,
            "Partiya seriya": item.batch.series,
            "MG":            item.batch.mg,
            "Scan turi":     log.type === "barcode" ? "Quti (box)" : log.type === "qr" ? "Markirovka (QR)" : "Qo'lda",
            "Scan kodi":     log.series || log.original || "",
            "Miqdor":        log.count,
            "Ogohlantirish": log.warning ? "Ha ⚠️" : "Yo'q",
            "Vaqt":          log.time ? new Date(log.time).toLocaleTimeString("uz-UZ") : "",
            "Birlik narx":   item.price,
            "Jami (item)":   item.total,
            "Sotuv jami":    sale.totalPrice,
          });
        });
      } else {
        // scanLog yo'q bo'lsa (eski yozuvlar) — bitta qator
        rows.push({
          "Sotuv #":       sale.id,
          "Mijoz":         sale.customer.name,
          "Telefon":       sale.customer.phone,
          "Sana":          fmtDT(sale.createdAt),
          "Mahsulot":      item.product.name,
          "Partiya seriya": item.batch.series,
          "MG":            item.batch.mg,
          "Scan turi":     "—",
          "Scan kodi":     "—",
          "Miqdor":        item.quantity,
          "Ogohlantirish": "—",
          "Vaqt":          "—",
          "Birlik narx":   item.price,
          "Jami (item)":   item.total,
          "Sotuv jami":    sale.totalPrice,
        });
      }
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [8,20,14,18,24,16,8,16,36,8,14,12,12,14,14].map(wch => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sotuvlar");
  XLSX.writeFile(wb, filename);
}

// ─── Excel export: Scan log (sale saqlanmasdan oldin) ────
function exportScanLogExcel(scanLog, meta, filename) {
  const rows = scanLog.map((l, idx) => ({
    "№":          idx + 1,
    "Scan turi":  l.type === "barcode" ? "Quti (box)" : l.type === "qr" ? "Markirovka (QR)" : "Qo'lda",
    "Kod":
    l.type === "qr"
    ? l.original
    : l.series || l.original || "",
    "Miqdor":     l.count,
    "Ogohlantirish": l.warning ? "Ha ⚠️" : "Yo'q",
    "Vaqt":       new Date(l.time).toLocaleTimeString("uz-UZ"),
  }));

  // Xulosa qator
  rows.push({});
  rows.push({
    "№":         "JAMI",
    "Scan turi": `${scanLog.filter(l => l.type === "barcode").length} quti + ${scanLog.filter(l => l.type === "qr").length} Dona`,
    "Kod":       "",
    "Miqdor":    scanLog.reduce((s, l) => s + l.count, 0),
    "Ogohlantirish": `${scanLog.filter(l => l.warning).length} ta ogohlantirish`,
    "Vaqt":      "",
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [5, 18, 36, 10, 18, 12].map(wch => ({ wch }));

  // Meta sheet
  const metaRows = [
    { "Maydon": "Mijoz",    "Qiymat": meta.customer },
    { "Maydon": "Mahsulot", "Qiymat": meta.product },
    { "Maydon": "Partiya",  "Qiymat": meta.series },
    { "Maydon": "Jami dona","Qiymat": meta.qty },
    { "Maydon": "Narx",     "Qiymat": meta.price + " so'm" },
    { "Maydon": "Jami summa","Qiymat": (meta.qty * meta.price) + " so'm" },
  ];
  const ws2 = XLSX.utils.json_to_sheet(metaRows);
  ws2["!cols"] = [16, 30].map(wch => ({ wch }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Scan log");
  XLSX.utils.book_append_sheet(wb, ws2, "Sotuv ma'lumoti");
  XLSX.writeFile(wb, filename);
}

// ─── Batch List ───────────────────────────────────────────
function BatchList({ productId, selected, onSelect }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    productsApi.getBatches(productId)
      .then(d => setBatches(Array.isArray(d) ? d.filter(b => b.quantity > 0) : []))
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return (
    <div className="state-sm"><Loader2 size={22} className="spin text-blue" /><span>Yuklanmoqda…</span></div>
  );
  if (!batches.length) return (
    <div className="state-sm warn"><Package size={24} strokeWidth={1.5} /><span>Bu dori uchun mavjud partiya yo'q</span></div>
  );

  return (
    <div className="batch-list">
      {batches.map(b => (
        <div key={b.id}
          className={`batch-item${selected?.id === b.id ? " batch-sel" : ""}`}
          onClick={() => onSelect(b)}>
          <div className="bi-top">
            <span className="bi-series"><Tag size={11} strokeWidth={2.5} />{b.series}</span>
            <span className="bi-qty-badge"><CheckCircle size={11} />{b.quantity} ta</span>
          </div>
          {b.boxSeries && (
            <div className="bi-qr-row">
              <QrCode size={10} strokeWidth={2.5} />
              <span>QR: <strong>{b.boxSeries}</strong></span>
            </div>
          )}
          <div className="bi-mid">
            <span className="chip chip-gray"><FlaskConical size={9} /> {b.mg}</span>
            <span className="bi-exp"><Calendar size={10} /> {fmtD(b.expiry)}</span>
          </div>
          <div className="bi-price"><Banknote size={12} strokeWidth={2} />{fmt(b.price)} / dona</div>
          {selected?.id === b.id && (
            <div className="bi-check"><CheckCircle size={16} strokeWidth={2.5} /></div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── SALE FORM ────────────────────────────────────────────
function SaleForm({ showToast, onDone }) {
  const [step,         setStep]         = useState(1);
  const [customer,     setCustomer]     = useState(null);
  const [product,      setProduct]      = useState(null);
  const [batch,        setBatch]        = useState(null);
  const [unitsPerBox,  setUnitsPerBox]  = useState(30);
  const [unitPrice,    setUnitPrice]    = useState(0);
  const [qty,          setQty]          = useState(0);
  const [scanLog,      setScanLog]      = useState([]);
  const [scanInput,    setScanInput]    = useState("");
  const [saving,       setSaving]       = useState(false);
  const [resetKey,     setResetKey]     = useState(0);
  const [confirmModal, setConfirmModal] = useState(null);
  const scanRef = useRef(null);

  const totalPrice = qty * unitPrice;

  useEffect(() => {
    if (step === 5 && scanRef.current) scanRef.current.focus();
  }, [step]);

  const reset = () => {
    setStep(1); setCustomer(null); setProduct(null); setBatch(null);
    setUnitsPerBox(30); setUnitPrice(0); setQty(0);
    setScanLog([]); setScanInput(""); setResetKey(k => k + 1);
  };


  // ── Scan handler ──────────────────────────────────────
  const handleChange = (e) => {
  const value = e.target.value;
  if (/[\u0400-\u04FF]/.test(value)) {
    beepErr();
    showToast("⚠️ Rus klaviaturasi o'chirilsin! Faqat EN ishlaydi", "warn");
    setScanInput(""); // ← bu yetishib turar edi, lekin input tozalanmayapti
    return;
  }
  setScanInput(value);
};

const handleScan = () => {
  const val = scanInput.trim();
  if (!val || !batch) return;

  // ← BU YER: kirill bo'lsa mutlaqo qo'shmaymiz, tozalaymiz
  if (/[\u0400-\u04FF]/.test(val)) {
    beepErr();
    showToast("⚠️ Rus klaviaturasi o'chirilsin! Faqat EN ishlaydi", "warn");
    setScanInput("");
    scanRef.current?.focus();
    return; // ← return, davom etmaymiz
  }

  setScanInput("");
  scanRef.current?.focus();

  const alreadyScanned = scanLog.some(l => l.original === val);
  if (alreadyScanned) {
    beepErr();
    showToast("⚠️ Bu kod allaqon skanerlangan!", "warn");
    return;
  }

  const parsed = parseGS1(val);
  const result = checkMatch(parsed, batch, Number(unitsPerBox) || 1);

  if (result.match) {
    const add = result.addQty;
    setQty(q => q + add);
    setScanLog(l => [
      ...l,
      {
        type:     result.scanType,
        series:   result.extracted,
        original: val,
        count:    add,
        time:     new Date(),
        warning:  false,
      },
    ]);
    beepOk();
  } else {
    beepErr();

    // ← Kirill bo'lsa modal ham ochilmasin
    if (/[\u0400-\u04FF]/.test(val)) {
      showToast("⚠️ Rus klaviaturasi o'chirilsin! Faqat EN ishlaydi", "warn");
      return;
    }

    const expectedMsg = batch.boxSeries
      ? `"${batch.series}" (barkod) yoki "${batch.boxSeries}" (QR)`
      : `"${batch.series}"`;

    setConfirmModal({
      extracted: result.extracted,
      original:  val,
      scanType:  result.scanType,
      addQty:    result.addQty || 1,
      message:
        `Scan qilingan: "${result.extracted}"\n` +
        `Kutilgan: ${expectedMsg}\n\n` +
        `Bu boshqa partiyaga tegishli bo'lishi mumkin.\n` +
        `Baribir qo'shilsinmi?`,
    });
  }
};

const confirmAdd = () => {
  if (!confirmModal) return;

  // Kirill tekshiruvi — modal orqali ham kirill o'tmasin
  if (/[\u0400-\u04FF]/.test(confirmModal.original)) {
    beepErr();
    showToast("⚠️ Rus klaviaturasi o'chirilsin! Faqat EN ishlaydi", "warn");
    setConfirmModal(null);
    scanRef.current?.focus();
    return;
  }

  const add = confirmModal.addQty;
  setQty(q => q + add);
  setScanLog(l => [
    ...l,
    {
      type:     confirmModal.scanType,
      series:   confirmModal.extracted,
      original: confirmModal.original,
      count:    add,
      time:     new Date(),
      warning:  true,
    },
  ]);
  beepOk();
  setConfirmModal(null);
  scanRef.current?.focus();
};

  const addOne = () => {
    setQty(q => q + 1);
    setScanLog(l => [
      ...l,
      {
        type:     "manual",
        series:   batch?.series || "",
        original: "__manual__" + Date.now(),
        count:    1,
        time:     new Date(),
        warning:  false,
      },
    ]);
    beepOk();
  };
  const subOne = () => {
    if (qty > 0) {
      setQty(q => q - 1);
      // Oxirgi log qatorini olib tashlash
      setScanLog(l => {
        if (l.length === 0) return l;
        const last = l[l.length - 1];
        if (last.count > 1) {
          return [...l.slice(0, -1), { ...last, count: last.count - 1 }];
        }
        return l.slice(0, -1);
      });
    }
  };

  const handleSave = async () => {
    if (!customer || !product || !batch || qty < 1) return;
    setSaving(true);
    try {
      await salesApi.create({
        customerId: customer.id,
        items: [{
          productId: product.id,
          batchId:   batch.id,
          quantity:  qty,
          price:     unitPrice,
          scanLog:   scanLog.map(l => ({
            type:     l.type,
            series:   l.series,
            original: l.original,
            count:    l.count,
            warning:  l.warning,
            time:     l.time instanceof Date ? l.time.toISOString() : l.time,
          })),
        }],
      });
      showToast("Sotuv muvaffaqiyatli saqlandi!", "success");
      reset();
      onDone();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 1) return !!customer;
    if (step === 2) return !!product;
    if (step === 3) return !!batch;
    if (step === 4) return unitPrice > 0;
    return false;
  };

  const STEPS = [
    { n: 1, label: "Mijoz",   icon: User },
    { n: 2, label: "Dori",    icon: Package },
    { n: 3, label: "Partiya", icon: Layers },
    { n: 4, label: "Narx",    icon: Banknote },
    { n: 5, label: "Skaner",  icon: Scan },
  ];

  const boxScans  = scanLog.filter(l => l.type === "barcode").length;
  const qrScans   = scanLog.filter(l => l.type === "qr").length;
  const warnCount = scanLog.filter(l => l.warning).length;

  return (
    <>
      <div className="sf-card">
        {/* Header */}
        <div className="sf-header">
          <div className="sf-header-left">
            <ShoppingCart size={18} strokeWidth={2.2} className="sf-header-icon" />
            <span>Yangi sotuv</span>
          </div>
          <button className="sf-reset-btn" onClick={reset}>
            <RefreshCw size={14} strokeWidth={2} /> Tozalash
          </button>
        </div>

        {/* Steps */}
        <div className="sf-steps">
          {STEPS.map((s, i) => {
            const Icon   = s.icon;
            const done   = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="sf-step-wrapper">
                <div
                  className={`sf-step${active ? " sf-step-active" : done ? " sf-step-done" : ""}`}
                  onClick={() => done && setStep(s.n)}
                  style={{ cursor: done ? "pointer" : "default" }}
                >
                  {done ? <CheckCircle size={14} strokeWidth={2.5} /> : <Icon size={13} strokeWidth={2.5} />}
                  <span className="sf-step-label">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`sf-step-line${done ? " sf-line-done" : ""}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="sf-body">

          {/* ── STEP 1: Mijoz ── */}
          {step === 1 && (
            <div className="sf-panel">
              <div className="sf-panel-head"><User size={16} strokeWidth={2.2} /> Mijozni tanlang</div>
              <Dropdown
                resetKey={resetKey} value={customer}
                placeholder="Ism yoki telefon raqam…"
                loadFn={q => customersApi.getAll(q)}
                renderSelected={c => (
                  <div className="dd-val">
                    <div className="dd-val-avatar">{c.name.charAt(0)}</div>
                    <div>
                      <div className="dd-val-name">{c.name}</div>
                      <div className="dd-val-sub">{c.phone}</div>
                    </div>
                  </div>
                )}
                renderItem={c => (
                  <div className="dd-row">
                    <div className="dd-avatar">{c.name.charAt(0)}</div>
                    <div>
                      <div className="dd-row-main">{c.name}</div>
                      <div className="dd-row-sub"><Phone size={10} /> {c.phone}</div>
                    </div>
                  </div>
                )}
                onSelect={c => { setCustomer(c); setStep(2); }}
              />
              {customer && (
                <div className="sf-chosen">
                  <div className="sf-chosen-avatar">{customer.name.charAt(0)}</div>
                  <div className="sf-chosen-info">
                    <div className="sf-chosen-name">{customer.name}</div>
                    <div className="sf-chosen-sub">{customer.phone}</div>
                  </div>
                  <button className="sf-chosen-change" onClick={() => setCustomer(null)}><X size={13} /></button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Dori ── */}
          {step === 2 && (
            <div className="sf-panel">
              <div className="sf-panel-head"><Package size={16} strokeWidth={2.2} /> Dorini tanlang</div>
              <Dropdown
                resetKey={resetKey} value={product}
                placeholder="Dori nomini kiriting…"
                loadFn={q => productsApi.getAll(q)}
                renderSelected={p => (
                  <div className="dd-val">
                    <div className="dd-val-icon"><Package size={14} /></div>
                    <div>
                      <div className="dd-val-name">{p.name}</div>
                      {p.barcode && <div className="dd-val-sub">{p.barcode}</div>}
                    </div>
                  </div>
                )}
                renderItem={p => (
                  <div className="dd-row">
                    <div className="dd-icon-wrap"><Package size={14} strokeWidth={2} /></div>
                    <div>
                      <div className="dd-row-main">{p.name}</div>
                      {p.barcode && <div className="dd-row-sub"><Tag size={10} /> {p.barcode}</div>}
                    </div>
                  </div>
                )}
                onSelect={p => { setProduct(p); setBatch(null); setStep(3); }}
              />
            </div>
          )}

          {/* ── STEP 3: Partiya ── */}
          {step === 3 && product && (
            <div className="sf-panel">
              <div className="sf-panel-head">
                <Layers size={16} strokeWidth={2.2} />
                Partiyani tanlang
                <span className="sf-panel-badge"><Package size={10} /> {product.name}</span>
              </div>
              <BatchList
                productId={product.id} selected={batch}
                onSelect={b => {
                  setBatch(b); setUnitPrice(b.price);
                  setQty(0); setScanLog([]); setStep(4);
                }}
              />
            </div>
          )}

          {/* ── STEP 4: Narx ── */}
          {step === 4 && batch && (
            <div className="sf-panel">
              <div className="sf-panel-head"><Banknote size={16} strokeWidth={2.2} /> Narx va quti sozlamalari</div>

              <div className="sf-batch-summary">
                <div className="sbs-item">
                  <span className="sbs-label">Barkod (quti)</span>
                  <span className="sbs-val chip chip-purple"><Tag size={10} /> {batch.series}</span>
                </div>
                {batch.boxSeries && (
                  <div className="sbs-item">
                    <span className="sbs-label">QR seriya (markirovka)</span>
                    <span className="sbs-val chip chip-blue"><QrCode size={10} /> {batch.boxSeries}</span>
                  </div>
                )}
                <div className="sbs-item">
                  <span className="sbs-label">Dozaj</span>
                  <span className="sbs-val chip chip-gray"><FlaskConical size={10} /> {batch.mg}</span>
                </div>
                <div className="sbs-item">
                  <span className="sbs-label">Omborda</span>
                  <span className="sbs-val sbs-green"><CheckCircle size={12} /> {batch.quantity} ta</span>
                </div>
                <div className="sbs-item">
                  <span className="sbs-label">Muddat</span>
                  <span className="sbs-val"><Calendar size={11} /> {fmtD(batch.expiry)}</span>
                </div>
              </div>

              <div className="scan-mode-box">
                <div className="smb-title">Skaner qoidalari</div>
                <div className="smb-row">
                  <div className="smb-item">
                    <div className="smb-icon smb-blue"><Package size={14} /></div>
                    <div>
                      <div className="smb-label">Quti barkodi</div>
                      <div className="smb-desc">
                        <code>{batch.series}</code><br />
                        Scan → +{unitsPerBox || "?"} dona
                      </div>
                    </div>
                  </div>
                  <div className="smb-divider" />
                  <div className="smb-item">
                    <div className="smb-icon smb-violet"><QrCode size={14} /></div>
                    <div>
                      <div className="smb-label">Markirovka (GS1 QR)</div>
                      <div className="smb-desc">
                        <code>01{batch.series.padStart(13,"0").substring(0,13)}21…</code><br />
                        Scan → +1 dona
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sf-fields">
                <div className="sf-field">
                  <label className="sf-label">
                    <Banknote size={12} strokeWidth={2.5} />
                    Sotish narxi (1 dona)<span className="req">*</span>
                  </label>
                  <div className="sf-input-wrap">
                    <input type="number" min="0" className="sf-input" value={unitPrice}
                      onChange={e => setUnitPrice(Number(e.target.value))} placeholder="12000" />
                    <span className="sf-input-suffix">so'm</span>
                  </div>
                </div>
                <div className="sf-field">
                  <label className="sf-label">
                    <Package size={12} strokeWidth={2.5} />
                    1 qutida nechta dona?
                  </label>
                  <div className="sf-input-wrap">
                    <input type="number" min="1" className="sf-input" value={unitsPerBox}
                      onChange={e => setUnitsPerBox(Number(e.target.value))} placeholder="30" />
                    <span className="sf-input-suffix">dona</span>
                  </div>
                  <p className="sf-hint">
                    <Package size={11} /> Quti barkodi skanerlanganda shu miqdor qo'shiladi
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: Skaner ── */}
          {step === 5 && batch && (
            <div className="sf-panel">
              <div className="sf-panel-head"><Scan size={16} strokeWidth={2.2} /> Skanerlash</div>

              {/* Counter */}
              <div className="sf-counter">
                <div className="sf-count-num">{qty}</div>
                <div className="sf-count-label">dona skanerlangan</div>
                <div className="sf-count-price">{fmt(totalPrice)}</div>
              </div>

              {/* Mini stats */}
              <div className="sf-mini-stats">
                <div className="ms-item ms-blue">
                  <Package size={13} strokeWidth={2} />
                  <div>
                    <div className="ms-val">{boxScans}</div>
                    <div className="ms-lbl">Quti</div>
                  </div>
                </div>
                <div className="ms-item ms-violet">
                  <QrCode size={13} strokeWidth={2} />
                  <div>
                    <div className="ms-val">{qrScans}</div>
                    <div className="ms-lbl">Markirovka</div>
                  </div>
                </div>
                <div className="ms-item ms-green">
                  <BarChart3 size={13} strokeWidth={2} />
                  <div>
                    <div className="ms-val">{fmt(totalPrice)}</div>
                    <div className="ms-lbl">Jami</div>
                  </div>
                </div>
              </div>

              {/* Warning banner */}
              {warnCount > 0 && (
                <div className="scan-warn-banner">
                  <AlertTriangle size={14} />
                  {warnCount} ta seriyasi mos kelmaydigan dori qo'shildi — tekshiring!
                </div>
              )}

              {/* Scan input */}
              <div className="sf-scan-box">
                <div className="sf-scan-label"><Scan size={13} strokeWidth={2} /> Barkod yoki QR kodni skanerlang</div>

                <div className="sf-series-ref">
                  <span><Tag size={10} /> Quti barkodi: <strong>{batch.series}</strong></span>
                  {batch.boxSeries && (
                    <span><QrCode size={10} /> QR: <strong>{batch.boxSeries}</strong></span>
                  )}
                </div>

                <div className="sf-scan-input-wrap">
                  <input
                    ref={scanRef}
                    className="sf-scan-input"
                    value={scanInput}
                    onChange={handleChange}
                    onKeyDown={e => e.key === "Enter" && handleScan()}
                    placeholder="Scan qiling yoki yozing, Enter bosing…"
                    autoFocus
                  />
                  <button className="sf-scan-btn" onClick={handleScan} disabled={!scanInput.trim()}>
                    <Scan size={15} />
                  </button>
                </div>
                <p className="sf-scan-hint">
                  Quti barkodi → +{unitsPerBox} dona &nbsp;|&nbsp; Markirovka QR → +1 dona
                </p>
              </div>

              {/* Manual */}
              <div className="sf-manual">
                <button className="manual-btn manual-sub" onClick={subOne} disabled={qty === 0}>
                  <Minus size={14} strokeWidth={2.5} />
                </button>
                <div className="manual-center">
                  <span className="manual-label">Qo'lda kiritish</span>
                  <span className="manual-qty">{qty} dona</span>
                </div>
                <button className="manual-btn manual-add" onClick={addOne}>
                  <Plus size={14} strokeWidth={2.5} />
                </button>
              </div>

              {/* Scan log */}
              {scanLog.length > 0 && (
                <div className="sf-log">
                  <div className="sf-log-head">
                    <span><ClipboardList size={13} /> Jurnal ({scanLog.length} scan / {qty} dona)</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      {/* ✦ EXCEL EXPORT — scan log ✦ */}
                      <button className="sf-log-excel" onClick={() =>
                        exportScanLogExcel(scanLog, {
                          customer: customer?.name || "",
                          product:  product?.name  || "",
                          series:   batch?.series  || "",
                          qty,
                          price:    unitPrice,
                        }, `scan_log_${Date.now()}.xlsx`)
                      }>
                        <Download size={11} /> Excel
                      </button>
                      <button className="sf-log-clear" onClick={() => { setScanLog([]); setQty(0); }}>
                        <Trash2 size={11} /> Tozalash
                      </button>
                    </div>
                  </div>
                  <div className="sf-log-list">
                    {[...scanLog].reverse().slice(0, 10).map((l, i) => (
                      <div key={i} className={`sf-log-item${l.warning ? " sf-log-warn" : l.type === "barcode" ? " sf-log-box" : " sf-log-unit"}`}>
                        {l.type === "barcode"
                          ? <Package size={12} className="log-icon-box" />
                          : l.type === "qr"
                            ? <QrCode size={12} className="log-icon-unit" />
                            : <Plus size={12} className="log-icon-unit" />}
                        <span className="sf-log-series">{l.series}</span>
                        <span className={`ltb ${l.type === "barcode" ? "ltb-box" : l.type === "qr" ? "ltb-qr" : "ltb-manual"}`}>
                          {l.type === "barcode" ? "quti" : l.type === "qr" ? "QR" : "qo'l"}
                        </span>
                        <span className="sf-log-count">+{l.count}</span>
                        {l.warning && <AlertTriangle size={11} className="log-icon-warn" />}
                        <span className="sf-log-time">{new Date(l.time).toLocaleTimeString("uz-UZ")}</span>
                      </div>
                    ))}
                    {scanLog.length > 10 && (
                      <div className="sf-log-more">… va yana {scanLog.length - 10} ta</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sf-footer">
          {step > 1
            ? <button className="sf-btn-back" onClick={() => setStep(s => s - 1)}>
                <ArrowLeft size={14} strokeWidth={2.5} /> Ortga
              </button>
            : <div />}
          <div className="sf-footer-right">
            {step < 5 && (
              <button className="sf-btn-next" disabled={!canNext()} onClick={() => setStep(s => s + 1)}>
                Keyingi <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            )}
            {step === 5 && qty > 0 && (
              <button className="sf-btn-save" disabled={saving} onClick={handleSave}>
                {saving
                  ? <><Loader2 size={15} className="spin" /> Saqlanmoqda…</>
                  : <><CheckCircle size={15} strokeWidth={2.5} /> Saqlash — {fmt(totalPrice)}</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {confirmModal && (
        <ConfirmModal
          title="Seriya mos kelmadi"
          message={confirmModal.message}
          onConfirm={confirmAdd}
          onCancel={() => { setConfirmModal(null); scanRef.current?.focus(); }}
        />
      )}
    </>
  );
}

// ─── Sales Table ──────────────────────────────────────────
const PER_PAGE = 10;

function SalesTable({ showToast, refreshKey }) {
  const [sales,     setSales]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filters,   setFilters]   = useState({ startDate: "", endDate: "" });
  const [page,      setPage]      = useState(1);
  const [detail,    setDetail]    = useState(null);
  const [custModal, setCustModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate)   params.endDate   = filters.endDate;
      const data = await salesApi.getAll(params);
      setSales(Array.isArray(data) ? data : []);
      setPage(1);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handleDelete = async (sale) => {
    if (!window.confirm(`Sotuv #${sale.id} bekor qilinsinmi?\nStock qaytariladi.`)) return;
    try {
      await salesApi.remove(sale.id);
      showToast("Sotuv bekor qilindi, mahsulot qaytarildi");
      setDetail(null);
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const totalRev  = sales.reduce((s, x) => s + x.totalPrice, 0);
  const paged     = sales.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const hasFilter = filters.startDate || filters.endDate;

  return (
    <div className="st-card">
      <div className="st-header">
        <div className="st-header-left">
          <History size={18} strokeWidth={2.2} className="st-header-icon" />
          <div>
            <div className="st-title">Sotuvlar tarixi</div>
            <div className="st-subtitle">{sales.length} ta sotuv</div>
          </div>
        </div>
        <button className="btn-export" disabled={!sales.length}
          onClick={() => exportSalesExcel(sales, `sotuvlar_${new Date().toISOString().slice(0,10)}.xlsx`)}>
          <Download size={14} strokeWidth={2.5} /> Excel
        </button>
      </div>

      {sales.length > 0 && (
        <div className="st-rev-bar">
          <div className="rev-item">
            <div className="rev-icon rev-green"><TrendingUp size={16} strokeWidth={2} /></div>
            <div>
              <div className="rev-label">Jami tushum</div>
              <div className="rev-val">{fmt(totalRev)}</div>
            </div>
          </div>
          <div className="rev-divider" />
          <div className="rev-item">
            <div className="rev-icon rev-blue"><ReceiptText size={16} strokeWidth={2} /></div>
            <div>
              <div className="rev-label">Sotuvlar soni</div>
              <div className="rev-val">{sales.length} ta</div>
            </div>
          </div>
        </div>
      )}

      <div className="st-filters">
        <div className="filter-group">
          <Calendar size={13} className="filter-icon" strokeWidth={2} />
          <input type="date" className="filter-input" value={filters.startDate}
            onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          <span className="filter-sep">—</span>
          <input type="date" className="filter-input" value={filters.endDate}
            onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        {hasFilter && (
          <button className="filter-clear" onClick={() => setFilters({ startDate: "", endDate: "" })}>
            <X size={12} /> Tozalash
          </button>
        )}
      </div>

      {loading ? (
        <div className="state-box"><Loader2 size={28} className="spin text-blue" strokeWidth={1.5} /><p>Yuklanmoqda…</p></div>
      ) : sales.length === 0 ? (
        <div className="state-box">
          <ReceiptText size={40} strokeWidth={1} className="text-muted" />
          <p>{hasFilter ? "Bu sana oralig'ida sotuv topilmadi" : "Hali sotuv yo'q"}</p>
        </div>
      ) : (
        <>
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>#</th><th>Mijoz</th><th>Mahsulot</th>
                  <th>Miqdor</th><th>Jami</th><th>Sana</th><th />
                </tr>
              </thead>
              <tbody>
                {paged.map(sale => (
                  <tr key={sale.id} className="tbl-row" onClick={() => setDetail(sale)}>
                    <td><span className="td-id">#{sale.id}</span></td>
                    <td>
                      <div className="td-cust-cell">
                        <div className="td-avatar">{sale.customer.name.charAt(0)}</div>
                        <div>
                          <div className="td-cust">{sale.customer.name}</div>
                          <div className="td-phone">{sale.customer.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="td-items">
                        {sale.items.slice(0, 2).map(it => (
                          <div key={it.id} className="td-chip">
                            {it.product.name}<span className="chip-x">×{it.quantity}</span>
                          </div>
                        ))}
                        {sale.items.length > 2 && <span className="td-more">+{sale.items.length - 2} ta</span>}
                      </div>
                    </td>
                    <td><span className="td-qty-pill">{sale.items.reduce((s, i) => s + i.quantity, 0)} dona</span></td>
                    <td><span className="td-total">{fmt(sale.totalPrice)}</span></td>
                    <td><span className="td-date">{fmtDT(sale.createdAt)}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn-history" onClick={() => setCustModal(sale.customer)}>
                        <History size={13} strokeWidth={2} /> Tarix
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="st-footer">
            <span className="pag-info">{(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, sales.length)} / {sales.length}</span>
            <Pagination total={sales.length} page={page} perPage={PER_PAGE} onChange={setPage} />
            <button className="btn-export-sm" disabled={!paged.length}
              onClick={() => exportSalesExcel(paged, `sotuvlar_p${page}.xlsx`)}>
              <Download size={12} /> Bu sahifa
            </button>
          </div>
        </>
      )}

      {detail    && <SaleDetailModal sale={detail} onClose={() => setDetail(null)} onDelete={handleDelete} />}
      {custModal && <CustomerModal customer={custModal} onClose={() => setCustModal(null)} showToast={showToast} />}
    </div>
  );
}

// ─── Sale Detail Modal ────────────────────────────────────
function SaleDetailModal({ sale, onClose, onDelete }) {
  return (
    <Modal title={`Sotuv tafsiloti — #${sale.id}`} onClose={onClose} size="lg">
      <div className="dm-meta">
        {[
          { label: "Mijoz",   val: sale.customer.name,    icon: User },
          { label: "Telefon", val: sale.customer.phone,   icon: Phone },
          { label: "Sana",    val: fmtDT(sale.createdAt), icon: Calendar },
          { label: "Jami",    val: fmt(sale.totalPrice),  icon: Banknote, accent: true },
        ].map(m => (
          <div key={m.label} className={`dm-meta-item${m.accent ? " dm-accent" : ""}`}>
            <div className="dm-label"><m.icon size={11} strokeWidth={2.5} /> {m.label}</div>
            <div className="dm-val">{m.val}</div>
          </div>
        ))}
      </div>

      <table className="tbl tbl-modal">
        <thead>
          <tr><th>Mahsulot</th><th>Seriya / Dozaj</th><th>Muddat</th><th>Miqdor</th><th>Narx</th><th>Jami</th><th>Scan log</th></tr>
        </thead>
        <tbody>
          {sale.items.map(it => (
            <tr key={it.id}>
              <td className="td-product-name">{it.product.name}</td>
              <td>
                <span className="chip chip-purple"><Tag size={9} /> {it.batch.series}</span>
                <span className="chip chip-gray"><FlaskConical size={9} /> {it.batch.mg}</span>
              </td>
              <td className="td-date">{fmtD(it.batch.expiry)}</td>
              <td><span className="td-qty-pill">{it.quantity}</span></td>
              <td className="mono">{fmt(it.price)}</td>
              <td className="mono td-total">{fmt(it.total)}</td>
              <td>
                {it.scanLog && Array.isArray(it.scanLog) && it.scanLog.length > 0 ? (
                  <button className="btn-export-sm" onClick={() =>
                    exportScanLogExcel(it.scanLog, {
                      customer: sale.customer.name,
                      product:  it.product.name,
                      series:   it.batch.series,
                      qty:      it.quantity,
                      price:    it.price,
                    }, `sotuv_${sale.id}_scanlog.xlsx`)
                  }>
                    <Download size={11} /> {it.scanLog.length} scan
                  </button>
                ) : (
                  <span className="td-date">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="dm-footer">
        <button className="btn-danger" onClick={() => onDelete(sale)}>
          <Trash2 size={13} strokeWidth={2} /> Bekor qilish
        </button>
        <div className="dm-footer-right">
          <button className="btn-export-sm" onClick={() => exportSalesExcel([sale], `sotuv_${sale.id}.xlsx`)}>
            <Download size={13} /> Excel (scan log)
          </button>
          <button className="btn-sec" onClick={onClose}>Yopish</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Customer History Modal ───────────────────────────────
function CustomerModal({ customer, onClose, showToast }) {
  const [sales,   setSales]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);

  useEffect(() => {
    salesApi.getAll({ customerId: customer.id })
      .then(d => setSales(Array.isArray(d) ? d : []))
      .catch(() => showToast("Xato yuz berdi", "error"))
      .finally(() => setLoading(false));
  }, [customer.id]);

  const total = sales.reduce((s, x) => s + x.totalPrice, 0);
  const paged = sales.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <Modal title={`${customer.name} — Xaridlar tarixi`} onClose={onClose} size="xl">
      {loading ? (
        <div className="state-box"><Loader2 size={28} className="spin text-blue" strokeWidth={1.5} /><p>Yuklanmoqda…</p></div>
      ) : sales.length === 0 ? (
        <div className="state-box"><ReceiptText size={36} strokeWidth={1} className="text-muted" /><p>Hali xarid yo'q</p></div>
      ) : (
        <>
          <div className="cm-summary">
            <div className="cm-stat">
              <div className="cm-stat-icon cm-icon-blue"><ReceiptText size={15} /></div>
              <div>
                <div className="cm-stat-label">Jami xaridlar</div>
                <div className="cm-stat-val">{sales.length} ta</div>
              </div>
            </div>
            <div className="cm-stat">
              <div className="cm-stat-icon cm-icon-green"><TrendingUp size={15} /></div>
              <div>
                <div className="cm-stat-label">Umumiy summa</div>
                <div className="cm-stat-val cm-green">{fmt(total)}</div>
              </div>
            </div>
            <button className="btn-export cm-export"
              onClick={() => exportSalesExcel(sales, `${customer.name}_xaridlar.xlsx`)}>
              <Download size={13} /> Excel (barchasi)
            </button>
          </div>
          <div className="tbl-scroll">
            <table className="tbl tbl-modal">
              <thead>
                <tr><th>#</th><th>Sana</th><th>Mahsulot</th><th>Seriya</th><th>Miqdor</th><th>Narx</th><th>Jami</th></tr>
              </thead>
              <tbody>
                {paged.map(sale =>
                  sale.items.map((it, idx) => (
                    <tr key={`${sale.id}-${it.id}`}>
                      {idx === 0 && <td rowSpan={sale.items.length} className="td-id">#{sale.id}</td>}
                      {idx === 0 && <td rowSpan={sale.items.length} className="td-date">{fmtDT(sale.createdAt)}</td>}
                      <td className="td-product-name">{it.product.name}</td>
                      <td>
                        <span className="chip chip-purple"><Tag size={9} /> {it.batch.series}</span>
                        <span className="chip chip-gray"><FlaskConical size={9} /> {it.batch.mg}</span>
                      </td>
                      <td><span className="td-qty-pill">{it.quantity}</span></td>
                      <td className="mono">{fmt(it.price)}</td>
                      <td className="mono td-total">{fmt(it.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="st-footer">
            <span className="pag-info">{(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, sales.length)} / {sales.length}</span>
            <Pagination total={sales.length} page={page} perPage={PER_PAGE} onChange={setPage} />
            <button className="btn-export-sm" onClick={() => exportSalesExcel(paged, `${customer.name}_p${page}.xlsx`)}>
              <Download size={12} /> Bu sahifa
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Root ─────────────────────────────────────────────────
export const Sales = () => {
  const [toast,      setToast]      = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab,  setActiveTab]  = useState("new");

  const showToast = (msg, type = "success") => setToast({ msg, type });

  return (
    <>
      <style>{CSS}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page">
        <div className="page-tabs">
          <button className={`page-tab${activeTab === "new" ? " tab-active" : ""}`}
            onClick={() => setActiveTab("new")}>
            <ShoppingCart size={14} strokeWidth={2.2} /> Yangi sotuv
          </button>
          <button className={`page-tab${activeTab === "history" ? " tab-active" : ""}`}
            onClick={() => setActiveTab("history")}>
            <History size={14} strokeWidth={2.2} /> Tarix
          </button>
        </div>
        <div className="page-body">
          <div className={`col-left${activeTab === "new" ? " col-show" : " col-hide"}`}>
            <SaleForm showToast={showToast} onDone={() => setRefreshKey(k => k + 1)} />
          </div>
          <div className={`col-right${activeTab === "history" ? " col-show" : " col-hide"}`}>
            <SalesTable showToast={showToast} refreshKey={refreshKey} />
          </div>
        </div>
      </div>
    </>
  );
};

// ─── CSS ──────────────────────────────────────────────────
const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.page { min-height: 100vh; background: #f6f8fc; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; }

.page-tabs { display: none; background: #fff; border-bottom: 1.5px solid #e2e8f0; padding: 0 20px; gap: 4px; }
.page-tab {
  display: inline-flex; align-items: center; gap: 6px; padding: 13px 18px;
  font-size: 13px; font-weight: 600; border: none; background: none; cursor: pointer;
  color: #94a3b8; border-bottom: 2px solid transparent; transition: all .15s;
}
.tab-active { color: #2563eb !important; border-bottom-color: #2563eb !important; }

.page-body { display: grid; grid-template-columns: 480px 1fr; gap: 20px; padding: 24px; max-width: 1440px; margin: 0 auto; align-items: start; }

@media (max-width: 960px) {
  .page-tabs { display: flex; }
  .page-body { grid-template-columns: 1fr; padding: 14px; gap: 0; }
  .col-hide { display: none !important; }
  .col-show { display: block !important; }
}
@media (min-width: 961px) { .col-hide, .col-show { display: block !important; } }

/* ═══ FORM ═══ */
.sf-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; position: sticky; top: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
.sf-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 14px; border-bottom: 1.5px solid #f1f5f9; background: #fafbff; }
.sf-header-left { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 800; color: #0f172a; }
.sf-header-icon { color: #2563eb; }
.sf-reset-btn { display: inline-flex; align-items: center; gap: 5px; background: none; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 5px 12px; font-size: 12px; font-weight: 600; color: #94a3b8; cursor: pointer; transition: all .15s; }
.sf-reset-btn:hover { border-color: #fca5a5; color: #dc2626; background: #fef2f2; }

.sf-steps { display: flex; align-items: center; padding: 16px 20px 14px; border-bottom: 1.5px solid #f1f5f9; overflow-x: auto; gap: 0; }
.sf-step-wrapper { display: flex; align-items: center; flex-shrink: 0; }
.sf-step { display: flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #94a3b8; background: #f1f5f9; white-space: nowrap; transition: all .2s; }
.sf-step-active { background: #eff6ff; color: #2563eb; box-shadow: 0 0 0 2px #bfdbfe; }
.sf-step-done   { background: #dcfce7; color: #16a34a; }
.sf-step-label  { font-size: 11px; }
.sf-step-line   { width: 20px; height: 2px; background: #e2e8f0; margin: 0 4px; flex-shrink: 0; }
.sf-line-done   { background: #16a34a; }

.sf-body { padding: 20px; min-height: 260px; }
.sf-panel { display: flex; flex-direction: column; gap: 14px; }
.sf-panel-head { display: flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 700; color: #0f172a; flex-wrap: wrap; }
.sf-panel-badge { display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; margin-left: 6px; }

.sf-chosen { display: flex; align-items: center; gap: 12px; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 11px; padding: 12px 14px; }
.sf-chosen-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sf-chosen-name { font-weight: 700; color: #0f172a; font-size: 14px; }
.sf-chosen-sub  { font-size: 12px; color: #64748b; margin-top: 2px; }
.sf-chosen-change { margin-left: auto; background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; align-items: center; width: 28px; height: 28px; border-radius: 6px; justify-content: center; transition: all .15s; }
.sf-chosen-change:hover { background: #fee2e2; color: #dc2626; }

.sf-batch-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 11px; padding: 14px; }
.sbs-item { display: flex; flex-direction: column; gap: 4px; }
.sbs-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
.sbs-val { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; color: #334155; }
.sbs-green { color: #16a34a; }

.scan-mode-box { background: #fafbff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; }
.smb-title { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 12px; }
.smb-row { display: flex; gap: 0; }
.smb-item { display: flex; align-items: flex-start; gap: 10px; flex: 1; }
.smb-divider { width: 1px; background: #e2e8f0; margin: 0 14px; }
.smb-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.smb-blue   { background: #eff6ff; color: #2563eb; }
.smb-violet { background: #f5f3ff; color: #7c3aed; }
.smb-label  { font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px; }
.smb-desc   { font-size: 11px; color: #94a3b8; line-height: 1.5; }
.smb-desc code { font-family: monospace; font-size: 10px; background: #f1f5f9; padding: 1px 4px; border-radius: 3px; }

.sf-fields { display: flex; flex-direction: column; gap: 14px; }
.sf-field  { display: flex; flex-direction: column; gap: 6px; }
.sf-label { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: #475569; }
.req { color: #ef4444; }
.sf-input-wrap { position: relative; display: flex; align-items: center; }
.sf-input { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px 52px 11px 13px; font-size: 15px; font-weight: 600; outline: none; font-family: inherit; color: #0f172a; transition: border-color .15s, box-shadow .15s; }
.sf-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
.sf-input-suffix { position: absolute; right: 12px; font-size: 12px; font-weight: 600; color: #94a3b8; white-space: nowrap; }
.sf-hint { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #94a3b8; }

.sf-counter { text-align: center; padding: 22px 0 16px; border: 1.5px solid #e2e8f0; border-radius: 14px; background: #fafbff; }
.sf-count-num   { font-size: 64px; font-weight: 900; color: #2563eb; line-height: 1; }
.sf-count-label { font-size: 13px; color: #94a3b8; margin-top: 4px; }
.sf-count-price { font-size: 22px; font-weight: 800; color: #16a34a; margin-top: 8px; }

.sf-mini-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
.ms-item { display: flex; align-items: center; gap: 10px; border-radius: 10px; padding: 10px 12px; }
.ms-blue   { background: #eff6ff; color: #2563eb; }
.ms-green  { background: #f0fdf4; color: #16a34a; }
.ms-violet { background: #f5f3ff; color: #7c3aed; }
.ms-val { font-size: 12px; font-weight: 800; line-height: 1.2; }
.ms-lbl { font-size: 10px; color: #94a3b8; margin-top: 2px; }

.scan-warn-banner { display: flex; align-items: center; gap: 8px; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 10px 14px; font-size: 13px; font-weight: 600; color: #92400e; }

.sf-scan-box { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
.sf-scan-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
.sf-series-ref { display: flex; gap: 8px; flex-wrap: wrap; }
.sf-series-ref span { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: #64748b; background: #f1f5f9; padding: 4px 10px; border-radius: 7px; }
.sf-series-ref strong { color: #0f172a; font-family: monospace; }
.sf-scan-input-wrap { display: flex; gap: 8px; }
.sf-scan-input { flex: 1; border: 2px solid #2563eb; border-radius: 10px; padding: 12px 14px; font-size: 14px; font-weight: 600; outline: none; font-family: inherit; transition: box-shadow .15s; }
.sf-scan-input:focus { box-shadow: 0 0 0 3px #dbeafe; }
.sf-scan-btn { background: #2563eb; color: #fff; border: none; border-radius: 10px; width: 46px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background .15s; flex-shrink: 0; }
.sf-scan-btn:hover:not(:disabled) { background: #1d4ed8; }
.sf-scan-btn:disabled { background: #93c5fd; cursor: not-allowed; }
.sf-scan-hint { font-size: 11px; color: #94a3b8; text-align: center; }

.sf-manual { display: flex; align-items: center; gap: 12px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; }
.manual-center { flex: 1; text-align: center; }
.manual-label { display: block; font-size: 11px; color: #94a3b8; font-weight: 600; }
.manual-qty   { display: block; font-size: 14px; font-weight: 800; color: #0f172a; }
.manual-btn { width: 38px; height: 38px; border: none; border-radius: 9px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-weight: 700; transition: all .15s; flex-shrink: 0; }
.manual-sub { background: #fee2e2; color: #dc2626; }
.manual-sub:hover:not(:disabled) { background: #fecaca; }
.manual-sub:disabled { opacity: .4; cursor: not-allowed; }
.manual-add { background: #dcfce7; color: #16a34a; }
.manual-add:hover { background: #bbf7d0; }

.sf-log { background: #f8fafc; border-radius: 11px; padding: 12px; }
.sf-log-head { display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
.sf-log-head span { display: flex; align-items: center; gap: 5px; }
.sf-log-clear { display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer; font-size: 11px; color: #ef4444; font-weight: 600; }
.sf-log-excel { display: inline-flex; align-items: center; gap: 4px; background: #dcfce7; color: #15803d; border: none; border-radius: 6px; padding: 4px 9px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background .15s; }
.sf-log-excel:hover { background: #bbf7d0; }
.sf-log-list { display: flex; flex-direction: column; gap: 4px; max-height: 200px; overflow-y: auto; }
.sf-log-item { display: flex; align-items: center; gap: 7px; font-size: 12px; padding: 5px 8px; border-radius: 7px; }
.sf-log-box  { background: #eff6ff; }
.sf-log-unit { background: #f0fdf4; }
.sf-log-warn { background: #fffbeb !important; }
.log-icon-box  { color: #2563eb; flex-shrink: 0; }
.log-icon-unit { color: #16a34a; flex-shrink: 0; }
.log-icon-warn { color: #d97706; flex-shrink: 0; }
.sf-log-series { font-family: monospace; font-weight: 700; color: #6d28d9; flex: 1; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
.sf-log-count  { font-weight: 800; color: #2563eb; flex-shrink: 0; }
.sf-log-time   { color: #94a3b8; font-size: 10px; flex-shrink: 0; }
.sf-log-more   { text-align: center; font-size: 11px; color: #94a3b8; padding: 4px; }
.ltb { display: inline-block; font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 4px; flex-shrink: 0; }
.ltb-box    { background: #eff6ff; color: #2563eb; }
.ltb-qr     { background: #f5f3ff; color: #7c3aed; }
.ltb-manual { background: #f0fdf4; color: #16a34a; }

.sf-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-top: 1.5px solid #f1f5f9; background: #fafbff; gap: 10px; }
.sf-footer-right { display: flex; gap: 8px; }
.sf-btn-back { display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; }
.sf-btn-back:hover { background: #e2e8f0; }
.sf-btn-next { display: inline-flex; align-items: center; gap: 6px; background: #2563eb; color: #fff; border: none; border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background .15s; }
.sf-btn-next:hover:not(:disabled) { background: #1d4ed8; }
.sf-btn-next:disabled { background: #bfdbfe; cursor: not-allowed; }
.sf-btn-save { display: inline-flex; align-items: center; gap: 7px; background: #16a34a; color: #fff; border: none; border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background .15s; }
.sf-btn-save:hover:not(:disabled) { background: #15803d; }
.sf-btn-save:disabled { background: #86efac; cursor: not-allowed; }
.sf-btn-warn { display: inline-flex; align-items: center; gap: 7px; background: #d97706; color: #fff; border: none; border-radius: 9px; padding: 9px 18px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background .15s; }
.sf-btn-warn:hover { background: #b45309; }

.modal-head-warn { background: #fffbeb; border-bottom: 1.5px solid #fef3c7; }
.confirm-msg { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 20px; white-space: pre-line; }
.confirm-actions { display: flex; gap: 10px; justify-content: flex-end; }

/* ═══ BATCH LIST ═══ */
.batch-list { display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; }
.batch-item { position: relative; border: 1.5px solid #e2e8f0; border-radius: 11px; padding: 12px 14px; cursor: pointer; background: #fafbff; transition: all .15s; display: flex; flex-direction: column; gap: 6px; }
.batch-item:hover { border-color: #93c5fd; background: #f0f7ff; }
.batch-sel { border-color: #2563eb; background: #eff6ff; box-shadow: 0 0 0 3px #dbeafe; }
.bi-top { display: flex; justify-content: space-between; align-items: center; }
.bi-series { display: inline-flex; align-items: center; gap: 5px; font-family: monospace; font-weight: 800; color: #6d28d9; font-size: 13px; }
.bi-qty-badge { display: inline-flex; align-items: center; gap: 4px; background: #dcfce7; color: #16a34a; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
.bi-qr-row { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: #7c3aed; background: #f5f3ff; padding: 2px 8px; border-radius: 5px; width: fit-content; font-family: monospace; }
.bi-qr-row strong { font-weight: 700; }
.bi-mid { display: flex; align-items: center; gap: 8px; }
.bi-exp { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #94a3b8; }
.bi-price { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700; color: #0f172a; }
.bi-check { position: absolute; top: 12px; right: 12px; color: #2563eb; }

/* ═══ DROPDOWN ═══ */
.dd-wrap { position: relative; }
.dd-trigger { display: flex; align-items: center; border: 1.5px solid #e2e8f0; border-radius: 11px; padding: 11px 14px; background: #fff; cursor: pointer; min-height: 48px; gap: 8px; transition: border-color .15s, box-shadow .15s; }
.dd-trigger:hover, .dd-open { border-color: #2563eb; }
.dd-open { box-shadow: 0 0 0 3px #dbeafe; }
.dd-has-val { background: #fafbff; }
.dd-ph { color: #94a3b8; font-size: 14px; flex: 1; }
.dd-arr { margin-left: auto; color: #94a3b8; flex-shrink: 0; transition: transform .2s; }
.dd-arr-open { transform: rotate(90deg); color: #2563eb; }
.dd-val { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.dd-val-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dd-val-icon { width: 32px; height: 32px; border-radius: 8px; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.dd-val-name { font-weight: 700; font-size: 14px; color: #0f172a; }
.dd-val-sub  { font-size: 11px; color: #94a3b8; margin-top: 1px; }
.dd-drop { position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 400; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 13px; box-shadow: 0 16px 48px rgba(0,0,0,.14); overflow: hidden; }
.dd-search-wrap { display: flex; align-items: center; border-bottom: 1px solid #f1f5f9; padding: 8px 12px; gap: 8px; }
.dd-search-icon { color: #cbd5e1; flex-shrink: 0; }
.dd-search { flex: 1; border: none; padding: 6px 0; font-size: 14px; outline: none; font-family: inherit; }
.dd-clear { background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; align-items: center; }
.dd-list { max-height: 230px; overflow-y: auto; }
.dd-item { padding: 10px 14px; cursor: pointer; transition: background .1s; }
.dd-item:hover, .dd-active { background: #eff6ff; }
.dd-row { display: flex; align-items: center; gap: 10px; }
.dd-avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center; }
.dd-icon-wrap { width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; }
.dd-row-main { font-weight: 600; color: #0f172a; font-size: 13px; }
.dd-row-sub  { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #64748b; margin-top: 2px; }
.dd-state { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 24px; text-align: center; color: #94a3b8; font-size: 13px; }

/* ═══ SALES TABLE ═══ */
.st-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.05); }
.st-header { display: flex; align-items: center; gap: 14px; padding: 20px 22px 16px; border-bottom: 1.5px solid #f1f5f9; }
.st-header-left { display: flex; align-items: center; gap: 12px; flex: 1; }
.st-header-icon { color: #7c3aed; }
.st-title    { font-size: 17px; font-weight: 800; color: #0f172a; }
.st-subtitle { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.st-rev-bar { display: flex; gap: 0; background: linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%); border-bottom: 1.5px solid #e2e8f0; padding: 16px 22px; }
.rev-item { display: flex; align-items: center; gap: 12px; flex: 1; }
.rev-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.rev-green  { background: #dcfce7; color: #16a34a; }
.rev-blue   { background: #dbeafe; color: #2563eb; }
.rev-divider { width: 1px; background: #e2e8f0; margin: 0 20px; }
.rev-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
.rev-val   { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 2px; }
.st-filters { display: flex; align-items: center; gap: 10px; padding: 12px 22px; border-bottom: 1px solid #f8fafc; flex-wrap: wrap; }
.filter-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.filter-icon { color: #94a3b8; }
.filter-input { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 7px 11px; font-size: 13px; outline: none; font-family: inherit; color: #0f172a; transition: border-color .15s; }
.filter-input:focus { border-color: #2563eb; }
.filter-sep { color: #94a3b8; font-size: 13px; }
.filter-clear { display: inline-flex; align-items: center; gap: 5px; background: #fef2f2; color: #dc2626; border: none; border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background .15s; }
.filter-clear:hover { background: #fecaca; }

.state-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 64px 24px; color: #94a3b8; font-size: 14px; }
.state-box p { color: #94a3b8; }
.state-sm { display: flex; align-items: center; gap: 8px; padding: 20px; color: #94a3b8; font-size: 13px; }
.state-sm.warn { color: #f59e0b; }
.text-blue  { color: #2563eb; }
.text-muted { color: #cbd5e1; }

.tbl-scroll { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl thead tr { background: #faf5ff; border-bottom: 1.5px solid #e2e8f0; }
.tbl th { padding: 11px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #7c3aed; text-align: left; white-space: nowrap; }
.tbl td { padding: 12px 16px; font-size: 13px; color: #334155; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
.tbl-modal th { background: #f8fafc; color: #475569; }
.tbl-row { cursor: pointer; transition: background .1s; }
.tbl-row:hover { background: #fafbff; }

.td-id { font-weight: 800; color: #7c3aed; font-size: 13px; background: #f5f3ff; padding: 3px 8px; border-radius: 6px; white-space: nowrap; display: inline-block; }
.td-cust-cell { display: flex; align-items: center; gap: 10px; }
.td-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; font-weight: 800; font-size: 12px; display: flex; align-items: center; justify-content: center; }
.td-cust  { font-weight: 700; color: #0f172a; font-size: 13px; }
.td-phone { font-size: 11px; color: #94a3b8; margin-top: 1px; }
.td-items { display: flex; flex-direction: column; gap: 3px; }
.td-chip { display: inline-flex; align-items: center; gap: 5px; background: #f1f5f9; border-radius: 5px; padding: 2px 8px; font-size: 12px; font-weight: 500; width: fit-content; }
.chip-x { color: #2563eb; font-weight: 700; font-size: 11px; }
.td-more { font-size: 11px; color: #94a3b8; }
.td-qty-pill { background: #f1f5f9; color: #334155; font-weight: 700; font-size: 12px; padding: 3px 10px; border-radius: 20px; display: inline-block; }
.td-total { font-weight: 800; color: #0f172a; font-size: 14px; white-space: nowrap; }
.td-date  { font-size: 11px; color: #94a3b8; white-space: nowrap; }
.td-product-name { font-weight: 600; color: #0f172a; }
.mono { font-family: 'JetBrains Mono', 'Fira Mono', monospace; font-size: 12px; }

.st-footer { display: flex; align-items: center; gap: 10px; padding: 12px 20px; border-top: 1.5px solid #f1f5f9; flex-wrap: wrap; }
.pag-info { font-size: 12px; color: #94a3b8; white-space: nowrap; }
.pag { display: flex; align-items: center; gap: 4px; flex: 1; justify-content: center; }
.pag-btn { width: 32px; height: 32px; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #475569; transition: all .15s; }
.pag-btn:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
.pag-btn:disabled { opacity: .4; cursor: not-allowed; }
.pag-active { background: #2563eb !important; color: #fff !important; border-color: #2563eb !important; }
.pag-dots { font-size: 13px; color: #94a3b8; padding: 0 4px; }

.dm-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
.dm-meta-item { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 11px; padding: 13px 14px; }
.dm-accent { background: #eff6ff; border-color: #bfdbfe; }
.dm-label { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px; }
.dm-val { font-size: 14px; font-weight: 700; color: #0f172a; }
.dm-accent .dm-val { color: #2563eb; font-size: 18px; }
.dm-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 14px; border-top: 1.5px solid #f1f5f9; }
.dm-footer-right { display: flex; gap: 8px; }

.cm-summary { display: flex; align-items: center; gap: 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 13px; padding: 15px 18px; margin-bottom: 16px; flex-wrap: wrap; }
.cm-stat { display: flex; align-items: center; gap: 10px; }
.cm-stat-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
.cm-icon-blue  { background: #dbeafe; color: #2563eb; }
.cm-icon-green { background: #dcfce7; color: #16a34a; }
.cm-stat-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #94a3b8; }
.cm-stat-val   { font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 1px; }
.cm-green { color: #16a34a; }
.cm-export { margin-left: auto; }

.btn-export { display: inline-flex; align-items: center; gap: 6px; background: #16a34a; color: #fff; border: none; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background .15s; flex-shrink: 0; }
.btn-export:hover:not(:disabled) { background: #15803d; }
.btn-export:disabled { background: #86efac; cursor: not-allowed; }
.btn-export-sm { display: inline-flex; align-items: center; gap: 5px; background: #dcfce7; color: #15803d; border: none; border-radius: 8px; padding: 7px 13px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background .15s; flex-shrink: 0; }
.btn-export-sm:hover:not(:disabled) { background: #bbf7d0; }
.btn-export-sm:disabled { opacity: .4; cursor: not-allowed; }
.btn-history { display: inline-flex; align-items: center; gap: 5px; background: #f5f3ff; color: #7c3aed; border: none; border-radius: 7px; padding: 5px 10px; font-size: 11px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background .15s; }
.btn-history:hover { background: #ede9fe; }
.btn-danger { display: inline-flex; align-items: center; gap: 6px; background: #fee2e2; color: #dc2626; border: none; border-radius: 9px; padding: 9px 14px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s; }
.btn-danger:hover { background: #fecaca; }
.btn-sec { display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; }
.btn-sec:hover { background: #e2e8f0; }

.chip { display: inline-flex; align-items: center; gap: 4px; border-radius: 5px; padding: 2px 8px; font-size: 11px; font-weight: 600; margin-right: 4px; }
.chip-purple { background: #ede9fe; color: #6d28d9; font-family: monospace; }
.chip-gray   { background: #f1f5f9; color: #475569; }
.chip-blue   { background: #dbeafe; color: #1d4ed8; font-family: monospace; }

.overlay { position: fixed; inset: 0; z-index: 900; background: rgba(15,23,42,.55); display: flex; align-items: center; justify-content: center; padding: 16px; backdrop-filter: blur(4px); }
.modal { background: #fff; border-radius: 20px; width: 100%; box-shadow: 0 32px 80px rgba(0,0,0,.2); animation: pop .18s ease; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-sm  { max-width: 440px; }
.modal-md  { max-width: 480px; }
.modal-lg  { max-width: 720px; }
.modal-xl  { max-width: 980px; }
@keyframes pop { from { opacity: 0; transform: scale(.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 16px; border-bottom: 1.5px solid #f1f5f9; flex-shrink: 0; }
.modal-title { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -.2px; }
.modal-x { background: #f1f5f9; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all .15s; }
.modal-x:hover { background: #e2e8f0; color: #0f172a; }
.modal-body { padding: 20px 24px 24px; overflow-y: auto; flex: 1; }

.toast { position: fixed; bottom: 28px; right: 28px; z-index: 9999; padding: 13px 16px; border-radius: 14px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.2); animation: slide-up .2s ease; max-width: 380px; }
.toast-success { background: #0f172a; color: #fff; }
.toast-error   { background: #dc2626; color: #fff; }
.toast-warn    { background: #d97706; color: #fff; }
.toast-icon { display: flex; align-items: center; flex-shrink: 0; }
.toast-msg  { flex: 1; }
.toast-x { background: rgba(255,255,255,.15); border: none; border-radius: 6px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: rgba(255,255,255,.8); flex-shrink: 0; }
.toast-x:hover { background: rgba(255,255,255,.25); color: #fff; }
@keyframes slide-up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

.spin { animation: spinAnim .7s linear infinite; }
@keyframes spinAnim { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .dm-meta { grid-template-columns: 1fr; }
  .sf-batch-summary { grid-template-columns: 1fr; }
  .sf-mini-stats { grid-template-columns: 1fr; }
  .smb-row { flex-direction: column; }
  .smb-divider { display: none; }
  .sf-footer { flex-direction: column; align-items: stretch; }
  .sf-footer-right { justify-content: flex-end; }
}
`;