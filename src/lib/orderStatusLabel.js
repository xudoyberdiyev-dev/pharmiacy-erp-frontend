// IN_TRANSIT statusi ikkita ichki bosqichni birlashtiradi: hujjatchi
// (haydovchi biriktirilgan yoki hali biriktirilmagan bo'lishidan qat'iy
// nazar) tomonidan haydovchi hali TASDIQLAMAGAN, va haydovchi tasdiqlagan
// (haqiqatda yo'lga chiqqan/chiqishga tayyor) holatlar. Avval bularning
// ikkalasi ham bir xilda "Yo'lda" deb ko'rsatilardi — bu hujjatchi hali
// driverga biriktirib, driver hali "qabul qildim" demagan orderlarni ham
// noto'g'ri ravishda "yo'lda" qilib ko'rsatardi. Endi haqiqiy bosqichga
// qarab aniqroq label tanlanadi. (Alohida "Yuklanmoqda" nomi ishlatilmaydi
// — bu haqiqiy, alohida LOADING statusining o'z labeli bilan chalkashib
// ketmasligi uchun.)
//
// Diqqat: faqat `order` obyektida `driverConfirmedAt` maydoni HAQIQATDA
// mavjud bo'lsa hisoblanadi (masalan ba'zi ro'yxat so'rovlari orderni
// qisqartirilgan `select` bilan olishi mumkin — bunday holda taxmin qilib
// noto'g'ri ko'rsatgandan ko'ra, eski "Yo'lda" xatti-harakati saqlanadi).
export function inTransitLabel(order) {
  if (!order || !('driverConfirmedAt' in order)) return "Yo'lda";
  if (!order.driverConfirmedAt) return 'Safarga tayyorlanmoqda';
  return "Yo'lda";
}

export function orderStatusLabel(status, order) {
  if (status === 'IN_TRANSIT') return inTransitLabel(order);
  return null; // chaqiruvchi o'zining status->label xaritasidan foydalansin
}
