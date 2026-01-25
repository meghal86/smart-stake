import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

/**
 * GET /api/v1/portfolio/notification-prefs
 * 
 * Returns user's notification preferences for portfolio alerts and updates.
 * 
 * Requirements: 15.2, 15.3
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from auth
    const userId = await getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get notification preferences
    const { data: prefs, error } = await supabase
      .from('notification_prefs')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching notification preferences:', error);
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch notification preferences'
          }
        },
        { status: 500 }
      );
    }

    // Return default preferences if none exist
    const defaultPrefs = {
      dnd: false,
      caps: {
        email: true,
        push: true,
        sms: false
      },
      severityThreshold: 'medium' as const,
      channels: {
        critical: ['email', 'push'],
        high: ['email', 'push'],
        medium: ['email'],
        low: []
      }
    };

    const preferences = prefs || defaultPrefs;

    return NextResponse.json({
      data: preferences,
      apiVersion: 'v1'
    });

  } catch (error) {
    console.error('Notification preferences GET error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch notification preferences'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/portfolio/notification-prefs
 * 
 * Updates user's notification preferences for portfolio alerts and updates.
 * 
 * Requirements: 15.2, 15.3
 */
export async function PUT(request: NextRequest) {
  try {
    // Get user ID from auth
    const userId = await getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = notificationPrefsSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid notification preferences',
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      );
    }

    const prefs = validationResult.data;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upsert notification preferences
    const { data, error } = await supabase
      .from('notification_prefs')
      .upsert({
        user_id: userId,
        dnd: prefs.dnd,
        caps: prefs.caps,
        severity_threshold: prefs.severityThreshold,
        channels: prefs.channels,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json(
        {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to update notification preferences'
          }
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        dnd: data.dnd,
        caps: data.caps,
        severityThreshold: data.severity_threshold,
        channels: data.channels
      },
      apiVersion: 'v1'
    });

  } catch (error) {
    console.error('Notification preferences PUT error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update notification preferences'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Validation schema for notification preferences
 */
const notificationPrefsSchema = z.object({
  dnd: z.boolean(),
  caps: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean()
  }),
  severityThreshold: z.enum(['critical', 'high', 'medium', 'low']),
  channels: z.object({
    critical: z.array(z.enum(['email', 'push', 'sms'])),
    high: z.array(z.enum(['email', 'push', 'sms'])),
    medium: z.array(z.enum(['email', 'push', 'sms'])),
    low: z.array(z.enum(['email', 'push', 'sms']))
  })
});

/**
 * Get user ID from authentication
 */
async function getUserIdFromAuth(request: NextRequest): Promise<string | null> {
  // TODO: Implement proper authentication
  // This is a placeholder implementation
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  
  // For now, return a mock user ID
  return 'mock-user-id';
}