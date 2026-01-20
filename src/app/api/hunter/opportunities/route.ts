import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/hunter/opportunities
 * 
 * Temporary implementation to get Hunter live mode working.
 * Returns opportunities from the database without ranking.
 * 
 * TODO: Implement proper Edge Function architecture per requirements:
 * - Task 9: Create feed query service with ranking
 * - Task 9a: Create mv_opportunity_rank materialized view
 * - Task 12: Implement proper API route with validation, rate limiting, caching
 * 
 * Requirements: 1.7, 12.1-12.8
 */
export async function GET(req: NextRequest) {
  try {
    // Create Supabase client with service role key for server-side access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const filter = searchParams.get('filter') || 'All';
    const sort = searchParams.get('sort') || 'recommended';
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    
    // Build query
    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'published');
    
    // Apply type filter
    if (filter !== 'All') {
      const typeMap: Record<string, string[]> = {
        'Airdrops': ['airdrop'],
        'Quests': ['quest', 'testnet'],
        'Yield': ['staking', 'yield'],
        'Points': ['points', 'loyalty'],
        'Staking': ['staking', 'yield'],
      };
      
      const types = typeMap[filter];
      if (types && types.length > 0) {
        query = query.in('type', types);
      }
    }
    
    // Apply sorting
    switch (sort) {
      case 'ends_soon':
        query = query.order('expires_at', { ascending: true, nullsFirst: false });
        break;
      case 'highest_reward':
        query = query.order('reward_max', { ascending: false, nullsFirst: false });
        break;
      case 'newest':
        query = query.order('published_at', { ascending: false, nullsFirst: false });
        break;
      case 'trust':
        query = query.order('trust_score', { ascending: false, nullsFirst: false });
        break;
      case 'recommended':
      default:
        // Default sort by created_at desc (no ranking yet)
        query = query.order('created_at', { ascending: false });
        break;
    }
    
    // Apply limit
    query = query.limit(limit);
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Hunter opportunities query error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to fetch opportunities',
          },
        },
        { status: 500 }
      );
    }
    
    // Return response in required format
    return NextResponse.json(
      {
        items: data || [],
        cursor: null, // TODO: Implement cursor pagination
        ts: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'max-age=60, stale-while-revalidate=300',
          'X-API-Version': '1.0.0',
        },
      }
    );
  } catch (error) {
    console.error('Hunter opportunities API error:', error);
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
