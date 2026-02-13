/**
 * GET /api/v1/portfolio/notifications
 * 
 * Get user's notification history with filtering and pagination
 * 
 * Requirements: 11.3, 11.4, 15.2, 15.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import {
  getNotificationHistory,
  type NotificationSeverity,
} from '@/lib/portfolio/notification-service';

/**
 * GET /api/v1/portfolio/notifications
 * Get user's notification history
 * 
 * Query parameters:
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0)
 * - severity: 'critical' | 'high' | 'medium' | 'low'
 * - unreadOnly: boolean (default: false)
 */
export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '20', 10),
      100
    );
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const severity = searchParams.get('severity') as NotificationSeverity | null;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Validate severity if provided
    if (severity && !['critical', 'high', 'medium', 'low'].includes(severity)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid severity parameter',
          },
          apiVersion: 'v1',
        },
        { status: 400 }
      );
    }

    // Get notification history
    const result = await getNotificationHistory(user.id, {
      limit,
      offset,
      severity: severity || undefined,
      unreadOnly,
    });

    return NextResponse.json({
      data: {
        notifications: result.events,
        total: result.total,
        limit,
        offset,
      },
      apiVersion: 'v1',
      ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting notification history:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get notification history',
        },
        apiVersion: 'v1',
      },
      { status: 500 }
    );
  }
}
