/**
 * GET /api/cockpit/pulse - Daily Pulse Endpoint
 * 
 * Retrieves daily pulse data for the authenticated user.
 * Supports on-demand generation if pulse is missing.
 * 
 * Requirements: 9.2, 16.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { z } from 'zod';
import { getPulseForDate, getCurrentDateInTimezone } from '@/lib/cockpit/pulse-generator';

// ============================================================================
// Validation Schema
// ============================================================================

const pulseQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD format
  wallet_scope: z.enum(['active', 'all']).optional().default('active'),
});

// ============================================================================
// API Handler
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase client
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
        },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams = {
      date: url.searchParams.get('date') || undefined,
      wallet_scope: url.searchParams.get('wallet_scope') || 'active',
    };

    const validationResult = pulseQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { date, wallet_scope } = validationResult.data;

    // Get user's timezone from cockpit_state
    const { data: cockpitState } = await supabase
      .from('cockpit_state')
      .select('prefs')
      .eq('user_id', user.id)
      .single();

    const timezone = cockpitState?.prefs?.timezone || 'UTC';

    // Determine pulse date
    const pulseDate = date || getCurrentDateInTimezone(timezone);

    // Validate date is not in the future
    const today = getCurrentDateInTimezone(timezone);
    if (pulseDate > today) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot retrieve pulse for future dates',
          },
        },
        { status: 400 }
      );
    }

    // Get or generate pulse
    const pulse = await getPulseForDate(user.id, pulseDate, timezone, wallet_scope);

    if (!pulse) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'No pulse data available for the specified date',
          },
        },
        { status: 404 }
      );
    }

    // Return pulse data
    return NextResponse.json({
      data: pulse,
      error: null,
      meta: {
        ts: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Error in GET /api/cockpit/pulse:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve pulse data',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// Rate Limiting
// ============================================================================

// TODO: Implement rate limiting
// Suggested: 60 requests/hour per user for pulse endpoint