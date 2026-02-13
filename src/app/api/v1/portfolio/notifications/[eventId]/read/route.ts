/**
 * POST /api/v1/portfolio/notifications/[eventId]/read
 * 
 * Mark a notification as read
 * 
 * Requirements: 11.4, 15.2, 15.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { markNotificationAsRead } from '@/lib/portfolio/notification-service';

/**
 * POST /api/v1/portfolio/notifications/[eventId]/read
 * Mark a notification as read for a specific channel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
          apiVersion: 'v1',
        },
        { status: 401 }
      );
    }

    const { eventId } = params;

    // Parse request body
    const body = await request.json();
    const channel = body.channel || 'web_push';

    // Validate channel
    if (!['web_push', 'email', 'sms'].includes(channel)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid channel parameter',
          },
          apiVersion: 'v1',
        },
        { status: 400 }
      );
    }

    // Verify the notification belongs to the user
    const { data: event, error: eventError } = await supabase
      .from('notification_events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Notification not found',
          },
          apiVersion: 'v1',
        },
        { status: 404 }
      );
    }

    if (event.user_id !== user.id) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
          apiVersion: 'v1',
        },
        { status: 403 }
      );
    }

    // Mark as read
    const result = await markNotificationAsRead(eventId, channel);

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'UPDATE_FAILED',
            message: result.error || 'Failed to mark notification as read',
          },
          apiVersion: 'v1',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        eventId,
        channel,
        status: 'read',
        readAt: new Date().toISOString(),
      },
      apiVersion: 'v1',
      ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to mark notification as read',
        },
        apiVersion: 'v1',
      },
      { status: 500 }
    );
  }
}
