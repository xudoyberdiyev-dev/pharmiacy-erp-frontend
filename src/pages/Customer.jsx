import { useState, useEffect, useRef } from "react";
import {
  Search, X, Plus, Pencil, Trash2, Phone, User,
  ClipboardList, CheckCircle, ShieldAlert, Loader2,
  Users, Hash, Calendar, ChevronRight, ShoppingBag,
  Banknote, Tag, FlaskConical, Package, ChevronLeft,
  ChevronDown, AlertTriangle, Eye, MoreVertical,
} from "lucide-react";

// ─── MOCK DATA ──────────────────────────────────────────────
let mockIdCounter = 200;

const makeDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const initialCustomers = [
  { id: 1,  name: "Alisher Karimov",    phone: "+998 90 123 45 67", inn: "304123456",  salesCount: 4,  createdAt: makeDate(102) },
  { id: 2,  name: "Madina Yusupova",    phone: "+998 93 765 43 21", inn: null,         salesCount: 1,  createdAt: makeDate(81)  },
  { id: 3,  name: "Bek Pharmacy LLC",   phone: "+998 71 200 10 10", inn: "201998877",  salesCount: 12, createdAt: makeDate(35)  },
  { id: 4,  name: "Dilnoza Toshmatova", phone: "+998 97 441 22 88", inn: null,         salesCount: 0,  createdAt: makeDate(20)  },
  { id: 5,  name: "Jasur Rахimov",      phone: "+998 99 312 00 55", inn: "507332211",  salesCount: 7,  createdAt: makeDate(58)  },
  { id: 6,  name: "Nodira Ergasheva",   phone: "+998 94 888 77 66", inn: null,         salesCount: 2,  createdAt: makeDate(14)  },
  { id: 7,  name: "MedStore Tashkent",  phone: "+998 71 330 44 55", inn: "890001122",  salesCount: 31, createdAt: makeDate(190) },
  { id: 8,  name: "Bobur Xolmatov",     phone: "+998 90 521 89 31", inn: null,         salesCount: 0,  createdAt: makeDate(4)   },
  { id: 9,  name: "Sarvinoz Nazarova",  phone: "+998 93 007 14 20", inn: "110228843",  salesCount: 5,  createdAt: makeDate(77)  },
  { id: 10, name: "Farmaplus Dorixona", phone: "+998 71 444 00 11", inn: "779900334",  salesCount: 19, createdAt: makeDate(240) },
  { id: 11, name: "Anvar Tursunov",     phone: "+998 98 611 32 10", inn: null,         salesCount: 3,  createdAt: makeDate(30)  },
  { id: 12, name: "Zulfiya Mirzayeva",  phone: "+998 91 220 90 45", inn: null,         salesCount: 0,  createdAt: makeDate(2)   },
];

const mockSalesData = {
  1: {
    stats: { totalOrders: 4, totalSpent: 1280000 },
    sales: [
      {
        id: 501, createdAt: makeDate(12), totalPrice: 360000,
        items: [
          { id: 1, product: { name: "Paracetamol 500mg" }, batch: { series: "478001167783021", mg: "500mg" }, quantity: 10, price: 12000, total: 120000 },
          { id: 2, product: { name: "Amoxicillin 250mg" }, batch: { series: "478019988771", mg: "250mg" }, quantity: 10, price: 24000, total: 240000 },
        ],
      },
      {
        id: 487, createdAt: makeDate(31), totalPrice: 920000,
        items: [
          { id: 3, product: { name: "Vitamin C 1000mg" }, batch: { series: "478011199001", mg: "1000mg" }, quantity: 50, price: 18000, total: 900000 },
          { id: 4, product: { name: "Aspirin 100mg" }, batch: { series: "990011223344", mg: "100mg" }, quantity: 1, price: 20000, total: 20000 },
        ],
      },
    ],
  },
  3: {
    stats: { totalOrders: 12, totalSpent: 8400000 },
    sales: [
      {
        id: 612, createdAt: makeDate(5), totalPrice: 1200000,
        items: [
          { id: 5, product: { name: "Ibuprofen 400mg" }, batch: { series: "110029938821", mg: "400mg" }, quantity: 50, price: 15000, total: 750000 },
          { id: 6, product: { name: "Metformin 500mg" }, batch: { series: "229900112233", mg: "500mg" }, quantity: 30, price: 15000, total: 450000 },
        ],
      },
    ],
  },
};

const PAGE_SIZE = 8;

// ─── Utility ─────────────────────────────────────────────
const formatDate  = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";
const formatPrice = (p) => Number(p).toLocaleString("uz-UZ") + " so'm";

const avatarColors = [
  ["#e0edff","#1a56db"], ["#ede9fe","#6d28d9"], ["#d1fae5","#065f46"],
  ["#fef3c7","#92400e"], ["#fce7f3","#be185d"], ["#cffafe","#155e75"],
];
const getAvatarColors = (name) => avatarColors[(name.charCodeAt(0) || 0) % avatarColors.length];

// ─── Toast ────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div style={{ position:"fixed", bottom:28, right:28, zIndex:2000, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} role="alert">
          <span className="toast-icon">
            {t.type === "success" ? <CheckCircle size={16} strokeWidth={2.5} /> : <ShieldAlert size={16} strokeWidth={2.5} />}
          </span>
          <span>{t.msg}</span>
          <button className="toast-close" onClick={() => remove(t.id)}><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  };
  const remove = (id) => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
}

// ─── Modal ────────────────────────────────────────────────
function Modal({ title, onClose, children, wide, subtitle }) {
  useEffect(() => {
    const fn = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-box${wide ? " modal-wide" : ""}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Yopish"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────
function Field({ label, icon: Icon, required, error, children, hint }) {
  return (
    <div className="field">
      <label className="field-label">
        {Icon && <Icon size={13} strokeWidth={2.5} />}
        {label}
        {required && <span className="req">*</span>}
      </label>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error"><AlertTriangle size={11} />{error}</span>}
    </div>
  );
}

// ─── Customer Form ────────────────────────────────────────
function CustomerForm({ initial = {}, onSave, onCancel, saving }) {
  const [name,   setName]   = useState(initial.name  || "");
  const [phone,  setPhone]  = useState(initial.phone || "");
  const [inn,    setInn]    = useState(initial.inn   || "");
  const [errors, setErrors] = useState({});
  const nameRef = useRef();
  useEffect(() => { nameRef.current?.focus(); }, []);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Ism majburiy";
    if (!phone.trim()) e.phone = "Telefon majburiy";
    else if (!/^\+998/.test(phone.trim())) e.phone = "+998 bilan boshlang";
    if (inn && !/^\d{9,12}$/.test(inn.trim())) e.inn = "INN 9–12 raqamdan iborat";
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ name: name.trim(), phone: phone.trim(), inn: inn.trim() || null });
  };

  return (
    <div className="form-body">
      <Field label="To'liq ism" icon={User} required error={errors.name}>
        <input
          ref={nameRef}
          className={`input${errors.name ? " input-err" : ""}`}
          value={name} onChange={e => { setName(e.target.value); setErrors(p => ({...p, name: ""})); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Masalan: Alisher Karimov"
        />
      </Field>
      <Field label="Telefon raqami" icon={Phone} required error={errors.phone} hint="Format: +998 90 123 45 67">
        <input
          className={`input${errors.phone ? " input-err" : ""}`}
          value={phone} onChange={e => { setPhone(e.target.value); setErrors(p => ({...p, phone: ""})); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="+998 90 000 00 00"
        />
      </Field>
      <Field label="INN" icon={Hash} error={errors.inn} hint="Ixtiyoriy — yuridik shaxslar uchun">
        <input
          className={`input${errors.inn ? " input-err" : ""}`}
          value={inn} onChange={e => { setInn(e.target.value); setErrors(p => ({...p, inn: ""})); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="123456789"
        />
      </Field>
      <div className="form-actions">
        <button className="btn-ghost" onClick={onCancel} type="button">Bekor qilish</button>
        <button className="btn-primary" onClick={submit} disabled={saving} type="button">
          {saving ? <><Loader2 size={14} className="spin" /> Saqlanmoqda…</> : <><CheckCircle size={14} />{initial.id ? "Saqlash" : "Qo'shish"}</>}
        </button>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────
function DeleteModal({ customer, onConfirm, onCancel, deleting }) {
  const hasSales = customer.salesCount > 0;
  return (
    <Modal title="Mijozni o'chirish" onClose={onCancel}>
      <div className="form-body">
        <div className={`delete-warning ${hasSales ? "delete-warning-red" : "delete-warning-amber"}`}>
          <div className="delete-warning-icon">
            <AlertTriangle size={20} strokeWidth={2} />
          </div>
          <div>
            {hasSales ? (
              <>
                <strong>O'chirib bo'lmaydi</strong>
                <p style={{marginTop:4,fontSize:13,lineHeight:1.5}}>
                  <b>{customer.name}</b> mijozining <b>{customer.salesCount} ta sotuvı</b> mavjud. Sotuv tarixi bo'lgan mijozlarni o'chirish mumkin emas.
                </p>
              </>
            ) : (
              <>
                <strong>Ishonchingiz komilmi?</strong>
                <p style={{marginTop:4,fontSize:13,lineHeight:1.5}}>
                  <b>{customer.name}</b> mijozi butunlay o'chiriladi. Bu amalni orqaga qaytarib bo'lmaydi.
                </p>
              </>
            )}
          </div>
        </div>
        <div className="form-actions">
          <button className="btn-ghost" onClick={onCancel}>Bekor qilish</button>
          {!hasSales && (
            <button className="btn-danger" onClick={onConfirm} disabled={deleting}>
              {deleting ? <><Loader2 size={14} className="spin" />O'chirilmoqda…</> : <><Trash2 size={14} />O'chirish</>}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── History Modal ────────────────────────────────────────
function HistoryModal({ customer, onClose }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [openSale, setOpenSale] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setData(mockSalesData[customer.id] || { stats: { totalOrders: customer.salesCount, totalSpent: 0 }, sales: [] });
      setLoading(false);
    }, 600);
    return () => clearTimeout(t);
  }, [customer.id]);

  const [bg, color] = getAvatarColors(customer.name);

  return (
    <Modal title="Xaridlar tarixi" subtitle={customer.name} onClose={onClose} wide>
      {loading ? (
        <div className="state-box" style={{padding:"60px 24px"}}>
          <Loader2 size={28} className="spin" style={{color:"#2563eb"}} />
          <p style={{color:"#94a3b8",fontSize:14}}>Yuklanmoqda…</p>
        </div>
      ) : (
        <div className="hist-body">
          <div className="hist-customer-banner">
            <div className="hist-avatar" style={{background:bg,color}}>{customer.name.charAt(0).toUpperCase()}</div>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>{customer.name}</div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                <Phone size={11} style={{color:"#94a3b8"}} />
                <span style={{fontSize:12,color:"#64748b"}}>{customer.phone}</span>
                {customer.inn && <>
                  <span style={{color:"#e2e8f0",fontSize:11}}>•</span>
                  <Hash size={11} style={{color:"#94a3b8"}} />
                  <span style={{fontSize:12,color:"#64748b"}}>INN {customer.inn}</span>
                </>}
              </div>
            </div>
          </div>

          <div className="hist-stats">
            <div className="hstat-card hstat-blue">
              <div className="hstat-icon-wrap hstat-icon-blue"><ShoppingBag size={17} strokeWidth={2} /></div>
              <div>
                <div className="hstat-value" style={{color:"#2563eb"}}>{data.stats.totalOrders}</div>
                <div className="hstat-label">Jami buyurtma</div>
              </div>
            </div>
            <div className="hstat-card hstat-violet">
              <div className="hstat-icon-wrap hstat-icon-violet"><Banknote size={17} strokeWidth={2} /></div>
              <div>
                <div className="hstat-value" style={{color:"#7c3aed"}}>{formatPrice(data.stats.totalSpent)}</div>
                <div className="hstat-label">Jami sarflangan</div>
              </div>
            </div>
          </div>

          {data.sales.length === 0 ? (
            <div className="state-box-sm">
              <ShoppingBag size={36} strokeWidth={1} style={{color:"#e2e8f0"}} />
              <p style={{color:"#94a3b8",fontSize:14}}>Hali xarid amalga oshirilmagan</p>
            </div>
          ) : (
            <div className="sales-list">
              <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:"#94a3b8",marginBottom:6}}>
                So'nggi xaridlar
              </div>
              {data.sales.map(sale => (
                <div key={sale.id} className="sale-card">
                  <div
                    className="sale-card-header"
                    onClick={() => setOpenSale(openSale === sale.id ? null : sale.id)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === "Enter" && setOpenSale(openSale === sale.id ? null : sale.id)}
                  >
                    <div className="sale-meta">
                      <span className="sale-id">#{sale.id}</span>
                      <span className="sale-date"><Calendar size={11} />{formatDate(sale.createdAt)}</span>
                      <span className="sale-count-badge"><Package size={10} />{sale.items.length} mahsulot</span>
                    </div>
                    <div className="sale-right">
                      <span className="sale-total">{formatPrice(sale.totalPrice)}</span>
                      <span className={`sale-chevron${openSale === sale.id ? " open" : ""}`}>
                        <ChevronRight size={14} strokeWidth={2.5} />
                      </span>
                    </div>
                  </div>
                  {openSale === sale.id && (
                    <div className="sale-items">
                      <table className="items-table">
                        <thead>
                          <tr>
                            <th>Mahsulot</th><th>Seriya / Dozaj</th>
                            <th style={{textAlign:"center"}}>Miqdor</th>
                            <th style={{textAlign:"right"}}>Narx</th>
                            <th style={{textAlign:"right"}}>Jami</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sale.items.map(item => (
                            <tr key={item.id}>
                              <td className="item-name">{item.product.name}</td>
                              <td>
                                <span className="badge-series"><Tag size={9} />{item.batch.series}</span>
                                <span className="badge-mg"><FlaskConical size={9} />{item.batch.mg}</span>
                              </td>
                              <td style={{textAlign:"center"}}>
                                <span className="qty-pill">{item.quantity}</span>
                              </td>
                              <td className="mono" style={{textAlign:"right"}}>{formatPrice(item.price)}</td>
                              <td className="mono total-col" style={{textAlign:"right"}}>{formatPrice(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={4} style={{textAlign:"right",paddingRight:16,fontSize:12,color:"#64748b",paddingTop:10,paddingBottom:10,fontWeight:600}}>Jami:</td>
                            <td className="mono total-col" style={{textAlign:"right",borderTop:"1.5px solid #e2e8f0",paddingTop:10,paddingBottom:10}}>{formatPrice(sale.totalPrice)}</td>
                          </tr>
                        </tfoot>
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

// ─── Pagination ───────────────────────────────────────────
function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  return (
    <div className="pagination">
      <button className="page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={15} strokeWidth={2} />
      </button>
      {pages.map(p => (
        <button key={p} className={`page-btn${p === page ? " page-active" : ""}`} onClick={() => onPage(p)}>
          {p}
        </button>
      ))}
      <button className="page-btn" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
        <ChevronRight size={15} strokeWidth={2} />
      </button>
    </div>
  );
}

// ─── Customer Row ─────────────────────────────────────────
function CustomerRow({ customer, onEdit, onDelete, onHistory, idx }) {
  const [bg, color] = getAvatarColors(customer.name);
  return (
    <tr className="c-row" style={{"--row-delay": `${idx * 30}ms`}}>
      <td>
        <div className="c-avatar-cell">
          <div className="c-avatar" style={{background: bg, color}}>{customer.name.charAt(0).toUpperCase()}</div>
          <div>
            <div className="c-name">{customer.name}</div>
            {customer.inn
              ? <div className="c-inn"><Hash size={10} />INN: {customer.inn}</div>
              : <div className="c-inn" style={{color:"#cbd5e1"}}>INN kiritilmagan</div>
            }
          </div>
        </div>
      </td>
      <td>
        <a href={`tel:${customer.phone}`} className="c-phone">
          <Phone size={12} strokeWidth={2} />{customer.phone}
        </a>
      </td>
      <td style={{textAlign:"center"}}>
        {customer.salesCount > 0
          ? <span className="sales-badge">{customer.salesCount} ta xarid</span>
          : <span className="sales-badge sales-badge-empty">Xarid yo'q</span>
        }
      </td>
      <td style={{textAlign:"center"}}>
        <span className="c-date"><Calendar size={11} strokeWidth={2} />{formatDate(customer.createdAt)}</span>
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

// ─── Main ─────────────────────────────────────────────────
export const Customer=()=> {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [addModal,  setAddModal]  = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [histModal, setHistModal] = useState(null);
  const [delModal,  setDelModal]  = useState(null);
  const { toasts, add: addToast, remove: removeToast } = useToast();

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.phone||"").includes(search) || (c.inn||"").includes(search);
  });

  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = (data) => {
    setSaving(true);
    setTimeout(() => {
      const exists = customers.find(c => c.phone === data.phone);
      if (exists) { addToast(`"${data.phone}" allaqachon mavjud`, "error"); setSaving(false); return; }
      setCustomers(p => [{ id: ++mockIdCounter, ...data, salesCount: 0, createdAt: new Date().toISOString() }, ...p]);
      addToast("Yangi mijoz qo'shildi!");
      setAddModal(false);
      setSaving(false);
    }, 450);
  };

  const handleUpdate = (data) => {
    setSaving(true);
    setTimeout(() => {
      const exists = customers.find(c => c.phone === data.phone && c.id !== editModal.id);
      if (exists) { addToast(`"${data.phone}" boshqa mijozda mavjud`, "error"); setSaving(false); return; }
      setCustomers(p => p.map(c => c.id === editModal.id ? { ...c, ...data } : c));
      addToast("Mijoz ma'lumotlari yangilandi");
      setEditModal(null);
      setSaving(false);
    }, 450);
  };

  const handleDelete = () => {
    if (delModal.salesCount > 0) return;
    setDeleting(true);
    setTimeout(() => {
      setCustomers(p => p.filter(c => c.id !== delModal.id));
      addToast("Mijoz o'chirildi");
      setDelModal(null);
      setDeleting(false);
    }, 400);
  };

  const totalWithInn = customers.filter(c => c.inn).length;

  return (
    <>
      <style>{STYLES}</style>
      <Toast toasts={toasts} remove={removeToast} />

      <div className="page">
        {/* Header */}
        <div className="page-header">
          <div>
            <div className="page-eyebrow">Boshqaruv paneli</div>
            <h1 className="page-title"><Users size={22} strokeWidth={2.2} className="h1-icon" />Mijozlar</h1>
            <p className="subtitle">Barcha mijozlar, ularning xaridlari va ma'lumotlari</p>
          </div>
          <button className="btn-primary" onClick={() => setAddModal(true)}>
            <Plus size={15} strokeWidth={2.5} />Yangi mijoz
          </button>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card stat-blue">
            <div className="stat-icon-wrap stat-icon-blue"><Users size={18} strokeWidth={2} /></div>
            <div>
              <div className="stat-value">{customers.length}</div>
              <div className="stat-label">Jami mijozlar</div>
            </div>
          </div>
          <div className="stat-card stat-violet">
            <div className="stat-icon-wrap stat-icon-violet"><ShoppingBag size={18} strokeWidth={2} /></div>
            <div>
              <div className="stat-value">{customers.filter(c => c.salesCount > 0).length}</div>
              <div className="stat-label">Faol xaridorlar</div>
            </div>
          </div>
          <div className="stat-card stat-teal">
            <div className="stat-icon-wrap stat-icon-teal"><Hash size={18} strokeWidth={2} /></div>
            <div>
              <div className="stat-value">{totalWithInn}</div>
              <div className="stat-label">INN ro'yxatda</div>
            </div>
          </div>
          <div className="stat-card stat-amber">
            <div className="stat-icon-wrap stat-icon-amber"><Banknote size={18} strokeWidth={2} /></div>
            <div>
              <div className="stat-value">{customers.filter(c=>c.salesCount===0).length}</div>
              <div className="stat-label">Hali xarid yo'q</div>
            </div>
          </div>
        </div>

        {/* Search & toolbar */}
        <div className="toolbar">
          <div className="search-wrap">
            <Search size={15} className="search-icon" strokeWidth={2} />
            <input
              className="search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ism, telefon yoki INN bo'yicha qidiring…"
            />
            {search && <button className="clear-btn" onClick={() => setSearch("")}><X size={13} /></button>}
          </div>
          {search && (
            <div className="search-result-label">
              {filtered.length > 0 ? `${filtered.length} ta natija topildi` : "Hech narsa topilmadi"}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="table-card">
          {paginated.length === 0 ? (
            <div className="state-box">
              <Users size={44} strokeWidth={0.8} style={{color:"#e2e8f0"}} />
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:15,fontWeight:600,color:"#64748b",marginBottom:6}}>
                  {search ? `"${search}" bo'yicha hech narsa topilmadi` : "Mijozlar ro'yxati bo'sh"}
                </div>
                <div style={{fontSize:13,color:"#94a3b8"}}>
                  {search ? "Boshqa so'z bilan qidiring" : "Birinchi mijozni qo'shib boshlang"}
                </div>
              </div>
              {!search && (
                <button className="btn-primary" onClick={() => setAddModal(true)}>
                  <Plus size={14} />Mijoz qo'shish
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="main-table">
                <thead>
                  <tr>
                    <th>Mijoz</th>
                    <th>Telefon</th>
                    <th style={{textAlign:"center"}}>Xaridlar</th>
                    <th style={{textAlign:"center"}}>Qo'shilgan sana</th>
                    <th style={{textAlign:"right", paddingRight:20}}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((c, i) => (
                    <CustomerRow
                      key={c.id} customer={c} idx={i}
                      onEdit={setEditModal}
                      onDelete={setDelModal}
                      onHistory={setHistModal}
                    />
                  ))}
                </tbody>
              </table>
              <div className="table-footer">
                <div className="table-count">
                  Jami {filtered.length} ta mijoz
                  {filtered.length !== customers.length && ` (${customers.length} tadan filtrlangan)`}
                </div>
                <Pagination page={page} totalPages={totalPages} onPage={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {addModal && (
        <Modal title="Yangi mijoz qo'shish" subtitle="Majburiy maydonlarni to'ldiring" onClose={() => setAddModal(false)}>
          <CustomerForm onSave={handleCreate} onCancel={() => setAddModal(false)} saving={saving} />
        </Modal>
      )}

      {editModal && (
        <Modal title="Mijozni tahrirlash" subtitle={editModal.name} onClose={() => setEditModal(null)}>
          <CustomerForm initial={editModal} onSave={handleUpdate} onCancel={() => setEditModal(null)} saving={saving} />
        </Modal>
      )}

      {delModal && (
        <DeleteModal customer={delModal} onConfirm={handleDelete} onCancel={() => setDelModal(null)} deleting={deleting} />
      )}

      {histModal && <HistoryModal customer={histModal} onClose={() => setHistModal(null)} />}
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    padding: 32px 28px 48px;
    margin: 0 auto;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: #0f172a;
    background: #f6f8fc;
    min-height: 100vh;
  }


  /* Header */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .page-eyebrow {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #94a3b8;
    margin-bottom: 6px;
  }
  .page-title {
    font-size: 26px;
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 10px;
    letter-spacing: -0.5px;
    line-height: 1;
    margin-bottom: 4px;
  }
  .h1-icon { color: #2563eb; flex-shrink: 0; }
  .subtitle { color: #94a3b8; font-size: 13px; }

  /* Buttons */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #2563eb;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 11px 18px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(37,99,235,0.3), 0 0 0 1px rgba(37,99,235,0.12);
    font-family: inherit;
  }
  .btn-primary:hover:not(:disabled) { background: #1d4ed8; box-shadow: 0 4px 14px rgba(37,99,235,0.35); transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); }
  .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; box-shadow: none; transform: none; }

  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    color: #64748b;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    font-family: inherit;
  }
  .btn-ghost:hover { background: #f1f5f9; border-color: #cbd5e1; }

  .btn-danger {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #dc2626;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 11px 18px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    font-family: inherit;
  }
  .btn-danger:hover:not(:disabled) { background: #b91c1c; }
  .btn-danger:disabled { background: #fca5a5; cursor: not-allowed; }

  /* Stats */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .stat-card {
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    transition: box-shadow 0.15s;
  }
  .stat-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
  .stat-icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .stat-icon-blue   { background: #eff6ff; color: #2563eb; }
  .stat-icon-violet { background: #f5f3ff; color: #7c3aed; }
  .stat-icon-teal   { background: #f0fdfa; color: #0d9488; }
  .stat-icon-amber  { background: #fffbeb; color: #d97706; }
  .stat-value { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
  .stat-label { font-size: 12px; color: #94a3b8; margin-top: 3px; white-space: nowrap; }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }
  .search-wrap {
    flex: 1;
    min-width: 240px;
    display: flex;
    align-items: center;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 11px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .search-wrap:focus-within { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
  .search-icon { margin-left: 14px; color: #cbd5e1; flex-shrink: 0; }
  .search-input {
    flex: 1;
    border: none;
    outline: none;
    padding: 12px 10px;
    font-size: 14px;
    background: transparent;
    color: #0f172a;
    font-family: inherit;
  }
  .search-input::placeholder { color: #cbd5e1; }
  .clear-btn {
    background: none; border: none; cursor: pointer;
    color: #94a3b8; padding: 0 14px;
    display: flex; align-items: center;
  }
  .clear-btn:hover { color: #475569; }
  .search-result-label { font-size: 13px; color: #64748b; white-space: nowrap; }

  /* Table card */
  .table-card {
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
  }
  .state-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 72px 24px;
  }
  .main-table { width: 100%; border-collapse: collapse; }
  .main-table thead tr {
    background: #f8fafc;
    border-bottom: 1.5px solid #e2e8f0;
  }
  .main-table th {
    padding: 12px 18px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #94a3b8;
    text-align: left;
  }
  .c-row {
    border-bottom: 1px solid #f1f5f9;
    animation: fadeRow 0.25s ease both;
    animation-delay: var(--row-delay, 0ms);
  }
  @keyframes fadeRow {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .c-row:hover { background: #f8faff; }
  .c-row:last-child { border-bottom: none; }
  .c-row td { padding: 14px 18px; font-size: 14px; color: #334155; vertical-align: middle; }

  .c-avatar-cell { display: flex; align-items: center; gap: 12px; }
  .c-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    font-weight: 800;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    letter-spacing: -0.5px;
  }
  .c-name { font-weight: 700; color: #0f172a; font-size: 14px; }
  .c-inn { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .c-phone {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #2563eb;
    text-decoration: none;
    font-weight: 500;
    font-size: 13px;
    padding: 5px 10px;
    border-radius: 8px;
    background: #eff6ff;
    transition: background 0.15s;
  }
  .c-phone:hover { background: #dbeafe; }
  .c-date { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: #64748b; }
  .sales-badge {
    display: inline-flex;
    align-items: center;
    background: #f0fdf4;
    color: #16a34a;
    font-size: 12px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid #bbf7d0;
  }
  .sales-badge-empty {
    background: #f8fafc;
    color: #94a3b8;
    border-color: #e2e8f0;
  }

  /* Row actions */
  .row-actions { display: flex; gap: 6px; justify-content: flex-end; }
  .icon-btn {
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    width: 34px;
    height: 34px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    color: #94a3b8;
    flex-shrink: 0;
  }
  .icon-btn:hover { transform: translateY(-1px); }
  .icon-btn.hist:hover { background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
  .icon-btn.edit:hover { background: #fefce8; border-color: #fde68a; color: #b45309; }
  .icon-btn.del:hover  { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }

  /* Table footer */
  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
    border-top: 1.5px solid #f1f5f9;
    background: #fafbfc;
  }
  .table-count { font-size: 13px; color: #94a3b8; }

  /* Pagination */
  .pagination { display: flex; gap: 4px; align-items: center; }
  .page-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1.5px solid #e2e8f0;
    background: #fff;
    color: #475569;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    font-family: inherit;
  }
  .page-btn:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; }
  .page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .page-active { background: #2563eb !important; color: #fff !important; border-color: #2563eb !important; }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15,23,42,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    padding: 16px;
  }
  .modal-box {
    background: #fff;
    border-radius: 20px;
    width: 100%;
    max-width: 460px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.22);
    animation: popIn 0.18s cubic-bezier(0.34,1.56,0.64,1);
    overflow: hidden;
  }
  .modal-wide { max-width: 720px; }
  @keyframes popIn {
    from { opacity: 0; transform: scale(0.92) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 22px 24px 0;
    gap: 12px;
  }
  .modal-title { font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; }
  .modal-subtitle { font-size: 12px; color: #94a3b8; margin-top: 3px; }
  .modal-close {
    background: #f1f5f9; border: none;
    width: 30px; height: 30px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; color: #64748b;
    transition: background 0.15s;
    flex-shrink: 0;
  }
  .modal-close:hover { background: #e2e8f0; color: #0f172a; }

  /* Form */
  .form-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 16px; }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-label {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 700; color: #475569;
    letter-spacing: 0.04em; text-transform: uppercase;
  }
  .field-label svg { color: #94a3b8; }
  .req { color: #ef4444; }
  .field-hint { font-size: 11px; color: #94a3b8; }
  .field-error { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #dc2626; }
  .input {
    width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px;
    padding: 11px 13px; font-size: 14px; outline: none; color: #0f172a;
    background: #fff; transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }
  .input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
  .input::placeholder { color: #cbd5e1; }
  .input-err { border-color: #fca5a5 !important; }
  .input-err:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px #fee2e2 !important; }
  .form-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 4px; }

  /* Delete warning */
  .delete-warning {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 16px; border-radius: 12px; border: 1.5px solid;
  }
  .delete-warning-red   { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
  .delete-warning-amber { background: #fffbeb; border-color: #fde68a; color: #b45309; }
  .delete-warning-icon { flex-shrink: 0; margin-top: 1px; }
  .delete-warning strong { font-size: 14px; font-weight: 700; display: block; }

  /* History modal */
  .hist-body {
    padding: 20px 24px 24px;
    display: flex; flex-direction: column; gap: 16px;
    max-height: 78vh; overflow-y: auto;
  }
  .hist-customer-banner {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1.5px solid #e2e8f0;
  }
  .hist-avatar {
    width: 40px; height: 40px; border-radius: 10px;
    font-weight: 800; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .hist-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .hstat-card {
    border: 1.5px solid #e2e8f0; border-radius: 12px;
    padding: 14px 16px; display: flex; align-items: center; gap: 12px;
  }
  .hstat-icon-wrap { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .hstat-icon-blue   { background: #eff6ff; color: #2563eb; }
  .hstat-icon-violet { background: #f5f3ff; color: #7c3aed; }
  .hstat-value { font-size: 18px; font-weight: 800; line-height: 1; }
  .hstat-label { font-size: 11px; color: #94a3b8; margin-top: 3px; }
  .state-box-sm { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px 24px; }

  /* Sales */
  .sales-list { display: flex; flex-direction: column; gap: 8px; }
  .sale-card { border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; transition: border-color 0.15s; }
  .sale-card:hover { border-color: #bfdbfe; }
  .sale-card-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 13px 16px; cursor: pointer; transition: background 0.1s; outline: none;
  }
  .sale-card-header:hover  { background: #f8fafc; }
  .sale-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .sale-id { font-weight: 800; color: #7c3aed; font-size: 12px; background: #f5f3ff; padding: 3px 8px; border-radius: 6px; }
  .sale-date { display: inline-flex; align-items: center; gap: 4px; color: #64748b; font-size: 12px; }
  .sale-count-badge { display: inline-flex; align-items: center; gap: 4px; background: #f1f5f9; color: #64748b; font-size: 11px; padding: 3px 8px; border-radius: 20px; }
  .sale-right { display: flex; align-items: center; gap: 12px; }
  .sale-total { font-weight: 700; color: #0f172a; font-size: 14px; }
  .sale-chevron { color: #94a3b8; display: flex; align-items: center; transition: transform 0.2s, color 0.2s; }
  .sale-chevron.open { transform: rotate(90deg); color: #2563eb; }
  .sale-items { border-top: 1.5px solid #e2e8f0; background: #fafbff; }
  .items-table { width: 100%; border-collapse: collapse; }
  .items-table th {
    padding: 9px 16px; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em;
    color: #7c3aed; background: #eff6ff;
    text-align: left; border-bottom: 1px solid #dbeafe;
  }
  .items-table td {
    padding: 10px 16px; font-size: 13px; color: #334155;
    border-bottom: 1px solid #f1f5f9; vertical-align: middle;
  }
  .items-table tfoot td { background: #f8fafc; }
  .items-table tr:last-child td { border-bottom: none; }
  .items-table tbody tr:hover { background: #f0f7ff; }
  .item-name { font-weight: 600; color: #0f172a; }
  .badge-series {
    display: inline-flex; align-items: center; gap: 3px;
    background: #ede9fe; color: #6d28d9;
    font-family: 'JetBrains Mono','Fira Mono',monospace;
    font-size: 10px; padding: 2px 6px; border-radius: 5px; font-weight: 700; margin-right: 4px;
  }
  .badge-mg { display: inline-flex; align-items: center; gap: 3px; background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 6px; border-radius: 5px; }
  .qty-pill { display: inline-block; background: #f1f5f9; color: #334155; font-weight: 700; font-size: 13px; padding: 2px 10px; border-radius: 20px; }
  .mono { font-family: 'JetBrains Mono','Fira Mono',monospace; font-size: 12px; }
  .total-col { font-weight: 700; color: #0f172a; }

  /* Toast */
  .toast {
    padding: 13px 16px; border-radius: 13px; font-size: 14px; font-weight: 600;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.2); animation: slideUp 0.22s ease;
    max-width: 340px; min-width: 220px;
  }
  .toast-success { background: #0f172a; color: #fff; }
  .toast-error   { background: #dc2626; color: #fff; }
  .toast-icon { display: flex; align-items: center; flex-shrink: 0; }
  .toast-close { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.6); padding: 0; margin-left: auto; display: flex; align-items: center; }
  .toast-close:hover { color: #fff; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  .spin { animation: spinAnim 0.7s linear infinite; }
  @keyframes spinAnim { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .page { padding: 18px 14px 36px; }
    .stats-row { grid-template-columns: 1fr 1fr; }
    .hist-stats { grid-template-columns: 1fr; }
    .modal-box { border-radius: 16px; }
    .page-header { flex-direction: column; align-items: flex-start; }
    .main-table thead th:nth-child(3),
    .main-table tbody td:nth-child(3) { display: none; }
  }
  @media (max-width: 480px) {
    .stats-row { grid-template-columns: 1fr; }
    .main-table thead th:nth-child(4),
    .main-table tbody td:nth-child(4) { display: none; }
  }
`;