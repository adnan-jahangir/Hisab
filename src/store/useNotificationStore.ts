import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createScopedStorage } from '../utils/roleScope';
import { apiFetch } from '../lib/api';

export type NotificationType = 'stock_low' | 'stock_out' | 'expense_warning' | 'payment_due' | 'milestone' | 'report_ready' | 'info';
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
  fetchNotifications: () => Promise<void>;
  addNotification: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
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

      fetchNotifications: async () => {
        try {
          const res = await apiFetch<Notification[]>('/notifications');
          if (Array.isArray(res)) {
            set({ notifications: res });
          }
        } catch (e) {
          console.error('Failed to fetch notifications:', e);
        }
      },

      addNotification: async (n) => {
        const localNotif: Notification = {
          ...n,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          read: false
        };

        set((state) => ({ notifications: [localNotif, ...state.notifications] }));

        try {
          const res = await apiFetch<Notification>('/notifications', {
            method: 'POST',
            body: n
          });
          if (res && res.id) {
            set((state) => ({
              notifications: state.notifications.map(item => item.id === localNotif.id ? res : item)
            }));
          }
        } catch (e) {
          console.error('Failed to persist notification on server:', e);
        }
      },

      markAsRead: async (id) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
        }));

        try {
          await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
        } catch (e) {
          console.error(`Failed to mark notification ${id} as read:`, e);
        }
      },

      markAllRead: async () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));

        try {
          await apiFetch('/notifications/read-all', { method: 'PUT' });
        } catch (e) {
          console.error('Failed to mark all notifications as read:', e);
        }
      },

      deleteNotification: async (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));

        try {
          await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
        } catch (e) {
          console.error(`Failed to delete notification ${id}:`, e);
        }
      },

      clearRead: () => set((state) => ({
        notifications: state.notifications.filter(n => !n.read)
      }))
    }),
    {
      name: 'hisab-notification-storage',
      storage: createJSONStorage(() => createScopedStorage('hisab-notifications')),
      partialize: (state) => (state),
    }
  )
);
