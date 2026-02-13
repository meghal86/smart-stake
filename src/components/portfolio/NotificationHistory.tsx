/**
 * NotificationHistory Component
 * 
 * Display user's notification history with filtering and read status
 * 
 * Requirements: 11.3, 11.4
 */

'use client';

import { useState } from 'react';
import { useNotificationHistory } from '@/hooks/usePortfolioNotifications';
import type { NotificationSeverity } from '@/lib/portfolio/notification-service';
import { Bell, CheckCircle, Clock, ExternalLink } from 'lucide-react';

const SEVERITY_COLORS: Record<NotificationSeverity, string> = {
  critical: 'text-red-500 bg-red-500/10 border-red-500/20',
  high: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
};

export function NotificationHistory() {
  const [severityFilter, setSeverityFilter] = useState<NotificationSeverity | undefined>();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { notifications, total, isLoading, markAsRead } = useNotificationHistory({
    limit: 20,
    severity: severityFilter,
    unreadOnly,
  });

  const handleMarkAsRead = (eventId: string) => {
    markAsRead({ eventId, channel: 'web_push' });
  };

  const isNotificationRead = (notification: typeof notifications[0]) => {
    return notification.deliveries.some((d) => d.status === 'read');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
        <div className="flex items-center gap-4">
          <label className="text-sm text-white/60">Filter by severity:</label>
          <select
            value={severityFilter || ''}
            onChange={(e) =>
              setSeverityFilter(
                e.target.value ? (e.target.value as NotificationSeverity) : undefined
              )
            }
            className="px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-sm text-white">Unread only</span>
        </label>
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="p-8 text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
          <Bell className="w-12 h-12 mx-auto mb-3 text-white/20" />
          <p className="text-white/60">No notifications found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const isRead = isNotificationRead(notification);
            const severityColor = SEVERITY_COLORS[notification.severity];

            return (
              <div
                key={notification.id}
                className={`p-4 bg-white/5 backdrop-blur-md border rounded-lg transition-all ${
                  isRead ? 'border-white/10 opacity-60' : 'border-cyan-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded border ${severityColor}`}
                      >
                        {notification.severity}
                      </span>
                      {!isRead && (
                        <span className="px-2 py-0.5 text-xs font-medium text-cyan-500 bg-cyan-500/10 border border-cyan-500/20 rounded">
                          New
                        </span>
                      )}
                      <span className="text-xs text-white/40">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Content */}
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">
                        {notification.payload.title}
                      </h4>
                      <p className="text-sm text-white/70">
                        {notification.payload.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                      {notification.deepLink && (
                        <a
                          href={notification.deepLink}
                          className="inline-flex items-center gap-1 text-xs text-cyan-500 hover:text-cyan-400 transition-colors"
                        >
                          {notification.payload.actionLabel || 'View Details'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {!isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex-shrink-0">
                    {isRead ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-cyan-500" />
                    )}
                  </div>
                </div>

                {/* Delivery Status (collapsed by default) */}
                {notification.deliveries.length > 0 && (
                  <details className="mt-3 pt-3 border-t border-white/10">
                    <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">
                      Delivery status ({notification.deliveries.length} channels)
                    </summary>
                    <div className="mt-2 space-y-1">
                      {notification.deliveries.map((delivery, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="text-white/60 capitalize">
                            {delivery.channel.replace('_', ' ')}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded ${
                              delivery.status === 'read'
                                ? 'text-green-500 bg-green-500/10'
                                : delivery.status === 'sent'
                                ? 'text-blue-500 bg-blue-500/10'
                                : delivery.status === 'failed'
                                ? 'text-red-500 bg-red-500/10'
                                : 'text-white/40 bg-white/5'
                            }`}
                          >
                            {delivery.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Total Count */}
      {total > notifications.length && (
        <div className="text-center text-sm text-white/60">
          Showing {notifications.length} of {total} notifications
        </div>
      )}
    </div>
  );
}
