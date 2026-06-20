import { useState, useRef } from "react";
import {
  Search, X, Plus, Pencil, Trash2, ChevronRight,
  Package, Layers, AlertTriangle, Clock, CheckCircle,
  BoxSelect, FlaskConical, Hash, Tag, Calendar,
  Banknote, Archive, ShieldAlert, Loader2, QrCode,
  ScanBarcode, FileCode, Building2, Ruler,
} from "lucide-react";

let mockIdCounter = 200;

const initialProducts = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    barcode: "4780123456789",
    ikpu: "10006001001000000",
    manufacturer: "Medexport UZ",
    unit: "dona",
    batches: [
      {
        id: 1, productId: 1,
        series: "478001167783021",
        boxSeries: "MK-2026-001",
        mg: "500mg",
        quantity: 240, price: 12000, expiry: "2027-03-15",
        contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0892",
      },
      {
        id: 2, productId: 1,
        series: "478001167783022",
        boxSeries: "MK-2026-002",
        mg: "500mg",
        quantity: 18, price: 12500, expiry: "2026-07-10",
        contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0910",
      },
    ],
  },
  {
    id: 2,
    name: "Amoxicillin 250mg",
    barcode: "4780198765432",
    ikpu: "10006001002000000",
    manufacturer: "Pharmaville LLC",
    unit: "qadoq",
    batches: [
      {
        id: 3, productId: 2,
        series: "478019988771",
        boxSeries: null,
        mg: "250mg",
        quantity: 80, price: 24000, expiry: "2026-12-01",
        contractNumber: "SH-2026-031", invoiceNumber: "F-2026-0411",
      },
    ],
  },
  {
    id: 3,
    name: "Ibuprofen 400mg",
    barcode: null,
    ikpu: "",
    manufacturer: "",
    unit: "dona",
    batches: [],
  },
  {
    id: 4,
    name: "Vitamin C 1000mg",
    barcode: "4780111222333",
    ikpu: "10006001003000000",
    manufacturer: "VitaPharm",
    unit: "dona",
    batches: [
      {
        id: 4, productId: 4,
        series: "478011199001",
        boxSeries: "MK-2025-450",
        mg: "1000mg",
        quantity: 5, price: 18000, expiry: "2026-06-25",
        contractNumber: "SH-2025-188", invoiceNumber: "F-2025-2201",
      },
    ],
  },
];

const UNITS = ["dona", "qadoq", "blister", "shisha", "ampula", "gramm", "ml", "kg"];

const formatDate  = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";
const formatPrice = (p) => Number(p).toLocaleString("uz-UZ") + " so'm";

function isExpired(expiry) {
  if (!expiry) return false;
  return new Date(expiry) < new Date();
}
function isExpiringSoon(expiry) {
  if (!expiry) return false;
  const diff = (new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= 30;
}

function Toast({ msg, type, onClose }) {
  useState(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  });
  return (
    <div className={`toast toast-${type}`} role="alert">
      <span className="toast-icon">
        {type === "success"
          ? <CheckCircle size={17} strokeWidth={2.5} />
          : <ShieldAlert size={17} strokeWidth={2.5} />}
      </span>
      <span>{msg}</span>
      <button className="toast-close" onClick={onClose} aria-label="Yopish"><X size={14} /></button>
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className={`modal-box${wide ? " modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Yopish"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, required, hint, children, half }) {
  return (
    <div className={`field${half ? " field-half" : ""}`}>
      <label className="field-label">
        {Icon && <Icon size={13} strokeWidth={2.5} />}
        {label}
        {required && <span className="req">*</span>}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

function BarcodeSearchBar({ products, onSelect }) {
  const [val, setVal] = useState("");
  const [results, setResults] = useState([]);
  const inputRef = useRef();

  const handleChange = (v) => {
    setVal(v);
    if (!v.trim()) { setResults([]); return; }
    const found = products.filter(
      p => (p.barcode || "").includes(v) || p.name.toLowerCase().includes(v.toLowerCase()) ||
           (p.ikpu || "").includes(v)
    );
    setResults(found.slice(0, 6));
  };

  const pick = (p) => { setVal(""); setResults([]); onSelect(p); };

  return (
    <div className="barcode-search-wrap">
      <div className="barcode-search-inner">
        <ScanBarcode size={16} className="bs-icon" strokeWidth={2} />
        <input
          ref={inputRef}
          className="barcode-input"
          value={val}
          onChange={e => handleChange(e.target.value)}
          placeholder="Nom, barcode yoki IKPU bo'yicha qidiring…"
        />
        {val && <button className="clear-btn" onClick={() => { setVal(""); setResults([]); }}><X size={14} /></button>}
      </div>
      {results.length > 0 && (
        <div className="bs-dropdown">
          {results.map(p => (
            <button key={p.id} className="bs-item" onClick={() => pick(p)}>
              <div className="bs-name">{p.name}</div>
              <div className="bs-meta">
                {p.barcode && <span className="bs-badge bc"><Hash size={10} />{p.barcode}</span>}
                {p.ikpu   && <span className="bs-badge ikpu"><FileCode size={10} />{p.ikpu}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({ initial = {}, onSave, onCancel, saving }) {
  const [name,         setName]         = useState(initial.name         || "");
  const [barcode,      setBarcode]      = useState(initial.barcode      || "");
  const [ikpu,         setIkpu]         = useState(initial.ikpu         || "");
  const [manufacturer, setManufacturer] = useState(initial.manufacturer || "");
  const [unit,         setUnit]         = useState(initial.unit         || "dona");
  const [err,          setErr]          = useState("");

  const submit = () => {
    if (!name.trim()) return setErr("Mahsulot nomi kiritilsin");
    setErr("");
    onSave({ name: name.trim(), barcode: barcode.trim() || null, ikpu: ikpu.trim(), manufacturer: manufacturer.trim(), unit });
  };

  return (
    <div className="form-body">
      {err && <div className="form-error"><ShieldAlert size={14} />{err}</div>}
      <Field label="Mahsulot nomi" icon={Package} required>
        <input className="input" value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()} placeholder="Masalan: Paracetamol" autoFocus />
      </Field>
      <div className="form-row">
        <Field label="Barcode" icon={Hash} hint="Mahsulotning umumiy barkodi">
          <input className="input mono" value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="4780123456789" />
        </Field>
        <Field label="IKPU kodi" icon={FileCode} hint="Tovar nomenklaturasi kodi">
          <input className="input mono" value={ikpu} onChange={e => setIkpu(e.target.value)} placeholder="10006001001000000" />
        </Field>
      </div>
      <div className="form-row">
        <Field label="Ishlab chiqaruvchi" icon={Building2}>
          <input className="input" value={manufacturer} onChange={e => setManufacturer(e.target.value)} placeholder="Kompaniya nomi" />
        </Field>
        <Field label="O'lchov birligi" icon={Ruler}>
          <select className="input" value={unit} onChange={e => setUnit(e.target.value)}>
            {UNITS.map(u => <option key={u}>{u}</option>)}
          </select>
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

function BatchForm({ productId, productName, initial = {}, onSave, onCancel, saving }) {
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
  const [err,            setErr]            = useState("");

  const submit = () => {
    if (!series.trim() || !mg.trim() || quantity === "" || price === "" || !expiry)
      return setErr("Seriya, dozaj, miqdor, narx va muddat majburiy");
    if (Number(quantity) < 0) return setErr("Miqdor manfiy bo'lmasin");
    if (Number(price) < 0)    return setErr("Narx manfiy bo'lmasin");
    setErr("");
    onSave({
      productId: Number(productId),
      series: series.trim(), boxSeries: boxSeries.trim() || null,
      mg: mg.trim(), quantity: Number(quantity), price: Number(price), expiry,
      contractNumber: contractNumber.trim(), invoiceNumber: invoiceNumber.trim(),
    });
  };

  return (
    <div className="form-body">
      {productName && (
        <div className="batch-product-chip"><Package size={12} />{productName}</div>
      )}
      {err && <div className="form-error"><ShieldAlert size={14} />{err}</div>}

      <div className="section-divider">
        <span>Hujjatlar</span>
      </div>
      <div className="form-row">
        <Field label="Shartnoma raqami" icon={Tag} hint="Kiraim shartnomasi raqami">
          <input className="input mono" value={contractNumber} onChange={e => setContractNumber(e.target.value)}
            placeholder="SH-2026-001" />
        </Field>
        <Field label="Faktura raqami" icon={Tag} hint="Yetkazib beruvchi fakturasi">
          <input className="input mono" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
            placeholder="F-2026-0001" />
        </Field>
      </div>

      <div className="section-divider"><span>Marking / Seriya</span></div>
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
              <div className="sib-desc">Series from the marking QR code</div>
            </div>
          </div>
        </div>
      </div>
      <div className="form-row">
        <Field label="Dori seriyasi (barcode)" icon={Tag} required hint="Qutining tashqi barkodidagi seriya">
          <input className="input mono" value={series} onChange={e => setSeries(e.target.value)}
            placeholder="478001167783021" autoFocus />
        </Field>
        <Field label="Marking series (QR)" icon={QrCode} hint="Marking QR code series (optional)">
          <input className="input mono" value={boxSeries} onChange={e => setBoxSeries(e.target.value)}
            placeholder="MK-2026-001" />
        </Field>
      </div>

      <div className="section-divider"><span>Partiya ma'lumotlari</span></div>
      <div className="form-row">
        <Field label="Dozaj" icon={FlaskConical} required>
          <input className="input" value={mg} onChange={e => setMg(e.target.value)} placeholder="500mg" />
        </Field>
        <Field label="Miqdor" icon={BoxSelect} required>
          <input className="input" type="number" min="0" value={quantity}
            onChange={e => setQuantity(e.target.value)} placeholder="100" />
        </Field>
      </div>
      <div className="form-row">
        <Field label="Narx (so'm)" icon={Banknote} required>
          <input className="input" type="number" min="0" value={price}
            onChange={e => setPrice(e.target.value)} placeholder="15000" />
        </Field>
        <Field label="Yaroqlilik muddati" icon={Calendar} required>
          <input className="input" type="date" value={expiry}
            onChange={e => setExpiry(e.target.value)} />
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

function AddProductWithBatchModal({ onCreateProduct, onCreateBatch, onCancel, saving, setSaving, showToast }) {
  const [step, setStep] = useState(1);
  const [createdProduct, setCreatedProduct] = useState(null);

  const handleProductSave = (data) => {
    setSaving(true);
    setTimeout(() => {
      const product = onCreateProduct(data);
      setCreatedProduct(product);
      setStep(2);
      setSaving(false);
    }, 400);
  };

  const handleBatchSave = (data) => {
    setSaving(true);
    setTimeout(() => {
      onCreateBatch(data);
      showToast("Mahsulot va partiya qo'shildi!", "success");
      onCancel();
      setSaving(false);
    }, 400);
  };

  const handleSkipBatch = () => {
    showToast("Mahsulot qo'shildi!", "success");
    onCancel();
  };

  return (
    <Modal title={step === 1 ? "Yangi mahsulot qo'shish" : "Partiya qo'shish"} onClose={onCancel} wide>
      <div className="step-bar">
        <div className={`step-item ${step >= 1 ? "done" : ""}`}>
          <div className="step-dot">{step > 1 ? <CheckCircle size={14} /> : <span>1</span>}</div>
          <span>Mahsulot</span>
        </div>
        <div className={`step-line ${step >= 2 ? "active-line" : ""}`} />
        <div className={`step-item ${step >= 2 ? "active" : ""}`}>
          <div className="step-dot"><span>2</span></div>
          <span>Partiya</span>
        </div>
      </div>
      {step === 1 ? (
        <ProductForm onSave={handleProductSave} onCancel={onCancel} saving={saving} />
      ) : (
        <>
          <BatchForm
            productId={createdProduct.id}
            productName={createdProduct.name}
            onSave={handleBatchSave}
            onCancel={handleSkipBatch}
            saving={saving}
          />
          <div className="skip-hint">
            <button className="link-btn" onClick={handleSkipBatch}>Hozircha partiyasiz saqlash →</button>
          </div>
        </>
      )}
    </Modal>
  );
}

function BatchRow({ batch, onEdit, onDelete }) {
  const expired = isExpired(batch.expiry);
  const soon    = isExpiringSoon(batch.expiry);
  return (
    <tr className={expired ? "row-expired" : soon ? "row-soon" : ""}>
      <td>
        <div className="series-cell">
          <span className="badge-series"><Tag size={10} strokeWidth={2.5} />{batch.series}</span>
          {batch.boxSeries && <span className="badge-box-series"><QrCode size={10} strokeWidth={2.5} />{batch.boxSeries}</span>}
        </div>
      </td>
      <td>
        <div className="doc-cell">
          {batch.contractNumber && <span className="doc-badge"><Tag size={9} />{batch.contractNumber}</span>}
          {batch.invoiceNumber  && <span className="doc-badge inv"><Hash size={9} />{batch.invoiceNumber}</span>}
        </div>
      </td>
      <td className="mono">{batch.mg}</td>
      <td><span className="qty-pill">{batch.quantity}</span></td>
      <td className="mono price-col">{formatPrice(batch.price)}</td>
      <td>
        <span className={`expiry-pill ${expired ? "exp-red" : soon ? "exp-yellow" : "exp-green"}`}>
          {expired ? <AlertTriangle size={11} /> : soon ? <Clock size={11} /> : <CheckCircle size={11} />}
          {formatDate(batch.expiry)}
        </span>
      </td>
      <td>
        <div className="row-actions">
          <button className="icon-btn edit" onClick={() => onEdit(batch)} aria-label="Tahrirlash"><Pencil size={14} strokeWidth={2} /></button>
          <button className="icon-btn del"  onClick={() => onDelete(batch)} aria-label="O'chirish"><Trash2 size={14} strokeWidth={2} /></button>
        </div>
      </td>
    </tr>
  );
}

function ProductRow({ product, onEditProduct, onDeleteProduct, onAddBatch, onEditBatch, onDeleteBatch }) {
  const [open, setOpen] = useState(false);
  const totalQty     = product.batches?.reduce((s, b) => s + b.quantity, 0) ?? 0;
  const expiredCount = product.batches?.filter((b) => isExpired(b.expiry)).length ?? 0;
  const soonCount    = product.batches?.filter((b) => isExpiringSoon(b.expiry)).length ?? 0;
  const batchLen     = product.batches?.length ?? 0;

  let statusEl;
  if (totalQty === 0) {
    statusEl = <span className="badge-status gray"><Archive size={10} /> Bo'sh</span>;
  } else if (expiredCount > 0) {
    statusEl = <span className="badge-status red"><AlertTriangle size={10} /> {expiredCount} muddati o'tgan</span>;
  } else if (soonCount > 0) {
    statusEl = <span className="badge-status yellow"><Clock size={10} /> {soonCount} tugayapti</span>;
  } else {
    statusEl = <span className="badge-status green"><CheckCircle size={10} /> Yaxshi</span>;
  }

  return (
    <>
      <tr className={`product-row ${open ? "product-row-open" : ""}`} onClick={() => setOpen(v => !v)}>
        <td>
          <div className="product-name-cell">
            <span className={`chevron ${open ? "open" : ""}`}><ChevronRight size={14} strokeWidth={2.5} /></span>
            <div>
              <div className="product-name">{product.name}</div>
              <div className="product-meta">
                {product.barcode      && <span className="badge-barcode"><Hash size={9} />{product.barcode}</span>}
                {product.ikpu         && <span className="badge-ikpu"><FileCode size={9} />{product.ikpu}</span>}
                {product.manufacturer && <span className="badge-mfr"><Building2 size={9} />{product.manufacturer}</span>}
              </div>
            </div>
          </div>
        </td>
        <td className="center"><span className="count-chip"><Layers size={12} />{batchLen}</span></td>
        <td className="center"><strong className="total-qty">{totalQty.toLocaleString("uz-UZ")}</strong></td>
        <td className="center">{statusEl}</td>
        <td>
          <div className="row-actions" onClick={e => e.stopPropagation()}>
            <button className="icon-btn add" onClick={() => onAddBatch(product)} aria-label="Partiya qo'shish" title="Partiya qo'shish"><Plus size={15} strokeWidth={2.5} /></button>
            <button className="icon-btn edit" onClick={() => onEditProduct(product)} aria-label="Tahrirlash"><Pencil size={14} strokeWidth={2} /></button>
            <button className="icon-btn del"  onClick={() => onDeleteProduct(product)} aria-label="O'chirish"><Trash2 size={14} strokeWidth={2} /></button>
          </div>
        </td>
      </tr>
      {open && (
        <tr className="batch-panel">
          <td colSpan={5}>
            {batchLen === 0 ? (
              <div className="empty-batches">
                <Package size={28} strokeWidth={1.5} className="empty-icon" />
                <p>Hali partiya yo'q.</p>
                <button className="link-btn" onClick={() => onAddBatch(product)}><Plus size={13} /> Birinchi partiyani qo'shing</button>
              </div>
            ) : (
              <table className="batch-table">
                <thead>
                  <tr>
                    <th>Seriya / QR seriya</th>
                    <th>Shartnoma / Faktura</th>
                    <th>Dozaj</th>
                    <th>Miqdor</th>
                    <th>Narx</th>
                    <th>Muddat</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {product.batches.map((b) => (
                    <BatchRow key={b.id} batch={b} onEdit={onEditBatch} onDelete={onDeleteBatch} />
                  ))}
                </tbody>
              </table>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function StatCard({ icon: Icon, value, label, accent }) {
  return (
    <div className={`stat-card stat-${accent}`}>
      <div className={`stat-icon-wrap stat-icon-${accent}`}><Icon size={18} strokeWidth={2} /></div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export const Product = () => {
  const [products,         setProducts]         = useState(initialProducts);
  const [search,           setSearch]           = useState("");
  const [saving,           setSaving]           = useState(false);
  const [toast,            setToast]            = useState(null);
  const [addModal,         setAddModal]         = useState(false);
  const [editProductModal, setEditProductModal] = useState(null);
  const [addBatchModal,    setAddBatchModal]    = useState(null);
  const [editBatchModal,   setEditBatchModal]   = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const createProduct = (data) => {
    const p = { id: ++mockIdCounter, ...data, batches: [] };
    setProducts(prev => [p, ...prev]);
    return p;
  };

  const handleUpdateProduct = (data) => {
    setSaving(true);
    setTimeout(() => {
      setProducts(prev => prev.map(p => p.id === editProductModal.id ? { ...p, ...data } : p));
      showToast("Mahsulot yangilandi");
      setEditProductModal(null);
      setSaving(false);
    }, 400);
  };

  const handleDeleteProduct = (product) => {
    if (!window.confirm(`"${product.name}" mahsulotini o'chirasizmi?\nBarcha partiyalar ham o'chadi!`)) return;
    setProducts(prev => prev.filter(p => p.id !== product.id));
    showToast("Mahsulot o'chirildi");
  };

  const createBatch = (data) => {
    setProducts(prev => prev.map(p =>
      p.id === data.productId ? { ...p, batches: [{ id: ++mockIdCounter, ...data }, ...p.batches] } : p
    ));
  };

  const handleCreateBatch = (data) => {
    setSaving(true);
    setTimeout(() => {
      createBatch(data);
      showToast("Partiya qo'shildi!");
      setAddBatchModal(null);
      setSaving(false);
    }, 400);
  };

  const handleUpdateBatch = (data) => {
    setSaving(true);
    setTimeout(() => {
      setProducts(prev => prev.map(p => ({
        ...p,
        batches: p.batches.map(b => b.id === editBatchModal.id ? { ...b, ...data } : b),
      })));
      showToast("Partiya yangilandi");
      setEditBatchModal(null);
      setSaving(false);
    }, 400);
  };

  const handleDeleteBatch = (batch) => {
    if (!window.confirm(`"${batch.series}" seriyali partiyani o'chirasizmi?`)) return;
    setProducts(prev => prev.map(p => ({ ...p, batches: p.batches.filter(b => b.id !== batch.id) })));
    showToast("Partiya o'chirildi");
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || "").includes(search) ||
    (p.ikpu   || "").includes(search) ||
    p.batches?.some(b =>
      (b.contractNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.invoiceNumber  || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.series         || "").includes(search)
    )
  );

  const totalBatches = products.reduce((s, p) => s + (p.batches?.length ?? 0), 0);
  const expiredTotal = products.reduce((s, p) => s + (p.batches?.filter(b => isExpired(b.expiry)).length ?? 0), 0);
  const totalQtyAll  = products.reduce((s, p) => s + (p.batches?.reduce((x, b) => x + b.quantity, 0) ?? 0), 0);

  return (
    <>
      <style>{STYLES}</style>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page">
        <div className="page-header">
          <div className="header-text">
            <h1><Package size={24} strokeWidth={2.2} className="h1-icon" />Mahsulotlar</h1>
            <p className="subtitle">Apteka ombori — tovar va partiyalar boshqaruvi</p>
          </div>
          <button className="btn-primary" onClick={() => setAddModal(true)}>
            <Plus size={16} strokeWidth={2.5} />Mahsulot qo'shish
          </button>
        </div>

        <div className="stats-row">
          <StatCard icon={Package}       value={products.length}                     label="Mahsulotlar"    accent="blue"   />
          <StatCard icon={Layers}        value={totalBatches}                        label="Partiyalar"     accent="violet" />
          <StatCard icon={BoxSelect}     value={totalQtyAll.toLocaleString("uz-UZ")} label="Jami miqdor"   accent="teal"   />
          <StatCard icon={AlertTriangle} value={expiredTotal}                        label="Muddati o'tgan" accent={expiredTotal > 0 ? "red" : "gray"} />
        </div>

        <BarcodeSearchBar products={products} onSelect={(p) => setAddBatchModal(p)} />

        <div className="search-wrap">
          <Search size={15} className="search-icon" strokeWidth={2} />
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nom, barcode, IKPU, shartnoma yoki faktura bo'yicha qidiring…" />
          {search && <button className="clear-btn" onClick={() => setSearch("")} aria-label="Tozalash"><X size={14} /></button>}
        </div>

        <div className="table-card">
          {filtered.length === 0 ? (
            <div className="state-box">
              <Package size={40} strokeWidth={1} className="text-muted" />
              <p>{search ? `"${search}" bo'yicha hech narsa topilmadi` : "Mahsulot yo'q. Birinchisini qo'shing!"}</p>
              {!search && (
                <button className="btn-primary" onClick={() => setAddModal(true)}><Plus size={15} /> Mahsulot qo'shish</button>
              )}
            </div>
          ) : (
            <table className="main-table">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th className="center">Partiyalar</th>
                  <th className="center">Jami miqdor</th>
                  <th className="center">Holat</th>
                  <th className="center">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <ProductRow
                    key={p.id} product={p}
                    onEditProduct={setEditProductModal}
                    onDeleteProduct={handleDeleteProduct}
                    onAddBatch={setAddBatchModal}
                    onEditBatch={setEditBatchModal}
                    onDeleteBatch={handleDeleteBatch}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {addModal && (
        <AddProductWithBatchModal
          saving={saving} setSaving={setSaving} showToast={showToast}
          onCreateProduct={createProduct} onCreateBatch={createBatch}
          onCancel={() => setAddModal(false)}
        />
      )}
      {editProductModal && (
        <Modal title="Mahsulotni tahrirlash" onClose={() => setEditProductModal(null)} wide>
          <ProductForm initial={editProductModal} onSave={handleUpdateProduct}
            onCancel={() => setEditProductModal(null)} saving={saving} />
        </Modal>
      )}
      {addBatchModal && (
        <Modal title={`Partiya qo'shish — ${addBatchModal.name}`} onClose={() => setAddBatchModal(null)} wide>
          <BatchForm productId={addBatchModal.id} onSave={handleCreateBatch}
            onCancel={() => setAddBatchModal(null)} saving={saving} />
        </Modal>
      )}
      {editBatchModal && (
        <Modal title="Partiyani tahrirlash" onClose={() => setEditBatchModal(null)} wide>
          <BatchForm productId={editBatchModal.productId} initial={editBatchModal}
            onSave={handleUpdateBatch} onCancel={() => setEditBatchModal(null)} saving={saving} />
        </Modal>
      )}
    </>
  );
};

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .page { padding: 32px 28px; margin: 0 auto; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; background: #f6f8fc; min-height: 100vh; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .header-text h1 { font-size: 24px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }
  .h1-icon { color: #2563eb; flex-shrink: 0; }
  .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .btn-primary { display: inline-flex; align-items: center; gap: 7px; background: #2563eb; color: #fff; border: none; border-radius: 10px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s, box-shadow 0.15s; white-space: nowrap; box-shadow: 0 1px 3px rgba(37,99,235,0.25); }
  .btn-primary:hover:not(:disabled) { background: #1d4ed8; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
  .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; box-shadow: none; }
  .btn-secondary { display: inline-flex; align-items: center; gap: 6px; background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
  .btn-secondary:hover { background: #e2e8f0; }
  .link-btn { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; color: #2563eb; cursor: pointer; font-size: 13px; font-weight: 500; padding: 0; text-decoration: underline; text-underline-offset: 3px; }
  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px; }
  .stat-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; }
  .stat-icon-wrap { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .stat-icon-blue   { background: #eff6ff; color: #2563eb; }
  .stat-icon-violet { background: #f5f3ff; color: #7c3aed; }
  .stat-icon-teal   { background: #f0fdfa; color: #0d9488; }
  .stat-icon-red    { background: #fef2f2; color: #dc2626; }
  .stat-icon-gray   { background: #f8fafc; color: #94a3b8; }
  .stat-value { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
  .stat-label { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .barcode-search-wrap { position: relative; margin-bottom: 10px; }
  .barcode-search-inner { display: flex; align-items: center; background: #fff; border: 2px solid #2563eb; border-radius: 11px; transition: box-shadow 0.15s; }
  .barcode-search-inner:focus-within { box-shadow: 0 0 0 3px #dbeafe; }
  .bs-icon { margin-left: 14px; color: #2563eb; flex-shrink: 0; }
  .barcode-input { flex: 1; border: none; outline: none; padding: 11px 12px; font-size: 14px; background: transparent; color: #0f172a; font-family: inherit; }
  .barcode-input::placeholder { color: #93c5fd; }
  .bs-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,0.12); z-index: 100; overflow: hidden; }
  .bs-item { display: block; width: 100%; padding: 11px 16px; border: none; background: none; cursor: pointer; text-align: left; transition: background 0.1s; border-bottom: 1px solid #f1f5f9; }
  .bs-item:last-child { border-bottom: none; }
  .bs-item:hover { background: #f0f7ff; }
  .bs-name { font-size: 14px; font-weight: 600; color: #0f172a; }
  .bs-meta { display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
  .bs-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; padding: 2px 7px; border-radius: 5px; font-family: monospace; }
  .bs-badge.bc   { background: #eff6ff; color: #1d4ed8; }
  .bs-badge.ikpu { background: #f5f3ff; color: #6d28d9; }
  .search-wrap { position: relative; display: flex; align-items: center; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 11px; margin-bottom: 14px; transition: border-color 0.15s, box-shadow 0.15s; }
  .search-wrap:focus-within { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
  .search-icon { margin-left: 14px; color: #cbd5e1; flex-shrink: 0; }
  .search-input { flex: 1; border: none; outline: none; padding: 12px 12px; font-size: 14px; background: transparent; color: #0f172a; }
  .search-input::placeholder { color: #cbd5e1; }
  .clear-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0 14px; display: flex; align-items: center; }
  .clear-btn:hover { color: #475569; }
  .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 72px 24px; color: #94a3b8; font-size: 15px; }
  .state-box p { color: #94a3b8; }
  .text-muted { color: #cbd5e1; }
  .main-table { width: 100%; border-collapse: collapse; }
  .main-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
  .main-table th { padding: 13px 18px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; text-align: left; }
  .main-table th.center { text-align: center; }
  .main-table td.center { text-align: center; }
  .product-row { border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.12s; }
  .product-row:hover { background: #f0f7ff; }
  .product-row-open { background: #f0f7ff; border-bottom-color: #dbeafe; }
  .product-row td { padding: 14px 18px; font-size: 14px; color: #334155; vertical-align: middle; }
  .product-name-cell { display: flex; align-items: flex-start; gap: 8px; }
  .chevron { display: flex; align-items: center; color: #cbd5e1; transition: transform 0.2s, color 0.2s; flex-shrink: 0; margin-top: 2px; }
  .chevron.open { transform: rotate(90deg); color: #2563eb; }
  .product-name { font-weight: 700; color: #0f172a; }
  .product-meta { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }
  .badge-barcode { display: inline-flex; align-items: center; gap: 3px; background: #f1f5f9; color: #64748b; font-size: 10px; padding: 2px 7px; border-radius: 5px; font-family: monospace; }
  .badge-ikpu { display: inline-flex; align-items: center; gap: 3px; background: #f5f3ff; color: #6d28d9; font-size: 10px; padding: 2px 7px; border-radius: 5px; font-family: monospace; }
  .badge-mfr  { display: inline-flex; align-items: center; gap: 3px; background: #f0fdf4; color: #166534; font-size: 10px; padding: 2px 7px; border-radius: 5px; }
  .count-chip { display: inline-flex; align-items: center; gap: 4px; background: #f5f3ff; color: #7c3aed; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
  .total-qty { font-size: 15px; color: #0f172a; }
  .badge-status { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
  .badge-status.red    { background: #fee2e2; color: #dc2626; }
  .badge-status.yellow { background: #fef9c3; color: #b45309; }
  .badge-status.green  { background: #dcfce7; color: #16a34a; }
  .badge-status.gray   { background: #f1f5f9; color: #94a3b8; }
  .row-actions { display: flex; gap: 6px; justify-content: flex-end; }
  .icon-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; width: 34px; height: 34px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; color: #64748b; flex-shrink: 0; }
  .icon-btn.add   { border-color: #bfdbfe; color: #2563eb; background: #eff6ff; }
  .icon-btn.add:hover  { background: #dbeafe; border-color: #2563eb; }
  .icon-btn.edit:hover { background: #fefce8; border-color: #f59e0b; color: #b45309; }
  .icon-btn.del:hover  { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
  .batch-panel > td { padding: 0 !important; background: #f8fafc; border-bottom: 2px solid #dbeafe; }
  .empty-batches { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px; color: #94a3b8; font-size: 14px; }
  .empty-icon { color: #cbd5e1; margin-bottom: 4px; }
  .batch-table { width: 100%; border-collapse: collapse; }
  .batch-table thead tr { background: #eff6ff; }
  .batch-table th { padding: 10px 18px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #7c3aed; border-bottom: 1px solid #dbeafe; text-align: left; }
  .batch-table tbody tr { border-bottom: 1px solid #e2e8f0; transition: background 0.1s; }
  .batch-table tbody tr:last-child { border-bottom: none; }
  .batch-table tbody tr:hover { background: #f0f7ff; }
  .batch-table td { padding: 12px 18px; font-size: 13px; color: #334155; vertical-align: middle; }
  .row-expired td { background: #fff5f5 !important; }
  .row-soon    td { background: #fffbeb !important; }
  .series-cell { display: flex; flex-direction: column; gap: 4px; }
  .badge-series { display: inline-flex; align-items: center; gap: 4px; background: #ede9fe; color: #6d28d9; font-family: monospace; font-size: 11px; padding: 3px 8px; border-radius: 5px; font-weight: 700; width: fit-content; }
  .badge-box-series { display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; color: #2563eb; font-family: monospace; font-size: 10px; padding: 2px 7px; border-radius: 5px; font-weight: 600; width: fit-content; }
  .doc-cell { display: flex; flex-direction: column; gap: 3px; }
  .doc-badge { display: inline-flex; align-items: center; gap: 3px; background: #f0fdf4; color: #166534; font-family: monospace; font-size: 10px; padding: 2px 7px; border-radius: 5px; font-weight: 600; width: fit-content; }
  .doc-badge.inv { background: #fff7ed; color: #9a3412; }
  .qty-pill { display: inline-block; background: #f1f5f9; color: #334155; font-weight: 700; font-size: 13px; padding: 2px 10px; border-radius: 20px; }
  .mono { font-family: 'JetBrains Mono', 'Fira Mono', monospace; }
  .price-col { color: #0f172a; font-weight: 600; }
  .expiry-pill { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
  .exp-green  { background: #dcfce7; color: #16a34a; }
  .exp-yellow { background: #fef9c3; color: #b45309; }
  .exp-red    { background: #fee2e2; color: #dc2626; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 16px; }
  .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 520px; box-shadow: 0 32px 80px rgba(0,0,0,0.2); animation: popIn 0.18s ease; overflow: hidden; max-height: 90vh; overflow-y: auto; }
  .modal-wide { max-width: 680px; }
  @keyframes popIn { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 22px 24px 0; position: sticky; top: 0; background: #fff; z-index: 1; }
  .modal-header h2 { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; }
  .modal-close { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: background 0.15s; }
  .modal-close:hover { background: #e2e8f0; color: #0f172a; }
  .step-bar { display: flex; align-items: center; gap: 8px; padding: 18px 24px 0; }
  .step-item { display: flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; color: #94a3b8; }
  .step-item.done   { color: #16a34a; }
  .step-item.active { color: #2563eb; }
  .step-dot { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #94a3b8; transition: all 0.2s; }
  .step-item.done   .step-dot { background: #dcfce7; border-color: #16a34a; color: #16a34a; }
  .step-item.active .step-dot { background: #2563eb; border-color: #2563eb; color: #fff; }
  .step-line { flex: 1; height: 2px; background: #e2e8f0; border-radius: 2px; transition: background 0.2s; }
  .active-line { background: #2563eb; }
  .form-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
  .form-error { display: flex; align-items: center; gap: 7px; background: #fef2f2; color: #dc2626; font-size: 13px; padding: 10px 14px; border-radius: 9px; border: 1px solid #fecaca; }
  .section-divider { display: flex; align-items: center; gap: 10px; margin: 4px 0 2px; }
  .section-divider span { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; white-space: nowrap; }
  .section-divider::before,.section-divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #475569; letter-spacing: 0.02em; text-transform: uppercase; }
  .field-label svg { color: #94a3b8; }
  .field-hint { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .req { color: #ef4444; margin-left: 1px; }
  .input { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px 13px; font-size: 14px; outline: none; color: #0f172a; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; font-family: inherit; }
  .input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
  .input::placeholder { color: #cbd5e1; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
  .series-info-box { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 11px; padding: 12px 14px; }
  .sib-row { display: flex; gap: 16px; flex-wrap: wrap; }
  .sib-item { display: flex; align-items: flex-start; gap: 8px; flex: 1; min-width: 160px; }
  .sib-icon { margin-top: 2px; flex-shrink: 0; }
  .sib-blue   { color: #2563eb; }
  .sib-violet { color: #7c3aed; }
  .sib-label { font-size: 12px; font-weight: 700; color: #334155; }
  .sib-desc  { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .batch-product-chip { display: inline-flex; align-items: center; gap: 6px; background: #eff6ff; color: #2563eb; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 8px; border: 1px solid #bfdbfe; align-self: flex-start; }
  .skip-hint { text-align: center; padding: 0 24px 20px; }
  .toast { position: fixed; bottom: 28px; right: 28px; z-index: 2000; padding: 14px 18px; border-radius: 14px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; box-shadow: 0 12px 40px rgba(0,0,0,0.18); animation: slideUp 0.22s ease; max-width: 360px; }
  .toast-success { background: #0f172a; color: #fff; }
  .toast-error   { background: #dc2626; color: #fff; }
  .toast-icon { display: flex; align-items: center; flex-shrink: 0; }
  .toast-close { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.7); padding: 0; margin-left: auto; display: flex; align-items: center; }
  .toast-close:hover { color: #fff; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  .spin { animation: spinAnim 0.7s linear infinite; }
  @keyframes spinAnim { to { transform: rotate(360deg); } }
  @media (max-width: 640px) {
    .page { padding: 20px 14px; }
    .stats-row { grid-template-columns: 1fr 1fr; }
    .form-row  { grid-template-columns: 1fr; }
    .modal-box { border-radius: 16px; }
    .page-header { flex-direction: column; align-items: flex-start; }
    .sib-row { flex-direction: column; gap: 10px; }
  }
`;