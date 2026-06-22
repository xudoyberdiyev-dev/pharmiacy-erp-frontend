import { useState, useRef, useEffect, useCallback } from "react"
import {
  ShoppingCart, History, User, Package, Layers, Banknote,
  Tag, FlaskConical, Calendar, Scan, Plus, Minus, Trash2,
  Download, CheckCircle, ShieldAlert, AlertTriangle, Loader2,
  X, ChevronRight, Search, Phone, QrCode, ClipboardList,
  ReceiptText, TrendingUp, ArrowLeft, RefreshCw, BarChart3,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════
// MOCK DATA — backend strukturasiga mos
// ═══════════════════════════════════════════════════════════
const MOCK_CUSTOMERS = [
  { id: 1, name: "Alisher Karimov",  phone: "+998 90 123 45 67", inn: "304123456" },
  { id: 2, name: "Madina Yusupova",  phone: "+998 93 765 43 21", inn: null },
  { id: 3, name: "Bek Pharmacy LLC", phone: "+998 71 200 10 10", inn: "201998877" },
  { id: 4, name: "Dilnoza Rahimova", phone: "+998 97 888 77 66", inn: null },
  { id: 5, name: "Jamshid Toshmatov",phone: "+998 90 555 44 33", inn: "789654321" },
]

const MOCK_PRODUCTS = [
  { id: 1, name: "Paracetamol 500mg",  ikpuCode: "10006001001000000", unit: "dona", barcodes: [{ barcode: "4780123456789", isPrimary: true }] },
  { id: 2, name: "Amoxicillin 250mg",  ikpuCode: "10006001002000000", unit: "qadoq", barcodes: [{ barcode: "4780198765432", isPrimary: true }] },
  { id: 3, name: "Ibuprofen 400mg",    ikpuCode: "10006001003000000", unit: "dona", barcodes: [] },
  { id: 4, name: "Vitamin C 1000mg",   ikpuCode: "10006001004000000", unit: "dona", barcodes: [{ barcode: "4780111222333", isPrimary: true }] },
  { id: 5, name: "Metformin 850mg",    ikpuCode: "10006001005000000", unit: "dona", barcodes: [{ barcode: "4780999888777", isPrimary: true }] },
]

const MOCK_BATCHES = {
  1: [
    { id: 1, productId: 1, series: "478001167783021", boxSeries: "MK-2026-001", mg: "500mg", quantity: 240, remainingQty: 225, price: 12000, expiry: "2027-03-15", contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0892" },
    { id: 2, productId: 1, series: "478001167783022", boxSeries: null, mg: "500mg", quantity: 18, remainingQty: 18, price: 12500, expiry: "2026-08-10", contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0910" },
  ],
  2: [
    { id: 3, productId: 2, series: "478019988771", boxSeries: "MK-2026-003", mg: "250mg", quantity: 80, remainingQty: 65, price: 24000, expiry: "2026-12-01", contractNumber: "SH-2026-031", invoiceNumber: "F-2026-0411" },
  ],
  3: [
    { id: 4, productId: 3, series: "IBU2024001", boxSeries: null, mg: "400mg", quantity: 100, remainingQty: 88, price: 8500, expiry: "2027-06-30", contractNumber: "SH-2026-020", invoiceNumber: "F-2026-0200" },
  ],
  4: [
    { id: 5, productId: 4, series: "478011199001", boxSeries: "MK-2025-450", mg: "1000mg", quantity: 5, remainingQty: 5, price: 18000, expiry: "2026-07-25", contractNumber: "SH-2025-188", invoiceNumber: "F-2025-2201" },
  ],
  5: [
    { id: 6, productId: 5, series: "MET2026001", boxSeries: "MK-2026-010", mg: "850mg", quantity: 150, remainingQty: 120, price: 9800, expiry: "2027-01-15", contractNumber: "SH-2026-060", invoiceNumber: "F-2026-1001" },
  ],
}

let SALE_ID_COUNTER = 502
const INITIAL_SALES = [
  {
    id: 500,
    customerId: 1,
    customer: { id: 1, name: "Alisher Karimov", phone: "+998 90 123 45 67" },
    totalPrice: 360000,
    createdAt: "2026-06-10T09:22:00",
    items: [
      { id: 1, productId: 1, batchId: 1, product: { name: "Paracetamol 500mg", ikpuCode: "10006001001000000", unit: "dona" }, batch: { series: "478001167783021", boxSeries: "MK-2026-001", mg: "500mg", expiry: "2027-03-15", contractNumber: "SH-2026-045", invoiceNumber: "F-2026-0892" }, quantity: 10, price: 12000, total: 120000 },
      { id: 2, productId: 2, batchId: 3, product: { name: "Amoxicillin 250mg", ikpuCode: "10006001002000000", unit: "qadoq" }, batch: { series: "478019988771", boxSeries: "MK-2026-003", mg: "250mg", expiry: "2026-12-01", contractNumber: "SH-2026-031", invoiceNumber: "F-2026-0411" }, quantity: 10, price: 24000, total: 240000 },
    ],
  },
  {
    id: 501,
    customerId: 4,
    customer: { id: 4, name: "Dilnoza Rahimova", phone: "+998 97 888 77 66" },
    totalPrice: 900000,
    createdAt: "2026-06-12T14:05:00",
    items: [
      { id: 3, productId: 4, batchId: 5, product: { name: "Vitamin C 1000mg", ikpuCode: "10006001004000000", unit: "dona" }, batch: { series: "478011199001", boxSeries: "MK-2025-450", mg: "1000mg", expiry: "2026-07-25", contractNumber: "SH-2025-188", invoiceNumber: "F-2025-2201" }, quantity: 50, price: 18000, total: 900000 },
    ],
  },
]

// ═══════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════
const fmt   = (p) => Number(p).toLocaleString("uz-UZ") + " so'm"
const fmtD  = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—"
const fmtDT = (d) => d ? new Date(d).toLocaleString("uz-UZ") : "—"

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// GS1 barcode parser
function parseGS1(code) {
  if (!code) return { type: "unknown", original: code }
  const c = code.trim()
  if (c.startsWith("01") && c.length >= 18) {
    const rawGtin = c.substring(2, 16)
    const gtin = rawGtin.replace(/^0+/, "") || rawGtin
    const rest = c.substring(16)
    let serial = null
    if (rest.startsWith("21")) serial = rest.substring(2)
    return { type: "qr", gtin, rawGtin, serial, original: c }
  }
  return { type: "barcode", barcode: c, original: c }
}

function norm(s) { return String(s || "").replace(/^0+/, "").toLowerCase().trim() }

function checkMatch(parsed, batch, unitsPerBox) {
  const bS = norm(batch.series)
  const bB = batch.boxSeries ? norm(batch.boxSeries) : null
  if (parsed.type === "qr") {
    const g = norm(parsed.gtin)
    const match = g === bS || (bB && g === bB)
    return { match, scanType: "qr", addQty: 1, extracted: parsed.gtin, original: parsed.original }
  }
  if (parsed.type === "barcode") {
    const b = norm(parsed.barcode)
    const match = b === bS || (bB && b === bB)
    return { match, scanType: "barcode", addQty: unitsPerBox, extracted: parsed.barcode, original: parsed.original }
  }
  return { match: false, scanType: "unknown", addQty: null, extracted: parsed.original, original: parsed.original }
}

function beep(freq = 880, dur = 0.15) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(); osc.stop(ctx.currentTime + dur)
  } catch {}
}
const beepOk = () => beep(880, 0.12)
const beepErr = () => { beep(180, 0.25); setTimeout(() => beep(180, 0.25), 280) }

// ═══════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  const bg = type === "success" ? "#0f172a" : type === "warn" ? "#d97706" : "#dc2626"
  return (
    <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999, display:"flex", alignItems:"center", gap:10, padding:"13px 16px", borderRadius:14, background:bg, color:"#fff", fontSize:14, fontWeight:600, boxShadow:"0 12px 40px rgba(0,0,0,.2)", maxWidth:380, animation:"slideUp .2s ease" }}>
      {type === "success" ? <CheckCircle size={16} /> : type === "warn" ? <AlertTriangle size={16} /> : <ShieldAlert size={16} />}
      <span style={{ flex:1 }}>{msg}</span>
      <button onClick={onClose} style={{ background:"rgba(255,255,255,.15)", border:"none", borderRadius:6, width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,.8)" }}><X size={13} /></button>
    </div>
  )
}

function Overlay({ onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(15,23,42,.55)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, backdropFilter:"blur(4px)" }}>
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  )
}

function Modal({ title, onClose, children, width = 600 }) {
  useEffect(() => {
    const fn = e => e.key === "Escape" && onClose()
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [onClose])
  return (
    <Overlay onClose={onClose}>
      <div style={{ background:"var(--color-background-primary)", borderRadius:20, width:"100%", maxWidth:width, maxHeight:"90vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,.2)", animation:"pop .18s ease" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px 16px", borderBottom:"0.5px solid var(--color-border-tertiary)", flexShrink:0 }}>
          <h3 style={{ fontSize:17, fontWeight:500, margin:0 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"var(--color-background-secondary)", border:"none", borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"var(--color-text-secondary)" }}><X size={17} /></button>
        </div>
        <div style={{ padding:"20px 24px 24px", overflowY:"auto", flex:1 }}>{children}</div>
      </div>
    </Overlay>
  )
}

function Dropdown({ value, placeholder, items, renderItem, renderSelected, onSelect, filterFn }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const ref = useRef(null)
  const filtered = q ? items.filter(i => filterFn(i, q)) : items

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div onClick={() => setOpen(v => !v)} style={{ display:"flex", alignItems:"center", border:`1.5px solid ${open ? "#2563eb" : "var(--color-border-secondary)"}`, borderRadius:11, padding:"11px 14px", background:"var(--color-background-primary)", cursor:"pointer", minHeight:48, gap:8, boxShadow: open ? "0 0 0 3px #dbeafe" : "none" }}>
        {value ? renderSelected(value) : <span style={{ color:"var(--color-text-tertiary)", fontSize:14, flex:1 }}>{placeholder}</span>}
        <ChevronRight size={14} style={{ marginLeft:"auto", color:"var(--color-text-tertiary)", transform: open ? "rotate(90deg)" : "none", transition:"transform .2s" }} />
      </div>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, zIndex:400, background:"var(--color-background-primary)", border:"1.5px solid var(--color-border-secondary)", borderRadius:13, boxShadow:"0 16px 48px rgba(0,0,0,.14)", overflow:"hidden" }}>
          <div style={{ display:"flex", alignItems:"center", borderBottom:"0.5px solid var(--color-border-tertiary)", padding:"8px 12px", gap:8 }}>
            <Search size={14} style={{ color:"var(--color-text-tertiary)" }} />
            <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Qidirish…" style={{ flex:1, border:"none", background:"transparent", fontSize:14, outline:"none", color:"var(--color-text-primary)", fontFamily:"var(--font-sans)" }} />
            {q && <button onClick={() => setQ("")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-tertiary)", display:"flex" }}><X size={12} /></button>}
          </div>
          <div style={{ maxHeight:230, overflowY:"auto" }}>
            {filtered.length === 0
              ? <div style={{ padding:"24px", textAlign:"center", color:"var(--color-text-tertiary)", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}><Search size={18} /> Topilmadi</div>
              : filtered.map((item, i) => (
                <div key={item.id ?? i} onClick={() => { onSelect(item); setOpen(false); setQ("") }} style={{ padding:"10px 14px", cursor:"pointer", background: value?.id === item.id ? "#eff6ff" : "transparent" }}
                  onMouseEnter={e => { if (value?.id !== item.id) e.currentTarget.style.background = "var(--color-background-secondary)" }}
                  onMouseLeave={e => { if (value?.id !== item.id) e.currentTarget.style.background = "transparent" }}>
                  {renderItem(item)}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

function Avatar({ name, size = 34 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", background:"linear-gradient(135deg,#667eea,#764ba2)", color:"#fff", fontWeight:700, fontSize:size*0.38, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

function Chip({ children, color = "gray" }) {
  const colors = {
    purple: { bg:"#ede9fe", color:"#6d28d9" },
    blue:   { bg:"#dbeafe", color:"#1d4ed8" },
    gray:   { bg:"var(--color-background-secondary)", color:"var(--color-text-secondary)" },
    green:  { bg:"#dcfce7", color:"#15803d" },
    amber:  { bg:"#fef3c7", color:"#92400e" },
  }
  const c = colors[color] || colors.gray
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:5, fontSize:11, fontWeight:600, marginRight:4, background:c.bg, color:c.color }}>
      {children}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════
// BATCH LIST
// ═══════════════════════════════════════════════════════════
function BatchList({ productId, selected, onSelect }) {
  const batches = (MOCK_BATCHES[productId] || []).filter(b => b.remainingQty > 0)
  if (!batches.length) return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:20, color:"#f59e0b", fontSize:13 }}>
      <Package size={22} strokeWidth={1.5} /> Bu dori uchun mavjud partiya yo'q
    </div>
  )
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:280, overflowY:"auto" }}>
      {batches.map(b => {
        const sel = selected?.id === b.id
        return (
          <div key={b.id} onClick={() => onSelect(b)} style={{ border:`1.5px solid ${sel ? "#2563eb" : "var(--color-border-secondary)"}`, borderRadius:11, padding:"12px 14px", cursor:"pointer", background: sel ? "#eff6ff" : "var(--color-background-secondary)", boxShadow: sel ? "0 0 0 3px #dbeafe" : "none", position:"relative", display:"flex", flexDirection:"column", gap:6, transition:"all .15s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontFamily:"monospace", fontWeight:700, color:"#6d28d9", fontSize:13 }}><Tag size={11} />{b.series}</span>
              <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#dcfce7", color:"#16a34a", fontSize:12, fontWeight:700, padding:"3px 9px", borderRadius:20 }}><CheckCircle size={11} />{b.remainingQty} ta</span>
            </div>
            {b.boxSeries && <div style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, color:"#7c3aed", background:"#f5f3ff", padding:"2px 8px", borderRadius:5, width:"fit-content", fontFamily:"monospace" }}><QrCode size={10} /> QR: <strong>{b.boxSeries}</strong></div>}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Chip color="gray"><FlaskConical size={9} /> {b.mg}</Chip>
              <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, color:"var(--color-text-tertiary)" }}><Calendar size={10} />{fmtD(b.expiry)}</span>
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:13, fontWeight:700, color:"var(--color-text-primary)" }}><Banknote size={12} />{fmt(b.price)} / dona</div>
            {sel && <CheckCircle size={16} style={{ position:"absolute", top:12, right:12, color:"#2563eb" }} />}
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SALE FORM
// ═══════════════════════════════════════════════════════════
function SaleForm({ onDone, showToast }) {
  const [step, setStep]         = useState(1)
  const [customer, setCustomer] = useState(null)
  const [product, setProduct]   = useState(null)
  const [batch, setBatch]       = useState(null)
  const [unitsPerBox, setUnitsPerBox] = useState(30)
  const [unitPrice, setUnitPrice]   = useState(0)
  const [qty, setQty]           = useState(0)
  const [scanLog, setScanLog]   = useState([])
  const [scanInput, setScanInput] = useState("")
  const [saving, setSaving]     = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const scanRef = useRef(null)

  const totalPrice = qty * unitPrice

  useEffect(() => { if (step === 5 && scanRef.current) scanRef.current.focus() }, [step])

  const reset = () => {
    setStep(1); setCustomer(null); setProduct(null); setBatch(null)
    setUnitsPerBox(30); setUnitPrice(0); setQty(0); setScanLog([]); setScanInput("")
  }

  const handleScan = () => {
    const val = scanInput.trim()
    if (!val || !batch) return
    if (/[\u0400-\u04FF]/.test(val)) {
      beepErr(); showToast("⚠️ Rus klaviaturasi o'chirilsin!", "warn"); setScanInput(""); return
    }
    setScanInput(""); scanRef.current?.focus()
    if (scanLog.some(l => l.original === val)) { beepErr(); showToast("⚠️ Bu kod allaqon skanerlangan!", "warn"); return }
    const parsed = parseGS1(val)
    const result = checkMatch(parsed, batch, Number(unitsPerBox) || 1)
    if (result.match) {
      setQty(q => q + result.addQty)
      setScanLog(l => [...l, { type: result.scanType, series: result.extracted, original: val, count: result.addQty, time: new Date(), warning: false }])
      beepOk()
    } else {
      beepErr()
      const exp = batch.boxSeries ? `"${batch.series}" yoki "${batch.boxSeries}"` : `"${batch.series}"`
      setConfirmModal({ extracted: result.extracted, original: val, scanType: result.scanType, addQty: result.addQty || 1, message: `Scan: "${result.extracted}"\nKutilgan: ${exp}\n\nBoshqa partiyaga tegishli bo'lishi mumkin. Baribir qo'shilsinmi?` })
    }
  }

  const confirmAdd = () => {
    if (!confirmModal) return
    setQty(q => q + confirmModal.addQty)
    setScanLog(l => [...l, { type: confirmModal.scanType, series: confirmModal.extracted, original: confirmModal.original, count: confirmModal.addQty, time: new Date(), warning: true }])
    beepOk(); setConfirmModal(null); scanRef.current?.focus()
  }

  const addOne = () => {
    setQty(q => q + 1)
    setScanLog(l => [...l, { type: "manual", series: batch?.series || "", original: "__manual__" + Date.now(), count: 1, time: new Date(), warning: false }])
  }

  const subOne = () => {
    if (qty <= 0) return
    setQty(q => q - 1)
    setScanLog(l => {
      if (!l.length) return l
      const last = l[l.length - 1]
      return last.count > 1 ? [...l.slice(0, -1), { ...last, count: last.count - 1 }] : l.slice(0, -1)
    })
  }

  const handleSave = async () => {
    if (!customer || !product || !batch || qty < 1) return
    setSaving(true)
    await sleep(600)
    const newSale = {
      id: SALE_ID_COUNTER++,
      customerId: customer.id,
      customer: { id: customer.id, name: customer.name, phone: customer.phone },
      totalPrice: totalPrice,
      createdAt: new Date().toISOString(),
      items: [{
        id: Date.now(),
        productId: product.id,
        batchId: batch.id,
        product: { name: product.name, ikpuCode: product.ikpuCode, unit: product.unit },
        batch: { series: batch.series, boxSeries: batch.boxSeries, mg: batch.mg, expiry: batch.expiry, contractNumber: batch.contractNumber, invoiceNumber: batch.invoiceNumber },
        quantity: qty,
        price: unitPrice,
        total: totalPrice,
      }],
    }
    onDone(newSale)
    showToast("Sotuv muvaffaqiyatli saqlandi!", "success")
    reset()
    setSaving(false)
  }

  const canNext = () => {
    if (step === 1) return !!customer
    if (step === 2) return !!product
    if (step === 3) return !!batch
    if (step === 4) return unitPrice > 0
    return false
  }

  const STEPS = [
    { n:1, label:"Mijoz",   Icon: User },
    { n:2, label:"Dori",    Icon: Package },
    { n:3, label:"Partiya", Icon: Layers },
    { n:4, label:"Narx",    Icon: Banknote },
    { n:5, label:"Skaner",  Icon: Scan },
  ]

  const boxScans  = scanLog.filter(l => l.type === "barcode").length
  const qrScans   = scanLog.filter(l => l.type === "qr").length
  const warnCount = scanLog.filter(l => l.warning).length

  return (
    <>
    <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:18, overflow:"hidden", position:"sticky", top:20 }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px 14px", borderBottom:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-secondary)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:16, fontWeight:500 }}>
          <ShoppingCart size={18} style={{ color:"#2563eb" }} /> Yangi sotuv
        </div>
        <button onClick={reset} style={{ display:"inline-flex", alignItems:"center", gap:5, background:"none", border:"0.5px solid var(--color-border-secondary)", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:500, color:"var(--color-text-tertiary)", cursor:"pointer" }}>
          <RefreshCw size={13} /> Tozalash
        </button>
      </div>

      {/* Steps */}
      <div style={{ display:"flex", alignItems:"center", padding:"14px 20px", borderBottom:"0.5px solid var(--color-border-tertiary)", overflowX:"auto", gap:0 }}>
        {STEPS.map((s, i) => {
          const done = step > s.n, active = step === s.n
          return (
            <div key={s.n} style={{ display:"flex", alignItems:"center", flexShrink:0 }}>
              <div onClick={() => done && setStep(s.n)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 11px", borderRadius:20, fontSize:12, fontWeight:500, cursor: done ? "pointer" : "default", background: active ? "#eff6ff" : done ? "#dcfce7" : "var(--color-background-secondary)", color: active ? "#2563eb" : done ? "#16a34a" : "var(--color-text-tertiary)", boxShadow: active ? "0 0 0 2px #bfdbfe" : "none", whiteSpace:"nowrap" }}>
                {done ? <CheckCircle size={13} /> : <s.Icon size={12} />} {s.label}
              </div>
              {i < STEPS.length - 1 && <div style={{ width:18, height:2, background: done ? "#16a34a" : "var(--color-border-secondary)", margin:"0 3px", flexShrink:0 }} />}
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div style={{ padding:20, minHeight:260 }}>

        {/* Step 1 — Mijoz */}
        {step === 1 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:14, fontWeight:500 }}><User size={16} /> Mijozni tanlang</div>
            <Dropdown
              value={customer} placeholder="Ism yoki telefon raqam…"
              items={MOCK_CUSTOMERS}
              filterFn={(c, q) => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)}
              renderSelected={c => (
                <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
                  <Avatar name={c.name} size={30} />
                  <div><div style={{ fontWeight:500, fontSize:14 }}>{c.name}</div><div style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{c.phone}</div></div>
                </div>
              )}
              renderItem={c => (
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <Avatar name={c.name} size={32} />
                  <div><div style={{ fontWeight:500, fontSize:13 }}>{c.name}</div><div style={{ fontSize:11, color:"var(--color-text-tertiary)", display:"flex", alignItems:"center", gap:4 }}><Phone size={10} /> {c.phone}</div></div>
                </div>
              )}
              onSelect={c => { setCustomer(c); setStep(2) }}
            />
            {customer && (
              <div style={{ display:"flex", alignItems:"center", gap:12, background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:11, padding:"12px 14px" }}>
                <Avatar name={customer.name} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:500 }}>{customer.name}</div>
                  <div style={{ fontSize:12, color:"var(--color-text-secondary)", marginTop:2 }}>{customer.phone}</div>
                </div>
                <button onClick={() => setCustomer(null)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-tertiary)", display:"flex" }}><X size={14} /></button>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Dori */}
        {step === 2 && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:14, fontWeight:500 }}><Package size={16} /> Dorini tanlang</div>
            <Dropdown
              value={product} placeholder="Dori nomini kiriting…"
              items={MOCK_PRODUCTS}
              filterFn={(p, q) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.ikpuCode || "").includes(q)}
              renderSelected={p => (
                <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
                  <div style={{ width:30, height:30, borderRadius:8, background:"#eff6ff", color:"#2563eb", display:"flex", alignItems:"center", justifyContent:"center" }}><Package size={14} /></div>
                  <div><div style={{ fontWeight:500, fontSize:14 }}>{p.name}</div>{p.ikpuCode && <div style={{ fontSize:11, color:"var(--color-text-tertiary)", fontFamily:"monospace" }}>{p.ikpuCode}</div>}</div>
                </div>
              )}
              renderItem={p => (
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:"#eff6ff", color:"#2563eb", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Package size={14} /></div>
                  <div><div style={{ fontWeight:500, fontSize:13 }}>{p.name}</div>{p.ikpuCode && <div style={{ fontSize:11, color:"var(--color-text-tertiary)", fontFamily:"monospace" }}>{p.ikpuCode}</div>}</div>
                </div>
              )}
              onSelect={p => { setProduct(p); setBatch(null); setStep(3) }}
            />
          </div>
        )}

        {/* Step 3 — Partiya */}
        {step === 3 && product && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:14, fontWeight:500, flexWrap:"wrap" }}>
              <Layers size={16} /> Partiyani tanlang
              <span style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#eff6ff", color:"#2563eb", fontSize:11, fontWeight:500, padding:"3px 9px", borderRadius:20, marginLeft:6 }}><Package size={10} />{product.name}</span>
            </div>
            <BatchList productId={product.id} selected={batch} onSelect={b => { setBatch(b); setUnitPrice(b.price); setQty(0); setScanLog([]); setStep(4) }} />
          </div>
        )}

        {/* Step 4 — Narx */}
        {step === 4 && batch && (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            <div style={{ fontSize:14, fontWeight:500, display:"flex", alignItems:"center", gap:7 }}><Banknote size={16} /> Narx va quti sozlamalari</div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:11, padding:14 }}>
              {[
                { label:"Barkod (quti)", val: <Chip color="purple"><Tag size={10} />{batch.series}</Chip> },
                ...(batch.boxSeries ? [{ label:"QR seriya", val: <Chip color="blue"><QrCode size={10} />{batch.boxSeries}</Chip> }] : []),
                { label:"Dozaj", val: <Chip color="gray"><FlaskConical size={10} />{batch.mg}</Chip> },
                { label:"Omborda", val: <span style={{ color:"#16a34a", fontWeight:500, fontSize:13, display:"inline-flex", alignItems:"center", gap:4 }}><CheckCircle size={12} />{batch.remainingQty} ta</span> },
                { label:"Muddat", val: <span style={{ fontSize:13, display:"inline-flex", alignItems:"center", gap:4, color:"var(--color-text-secondary)" }}><Calendar size={11} />{fmtD(batch.expiry)}</span> },
                { label:"Shartnoma", val: <span style={{ fontSize:12, fontFamily:"monospace", color:"var(--color-text-secondary)" }}>{batch.contractNumber || "—"}</span> },
              ].map(({ label, val }) => (
                <div key={label} style={{ display:"flex", flexDirection:"column", gap:4 }}>
                  <span style={{ fontSize:10, fontWeight:500, textTransform:"uppercase", color:"var(--color-text-tertiary)" }}>{label}</span>
                  {val}
                </div>
              ))}
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { label:"Sotish narxi (1 dona)", key:"price", val: unitPrice, set: setUnitPrice, suffix:"so'm", req:true },
                { label:"1 qutida nechta dona?", key:"upb", val: unitsPerBox, set: v => setUnitsPerBox(v), suffix:"dona", hint:`Quti barkodi skanerlanganda +${unitsPerBox} dona qo'shiladi` },
              ].map(f => (
                <div key={f.key} style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  <label style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:500, textTransform:"uppercase", letterSpacing:".04em", color:"var(--color-text-secondary)" }}>
                    {f.label}{f.req && <span style={{ color:"#ef4444" }}>*</span>}
                  </label>
                  <div style={{ position:"relative" }}>
                    <input type="number" min="0" value={f.val} onChange={e => f.set(Number(e.target.value))}
                      style={{ width:"100%", border:"0.5px solid var(--color-border-secondary)", borderRadius:10, padding:"11px 52px 11px 13px", fontSize:15, fontWeight:500, outline:"none", fontFamily:"var(--font-sans)", color:"var(--color-text-primary)", background:"var(--color-background-primary)" }} />
                    <span style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"var(--color-text-tertiary)", fontWeight:500 }}>{f.suffix}</span>
                  </div>
                  {f.hint && <p style={{ fontSize:11, color:"var(--color-text-tertiary)", margin:0 }}>{f.hint}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 5 — Skaner */}
        {step === 5 && batch && (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {/* Counter */}
            <div style={{ textAlign:"center", padding:"20px 0 14px", border:"0.5px solid var(--color-border-tertiary)", borderRadius:14, background:"var(--color-background-secondary)" }}>
              <div style={{ fontSize:60, fontWeight:700, color:"#2563eb", lineHeight:1 }}>{qty}</div>
              <div style={{ fontSize:13, color:"var(--color-text-tertiary)", marginTop:4 }}>dona skanerlangan</div>
              <div style={{ fontSize:20, fontWeight:500, color:"#16a34a", marginTop:8 }}>{fmt(totalPrice)}</div>
            </div>

            {/* Mini stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[
                { icon: <Package size={13} />, val: boxScans, lbl:"Quti", bg:"#eff6ff", color:"#2563eb" },
                { icon: <QrCode size={13} />, val: qrScans, lbl:"Markirovka", bg:"#f5f3ff", color:"#7c3aed" },
                { icon: <BarChart3 size={13} />, val: fmt(totalPrice), lbl:"Jami", bg:"#f0fdf4", color:"#16a34a" },
              ].map((s, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, borderRadius:10, padding:"10px 12px", background:s.bg, color:s.color }}>
                  {s.icon}
                  <div><div style={{ fontSize:12, fontWeight:700, lineHeight:1.2 }}>{s.val}</div><div style={{ fontSize:10, color:"var(--color-text-tertiary)", marginTop:2 }}>{s.lbl}</div></div>
                </div>
              ))}
            </div>

            {warnCount > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"#fffbeb", border:"1.5px solid #fde68a", borderRadius:10, padding:"10px 14px", fontSize:13, fontWeight:500, color:"#92400e" }}>
                <AlertTriangle size={14} /> {warnCount} ta seriyasi mos kelmaydigan dori qo'shildi!
              </div>
            )}

            {/* Scan input */}
            <div style={{ background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:14, display:"flex", flexDirection:"column", gap:8 }}>
              <div style={{ fontSize:11, fontWeight:500, textTransform:"uppercase", letterSpacing:".04em", color:"var(--color-text-secondary)", display:"flex", alignItems:"center", gap:6 }}><Scan size={13} /> Barkod yoki QR kodni skanerlang</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, color:"var(--color-text-secondary)", background:"var(--color-background-primary)", padding:"4px 10px", borderRadius:7 }}><Tag size={10} /> <strong style={{ fontFamily:"monospace" }}>{batch.series}</strong></span>
                {batch.boxSeries && <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, color:"var(--color-text-secondary)", background:"var(--color-background-primary)", padding:"4px 10px", borderRadius:7 }}><QrCode size={10} /> <strong style={{ fontFamily:"monospace" }}>{batch.boxSeries}</strong></span>}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input ref={scanRef} value={scanInput} onChange={e => setScanInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleScan()}
                  placeholder="Scan qiling yoki yozing, Enter bosing…" autoFocus
                  style={{ flex:1, border:"1.5px solid #2563eb", borderRadius:10, padding:"11px 14px", fontSize:14, fontWeight:500, outline:"none", fontFamily:"var(--font-sans)", color:"var(--color-text-primary)", background:"var(--color-background-primary)" }} />
                <button onClick={handleScan} disabled={!scanInput.trim()} style={{ background:"#2563eb", color:"#fff", border:"none", borderRadius:10, width:46, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, opacity: scanInput.trim() ? 1 : 0.5 }}><Scan size={15} /></button>
              </div>
              <p style={{ fontSize:11, color:"var(--color-text-tertiary)", margin:0, textAlign:"center" }}>Quti barkodi → +{unitsPerBox} dona &nbsp;|&nbsp; Markirovka QR → +1 dona</p>
            </div>

            {/* Manual */}
            <div style={{ display:"flex", alignItems:"center", gap:12, background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"10px 14px" }}>
              <button onClick={subOne} disabled={qty === 0} style={{ width:38, height:38, border:"none", borderRadius:9, background:"#fee2e2", color:"#dc2626", display:"flex", alignItems:"center", justifyContent:"center", cursor: qty === 0 ? "not-allowed" : "pointer", opacity: qty === 0 ? 0.4 : 1 }}><Minus size={14} /></button>
              <div style={{ flex:1, textAlign:"center" }}>
                <div style={{ fontSize:11, color:"var(--color-text-tertiary)", fontWeight:500 }}>Qo'lda kiritish</div>
                <div style={{ fontSize:14, fontWeight:700 }}>{qty} dona</div>
              </div>
              <button onClick={addOne} style={{ width:38, height:38, border:"none", borderRadius:9, background:"#dcfce7", color:"#16a34a", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}><Plus size={14} /></button>
            </div>

            {/* Scan Log */}
            {scanLog.length > 0 && (
              <div style={{ background:"var(--color-background-secondary)", borderRadius:11, padding:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, fontWeight:500, textTransform:"uppercase", color:"var(--color-text-secondary)", marginBottom:8 }}>
                  <span style={{ display:"flex", alignItems:"center", gap:5 }}><ClipboardList size={13} /> Jurnal ({scanLog.length} scan / {qty} dona)</span>
                  <button onClick={() => { setScanLog([]); setQty(0) }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"#ef4444", fontWeight:500, display:"flex", alignItems:"center", gap:4 }}><Trash2 size={11} /> Tozalash</button>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:180, overflowY:"auto" }}>
                  {[...scanLog].reverse().slice(0, 10).map((l, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, padding:"5px 8px", borderRadius:7, background: l.warning ? "#fffbeb" : l.type === "barcode" ? "#eff6ff" : "#f0fdf4" }}>
                      {l.type === "barcode" ? <Package size={12} style={{ color:"#2563eb", flexShrink:0 }} /> : l.type === "qr" ? <QrCode size={12} style={{ color:"#7c3aed", flexShrink:0 }} /> : <Plus size={12} style={{ color:"#16a34a", flexShrink:0 }} />}
                      <span style={{ fontFamily:"monospace", fontWeight:700, color:"#6d28d9", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:140, fontSize:11 }}>{l.series}</span>
                      <span style={{ display:"inline-block", fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:4, background: l.type === "barcode" ? "#dbeafe" : l.type === "qr" ? "#ede9fe" : "#dcfce7", color: l.type === "barcode" ? "#1d4ed8" : l.type === "qr" ? "#7c3aed" : "#15803d" }}>{l.type === "barcode" ? "quti" : l.type === "qr" ? "QR" : "qo'l"}</span>
                      <span style={{ fontWeight:700, color:"#2563eb", flexShrink:0 }}>+{l.count}</span>
                      {l.warning && <AlertTriangle size={11} style={{ color:"#d97706", flexShrink:0 }} />}
                      <span style={{ color:"var(--color-text-tertiary)", fontSize:10, flexShrink:0 }}>{new Date(l.time).toLocaleTimeString("uz-UZ")}</span>
                    </div>
                  ))}
                  {scanLog.length > 10 && <div style={{ textAlign:"center", fontSize:11, color:"var(--color-text-tertiary)", padding:4 }}>… va yana {scanLog.length - 10} ta</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderTop:"0.5px solid var(--color-border-tertiary)", background:"var(--color-background-secondary)", gap:10 }}>
        {step > 1
          ? <button onClick={() => setStep(s => s - 1)} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"var(--color-background-primary)", color:"var(--color-text-secondary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:9, padding:"9px 16px", fontSize:13, fontWeight:500, cursor:"pointer" }}><ArrowLeft size={14} /> Ortga</button>
          : <div />}
        <div style={{ display:"flex", gap:8 }}>
          {step < 5 && <button disabled={!canNext()} onClick={() => setStep(s => s + 1)} style={{ display:"inline-flex", alignItems:"center", gap:6, background: canNext() ? "#2563eb" : "#bfdbfe", color:"#fff", border:"none", borderRadius:9, padding:"9px 18px", fontSize:13, fontWeight:500, cursor: canNext() ? "pointer" : "not-allowed" }}>Keyingi <ChevronRight size={14} /></button>}
          {step === 5 && qty > 0 && <button disabled={saving} onClick={handleSave} style={{ display:"inline-flex", alignItems:"center", gap:7, background:"#16a34a", color:"#fff", border:"none", borderRadius:9, padding:"9px 18px", fontSize:13, fontWeight:500, cursor:"pointer" }}>
            {saving ? <><Loader2 size={15} className="spin" /> Saqlanmoqda…</> : <><CheckCircle size={15} /> Saqlash — {fmt(totalPrice)}</>}
          </button>}
        </div>
      </div>
    </div>

    {/* Confirm Modal */}
    {confirmModal && (
      <Overlay onClose={() => { setConfirmModal(null); scanRef.current?.focus() }}>
        <div style={{ background:"var(--color-background-primary)", borderRadius:18, width:"100%", maxWidth:420, overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,.2)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"18px 22px 14px", background:"#fffbeb", borderBottom:"1.5px solid #fef3c7" }}>
            <AlertTriangle size={18} style={{ color:"#d97706" }} />
            <h3 style={{ fontSize:16, fontWeight:500, color:"#92400e", margin:0 }}>Seriya mos kelmadi</h3>
          </div>
          <div style={{ padding:"18px 22px 22px" }}>
            <p style={{ fontSize:14, color:"var(--color-text-secondary)", lineHeight:1.7, marginBottom:20, whiteSpace:"pre-line" }}>{confirmModal.message}</p>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => { setConfirmModal(null); scanRef.current?.focus() }} style={{ background:"var(--color-background-secondary)", color:"var(--color-text-secondary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:9, padding:"9px 16px", fontSize:13, fontWeight:500, cursor:"pointer" }}>Bekor</button>
              <button onClick={confirmAdd} style={{ background:"#d97706", color:"#fff", border:"none", borderRadius:9, padding:"9px 18px", fontSize:13, fontWeight:500, cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6 }}><CheckCircle size={14} /> Baribir qo'shish</button>
            </div>
          </div>
        </div>
      </Overlay>
    )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// SALES TABLE
// ═══════════════════════════════════════════════════════════
const PER_PAGE = 8

function SaleDetailModal({ sale, onClose, onDelete }) {
  return (
    <Modal title={`Sotuv tafsiloti — #${sale.id}`} onClose={onClose} width={700}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
        {[
          { label:"Mijoz", val: sale.customer.name },
          { label:"Telefon", val: sale.customer.phone },
          { label:"Sana", val: fmtDT(sale.createdAt) },
          { label:"Jami", val: fmt(sale.totalPrice), accent: true },
        ].map(m => (
          <div key={m.label} style={{ background: m.accent ? "#eff6ff" : "var(--color-background-secondary)", border:`0.5px solid ${m.accent ? "#bfdbfe" : "var(--color-border-tertiary)"}`, borderRadius:11, padding:"13px 14px" }}>
            <div style={{ fontSize:10, fontWeight:500, textTransform:"uppercase", color:"var(--color-text-tertiary)", marginBottom:5 }}>{m.label}</div>
            <div style={{ fontSize: m.accent ? 18 : 14, fontWeight:500, color: m.accent ? "#2563eb" : "var(--color-text-primary)" }}>{m.val}</div>
          </div>
        ))}
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ background:"var(--color-background-secondary)", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
            {["Mahsulot","Seriya / Dozaj","Muddat","Shartnoma","Faktura","Miqdor","Narx","Jami"].map(h => <th key={h} style={{ padding:"10px 12px", fontSize:10, fontWeight:500, textTransform:"uppercase", color:"var(--color-text-tertiary)", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {sale.items.map(it => (
              <tr key={it.id} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                <td style={{ padding:"10px 12px", fontWeight:500 }}>{it.product.name}</td>
                <td style={{ padding:"10px 12px" }}><Chip color="purple"><Tag size={9} />{it.batch.series}</Chip><Chip color="gray"><FlaskConical size={9} />{it.batch.mg}</Chip></td>
                <td style={{ padding:"10px 12px", fontSize:11, color:"var(--color-text-tertiary)", whiteSpace:"nowrap" }}>{fmtD(it.batch.expiry)}</td>
                <td style={{ padding:"10px 12px", fontFamily:"monospace", fontSize:11, color:"var(--color-text-secondary)" }}>{it.batch.contractNumber || "—"}</td>
                <td style={{ padding:"10px 12px", fontFamily:"monospace", fontSize:11, color:"var(--color-text-secondary)" }}>{it.batch.invoiceNumber || "—"}</td>
                <td style={{ padding:"10px 12px" }}><span style={{ background:"var(--color-background-secondary)", color:"var(--color-text-primary)", fontWeight:700, fontSize:12, padding:"3px 10px", borderRadius:20, display:"inline-block" }}>{it.quantity}</span></td>
                <td style={{ padding:"10px 12px", fontFamily:"monospace", fontSize:12 }}>{fmt(it.price)}</td>
                <td style={{ padding:"10px 12px", fontFamily:"monospace", fontSize:13, fontWeight:700 }}>{fmt(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:18, paddingTop:14, borderTop:"0.5px solid var(--color-border-tertiary)" }}>
        <button onClick={() => onDelete(sale)} style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#fee2e2", color:"#dc2626", border:"none", borderRadius:9, padding:"9px 14px", fontSize:13, fontWeight:500, cursor:"pointer" }}><Trash2 size={13} /> Bekor qilish</button>
        <button onClick={onClose} style={{ background:"var(--color-background-secondary)", color:"var(--color-text-secondary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:9, padding:"8px 16px", fontSize:13, fontWeight:500, cursor:"pointer" }}>Yopish</button>
      </div>
    </Modal>
  )
}

function SalesTable({ sales, onDelete }) {
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo]   = useState("")
  const [page, setPage]         = useState(1)
  const [detail, setDetail]     = useState(null)

  const filtered = sales.filter(s => {
    const d = new Date(s.createdAt)
    if (dateFrom && d < new Date(dateFrom)) return false
    if (dateTo   && d > new Date(dateTo + "T23:59:59")) return false
    return true
  })

  const totalRev = filtered.reduce((s, x) => s + x.totalPrice, 0)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const pages = Math.ceil(filtered.length / PER_PAGE)

  return (
    <div style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:18, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:14, padding:"20px 22px 16px", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
        <History size={18} style={{ color:"#7c3aed" }} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:17, fontWeight:500 }}>Sotuvlar tarixi</div>
          <div style={{ fontSize:12, color:"var(--color-text-tertiary)", marginTop:2 }}>{filtered.length} ta sotuv</div>
        </div>
      </div>

      {/* Revenue bar */}
      {filtered.length > 0 && (
        <div style={{ display:"flex", gap:0, background:"var(--color-background-secondary)", borderBottom:"0.5px solid var(--color-border-tertiary)", padding:"14px 22px" }}>
          {[
            { icon: <TrendingUp size={16} />, label:"Jami tushum", val: fmt(totalRev), iconBg:"#dcfce7", iconColor:"#16a34a" },
            { icon: <ReceiptText size={16} />, label:"Sotuvlar soni", val: `${filtered.length} ta`, iconBg:"#dbeafe", iconColor:"#2563eb" },
          ].map((r, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:12, flex:1, paddingRight: i === 0 ? 20 : 0, borderRight: i === 0 ? "0.5px solid var(--color-border-tertiary)" : "none", paddingLeft: i > 0 ? 20 : 0 }}>
              <div style={{ width:38, height:38, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", background:r.iconBg, color:r.iconColor }}>{r.icon}</div>
              <div><div style={{ fontSize:11, fontWeight:500, textTransform:"uppercase", color:"var(--color-text-tertiary)" }}>{r.label}</div><div style={{ fontSize:20, fontWeight:500, marginTop:2 }}>{r.val}</div></div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 22px", borderBottom:"0.5px solid var(--color-border-tertiary)", flexWrap:"wrap" }}>
        <Calendar size={13} style={{ color:"var(--color-text-tertiary)" }} />
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }} style={{ border:"0.5px solid var(--color-border-secondary)", borderRadius:8, padding:"7px 11px", fontSize:13, outline:"none", fontFamily:"var(--font-sans)", color:"var(--color-text-primary)", background:"var(--color-background-primary)" }} />
        <span style={{ color:"var(--color-text-tertiary)", fontSize:13 }}>—</span>
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }} style={{ border:"0.5px solid var(--color-border-secondary)", borderRadius:8, padding:"7px 11px", fontSize:13, outline:"none", fontFamily:"var(--font-sans)", color:"var(--color-text-primary)", background:"var(--color-background-primary)" }} />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1) }} style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#fef2f2", color:"#dc2626", border:"none", borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:500, cursor:"pointer" }}><X size={12} /> Tozalash</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"64px 24px", color:"var(--color-text-tertiary)", fontSize:14 }}>
          <ReceiptText size={40} strokeWidth={1} />
          <p>{dateFrom || dateTo ? "Bu sana oralig'ida sotuv topilmadi" : "Hali sotuv yo'q"}</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr style={{ background:"var(--color-background-secondary)", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                {["#","Mijoz","Mahsulot","Miqdor","Jami","Sana",""].map(h => <th key={h} style={{ padding:"11px 16px", fontSize:10, fontWeight:500, textTransform:"uppercase", color:"#7c3aed", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {paged.map(sale => (
                  <tr key={sale.id} onClick={() => setDetail(sale)} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)", cursor:"pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--color-background-secondary)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding:"12px 16px" }}><span style={{ fontWeight:700, color:"#7c3aed", fontSize:13, background:"#f5f3ff", padding:"3px 8px", borderRadius:6, display:"inline-block" }}>#{sale.id}</span></td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <Avatar name={sale.customer.name} size={30} />
                        <div><div style={{ fontWeight:500, fontSize:13 }}>{sale.customer.name}</div><div style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{sale.customer.phone}</div></div>
                      </div>
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                        {sale.items.slice(0, 2).map(it => (
                          <div key={it.id} style={{ display:"inline-flex", alignItems:"center", gap:5, background:"var(--color-background-secondary)", borderRadius:5, padding:"2px 8px", fontSize:12, width:"fit-content" }}>
                            {it.product.name}<span style={{ color:"#2563eb", fontWeight:700, fontSize:11 }}>×{it.quantity}</span>
                          </div>
                        ))}
                        {sale.items.length > 2 && <span style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>+{sale.items.length - 2} ta</span>}
                      </div>
                    </td>
                    <td style={{ padding:"12px 16px" }}><span style={{ background:"var(--color-background-secondary)", fontWeight:700, fontSize:12, padding:"3px 10px", borderRadius:20, display:"inline-block" }}>{sale.items.reduce((s, i) => s + i.quantity, 0)} dona</span></td>
                    <td style={{ padding:"12px 16px", fontWeight:700, fontSize:14, whiteSpace:"nowrap" }}>{fmt(sale.totalPrice)}</td>
                    <td style={{ padding:"12px 16px", fontSize:11, color:"var(--color-text-tertiary)", whiteSpace:"nowrap" }}>{fmtDT(sale.createdAt)}</td>
                    <td style={{ padding:"12px 16px" }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => setDetail(sale)} style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#f5f3ff", color:"#7c3aed", border:"none", borderRadius:7, padding:"5px 10px", fontSize:11, fontWeight:500, cursor:"pointer" }}><ReceiptText size={12} /> Ko'rish</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 20px", borderTop:"0.5px solid var(--color-border-tertiary)", flexWrap:"wrap" }}>
              <span style={{ fontSize:12, color:"var(--color-text-tertiary)" }}>{(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} / {filtered.length}</span>
              <div style={{ display:"flex", gap:4, flex:1, justifyContent:"center" }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ width:32, height:32, border:"0.5px solid var(--color-border-secondary)", borderRadius:8, background:"var(--color-background-primary)", cursor: page === 1 ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-text-secondary)", opacity: page === 1 ? 0.4 : 1 }}><ChevronRight size={13} style={{ transform:"rotate(180deg)" }} /></button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)} style={{ width:32, height:32, border:"0.5px solid var(--color-border-secondary)", borderRadius:8, background: n === page ? "#2563eb" : "var(--color-background-primary)", color: n === page ? "#fff" : "var(--color-text-secondary)", cursor:"pointer", fontSize:13, fontWeight:500, display:"flex", alignItems:"center", justifyContent:"center" }}>{n}</button>
                ))}
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} style={{ width:32, height:32, border:"0.5px solid var(--color-border-secondary)", borderRadius:8, background:"var(--color-background-primary)", cursor: page === pages ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--color-text-secondary)", opacity: page === pages ? 0.4 : 1 }}><ChevronRight size={13} /></button>
              </div>
            </div>
          )}
        </>
      )}

      {detail && (
        <SaleDetailModal
          sale={detail}
          onClose={() => setDetail(null)}
          onDelete={s => { onDelete(s); setDetail(null) }}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ROOT — Sales Page
// ═══════════════════════════════════════════════════════════
export default function Sales() {
  const [sales, setSales]         = useState(INITIAL_SALES)
  const [toast, setToast]         = useState(null)
  const [activeTab, setActiveTab] = useState("new")

  const showToast = useCallback((msg, type = "success") => setToast({ msg, type }), [])

  const handleNewSale = useCallback(sale => {
    setSales(prev => [sale, ...prev])
  }, [])

  const handleDelete = useCallback(sale => {
    if (!window.confirm(`Sotuv #${sale.id} bekor qilinsinmi?`)) return
    setSales(prev => prev.filter(s => s.id !== sale.id))
    showToast("Sotuv bekor qilindi")
  }, [showToast])

  return (
    <>
      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pop { from { opacity:0; transform:scale(.94) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
        .spin { animation: spinA .7s linear infinite }
        @keyframes spinA { to { transform:rotate(360deg) } }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none }
        input[type=number] { -moz-appearance: textfield }
        * { box-sizing: border-box; margin:0; padding:0 }
      `}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ minHeight:"100vh", background:"var(--color-background-tertiary)", fontFamily:"var(--font-sans)", color:"var(--color-text-primary)" }}>

        {/* Tab bar — mobile */}
        <div style={{ background:"var(--color-background-primary)", borderBottom:"0.5px solid var(--color-border-tertiary)", padding:"0 20px", display:"flex", gap:4 }}>
          {[
            { key:"new",     label:"Yangi sotuv", icon: <ShoppingCart size={14} /> },
            { key:"history", label:"Tarix",       icon: <History size={14} /> },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"13px 18px", fontSize:13, fontWeight:500, border:"none", background:"none", cursor:"pointer", color: activeTab === t.key ? "#2563eb" : "var(--color-text-tertiary)", borderBottom:`2px solid ${activeTab === t.key ? "#2563eb" : "transparent"}` }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ display:"grid", gridTemplateColumns:"480px 1fr", gap:20, padding:24, maxWidth:1380, margin:"0 auto", alignItems:"start" }}>
          <SaleForm showToast={showToast} onDone={handleNewSale} />
          <SalesTable sales={sales} onDelete={handleDelete} />
        </div>
      </div>
    </>
  )
}

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