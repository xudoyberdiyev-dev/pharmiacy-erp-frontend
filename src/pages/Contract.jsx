import { useState } from "react";
import {
  Search, X, Plus, Pencil, Trash2,
  FileText, CheckCircle, Clock, AlertTriangle,
  ShieldAlert, Loader2, Hash, Package, Layers,
  Building2, Calendar, ChevronRight, Eye,
  Download, Filter, Tag, Banknote,
} from "lucide-react";

let mockContractId = 300;

const initialContracts = [
  {
    id: 1,
    contractNumber: "SH-2026-045",
    supplier: "Medexport UZ",
    date: "2026-03-01",
    totalAmount: 5460000,
    status: "active",
    notes: "Paracetamol va qo'shimcha dorilar",
    invoices: [
      { id: 101, invoiceNumber: "F-2026-0892", date: "2026-03-05", amount: 2880000, productName: "Paracetamol 500mg", series: "478001167783021", quantity: 240 },
      { id: 102, invoiceNumber: "F-2026-0910", date: "2026-03-10", amount: 225000,  productName: "Paracetamol 500mg", series: "478001167783022", quantity: 18  },
    ],
  },
  {
    id: 2,
    contractNumber: "SH-2026-031",
    supplier: "Pharmaville LLC",
    date: "2026-02-15",
    totalAmount: 1920000,
    status: "active",
    notes: "Antibiotiklar partiyasi",
    invoices: [
      { id: 103, invoiceNumber: "F-2026-0411", date: "2026-02-20", amount: 1920000, productName: "Amoxicillin 250mg", series: "478019988771", quantity: 80 },
    ],
  },
  {
    id: 3,
    contractNumber: "SH-2025-188",
    supplier: "VitaPharm",
    date: "2025-11-01",
    totalAmount: 90000,
    status: "closed",
    notes: "",
    invoices: [
      { id: 104, invoiceNumber: "F-2025-2201", date: "2025-11-05", amount: 90000, productName: "Vitamin C 1000mg", series: "478011199001", quantity: 5 },
    ],
  },
];

const STATUS_MAP = {
  active:  { label: "Faol",   cls: "green",  Icon: CheckCircle  },
  pending: { label: "Kutilmoqda", cls: "yellow", Icon: Clock   },
  closed:  { label: "Yopilgan",  cls: "gray",  Icon: X        },
  overdue: { label: "Kechikkan", cls: "red",   Icon: AlertTriangle },
};

const formatDate  = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";
const formatPrice = (p) => Number(p).toLocaleString("uz-UZ") + " so'm";

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

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className={`modal-box${wide ? " modal-wide" : ""}`} onClick={e => e.stopPropagation()}>
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

function ContractForm({ initial = {}, onSave, onCancel, saving }) {
  const [contractNumber, setContractNumber] = useState(initial.contractNumber || "");
  const [supplier,       setSupplier]       = useState(initial.supplier       || "");
  const [date,           setDate]           = useState(initial.date           || "");
  const [totalAmount,    setTotalAmount]    = useState(initial.totalAmount    ?? "");
  const [status,         setStatus]         = useState(initial.status         || "active");
  const [notes,          setNotes]          = useState(initial.notes          || "");
  const [err,            setErr]            = useState("");

  const submit = () => {
    if (!contractNumber.trim()) return setErr("Shartnoma raqami kiritilsin");
    if (!supplier.trim())       return setErr("Yetkazib beruvchi kiritilsin");
    if (!date)                  return setErr("Sana kiritilsin");
    setErr("");
    onSave({
      contractNumber: contractNumber.trim(), supplier: supplier.trim(),
      date, totalAmount: totalAmount ? Number(totalAmount) : 0, status, notes: notes.trim(),
    });
  };

  return (
    <div className="form-body">
      {err && <div className="form-error"><ShieldAlert size={14} />{err}</div>}
      <div className="form-row">
        <Field label="Shartnoma raqami" icon={FileText} required>
          <input className="input mono" value={contractNumber} onChange={e => setContractNumber(e.target.value)}
            placeholder="SH-2026-001" autoFocus />
        </Field>
        <Field label="Sana" icon={Calendar} required>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Yetkazib beruvchi" icon={Building2} required>
        <input className="input" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Kompaniya nomi" />
      </Field>
      <div className="form-row">
        <Field label="Umumiy summa (so'm)" icon={Banknote} hint="Shartnoma bo'yicha umumiy summa">
          <input className="input" type="number" min="0" value={totalAmount}
            onChange={e => setTotalAmount(e.target.value)} placeholder="5000000" />
        </Field>
        <Field label="Holat" icon={CheckCircle}>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
            {Object.entries(STATUS_MAP).map(([val, { label }]) => <option key={val} value={val}>{label}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Izoh">
        <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Qo'shimcha ma'lumot…" style={{ resize: "vertical" }} />
      </Field>
      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel} type="button">Bekor</button>
        <button className="btn-primary" onClick={submit} disabled={saving} type="button">
          {saving ? <><Loader2 size={15} className="spin" /> Saqlanmoqda…</> : "Saqlash"}
        </button>
      </div>
    </div>
  );
}

function InvoiceForm({ contractId, contractNumber, initial = {}, onSave, onCancel, saving }) {
  const [invoiceNumber, setInvoiceNumber] = useState(initial.invoiceNumber || "");
  const [date,          setDate]          = useState(initial.date          || "");
  const [amount,        setAmount]        = useState(initial.amount        ?? "");
  const [productName,   setProductName]   = useState(initial.productName   || "");
  const [series,        setSeries]        = useState(initial.series        || "");
  const [quantity,      setQuantity]      = useState(initial.quantity      ?? "");
  const [err,           setErr]           = useState("");

  const submit = () => {
    if (!invoiceNumber.trim()) return setErr("Faktura raqami kiritilsin");
    if (!date)                 return setErr("Sana kiritilsin");
    setErr("");
    onSave({ contractId, invoiceNumber: invoiceNumber.trim(), date, amount: Number(amount), productName: productName.trim(), series: series.trim(), quantity: Number(quantity) });
  };

  return (
    <div className="form-body">
      {contractNumber && (
        <div className="contract-chip"><FileText size={12} />{contractNumber}</div>
      )}
      {err && <div className="form-error"><ShieldAlert size={14} />{err}</div>}
      <div className="form-row">
        <Field label="Faktura raqami" icon={Hash} required>
          <input className="input mono" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
            placeholder="F-2026-0001" autoFocus />
        </Field>
        <Field label="Sana" icon={Calendar} required>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Mahsulot nomi" icon={Package}>
        <input className="input" value={productName} onChange={e => setProductName(e.target.value)} placeholder="Paracetamol 500mg" />
      </Field>
      <div className="form-row">
        <Field label="Dori seriyasi" icon={Tag}>
          <input className="input mono" value={series} onChange={e => setSeries(e.target.value)} placeholder="478001167783021" />
        </Field>
        <Field label="Miqdor" icon={Layers}>
          <input className="input" type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="100" />
        </Field>
      </div>
      <Field label="Faktura summasi (so'm)" icon={Banknote}>
        <input className="input" type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1500000" />
      </Field>
      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel} type="button">Bekor</button>
        <button className="btn-primary" onClick={submit} disabled={saving} type="button">
          {saving ? <><Loader2 size={15} className="spin" /> Saqlanmoqda…</> : "Saqlash"}
        </button>
      </div>
    </div>
  );
}

function ContractRow({ contract, onEdit, onDelete, onView }) {
  const { label, cls, Icon } = STATUS_MAP[contract.status] || STATUS_MAP.active;
  const invoiceCount = contract.invoices?.length ?? 0;
  const invoiceTotal = contract.invoices?.reduce((s, i) => s + i.amount, 0) ?? 0;

  return (
    <tr>
      <td>
        <div className="contract-num-cell">
          <span className="contract-num">{contract.contractNumber}</span>
        </div>
      </td>
      <td>
        <div className="supplier-cell">
          <Building2 size={13} className="sup-icon" />
          {contract.supplier}
        </div>
      </td>
      <td className="mono date-col">{formatDate(contract.date)}</td>
      <td><span className={`badge-status ${cls}`}><Icon size={10} />{label}</span></td>
      <td className="center">
        <span className="inv-count-chip"><Hash size={11} />{invoiceCount}</span>
      </td>
      <td className="price-col mono">{formatPrice(invoiceTotal)}</td>
      <td className="price-col mono">{contract.totalAmount ? formatPrice(contract.totalAmount) : "—"}</td>
      <td>
        <div className="row-actions">
          <button className="icon-btn view" onClick={() => onView(contract)} title="Ko'rish"><Eye size={14} strokeWidth={2} /></button>
          <button className="icon-btn edit" onClick={() => onEdit(contract)} title="Tahrirlash"><Pencil size={14} strokeWidth={2} /></button>
          <button className="icon-btn del"  onClick={() => onDelete(contract)} title="O'chirish"><Trash2 size={14} strokeWidth={2} /></button>
        </div>
      </td>
    </tr>
  );
}

function ContractDetailModal({ contract, onClose, onAddInvoice, onDeleteInvoice, saving }) {
  const { label, cls, Icon } = STATUS_MAP[contract.status] || STATUS_MAP.active;
  const invoiceTotal = contract.invoices?.reduce((s, i) => s + i.amount, 0) ?? 0;
  const [addInv, setAddInv] = useState(false);

  return (
    <Modal title={`Shartnoma: ${contract.contractNumber}`} onClose={onClose} wide>
      <div className="form-body">
        <div className="detail-header">
          <div className="detail-meta">
            <span className="dh-sup"><Building2 size={14} />{contract.supplier}</span>
            <span className="dh-date"><Calendar size={13} />{formatDate(contract.date)}</span>
            <span className={`badge-status ${cls}`}><Icon size={10} />{label}</span>
          </div>
          {contract.notes && <div className="detail-notes">{contract.notes}</div>}
          <div className="detail-amounts">
            <div className="da-item">
              <div className="da-label">Fakturalar jami</div>
              <div className="da-value">{formatPrice(invoiceTotal)}</div>
            </div>
            {contract.totalAmount > 0 && (
              <div className="da-item">
                <div className="da-label">Shartnoma summasi</div>
                <div className="da-value">{formatPrice(contract.totalAmount)}</div>
              </div>
            )}
          </div>
        </div>

        <div className="section-divider"><span>Fakturalar ({contract.invoices?.length ?? 0})</span></div>

        {contract.invoices?.length > 0 ? (
          <div className="invoice-list">
            {contract.invoices.map(inv => (
              <div key={inv.id} className="invoice-card">
                <div className="inv-top">
                  <span className="inv-num"><Hash size={11} />{inv.invoiceNumber}</span>
                  <span className="inv-date">{formatDate(inv.date)}</span>
                  <button className="icon-btn del sm" onClick={() => onDeleteInvoice(contract.id, inv.id)}>
                    <Trash2 size={12} strokeWidth={2} />
                  </button>
                </div>
                <div className="inv-detail">
                  {inv.productName && <span className="inv-prod"><Package size={11} />{inv.productName}</span>}
                  {inv.series     && <span className="inv-series"><Tag size={10} />{inv.series}</span>}
                  {inv.quantity   ? <span className="inv-qty"><Layers size={10} />{inv.quantity} dona</span> : null}
                </div>
                <div className="inv-amount">{formatPrice(inv.amount)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-inv">
            <Hash size={28} strokeWidth={1.5} style={{ color: "#cbd5e1" }} />
            <p>Hali faktura yo'q</p>
          </div>
        )}

        {addInv ? (
          <>
            <div className="section-divider"><span>Yangi faktura</span></div>
            <InvoiceForm
              contractId={contract.id}
              contractNumber={contract.contractNumber}
              onSave={(data) => { onAddInvoice(data); setAddInv(false); }}
              onCancel={() => setAddInv(false)}
              saving={saving}
            />
          </>
        ) : (
          <button className="btn-add-inv" onClick={() => setAddInv(true)}>
            <Plus size={14} strokeWidth={2.5} />Faktura qo'shish
          </button>
        )}
      </div>
    </Modal>
  );
}

export const Contract = () => {
  const [contracts,     setContracts]     = useState(initialContracts);
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [saving,        setSaving]        = useState(false);
  const [toast,         setToast]         = useState(null);
  const [addModal,      setAddModal]      = useState(false);
  const [editModal,     setEditModal]     = useState(null);
  const [viewModal,     setViewModal]     = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const handleCreate = (data) => {
    setSaving(true);
    setTimeout(() => {
      setContracts(prev => [{ id: ++mockContractId, ...data, invoices: [] }, ...prev]);
      showToast("Shartnoma qo'shildi!");
      setAddModal(false);
      setSaving(false);
    }, 400);
  };

  const handleUpdate = (data) => {
    setSaving(true);
    setTimeout(() => {
      setContracts(prev => prev.map(c => c.id === editModal.id ? { ...c, ...data } : c));
      showToast("Shartnoma yangilandi");
      setEditModal(null);
      setSaving(false);
    }, 400);
  };

  const handleDelete = (contract) => {
    if (!window.confirm(`"${contract.contractNumber}" shartnomani o'chirasizmi?`)) return;
    setContracts(prev => prev.filter(c => c.id !== contract.id));
    if (viewModal?.id === contract.id) setViewModal(null);
    showToast("Shartnoma o'chirildi");
  };

  const handleAddInvoice = (data) => {
    setSaving(true);
    setTimeout(() => {
      const newInv = { id: ++mockContractId, ...data };
      setContracts(prev => prev.map(c =>
        c.id === data.contractId ? { ...c, invoices: [...(c.invoices || []), newInv] } : c
      ));
      setViewModal(prev => prev ? { ...prev, invoices: [...(prev.invoices || []), newInv] } : prev);
      showToast("Faktura qo'shildi!");
      setSaving(false);
    }, 400);
  };

  const handleDeleteInvoice = (contractId, invoiceId) => {
    if (!window.confirm("Fakturani o'chirasizmi?")) return;
    setContracts(prev => prev.map(c =>
      c.id === contractId ? { ...c, invoices: c.invoices.filter(i => i.id !== invoiceId) } : c
    ));
    setViewModal(prev => prev ? { ...prev, invoices: prev.invoices.filter(i => i.id !== invoiceId) } : prev);
    showToast("Faktura o'chirildi");
  };

  const filtered = contracts.filter(c => {
    const matchSearch =
      (c.contractNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.supplier       || "").toLowerCase().includes(search.toLowerCase()) ||
      c.invoices?.some(i =>
        (i.invoiceNumber || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.productName   || "").toLowerCase().includes(search.toLowerCase()) ||
        (i.series        || "").includes(search)
      );
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalActive  = contracts.filter(c => c.status === "active").length;
  const totalClosed  = contracts.filter(c => c.status === "closed").length;
  const totalAmount  = contracts.reduce((s, c) => s + (c.totalAmount || 0), 0);
  const totalPaid    = contracts.reduce((s, c) => s + c.invoices.reduce((x, i) => x + i.amount, 0), 0);

  const exportCSV = () => {
    const rows = [
      ["Shartnoma №", "Yetkazib beruvchi", "Sana", "Holat", "Shartnoma summa", "Fakturalar soni", "Fakturalar jami"],
      ...filtered.map(c => [
        c.contractNumber, c.supplier, c.date,
        STATUS_MAP[c.status]?.label || c.status,
        c.totalAmount || 0,
        c.invoices?.length || 0,
        c.invoices?.reduce((s, i) => s + i.amount, 0) || 0,
      ]),
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = "shartnomalar.csv"; a.click();
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
            <h1><FileText size={24} strokeWidth={2.2} className="h1-icon" />Shartnomalar</h1>
            <p className="subtitle">Yetkazib beruvchilar bilan shartnoma va fakturalar</p>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={exportCSV}><Download size={15} />Excel/CSV</button>
            <button className="btn-primary" onClick={() => setAddModal(true)}><Plus size={16} strokeWidth={2.5} />Shartnoma qo'shish</button>
          </div>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-blue"><FileText size={18} /></div>
            <div><div className="stat-value">{contracts.length}</div><div className="stat-label">Jami shartnomalar</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-green"><CheckCircle size={18} /></div>
            <div><div className="stat-value">{totalActive}</div><div className="stat-label">Faol</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-violet"><Banknote size={18} /></div>
            <div><div className="stat-value">{(totalPaid / 1000000).toFixed(1)} mln</div><div className="stat-label">To'langan (faktura)</div></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrap stat-icon-teal"><Banknote size={18} /></div>
            <div><div className="stat-value">{(totalAmount / 1000000).toFixed(1)} mln</div><div className="stat-label">Shartnoma summa</div></div>
          </div>
        </div>

        <div className="toolbar">
          <div className="search-wrap">
            <Search size={15} className="search-icon" strokeWidth={2} />
            <input className="search-input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Shartnoma №, yetkazib beruvchi, faktura, seriya…" />
            {search && <button className="clear-btn" onClick={() => setSearch("")}><X size={14} /></button>}
          </div>
          <div className="filter-tabs">
            {[["all","Barchasi"],["active","Faol"],["pending","Kutilmoqda"],["closed","Yopilgan"],["overdue","Kechikkan"]].map(([v,l]) => (
              <button key={v} className={`filter-tab ${statusFilter === v ? "active" : ""}`} onClick={() => setStatusFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="table-card">
          {filtered.length === 0 ? (
            <div className="state-box">
              <FileText size={40} strokeWidth={1} style={{ color: "#cbd5e1" }} />
              <p>{search || statusFilter !== "all" ? "Mos shartnoma topilmadi" : "Shartnoma yo'q. Yangi qo'shing!"}</p>
              {!search && statusFilter === "all" && (
                <button className="btn-primary" onClick={() => setAddModal(true)}><Plus size={15} />Shartnoma qo'shish</button>
              )}
            </div>
          ) : (
            <div className="table-scroll">
              <table className="main-table">
                <thead>
                  <tr>
                    <th>Shartnoma №</th>
                    <th>Yetkazib beruvchi</th>
                    <th>Sana</th>
                    <th>Holat</th>
                    <th className="center">Fakturalar</th>
                    <th>To'langan</th>
                    <th>Shartnoma summa</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <ContractRow key={c.id} contract={c}
                      onEdit={setEditModal} onDelete={handleDelete} onView={setViewModal} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {addModal && (
        <Modal title="Yangi shartnoma" onClose={() => setAddModal(false)}>
          <ContractForm onSave={handleCreate} onCancel={() => setAddModal(false)} saving={saving} />
        </Modal>
      )}
      {editModal && (
        <Modal title="Shartnomani tahrirlash" onClose={() => setEditModal(null)}>
          <ContractForm initial={editModal} onSave={handleUpdate} onCancel={() => setEditModal(null)} saving={saving} />
        </Modal>
      )}
      {viewModal && (
        <ContractDetailModal
          contract={viewModal}
          onClose={() => setViewModal(null)}
          onAddInvoice={handleAddInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          saving={saving}
        />
      )}
    </>
  );
};

const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .page { padding: 32px 28px; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; background: #f6f8fc; min-height: 100vh; }
  .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
  .header-text h1 { font-size: 24px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; letter-spacing: -0.4px; }
  .h1-icon { color: #0d9488; }
  .subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .btn-primary { display: inline-flex; align-items: center; gap: 7px; background: #0d9488; color: #fff; border: none; border-radius: 10px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; white-space: nowrap; box-shadow: 0 1px 3px rgba(13,148,136,0.25); }
  .btn-primary:hover:not(:disabled) { background: #0f766e; }
  .btn-primary:disabled { background: #99f6e4; cursor: not-allowed; }
  .btn-secondary { display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.15s; }
  .btn-secondary:hover { background: #f8fafc; }
  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px; }
  .stat-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; }
  .stat-icon-wrap { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .stat-icon-blue   { background: #eff6ff; color: #2563eb; }
  .stat-icon-green  { background: #dcfce7; color: #16a34a; }
  .stat-icon-violet { background: #f5f3ff; color: #7c3aed; }
  .stat-icon-teal   { background: #f0fdfa; color: #0d9488; }
  .stat-value { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
  .stat-label { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
  .search-wrap { position: relative; display: flex; align-items: center; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 11px; flex: 1; min-width: 240px; transition: border-color 0.15s, box-shadow 0.15s; }
  .search-wrap:focus-within { border-color: #0d9488; box-shadow: 0 0 0 3px #ccfbf1; }
  .search-icon { margin-left: 14px; color: #cbd5e1; flex-shrink: 0; }
  .search-input { flex: 1; border: none; outline: none; padding: 11px 12px; font-size: 14px; background: transparent; color: #0f172a; }
  .search-input::placeholder { color: #cbd5e1; }
  .clear-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0 14px; display: flex; align-items: center; }
  .filter-tabs { display: flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 4px; }
  .filter-tab { border: none; background: none; padding: 7px 12px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; color: #64748b; transition: all 0.15s; white-space: nowrap; }
  .filter-tab.active { background: #fff; color: #0d9488; font-weight: 700; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .table-scroll { overflow-x: auto; }
  .state-box { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 72px 24px; color: #94a3b8; font-size: 15px; }
  .main-table { width: 100%; border-collapse: collapse; min-width: 800px; }
  .main-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
  .main-table th { padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; text-align: left; white-space: nowrap; }
  .main-table th.center { text-align: center; }
  .main-table td.center { text-align: center; }
  .main-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
  .main-table tbody tr:last-child { border-bottom: none; }
  .main-table tbody tr:hover { background: #f0fdfa; }
  .main-table td { padding: 14px 16px; font-size: 13px; color: #334155; vertical-align: middle; }
  .contract-num-cell { display: flex; align-items: center; }
  .contract-num { font-family: monospace; font-weight: 800; font-size: 14px; color: #0f172a; background: #f0fdfa; color: #0f766e; padding: 4px 10px; border-radius: 7px; border: 1px solid #99f6e4; }
  .supplier-cell { display: flex; align-items: center; gap: 6px; color: #334155; font-weight: 500; }
  .sup-icon { color: #94a3b8; flex-shrink: 0; }
  .date-col { color: #64748b; font-size: 13px; }
  .badge-status { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
  .badge-status.green  { background: #dcfce7; color: #16a34a; }
  .badge-status.yellow { background: #fef9c3; color: #b45309; }
  .badge-status.red    { background: #fee2e2; color: #dc2626; }
  .badge-status.gray   { background: #f1f5f9; color: #64748b; }
  .inv-count-chip { display: inline-flex; align-items: center; gap: 4px; background: #f0fdfa; color: #0d9488; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
  .price-col { font-weight: 600; color: #0f172a; white-space: nowrap; font-family: monospace; }
  .row-actions { display: flex; gap: 6px; justify-content: flex-end; }
  .icon-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; color: #64748b; }
  .icon-btn.sm { width: 26px; height: 26px; border-radius: 6px; }
  .icon-btn.view:hover { background: #f0fdfa; border-color: #0d9488; color: #0d9488; }
  .icon-btn.edit:hover { background: #fefce8; border-color: #f59e0b; color: #b45309; }
  .icon-btn.del:hover  { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 16px; }
  .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 520px; box-shadow: 0 32px 80px rgba(0,0,0,0.2); animation: popIn 0.18s ease; max-height: 90vh; overflow-y: auto; }
  .modal-wide { max-width: 640px; }
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
  .input:focus { border-color: #0d9488; box-shadow: 0 0 0 3px #ccfbf1; }
  .input::placeholder { color: #cbd5e1; }
  .mono { font-family: monospace; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
  .contract-chip { display: inline-flex; align-items: center; gap: 6px; background: #f0fdfa; color: #0d9488; font-size: 12px; font-weight: 700; padding: 5px 12px; border-radius: 8px; border: 1px solid #99f6e4; align-self: flex-start; font-family: monospace; }
  .detail-header { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .detail-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .dh-sup  { display: flex; align-items: center; gap: 5px; font-weight: 700; color: #0f172a; font-size: 14px; }
  .dh-date { display: flex; align-items: center; gap: 4px; color: #64748b; font-size: 13px; }
  .detail-notes { color: #64748b; font-size: 13px; padding: 8px 12px; background: #fff; border-radius: 8px; border: 1px solid #e2e8f0; }
  .detail-amounts { display: flex; gap: 16px; flex-wrap: wrap; }
  .da-item { display: flex; flex-direction: column; gap: 2px; }
  .da-label { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  .da-value { font-size: 16px; font-weight: 800; color: #0f172a; font-family: monospace; }
  .invoice-list { display: flex; flex-direction: column; gap: 8px; }
  .invoice-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; transition: border-color 0.15s; }
  .invoice-card:hover { border-color: #99f6e4; }
  .inv-top { display: flex; align-items: center; gap: 10px; }
  .inv-num { display: inline-flex; align-items: center; gap: 4px; font-family: monospace; font-weight: 800; font-size: 13px; color: #0f766e; flex: 1; }
  .inv-date { font-size: 12px; color: #94a3b8; }
  .inv-detail { display: flex; gap: 8px; flex-wrap: wrap; }
  .inv-prod   { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; color: #334155; }
  .inv-series { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; color: #6d28d9; background: #f5f3ff; padding: 2px 7px; border-radius: 4px; font-family: monospace; }
  .inv-qty    { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; color: #64748b; }
  .inv-amount { font-family: monospace; font-weight: 700; font-size: 14px; color: #0f172a; }
  .empty-inv { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 24px; color: #94a3b8; font-size: 14px; }
  .btn-add-inv { display: inline-flex; align-items: center; gap: 6px; background: #f0fdfa; color: #0d9488; border: 1.5px dashed #5eead4; border-radius: 10px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s; align-self: flex-start; }
  .btn-add-inv:hover { background: #ccfbf1; border-color: #0d9488; }
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
    .filter-tabs { overflow-x: auto; width: 100%; }
    .header-actions { flex-direction: column; width: 100%; }
  }
`;