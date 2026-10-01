import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { timeAgoText } from '../../utils/timeText.js';
import { AppNotification, useNotifications } from '../../context/NotificationContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { notificationText } from '../../utils/notificationText.js';

const PATIENT_ROUTES: Record<string, string> = {
  ACCESS_REQUEST_RECEIVED: '/patient/privacy',
  CONNECTION_REQUESTED: '/patient/privacy',
  RECORD_NEEDS_REVIEW: '/patient/records',
  PRESCRIPTION_ISSUED: '/patient/prescriptions',
};

export const NotificationBell: React.FC<{ role: 'PATIENT' | 'DOCTOR' }> = ({ role }) => {
  const { t } = useLanguage();
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const onSelect = async (n: AppNotification) => {
    await markRead(n);
    setOpen(false);
    if (role === 'PATIENT' && n.type === 'PRESCRIPTION_ISSUED' && (n as any).data?.prescriptionId) navigate(`/patient/prescriptions/${(n as any).data.prescriptionId}`);
    else if (role === 'PATIENT' && PATIENT_ROUTES[n.type]) navigate(PATIENT_ROUTES[n.type]);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? t('Notifications, {count} unread', { count: unread }) : t('Notifications')}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[85vw] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-900">{t('Notifications')}</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />  {t('Mark all read')}
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {items.length === 0 && <p className="px-4 py-8 text-center text-xs text-slate-400">{t('You’re all caught up.')}</p>}
            {items.map((n) => (
              <button
                key={(n._id ?? n.id) as string}
                type="button"
                onClick={() => onSelect(n)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${n.readAt ? '' : 'bg-teal-50/50'}`}
              >
                <div className="flex items-start gap-2">
                  {!n.readAt && <span className="mt-1.5 w-2 h-2 rounded-full bg-teal-600 shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{notificationText(n).title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{notificationText(n).body}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgoText(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
