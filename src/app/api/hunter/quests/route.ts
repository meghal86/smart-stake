/**
 * Quest Opportunities API Route
 * 
 * GET /api/hunter/quests?wallet=0x...
 * Returns quest opportunities filtered by type='quest'
 * 
 * Requirements: 1.1-1.7
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWalletSignals } from '@/lib/hunter/wallet-signals';
import { evaluateEligibility } from '@/lib/hunter/eligibility-engine';
import { calculateRanking } from '@/lib/hunter/ranking-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet');

    // Fetch quest opportunities
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('type', 'quest')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Error fetching quests:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to fetch quests',
          },
        },
        { status: 500 }
      );
    }

    // If no wallet address, return without personalization
    if (!walletAddress) {
      return NextResponse.json({
        items: data || [],
        cursor: null,
        ts: new Date().toISOString(),
      });
    }

    // Personalized flow with wallet
    try {
      // Fetch wallet signals
      const signals = await getWalletSignals(walletAddress);

      // Preselect top 100 candidates by hybrid score
      const now = Date.now();
      const candidatesWithScore = (data || []).map(opp => {
        const recencyBoost = Math.max(0, 1 - (now - new Date(opp.created_at).getTime()) / (30 * 24 * 60 * 60 * 1000));
        return {
          ...opp,
          preScore: (opp.trust_score * 0.7) + (recencyBoost * 0.3),
        };
      });
      candidatesWithScore.sort((a, b) => b.preScore - a.preScore);
      const topCandidates = candidatesWithScore.slice(0, 100);

      // Evaluate eligibility for top 50
      const eligibilityResults = await Promise.all(
        topCandidates.slice(0, 50).map(opp => evaluateEligibility(signals, opp))
      );

      // Calculate ranking
      const rankedOpps = topCandidates.slice(0, 50).map((opp, i) => ({
        ...opp,
        eligibility_preview: eligibilityResults[i],
        ranking: calculateRanking(opp, eligibilityResults[i], signals, {}),
      }));

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
    console.error('❌ Quest API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to fetch quests',
        },
      },
      { status: 500 }
    );
  }
}
