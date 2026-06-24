import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, X, Plus, Pencil, Trash2, Phone, Shield,
  QrCode, CheckCircle, ShieldAlert, Loader2, Power,
  Users, UserCheck, UserX, RefreshCw, Download,
  AlertTriangle, ChevronLeft, ChevronRight,
  Eye, EyeOff, Filter, Calendar,
} from "lucide-react";
import axios from "axios";

// ─── API SETUP ───────────────────────────────────────────────
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
  (res) => res.data?.data ?? res.data,
  (error) => {
    if (!error.response)
      return Promise.reject(new Error("Serverga ulanib bo'lmadi."));
    const err = new Error(
      error.response.data?.message || `Xatolik yuz berdi (${error.response.status})`
    );
    err.status = error.response.status;
    return Promise.reject(err);
  }
);

const employeesApi = {
  getAll:       (params)     => api.get("/employees", { params }),
  getOne:       (id)         => api.get(`/employees/${id}`),
  create:       (body)       => api.post("/employees", body),
  update:       (id, body)   => api.patch(`/employees/${id}`, body),
  toggleActive: (id)         => api.patch(`/employees/${id}/toggle-active`),
  getQr:        (id)         => api.get(`/employees/${id}/qr`),
  regenerateQr: (id)         => api.post(`/employees/${id}/qr/regenerate`),
  remove:       (id)         => api.delete(`/employees/${id}`),
};

// ─── Utility ─────────────────────────────────────────────────
const PAGE_SIZE  = 7;
const formatDate = (d) => d ? new Date(d).toLocaleDateString("uz-UZ") : "—";

const avatarPalette = [
  ["#dbeafe","#1e40af"], ["#ede9fe","#5b21b6"], ["#d1fae5","#065f46"],
  ["#fce7f3","#9d174d"], ["#fef3c7","#78350f"], ["#cffafe","#164e63"],
  ["#fee2e2","#991b1b"], ["#ecfccb","#365314"],
];
const avatarColor = (name = "") =>
  avatarPalette[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % avatarPalette.length];

// ─── Toast ───────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = (msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3600);
  };
  const remove = (id) => setToasts(p => p.filter(t => t.id !== id));
  return { toasts, add, remove };
}

function ToastStack({ toasts, remove }) {
  return (
    <div style={{ position:"fixed", bottom:28, right:28, zIndex:3000, display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
      {toasts.map(t => (
        <div key={t.id} className={`e-toast e-toast-${t.type}`}>
          {t.type === "success"
            ? <CheckCircle size={15} strokeWidth={2.5}/>
            : <ShieldAlert size={15} strokeWidth={2.5}/>}
          <span>{t.msg}</span>
          <button onClick={() => remove(t.id)}><X size={12}/></button>
        </div>
      ))}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────
function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const fn = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  return (
    <div className="e-overlay" onClick={onClose}>
      <div className="e-modal e-modal-md" onClick={e => e.stopPropagation()}>
        <div className="e-modal-hdr">
          <div>
            <div className="e-modal-title">{title}</div>
            {subtitle && <div className="e-modal-subtitle">{subtitle}</div>}
          </div>
          <button className="e-modal-x" onClick={onClose}><X size={15}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Field ───────────────────────────────────────────────────
function Field({ label, error, hint, children, required }) {
  return (
    <div className="e-field">
      <label className="e-label">{label}{required && <span style={{color:"#ef4444"}}>*</span>}</label>
      {children}
      {error && <span className="e-field-err"><AlertTriangle size={11}/>{error}</span>}
      {hint && !error && <span className="e-field-hint">{hint}</span>}
    </div>
  );
}

// ─── Employee Form ────────────────────────────────────────────
function EmployeeForm({ initial = {}, onSave, onCancel, saving }) {
  const [firstName, setFirstName] = useState(initial.firstName || "");
  const [lastName,  setLastName]  = useState(initial.lastName  || "");
  const [phone,     setPhone]     = useState(initial.phone     || "");
  const [role,      setRole]      = useState(initial.role      || "EMPLOYEE");
  const [isActive,  setIsActive]  = useState(initial.isActive  !== undefined ? initial.isActive : true);
  const [errors,    setErrors]    = useState({});
  const firstRef = useRef();
  useEffect(() => { firstRef.current?.focus(); }, []);

  const validate = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = "Ism kiritilishi shart";
    if (!lastName.trim())  e.lastName  = "Familiya kiritilishi shart";
    if (phone && !/^\+998/.test(phone.trim())) e.phone = "+998 bilan boshlang";
    return e;
  };

  const submit = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      phone:     phone.trim() || null,
      role,
      ...(initial.id ? { isActive } : {}),
    });
  };

  return (
    <div className="e-form-body">
      <div className="e-form-row2">
        <Field label="Ism" required error={errors.firstName}>
          <input ref={firstRef}
            className={`e-input${errors.firstName ? " e-input-err" : ""}`}
            value={firstName}
            onChange={e => { setFirstName(e.target.value); setErrors(p => ({...p, firstName:""})); }}
            placeholder="Aziz"
            onKeyDown={e => e.key === "Enter" && submit()} />
        </Field>
        <Field label="Familiya" required error={errors.lastName}>
          <input
            className={`e-input${errors.lastName ? " e-input-err" : ""}`}
            value={lastName}
            onChange={e => { setLastName(e.target.value); setErrors(p => ({...p, lastName:""})); }}
            placeholder="Karimov"
            onKeyDown={e => e.key === "Enter" && submit()} />
        </Field>
      </div>

      <Field label="Telefon raqami" error={errors.phone} hint="Ixtiyoriy — format: +998 90 000 00 00">
        <input
          className={`e-input${errors.phone ? " e-input-err" : ""}`}
          value={phone}
          onChange={e => { setPhone(e.target.value); setErrors(p => ({...p, phone:""})); }}
          placeholder="+998 90 000 00 00"
          onKeyDown={e => e.key === "Enter" && submit()} />
      </Field>

      <Field label="Lavozim (rol)">
        <div className="e-role-row">
          <button type="button"
            className={`e-role-btn${role === "EMPLOYEE" ? " e-role-active" : ""}`}
            onClick={() => setRole("EMPLOYEE")}>
            <UserCheck size={14} strokeWidth={2}/> Xodim
          </button>
          <button type="button"
            className={`e-role-btn${role === "ADMIN" ? " e-role-active e-role-admin" : ""}`}
            onClick={() => setRole("ADMIN")}>
            <Shield size={14} strokeWidth={2}/> Admin
          </button>
        </div>
      </Field>

      {initial.id && (
        <Field label="Holat">
          <div className="e-toggle-row" onClick={() => setIsActive(p => !p)}>
            <div className={`e-toggle${isActive ? " e-toggle-on" : ""}`}>
              <div className="e-toggle-thumb"/>
            </div>
            <span style={{fontSize:13, color: isActive ? "#16a34a" : "#94a3b8", fontWeight:600}}>
              {isActive ? "Faol" : "Nofaol"}
            </span>
          </div>
        </Field>
      )}

      <div className="e-form-actions">
        <button className="e-btn-ghost" onClick={onCancel} type="button">Bekor qilish</button>
        <button className="e-btn-primary" onClick={submit} disabled={saving} type="button">
          {saving
            ? <><Loader2 size={14} className="e-spin"/>Saqlanmoqda…</>
            : <><CheckCircle size={14}/>{initial.id ? "Saqlash" : "Qo'shish"}</>}
        </button>
      </div>
    </div>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────
function DeleteModal({ emp, onConfirm, onCancel, deleting }) {
  const [bg, cl] = avatarColor(emp.firstName);
  return (
    <Modal title="Hodimni o'chirish" onClose={onCancel}>
      <div className="e-form-body">
        <div className="e-emp-mini">
          <div className="e-avatar" style={{background:bg, color:cl, width:44, height:44, fontSize:16}}>
            {emp.firstName[0]}{emp.lastName[0]}
          </div>
          <div>
            <div style={{fontWeight:700, fontSize:14, color:"#0f172a"}}>{emp.firstName} {emp.lastName}</div>
            <div style={{fontSize:12, color:"#94a3b8", marginTop:2}}>{emp.phone || "Telefon yo'q"}</div>
          </div>
        </div>
        <div className="e-warn e-warn-red">
          <AlertTriangle size={18} strokeWidth={2}/>
          <div>
            <strong>Bu amalni orqaga qaytarib bo'lmaydi.</strong>
            <p style={{marginTop:4, fontSize:13, lineHeight:1.55}}>
              Hodim butunlay o'chiriladi. QR token va barcha ma'lumotlar yo'q bo'ladi.
            </p>
          </div>
        </div>
        <div className="e-form-actions">
          <button className="e-btn-ghost" onClick={onCancel}>Bekor qilish</button>
          <button className="e-btn-danger" onClick={onConfirm} disabled={deleting}>
            {deleting
              ? <><Loader2 size={14} className="e-spin"/>O'chirilmoqda…</>
              : <><Trash2 size={14}/>O'chirish</>}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── QR Modal ────────────────────────────────────────────────
// Backend { employee, qr: { svg, base64, url, token } } formatida qaytaradi
function QrModal({ emp, onClose, onRegenerated }) {
  const [loading,      setLoading]      = useState(true);
  const [qrData,       setQrData]       = useState(null); // { svg, base64, url, token }
  const [empData,      setEmpData]      = useState(emp);
  const [regenerating, setRegenerating] = useState(false);
  const [showToken,    setShowToken]    = useState(false);
  const [error,        setError]        = useState(null);
  const [bg, cl] = avatarColor(emp.firstName);

  // QR ni backenddan yuklab olish
  const loadQr = useCallback(async (id) => {
  setLoading(true);
  setError(null);

  try {
    const res = await employeesApi.getQr(id);

    console.log("QR RES:", res);

    setQrData(res.qr);
    setEmpData(res.employee || emp);

  } catch (e) {
    console.error("QR ERROR", e);
    setError(e.message);
  } finally {
    setLoading(false);
  }
}, [emp]);

useEffect(() => {
  loadQr(emp.id);
}, [emp.id, loadQr]);

  const handleRegenerate = async () => {
    if (!window.confirm("Eski QR token o'chadi. Davom etasizmi?")) return;
    setRegenerating(true);
    try {
      const res = await employeesApi.regenerateQr(emp.id);
      // res = { employee, qr }
      setQrData(res.qr);
      setEmpData(res.employee || empData);
      onRegenerated(res.employee || empData);
    } catch (e) {
      setError(e.message);
    } finally {
      setRegenerating(false);
    }
  };

  // SVG yoki base64 PNG ni yuklash
  const downloadQr = () => {
    if (!qrData) return;
    if (qrData.svg) {
      const blob = new Blob([qrData.svg], { type: "image/svg+xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${emp.firstName}-${emp.lastName}-qr.svg`;
      a.click();
    } else if (qrData.base64) {
      const a = document.createElement("a");
      a.href = `data:image/png;base64,${qrData.base64}`;
      a.download = `${emp.firstName}-${emp.lastName}-qr.png`;
      a.click();
    }
  };
  
  const token = qrData?.token || empData?.qrToken || "";

  return (
    <Modal title="QR Kod" subtitle={`${emp.firstName} ${emp.lastName}`} onClose={onClose}>
      <div className="e-qr-body">
        {/* Employee banner */}
        <div className="e-emp-mini" style={{marginBottom:0}}>
          <div className="e-avatar" style={{background:bg, color:cl, width:42, height:42, fontSize:15, borderRadius:10}}>
            {emp.firstName[0]}{emp.lastName[0]}
          </div>
          <div>
            <div style={{fontWeight:700, fontSize:14}}>{empData.firstName} {empData.lastName}</div>
            <div style={{display:"flex", alignItems:"center", gap:6, marginTop:2}}>
              <span className={`e-badge-status${empData.isActive ? " e-status-active" : " e-status-inactive"}`}>
                {empData.isActive ? "Faol" : "Nofaol"}
              </span>
              <span className={`e-badge-role${empData.role === "ADMIN" ? " e-role-admin-badge" : ""}`}>
                {empData.role === "ADMIN" ? <Shield size={10}/> : <UserCheck size={10}/>}
                {empData.role === "ADMIN" ? "Admin" : "Xodim"}
              </span>
            </div>
          </div>
        </div>

        {/* QR display */}
        <div className="e-qr-frame">
          {loading ? (
            <div className="e-qr-loading">
              <Loader2 size={28} className="e-spin" style={{color:"#2563eb"}}/>
              <span>Yuklanmoqda…</span>
            </div>
          ) : error ? (
            <div className="e-qr-loading">
              <ShieldAlert size={28} style={{color:"#fca5a5"}}/>
              <span style={{color:"#94a3b8", fontSize:13}}>{error}</span>
            </div>
          ) : qrData?.svg ? (
            <div dangerouslySetInnerHTML={{__html: qrData.svg}}/>
          ) : qrData?.base64 ? (
            <img
  src={`data:image/png;base64,${qrData.base64}`}
  alt="QR"
  style={{ width: 168, height: 168 }}
/>
          ) : qrData?.url ? (
           <img
  src={`data:image/png;base64,${qrData.base64}`}
  alt="QR"
  style={{ width: 168, height: 168 }}
/>
          ) : null}
        </div>

        {/* Token */}
        {token && (
          <div className="e-token-row">
            <div className="e-token-label">QR Token</div>
            <div className="e-token-val">
              <span className="e-token-text">
                {showToken ? token : "••••••••-••••-••••••••"}
              </span>
              <button className="e-token-eye" onClick={() => setShowToken(p => !p)}>
                {showToken ? <EyeOff size={13}/> : <Eye size={13}/>}
              </button>
            </div>
          </div>
        )}

        {!empData.isActive && (
          <div className="e-warn e-warn-amber" style={{margin:"0 0 4px"}}>
            <AlertTriangle size={15} strokeWidth={2}/>
            <span style={{fontSize:13}}>Nofaol hodim uchun QR ishlayotganligi aniqlanmagan.</span>
          </div>
        )}

        {/* Actions */}
        <div className="e-qr-actions">
          <button className="e-btn-ghost" onClick={handleRegenerate} disabled={regenerating || loading}>
            {regenerating
              ? <><Loader2 size={14} className="e-spin"/>Yangilanmoqda…</>
              : <><RefreshCw size={14}/>Yangi QR</>}
          </button>
          <button className="e-btn-primary" onClick={downloadQr} disabled={loading || !qrData}>
            <Download size={14}/>Yuklash
          </button>
        </div>
        <div style={{fontSize:11, color:"#94a3b8", textAlign:"center", paddingBottom:4}}>
          Yangi QR yaratilsa eski token bekor bo'ladi.
        </div>
      </div>
    </Modal>
  );
}

// ─── Pagination ───────────────────────────────────────────────
function Pagination({ page, total, onPage }) {
  if (total <= 1) return null;
  return (
    <div className="e-pagination">
      <button className="e-page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={14}/>
      </button>
      {Array.from({length: total}, (_, i) => i + 1).map(p => (
        <button key={p}
          className={`e-page-btn${p === page ? " e-page-active" : ""}`}
          onClick={() => onPage(p)}>
          {p}
        </button>
      ))}
      <button className="e-page-btn" disabled={page === total} onClick={() => onPage(page + 1)}>
        <ChevronRight size={14}/>
      </button>
    </div>
  );
}

// ─── Filter Pills ─────────────────────────────────────────────
function FilterPills({ role, setRole, active, setActive, setPage }) {
  const change = (fn) => { fn(); setPage(1); };
  return (
    <div className="e-filters">
      <div className="e-filter-group">
        <span className="e-filter-label"><Filter size={11}/>Rol:</span>
        {[["Barchasi", null], ["Xodim", "EMPLOYEE"], ["Admin", "ADMIN"]].map(([label, val]) => (
          <button key={label}
            className={`e-pill${role === val ? " e-pill-active" : ""}`}
            onClick={() => change(() => setRole(val))}>
            {label}
          </button>
        ))}
      </div>
      <div className="e-filter-group">
        <span className="e-filter-label">Holat:</span>
        {[["Barchasi", null], ["Faol", true], ["Nofaol", false]].map(([label, val]) => (
          <button key={label}
            className={`e-pill${active === val ? " e-pill-active" : ""}`}
            onClick={() => change(() => setActive(val))}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export const Employee = () => {
  const [employees,  setEmployees]  = useState([]);
  const [meta,       setMeta]       = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search,     setSearch]     = useState("");
  const [roleF,      setRoleF]      = useState(null);
  const [activeF,    setActiveF]    = useState(null);
  const [page,       setPage]       = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [addModal,   setAddModal]   = useState(false);
  const [editModal,  setEditModal]  = useState(null);
  const [qrModal,    setQrModal]    = useState(null);
  const [delModal,   setDelModal]   = useState(null);
  const { toasts, add: toast, remove: removeToast } = useToast();

  // Debounce uchun
  const debounceRef = useRef(null);
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPage(1), 350);
  };

  // ── Fetch ──
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search.trim())      params.search   = search.trim();
      if (roleF)              params.role     = roleF;
      if (activeF !== null)   params.isActive = activeF;

      const res = await employeesApi.getAll(params);

      // Backend { items, meta } formatida qaytaradi
      if (Array.isArray(res)) {
        setEmployees(res);
        setMeta({ total: res.length, page: 1, limit: PAGE_SIZE, totalPages: Math.ceil(res.length / PAGE_SIZE) });
      } else {
        setEmployees(res.items || []);
        setMeta(res.meta || { total: 0, page, limit: PAGE_SIZE, totalPages: 1 });
      }
    } catch (e) {
      setFetchError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleF, activeF]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  // ── Stats ── (joriy sahifa ma'lumotlaridan)
  const activeCount   = employees.filter(e => e.isActive).length;
  const inactiveCount = employees.filter(e => !e.isActive).length;
  const adminCount    = employees.filter(e => e.role === "ADMIN").length;

  // ── Create ──
  const handleCreate = async (data) => {
    setSaving(true);
    try {
      const res = await employeesApi.create(data);
      // res = { employee, qr } — QR ko'rsatish uchun modal ochish ham mumkin
      toast("Hodim qo'shildi — QR token avtomatik yaratildi");
      setAddModal(false);
      setPage(1);
      await fetchEmployees();
      // Agar QR ni darhol ko'rsatish kerak bo'lsa:
      // if (res.employee) setQrModal(res.employee);
    } catch (e) {
      toast(e.message || "Xatolik yuz berdi", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Update ──
  const handleUpdate = async (data) => {
    setSaving(true);
    try {
      await employeesApi.update(editModal.id, data);
      toast("Hodim ma'lumotlari yangilandi");
      setEditModal(null);
      await fetchEmployees();
    } catch (e) {
      toast(e.message || "Xatolik yuz berdi", "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ──
  const handleToggle = async (emp) => {
    try {
      await employeesApi.toggleActive(emp.id);
      toast(emp.isActive
        ? `${emp.firstName} nofaol qilindi`
        : `${emp.firstName} faollashtirildi`);
      await fetchEmployees();
    } catch (e) {
      toast(e.message || "Xatolik yuz berdi", "error");
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await employeesApi.remove(delModal.id);
      toast("Hodim o'chirildi");
      setDelModal(null);
      if (employees.length === 1 && page > 1) setPage(p => p - 1);
      else await fetchEmployees();
    } catch (e) {
      toast(e.message || "Xatolik yuz berdi", "error");
    } finally {
      setDeleting(false);
    }
  };

  // QR regenerate bo'lganda ro'yxatdagi hodimni yangilash
  const handleQrRegenerated = (updatedEmp) => {
    setEmployees(p => p.map(e => e.id === updatedEmp.id ? { ...e, ...updatedEmp } : e));
    toast("QR token yangilandi — eski token bekor bo'ldi");
  };

  return (
    <>
      <style>{STYLES}</style>
      <ToastStack toasts={toasts} remove={removeToast}/>

      <div className="e-page">
        {/* Header */}
        <div className="e-header">
          <div>
            <div className="e-eyebrow">Boshqaruv paneli</div>
            <h1 className="e-title">
              <Users size={22} strokeWidth={2.2} className="e-h1-icon"/>Xodimlar
            </h1>
            <p className="e-subtitle">Hodimlarni qo'shish, QR kodlar va kirish huquqlarini boshqarish</p>
          </div>
          <button className="e-btn-primary" onClick={() => setAddModal(true)}>
            <Plus size={15} strokeWidth={2.5}/>Hodim qo'shish
          </button>
        </div>

        {/* Stats */}
        <div className="e-stats">
          <div className="e-stat e-stat-blue">
            <div className="e-stat-ico e-ico-blue"><Users size={17} strokeWidth={2}/></div>
            <div>
              <div className="e-stat-val">{meta.total}</div>
              <div className="e-stat-lbl">Jami xodimlar</div>
            </div>
          </div>
          <div className="e-stat e-stat-green">
            <div className="e-stat-ico e-ico-green"><UserCheck size={17} strokeWidth={2}/></div>
            <div>
              <div className="e-stat-val">{activeCount}</div>
              <div className="e-stat-lbl">Faol</div>
            </div>
          </div>
          <div className="e-stat e-stat-gray">
            <div className="e-stat-ico e-ico-gray"><UserX size={17} strokeWidth={2}/></div>
            <div>
              <div className="e-stat-val">{inactiveCount}</div>
              <div className="e-stat-lbl">Nofaol</div>
            </div>
          </div>
          <div className="e-stat e-stat-violet">
            <div className="e-stat-ico e-ico-violet"><Shield size={17} strokeWidth={2}/></div>
            <div>
              <div className="e-stat-val">{adminCount}</div>
              <div className="e-stat-lbl">Adminlar</div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="e-search-wrap">
          <Search size={15} className="e-search-icon" strokeWidth={2}/>
          <input
            className="e-search-input"
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Ism, familiya yoki telefon bo'yicha qidiring…"/>
          {search && (
            <button className="e-clear-btn" onClick={() => { setSearch(""); setPage(1); }}>
              <X size={13}/>
            </button>
          )}
          {loading && <Loader2 size={15} className="e-spin" style={{color:"#2563eb", marginRight:14}}/>}
        </div>

        {/* Filters — filter o'zgarsa page=1 */}
        <FilterPills
          role={roleF} setRole={setRoleF}
          active={activeF} setActive={setActiveF}
          setPage={setPage}/>

        {/* Table */}
        <div className="e-table-card">
          {fetchError ? (
            <div className="e-empty">
              <ShieldAlert size={44} strokeWidth={0.8} style={{color:"#fca5a5"}}/>
              <div>
                <div style={{fontSize:15, fontWeight:600, color:"#64748b", marginBottom:5}}>
                  Serverga ulanib bo'lmadi
                </div>
                <div style={{fontSize:13, color:"#94a3b8"}}>{fetchError}</div>
              </div>
              <button className="e-btn-primary" onClick={fetchEmployees}>Qayta urinish</button>
            </div>
          ) : loading && employees.length === 0 ? (
            <div className="e-empty">
              <Loader2 size={44} className="e-spin" style={{color:"#2563eb", opacity:0.25}}/>
            </div>
          ) : employees.length === 0 ? (
            <div className="e-empty">
              <Users size={44} strokeWidth={0.8} style={{color:"#e2e8f0"}}/>
              <div>
                <div style={{fontSize:15, fontWeight:600, color:"#64748b", marginBottom:5}}>
                  {search || roleF || activeF !== null ? "Hech narsa topilmadi" : "Hodimlar ro'yxati bo'sh"}
                </div>
                <div style={{fontSize:13, color:"#94a3b8"}}>
                  {search || roleF || activeF !== null
                    ? "Filtr yoki qidiruvni o'zgartiring"
                    : "Birinchi hodimni qo'shib boshlang"}
                </div>
              </div>
              {!(search || roleF || activeF !== null) && (
                <button className="e-btn-primary" onClick={() => setAddModal(true)}>
                  <Plus size={14}/>Hodim qo'shish
                </button>
              )}
            </div>
          ) : (
            <>
              <table className="e-table">
                <thead>
                  <tr>
                    <th>Hodim</th>
                    <th>Telefon</th>
                    <th style={{textAlign:"center"}}>Lavozim</th>
                    <th style={{textAlign:"center"}}>Holat</th>
                    <th style={{textAlign:"center"}}>Qo'shilgan</th>
                    <th style={{textAlign:"right", paddingRight:20}}>Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => {
                    const [bg, cl] = avatarColor(emp.firstName);
                    return (
                      <tr key={emp.id}
                        className={`e-row${!emp.isActive ? " e-row-dim" : ""}`}
                        style={{"--ri": i}}>
                        <td>
                          <div className="e-name-cell">
                            <div className="e-avatar" style={{background:bg, color:cl}}>
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div>
                              <div className="e-name">{emp.firstName} {emp.lastName}</div>
                              <div className="e-qr-snippet">
                                <QrCode size={9} strokeWidth={2}/>
                                {(emp.qrToken || "").slice(0, 12)}…
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {emp.phone
                            ? <a href={`tel:${emp.phone}`} className="e-phone">
                                <Phone size={11} strokeWidth={2}/>{emp.phone}
                              </a>
                            : <span style={{color:"#cbd5e1", fontSize:12}}>—</span>}
                        </td>
                        <td style={{textAlign:"center"}}>
                          <span className={`e-badge-role${emp.role === "ADMIN" ? " e-role-admin-badge" : ""}`}>
                            {emp.role === "ADMIN" ? <Shield size={10}/> : <UserCheck size={10}/>}
                            {emp.role === "ADMIN" ? "Admin" : "Xodim"}
                          </span>
                        </td>
                        <td style={{textAlign:"center"}}>
                          <span className={`e-badge-status${emp.isActive ? " e-status-active" : " e-status-inactive"}`}>
                            {emp.isActive ? "Faol" : "Nofaol"}
                          </span>
                        </td>
                        <td style={{textAlign:"center"}}>
                          <span className="e-date">
                            <Calendar size={11} strokeWidth={2}/>{formatDate(emp.createdAt)}
                          </span>
                        </td>
                        <td>
                          <div className="e-row-actions">
                            <button className="e-icon-btn e-qr-btn"
                              onClick={() => setQrModal(emp)}
                              title="QR kod ko'rish">
                              <QrCode size={14} strokeWidth={2}/>
                            </button>
                            <button className="e-icon-btn e-edit-btn"
                              onClick={() => setEditModal(emp)}
                              title="Tahrirlash">
                              <Pencil size={13} strokeWidth={2}/>
                            </button>
                            <button
                              className={`e-icon-btn e-power-btn${emp.isActive ? " e-power-on" : " e-power-off"}`}
                              onClick={() => handleToggle(emp)}
                              title={emp.isActive ? "Nofaol qilish" : "Faollashtirish"}>
                              <Power size={13} strokeWidth={2}/>
                            </button>
                            <button className="e-icon-btn e-del-btn"
                              onClick={() => setDelModal(emp)}
                              title="O'chirish">
                              <Trash2 size={13} strokeWidth={2}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="e-table-footer">
                <span className="e-count">
                  {meta.total} ta hodim
                  {(search || roleF || activeF !== null) && " (filtrlangan)"}
                </span>
                <Pagination page={meta.page} total={meta.totalPages} onPage={setPage}/>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {addModal && (
        <Modal
          title="Yangi hodim qo'shish"
          subtitle="Qo'shilgach QR token avtomatik yaratiladi"
          onClose={() => setAddModal(false)}>
          <EmployeeForm onSave={handleCreate} onCancel={() => setAddModal(false)} saving={saving}/>
        </Modal>
      )}

      {editModal && (
        <Modal
          title="Hodimni tahrirlash"
          subtitle={`${editModal.firstName} ${editModal.lastName}`}
          onClose={() => setEditModal(null)}>
          <EmployeeForm
            initial={editModal}
            onSave={handleUpdate}
            onCancel={() => setEditModal(null)}
            saving={saving}/>
        </Modal>
      )}

      {qrModal && (
        <QrModal
          emp={employees.find(e => e.id === qrModal.id) || qrModal}
          onClose={() => setQrModal(null)}
          onRegenerated={handleQrRegenerated}/>
      )}

      {delModal && (
        <DeleteModal
          emp={delModal}
          onConfirm={handleDelete}
          onCancel={() => setDelModal(null)}
          deleting={deleting}/>
      )}
    </>
  );
};

// ─── STYLES ──────────────────────────────────────────────────
const STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.e-page { padding: 32px 28px 52px; margin: 0 auto; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #0f172a; background: #f6f8fc; min-height: 100vh; }
.e-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.e-eyebrow { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 5px; }
.e-title { font-size: 26px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 10px; letter-spacing: -.5px; line-height: 1; margin-bottom: 4px; }
.e-h1-icon { color: #2563eb; }
.e-subtitle { color: #94a3b8; font-size: 13px; }
.e-btn-primary { display: inline-flex; align-items: center; gap: 7px; background: #2563eb; color: #fff; border: none; border-radius: 10px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .15s, box-shadow .15s, transform .1s; box-shadow: 0 1px 3px rgba(37,99,235,.3); white-space: nowrap; font-family: inherit; }
.e-btn-primary:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,.35); }
.e-btn-primary:active { transform: translateY(0); }
.e-btn-primary:disabled { background: #93c5fd; cursor: not-allowed; transform: none; box-shadow: none; }
.e-btn-ghost { display: inline-flex; align-items: center; gap: 6px; background: transparent; color: #64748b; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background .15s; font-family: inherit; }
.e-btn-ghost:hover { background: #f1f5f9; border-color: #cbd5e1; }
.e-btn-ghost:disabled { opacity: .45; cursor: not-allowed; }
.e-btn-danger { display: inline-flex; align-items: center; gap: 7px; background: #dc2626; color: #fff; border: none; border-radius: 10px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background .15s; font-family: inherit; }
.e-btn-danger:hover:not(:disabled) { background: #b91c1c; }
.e-btn-danger:disabled { background: #fca5a5; cursor: not-allowed; }
.e-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
.e-stat { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; transition: box-shadow .15s; }
.e-stat:hover { box-shadow: 0 4px 16px rgba(0,0,0,.06); }
.e-stat-ico { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.e-ico-blue { background: #eff6ff; color: #2563eb; } .e-ico-green { background: #f0fdf4; color: #16a34a; } .e-ico-gray { background: #f8fafc; color: #94a3b8; } .e-ico-violet { background: #f5f3ff; color: #7c3aed; }
.e-stat-val { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
.e-stat-lbl { font-size: 12px; color: #94a3b8; margin-top: 3px; }
.e-search-wrap { display: flex; align-items: center; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 11px; margin-bottom: 12px; transition: border-color .15s, box-shadow .15s; }
.e-search-wrap:focus-within { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
.e-search-icon { margin-left: 14px; color: #cbd5e1; flex-shrink: 0; }
.e-search-input { flex: 1; border: none; outline: none; padding: 12px 10px; font-size: 14px; background: transparent; color: #0f172a; font-family: inherit; }
.e-search-input::placeholder { color: #cbd5e1; }
.e-clear-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0 14px; display: flex; align-items: center; }
.e-clear-btn:hover { color: #475569; }
.e-filters { display: flex; gap: 16px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
.e-filter-group { display: flex; align-items: center; gap: 6px; }
.e-filter-label { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; white-space: nowrap; }
.e-pill { padding: 5px 12px; border-radius: 20px; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit; }
.e-pill:hover { border-color: #cbd5e1; background: #f8fafc; }
.e-pill-active { background: #0f172a; color: #fff; border-color: #0f172a; }
.e-table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
.e-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 72px 24px; text-align: center; }
.e-table { width: 100%; border-collapse: collapse; }
.e-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
.e-table th { padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #94a3b8; text-align: left; }
.e-row { border-bottom: 1px solid #f1f5f9; animation: eRow .22s ease both; animation-delay: calc(var(--ri,0) * 28ms); }
@keyframes eRow { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.e-row:hover { background: #f8faff; }
.e-row:last-child { border-bottom: none; }
.e-row td { padding: 13px 16px; font-size: 13.5px; color: #334155; vertical-align: middle; }
.e-row-dim { opacity: .5; }
.e-row-dim:hover { opacity: .75; }
.e-name-cell { display: flex; align-items: center; gap: 11px; }
.e-avatar { width: 36px; height: 36px; border-radius: 9px; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.e-name { font-weight: 700; color: #0f172a; font-size: 14px; }
.e-qr-snippet { display: flex; align-items: center; gap: 3px; font-family: 'JetBrains Mono','Fira Mono',monospace; font-size: 10px; color: #94a3b8; margin-top: 2px; }
.e-phone { display: inline-flex; align-items: center; gap: 5px; color: #2563eb; text-decoration: none; font-size: 13px; font-weight: 500; padding: 4px 9px; border-radius: 7px; background: #eff6ff; transition: background .15s; }
.e-phone:hover { background: #dbeafe; }
.e-date { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #64748b; }
.e-badge-role { display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 20px; }
.e-role-admin-badge { background: #f5f3ff; color: #7c3aed; }
.e-badge-status { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
.e-status-active { background: #dcfce7; color: #16a34a; } .e-status-inactive { background: #f1f5f9; color: #94a3b8; }
.e-row-actions { display: flex; gap: 5px; justify-content: flex-end; }
.e-icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; color: #94a3b8; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; }
.e-icon-btn:hover { transform: translateY(-1px); }
.e-qr-btn:hover { background: #eff6ff; border-color: #93c5fd; color: #2563eb; }
.e-edit-btn:hover { background: #fefce8; border-color: #fde68a; color: #b45309; }
.e-power-btn:hover { background: #f0fdf4; border-color: #86efac; color: #16a34a; }
.e-power-on { color: #16a34a; border-color: #86efac; background: #f0fdf4; }
.e-power-off { color: #94a3b8; }
.e-del-btn:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
.e-table-footer { display: flex; justify-content: space-between; align-items: center; padding: 13px 18px; border-top: 1.5px solid #f1f5f9; background: #fafbfc; }
.e-count { font-size: 13px; color: #94a3b8; }
.e-pagination { display: flex; gap: 4px; align-items: center; }
.e-page-btn { width: 31px; height: 31px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; color: #475569; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; transition: all .15s; font-family: inherit; }
.e-page-btn:hover:not(:disabled) { background: #f1f5f9; }
.e-page-btn:disabled { opacity: .35; cursor: not-allowed; }
.e-page-active { background: #1056fa !important; color: #fff !important; border-color: #0850f8 !important; }
.e-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.52); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 16px; }
.e-modal { background: #fff; border-radius: 20px; width: 100%; max-width: 460px; box-shadow: 0 32px 80px rgba(0,0,0,.22); animation: ePop .18s cubic-bezier(.34,1.56,.64,1); overflow: hidden; }
.e-modal-md { max-width: 460px; }
@keyframes ePop { from { opacity: 0; transform: scale(.91) translateY(14px); } to { opacity: 1; transform: scale(1) translateY(0); } }
.e-modal-hdr { display: flex; justify-content: space-between; align-items: flex-start; padding: 22px 24px 0; gap: 12px; }
.e-modal-title { font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: -.2px; }
.e-modal-subtitle { font-size: 12px; color: #94a3b8; margin-top: 3px; }
.e-modal-x { background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: background .15s; flex-shrink: 0; }
.e-modal-x:hover { background: #e2e8f0; color: #0f172a; }
.e-form-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 15px; }
.e-form-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.e-field { display: flex; flex-direction: column; gap: 5px; }
.e-label { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: .04em; }
.e-field-err { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #dc2626; }
.e-field-hint { font-size: 11px; color: #94a3b8; }
.e-input { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 11px 13px; font-size: 14px; outline: none; color: #0f172a; background: #fff; transition: border-color .15s, box-shadow .15s; font-family: inherit; width: 100%; }
.e-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
.e-input::placeholder { color: #cbd5e1; }
.e-input-err { border-color: #fca5a5 !important; }
.e-input-err:focus { border-color: #ef4444 !important; box-shadow: 0 0 0 3px #fee2e2 !important; }
.e-role-row { display: flex; gap: 8px; }
.e-role-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; border: 1.5px solid #e2e8f0; background: #f8fafc; border-radius: 10px; padding: 10px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; transition: all .15s; font-family: inherit; }
.e-role-btn:hover { border-color: #cbd5e1; background: #f1f5f9; }
.e-role-active { border-color: #2563eb; background: #eff6ff; color: #2563eb; }
.e-role-active.e-role-admin { border-color: #7c3aed; background: #f5f3ff; color: #7c3aed; }
.e-toggle-row { display: flex; align-items: center; gap: 10px; cursor: pointer; width: fit-content; }
.e-toggle { width: 40px; height: 22px; background: #e2e8f0; border-radius: 11px; position: relative; transition: background .2s; }
.e-toggle-on { background: #22c55e; }
.e-toggle-thumb { width: 16px; height: 16px; background: #fff; border-radius: 50%; position: absolute; top: 3px; left: 3px; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
.e-toggle-on .e-toggle-thumb { transform: translateX(18px); }
.e-warn { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 12px; border: 1.5px solid; }
.e-warn-red { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
.e-warn-amber { background: #fffbeb; border-color: #fde68a; color: #b45309; }
.e-warn strong { font-size: 14px; font-weight: 700; display: block; }
.e-warn p { font-size: 13px; color: #475569; line-height: 1.5; }
.e-emp-mini { display: flex; align-items: center; gap: 12px; padding: 13px 15px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; }
.e-form-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 4px; }
.e-qr-body { padding: 18px 24px 22px; display: flex; flex-direction: column; gap: 14px; }
.e-qr-frame { display: flex; align-items: center; justify-content: center; padding: 18px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; min-height: 200px; }
.e-qr-loading { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.e-qr-loading span { font-size: 13px; color: #94a3b8; }
.e-token-row { display: flex; flex-direction: column; gap: 5px; }
.e-token-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
.e-token-val { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 9px 12px; }
.e-token-text { flex: 1; font-family: 'JetBrains Mono','Fira Mono',monospace; font-size: 12px; color: #475569; word-break: break-all; }
.e-token-eye { background: none; border: none; cursor: pointer; color: #94a3b8; display: flex; align-items: center; padding: 2px; flex-shrink: 0; }
.e-token-eye:hover { color: #475569; }
.e-qr-actions { display: flex; gap: 10px; }
.e-qr-actions .e-btn-ghost, .e-qr-actions .e-btn-primary { flex: 1; justify-content: center; }
.e-toast { padding: 12px 15px; border-radius: 12px; font-size: 13.5px; font-weight: 600; display: flex; align-items: center; gap: 9px; box-shadow: 0 10px 36px rgba(0,0,0,.18); animation: eToast .2s ease; min-width: 200px; max-width: 340px; }
.e-toast-success { background: #0f172a; color: #fff; }
.e-toast-error { background: #dc2626; color: #fff; }
.e-toast button { background: none; border: none; cursor: pointer; color: rgba(255,255,255,.6); margin-left: auto; display: flex; }
.e-toast button:hover { color: #fff; }
@keyframes eToast { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.e-spin { animation: eSpin .7s linear infinite; }
@keyframes eSpin { to { transform: rotate(360deg); } }
@media (max-width: 860px) { .e-stats { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) {
  .e-page { padding: 16px 14px 36px; }
  .e-form-row2 { grid-template-columns: 1fr; }
  .e-header { flex-direction: column; align-items: flex-start; }
  .e-table th:nth-child(5), .e-table td:nth-child(5) { display: none; }
  .e-modal { border-radius: 16px; }
}
@media (max-width: 480px) {
  .e-stats { grid-template-columns: 1fr; }
  .e-table th:nth-child(3), .e-table td:nth-child(3) { display: none; }
}
`;