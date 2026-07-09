import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Plus, UserCheck, UserX, RefreshCw, X, QrCode, Search, Users, Download, Pencil, Eye, EyeOff, AlertOctagon } from 'lucide-react';
import Pagination from '../../components/shared/Pagination';

const PENALTY_ROLES = ['PICKER', 'MARKER', 'CHECKER'];

const ROLES = [
  { value: 'OPERATOR', label: 'Operator' },
  { value: 'PICKER', label: 'Picker' },
  { value: 'MARKER', label: 'Marker' },
  { value: 'CHECKER', label: 'Checker' },
  { value: 'DRIVER', label: 'Haydovchi' },
  { value: 'ACCOUNTANT1', label: 'Hisobchi 1' },
  { value: 'ACCOUNTANT2', label: 'Hisobchi 2' },
  { value: 'DOCUMENT', label: 'Hujjatchi' },
  { value: 'ADMIN', label: 'Admin' },
];

const QR_ROLES = ['PICKER', 'MARKER', 'CHECKER'];

const ROLE_COLORS = {
  OPERATOR: 'bg-cyan-100 text-cyan-700',
  PICKER: 'bg-blue-100 text-blue-700',
  MARKER: 'bg-purple-100 text-purple-700',
  CHECKER: 'bg-amber-100 text-amber-700',
  DRIVER: 'bg-orange-100 text-orange-700',
  ACCOUNTANT1: 'bg-green-100 text-green-700',
  ACCOUNTANT2: 'bg-teal-100 text-teal-700',
  DOCUMENT: 'bg-indigo-100 text-indigo-700',
  ADMIN: 'bg-gray-100 text-gray-700',
  SUPER_ADMIN: 'bg-red-100 text-red-700',
};

function UserModal({ user, onClose }) {
  const isEdit = !!user;
  const qc = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone:    user?.phone    || '',
    password: '',
    role:     user?.role     || 'PICKER',
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (isEdit) {
        const data = { fullName: form.fullName, phone: form.phone };
        if (form.password) data.password = form.password;
        return userAPI.update(user.id, data);
      }
      return userAPI.create(form);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Xodim ma'lumotlari yangilandi!" : 'Xodim qo\'shildi!');
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const canSubmit = form.fullName.trim() && form.phone.trim() && (isEdit || form.password.trim());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-semibold text-lg">{isEdit ? 'Xodimni tahrirlash' : "Yangi xodim qo'shish"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">To'liq ism *</label>
            <input className="input" placeholder="Alisher Qodirov" value={form.fullName} onChange={set('fullName')} />
          </div>
          <div>
            <label className="label">Telefon *</label>
            <input className="input" placeholder="+998901234567" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="label">
              Parol {isEdit ? <span className="text-gray-400 font-normal">(o'zgartirmasangiz bo'sh qoldiring)</span> : '*'}
            </label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPassword ? 'text' : 'password'}
                placeholder={isEdit ? 'Yangi parol' : '••••••••'}
                value={form.password}
                onChange={set('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {!isEdit && (
            <div>
              <label className="label">Lavozim *</label>
              <select className="input" value={form.role} onChange={set('role')}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          )}
          {isEdit && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              Saqlagandan so'ng xodim keyingi safar tizimga aynan shu yangilangan telefon/parol bilan kirib, o'z paneliga o'tadi.
            </p>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !canSubmit} className="btn-primary flex-1 disabled:opacity-50">
            {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

function QrModal({ user, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">{user.fullName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        {user.qrCodeImage ? (
          <>
            <img src={user.qrCodeImage} alt="QR kod" className="w-56 h-56 mx-auto rounded-xl border border-gray-100" />
            <a
              href={user.qrCodeImage}
              download={`${user.fullName}-qr.png`}
              className="mt-4 inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-bold transition-colors"
            >
              <Download size={14} /> Yuklab olish
            </a>
          </>
        ) : (
          <p className="text-gray-400 text-sm py-8">QR kod hali yaratilmagan</p>
        )}
      </div>
    </div>
  );
}

function PenaltiesModal({ user, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-penalties', user.id],
    queryFn: () => userAPI.getPenalties(user.id),
    select: r => r.data,
  });

  const penalties = data?.data || [];
  const total = data?.total ?? 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div>
            <h2 className="font-semibold text-lg">{user.fullName}</h2>
            <p className="text-xs text-red-500 font-bold mt-0.5">Jami: {total} jarima bali</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : penalties.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-10">Jarima yo'q</p>
          ) : (
            penalties.map(p => (
              <div key={p.id} className="p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-red-600">-{p.points} ball</span>
                  <span className="text-[11px] text-gray-400">{format(new Date(p.createdAt), 'dd.MM.yyyy HH:mm')}</span>
                </div>
                <p className="text-sm text-gray-800 font-medium break-words">{p.reason}</p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                  {p.order?.invoiceNumber && <span>Buyurtma: {p.order.invoiceNumber}</span>}
                  {p.triggeredBy?.fullName && <span>· Kim berdi: {p.triggeredBy.fullName}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [qrUser, setQrUser] = useState(null);
  const [penaltyUser, setPenaltyUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['users', roleFilter, search, page],
    queryFn: () => userAPI.getAll({ role: roleFilter || undefined, search: search || undefined, page, limit }),
    select: r => r.data,
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => userAPI.toggleActive(id),
    onSuccess: () => { toast.success('Holat o\'zgartirildi!'); qc.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const qrMutation = useMutation({
    mutationFn: (id) => userAPI.regenerateQr(id),
    onSuccess: () => {
      toast.success('QR yangilandi!');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const users = data?.data || [];
  const pagination = data?.pagination || {};
  const activeCount = users.filter(u => u.isActive).length;
  const blockedCount = users.filter(u => !u.isActive).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Users size={18} className="text-blue-600" />
          </div>
          Xodimlar
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200 hover:shadow-lg transition-all"
        >
          <Plus size={16} strokeWidth={2.5} /> Xodim qo'shish
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Sahifadagilar', value: pagination.total ?? users.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Faol', value: activeCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Bloklangan', value: blockedCount, color: 'text-red-500', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + role filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Ism yoki telefon bo'yicha qidirish..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-400 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setRoleFilter(''); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${!roleFilter ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'}`}
          >
            Barchasi
          </button>
          {ROLES.map(r => (
            <button
              key={r.value}
              onClick={() => { setRoleFilter(r.value); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${roleFilter === r.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-6 py-3">Xodim</th>
                <th className="px-6 py-3">Telefon</th>
                <th className="px-6 py-3">Lavozim</th>
                <th className="px-6 py-3">Holat</th>
                <th className="px-6 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Xodimlar topilmadi</td></tr>
              )}
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                        {u.fullName?.charAt(0)}
                      </div>
                      <span className="font-medium text-sm">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{u.phone}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-700'}`}>
                      {ROLES.find(r => r.value === u.role)?.label || u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                      {u.isActive ? 'Faol' : 'Bloklangan'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <Pencil size={12} /> Tahrirlash
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(u.id)}
                        disabled={toggleMutation.isPending}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {u.isActive ? 'Bloklash' : 'Faollashtirish'}
                      </button>
                      {QR_ROLES.includes(u.role) && (
                        <>
                          <button
                            onClick={() => setQrUser(u)}
                            title="QR ko'rish"
                            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1"
                          >
                            <QrCode size={12} /> Ko'rish
                          </button>
                          <button
                            onClick={() => qrMutation.mutate(u.id)}
                            disabled={qrMutation.isPending}
                            title="QR yangilash"
                            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1"
                          >
                            <RefreshCw size={12} /> Yangilash
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={pagination.page || page}
            pages={pagination.pages || 1}
            total={pagination.total}
            onChange={setPage}
          />
        </div>
      )}

      {showModal && <UserModal onClose={() => setShowModal(false)} />}
      {editingUser && <UserModal user={editingUser} onClose={() => setEditingUser(null)} />}
      {qrUser && <QrModal user={qrUser} onClose={() => setQrUser(null)} />}
    </div>
  );
}
