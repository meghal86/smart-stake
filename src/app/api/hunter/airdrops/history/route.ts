/**
 * Airdrop History API Route
 * 
 * GET /api/hunter/airdrops/history?wallet=<address>
 * 
 * Returns user's airdrop status history (eligible, claimed, missed, expired).
 * 
 * Requirements: 14.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const walletAddress = searchParams.get('wallet');

  if (!walletAddress) {
    return NextResponse.json(
      {
        error: {
          code: 'BAD_REQUEST',
          message: 'wallet parameter is required',
        },
      },
      { status: 400 }
    );
  }

  try {
    // Fetch user's airdrop status history
    const { data, error } = await supabase
      .from('user_airdrop_status')
      .select(`
        *,
        opportunity:opportunities(*)
      `)
      .eq('wallet_address', walletAddress)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching airdrop history:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to fetch airdrop history',
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
    console.error('❌ Airdrop history API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to fetch airdrop history',
        },
      },
      { status: 500 }
    );
  }
}
