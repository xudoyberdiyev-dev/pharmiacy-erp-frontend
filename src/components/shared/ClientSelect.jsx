import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { clientAPI } from '../../api';
import { Building2, ChevronDown, Search, Check } from 'lucide-react';

/* ── Client search dropdown ─────────────────────────────────────────────── */
export default function ClientSelect({ value, onChange }) {
  const [search, setSearch] = useState('');
  const [open, setOpen]   = useState(false);

  const { data } = useQuery({
    queryKey: ['clients-search', search],
    queryFn: () => clientAPI.getAll({ search, limit: 20, isActive: true }),
    select: r => r.data.data,
    enabled: open,
  });
  const { data: selected } = useQuery({
    queryKey: ['client-single', value],
    queryFn: () => clientAPI.getOne(value),
    select: r => r.data.data,
    enabled: !!value && !open,
  });
  const clients = data || [];

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all border-2 bg-gray-50 hover:bg-white ${
          open ? 'border-blue-500 bg-white shadow-sm shadow-blue-100' : 'border-transparent hover:border-gray-200'
        }`}>
        {value && selected ? (
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Building2 size={13} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{selected.orgName}</p>
              <p className="text-xs text-gray-400">INN: {selected.inn} · {selected.phone}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <Building2 size={14} />
            <span className="text-sm">Klientni qidiring yoki tanlang...</span>
          </div>
        )}
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ml-2 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-2.5 border-b border-gray-50">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="INN, tashkilot nomi yoki telefon..."
                className="w-full pl-8 pr-4 py-2 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {clients.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">
                <Search size={20} className="mx-auto mb-1.5 text-gray-200" /> Klient topilmadi
              </div>
            ) : clients.map(c => (
              <button key={c.id} type="button"
                onClick={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-blue-50/60 transition-colors text-left ${value === c.id ? 'bg-blue-50' : ''}`}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-blue-700">{c.orgName?.charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.orgName}</p>
                  <p className="text-xs text-gray-400">INN: {c.inn} · {c.phone}</p>
                </div>
                {value === c.id && <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0"><Check size={10} className="text-white" strokeWidth={3} /></div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
