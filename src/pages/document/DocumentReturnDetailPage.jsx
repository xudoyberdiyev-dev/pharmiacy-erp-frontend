import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentAPI } from '../../api';
import { FILE_BASE_URL } from '../../api/axios';
import StatusBadge from '../../components/shared/StatusBadge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowLeft, Building2, FileSpreadsheet, Upload, X, Undo2,
  User2, CheckCircle
} from 'lucide-react';

const inp = "w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-400 focus:bg-white focus:shadow-md focus:shadow-indigo-100 transition-all";

function InfoCard({ label, value, sub }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3.5">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-black text-gray-900 mt-0.5">{value || '—'}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function DocumentReturnDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [newExcel, setNewExcel] = useState(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['document', 'order', id],
    queryFn: () => documentAPI.getOrderFull(id),
    select: r => r.data.data,
  });

  useEffect(() => {
    if (order?.returnedGoodsNote) setNote(order.returnedGoodsNote);
  }, [order?.returnedGoodsNote]);

  const submitMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('returnedGoodsNote', note);
      if (newExcel) fd.append('markedExcel', newExcel);
      return documentAPI.submitReturn(id, fd);
    },
    onSuccess: () => {
      toast.success('Qaytarilgan tovar qayd etildi');
      qc.invalidateQueries(['document']);
      navigate('/document/history');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const handleSubmit = () => {
    if (!note.trim()) return toast.error('Izoh yozish majburiy');
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!order) return <div className="text-center py-20 text-gray-400">Order topilmadi</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/document/history')}
          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors shrink-0">
          <ArrowLeft size={17} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-black text-gray-900 font-mono">#{order.invoiceNumber}</h1>
            <StatusBadge status={order.status} />
            {order.hasReturnedGoods && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-100">
                Qaytarilgan tovarlar mavjud
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 font-medium">Qaytarilgan tovarni qayd etish</p>
        </div>
      </div>

      {/* Client & order info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Building2 size={13} className="text-indigo-600" />
          </div>
          <h2 className="font-bold text-gray-800 text-sm">Buyurtma ma'lumotlari</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3.5 bg-indigo-50/60 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 text-white font-black">
              {order.client?.orgName?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-gray-900">{order.client?.orgName}</p>
              <p className="text-xs text-gray-400">{order.client?.phone} · {order.client?.address}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <InfoCard label="Shartnoma" value={order.contractNumber} />
            <InfoCard label="Lot" value={order.lotNumber} />
            <InfoCard label="Qutilar" value={order.boxCount} />
            <InfoCard label="Summa" value={order.totalAmount?.toLocaleString() + " so'm"} />
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
            <User2 size={13} className="text-purple-600" />
          </div>
          <h2 className="font-bold text-gray-800 text-sm">Jarayon ishtirokchilari</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoCard label="Order yaratuvchi" value={order.createdBy?.fullName} />
          <InfoCard label="Picker" value={order.assignedPicker?.fullName}
            sub={order.pickingDoneAt ? format(new Date(order.pickingDoneAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoCard label="Marker" value={order.marker?.fullName}
            sub={order.markingDoneAt ? format(new Date(order.markingDoneAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoCard label="Checker" value={order.checker?.fullName}
            sub={order.checkingDoneAt ? format(new Date(order.checkingDoneAt), 'dd.MM.yyyy HH:mm') : null} />
          <InfoCard label="Haydovchi" value={order.driver?.fullName}
            sub={order.vehicle ? `${order.vehicle.model} · ${order.vehicle.plateNumber}` : null} />
          <InfoCard label="Hujjatchi" value={order.dispatchDocument?.issuedBy?.fullName}
            sub={order.dispatchDocument ? `Hujjat № ${order.dispatchDocument.documentNumber}` : null} />
        </div>
      </div>

      {/* Marking excel + return form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
            <FileSpreadsheet size={13} className="text-amber-600" />
          </div>
          <h2 className="font-bold text-gray-800 text-sm">Marking Excel</h2>
        </div>
        <div className="p-5 space-y-4">
          {order.markedExcelUrl && !newExcel && (
            <a href={`${FILE_BASE_URL}${order.markedExcelUrl}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 hover:bg-amber-100 transition-colors w-fit">
              <FileSpreadsheet size={16} /> Joriy marking excelni ko'rish
            </a>
          )}
          <div>
            <label className="block text-xs text-gray-400 font-bold mb-1.5">Yangi marking excel yuklash (ixtiyoriy — mavjudini almashtiradi)</label>
            {newExcel ? (
              <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl w-fit">
                <FileSpreadsheet size={16} className="text-green-600 shrink-0" />
                <span className="text-sm text-green-700 flex-1 truncate">{newExcel.name}</span>
                <button onClick={() => setNewExcel(null)} className="text-green-400 hover:text-red-400 transition-colors"><X size={14} /></button>
              </div>
            ) : (
              <label className="flex items-center gap-2.5 p-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-sm text-gray-400 hover:text-indigo-600 w-fit">
                <Upload size={16} /> Excel tanlash
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={e => setNewExcel(e.target.files[0])} />
              </label>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 font-bold mb-1.5">Izoh <span className="text-red-500">*</span></label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={4}
              placeholder="Nima uchun va qancha miqdorda tovar qaytarildi..."
              className={inp}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-white
              bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700
              shadow-md shadow-red-200 transition-all disabled:opacity-50"
          >
            <Undo2 size={16} /> {submitMutation.isPending ? 'Saqlanmoqda...' : 'Qaytarilgan'}
          </button>
        </div>
      </div>

      {order.hasReturnedGoods && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-600 shrink-0" />
          <p className="text-sm font-bold text-emerald-700">
            Bu order allaqachon qaytarilgan deb belgilangan ({order.returnedGoodsBy?.fullName}, {order.returnedGoodsAt ? format(new Date(order.returnedGoodsAt), 'dd.MM.yyyy HH:mm') : ''})
          </p>
        </div>
      )}
    </div>
  );
}
