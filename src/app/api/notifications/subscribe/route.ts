/**
 * POST /api/notifications/subscribe - Subscribe to web push notifications
 * 
 * Manages web push notification subscriptions for the cockpit.
 * Stores subscription data including endpoint, keys, and user agent.
 * 
 * Requirements: 13.1, 13.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { z } from 'zod';

// Subscription validation schema based on Web Push API standard
const SubscriptionSchema = z.object({
  endpoint: z.string().url('Invalid endpoint URL'),
  keys: z.object({
    p256dh: z.string().min(1, 'P256DH key is required'),
    auth: z.string().min(1, 'Auth key is required'),
  }),
  user_agent: z.string().optional(),
  timezone: z.string().optional(),
});

// Common IANA timezone identifiers for validation
const COMMON_TIMEZONES = new Set([
  // Americas
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'America/Toronto', 'America/Vancouver',
  'America/Mexico_City', 'America/Sao_Paulo', 'America/Buenos_Aires',
  // Europe
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
  'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Vienna', 'Europe/Warsaw',
  'Europe/Moscow', 'Europe/Istanbul', 'Europe/Athens', 'Europe/Zurich',
  // Asia
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore',
  'Asia/Dubai', 'Asia/Mumbai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Jakarta',
  'Asia/Manila', 'Asia/Taipei', 'Asia/Kuala_Lumpur',
  // Pacific
  'Pacific/Auckland', 'Pacific/Sydney', 'Australia/Sydney', 'Australia/Melbourne',
  'Australia/Brisbane', 'Australia/Perth', 'Pacific/Honolulu', 'Pacific/Fiji',
  // Africa
  'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Nairobi',
  // UTC
  'UTC', 'Etc/UTC', 'Etc/GMT',
]);

/**
 * Validates if a string is a valid IANA timezone identifier.
 */
function isValidIANATimezone(tz: string): boolean {
  const ianaPattern = /^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$|^UTC$|^Etc\/(?:UTC|GMT(?:[+-]\d{1,2})?)$/;
  
  if (!ianaPattern.test(tz)) {
    return false;
  }
  
  if (COMMON_TIMEZONES.has(tz)) {
    return true;
  }
  
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Rate limiting check for subscription endpoint
 * Limit: 10 subscriptions per day per user
 */
async function checkSubscriptionRateLimit(supabase: any, userId: string): Promise<boolean> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('web_push_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', oneDayAgo);
  
  if (error) {
    console.error('Error checking subscription rate limit:', error);
    return false; // Allow on error to avoid blocking legitimate requests
  }
  
  return (data?.length || 0) < 10;
}

/**
 * POST /api/notifications/subscribe
 * Creates or updates a web push notification subscription
 */
export async function POST(request: NextRequest) {
  try {
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
    
    const validation = SubscriptionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid subscription data',
            details: validation.error.issues,
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const { endpoint, keys, user_agent, timezone } = validation.data;

    // Validate timezone if provided
    if (timezone && !isValidIANATimezone(timezone)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid IANA timezone identifier',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    // Check rate limit
    const withinRateLimit = await checkSubscriptionRateLimit(supabase, user.id);
    if (!withinRateLimit) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many subscription requests. Limit: 10 per day.',
            retry_after_sec: 3600, // Suggest retry after 1 hour
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 429 }
      );
    }

    // Insert or update subscription (upsert based on unique constraint)
    const { data: subscription, error: upsertError } = await supabase
      .from('web_push_subscriptions')
      .upsert(
        {
          user_id: user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          user_agent: user_agent || null,
        },
        {
          onConflict: 'user_id,endpoint',
          ignoreDuplicates: false,
        }
      )
      .select('id')
      .single();

    if (upsertError) {
      console.error('Error upserting web push subscription:', upsertError);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to save subscription',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 500 }
      );
    }

    // If timezone was provided, update cockpit_state preferences
    if (timezone) {
      try {
        // Fetch existing cockpit_state
        const { data: existingState, error: fetchError } = await supabase
          .from('cockpit_state')
          .select('prefs')
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching cockpit_state for timezone update:', fetchError);
          // Don't fail the subscription, just log the error
        } else {
          const existingPrefs = (existingState?.prefs as Record<string, unknown>) || {};
          
          // Only update timezone if it's not already set
          if (!existingPrefs.timezone) {
            const updatedPrefs = { ...existingPrefs, timezone };

            if (existingState) {
              await supabase
                .from('cockpit_state')
                .update({ prefs: updatedPrefs })
                .eq('user_id', user.id);
            } else {
              await supabase
                .from('cockpit_state')
                .insert({
                  user_id: user.id,
                  prefs: updatedPrefs,
                });
            }
          }
        }
      } catch (error) {
        console.error('Error updating timezone in cockpit_state:', error);
        // Don't fail the subscription, just log the error
      }
    }

    return NextResponse.json(
      {
        data: { ok: true },
        error: null,
        meta: { ts: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notification subscribe error:', error);
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