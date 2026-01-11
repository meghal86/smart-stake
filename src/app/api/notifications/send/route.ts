/**
 * POST /api/notifications/send - Send notifications via the cockpit notification service
 * 
 * This endpoint provides a way to send notifications from the frontend or other
 * parts of the system. It validates the request and delegates to the Edge Function.
 * 
 * Requirements: 13.5, 13.6, 13.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { z } from 'zod';

// Notification request validation schema
const SendNotificationSchema = z.object({
  category: z.enum(['critical', 'daily_pulse', 'expiring_soon'], {
    errorMap: () => ({ message: 'Category must be one of: critical, daily_pulse, expiring_soon' }),
  }),
  message: z.string().min(1, 'Message is required').max(200, 'Message too long'),
  data: z.record(z.unknown()).optional(),
  userId: z.string().uuid().optional(), // If not provided, uses authenticated user
});

/**
 * POST /api/notifications/send
 * Sends a notification using the cockpit notification service
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
    
    const validation = SendNotificationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification request',
            details: validation.error.issues,
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 400 }
      );
    }

    const { category, message, data, userId } = validation.data;
    const targetUserId = userId || user.id;

    // For security, only allow users to send notifications to themselves
    // unless they have admin privileges (you could add role checking here)
    if (targetUserId !== user.id) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot send notifications to other users',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 403 }
      );
    }

    // Call the Edge Function to send the notification
    const { data: result, error: edgeFunctionError } = await supabase.functions.invoke(
      'cockpit-notify',
      {
        body: {
          userId: targetUserId,
          category,
          message,
          data,
        },
      }
    );

    if (edgeFunctionError) {
      console.error('Error calling cockpit-notify Edge Function:', edgeFunctionError);
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to send notification',
          },
          meta: { ts: new Date().toISOString() },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        data: result.data,
        error: null,
        meta: { ts: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Notification send error:', error);
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