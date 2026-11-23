// ─────────────────────────────────────────────────────────────────────────
// "Uyqu rejimi" — yoqilganda dasturning O'RNIGA butun ekranni qoplovchi
// "Dastur uyqu holatida" banneri ko'rsatiladi (main.jsx). Banner ko'rinayotganda
// App umuman ishga tushmaydi: login, so'rovlar va socket ulanishlari yo'q.
//
// Qiymat build vaqtida aniqlanadi:
//   • VITE_SLEEP_MODE=true   — har doim uyquda
//   • VITE_SLEEP_MODE=false  — har doim uyg'oq (dasturni uyg'otish)
//   • berilmasa              — production build'da UYQUDA, `npm run dev`da uyg'oq
//     (lokal ishlab chiqishga xalaqit bermaslik uchun).
//
// DASTURNI UYG'OTISH: Vercel > Settings > Environment Variables'da
// VITE_SLEEP_MODE=false qo'ying va qayta deploy qiling (yoki shu faylda
// pastdagi ifodani `false` ga almashtirib push qiling).
// ─────────────────────────────────────────────────────────────────────────

const forced = import.meta.env.VITE_SLEEP_MODE;

export const SLEEP_MODE = forced ? forced === 'true' : import.meta.env.PROD;
