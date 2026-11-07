import { useNavigate } from 'react-router-dom';
import { useAccept, useIsDesktop, useUndoAccept } from './usePickerData';
import { Mono, useToast } from '../design/ui';
import { getErrorMessage } from '../../../lib/errors';

// "Qabul qilish va boshlash": taymer boshlanadi, qora toastda "Bekor · 5" bilan qisqa bekor qilish oynasi.
// Desktopda qabul qilingan order darhol o'ng panelda ochiladi, mobilda dizayndagidek ro'yxatda qolinadi.
export default function useAcceptFlow() {
  const accept = useAccept();
  const undo = useUndoAccept();
  const toast = useToast();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  const start = (order) => {
    accept.mutate(order.id, {
      onSuccess: () => {
        toast.undo({
          text: (
            <>
              <Mono className="font-bold">#{order.invoiceNumber}</Mono> qabul qilindi.<br />Taymer boshlandi.
            </>
          ),
          onUndo: () => undo.mutate(order.id, {
            onSuccess: () => toast.success('Qabul bekor qilindi — buyurtma navbatga qaytdi'),
            onError: (e) => toast.error(getErrorMessage(e)),
          }),
        });
        if (isDesktop) navigate(`/picker/orders/${order.id}`);
      },
      onError: (e) => toast.error(getErrorMessage(e)),
    });
  };

  return { start, pendingId: accept.isPending ? accept.variables : null };
}
