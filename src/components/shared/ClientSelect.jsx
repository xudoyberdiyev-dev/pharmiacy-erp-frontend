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

  // Note: this component now lives visually inside the Operator redesign
  // only (confirmed — no other role imports it), styled to match its
  // token set (#4F46E5 primary, 8px radius, 40px control height) directly
  // rather than importing from pages/operator/design, so this shared/
  // file stays free of a dependency on a specific page's folder. Logic
  // below is unchanged.
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-2 h-10 px-3 rounded-lg text-sm transition-colors bg-white"
        style={{ border: `1px solid ${open ? '#818CF8' : '#CBD5E1'}`, boxShadow: open ? '0 0 0 3px rgba(79,70,229,0.14)' : 'none' }}>
        {value && selected ? (
          <span className="flex items-center gap-2 text-left min-w-0">
            <Building2 size={16} className="text-[#64748B] shrink-0" />
            <span className="text-[14px] text-[#0F172A] truncate">{selected.orgName}</span>
          </span>
        ) : (
          <span className="flex items-center gap-2 text-[#94A3B8] min-w-0">
            <Search size={16} className="shrink-0" />
            <span className="text-sm truncate">Mijozni tanlang</span>
          </span>
        )}
        <ChevronDown size={16} className={`text-[#64748B] transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white rounded-[10px] overflow-hidden" style={{ border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(15,23,42,0.06)' }}>
          <div className="p-2 border-b" style={{ borderColor: '#F1F5F9' }}>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="INN, tashkilot nomi yoki telefon..."
                className="w-full pl-8 pr-3 h-9 text-sm rounded-md outline-none transition-colors"
                style={{ border: '1px solid #818CF8', boxShadow: '0 0 0 3px rgba(79,70,229,0.14)' }} />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5">
            {clients.length === 0 ? (
              <div className="py-6 text-center text-sm text-[#94A3B8]">
                <Search size={18} className="mx-auto mb-1.5 text-[#CBD5E1]" /> Klient topilmadi
              </div>
            ) : clients.map(c => (
              <button key={c.id} type="button"
                onClick={() => { onChange(c.id); setOpen(false); setSearch(''); }}
                className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md transition-colors text-left"
                style={{ background: value === c.id ? '#F1F5F9' : 'transparent' }}
                onMouseEnter={e => { if (value !== c.id) e.currentTarget.style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (value !== c.id) e.currentTarget.style.background = 'transparent'; }}>
                <span className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#0F172A] truncate">{c.orgName}</p>
                  <p className="text-xs text-[#64748B] truncate">INN: {c.inn} · {c.phone}</p>
                </span>
                {value === c.id && <Check size={16} className="text-[#4F46E5] shrink-0" />}
              </button>
            ))}
          </div>
          <p className="px-3.5 pb-2.5 pt-1 text-xs text-[#94A3B8]">Mijoz ro'yxati tizimda mavjud mijozlardan olinadi.</p>
        </div>
      )}
    </div>
  );
}
