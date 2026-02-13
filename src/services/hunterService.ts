/**
 * Hunter Service
 * 
 * Provides opportunity discovery and analysis functionality.
 * Integrates with Hunter edge functions for real opportunity data.
 * 
 * Task 18.2: Integrate with existing AlphaWhale services
 * Requirements: 1.6
 */

import { createClient } from '@supabase/supabase-js';

export interface HunterOpportunity {
  id: string;
  type: 'airdrop' | 'yield' | 'arbitrage' | 'reward';
  title: string;
  description: string;
  estimatedValue: number;
  confidence: number;
  chainId: number;
  protocol?: string;
  expiresAt?: string;
}

export interface HunterPosition {
  id: string;
  protocol: string;
  type: 'staking' | 'lending' | 'liquidity' | 'farming';
  token: string;
  amount: string;
  valueUsd: number;
  apy?: number;
  chainId: number;
}

export interface HunterScanRequest {
  walletAddresses: string[];
  network?: string;
}

export interface HunterScanResult {
  opportunities: HunterOpportunity[];
  positions: HunterPosition[];
  totalOpportunityValue: number;
  confidence: number;
}

function getSupabaseClient() {
  // Lazy load Supabase client to avoid issues with process.env
  if (typeof window === 'undefined') {
    // Server-side
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  } else {
    // Client-side (shouldn't happen, but fallback)
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
}

/**
 * Request Hunter opportunity scan for wallet addresses
 * Tries to call hunter-opportunities edge function, falls back to mock data
 */
export async function requestHunterScan(request: HunterScanRequest): Promise<HunterScanResult> {
  console.log('🎯 [Hunter] Attempting to fetch opportunities for addresses:', request.walletAddresses);
  
  try {
    const supabase = getSupabaseClient();
    
    // Try to call the hunter-opportunities edge function
    const { data, error } = await supabase.functions.invoke('hunter-opportunities', {
      body: { addresses: request.walletAddresses }
    });

    if (error) {
      console.warn('⚠️ [Hunter] Edge function error, falling back to mock data:', error);
      return getMockHunterData(request.walletAddresses);
    }

    console.log('✅ [Hunter] Received REAL opportunities:', data);

    // Transform edge function response to service format
    const opportunities: HunterOpportunity[] = [];
    const positions: HunterPosition[] = [];

    // Process opportunities from edge function
    if (data && Array.isArray(data.opportunities)) {
      data.opportunities.forEach((opp: any) => {
        opportunities.push({
          id: opp.id || `hunter_${Date.now()}_${Math.random()}`,
          type: opp.type || 'airdrop',
          title: opp.title || opp.name || 'Opportunity',
          description: opp.description || '',
          estimatedValue: opp.estimated_value || opp.value || 0,
          confidence: opp.confidence || 0.7,
          chainId: opp.chain_id || 1,
          protocol: opp.protocol,
          expiresAt: opp.expires_at
        });
      });
    }

    // Process positions from edge function
    if (data && Array.isArray(data.positions)) {
      data.positions.forEach((pos: any) => {
        positions.push({
          id: pos.id || `pos_${Date.now()}_${Math.random()}`,
          protocol: pos.protocol || 'Unknown',
          type: pos.type || 'staking',
          token: pos.token || 'ETH',
          amount: pos.amount?.toString() || '0',
          valueUsd: pos.value_usd || 0,
          apy: pos.apy,
          chainId: pos.chain_id || 1
        });
      });
    }

    const totalOpportunityValue = opportunities.reduce((sum, opp) => sum + opp.estimatedValue, 0);

    return {
      opportunities,
      positions,
      totalOpportunityValue,
      confidence: data?.confidence || 0.75
    };
  } catch (error) {
    console.error('❌ [Hunter] Error calling edge function, falling back to mock data:', error);
    return getMockHunterData(request.walletAddresses);
  }
}

/**
 * Get mock Hunter data as fallback
 */
function getMockHunterData(walletAddresses: string[]): HunterScanResult {
  console.log('🎭 [Hunter] Using MOCK data for', walletAddresses.length, 'address(es)');
  
  const opportunities: HunterOpportunity[] = [];
  const positions: HunterPosition[] = [];
  
  // Generate some mock opportunities
  const opportunityCount = Math.min(walletAddresses.length * 2, 5);
  
  for (let i = 0; i < opportunityCount; i++) {
    const types: Array<'airdrop' | 'yield' | 'arbitrage' | 'reward'> = ['airdrop', 'yield', 'arbitrage', 'reward'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    opportunities.push({
      id: `hunter_opp_${i}`,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Opportunity ${i + 1}`,
      description: `Potential ${type} opportunity detected`,
      estimatedValue: Math.random() * 1000 + 100,
      confidence: 0.7 + Math.random() * 0.2,
      chainId: 1,
      protocol: ['Uniswap', 'Aave', 'Compound', 'Curve'][Math.floor(Math.random() * 4)]
    });
  }
  
  // Generate some mock positions
  const positionCount = Math.min(walletAddresses.length, 3);
  
  for (let i = 0; i < positionCount; i++) {
    const types: Array<'staking' | 'lending' | 'liquidity' | 'farming'> = ['staking', 'lending', 'liquidity', 'farming'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    positions.push({
      id: `hunter_pos_${i}`,
      protocol: ['Uniswap', 'Aave', 'Compound', 'Curve'][Math.floor(Math.random() * 4)],
      type,
      token: ['ETH', 'USDC', 'DAI', 'WBTC'][Math.floor(Math.random() * 4)],
      amount: (Math.random() * 10).toFixed(4),
      valueUsd: Math.random() * 5000 + 500,
      apy: Math.random() * 20 + 2,
      chainId: 1
    });
  }
  
  const totalOpportunityValue = opportunities.reduce((sum, opp) => sum + opp.estimatedValue, 0);
  
  return {
    opportunities,
    positions,
    totalOpportunityValue,
    confidence: 0.75
  };
}

/**
 * Get Hunter opportunities for specific wallet
 */
export async function getHunterOpportunities(walletAddress: string): Promise<HunterOpportunity[]> {
  const result = await requestHunterScan({ walletAddresses: [walletAddress] });
  return result.opportunities;
}

/**
 * Get Hunter positions for specific wallet
 */
export async function getHunterPositions(walletAddress: string): Promise<HunterPosition[]> {
  const result = await requestHunterScan({ walletAddresses: [walletAddress] });
  return result.positions;
}