import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userAPI } from '../../api';
import {
  X, FileSpreadsheet, CheckSquare, Square, User2, Truck,
  ShieldCheck, ClipboardCheck, UserCog, Building2
} from 'lucide-react';
import { formatSum } from '../../lib/format';

const COLUMN_OPTIONS = [
  { key: 'phone',    label: 'Telefon raqami' },
  { key: 'inn',      label: 'INN raqami' },
  { key: 'faktura',  label: 'Faktura raqami' },
  { key: 'contract', label: 'Shartnoma raqami' },
  { key: 'boxCount', label: 'Qutilar soni' },
  { key: 'amount',   label: 'Summa' },
];

function CheckRow({ checked, onToggle, icon: Icon, label, sub }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 text-left transition-colors ${
        checked ? 'bg-emerald-50/70 border-emerald-200' : 'bg-gray-50 border-transparent hover:border-gray-200'
      }`}
    >
      {checked ? <CheckSquare size={17} className="text-emerald-600 shrink-0" /> : <Square size={17} className="text-gray-400 shrink-0" />}
      {Icon && <Icon size={14} className="text-gray-400 shrink-0" />}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
      </div>
    </button>
  );
}

export default function DocumentBuilderModal({ orders, onClose, onConfirm, loading }) {
  const [columns, setColumns] = useState(() => Object.fromEntries(COLUMN_OPTIONS.map(c => [c.key, true])));
  const [footer, setFooter] = useState({ documenter: true, deliverer: true, checker: true, creator: true });
  const [accountantId, setAccountantId] = useState('');
  const [adminId, setAdminId] = useState('');

  const { data: accountants1 } = useQuery({
    queryKey: ['users', 'ACCOUNTANT1'],
    queryFn: () => userAPI.getAll({ role: 'ACCOUNTANT1', isActive: true }),
    select: r => r.data.data,
  });
  const { data: accountants2 } = useQuery({
    queryKey: ['users', 'ACCOUNTANT2'],
    queryFn: () => userAPI.getAll({ role: 'ACCOUNTANT2', isActive: true }),
    select: r => r.data.data,
  });
  const accountants = [...(accountants1 || []), ...(accountants2 || [])];
  const { data: admins } = useQuery({
    queryKey: ['users', 'ADMIN'],
    queryFn: () => userAPI.getAll({ role: 'ADMIN', isActive: true }),
    select: r => r.data.data,
  });

  const toggleColumn = (key) => setColumns(p => ({ ...p, [key]: !p[key] }));
  const toggleFooter = (key) => setFooter(p => ({ ...p, [key]: !p[key] }));

  const driverNames = [...new Set(orders.map(o => o.driver?.fullName).filter(Boolean))].join(', ');
  const vehicleNames = [...new Set(orders.map(o => o.vehicle ? `${o.vehicle.model} · ${o.vehicle.plateNumber}` : null).filter(Boolean))].join(', ');
  const checkerNames = [...new Set(orders.map(o => o.checker?.fullName).filter(Boolean))].join(', ');
  const creatorNames = [...new Set(orders.map(o => o.createdBy?.fullName).filter(Boolean))].join(', ');

  const totalAmount = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalBoxes = orders.reduce((s, o) => s + (o.boxCount || 0), 0);

  const handleConfirm = () => {
    const selectedColumns = COLUMN_OPTIONS.filter(c => columns[c.key]).map(c => c.key);
    onConfirm(selectedColumns, { ...footer, accountantId: accountantId || null, adminId: adminId || null });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileSpreadsheet size={16} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Hujjatlashtirish</h3>
              <p className="text-xs text-gray-400">{orders.length} ta order · {totalBoxes} quti · {formatSum(totalAmount)} so'm</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Orders */}
          <div className="max-h-28 overflow-y-auto space-y-1.5 bg-gray-50 rounded-xl p-2.5">
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between px-2.5 py-1.5 bg-white rounded-lg text-xs">
                <span className="font-mono font-bold text-gray-700">{o.invoiceNumber}</span>
                <span className="text-gray-500 truncate max-w-[200px]">{o.client?.orgName}</span>
              </div>
            ))}
          </div>

          {/* Columns */}
          <div>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Jadval ustunlari</p>
            <div className="grid grid-cols-2 gap-2">
              {COLUMN_OPTIONS.map(c => (
                <CheckRow key={c.key} checked={columns[c.key]} onToggle={() => toggleColumn(c.key)} label={c.label} />
              ))}
            </div>
          </div>

          {/* Footer info */}
          <div>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Pastki ma'lumotlar</p>
            <div className="space-y-2">
              <CheckRow checked={footer.documenter} onToggle={() => toggleFooter('documenter')}
                icon={FileSpreadsheet} label="Hujjatlashtiruvchi" sub="Siz" />
              <CheckRow checked={footer.deliverer} onToggle={() => toggleFooter('deliverer')}
                icon={Truck} label="Yetkazib beruvchi" sub={`${driverNames || '—'}${vehicleNames ? ' · ' + vehicleNames : ''}`} />
              <CheckRow checked={footer.checker} onToggle={() => toggleFooter('checker')}
                icon={ClipboardCheck} label="Tekshiruvchi" sub={checkerNames || '—'} />
              <CheckRow checked={footer.creator} onToggle={() => toggleFooter('creator')}
                icon={UserCog} label="Buyurtma yaratuvchi" sub={creatorNames || '—'} />
            </div>
          </div>

          {/* Accountant / Admin pick */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Building2 size={13} className="text-gray-400" /> Bugalter
              </label>
              <select
                value={accountantId}
                onChange={e => setAccountantId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
              >
                <option value="">— Tanlanmagan —</option>
                {(accountants || []).map(a => (
                  <option key={a.id} value={a.id}>{a.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-gray-400" /> Tasdiqlovchi (Admin)
              </label>
              <select
                value={adminId}
                onChange={e => setAdminId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-colors"
              >
                <option value="">— Tanlanmagan —</option>
                {(admins || []).map(a => (
                  <option key={a.id} value={a.id}>{a.fullName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="p-5 border-t border-gray-50 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Ortga
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl text-sm font-bold hover:from-indigo-600 hover:to-violet-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-200"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yaratilmoqda...</>
              : <><FileSpreadsheet size={15} /> Hujjat yaratish</>}
          </button>
        </div>
      </div>
    </div>
  );
}
