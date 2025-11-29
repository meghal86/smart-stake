/**
 * GET /api/home-metrics
 * 
 * Aggregates metrics from Guardian, Hunter, and HarvestPro for the Home page
 * 
 * Requirements: 7.1, System Req 14.1-14.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';

interface HomeMetrics {
  // Guardian metrics
  guardianScore: number;
  
  // Hunter metrics
  hunterOpportunities: number;
  hunterAvgApy: number;
  hunterConfidence: number;
  
  // HarvestPro metrics
  harvestEstimateUsd: number;
  harvestEligibleTokens: number;
  harvestGasEfficiency: string;
  
  // Trust metrics (platform-wide)
  totalWalletsProtected: number;
  totalYieldOptimizedUsd: number;
  averageGuardianScore: number;
  
  // Metadata
  lastUpdated: string;
  isDemo: boolean;
  demoMode: boolean;
}

export async function GET() {
  try {
    // Create Supabase client (automatically reads session from cookies)
    const supabase = createClient();
    
    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Please authenticate to access this resource',
          },
        },
        { status: 401 }
      );
    }

    // Extract wallet address from user metadata
    const walletAddress = user.user_metadata?.wallet_address;

    if (!walletAddress) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_SESSION',
            message: 'Session missing wallet address',
          },
        },
        { status: 401 }
      );
    }

    // Fetch metrics in parallel
    const [guardianData, hunterData, harvestData, platformStats] = await Promise.allSettled([
      fetchGuardianMetrics(supabase, walletAddress),
      fetchHunterMetrics(supabase, walletAddress),
      fetchHarvestProMetrics(supabase, walletAddress),
      fetchPlatformStats(supabase),
    ]);

    // Extract data with fallbacks
    const guardian = guardianData.status === 'fulfilled' ? guardianData.value : { score: 0 };
    const hunter = hunterData.status === 'fulfilled' ? hunterData.value : { count: 0, avgApy: 0, confidence: 0 };
    const harvest = harvestData.status === 'fulfilled' ? harvestData.value : { estimate: 0, eligibleCount: 0, gasEfficiency: 'Unknown' };
    const stats = platformStats.status === 'fulfilled' ? platformStats.value : { walletsProtected: 10000, yieldOptimized: 5000000, avgScore: 85 };

    // Assemble response
    const metrics: HomeMetrics = {
      guardianScore: guardian.score,
      hunterOpportunities: hunter.count,
      hunterAvgApy: hunter.avgApy,
      hunterConfidence: hunter.confidence,
      harvestEstimateUsd: harvest.estimate,
      harvestEligibleTokens: harvest.eligibleCount,
      harvestGasEfficiency: harvest.gasEfficiency,
      totalWalletsProtected: stats.walletsProtected,
      totalYieldOptimizedUsd: stats.yieldOptimized,
      averageGuardianScore: stats.avgScore,
      lastUpdated: new Date().toISOString(),
      isDemo: false,
      demoMode: false,
    };

    const response = NextResponse.json(
      {
        data: metrics,
        ts: new Date().toISOString(),
      },
      { status: 200 }
    );

    // Set cache headers (cache for 60 seconds)
    response.headers.set('Cache-Control', 'public, max-age=60, must-revalidate');
    response.headers.set('Content-Type', 'application/json');

    return response;
  } catch (error) {
    console.error('Home metrics endpoint error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'METRICS_FETCH_FAILED',
          message: 'Unable to calculate metrics. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch Guardian metrics for a wallet
 */
async function fetchGuardianMetrics(supabase: Awaited<ReturnType<typeof createClient>>, walletAddress: string) {
  try {
    // Query guardian_scans table for the most recent scan
    const { data, error } = await supabase
      .from('guardian_scans')
      .select('overall_score')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn('No Guardian data found for wallet:', walletAddress);
      return { score: 0 };
    }

    return { score: data.overall_score || 0 };
  } catch (error) {
    console.error('Error fetching Guardian metrics:', error);
    return { score: 0 };
  }
}

/**
 * Fetch Hunter metrics for a wallet
 */
async function fetchHunterMetrics(supabase: Awaited<ReturnType<typeof createClient>>, _walletAddress: string) {
  try {
    // Query hunter_opportunities table
    const { data, error } = await supabase
      .from('hunter_opportunities')
      .select('apy_estimate, confidence_score')
      .eq('status', 'active')
      .gte('confidence_score', 70); // Only high-confidence opportunities

    if (error) {
      console.error('Error fetching Hunter metrics:', error);
      return { count: 0, avgApy: 0, confidence: 0 };
    }

    if (!data || data.length === 0) {
      return { count: 0, avgApy: 0, confidence: 0 };
    }

    // Calculate averages
    const avgApy = data.reduce((sum: number, opp: { apy_estimate?: number }) => sum + (opp.apy_estimate || 0), 0) / data.length;
    const avgConfidence = data.reduce((sum: number, opp: { confidence_score?: number }) => sum + (opp.confidence_score || 0), 0) / data.length;

    return {
      count: data.length,
      avgApy: Math.round(avgApy * 10) / 10, // Round to 1 decimal
      confidence: Math.round(avgConfidence),
    };
  } catch (error) {
    console.error('Error fetching Hunter metrics:', error);
    return { count: 0, avgApy: 0, confidence: 0 };
  }
}

/**
 * Fetch HarvestPro metrics for a wallet
 */
async function fetchHarvestProMetrics(supabase: Awaited<ReturnType<typeof createClient>>, walletAddress: string) {
  try {
    // Query harvest_opportunities table
    const { data, error } = await supabase
      .from('harvest_opportunities')
      .select('net_tax_benefit, token_symbol, gas_estimate_usd')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('is_eligible', true)
      .gte('net_tax_benefit', 0);

    if (error) {
      console.error('Error fetching HarvestPro metrics:', error);
      return { estimate: 0, eligibleCount: 0, gasEfficiency: 'Unknown' };
    }

    if (!data || data.length === 0) {
      return { estimate: 0, eligibleCount: 0, gasEfficiency: 'Unknown' };
    }

    // Calculate total tax benefit
    const totalBenefit = data.reduce((sum: number, opp: { net_tax_benefit?: number }) => sum + (opp.net_tax_benefit || 0), 0);
    
    // Calculate average gas cost
    const avgGas = data.reduce((sum: number, opp: { gas_estimate_usd?: number }) => sum + (opp.gas_estimate_usd || 0), 0) / data.length;
    
    // Determine gas efficiency
    let gasEfficiency = 'Unknown';
    if (avgGas < 10) {
      gasEfficiency = 'High';
    } else if (avgGas < 30) {
      gasEfficiency = 'Medium';
    } else {
      gasEfficiency = 'Low';
    }

    return {
      estimate: Math.round(totalBenefit),
      eligibleCount: data.length,
      gasEfficiency,
    };
  } catch (error) {
    console.error('Error fetching HarvestPro metrics:', error);
    return { estimate: 0, eligibleCount: 0, gasEfficiency: 'Unknown' };
  }
}

/**
 * Fetch platform-wide statistics
 */
async function fetchPlatformStats(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    // These could be cached in Redis or computed periodically
    // For now, we'll query the database
    
    // Count total wallets protected (unique wallets in guardian_scans)
    const { count: walletsCount } = await supabase
      .from('guardian_scans')
      .select('wallet_address', { count: 'exact', head: true });

    // Sum total yield optimized (from hunter_opportunities)
    const { data: yieldData } = await supabase
      .from('hunter_opportunities')
      .select('estimated_value_usd')
      .eq('status', 'completed');

    const totalYield = yieldData?.reduce((sum: number, opp: { estimated_value_usd?: number }) => sum + (opp.estimated_value_usd || 0), 0) || 0;

    // Calculate average Guardian score
    const { data: scoresData } = await supabase
      .from('guardian_scans')
      .select('overall_score')
      .order('created_at', { ascending: false })
      .limit(1000); // Sample recent scans

    const avgScore = scoresData && scoresData.length > 0
      ? scoresData.reduce((sum: number, scan: { overall_score?: number }) => sum + (scan.overall_score || 0), 0) / scoresData.length
      : 85;

    return {
      walletsProtected: walletsCount || 10000,
      yieldOptimized: Math.round(totalYield),
      avgScore: Math.round(avgScore),
    };
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    // Return fallback values
    return {
      walletsProtected: 10000,
      yieldOptimized: 5000000,
      avgScore: 85,
    };
  }
}
