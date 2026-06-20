import { useState } from "react";
import {
  Search, X, Plus, Pencil, Trash2, Phone, User,
  ClipboardList, CheckCircle, ShieldAlert, Loader2,
  Users, Hash, Calendar, ChevronRight, ShoppingBag,
  Banknote, Tag, FlaskConical, Package,
} from "lucide-react";

// ─── MOCK DATA ──────────────────────────────────────────────
let mockIdCounter = 100;
const initialCustomers = [
  { id: 1, name: "Alisher Karimov", phone: "+998 90 123 45 67", inn: "304123456", createdAt: "2026-03-12" },
  { id: 2, name: "Madina Yusupova", phone: "+998 93 765 43 21", inn: null, createdAt: "2026-04-02" },
  { id: 3, name: "Bek Pharmacy LLC", phone: "+998 71 200 10 10", inn: "201998877", createdAt: "2026-05-18" },
];

const mockHistory = {
  stats: { totalOrders: 4, totalSpent: 1280000 },
  sales: [
    {
      id: 501,
      createdAt: "2026-06-10",
      totalPrice: 360000,
      items: [
        { id: 1, product: { name: "Paracetamol 500mg" }, batch: { series: "478001167783021", mg: "500mg" }, quantity: 10, price: 12000, total: 120000 },
        { id: 2, product: { name: "Amoxicillin 250mg" }, batch: { series: "478019988771", mg: "250mg" }, quantity: 10, price: 24000, total: 240000 },
      ],
    },
    {
      id: 487,
      createdAt: "2026-05-22",
      totalPrice: 920000,
      items: [
        { id: 3, product: { name: "Vitamin C 1000mg" }, batch: { series: "478011199001", mg: "1000mg" }, quantity: 50, price: 18000, total: 900000 },
      ],
    },
  ],
};

// ─── Utility ─────────────────────────────────────────────
const formatDate  = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";
const formatPrice = (p) => Number(p).toLocaleString("uz-UZ") + " so'm";

// ─── Toast ────────────────────────────────────────────────
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
      <button className="toast-close" onClick={onClose} aria-label="Yopish">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className={`modal-box${wide ? " modal-wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Yopish">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────
function Field({ label, icon: Icon, required, children }) {
  return (
    <div className="field">
      <label className="field-label">
        {Icon && <Icon size={13} strokeWidth={2.5} />}
        {label}
        {required && <span className="req">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Customer Form ────────────────────────────────────────
function CustomerForm({ initial = {}, onSave, onCancel, saving }) {
  const [name,  setName]  = useState(initial.name  || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [inn,   setInn]   = useState(initial.inn   || "");
  const [err,   setErr]   = useState("");

  const submit = () => {
    if (!name.trim() || !phone.trim()) return setErr("Ism va telefon majburiy");
    setErr("");
    onSave({ name: name.trim(), phone: phone.trim(), inn: inn.trim() || null });
  };

  return (
    <div className="form-body">
      {err && <div className="form-error"><ShieldAlert size={14} />{err}</div>}
      <Field label="Ism" icon={User} required>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Masalan: Alisher Karimov" autoFocus />
      </Field>
      <Field label="Telefon" icon={Phone} required>
        <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="+998 90 123 45 67" />
      </Field>
      <Field label="INN" icon={Hash}>
        <input className="input" value={inn} onChange={(e) => setInn(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Ixtiyoriy" />
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

// ─── History Modal (mock) ─────────────────────────────────
function HistoryModal({ customer, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [openSale, setOpenSale] = useState(null);

  useState(() => {
    const t = setTimeout(() => {
      setData(mockHistory);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  });

  return (
    <Modal title={`${customer.name} — Xaridlar tarixi`} onClose={onClose} wide>
      {loading ? (
        <div className="state-box">
          <Loader2 size={32} strokeWidth={1.5} className="spin text-blue" />
          <p>Yuklanmoqda…</p>
        </div>
      ) : !data ? (
        <div className="state-box">
          <ShieldAlert size={36} strokeWidth={1.5} className="text-muted" />
          <p>Ma'lumot yuklanmadi</p>
        </div>
      ) : (
        <div className="hist-body">
          <div className="hist-stats">
            <div className="hstat-card hstat-blue">
              <div className="hstat-icon-wrap hstat-icon-blue"><ShoppingBag size={18} strokeWidth={2} /></div>
              <div>
                <div className="hstat-value">{data.stats.totalOrders}</div>
                <div className="hstat-label">Jami buyurtma</div>
              </div>
            </div>
            <div className="hstat-card hstat-violet">
              <div className="hstat-icon-wrap hstat-icon-violet"><Banknote size={18} strokeWidth={2} /></div>
              <div>
                <div className="hstat-value">{formatPrice(data.stats.totalSpent)}</div>
                <div className="hstat-label">Jami sarflagan</div>
              </div>
            </div>
          </div>

          {data.sales.length === 0 ? (
            <div className="state-box-sm">
              <ShoppingBag size={36} strokeWidth={1} className="text-muted" />
              <p>Hali xarid yo'q</p>
            </div>
          ) : (
            <div className="sales-list">
              {data.sales.map((sale) => (
                <div key={sale.id} className="sale-card">
                  <div className="sale-card-header" onClick={() => setOpenSale(openSale === sale.id ? null : sale.id)}
                    role="button" tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setOpenSale(openSale === sale.id ? null : sale.id)}>
                    <div className="sale-meta">
                      <span className="sale-id">#{sale.id}</span>
                      <span className="sale-date"><Calendar size={11} />{formatDate(sale.createdAt)}</span>
                      <span className="sale-count-badge"><Package size={10} />{sale.items.length} mahsulot</span>
                    </div>
                    <div className="sale-right">
                      <span className="sale-total">{formatPrice(sale.totalPrice)}</span>
                      <span className={`sale-chevron ${openSale === sale.id ? "open" : ""}`}>
                        <ChevronRight size={15} strokeWidth={2.5} />
                      </span>
                    </div>
                  </div>

                  {openSale === sale.id && (
                    <div className="sale-items">
                      <table className="items-table">
                        <thead>
                          <tr><th>Mahsulot</th><th>Seriya / Dozaj</th><th>Miqdor</th><th>Narx</th><th>Jami</th></tr>
                        </thead>
                        <tbody>
                          {sale.items.map((item) => (
                            <tr key={item.id}>
                              <td className="item-name">{item.product.name}</td>
                              <td>
                                <span className="badge-series"><Tag size={9} />{item.batch.series}</span>
                                <span className="badge-mg"><FlaskConical size={9} />{item.batch.mg}</span>
                              </td>
                              <td><span className="qty-pill">{item.quantity}</span></td>
                              <td className="mono">{formatPrice(item.price)}</td>
                              <td className="mono total-col">{formatPrice(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Stat Card ────────────────────────────────────────────
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

// ─── Customer Row ─────────────────────────────────────────
function CustomerRow({ customer, onEdit, onDelete, onHistory }) {
  return (
    <tr className="c-row">
      <td>
        <div className="c-avatar-cell">
          <div className="c-avatar">{customer.name.charAt(0).toUpperCase()}</div>
          <div>
            <div className="c-name">{customer.name}</div>
            {customer.inn && <div className="c-inn"><Hash size={10} />INN: {customer.inn}</div>}
          </div>
        </div>
      </td>
      <td>
        <a href={`tel:${customer.phone}`} className="c-phone">
          <Phone size={13} strokeWidth={2} />{customer.phone || "—"}
        </a>
      </td>
      <td className="center">
        <span className="c-date"><Calendar size={12} strokeWidth={2} />{formatDate(customer.createdAt)}</span>
      </td>
      <td>
        <div className="row-actions">
          <button className="icon-btn hist" onClick={() => onHistory(customer)} title="Xaridlar tarixi">
            <ClipboardList size={14} strokeWidth={2} />
          </button>
          <button className="icon-btn edit" onClick={() => onEdit(customer)} title="Tahrirlash">
            <Pencil size={14} strokeWidth={2} />
          </button>
          <button className="icon-btn del" onClick={() => onDelete(customer)} title="O'chirish">
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────
export const Customer = () => {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search,     setSearch]   = useState("");
  const [saving,     setSaving]   = useState(false);
  const [toast,      setToast]    = useState(null);
  const [addModal,  setAddModal]  = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [histModal, setHistModal] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone || "").includes(search) || (c.inn || "").includes(search);
  });

  const handleCreate = (data) => {
    setSaving(true);
    setTimeout(() => {
      setCustomers((prev) => [{ id: ++mockIdCounter, ...data, createdAt: new Date().toISOString() }, ...prev]);
      showToast("Mijoz qo'shildi!");
      setAddModal(false);
      setSaving(false);
    }, 400);
  };

  const handleUpdate = (data) => {
    setSaving(true);
    setTimeout(() => {
      setCustomers((prev) => prev.map((c) => (c.id === editModal.id ? { ...c, ...data } : c)));
      showToast("Mijoz yangilandi");
      setEditModal(null);
      setSaving(false);
    }, 400);
  };

  const handleDelete = (customer) => {
    if (!window.confirm(`"${customer.name}" mijozini o'chirasizmi?`)) return;
    setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    showToast("Mijoz o'chirildi");
  };

  return (
    <>
      <style>{STYLES}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page">
        <div className="page-header">
          <div className="header-text">
            <h1><Users size={24} strokeWidth={2.2} className="h1-icon" />Mijozlar</h1>
            <p className="subtitle">Mijozlar ro'yxati va xaridlar tarixi</p>
          </div>
          <button className="btn-primary" onClick={() => setAddModal(true)}>
            <Plus size={16} strokeWidth={2.5} />Mijoz qo'shish
          </button>
        </div>

        <div className="stats-row">
          <StatCard icon={Users}       value={customers.length} label="Jami mijozlar"  accent="blue"   />
          <StatCard icon={ShoppingBag} value="—"                label="Bugungi xarid"  accent="violet" />
          <StatCard icon={Banknote}    value="—"                label="Umumiy aylanma" accent="teal"   />
        </div>

        <div className="search-wrap">
          <Search size={15} className="search-icon" strokeWidth={2} />
          <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, telefon yoki INN bo'yicha qidiring…" />
          {search && (
            <button className="clear-btn" onClick={() => setSearch("")}><X size={14} /></button>
          )}
        </div>

        <div className="table-card">
          {filtered.length === 0 ? (
            <div className="state-box">
              <Users size={40} strokeWidth={1} className="text-muted" />
              <p>{search ? `"${search}" bo'yicha hech narsa topilmadi` : "Mijoz yo'q. Birinchisini qo'shing!"}</p>
              {!search && (
                <button className="btn-primary" onClick={() => setAddModal(true)}>
                  <Plus size={15} /> Mijoz qo'shish
                </button>
              )}
            </div>
          ) : (
            <table className="main-table">
              <thead>
                <tr><th>Mijoz</th><th>Telefon</th><th className="center">Qo'shilgan</th><th className="center">Amallar</th></tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <CustomerRow key={c.id} customer={c} onEdit={setEditModal} onDelete={handleDelete} onHistory={setHistModal} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {addModal && (
        <Modal title="Yangi mijoz qo'shish" onClose={() => setAddModal(false)}>
          <CustomerForm onSave={handleCreate} onCancel={() => setAddModal(false)} saving={saving} />
        </Modal>
      )}

      {editModal && (
        <Modal title="Mijozni tahrirlash" onClose={() => setEditModal(null)}>
          <CustomerForm initial={editModal} onSave={handleUpdate} onCancel={() => setEditModal(null)} saving={saving} />
        </Modal>
      )}

      {histModal && <HistoryModal customer={histModal} onClose={() => setHistModal(null)} />}
    </>
  );
};

// ─── Styles ──────────────────────────────────────────────
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
  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 20px; }
  .stat-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; }
  .stat-icon-wrap { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .stat-icon-blue   { background: #eff6ff; color: #2563eb; }
  .stat-icon-violet { background: #f5f3ff; color: #7c3aed; }
  .stat-icon-teal   { background: #f0fdfa; color: #0d9488; }
  .stat-value { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
  .stat-label { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .search-wrap { display: flex; align-items: center; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 11px; margin-bottom: 14px; transition: border-color 0.15s, box-shadow 0.15s; }
  .search-wrap:focus-within { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
  .search-icon { margin-left: 14px; color: #cbd5e1; flex-shrink: 0; }
  .search-input { flex: 1; border: none; outline: none; padding: 12px 12px; font-size: 14px; background: transparent; color: #0f172a; font-family: inherit; }
  .search-input::placeholder { color: #cbd5e1; }
  .clear-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0 14px; display: flex; align-items: center; }
  .clear-btn:hover { color: #475569; }
  .table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .state-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 72px 24px; color: #94a3b8; font-size: 15px; }
  .state-box p { color: #94a3b8; }
  .text-blue  { color: #2563eb; }
  .text-muted { color: #cbd5e1; }
  .main-table { width: 100%; border-collapse: collapse; }
  .main-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
  .main-table th { padding: 13px 18px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8; text-align: left; }
  .main-table th.center { text-align: center; }
  .main-table td.center { text-align: center; }
  .c-row { border-bottom: 1px solid #f1f5f9; transition: background 0.12s; }
  .c-row:hover { background: #f0f7ff; }
  .c-row td { padding: 14px 18px; font-size: 14px; color: #334155; vertical-align: middle; }
  .c-avatar-cell { display: flex; align-items: center; gap: 12px; }
  .c-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; letter-spacing: -0.5px; }
  .c-name { font-weight: 700; color: #0f172a; font-size: 14px; }
  .c-inn { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; color: #94a3b8; margin-top: 3px; }
  .c-phone { display: inline-flex; align-items: center; gap: 6px; color: #2563eb; text-decoration: none; font-weight: 500; font-size: 13px; padding: 5px 10px; border-radius: 8px; background: #eff6ff; transition: background 0.15s; }
  .c-phone:hover { background: #dbeafe; }
  .c-date { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #64748b; }
  .row-actions { display: flex; gap: 6px; justify-content: flex-end; }
  .icon-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; width: 34px; height: 34px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; color: #64748b; flex-shrink: 0; }
  .icon-btn.hist:hover { background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
  .icon-btn.edit:hover { background: #fefce8; border-color: #f59e0b; color: #b45309; }
  .icon-btn.del:hover  { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 16px; }
  .modal-box { background: #fff; border-radius: 20px; width: 100%; max-width: 480px; box-shadow: 0 32px 80px rgba(0, 0, 0, 0.2); animation: popIn 0.18s ease; overflow: hidden; }
  .modal-wide { max-width: 740px; }
  @keyframes popIn { from { opacity: 0; transform: scale(0.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 22px 24px 0; }
  .modal-header h2 { font-size: 17px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; }
  .modal-close { background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: background 0.15s; }
  .modal-close:hover { background: #e2e8f0; color: #0f172a; }
  .form-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 14px; }
  .form-error { display: flex; align-items: center; gap: 7px; background: #fef2f2; color: #dc2626; font-size: 13px; padding: 10px 14px; border-radius: 9px; border: 1px solid #fecaca; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: #475569; letter-spacing: 0.02em; text-transform: uppercase; }
  .field-label svg { color: #94a3b8; }
  .req { color: #ef4444; margin-left: 1px; }
  .input { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px 13px; font-size: 14px; outline: none; color: #0f172a; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; font-family: inherit; }
  .input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
  .input::placeholder { color: #cbd5e1; }
  .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px; }
  .hist-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 18px; max-height: 76vh; overflow-y: auto; }
  .hist-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .hstat-card { border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; }
  .hstat-icon-wrap { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .hstat-icon-blue   { background: #eff6ff; color: #2563eb; }
  .hstat-icon-violet { background: #f5f3ff; color: #7c3aed; }
  .hstat-value { font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1; }
  .hstat-blue   .hstat-value { color: #2563eb; }
  .hstat-violet .hstat-value { color: #7c3aed; }
  .hstat-label { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .state-box-sm { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px; color: #94a3b8; font-size: 14px; }
  .sales-list { display: flex; flex-direction: column; gap: 10px; }
  .sale-card { border: 1.5px solid #e2e8f0; border-radius: 13px; overflow: hidden; transition: border-color 0.15s; }
  .sale-card:hover { border-color: #bfdbfe; }
  .sale-card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; cursor: pointer; transition: background 0.1s; outline: none; }
  .sale-card-header:hover { background: #f8fafc; }
  .sale-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .sale-id { font-weight: 800; color: #7c3aed; font-size: 13px; background: #f5f3ff; padding: 3px 9px; border-radius: 6px; }
  .sale-date { display: inline-flex; align-items: center; gap: 4px; color: #64748b; font-size: 12px; }
  .sale-count-badge { display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; color: #64748b; font-size: 11px; padding: 3px 8px; border-radius: 20px; }
  .sale-right { display: flex; align-items: center; gap: 12px; }
  .sale-total { font-weight: 700; color: #0f172a; font-size: 14px; }
  .sale-chevron { color: #94a3b8; display: flex; align-items: center; transition: transform 0.2s, color 0.2s; }
  .sale-chevron.open { transform: rotate(90deg); color: #2563eb; }
  .sale-items { border-top: 1.5px solid #e2e8f0; background: #fafbff; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th { padding: 9px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #7c3aed; background: #eff6ff; text-align: left; border-bottom: 1px solid #dbeafe; }
  .items-table td { padding: 10px 16px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .items-table tr:last-child td { border-bottom: none; }
  .items-table tbody tr:hover { background: #f0f7ff; }
  .item-name { font-weight: 600; color: #0f172a; }
  .badge-series { display: inline-flex; align-items: center; gap: 3px; background: #ede9fe; color: #6d28d9; font-family: 'JetBrains Mono', 'Fira Mono', monospace; font-size: 11px; padding: 2px 7px; border-radius: 5px; font-weight: 700; margin-right: 5px; }
  .badge-mg { display: inline-flex; align-items: center; gap: 3px; background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 7px; border-radius: 5px; }
  .qty-pill { display: inline-block; background: #f1f5f9; color: #334155; font-weight: 700; font-size: 13px; padding: 2px 10px; border-radius: 20px; }
  .mono { font-family: 'JetBrains Mono', 'Fira Mono', monospace; font-size: 12px; }
  .total-col { font-weight: 700; color: #0f172a; }
  .toast { position: fixed; bottom: 28px; right: 28px; z-index: 2000; padding: 14px 18px; border-radius: 14px; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 10px; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18); animation: slideUp 0.22s ease; max-width: 360px; }
  .toast-success { background: #0f172a; color: #fff; }
  .toast-error   { background: #dc2626; color: #fff; }
  .toast-icon  { display: flex; align-items: center; flex-shrink: 0; }
  .toast-close { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.7); padding: 0; margin-left: auto; display: flex; align-items: center; }
  .toast-close:hover { color: #fff; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  .spin { animation: spinAnim 0.7s linear infinite; }
  @keyframes spinAnim { to { transform: rotate(360deg); } }
  @media (max-width: 640px) {
    .page { padding: 20px 14px; }
    .stats-row { grid-template-columns: 1fr; }
    .hist-stats { grid-template-columns: 1fr; }
    .modal-box { border-radius: 16px; }
    .page-header { flex-direction: column; align-items: flex-start; }
    .sale-meta { gap: 6px; }
  }
`;