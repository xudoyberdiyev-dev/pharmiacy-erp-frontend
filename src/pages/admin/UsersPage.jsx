import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../../api';
import toast from 'react-hot-toast';
import { Plus, UserCheck, UserX, RefreshCw, X, QrCode } from 'lucide-react';

const ROLES = [
  { value: 'PICKER', label: 'Picker' },
  { value: 'MARKER', label: 'Marker' },
  { value: 'CHECKER', label: 'Checker' },
  { value: 'DRIVER', label: 'Haydovchi' },
  { value: 'ACCOUNTANT', label: 'Bugalter' },
  { value: 'ADMIN', label: 'Admin' },
];

const ROLE_COLORS = {
  PICKER: 'bg-blue-100 text-blue-700',
  MARKER: 'bg-purple-100 text-purple-700',
  CHECKER: 'bg-amber-100 text-amber-700',
  DRIVER: 'bg-orange-100 text-orange-700',
  ACCOUNTANT: 'bg-green-100 text-green-700',
  ADMIN: 'bg-gray-100 text-gray-700',
  SUPER_ADMIN: 'bg-red-100 text-red-700',
};

function UserModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ fullName: '', phone: '', password: '', role: 'PICKER' });

  const mutation = useMutation({
    mutationFn: () => userAPI.create(form),
    onSuccess: () => {
      toast.success('Xodim qo\'shildi!');
      qc.invalidateQueries(['users']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-semibold text-lg">Yangi xodim qo'shish</h2>
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
            <label className="label">Parol *</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
          </div>
          <div>
            <label className="label">Lavozim *</label>
            <select className="input" value={form.role} onChange={set('role')}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="btn-primary flex-1">
            {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: () => userAPI.getAll(roleFilter ? { role: roleFilter } : {}),
    select: r => r.data.data,
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => userAPI.toggleActive(id),
    onSuccess: () => { toast.success('Holat o\'zgartirildi!'); qc.invalidateQueries(['users']); },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const qrMutation = useMutation({
    mutationFn: (id) => userAPI.regenerateQr(id),
    onSuccess: (res) => {
      toast.success('QR yangilandi!');
      qc.invalidateQueries(['users']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato'),
  });

  const users = data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Xodimlar</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Xodim qo'shish
        </button>
      </div>

      {/* Role filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setRoleFilter('')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!roleFilter ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'}`}
        >
          Barchasi
        </button>
        {ROLES.map(r => (
          <button
            key={r.value}
            onClick={() => setRoleFilter(r.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${roleFilter === r.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-400'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Yuklanmoqda...</div>
      ) : (
        <div className="card p-0 overflow-hidden">
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
                        onClick={() => toggleMutation.mutate(u.id)}
                        disabled={toggleMutation.isPending}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {u.isActive ? 'Bloklash' : 'Faollashtirish'}
                      </button>
                      <button
                        onClick={() => qrMutation.mutate(u.id)}
                        disabled={qrMutation.isPending}
                        title="QR yangilash"
                        className="text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> QR
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <UserModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
