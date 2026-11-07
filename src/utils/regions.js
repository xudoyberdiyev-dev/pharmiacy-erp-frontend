export const REGIONS = [
  { value: 'TOSHKENT_SHAHAR', label: 'Toshkent shahri' },
  { value: 'TOSHKENT_VILOYATI', label: 'Toshkent viloyati' },
  { value: 'ANDIJON', label: 'Andijon' },
  { value: 'BUXORO', label: 'Buxoro' },
  { value: 'FARGONA', label: "Farg'ona" },
  { value: 'JIZZAX', label: 'Jizzax' },
  { value: 'XORAZM', label: 'Xorazm' },
  { value: 'NAMANGAN', label: 'Namangan' },
  { value: 'NAVOIY', label: 'Navoiy' },
  { value: 'QASHQADARYO', label: 'Qashqadaryo' },
  { value: 'QORAQALPOGISTON', label: "Qoraqalpog'iston" },
  { value: 'SAMARQAND', label: 'Samarqand' },
  { value: 'SIRDARYO', label: 'Sirdaryo' },
  { value: 'SURXONDARYO', label: 'Surxondaryo' },
];

export function regionLabel(value) {
  return REGIONS.find((r) => r.value === value)?.label || "Noma'lum";
}

// Har bir viloyat markazining taxminiy koordinatasi — faqat haydovchi
// xaritasi/marshruti kabi joylardagi eski funksiyalar uchun qoldirilgan
// (klient formasida endi ishlatilmaydi — xarita/koordinata kiritish olib
// tashlandi, o'rniga viloyat → tuman/shahar → to'liq manzil tanlanadi).
export const REGION_COORDS = {
  TOSHKENT_SHAHAR: [41.2995, 69.2401],
  TOSHKENT_VILOYATI: [41.05, 69.55],
  ANDIJON: [40.7821, 72.3442],
  BUXORO: [39.7684, 64.4556],
  FARGONA: [40.3842, 71.7843],
  JIZZAX: [40.1158, 67.8422],
  XORAZM: [41.5500, 60.6333],
  NAMANGAN: [40.9983, 71.6726],
  NAVOIY: [40.0844, 65.3792],
  QASHQADARYO: [38.8606, 65.7891],
  QORAQALPOGISTON: [42.4531, 59.6103],
  SAMARQAND: [39.6270, 66.9750],
  SIRDARYO: [40.8434, 68.6603],
  SURXONDARYO: [37.9401, 67.5719],
};

// Viloyat tanlangandan keyin klient yaratish/tahrirlash formasida
// ko'rsatiladigan tuman/shahar ro'yxati — erkin matn sifatida saqlanadi
// (qattiq enum emas, chunki ma'muriy bo'linish vaqti-vaqti bilan
// o'zgarishi mumkin — bu ro'yxatni migratsiyasiz yangilash mumkin).
export const DISTRICTS = {
  TOSHKENT_SHAHAR: [
    'Bektemir', 'Chilonzor', 'Mirzo Ulug\'bek', 'Mirobod', 'Olmazor',
    'Sergeli', 'Shayxontohur', 'Uchtepa', 'Yakkasaroy', 'Yashnobod', 'Yunusobod',
  ],
  TOSHKENT_VILOYATI: [
    'Angren', 'Bekobod', 'Bekobod tumani', 'Bo\'ka', 'Bo\'stonliq', 'Chinoz',
    'Chirchiq', 'Nurafshon', 'Ohangaron', 'Ohangaron tumani', 'Olmaliq',
    'Oqqo\'rg\'on', 'Parkent', 'Piskent', 'Qibray', 'Quyi Chirchiq',
    'Toshkent tumani (Zangiota)', 'Yangiyo\'l', 'Yangiyo\'l tumani',
    'Yuqori Chirchiq', 'O\'rta Chirchiq',
  ],
  ANDIJON: [
    'Andijon shahri', 'Andijon tumani', 'Asaka', 'Baliqchi', 'Bo\'z',
    'Buloqboshi', 'Izboskan', 'Jalaquduq', 'Marhamat', 'Oltinko\'l',
    'Paxtaobod', 'Qo\'rg\'ontepa', 'Qorasuv', 'Shahrixon', 'Ulug\'nor', 'Xo\'jaobod',
  ],
  BUXORO: [
    'Buxoro shahri', 'Buxoro tumani', 'G\'ijduvon', 'Jondor', 'Kogon shahri',
    'Kogon tumani', 'Olot', 'Peshku', 'Qorako\'l', 'Qorovulbozor',
    'Romitan', 'Shofirkon', 'Vobkent',
  ],
  FARGONA: [
    'Farg\'ona shahri', 'Farg\'ona tumani', 'Marg\'ilon', 'Qo\'qon',
    'Quvasoy', 'Beshariq', 'Bog\'dod', 'Buvayda', 'Dang\'ara', 'Furqat',
    'O\'zbekiston tumani', 'Oltiariq', 'Quva', 'Rishton', 'So\'x',
    'Toshloq', 'Uchko\'prik', 'Yozyovon',
  ],
  JIZZAX: [
    'Jizzax shahri', 'Jizzax tumani', 'Arnasoy', 'Baxmal', 'Do\'stlik',
    'Forish', 'G\'allaorol', 'Mirzacho\'l', 'Paxtakor', 'Sharof Rashidov',
    'Yangiobod', 'Zafarobod', 'Zarbdor', 'Zomin',
  ],
  XORAZM: [
    'Urganch shahri', 'Urganch tumani', 'Xiva', 'Bog\'ot', 'Gurlan',
    'Xazorasp', 'Xonqa', 'Qo\'shko\'pir', 'Shovot', 'Yangiariq', 'Yangibozor',
  ],
  NAMANGAN: [
    'Namangan shahri', 'Namangan tumani', 'Chortoq', 'Chust', 'Kosonsoy',
    'Mingbuloq', 'Norin', 'Pop', 'To\'raqo\'rg\'on', 'Uchqo\'rg\'on',
    'Uychi', 'Yangiqo\'rg\'on',
  ],
  NAVOIY: [
    'Navoiy shahri', 'Zarafshon', 'Konimex', 'Karmana', 'Navbahor',
    'Nurota', 'Qiziltepa', 'Tomdi', 'Uchquduq', 'Xatirchi',
  ],
  QASHQADARYO: [
    'Qarshi shahri', 'Qarshi tumani', 'Shahrisabz', 'G\'uzor', 'Dehqonobod',
    'Kasbi', 'Kitob', 'Koson', 'Ko\'kdala', 'Mirishkor', 'Muborak', 'Nishon', 'Qamashi',
    'Chiroqchi', 'Yakkabog\'',
  ],
  QORAQALPOGISTON: [
    'Nukus shahri', 'Nukus tumani', 'Amudaryo', 'Beruniy', 'Chimboy',
    'Ellikqal\'a', 'Kegeyli', 'Mo\'ynoq', 'Qanliko\'l', 'Qorao\'zak',
    'Qo\'ng\'irot', 'Shumanay', 'Taxtako\'pir', 'To\'rtko\'l', 'Xo\'jayli',
  ],
  SAMARQAND: [
    'Samarqand shahri', 'Kattaqo\'rg\'on', 'Bulung\'ur', 'Ishtixon',
    'Jomboy', 'Kattaqo\'rg\'on tumani', 'Narpay', 'Nurobod', 'Oqdaryo',
    'Pastdarg\'om', 'Paxtachi', 'Payariq', 'Toyloq', 'Urgut',
  ],
  SIRDARYO: [
    'Guliston shahri', 'Guliston tumani', 'Yangiyer', 'Shirin', 'Boyovut',
    'Mirzaobod', 'Oqoltin', 'Sardoba', 'Sayxunobod', 'Sirdaryo tumani', 'Xovos',
  ],
  SURXONDARYO: [
    'Termiz shahri', 'Termiz tumani', 'Angor', 'Bandixon', 'Boysun',
    'Denov', 'Jarqo\'rg\'on', 'Muzrabot', 'Oltinsoy', 'Qiziriq',
    'Qumqo\'rg\'on', 'Sariosiyo', 'Sherobod', 'Sho\'rchi', 'Uzun',
  ],
};

export function districtsFor(regionValue) {
  return DISTRICTS[regionValue] || [];
}
