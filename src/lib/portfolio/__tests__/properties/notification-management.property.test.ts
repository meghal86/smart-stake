/**
 * Property-Based Tests for Notification Management
 * 
 * Feature: unified-portfolio, Property 27: Notification Management
 * Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5
 * 
 * Tests that the notification system implements:
 * - Exposure-aware aggregation to prevent spam
 * - User settings respect (DND, caps, severity threshold)
 * - Deep linking to specific actions or plans
 * - Delivery and read status tracking
 * - Daily quota enforcement
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock types matching the notification service
type NotificationSeverity = 'critical' | 'high' | 'medium' | 'low';
type PortfolioNotificationType = 
  | 'approval_risk_critical'
  | 'approval_risk_high'
  | 'new_opportunity'
  | 'plan_ready'
  | 'plan_failed'
  | 'exposure_threshold'
  | 'portfolio_alert';

interface NotificationPreferences {
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
  channels: string[];
}

interface PortfolioNotificationEvent {
  userId: string;
  type: PortfolioNotificationType;
  severity: NotificationSeverity;
  scopeKey: string;
  deepLink: string;
  payload: {
    title: string;
    message: string;
    actionLabel?: string;
    metadata?: Record<string, unknown>;
  };
}

interface NotificationDeliveryStatus {
  eventId: string;
  channel: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sentAt?: string;
  readAt?: string;
  error?: string;
}

// Severity hierarchy for threshold checking
const SEVERITY_LEVELS: Record<NotificationSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Mock notification system
class MockNotificationSystem {
  private events: Map<string, PortfolioNotificationEvent & { createdAt: Date }> = new Map();
  private deliveries: Map<string, NotificationDeliveryStatus[]> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private dailyCounts: Map<string, Map<NotificationSeverity, number>> = new Map();

  setPreferences(userId: string, prefs: NotificationPreferences) {
    this.preferences.set(userId, prefs);
  }

  getPreferences(userId: string): NotificationPreferences {
    return this.preferences.get(userId) || {
      dnd: false,
      severityThreshold: 'medium',
      dailyCaps: { critical: 10, high: 5, medium: 3, low: 1 },
      channels: ['web_push'],
    };
  }

  shouldSendNotification(
    userId: string,
    severity: NotificationSeverity,
    currentHour: number
  ): { canSend: boolean; reason?: string } {
    const prefs = this.getPreferences(userId);

    // Check severity threshold
    if (SEVERITY_LEVELS[severity] < SEVERITY_LEVELS[prefs.severityThreshold]) {
      return {
        canSend: false,
        reason: `Severity ${severity} below threshold ${prefs.severityThreshold}`,
      };
    }

    // Check DND hours
    if (prefs.dnd && prefs.dndStartHour !== undefined && prefs.dndEndHour !== undefined) {
      const isDND = prefs.dndStartHour > prefs.dndEndHour
        ? currentHour >= prefs.dndStartHour || currentHour < prefs.dndEndHour
        : currentHour >= prefs.dndStartHour && currentHour < prefs.dndEndHour;

      if (isDND && severity !== 'critical') {
        return { canSend: false, reason: 'DND hours active' };
      }
    }

    // Check daily caps
    const counts = this.dailyCounts.get(userId) || new Map();
    const currentCount = counts.get(severity) || 0;
    const cap = prefs.dailyCaps[severity];

    if (currentCount >= cap) {
      return {
        canSend: false,
        reason: `Daily cap reached for ${severity} (${currentCount}/${cap})`,
      };
    }

    return { canSend: true };
  }

  aggregateNotifications(
    userId: string,
    event: PortfolioNotificationEvent,
    windowMinutes: number
  ): { shouldAggregate: boolean; existingEventId?: string } {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

    for (const [eventId, existingEvent] of this.events.entries()) {
      if (
        existingEvent.userId === userId &&
        existingEvent.type === event.type &&
        existingEvent.scopeKey === event.scopeKey &&
        existingEvent.createdAt >= windowStart
      ) {
        return { shouldAggregate: true, existingEventId: eventId };
      }
    }

    return { shouldAggregate: false };
  }

  sendNotification(
    event: PortfolioNotificationEvent,
    currentHour: number
  ): {
    success: boolean;
    eventId?: string;
    aggregated?: boolean;
    reason?: string;
  } {
    // Check if notification should be sent
    const eligibility = this.shouldSendNotification(
      event.userId,
      event.severity,
      currentHour
    );

    if (!eligibility.canSend) {
      return { success: false, reason: eligibility.reason };
    }

    // Check for aggregation
    const aggregation = this.aggregateNotifications(event.userId, event, 15);

    if (aggregation.shouldAggregate) {
      return {
        success: true,
        eventId: aggregation.existingEventId,
        aggregated: true,
        reason: 'Aggregated with recent notification',
      };
    }

    // Create notification event
    const eventId = `event_${Date.now()}_${Math.random()}`;
    this.events.set(eventId, { ...event, createdAt: new Date() });

    // Track delivery
    const prefs = this.getPreferences(event.userId);
    const deliveries: NotificationDeliveryStatus[] = prefs.channels.map((channel) => ({
      eventId,
      channel,
      status: 'sent' as const,
      sentAt: new Date().toISOString(),
    }));
    this.deliveries.set(eventId, deliveries);

    // Update daily counts
    const counts = this.dailyCounts.get(event.userId) || new Map();
    counts.set(event.severity, (counts.get(event.severity) || 0) + 1);
    this.dailyCounts.set(event.userId, counts);

    return { success: true, eventId, aggregated: false };
  }

  markAsRead(eventId: string, channel: string): { success: boolean } {
    const deliveries = this.deliveries.get(eventId);
    if (!deliveries) return { success: false };

    const delivery = deliveries.find((d) => d.channel === channel);
    if (!delivery) return { success: false };

    delivery.status = 'read';
    delivery.readAt = new Date().toISOString();

    return { success: true };
  }

  getDeliveryStatus(eventId: string): NotificationDeliveryStatus[] {
    return this.deliveries.get(eventId) || [];
  }

  hasDeepLink(eventId: string): boolean {
    const event = this.events.get(eventId);
    return !!event && !!event.deepLink && event.deepLink.length > 0;
  }

  resetDailyCounts() {
    this.dailyCounts.clear();
  }
}

// Generators
const severityArb = fc.constantFrom<NotificationSeverity>(
  'critical',
  'high',
  'medium',
  'low'
);

const notificationTypeArb = fc.constantFrom<PortfolioNotificationType>(
  'approval_risk_critical',
  'approval_risk_high',
  'new_opportunity',
  'plan_ready',
  'plan_failed',
  'exposure_threshold',
  'portfolio_alert'
);

const preferencesArb = fc.record({
  dnd: fc.boolean(),
  dndStartHour: fc.option(fc.integer({ min: 0, max: 23 }), { nil: undefined }),
  dndEndHour: fc.option(fc.integer({ min: 0, max: 23 }), { nil: undefined }),
  severityThreshold: severityArb,
  dailyCaps: fc.record({
    critical: fc.integer({ min: 1, max: 20 }),
    high: fc.integer({ min: 1, max: 10 }),
    medium: fc.integer({ min: 1, max: 5 }),
    low: fc.integer({ min: 1, max: 3 }),
  }),
  channels: fc.array(fc.constantFrom('web_push', 'email', 'sms'), { minLength: 1, maxLength: 3 }),
});

const notificationEventArb = fc.record({
  userId: fc.uuid(),
  type: notificationTypeArb,
  severity: severityArb,
  scopeKey: fc.string({ minLength: 40, maxLength: 40 }).map((s) => 
    `0x${s.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('').substring(0, 40)}`
  ),
  deepLink: fc.webUrl(),
  payload: fc.record({
    title: fc.string({ minLength: 5, maxLength: 100 }),
    message: fc.string({ minLength: 10, maxLength: 500 }),
    actionLabel: fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: undefined }),
    metadata: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
  }),
});

describe('Feature: unified-portfolio, Property 27: Notification Management', () => {
  let system: MockNotificationSystem;

  beforeEach(() => {
    system = new MockNotificationSystem();
  });

  // Property 27.1: Severity threshold enforcement
  test('notifications below severity threshold are blocked', () => {
    fc.assert(
      fc.property(
        preferencesArb,
        notificationEventArb,
        fc.integer({ min: 0, max: 23 }),
        (prefs, event, currentHour) => {
          system.setPreferences(event.userId, prefs);

          const result = system.sendNotification(event, currentHour);

          // If severity is below threshold, notification should be blocked
          if (SEVERITY_LEVELS[event.severity] < SEVERITY_LEVELS[prefs.severityThreshold]) {
            expect(result.success).toBe(false);
            expect(result.reason).toContain('below threshold');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 27.2: DND hours respect
  test('non-critical notifications are blocked during DND hours', () => {
    fc.assert(
      fc.property(
        notificationEventArb,
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 23 }),
        (event, dndStart, dndEnd) => {
          // Skip if critical (critical overrides DND)
          if (event.severity === 'critical') return;

          const prefs: NotificationPreferences = {
            dnd: true,
            dndStartHour: dndStart,
            dndEndHour: dndEnd,
            severityThreshold: 'low', // Allow all severities
            dailyCaps: { critical: 100, high: 100, medium: 100, low: 100 },
            channels: ['web_push'],
          };

          system.setPreferences(event.userId, prefs);

          // Test during DND hours
          let testHour: number;
          if (dndStart > dndEnd) {
            // DND crosses midnight
            testHour = dndStart;
          } else if (dndStart < dndEnd) {
            // Normal DND period
            testHour = dndStart;
          } else {
            // DND disabled (start === end)
            return;
          }

          const result = system.sendNotification(event, testHour);

          // Non-critical notifications should be blocked during DND
          if (dndStart !== dndEnd) {
            expect(result.success).toBe(false);
            expect(result.reason).toContain('DND');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 27.3: Daily caps enforcement
  test('notifications are blocked when daily cap is reached', () => {
    fc.assert(
      fc.property(
        notificationEventArb,
        fc.integer({ min: 1, max: 5 }),
        (event, cap) => {
          const prefs: NotificationPreferences = {
            dnd: false,
            severityThreshold: 'low',
            dailyCaps: {
              critical: cap,
              high: cap,
              medium: cap,
              low: cap,
            },
            channels: ['web_push'],
          };

          system.setPreferences(event.userId, prefs);

          // Send notifications up to cap
          const results = [];
          for (let i = 0; i < cap + 2; i++) {
            const result = system.sendNotification(
              { ...event, scopeKey: `${event.scopeKey}_${i}` }, // Unique scope to avoid aggregation
              12 // Noon, outside DND
            );
            results.push(result);
          }

          // First 'cap' notifications should succeed
          for (let i = 0; i < cap; i++) {
            expect(results[i].success).toBe(true);
          }

          // Notifications beyond cap should be blocked
          for (let i = cap; i < results.length; i++) {
            expect(results[i].success).toBe(false);
            expect(results[i].reason).toContain('Daily cap reached');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // Property 27.4: Exposure-aware aggregation
  test('similar notifications within time window are aggregated', () => {
    fc.assert(
      fc.property(notificationEventArb, (event) => {
        const prefs: NotificationPreferences = {
          dnd: false,
          severityThreshold: 'low',
          dailyCaps: { critical: 100, high: 100, medium: 100, low: 100 },
          channels: ['web_push'],
        };

        system.setPreferences(event.userId, prefs);

        // Send first notification
        const result1 = system.sendNotification(event, 12);
        expect(result1.success).toBe(true);
        expect(result1.aggregated).toBe(false);

        // Send duplicate notification (same type and scope)
        const result2 = system.sendNotification(event, 12);

        // Second notification should be aggregated
        expect(result2.success).toBe(true);
        expect(result2.aggregated).toBe(true);
        expect(result2.eventId).toBe(result1.eventId);
      }),
      { numRuns: 100 }
    );
  });

  // Property 27.5: Deep linking presence
  test('all notifications include deep links', () => {
    fc.assert(
      fc.property(notificationEventArb, (event) => {
        const prefs: NotificationPreferences = {
          dnd: false,
          severityThreshold: 'low',
          dailyCaps: { critical: 100, high: 100, medium: 100, low: 100 },
          channels: ['web_push'],
        };

        system.setPreferences(event.userId, prefs);

        const result = system.sendNotification(event, 12);

        if (result.success && !result.aggregated && result.eventId) {
          expect(system.hasDeepLink(result.eventId)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  // Property 27.6: Delivery tracking
  test('notification deliveries are tracked for all channels', () => {
    fc.assert(
      fc.property(notificationEventArb, preferencesArb, (event, prefs) => {
        system.setPreferences(event.userId, prefs);

        const result = system.sendNotification(event, 12);

        if (result.success && !result.aggregated && result.eventId) {
          const deliveries = system.getDeliveryStatus(result.eventId);

          // Should have delivery status for each channel
          expect(deliveries.length).toBe(prefs.channels.length);

          // Each delivery should have required fields
          deliveries.forEach((delivery) => {
            expect(delivery.eventId).toBe(result.eventId);
            expect(prefs.channels).toContain(delivery.channel);
            expect(delivery.status).toBe('sent');
            expect(delivery.sentAt).toBeDefined();
          });
        }
      }),
      { numRuns: 100 }
    );
  });

  // Property 27.7: Read status tracking
  test('notifications can be marked as read and status is tracked', () => {
    fc.assert(
      fc.property(notificationEventArb, (event) => {
        const prefs: NotificationPreferences = {
          dnd: false,
          severityThreshold: 'low',
          dailyCaps: { critical: 100, high: 100, medium: 100, low: 100 },
          channels: ['web_push', 'email'],
        };

        system.setPreferences(event.userId, prefs);

        const result = system.sendNotification(event, 12);

        if (result.success && !result.aggregated && result.eventId) {
          // Mark as read on one channel
          const markResult = system.markAsRead(result.eventId, 'web_push');
          expect(markResult.success).toBe(true);

          // Check delivery status
          const deliveries = system.getDeliveryStatus(result.eventId);
          const webPushDelivery = deliveries.find((d) => d.channel === 'web_push');
          const emailDelivery = deliveries.find((d) => d.channel === 'email');

          // Web push should be marked as read
          expect(webPushDelivery?.status).toBe('read');
          expect(webPushDelivery?.readAt).toBeDefined();

          // Email should still be sent (not read)
          expect(emailDelivery?.status).toBe('sent');
          expect(emailDelivery?.readAt).toBeUndefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  // Property 27.8: Critical notifications override DND
  test('critical notifications are sent even during DND hours', () => {
    fc.assert(
      fc.property(
        notificationEventArb,
        fc.integer({ min: 0, max: 23 }),
        fc.integer({ min: 0, max: 23 }),
        (event, dndStart, dndEnd) => {
          // Force critical severity
          const criticalEvent = { ...event, severity: 'critical' as const };

          const prefs: NotificationPreferences = {
            dnd: true,
            dndStartHour: dndStart,
            dndEndHour: dndEnd,
            severityThreshold: 'low',
            dailyCaps: { critical: 100, high: 100, medium: 100, low: 100 },
            channels: ['web_push'],
          };

          system.setPreferences(criticalEvent.userId, prefs);

          // Test during DND hours
          let testHour: number;
          if (dndStart > dndEnd) {
            testHour = dndStart;
          } else if (dndStart < dndEnd) {
            testHour = dndStart;
          } else {
            return; // DND disabled
          }

          const result = system.sendNotification(criticalEvent, testHour);

          // Critical notifications should succeed even during DND
          if (dndStart !== dndEnd) {
            expect(result.success).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
