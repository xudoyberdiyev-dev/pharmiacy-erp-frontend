import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientAPI } from '../../api';
import toast from 'react-hot-toast';
import { Plus, Search, MapPin, Phone, Building2, X } from 'lucide-react';

function ClientModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ orgName:'', inn:'', phone:'', address:'', longitude:'', latitude:'' });

  const mutation = useMutation({
    mutationFn: () => clientAPI.create(form),
    onSuccess: () => {
      toast.success('Klient qo\'shildi!');
      qc.invalidateQueries(['clients']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="font-semibold text-lg">Yangi klient qo'shish</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tashkilot nomi *</label>
              <input className="input" placeholder="MChJ Farmatsiya" value={form.orgName} onChange={set('orgName')} />
            </div>
            <div>
              <label className="label">INN *</label>
              <input className="input" placeholder="123456789" value={form.inn} onChange={set('inn')} />
            </div>
          </div>
          <div>
            <label className="label">Telefon *</label>
            <input className="input" placeholder="+998901234567" value={form.phone} onChange={set('phone')} />
          </div>
          <div>
            <label className="label">Manzil *</label>
            <input className="input" placeholder="Toshkent, Yunusobod tumani" value={form.address} onChange={set('address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Longitude *</label>
              <input className="input" type="number" step="any" placeholder="69.2401" value={form.longitude} onChange={set('longitude')} />
            </div>
            <div>
              <label className="label">Latitude *</label>
              <input className="input" type="number" step="any" placeholder="41.2995" value={form.latitude} onChange={set('latitude')} />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="btn-primary flex-1"
          >
            {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientAPI.getAll({ search, limit: 50 }),
    select: r => r.data,
  });

  const clients = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Klientlar</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Klient qo'shish
        </button>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-10"
            placeholder="Nom, INN yoki telefon bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Yuklanmoqda...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">Klientlar topilmadi</div>
          )}
          {clients.map(client => (
            <div key={client.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{client.orgName}</h3>
                  <p className="text-xs text-gray-500">INN: {client.inn}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} className="text-gray-400" />
                  {client.phone}
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{client.address}</span>
                </div>
                <div className="text-xs text-gray-400">
                  📍 {client.latitude?.toFixed(4)}, {client.longitude?.toFixed(4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ClientModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
