import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { Plus, MapPin, Phone, Building2, X, Pencil, Power, Users } from 'lucide-react';
import Pagination from '../../components/shared/Pagination';
import SearchBar from '../../components/shared/SearchBar';
import PhoneInput from '../../components/shared/PhoneInput';
import { REGIONS, regionLabel, districtsFor } from '../../utils/regions';

const EMPTY_FORM = { orgName: '', inn: '', phone: '', address: '', region: '', district: '' };

function ClientModal({ client, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!client;
  const [form, setForm] = useState(
    client
      ? {
          orgName: client.orgName,
          inn: client.inn || '',
          phone: client.phone || '',
          address: client.address,
          region: client.region || '',
          district: client.district || '',
        }
      : EMPTY_FORM
  );

  const mutation = useMutation({
    mutationFn: () => (isEdit ? clientAPI.update(client.id, form) : clientAPI.create(form)),
    onSuccess: () => {
      toast.success(isEdit ? 'Mijoz yangilandi!' : 'Mijoz qo\'shildi!');
      qc.invalidateQueries({ queryKey: ['clients'] });
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const districts = districtsFor(form.region);
  const canSubmit = form.orgName.trim() && form.region && form.district.trim() && form.address.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <h2 className="font-semibold text-lg">{isEdit ? 'Mijozni tahrirlash' : 'Yangi mijozy qo\'shish'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tashkilot nomi *</label>
              <input className="input" placeholder="MChJ Farmatsiya" value={form.orgName} onChange={set('orgName')} />
            </div>
            <div>
              <label className="label">INN <span className="text-gray-400 font-normal">(ixtiyoriy)</span></label>
              <input
                className="input"
                placeholder="123456789"
                inputMode="numeric"
                maxLength={9}
                value={form.inn}
                onChange={e => setForm(p => ({ ...p, inn: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Telefon <span className="text-gray-400 font-normal">(ixtiyoriy)</span></label>
            <PhoneInput value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} />
          </div>

          {/* Viloyat → tuman/shahar bosqichma-bosqich — tuman ro'yxati tanlangan
              viloyatga qarab almashadi, shuning uchun viloyat o'zgarsa eski
              tuman qiymati (boshqa viloyatga tegishli bo'lib qolmasligi uchun) tozalanadi. */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Viloyat *</label>
              <select
                className="input"
                value={form.region}
                onChange={e => setForm(p => ({ ...p, region: e.target.value, district: '' }))}
              >
                <option value="">Tanlang</option>
                {REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tuman/Shahar *</label>
              <select
                className="input disabled:bg-gray-50 disabled:text-gray-400"
                value={form.district}
                onChange={set('district')}
                disabled={!form.region}
              >
                <option value="">{form.region ? 'Tanlang' : 'Avval viloyatni tanlang'}</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">To'liq manzil *</label>
            <input className="input" placeholder="Ko'cha, uy raqami, mo'ljal..." value={form.address} onChange={set('address')} />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t shrink-0">
          <button onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !canSubmit}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modalClient, setModalClient] = useState(undefined); // undefined = closed, null = create, object = edit
  const limit = 12;

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, activeFilter, page],
    queryFn: () => clientAPI.getAll({
      search: search || undefined,
      isActive: activeFilter || undefined,
      page,
      limit,
    }),
    select: r => r.data,
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => clientAPI.toggleActive(id),
    onSuccess: () => {
      toast.success('Holat o\'zgartirildi!');
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const clients = data?.data || [];
  const pagination = data?.pagination || {};
  const activeCount = clients.filter(c => c.isActive).length;
  const inactiveCount = clients.filter(c => !c.isActive).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Users size={18} className="text-blue-600" />
          </div>
          Mijozlar
        </h1>
        <button
          onClick={() => setModalClient(null)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200 hover:shadow-lg transition-all"
        >
          <Plus size={16} strokeWidth={2.5} /> Mijoz qo'shish
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Sahifadagilar', value: pagination.total ?? clients.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Faol', value: activeCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Nofaol', value: inactiveCount, color: 'text-gray-500', bg: 'bg-gray-50' },
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
          placeholder="Nom, INN yoki telefon bo'yicha qidirish..."
          wrapped={false}
          className="flex-1"
        />
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1 self-start">
          {[
            { value: '', label: 'Barchasi' },
            { value: 'true', label: 'Faol' },
            { value: 'false', label: 'Nofaol' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => { setActiveFilter(f.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeFilter === f.value ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-40 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">Mijozlar topilmadi</div>
            )}
            {clients.map(client => (
              <div key={client.id} className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-all hover:shadow-md ${client.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{client.orgName}</h3>
                    <p className="text-xs text-gray-500">INN: {client.inn || '—'}</p>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0 ${
                    client.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {client.isActive ? 'Faol' : 'Nofaol'}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    {client.phone || '—'}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{client.address}</span>
                  </div>
                  {(client.region || client.district) && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {client.region && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-600">
                          {regionLabel(client.region)}
                        </span>
                      )}
                      {client.district && (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                          {client.district}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setModalClient(client)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil size={12} /> Tahrirlash
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate(client.id)}
                    disabled={toggleMutation.isPending}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      client.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    <Power size={12} /> {client.isActive ? 'Nofaollashtirish' : 'Faollashtirish'}
                  </button>
                </div>
              </div>
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

      {modalClient !== undefined && (
        <ClientModal client={modalClient} onClose={() => setModalClient(undefined)} />
      )}
    </div>
  );
}
