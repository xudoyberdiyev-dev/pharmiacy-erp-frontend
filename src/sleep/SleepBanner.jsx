import { useEffect, useMemo, useState } from 'react';
import './sleep.css';

// "Dastur uyqu holatida" — dasturni to'liq qoplovchi banner (main.jsx, config.js).
// "Qayta tekshirish" sahifani qayta yuklaydi: dastur uyg'otilgan bo'lsa (yangi
// deploy), odatdagi dastur ochiladi; aks holda yana shu banner chiqadi va
// oxirgi tekshiruv vaqti ko'rsatiladi.

const LAST_CHECK_KEY = 'sleep.lastCheck';

function readLastCheck() {
  try { return sessionStorage.getItem(LAST_CHECK_KEY); } catch { return null; }
}

// Deterministik yulduzlar — har ochilganda bir xil joyda.
function makeStars(count = 52) {
  let s = 7;
  const rnd = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => {
    const size = 1 + rnd() * 1.6;
    return {
      id: i,
      style: {
        left: `${(rnd() * 100).toFixed(2)}%`,
        top: `${(rnd() * 100).toFixed(2)}%`,
        width: `${size.toFixed(1)}px`,
        height: `${size.toFixed(1)}px`,
        '--d': `${(3 + rnd() * 4).toFixed(1)}s`,
        '--delay': `-${(rnd() * 5).toFixed(1)}s`,
      },
    };
  });
}

export default function SleepBanner() {
  const [busy, setBusy] = useState(false);
  const [lastCheck] = useState(readLastCheck);
  const stars = useMemo(() => makeStars(), []);

  useEffect(() => {
    document.title = 'Dastur uyqu holatida';
    document.documentElement.lang = 'uz';
  }, []);

  const recheck = () => {
    if (busy) return;
    setBusy(true);
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    try { sessionStorage.setItem(LAST_CHECK_KEY, hhmm); } catch { /* maxfiy rejim — muhim emas */ }
    setTimeout(() => window.location.reload(), 900);
  };

  let checkedText = '';
  if (busy) checkedText = '';
  else if (lastCheck) checkedText = `Oxirgi tekshiruv: ${lastCheck} — dastur hali uyquda.`;

  return (
    <div className="sleep-cover">
      <div className="sleep-sky" aria-hidden="true">
        {stars.map((st) => <i key={st.id} className="sleep-star" style={st.style} />)}
      </div>

      <div className="sleep-shell">
        <header className="sleep-brand">
          <span className="sleep-mark" aria-hidden="true" />
          Buyurtmalarni boshqarish tizimi
        </header>

        <main className="sleep-stage" aria-labelledby="sleep-title">
          <section>
            <p className="sleep-pill"><span className="sleep-dot" aria-hidden="true" />Uyqu rejimi</p>
            <h1 id="sleep-title">Dastur hozir <span className="sleep-hl">uyqu holatida</span></h1>
            <p className="sleep-lead">
              Tizim vaqtincha to'xtatilgan, shu sababli buyurtmalar va boshqa bo'limlarga hozircha kirib bo'lmaydi.
              Dastur qayta ishga tushirilgach, shu manzil orqali yana ishlashingiz mumkin.
            </p>
            <div className="sleep-actions">
              <button
                type="button"
                className={`sleep-btn${busy ? ' is-busy' : ''}`}
                onClick={recheck}
                disabled={busy}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                  <path d="M21 3v6h-6" />
                </svg>
                <span>{busy ? 'Tekshirilmoqda…' : 'Qayta tekshirish'}</span>
              </button>
              <span className="sleep-checked" role="status" aria-live="polite">{checkedText}</span>
            </div>
          </section>

          <figure className="sleep-art" aria-hidden="true">
            <svg viewBox="0 0 440 440">
              <defs>
                <radialGradient id="sleep-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#F3E7C3" stopOpacity=".30" />
                  <stop offset=".55" stopColor="#F3E7C3" stopOpacity=".07" />
                  <stop offset="1" stopColor="#F3E7C3" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="sleep-moon" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FBF3DA" />
                  <stop offset="1" stopColor="#E2CF9A" />
                </linearGradient>
                <mask id="sleep-cres" maskUnits="userSpaceOnUse" x="0" y="0" width="440" height="440">
                  <rect width="440" height="440" fill="#fff" />
                  <circle cx="270" cy="184" r="100" fill="#000" />
                </mask>
              </defs>
              <circle className="sleep-glow" cx="220" cy="232" r="215" fill="url(#sleep-glow)" />
              <circle cx="220" cy="232" r="152" fill="none" stroke="#B8D6DB" strokeOpacity=".14" />
              <circle cx="220" cy="232" r="192" fill="none" stroke="#B8D6DB" strokeOpacity=".22" strokeDasharray="1 9" strokeLinecap="round" />
              <g mask="url(#sleep-cres)">
                <circle cx="214" cy="238" r="112" fill="url(#sleep-moon)" />
                <circle cx="166" cy="284" r="13" fill="#C9B77F" fillOpacity=".38" />
                <circle cx="198" cy="322" r="7" fill="#C9B77F" fillOpacity=".32" />
                <circle cx="146" cy="232" r="7" fill="#C9B77F" fillOpacity=".3" />
              </g>
              <g fill="#D6E8EB" fontWeight="800" fontFamily="Inter, system-ui, sans-serif">
                <text className="sleep-z z1" x="300" y="178" fontSize="46">Z</text>
                <text className="sleep-z z2" x="344" y="126" fontSize="32">Z</text>
                <text className="sleep-z z3" x="372" y="88" fontSize="22">Z</text>
              </g>
            </svg>
          </figure>
        </main>

        <footer className="sleep-foot">Savollar bo'lsa, tizim ma'muriga murojaat qiling.</footer>
      </div>
    </div>
  );
}
