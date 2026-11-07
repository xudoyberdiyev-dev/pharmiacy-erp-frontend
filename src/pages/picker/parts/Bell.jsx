import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, MessageSquareWarning, Package, RotateCcw } from 'lucide-react';
import { usePicker } from '../PickerContext';
import { timeAgo } from '../lib/notifications';
import { IconBtn, cx } from '../design/ui';

const KIND_ICON = { new: Package, returned: RotateCcw, etirov: MessageSquareWarning };
const KIND_TONE = { new: 'bg-blue-100 text-blue-700', returned: 'bg-amber-100 text-amber-800', etirov: 'bg-red-100 text-red-700' };

export default function BellButton({ size = 48 }) {
  const { notifications } = usePicker();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const openItem = (n) => {
    notifications.markRead(n.id);
    setOpen(false);
    if (!n.orderId) return;
    navigate(n.kind === 'etirov' ? `/picker/etirozlar/${n.orderId}` : n.kind === 'new' ? '/picker/queue' : `/picker/orders/${n.orderId}`);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <IconBtn
        label={notifications.unread ? `Bildirishnomalar (${notifications.unread} ta yangi)` : 'Bildirishnomalar'}
        icon={Bell} size={size} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="true"
      />
      {notifications.unread > 0 && (
        <span className="pointer-events-none absolute right-[11px] top-[11px] h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" aria-hidden="true" />
      )}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[330px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.14)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-[14px] font-bold text-slate-900">Bildirishnomalar</p>
            {notifications.unread > 0 && (
              <button type="button" onClick={notifications.markAllRead} className="inline-flex items-center gap-1 text-[12px] font-semibold text-blue-700 hover:underline">
                <CheckCheck size={14} aria-hidden="true" /> Hammasi o'qildi
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.items.length === 0 ? (
              <p className="px-4 py-8 text-center text-[13px] text-slate-500">Hozircha bildirishnoma yo'q</p>
            ) : notifications.items.map((n) => {
              const Icon = KIND_ICON[n.kind] || Bell;
              return (
                <button
                  key={n.id} type="button" onClick={() => openItem(n)}
                  className={cx('flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50', !n.read && 'bg-blue-50/40')}
                >
                  <span className={cx('mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', KIND_TONE[n.kind] || 'bg-slate-100 text-slate-600')}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-slate-900">{n.title}</span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Yangi" />}
                    </span>
                    {n.text && <span className="mt-0.5 block truncate text-[12.5px] text-slate-600">{n.text}</span>}
                    <span className="mt-0.5 block text-[11.5px] text-slate-400">{timeAgo(n.at)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
