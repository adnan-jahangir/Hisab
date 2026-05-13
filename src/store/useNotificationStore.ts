import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createScopedStorage } from '../utils/roleScope';

export type NotificationType = 'stock_low' | 'stock_out' | 'expense_warning' | 'payment_due' | 'milestone' | 'report_ready';
export type NotificationPriority = 'low' | 'medium' | 'high';
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
  priority: NotificationPriority;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotification: (id: string) => void;
  clearRead: () => void;
  unreadCount: number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      get unreadCount() {
        return get().notifications.filter(n => !n.read).length;
      },

      addNotification: (n) => set((state) => {
        const newNotif: Notification = {
          ...n,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          read: false
        };
        return { notifications: [newNotif, ...state.notifications] };
      }),

      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        )
      })),

      markAllRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),

      deleteNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),

      clearRead: () => set((state) => ({
        notifications: state.notifications.filter(n => !n.read)
      }))
    }),
    {
      name: 'hisab-notification-storage',
      storage: createScopedStorage('hisab-notifications'),
      partialize: (state) => ({ notifications: state.notifications }),
    }
  )
);
