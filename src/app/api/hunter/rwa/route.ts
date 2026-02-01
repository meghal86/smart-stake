/**
 * Hunter RWA API Endpoint
 * 
 * GET /api/hunter/rwa?wallet=0x...
 * 
 * Returns RWA vault opportunities filtered by type='rwa'
 * Includes personalization when wallet address is provided
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const walletAddress = searchParams.get('wallet');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('type', 'rwa')
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('RWA fetch error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to fetch RWA opportunities',
          },
        },
        { status: 500 }
      );
    }

    // If wallet address provided, delegate to main opportunities endpoint for personalization
    if (walletAddress) {
      // Redirect to main endpoint with type filter
      const mainEndpoint = new URL('/api/hunter/opportunities', req.url);
      mainEndpoint.searchParams.set('type', 'rwa');
      mainEndpoint.searchParams.set('walletAddress', walletAddress);

      return NextResponse.redirect(mainEndpoint);
    }

    // Return non-personalized RWA opportunities
    return NextResponse.json({
      items: data,
      cursor: null,
      ts: new Date().toISOString(),
    });
  } catch (error) {
    console.error('RWA API error:', error);
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
