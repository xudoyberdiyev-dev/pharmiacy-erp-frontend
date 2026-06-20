import { useState } from "react";
import {
  Search, X, Plus, Pencil, Trash2, UserCheck, Phone,
  Shield, QrCode, CheckCircle, ShieldAlert, Loader2,
  Power, Users, UserX,
} from "lucide-react";

// ─── MOCK DATA (API hali ulanmagan) ────────────────────────
const initialEmployees = [
  {
    id: "1",
    firstName: "Aziz",
    lastName: "Karimov",
    phone: "+998 90 123 45 67",
    role: "EMPLOYEE",
    isActive: true,
    qrToken: "a1b2c3d4-0001",
    createdAt: "2026-05-12",
  },
  {
    id: "2",
    firstName: "Dilnoza",
    lastName: "Yusupova",
    phone: "+998 93 765 43 21",
    role: "EMPLOYEE",
    isActive: true,
    qrToken: "a1b2c3d4-0002",
    createdAt: "2026-05-20",
  },
  {
    id: "3",
    firstName: "Bekzod",
    lastName: "Tursunov",
    phone: "+998 97 222 11 00",
    role: "ADMIN",
    isActive: false,
    qrToken: "a1b2c3d4-0003",
    createdAt: "2026-04-02",
  },
];

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("uz-UZ") : "—");

// ─── Toast ──────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useState(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  });
  return (
    <div className={`emp-toast emp-toast-${type}`}>
      {type === "success" ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
      <span>{msg}</span>
      <button onClick={onClose}><X size={13} /></button>
    </div>
  );
}

// ─── Modal ──────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="emp-modal-overlay" onClick={onClose}>
      <div className="emp-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="emp-modal-header">
          <h2>{title}</h2>
          <button className="emp-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Employee Form (create/edit) ───────────────────────────
function EmployeeForm({ initial = {}, onSave, onCancel, saving }) {
  const [firstName, setFirstName] = useState(initial.firstName || "");
  const [lastName, setLastName] = useState(initial.lastName || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [role, setRole] = useState(initial.role || "EMPLOYEE");
  const [err, setErr] = useState("");

  const submit = () => {
    if (!firstName.trim() || !lastName.trim()) {
      return setErr("Ism va familiya kiritilishi shart");
    }
    setErr("");
    onSave({ firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() || null, role });
  };

  return (
    <div className="emp-form-body">
      {err && <div className="emp-form-error"><ShieldAlert size={14} />{err}</div>}

      <div className="emp-form-row">
        <div className="emp-field">
          <label>Ism *</label>
          <input className="emp-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Aziz" autoFocus />
        </div>
        <div className="emp-field">
          <label>Familiya *</label>
          <input className="emp-input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Karimov" />
        </div>
      </div>

      <div className="emp-field">
        <label>Telefon raqami</label>
        <input className="emp-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" />
      </div>

      <div className="emp-field">
        <label>Rol</label>
        <div className="emp-role-select">
          <button type="button" className={`emp-role-opt ${role === "EMPLOYEE" ? "active" : ""}`} onClick={() => setRole("EMPLOYEE")}>
            <UserCheck size={14} /> Xodim
          </button>
          <button type="button" className={`emp-role-opt ${role === "ADMIN" ? "active" : ""}`} onClick={() => setRole("ADMIN")}>
            <Shield size={14} /> Admin
          </button>
        </div>
      </div>

      <div className="emp-form-actions">
        <button className="emp-btn-secondary" onClick={onCancel} type="button">Bekor</button>
        <button className="emp-btn-primary" onClick={submit} disabled={saving} type="button">
          {saving ? <><Loader2 size={15} className="emp-spin" /> Saqlanmoqda…</> : "Saqlash"}
        </button>
      </div>
    </div>
  );
}

// ─── QR Modal (mock — haqiqiy QR API ulanganda almashtiriladi) ──
function QrModal({ employee, onClose }) {
  return (
    <Modal title={`QR kod — ${employee.firstName} ${employee.lastName}`} onClose={onClose}>
      <div className="emp-qr-body">
        <div className="emp-qr-box">
          <QrCode size={120} strokeWidth={1} />
        </div>
        <p className="emp-qr-token">{employee.qrToken}</p>
        <p className="emp-qr-hint">
          Bu — namuna ko'rinish. Backend ulanganda bu yerda haqiqiy QR rasm (PNG/SVG) ko'rsatiladi.
        </p>
        <div className="emp-form-actions" style={{ justifyContent: "center" }}>
          <button className="emp-btn-secondary" onClick={onClose} type="button">Yopish</button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Stat Card ──────────────────────────────────────────────
function StatCard({ icon: Icon, value, label, accent }) {
  return (
    <div className={`emp-stat-card emp-stat-${accent}`}>
      <div className={`emp-stat-icon emp-stat-icon-${accent}`}><Icon size={18} /></div>
      <div>
        <div className="emp-stat-value">{value}</div>
        <div className="emp-stat-label">{label}</div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function Employees() {
  const [employees, setEmployees] = useState(initialEmployees);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [qrModal, setQrModal] = useState(null);

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── CREATE (mock) ──
  const handleCreate = (data) => {
    setSaving(true);
    setTimeout(() => {
      const newEmployee = {
        id: String(Date.now()),
        ...data,
        isActive: true,
        qrToken: `mock-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setEmployees((prev) => [newEmployee, ...prev]);
      showToast("Hodim qo'shildi (QR avtomatik yaratildi)");
      setAddModal(false);
      setSaving(false);
    }, 500);
  };

  // ── UPDATE (mock) ──
  const handleUpdate = (data) => {
    setSaving(true);
    setTimeout(() => {
      setEmployees((prev) =>
        prev.map((e) => (e.id === editModal.id ? { ...e, ...data } : e))
      );
      showToast("Hodim ma'lumotlari yangilandi");
      setEditModal(null);
      setSaving(false);
    }, 500);
  };

  // ── TOGGLE ACTIVE (mock) ──
  const handleToggleActive = (employee) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === employee.id ? { ...e, isActive: !e.isActive } : e))
    );
    showToast(employee.isActive ? "Hodim nofaol qilindi" : "Hodim faollashtirildi");
  };

  // ── DELETE (mock) ──
  const handleDelete = (employee) => {
    if (!window.confirm(`"${employee.firstName} ${employee.lastName}"ni o'chirasizmi?`)) return;
    setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
    showToast("Hodim o'chirildi");
  };

  const filtered = employees.filter((e) => {
    const full = `${e.firstName} ${e.lastName}`.toLowerCase();
    return full.includes(search.toLowerCase()) || (e.phone || "").includes(search);
  });

  const activeCount = employees.filter((e) => e.isActive).length;
  const inactiveCount = employees.length - activeCount;
  const adminCount = employees.filter((e) => e.role === "ADMIN").length;

  return (
    <>
      <style>{STYLES}</style>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="emp-page">
        <div className="emp-header">
          <div>
            <h1><Users size={22} className="emp-h1-icon" /> Xodimlar</h1>
            <p className="emp-subtitle">Hodimlarni qo'shish, QR kod va ruxsatlarni boshqarish</p>
          </div>
          <button className="emp-btn-primary" onClick={() => setAddModal(true)}>
            <Plus size={16} /> Hodim qo'shish
          </button>
        </div>

        <div className="emp-stats-row">
          <StatCard icon={Users} value={employees.length} label="Jami hodimlar" accent="blue" />
          <StatCard icon={UserCheck} value={activeCount} label="Faol" accent="green" />
          <StatCard icon={UserX} value={inactiveCount} label="Nofaol" accent="gray" />
          <StatCard icon={Shield} value={adminCount} label="Adminlar" accent="violet" />
        </div>

        <div className="emp-search-wrap">
          <Search size={15} className="emp-search-icon" />
          <input
            className="emp-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ism, familiya yoki telefon bo'yicha qidiring…"
          />
          {search && (
            <button className="emp-clear-btn" onClick={() => setSearch("")}><X size={14} /></button>
          )}
        </div>

        <div className="emp-table-card">
          {filtered.length === 0 ? (
            <div className="emp-state-box">
              <Users size={36} strokeWidth={1} />
              <p>{search ? "Hech narsa topilmadi" : "Hali hodim yo'q"}</p>
            </div>
          ) : (
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Hodim</th>
                  <th>Telefon</th>
                  <th className="center">Rol</th>
                  <th className="center">Holat</th>
                  <th className="center">Qo'shilgan</th>
                  <th className="center">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className={!e.isActive ? "emp-row-inactive" : ""}>
                    <td>
                      <div className="emp-name-cell">
                        <div className="emp-avatar">{e.firstName[0]}{e.lastName[0]}</div>
                        <span className="emp-name">{e.firstName} {e.lastName}</span>
                      </div>
                    </td>
                    <td className="emp-mono">
                      {e.phone ? <><Phone size={12} /> {e.phone}</> : "—"}
                    </td>
                    <td className="center">
                      <span className={`emp-badge-role ${e.role === "ADMIN" ? "admin" : ""}`}>
                        {e.role === "ADMIN" ? <Shield size={11} /> : <UserCheck size={11} />}
                        {e.role === "ADMIN" ? "Admin" : "Xodim"}
                      </span>
                    </td>
                    <td className="center">
                      <span className={`emp-badge-status ${e.isActive ? "active" : "inactive"}`}>
                        {e.isActive ? "Faol" : "Nofaol"}
                      </span>
                    </td>
                    <td className="center emp-date">{formatDate(e.createdAt)}</td>
                    <td>
                      <div className="emp-row-actions">
                        <button className="emp-icon-btn" title="QR kod" onClick={() => setQrModal(e)}>
                          <QrCode size={14} />
                        </button>
                        <button className="emp-icon-btn" title="Tahrirlash" onClick={() => setEditModal(e)}>
                          <Pencil size={14} />
                        </button>
                        <button
                          className="emp-icon-btn"
                          title={e.isActive ? "Nofaol qilish" : "Faollashtirish"}
                          onClick={() => handleToggleActive(e)}
                        >
                          <Power size={14} />
                        </button>
                        <button className="emp-icon-btn del" title="O'chirish" onClick={() => handleDelete(e)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {addModal && (
        <Modal title="Yangi hodim qo'shish" onClose={() => setAddModal(false)}>
          <EmployeeForm onSave={handleCreate} onCancel={() => setAddModal(false)} saving={saving} />
        </Modal>
      )}

      {editModal && (
        <Modal title="Hodimni tahrirlash" onClose={() => setEditModal(null)}>
          <EmployeeForm initial={editModal} onSave={handleUpdate} onCancel={() => setEditModal(null)} saving={saving} />
        </Modal>
      )}

      {qrModal && <QrModal employee={qrModal} onClose={() => setQrModal(null)} />}
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const STYLES = `
  .emp-page { padding: 28px; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background: #f6f8fc; min-height: 100vh; }
  .emp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; gap: 16px; flex-wrap: wrap; }
  .emp-header h1 { font-size: 22px; font-weight: 800; display: flex; align-items: center; gap: 9px; }
  .emp-h1-icon { color: #2563eb; }
  .emp-subtitle { color: #94a3b8; font-size: 13px; margin-top: 4px; }

  .emp-btn-primary { display: inline-flex; align-items: center; gap: 7px; background: #2563eb; color: #fff; border: none; border-radius: 10px; padding: 11px 18px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .emp-btn-primary:hover:not(:disabled) { background: #1d4ed8; }
  .emp-btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
  .emp-btn-secondary { background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 18px; font-size: 14px; font-weight: 500; cursor: pointer; }
  .emp-btn-secondary:hover { background: #e2e8f0; }

  .emp-stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 18px; }
  .emp-stat-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 15px 17px; display: flex; align-items: center; gap: 13px; }
  .emp-stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .emp-stat-icon-blue { background: #eff6ff; color: #2563eb; }
  .emp-stat-icon-green { background: #f0fdf4; color: #16a34a; }
  .emp-stat-icon-gray { background: #f8fafc; color: #94a3b8; }
  .emp-stat-icon-violet { background: #f5f3ff; color: #7c3aed; }
  .emp-stat-value { font-size: 21px; font-weight: 800; line-height: 1; }
  .emp-stat-label { font-size: 12px; color: #94a3b8; margin-top: 3px; }

  .emp-search-wrap { position: relative; display: flex; align-items: center; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 11px; margin-bottom: 14px; }
  .emp-search-wrap:focus-within { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
  .emp-search-icon { margin-left: 14px; color: #cbd5e1; }
  .emp-search-input { flex: 1; border: none; outline: none; padding: 12px; font-size: 14px; background: transparent; }
  .emp-clear-btn { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0 14px; }

  .emp-table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .emp-state-box { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 20px; color: #94a3b8; }

  .emp-table { width: 100%; border-collapse: collapse; }
  .emp-table thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
  .emp-table th { padding: 12px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #94a3b8; text-align: left; }
  .emp-table th.center, .emp-table td.center { text-align: center; }
  .emp-table td { padding: 13px 16px; font-size: 13.5px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .emp-row-inactive { opacity: .55; }

  .emp-name-cell { display: flex; align-items: center; gap: 10px; }
  .emp-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg,#2563eb,#1d4ed8); color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .emp-name { font-weight: 700; }
  .emp-mono { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: #64748b; display: flex; align-items: center; gap: 5px; }
  .emp-date { color: #94a3b8; font-size: 12.5px; }

  .emp-badge-role { display: inline-flex; align-items: center; gap: 4px; background: #eff6ff; color: #2563eb; font-size: 11px; font-weight: 700; padding: 4px 9px; border-radius: 20px; }
  .emp-badge-role.admin { background: #f5f3ff; color: #7c3aed; }
  .emp-badge-status { display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
  .emp-badge-status.active { background: #dcfce7; color: #16a34a; }
  .emp-badge-status.inactive { background: #f1f5f9; color: #94a3b8; }

  .emp-row-actions { display: flex; gap: 6px; justify-content: flex-end; }
  .emp-icon-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; }
  .emp-icon-btn:hover { background: #f1f5f9; }
  .emp-icon-btn.del:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }

  .emp-modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
  .emp-modal-box { background: #fff; border-radius: 18px; width: 100%; max-width: 460px; box-shadow: 0 30px 70px rgba(0,0,0,.2); }
  .emp-modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 22px 0; }
  .emp-modal-header h2 { font-size: 16px; font-weight: 800; }
  .emp-modal-close { background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; }

  .emp-form-body { padding: 18px 22px 22px; display: flex; flex-direction: column; gap: 13px; }
  .emp-form-error { display: flex; align-items: center; gap: 7px; background: #fef2f2; color: #dc2626; font-size: 13px; padding: 9px 13px; border-radius: 9px; }
  .emp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .emp-field { display: flex; flex-direction: column; gap: 5px; }
  .emp-field label { font-size: 11.5px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: .03em; }
  .emp-input { border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; font-size: 14px; outline: none; }
  .emp-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px #dbeafe; }
  .emp-role-select { display: flex; gap: 8px; }
  .emp-role-opt { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1.5px solid #e2e8f0; background: #f8fafc; border-radius: 9px; padding: 9px; font-size: 13px; font-weight: 600; color: #64748b; cursor: pointer; }
  .emp-role-opt.active { border-color: #2563eb; background: #eff6ff; color: #2563eb; }
  .emp-form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }

  .emp-qr-body { padding: 20px 22px 24px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
  .emp-qr-box { width: 160px; height: 160px; border: 2px dashed #e2e8f0; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; margin-top: 6px; }
  .emp-qr-token { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #64748b; background: #f1f5f9; padding: 5px 10px; border-radius: 6px; }
  .emp-qr-hint { font-size: 12px; color: #94a3b8; max-width: 320px; }

  .emp-toast { position: fixed; bottom: 26px; right: 26px; z-index: 2000; background: #0f172a; color: #fff; padding: 13px 16px; border-radius: 12px; font-size: 13.5px; font-weight: 600; display: flex; align-items: center; gap: 9px; box-shadow: 0 12px 36px rgba(0,0,0,.18); }
  .emp-toast-error { background: #dc2626; }
  .emp-toast button { background: none; border: none; color: rgba(255,255,255,.7); cursor: pointer; margin-left: 6px; }
  .emp-spin { animation: empSpin .7s linear infinite; }
  @keyframes empSpin { to { transform: rotate(360deg); } }

  @media (max-width: 640px) {
    .emp-form-row { grid-template-columns: 1fr; }
    .emp-page { padding: 16px; }
  }
`;