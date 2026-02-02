/**
 * Hunter Strategy Subscription API Endpoint
 * 
 * POST /api/hunter/strategies/subscribe
 * 
 * Subscribe to a strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body = await req.json();
    const { strategy_id } = body;

    // Validate required fields
    if (!strategy_id) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required field: strategy_id',
          },
        },
        { status: 400 }
      );
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    // Check if strategy exists
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .select('id')
      .eq('id', strategy_id)
      .single();

    if (strategyError || !strategy) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'Strategy not found',
          },
        },
        { status: 404 }
      );
    }

    // Subscribe to strategy (upsert to handle re-subscription)
    const { data, error } = await supabase
      .from('strategy_subscriptions')
      .upsert(
        {
          user_id: user.id,
          strategy_id,
          subscribed_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,strategy_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Strategy subscription error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to subscribe to strategy',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Strategy subscription API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
