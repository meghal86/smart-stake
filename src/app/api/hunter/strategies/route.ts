/**
 * Hunter Strategies API Endpoint
 * 
 * GET /api/hunter/strategies - List all strategies
 * POST /api/hunter/strategies - Create new strategy (admin/creator only)
 * 
 * Returns strategies with trust_score_cached and steps_trust_breakdown
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Compute trust score by aggregating Guardian scores from opportunities
 */
async function computeTrustScore(
  opportunityIds: string[],
  supabase: any
): Promise<{ trust_score_cached: number; steps_trust_breakdown: number[] }> {
  // Fetch opportunities to get their trust scores
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select('id, trust_score')
    .in('id', opportunityIds);

  if (error || !opportunities) {
    console.error('Failed to fetch opportunities for trust score:', error);
    return {
      trust_score_cached: 80, // Default
      steps_trust_breakdown: opportunityIds.map(() => 80),
    };
  }

  // Create a map of opportunity ID to trust score
  const trustScoreMap = new Map<string, number>();
  opportunities.forEach((opp) => {
    trustScoreMap.set(opp.id, opp.trust_score || 80);
  });

  // Build steps_trust_breakdown in the same order as opportunityIds
  const steps_trust_breakdown = opportunityIds.map(
    (id) => trustScoreMap.get(id) || 80
  );

  // Calculate average trust score
  const trust_score_cached =
    steps_trust_breakdown.reduce((sum, score) => sum + score, 0) /
    steps_trust_breakdown.length;

  return {
    trust_score_cached: Math.round(trust_score_cached),
    steps_trust_breakdown,
  };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all strategies
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Strategies fetch error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to fetch strategies',
          },
        },
        { status: 500 }
      );
    }

    // Return strategies with trust_score_cached and steps_trust_breakdown
    return NextResponse.json({
      items: data,
      cursor: null,
      ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Strategies API error:', error);
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

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body = await req.json();
    const { slug, title, description, steps, category, tags, featured } = body;

    // Validate required fields
    if (!slug || !title || !steps || !Array.isArray(steps)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required fields: slug, title, steps (array)',
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

    // Compute trust score by aggregating Guardian scores
    const { trust_score_cached, steps_trust_breakdown } =
      await computeTrustScore(steps, supabase);

    // Create strategy
    const { data, error } = await supabase
      .from('strategies')
      .insert({
        slug,
        title,
        description,
        creator_id: user.id,
        steps,
        trust_score_cached,
        steps_trust_breakdown,
        category: category || [],
        tags: tags || [],
        featured: featured || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Strategy creation error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to create strategy',
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
    console.error('Strategy creation API error:', error);
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
