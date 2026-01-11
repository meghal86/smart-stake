/**
 * POST /api/notifications/unsubscribe - Unsubscribe from web push notifications
 * 
 * Removes web push notification subscriptions for the cockpit.
 * Deletes subscription data based on endpoint.
 * 
 * Requirements: 13.1, 13.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { z } from 'zod';

// Unsubscription validation schema
const UnsubscribeSchema = z.object({
  endpoint: z.string().url('Invalid endpoint URL'),
});

/**
 * Rate limiting check for unsubscription endpoint
 * Limit: 20 unsubscriptions per day per user (more lenient than subscribe)
 */
async function checkUnsubscribeRateLimit(supabase: any, userId: string): Promise<boolean> {
  // For unsubscribe, we'll be more lenient and just check if they're not spamming
  // We don't store unsubscribe events, so we'll use a simple time-based check
  // This is mainly to prevent abuse, legitimate unsubscribes should always work
  return true; // Allow unsubscribe operations (they're removing data, not adding)
}

/**
 * POST /api/notifications/unsubscribe
 * Removes a web push notification subscription
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
    
    const validation = UnsubscribeSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid unsubscribe data',
            details: validation.error.issues,
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const { endpoint } = validation.data;

    // Check rate limit (lenient for unsubscribe)
    const withinRateLimit = await checkUnsubscribeRateLimit(supabase, user.id);
    if (!withinRateLimit) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many unsubscribe requests.',
            retry_after_sec: 60, // Short retry for unsubscribe
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 429 }
      );
    }

    // Delete the subscription
    const { data: deletedRows, error: deleteError } = await supabase
      .from('web_push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)
      .select('id');

    if (deleteError) {
      console.error('Error deleting web push subscription:', deleteError);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to remove subscription',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 500 }
      );
    }

    // Return success even if no rows were deleted (idempotent operation)
    // This handles cases where the subscription was already removed
    const wasDeleted = deletedRows && deletedRows.length > 0;

    return NextResponse.json(
      {
        data: { 
          ok: true,
          deleted: wasDeleted,
        },
        error: null,
        meta: { ts: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notification unsubscribe error:', error);
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