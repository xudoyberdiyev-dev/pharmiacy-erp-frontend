import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { dataRetentionAPI } from '../../api';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../lib/errors';
import { DatabaseZap, Search, Download, Trash2, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

function ConfirmPurgeModal({ preview, from, to, onClose, onDone }) {
  const [input, setInput] = useState('');
  const matches = input.trim() !== '' && Number(input) === preview.count;

  const mutation = useMutation({
    mutationFn: () => dataRetentionAPI.purgeOrders({ from, to, confirmCount: Number(input) }),
    onSuccess: (res) => {
      toast.success(`${res.data.deletedCount} ta eski buyurtma butunlay o'chirildi`);
      onDone();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="font-black text-gray-900 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" /> Butunlay o'chirishni tasdiqlash
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">
              Bu amal <strong>qaytarib bo'lmaydi</strong>. {preview.count} ta buyurtma va ularga bog'liq barcha
              yozuvlar (etiroz, jarima, tracking, bildirishnoma) bazadan butunlay o'chiriladi.
            </p>
          </div>
          <div>
            <label className="label">
              Tasdiqlash uchun buyurtmalar sonini kiriting: <strong>{preview.count}</strong>
            </label>
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder={String(preview.count)}
              autoFocus
            />
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Bekor qilish</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!matches || mutation.isPending}
            className="flex-1 rounded-xl font-bold text-sm py-2.5 text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'O\'chirilmoqda...' : 'Ha, butunlay o\'chirish'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DataRetentionPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [preview, setPreview] = useState(null);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const resetRange = () => {
    setPreview(null);
    setBackupDownloaded(false);
  };

  const previewMutation = useMutation({
    mutationFn: () => dataRetentionAPI.getPurgePreview({ from, to }),
    onSuccess: (res) => {
      setPreview(res.data);
      setBackupDownloaded(false);
    },
    onError: (e) => { setPreview(null); toast.error(getErrorMessage(e)); },
  });

  const exportMutation = useMutation({
    mutationFn: () => dataRetentionAPI.exportOrders({ from, to }),
    onSuccess: (res) => {
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `orderlar-zaxira-${from}_${to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setBackupDownloaded(true);
      toast.success('Zaxira fayl yuklab olindi');
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const canPreview = from && to;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-2xl flex items-center justify-center">
            <DatabaseZap size={18} className="text-slate-700" />
          </div>
          Eski buyurtmalarni zaxiralab, o'chirish
        </h1>
        <p className="text-xs text-gray-400 mt-1 ml-12">
          Tanlangan sana oralig'idagi buyurtmalar avval Excel'ga zaxiralanadi, so'ng butunlay bazadan o'chiriladi.
          So'nggi 30 kunlik buyurtmalar hech qachon o'chirilmaydi.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Boshlanish sanasi</label>
            <input type="date" className="input" value={from} onChange={(e) => { setFrom(e.target.value); resetRange(); }} />
          </div>
          <div>
            <label className="label">Tugash sanasi</label>
            <input type="date" className="input" value={to} onChange={(e) => { setTo(e.target.value); resetRange(); }} />
          </div>
        </div>
        <button
          onClick={() => previewMutation.mutate()}
          disabled={!canPreview || previewMutation.isPending}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <Search size={15} /> {previewMutation.isPending ? 'Tekshirilmoqda...' : 'Ko\'rish'}
        </button>
      </div>

      {preview && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">
          {preview.count === 0 ? (
            <p className="text-sm text-gray-400 font-semibold">Tanlangan oraliqda buyurtma topilmadi</p>
          ) : (
            <>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Topildi</p>
                <p className="text-2xl font-black text-gray-900">{preview.count} ta buyurtma</p>
                <p className="text-sm text-gray-500 mt-1">
                  Jami summa: <strong>{(preview.totalAmount || 0).toLocaleString()} so'm</strong>
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">1</span>
                  <button
                    onClick={() => exportMutation.mutate()}
                    disabled={exportMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    <Download size={15} /> {exportMutation.isPending ? 'Yuklanmoqda...' : 'Zaxira nusxasini yuklab olish'}
                  </button>
                  {backupDownloaded && <CheckCircle2 size={18} className="text-green-600" />}
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center shrink-0">2</span>
                  <div>
                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={!backupDownloaded}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:hover:bg-red-50"
                    >
                      <Trash2 size={15} /> Butunlay o'chirish
                    </button>
                    {!backupDownloaded && (
                      <p className="text-xs text-gray-400 mt-1">Avval zaxirani yuklab oling</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showConfirm && preview && (
        <ConfirmPurgeModal
          preview={preview}
          from={from}
          to={to}
          onClose={() => setShowConfirm(false)}
          onDone={() => {
            setShowConfirm(false);
            setPreview(null);
            setBackupDownloaded(false);
            setFrom('');
            setTo('');
          }}
        />
      )}
    </div>
  );
}
