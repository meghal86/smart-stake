/**
 * DeFiLlama Airdrops Sync Service
 * 
 * Fetches airdrop data from DeFiLlama API.
 * 
 * Requirements: 23.1-23.6
 */

// Internal opportunity format for sync (matches database schema)
export interface SyncOpportunity {
  slug: string;
  title: string;
  protocol: string;
  protocol_name: string;
  type: string;
  chains: string[];
  reward_min: number | null;
  reward_max: number | null;
  reward_currency: string;
  trust_score: number;
  source: string;
  source_ref: string;
  dedupe_key: string;
  requirements: Record<string, any>;
  starts_at?: string | null;
  ends_at?: string | null;
  status?: string;
  description: string;
  tags: string[];
  url?: string | null;
  airdrop_category?: string;
  claim_start?: string | null;
  claim_end?: string | null;
}

const DEFILLAMA_AIRDROPS_URL = 'https://api.llama.fi/airdrops';

interface DefiLlamaAirdrop {
  id: string;
  name: string;
  symbol: string;
  description?: string;
  chain: string;
  claimStart?: number; // Unix timestamp
  claimEnd?: number; // Unix timestamp
  claimUrl?: string;
}

// In-memory cache for DeFiLlama airdrops (1 hour TTL)
let defiLlamaCache: { data: SyncOpportunity[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Transform DeFiLlama airdrop to SyncOpportunity format
 */
function transformAirdrop(airdrop: DefiLlamaAirdrop): SyncOpportunity {
  const chain = airdrop.chain.toLowerCase();
  
  return {
    slug: `defillama-${airdrop.id}`,
    title: `${airdrop.name} (${airdrop.symbol}) Airdrop`,
    protocol: airdrop.name,
    protocol_name: airdrop.name,
    type: 'airdrop',
    chains: [chain],
    reward_min: null,
    reward_max: null,
    reward_currency: airdrop.symbol,
    trust_score: 90, // DeFiLlama is a trusted source
    source: 'defillama',
    source_ref: airdrop.id,
    dedupe_key: `defillama:${airdrop.id}`,
    requirements: {
      chains: [chain],
      min_wallet_age_days: 0,
      min_tx_count: 1,
    },
    claim_start: airdrop.claimStart ? new Date(airdrop.claimStart * 1000).toISOString() : null,
    claim_end: airdrop.claimEnd ? new Date(airdrop.claimEnd * 1000).toISOString() : null,
    url: airdrop.claimUrl || null,
    description: airdrop.description || `${airdrop.name} airdrop`,
    tags: ['airdrop', 'defillama'],
    airdrop_category: 'defi',
  };
}

/**
 * Fetch airdrops from DeFiLlama API with caching
 */
export async function syncDefiLlamaAirdrops(): Promise<SyncOpportunity[]> {
  // Check cache
  if (defiLlamaCache && Date.now() - defiLlamaCache.timestamp < CACHE_TTL_MS) {
    console.log('✅ Returning cached DeFiLlama airdrops');
    return defiLlamaCache.data;
  }

  console.log('🔄 Fetching airdrops from DeFiLlama...');

  try {
    const response = await fetch(DEFILLAMA_AIRDROPS_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`DeFiLlama API error: ${response.status} ${response.statusText}`);
    }

    const airdrops: DefiLlamaAirdrop[] = await response.json();
    
    if (!Array.isArray(airdrops)) {
      console.warn('⚠️ DeFiLlama API returned unexpected format');
      return [];
    }

    const opportunities = airdrops.map(transformAirdrop);

    // Cache result
    defiLlamaCache = {
      data: opportunities,
      timestamp: Date.now(),
    };

    console.log(`✅ Fetched ${opportunities.length} airdrops from DeFiLlama`);

    return opportunities;
  } catch (error) {
    console.error('❌ Error fetching DeFiLlama airdrops:', error);
    // Return cached data if available, otherwise empty array
    return defiLlamaCache?.data || [];
  }
}
