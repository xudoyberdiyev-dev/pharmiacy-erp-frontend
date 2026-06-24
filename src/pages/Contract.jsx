// src/pages/Contract.jsx — To'liq tuzatilgan versiya
// DB schema: contractNumber, partyName, contractDate (status, totalAmount, notes yo'q)
// Faktura boshqaruvi ham shu sahifada

import { useState, useEffect, useRef } from "react";
import {
  Search, X, Plus, Pencil, Trash2,
  FileText, Loader2, Hash, Layers,
  Building2, Calendar, Eye, Download,
  CheckCircle, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import ToastStack from "../components/toast/Toast";
import useToast from "../components/toast/useToast";
import { PageHeader } from "../components/pageHeader/PageHeader";
import { StatCard } from "../components/StatCard";
import { Pagination } from "../components/pagination/Pagination";
import { useContracts } from "../hooks/useContracts";
import './contract.css'

const fmt = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—"

// ─── Modal ─────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const fn = e => e.key === "Escape" && onClose()
    document.addEventListener("keydown", fn)
    return () => document.removeEventListener("keydown", fn)
  }, [onClose])
  return (
    <div className="c-overlay" onClick={onClose}>
      <div className={`c-modal${wide ? " c-modal-wide" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="c-modal-hdr">
          <h2 className="c-modal-title">{title}</h2>
          <button className="c-modal-x" onClick={onClose}><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Field ─────────────────────────────────────────────────────
function Field({ label, icon: Icon, required, error, children }) {
  return (
    <div className="c-field">
      <label className="c-label">
        {Icon && <Icon size={12} strokeWidth={2.5} />}
        {label}{required && <span className="c-req">*</span>}
      </label>
      {children}
      {error && <span className="c-field-err"><AlertTriangle size={11} />{error}</span>}
    </div>
  )
}

// ─── Contract Form ─────────────────────────────────────────────
// DB: contractNumber (required), partyName (optional), contractDate (optional)
function ContractForm({ initial = {}, onSave, onCancel, saving }) {
  const [contractNumber, setContractNumber] = useState(initial.contractNumber || "")
  const [partyName,      setPartyName]      = useState(initial.partyName      || "")
  const [contractDate,   setContractDate]   = useState(
    initial.contractDate ? new Date(initial.contractDate).toISOString().split("T")[0] : ""
  )
  const [errors, setErrors] = useState({})
  const firstRef = useRef()
  useEffect(() => { firstRef.current?.focus() }, [])

  const validate = () => {
    const e = {}
    if (!contractNumber.trim()) e.contractNumber = "Shartnoma raqami kiritilsin"
    return e
  }

  const submit = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    onSave({
      contractNumber: contractNumber.trim(),
      partyName:      partyName.trim() || null,
      contractDate:   contractDate || null,
    })
  }

  const inp = (set, field) => (e) => { set(e.target.value); setErrors(p => ({ ...p, [field]: "" })) }

  return (
    <div className="c-form-body">
      <div className="c-row2">
        <Field label="Shartnoma raqami" icon={FileText} required error={errors.contractNumber}>
          <input ref={firstRef} className={`c-input c-mono${errors.contractNumber ? " c-err" : ""}`}
            value={contractNumber} onChange={inp(setContractNumber, "contractNumber")} placeholder="SH-2026-001" />
        </Field>
        <Field label="Sana" icon={Calendar}>
          <input className="c-input" type="date" value={contractDate} onChange={inp(setContractDate, "contractDate")} />
        </Field>
      </div>
      <Field label="Yetkazib beruvchi" icon={Building2}>
        <input className="c-input" value={partyName} onChange={inp(setPartyName, "partyName")} placeholder="Kompaniya nomi" />
      </Field>
      <div className="c-form-actions">
        <button className="c-btn-ghost" onClick={onCancel} type="button">Bekor qilish</button>
        <button className="c-btn-primary" onClick={submit} disabled={saving} type="button">
          {saving
            ? <><Loader2 size={14} className="c-spin" />Saqlanmoqda…</>
            : <><CheckCircle size={14} />{initial.id ? "Saqlash" : "Qo'shish"}</>}
        </button>
      </div>
    </div>
  )
}

// ─── Invoice Form ──────────────────────────────────────────────
// DB: invoiceNumber (required), contractId (optional), invoiceDate (optional)
function InvoiceForm({ contractId, initial = {}, onSave, onCancel, saving }) {
  const [invoiceNumber, setInvoiceNumber] = useState(initial.invoiceNumber || "")
  const [invoiceDate,   setInvoiceDate]   = useState(
    initial.invoiceDate ? new Date(initial.invoiceDate).toISOString().split("T")[0] : ""
  )
  const [errors, setErrors] = useState({})
  const firstRef = useRef()
  useEffect(() => { firstRef.current?.focus() }, [])

  const validate = () => {
    const e = {}
    if (!invoiceNumber.trim()) e.invoiceNumber = "Faktura raqami kiritilsin"
    return e
  }

  const submit = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    onSave({
      invoiceNumber: invoiceNumber.trim(),
      contractId:    contractId || null,
      invoiceDate:   invoiceDate || null,
    })
  }

  return (
    <div className="c-form-body">
      <Field label="Faktura raqami" icon={Hash} required error={errors.invoiceNumber}>
        <input ref={firstRef} className={`c-input c-mono${errors.invoiceNumber ? " c-err" : ""}`}
          value={invoiceNumber} onChange={e => { setInvoiceNumber(e.target.value); setErrors(p => ({...p, invoiceNumber: ""})) }}
          placeholder="F-2026-0001" />
      </Field>
      <Field label="Faktura sanasi" icon={Calendar}>
        <input className="c-input" type="date" value={invoiceDate}
          onChange={e => setInvoiceDate(e.target.value)} />
      </Field>
      <div className="c-form-actions">
        <button className="c-btn-ghost" onClick={onCancel} type="button">Bekor qilish</button>
        <button className="c-btn-primary" onClick={submit} disabled={saving} type="button">
          {saving ? <><Loader2 size={14} className="c-spin" />Saqlanmoqda…</> : <><CheckCircle size={14} />{initial.id ? "Saqlash" : "Qo'shish"}</>}
        </button>
      </div>
    </div>
  )
}

// ─── Contract Detail Modal ─────────────────────────────────────
function ContractDetailModal({ contract, invoices, onClose, onAddInvoice, onDeleteInvoice, saving }) {
  const [expanded, setExpanded] = useState(true)
  const [addInvoiceModal, setAddInvoiceModal] = useState(false)

  return (
    <Modal title={`Shartnoma: ${contract.contractNumber}`} onClose={onClose} wide>
      <div className="c-form-body">
        {/* Asosiy ma'lumot */}
        <div className="c-detail-hdr">
          {contract.partyName && (
            <div className="c-dh-sup"><Building2 size={14} />{contract.partyName}</div>
          )}
          {contract.contractDate && (
            <div className="c-dh-date"><Calendar size={13} />{fmt(contract.contractDate)}</div>
          )}
          <div className="c-detail-stats">
            <span className="c-stat-chip"><Hash size={11} />{contract._count?.invoices ?? invoices.length} faktura</span>
            <span className="c-stat-chip"><Layers size={11} />{contract._count?.batches ?? 0} partiya</span>
          </div>
        </div>

        {/* Fakturalar */}
        <div className="c-section-header" onClick={() => setExpanded(e => !e)} style={{ cursor: "pointer" }}>
          <span className="c-section-lbl">Fakturalar ({invoices.length})</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="c-btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}
              onClick={e => { e.stopPropagation(); setAddInvoiceModal(true) }}>
              <Plus size={12} />Faktura qo'shish
            </button>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {expanded && (
          invoices.length === 0 ? (
            <div className="c-empty-inv">
              <Hash size={28} strokeWidth={1.5} style={{ color: "#cbd5e1" }} />
              <p>Faktura yo'q</p>
              <button className="c-btn-primary" style={{ marginTop: 8 }} onClick={() => setAddInvoiceModal(true)}>
                <Plus size={12} />Faktura qo'shish
              </button>
            </div>
          ) : (
            <div className="c-inv-list">
              {invoices.map(inv => (
                <div key={inv.id} className="c-inv-card">
                  <div className="c-inv-top">
                    <span className="c-inv-num"><Hash size={11} />{inv.invoiceNumber}</span>
                    {(inv.invoiceDate || inv.createdAt) && (
                      <span className="c-inv-date">{fmt(inv.invoiceDate || inv.createdAt)}</span>
                    )}
                    <button className="c-icon-btn c-del-btn" style={{ marginLeft: "auto" }}
                      onClick={() => onDeleteInvoice(inv.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {inv._count?.batches !== undefined && (
                    <div className="c-inv-detail">
                      <span className="c-inv-qty"><Layers size={10} />{inv._count.batches} partiya</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        <div className="c-form-actions" style={{ marginTop: 16 }}>
          <button className="c-btn-ghost" onClick={onClose}>Yopish</button>
        </div>
      </div>

      {addInvoiceModal && (
        <Modal title="Faktura qo'shish" onClose={() => setAddInvoiceModal(false)}>
          <InvoiceForm
            contractId={contract.id}
            onSave={async (data) => {
              await onAddInvoice(data)
              setAddInvoiceModal(false)
            }}
            onCancel={() => setAddInvoiceModal(false)}
            saving={saving}
          />
        </Modal>
      )}
    </Modal>
  )
}

// ─── Delete Confirm ────────────────────────────────────────────
function DeleteModal({ contract, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false)
  const go = async () => { setLoading(true); try { await onConfirm() } finally { setLoading(false) } }
  return (
    <Modal title="Shartnomani o'chirish" onClose={onCancel}>
      <div className="c-form-body">
        <div className="c-warn">
          <AlertTriangle size={18} strokeWidth={2} />
          <div>
            <strong>Bu amalni orqaga qaytarib bo'lmaydi.</strong>
            <p style={{ marginTop: 4, fontSize: 13 }}>
              "{contract.contractNumber}" raqamli shartnoma o'chiriladi.
              Agar unga bog'liq partiyalar bo'lsa, o'chirib bo'lmaydi.
            </p>
          </div>
        </div>
        <div className="c-form-actions">
          <button className="c-btn-ghost" onClick={onCancel}>Bekor qilish</button>
          <button className="c-btn-danger" onClick={go} disabled={loading}>
            {loading ? <><Loader2 size={14} className="c-spin" />O'chirilmoqda…</> : <><Trash2 size={14} />O'chirish</>}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────
export const Contract = () => {
  const {
    contracts, invoices,
    total, totalPages, page, setPage,
    search, setSearch,
    loading, saving, setSaving, error,
    fetchInvoices, fetchContractDetail,
    handleCreate, handleUpdate, handleDelete,
    handleCreateInvoice, handleDeleteInvoice,
  } = useContracts()

  const [addModal,    setAddModal]    = useState(false)
  const [editModal,   setEditModal]   = useState(null)
  const [delModal,    setDelModal]    = useState(null)
  const [viewModal,   setViewModal]   = useState(null)
  const [viewInvoices, setViewInvoices] = useState([])
  const { toasts, add: toast, remove } = useToast()

  // Shartnoma tanlanganda fakturalarini yuklash
  const openDetail = async (contract) => {
    setViewModal(contract)
    await fetchInvoices(contract.id)
  }

  // invoices dan useContracts state ni viewModal uchun ishlatamiz
  useEffect(() => {
    setViewInvoices(invoices)
  }, [invoices])

  const handleAdd = async (data) => {
    setSaving(true)
    try {
      await handleCreate(data)
      toast("Shartnoma qo'shildi!")
      setAddModal(false)
    } catch (e) {
      toast(e.message ?? "Xatolik", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (data) => {
    setSaving(true)
    try {
      await handleUpdate(editModal.id, data)
      toast("Shartnoma yangilandi")
      setEditModal(null)
    } catch (e) {
      toast(e.message ?? "Xatolik", "error")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    try {
      await handleDelete(delModal.id)
      toast("Shartnoma o'chirildi")
      setDelModal(null)
    } catch (e) {
      toast(e.message ?? "O'chirib bo'lmadi", "error")
      setDelModal(null)
    }
  }

  const handleAddInvoice = async (data) => {
    setSaving(true)
    try {
      await handleCreateInvoice(data)
      toast("Faktura qo'shildi!")
      await fetchInvoices(viewModal.id)
    } catch (e) {
      toast(e.message ?? "Xatolik", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveInvoice = async (id) => {
    try {
      await handleDeleteInvoice(id)
      toast("Faktura o'chirildi")
      await fetchInvoices(viewModal.id)
    } catch (e) {
      toast(e.message ?? "O'chirib bo'lmadi", "error")
    }
  }

  const exportCSV = () => {
    const rows = [
      ["Shartnoma №", "Yetkazib beruvchi", "Sana", "Fakturalar", "Partiyalar"],
      ...contracts.map(c => [
        c.contractNumber,
        c.partyName ?? "",
        c.contractDate ? fmt(c.contractDate) : "",
        c._count?.invoices ?? 0,
        c._count?.batches  ?? 0,
      ]),
    ]
    const csv  = rows.map(r => r.map(v => `"${v ?? ""}"`).join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a"); a.href = url; a.download = "shartnomalar.csv"; a.click()
    URL.revokeObjectURL(url)
    toast("CSV yuklab olindi")
  }

  return (
    <>
      <ToastStack toasts={toasts} remove={remove} />
      <div className="c-page">
        <PageHeader
          title="Shartnomalar"
          subtitle="Yetkazib beruvchilar bilan shartnoma va fakturalar"
          btntext="Shartnoma qo'shish"
          icon={FileText}
          setAddModal={setAddModal}
          extraBtn={
            <button className="c-btn-ghost" onClick={exportCSV}><Download size={14} />CSV</button>
          }
        />

        <div className="c-stats">
          <StatCard title="Jami shartnomalar" value={total}                icon={FileText}  color="teal"  />
          <StatCard title="Jami fakturalar"
            value={contracts.reduce((s, c) => s + (c._count?.invoices ?? 0), 0)}
            icon={Hash}    color="blue"  />
          <StatCard title="Jami partiyalar"
            value={contracts.reduce((s, c) => s + (c._count?.batches ?? 0), 0)}
            icon={Layers}  color="violet"/>
        </div>

        <div className="c-toolbar">
          <div className="c-search-wrap">
            <Search size={14} style={{ color: "#cbd5e1", flexShrink: 0, marginLeft: 12 }} />
            <input className="c-search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Shartnoma №, yetkazib beruvchi…" />
            {search && <button className="c-clear" onClick={() => setSearch("")}><X size={13} /></button>}
          </div>
        </div>

        {loading && (
          <div className="c-empty"><Loader2 size={30} className="c-spin" style={{ color: "#0d9488" }} />
            <span style={{ color: "#64748b" }}>Yuklanmoqda…</span></div>
        )}
        {error && !loading && (
          <div className="c-warn" style={{ margin: "16px 0" }}>
            <AlertTriangle size={16} /><span>{error}</span></div>
        )}

        {!loading && !error && (
          <div className="c-table-card">
            {contracts.length === 0 ? (
              <div className="c-empty">
                <FileText size={44} strokeWidth={0.8} style={{ color: "#e2e8f0" }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: "#64748b" }}>
                  {search ? "Hech narsa topilmadi" : "Shartnoma yo'q"}
                </div>
                {!search && (
                  <button className="c-btn-primary" onClick={() => setAddModal(true)}>
                    <Plus size={14} />Shartnoma qo'shish
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="c-table-scroll">
                  <table className="c-table">
                    <thead>
                      <tr>
                        <th>Shartnoma №</th>
                        <th>Yetkazib beruvchi</th>
                        <th>Sana</th>
                        <th style={{ textAlign: "center" }}>Fakturalar</th>
                        <th style={{ textAlign: "center" }}>Partiyalar</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map(c => (
                        <tr key={c.id}>
                          <td>
                            <span className="c-contract-num">{c.contractNumber}</span>
                          </td>
                          <td>
                            <div className="c-supplier">
                              <Building2 size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                              {c.partyName ?? "—"}
                            </div>
                          </td>
                          <td className="c-mono c-date">{fmt(c.contractDate)}</td>
                          <td style={{ textAlign: "center" }}>
                            <span className="c-count-chip"><Hash size={11} />{c._count?.invoices ?? 0}</span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className="c-count-chip"><Layers size={11} />{c._count?.batches ?? 0}</span>
                          </td>
                          <td>
                            <div className="c-row-actions">
                              <button className="c-icon-btn c-view-btn" onClick={() => openDetail(c)}>
                                <Eye size={13} />
                              </button>
                              <button className="c-icon-btn c-edit-btn" onClick={() => setEditModal(c)}>
                                <Pencil size={13} />
                              </button>
                              <button className="c-icon-btn c-del-btn" onClick={() => setDelModal(c)}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="c-table-footer">
                  <span className="c-count">{total} ta shartnoma</span>
                  <Pagination page={page} total={totalPages} onPage={setPage} />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {addModal && (
        <Modal title="Yangi shartnoma" onClose={() => setAddModal(false)}>
          <ContractForm onSave={handleAdd} onCancel={() => setAddModal(false)} saving={saving} />
        </Modal>
      )}

      {editModal && (
        <Modal title="Shartnomani tahrirlash" onClose={() => setEditModal(null)}>
          <ContractForm initial={editModal} onSave={handleEdit} onCancel={() => setEditModal(null)} saving={saving} />
        </Modal>
      )}

      {viewModal && (
        <ContractDetailModal
          contract={viewModal}
          invoices={viewInvoices}
          onClose={() => { setViewModal(null); setViewInvoices([]) }}
          onAddInvoice={handleAddInvoice}
          onDeleteInvoice={handleRemoveInvoice}
          saving={saving}
        />
      )}

      {delModal && (
        <DeleteModal contract={delModal} onConfirm={confirmDelete} onCancel={() => setDelModal(null)} />
      )}
    </>
  )
}

// Eye import fix
// const Eye = ({ size, ...props }) => (
//   <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
//     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
//     <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
//     <circle cx="12" cy="12" r="3"/>
//   </svg>
// )
