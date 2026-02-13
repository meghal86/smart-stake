/**
 * Portfolio Notification Service
 * 
 * Extends the cockpit notification service with portfolio-specific functionality:
 * - Exposure-aware notification aggregation
 * - Severity-based notification thresholds
 * - Deep linking to portfolio actions and plans
 * - Delivery tracking and read status
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import { createClient } from '@/integrations/supabase/server';

// Portfolio notification types
export type PortfolioNotificationType = 
  | 'approval_risk_critical'
  | 'approval_risk_high'
  | 'new_opportunity'
  | 'plan_ready'
  | 'plan_failed'
  | 'exposure_threshold'
  | 'portfolio_alert';

export type NotificationSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface PortfolioNotificationEvent {
  userId: string;
  type: PortfolioNotificationType;
  severity: NotificationSeverity;
  scopeKey: string; // wallet address or user_id for all_wallets
  deepLink: string; // URL to specific action or plan
  payload: {
    title: string;
    message: string;
    actionLabel?: string;
    metadata?: Record<string, unknown>;
  };
}

export interface NotificationPreferences {
  dnd: boolean;
  dndStartHour?: number;
  dndEndHour?: number;
  severityThreshold: NotificationSeverity;
  dailyCaps: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  channels: string[]; // ['web_push', 'email', 'sms']
}

export interface NotificationDeliveryStatus {
  eventId: string;
  channel: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sentAt?: string;
  readAt?: string;
  error?: string;
}

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  dnd: false,
  severityThreshold: 'medium',
  dailyCaps: {
    critical: 10, // Critical: up to 10/day
    high: 5,      // High: up to 5/day
    medium: 3,    // Medium: up to 3/day
    low: 1,       // Low: up to 1/day
  },
  channels: ['web_push'],
};

// Severity hierarchy for threshold checking
const SEVERITY_LEVELS: Record<NotificationSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Get user notification preferences
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('notification_prefs')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching notification preferences:', error);
      return DEFAULT_PREFERENCES;
    }

    if (!data) {
      return DEFAULT_PREFERENCES;
    }

    return {
      dnd: data.dnd || false,
      dndStartHour: data.dnd_start_hour,
      dndEndHour: data.dnd_end_hour,
      severityThreshold: (data.severity_threshold as NotificationSeverity) || 'medium',
      dailyCaps: (data.daily_caps as NotificationPreferences['dailyCaps']) || DEFAULT_PREFERENCES.dailyCaps,
      channels: (data.channels as string[]) || ['web_push'],
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('notification_prefs')
      .upsert({
        user_id: userId,
        dnd: preferences.dnd,
        dnd_start_hour: preferences.dndStartHour,
        dnd_end_hour: preferences.dndEndHour,
        severity_threshold: preferences.severityThreshold,
        daily_caps: preferences.dailyCaps,
        channels: preferences.channels,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating notification preferences:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if notification should be sent based on user preferences
 */
async function shouldSendNotification(
  userId: string,
  severity: NotificationSeverity,
  type: PortfolioNotificationType
): Promise<{ canSend: boolean; reason?: string }> {
  try {
    const prefs = await getNotificationPreferences(userId);

    // Check severity threshold
    if (SEVERITY_LEVELS[severity] < SEVERITY_LEVELS[prefs.severityThreshold]) {
      return {
        canSend: false,
        reason: `Severity ${severity} below threshold ${prefs.severityThreshold}`,
      };
    }

    // Check DND hours
    if (prefs.dnd && prefs.dndStartHour !== undefined && prefs.dndEndHour !== undefined) {
      const now = new Date();
      const currentHour = now.getHours();
      
      // Handle DND period that crosses midnight
      const isDND = prefs.dndStartHour > prefs.dndEndHour
        ? currentHour >= prefs.dndStartHour || currentHour < prefs.dndEndHour
        : currentHour >= prefs.dndStartHour && currentHour < prefs.dndEndHour;

      if (isDND && severity !== 'critical') {
        return { canSend: false, reason: 'DND hours active' };
      }
    }

    // Check daily caps
    const supabase = await createClient();
    const { data: counts, error } = await supabase
      .from('notification_events')
      .select('severity')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error checking daily caps:', error);
      // Allow notification on error to avoid blocking
      return { canSend: true };
    }

    const severityCounts = counts?.reduce((acc, event) => {
      const sev = event.severity as NotificationSeverity;
      acc[sev] = (acc[sev] || 0) + 1;
      return acc;
    }, {} as Record<NotificationSeverity, number>) || {};

    const currentCount = severityCounts[severity] || 0;
    const cap = prefs.dailyCaps[severity];

    if (currentCount >= cap) {
      return {
        canSend: false,
        reason: `Daily cap reached for ${severity} (${currentCount}/${cap})`,
      };
    }

    return { canSend: true };
  } catch (error) {
    console.error('Error checking notification eligibility:', error);
    // Allow notification on error to avoid blocking
    return { canSend: true };
  }
}

/**
 * Implement exposure-aware aggregation to prevent spam
 * Groups similar notifications within a time window
 */
async function aggregateNotifications(
  userId: string,
  event: PortfolioNotificationEvent,
  windowMinutes: number = 15
): Promise<{ shouldAggregate: boolean; existingEventId?: string }> {
  try {
    const supabase = await createClient();
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    // Look for similar notifications in the time window
    const { data: recentEvents, error } = await supabase
      .from('notification_events')
      .select('id, type, scope_key')
      .eq('user_id', userId)
      .eq('type', event.type)
      .eq('scope_key', event.scopeKey)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error checking for recent notifications:', error);
      return { shouldAggregate: false };
    }

    if (recentEvents && recentEvents.length > 0) {
      return {
        shouldAggregate: true,
        existingEventId: recentEvents[0].id,
      };
    }

    return { shouldAggregate: false };
  } catch (error) {
    console.error('Error aggregating notifications:', error);
    return { shouldAggregate: false };
  }
}

/**
 * Create a notification event in the database
 */
async function createNotificationEvent(
  event: PortfolioNotificationEvent
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('notification_events')
      .insert({
        user_id: event.userId,
        type: event.type,
        severity: event.severity,
        scope_key: event.scopeKey,
        deep_link: event.deepLink,
        payload: event.payload,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating notification event:', error);
      return { success: false, error: error.message };
    }

    return { success: true, eventId: data.id };
  } catch (error) {
    console.error('Error creating notification event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Track notification delivery
 */
async function trackDelivery(
  eventId: string,
  channel: string,
  status: 'pending' | 'sent' | 'delivered' | 'failed',
  error?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const deliveryData: any = {
      event_id: eventId,
      channel,
      status,
    };

    if (status === 'sent' || status === 'delivered') {
      deliveryData.sent_at = new Date().toISOString();
    }

    if (error) {
      deliveryData.error_message = error;
    }

    const { error: insertError } = await supabase
      .from('notification_deliveries')
      .insert(deliveryData);

    if (insertError) {
      console.error('Error tracking delivery:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error tracking delivery:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a portfolio notification
 * Implements exposure-aware aggregation, respects user preferences, and tracks delivery
 */
export async function sendPortfolioNotification(
  event: PortfolioNotificationEvent
): Promise<{
  success: boolean;
  eventId?: string;
  aggregated?: boolean;
  reason?: string;
  error?: string;
}> {
  try {
    // Check if notification should be sent based on preferences
    const eligibility = await shouldSendNotification(
      event.userId,
      event.severity,
      event.type
    );

    if (!eligibility.canSend) {
      return {
        success: false,
        reason: eligibility.reason,
      };
    }

    // Check for exposure-aware aggregation
    const aggregation = await aggregateNotifications(event.userId, event);

    if (aggregation.shouldAggregate) {
      return {
        success: true,
        eventId: aggregation.existingEventId,
        aggregated: true,
        reason: 'Aggregated with recent notification',
      };
    }

    // Create notification event
    const eventResult = await createNotificationEvent(event);

    if (!eventResult.success || !eventResult.eventId) {
      return {
        success: false,
        error: eventResult.error || 'Failed to create notification event',
      };
    }

    // Get user preferences for channels
    const prefs = await getNotificationPreferences(event.userId);

    // Track delivery for each channel
    const deliveryPromises = prefs.channels.map(async (channel) => {
      // In a real implementation, this would send via the actual channel
      // For now, we just track the delivery attempt
      await trackDelivery(eventResult.eventId!, channel, 'sent');
    });

    await Promise.allSettled(deliveryPromises);

    return {
      success: true,
      eventId: eventResult.eventId,
      aggregated: false,
    };
  } catch (error) {
    console.error('Error sending portfolio notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  eventId: string,
  channel: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('notification_deliveries')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('event_id', eventId)
      .eq('channel', channel);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get notification delivery status
 */
export async function getNotificationDeliveryStatus(
  eventId: string
): Promise<NotificationDeliveryStatus[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('notification_deliveries')
      .select('*')
      .eq('event_id', eventId);

    if (error) {
      console.error('Error getting delivery status:', error);
      return [];
    }

    return (data || []).map((delivery) => ({
      eventId: delivery.event_id,
      channel: delivery.channel,
      status: delivery.status,
      sentAt: delivery.sent_at,
      readAt: delivery.read_at,
      error: delivery.error_message,
    }));
  } catch (error) {
    console.error('Error getting delivery status:', error);
    return [];
  }
}

/**
 * Get user's notification history
 */
export async function getNotificationHistory(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    severity?: NotificationSeverity;
    unreadOnly?: boolean;
  }
): Promise<{
  events: Array<{
    id: string;
    type: PortfolioNotificationType;
    severity: NotificationSeverity;
    scopeKey: string;
    deepLink: string;
    payload: any;
    createdAt: string;
    deliveries: NotificationDeliveryStatus[];
  }>;
  total: number;
}> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('notification_events')
      .select('*, notification_deliveries(*)', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.severity) {
      query = query.eq('severity', options.severity);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error getting notification history:', error);
      return { events: [], total: 0 };
    }

    const events = (data || []).map((event: any) => ({
      id: event.id,
      type: event.type,
      severity: event.severity,
      scopeKey: event.scope_key,
      deepLink: event.deep_link,
      payload: event.payload,
      createdAt: event.created_at,
      deliveries: (event.notification_deliveries || []).map((d: any) => ({
        eventId: d.event_id,
        channel: d.channel,
        status: d.status,
        sentAt: d.sent_at,
        readAt: d.read_at,
        error: d.error_message,
      })),
    }));

    // Filter unread if requested
    const filteredEvents = options?.unreadOnly
      ? events.filter((e) =>
          e.deliveries.some((d) => d.status !== 'read')
        )
      : events;

    return {
      events: filteredEvents,
      total: count || 0,
    };
  } catch (error) {
    console.error('Error getting notification history:', error);
    return { events: [], total: 0 };
  }
}

/**
 * Helper functions for common notification types
 */

export async function notifyApprovalRiskCritical(
  userId: string,
  walletAddress: string,
  approvalDetails: {
    token: string;
    spender: string;
    valueAtRisk: number;
  }
): Promise<{ success: boolean; eventId?: string }> {
  const result = await sendPortfolioNotification({
    userId,
    type: 'approval_risk_critical',
    severity: 'critical',
    scopeKey: walletAddress.toLowerCase(),
    deepLink: `/portfolio/audit?wallet=${walletAddress}&highlight=approvals`,
    payload: {
      title: 'Critical Approval Risk Detected',
      message: `High-risk approval for ${approvalDetails.token} to ${approvalDetails.spender.substring(0, 10)}... with $${approvalDetails.valueAtRisk.toLocaleString()} at risk`,
      actionLabel: 'Review & Revoke',
      metadata: approvalDetails,
    },
  });

  return {
    success: result.success,
    eventId: result.eventId,
  };
}

export async function notifyNewOpportunity(
  userId: string,
  walletAddress: string,
  opportunityDetails: {
    type: string;
    estimatedValue: number;
    expiresIn?: string;
  }
): Promise<{ success: boolean; eventId?: string }> {
  const result = await sendPortfolioNotification({
    userId,
    type: 'new_opportunity',
    severity: 'medium',
    scopeKey: walletAddress.toLowerCase(),
    deepLink: `/portfolio/overview?wallet=${walletAddress}&highlight=actions`,
    payload: {
      title: 'New Portfolio Opportunity',
      message: `${opportunityDetails.type} opportunity worth $${opportunityDetails.estimatedValue.toLocaleString()}${opportunityDetails.expiresIn ? ` (expires ${opportunityDetails.expiresIn})` : ''}`,
      actionLabel: 'View Details',
      metadata: opportunityDetails,
    },
  });

  return {
    success: result.success,
    eventId: result.eventId,
  };
}

export async function notifyPlanReady(
  userId: string,
  planId: string,
  planDetails: {
    intent: string;
    stepsCount: number;
    estimatedGas: number;
  }
): Promise<{ success: boolean; eventId?: string }> {
  const result = await sendPortfolioNotification({
    userId,
    type: 'plan_ready',
    severity: 'high',
    scopeKey: userId, // Plan notifications are user-scoped
    deepLink: `/portfolio/plans/${planId}`,
    payload: {
      title: 'Intent Plan Ready for Execution',
      message: `Your ${planDetails.intent} plan with ${planDetails.stepsCount} steps is ready (est. gas: $${planDetails.estimatedGas.toFixed(2)})`,
      actionLabel: 'Review & Execute',
      metadata: planDetails,
    },
  });

  return {
    success: result.success,
    eventId: result.eventId,
  };
}

export async function notifyPlanFailed(
  userId: string,
  planId: string,
  failureDetails: {
    intent: string;
    failedStep: string;
    reason: string;
  }
): Promise<{ success: boolean; eventId?: string }> {
  const result = await sendPortfolioNotification({
    userId,
    type: 'plan_failed',
    severity: 'high',
    scopeKey: userId,
    deepLink: `/portfolio/plans/${planId}`,
    payload: {
      title: 'Intent Plan Execution Failed',
      message: `${failureDetails.intent} failed at step "${failureDetails.failedStep}": ${failureDetails.reason}`,
      actionLabel: 'View Details',
      metadata: failureDetails,
    },
  });

  return {
    success: result.success,
    eventId: result.eventId,
  };
}

export async function notifyExposureThreshold(
  userId: string,
  walletAddress: string,
  exposureDetails: {
    chain: string;
    protocol: string;
    currentExposure: number;
    threshold: number;
  }
): Promise<{ success: boolean; eventId?: string }> {
  const result = await sendPortfolioNotification({
    userId,
    type: 'exposure_threshold',
    severity: 'medium',
    scopeKey: walletAddress.toLowerCase(),
    deepLink: `/portfolio/positions?wallet=${walletAddress}&chain=${exposureDetails.chain}`,
    payload: {
      title: 'Exposure Threshold Exceeded',
      message: `${exposureDetails.protocol} exposure on ${exposureDetails.chain} is $${exposureDetails.currentExposure.toLocaleString()} (threshold: $${exposureDetails.threshold.toLocaleString()})`,
      actionLabel: 'Review Positions',
      metadata: exposureDetails,
    },
  });

  return {
    success: result.success,
    eventId: result.eventId,
  };
}
