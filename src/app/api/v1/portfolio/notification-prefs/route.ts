/**
 * GET/PUT /api/v1/portfolio/notification-prefs
 * 
 * Manage user notification preferences for portfolio alerts
 * 
 * Requirements: 11.2, 15.2, 15.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from '@/lib/portfolio/notification-service';

/**
 * GET /api/v1/portfolio/notification-prefs
 * Get user's notification preferences
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

    // Get preferences
    const preferences = await getNotificationPreferences(user.id);

    return NextResponse.json({
      data: preferences,
      apiVersion: 'v1',
      ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get notification preferences',
        },
        apiVersion: 'v1',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/portfolio/notification-prefs
 * Update user's notification preferences
 */
export async function PUT(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    
    // Validate preferences
    const preferences: Partial<NotificationPreferences> = {};
    
    if (typeof body.dnd === 'boolean') {
      preferences.dnd = body.dnd;
    }
    
    if (typeof body.dndStartHour === 'number' && body.dndStartHour >= 0 && body.dndStartHour < 24) {
      preferences.dndStartHour = body.dndStartHour;
    }
    
    if (typeof body.dndEndHour === 'number' && body.dndEndHour >= 0 && body.dndEndHour < 24) {
      preferences.dndEndHour = body.dndEndHour;
    }
    
    if (body.severityThreshold && ['critical', 'high', 'medium', 'low'].includes(body.severityThreshold)) {
      preferences.severityThreshold = body.severityThreshold;
    }
    
    if (body.dailyCaps && typeof body.dailyCaps === 'object') {
      preferences.dailyCaps = {
        critical: body.dailyCaps.critical || 10,
        high: body.dailyCaps.high || 5,
        medium: body.dailyCaps.medium || 3,
        low: body.dailyCaps.low || 1,
      };
    }
    
    if (Array.isArray(body.channels)) {
      preferences.channels = body.channels.filter((c: string) =>
        ['web_push', 'email', 'sms'].includes(c)
      );
    }

    // Update preferences
    const result = await updateNotificationPreferences(user.id, preferences);

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            code: 'UPDATE_FAILED',
            message: result.error || 'Failed to update preferences',
          },
          apiVersion: 'v1',
        },
        { status: 500 }
      );
    }

    // Get updated preferences
    const updatedPreferences = await getNotificationPreferences(user.id);

    return NextResponse.json({
      data: updatedPreferences,
      apiVersion: 'v1',
      ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update notification preferences',
        },
        apiVersion: 'v1',
      },
      { status: 500 }
    );
  }
}
