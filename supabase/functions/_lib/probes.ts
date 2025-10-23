/**
 * Guardian Risk Probes with Evidence Tracking
 * All probes return data + evidence metadata
 */

interface Evidence {
  source: string;
  observedAt: number;
  ttl: number;
  cached?: boolean;
  latencyMs?: number;
}

interface ProbeResult<T> {
  data: T;
  evidence: Evidence;
  error?: string;
}

const ALCHEMY_KEY = Deno.env.get('ALCHEMY_API_KEY') || 'demo';
const ETHERSCAN_KEY = Deno.env.get('ETHERSCAN_API_KEY') || 'YourApiKeyToken';

// Simple in-memory cache for Edge Function
const cache = new Map<string, { data: any; expiresAt: number; source: string }>();

function getCached<T>(key: string): { data: T; ageSec: number; source: string } | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  const ageSec = Math.floor((now - (entry.expiresAt - 86400000)) / 1000);
  return { data: entry.data, ageSec, source: entry.source };
}

function setCache(key: string, data: any, ttlSec: number, source: string) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + (ttlSec * 1000),
    source,
  });
}

/**
 * Probe: Wallet Approvals
 */
export async function probeApprovals(
  address: string,
  chain: string,
  signal?: AbortSignal
): Promise<ProbeResult<any[]>> {
  const start = Date.now();
  const cacheKey = `approvals:${chain}:${address}`;
  
  // Check cache
  const cached = getCached(cacheKey);
  if (cached) {
    return {
      data: cached.data,
      evidence: {
        source: 'cache',
        observedAt: Date.now() - (cached.ageSec * 1000),
        ttl: 900, // 15 min
        cached: true,
        latencyMs: 0,
      },
    };
  }

  try {
    const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`;
    
    const response = await fetch(alchemyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenBalances',
        params: [address, 'erc20'],
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`);
    }

    const data = await response.json();
    const approvals = data.result?.tokenBalances || [];
    
    setCache(cacheKey, approvals, 900, 'alchemy');

    return {
      data: approvals,
      evidence: {
        source: 'alchemy',
        observedAt: Date.now(),
        ttl: 900,
        cached: false,
        latencyMs: Date.now() - start,
      },
    };
  } catch (error) {
    return {
      data: [],
      evidence: {
        source: 'alchemy',
        observedAt: Date.now(),
        ttl: 0,
        latencyMs: Date.now() - start,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Probe: Address Reputation
 */
export async function probeReputation(
  address: string,
  signal?: AbortSignal
): Promise<ProbeResult<{ level: string; reasons: string[]; labels: string[] }>> {
  const start = Date.now();
  const cacheKey = `reputation:${address}`;
  
  const cached = getCached(cacheKey);
  if (cached) {
    return {
      data: cached.data,
      evidence: {
        source: 'cache',
        observedAt: Date.now() - (cached.ageSec * 1000),
        ttl: 86400, // 24h
        cached: true,
        latencyMs: 0,
      },
    };
  }

  try {
    const etherscanUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_KEY}`;
    
    const response = await fetch(etherscanUrl, { signal });

    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status}`);
    }

    // Simplified - in production, parse actual tags/labels
    const result = {
      level: 'neutral',
      reasons: ['No reputation data available'],
      labels: [],
    };
    
    setCache(cacheKey, result, 86400, 'etherscan');

    return {
      data: result,
      evidence: {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 86400,
        cached: false,
        latencyMs: Date.now() - start,
      },
    };
  } catch (error) {
    return {
      data: { level: 'neutral', reasons: ['Reputation check failed'], labels: [] },
      evidence: {
        source: 'etherscan',
        observedAt: Date.now(),
        ttl: 0,
        latencyMs: Date.now() - start,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Probe: Mixer Proximity
 */
export async function probeMixer(
  address: string,
  chain: string,
  signal?: AbortSignal
): Promise<ProbeResult<{ proximityScore: number; directInteractions: number; lastInteraction: number | null }>> {
  const start = Date.now();
  const cacheKey = `mixer:${chain}:${address}`;
  
  const cached = getCached(cacheKey);
  if (cached) {
    return {
      data: cached.data,
      evidence: {
        source: 'cache',
        observedAt: Date.now() - (cached.ageSec * 1000),
        ttl: 21600, // 6h
        cached: true,
        latencyMs: 0,
      },
    };
  }

  try {
    // Simplified mixer check - in production, check transaction history
    const result = {
      proximityScore: 0,
      directInteractions: 0,
      lastInteraction: null,
    };
    
    setCache(cacheKey, result, 21600, 'alchemy');

    return {
      data: result,
      evidence: {
        source: 'alchemy',
        observedAt: Date.now(),
        ttl: 21600,
        cached: false,
        latencyMs: Date.now() - start,
      },
    };
  } catch (error) {
    return {
      data: { proximityScore: 0, directInteractions: 0, lastInteraction: null },
      evidence: {
        source: 'heuristic',
        observedAt: Date.now(),
        ttl: 0,
        latencyMs: Date.now() - start,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Calculate confidence from evidence
 * Older data or failures reduce confidence
 */
export function calculateConfidence(evidenceList: Evidence[]): number {
  if (evidenceList.length === 0) return 0.5;

  let totalConfidence = 1.0;
  const now = Date.now();

  for (const evidence of evidenceList) {
    const ageSec = (now - evidence.observedAt) / 1000;
    const ageRatio = Math.min(ageSec / evidence.ttl, 1.0);
    
    // Reduce confidence as data ages
    const freshnessConfidence = 1.0 - (ageRatio * 0.3); // Max 30% reduction
    
    // Cached data has slightly lower confidence
    const cacheConfidence = evidence.cached ? 0.95 : 1.0;
    
    totalConfidence *= freshnessConfidence * cacheConfidence;
  }

  return Math.max(0.5, Math.min(1.0, totalConfidence));
}

