// src/pages/Batch.jsx
import { useState, useEffect, useRef } from "react";
import {
  Search, X, Plus, Pencil, Trash2, Filter,
  Package, AlertTriangle, Clock, CheckCircle,
  BoxSelect, FlaskConical, Tag, Calendar,
  Banknote, Loader2, QrCode, FileCode,
  Hash, Download, FileText, Layers,
} from "lucide-react";
import ToastStack from "../components/toast/Toast";
import useToast from "../components/toast/useToast";
import { PageHeader } from "../components/pageHeader/PageHeader";
import { StatCard } from "../components/StatCard";
import { Pagination } from "../components/pagination/Pagination";
import { useBatches } from "../hooks/useBatches";
import './batch.css'

const fmt      = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—"
const fmtPrice = (p) => Number(p ?? 0).toLocaleString("uz-UZ") + " so'm"
const isExp    = (e) => e && new Date(e) < new Date()
const isSoon   = (e) => { if (!e) return false; const d = (new Date(e).getTime() - Date.now()) / 86400000; return d > 0 && d <= 30 }
const daysLeft = (e) => e ? Math.ceil((new Date(e).getTime() - Date.now()) / 86400000) : null

// ─── Modal ─────────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children, wide }) {
  useEffect(() => {
    const fn = e => e.key === "Escape" && onClose()
    document.addEventListener("keydown", fn)
    return () => document.removeEventListener("keydown", fn)
  }, [onClose])
  return (
    <div className="b-overlay" onClick={onClose}>
      <div className={`b-modal${wide ? " b-modal-wide" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="b-modal-hdr">
          <div>
            <div className="b-modal-title">{title}</div>
            {subtitle && <div className="b-modal-sub">{subtitle}</div>}
          </div>
          <button className="b-modal-x" onClick={onClose}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Field ─────────────────────────────────────────────────────
function Field({ label, icon: Icon, required, hint, error, children }) {
  return (
    <div className="b-field">
      <label className="b-label">
        {Icon && <Icon size={12} strokeWidth={2.5} />}
        {label}{required && <span className="b-req">*</span>}
      </label>
      {children}
      {error && <span className="b-field-err"><AlertTriangle size={11} />{error}</span>}
      {hint && !error && <span className="b-field-hint">{hint}</span>}
    </div>
  )
}

// ─── Batch Form ────────────────────────────────────────────────
function BatchForm({ initial = {}, products, contracts, invoices, onContractChange, onSave, onCancel, saving }) {
  const [productId,  setProductId]  = useState(initial.productId  ?? initial.product?.id  ?? "")
  const [contractId, setContractId] = useState(initial.contractId ?? initial.contract?.id ?? "")
  const [invoiceId,  setInvoiceId]  = useState(initial.invoiceId  ?? initial.invoice?.id  ?? "")
  const [series,     setSeries]     = useState(initial.series     || "")
  const [boxSeries,  setBoxSeries]  = useState(initial.boxSeries  || "")
  const [mg,         setMg]         = useState(initial.mg         || "")
  const [quantity,   setQuantity]   = useState(initial.quantity    ?? "")
  const [price,      setPrice]      = useState(initial.price       ?? "")
  const [expiry,     setExpiry]     = useState(
    initial.expiry ? new Date(initial.expiry).toISOString().split("T")[0] : ""
  )
  const [errors, setErrors] = useState({})
  const firstRef = useRef()
  useEffect(() => { firstRef.current?.focus() }, [])

  // contract o'zgarganda invoicelarni yuklash
  useEffect(() => {
    if (contractId) onContractChange(contractId)
    setInvoiceId("")
  }, [contractId]) // eslint-disable-line

  const validate = () => {
    const e = {}
    if (!productId)      e.productId = "Mahsulot tanlansin"
    if (!series.trim())  e.series    = "Seriya majburiy"
    if (!mg.trim())      e.mg        = "Dozaj majburiy"
    if (quantity === "") e.quantity   = "Miqdor kiritilsin"
    if (price === "")    e.price      = "Narx kiritilsin"
    if (!expiry)         e.expiry     = "Muddat kiritilsin"
    if (Number(quantity) < 0) e.quantity = "Manfiy bo'lmaydi"
    if (Number(price)    < 0) e.price    = "Manfiy bo'lmaydi"
    return e
  }

  const submit = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    onSave({
      productId:    Number(productId),
      ...(contractId ? { contractId: Number(contractId) } : {}),
      ...(invoiceId  ? { invoiceId:  Number(invoiceId)  } : {}),
      series:       series.trim(),
      boxSeries:    boxSeries.trim() || null,
      mg:           mg.trim(),
      quantity:     Number(quantity),
      price:        Number(price),
      expiry,
    })
  }

  const inp = (set, field) => (e) => { set(e.target.value); setErrors(p => ({ ...p, [field]: "" })) }

  // Tanlangan mahsulot
  const selectedProduct = products.find(p => p.id === Number(productId))

  return (
    <div className="b-form-body">

      {/* Mahsulot */}
      <div className="b-section-lbl">Mahsulot</div>
      <Field label="Mahsulot" icon={Package} required error={errors.productId}>
        <select className={`b-input${errors.productId ? " b-err" : ""}`}
          value={productId} onChange={e => { setProductId(e.target.value); setErrors(p => ({ ...p, productId: "" })) }}>
          <option value="">— Tanlang —</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}{p.unit ? ` (${p.unit})` : ""}</option>
          ))}
        </select>
      </Field>
      {selectedProduct && (
        <div className="b-product-strip">
          {selectedProduct.barcodes?.find(b => b.isPrimary)?.barcode && (
            <span className="b-pi-badge bc"><Hash size={10} />{selectedProduct.barcodes.find(b => b.isPrimary).barcode}</span>
          )}
          {selectedProduct.ikpuCode && (
            <span className="b-pi-badge ikpu"><FileCode size={10} />{selectedProduct.ikpuCode}</span>
          )}
          {selectedProduct.unit && (
            <span className="b-pi-badge unit"><BoxSelect size={10} />{selectedProduct.unit}</span>
          )}
        </div>
      )}

      {/* Hujjatlar */}
      <div className="b-section-lbl">Hujjatlar (ixtiyoriy)</div>
      <div className="b-row2">
        <Field label="Shartnoma" icon={FileText}>
          <select className="b-input" value={contractId} onChange={e => setContractId(e.target.value)}>
            <option value="">— Tanlang —</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>{c.contractNumber}{c.partyName ? ` · ${c.partyName}` : ""}</option>
            ))}
          </select>
        </Field>
        <Field label="Faktura" icon={Hash} hint={!contractId ? "Avval shartnoma tanlang" : ""}>
          <select className="b-input" value={invoiceId}
            onChange={e => setInvoiceId(e.target.value)} disabled={!contractId}>
            <option value="">— Tanlang —</option>
            {invoices.map(i => (
              <option key={i.id} value={i.id}>{i.invoiceNumber}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Seriya */}
      <div className="b-section-lbl">Seriya / Marking</div>
      <div className="b-row2">
        <Field label="Dori seriyasi" icon={Tag} required error={errors.series}>
          <input ref={firstRef} className={`b-input b-mono${errors.series ? " b-err" : ""}`}
            value={series} onChange={inp(setSeries, "series")} placeholder="478001167783021" />
        </Field>
        <Field label="QR seriyasi (marking)" icon={QrCode} hint="Ixtiyoriy">
          <input className="b-input b-mono" value={boxSeries}
            onChange={inp(setBoxSeries, "boxSeries")} placeholder="MK-2026-001" />
        </Field>
      </div>

      {/* Partiya */}
      <div className="b-section-lbl">Partiya ma'lumotlari</div>
      <div className="b-row2">
        <Field label="Dozaj" icon={FlaskConical} required error={errors.mg}>
          <input className={`b-input${errors.mg ? " b-err" : ""}`} value={mg}
            onChange={inp(setMg, "mg")} placeholder="500mg" />
        </Field>
        <Field label="Miqdor" icon={BoxSelect} required error={errors.quantity}>
          <input className={`b-input${errors.quantity ? " b-err" : ""}`} type="number" min="0"
            value={quantity} onChange={inp(setQuantity, "quantity")} placeholder="100" />
        </Field>
      </div>
      <div className="b-row2">
        <Field label="Narx (so'm)" icon={Banknote} required error={errors.price}>
          <input className={`b-input${errors.price ? " b-err" : ""}`} type="number" min="0"
            value={price} onChange={inp(setPrice, "price")} placeholder="15000" />
        </Field>
        <Field label="Yaroqlilik muddati" icon={Calendar} required error={errors.expiry}>
          <input className={`b-input${errors.expiry ? " b-err" : ""}`} type="date"
            value={expiry} onChange={inp(setExpiry, "expiry")} />
        </Field>
      </div>

      <div className="b-form-actions">
        <button className="b-btn-ghost" onClick={onCancel} type="button">Bekor qilish</button>
        <button className="b-btn-primary" onClick={submit} disabled={saving} type="button">
          {saving
            ? <><Loader2 size={14} className="b-spin" />Saqlanmoqda…</>
            : <><CheckCircle size={14} />{initial.id ? "Saqlash" : "Qo'shish"}</>}
        </button>
      </div>
    </div>
  )
}

// ─── Delete Confirm ────────────────────────────────────────────
function DeleteModal({ batch, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false)
  const go = async () => { setLoading(true); try { await onConfirm() } finally { setLoading(false) } }
  return (
    <Modal title="Partiyani o'chirish" onClose={onCancel}>
      <div className="b-form-body">
        <div className="b-warn">
          <AlertTriangle size={18} strokeWidth={2} />
          <div>
            <strong>Bu amalni orqaga qaytarib bo'lmaydi.</strong>
            <p style={{ marginTop: 4, fontSize: 13 }}>"{batch.series}" seriyali partiya o'chiriladi.</p>
          </div>
        </div>
        <div className="b-form-actions">
          <button className="b-btn-ghost" onClick={onCancel}>Bekor qilish</button>
          <button className="b-btn-danger" onClick={go} disabled={loading}>
            {loading ? <><Loader2 size={14} className="b-spin" />O'chirilmoqda…</> : <><Trash2 size={14} />O'chirish</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────
export const Batch = () => {
  const {
    batches, allBatches, products, contracts, invoices,
    total, totalPages, page, setPage,
    search, setSearch, filterStatus, setFilterStatus,
    loading, saving, setSaving, error,
    fetchInvoices,
    handleCreateBatch, handleUpdateBatch, handleDeleteBatch,
  } = useBatches()

  const [addModal,  setAddModal]  = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [delModal,  setDelModal]  = useState(null)
  const { toasts, add: toast, remove } = useToast()

  const totalExpired = allBatches.filter(b => isExp(b.expiry)).length
  const totalSoon    = allBatches.filter(b => isSoon(b.expiry)).length
  const totalOk      = allBatches.filter(b => !isExp(b.expiry) && !isSoon(b.expiry)).length

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await handleCreateBatch(data)
      toast("Partiya qo'shildi!")
      setAddModal(false)
    } catch (e) {
      toast(e.message ?? "Xatolik", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (data) => {
    setSaving(true)
    try {
      await handleUpdateBatch(editModal.id, data)
      toast("Partiya yangilandi")
      setEditModal(null)
    } catch (e) {
      toast(e.message ?? "Xatolik", "error")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    try {
      await handleDeleteBatch(delModal.id)
      toast("Partiya o'chirildi")
      setDelModal(null)
    } catch (e) {
      toast(e.message ?? "O'chirib bo'lmadi", "error")
      setDelModal(null)
    }
  }

  const exportCSV = () => {
    const rows = [
      ["Mahsulot", "Seriya", "QR Seriya", "Dozaj", "Kirim", "Qoldiq", "Narx", "Muddat", "Shartnoma", "Faktura"],
      ...allBatches.map(b => [
        b.product?.name ?? "",
        `'${b.series}`,
        b.boxSeries ? `'${b.boxSeries}` : "",
        b.mg, b.quantity, b.remainingQty, b.price, b.expiry,
        b.contract?.contractNumber ?? "",
        b.invoice?.invoiceNumber ?? "",
      ]),
    ]
    const csv  = rows.map(r => r.map(v => `"${v ?? ""}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a"); a.href = url; a.download = "partiyalar.csv"; a.click()
    URL.revokeObjectURL(url)
    toast("CSV yuklab olindi")
  }

  return (
    <>
      <ToastStack toasts={toasts} remove={remove} />
      <div className="b-page">
        <PageHeader
          title="Partiyalar"
          subtitle="Barcha kiruvchi tovar partiyalari — hujjatlar va muddatlar"
          btntext="Partiya qo'shish"
          icon={Layers}
          setAddModal={setAddModal}
          extraBtn={
            <button className="b-btn-ghost" onClick={exportCSV}><Download size={14} />CSV</button>
          }
        />

        <div className="b-stats">
          <StatCard title="Jami partiyalar"  value={total}        icon={Layers}        color="blue"  />
          <StatCard title="Yaxshi holat"     value={totalOk}      icon={CheckCircle}   color="teal"  />
          <StatCard title="Muddat tugayapti" value={totalSoon}    icon={Clock}         color="amber" />
          <StatCard title="Muddati o'tgan"   value={totalExpired} icon={AlertTriangle} color="red"   />
        </div>

        <div className="b-toolbar">
          <div className="b-search-wrap">
            <Search size={14} style={{ color: "#cbd5e1", flexShrink: 0, marginLeft: 12 }} />
            <input className="b-search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Seriya, mahsulot, shartnoma, faktura bo'yicha…" />
            {search && <button className="b-clear" onClick={() => setSearch("")}><X size={13} /></button>}
          </div>
          <div className="b-filter-row">
            <Filter size={12} style={{ color: "#94a3b8" }} />
            {[["all","Barchasi"],["ok","Yaxshi"],["soon","Tugayapti"],["expired","O'tgan"]].map(([val, lbl]) => (
              <button key={val} className={`b-pill${filterStatus === val ? " b-pill-on" : ""}`}
                onClick={() => setFilterStatus(val)}>{lbl}</button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="b-empty">
            <Loader2 size={30} className="b-spin" style={{ color: "#7c3aed" }} />
            <span style={{ color: "#64748b" }}>Yuklanmoqda…</span>
          </div>
        )}
        {error && !loading && (
          <div className="b-warn" style={{ margin: "16px 0" }}>
            <AlertTriangle size={16} /><span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="b-table-card">
            {batches.length === 0 ? (
              <div className="b-empty">
                <Layers size={44} strokeWidth={0.8} style={{ color: "#e2e8f0" }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>
                  {search || filterStatus !== "all" ? "Hech narsa topilmadi" : "Partiya yo'q"}
                </div>
                {!(search || filterStatus !== "all") && (
                  <button className="b-btn-primary" onClick={() => setAddModal(true)}>
                    <Plus size={14} />Partiya qo'shish
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="b-table-scroll">
                  <table className="b-table">
                    <thead>
                      <tr>
                        <th>Mahsulot</th>
                        <th>Seriya / QR</th>
                        <th>Shartnoma / Faktura</th>
                        <th style={{ textAlign: "center" }}>Dozaj</th>
                        <th style={{ textAlign: "center" }}>Kirim</th>
                        <th style={{ textAlign: "center" }}>Qoldiq</th>
                        <th style={{ textAlign: "right" }}>Narx</th>
                        <th style={{ textAlign: "center" }}>Muddat</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {batches.map(b => {
                        const expired = isExp(b.expiry)
                        const soon    = isSoon(b.expiry)
                        const days    = daysLeft(b.expiry)
                        return (
                          <tr key={b.id} className={expired ? "b-row-exp" : soon ? "b-row-soon" : ""}>
                            <td>
                              <div className="b-prod-name">{b.product?.name ?? "—"}</div>
                              <div className="b-prod-meta">
                                {b.product?.ikpuCode && (
                                  <span className="b-badge-ikpu"><FileCode size={9} />{b.product.ikpuCode}</span>
                                )}
                                {b.product?.unit && (
                                  <span className="b-badge-unit">{b.product.unit}</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="b-badge-series"><Tag size={9} />{b.series}</span>
                              {b.boxSeries && (
                                <div style={{ marginTop: 3 }}>
                                  <span className="b-badge-qr"><QrCode size={9} />{b.boxSeries}</span>
                                </div>
                              )}
                            </td>
                            <td>
                              {b.contract?.contractNumber && (
                                <div className="b-doc-sh"><FileText size={9} />{b.contract.contractNumber}</div>
                              )}
                              {b.invoice?.invoiceNumber && (
                                <div className="b-doc-inv"><Hash size={9} />{b.invoice.invoiceNumber}</div>
                              )}
                              {!b.contract && !b.invoice && (
                                <span style={{ color: "#cbd5e1", fontSize: 12 }}>—</span>
                              )}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="b-mg">{b.mg}</span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="b-qty">{b.quantity}</span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="b-qty" style={{
                                background: b.remainingQty === 0 ? "#fee2e2" : b.remainingQty < 10 ? "#fef9c3" : "#f0fdf4",
                                color:      b.remainingQty === 0 ? "#dc2626" : b.remainingQty < 10 ? "#92400e" : "#166534",
                              }}>{b.remainingQty ?? 0}</span>
                            </td>
                            <td style={{ textAlign: "right" }} className="b-mono b-price">
                              {fmtPrice(b.price)}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className={`b-exp-pill${expired ? " b-exp-red" : soon ? " b-exp-amber" : " b-exp-green"}`}>
                                {expired ? <AlertTriangle size={10} /> : soon ? <Clock size={10} /> : <CheckCircle size={10} />}
                                {expired ? "O'tgan" : soon ? `${days} kun` : fmt(b.expiry)}
                              </span>
                            </td>
                            <td>
                              <div className="b-row-actions">
                                <button className="b-icon-btn b-edit-btn" onClick={() => setEditModal(b)}>
                                  <Pencil size={13} />
                                </button>
                                <button className="b-icon-btn b-del-btn" onClick={() => setDelModal(b)}>
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="b-table-footer">
                  <span className="b-count">{total} ta partiya</span>
                  <Pagination page={page} total={totalPages} onPage={setPage} />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {addModal && (
        <Modal title="Yangi partiya qo'shish" onClose={() => setAddModal(false)} wide>
          <BatchForm
            products={products}
            contracts={contracts}
            invoices={invoices}
            onContractChange={fetchInvoices}
            onSave={handleCreate}
            onCancel={() => setAddModal(false)}
            saving={saving}
          />
        </Modal>
      )}

      {editModal && (
        <Modal title="Partiyani tahrirlash" subtitle={editModal.series} onClose={() => setEditModal(null)} wide>
          <BatchForm
            initial={editModal}
            products={products}
            contracts={contracts}
            invoices={invoices}
            onContractChange={fetchInvoices}
            onSave={handleUpdate}
            onCancel={() => setEditModal(null)}
            saving={saving}
          />
        </Modal>
      )}

      {delModal && (
        <DeleteModal batch={delModal} onConfirm={confirmDelete} onCancel={() => setDelModal(null)} />
      )}
    </>
  )
}