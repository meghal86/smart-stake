/**
 * usePortfolioNotifications Hook
 * 
 * React hook for managing portfolio notifications
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  NotificationPreferences,
  NotificationSeverity,
} from '@/lib/portfolio/notification-service';

interface NotificationEvent {
  id: string;
  type: string;
  severity: NotificationSeverity;
  scopeKey: string;
  deepLink: string;
  payload: {
    title: string;
    message: string;
    actionLabel?: string;
    metadata?: Record<string, unknown>;
  };
  createdAt: string;
  deliveries: Array<{
    eventId: string;
    channel: string;
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
    sentAt?: string;
    readAt?: string;
    error?: string;
  }>;
}

interface NotificationHistoryResponse {
  notifications: NotificationEvent[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Fetch notification preferences
 */
async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const response = await fetch('/api/v1/portfolio/notification-prefs', {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notification preferences');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Update notification preferences
 */
async function updatePreferences(
  preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  const response = await fetch('/api/v1/portfolio/notification-prefs', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    throw new Error('Failed to update notification preferences');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch notification history
 */
async function fetchNotificationHistory(options: {
  limit?: number;
  offset?: number;
  severity?: NotificationSeverity;
  unreadOnly?: boolean;
}): Promise<NotificationHistoryResponse> {
  const params = new URLSearchParams();
  
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());
  if (options.severity) params.append('severity', options.severity);
  if (options.unreadOnly) params.append('unreadOnly', 'true');

  const response = await fetch(
    `/api/v1/portfolio/notifications?${params.toString()}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch notification history');
  }

  const data = await response.json();
  return data.data;
}

/**
 * Mark notification as read
 */
async function markAsRead(eventId: string, channel: string = 'web_push'): Promise<void> {
  const response = await fetch(`/api/v1/portfolio/notifications/${eventId}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ channel }),
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
}

/**
 * Hook for managing notification preferences
 */
export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: fetchNotificationPreferences,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: updatePreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['notificationPreferences'], data);
    },
  });

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}

/**
 * Hook for managing notification history
 */
export function useNotificationHistory(options?: {
  limit?: number;
  offset?: number;
  severity?: NotificationSeverity;
  unreadOnly?: boolean;
}) {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['notificationHistory', options],
    queryFn: () => fetchNotificationHistory(options || {}),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const markAsReadMutation = useMutation({
    mutationFn: ({ eventId, channel }: { eventId: string; channel?: string }) =>
      markAsRead(eventId, channel),
    onSuccess: () => {
      // Invalidate and refetch notification history
      queryClient.invalidateQueries({ queryKey: ['notificationHistory'] });
    },
  });

  return {
    notifications: data?.notifications || [],
    total: data?.total || 0,
    limit: data?.limit || 20,
    offset: data?.offset || 0,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
  };
}

/**
 * Hook for getting unread notification count
 */
export function useUnreadNotificationCount() {
  const { data, isLoading } = useQuery({
    queryKey: ['notificationHistory', { unreadOnly: true, limit: 100 }],
    queryFn: () => fetchNotificationHistory({ unreadOnly: true, limit: 100 }),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  return {
    count: data?.notifications.length || 0,
    isLoading,
  };
}
