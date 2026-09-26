// Duration formatting shared by the Operator pages. Durations are stored
// and entered in whole minutes (the backend's pickingDuration /
// markingDuration / checkingDuration columns); this only turns a minute
// count into words for display — "90" -> "1 soat 30 daqiqa".
export function fmtMinutes(mins) {
  const n = Number(mins);
  if (!Number.isFinite(n) || n < 0) return null;
  const h = Math.floor(n / 60), m = Math.round(n % 60);
  if (h > 0) return `${h} soat${m > 0 ? ` ${m} daqiqa` : ''}`;
  return `${m} daqiqa`;
}
