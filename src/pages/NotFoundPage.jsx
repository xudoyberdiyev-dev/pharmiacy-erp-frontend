import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, ArrowLeft } from 'lucide-react';

const ROOT_REDIRECTS = {
  ADMIN: '/admin', SUPER_ADMIN: '/superadmin', SYSTEM_OWNER: '/system-owner',
  OPERATOR: '/operator',
  PICKER: '/picker', MARKER: '/marker',
  CHECKER: '/checker', DRIVER: '/driver',
  ACCOUNTANT1: '/accountant1', ACCOUNTANT2: '/accountant2',
  DOCUMENT: '/document',
};

export default function NotFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const target = user ? (ROOT_REDIRECTS[user.role] || '/login') : '/login';

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-5">
          <Compass size={28} className="text-blue-600" />
        </div>
        <p className="text-5xl font-black text-gray-900 tracking-tight mb-2">404</p>
        <h1 className="text-lg font-black text-gray-900 mb-2">Sahifa topilmadi</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Siz qidirayotgan sahifa mavjud emas yoki ko'chirilgan bo'lishi mumkin.
        </p>
        <button
          onClick={() => navigate(target, { replace: true })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft size={15} /> Bosh sahifaga qaytish
        </button>
      </div>
    </div>
  );
}
