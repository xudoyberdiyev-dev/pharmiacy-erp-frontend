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

// Har bir viloyat markazining taxminiy koordinatasi — xaritada marker qo'yish uchun
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
