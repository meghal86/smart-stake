/**
 * Notification Center
 * Real-time alerts and notifications for Guardian
 * Supports categorization, filtering, and inline actions
 */
import { useState, useEffect } from 'react';
import { Bell, Shield, Activity, Trophy, X, Check, ExternalLink, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export type NotificationPriority = 'critical' | 'important' | 'info' | 'achievement';
export type NotificationCategory = 'security' | 'activity' | 'achievement' | 'tip';

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | NotificationCategory>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : notifications.filter((n) => n.category === activeTab);

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'important':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'info':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'achievement':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
    }
  };

  const getPriorityIcon = (priority: NotificationPriority) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'important':
        return <Info className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'achievement':
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'activity':
        return <Activity className="h-4 w-4" />;
      case 'achievement':
        return <Trophy className="h-4 w-4" />;
      case 'tip':
        return <Info className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Mark notifications as read when opened
  useEffect(() => {
    if (open) {
      const unreadIds = notifications
        .filter((n) => !n.read)
        .map((n) => n.id);
      unreadIds.forEach((id) => {
        setTimeout(() => onMarkAsRead(id), 1000);
      });
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-slate-800/50 transition-all"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[400px] p-0 bg-slate-900/95 backdrop-blur-xl border-slate-700"
        sideOffset={8}
      >
        <div className="flex flex-col h-[600px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold text-slate-100">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClearAll}
                className="h-8 w-8 text-slate-400 hover:text-slate-300"
                aria-label="Clear all notifications"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full justify-start rounded-none border-b border-slate-700 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
              >
                <Shield className="h-4 w-4 mr-1" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
              >
                <Activity className="h-4 w-4 mr-1" />
                Activity
              </TabsTrigger>
              <TabsTrigger
                value="achievement"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
              >
                <Trophy className="h-4 w-4 mr-1" />
                Rewards
              </TabsTrigger>
            </TabsList>

            {/* Notification List */}
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400">
                      No notifications yet
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      You'll be notified about security alerts and achievements
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onDismiss={() => onDismiss(notification.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="p-3 border-t border-slate-700 bg-slate-900/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-slate-400 hover:text-slate-300"
              onClick={() => setOpen(false)}
            >
              View notification settings →
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const priorityColor = getPriorityColor(notification.priority);
  const priorityIcon = getPriorityIcon(notification.priority);
  const categoryIcon = notification.icon || getCategoryIcon(notification.category);

  return (
    <div
      className={cn(
        'group relative p-3 rounded-lg border transition-all hover:bg-slate-800/50',
        notification.read ? 'bg-transparent border-slate-800' : 'bg-slate-800/30 border-slate-700',
        priorityColor
      )}
    >
      {/* Unread Indicator */}
      {!notification.read && (
        <div className="absolute top-3 left-0 w-1 h-8 bg-blue-500 rounded-r" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
            priorityColor
          )}
        >
          {categoryIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-medium text-sm text-slate-100 leading-tight">
              {notification.title}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-300"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {formatTimestamp(notification.timestamp)}
            </span>

            {/* Action Button */}
            {(notification.actionLabel || notification.actionUrl) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-blue-400 hover:text-blue-300"
                onClick={() => {
                  if (notification.onAction) {
                    notification.onAction();
                  } else if (notification.actionUrl) {
                    window.open(notification.actionUrl, '_blank');
                  }
                }}
              >
                {notification.actionLabel || 'View'}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getPriorityColor(priority: NotificationPriority) {
  switch (priority) {
    case 'critical':
      return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'important':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'info':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'achievement':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
  }
}

function getPriorityIcon(priority: NotificationPriority) {
  switch (priority) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4" />;
    case 'important':
      return <Info className="h-4 w-4" />;
    case 'info':
      return <Info className="h-4 w-4" />;
    case 'achievement':
      return <Trophy className="h-4 w-4" />;
  }
}

function getCategoryIcon(category: NotificationCategory) {
  switch (category) {
    case 'security':
      return <Shield className="h-4 w-4" />;
    case 'activity':
      return <Activity className="h-4 w-4" />;
    case 'achievement':
      return <Trophy className="h-4 w-4" />;
    case 'tip':
      return <Info className="h-4 w-4" />;
  }
}

/**
 * Hook to manage notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    // Play sound for critical notifications
    if (notification.priority === 'critical') {
      playNotificationSound();
    }

    return newNotification.id;
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
  };
}

function playNotificationSound() {
  // Simple notification sound using Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

