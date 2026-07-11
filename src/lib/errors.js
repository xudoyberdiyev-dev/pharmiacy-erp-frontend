export const DEFAULT_ERROR_MESSAGE = "Nimadir xato ketdi. Birozdan keyin qayta urinib ko'ring.";

export function getErrorMessage(e) {
  return e?.response?.data?.message || DEFAULT_ERROR_MESSAGE;
}
