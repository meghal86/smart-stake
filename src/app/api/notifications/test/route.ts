/**
 * POST /api/notifications/test - Dev-only test endpoint for web push notifications
 * 
 * Sends test notifications for development and debugging purposes.
 * Requires dev-only authentication and enforces rate limiting.
 * 
 * Requirements: 13.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { z } from 'zod';

// Test notification validation schema
const TestNotificationSchema = z.object({
  category: z.enum(['critical', 'daily_pulse', 'expiring_soon'], {
    errorMap: () => ({ message: 'Category must be one of: critical, daily_pulse, expiring_soon' }),
  }),
});

// Rate limiting storage for test endpoint (in-memory for simplicity)
// In production, this should use Redis or database storage
const testRateLimits = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if the request has dev-only authentication
 */
function isDevOnlyAuth(request: NextRequest): boolean {
  // Check for dev-only environment variable
  const devKey = process.env.DEV_NOTIFICATIONS_KEY;
  if (!devKey) {
    return false; // No dev key configured, deny access
  }

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  // Support both "Bearer <key>" and "Dev <key>" formats
  const token = authHeader.replace(/^(Bearer|Dev)\s+/i, '');
  return token === devKey;
}

/**
 * Rate limiting check for test endpoint
 * Limit: 5 tests per day per user
 */
function checkTestRateLimit(userId: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const key = `test_${userId}`;
  
  const existing = testRateLimits.get(key);
  
  if (!existing || now > existing.resetTime) {
    // Reset or create new limit
    const resetTime = now + oneDayMs;
    testRateLimits.set(key, { count: 1, resetTime });
    return { allowed: true };
  }
  
  if (existing.count >= 5) {
    return { allowed: false, resetTime: existing.resetTime };
  }
  
  // Increment count
  existing.count += 1;
  testRateLimits.set(key, existing);
  return { allowed: true };
}

/**
 * Send a test notification (mock implementation for now)
 * In a real implementation, this would use the web-push library
 */
async function sendTestNotification(
  subscription: any,
  category: string
): Promise<{ success: boolean; error?: string }> {
  // Mock notification payloads based on category
  const notifications = {
    critical: {
      title: '🚨 Critical Security Alert',
      body: 'Suspicious activity detected on your wallet. Review immediately.',
      icon: '/icons/alert-critical.png',
      badge: '/icons/badge.png',
      tag: 'critical-alert',
      requireInteraction: true,
    },
    daily_pulse: {
      title: '📊 Daily Pulse Ready',
      body: '3 new opportunities and 2 expiring soon. Check your cockpit.',
      icon: '/icons/pulse.png',
      badge: '/icons/badge.png',
      tag: 'daily-pulse',
      requireInteraction: false,
    },
    expiring_soon: {
      title: '⏰ Opportunity Expiring',
      body: 'Arbitrum quest ends in 2 hours. Act now to secure rewards.',
      icon: '/icons/expiring.png',
      badge: '/icons/badge.png',
      tag: 'expiring-opportunity',
      requireInteraction: false,
    },
  };

  const payload = notifications[category as keyof typeof notifications];
  
  // In development, we'll just log the notification instead of actually sending it
  console.log('🔔 Test notification sent:', {
    endpoint: subscription.endpoint.substring(0, 50) + '...',
    category,
    payload,
    timestamp: new Date().toISOString(),
  });

  // Simulate success (in real implementation, this would use web-push library)
  return { success: true };
}

/**
 * POST /api/notifications/test
 * Sends a test notification for development purposes
 */
export async function POST(request: NextRequest) {
  try {
    // Check dev-only authentication first
    if (!isDevOnlyAuth(request)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Dev-only endpoint. Requires valid dev authentication.',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON body',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }
    
    const validation = TestNotificationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid test notification data',
            details: validation.error.issues,
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const { category } = validation.data;

    // Check rate limit (5 per day per user)
    const rateLimitResult = checkTestRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      const retryAfterSec = rateLimitResult.resetTime 
        ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        : 3600;

      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'RATE_LIMITED',
            message: 'Test notification limit exceeded. Limit: 5 per day.',
            retry_after_sec: retryAfterSec,
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 429 }
      );
    }

    // Get user's push subscriptions
    const { data: subscriptions, error: fetchError } = await supabase
      .from('web_push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching push subscriptions:', fetchError);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch subscriptions',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'NO_SUBSCRIPTIONS',
            message: 'No push subscriptions found. Subscribe first.',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Send test notifications to all user's subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(subscription => 
        sendTestNotification(subscription, category)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json(
      {
        data: {
          ok: true,
          category,
          sent_to: subscriptions.length,
          successful,
          failed,
          message: `Test ${category} notification sent to ${successful} subscription(s)`,
        },
        error: null,
        meta: { ts: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notification test error:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        meta: { ts: new Date().toISOString() },
      },
      { status: 500 }
    );
  }
}