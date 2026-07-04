import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableSelect({ value, onChange, options, placeholder, icon: Icon, emptyLabel = 'Topilmadi' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = options.find(o => o.value === value);
  const filtered = options.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return o.label.toLowerCase().includes(q) || o.sub?.toLowerCase().includes(q);
  });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all border-2 bg-gray-50 hover:bg-white ${
          open ? 'border-emerald-500 bg-white shadow-sm shadow-emerald-100' : 'border-transparent hover:border-gray-200'
        }`}
      >
        {selected ? (
          <div className="flex items-center gap-2 text-left min-w-0">
            {Icon && (
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                <Icon size={11} className="text-emerald-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{selected.label}</p>
              {selected.sub && <p className="text-xs text-gray-400 truncate">{selected.sub}</p>}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ml-2 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-2.5 border-b border-gray-50">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Qidirish..."
                className="w-full pl-8 pr-8 py-2 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-400">
                <Search size={20} className="mx-auto mb-1.5 text-gray-200" /> {emptyLabel}
              </div>
            ) : filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-emerald-50/60 transition-colors text-left ${value === o.value ? 'bg-emerald-50' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{o.label}</p>
                  {o.sub && <p className="text-xs text-gray-400 truncate">{o.sub}</p>}
                </div>
                {value === o.value && <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0"><Check size={10} className="text-white" strokeWidth={3} /></div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
