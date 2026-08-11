// Pul summasini har doim tiyingacha (2 xona) aniqlikda ko'rsatadi — operator
// "1002.10" deb kiritsa, tizimning hech bir joyida "1002.1" bo'lib
// qisqarmasligi kerak (matematik jihatdan bir xil bo'lsa-da, foydalanuvchi
// aynan o'zi kiritgan ko'rinishni kutadi).
export function formatSum(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
