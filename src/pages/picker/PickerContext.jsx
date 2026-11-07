import { createContext, useContext } from 'react';

// PickerLayout beradigan umumiy holat: foydalanuvchi, bildirishnomalar, ulanish holati, yangilash.
const PickerCtx = createContext(null);
export const PickerProvider = PickerCtx.Provider;

export function usePicker() {
  const ctx = useContext(PickerCtx);
  if (!ctx) throw new Error('usePicker faqat PickerLayout ichida ishlaydi');
  return ctx;
}
