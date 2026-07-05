import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notificationAPI } from '../../api';
import socket from '../../lib/socket';

export default function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationAPI.getAll({ limit: 15 }),
    select: (r) => r.data,
    refetchInterval: 60000,
  });

  useEffect(() => {
    const onLate = () => qc.invalidateQueries({ queryKey: ['notifications'] });
    socket.on('alert:late', onLate);
    return () => socket.off('alert:late', onLate);
  }, [qc]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  const markRead = (id) => {
    notificationAPI.markRead(id).then(() => qc.invalidateQueries({ queryKey: ['notifications'] }));
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <Bell size={17} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <p className="text-[13px] font-bold text-gray-900">Ogohlantirishlar</p>
            {unreadCount > 0 && <span className="text-[11px] text-red-500 font-bold">{unreadCount} yangi</span>}
          </div>
          {notifications.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8">Ogohlantirish yo'q</p>
          ) : (
            <div className="py-1">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full text-left px-4 py-2.5 flex gap-2.5 hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-red-50/40' : ''}`}
                >
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-gray-900">{n.title}</p>
                    <p className="text-[11px] text-gray-500 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-gray-350 mt-0.5">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
