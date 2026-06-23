// src/pages/Contract.jsx
import { useState, useEffect, useRef } from "react";
import {
  Search, X, Plus, Pencil, Trash2,
  FileText, CheckCircle, Clock, AlertTriangle,
  Loader2, Hash, Package, Layers,
  Building2, Calendar, Eye, Download, Filter,
  Tag, Banknote,
} from "lucide-react";
import ToastStack from "../components/toast/Toast";
import useToast from "../components/toast/useToast";
import { PageHeader } from "../components/pageHeader/PageHeader";
import { StatCard } from "../components/StatCard";
import { Pagination } from "../components/pagination/Pagination";
import { useContracts } from "../hooks/useContracts";
import './contract.css'

// ─── HELPERS ──────────────────────────────────────────────────
const fmt      = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—"
const fmtPrice = (p) => Number(p ?? 0).toLocaleString("uz-UZ") + " so'm"

const STATUS_MAP = {
  active:  { label: "Faol",        cls: "green",  Icon: CheckCircle  },
  pending: { label: "Kutilmoqda",  cls: "yellow", Icon: Clock        },
  closed:  { label: "Yopilgan",    cls: "gray",   Icon: X            },
  overdue: { label: "Kechikkan",   cls: "red",    Icon: AlertTriangle },
}

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
function Field({ label, icon: Icon, required, hint, error, children }) {
  return (
    <div className="c-field">
      <label className="c-label">
        {Icon && <Icon size={12} strokeWidth={2.5} />}
        {label}{required && <span className="c-req">*</span>}
      </label>
      {children}
      {error && <span className="c-field-err"><AlertTriangle size={11} />{error}</span>}
      {hint && !error && <span className="c-field-hint">{hint}</span>}
    </div>
  )
}

// ─── Contract Form ─────────────────────────────────────────────
function ContractForm({ initial = {}, onSave, onCancel, saving }) {
  const [contractNumber, setContractNumber] = useState(initial.contractNumber || "")
  const [partyName,      setPartyName]      = useState(initial.partyName      || "")
  const [date,           setDate]           = useState(
    initial.date ? new Date(initial.date).toISOString().split("T")[0] : ""
  )
  const [totalAmount,    setTotalAmount]    = useState(initial.totalAmount    ?? "")
  const [status,         setStatus]         = useState(initial.status         || "active")
  const [notes,          setNotes]          = useState(initial.notes          || "")
  const [errors,         setErrors]         = useState({})
  const firstRef = useRef()
  useEffect(() => { firstRef.current?.focus() }, [])

  const validate = () => {
    const e = {}
    if (!contractNumber.trim()) e.contractNumber = "Shartnoma raqami kiritilsin"
    if (!partyName.trim())      e.partyName      = "Yetkazib beruvchi kiritilsin"
    return e
  }

  const submit = () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    onSave({
      contractNumber: contractNumber.trim(),
      partyName:      partyName.trim(),
      date:           date || undefined,
      totalAmount:    totalAmount !== "" ? Number(totalAmount) : undefined,
      status,
      notes:          notes.trim() || undefined,
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
          <input className="c-input" type="date" value={date} onChange={inp(setDate, "date")} />
        </Field>
      </div>
      <Field label="Yetkazib beruvchi (partyName)" icon={Building2} required error={errors.partyName}>
        <input className={`c-input${errors.partyName ? " c-err" : ""}`}
          value={partyName} onChange={inp(setPartyName, "partyName")} placeholder="Kompaniya nomi" />
      </Field>
      <div className="c-row2">
        <Field label="Umumiy summa (so'm)" icon={Banknote} hint="Ixtiyoriy">
          <input className="c-input" type="number" min="0" value={totalAmount}
            onChange={inp(setTotalAmount, "totalAmount")} placeholder="5000000" />
        </Field>
        <Field label="Holat" icon={CheckCircle}>
          <select className="c-input" value={status} onChange={e => setStatus(e.target.value)}>
            {Object.entries(STATUS_MAP).map(([val, { label }]) =>
              <option key={val} value={val}>{label}</option>
            )}
          </select>
        </Field>
      </div>
      <Field label="Izoh" hint="Ixtiyoriy">
        <textarea className="c-input" rows={2} value={notes}
          onChange={inp(setNotes, "notes")} placeholder="Qo'shimcha ma'lumot…"
          style={{ resize: "vertical" }} />
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

// ─── Contract Detail Modal ─────────────────────────────────────
function ContractDetailModal({ contract, onClose }) {
  const { label, cls, Icon } = STATUS_MAP[contract.status] || STATUS_MAP.active
  const invoices = contract.invoices ?? []

  return (
    <Modal title={`Shartnoma: ${contract.contractNumber}`} onClose={onClose} wide>
      <div className="c-form-body">
        <div className="c-detail-hdr">
          <div className="c-detail-meta">
            <span className="c-dh-sup"><Building2 size={14} />{contract.partyName ?? "—"}</span>
            {contract.date && <span className="c-dh-date"><Calendar size={13} />{fmt(contract.date)}</span>}
            <span className={`c-badge-status ${cls}`}><Icon size={10} />{label}</span>
          </div>
          {contract.notes && <div className="c-detail-notes">{contract.notes}</div>}
          {contract.totalAmount > 0 && (
            <div className="c-da-item">
              <div className="c-da-label">Shartnoma summasi</div>
              <div className="c-da-value">{fmtPrice(contract.totalAmount)}</div>
            </div>
          )}
        </div>

        <div className="c-section-lbl">Fakturalar ({invoices.length})</div>
        {invoices.length === 0 ? (
          <div className="c-empty-inv"><Hash size={28} strokeWidth={1.5} style={{ color: "#cbd5e1" }} /><p>Faktura yo'q</p></div>
        ) : (
          <div className="c-inv-list">
            {invoices.map(inv => (
              <div key={inv.id} className="c-inv-card">
                <div className="c-inv-top">
                  <span className="c-inv-num"><Hash size={11} />{inv.invoiceNumber}</span>
                  {inv.createdAt && <span className="c-inv-date">{fmt(inv.createdAt)}</span>}
                </div>
                <div className="c-inv-detail">
                  {inv._count?.batches !== undefined && (
                    <span className="c-inv-qty"><Layers size={10} />{inv._count.batches} partiya</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="c-form-actions">
          <button className="c-btn-ghost" onClick={onClose}>Yopish</button>
        </div>
      </div>
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
            <p style={{ marginTop: 4, fontSize: 13 }}>"{contract.contractNumber}" shartnomasi o'chiriladi.</p>
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
    contracts, total, totalPages, page, setPage,
    search, setSearch, statusFilter, setStatusFilter,
    loading, saving, setSaving, error,
    handleCreate: hookCreate,
    handleUpdate: hookUpdate,
    handleDelete: hookDelete,
  } = useContracts()

  const [addModal,  setAddModal]  = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [viewModal, setViewModal] = useState(null)
  const [delModal,  setDelModal]  = useState(null)
  const { toasts, add: toast, remove } = useToast()

  // Stats
  const totalActive = contracts.filter(c => c.status === "active").length
  const totalAmount = contracts.reduce((s, c) => s + (c.totalAmount ?? 0), 0)

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await hookCreate(data)
      toast("Shartnoma qo'shildi!")
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
      await hookUpdate(editModal.id, data)
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
      await hookDelete(delModal.id)
      toast("Shartnoma o'chirildi")
      setDelModal(null)
    } catch (e) {
      toast(e.message ?? "O'chirib bo'lmadi", "error")
      setDelModal(null)
    }
  }

  const exportCSV = () => {
    const rows = [
      ["Shartnoma №", "Yetkazib beruvchi", "Sana", "Holat", "Summa", "Fakturalar"],
      ...contracts.map(c => [
        c.contractNumber, c.partyName ?? "", c.date ?? "",
        STATUS_MAP[c.status]?.label ?? c.status,
        c.totalAmount ?? 0,
        c._count?.invoices ?? 0,
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
          <StatCard title="Jami shartnomalar" value={total}        icon={FileText}    color="teal"   />
          <StatCard title="Faol"              value={totalActive}  icon={CheckCircle} color="green"  />
          <StatCard title="Shartnoma summa"
            value={(totalAmount / 1_000_000).toFixed(1) + " mln"}
            icon={Banknote} color="violet" />
        </div>

        {/* Toolbar */}
        <div className="c-toolbar">
          <div className="c-search-wrap">
            <Search size={14} style={{ color: "#cbd5e1", flexShrink: 0, marginLeft: 12 }} />
            <input className="c-search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Shartnoma №, yetkazib beruvchi…" />
            {search && <button className="c-clear" onClick={() => setSearch("")}><X size={13} /></button>}
          </div>
          <div className="c-filter-row">
            <Filter size={12} style={{ color: "#94a3b8" }} />
            {[["all","Barchasi"],["active","Faol"],["pending","Kutilmoqda"],["closed","Yopilgan"],["overdue","Kechikkan"]].map(([val, lbl]) => (
              <button key={val} className={`c-pill${statusFilter === val ? " c-pill-on" : ""}`}
                onClick={() => setStatusFilter(val)}>{lbl}</button>
            ))}
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
                  {search || statusFilter !== "all" ? "Hech narsa topilmadi" : "Shartnoma yo'q"}
                </div>
                {!(search || statusFilter !== "all") && (
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
                        <th>Holat</th>
                        <th style={{ textAlign: "center" }}>Fakturalar</th>
                        <th style={{ textAlign: "center" }}>Partiyalar</th>
                        <th style={{ textAlign: "right" }}>Summa</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map(c => {
                        const { label, cls, Icon } = STATUS_MAP[c.status] || STATUS_MAP.active
                        return (
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
                            <td className="c-mono c-date">{fmt(c.date)}</td>
                            <td><span className={`c-badge-status ${cls}`}><Icon size={10} />{label}</span></td>
                            <td style={{ textAlign: "center" }}>
                              <span className="c-count-chip"><Hash size={11} />{c._count?.invoices ?? 0}</span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="c-count-chip"><Layers size={11} />{c._count?.batches ?? 0}</span>
                            </td>
                            <td style={{ textAlign: "right" }} className="c-mono c-price">
                              {c.totalAmount ? fmtPrice(c.totalAmount) : "—"}
                            </td>
                            <td>
                              <div className="c-row-actions">
                                <button className="c-icon-btn c-view-btn" onClick={() => setViewModal(c)}><Eye size={13} /></button>
                                <button className="c-icon-btn c-edit-btn" onClick={() => setEditModal(c)}><Pencil size={13} /></button>
                                <button className="c-icon-btn c-del-btn"  onClick={() => setDelModal(c)}><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
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

      {addModal  && <Modal title="Yangi shartnoma" onClose={() => setAddModal(false)}>
        <ContractForm onSave={handleCreate} onCancel={() => setAddModal(false)} saving={saving} />
      </Modal>}

      {editModal && <Modal title="Shartnomani tahrirlash" onClose={() => setEditModal(null)}>
        <ContractForm initial={editModal} onSave={handleUpdate} onCancel={() => setEditModal(null)} saving={saving} />
      </Modal>}

      {viewModal && <ContractDetailModal contract={viewModal} onClose={() => setViewModal(null)} />}

      {delModal  && <DeleteModal contract={delModal} onConfirm={confirmDelete} onCancel={() => setDelModal(null)} />}
    </>
  )
}