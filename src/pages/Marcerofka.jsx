import { useState, useRef, useEffect, useCallback } from "react";

const API = "/api/v1";

// ─── API helper ───────────────────────────────────────────
async function apiFetch(path, opts = {}) {
  try {
    const r = await fetch(API + path, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(text);
    }
    if (r.status === 204) return { ok: true };
    return r.json();
  } catch (e) {
    console.error("API error:", e);
    return null;
  }
}

// ─── Toast ────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`mk-toast mk-toast--${type}`}>
      <span className="mk-toast__icon">
        {type === "success" ? "✓" : "⚠"}
      </span>
      <span>{msg}</span>
      <button className="mk-toast__close" onClick={onClose}>✕</button>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="mk-overlay" onClick={onClose}>
      <div
        className={`mk-modal${wide ? " mk-modal--wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mk-modal__header">
          <h2 className="mk-modal__title">{title}</h2>
          <button className="mk-modal__close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── CopyButton ───────────────────────────────────────────
function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      className={`mk-copy-btn${copied ? " mk-copy-btn--copied" : ""}`}
      onClick={copy}
      title="Nusxa olish"
    >
      {copied ? "✓" : "⎘"}
    </button>
  );
}

// ─── Import Form ──────────────────────────────────────────
function ImportForm({ onSave, onCancel, saving }) {
  const [batchId, setBatchId] = useState("");
  const [codes, setCodes] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    const id = parseInt(batchId);
    if (!id || id < 1) return setErr("Batch ID kiritilishi shart");
    const list = codes.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!list.length) return setErr("Kamida bitta kod kiritilishi shart");
    setErr("");
    onSave({ batchId: id, codes: list });
  };

  return (
    <div className="mk-form-body">
      {err && (
        <div className="mk-form-error">
          <span>⚠</span> {err}
        </div>
      )}
      <div className="mk-warn-box">
        ℹ Import orqali ko'plab kodlarni bir vaqtda qo'shish mumkin
      </div>
      <div className="mk-section-label">Batch ma'lumotlari</div>
      <div className="mk-field">
        <label className="mk-field__label">
          Batch ID <span className="mk-req">*</span>
        </label>
        <input
          className="mk-input"
          type="number"
          min="1"
          value={batchId}
          onChange={(e) => setBatchId(e.target.value)}
          placeholder="1"
          autoFocus
        />
      </div>
      <div className="mk-section-label">Marking kodlari</div>
      <div className="mk-field">
        <label className="mk-field__label">
          Kodlar <span className="mk-req">*</span>
        </label>
        <textarea
          className="mk-input mk-input--mono"
          rows={6}
          value={codes}
          onChange={(e) => setCodes(e.target.value)}
          placeholder={"Har bir qatorga bitta kod:\n010046073245681121Kl7HEV...\n010046073245681122AbCdEf..."}
        />
        <p className="mk-field__hint">Har bir qatorga bitta marking kodi yozing</p>
      </div>
      <div className="mk-form-actions">
        <button className="mk-btn" type="button" onClick={onCancel}>
          Bekor qilish
        </button>
        <button
          className="mk-btn mk-btn--primary"
          type="button"
          onClick={submit}
          disabled={saving}
        >
          {saving ? "Saqlanmoqda…" : "⬆ Import qilish"}
        </button>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────
function DetailModal({ item, onClose, onMarkUsed, onMarkAvail, onDelete }) {
  const used = item.isUsed;
  const created = new Date(item.createdAt).toLocaleString("uz-UZ");
  const usedDate = item.usedAt
    ? new Date(item.usedAt).toLocaleString("uz-UZ")
    : "—";

  return (
    <Modal title="Marking Code" onClose={onClose} wide>
      <div className="mk-form-body">
        <div className="mk-detail-strip">
          <span className="mk-detail-strip__name">
            {item.batch?.product?.name || "—"}
          </span>
          {item.batch?.product?.ikpuCode && (
            <span className="mk-badge mk-badge--blue mk-badge--mono">
              {item.batch.product.ikpuCode}
            </span>
          )}
          <span className={`mk-badge mk-badge--${used ? "green" : "amber"}`}>
            {used ? "Ishlatilgan" : "Mavjud"}
          </span>
        </div>

        <div className="mk-section-label">Marking kodi (DataMatrix)</div>
        <div className="mk-code-box">
          <span className="mk-code-box__icon">▣</span>
          <span className="mk-code-box__text">{item.markingCode}</span>
          <CopyButton value={item.markingCode} />
        </div>

        <div className="mk-section-label">Batch ma'lumotlari</div>
        <div className="mk-detail-row">
          <div className="mk-detail-item">
            <div className="mk-detail-lbl">Batch ID</div>
            <div className="mk-detail-val">#{item.batch?.id || "—"}</div>
          </div>
          <div className="mk-detail-item">
            <div className="mk-detail-lbl">Seriya</div>
            <div className="mk-detail-val">{item.batch?.series || "—"}</div>
          </div>
          {item.batch?.contract && (
            <div className="mk-detail-item">
              <div className="mk-detail-lbl">Shartnoma</div>
              <div className="mk-detail-val">
                {item.batch.contract.contractNumber}
              </div>
            </div>
          )}
          {item.batch?.invoice && (
            <div className="mk-detail-item">
              <div className="mk-detail-lbl">Hisob-faktura</div>
              <div className="mk-detail-val">
                {item.batch.invoice.invoiceNumber}
              </div>
            </div>
          )}
        </div>

        <div className="mk-section-label">Vaqt ma'lumotlari</div>
        <div className="mk-detail-row">
          <div className="mk-detail-item">
            <div className="mk-detail-lbl">Qo'shilgan</div>
            <div className="mk-detail-val mk-detail-val--normal">{created}</div>
          </div>
          {used && (
            <div className="mk-detail-item">
              <div className="mk-detail-lbl">Ishlatilgan</div>
              <div className="mk-detail-val mk-detail-val--normal">
                {usedDate}
              </div>
            </div>
          )}
        </div>

        <div className="mk-form-actions" style={{ marginTop: 8 }}>
          {!used ? (
            <button
              className="mk-btn mk-btn--primary"
              onClick={() => { onMarkUsed(item.id); onClose(); }}
            >
              ✓ Ishlatilgan deb belgilash
            </button>
          ) : (
            <button
              className="mk-btn"
              onClick={() => { onMarkAvail(item.id); onClose(); }}
            >
              ↺ Qaytarish
            </button>
          )}
          <button
            className="mk-btn mk-btn--danger"
            onClick={() => { onDelete(item.id); onClose(); }}
          >
            🗑 O'chirish
          </button>
          <button className="mk-btn" onClick={onClose}>
            Yopish
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Pagination ───────────────────────────────────────────
function Pagination({ meta, onPage }) {
  const { page, totalPages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const maxB = 5, half = Math.floor(maxB / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(totalPages, start + maxB - 1);
  if (end - start < maxB - 1) start = Math.max(1, end - maxB + 1);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="mk-pagination">
      <span className="mk-pagination__info">
        {total} ta natijadan {from}–{to}
      </span>
      <div className="mk-pagination__btns">
        <button
          className="mk-page-btn"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
        >
          ‹
        </button>
        {start > 1 && (
          <>
            <button className="mk-page-btn" onClick={() => onPage(1)}>1</button>
            {start > 2 && <span className="mk-page-ellipsis">…</span>}
          </>
        )}
        {pages.map((p) => (
          <button
            key={p}
            className={`mk-page-btn${p === page ? " mk-page-btn--active" : ""}`}
            onClick={() => onPage(p)}
          >
            {p}
          </button>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="mk-page-ellipsis">…</span>}
            <button className="mk-page-btn" onClick={() => onPage(totalPages)}>
              {totalPages}
            </button>
          </>
        )}
        <button
          className="mk-page-btn"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
        >
          ›
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export const Markirovka = () => {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, used: 0, available: 0 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const fileRef = useRef();
  const searchTimer = useRef();

  const showToast = (msg, type = "success") => setToast({ msg, type });

  // ── fetch list ──
  const loadData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: meta.limit });
    if (search) params.set("search", search);
    if (filter === "used") params.set("isUsed", "true");
    if (filter === "available") params.set("isUsed", "false");

    const res = await apiFetch("/marking-codes?" + params.toString());
    setLoading(false);
    if (res && res.data) {
      setItems(res.data);
      if (res.meta) setMeta(res.meta);
    }
  }, [page, search, filter, meta.limit]);

  // ── fetch stats ──
  const loadStats = useCallback(async () => {
    // Stats endpoint requires batchId — use general list counts instead
    const res = await apiFetch("/marking-codes?limit=1");
    if (res && res.meta) {
      const [usedRes, availRes] = await Promise.all([
        apiFetch("/marking-codes?isUsed=true&limit=1"),
        apiFetch("/marking-codes?isUsed=false&limit=1"),
      ]);
      setStats({
        total: res.meta.total,
        used: usedRes?.meta?.total ?? 0,
        available: availRes?.meta?.total ?? 0,
      });
    }
  }, []);

  useEffect(() => { loadData(); loadStats(); }, [loadData, loadStats]);

  // ── search debounce ──
  const handleSearch = (v) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); }, 100);
  };

  // ── import ──
  const handleImport = async (data) => {
    setSaving(true);
    const res = await apiFetch("/marking-codes/import", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res && res.data) {
      showToast(
        `${res.data.imported} ta kod import qilindi` +
          (res.data.skipped ? ` (${res.data.skipped} ta takroriy)` : "")
      );
      setAddModal(false);
      loadData();
      loadStats();
    } else {
      showToast("Import muvaffaqiyatsiz — server bilan bog'lanib bo'lmadi", "error");
    }
  };

  // ── mark used ──
  const handleMarkUsed = async (id) => {
    const res = await apiFetch(`/marking-codes/${id}/use`, { method: "PATCH" });
    if (res) {
      showToast("Ishlatilgan deb belgilandi");
      loadData();
      loadStats();
    } else {
      showToast("Xatolik yuz berdi", "error");
    }
  };

  // ── mark available ──
  const handleMarkAvail = async (id) => {
    const res = await apiFetch(`/marking-codes/${id}/release`, { method: "PATCH" });
    if (res) {
      showToast("Kod qayta faol qilindi");
      loadData();
      loadStats();
    } else {
      showToast("Xatolik yuz berdi", "error");
    }
  };

  // ── delete ──
  const handleDelete = async (id) => {
    if (!window.confirm("Bu marking kodini o'chirishni tasdiqlaysizmi?")) return;
    const res = await apiFetch(`/marking-codes/${id}`, { method: "DELETE" });
    if (res !== null) {
      showToast("Kod o'chirildi");
      loadData();
      loadStats();
    } else {
      showToast("O'chirib bo'lmadi", "error");
    }
  };

  // ── CSV import file ──
  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = ev.target.result.split("\n").filter(Boolean).slice(1);
      const codes = [];
      let batchId = null;
      lines.forEach((line) => {
        const cols = line.split(",").map((c) => c.replace(/^"|"$/g, "").trim());
        if (cols[0]) codes.push(cols[0]);
      });
      if (!batchId) {
        showToast("CSV import: batchId aniqlanmadi — manual import ishlating", "error");
        return;
      }
      if (codes.length) handleImport({ batchId, codes });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ── CSV export ──
  const handleExport = async () => {
    // Export current batch if batchId known — otherwise export visible items
    const rows = [
      ["marking_code", "is_used", "used_at", "created_at", "batch_series", "product_name", "ikpu_code"],
      ...items.map((m) => [
        m.markingCode,
        m.isUsed ? "true" : "false",
        m.usedAt || "",
        m.createdAt,
        m.batch?.series || "",
        m.batch?.product?.name || "",
        m.batch?.product?.ikpuCode || "",
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marking-codes.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV export tayyor");
  };

  const statCards = [
    { key: "all",       label: "Jami",       val: stats.total,     color: "blue"  },
    { key: "used",      label: "Ishlatilgan", val: stats.used,      color: "green" },
    { key: "available", label: "Mavjud",      val: stats.available, color: "amber" },
  ];

  return (
    <>
      <style>{STYLES}</style>

      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.txt"
        style={{ display: "none" }}
        onChange={handleFileImport}
      />

      <div className="mk-page">
        {/* Header */}
        <div className="mk-page-header">
          <div className="mk-header-left">
            <h1 className="mk-title">▣ Marking Codes</h1>
            <p className="mk-subtitle">Barcha markirovka kodlarini boshqarish</p>
          </div>
          <div className="mk-header-actions">
            <button className="mk-btn" onClick={() => fileRef.current?.click()}>
              ⬆ Import CSV
            </button>
            <button className="mk-btn" onClick={handleExport}>
              ⬇ Export CSV
            </button>
            <button className="mk-btn mk-btn--primary" onClick={() => setAddModal(true)}>
              + Qo'shish
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mk-stats-grid">
          {statCards.map(({ key, label, val, color }) => (
            <div
              key={key}
              className={`mk-stat-card${filter === key ? " mk-stat-card--active" : ""}`}
              onClick={() => { setFilter(key); setPage(1); }}
            >
              <div className={`mk-stat-icon mk-stat-icon--${color}`}>
                {key === "all" ? "⊞" : key === "used" ? "✓" : "◷"}
              </div>
              <div>
                <div className="mk-stat-val">{val}</div>
                <div className="mk-stat-lbl">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mk-toolbar">
          <div className="mk-search-box">
            <span className="mk-search-icon">⌕</span>
            <input
              className="mk-search-input"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Marking code, mahsulot, seriya bo'yicha qidirish…"
            />
            {search && (
              <button
                className="mk-search-clear"
                onClick={() => { setSearch(""); setPage(1); }}
              >
                ✕
              </button>
            )}
          </div>
          <div className="mk-filter-tabs">
            {[
              ["all", "Barchasi"],
              ["available", "Mavjud"],
              ["used", "Ishlatilgan"],
            ].map(([v, l]) => (
              <button
                key={v}
                className={`mk-ftab${filter === v ? " mk-ftab--active" : ""}`}
                onClick={() => { setFilter(v); setPage(1); }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mk-table-card">
          {loading ? (
            <div className="mk-loading">
              <div className="mk-spinner" /> Yuklanmoqda…
            </div>
          ) : items.length === 0 ? (
            <div className="mk-empty">
              <div className="mk-empty__icon">▣</div>
              <p>Hech qanday marking code topilmadi</p>
              <div style={{ display: "flex", gap: 8 }}>
                {search || filter !== "all" ? (
                  <button className="mk-btn" onClick={() => { setSearch(""); setFilter("all"); setPage(1); }}>
                    Tozalash
                  </button>
                ) : (
                  <button className="mk-btn mk-btn--primary" onClick={() => setAddModal(true)}>
                    + Qo'shish
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="mk-table-scroll">
                <table className="mk-table">
                  <thead>
                    <tr>
                      <th>Mahsulot</th>
                      <th>Marking Code</th>
                      <th>Seriya</th>
                      <th>Holat</th>
                      <th>Qo'shilgan</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="mk-prod-name">
                            {m.batch?.product?.name || "—"}
                          </div>
                          <div className="mk-prod-sub">
                            {m.batch?.product?.ikpuCode && (
                              <span className="mk-badge mk-badge--blue mk-badge--mono">
                                {m.batch.product.ikpuCode}
                              </span>
                            )}
                            {m.batch?.contract?.contractNumber && (
                              <span className="mk-badge mk-badge--purple">
                                {m.batch.contract.contractNumber}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="mk-mc-cell">
                            <span className="mk-mc-code" title={m.markingCode}>
                              {m.markingCode.length > 26
                                ? m.markingCode.slice(0, 26) + "…"
                                : m.markingCode}
                            </span>
                            <CopyButton value={m.markingCode} />
                          </div>
                        </td>
                        <td>
                          <span className="mk-badge mk-badge--purple mk-badge--mono">
                            {m.batch?.series || "—"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`mk-badge mk-badge--${m.isUsed ? "green" : "amber"}`}
                          >
                            {m.isUsed ? "✓ Ishlatilgan" : "◷ Mavjud"}
                          </span>
                        </td>
                        <td className="mk-date-col">
                          {new Date(m.createdAt).toLocaleDateString("uz-UZ")}
                        </td>
                        <td>
                          <div className="mk-row-actions">
                            <button
                              className="mk-icon-btn mk-icon-btn--view"
                              onClick={() => setViewItem(m)}
                              title="Ko'rish"
                            >
                              👁
                            </button>
                            {!m.isUsed ? (
                              <button
                                className="mk-icon-btn mk-icon-btn--edit"
                                onClick={() => handleMarkUsed(m.id)}
                                title="Ishlatilgan deb belgilash"
                              >
                                ✓
                              </button>
                            ) : (
                              <button
                                className="mk-icon-btn mk-icon-btn--release"
                                onClick={() => handleMarkAvail(m.id)}
                                title="Qaytarish"
                              >
                                ↺
                              </button>
                            )}
                            <button
                              className="mk-icon-btn mk-icon-btn--del"
                              onClick={() => handleDelete(m.id)}
                              title="O'chirish"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination meta={meta} onPage={(p) => setPage(p)} />
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {addModal && (
        <Modal title="Yangi marking kodlari qo'shish" onClose={() => setAddModal(false)} wide>
          <ImportForm
            onSave={handleImport}
            onCancel={() => setAddModal(false)}
            saving={saving}
          />
        </Modal>
      )}

      {/* Detail Modal */}
      {viewItem && (
        <DetailModal
          item={viewItem}
          onClose={() => setViewItem(null)}
          onMarkUsed={handleMarkUsed}
          onMarkAvail={handleMarkAvail}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};

// ─── Styles ───────────────────────────────────────────────
const STYLES = `
  .mk-page { padding: 32px 28px; font-family: 'Inter', system-ui, sans-serif; color: #0f172a; background: #f6f8fc; min-height: 100vh; }
  .mk-page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
  .mk-title { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; letter-spacing: -0.3px; color: #0f172a; }
  .mk-subtitle { font-size: 13px; color: #94a3b8; margin-top: 4px; }
  .mk-header-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  .mk-btn { display: inline-flex; align-items: center; gap: 6px; background: #fff; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 10px 16px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background .15s; white-space: nowrap; }
  .mk-btn:hover:not(:disabled) { background: #f8fafc; }
  .mk-btn:disabled { opacity: .5; cursor: not-allowed; }
  .mk-btn--primary { background: #d97706; color: #fff; border-color: #d97706; }
  .mk-btn--primary:hover:not(:disabled) { background: #b45309; border-color: #b45309; }
  .mk-btn--danger { background: #dc2626; color: #fff; border-color: #dc2626; }
  .mk-btn--danger:hover:not(:disabled) { background: #b91c1c; }

  .mk-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; margin-bottom: 16px; }
  .mk-stat-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; cursor: pointer; transition: border-color .15s; }
  .mk-stat-card:hover, .mk-stat-card--active { border-color: #d97706; }
  .mk-stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
  .mk-stat-icon--blue   { background: #eff6ff; color: #2563eb; }
  .mk-stat-icon--green  { background: #dcfce7; color: #16a34a; }
  .mk-stat-icon--amber  { background: #fef9c3; color: #b45309; }
  .mk-stat-val { font-size: 22px; font-weight: 700; line-height: 1; color: #0f172a; }
  .mk-stat-lbl { font-size: 12px; color: #94a3b8; margin-top: 3px; }

  .mk-toolbar { display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
  .mk-search-box { display: flex; align-items: center; background: #fff; border: 2px solid #d97706; border-radius: 10px; flex: 1; min-width: 200px; transition: box-shadow .15s; }
  .mk-search-box:focus-within { box-shadow: 0 0 0 3px #fef9c3; }
  .mk-search-icon { margin-left: 13px; color: #d97706; font-size: 18px; }
  .mk-search-input { flex: 1; border: none; outline: none; padding: 10px 10px; font-size: 13px; background: transparent; color: #0f172a; }
  .mk-search-input::placeholder { color: #fbbf24; }
  .mk-search-clear { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0 12px; font-size: 14px; }
  .mk-filter-tabs { display: flex; gap: 4px; background: #f1f5f9; border-radius: 10px; padding: 4px; }
  .mk-ftab { border: none; background: none; padding: 7px 14px; border-radius: 7px; font-size: 13px; font-weight: 500; cursor: pointer; color: #64748b; white-space: nowrap; transition: all .15s; }
  .mk-ftab--active { background: #fff; color: #d97706; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.08); }

  .mk-table-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
  .mk-table-scroll { overflow-x: auto; }
  .mk-table { width: 100%; border-collapse: collapse; min-width: 820px; }
  .mk-table thead tr { background: #fffbeb; border-bottom: 1.5px solid #fde68a; }
  .mk-table th { padding: 11px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #92400e; text-align: left; white-space: nowrap; }
  .mk-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background .1s; }
  .mk-table tbody tr:last-child { border-bottom: none; }
  .mk-table tbody tr:hover { background: #fffbeb; }
  .mk-table td { padding: 11px 16px; font-size: 13px; color: #334155; vertical-align: middle; }

  .mk-prod-name { font-weight: 600; font-size: 13px; color: #0f172a; }
  .mk-prod-sub { display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; }

  .mk-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; padding: 3px 8px; border-radius: 20px; font-weight: 600; white-space: nowrap; }
  .mk-badge--green  { background: #dcfce7; color: #15803d; }
  .mk-badge--amber  { background: #fef3c7; color: #b45309; }
  .mk-badge--red    { background: #fee2e2; color: #b91c1c; }
  .mk-badge--gray   { background: #f1f5f9; color: #64748b; }
  .mk-badge--blue   { background: #eff6ff; color: #1d4ed8; }
  .mk-badge--purple { background: #f5f3ff; color: #6d28d9; }
  .mk-badge--mono   { font-family: monospace; }

  .mk-mc-cell { display: flex; align-items: center; gap: 6px; }
  .mk-mc-code { font-family: monospace; font-size: 11px; color: #475569; background: #f8fafc; padding: 3px 7px; border-radius: 5px; border: 1px solid #e2e8f0; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .mk-copy-btn { background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 5px; padding: 3px 6px; cursor: pointer; color: #64748b; font-size: 13px; transition: all .15s; }
  .mk-copy-btn:hover { background: #e2e8f0; }
  .mk-copy-btn--copied { background: #dcfce7; border-color: #86efac; color: #16a34a; }

  .mk-date-col { color: #64748b; font-size: 12px; white-space: nowrap; }
  .mk-row-actions { display: flex; gap: 5px; }
  .mk-icon-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all .15s; font-size: 13px; }
  .mk-icon-btn--view:hover    { background: #fffbeb; border-color: #d97706; }
  .mk-icon-btn--edit:hover    { background: #dcfce7; border-color: #86efac; color: #16a34a; }
  .mk-icon-btn--release:hover { background: #fef9c3; border-color: #fde68a; }
  .mk-icon-btn--del:hover     { background: #fef2f2; border-color: #fca5a5; }

  .mk-loading { display: flex; align-items: center; gap: 10px; color: #94a3b8; padding: 48px; justify-content: center; font-size: 14px; }
  .mk-spinner { width: 20px; height: 20px; border: 2px solid #e2e8f0; border-top-color: #d97706; border-radius: 50%; animation: mk-spin .6s linear infinite; }
  @keyframes mk-spin { to { transform: rotate(360deg); } }

  .mk-empty { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 64px 24px; color: #94a3b8; text-align: center; }
  .mk-empty__icon { font-size: 40px; opacity: .3; }

  .mk-pagination { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; gap: 8px; }
  .mk-pagination__info { font-size: 12px; color: #94a3b8; }
  .mk-pagination__btns { display: flex; gap: 4px; align-items: center; }
  .mk-page-btn { border: 1px solid #e2e8f0; background: #fff; border-radius: 6px; padding: 5px 10px; font-size: 12px; cursor: pointer; color: #334155; transition: all .15s; min-width: 32px; }
  .mk-page-btn:hover:not(:disabled) { background: #f8fafc; }
  .mk-page-btn--active { background: #d97706; color: #fff; border-color: #d97706; }
  .mk-page-btn:disabled { opacity: .4; cursor: not-allowed; }
  .mk-page-ellipsis { padding: 0 4px; color: #94a3b8; }

  .mk-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.55); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); padding: 20px; }
  .mk-modal { background: #fff; border-radius: 18px; width: 100%; max-width: 520px; box-shadow: 0 32px 80px rgba(0,0,0,.2); animation: mk-pop .18s ease; max-height: 90vh; overflow-y: auto; }
  .mk-modal--wide { max-width: 660px; }
  @keyframes mk-pop { from { opacity: 0; transform: scale(.94) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  .mk-modal__header { display: flex; justify-content: space-between; align-items: center; padding: 20px 22px 0; position: sticky; top: 0; background: #fff; z-index: 1; }
  .mk-modal__title { font-size: 16px; font-weight: 700; color: #0f172a; }
  .mk-modal__close { background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; font-size: 16px; }
  .mk-modal__close:hover { background: #e2e8f0; }

  .mk-form-body { padding: 18px 22px 22px; display: flex; flex-direction: column; gap: 14px; }
  .mk-form-error { display: flex; align-items: center; gap: 8px; background: #fef2f2; color: #dc2626; font-size: 13px; padding: 10px 14px; border-radius: 9px; border: 1px solid #fecaca; }
  .mk-warn-box { background: #fffbeb; border: 1px solid #fde68a; border-radius: 9px; padding: 10px 14px; font-size: 13px; color: #92400e; }
  .mk-section-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: .07em; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
  .mk-field { display: flex; flex-direction: column; gap: 5px; }
  .mk-field__label { font-size: 12px; font-weight: 600; color: #475569; }
  .mk-field__hint { font-size: 11px; color: #94a3b8; }
  .mk-req { color: #ef4444; }
  .mk-input { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 9px; padding: 10px 12px; font-size: 13px; outline: none; color: #0f172a; background: #fff; transition: border-color .15s, box-shadow .15s; font-family: inherit; }
  .mk-input:focus { border-color: #d97706; box-shadow: 0 0 0 3px #fef9c3; }
  .mk-input::placeholder { color: #cbd5e1; }
  .mk-input--mono { font-family: monospace; font-size: 12px; resize: vertical; min-height: 100px; }
  .mk-form-actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 4px; }

  .mk-detail-strip { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 10px 14px; }
  .mk-detail-strip__name { font-weight: 700; font-size: 14px; color: #0f172a; flex: 1; }
  .mk-code-box { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 13px; display: flex; gap: 10px; align-items: flex-start; }
  .mk-code-box__icon { color: #d97706; font-size: 22px; flex-shrink: 0; }
  .mk-code-box__text { font-family: monospace; font-size: 12px; word-break: break-all; line-height: 1.6; flex: 1; color: #0f172a; }
  .mk-detail-row { display: flex; gap: 14px; flex-wrap: wrap; }
  .mk-detail-item { flex: 1; min-width: 110px; }
  .mk-detail-lbl { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 3px; }
  .mk-detail-val { font-size: 13px; font-weight: 600; font-family: monospace; color: #0f172a; }
  .mk-detail-val--normal { font-family: inherit; }

  .mk-toast { position: fixed; bottom: 24px; right: 24px; z-index: 2000; padding: 13px 18px; border-radius: 12px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 10px; box-shadow: 0 12px 40px rgba(0,0,0,.18); animation: mk-slide .22s ease; max-width: 340px; }
  .mk-toast--success { background: #0f172a; color: #fff; }
  .mk-toast--error   { background: #dc2626; color: #fff; }
  .mk-toast__icon { font-size: 16px; }
  .mk-toast__close { background: none; border: none; cursor: pointer; color: rgba(255,255,255,.7); margin-left: auto; font-size: 14px; }
  @keyframes mk-slide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 640px) {
    .mk-page { padding: 20px 14px; }
    .mk-stats-grid { grid-template-columns: 1fr 1fr; }
    .mk-toolbar { flex-direction: column; }
    .mk-header-actions { flex-direction: column; }
  }
`;

export default Markirovka;