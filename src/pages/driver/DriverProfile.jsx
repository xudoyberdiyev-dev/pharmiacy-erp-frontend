import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Phone, User } from 'lucide-react';

export default function DriverProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-[#3B5BFD] flex items-center justify-center text-white text-2xl font-black mb-3">
          {initials}
        </div>
        <p className="font-black text-gray-900 text-lg">{user?.fullName}</p>
        <p className="text-sm text-gray-400">{user?.phone}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        <div className="flex items-center gap-3 p-4">
          <User size={17} className="text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Rol</p>
            <p className="text-sm font-bold text-gray-800">Haydovchi</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4">
          <Phone size={17} className="text-gray-400" />
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Telefon</p>
            <p className="text-sm font-bold text-gray-800">{user?.phone}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-2xl py-3.5 text-sm font-bold active:bg-red-100 transition-colors"
      >
        <LogOut size={17} /> Chiqish
      </button>
    </div>
  );
}
