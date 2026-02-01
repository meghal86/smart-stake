/**
 * Hunter Points API Route
 * 
 * GET /api/hunter/points?wallet=0x...
 * 
 * Returns points/loyalty program opportunities filtered by type='points'.
 * Supports wallet-aware personalization with eligibility and ranking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWalletSignals } from '@/lib/hunter/wallet-signals';
import { evaluateEligibility } from '@/lib/hunter/eligibility-engine';
import { calculateRanking } from '@/lib/hunter/ranking-engine';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const walletAddress = searchParams.get('wallet');

    // Fetch points opportunities from database
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('type', 'points')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          error: {
            code: 'INTERNAL',
            message: 'Failed to fetch points programs',
          },
        },
        { status: 500 }
      );
    }

    // If no wallet address, return without personalization
    if (!walletAddress) {
      return NextResponse.json({
        items: opportunities || [],
        cursor: null,
        ts: new Date().toISOString(),
      });
    }

    // Personalization flow with wallet address
    try {
      // Fetch wallet signals
      const signals = await getWalletSignals(walletAddress);

      // Preselect candidates by hybrid score
      const now = Date.now();
      const candidatesWithScore = (opportunities || []).map((opp) => {
        const daysOld = (now - new Date(opp.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const recencyBoost = Math.max(0, 1 - daysOld / 30);
        const preScore = (opp.trust_score || 80) * 0.7 + recencyBoost * 0.3;
        return { ...opp, preScore };
      });

      candidatesWithScore.sort((a, b) => b.preScore - a.preScore);
      const topCandidates = candidatesWithScore.slice(0, 100);

      // Evaluate eligibility for top 50
      const eligibilityPromises = topCandidates.slice(0, 50).map((opp) =>
        evaluateEligibility(signals, opp).catch((error) => {
          console.error(`Eligibility error for ${opp.id}:`, error);
          return {
            status: 'maybe' as const,
            score: 0.5,
            reasons: ['Eligibility evaluation unavailable'],
          };
        })
      );

      const eligibilityResults = await Promise.all(eligibilityPromises);

      // Calculate ranking
      const rankedOpps = topCandidates.slice(0, 50).map((opp, i) => {
        const ranking = calculateRanking(
          opp,
          eligibilityResults[i],
          signals,
          { saved_tags: [], most_completed_type: null, completed_count: 0 }
        );

        return {
          ...opp,
          eligibility_preview: eligibilityResults[i],
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
      console.error('Personalization error:', personalizationError);
      // Fallback: return without personalization
      return NextResponse.json({
        items: opportunities || [],
        cursor: null,
        ts: new Date().toISOString(),
        warning: 'Personalization unavailable',
      });
    }
  } catch (error) {
    console.error('Points API error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Failed to fetch points programs',
        },
      },
      { status: 500 }
    );
  }
}
