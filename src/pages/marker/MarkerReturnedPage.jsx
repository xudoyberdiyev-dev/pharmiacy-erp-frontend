import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { markerAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { format } from 'date-fns';
import {
  CheckCircle2, RotateCcw, User, FileSpreadsheet, Upload,
  MessageSquare, Package, X,
} from 'lucide-react';
import { formatSum } from '../../lib/format';

// ── Order card ────────────────────────────────────────────────────────────────
function ReturnedCard({ order }) {
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [done, setDone] = useState(false);

  const completeMut = useMutation({
    mutationFn: (formData) => markerAPI.complete(order.id, formData),
    onSuccess: () => {
      setDone(true);
      setTimeout(() => {
        toast.success('Buyurtma qayta yuborildi! Checking bo\'limiga o\'tdi.');
        qc.invalidateQueries(['marker-returned']);
        qc.invalidateQueries(['marker-mine']);
        qc.invalidateQueries(['marker-available']);
      }, 1200);
    },
    onError: e => {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.error(getErrorMessage(e));
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const cancelFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResend = () => {
    if (!selectedFile) {
      toast.error('Yangi Excel faylni tanlang');
      return;
    }
    const fd = new FormData();
    fd.append('markedExcel', selectedFile);
    completeMut.mutate(fd);
  };

  // Tibbiy buyum (masalan tibbiy asbob-uskuna) — bunday mahsulotlar seriya/lot
  // bo'yicha alohida belgilanmaydi, shuning uchun Excel talab qilinmaydi.
  const handleMedicalItem = () => {
    completeMut.mutate(new FormData());
  };

  if (done) {
    return (
      <div className="bg-white rounded-2xl border-2 border-green-300 shadow-sm flex flex-col items-center justify-center py-12 gap-3">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
          <CheckCircle2 size={30} className="text-green-500" />
        </div>
        <p className="text-sm font-black text-green-700">Qayta yuborildi! Checking bo'limiga o'tdi.</p>
        <p className="text-xs text-gray-400">#{order.invoiceNumber}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm hover:shadow-md transition-all">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-mono text-base font-black text-gray-900">#{order.invoiceNumber}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Qaytarildi: {order.returnedToMarkingAt ? format(new Date(order.returnedToMarkingAt), 'dd.MM HH:mm') : '—'}
            </p>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
            <RotateCcw size={10} /> QAYTARILGAN
          </span>
        </div>

        {/* Client */}
        <div className="flex items-center gap-2 mb-2 p-2.5 bg-gray-50 rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center text-white font-black text-sm shrink-0">
            {order.client?.orgName?.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{order.client?.orgName}</p>
            <p className="text-[11px] text-gray-400">{order.invoiceNumber}</p>
          </div>
        </div>

        {/* Checker */}
        {order.checker && (
          <div className="flex items-center gap-2 mb-2 px-2.5 py-2 bg-sky-50 rounded-xl border border-sky-100">
            <User size={12} className="text-sky-600 shrink-0" />
            <span className="text-xs font-bold text-sky-800">{order.checker.fullName}</span>
            <span className="text-[10px] text-gray-400 ml-auto">checker</span>
          </div>
        )}

        {/* Checker sababi */}
        <div className="flex items-start gap-2 mb-3 p-3 bg-red-50 rounded-xl border border-red-200">
          <MessageSquare size={14} className="text-red-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[10px] font-black text-red-500 uppercase tracking-wider mb-0.5">Checker sababi</p>
            <p className="text-sm font-semibold text-red-800 break-words">{order.returnReason || '—'}</p>
          </div>
        </div>

        {/* Eski Excel */}
        {order.markedExcelUrl && (
          <a
            href={`${import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'}${order.markedExcelUrl}`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 mb-3 bg-purple-50 border border-purple-200 rounded-xl text-xs font-bold text-purple-700 hover:bg-purple-100 transition-colors"
          >
            <FileSpreadsheet size={14} /> Oldingi yuklangan Excelni ko'rish
          </a>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between mt-1 mb-3">
          <span className="text-xs text-gray-500 font-medium">Faktura: {order.invoiceNumber}</span>
          <span className="text-xs font-bold text-gray-700">{formatSum(order.totalAmount)} so'm</span>
        </div>
      </div>

      {/* Yangi excel yuklash yoki tibbiy buyum bo'lsa Excelsiz o'tkazish */}
      <div className="px-4 pb-4 space-y-2">
        {selectedFile ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 p-3 bg-purple-50 rounded-xl border border-purple-200">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={15} className="text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-purple-900 truncate">{selectedFile.name}</p>
                <p className="text-[10px] text-purple-500 font-medium">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
              {!completeMut.isPending && (
                <button onClick={cancelFile} className="w-6 h-6 rounded-lg hover:bg-purple-200 flex items-center justify-center transition-colors shrink-0">
                  <X size={13} className="text-purple-500" />
                </button>
              )}
            </div>
            <button
              onClick={handleResend}
              disabled={completeMut.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white
                bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700
                shadow-md shadow-purple-200 transition-all disabled:opacity-70"
            >
              {completeMut.isPending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Yuborilmoqda...</>
                : <><Upload size={15} /> Checkerga qayta yuborish</>}
            </button>
          </div>
        ) : (
          <>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={completeMut.isPending}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold text-white
                bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700
                shadow-md shadow-purple-200 transition-all disabled:opacity-70"
            >
              <Upload size={15} /> Yangi Excel yuklash
            </button>
            <button
              onClick={handleMedicalItem}
              disabled={completeMut.isPending}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold
                border-2 border-teal-300 text-teal-700 bg-teal-50 hover:bg-teal-100 transition-all disabled:opacity-70"
            >
              {completeMut.isPending
                ? <><span className="w-4 h-4 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" /> Yuborilmoqda...</>
                : <>💊 Tibbiy buyum — Excelsiz yuborish</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function MarkerReturnedPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['marker-returned'],
    queryFn: markerAPI.getReturned,
    refetchInterval: 15000,
    select: r => r.data.data || [],
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <RotateCcw size={16} className="text-amber-600" />
          </div>
          Qaytgan buyurtmalar
        </h1>
        <p className="text-sm text-gray-400 mt-0.5 ml-10 font-medium">
          Checker qaytargan orderlar — Excelni tuzatib qayta yuboring (vaqt hisoblanmaydi)
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-72 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
              <div className="h-12 bg-gray-100 rounded mb-3" />
              <div className="h-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div className="w-16 h-16 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
            <Package size={28} className="text-amber-300" />
          </div>
          <p className="text-gray-500 text-sm font-semibold">Hozircha qaytgan order yo'q</p>
          <p className="text-gray-300 text-xs mt-1">Checker orderni qaytarsa shu yerda ko'rinadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map(o => <ReturnedCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
