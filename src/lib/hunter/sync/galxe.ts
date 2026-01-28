/**
 * Galxe Sync Service
 * 
 * Fetches campaigns from Galxe GraphQL API and classifies them as airdrops or quests.
 * 
 * Requirements: 21.1-21.10
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
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  description: string;
  tags: string[];
  url?: string | null;
  airdrop_category?: string;
  claim_start?: string | null;
  claim_end?: string | null;
}

// Galxe GraphQL endpoint (public, no auth required)
const GALXE_GRAPHQL_URL = 'https://graphigo.prd.galaxy.eco/query';

// Chain mapping from Galxe to our format
const CHAIN_MAPPING: Record<string, string> = {
  MATIC: 'polygon',
  BSC: 'bsc',
  BASE: 'base',
  ETHEREUM: 'ethereum',
  GRAVITY_ALPHA: 'gravity',
  ARBITRUM: 'arbitrum',
  OPTIMISM: 'optimism',
  SONEIUM: 'soneium',
};

// Classification keywords
const AIRDROP_KEYWORDS = ['airdrop', 'claim', 'snapshot', 'distribution', 'token drop', 'retroactive'];
const QUEST_KEYWORDS = ['milestone', 'complete tasks', 'join', 'follow', 'social', 'quest'];

interface GalxeCampaign {
  id: string;
  name: string;
  description: string;
  startTime: number; // Unix timestamp
  endTime: number | null;
  status: 'Active' | 'Expired';
  chain: string;
}

interface GalxeResponse {
  data: {
    campaigns: {
      pageInfo: {
        endCursor: string;
        hasNextPage: boolean;
      };
      list: GalxeCampaign[];
    };
  };
}

export interface GalxeSyncResult {
  quests: SyncOpportunity[];
  airdrops: SyncOpportunity[];
  total_fetched: number;
  pages_fetched: number;
}

// In-memory cache for Galxe responses (10 minutes TTL)
let galxeCache: { data: GalxeSyncResult; timestamp: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Classify a Galxe campaign as airdrop or quest based on keywords
 */
function isAirdropCampaign(campaign: GalxeCampaign): boolean {
  const text = (campaign.name + ' ' + campaign.description).toLowerCase();
  
  const hasAirdrop = AIRDROP_KEYWORDS.some(kw => text.includes(kw));
  const hasQuest = QUEST_KEYWORDS.some(kw => text.includes(kw));
  
  // If both or neither, default to quest
  // If only airdrop keywords, classify as airdrop
  return hasAirdrop && !hasQuest;
}

/**
 * Transform Galxe campaign to SyncOpportunity format
 */
function transformCampaign(campaign: GalxeCampaign, type: 'airdrop' | 'quest'): SyncOpportunity {
  const chain = CHAIN_MAPPING[campaign.chain] || campaign.chain.toLowerCase();
  
  return {
    slug: `galxe-${campaign.id}`,
    title: campaign.name,
    protocol: 'Galxe',
    protocol_name: 'Galxe',
    type,
    chains: [chain],
    reward_min: null,
    reward_max: null,
    reward_currency: 'USD',
    trust_score: 85, // Galxe trust score
    source: 'galxe',
    source_ref: campaign.id,
    dedupe_key: `galxe:${campaign.id}`,
    requirements: {
      chains: [chain],
      min_wallet_age_days: 0,
      min_tx_count: 1,
    },
    starts_at: campaign.startTime ? new Date(campaign.startTime * 1000).toISOString() : null,
    ends_at: campaign.endTime ? new Date(campaign.endTime * 1000).toISOString() : null,
    status: campaign.status === 'Active' ? 'published' : 'expired',
    description: campaign.description || `${campaign.name} on Galxe`,
    tags: type === 'airdrop' ? ['airdrop', 'galxe'] : ['quest', 'galxe'],
  };
}

/**
 * Fetch campaigns from Galxe GraphQL API with pagination
 */
async function fetchGalxeCampaigns(maxPages: number = 5): Promise<GalxeCampaign[]> {
  const campaigns: GalxeCampaign[] = [];
  let cursor: string | null = null;
  let pagesFetched = 0;

  while (pagesFetched < maxPages) {
    try {
      const query = `
        query GetCampaigns($after: String) {
          campaigns(input: {first: 50, after: $after}) {
            pageInfo {
              endCursor
              hasNextPage
            }
            list {
              id
              name
              description
              startTime
              endTime
              status
              chain
            }
          }
        }
      `;

      const response = await fetch(GALXE_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: cursor ? { after: cursor } : {},
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - exponential backoff
          const delay = Math.pow(2, pagesFetched) * 1000; // 1s, 2s, 4s, 8s
          console.warn(`⚠️ Galxe rate limited, waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry same page
        }
        throw new Error(`Galxe API error: ${response.status} ${response.statusText}`);
      }

      const data: GalxeResponse = await response.json();
      
      if (!data.data?.campaigns?.list) {
        console.warn('⚠️ Galxe API returned unexpected format');
        break;
      }

      campaigns.push(...data.data.campaigns.list);
      pagesFetched++;

      // Check if there are more pages
      if (!data.data.campaigns.pageInfo.hasNextPage) {
        break;
      }

      cursor = data.data.campaigns.pageInfo.endCursor;

      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error fetching Galxe campaigns (page ${pagesFetched + 1}):`, error);
      // Return partial results on error
      break;
    }
  }

  return campaigns;
}

/**
 * Sync opportunities from Galxe with caching
 */
export async function syncGalxeOpportunities(maxPages: number = 5): Promise<GalxeSyncResult> {
  // Check cache
  if (galxeCache && Date.now() - galxeCache.timestamp < CACHE_TTL_MS) {
    console.log('✅ Returning cached Galxe data');
    return galxeCache.data;
  }

  console.log('🔄 Fetching campaigns from Galxe...');
  
  const campaigns = await fetchGalxeCampaigns(maxPages);
  
  // Filter for Active campaigns only
  const activeCampaigns = campaigns.filter(c => c.status === 'Active');
  
  // Classify campaigns
  const airdrops: SyncOpportunity[] = [];
  const quests: SyncOpportunity[] = [];
  
  for (const campaign of activeCampaigns) {
    if (isAirdropCampaign(campaign)) {
      airdrops.push(transformCampaign(campaign, 'airdrop'));
    } else {
      quests.push(transformCampaign(campaign, 'quest'));
    }
  }

  const result: GalxeSyncResult = {
    quests,
    airdrops,
    total_fetched: campaigns.length,
    pages_fetched: Math.min(maxPages, Math.ceil(campaigns.length / 50)),
  };

  // Cache result
  galxeCache = {
    data: result,
    timestamp: Date.now(),
  };

  console.log(`✅ Fetched ${campaigns.length} campaigns from Galxe (${airdrops.length} airdrops, ${quests.length} quests)`);

  return result;
}
