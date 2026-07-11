import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PackageX, ShieldAlert, AlertTriangle } from 'lucide-react';
import { getErrorMessage } from '../../lib/errors';

// Bitta resurs (masalan bitta buyurtma) topilmagan holat uchun umumiy komponent —
// backend javobiga qarab (404/403/boshqa) tegishli xabar va ikonka ko'rsatadi.
export default function NotFoundState({
  error,
  notFoundText = 'Buyurtma topilmadi',
  forbiddenText = "Bu buyurtmaga kirish huquqingiz yo'q",
  backTo,
  onBack,
  hideBackButton,
}) {
  const navigate = useNavigate();
  const status = error?.response?.status;

  const { Icon, text } = status === 404
    ? { Icon: PackageX, text: notFoundText }
    : status === 403
    ? { Icon: ShieldAlert, text: forbiddenText }
    : { Icon: AlertTriangle, text: error ? getErrorMessage(error) : notFoundText };

  const handleBack = () => {
    if (onBack) return onBack();
    if (backTo) return navigate(backTo);
    navigate(-1);
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-400" />
      </div>
      <p className="text-sm font-bold text-gray-600 mb-4">{text}</p>
      {!hideBackButton && (
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={14} /> Orqaga
        </button>
      )}
    </div>
  );
}
