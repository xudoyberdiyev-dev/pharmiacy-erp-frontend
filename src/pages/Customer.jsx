import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, X, Plus, Pencil, Trash2, Phone, User,
  ClipboardList, CheckCircle, ShieldAlert, Loader2,
  Users, Hash, Calendar, ChevronRight, ShoppingBag,
  Banknote, Tag, FlaskConical, Package, ChevronLeft,
  ChevronDown, AlertTriangle,
} from "lucide-react";
import axios from "axios";

// ─── API SETUP ───────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data?.data ?? response.data,
  (error) => {
    if (!error.response) {
      return Promise.reject(new Error("Serverga ulanib bo'lmadi."));
    }
    const err = new Error(
      error.response.data?.message || `Xatolik yuz berdi (${error.response.status})`
    );
    err.status = error.response.status;
    return Promise.reject(err);
  }
);

const customersApi = {
  getAll: (params) => api.get("/customers", { params }),
  getOne: (id)     => api.get(`/customers/${id}`),
  create: (body)   => api.post("/customers", body),
  update: (id, body) => api.patch(`/customers/${id}`, body),
  remove: (id)     => api.delete(`/customers/${id}`),
};

// ─── Utility ─────────────────────────────────────────────
const PAGE_SIZE = 8;

const formatDate  = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";
const formatPrice = (p) => Number(p).toLocaleString("uz-UZ") + " so'm";

const avatarColors = [
  ["#e0edff","#1a56db"], ["#ede9fe","#6d28d9"], ["#d1fae5","#065f46"],
  ["#fef3c7","#92400e"], ["#fce7f3","#be185d"], ["#cffafe","#155e75"],
];
const getAvatarColors = (name) =>
  avatarColors[(name?.charCodeAt(0) || 0) % avatarColors.length];

// ─── Toast ────────────────────────────────────────────────
function Toast({ toasts, remove }) {
  return (
    <div style={{ position:"fixed", bottom:28, right:28, zIndex:2000, display:"flex", flexDirection:"column", gap:8 }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} role="alert">
          <span className="toast-icon">
            {t.type === "success"
              ? <CheckCircle size={16} strokeWidth={2.5} />
              : <ShieldAlert size={16} strokeWidth={2.5} />}
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
          value={name}
          onChange={e => { setName(e.target.value); setErrors(p => ({...p, name: ""})); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Masalan: Alisher Karimov"
        />
      </Field>
      <Field label="Telefon raqami" icon={Phone} required error={errors.phone} hint="Format: +998 90 123 45 67">
        <input
          className={`input${errors.phone ? " input-err" : ""}`}
          value={phone}
          onChange={e => { setPhone(e.target.value); setErrors(p => ({...p, phone: ""})); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="+998 90 000 00 00"
        />
      </Field>
      <Field label="INN" icon={Hash} error={errors.inn} hint="Ixtiyoriy — yuridik shaxslar uchun">
        <input
          className={`input${errors.inn ? " input-err" : ""}`}
          value={inn}
          onChange={e => { setInn(e.target.value); setErrors(p => ({...p, inn: ""})); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="123456789"
        />
      </Field>
      <div className="form-actions">
        <button className="btn-ghost" onClick={onCancel} type="button">Bekor qilish</button>
        <button className="btn-primary" onClick={submit} disabled={saving} type="button">
          {saving
            ? <><Loader2 size={14} className="spin" /> Saqlanmoqda…</>
            : <><CheckCircle size={14} />{initial.id ? "Saqlash" : "Qo'shish"}</>}
        </button>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────
function DeleteModal({ customer, onConfirm, onCancel, deleting }) {
  // salesCount backenddan _count.sales sifatida kelishi mumkin
  const salesCount = customer.salesCount ?? customer._count?.sales ?? 0;
  const hasSales = salesCount > 0;
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
                  <b>{customer.name}</b> mijozining <b>{salesCount} ta sotuvı</b> mavjud.
                  Sotuv tarixi bo'lgan mijozlarni o'chirish mumkin emas.
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
              {deleting
                ? <><Loader2 size={14} className="spin" />O'chirilmoqda…</>
                : <><Trash2 size={14} />O'chirish</>}
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
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState(null);
  const [openSale, setOpenSale] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    customersApi.getOne(customer.id)
      .then(res => {
        // Backend /customers/:id — sales + _count qaytaradi
        const sales = res.sales || [];
        const totalSpent = sales.reduce((sum, s) => sum + Number(s.totalPrice || 0), 0);
        setData({
          stats: {
            totalOrders: res._count?.sales ?? sales.length,
            totalSpent,
          },
          sales,
        });
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [customer.id]);

  const [bg, color] = getAvatarColors(customer.name);

  return (
    <Modal title="Xaridlar tarixi" subtitle={customer.name} onClose={onClose} wide>
      {loading ? (
        <div className="state-box" style={{padding:"60px 24px"}}>
          <Loader2 size={28} className="spin" style={{color:"#2563eb"}} />
          <p style={{color:"#94a3b8",fontSize:14}}>Yuklanmoqda…</p>
        </div>
      ) : error ? (
        <div className="state-box" style={{padding:"60px 24px"}}>
          <ShieldAlert size={36} style={{color:"#fca5a5"}} />
          <p style={{color:"#94a3b8",fontSize:14}}>{error}</p>
        </div>
      ) : (
        <div className="hist-body">
          {/* Customer banner */}
          <div className="hist-customer-banner">
            <div className="hist-avatar" style={{background:bg, color}}>
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{fontWeight:700, fontSize:15, color:"#0f172a"}}>{customer.name}</div>
              <div style={{display:"flex", alignItems:"center", gap:6, marginTop:3}}>
                <Phone size={11} style={{color:"#94a3b8"}} />
                <span style={{fontSize:12, color:"#64748b"}}>{customer.phone}</span>
                {customer.inn && <>
                  <span style={{color:"#e2e8f0", fontSize:11}}>•</span>
                  <Hash size={11} style={{color:"#94a3b8"}} />
                  <span style={{fontSize:12, color:"#64748b"}}>INN {customer.inn}</span>
                </>}
              </div>
            </div>
          </div>

          {/* Stats */}
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

          {/* Sales list */}
          {data.sales.length === 0 ? (
            <div className="state-box-sm">
              <ShoppingBag size={36} strokeWidth={1} style={{color:"#e2e8f0"}} />
              <p style={{color:"#94a3b8", fontSize:14}}>Hali xarid amalga oshirilmagan</p>
            </div>
          ) : (
            <div className="sales-list">
              <div style={{fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"#94a3b8", marginBottom:6}}>
                So'nggi xaridlar
              </div>
              {data.sales.map(sale => {
                const itemCount = sale._count?.items ?? sale.items?.length ?? 0;
                return (
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
                        <span className="sale-count-badge"><Package size={10} />{itemCount} mahsulot</span>
                      </div>
                      <div className="sale-right">
                        <span className="sale-total">{formatPrice(sale.totalPrice)}</span>
                        <span className={`sale-chevron${openSale === sale.id ? " open" : ""}`}>
                          <ChevronRight size={14} strokeWidth={2.5} />
                        </span>
                      </div>
                    </div>
                    {/* Expand: items mavjud bo'lsa ko'rsatiladi */}
                    {openSale === sale.id && sale.items && (
                      <div className="sale-items">
                        <table className="items-table">
                          <thead>
                            <tr>
                              <th>Mahsulot</th>
                              <th>Seriya / Dozaj</th>
                              <th style={{textAlign:"center"}}>Miqdor</th>
                              <th style={{textAlign:"right"}}>Narx</th>
                              <th style={{textAlign:"right"}}>Jami</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sale.items.map(item => (
                              <tr key={item.id}>
                                <td className="item-name">{item.product?.name}</td>
                                <td>
                                  <span className="badge-series"><Tag size={9} />{item.batch?.series}</span>
                                  <span className="badge-mg"><FlaskConical size={9} />{item.batch?.mg}</span>
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
                              <td colSpan={4} style={{textAlign:"right", paddingRight:16, fontSize:12, color:"#64748b", paddingTop:10, paddingBottom:10, fontWeight:600}}>Jami:</td>
                              <td className="mono total-col" style={{textAlign:"right", borderTop:"1.5px solid #e2e8f0", paddingTop:10, paddingBottom:10}}>{formatPrice(sale.totalPrice)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
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
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
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
  const salesCount = customer._count?.sales ?? customer.salesCount ?? 0;
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
        {salesCount > 0
          ? <span className="sales-badge">{salesCount} ta xarid</span>
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
export const Customer = () => {
  // ── State ──
  const [customers,  setCustomers]  = useState([]);
  const [meta,       setMeta]       = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search,     setSearch]     = useState("");
  const [page,       setPage]       = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [addModal,   setAddModal]   = useState(false);
  const [editModal,  setEditModal]  = useState(null);
  const [histModal,  setHistModal]  = useState(null);
  const [delModal,   setDelModal]   = useState(null);
  const { toasts, add: addToast, remove: removeToast } = useToast();

  // ── Debounced search ──
  const debounceRef = useRef(null);
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
    }, 350);
  };

  // ── Fetch customers ──
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      const res = await customersApi.getAll(params);
      // Backend: { items, meta } yoki to'g'ridan-to'g'ri array
      if (Array.isArray(res)) {
        setCustomers(res);
        setMeta({ total: res.length, page: 1, limit: PAGE_SIZE, totalPages: Math.ceil(res.length / PAGE_SIZE) });
      } else {
        setCustomers(res.items || []);
        setMeta(res.meta || { total: 0, page, limit: PAGE_SIZE, totalPages: 1 });
      }
    } catch (e) {
      setFetchError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // ── Stats (clientda hisoblanadi joriy sahifadan emas, metadan) ──
  // Agar backend umumiy statistika bermasa, ular sahifaga nisbatan ko'rsatiladi
  const totalWithInn   = customers.filter(c => c.inn).length;
  const activeCustomers = customers.filter(c => (c._count?.sales ?? c.salesCount ?? 0) > 0).length;
  const noSales        = customers.filter(c => (c._count?.sales ?? c.salesCount ?? 0) === 0).length;

  // ── Create ──
  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await customersApi.create(data);
      addToast("Yangi mijoz qo'shildi!");
      setAddModal(false);
      setPage(1);
      await fetchCustomers();
    } catch (e) {
      addToast(e.message || "Xatolik yuz berdi", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Update ──
  const handleUpdate = async (data) => {
    setSaving(true);
    try {
      await customersApi.update(editModal.id, data);
      addToast("Mijoz ma'lumotlari yangilandi");
      setEditModal(null);
      await fetchCustomers();
    } catch (e) {
      addToast(e.message || "Xatolik yuz berdi", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    const salesCount = delModal._count?.sales ?? delModal.salesCount ?? 0;
    if (salesCount > 0) return;
    setDeleting(true);
    try {
      await customersApi.remove(delModal.id);
      addToast("Mijoz o'chirildi");
      setDelModal(null);
      // Agar sahifada yagona yozuv o'chirilsa, oldingi sahifaga qayting
      if (customers.length === 1 && page > 1) setPage(p => p - 1);
      else await fetchCustomers();
    } catch (e) {
      addToast(e.message || "Xatolik yuz berdi", "error");
    } finally {
      setDeleting(false);
    }
  };

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
              <div className="stat-value">{meta.total}</div>
              <div className="stat-label">Jami mijozlar</div>
            </div>
          </div>
          <div className="stat-card stat-violet">
            <div className="stat-icon-wrap stat-icon-violet"><ShoppingBag size={18} strokeWidth={2} /></div>
            <div>
              <div className="stat-value">{activeCustomers}</div>
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
              <div className="stat-value">{noSales}</div>
              <div className="stat-label">Hali xarid yo'q</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="toolbar">
          <div className="search-wrap">
            <Search size={15} className="search-icon" strokeWidth={2} />
            <input
              className="search-input"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Ism, telefon yoki INN bo'yicha qidiring…"
            />
            {search && (
              <button className="clear-btn" onClick={() => { setSearch(""); setPage(1); }}>
                <X size={13} />
              </button>
            )}
          </div>
          {search && !loading && (
            <div className="search-result-label">
              {meta.total > 0 ? `${meta.total} ta natija topildi` : "Hech narsa topilmadi"}
            </div>
          )}
          {loading && <Loader2 size={16} className="spin" style={{color:"#2563eb"}} />}
        </div>

        {/* Table */}
        <div className="table-card">
          {fetchError ? (
            <div className="state-box">
              <ShieldAlert size={44} strokeWidth={0.8} style={{color:"#fca5a5"}} />
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:15, fontWeight:600, color:"#64748b", marginBottom:6}}>
                  Serverga ulanib bo'lmadi
                </div>
                <div style={{fontSize:13, color:"#94a3b8"}}>{fetchError}</div>
              </div>
              <button className="btn-primary" onClick={fetchCustomers}>
                Qayta urinish
              </button>
            </div>
          ) : loading && customers.length === 0 ? (
            <div className="state-box">
              <Loader2 size={44} className="spin" style={{color:"#2563eb", opacity:0.3}} />
            </div>
          ) : customers.length === 0 ? (
            <div className="state-box">
              <Users size={44} strokeWidth={0.8} style={{color:"#e2e8f0"}} />
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:15, fontWeight:600, color:"#64748b", marginBottom:6}}>
                  {search ? `"${search}" bo'yicha hech narsa topilmadi` : "Mijozlar ro'yxati bo'sh"}
                </div>
                <div style={{fontSize:13, color:"#94a3b8"}}>
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
                  {customers.map((c, i) => (
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
                  Jami {meta.total} ta mijoz
                  {search && ` (filtrlangan)`}
                </div>
                <Pagination page={meta.page} totalPages={meta.totalPages} onPage={setPage} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
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
      {histModal && (
        <HistoryModal customer={histModal} onClose={() => setHistModal(null)} />
      )}
    </>
  );
};

// ─── Styles (o'zgarishsiz) ───────────────────────────────
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .page { padding:32px 28px 48px; margin:0 auto; font-family:'Inter',system-ui,-apple-system,sans-serif; color:#0f172a; background:#f6f8fc; min-height:100vh; }
  .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; gap:16px; flex-wrap:wrap; }
  .page-eyebrow { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:#94a3b8; margin-bottom:6px; }
  .page-title { font-size:26px; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:10px; letter-spacing:-0.5px; line-height:1; margin-bottom:4px; }
  .h1-icon { color:#2563eb; flex-shrink:0; }
  .subtitle { color:#94a3b8; font-size:13px; }
  .btn-primary { display:inline-flex; align-items:center; gap:7px; background:#2563eb; color:#fff; border:none; border-radius:10px; padding:11px 18px; font-size:14px; font-weight:600; cursor:pointer; transition:background 0.15s,box-shadow 0.15s,transform 0.1s; white-space:nowrap; box-shadow:0 1px 3px rgba(37,99,235,0.3),0 0 0 1px rgba(37,99,235,0.12); font-family:inherit; }
  .btn-primary:hover:not(:disabled) { background:#1d4ed8; box-shadow:0 4px 14px rgba(37,99,235,0.35); transform:translateY(-1px); }
  .btn-primary:active { transform:translateY(0); }
  .btn-primary:disabled { background:#93c5fd; cursor:not-allowed; box-shadow:none; transform:none; }
  .btn-ghost { display:inline-flex; align-items:center; gap:6px; background:transparent; color:#64748b; border:1.5px solid #e2e8f0; border-radius:10px; padding:10px 16px; font-size:14px; font-weight:500; cursor:pointer; transition:background 0.15s,border-color 0.15s; font-family:inherit; }
  .btn-ghost:hover { background:#f1f5f9; border-color:#cbd5e1; }
  .btn-danger { display:inline-flex; align-items:center; gap:7px; background:#dc2626; color:#fff; border:none; border-radius:10px; padding:11px 18px; font-size:14px; font-weight:600; cursor:pointer; transition:background 0.15s; font-family:inherit; }
  .btn-danger:hover:not(:disabled) { background:#b91c1c; }
  .btn-danger:disabled { background:#fca5a5; cursor:not-allowed; }
  .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
  .stat-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:14px; padding:16px 18px; display:flex; align-items:center; gap:14px; transition:box-shadow 0.15s; }
  .stat-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.06); }
  .stat-icon-wrap { width:42px; height:42px; border-radius:11px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .stat-icon-blue { background:#eff6ff; color:#2563eb; } .stat-icon-violet { background:#f5f3ff; color:#7c3aed; } .stat-icon-teal { background:#f0fdfa; color:#0d9488; } .stat-icon-amber { background:#fffbeb; color:#d97706; }
  .stat-value { font-size:22px; font-weight:800; color:#0f172a; line-height:1; }
  .stat-label { font-size:12px; color:#94a3b8; margin-top:3px; white-space:nowrap; }
  .toolbar { display:flex; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap; }
  .search-wrap { flex:1; min-width:240px; display:flex; align-items:center; background:#fff; border:1.5px solid #e2e8f0; border-radius:11px; transition:border-color 0.15s,box-shadow 0.15s; }
  .search-wrap:focus-within { border-color:#2563eb; box-shadow:0 0 0 3px #dbeafe; }
  .search-icon { margin-left:14px; color:#cbd5e1; flex-shrink:0; }
  .search-input { flex:1; border:none; outline:none; padding:12px 10px; font-size:14px; background:transparent; color:#0f172a; font-family:inherit; }
  .search-input::placeholder { color:#cbd5e1; }
  .clear-btn { background:none; border:none; cursor:pointer; color:#94a3b8; padding:0 14px; display:flex; align-items:center; }
  .clear-btn:hover { color:#475569; }
  .search-result-label { font-size:13px; color:#64748b; white-space:nowrap; }
  .table-card { background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; overflow:hidden; }
  .state-box { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px; padding:72px 24px; }
  .main-table { width:100%; border-collapse:collapse; }
  .main-table thead tr { background:#f8fafc; border-bottom:1.5px solid #e2e8f0; }
  .main-table th { padding:12px 18px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.07em; color:#94a3b8; text-align:left; }
  .c-row { border-bottom:1px solid #f1f5f9; animation:fadeRow 0.25s ease both; animation-delay:var(--row-delay,0ms); }
  @keyframes fadeRow { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  .c-row:hover { background:#f8faff; }
  .c-row:last-child { border-bottom:none; }
  .c-row td { padding:14px 18px; font-size:14px; color:#334155; vertical-align:middle; }
  .c-avatar-cell { display:flex; align-items:center; gap:12px; }
  .c-avatar { width:36px; height:36px; border-radius:10px; font-weight:800; font-size:14px; display:flex; align-items:center; justify-content:center; flex-shrink:0; letter-spacing:-0.5px; }
  .c-name { font-weight:700; color:#0f172a; font-size:14px; }
  .c-inn { display:inline-flex; align-items:center; gap:3px; font-size:11px; color:#94a3b8; margin-top:2px; }
  .c-phone { display:inline-flex; align-items:center; gap:6px; color:#2563eb; text-decoration:none; font-weight:500; font-size:13px; padding:5px 10px; border-radius:8px; background:#eff6ff; transition:background 0.15s; }
  .c-phone:hover { background:#dbeafe; }
  .c-date { display:inline-flex; align-items:center; gap:5px; font-size:12px; color:#64748b; }
  .sales-badge { display:inline-flex; align-items:center; background:#f0fdf4; color:#16a34a; font-size:12px; font-weight:600; padding:4px 10px; border-radius:20px; border:1px solid #bbf7d0; }
  .sales-badge-empty { background:#f8fafc; color:#94a3b8; border-color:#e2e8f0; }
  .row-actions { display:flex; gap:6px; justify-content:flex-end; }
  .icon-btn { background:#fff; border:1.5px solid #e2e8f0; border-radius:8px; width:34px; height:34px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; color:#94a3b8; flex-shrink:0; }
  .icon-btn:hover { transform:translateY(-1px); }
  .icon-btn.hist:hover { background:#eff6ff; border-color:#93c5fd; color:#2563eb; }
  .icon-btn.edit:hover { background:#fefce8; border-color:#fde68a; color:#b45309; }
  .icon-btn.del:hover  { background:#fef2f2; border-color:#fca5a5; color:#dc2626; }
  .table-footer { display:flex; justify-content:space-between; align-items:center; padding:14px 20px; border-top:1.5px solid #f1f5f9; background:#fafbfc; }
  .table-count { font-size:13px; color:#94a3b8; }
  .pagination { display:flex; gap:4px; align-items:center; }
  .page-btn { width:32px; height:32px; border-radius:8px; border:1.5px solid #e2e8f0; background:#fff; color:#475569; cursor:pointer; font-size:13px; font-weight:600; display:flex; align-items:center; justify-content:center; transition:all 0.15s; font-family:inherit; }
  .page-btn:hover:not(:disabled) { background:#f1f5f9; border-color:#cbd5e1; }
  .page-btn:disabled { opacity:0.35; cursor:not-allowed; }
  .page-active { background:#2563eb !important; color:#fff !important; border-color:#2563eb !important; }
  .modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(4px); padding:16px; }
  .modal-box { background:#fff; border-radius:20px; width:100%; max-width:460px; box-shadow:0 32px 80px rgba(0,0,0,0.22); animation:popIn 0.18s cubic-bezier(0.34,1.56,0.64,1); overflow:hidden; }
  .modal-wide { max-width:720px; }
  @keyframes popIn { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
  .modal-header { display:flex; justify-content:space-between; align-items:flex-start; padding:22px 24px 0; gap:12px; }
  .modal-title { font-size:16px; font-weight:800; color:#0f172a; letter-spacing:-0.2px; }
  .modal-subtitle { font-size:12px; color:#94a3b8; margin-top:3px; }
  .modal-close { background:#f1f5f9; border:none; width:30px; height:30px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748b; transition:background 0.15s; flex-shrink:0; }
  .modal-close:hover { background:#e2e8f0; color:#0f172a; }
  .form-body { padding:20px 24px 24px; display:flex; flex-direction:column; gap:16px; }
  .field { display:flex; flex-direction:column; gap:6px; }
  .field-label { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:700; color:#475569; letter-spacing:0.04em; text-transform:uppercase; }
  .field-label svg { color:#94a3b8; }
  .req { color:#ef4444; }
  .field-hint { font-size:11px; color:#94a3b8; }
  .field-error { display:inline-flex; align-items:center; gap:4px; font-size:12px; color:#dc2626; }
  .input { width:100%; border:1.5px solid #e2e8f0; border-radius:10px; padding:11px 13px; font-size:14px; outline:none; color:#0f172a; background:#fff; transition:border-color 0.15s,box-shadow 0.15s; font-family:inherit; }
  .input:focus { border-color:#2563eb; box-shadow:0 0 0 3px #dbeafe; }
  .input::placeholder { color:#cbd5e1; }
  .input-err { border-color:#fca5a5 !important; }
  .input-err:focus { border-color:#ef4444 !important; box-shadow:0 0 0 3px #fee2e2 !important; }
  .form-actions { display:flex; gap:10px; justify-content:flex-end; padding-top:4px; }
  .delete-warning { display:flex; align-items:flex-start; gap:14px; padding:16px; border-radius:12px; border:1.5px solid; }
  .delete-warning-red   { background:#fef2f2; border-color:#fecaca; color:#dc2626; }
  .delete-warning-amber { background:#fffbeb; border-color:#fde68a; color:#b45309; }
  .delete-warning-icon { flex-shrink:0; margin-top:1px; }
  .delete-warning strong { font-size:14px; font-weight:700; display:block; }
  .hist-body { padding:20px 24px 24px; display:flex; flex-direction:column; gap:16px; max-height:78vh; overflow-y:auto; }
  .hist-customer-banner { display:flex; align-items:center; gap:12px; padding:14px 16px; background:#f8fafc; border-radius:12px; border:1.5px solid #e2e8f0; }
  .hist-avatar { width:40px; height:40px; border-radius:10px; font-weight:800; font-size:16px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .hist-stats { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .hstat-card { border:1.5px solid #e2e8f0; border-radius:12px; padding:14px 16px; display:flex; align-items:center; gap:12px; }
  .hstat-icon-wrap { width:38px; height:38px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .hstat-icon-blue { background:#eff6ff; color:#2563eb; } .hstat-icon-violet { background:#f5f3ff; color:#7c3aed; }
  .hstat-value { font-size:18px; font-weight:800; line-height:1; }
  .hstat-label { font-size:11px; color:#94a3b8; margin-top:3px; }
  .state-box-sm { display:flex; flex-direction:column; align-items:center; gap:10px; padding:32px 24px; }
  .sales-list { display:flex; flex-direction:column; gap:8px; }
  .sale-card { border:1.5px solid #e2e8f0; border-radius:12px; overflow:hidden; transition:border-color 0.15s; }
  .sale-card:hover { border-color:#bfdbfe; }
  .sale-card-header { display:flex; justify-content:space-between; align-items:center; padding:13px 16px; cursor:pointer; transition:background 0.1s; outline:none; }
  .sale-card-header:hover { background:#f8fafc; }
  .sale-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .sale-id { font-weight:800; color:#7c3aed; font-size:12px; background:#f5f3ff; padding:3px 8px; border-radius:6px; }
  .sale-date { display:inline-flex; align-items:center; gap:4px; color:#64748b; font-size:12px; }
  .sale-count-badge { display:inline-flex; align-items:center; gap:4px; background:#f1f5f9; color:#64748b; font-size:11px; padding:3px 8px; border-radius:20px; }
  .sale-right { display:flex; align-items:center; gap:12px; }
  .sale-total { font-weight:700; color:#0f172a; font-size:14px; }
  .sale-chevron { color:#94a3b8; display:flex; align-items:center; transition:transform 0.2s,color 0.2s; }
  .sale-chevron.open { transform:rotate(90deg); color:#2563eb; }
  .sale-items { border-top:1.5px solid #e2e8f0; background:#fafbff; }
  .items-table { width:100%; border-collapse:collapse; }
  .items-table th { padding:9px 16px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#7c3aed; background:#eff6ff; text-align:left; border-bottom:1px solid #dbeafe; }
  .items-table td { padding:10px 16px; font-size:13px; color:#334155; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
  .items-table tfoot td { background:#f8fafc; }
  .items-table tr:last-child td { border-bottom:none; }
  .items-table tbody tr:hover { background:#f0f7ff; }
  .item-name { font-weight:600; color:#0f172a; }
  .badge-series { display:inline-flex; align-items:center; gap:3px; background:#ede9fe; color:#6d28d9; font-family:'JetBrains Mono','Fira Mono',monospace; font-size:10px; padding:2px 6px; border-radius:5px; font-weight:700; margin-right:4px; }
  .badge-mg { display:inline-flex; align-items:center; gap:3px; background:#f1f5f9; color:#475569; font-size:11px; padding:2px 6px; border-radius:5px; }
  .qty-pill { display:inline-block; background:#f1f5f9; color:#334155; font-weight:700; font-size:13px; padding:2px 10px; border-radius:20px; }
  .mono { font-family:'JetBrains Mono','Fira Mono',monospace; font-size:12px; }
  .total-col { font-weight:700; color:#0f172a; }
  .toast { padding:13px 16px; border-radius:13px; font-size:14px; font-weight:600; display:flex; align-items:center; gap:10px; box-shadow:0 12px 40px rgba(0,0,0,0.2); animation:slideUp 0.22s ease; max-width:340px; min-width:220px; }
  .toast-success { background:#0f172a; color:#fff; }
  .toast-error   { background:#dc2626; color:#fff; }
  .toast-icon { display:flex; align-items:center; flex-shrink:0; }
  .toast-close { background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.6); padding:0; margin-left:auto; display:flex; align-items:center; }
  .toast-close:hover { color:#fff; }
  @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .spin { animation:spinAnim 0.7s linear infinite; }
  @keyframes spinAnim { to{transform:rotate(360deg)} }
  @media (max-width:768px) {
    .page { padding:18px 14px 36px; }
    .stats-row { grid-template-columns:1fr 1fr; }
    .hist-stats { grid-template-columns:1fr; }
    .modal-box { border-radius:16px; }
    .page-header { flex-direction:column; align-items:flex-start; }
    .main-table thead th:nth-child(3), .main-table tbody td:nth-child(3) { display:none; }
  }
  @media (max-width:480px) {
    .stats-row { grid-template-columns:1fr; }
    .main-table thead th:nth-child(4), .main-table tbody td:nth-child(4) { display:none; }
  }
`;