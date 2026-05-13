import React from 'react';
import { Bell, CheckCheck, Clock3, Filter, Trash2, AlertCircle, ChevronRight } from 'lucide-react';

import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { useTranslation } from '../hooks/useTranslation';
import { useNotificationStore, Notification } from '../store/useNotificationStore';

const demoNotifications: Notification[] = [
  {
    id: 'demo-1',
    type: 'stock_low',
    title: 'Stock running low',
    body: 'Alim Tea leaves are below the warning threshold.',
    read: false,
    createdAt: new Date().toISOString(),
    priority: 'high',
  },
  {
    id: 'demo-2',
    type: 'payment_due',
    title: 'Payment due today',
    body: 'A customer payment is due in the afternoon.',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    priority: 'medium',
  },
  {
    id: 'demo-3',
    type: 'report_ready',
    title: 'Weekly report ready',
    body: 'Your weekly performance summary has been generated.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    priority: 'low',
  },
];

function formatTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function typeTone(type: Notification['type']) {
  switch (type) {
    case 'stock_low':
    case 'stock_out':
      return 'warning';
    case 'expense_warning':
      return 'danger';
    case 'payment_due':
      return 'info';
    default:
      return 'default';
  }
}

export default function Notifications() {
  const { t } = useTranslation();
  const notifications = useNotificationStore((state) => state.notifications);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const clearRead = useNotificationStore((state) => state.clearRead);

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm text-text-muted">Home / {t('notifications')}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mt-1">{t('notificationCenter')}</h1>
          <p className="text-sm text-text-muted mt-2 max-w-2xl">{notifications.length ? t('allCaughtUp') : t('notificationsPreview')}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" icon={CheckCheck} onClick={markAllRead}>
            {t('markAllRead')}
          </Button>
          <Button variant="ghost" icon={Trash2} onClick={clearRead}>
            {t('clearRead')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">{t('notifications')}</p>
              <h3 className="text-2xl font-semibold text-text-primary mt-1">{notifications.length}</h3>
            </div>
            <div className="h-11 w-11 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary">
              <Bell className="h-5 w-5" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Unread</p>
              <h3 className="text-2xl font-semibold text-text-primary mt-1">{unreadCount}</h3>
            </div>
            <div className="h-11 w-11 rounded-full bg-warning/10 flex items-center justify-center text-warning">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Read</p>
              <h3 className="text-2xl font-semibold text-text-primary mt-1">{notifications.length - unreadCount}</h3>
            </div>
            <div className="h-11 w-11 rounded-full bg-success/10 flex items-center justify-center text-success">
              <CheckCheck className="h-5 w-5" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-muted">Latest</p>
              <h3 className="text-lg font-semibold text-text-primary mt-2 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-text-muted" />
                {formatTime(notifications[0]?.createdAt ?? new Date().toISOString())}
              </h3>
            </div>
            <div className="h-11 w-11 rounded-full bg-bg-elevated flex items-center justify-center text-text-muted">
              <Filter className="h-5 w-5" />
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">Recent Activity</h2>
            <p className="text-sm text-text-muted mt-1">System and business alerts appear here.</p>
          </div>
          <Badge variant={unreadCount > 0 ? 'warning' : 'success'} dot>
            {unreadCount > 0 ? `${unreadCount} unread` : t('allCaughtUp')}
          </Badge>
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t('noNotifications')}
            description={t('notificationsPreview')}
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition-colors ${item.read ? 'bg-bg-card border-border' : 'bg-accent-primary/5 border-accent-primary/20'}`}
              >
                <div className={`mt-1 h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${item.read ? 'bg-bg-elevated text-text-muted' : 'bg-accent-primary/10 text-accent-primary'}`}>
                  <Bell className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-text-primary">{item.title}</h3>
                      <p className="text-sm text-text-muted mt-1">{item.body}</p>
                    </div>
                    <Badge variant={typeTone(item.type)}>
                      {item.priority}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                    <span>{formatTime(item.createdAt)}</span>
                    <span className="h-1 w-1 rounded-full bg-text-muted/50" />
                    <span>{item.type.replace('_', ' ')}</span>
                  </div>
                </div>

                <ChevronRight className="mt-2 h-5 w-5 text-text-muted shrink-0" />
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}