import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { statsAPI } from '../../api';
import SearchBar from '../../components/shared/SearchBar';
import { Gauge, Clock, AlertOctagon, MessageSquare, Package, TrendingUp } from 'lucide-react';

const ROLE_LABELS = { PICKER: 'Picker', MARKER: 'Marker', CHECKER: 'Checker' };
const ROLES = ['', 'PICKER', 'MARKER', 'CHECKER'];

const LEVEL_META = {
  good:    { label: "A'lo",     dot: 'bg-green-500',  border: 'border-green-200',  bg: 'bg-green-50',  text: 'text-green-700'  },
  average: { label: "O'rtacha", dot: 'bg-amber-500',   border: 'border-amber-200',  bg: 'bg-amber-50',  text: 'text-amber-700'  },
  poor:    { label: 'Zaif',     dot: 'bg-red-500',     border: 'border-red-200',    bg: 'bg-red-50',    text: 'text-red-700'    },
};

function EmployeeCard({ employee, onClick }) {
  const meta = LEVEL_META[employee.performanceLevel] || LEVEL_META.average;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white rounded-2xl border-2 ${meta.border} p-4 shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0">
            {employee.fullName?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 truncate">{employee.fullName}</p>
            <p className="text-xs text-gray-400">{ROLE_LABELS[employee.role]} · {employee.phone}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full shrink-0 ${meta.bg} ${meta.text}`}>
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} /> {meta.label}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          { icon: Package, label: 'Buyurtma', val: employee.totalOrders },
          { icon: Clock, label: 'Kech', val: employee.lateCount },
          { icon: AlertOctagon, label: 'Jarima', val: employee.totalPenaltyPoints },
          { icon: MessageSquare, label: 'Etiroz', val: employee.etirovCount },
        ].map(({ icon: Icon, label, val }) => (
          <div key={label} className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
            <Icon size={12} className="mx-auto text-gray-400 mb-0.5" />
            <p className="text-sm font-black text-gray-800">{val}</p>
            <p className="text-[9px] text-gray-400 font-bold uppercase">{label}</p>
          </div>
        ))}
      </div>
    </button>
  );
}

export default function EmployeePerformancePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['employee-performance-overview', role, search],
    queryFn: () => statsAPI.getEmployeePerformance({ role: role || undefined, search: search || undefined }),
    select: r => r.data,
  });

  const employees = data?.data || [];
  const goodCount = employees.filter(e => e.performanceLevel === 'good').length;
  const avgCount = employees.filter(e => e.performanceLevel === 'average').length;
  const poorCount = employees.filter(e => e.performanceLevel === 'poor').length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-2xl flex items-center justify-center">
            <Gauge size={18} className="text-blue-600" />
          </div>
          Xodimlar samaradorligi
        </h1>
        <p className="text-xs text-gray-400 mt-1 ml-12">
          Picker/Marker/Checker'larni kechikish, jarima va etirozlar bo'yicha bir-biriga nisbatan solishtiring
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3">
          <TrendingUp size={18} className="text-green-600" />
          <div><p className="text-2xl font-black text-green-700">{goodCount}</p><p className="text-[11px] text-gray-500 font-medium">A'lo</p></div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 flex items-center gap-3">
          <Gauge size={18} className="text-amber-600" />
          <div><p className="text-2xl font-black text-amber-700">{avgCount}</p><p className="text-[11px] text-gray-500 font-medium">O'rtacha</p></div>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 flex items-center gap-3">
          <AlertOctagon size={18} className="text-red-600" />
          <div><p className="text-2xl font-black text-red-700">{poorCount}</p><p className="text-[11px] text-gray-500 font-medium">Zaif</p></div>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap items-start">
        <SearchBar value={search} onChange={setSearch} placeholder="Ism yoki telefon bo'yicha qidirish..." wrapped={false} className="flex-1 min-w-[240px]" />
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {ROLES.map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${role === r ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {r ? ROLE_LABELS[r] : 'Barchasi'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-32 animate-pulse" />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Gauge size={28} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400 text-sm font-semibold">Xodim topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {employees.map(e => (
            <EmployeeCard key={e.id} employee={e} onClick={() => navigate(`/superadmin/employee-performance/${e.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
