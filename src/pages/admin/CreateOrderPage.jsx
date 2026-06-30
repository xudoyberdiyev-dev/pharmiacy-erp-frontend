import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { clientAPI, orderAPI, userAPI } from '../../api';
import toast from 'react-hot-toast';
import { Upload, ArrowLeft, X } from 'lucide-react';

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clientId: '', contractNumber: '', invoiceNumber: '', lotNumber: '',
    totalAmount: '', pickingDeadline: '', markingDeadline: '', checkingDeadline: '',
    assignedPickerId: '',
  });
  const [excelFile, setExcelFile] = useState(null);

  const { data: clientsRes } = useQuery({
    queryKey: ['clients', 'all'],
    queryFn: () => clientAPI.getAll({ limit: 200 }),
    select: r => r.data.data,
  });

  const { data: pickersRes } = useQuery({
    queryKey: ['users', 'PICKER'],
    queryFn: () => userAPI.getAll({ role: 'PICKER' }),
    select: r => r.data.data,
  });

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (excelFile) fd.append('productsExcel', excelFile);
      return orderAPI.create(fd);
    },
    onSuccess: () => {
      toast.success('Order muvaffaqiyatli yaratildi!');
      navigate('/admin/orders');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-2xl font-bold">Yangi order yaratish</h1>
      </div>

      <div className="card space-y-5">
        {/* Klient */}
        <div>
          <label className="label">Klient *</label>
          <select className="input" value={form.clientId} onChange={set('clientId')}>
            <option value="">— Klient tanlang —</option>
            {(clientsRes || []).map(c => (
              <option key={c.id} value={c.id}>{c.orgName} ({c.inn})</option>
            ))}
          </select>
        </div>

        {/* Raqamlar */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Shartnoma raqami *</label>
            <input className="input" placeholder="SH-2024-001" value={form.contractNumber} onChange={set('contractNumber')} />
          </div>
          <div>
            <label className="label">Faktura raqami *</label>
            <input className="input" placeholder="F-001" value={form.invoiceNumber} onChange={set('invoiceNumber')} />
          </div>
          <div>
            <label className="label">Lot raqami *</label>
            <input className="input" placeholder="LOT-001" value={form.lotNumber} onChange={set('lotNumber')} />
          </div>
        </div>

        {/* Summa */}
        <div>
          <label className="label">Umumiy summa (so'm) *</label>
          <input className="input" type="number" placeholder="1 500 000" value={form.totalAmount} onChange={set('totalAmount')} />
        </div>

        {/* Vaqtlar */}
        <div>
          <h3 className="font-medium text-gray-700 mb-3">⏰ Vaqt belgilash</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Picking deadline *</label>
              <input className="input" type="datetime-local" value={form.pickingDeadline} onChange={set('pickingDeadline')} />
            </div>
            <div>
              <label className="label">Marking deadline *</label>
              <input className="input" type="datetime-local" value={form.markingDeadline} onChange={set('markingDeadline')} />
            </div>
            <div>
              <label className="label">Cheking deadline *</label>
              <input className="input" type="datetime-local" value={form.checkingDeadline} onChange={set('checkingDeadline')} />
            </div>
          </div>
        </div>

        {/* Picker biriktirish (optional) */}
        <div>
          <label className="label">Picker biriktirish (ixtiyoriy)</label>
          <select className="input" value={form.assignedPickerId} onChange={set('assignedPickerId')}>
            <option value="">— Picker tanlang (ixtiyoriy) —</option>
            {(pickersRes || []).map(u => (
              <option key={u.id} value={u.id}>{u.fullName} ({u.phone})</option>
            ))}
          </select>
        </div>

        {/* Dorilar Excel */}
        <div>
          <label className="label">Tayyor mahsulotlar ro'yxati (Excel, ixtiyoriy)</label>
          {excelFile ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-1 text-sm text-green-700 font-medium">{excelFile.name}</div>
              <button onClick={() => setExcelFile(null)} className="text-green-500 hover:text-green-700">
                <X size={18} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload size={24} className="text-gray-400" />
              <span className="text-sm text-gray-500">Excel faylni yuklash (.xlsx, .xls)</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={e => setExcelFile(e.target.files[0])}
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => navigate(-1)} className="btn-secondary flex-1">Bekor qilish</button>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="btn-primary flex-1"
        >
          {mutation.isPending ? 'Yaratilmoqda...' : 'Order yaratish'}
        </button>
      </div>
    </div>
  );
}
