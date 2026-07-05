import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../../api';
import toast from 'react-hot-toast';
import { UserCog, Plus, X, UserCheck, UserX, Search, Pencil } from 'lucide-react';
import Pagination from '../../components/shared/Pagination';

function AdminModal({ admin, onClose }) {
  const isEdit = !!admin;
  const qc = useQueryClient();
  const [form, setForm] = useState({
    fullName: admin?.fullName || '',
    phone: admin?.phone || '',
    password: '',
  });

  const mutation = useMutation({
    mutationFn: () => {
      if (isEdit) {
        const data = { fullName: form.fullName, phone: form.phone };
        if (form.password) data.password = form.password;
        return userAPI.update(admin.id, data);
      }
      return userAPI.create({ ...form, role: 'ADMIN' });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Admin ma'lumotlari yangilandi!" : "Admin qo'shildi!");
      qc.invalidateQueries({ queryKey: ['admins'] });
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const canSubmit = form.fullName.trim() && form.phone.trim() && (isEdit || form.password.trim());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-black text-gray-900">{isEdit ? 'Adminni tahrirlash' : "Yangi admin qo'shish"}</h2>
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
            <input
              className="input"
              type="password"
              placeholder={isEdit ? "Yangi parol" : '••••••••'}
              value={form.password}
              onChange={set('password')}
            />
          </div>
          {isEdit && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
              Saqlagandan so'ng admin keyingi safar tizimga aynan shu yangilangan telefon/parol bilan kiradi.
            </p>
          )}
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !canSubmit} className="btn-primary flex-1 disabled:opacity-50">
            {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminAdminsPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['admins', search, page],
    queryFn: () => userAPI.getAll({ role: 'ADMIN', search: search || undefined, page, limit }),
    select: (r) => r.data,
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => userAPI.toggleActive(id),
    onSuccess: () => { toast.success('Holat o\'zgartirildi!'); qc.invalidateQueries({ queryKey: ['admins'] }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const admins = data?.data || [];
  const pagination = data?.pagination || {};
  const activeCount = admins.filter((a) => a.isActive).length;
  const blockedCount = admins.filter((a) => !a.isActive).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center">
            <UserCog size={18} className="text-blue-600" />
          </div>
          Adminlar
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200 hover:shadow-lg transition-all"
        >
          <Plus size={16} strokeWidth={2.5} /> Admin qo'shish
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Jami adminlar', value: pagination.total ?? admins.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Faol', value: activeCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Bloklangan', value: blockedCount, color: 'text-red-500', bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Qidiruv */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Ism yoki telefon bo'yicha qidirish..."
          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-400 transition-all"
        />
        {search && (
          <button onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-16 animate-pulse" />)}
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm font-semibold">
            {search ? "Qidiruv bo'yicha admin topilmadi" : "Hali admin qo'shilmagan"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50">
                <th className="px-6 py-3">Admin</th>
                <th className="px-6 py-3">Telefon</th>
                <th className="px-6 py-3">Holat</th>
                <th className="px-6 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                        {a.fullName?.charAt(0)}
                      </div>
                      <span className="font-medium text-sm">{a.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{a.phone}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {a.isActive ? <UserCheck size={12} /> : <UserX size={12} />}
                      {a.isActive ? 'Faol' : 'Bloklangan'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingAdmin(a)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-1"
                      >
                        <Pencil size={12} /> Tahrirlash
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(a.id)}
                        disabled={toggleMutation.isPending}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${a.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {a.isActive ? 'Bloklash' : 'Faollashtirish'}
                      </button>
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

      {showModal && <AdminModal onClose={() => setShowModal(false)} />}
      {editingAdmin && <AdminModal admin={editingAdmin} onClose={() => setEditingAdmin(null)} />}
    </div>
  );
}
