/**
 * Notification Service for Cockpit Web Push Notifications
 * 
 * Handles DND hours enforcement, daily caps, and notification categories.
 * Provides utilities for checking notification eligibility and sending notifications.
 * 
 * Requirements: 13.5, 13.6, 13.7
 */

import { createClient } from '@/integrations/supabase/server';

// Notification categories with their rules
export type NotificationCategory = 'critical' | 'daily_pulse' | 'expiring_soon';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

export interface NotificationRequest {
  userId: string;
  category: NotificationCategory;
  payload: NotificationPayload;
  timezone?: string; // User's IANA timezone
}

export interface NotificationResult {
  success: boolean;
  sent: number;
  skipped: number;
  errors: string[];
  reason?: 'dnd' | 'daily_cap' | 'no_subscriptions' | 'sent';
}

// Daily caps per category (Requirements: 13.6, 13.7)
const DAILY_CAPS = {
  critical: 1,      // Critical: immediate, overrides cap up to 1/day
  daily_pulse: 1,   // Daily pulse: 1/day
  expiring_soon: 3, // Expiring soon: up to 3/day (part of total 3/day limit)
} as const;

// Total daily cap across all categories
const TOTAL_DAILY_CAP = 3;

// Default DND hours (Requirements: 13.5)
const DEFAULT_DND_START = '22:00'; // 10pm
const DEFAULT_DND_END = '08:00';   // 8am

/**
 * Parse time string (HH:MM) into hours and minutes
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

/**
 * Check if current time is within DND hours for the user's timezone
 */
function isWithinDNDHours(
  timezone: string,
  dndStart: string = DEFAULT_DND_START,
  dndEnd: string = DEFAULT_DND_END
): boolean {
  try {
    // If DND start equals DND end, DND is disabled
    if (dndStart === dndEnd) {
      return false;
    }

    const now = new Date();
    const userTime = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);

    const currentTime = parseTime(userTime);
    const startTime = parseTime(dndStart);
    const endTime = parseTime(dndEnd);

    // Convert times to minutes for easier comparison
    const currentMinutes = currentTime.hours * 60 + currentTime.minutes;
    const startMinutes = startTime.hours * 60 + startTime.minutes;
    const endMinutes = endTime.hours * 60 + endTime.minutes;

    // Handle DND period that crosses midnight (e.g., 22:00 to 08:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  } catch (error) {
    console.error('Error checking DND hours:', error);
    // On error, assume not in DND to avoid blocking notifications
    return false;
  }
}

/**
 * Get notification counts for the user in the last 24 hours
 */
async function getNotificationCounts(
  supabase: any,
  userId: string
): Promise<{ total: number; byCategory: Record<NotificationCategory, number> }> {
  try {
    // Use the helper function from the database to get counts
    const { data, error } = await supabase.rpc('get_notification_counts', {
      p_user_id: userId,
      p_hours_back: 24,
    });

    if (error) {
      console.error('Error getting notification counts:', error);
      // Return zero counts on error to avoid blocking notifications
      return {
        total: 0,
        byCategory: {
          critical: 0,
          daily_pulse: 0,
          expiring_soon: 0,
        },
      };
    }

    const counts = data[0] || {
      total_count: 0,
      critical_count: 0,
      daily_pulse_count: 0,
      expiring_soon_count: 0,
    };

    return {
      total: Number(counts.total_count),
      byCategory: {
        critical: Number(counts.critical_count),
        daily_pulse: Number(counts.daily_pulse_count),
        expiring_soon: Number(counts.expiring_soon_count),
      },
    };
  } catch (error) {
    console.error('Error getting notification counts:', error);
    // Return zero counts on error to avoid blocking notifications
    return {
      total: 0,
      byCategory: {
        critical: 0,
        daily_pulse: 0,
        expiring_soon: 0,
      },
    };
  }
}

/**
 * Check if notification can be sent based on DND hours and daily caps
 */
export async function checkNotificationEligibility(
  request: NotificationRequest
): Promise<{
  canSend: boolean;
  reason?: 'dnd' | 'daily_cap' | 'category_cap' | 'eligible';
}> {
  try {
    const supabase = await createClient();

    // Get user preferences for DND hours and timezone
    const { data: state, error: fetchError } = await supabase
      .from('cockpit_state')
      .select('prefs')
      .eq('user_id', request.userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user preferences:', fetchError);
      // On error, allow notification to avoid blocking
      return { canSend: true, reason: 'eligible' };
    }

    const prefs = (state?.prefs as Record<string, unknown>) || {};
    const timezone = (request.timezone || prefs.timezone || 'UTC') as string;
    const dndStart = (prefs.dnd_start_local || DEFAULT_DND_START) as string;
    const dndEnd = (prefs.dnd_end_local || DEFAULT_DND_END) as string;

    // Check DND hours (Requirements: 13.5)
    // Critical notifications can override DND, but let's respect user preferences
    if (isWithinDNDHours(timezone, dndStart, dndEnd)) {
      // Only allow critical notifications during DND hours
      if (request.category !== 'critical') {
        return { canSend: false, reason: 'dnd' };
      }
    }

    // Check daily caps (Requirements: 13.6)
    const counts = await getNotificationCounts(supabase, request.userId);

    // Check total daily cap
    if (counts.total >= TOTAL_DAILY_CAP) {
      // Critical notifications can override total cap up to their own limit
      if (request.category !== 'critical' || counts.byCategory.critical >= DAILY_CAPS.critical) {
        return { canSend: false, reason: 'daily_cap' };
      }
    }

    // Check category-specific cap
    const categoryCount = counts.byCategory[request.category];
    const categoryLimit = DAILY_CAPS[request.category];
    
    if (categoryCount >= categoryLimit) {
      return { canSend: false, reason: 'category_cap' };
    }

    return { canSend: true, reason: 'eligible' };
  } catch (error) {
    console.error('Error checking notification eligibility:', error);
    // On error, allow notification to avoid blocking
    return { canSend: true, reason: 'eligible' };
  }
}

/**
 * Send notification to all user's subscriptions
 * This is a mock implementation - in production, use the web-push library
 */
export async function sendNotification(
  request: NotificationRequest
): Promise<NotificationResult> {
  try {
    // Check eligibility first
    const eligibility = await checkNotificationEligibility(request);
    
    if (!eligibility.canSend) {
      return {
        success: false,
        sent: 0,
        skipped: 0,
        errors: [],
        reason: eligibility.reason,
      };
    }

    const supabase = await createClient();

    // Get user's push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('web_push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', request.userId);

    if (fetchError) {
      console.error('Error fetching push subscriptions:', fetchError);
      return {
        success: false,
        sent: 0,
        skipped: 0,
        errors: ['Failed to fetch subscriptions'],
      };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return {
        success: false,
        sent: 0,
        skipped: 0,
        errors: [],
        reason: 'no_subscriptions',
      };
    }

    // Get user timezone for logging
    const { data: state } = await supabase
      .from('cockpit_state')
      .select('prefs')
      .eq('user_id', request.userId)
      .single();

    const prefs = (state?.prefs as Record<string, unknown>) || {};
    const userTimezone = (request.timezone || prefs.timezone || 'UTC') as string;

    // Mock sending notifications (in production, use web-push library)
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        // Mock implementation - log the notification
        console.log('🔔 Notification sent:', {
          endpoint: subscription.endpoint.substring(0, 50) + '...',
          category: request.category,
          title: request.payload.title,
          body: request.payload.body,
          timestamp: new Date().toISOString(),
        });

        // Log the notification to the database
        try {
          await supabase.rpc('log_notification', {
            p_user_id: request.userId,
            p_category: request.category,
            p_title: request.payload.title,
            p_body: request.payload.body,
            p_endpoint: subscription.endpoint,
            p_success: true,
            p_error_message: null,
            p_payload: request.payload,
            p_user_timezone: userTimezone,
          });
        } catch (logError) {
          console.error('Error logging notification:', logError);
          // Don't fail the notification send if logging fails
        }

        // Simulate success (in real implementation, use web-push library)
        return { success: true };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => (r as PromiseRejectedResult).reason?.message || 'Unknown error');

    return {
      success: successful > 0,
      sent: successful,
      skipped: failed,
      errors,
      reason: 'sent',
    };
  } catch (error) {
    console.error('Error sending notification:', error);
    return {
      success: false,
      sent: 0,
      skipped: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Create notification payloads for different categories
 */
export function createNotificationPayload(
  category: NotificationCategory,
  data: Record<string, unknown>
): NotificationPayload {
  switch (category) {
    case 'critical':
      return {
        title: '🚨 Critical Security Alert',
        body: data.message as string || 'Critical issue detected. Review immediately.',
        icon: '/icons/alert-critical.png',
        badge: '/icons/badge.png',
        tag: 'critical-alert',
        requireInteraction: true,
        data: {
          category: 'critical',
          url: data.url || '/cockpit',
          ...data,
        },
      };

    case 'daily_pulse':
      return {
        title: '📊 Daily Pulse Ready',
        body: data.message as string || 'Your daily pulse is ready. Check your cockpit.',
        icon: '/icons/pulse.png',
        badge: '/icons/badge.png',
        tag: 'daily-pulse',
        requireInteraction: false,
        data: {
          category: 'daily_pulse',
          url: '/cockpit#pulse',
          ...data,
        },
      };

    case 'expiring_soon':
      return {
        title: '⏰ Opportunity Expiring',
        body: data.message as string || 'Time-sensitive opportunity expiring soon.',
        icon: '/icons/expiring.png',
        badge: '/icons/badge.png',
        tag: 'expiring-opportunity',
        requireInteraction: false,
        data: {
          category: 'expiring_soon',
          url: data.url || '/cockpit',
          ...data,
        },
      };

    default:
      throw new Error(`Unknown notification category: ${category}`);
  }
}

/**
 * Utility function to send a critical notification
 */
export async function sendCriticalNotification(
  userId: string,
  message: string,
  data?: Record<string, unknown>
): Promise<NotificationResult> {
  const payload = createNotificationPayload('critical', { message, ...data });
  return sendNotification({ userId, category: 'critical', payload });
}

/**
 * Utility function to send a daily pulse notification
 */
export async function sendDailyPulseNotification(
  userId: string,
  message: string,
  data?: Record<string, unknown>
): Promise<NotificationResult> {
  const payload = createNotificationPayload('daily_pulse', { message, ...data });
  return sendNotification({ userId, category: 'daily_pulse', payload });
}

/**
 * Utility function to send an expiring soon notification
 */
export async function sendExpiringSoonNotification(
  userId: string,
  message: string,
  data?: Record<string, unknown>
): Promise<NotificationResult> {
  const payload = createNotificationPayload('expiring_soon', { message, ...data });
  return sendNotification({ userId, category: 'expiring_soon', payload });
}