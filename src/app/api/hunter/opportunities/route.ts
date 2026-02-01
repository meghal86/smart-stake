import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getWalletSignals } from '@/lib/hunter/wallet-signals';
import { batchEvaluateEligibility } from '@/lib/hunter/eligibility-engine';
import { batchCalculateRanking, calculateRecencyBoost, sortByRanking } from '@/lib/hunter/ranking-engine';
import type { Opportunity } from '@/lib/hunter/types';
import type { UserHistory } from '@/lib/hunter/ranking-engine';

/**
 * GET /api/hunter/opportunities
 * 
 * Enhanced implementation with wallet-aware personalization.
 * 
 * Features:
 * - Wallet signals integration for personalization
 * - Eligibility evaluation with caching
 * - Multi-factor ranking (relevance + trust + freshness)
 * - Cost-controlled preselection (top 100 → top 50 eligibility)
 * - Backward compatibility (no walletAddress = existing behavior)
 * 
 * Requirements: 1.1-1.7, 7.1-7.5, 11.1-11.3
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
    const walletAddress = searchParams.get('walletAddress');
    
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
        'RWA': ['rwa'],
        'Strategies': ['strategy'],
      };
      
      const types = typeMap[filter];
      if (types && types.length > 0) {
        query = query.in('type', types);
      }
    }
    
    // Apply limit (increase for preselection if personalized)
    const queryLimit = walletAddress ? Math.max(limit * 8, 100) : limit;
    query = query.limit(queryLimit);
    
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

    const opportunities = (data || []) as Opportunity[];

    // If no walletAddress provided, return non-personalized results (backward compatibility)
    if (!walletAddress) {
      // Apply sorting for non-personalized results
      const sortedOpportunities = [...opportunities];
      
      switch (sort) {
        case 'ends_soon':
          sortedOpportunities.sort((a, b) => {
            if (!a.end_date && !b.end_date) return 0;
            if (!a.end_date) return 1;
            if (!b.end_date) return -1;
            return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
          });
          break;
        case 'highest_reward':
          sortedOpportunities.sort((a, b) => (b.reward_max || 0) - (a.reward_max || 0));
          break;
        case 'newest':
          sortedOpportunities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'trust':
          sortedOpportunities.sort((a, b) => b.trust_score - a.trust_score);
          break;
        case 'recommended':
        default:
          // Default sort by created_at desc (no ranking yet)
          sortedOpportunities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
      }
      
      // Apply final limit
      const finalOpportunities = sortedOpportunities.slice(0, limit);
      
      return NextResponse.json(
        {
          items: finalOpportunities,
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
    }

    // PERSONALIZED FLOW: walletAddress provided
    try {
      // Step 1: Fetch wallet signals
      const walletSignals = await getWalletSignals(walletAddress);
      
      // Step 2: Preselect top candidates by hybrid score (cost control)
      // Requirements: 11.2, 11.3 - Preselect top 100 by (trust_score * 0.7 + recency_boost * 0.3)
      const now = Date.now();
      const candidatesWithScore = opportunities.map(opp => ({
        ...opp,
        preScore: (opp.trust_score * 0.7) + (calculateRecencyBoost(opp.created_at, now) * 0.3)
      }));
      
      // Sort by preselection score and take top 100
      candidatesWithScore.sort((a, b) => b.preScore - a.preScore);
      const topCandidates = candidatesWithScore.slice(0, 100);
      
      // Step 3: Evaluate eligibility for top 50 of preselected candidates
      const eligibilityCandidates = topCandidates.slice(0, 50);
      const eligibilityResults = await batchEvaluateEligibility(
        walletSignals, 
        eligibilityCandidates
      );
      
      // Step 4: Fetch user history for relevance scoring
      let userHistory: UserHistory = {};
      try {
        // Get user from auth (if available)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: historyData } = await supabase
            .from('user_history')
            .select('saved_tags, most_completed_type, completed_count')
            .eq('user_id', user.id)
            .single();
          
          if (historyData) {
            userHistory = historyData;
          }
        }
      } catch (error) {
        // User history is optional - continue without it
        console.warn('Failed to fetch user history:', error);
      }
      
      // Step 5: Calculate ranking scores
      const rankingScores = batchCalculateRanking(
        eligibilityCandidates,
        eligibilityResults,
        walletSignals,
        userHistory
      );
      
      // Step 6: Combine opportunities with eligibility and ranking
      const rankedOpportunities = eligibilityCandidates.map((opp, index) => ({
        ...opp,
        eligibility_preview: eligibilityResults[index],
        ranking: rankingScores[index],
      }));
      
      // Step 7: Sort by ranking.overall DESC
      const sortedRankedOpportunities = sortByRanking(rankedOpportunities);
      
      // Step 8: Apply final limit
      const finalOpportunities = sortedRankedOpportunities.slice(0, limit);
      
      return NextResponse.json(
        {
          items: finalOpportunities,
          cursor: null, // TODO: Implement cursor pagination
          ts: new Date().toISOString(),
        },
        {
          headers: {
            'Cache-Control': 'max-age=60, stale-while-revalidate=300',
            'X-API-Version': '1.0.0',
            'X-Personalized': 'true',
          },
        }
      );
      
    } catch (personalizationError) {
      // If personalization fails, fall back to non-personalized results
      console.error('Personalization error, falling back to non-personalized results:', personalizationError);
      
      // Apply non-personalized sorting
      const sortedOpportunities = [...opportunities];
      sortedOpportunities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      // Apply final limit
      const finalOpportunities = sortedOpportunities.slice(0, limit);
      
      return NextResponse.json(
        {
          items: finalOpportunities,
          cursor: null,
          ts: new Date().toISOString(),
          warning: 'Personalization unavailable',
        },
        {
          headers: {
            'Cache-Control': 'max-age=60, stale-while-revalidate=300',
            'X-API-Version': '1.0.0',
            'X-Personalized': 'false',
          },
        }
      );
    }
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
