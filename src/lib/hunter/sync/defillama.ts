/**
 * DeFiLlama Sync Service
 * 
 * Fetches yield opportunities from DeFiLlama API and upserts them into the database.
 * Implements response caching (30min TTL) and deduplication by source + source_ref.
 * 
 * Requirements: 2.1, 2.5, 2.6, 10.4
 */

import { createClient } from '@supabase/supabase-js';

// Types
export interface DeFiLlamaPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase?: number;
  apyReward?: number;
  rewardTokens?: string[];
  underlyingTokens?: string[];
  poolMeta?: string;
  il7d?: number;
  apyPct1D?: number;
  apyPct7D?: number;
  apyPct30D?: number;
  stablecoin?: boolean;
  ilRisk?: string;
  exposure?: string;
  predictions?: {
    predictedClass?: string;
    predictedProbability?: number;
    binnedConfidence?: number;
  };
}

export interface SyncResult {
  count: number;
  source: string;
  duration_ms: number;
  errors?: string[];
}

export interface Opportunity {
  slug: string;
  title: string;
  description: string;
  protocol: {
    name: string;
    logo_url: string | null;
  };
  type: 'yield' | 'staking';
  chains: string[];
  reward_min: number | null;
  reward_max: number | null;
  reward_currency: string;
  apr: number;
  tvl_usd: number;
  trust_score: number;
  source: string;
  source_ref: string;
  requirements: {
    chains: string[];
    min_wallet_age_days: number;
    min_tx_count: number;
  };
  apy: number;
  underlying_assets: string[];
  lockup_days: number | null;
}

// Supported chains
const SUPPORTED_CHAINS = [
  'ethereum',
  'base',
  'arbitrum',
  'optimism',
  'polygon',
  'avalanche',
  'bsc',
];

// Chain name mapping (DeFiLlama → our format)
const CHAIN_MAPPING: Record<string, string> = {
  'Ethereum': 'ethereum',
  'Base': 'base',
  'Arbitrum': 'arbitrum',
  'Optimism': 'optimism',
  'Polygon': 'polygon',
  'Avalanche': 'avalanche',
  'BSC': 'bsc',
  'Binance': 'bsc',
};

// In-memory cache
interface CacheEntry {
  data: DeFiLlamaPool[];
  timestamp: number;
}

let responseCache: CacheEntry | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch pools from DeFiLlama API
 * Implements response caching (30min TTL)
 */
export async function fetchPools(): Promise<DeFiLlamaPool[]> {
  // Check cache
  if (responseCache && Date.now() - responseCache.timestamp < CACHE_TTL_MS) {
    console.log('[DeFiLlama] Returning cached response');
    return responseCache.data;
  }

  const apiUrl = process.env.DEFILLAMA_API_URL || 'https://yields.llama.fi';
  const url = `${apiUrl}/pools`;

  console.log(`[DeFiLlama] Fetching pools from ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama API returned ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    const pools: DeFiLlamaPool[] = json.data || [];

    // Cache response
    responseCache = {
      data: pools,
      timestamp: Date.now(),
    };

    console.log(`[DeFiLlama] Fetched ${pools.length} pools`);
    return pools;
  } catch (error) {
    console.error('[DeFiLlama] Fetch error:', error);
    throw error;
  }
}

/**
 * Filter pools by criteria:
 * - apy > 0
 * - tvlUsd > 100000
 * - chain in supported list
 */
export function filterPools(pools: DeFiLlamaPool[]): DeFiLlamaPool[] {
  const filtered = pools.filter((pool) => {
    // APY must be positive
    if (!pool.apy || pool.apy <= 0) {
      return false;
    }

    // TVL must be > $100k
    if (!pool.tvlUsd || pool.tvlUsd <= 100000) {
      return false;
    }

    // Chain must be supported
    const normalizedChain = CHAIN_MAPPING[pool.chain] || pool.chain.toLowerCase();
    if (!SUPPORTED_CHAINS.includes(normalizedChain)) {
      return false;
    }

    return true;
  });

  console.log(`[DeFiLlama] Filtered ${filtered.length} pools from ${pools.length} total`);
  return filtered;
}

/**
 * Transform DeFiLlama pools to opportunities schema
 */
export function transformToOpportunities(pools: DeFiLlamaPool[]): Opportunity[] {
  return pools.map((pool) => {
    const normalizedChain = CHAIN_MAPPING[pool.chain] || pool.chain.toLowerCase();
    
    // Generate slug
    const slug = `${pool.project}-${normalizedChain}-${pool.symbol}`
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Determine type (staking if single asset, yield if LP/multi-asset)
    const isStaking = !pool.symbol.includes('-') && !pool.symbol.includes('/');
    const type: 'yield' | 'staking' = isStaking ? 'staking' : 'yield';

    // Extract underlying assets
    const underlyingAssets: string[] = [];
    if (pool.underlyingTokens && pool.underlyingTokens.length > 0) {
      underlyingAssets.push(...pool.underlyingTokens);
    } else if (pool.symbol) {
      // Parse from symbol (e.g., "ETH-USDC" → ["ETH", "USDC"])
      const tokens = pool.symbol.split(/[-/]/).map(t => t.trim());
      underlyingAssets.push(...tokens);
    }

    // Build opportunity
    const opportunity: Opportunity = {
      slug,
      title: `${pool.project} ${pool.symbol} ${isStaking ? 'Staking' : 'Yield'}`,
      description: `Earn ${pool.apy.toFixed(2)}% APY on ${pool.symbol} via ${pool.project} on ${pool.chain}. TVL: $${(pool.tvlUsd / 1_000_000).toFixed(2)}M`,
      protocol: {
        name: pool.project,
        logo_url: null, // DeFiLlama doesn't provide logos in pools endpoint
      },
      type,
      chains: [normalizedChain],
      reward_min: null,
      reward_max: null,
      reward_currency: 'USD',
      apr: pool.apy,
      tvl_usd: pool.tvlUsd,
      trust_score: 80, // Default trust score for DeFiLlama pools
      source: 'defillama',
      source_ref: pool.pool, // DeFiLlama pool ID
      requirements: {
        chains: [normalizedChain],
        min_wallet_age_days: 0,
        min_tx_count: 1,
      },
      apy: pool.apy,
      underlying_assets: underlyingAssets,
      lockup_days: null, // DeFiLlama doesn't provide lockup info
    };

    return opportunity;
  });
}

/**
 * Upsert opportunities into database
 * Deduplicates by (source, source_ref)
 */
export async function upsertOpportunities(opportunities: Opportunity[]): Promise<{ count: number; errors: string[] }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const errors: string[] = [];
  let successCount = 0;

  for (const opp of opportunities) {
    try {
      // Upsert by (source, source_ref)
      const { error } = await supabase
        .from('opportunities')
        .upsert(
          {
            slug: opp.slug,
            title: opp.title,
            description: opp.description,
            protocol: opp.protocol,
            type: opp.type,
            chains: opp.chains,
            reward_min: opp.reward_min,
            reward_max: opp.reward_max,
            reward_currency: opp.reward_currency,
            apr: opp.apr,
            tvl_usd: opp.tvl_usd,
            trust_score: opp.trust_score,
            source: opp.source,
            source_ref: opp.source_ref,
            requirements: opp.requirements,
            apy: opp.apy,
            underlying_assets: opp.underlying_assets,
            lockup_days: opp.lockup_days,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'source,source_ref',
            ignoreDuplicates: false, // Update existing records
          }
        );

      if (error) {
        console.error(`[DeFiLlama] Upsert error for ${opp.slug}:`, error);
        errors.push(`${opp.slug}: ${error.message}`);
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`[DeFiLlama] Upsert exception for ${opp.slug}:`, error);
      errors.push(`${opp.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`[DeFiLlama] Upserted ${successCount}/${opportunities.length} opportunities`);
  return { count: successCount, errors };
}

/**
 * Main sync function
 * Orchestrates fetch → filter → transform → upsert
 */
export async function syncYieldOpportunities(): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // 1. Fetch pools
    const pools = await fetchPools();

    // 2. Filter pools
    const filtered = filterPools(pools);

    // 3. Transform to opportunities
    const opportunities = transformToOpportunities(filtered);

    // 4. Upsert to database
    const { count, errors: upsertErrors } = await upsertOpportunities(opportunities);
    errors.push(...upsertErrors);

    const duration = Date.now() - startTime;

    return {
      count,
      source: 'defillama',
      duration_ms: duration,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DeFiLlama] Sync failed:', errorMessage);

    return {
      count: 0,
      source: 'defillama',
      duration_ms: duration,
      errors: [errorMessage, ...errors],
    };
  }
}
