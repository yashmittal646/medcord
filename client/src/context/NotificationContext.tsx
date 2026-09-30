import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, subscribeToNotifications } from '../services/api.js';
import { useToast } from './ToastContext.js';

export interface AppNotification {
  id?: string;
  _id?: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  createdAt: string;
  readAt?: string | null;
}

interface NotificationContextType {
  items: AppNotification[];
  unread: number;
  markRead: (n: AppNotification) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const idOf = (n: AppNotification) => (n._id ?? n.id) as string;
const POLL_MS = 60_000;

export const NEW_NOTIFICATION_EVENT = 'medcord:notification';

/** One live stream per signed-in session; polling covers dropped connections and multi-instance servers */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const seen = useRef(new Set<string>());

  const refresh = useCallback(async () => {
    try {
      const res = await api.listNotifications();
      res.data.items.forEach((n: AppNotification) => seen.current.add(idOf(n)));
      setItems(res.data.items);
      setUnread(res.data.unread);
    } catch {
      /* transient; the next poll retries */
    }
  }, []);

  useEffect(() => {
    refresh();
    const stop = subscribeToNotifications((n) => {
      const id = idOf(n);
      if (seen.current.has(id)) return;
      seen.current.add(id);
      setItems((prev) => [n, ...prev].slice(0, 50));
      setUnread((u) => u + 1);
      showToast(`${n.title}: ${n.body}`, 'info');
      window.dispatchEvent(new CustomEvent(NEW_NOTIFICATION_EVENT, { detail: n }));
    });
    const poll = setInterval(refresh, POLL_MS);
    return () => {
      stop();
      clearInterval(poll);
    };
  }, [refresh, showToast]);

  const markRead = async (n: AppNotification) => {
    if (n.readAt) return;
    setItems((prev) => prev.map((x) => (idOf(x) === idOf(n) ? { ...x, readAt: new Date().toISOString() } : x)));
    setUnread((u) => Math.max(0, u - 1));
    await api.markNotificationRead(idOf(n)).catch(() => undefined);
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    setUnread(0);
    await api.markAllNotificationsRead().catch(() => undefined);
  };

  return (
    <NotificationContext.Provider value={{ items, unread, markRead, markAllRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
