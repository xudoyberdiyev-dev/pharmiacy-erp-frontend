import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Truck, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  X, Check, AlertTriangle, Car
} from 'lucide-react';
import Pagination from '../../components/shared/Pagination';
import SearchBar from '../../components/shared/SearchBar';

const inp = "w-full px-3.5 py-2.5 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-400 bg-gray-50 focus:bg-white transition-all";

/* ── Modal ─────────────────────────────────────────────────────────────── */
function VehicleModal({ vehicle, onClose, onSave }) {
  const [form, setForm] = useState({
    model:       vehicle?.model       || '',
    plateNumber: vehicle?.plateNumber || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.model.trim()) e.model = 'Model nomi kiritilmagan';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({ model: form.model.trim(), plateNumber: form.plateNumber.trim().toUpperCase() || null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Truck size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-black text-gray-900">{vehicle ? 'Mashinani tahrirlash' : 'Yangi mashina'}</h2>
              <p className="text-xs text-gray-400">{vehicle ? (vehicle.plateNumber || vehicle.model) : 'Ma\'lumotlarni kiriting'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
              Mashina modeli *
            </label>
            <input
              value={form.model}
              onChange={e => setForm(p => ({ ...p, model: e.target.value }))}
              placeholder="Masalan: Chevrolet Nexia 3"
              className={`${inp} ${errors.model ? 'border-red-300 bg-red-50' : ''}`}
            />
            {errors.model && <p className="text-xs text-red-500 mt-1">{errors.model}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-wider mb-1.5">
              Davlat raqami <span className="normal-case font-medium text-gray-300">(ixtiyoriy)</span>
            </label>
            <input
              value={form.plateNumber}
              onChange={e => setForm(p => ({ ...p, plateNumber: e.target.value.toUpperCase() }))}
              placeholder="Masalan: 01 AAA 001"
              className={`${inp} font-mono tracking-widest ${errors.plateNumber ? 'border-red-300 bg-red-50' : ''}`}
            />
            {errors.plateNumber && <p className="text-xs text-red-500 mt-1">{errors.plateNumber}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all">
              Bekor
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200 hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <Check size={15} strokeWidth={2.5} />
              {vehicle ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete confirm ─────────────────────────────────────────────────────── */
function DeleteModal({ vehicle, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200 p-6">
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <Trash2 size={24} className="text-red-600" />
          </div>
          <h2 className="font-black text-gray-900 text-lg">Mashinani o'chirish</h2>
          <p className="text-gray-500 text-sm mt-1">
            <span className="font-bold text-gray-700">{vehicle.plateNumber || '—'}</span> — {vehicle.model}
          </p>
          <p className="text-xs text-red-500 mt-2">Bu amalni qaytarib bo'lmaydi</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-all">
            Bekor
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all flex items-center justify-center gap-2">
            <Trash2 size={14} /> O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── VehicleCard ────────────────────────────────────────────────────────── */
function VehicleCard({ vehicle, canEdit, onEdit, onToggle, onDelete }) {
  return (
    <div className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-all hover:shadow-md ${
      vehicle.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
            vehicle.isActive ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Car size={22} className={vehicle.isActive ? 'text-blue-600' : 'text-gray-400'} />
          </div>
          <div>
            <p className="font-mono font-black text-gray-900 text-base tracking-wider">{vehicle.plateNumber || '—'}</p>
            <p className="text-sm text-gray-500 font-medium">{vehicle.model}</p>
          </div>
        </div>
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
          vehicle.isActive
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-gray-50 text-gray-500 border border-gray-200'
        }`}>
          {vehicle.isActive ? 'Faol' : 'Nofaol'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 rounded-xl mb-4">
        <Truck size={13} className="text-gray-400" />
        <span className="text-xs text-gray-500 font-medium">
          {vehicle._count?.orders || 0} ta order bajarilgan
        </span>
      </div>

      {canEdit && (
        <div className="flex gap-2">
          <button onClick={() => onEdit(vehicle)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors">
            <Pencil size={12} /> Tahrirlash
          </button>
          <button onClick={() => onToggle(vehicle)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
              vehicle.isActive
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                : 'bg-green-50 hover:bg-green-100 text-green-700'
            }`}>
            {vehicle.isActive
              ? <><ToggleLeft size={12} /> O'chirish</>
              : <><ToggleRight size={12} /> Yoqish</>}
          </button>
          {(vehicle._count?.orders || 0) === 0 && (
            <button onClick={() => onDelete(vehicle)}
              className="w-9 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────── */
export default function VehiclesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  const [search, setSearch]         = useState('');
  const [filterActive, setFilter]   = useState('all');
  const [page, setPage]             = useState(1);
  const [modal, setModal]           = useState(null); // null | 'create' | vehicle-obj
  const [deleteTarget, setDeleteTarget] = useState(null);
  const limit = 12;

  const params = { search: search || undefined, page, limit };
  if (filterActive !== 'all') params.isActive = filterActive === 'active' ? 'true' : 'false';

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => vehicleAPI.getAll(params),
    select: r => r.data,
    refetchInterval: 30000,
  });

  const vehicles = data?.data || [];
  const pagination = data?.pagination || {};

  const invalidate = () => qc.invalidateQueries({ queryKey: ['vehicles'] });

  const createMut = useMutation({
    mutationFn: vehicleAPI.create,
    onSuccess: () => { toast.success('Mashina qo\'shildi'); setModal(null); invalidate(); },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => vehicleAPI.update(id, data),
    onSuccess: () => { toast.success('Saqlandi'); setModal(null); invalidate(); },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const toggleMut = useMutation({
    mutationFn: vehicleAPI.toggleActive,
    onSuccess: () => { invalidate(); },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const deleteMut = useMutation({
    mutationFn: vehicleAPI.remove,
    onSuccess: () => { toast.success("O'chirildi"); setDeleteTarget(null); invalidate(); },
    onError: e => toast.error(e.response?.data?.message || 'Xato'),
  });

  const active   = vehicles.filter(v => v.isActive).length;
  const inactive = vehicles.filter(v => !v.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
              <Truck size={20} className="text-blue-600" />
            </div>
            Mashinalar
          </h1>
          <p className="text-gray-400 text-sm mt-0.5 ml-13">Transport vositalari ro'yxati</p>
        </div>
        {isAdmin && (
          <button onClick={() => setModal('create')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white
              bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
              shadow-md shadow-blue-200 hover:shadow-lg transition-all">
            <Plus size={16} strokeWidth={2.5} /> Mashina qo'shish
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Jami',    value: pagination.total ?? vehicles.length, color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Faol',    value: active,              color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Nofaol',  value: inactive,            color: 'text-gray-500',  bg: 'bg-gray-50'  },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4`}>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <SearchBar
          value={search}
          onChange={v => { setSearch(v); setPage(1); }}
          placeholder="Model yoki davlat raqami bo'yicha qidirish..."
          wrapped={false}
          className="flex-1"
        />
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 self-start">
          {[
            { key: 'all',      label: 'Barchasi' },
            { key: 'active',   label: 'Faol'     },
            { key: 'inactive', label: 'Nofaol'   },
          ].map(f => (
            <button key={f.key} onClick={() => { setFilter(f.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterActive === f.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-40 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Truck size={28} className="text-gray-200" />
          </div>
          <p className="text-gray-400 font-semibold">
            {search ? 'Qidiruv bo\'yicha mashina topilmadi' : 'Hali mashina qo\'shilmagan'}
          </p>
          {isAdmin && !search && (
            <button onClick={() => setModal('create')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
              <Plus size={14} /> Birinchi mashinani qo'shish
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map(v => (
              <VehicleCard
                key={v.id}
                vehicle={v}
                canEdit={isAdmin}
                onEdit={setModal}
                onToggle={v => toggleMut.mutate(v.id)}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100">
            <Pagination
              page={pagination.page || page}
              pages={pagination.pages || 1}
              total={pagination.total}
              onChange={setPage}
            />
          </div>
        </>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <VehicleModal
          vehicle={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={data => {
            if (modal === 'create') {
              createMut.mutate(data);
            } else {
              updateMut.mutate({ id: modal.id, data });
            }
          }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteModal
          vehicle={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
        />
      )}
    </div>
  );
}
