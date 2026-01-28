/**
 * Airdrops API Route
 * 
 * GET /api/hunter/airdrops?wallet=<address>
 * 
 * Returns airdrop opportunities filtered by type='airdrop'.
 * Optionally personalized with wallet address.
 * 
 * Requirements: 1.1-1.7, 14.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWalletSignals } from '@/lib/hunter/wallet-signals';
import { evaluateEligibility } from '@/lib/hunter/eligibility-engine';
import { calculateRanking } from '@/lib/hunter/ranking-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const walletAddress = searchParams.get('wallet');

  try {
    // Fetch airdrop opportunities from database
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('type', 'airdrop')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Error fetching airdrops:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to fetch airdrops',
          },
        },
        { status: 500 }
      );
    }

    // If no wallet address, return non-personalized results
    if (!walletAddress) {
      return NextResponse.json({
        items: data || [],
        cursor: null,
        ts: new Date().toISOString(),
      });
    }

    // Personalized flow with wallet address
    try {
      // Fetch wallet signals
      const signals = await getWalletSignals(walletAddress);

      // Preselect candidates by hybrid score
      const now = Date.now();
      const candidatesWithScore = (data || []).map((opp: any) => {
        const daysOld = (now - new Date(opp.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const recencyBoost = Math.max(0, 1 - daysOld / 30);
        return {
          ...opp,
          preScore: (opp.trust_score || 80) * 0.7 + recencyBoost * 0.3,
        };
      });

      candidatesWithScore.sort((a, b) => b.preScore - a.preScore);
      const topCandidates = candidatesWithScore.slice(0, 100);

      // Evaluate eligibility for top 50
      const eligibilityPromises = topCandidates.slice(0, 50).map(async (opp) => {
        const eligibility = await evaluateEligibility(signals, opp);
        return { opp, eligibility };
      });

      const eligibilityResults = await Promise.all(eligibilityPromises);

      // Calculate ranking
      const rankedOpps = eligibilityResults.map(({ opp, eligibility }) => {
        const ranking = calculateRanking(opp, eligibility, signals, {
          saved_tags: [],
          most_completed_type: null,
          completed_count: 0,
        });

        return {
          ...opp,
          eligibility_preview: eligibility,
          ranking,
        };
      });

      // Sort by ranking.overall DESC
      rankedOpps.sort((a, b) => b.ranking.overall - a.ranking.overall);

      return NextResponse.json({
        items: rankedOpps,
        cursor: null,
        ts: new Date().toISOString(),
      });
    } catch (personalizationError) {
      console.error('⚠️ Personalization failed, returning non-personalized results:', personalizationError);
      // Fallback to non-personalized results
      return NextResponse.json({
        items: data || [],
        cursor: null,
        ts: new Date().toISOString(),
        warning: 'Personalization unavailable',
      });
    }
  } catch (error) {
    console.error('❌ Airdrops API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to fetch airdrops',
        },
      },
      { status: 500 }
    );
  }
}
