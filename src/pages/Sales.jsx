import { useState, useRef, useEffect, useCallback } from "react"
import axios from "axios"
import {
  ShoppingCart, History, User, Package, Layers, Banknote,
  Tag, FlaskConical, Calendar, Scan, Plus, Minus, Trash2,
  CheckCircle, ShieldAlert, AlertTriangle, Loader2,
  X, ChevronRight, Search, Phone, QrCode, ClipboardList,
  ReceiptText, TrendingUp, ArrowLeft, RefreshCw, BarChart3,
  Hash, FileText, ChevronLeft, AlertCircle,
} from "lucide-react"

// ═══════════════════════════════════════════════════════════
// API SETUP
// ═══════════════════════════════════════════════════════════
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"

const api = axios.create({ baseURL: BASE_URL, headers: { "Content-Type": "application/json" } })
api.interceptors.request.use(cfg => {
  const t = localStorage.getItem("token")
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})
api.interceptors.response.use(
  r => r.data?.data ?? r.data,
  e => {
    if (!e.response) return Promise.reject(new Error("Serverga ulanib bo'lmadi"))
    const err = new Error(e.response.data?.message || `Xatolik (${e.response.status})`)
    err.status = e.response.status
    return Promise.reject(err)
  }
)

const salesApi = {
  // Customers
  customers:    (params)    => api.get("/customers", { params }),
  // Products & Batches
  products:     (params)    => api.get("/products", { params }),
  batches:      (productId) => api.get(`/products/${productId}/batches`),
  // Sales
  sales:        (params)    => api.get("/sales", { params }),
  sale:         (id)        => api.get(`/sales/${id}`),
  createSale:   (body)      => api.post("/sales", body),
  cancelSale:   (id)        => api.delete(`/sales/${id}/cancel`),
  report:       (params)    => api.get("/sales/report", { params }),
}

// ═══════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════
const fmt   = p => Number(p || 0).toLocaleString("uz-UZ") + " so'm"
const fmtD  = d => d ? new Date(d).toLocaleDateString("uz-UZ") : "—"
const fmtDT = d => d ? new Date(d).toLocaleString("uz-UZ") : "—"

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
    return { match: g === bS || (bB && g === bB), scanType: "qr", addQty: 1, extracted: parsed.gtin, original: parsed.original }
  }
  if (parsed.type === "barcode") {
    const b = norm(parsed.barcode)
    return { match: b === bS || (bB && b === bB), scanType: "barcode", addQty: Number(unitsPerBox) || 1, extracted: parsed.barcode, original: parsed.original }
  }
  return { match: false, scanType: "unknown", addQty: 1, extracted: parsed.original, original: parsed.original }
}

function beep(freq = 880, dur = 0.14) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator(); const g = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.frequency.value = freq
    g.gain.setValueAtTime(0.3, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(); osc.stop(ctx.currentTime + dur)
  } catch {}
}
const beepOk  = () => beep(880, 0.12)
const beepErr = () => { beep(200, 0.22); setTimeout(() => beep(200, 0.22), 260) }

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════
function useToast() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type = "success") => {
    const id = Date.now()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000)
  }, [])
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), [])
  return { toasts, add, remove }
}

function ToastStack({ toasts, remove }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? <CheckCircle size={15}/> : t.type === "warn" ? <AlertTriangle size={15}/> : <ShieldAlert size={15}/>}
          </span>
          <span className="toast-msg">{t.msg}</span>
          <button className="toast-x" onClick={() => remove(t.id)}><X size={12}/></button>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════════
function Modal({ title, onClose, children, size = "md" }) {
  useEffect(() => {
    const fn = e => e.key === "Escape" && onClose()
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [onClose])
  return (
    <div className="overlay" onClick={onClose}>
      <div className={`modal modal-${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-x" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DROPDOWN (async-aware)
// ═══════════════════════════════════════════════════════════
function Dropdown({ value, placeholder, items, loading, renderSelected, renderItem, onSelect, filterFn, onSearch, searchValue, setSearchValue }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", fn)
    return () => document.removeEventListener("mousedown", fn)
  }, [])

  const filtered = filterFn && searchValue
    ? items.filter(i => filterFn(i, searchValue))
    : items

  return (
    <div ref={ref} className="dd-wrap">
      <div className={`dd-trigger${open ? " dd-open" : ""}${value ? " dd-has-val" : ""}`} onClick={() => setOpen(v => !v)}>
        {value
          ? <div className="dd-val">{renderSelected(value)}</div>
          : <span className="dd-ph">{placeholder}</span>}
        <ChevronRight size={13} className={`dd-arr${open ? " dd-arr-open" : ""}`}/>
      </div>
      {open && (
        <div className="dd-drop">
          <div className="dd-search-wrap">
            <Search size={13} className="dd-search-icon"/>
            <input
              className="dd-search"
              value={searchValue}
              onChange={e => { setSearchValue(e.target.value); onSearch?.(e.target.value) }}
              autoFocus
              placeholder="Qidirish…"
            />
            {searchValue && <button className="dd-clear" onClick={() => { setSearchValue(""); onSearch?.("") }}><X size={11}/></button>}
          </div>
          <div className="dd-list">
            {loading
              ? <div className="dd-state"><Loader2 size={18} className="spin"/> Yuklanmoqda…</div>
              : filtered.length === 0
                ? <div className="dd-state"><Search size={16}/> Topilmadi</div>
                : filtered.map((item, i) => (
                  <div
                    key={item.id ?? i}
                    className={`dd-item${value?.id === item.id ? " dd-active" : ""}`}
                    onClick={() => { onSelect(item); setOpen(false); setSearchValue("") }}
                  >
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

// ═══════════════════════════════════════════════════════════
// BATCH CARD
// ═══════════════════════════════════════════════════════════
function BatchList({ batches, loading, selected, onSelect }) {
  if (loading) return (
    <div className="state-sm"><Loader2 size={18} className="spin" style={{color:"#2563eb"}}/> Partiyalar yuklanmoqda…</div>
  )
  const available = (batches || []).filter(b => b.remainingQty > 0)
  if (!available.length) return (
    <div className="state-sm warn"><AlertCircle size={18}/> Bu dori uchun mavjud partiya yo'q</div>
  )
  return (
    <div className="batch-list">
      {available.map(b => {
        const sel = selected?.id === b.id
        const expDate = new Date(b.expiry)
        const nearExp = expDate - Date.now() < 60 * 24 * 60 * 60 * 1000
        return (
          <div key={b.id} className={`batch-item${sel ? " batch-sel" : ""}${nearExp ? " batch-warn" : ""}`} onClick={() => onSelect(b)}>
            <div className="bi-top">
              <span className="bi-series"><Tag size={11}/>{b.series}</span>
              <span className="bi-qty-badge"><CheckCircle size={10}/>{b.remainingQty} ta</span>
            </div>
            {b.boxSeries && (
              <div className="bi-qr-row"><QrCode size={10}/> QR: <strong>{b.boxSeries}</strong></div>
            )}
            <div className="bi-mid">
              <span className="chip chip-gray"><FlaskConical size={9}/>{b.mg}</span>
              <span className={`bi-exp${nearExp ? " bi-exp-warn" : ""}`}><Calendar size={10}/>{fmtD(b.expiry)}</span>
            </div>
            <div className="bi-meta">
              <span className="bi-price"><Banknote size={11}/>{fmt(b.price)} / dona</span>
              {b.contract?.contractNumber && (
                <span className="bi-contract"><FileText size={9}/>{b.contract.contractNumber}</span>
              )}
            </div>
            {nearExp && <div className="bi-exp-label"><AlertTriangle size={10}/> Muddati yaqin</div>}
            {sel && <CheckCircle size={15} className="bi-check"/>}
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// SALE FORM — 5 bosqich
// ═══════════════════════════════════════════════════════════
function SaleForm({ onSaved, showToast }) {
  const [step, setStep]       = useState(1)
  const [customer, setCustomer] = useState(null)
  const [product, setProduct] = useState(null)
  const [batch, setBatch]     = useState(null)
  const [unitPrice, setUnitPrice] = useState(0)
  const [unitsPerBox, setUnitsPerBox] = useState(30)
  const [qty, setQty]         = useState(0)
  const [scanLog, setScanLog] = useState([])
  const [scanInput, setScanInput] = useState("")
  const [saving, setSaving]   = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)

  // Customer search
  const [custSearch, setCustSearch] = useState("")
  const [customers, setCustomers]   = useState([])
  const [custLoading, setCustLoading] = useState(false)
  // Product search
  const [prodSearch, setProdSearch] = useState("")
  const [products, setProducts]     = useState([])
  const [prodLoading, setProdLoading] = useState(false)
  // Batches
  const [batches, setBatches]   = useState([])
  const [batchLoading, setBatchLoading] = useState(false)

  const scanRef = useRef(null)
  const debounceRef = useRef(null)

  // ── fetch customers ──
  const fetchCustomers = useCallback(async (search = "") => {
    setCustLoading(true)
    try {
      const res = await salesApi.customers({ search, limit: 20 })
      setCustomers(Array.isArray(res) ? res : res.items || [])
    } catch { setCustomers([]) }
    finally { setCustLoading(false) }
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const handleCustSearch = val => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchCustomers(val), 300)
  }

  // ── fetch products ──
  const fetchProducts = useCallback(async (search = "") => {
    setProdLoading(true)
    try {
      const res = await salesApi.products({ search, limit: 30 })
      setProducts(Array.isArray(res) ? res : res.items || [])
    } catch { setProducts([]) }
    finally { setProdLoading(false) }
  }, [])

  useEffect(() => { if (step === 2) fetchProducts() }, [step, fetchProducts])

  const handleProdSearch = val => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchProducts(val), 300)
  }

  // ── fetch batches ──
  const fetchBatches = useCallback(async (productId) => {
    setBatchLoading(true)
    try {
      const res = await salesApi.batches(productId)
      setBatches(Array.isArray(res) ? res : res.items || [])
    } catch { setBatches([]) }
    finally { setBatchLoading(false) }
  }, [])

  useEffect(() => { if (step === 3 && product) fetchBatches(product.id) }, [step, product, fetchBatches])
  useEffect(() => { if (step === 5 && scanRef.current) scanRef.current.focus() }, [step])

  const reset = () => {
    setStep(1); setCustomer(null); setProduct(null); setBatch(null)
    setUnitPrice(0); setUnitsPerBox(30); setQty(0); setScanLog([]); setScanInput("")
    setCustSearch(""); setProdSearch("")
  }

  // ── scan handler ──
  const handleScan = () => {
    const val = scanInput.trim()
    if (!val || !batch) return
    if (/[\u0400-\u04FF]/.test(val)) {
      beepErr(); showToast("Rus klaviaturasi o'chirilsin!", "warn"); setScanInput(""); return
    }
    setScanInput(""); scanRef.current?.focus()
    if (scanLog.some(l => l.original === val)) {
      beepErr(); showToast("Bu kod allaqon skanerlangan!", "warn"); return
    }
    const parsed = parseGS1(val)
    const result = checkMatch(parsed, batch, unitsPerBox)
    if (result.match) {
      setQty(q => q + result.addQty)
      setScanLog(l => [...l, { type: result.scanType, series: result.extracted, original: val, count: result.addQty, time: new Date() }])
      beepOk()
    } else {
      beepErr()
      const exp = batch.boxSeries ? `"${batch.series}" yoki "${batch.boxSeries}"` : `"${batch.series}"`
      setConfirmModal({ extracted: result.extracted, original: val, scanType: result.scanType, addQty: result.addQty || 1, message: `Skanerlangan: "${result.extracted}"\nKutilgan: ${exp}\n\nBoshqa partiyaga tegishli bo'lishi mumkin.` })
    }
  }

  const confirmAdd = () => {
    if (!confirmModal) return
    setQty(q => q + confirmModal.addQty)
    setScanLog(l => [...l, { type: confirmModal.scanType, series: confirmModal.extracted, original: confirmModal.original, count: confirmModal.addQty, time: new Date(), warning: true }])
    beepOk(); setConfirmModal(null); scanRef.current?.focus()
  }

  // ── save ──
  const handleSave = async () => {
    if (!customer || !product || !batch || qty < 1) return
    setSaving(true)
    try {
      const body = {
        customerId: customer.id,
        items: [{ productId: product.id, batchId: batch.id, quantity: qty, price: unitPrice }],
      }
      const sale = await salesApi.createSale(body)
      showToast("Sotuv muvaffaqiyatli saqlandi!")
      onSaved(sale)
      reset()
    } catch (e) {
      showToast(e.message || "Xatolik yuz berdi", "error")
    } finally {
      setSaving(false)
    }
  }

  const canNext = () => {
    if (step === 1) return !!customer
    if (step === 2) return !!product
    if (step === 3) return !!batch
    if (step === 4) return unitPrice > 0
    return false
  }

  const totalPrice = qty * unitPrice
  const boxScans  = scanLog.filter(l => l.type === "barcode").length
  const qrScans   = scanLog.filter(l => l.type === "qr").length
  const warnCount = scanLog.filter(l => l.warning).length

  const STEPS = [
    { n:1, label:"Mijoz",   Icon: User },
    { n:2, label:"Dori",    Icon: Package },
    { n:3, label:"Partiya", Icon: Layers },
    { n:4, label:"Narx",    Icon: Banknote },
    { n:5, label:"Skaner",  Icon: Scan },
  ]

  return (
    <>
    <div className="sf-card">
      {/* Header */}
      <div className="sf-header">
        <div className="sf-header-left">
          <ShoppingCart size={18} className="sf-header-icon"/>
          Yangi sotuv
        </div>
        <button className="sf-reset-btn" onClick={reset}><RefreshCw size={12}/> Tozalash</button>
      </div>

      {/* Steps */}
      <div className="sf-steps">
        {STEPS.map((s, i) => {
          const done = step > s.n, active = step === s.n
          return (
            <div key={s.n} className="sf-step-wrapper">
              <div
                className={`sf-step${active ? " sf-step-active" : done ? " sf-step-done" : ""}`}
                onClick={() => done && setStep(s.n)}
                style={{ cursor: done ? "pointer" : "default" }}
              >
                {done ? <CheckCircle size={12}/> : <s.Icon size={11}/>}
                <span className="sf-step-label">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`sf-step-line${done ? " sf-line-done" : ""}`}/>
              )}
            </div>
          )
        })}
      </div>

      {/* Body */}
      <div className="sf-body">

        {/* STEP 1 — Mijoz */}
        {step === 1 && (
          <div className="sf-panel">
            <div className="sf-panel-head"><User size={15}/> Mijozni tanlang</div>
            <Dropdown
              value={customer} placeholder="Ism yoki telefon bo'yicha…"
              items={customers} loading={custLoading}
              searchValue={custSearch} setSearchValue={setCustSearch}
              onSearch={handleCustSearch}
              renderSelected={c => (
                <div className="dd-row">
                  <div className="dd-avatar">{c.name[0]}</div>
                  <div>
                    <div className="dd-row-main">{c.name}</div>
                    <div className="dd-row-sub"><Phone size={10}/>{c.phone}</div>
                  </div>
                </div>
              )}
              renderItem={c => (
                <div className="dd-row">
                  <div className="dd-avatar">{c.name[0]}</div>
                  <div>
                    <div className="dd-row-main">{c.name}</div>
                    <div className="dd-row-sub"><Phone size={10}/>{c.phone}{c.inn && <><Hash size={9}/>{c.inn}</>}</div>
                  </div>
                </div>
              )}
              onSelect={c => { setCustomer(c); setStep(2) }}
            />
            {customer && (
              <div className="sf-chosen">
                <div className="sf-chosen-avatar">{customer.name[0]}</div>
                <div>
                  <div className="sf-chosen-name">{customer.name}</div>
                  <div className="sf-chosen-sub">{customer.phone}{customer.inn && ` · INN: ${customer.inn}`}</div>
                </div>
                <button className="sf-chosen-change" onClick={() => setCustomer(null)}><X size={13}/></button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2 — Dori */}
        {step === 2 && (
          <div className="sf-panel">
            <div className="sf-panel-head"><Package size={15}/> Dorini tanlang</div>
            <Dropdown
              value={product} placeholder="Nomi yoki IKPU kodi…"
              items={products} loading={prodLoading}
              searchValue={prodSearch} setSearchValue={setProdSearch}
              onSearch={handleProdSearch}
              renderSelected={p => (
                <div className="dd-row">
                  <div className="dd-icon-wrap"><Package size={13}/></div>
                  <div>
                    <div className="dd-row-main">{p.name}</div>
                    {p.ikpuCode && <div className="dd-row-sub mono">{p.ikpuCode}</div>}
                  </div>
                </div>
              )}
              renderItem={p => (
                <div className="dd-row">
                  <div className="dd-icon-wrap"><Package size={13}/></div>
                  <div>
                    <div className="dd-row-main">{p.name}</div>
                    <div className="dd-row-sub">
                      {p.ikpuCode && <span className="mono">{p.ikpuCode}</span>}
                      {p.unit && <span>· {p.unit}</span>}
                    </div>
                  </div>
                </div>
              )}
              onSelect={p => { setProduct(p); setBatch(null); setStep(3) }}
            />
          </div>
        )}

        {/* STEP 3 — Partiya */}
        {step === 3 && product && (
          <div className="sf-panel">
            <div className="sf-panel-head">
              <Layers size={15}/> Partiyani tanlang
              <span className="sf-panel-badge"><Package size={10}/>{product.name}</span>
            </div>
            <BatchList
              batches={batches} loading={batchLoading}
              selected={batch}
              onSelect={b => { setBatch(b); setUnitPrice(b.price || 0); setQty(0); setScanLog([]); setStep(4) }}
            />
          </div>
        )}

        {/* STEP 4 — Narx */}
        {step === 4 && batch && (
          <div className="sf-panel">
            <div className="sf-panel-head"><Banknote size={15}/> Narx va sozlamalar</div>

            <div className="sf-batch-summary">
              {[
                { label:"Seriya", val: <span className="chip chip-purple"><Tag size={9}/>{batch.series}</span> },
                ...(batch.boxSeries ? [{ label:"QR seriya", val: <span className="chip chip-blue"><QrCode size={9}/>{batch.boxSeries}</span> }] : []),
                { label:"Dozaj",   val: <span className="chip chip-gray"><FlaskConical size={9}/>{batch.mg}</span> },
                { label:"Omborda", val: <span className="sbs-green sbs-val"><CheckCircle size={11}/>{batch.remainingQty} ta</span> },
                { label:"Muddat",  val: <span className="sbs-val"><Calendar size={10}/>{fmtD(batch.expiry)}</span> },
                ...(batch.contract?.contractNumber ? [{ label:"Shartnoma", val: <span className="mono sbs-val">{batch.contract.contractNumber}</span> }] : []),
              ].map(({ label, val }) => (
                <div key={label} className="sbs-item">
                  <span className="sbs-label">{label}</span>
                  {val}
                </div>
              ))}
            </div>

            <div className="sf-fields">
              {[
                { label:"Sotish narxi (1 dona)", id:"price", val: unitPrice, set: setUnitPrice, suffix:"so'm", req:true },
                { label:"1 qutida nechta dona", id:"upb",   val: unitsPerBox, set: v => setUnitsPerBox(v), suffix:"dona", hint:`Quti barkodi skanerlanganda +${unitsPerBox} dona qo'shiladi` },
              ].map(f => (
                <div key={f.id} className="sf-field">
                  <label className="sf-label" htmlFor={f.id}>{f.label}{f.req && <span className="req">*</span>}</label>
                  <div className="sf-input-wrap">
                    <input id={f.id} type="number" min="0" value={f.val}
                      onChange={e => f.set(Number(e.target.value))}
                      className="sf-input"/>
                    <span className="sf-input-suffix">{f.suffix}</span>
                  </div>
                  {f.hint && <span className="sf-hint">{f.hint}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5 — Skaner */}
        {step === 5 && batch && (
          <div className="sf-panel">
            {/* Counter */}
            <div className="sf-counter">
              <div className="sf-count-num">{qty}</div>
              <div className="sf-count-label">dona skanerlangan</div>
              <div className="sf-count-price">{fmt(totalPrice)}</div>
            </div>

            {/* Mini stats */}
            <div className="sf-mini-stats">
              <div className="ms-item ms-blue"><Package size={13}/><div><div className="ms-val">{boxScans}</div><div className="ms-lbl">Quti</div></div></div>
              <div className="ms-item ms-violet"><QrCode size={13}/><div><div className="ms-val">{qrScans}</div><div className="ms-lbl">QR</div></div></div>
              <div className="ms-item ms-green"><BarChart3 size={13}/><div><div className="ms-val ms-val-sm">{fmt(totalPrice)}</div><div className="ms-lbl">Jami</div></div></div>
            </div>

            {warnCount > 0 && (
              <div className="scan-warn-banner">
                <AlertTriangle size={14}/> {warnCount} ta seriyasi mos kelmaydigan dori qo'shildi
              </div>
            )}

            {/* Scan input */}
            <div className="sf-scan-box">
              <div className="sf-scan-label"><Scan size={12}/> Barkod yoki QR skanerlang</div>
              <div className="sf-series-ref">
                <span><Tag size={10}/> <strong>{batch.series}</strong></span>
                {batch.boxSeries && <span><QrCode size={10}/> <strong>{batch.boxSeries}</strong></span>}
              </div>
              <div className="sf-scan-input-wrap">
                <input
                  ref={scanRef}
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleScan()}
                  placeholder="Scan qiling yoki yozing, Enter bosing…"
                  className="sf-scan-input"
                  autoFocus
                />
                <button
                  className="sf-scan-btn"
                  onClick={handleScan}
                  disabled={!scanInput.trim()}
                ><Scan size={15}/></button>
              </div>
              <p className="sf-scan-hint">Quti barkodi → +{unitsPerBox} dona &nbsp;|&nbsp; QR markirovka → +1 dona</p>
            </div>

            {/* Manual */}
            <div className="sf-manual">
              <button className="manual-btn manual-sub" disabled={qty === 0} onClick={() => {
                if (qty <= 0) return
                setQty(q => q - 1)
                setScanLog(l => l.length ? [...l.slice(0, -1)] : l)
              }}><Minus size={14}/></button>
              <div className="manual-center">
                <span className="manual-label">Qo'lda kiritish</span>
                <span className="manual-qty">{qty} dona</span>
              </div>
              <button className="manual-btn manual-add" onClick={() => {
                setQty(q => q + 1)
                setScanLog(l => [...l, { type:"manual", series: batch.series, original:"__m__"+Date.now(), count:1, time: new Date() }])
              }}><Plus size={14}/></button>
            </div>

            {/* Log */}
            {scanLog.length > 0 && (
              <div className="sf-log">
                <div className="sf-log-head">
                  <span><ClipboardList size={12}/> Jurnal ({scanLog.length} scan / {qty} dona)</span>
                  <button className="sf-log-clear" onClick={() => { setScanLog([]); setQty(0) }}>
                    <Trash2 size={10}/> Tozalash
                  </button>
                </div>
                <div className="sf-log-list">
                  {[...scanLog].reverse().slice(0, 12).map((l, i) => (
                    <div key={i} className={`sf-log-item${l.type === "barcode" ? " sf-log-box" : l.type === "qr" ? " sf-log-qr" : " sf-log-manual"}${l.warning ? " sf-log-warn" : ""}`}>
                      {l.type === "barcode" ? <Package size={11} className="log-icon-box"/> : l.type === "qr" ? <QrCode size={11} className="log-icon-qr"/> : <Plus size={11} className="log-icon-manual"/>}
                      <span className="sf-log-series">{l.series}</span>
                      <span className={`ltb ltb-${l.type === "barcode" ? "box" : l.type === "qr" ? "qr" : "manual"}`}>{l.type === "barcode" ? "quti" : l.type === "qr" ? "QR" : "qo'l"}</span>
                      <span className="sf-log-count">+{l.count}</span>
                      {l.warning && <AlertTriangle size={10} style={{color:"#d97706",flexShrink:0}}/>}
                      <span className="sf-log-time">{new Date(l.time).toLocaleTimeString("uz-UZ")}</span>
                    </div>
                  ))}
                  {scanLog.length > 12 && <div className="sf-log-more">… yana {scanLog.length - 12} ta</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sf-footer">
        {step > 1
          ? <button className="sf-btn-back" onClick={() => setStep(s => s - 1)}><ArrowLeft size={13}/> Ortga</button>
          : <div/>}
        <div className="sf-footer-right">
          {step < 5 && (
            <button className="sf-btn-next" disabled={!canNext()} onClick={() => setStep(s => s + 1)}>
              Keyingi <ChevronRight size={13}/>
            </button>
          )}
          {step === 5 && qty > 0 && (
            <button className="sf-btn-save" onClick={handleSave} disabled={saving}>
              {saving
                ? <><Loader2 size={14} className="spin"/> Saqlanmoqda…</>
                : <><CheckCircle size={14}/> Saqlash — {fmt(totalPrice)}</>}
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Confirm Modal */}
    {confirmModal && (
      <div className="overlay" onClick={() => { setConfirmModal(null); scanRef.current?.focus() }}>
        <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
          <div className="modal-head modal-head-warn">
            <h3 className="modal-title" style={{color:"#92400e",display:"flex",alignItems:"center",gap:8}}>
              <AlertTriangle size={17} style={{color:"#d97706"}}/> Seriya mos kelmadi
            </h3>
            <button className="modal-x" onClick={() => { setConfirmModal(null); scanRef.current?.focus() }}><X size={15}/></button>
          </div>
          <div className="modal-body">
            <p className="confirm-msg">{confirmModal.message}</p>
            <div className="confirm-actions">
              <button className="btn-sec" onClick={() => { setConfirmModal(null); scanRef.current?.focus() }}>Bekor</button>
              <button className="sf-btn-warn" onClick={confirmAdd}><CheckCircle size={13}/> Baribir qo'shish</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// SALE DETAIL MODAL
// ═══════════════════════════════════════════════════════════
function SaleDetailModal({ saleId, onClose, onCancelled, showToast }) {
  const [sale, setSale]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    salesApi.sale(saleId)
      .then(setSale)
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false))
  }, [saleId])

  const handleCancel = async () => {
    if (!window.confirm(`Sotuv #${saleId} bekor qilinsinmi? Batch qoldig'i qaytariladi.`)) return
    setCancelling(true)
    try {
      await salesApi.cancelSale(saleId)
      showToast("Sotuv bekor qilindi, qoldiqlar qaytarildi")
      onCancelled(saleId)
      onClose()
    } catch (e) {
      showToast(e.message || "Xatolik", "error")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Modal title={`Sotuv #${saleId}`} onClose={onClose} size="lg">
      {loading ? (
        <div className="state-box"><Loader2 size={28} className="spin" style={{color:"#2563eb"}}/></div>
      ) : !sale ? (
        <div className="state-box"><ShieldAlert size={28} style={{color:"#fca5a5"}}/> Yuklanmadi</div>
      ) : (
        <>
          <div className="dm-meta">
            {[
              { label:<><User size={10}/> Mijoz</>,        val: sale.customer?.name || "—" },
              { label:<><Phone size={10}/> Telefon</>,     val: sale.customer?.phone || "—" },
              { label:<><Calendar size={10}/> Sana</>,     val: fmtDT(sale.createdAt) },
              { label:<><Banknote size={10}/> Jami</>,     val: fmt(sale.totalPrice), accent: true },
            ].map((m, i) => (
              <div key={i} className={`dm-meta-item${m.accent ? " dm-accent" : ""}`}>
                <div className="dm-label">{m.label}</div>
                <div className="dm-val">{m.val}</div>
              </div>
            ))}
          </div>

          <div className="tbl-scroll">
            <table className="tbl tbl-modal">
              <thead><tr>
                {["Mahsulot","Seriya","Dozaj","Muddat","Shartnoma","Faktura","Miqdor","Narx","Jami"].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {(sale.items || []).map(it => (
                  <tr key={it.id}>
                    <td className="td-product-name">{it.product?.name}</td>
                    <td><span className="chip chip-purple"><Tag size={9}/>{it.batch?.series}</span></td>
                    <td><span className="chip chip-gray"><FlaskConical size={9}/>{it.batch?.mg}</span></td>
                    <td className="td-date">{fmtD(it.batch?.expiry)}</td>
                    <td className="mono">{it.batch?.contract?.contractNumber || "—"}</td>
                    <td className="mono">{it.batch?.invoice?.invoiceNumber || "—"}</td>
                    <td><span className="td-qty-pill">{it.quantity}</span></td>
                    <td className="mono">{fmt(it.price)}</td>
                    <td className="td-total">{fmt(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dm-footer">
            <button className="btn-danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <><Loader2 size={13} className="spin"/> Bekor qilinmoqda…</> : <><Trash2 size={13}/> Bekor qilish</>}
            </button>
            <button className="btn-sec" onClick={onClose}>Yopish</button>
          </div>
        </>
      )}
    </Modal>
  )
}

// ═══════════════════════════════════════════════════════════
// SALES TABLE
// ═══════════════════════════════════════════════════════════
const PER_PAGE = 10

function SalesTable({ refreshKey, showToast }) {
  const [sales,     setSales]   = useState([])
  const [meta,      setMeta]    = useState({ total: 0, totalPages: 1 })
  const [loading,   setLoading] = useState(true)
  const [error,     setError]   = useState(null)
  const [page,      setPage]    = useState(1)
  const [dateFrom,  setDateFrom]  = useState("")
  const [dateTo,    setDateTo]    = useState("")
  const [detail,    setDetail]    = useState(null)

  const fetchSales = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = { page, limit: PER_PAGE }
      if (dateFrom) params.dateFrom = new Date(dateFrom).toISOString()
      if (dateTo)   params.dateTo   = new Date(dateTo + "T23:59:59").toISOString()
      const res = await salesApi.sales(params)
      if (Array.isArray(res)) {
        setSales(res)
        setMeta({ total: res.length, totalPages: 1 })
      } else {
        setSales(res.items || [])
        setMeta(res.meta || { total: 0, totalPages: 1 })
      }
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [page, dateFrom, dateTo, refreshKey])

  useEffect(() => { fetchSales() }, [fetchSales])
  useEffect(() => { setPage(1) }, [dateFrom, dateTo])

  const totalRev = sales.reduce((s, x) => s + Number(x.totalPrice || 0), 0)

  return (
    <div className="st-card">
      {/* Header */}
      <div className="st-header">
        <div className="st-header-left">
          <History size={17} className="st-header-icon"/>
          <div>
            <div className="st-title">Sotuvlar tarixi</div>
            <div className="st-subtitle">{meta.total} ta sotuv</div>
          </div>
        </div>
      </div>

      {/* Revenue bar */}
      {!loading && !error && sales.length > 0 && (
        <div className="st-rev-bar">
          <div className="rev-item">
            <div className="rev-icon rev-green"><TrendingUp size={16}/></div>
            <div><div className="rev-label">Jami tushum</div><div className="rev-val">{fmt(totalRev)}</div></div>
          </div>
          <div className="rev-divider"/>
          <div className="rev-item">
            <div className="rev-icon rev-blue"><ReceiptText size={16}/></div>
            <div><div className="rev-label">Sotuvlar soni</div><div className="rev-val">{meta.total} ta</div></div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="st-filters">
        <Calendar size={13} className="filter-icon"/>
        <div className="filter-group">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="filter-input"/>
          <span className="filter-sep">—</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="filter-input"/>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo("") }} className="filter-clear">
              <X size={11}/> Tozalash
            </button>
          )}
        </div>
        {loading && <Loader2 size={14} className="spin" style={{color:"#2563eb",marginLeft:"auto"}}/>}
      </div>

      {/* Content */}
      {error ? (
        <div className="state-box">
          <ShieldAlert size={40} style={{color:"#fca5a5"}}/>
          <p>{error}</p>
          <button className="sf-btn-next" onClick={fetchSales}>Qayta urinish</button>
        </div>
      ) : loading && sales.length === 0 ? (
        <div className="state-box"><Loader2 size={36} className="spin" style={{color:"#2563eb",opacity:.3}}/></div>
      ) : sales.length === 0 ? (
        <div className="state-box">
          <ReceiptText size={40} strokeWidth={1} style={{color:"#e2e8f0"}}/>
          <p>{dateFrom || dateTo ? "Bu sana oralig'ida sotuv topilmadi" : "Hali sotuv yo'q"}</p>
        </div>
      ) : (
        <>
          <div className="tbl-scroll">
            <table className="tbl">
              <thead><tr>
                {["#","Mijoz","Mahsulotlar","Miqdor","Jami","Sana",""].map(h => <th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {sales.map(sale => {
                  const itemCount = sale._count?.items ?? sale.items?.length ?? 0
                  const totalQty  = sale.items?.reduce((s, i) => s + i.quantity, 0) ?? "—"
                  return (
                    <tr key={sale.id} className="tbl-row" onClick={() => setDetail(sale.id)}>
                      <td><span className="td-id">#{sale.id}</span></td>
                      <td>
                        <div className="td-cust-cell">
                          <div className="td-avatar">{sale.customer?.name?.[0] || "?"}</div>
                          <div>
                            <div className="td-cust">{sale.customer?.name}</div>
                            <div className="td-phone">{sale.customer?.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="td-items">
                          {(sale.items || []).slice(0, 2).map(it => (
                            <div key={it.id} className="td-chip">
                              {it.product?.name}<span className="chip-x">×{it.quantity}</span>
                            </div>
                          ))}
                          {itemCount > 2 && <span className="td-more">+{itemCount - 2} ta</span>}
                        </div>
                      </td>
                      <td><span className="td-qty-pill">{totalQty} dona</span></td>
                      <td><span className="td-total">{fmt(sale.totalPrice)}</span></td>
                      <td><span className="td-date">{fmtDT(sale.createdAt)}</span></td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="btn-history" onClick={() => setDetail(sale.id)}>
                          <ReceiptText size={11}/> Ko'rish
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="st-footer">
              <span className="pag-info">{(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, meta.total)} / {meta.total}</span>
              <div className="pag">
                <button className="pag-btn" disabled={page === 1} onClick={() => setPage(p => p-1)}>
                  <ChevronLeft size={13}/>
                </button>
                {Array.from({ length: meta.totalPages }, (_, i) => i+1).map(n => (
                  <button key={n} className={`pag-btn${n === page ? " pag-active" : ""}`} onClick={() => setPage(n)}>{n}</button>
                ))}
                <button className="pag-btn" disabled={page === meta.totalPages} onClick={() => setPage(p => p+1)}>
                  <ChevronRight size={13}/>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail modal */}
      {detail && (
        <SaleDetailModal
          saleId={detail}
          onClose={() => setDetail(null)}
          onCancelled={() => { setDetail(null); fetchSales() }}
          showToast={showToast}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════
export default function Sales() {
  const [activeTab,   setActiveTab]   = useState("new")
  const [refreshKey,  setRefreshKey]  = useState(0)
  const { toasts, add: showToast, remove: removeToast } = useToast()

  const handleSaved = useCallback(() => {
    setRefreshKey(k => k + 1)
    setActiveTab("history")
  }, [])

  return (
    <>
      <style>{STYLES}</style>
      <ToastStack toasts={toasts} remove={removeToast}/>

      <div className="page">
        {/* Mobile tab bar */}
        <div className="page-tabs">
          {[
            { key:"new",     label:"Yangi sotuv", Icon: ShoppingCart },
            { key:"history", label:"Tarix",       Icon: History },
          ].map(t => (
            <button
              key={t.key}
              className={`page-tab${activeTab === t.key ? " tab-active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              <t.Icon size={14}/>{t.label}
            </button>
          ))}
        </div>

        <div className="page-body">
          <div className={`col${activeTab === "new" ? "" : " col-hide"}`}>
            <SaleForm showToast={showToast} onSaved={handleSaved}/>
          </div>
          <div className={`col${activeTab === "history" ? "" : " col-hide-mobile"}`}>
            <SalesTable refreshKey={refreshKey} showToast={showToast}/>
          </div>
        </div>
      </div>
    </>
  )
}

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const STYLES = `
*, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }

.page {
  min-height: 100vh;
  background: #f1f5f9;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #0f172a;
}

/* ── TABS ── */
.page-tabs {
  display: none;
  background: #fff;
  border-bottom: 1.5px solid #e2e8f0;
  padding: 0 20px;
  gap: 4px;
}
.page-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 14px 18px; font-size: 13px; font-weight: 600;
  border: none; background: none; cursor: pointer;
  color: #94a3b8; border-bottom: 2.5px solid transparent;
  transition: all .15s; font-family: inherit;
}
.tab-active { color: #2563eb !important; border-bottom-color: #2563eb !important; }

/* ── LAYOUT ── */
.page-body {
  display: grid;
  grid-template-columns: 460px 1fr;
  gap: 20px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  align-items: start;
}
.col { min-width: 0; }

/* ── FORM CARD ── */
.sf-card {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 18px;
  overflow: hidden;
  position: sticky;
  top: 20px;
  box-shadow: 0 4px 24px rgba(0,0,0,.06);
}
.sf-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1.5px solid #f1f5f9;
  background: linear-gradient(135deg, #f8faff 0%, #f0f7ff 100%);
}
.sf-header-left { display:flex; align-items:center; gap:9px; font-size:15px; font-weight:800; color:#0f172a; letter-spacing:-.3px; }
.sf-header-icon { color:#2563eb; }
.sf-reset-btn {
  display:inline-flex; align-items:center; gap:5px;
  background:none; border:1.5px solid #e2e8f0; border-radius:8px;
  padding:5px 12px; font-size:12px; font-weight:600; color:#94a3b8;
  cursor:pointer; transition:all .15s; font-family:inherit;
}
.sf-reset-btn:hover { border-color:#fca5a5; color:#dc2626; background:#fef2f2; }

/* Steps */
.sf-steps { display:flex; align-items:center; padding:14px 20px; border-bottom:1.5px solid #f1f5f9; overflow-x:auto; gap:0; }
.sf-step-wrapper { display:flex; align-items:center; flex-shrink:0; }
.sf-step {
  display:flex; align-items:center; gap:6px; padding:6px 11px; border-radius:20px;
  font-size:11px; font-weight:700; color:#94a3b8; background:#f1f5f9;
  white-space:nowrap; transition:all .2s;
}
.sf-step-active { background:#eff6ff; color:#2563eb; box-shadow:0 0 0 2px #bfdbfe; }
.sf-step-done   { background:#dcfce7; color:#16a34a; cursor:pointer; }
.sf-step-label  { font-size:11px; }
.sf-step-line   { width:20px; height:2px; background:#e2e8f0; margin:0 4px; flex-shrink:0; }
.sf-line-done   { background:#16a34a; }

.sf-body { padding:20px; min-height:280px; }
.sf-panel { display:flex; flex-direction:column; gap:14px; }
.sf-panel-head { display:flex; align-items:center; gap:7px; font-size:14px; font-weight:700; color:#0f172a; flex-wrap:wrap; }
.sf-panel-badge { display:inline-flex; align-items:center; gap:4px; background:#eff6ff; color:#2563eb; font-size:11px; font-weight:600; padding:3px 9px; border-radius:20px; margin-left:6px; }

.sf-chosen { display:flex; align-items:center; gap:12px; background:#f0fdf4; border:1.5px solid #86efac; border-radius:12px; padding:12px 14px; }
.sf-chosen-avatar { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; font-weight:800; font-size:15px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.sf-chosen-name { font-weight:700; color:#0f172a; font-size:14px; }
.sf-chosen-sub  { font-size:12px; color:#64748b; margin-top:2px; }
.sf-chosen-change { margin-left:auto; background:none; border:none; cursor:pointer; color:#94a3b8; display:flex; align-items:center; width:28px; height:28px; border-radius:6px; justify-content:center; transition:all .15s; }
.sf-chosen-change:hover { background:#fee2e2; color:#dc2626; }

/* Batch */
.batch-list { display:flex; flex-direction:column; gap:8px; max-height:300px; overflow-y:auto; }
.batch-item { position:relative; border:1.5px solid #e2e8f0; border-radius:12px; padding:12px 14px; cursor:pointer; background:#fafbff; transition:all .15s; display:flex; flex-direction:column; gap:6px; }
.batch-item:hover { border-color:#93c5fd; background:#f0f7ff; }
.batch-sel  { border-color:#2563eb; background:#eff6ff; box-shadow:0 0 0 3px #dbeafe; }
.batch-warn { border-color:#fde68a !important; }
.bi-top  { display:flex; justify-content:space-between; align-items:center; }
.bi-series { display:inline-flex; align-items:center; gap:5px; font-family:monospace; font-weight:800; color:#6d28d9; font-size:13px; }
.bi-qty-badge { display:inline-flex; align-items:center; gap:4px; background:#dcfce7; color:#16a34a; font-size:12px; font-weight:700; padding:3px 9px; border-radius:20px; }
.bi-qr-row { display:inline-flex; align-items:center; gap:5px; font-size:11px; color:#7c3aed; background:#f5f3ff; padding:2px 8px; border-radius:5px; width:fit-content; font-family:monospace; }
.bi-qr-row strong { font-weight:700; }
.bi-mid  { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.bi-exp  { display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#94a3b8; }
.bi-exp-warn { color:#d97706 !important; }
.bi-meta { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.bi-price { display:inline-flex; align-items:center; gap:5px; font-size:13px; font-weight:700; color:#0f172a; }
.bi-contract { display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#64748b; font-family:monospace; }
.bi-exp-label { display:inline-flex; align-items:center; gap:4px; font-size:10px; font-weight:700; color:#d97706; background:#fffbeb; padding:2px 7px; border-radius:5px; width:fit-content; }
.bi-check { position:absolute; top:12px; right:12px; color:#2563eb; }

.sf-batch-summary { display:grid; grid-template-columns:1fr 1fr; gap:10px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; padding:14px; }
.sbs-item  { display:flex; flex-direction:column; gap:4px; }
.sbs-label { font-size:10px; font-weight:700; text-transform:uppercase; color:#94a3b8; }
.sbs-val   { display:inline-flex; align-items:center; gap:4px; font-size:13px; font-weight:600; color:#334155; }
.sbs-green { color:#16a34a; }

/* Fields */
.sf-fields { display:flex; flex-direction:column; gap:14px; }
.sf-field  { display:flex; flex-direction:column; gap:6px; }
.sf-label  { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#475569; }
.req { color:#ef4444; }
.sf-input-wrap { position:relative; display:flex; align-items:center; }
.sf-input { width:100%; border:1.5px solid #e2e8f0; border-radius:10px; padding:11px 52px 11px 13px; font-size:15px; font-weight:600; outline:none; font-family:inherit; color:#0f172a; transition:border-color .15s, box-shadow .15s; background:#fff; }
.sf-input:focus { border-color:#2563eb; box-shadow:0 0 0 3px #dbeafe; }
.sf-input-suffix { position:absolute; right:12px; font-size:12px; font-weight:600; color:#94a3b8; white-space:nowrap; }
.sf-hint { display:inline-flex; align-items:center; gap:4px; font-size:11px; color:#94a3b8; }

/* Counter */
.sf-counter { text-align:center; padding:24px 0 18px; border:1.5px solid #e2e8f0; border-radius:14px; background:linear-gradient(135deg,#fafbff,#f0f7ff); }
.sf-count-num   { font-size:68px; font-weight:900; color:#2563eb; line-height:1; letter-spacing:-2px; }
.sf-count-label { font-size:13px; color:#94a3b8; margin-top:4px; }
.sf-count-price { font-size:22px; font-weight:800; color:#16a34a; margin-top:10px; }

/* Mini stats */
.sf-mini-stats { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
.ms-item  { display:flex; align-items:center; gap:9px; border-radius:10px; padding:10px 12px; }
.ms-blue   { background:#eff6ff; color:#2563eb; }
.ms-violet { background:#f5f3ff; color:#7c3aed; }
.ms-green  { background:#f0fdf4; color:#16a34a; }
.ms-val    { font-size:13px; font-weight:800; line-height:1.2; }
.ms-val-sm { font-size:10px; }
.ms-lbl    { font-size:10px; color:#94a3b8; margin-top:2px; }

.scan-warn-banner { display:flex; align-items:center; gap:8px; background:#fffbeb; border:1.5px solid #fde68a; border-radius:10px; padding:10px 14px; font-size:13px; font-weight:600; color:#92400e; }

/* Scan */
.sf-scan-box { background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:9px; }
.sf-scan-label { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:#475569; }
.sf-series-ref { display:flex; gap:8px; flex-wrap:wrap; }
.sf-series-ref span { display:inline-flex; align-items:center; gap:5px; font-size:11px; color:#64748b; background:#f1f5f9; padding:4px 10px; border-radius:7px; }
.sf-series-ref strong { color:#0f172a; font-family:monospace; }
.sf-scan-input-wrap { display:flex; gap:8px; }
.sf-scan-input { flex:1; border:2px solid #2563eb; border-radius:10px; padding:12px 14px; font-size:14px; font-weight:600; outline:none; font-family:inherit; color:#0f172a; transition:box-shadow .15s; }
.sf-scan-input:focus { box-shadow:0 0 0 3px #dbeafe; }
.sf-scan-btn { background:#2563eb; color:#fff; border:none; border-radius:10px; width:46px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .15s; flex-shrink:0; }
.sf-scan-btn:hover:not(:disabled) { background:#1d4ed8; }
.sf-scan-btn:disabled { background:#93c5fd; cursor:not-allowed; }
.sf-scan-hint { font-size:11px; color:#94a3b8; text-align:center; }

/* Manual */
.sf-manual { display:flex; align-items:center; gap:12px; background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:12px; padding:10px 14px; }
.manual-center { flex:1; text-align:center; }
.manual-label { display:block; font-size:11px; color:#94a3b8; font-weight:600; }
.manual-qty   { display:block; font-size:15px; font-weight:800; color:#0f172a; }
.manual-btn { width:38px; height:38px; border:none; border-radius:9px; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; flex-shrink:0; }
.manual-sub { background:#fee2e2; color:#dc2626; }
.manual-sub:hover:not(:disabled) { background:#fecaca; }
.manual-sub:disabled { opacity:.4; cursor:not-allowed; }
.manual-add { background:#dcfce7; color:#16a34a; }
.manual-add:hover { background:#bbf7d0; }

/* Log */
.sf-log { background:#f8fafc; border-radius:11px; padding:12px; }
.sf-log-head { display:flex; justify-content:space-between; align-items:center; font-size:11px; font-weight:700; text-transform:uppercase; color:#64748b; margin-bottom:8px; }
.sf-log-head span { display:flex; align-items:center; gap:5px; }
.sf-log-clear { display:flex; align-items:center; gap:4px; background:none; border:none; cursor:pointer; font-size:11px; color:#ef4444; font-weight:600; }
.sf-log-list { display:flex; flex-direction:column; gap:4px; max-height:200px; overflow-y:auto; }
.sf-log-item  { display:flex; align-items:center; gap:7px; font-size:12px; padding:5px 8px; border-radius:7px; }
.sf-log-box    { background:#eff6ff; }
.sf-log-qr     { background:#f5f3ff; }
.sf-log-manual { background:#f0fdf4; }
.sf-log-warn   { background:#fffbeb !important; }
.log-icon-box    { color:#2563eb; flex-shrink:0; }
.log-icon-qr     { color:#7c3aed; flex-shrink:0; }
.log-icon-manual { color:#16a34a; flex-shrink:0; }
.sf-log-series { font-family:monospace; font-weight:700; color:#6d28d9; flex:1; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:140px; }
.sf-log-count  { font-weight:800; color:#2563eb; flex-shrink:0; }
.sf-log-time   { color:#94a3b8; font-size:10px; flex-shrink:0; }
.sf-log-more   { text-align:center; font-size:11px; color:#94a3b8; padding:4px; }
.ltb { display:inline-block; font-size:9px; font-weight:700; padding:1px 5px; border-radius:4px; flex-shrink:0; }
.ltb-box    { background:#eff6ff; color:#2563eb; }
.ltb-qr     { background:#f5f3ff; color:#7c3aed; }
.ltb-manual { background:#f0fdf4; color:#16a34a; }

/* Footer */
.sf-footer { display:flex; align-items:center; justify-content:space-between; padding:14px 20px; border-top:1.5px solid #f1f5f9; background:#fafbff; gap:10px; }
.sf-footer-right { display:flex; gap:8px; }
.sf-btn-back { display:inline-flex; align-items:center; gap:6px; background:#f1f5f9; color:#475569; border:1.5px solid #e2e8f0; border-radius:9px; padding:9px 16px; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; font-family:inherit; }
.sf-btn-back:hover { background:#e2e8f0; }
.sf-btn-next { display:inline-flex; align-items:center; gap:6px; background:#2563eb; color:#fff; border:none; border-radius:9px; padding:9px 18px; font-size:13px; font-weight:700; cursor:pointer; transition:background .15s; font-family:inherit; }
.sf-btn-next:hover:not(:disabled) { background:#1d4ed8; }
.sf-btn-next:disabled { background:#bfdbfe; cursor:not-allowed; }
.sf-btn-save { display:inline-flex; align-items:center; gap:7px; background:#16a34a; color:#fff; border:none; border-radius:9px; padding:9px 18px; font-size:13px; font-weight:700; cursor:pointer; transition:background .15s; font-family:inherit; }
.sf-btn-save:hover:not(:disabled) { background:#15803d; }
.sf-btn-save:disabled { background:#86efac; cursor:not-allowed; }
.sf-btn-warn { display:inline-flex; align-items:center; gap:7px; background:#d97706; color:#fff; border:none; border-radius:9px; padding:9px 18px; font-size:13px; font-weight:700; cursor:pointer; transition:background .15s; font-family:inherit; }
.sf-btn-warn:hover { background:#b45309; }

/* Confirm */
.modal-head-warn { background:#fffbeb; border-bottom:1.5px solid #fef3c7 !important; }
.confirm-msg { font-size:14px; color:#475569; line-height:1.75; margin-bottom:20px; white-space:pre-line; }
.confirm-actions { display:flex; gap:10px; justify-content:flex-end; }

/* ── DROPDOWN ── */
.dd-wrap { position:relative; }
.dd-trigger { display:flex; align-items:center; border:1.5px solid #e2e8f0; border-radius:11px; padding:11px 14px; background:#fff; cursor:pointer; min-height:48px; gap:8px; transition:all .15s; }
.dd-trigger:hover { border-color:#93c5fd; }
.dd-open { border-color:#2563eb !important; box-shadow:0 0 0 3px #dbeafe; }
.dd-ph  { color:#94a3b8; font-size:14px; flex:1; }
.dd-arr { margin-left:auto; color:#94a3b8; flex-shrink:0; transition:transform .2s; }
.dd-arr-open { transform:rotate(90deg); color:#2563eb; }
.dd-val { display:flex; align-items:center; gap:10px; flex:1; min-width:0; }
.dd-drop { position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:400; background:#fff; border:1.5px solid #e2e8f0; border-radius:13px; box-shadow:0 16px 48px rgba(0,0,0,.14); overflow:hidden; }
.dd-search-wrap { display:flex; align-items:center; border-bottom:1px solid #f1f5f9; padding:8px 12px; gap:8px; }
.dd-search-icon { color:#cbd5e1; flex-shrink:0; }
.dd-search { flex:1; border:none; padding:6px 0; font-size:14px; outline:none; font-family:inherit; color:#0f172a; background:transparent; }
.dd-clear { background:none; border:none; cursor:pointer; color:#94a3b8; display:flex; align-items:center; }
.dd-list  { max-height:230px; overflow-y:auto; }
.dd-item  { padding:10px 14px; cursor:pointer; transition:background .1s; }
.dd-item:hover { background:#f8fafc; }
.dd-active { background:#eff6ff; }
.dd-state { display:flex; align-items:center; justify-content:center; gap:8px; padding:24px; color:#94a3b8; font-size:13px; }
.dd-row { display:flex; align-items:center; gap:10px; }
.dd-avatar { width:34px; height:34px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:center; }
.dd-icon-wrap { width:34px; height:34px; border-radius:8px; flex-shrink:0; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center; }
.dd-row-main { font-weight:600; color:#0f172a; font-size:13px; }
.dd-row-sub  { display:flex; align-items:center; gap:5px; font-size:11px; color:#64748b; margin-top:2px; flex-wrap:wrap; }

/* ── SALES TABLE ── */
.st-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:18px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,.06); }
.st-header { display:flex; align-items:center; gap:14px; padding:20px 22px 16px; border-bottom:1.5px solid #f1f5f9; }
.st-header-left { display:flex; align-items:center; gap:12px; flex:1; }
.st-header-icon { color:#7c3aed; }
.st-title    { font-size:16px; font-weight:800; color:#0f172a; letter-spacing:-.3px; }
.st-subtitle { font-size:12px; color:#94a3b8; margin-top:2px; }

.st-rev-bar { display:flex; gap:0; background:linear-gradient(135deg,#f0fdf4,#eff6ff); border-bottom:1.5px solid #e2e8f0; padding:16px 22px; }
.rev-item { display:flex; align-items:center; gap:12px; flex:1; }
.rev-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.rev-green  { background:#dcfce7; color:#16a34a; }
.rev-blue   { background:#dbeafe; color:#2563eb; }
.rev-divider { width:1px; background:#e2e8f0; margin:0 20px; }
.rev-label { font-size:10px; font-weight:700; text-transform:uppercase; color:#94a3b8; letter-spacing:.05em; }
.rev-val   { font-size:20px; font-weight:800; color:#0f172a; margin-top:2px; }

.st-filters { display:flex; align-items:center; gap:10px; padding:12px 22px; border-bottom:1px solid #f8fafc; flex-wrap:wrap; }
.filter-group { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.filter-icon  { color:#94a3b8; }
.filter-input { border:1.5px solid #e2e8f0; border-radius:8px; padding:7px 11px; font-size:13px; outline:none; font-family:inherit; color:#0f172a; transition:border-color .15s; }
.filter-input:focus { border-color:#2563eb; }
.filter-sep   { color:#94a3b8; font-size:13px; }
.filter-clear { display:inline-flex; align-items:center; gap:5px; background:#fef2f2; color:#dc2626; border:none; border-radius:8px; padding:7px 12px; font-size:12px; font-weight:600; cursor:pointer; transition:background .15s; font-family:inherit; }
.filter-clear:hover { background:#fecaca; }

.state-box { display:flex; flex-direction:column; align-items:center; gap:12px; padding:64px 24px; color:#94a3b8; font-size:14px; text-align:center; }
.state-sm   { display:flex; align-items:center; gap:8px; padding:20px; color:#94a3b8; font-size:13px; }
.state-sm.warn { color:#f59e0b; }

.tbl-scroll { overflow-x:auto; }
.tbl { width:100%; border-collapse:collapse; }
.tbl thead tr { background:#faf5ff; border-bottom:1.5px solid #e2e8f0; }
.tbl th { padding:11px 16px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:#7c3aed; text-align:left; white-space:nowrap; }
.tbl-modal th { background:#f8fafc; color:#64748b; }
.tbl td { padding:12px 16px; font-size:13px; color:#334155; border-bottom:1px solid #f8fafc; vertical-align:middle; }
.tbl-row { cursor:pointer; transition:background .1s; }
.tbl-row:hover { background:#fafbff; }

.td-id       { font-weight:800; color:#7c3aed; font-size:13px; background:#f5f3ff; padding:3px 8px; border-radius:6px; display:inline-block; }
.td-cust-cell { display:flex; align-items:center; gap:10px; }
.td-avatar   { width:30px; height:30px; border-radius:50%; flex-shrink:0; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; font-weight:800; font-size:12px; display:flex; align-items:center; justify-content:center; }
.td-cust     { font-weight:700; color:#0f172a; font-size:13px; }
.td-phone    { font-size:11px; color:#94a3b8; margin-top:1px; }
.td-items    { display:flex; flex-direction:column; gap:3px; }
.td-chip     { display:inline-flex; align-items:center; gap:5px; background:#f1f5f9; border-radius:5px; padding:2px 8px; font-size:12px; font-weight:500; width:fit-content; }
.chip-x      { color:#2563eb; font-weight:700; font-size:11px; }
.td-more     { font-size:11px; color:#94a3b8; }
.td-qty-pill { background:#f1f5f9; color:#334155; font-weight:700; font-size:12px; padding:3px 10px; border-radius:20px; display:inline-block; }
.td-total    { font-weight:800; color:#0f172a; font-size:14px; white-space:nowrap; }
.td-date     { font-size:11px; color:#94a3b8; white-space:nowrap; }
.td-product-name { font-weight:600; color:#0f172a; }
.mono { font-family:'JetBrains Mono','Fira Mono',monospace; font-size:12px; }

.st-footer { display:flex; align-items:center; gap:10px; padding:12px 20px; border-top:1.5px solid #f1f5f9; flex-wrap:wrap; }
.pag-info  { font-size:12px; color:#94a3b8; white-space:nowrap; }
.pag { display:flex; align-items:center; gap:4px; flex:1; justify-content:center; }
.pag-btn { width:32px; height:32px; border:1.5px solid #e2e8f0; border-radius:8px; background:#fff; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#475569; transition:all .15s; font-family:inherit; }
.pag-btn:hover:not(:disabled) { border-color:#2563eb; color:#2563eb; background:#eff6ff; }
.pag-btn:disabled { opacity:.4; cursor:not-allowed; }
.pag-active { background:#2563eb !important; color:#fff !important; border-color:#2563eb !important; }

/* ── DETAIL MODAL ── */
.dm-meta { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:18px; }
.dm-meta-item { background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:11px; padding:13px 14px; }
.dm-accent    { background:#eff6ff; border-color:#bfdbfe; }
.dm-label { display:flex; align-items:center; gap:5px; font-size:10px; font-weight:700; text-transform:uppercase; color:#94a3b8; margin-bottom:5px; letter-spacing:.04em; }
.dm-val   { font-size:14px; font-weight:700; color:#0f172a; }
.dm-accent .dm-val { color:#2563eb; font-size:18px; }
.dm-footer { display:flex; justify-content:space-between; align-items:center; margin-top:18px; padding-top:14px; border-top:1.5px solid #f1f5f9; }

/* ── SHARED BUTTONS ── */
.btn-danger  { display:inline-flex; align-items:center; gap:6px; background:#fee2e2; color:#dc2626; border:none; border-radius:9px; padding:9px 14px; font-size:13px; font-weight:600; cursor:pointer; transition:background .15s; font-family:inherit; }
.btn-danger:hover:not(:disabled) { background:#fecaca; }
.btn-danger:disabled { opacity:.5; cursor:not-allowed; }
.btn-sec     { display:inline-flex; align-items:center; gap:6px; background:#f1f5f9; color:#475569; border:1.5px solid #e2e8f0; border-radius:9px; padding:8px 16px; font-size:13px; font-weight:500; cursor:pointer; transition:all .15s; font-family:inherit; }
.btn-sec:hover { background:#e2e8f0; }
.btn-history { display:inline-flex; align-items:center; gap:5px; background:#f5f3ff; color:#7c3aed; border:none; border-radius:7px; padding:5px 10px; font-size:11px; font-weight:700; cursor:pointer; white-space:nowrap; transition:background .15s; font-family:inherit; }
.btn-history:hover { background:#ede9fe; }

/* ── CHIPS ── */
.chip        { display:inline-flex; align-items:center; gap:4px; border-radius:5px; padding:2px 8px; font-size:11px; font-weight:600; margin-right:4px; }
.chip-purple { background:#ede9fe; color:#6d28d9; font-family:monospace; }
.chip-blue   { background:#dbeafe; color:#1d4ed8; font-family:monospace; }
.chip-gray   { background:#f1f5f9; color:#475569; }

/* ── MODAL ── */
.overlay { position:fixed; inset:0; z-index:900; background:rgba(15,23,42,.5); display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(4px); }
.modal { background:#fff; border-radius:20px; width:100%; box-shadow:0 32px 80px rgba(0,0,0,.22); animation:popIn .18s cubic-bezier(.34,1.56,.64,1); max-height:90vh; display:flex; flex-direction:column; overflow:hidden; }
.modal-sm  { max-width:440px; }
.modal-md  { max-width:480px; }
.modal-lg  { max-width:760px; }
@keyframes popIn { from{opacity:0;transform:scale(.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
.modal-head { display:flex; justify-content:space-between; align-items:center; padding:20px 24px 16px; border-bottom:1.5px solid #f1f5f9; flex-shrink:0; }
.modal-title { font-size:16px; font-weight:800; color:#0f172a; letter-spacing:-.2px; }
.modal-x { background:#f1f5f9; border:none; border-radius:8px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; transition:all .15s; }
.modal-x:hover { background:#e2e8f0; color:#0f172a; }
.modal-body { padding:20px 24px 24px; overflow-y:auto; flex:1; }

/* ── TOAST ── */
.toast-stack { position:fixed; bottom:28px; right:28px; z-index:9999; display:flex; flex-direction:column; gap:8px; align-items:flex-end; }
.toast { padding:12px 16px; border-radius:13px; font-size:14px; font-weight:600; display:flex; align-items:center; gap:10px; box-shadow:0 12px 40px rgba(0,0,0,.2); animation:slideUp .2s ease; max-width:360px; min-width:200px; }
.toast-success { background:#0f172a; color:#fff; }
.toast-error   { background:#dc2626; color:#fff; }
.toast-warn    { background:#d97706; color:#fff; }
.toast-icon { display:flex; align-items:center; flex-shrink:0; }
.toast-msg  { flex:1; }
.toast-x { background:rgba(255,255,255,.15); border:none; border-radius:6px; width:24px; height:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:rgba(255,255,255,.8); }
.toast-x:hover { color:#fff; background:rgba(255,255,255,.25); }
@keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

/* ── UTILS ── */
.spin { animation:spinA .7s linear infinite; }
@keyframes spinA { to{transform:rotate(360deg)} }
input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
input[type=number] { -moz-appearance:textfield; }

/* ── RESPONSIVE ── */
@media (max-width: 960px) {
  .page-tabs { display:flex; }
  .page-body { grid-template-columns:1fr; padding:14px; gap:14px; }
  .col-hide { display:none !important; }
  .col-hide-mobile { display:none !important; }
}
@media (min-width: 961px) {
  .col-hide, .col-hide-mobile { display:block !important; }
}
@media (max-width: 640px) {
  .dm-meta { grid-template-columns:1fr; }
  .sf-batch-summary { grid-template-columns:1fr; }
  .sf-mini-stats { grid-template-columns:1fr 1fr; }
  .sf-footer { flex-direction:column; align-items:stretch; }
  .sf-footer-right { justify-content:flex-end; }
}
`