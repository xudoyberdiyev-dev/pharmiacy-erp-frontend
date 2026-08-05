import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { ShieldCheck, Pencil, X, KeyRound, ShieldAlert, ShieldOff, AlertTriangle } from 'lucide-react';

const ROLE_LABELS = {
  ADMIN: 'Admin', OPERATOR: 'Operator', PICKER: 'Picker', MARKER: 'Marker',
  CHECKER: 'Checker', DRIVER: 'Haydovchi', ACCOUNTANT: 'Bugalter',
  ACCOUNTANT1: 'Hisobchi 1', ACCOUNTANT2: 'Hisobchi 2', DOCUMENT: 'Hujjatchi',
};

function EditSuperAdminModal({ admin, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ fullName: admin.fullName, phone: admin.phone, password: '' });

  const mutation = useMutation({
    mutationFn: () => {
      const data = { fullName: form.fullName, phone: form.phone };
      if (form.password) data.password = form.password;
      return userAPI.update(admin.id, data);
    },
    onSuccess: () => {
      toast.success('Super Admin ma\'lumotlari yangilandi!');
      qc.invalidateQueries({ queryKey: ['system-owner-super-admins'] });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const canSubmit = form.fullName.trim() && form.phone.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-black text-gray-900">Super Adminni tahrirlash</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label">To'liq ism *</label>
            <input className="input" value={form.fullName} onChange={set('fullName')} />
          </div>
          <div>
            <label className="label">Telefon *</label>
            <input className="input" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="label">
              Yangi parol <span className="text-gray-400 font-normal">(o'zgartirmasangiz bo'sh qoldiring)</span>
            </label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />
          </div>
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Bu — Super Admin login/parolini unutgan hollarda uni tiklash uchun mo'ljallangan. Saqlagandan so'ng Super Admin keyingi safar tizimga aynan shu yangilangan ma'lumotlar bilan kiradi.
          </p>
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

function ToggleBlockModal({ admin, onClose }) {
  const qc = useQueryClient();
  const isBlocking = admin.isActive;

  const { data: impact, isLoading: loadingImpact } = useQuery({
    queryKey: ['cascade-impact'],
    queryFn: () => userAPI.getCascadeImpact(),
    select: (r) => r.data,
    enabled: isBlocking,
  });

  const mutation = useMutation({
    mutationFn: () => userAPI.toggleActive(admin.id),
    onSuccess: (res) => {
      const { cascadeCount } = res.data;
      if (isBlocking) {
        toast.success(`Super Admin bloklandi. Jami ${cascadeCount + 1} ta akkaunt to'xtatildi.`);
      } else {
        toast.success(`Super Admin qayta faollashtirildi. Jami ${cascadeCount + 1} ta akkaunt tiklandi.`);
      }
      qc.invalidateQueries({ queryKey: ['system-owner-super-admins'] });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            {isBlocking ? <ShieldAlert size={20} className="text-red-500" /> : <ShieldCheck size={20} className="text-green-600" />}
            {isBlocking ? 'Super Adminni bloklash' : 'Super Adminni qayta faollashtirish'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {isBlocking ? (
            <>
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5">
                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  Bu — <strong>butun tizimni favqulodda to'xtatadi</strong>. {admin.fullName} bloklanishi bilan
                  birga barcha Admin va operatsion xodimlar ham darhol bloklanadi (ochiq sessiyalar ham uziladi).
                </p>
              </div>
              {loadingImpact ? (
                <div className="h-16 bg-gray-50 rounded-xl animate-pulse" />
              ) : impact ? (
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Jami {impact.total} ta xodim bloklanadi:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(impact.byRole).map(([role, count]) => (
                      <span key={role} className="text-xs font-bold bg-white border border-gray-200 rounded-full px-2.5 py-1 text-gray-700">
                        {ROLE_LABELS[role] || role}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-xl p-3.5">
              <ShieldOff size={16} className="text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                {admin.fullName} qayta faollashtiriladi va shu bloklash tufayli to'xtatilgan barcha xodimlar
                ham avtomatik qayta faollashadi.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || (isBlocking && loadingImpact)}
            className={`flex-1 rounded-xl font-bold text-sm py-2.5 text-white disabled:opacity-50 transition-colors ${
              isBlocking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {mutation.isPending ? 'Bajarilmoqda...' : isBlocking ? 'Ha, bloklash' : 'Ha, faollashtirish'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SystemOwnerPage() {
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['system-owner-super-admins'],
    queryFn: () => userAPI.getAll({ role: 'SUPER_ADMIN', limit: 100 }),
    select: (r) => r.data.data || [],
  });

  const admins = data || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-2xl flex items-center justify-center">
            <KeyRound size={18} className="text-slate-700" />
          </div>
          Super Admin akkauntlarini boshqarish
        </h1>
        <p className="text-xs text-gray-400 mt-1 ml-12">
          Super Admin login/parolini unutib qo'ygan hollarda shu yerdan tiklashingiz, yoki xavf ostida
          bo'lgan akkauntni bloklab, butun tizimni to'xtatishingiz mumkin
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-white border border-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : admins.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <ShieldCheck size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm font-semibold">Super Admin akkaunti topilmadi</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {admins.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                  {a.fullName?.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 text-sm truncate">{a.fullName}</p>
                  <p className="text-xs text-gray-400 truncate">{a.phone}</p>
                </div>
                <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full sm:hidden ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {a.isActive ? 'Faol' : 'Bloklangan'}
                </span>
              </div>
              <span className={`hidden sm:inline-block shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {a.isActive ? 'Faol' : 'Bloklangan'}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setEditing(a)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <Pencil size={13} /> Tahrirlash
                </button>
                <button
                  onClick={() => setToggling(a)}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    a.isActive ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'
                  }`}
                >
                  {a.isActive ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                  {a.isActive ? 'Bloklash' : 'Faollashtirish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <EditSuperAdminModal admin={editing} onClose={() => setEditing(null)} />}
      {toggling && <ToggleBlockModal admin={toggling} onClose={() => setToggling(null)} />}
    </div>
  );
}
