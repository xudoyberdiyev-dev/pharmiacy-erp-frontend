import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, X, Plus, Pencil, Trash2, ChevronRight,
  Package, Layers, AlertTriangle, Clock, CheckCircle,
  BoxSelect, FlaskConical, Hash, Tag, Calendar,
  Banknote, Archive, Loader2, QrCode,
  ScanBarcode, FileCode, Building2, Ruler,
  Star, StarOff, Barcode, ChevronLeft, Eye,
  MoreHorizontal, Filter,
} from "lucide-react";
import { Pagination } from "../../components/pagination/Pagination";
import ToastStack from "../../components/toast/Toast";
import useToast from "../../components/toast/useToast";
import { PageHeader } from "../../components/pageHeader/PageHeader";
import { StatCard } from "../../components/StatCard";
import BarcodeSearch from "../../components/barcodeSearch/BarcodeSearch";
import SearchInput from "../../components/searchInput/SearchInput";
import './product.css'
// ─── MOCK DATA ────────────────────────────────────────────────
let mockIdCounter = 300;

const makeDate = (daysFromNow) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
};

const initialProducts = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    ikpuCode: "10006001001000000",
    manufacturer: "Medexport UZ",
    unit: "dona",
    barcodes: [
      { id: 1, barcode: "4780123456789", isPrimary: true },
      { id: 2, barcode: "4780123456790", isPrimary: false },
    ],
    batches: [
      { id: 1, productId: 1, series: "478001167783021", boxSeries: "MK-2026-001", mg: "500mg", quantity: 240, remainingQty: 180, price: 12000, expiry: makeDate(365), contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0892" },
      { id: 2, productId: 1, series: "478001167783022", boxSeries: "MK-2026-002", mg: "500mg", quantity: 18,  remainingQty: 18,  price: 12500, expiry: makeDate(18),  contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0910" },
    ],
    _count: { batches: 2, saleItems: 14 },
  },
  {
    id: 2,
    name: "Paracetamol 500mg",
    ikpuCode: "10006001001000000",
    manufacturer: "Medexport UZ",
    unit: "dona",
    barcodes: [
      { id: 1, barcode: "4780123456789", isPrimary: true },
      { id: 2, barcode: "4780123456790", isPrimary: false },
    ],
    batches: [
      { id: 1, productId: 1, series: "478001167783021", boxSeries: "MK-2026-001", mg: "500mg", quantity: 240, remainingQty: 180, price: 12000, expiry: makeDate(365), contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0892" },
      { id: 2, productId: 1, series: "478001167783022", boxSeries: "MK-2026-002", mg: "500mg", quantity: 18,  remainingQty: 18,  price: 12500, expiry: makeDate(18),  contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0910" },
    ],
    _count: { batches: 2, saleItems: 14 },
  },
  {
    id: 3,
    name: "Paracetamol 500mg",
    ikpuCode: "10006001001000000",
    manufacturer: "Medexport UZ",
    unit: "dona",
    barcodes: [
      { id: 1, barcode: "4780123456789", isPrimary: true },
      { id: 2, barcode: "4780123456790", isPrimary: false },
    ],
    batches: [
      { id: 1, productId: 1, series: "478001167783021", boxSeries: "MK-2026-001", mg: "500mg", quantity: 240, remainingQty: 180, price: 12000, expiry: makeDate(365), contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0892" },
      { id: 2, productId: 1, series: "478001167783022", boxSeries: "MK-2026-002", mg: "500mg", quantity: 18,  remainingQty: 18,  price: 12500, expiry: makeDate(18),  contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0910" },
    ],
    _count: { batches: 2, saleItems: 14 },
  },
  {
    id: 4,
    name: "Paracetamol 500mg",
    ikpuCode: "10006001001000000",
    manufacturer: "Medexport UZ",
    unit: "dona",
    barcodes: [
      { id: 1, barcode: "4780123456789", isPrimary: true },
      { id: 2, barcode: "4780123456790", isPrimary: false },
    ],
    batches: [
      { id: 1, productId: 1, series: "478001167783021", boxSeries: "MK-2026-001", mg: "500mg", quantity: 240, remainingQty: 180, price: 12000, expiry: makeDate(365), contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0892" },
      { id: 2, productId: 1, series: "478001167783022", boxSeries: "MK-2026-002", mg: "500mg", quantity: 18,  remainingQty: 18,  price: 12500, expiry: makeDate(18),  contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0910" },
    ],
    _count: { batches: 2, saleItems: 14 },
  },
  {
    id: 5,
    name: "Amoxicillin 250mg",
    ikpuCode: "10006001002000000",
    manufacturer: "Pharmaville LLC",
    unit: "qadoq",
    barcodes: [
      { id: 3, barcode: "4780198765432", isPrimary: true },
    ],
    batches: [
      { id: 3, productId: 2, series: "478019988771", boxSeries: null, mg: "250mg", quantity: 80, remainingQty: 55, price: 24000, expiry: makeDate(160), contractNumber: "SH-2026-031", invoiceNumber: "F-2026-0411" },
    ],
    _count: { batches: 1, saleItems: 7 },
  },
  {
    id: 6,
    name: "Ibuprofen 400mg",
    ikpuCode: "",
    manufacturer: "",
    unit: "dona",
    barcodes: [],
    batches: [],
    _count: { batches: 0, saleItems: 0 },
  },
  {
    id: 7,
    name: "Vitamin C 1000mg",
    ikpuCode: "10006001003000000",
    manufacturer: "VitaPharm",
    unit: "dona",
    barcodes: [
      { id: 4, barcode: "4780111222333", isPrimary: true },
    ],
    batches: [
      { id: 4, productId: 4, series: "478011199001", boxSeries: "MK-2025-450", mg: "1000mg", quantity: 5, remainingQty: 5, price: 18000, expiry: makeDate(3), contractNumber: "SH-2025-188", invoiceNumber: "F-2025-2201" },
    ],
    _count: { batches: 1, saleItems: 2 },
  },
  {
    id: 8,
    name: "Metformin 500mg",
    ikpuCode: "10006001004000000",
    manufacturer: "UzPharm",
    unit: "dona",
    barcodes: [
      { id: 5, barcode: "4780999888777", isPrimary: true },
    ],
    batches: [
      { id: 5, productId: 5, series: "990011223344", boxSeries: "MK-2026-100", mg: "500mg", quantity: 200, remainingQty: 120, price: 8500, expiry: makeDate(400), contractNumber: "SH-2026-010", invoiceNumber: "F-2026-0100" },
      { id: 6, productId: 5, series: "990011223345", boxSeries: null, mg: "500mg", quantity: 100, remainingQty: 0,   price: 8000, expiry: makeDate(-10), contractNumber: "SH-2025-300", invoiceNumber: "F-2025-3001" },
    ],
    _count: { batches: 2, saleItems: 31 },
  },
  {
    id: 9,
    name: "Aspirin 100mg",
    ikpuCode: "10006001005000000",
    manufacturer: "Bayer AG",
    unit: "blister",
    barcodes: [
      { id: 6, barcode: "4007221011507", isPrimary: true },
    ],
    batches: [
      { id: 7, productId: 6, series: "BAY2026001", boxSeries: "MK-2026-BAY", mg: "100mg", quantity: 60, remainingQty: 60, price: 6500, expiry: makeDate(500), contractNumber: "SH-2026-020", invoiceNumber: "F-2026-0200" },
    ],
    _count: { batches: 1, saleItems: 5 },
  },
];

const UNITS = ["dona", "qadoq", "blister", "shisha", "ampula", "gramm", "ml", "kg"];
const PAGE_SIZE = 8;

const formatDate  = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";
const formatPrice = (p) => Number(p).toLocaleString("uz-UZ") + " so'm";

const isExpired     = (e) => e && new Date(e) < new Date();
const isExpiringSoon = (e) => { if (!e) return false; const d = (new Date(e)-new Date())/86400000; return d>0&&d<=30; };
const daysLeft      = (e) => e ? Math.ceil((new Date(e)-new Date())/86400000) : null;


// ─── Modal ────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, wide, xl }) {
  useEffect(()=>{
    const fn=e=>e.key==="Escape"&&onClose();
    document.addEventListener("keydown",fn);
    return ()=>document.removeEventListener("keydown",fn);
  },[onClose]);
  return (
    <div className="p-overlay" onClick={onClose}>
      <div className={`p-modal${wide?" p-modal-wide":""}${xl?" p-modal-xl":""}`} onClick={e=>e.stopPropagation()}>
        <div className="p-modal-hdr">
          <div>
            <div className="p-modal-title">{title}</div>
            {subtitle&&<div className="p-modal-sub">{subtitle}</div>}
          </div>
          <button className="p-modal-x" onClick={onClose}><X size={15}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────
function Field({ label, icon:Icon, required, hint, error, children }) {
  return (
    <div className="p-field">
      <label className="p-label">
        {Icon&&<Icon size={12} strokeWidth={2.5}/>}
        {label}{required&&<span style={{color:"#ef4444"}}>*</span>}
      </label>
      {children}
      {error&&<span className="p-field-err"><AlertTriangle size={11}/>{error}</span>}
      {hint&&!error&&<span className="p-field-hint">{hint}</span>}
    </div>
  );
}



// ─── Product Form ─────────────────────────────────────────────
function ProductForm({ initial={}, onSave, onCancel, saving }) {
  const [name,         setName]   = useState(initial.name||"");
  const [ikpuCode,     setIkpu]   = useState(initial.ikpuCode||"");
  const [manufacturer, setMfr]    = useState(initial.manufacturer||"");
  const [unit,         setUnit]   = useState(initial.unit||"dona");
  const [barcodes,     setBc]     = useState(
    initial.barcodes?.length ? initial.barcodes.map(b=>({...b})) : [{ tempId: Date.now(), barcode:"", isPrimary:true }]
  );
  const [errors,       setErrors] = useState({});
  const firstRef = useRef();
  useEffect(()=>{ firstRef.current?.focus(); },[]);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Mahsulot nomi kiritilsin";
    barcodes.forEach((b,i)=>{
      if (b.barcode&&!/^\d{8,14}$/.test(b.barcode.replace(/\s/g,""))) e[`bc${i}`]="8–14 raqam";
    });
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({
      name: name.trim(),
      ikpuCode: ikpuCode.trim(),
      manufacturer: manufacturer.trim(),
      unit,
      barcodes: barcodes.filter(b=>b.barcode.trim()).map(b=>({ barcode: b.barcode.trim(), isPrimary: b.isPrimary })),
    });
  };

  const addBc = () => setBc(p=>[...p, { tempId: Date.now(), barcode:"", isPrimary:false }]);
  const setAsPrimary = (idx) => setBc(p=>p.map((b,i)=>({...b, isPrimary:i===idx})));
  const removeBc = (idx) => {
    const next = barcodes.filter((_,i)=>i!==idx);
    if (next.length && !next.some(b=>b.isPrimary)) next[0].isPrimary = true;
    setBc(next);
  };

  return (
    <div className="p-form-body">
      <Field label="Mahsulot nomi" icon={Package} required error={errors.name}>
        <input ref={firstRef} className={`p-input${errors.name?" p-input-err":""}`}
          value={name} onChange={e=>{setName(e.target.value);setErrors(p=>({...p,name:""}));}}
          onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Masalan: Paracetamol 500mg"/>
      </Field>
      <div className="p-form-row2">
        <Field label="IKPU kodi" icon={FileCode} hint="Tovar nomenklaturasi">
          <input className="p-input p-mono" value={ikpuCode} onChange={e=>setIkpu(e.target.value)}
            placeholder="10006001001000000"/>
        </Field>
        <Field label="O'lchov birligi" icon={Ruler}>
          <select className="p-input" value={unit} onChange={e=>setUnit(e.target.value)}>
            {UNITS.map(u=><option key={u}>{u}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Ishlab chiqaruvchi" icon={Building2}>
        <input className="p-input" value={manufacturer} onChange={e=>setMfr(e.target.value)}
          placeholder="Kompaniya nomi"/>
      </Field>

      {/* Barcodes */}
      <div className="p-section-hdr"><Barcode size={12}/>Barkodlar</div>
      {barcodes.map((b,i)=>(
        <div key={b.id||b.tempId} className="p-bc-row">
          <div className="p-bc-input-wrap">
            <Hash size={12} style={{color:"#94a3b8",flexShrink:0}}/>
            <input className={`p-input p-mono p-bc-input${errors[`bc${i}`]?" p-input-err":""}`}
              value={b.barcode}
              onChange={e=>{ setBc(p=>p.map((x,j)=>j===i?{...x,barcode:e.target.value}:x)); setErrors(p=>({...p,[`bc${i}`]:""})); }}
              placeholder="4780123456789"/>
          </div>
          <button
            className={`p-primary-btn${b.isPrimary?" p-primary-on":""}`}
            onClick={()=>setAsPrimary(i)} type="button" title="Asosiy qilish">
            {b.isPrimary?<Star size={13} strokeWidth={2.5}/>:<StarOff size={13} strokeWidth={2}/>}
          </button>
          {barcodes.length>1&&(
            <button className="p-bc-del" onClick={()=>removeBc(i)} type="button"><X size={12}/></button>
          )}
          {errors[`bc${i}`]&&<span className="p-bc-err"><AlertTriangle size={10}/>{errors[`bc${i}`]}</span>}
        </div>
      ))}
      <button className="p-add-bc-btn" onClick={addBc} type="button"><Plus size={12}/>Barkod qo'shish</button>

      <div className="p-form-actions">
        <button className="p-btn-ghost" onClick={onCancel} type="button">Bekor qilish</button>
        <button className="p-btn-primary" onClick={submit} disabled={saving} type="button">
          {saving?<><Loader2 size={14} className="p-spin"/>Saqlanmoqda…</>:<><CheckCircle size={14}/>{initial.id?"Saqlash":"Qo'shish"}</>}
        </button>
      </div>
    </div>
  );
}

// ─── Batch Form ───────────────────────────────────────────────
function BatchForm({ productId, productName, initial={}, onSave, onCancel, saving }) {
  const [series,    setSeries]  = useState(initial.series||"");
  const [boxSeries, setBox]     = useState(initial.boxSeries||"");
  const [mg,        setMg]      = useState(initial.mg||"");
  const [qty,       setQty]     = useState(initial.quantity??initial.remainingQty??"");
  const [price,     setPrice]   = useState(initial.price??"");
  const [expiry,    setExpiry]  = useState(initial.expiry?new Date(initial.expiry).toISOString().split("T")[0]:"");
  const [contract,  setContract]= useState(initial.contractNumber||"");
  const [invoice,   setInvoice] = useState(initial.invoiceNumber||"");
  const [errors,    setErrors]  = useState({});
  const firstRef = useRef();
  useEffect(()=>{ firstRef.current?.focus(); },[]);

  const validate = () => {
    const e = {};
    if (!series.trim())    e.series = "Seriya majburiy";
    if (!mg.trim())        e.mg     = "Dozaj majburiy";
    if (qty==="")          e.qty    = "Miqdor kiritilsin";
    if (price==="")        e.price  = "Narx kiritilsin";
    if (!expiry)           e.expiry = "Muddat kiritilsin";
    if (Number(qty)<0)     e.qty    = "Manfiy bo'lmaydi";
    if (Number(price)<0)   e.price  = "Manfiy bo'lmaydi";
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ productId:Number(productId), series:series.trim(), boxSeries:boxSeries.trim()||null,
      mg:mg.trim(), quantity:Number(qty), remainingQty:Number(qty),
      price:Number(price), expiry, contractNumber:contract.trim(), invoiceNumber:invoice.trim() });
  };

  const inp = (val, set, field) => (e)=>{ set(e.target.value); setErrors(p=>({...p,[field]:""})); };

  return (
    <div className="p-form-body">
      {productName&&(
        <div className="p-product-chip"><Package size={11}/>{productName}</div>
      )}

      <div className="p-section-label">Hujjatlar</div>
      <div className="p-form-row2">
        <Field label="Shartnoma raqami" icon={Tag} hint="Kirish shartnomasi">
          <input className="p-input p-mono" value={contract} onChange={inp(contract,setContract,"contract")} placeholder="SH-2026-001"/>
        </Field>
        <Field label="Faktura raqami" icon={Tag} hint="Yetkazib beruvchi fakturasi">
          <input className="p-input p-mono" value={invoice} onChange={inp(invoice,setInvoice,"invoice")} placeholder="F-2026-0001"/>
        </Field>
      </div>

      <div className="p-section-label">Seriya / Marking</div>
      <div className="p-series-info">
        <div className="p-si-item"><Tag size={12} style={{color:"#2563eb"}}/>
          <div><div className="p-si-title">Drug series <span style={{color:"#ef4444"}}>*</span></div>
            <div className="p-si-desc">Quti tashqi barkodidagi seriya raqami</div></div>
        </div>
        <div className="p-si-item"><QrCode size={12} style={{color:"#7c3aed"}}/>
          <div><div className="p-si-title">Marking series (QR)</div>
            <div className="p-si-desc">Marking QR kod seriyasi (ixtiyoriy)</div></div>
        </div>
      </div>
      <div className="p-form-row2">
        <Field label="Dori seriyasi" icon={Tag} required error={errors.series}>
          <input ref={firstRef} className={`p-input p-mono${errors.series?" p-input-err":""}`}
            value={series} onChange={inp(series,setSeries,"series")} placeholder="478001167783021"/>
        </Field>
        <Field label="QR seriyasi" icon={QrCode} hint="Ixtiyoriy">
          <input className="p-input p-mono" value={boxSeries} onChange={inp(boxSeries,setBox,"boxSeries")} placeholder="MK-2026-001"/>
        </Field>
      </div>

      <div className="p-section-label">Partiya ma'lumotlari</div>
      <div className="p-form-row2">
        <Field label="Dozaj" icon={FlaskConical} required error={errors.mg}>
          <input className={`p-input${errors.mg?" p-input-err":""}`} value={mg}
            onChange={inp(mg,setMg,"mg")} placeholder="500mg"/>
        </Field>
        <Field label="Miqdor" icon={BoxSelect} required error={errors.qty}>
          <input className={`p-input${errors.qty?" p-input-err":""}`} type="number" min="0"
            value={qty} onChange={inp(qty,setQty,"qty")} placeholder="100"/>
        </Field>
      </div>
      <div className="p-form-row2">
        <Field label="Narx (so'm)" icon={Banknote} required error={errors.price}>
          <input className={`p-input${errors.price?" p-input-err":""}`} type="number" min="0"
            value={price} onChange={inp(price,setPrice,"price")} placeholder="15000"/>
        </Field>
        <Field label="Yaroqlilik muddati" icon={Calendar} required error={errors.expiry}>
          <input className={`p-input${errors.expiry?" p-input-err":""}`} type="date"
            value={expiry} onChange={inp(expiry,setExpiry,"expiry")}/>
        </Field>
      </div>

      <div className="p-form-actions">
        <button className="p-btn-ghost" onClick={onCancel} type="button">Bekor qilish</button>
        <button className="p-btn-primary" onClick={submit} disabled={saving} type="button">
          {saving?<><Loader2 size={14} className="p-spin"/>Saqlanmoqda…</>:<><CheckCircle size={14}/>{initial.id?"Saqlash":"Partiya qo'shish"}</>}
        </button>
      </div>
    </div>
  );
}

// ─── Add Product (2-step wizard) ──────────────────────────────
function AddProductWizard({ onCreateProduct, onCreateBatch, onCancel, saving, setSaving, toast }) {
  const [step, setStep]  = useState(1);
  const [prod, setProd]  = useState(null);

  const handleProduct = (data) => {
    setSaving(true);
    setTimeout(()=>{
      const p = onCreateProduct(data);
      setProd(p);
      setStep(2);
      setSaving(false);
    },450);
  };

  const handleBatch = (data) => {
    setSaving(true);
    setTimeout(()=>{
      onCreateBatch(data);
      toast("Mahsulot va partiya qo'shildi!");
      onCancel();
      setSaving(false);
    },450);
  };

  const skipBatch = () => { toast("Mahsulot qo'shildi (partiyasiz)"); onCancel(); };

  return (
    <Modal title={step===1?"Yangi mahsulot":"Partiya qo'shish"} subtitle={step===2?prod?.name:undefined} onClose={onCancel} xl>
      {/* Step bar */}
      <div className="p-stepbar">
        <div className={`p-step${step>=1?" p-step-done":""}`}>
          <div className="p-step-dot">{step>1?<CheckCircle size={13}/>:<span>1</span>}</div>
          <span>Mahsulot</span>
        </div>
        <div className={`p-step-line${step>=2?" p-step-line-on":""}`}/>
        <div className={`p-step${step>=2?" p-step-active":""}`}>
          <div className="p-step-dot"><span>2</span></div>
          <span>Partiya</span>
        </div>
      </div>
      {step===1
        ? <ProductForm onSave={handleProduct} onCancel={onCancel} saving={saving}/>
        : <>
            <BatchForm productId={prod.id} productName={prod.name} onSave={handleBatch} onCancel={skipBatch} saving={saving}/>
            <div style={{textAlign:"center",padding:"0 24px 18px"}}>
              <button className="p-link-btn" onClick={skipBatch}>Hozircha partiyasiz saqlash →</button>
            </div>
          </>
      }
    </Modal>
  );
}

// ─── Barcode Manager Modal ────────────────────────────────────
function BarcodeModal({ product, onClose, onAdd, onSetPrimary, onDelete }) {
  const [bcVal,  setBcVal]  = useState("");
  const [isPrim, setIsPrim] = useState(false);
  const [adding, setAdding] = useState(false);
  const [err,    setErr]    = useState("");

  const submit = () => {
    if (!bcVal.trim()) { setErr("Barcode kiritilsin"); return; }
    if (!/^\d{8,14}$/.test(bcVal.trim())) { setErr("8–14 raqam bo'lishi kerak"); return; }
    setAdding(true);
    setTimeout(()=>{
      onAdd(product.id, { barcode:bcVal.trim(), isPrimary:isPrim });
      setBcVal(""); setIsPrim(false); setAdding(false);
    },350);
  };

  return (
    <Modal title="Barkodlarni boshqarish" subtitle={product.name} onClose={onClose} wide>
      <div className="p-form-body">
        {/* Existing barcodes */}
        {product.barcodes.length===0
          ? <div className="p-bc-empty"><Barcode size={28} strokeWidth={1} style={{color:"#e2e8f0"}}/><span>Barkod yo'q</span></div>
          : (
            <div className="p-bc-list">
              {product.barcodes.map(b=>(
                <div key={b.id} className={`p-bc-card${b.isPrimary?" p-bc-primary":""}`}>
                  <div className="p-bc-card-left">
                    {b.isPrimary&&<span className="p-primary-badge"><Star size={9}/>Asosiy</span>}
                    <span className="p-bc-val p-mono">{b.barcode}</span>
                  </div>
                  <div className="p-bc-card-actions">
                    {!b.isPrimary&&(
                      <button className="p-bc-act p-bc-star" onClick={()=>onSetPrimary(product.id,b.id)} title="Asosiy qilish">
                        <Star size={12}/>
                      </button>
                    )}
                    <button className="p-bc-act p-bc-trash" onClick={()=>onDelete(product.id,b.id)}
                      disabled={b.isPrimary} title={b.isPrimary?"Asosiy barcodni o'chirib bo'lmaydi":"O'chirish"}>
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        }

        {/* Add new barcode */}
        <div className="p-section-label" style={{marginTop:4}}>Yangi barkod qo'shish</div>
        {err&&<div className="p-inline-err"><AlertTriangle size={12}/>{err}</div>}
        <div className="p-bc-add-row">
          <input className={`p-input p-mono${err?" p-input-err":""}`}
            value={bcVal} onChange={e=>{setBcVal(e.target.value);setErr("");}}
            onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="4780123456789"/>
          <label className="p-checkbox-lbl">
            <input type="checkbox" checked={isPrim} onChange={e=>setIsPrim(e.target.checked)}/>
            Asosiy
          </label>
          <button className="p-btn-primary" onClick={submit} disabled={adding} style={{whiteSpace:"nowrap"}}>
            {adding?<Loader2 size={13} className="p-spin"/>:<Plus size={13}/>}Qo'shish
          </button>
        </div>

        <div className="p-form-actions" style={{paddingTop:4}}>
          <button className="p-btn-ghost" onClick={onClose}>Yopish</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Stock Modal ──────────────────────────────────────────────
function StockModal({ product, onClose }) {
  const totalRemaining = product.batches.reduce((s,b)=>s+(b.remainingQty??0),0);
  const nearExpiry = product.batches.filter(b=>isExpiringSoon(b.expiry));
  const expired    = product.batches.filter(b=>isExpired(b.expiry));

  return (
    <Modal title="Omborxona holati" subtitle={product.name} onClose={onClose} wide>
      <div className="p-form-body">
        <div className="p-stock-stats">
          <div className="p-ss-card p-ss-blue"><span className="p-ss-val">{totalRemaining}</span><span className="p-ss-lbl">Jami qoldiq ({product.unit})</span></div>
          <div className="p-ss-card p-ss-amber"><span className="p-ss-val">{nearExpiry.length}</span><span className="p-ss-lbl">Muddat yaqinlashmoqda</span></div>
          <div className="p-ss-card p-ss-red"><span className="p-ss-val">{expired.length}</span><span className="p-ss-lbl">Muddati o'tgan</span></div>
        </div>

        {product.batches.length===0
          ? <div className="p-bc-empty"><Package size={28} strokeWidth={1} style={{color:"#e2e8f0"}}/><span>Partiyalar yo'q</span></div>
          : <div className="p-stock-list">
              {product.batches.map(b=>{
                const exp = isExpired(b.expiry);
                const soon = isExpiringSoon(b.expiry);
                const days = daysLeft(b.expiry);
                return (
                  <div key={b.id} className={`p-stock-row${exp?" p-stock-expired":soon?" p-stock-soon":""}`}>
                    <div className="p-stock-left">
                      <span className="p-badge-series"><Tag size={9}/>{b.series}</span>
                      {b.boxSeries&&<span className="p-badge-qr"><QrCode size={9}/>{b.boxSeries}</span>}
                    </div>
                    <div className="p-stock-mid">
                      <span className="p-mg-badge"><FlaskConical size={9}/>{b.mg}</span>
                    </div>
                    <div className="p-stock-right">
                      <span className="p-qty-pill" style={{background:b.remainingQty===0?"#fee2e2":"#f1f5f9", color:b.remainingQty===0?"#dc2626":"#334155"}}>
                        {b.remainingQty??0} qoldi
                      </span>
                      <span className={`p-exp-pill${exp?" p-exp-red":soon?" p-exp-amber":" p-exp-green"}`}>
                        {exp?<AlertTriangle size={10}/>:soon?<Clock size={10}/>:<CheckCircle size={10}/>}
                        {exp?"O'tgan":soon?`${days} kun`:"Yaxshi"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
        }
        <div className="p-form-actions">
          <button className="p-btn-ghost" onClick={onClose}>Yopish</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Batch Table (expanded) ───────────────────────────────────
function BatchTable({ product, onAddBatch, onEditBatch, onDeleteBatch }) {
  if (product.batches.length===0) return (
    <div className="p-empty-batches">
      <Package size={26} strokeWidth={1.2} style={{color:"#cbd5e1"}}/>
      <span>Hali partiya yo'q</span>
      <button className="p-link-btn" onClick={()=>onAddBatch(product)}><Plus size={12}/>Birinchi partiyani qo'shing</button>
    </div>
  );

  return (
    <table className="p-batch-table">
      <thead>
        <tr>
          <th>Seriya / QR</th>
          <th>Shartnoma / Faktura</th>
          <th style={{textAlign:"center"}}>Dozaj</th>
          <th style={{textAlign:"center"}}>Miqdor</th>
          <th style={{textAlign:"center"}}>Qoldiq</th>
          <th style={{textAlign:"right"}}>Narx</th>
          <th style={{textAlign:"center"}}>Muddat</th>
          <th/>
        </tr>
      </thead>
      <tbody>
        {product.batches.map(b=>{
          const exp  = isExpired(b.expiry);
          const soon = isExpiringSoon(b.expiry);
          const days = daysLeft(b.expiry);
          return (
            <tr key={b.id} className={`p-batch-row${exp?" p-batch-exp":soon?" p-batch-soon":""}`}>
              <td>
                <span className="p-badge-series"><Tag size={9}/>{b.series}</span>
                {b.boxSeries&&<span className="p-badge-qr" style={{marginLeft:4}}><QrCode size={9}/>{b.boxSeries}</span>}
              </td>
              <td>
                {b.contractNumber&&<div className="p-doc-badge"><Tag size={9}/>{b.contractNumber}</div>}
                {b.invoiceNumber&&<div className="p-doc-badge p-doc-inv" style={{marginTop:3}}><Hash size={9}/>{b.invoiceNumber}</div>}
              </td>
              <td style={{textAlign:"center"}}><span className="p-mg-badge"><FlaskConical size={9}/>{b.mg}</span></td>
              <td style={{textAlign:"center"}}><span className="p-qty-pill">{b.quantity}</span></td>
              <td style={{textAlign:"center"}}>
                <span className="p-qty-pill" style={{
                  background: b.remainingQty===0?"#fee2e2":b.remainingQty<10?"#fef9c3":"#f0fdf4",
                  color: b.remainingQty===0?"#dc2626":b.remainingQty<10?"#92400e":"#166534",
                }}>
                  {b.remainingQty??0}
                </span>
              </td>
              <td style={{textAlign:"right"}} className="p-mono p-price-col">{formatPrice(b.price)}</td>
              <td style={{textAlign:"center"}}>
                <span className={`p-exp-pill${exp?" p-exp-red":soon?" p-exp-amber":" p-exp-green"}`}>
                  {exp?<AlertTriangle size={10}/>:soon?<Clock size={10}/>:<CheckCircle size={10}/>}
                  {exp?"O'tgan":soon?`${days} kun`:formatDate(b.expiry)}
                </span>
              </td>
              <td>
                <div className="p-row-actions">
                  <button className="p-icon-btn p-edit-btn" onClick={()=>onEditBatch(b)}><Pencil size={13}/></button>
                  <button className="p-icon-btn p-del-btn" onClick={()=>onDeleteBatch(b)}><Trash2 size={13}/></button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Product Row ──────────────────────────────────────────────
function ProductRow({ product, onEditProduct, onDeleteProduct, onAddBatch, onEditBatch, onDeleteBatch, onBarcodes, onStock, idx }) {
  const [open, setOpen] = useState(false);

  const totalQty  = product.batches.reduce((s,b)=>s+(b.remainingQty??0),0);
  const expCount  = product.batches.filter(b=>isExpired(b.expiry)).length;
  const soonCount = product.batches.filter(b=>isExpiringSoon(b.expiry)).length;
  const bLen      = product.batches.length;
  const primary   = product.barcodes.find(b=>b.isPrimary);

  let statusEl;
  if (bLen===0)         statusEl = <span className="p-badge-status p-status-gray"><Archive size={10}/>Partiya yo'q</span>;
  else if (totalQty===0)statusEl = <span className="p-badge-status p-status-gray"><Archive size={10}/>Tugagan</span>;
  else if (expCount>0)  statusEl = <span className="p-badge-status p-status-red"><AlertTriangle size={10}/>{expCount} muddati o'tgan</span>;
  else if (soonCount>0) statusEl = <span className="p-badge-status p-status-amber"><Clock size={10}/>{soonCount} tugayapti</span>;
  else                  statusEl = <span className="p-badge-status p-status-green"><CheckCircle size={10}/>Yaxshi</span>;

  return (
    <>
      <tr className={`p-prod-row${open?" p-prod-open":""}`} style={{"--pi":idx}}>
        <td>
          <div className="p-pname-cell" onClick={()=>setOpen(v=>!v)} style={{cursor:"pointer"}}>
            <span className={`p-chevron${open?" p-chevron-open":""}`}><ChevronRight size={13} strokeWidth={2.5}/></span>
            <div>
              <div className="p-name">{product.name}</div>
              <div className="p-pmeta">
                {primary&&<span className="p-badge-bc"><Hash size={9}/>{primary.barcode}</span>}
                {product.ikpuCode&&<span className="p-badge-ikpu"><FileCode size={9}/>{product.ikpuCode}</span>}
                {product.manufacturer&&<span className="p-badge-mfr"><Building2 size={9}/>{product.manufacturer}</span>}
                {product.unit&&<span className="p-badge-unit"><Ruler size={9}/>{product.unit}</span>}
              </div>
            </div>
          </div>
        </td>
        <td style={{textAlign:"center"}}>
          <span className="p-count-chip"><Layers size={11}/>{bLen}</span>
        </td>
        <td style={{textAlign:"center"}}>
          <strong className={`p-total-qty${totalQty===0?" p-qty-zero":""}`}>{totalQty.toLocaleString("uz-UZ")}</strong>
        </td>
        <td style={{textAlign:"center"}}>{statusEl}</td>
        <td>
          <div className="p-row-actions" style={{justifyContent:"flex-end"}}>
            <button className="p-icon-btn p-add-btn" onClick={()=>onAddBatch(product)} title="Partiya qo'shish"><Plus size={14} strokeWidth={2.5}/></button>
            <button className="p-icon-btn p-bc-btn" onClick={()=>onBarcodes(product)} title="Barkodlar"><Barcode size={13}/></button>
            <button className="p-icon-btn p-stock-btn" onClick={()=>onStock(product)} title="Omborxona holati"><Eye size={13}/></button>
            <button className="p-icon-btn p-edit-btn" onClick={()=>onEditProduct(product)} title="Tahrirlash"><Pencil size={13}/></button>
            <button className="p-icon-btn p-del-btn" onClick={()=>onDeleteProduct(product)} title="O'chirish"><Trash2 size={13}/></button>
          </div>
        </td>
      </tr>
      {open&&(
        <tr className="p-batch-panel">
          <td colSpan={5}>
            <div className="p-batch-panel-inner">
              <BatchTable
                product={product}
                onAddBatch={onAddBatch}
                onEditBatch={onEditBatch}
                onDeleteBatch={onDeleteBatch}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}



// ─── Delete Confirm ───────────────────────────────────────────
function DeleteConfirmModal({ item, type, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);
  const go = () => { setLoading(true); setTimeout(()=>{ onConfirm(); setLoading(false); },400); };
  return (
    <Modal title={`${type==="product"?"Mahsulot":"Partiya"}ni o'chirish`} onClose={onCancel}>
      <div className="p-form-body">
        <div className="p-warn p-warn-red">
          <AlertTriangle size={18} strokeWidth={2}/>
          <div>
            <strong>Bu amalni orqaga qaytarib bo'lmaydi.</strong>
            <p style={{marginTop:4,fontSize:13,lineHeight:1.55}}>
              {type==="product"
                ? `"${item.name}" mahsuloti va uning barcha partiyalari o'chiriladi.`
                : `"${item.series}" seriyali partiya o'chiriladi.`}
            </p>
          </div>
        </div>
        <div className="p-form-actions">
          <button className="p-btn-ghost" onClick={onCancel}>Bekor qilish</button>
          <button className="p-btn-danger" onClick={go} disabled={loading}>
            {loading?<><Loader2 size={14} className="p-spin"/>O'chirilmoqda…</>:<><Trash2 size={14}/>O'chirish</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export const Product = () => {
  const [products,     setProducts]     = useState(initialProducts);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState(null); // null|"ok"|"soon"|"expired"|"empty"
  const [page,         setPage]         = useState(1);
  const [saving,       setSaving]       = useState(false);
  const [addModal,     setAddModal]     = useState(false);
  const [editProduct,  setEditProduct]  = useState(null);
  const [addBatch,     setAddBatch]     = useState(null);
  const [editBatch,    setEditBatch]    = useState(null);
  const [barcodeModal, setBarcodeModal] = useState(null);
  const [stockModal,   setStockModal]   = useState(null);
  const [delProduct,   setDelProduct]   = useState(null);
  const [delBatch,     setDelBatch]     = useState(null);
  const { toasts, add:toast, remove } = useToast();

  // Filter
  const filtered = products.filter(p=>{
    const q = search.toLowerCase();
    const textMatch = p.name.toLowerCase().includes(q)||
      p.barcodes.some(b=>b.barcode.includes(search))||
      (p.ikpuCode||"").includes(q)||(p.manufacturer||"").toLowerCase().includes(q)||
      p.batches.some(b=>(b.series||"").includes(search)||(b.contractNumber||"").toLowerCase().includes(q)||(b.invoiceNumber||"").toLowerCase().includes(q));

    if (!filterStatus||filterStatus==="all") return textMatch;
    const totalQty = p.batches.reduce((s,b)=>s+(b.remainingQty??0),0);
    const hasExp   = p.batches.some(b=>isExpired(b.expiry));
    const hasSoon  = p.batches.some(b=>isExpiringSoon(b.expiry));
    if (filterStatus==="expired") return textMatch && hasExp;
    if (filterStatus==="soon")    return textMatch && hasSoon && !hasExp;
    if (filterStatus==="empty")   return textMatch && totalQty===0;
    if (filterStatus==="ok")      return textMatch && totalQty>0 && !hasExp && !hasSoon;
    return textMatch;
  });

  useEffect(()=>setPage(1),[search,filterStatus]);

  const totalPages = Math.ceil(filtered.length/PAGE_SIZE);
  const paginated  = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  // Stats
  const totalBatches = products.reduce((s,p)=>s+(p.batches?.length??0),0);
  const expiredTotal = products.reduce((s,p)=>s+(p.batches?.filter(b=>isExpired(b.expiry)).length??0),0);
  const totalQtyAll  = products.reduce((s,p)=>s+(p.batches?.reduce((x,b)=>x+(b.remainingQty??0),0)??0),0);

  const createProduct = useCallback((data)=>{
    const p = { id:++mockIdCounter, ...data, barcodes:data.barcodes?.map((b,i)=>({id:++mockIdCounter,...b}))??[], batches:[], _count:{batches:0,saleItems:0} };
    setProducts(prev=>[p,...prev]);
    return p;
  },[]);

  const createBatch = useCallback((data)=>{
    setProducts(prev=>prev.map(p=>p.id===data.productId?{...p,batches:[{id:++mockIdCounter,...data},...p.batches],_count:{...p._count,batches:p._count.batches+1}}:p));
  },[]);

  const handleUpdateProduct = (data) => {
    setSaving(true);
    setTimeout(()=>{
      setProducts(prev=>prev.map(p=>p.id===editProduct.id?{...p,...data}:p));
      toast("Mahsulot yangilandi");
      setEditProduct(null);
      setSaving(false);
    },450);
  };

  const handleUpdateBatch = (data) => {
    setSaving(true);
    setTimeout(()=>{
      setProducts(prev=>prev.map(p=>({...p,batches:p.batches.map(b=>b.id===editBatch.id?{...b,...data}:b)})));
      toast("Partiya yangilandi");
      setEditBatch(null);
      setSaving(false);
    },450);
  };

  const handleAddBatch = (data) => {
    setSaving(true);
    setTimeout(()=>{
      createBatch(data);
      toast("Partiya qo'shildi!");
      setAddBatch(null);
      setSaving(false);
    },450);
  };

  const handleAddBarcode = (productId, data) => {
    const dup = products.find(p=>p.barcodes.some(b=>b.barcode===data.barcode));
    if (dup) { toast(`"${data.barcode}" allaqachon mavjud`,"error"); return; }
    setProducts(prev=>prev.map(p=>{
      if (p.id!==productId) return p;
      const newBcs = data.isPrimary
        ? [...p.barcodes.map(b=>({...b,isPrimary:false})), {id:++mockIdCounter,...data}]
        : [...p.barcodes, {id:++mockIdCounter,...data}];
      return {...p, barcodes:newBcs};
    }));
    toast("Barkod qo'shildi");
    setBarcodeModal(p=>p?{...p,barcodes:products.find(x=>x.id===p.id)?.barcodes??p.barcodes}:null);
  };

  const handleSetPrimary = (productId, bcId) => {
    setProducts(prev=>prev.map(p=>p.id===productId?{...p,barcodes:p.barcodes.map(b=>({...b,isPrimary:b.id===bcId}))}:p));
    setBarcodeModal(prev=>prev?{...prev,barcodes:prev.barcodes.map(b=>({...b,isPrimary:b.id===bcId}))}:null);
    toast("Asosiy barkod o'zgartirildi");
  };

  const handleDeleteBarcode = (productId, bcId) => {
    const p = products.find(x=>x.id===productId);
    const bc = p?.barcodes.find(b=>b.id===bcId);
    if (bc?.isPrimary) { toast("Asosiy barkodni o'chirib bo'lmaydi","error"); return; }
    setProducts(prev=>prev.map(p=>p.id===productId?{...p,barcodes:p.barcodes.filter(b=>b.id!==bcId)}:p));
    setBarcodeModal(prev=>prev?{...prev,barcodes:prev.barcodes.filter(b=>b.id!==bcId)}:null);
    toast("Barkod o'chirildi");
  };

  return (
    <>
      <ToastStack toasts={toasts} remove={remove}/>

      <div className="p-page">
        {/* Header */}
        
        <PageHeader title="Mahsulotlar" subtitle="Tovar katalogi, partiyalar va ombor holati" btntext="Mahsulot qo'shish" icon={Package} setAddModal={setAddModal}/>

        {/* Stats */}
        <div className="p-stats">
          <StatCard title="Mahsulotlar" value={products.length} icon={Package} color="blue" />  
          <StatCard title="Partiyalar" value={totalBatches} icon={Layers} color="violet" />
          <StatCard title="Jami qoldiq" value={totalQtyAll.toLocaleString("uz-UZ")} icon={BoxSelect} color="teal" />
          <StatCard title="Muddati o'tgan" value={expiredTotal} icon={AlertTriangle} color="red" />
        </div>

        {/* Barcode scanner search */}
        <BarcodeSearch products={products} onSelect={p=>setAddBatch(p)}/>
        
        {/* Search */}
        <SearchInput value={search} onChange={setSearch} placeholder="Nom, barcode, IKPU, shartnoma, faktura yoki seriya bo'yicha qidiring..."/>
       

        {/* Filter pills */}
        <div className="p-filter-row">
          <Filter size={12} style={{color:"#94a3b8",flexShrink:0}}/>
          {[["Barchasi",null],["Yaxshi","ok"],["Tugayapti","soon"],["Muddati o'tgan","expired"],["Tugagan","empty"]].map(([lbl,val])=>(
            <button key={lbl} className={`p-pill${filterStatus===val?" p-pill-active":""}`}
              onClick={()=>setFilterStatus(val===filterStatus?null:val)}>{lbl}</button>
          ))}
          {search&&<span className="p-search-count">{filtered.length} ta natija</span>}
        </div>

        {/* Table */}
        <div className="p-table-card">
          {paginated.length===0?(
            <div className="p-empty">
              <Package size={44} strokeWidth={0.8} style={{color:"#e2e8f0"}}/>
              <div>
                <div style={{fontSize:15,fontWeight:600,color:"#64748b",marginBottom:5}}>
                  {search||filterStatus?"Hech narsa topilmadi":"Mahsulot yo'q"}
                </div>
                <div style={{fontSize:13,color:"#94a3b8"}}>
                  {search||filterStatus?"Filtr yoki qidiruvni o'zgartiring":"Birinchi mahsulotni qo'shib boshlang"}
                </div>
              </div>
              {!(search||filterStatus)&&(
                <button className="p-btn-primary" onClick={()=>setAddModal(true)}><Plus size={14}/>Mahsulot qo'shish</button>
              )}
            </div>
          ):(
            <>
              <table className="p-main-table">
                <thead>
                  <tr>
                    <th>Mahsulot</th>
                    <th style={{textAlign:"center"}}>Partiyalar</th>
                    <th style={{textAlign:"center"}}>Qoldiq</th>
                    <th style={{textAlign:"center"}}>Holat</th>
                    <th style={{textAlign:"right",paddingRight:20}}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p,i)=>(
                    <ProductRow key={p.id} product={p} idx={i}
                      onEditProduct={setEditProduct}
                      onDeleteProduct={setDelProduct}
                      onAddBatch={setAddBatch}
                      onEditBatch={setEditBatch}
                      onDeleteBatch={setDelBatch}
                      onBarcodes={p=>{setBarcodeModal({...p})}}
                      onStock={setStockModal}
                    />
                  ))}
                </tbody>
              </table>
              <div className="p-table-footer">
                <span className="p-count">{filtered.length} ta mahsulot{filtered.length!==products.length&&` (${products.length} tadan filtrlangan)`}</span>
                <Pagination page={page} total={totalPages} onPage={setPage}/>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {addModal&&<AddProductWizard onCreateProduct={createProduct} onCreateBatch={createBatch}
        onCancel={()=>setAddModal(false)} saving={saving} setSaving={setSaving} toast={toast}/>}

      {editProduct&&(
        <Modal title="Mahsulotni tahrirlash" subtitle={editProduct.name} onClose={()=>setEditProduct(null)} xl>
          <ProductForm initial={editProduct} onSave={handleUpdateProduct} onCancel={()=>setEditProduct(null)} saving={saving}/>
        </Modal>
      )}

      {addBatch&&(
        <Modal title={`Partiya qo'shish`} subtitle={addBatch.name} onClose={()=>setAddBatch(null)} xl>
          <BatchForm productId={addBatch.id} productName={addBatch.name}
            onSave={handleAddBatch} onCancel={()=>setAddBatch(null)} saving={saving}/>
        </Modal>
      )}

      {editBatch&&(
        <Modal title="Partiyani tahrirlash" onClose={()=>setEditBatch(null)} xl>
          <BatchForm productId={editBatch.productId} initial={editBatch}
            onSave={handleUpdateBatch} onCancel={()=>setEditBatch(null)} saving={saving}/>
        </Modal>
      )}

      {barcodeModal&&(
        <BarcodeModal product={barcodeModal} onClose={()=>setBarcodeModal(null)}
          onAdd={handleAddBarcode} onSetPrimary={handleSetPrimary} onDelete={handleDeleteBarcode}/>
      )}

      {stockModal&&<StockModal product={stockModal} onClose={()=>setStockModal(null)}/>}

      {delProduct&&<DeleteConfirmModal item={delProduct} type="product"
        onConfirm={()=>{setProducts(p=>p.filter(x=>x.id!==delProduct.id));toast("Mahsulot o'chirildi");setDelProduct(null);}}
        onCancel={()=>setDelProduct(null)}/>}

      {delBatch&&<DeleteConfirmModal item={delBatch} type="batch"
        onConfirm={()=>{setProducts(p=>p.map(x=>({...x,batches:x.batches.filter(b=>b.id!==delBatch.id)})));toast("Partiya o'chirildi");setDelBatch(null);}}
        onCancel={()=>setDelBatch(null)}/>}
    </>
  );
}

// ─── STYLES ───────────────────────────────────────────────────
