/**
 * Quest Progress API Route
 * 
 * POST /api/hunter/quests/progress
 * Manually mark quest progress for a user
 * 
 * Requirements: 1.1-1.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Request body schema
const progressSchema = z.object({
  opportunity_id: z.string().uuid(),
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  current_step: z.number().int().min(0),
  completed_steps: z.array(z.number().int()),
  xp_earned: z.number().int().min(0).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Get user from session
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

    // Parse and validate request body
    const body = await req.json();
    const validation = progressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Invalid request body',
            details: validation.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { opportunity_id, wallet_address, current_step, completed_steps, xp_earned } = validation.data;

    // Check if quest is completed (all steps done)
    const { data: opportunity } = await supabase
      .from('opportunities')
      .select('quest_steps, xp_reward')
      .eq('id', opportunity_id)
      .single();

    const totalSteps = opportunity?.quest_steps?.length || 0;
    const isCompleted = completed_steps.length === totalSteps;

    // Upsert quest progress
    const { data, error } = await supabase
      .from('user_quest_progress')
      .upsert(
        {
          user_id: user.id,
          opportunity_id,
          wallet_address,
          current_step,
          completed_steps,
          xp_earned: xp_earned || (isCompleted ? opportunity?.xp_reward : 0),
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,opportunity_id,wallet_address',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating quest progress:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to update quest progress',
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
    console.error('❌ Quest progress API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to update quest progress',
        },
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's quest progress
export async function GET(req: NextRequest) {
  try {
    // Get user from session
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

    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get('opportunity_id');
    const walletAddress = searchParams.get('wallet_address');

    let query = supabase
      .from('user_quest_progress')
      .select('*')
      .eq('user_id', user.id);

    if (opportunityId) {
      query = query.eq('opportunity_id', opportunityId);
    }

    if (walletAddress) {
      query = query.eq('wallet_address', walletAddress);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching quest progress:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to fetch quest progress',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      items: data || [],
      ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Quest progress API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to fetch quest progress',
        },
      },
      { status: 500 }
    );
  }
}
