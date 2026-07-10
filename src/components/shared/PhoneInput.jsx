// O'zbekiston telefon raqami uchun input — "+998" doim ko'rinib turadi,
// foydalanuvchi faqat 9 ta raqam kiritadi (harflar/belgilar avtomatik
// e'tiborga olinmaydi). Tashqariga har doim to'liq "+998XXXXXXXXX" (yoki
// hali to'liq kiritilmagan bo'lsa qisqaroq) qiymat chiqadi — bu backend/DB
// dagi mavjud formatga aynan mos keladi.
function toDigits(raw) {
  const onlyDigits = (raw || '').replace(/\D/g, '');
  // "+998901234567" yoki "998901234567" kabi to'liq raqam joylashtirilsa,
  // boshidagi "998" kodni olib tashlab, faqat mahalliy 9 ta raqamni qoldiramiz.
  const stripped = onlyDigits.startsWith('998') ? onlyDigits.slice(3) : onlyDigits;
  return stripped.slice(0, 9);
}

function formatDigits(digits) {
  const parts = [];
  if (digits.length > 0) parts.push(digits.slice(0, 2));
  if (digits.length > 2) parts.push(digits.slice(2, 5));
  if (digits.length > 5) parts.push(digits.slice(5, 7));
  if (digits.length > 7) parts.push(digits.slice(7, 9));
  return parts.join(' ');
}

export default function PhoneInput({ value, onChange, error, autoFocus, className = '' }) {
  const digits = toDigits(value);

  const handleChange = (e) => {
    const next = toDigits(e.target.value);
    onChange(next ? `+998${next}` : '');
  };

  return (
    <div>
      <div
        className={`flex items-center rounded-xl border-2 overflow-hidden bg-gray-50 focus-within:bg-white transition-all ${
          error ? 'border-red-300' : 'border-gray-100 focus-within:border-blue-400'
        } ${className}`}
      >
        <span className="pl-3.5 pr-2.5 py-2.5 text-sm font-bold text-gray-500 bg-gray-100/70 border-r border-gray-200 select-none">
          +998
        </span>
        <input
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          value={formatDigits(digits)}
          onChange={handleChange}
          placeholder="90 123 45 67"
          className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-transparent outline-none font-mono tracking-wide"
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
