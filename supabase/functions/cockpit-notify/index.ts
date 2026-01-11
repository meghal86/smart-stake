/**
 * Cockpit Notification Edge Function
 * 
 * Handles sending web push notifications for the cockpit with DND hours
 * enforcement, daily caps, and notification categories.
 * 
 * This function can be:
 * 1. Called directly to send immediate notifications
 * 2. Scheduled to run periodically for daily pulse notifications
 * 3. Triggered by other Edge Functions for critical alerts
 * 
 * Requirements: 13.5, 13.6, 13.7
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
type NotificationCategory = 'critical' | 'daily_pulse' | 'expiring_soon';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

interface NotificationRequest {
  userId?: string; // If not provided, will scan for eligible users
  category: NotificationCategory;
  payload?: NotificationPayload; // If not provided, will generate based on category
  message?: string; // Used to generate payload if payload not provided
  data?: Record<string, unknown>; // Additional data for payload
}

// Daily caps per category
const DAILY_CAPS = {
  critical: 1,
  daily_pulse: 1,
  expiring_soon: 3,
} as const;

const TOTAL_DAILY_CAP = 3;
const DEFAULT_DND_START = '22:00';
const DEFAULT_DND_END = '08:00';

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
    if (dndStart === dndEnd) {
      return false; // DND disabled
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

    const currentMinutes = currentTime.hours * 60 + currentTime.minutes;
    const startMinutes = startTime.hours * 60 + startTime.minutes;
    const endMinutes = endTime.hours * 60 + endTime.minutes;

    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  } catch (error) {
    console.error('Error checking DND hours:', error);
    return false;
  }
}

/**
 * Create notification payloads for different categories
 */
function createNotificationPayload(
  category: NotificationCategory,
  message?: string,
  data?: Record<string, unknown>
): NotificationPayload {
  switch (category) {
    case 'critical':
      return {
        title: '🚨 Critical Security Alert',
        body: message || 'Critical issue detected. Review immediately.',
        icon: '/icons/alert-critical.png',
        badge: '/icons/badge.png',
        tag: 'critical-alert',
        requireInteraction: true,
        data: {
          category: 'critical',
          url: data?.url || '/cockpit',
          ...data,
        },
      };

    case 'daily_pulse':
      return {
        title: '📊 Daily Pulse Ready',
        body: message || 'Your daily pulse is ready. Check your cockpit.',
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
        body: message || 'Time-sensitive opportunity expiring soon.',
        icon: '/icons/expiring.png',
        badge: '/icons/badge.png',
        tag: 'expiring-opportunity',
        requireInteraction: false,
        data: {
          category: 'expiring_soon',
          url: data?.url || '/cockpit',
          ...data,
        },
      };

    default:
      throw new Error(`Unknown notification category: ${category}`);
  }
}

/**
 * Send notification to a specific user
 */
async function sendNotificationToUser(
  supabase: any,
  userId: string,
  category: NotificationCategory,
  payload: NotificationPayload
): Promise<{ success: boolean; sent: number; errors: string[] }> {
  try {
    // Get user preferences
    const { data: state } = await supabase
      .from('cockpit_state')
      .select('prefs')
      .eq('user_id', userId)
      .single();

    const prefs = (state?.prefs as Record<string, unknown>) || {};
    const timezone = (prefs.timezone || 'UTC') as string;
    const dndStart = (prefs.dnd_start_local || DEFAULT_DND_START) as string;
    const dndEnd = (prefs.dnd_end_local || DEFAULT_DND_END) as string;

    // Check DND hours
    if (isWithinDNDHours(timezone, dndStart, dndEnd)) {
      if (category !== 'critical') {
        console.log(`Skipping ${category} notification for user ${userId}: DND hours`);
        return { success: false, sent: 0, errors: ['DND hours'] };
      }
    }

    // Check daily caps using notification logs
    const { data: counts, error: countsError } = await supabase.rpc('get_notification_counts', {
      p_user_id: userId,
      p_hours_back: 24,
    });

    if (countsError) {
      console.error('Error checking notification counts:', countsError);
      // Continue on error to avoid blocking notifications
    } else if (counts && counts.length > 0) {
      const userCounts = counts[0];
      const totalCount = Number(userCounts.total_count);
      const categoryCount = Number(userCounts[`${category}_count`]);

      // Check total daily cap
      if (totalCount >= TOTAL_DAILY_CAP) {
        if (category !== 'critical' || categoryCount >= DAILY_CAPS.critical) {
          console.log(`Skipping ${category} notification for user ${userId}: Daily cap exceeded`);
          return { success: false, sent: 0, errors: ['Daily cap exceeded'] };
        }
      }

      // Check category-specific cap
      if (categoryCount >= DAILY_CAPS[category]) {
        console.log(`Skipping ${category} notification for user ${userId}: Category cap exceeded`);
        return { success: false, sent: 0, errors: ['Category cap exceeded'] };
      }
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('web_push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (fetchError || !subscriptions || subscriptions.length === 0) {
      return { success: false, sent: 0, errors: ['No subscriptions'] };
    }

    // Send notifications to all subscriptions
    let successCount = 0;
    const errors: string[] = [];

    for (const subscription of subscriptions) {
      try {
        // Mock sending notification (in production, use web-push library)
        console.log('🔔 Notification sent to user:', {
          userId,
          category,
          title: payload.title,
          body: payload.body,
          endpoint: subscription.endpoint.substring(0, 50) + '...',
          timestamp: new Date().toISOString(),
        });

        // Log the notification
        await supabase.rpc('log_notification', {
          p_user_id: userId,
          p_category: category,
          p_title: payload.title,
          p_body: payload.body,
          p_endpoint: subscription.endpoint,
          p_success: true,
          p_error_message: null,
          p_payload: payload,
          p_user_timezone: timezone,
        });

        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(errorMsg);

        // Log the failed notification
        try {
          await supabase.rpc('log_notification', {
            p_user_id: userId,
            p_category: category,
            p_title: payload.title,
            p_body: payload.body,
            p_endpoint: subscription.endpoint,
            p_success: false,
            p_error_message: errorMsg,
            p_payload: payload,
            p_user_timezone: timezone,
          });
        } catch (logError) {
          console.error('Error logging failed notification:', logError);
        }
      }
    }

    return { success: successCount > 0, sent: successCount, errors };
  } catch (error) {
    console.error('Error sending notification to user:', error);
    return { 
      success: false, 
      sent: 0, 
      errors: [error instanceof Error ? error.message : 'Unknown error'] 
    };
  }
}

/**
 * Scan for users who should receive daily pulse notifications
 */
async function scanForDailyPulseUsers(supabase: any): Promise<string[]> {
  // This is a simplified implementation
  // In production, you'd query for users who:
  // 1. Have push subscriptions
  // 2. Haven't received daily pulse today
  // 3. Have pulse content available
  // 4. Are not in DND hours
  
  const { data: users } = await supabase
    .from('web_push_subscriptions')
    .select('user_id')
    .limit(100); // Limit for safety

  if (!users) return [];

  // Return unique user IDs
  return [...new Set(users.map((u: any) => u.user_id))];
}

/**
 * Main handler function
 */
serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: NotificationRequest = await req.json();
    const { userId, category, payload, message, data } = body;

    // Validate category
    if (!['critical', 'daily_pulse', 'expiring_soon'].includes(category)) {
      return new Response(
        JSON.stringify({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification category',
          },
          meta: { ts: new Date().toISOString() },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create payload if not provided
    const notificationPayload = payload || createNotificationPayload(category, message, data);

    let results: { success: boolean; sent: number; errors: string[] }[] = [];

    if (userId) {
      // Send to specific user
      const result = await sendNotificationToUser(supabase, userId, category, notificationPayload);
      results = [result];
    } else if (category === 'daily_pulse') {
      // Scan for users who should receive daily pulse
      const userIds = await scanForDailyPulseUsers(supabase);
      console.log(`Sending daily pulse to ${userIds.length} users`);
      
      results = await Promise.all(
        userIds.map(uid => sendNotificationToUser(supabase, uid, category, notificationPayload))
      );
    } else {
      return new Response(
        JSON.stringify({
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'userId required for non-daily_pulse notifications',
          },
          meta: { ts: new Date().toISOString() },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate results
    const totalSent = results.reduce((sum, r) => sum + r.sent, 0);
    const totalErrors = results.flatMap(r => r.errors);
    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        data: {
          ok: true,
          category,
          users_processed: results.length,
          notifications_sent: totalSent,
          successful_users: successCount,
          errors: totalErrors,
        },
        error: null,
        meta: { ts: new Date().toISOString() },
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  } catch (error) {
    console.error('Cockpit notify error:', error);
    return new Response(
      JSON.stringify({
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: { ts: new Date().toISOString() },
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});