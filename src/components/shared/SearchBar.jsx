import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

// Butun admin panel bo'ylab bir xil qidiruv input dizayni — "Tasdiqlash"
// sahifasidagi uslub asosida (OrderApprovalTable). `value`/`onChange` — bu
// tashqi (debounce qilingan) qiymat: har bir bosilgan tugma emas, faqat
// yozish to'xtagandan keyin chaqiriladi, shu bilan server so'rovlari
// kamayadi. `wrapped` — qidiruvni oq karta ichiga o'raydi (Tasdiqlash
// sahifasidagidek); ba'zi joylarda (masalan filtr tugmalari bilan bir
// qatorda) `wrapped={false}` qulayroq.
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Qidirish...',
  debounceMs = 350,
  wrapped = true,
  className = '',
}) {
  const [local, setLocal] = useState(value || '');
  const firstRun = useRef(true);

  // Tashqi tomondan (masalan filtr almashtirilganda) qiymat tozalansa, inputni ham sinxronlaymiz
  useEffect(() => {
    if (value !== local) setLocal(value || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  const clear = () => {
    setLocal('');
    onChange('');
  };

  const input = (
    <div className="relative">
      <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-transparent rounded-xl text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-100
          transition-all placeholder:text-gray-400"
      />
      {local && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
        >
          <X size={12} className="text-gray-500" />
        </button>
      )}
    </div>
  );

  if (!wrapped) return <div className={className}>{input}</div>;

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${className}`}>
      {input}
    </div>
  );
}
