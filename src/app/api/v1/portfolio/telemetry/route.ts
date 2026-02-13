/**
 * V2 Telemetry API Endpoint
 * 
 * Provides access to comprehensive telemetry metrics:
 * - MTTS (Mean Time To Safety)
 * - Prevented Loss (p50/p95)
 * - Fix Rate and False Positive Rate
 * - Action Funnel Analytics
 * 
 * Requirements: 16.3, 16.4, 16.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { telemetryAnalytics } from '@/lib/portfolio/telemetry/TelemetryAnalytics';
import { supabase } from '@/integrations/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          },
          apiVersion: 'v1'
        },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRangeDays = parseInt(searchParams.get('timeRangeDays') || '30', 10);
    const metric = searchParams.get('metric'); // 'mtts' | 'prevented-loss' | 'fix-rate' | 'false-positives' | 'funnel' | 'all'

    // Validate time range
    if (timeRangeDays < 1 || timeRangeDays > 365) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'timeRangeDays must be between 1 and 365'
          },
          apiVersion: 'v1'
        },
        { status: 400 }
      );
    }

    // Fetch requested metrics
    let data;

    switch (metric) {
      case 'mtts':
        data = await telemetryAnalytics.calculateMTTS(user.id, timeRangeDays);
        break;

      case 'prevented-loss':
        data = await telemetryAnalytics.calculatePreventedLoss(user.id, timeRangeDays);
        break;

      case 'fix-rate':
      case 'false-positives': {
        const rates = await telemetryAnalytics.calculateFixAndFPRates(user.id, timeRangeDays);
        data = metric === 'fix-rate' ? rates.fixRate : rates.falsePositiveRate;
        break;
      }

      case 'funnel':
        data = await telemetryAnalytics.calculateActionFunnel(user.id, timeRangeDays);
        break;

      case 'all':
      default:
        data = await telemetryAnalytics.getComprehensiveStats(user.id, timeRangeDays);
        break;
    }

    return NextResponse.json(
      {
        data,
        timeRangeDays,
        userId: user.id,
        ts: new Date().toISOString(),
        apiVersion: 'v1'
      },
      {
        status: 200,
        headers: {
          'X-API-Version': 'v1',
          'Cache-Control': 'private, max-age=300' // Cache for 5 minutes
        }
      }
    );
  } catch (error) {
    console.error('Telemetry API error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch telemetry data'
        },
        apiVersion: 'v1'
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for recording telemetry events
 * Allows external systems to submit telemetry data
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          },
          apiVersion: 'v1'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventType, eventData } = body;

    if (!eventType) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'eventType is required'
          },
          apiVersion: 'v1'
        },
        { status: 400 }
      );
    }

    // Validate and insert event based on type
    let result;

    switch (eventType) {
      case 'mtts_issue':
        result = await supabase.from('portfolio_mtts_metrics').insert({
          user_id: user.id,
          ...eventData
        });
        break;

      case 'prevented_loss':
        result = await supabase.from('portfolio_prevented_loss_metrics').insert({
          user_id: user.id,
          ...eventData
        });
        break;

      case 'fix_rate':
        result = await supabase.from('portfolio_fix_rate_metrics').insert({
          user_id: user.id,
          ...eventData
        });
        break;

      case 'false_positive':
        result = await supabase.from('portfolio_false_positive_metrics').insert({
          user_id: user.id,
          ...eventData
        });
        break;

      case 'action_funnel':
        result = await supabase.from('portfolio_action_funnel_metrics').insert({
          user_id: user.id,
          ...eventData
        });
        break;

      default:
        return NextResponse.json(
          {
            error: {
              code: 'INVALID_EVENT_TYPE',
              message: `Unknown event type: ${eventType}`
            },
            apiVersion: 'v1'
          },
          { status: 400 }
        );
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json(
      {
        success: true,
        eventType,
        ts: new Date().toISOString(),
        apiVersion: 'v1'
      },
      {
        status: 201,
        headers: {
          'X-API-Version': 'v1'
        }
      }
    );
  } catch (error) {
    console.error('Telemetry POST error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to record telemetry event'
        },
        apiVersion: 'v1'
      },
      { status: 500 }
    );
  }
}
