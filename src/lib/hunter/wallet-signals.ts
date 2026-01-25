/**
 * Wallet Signals Service
 * 
 * Fetches on-chain wallet characteristics for personalization.
 * Requirements: 4.1-4.8
 */

/**
 * Wallet signals interface
 */
export interface WalletSignals {
  address: string;
  wallet_age_days: number | null;
  tx_count_90d: number | null;
  chains_active: string[];
  top_assets: Array<{ symbol: string; amount: number }>;
  stablecoin_usd_est: number | null;
}

/**
 * LRU Cache entry
 */
interface CacheEntry {
  signals: WalletSignals;
  timestamp: number;
}

/**
 * In-memory LRU cache for wallet signals
 * TTL: 5 minutes
 */
class WalletSignalsCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_SIZE = 1000; // Max 1000 entries

  get(address: string): WalletSignals | null {
    const entry = this.cache.get(address.toLowerCase());
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > this.TTL_MS) {
      this.cache.delete(address.toLowerCase());
      return null;
    }

    return entry.signals;
  }

  set(address: string, signals: WalletSignals): void {
    // Evict oldest entry if cache is full
    if (this.cache.size >= this.MAX_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(address.toLowerCase(), {
      signals,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
const cache = new WalletSignalsCache();

/**
 * Validate wallet address format
 * Requirements: 4.1
 */
export function validateWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Fetch wallet age via Alchemy Transfers API
 * Requirements: 4.2
 * 
 * Returns wallet age in days, or null if API not configured
 */
async function fetchWalletAge(address: string): Promise<number | null> {
  const apiKey = process.env.ALCHEMY_TRANSFERS_API_KEY;
  if (!apiKey) {
    console.warn('ALCHEMY_TRANSFERS_API_KEY not configured, returning null for wallet_age_days');
    return null;
  }

  try {
    // Call Alchemy Asset Transfers API to get first transaction
    const response = await fetch(
      `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getAssetTransfers',
          params: [
            {
              fromAddress: address,
              category: ['external', 'internal', 'erc20', 'erc721', 'erc1155'],
              order: 'asc',
              maxCount: 1,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error('Alchemy Transfers API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.error('Alchemy Transfers API error:', data.error);
      return null;
    }

    const transfers = data.result?.transfers || [];
    if (transfers.length === 0) {
      // No transfers found, wallet might be new or inactive
      return 0;
    }

    // Get first transaction timestamp
    const firstTx = transfers[0];
    const firstTxDate = new Date(firstTx.metadata.blockTimestamp);
    const now = new Date();
    const ageMs = now.getTime() - firstTxDate.getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

    return ageDays;
  } catch (error) {
    console.error('Error fetching wallet age:', error);
    return null;
  }
}

/**
 * Fetch transaction count and balance via Alchemy RPC
 * Requirements: 4.4
 * 
 * Returns tx count and balance, or null if RPC not configured
 */
async function fetchRPCData(
  address: string
): Promise<{ txCount: number | null; balance: number | null }> {
  const rpcUrl = process.env.ALCHEMY_ETH_RPC_URL;
  if (!rpcUrl) {
    console.warn('ALCHEMY_ETH_RPC_URL not configured, returning null for tx_count and balance');
    return { txCount: null, balance: null };
  }

  try {
    // Batch RPC calls for efficiency
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getTransactionCount',
          params: [address, 'latest'],
        },
        {
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_getBalance',
          params: [address, 'latest'],
        },
      ]),
    });

    if (!response.ok) {
      console.error('Alchemy RPC error:', response.statusText);
      return { txCount: null, balance: null };
    }

    const data = await response.json();
    
    // Parse transaction count
    const txCountResult = data.find((r: any) => r.id === 1);
    const txCount = txCountResult?.result
      ? parseInt(txCountResult.result, 16)
      : null;

    // Parse balance (in wei)
    const balanceResult = data.find((r: any) => r.id === 2);
    const balanceWei = balanceResult?.result
      ? parseInt(balanceResult.result, 16)
      : null;
    const balance = balanceWei !== null ? balanceWei / 1e18 : null; // Convert to ETH

    return { txCount, balance };
  } catch (error) {
    console.error('Error fetching RPC data:', error);
    return { txCount: null, balance: null };
  }
}

/**
 * Estimate tx count in last 90 days
 * 
 * Simple heuristic: (total_tx_count * 90) / wallet_age_days
 */
function estimateTxCount90d(
  totalTxCount: number | null,
  walletAgeDays: number | null
): number | null {
  if (totalTxCount === null || walletAgeDays === null || walletAgeDays === 0) {
    return totalTxCount; // Return total if we can't estimate
  }

  // Estimate based on average daily activity
  const avgDailyTx = totalTxCount / walletAgeDays;
  const estimated90d = Math.floor(avgDailyTx * 90);

  // Cap at total tx count
  return Math.min(estimated90d, totalTxCount);
}

/**
 * Get wallet signals for a given address
 * Requirements: 4.1-4.8
 * 
 * @param address - Wallet address (0x...)
 * @returns WalletSignals object with on-chain characteristics
 * @throws Error if address format is invalid
 */
export async function getWalletSignals(address: string): Promise<WalletSignals> {
  // Validate address format
  if (!validateWalletAddress(address)) {
    throw new Error('Invalid wallet address format. Must match 0x[a-fA-F0-9]{40}');
  }

  // Check cache
  const cached = cache.get(address);
  if (cached) {
    // Return cached data but with the requested address (preserve case)
    return {
      ...cached,
      address, // Use requested address, not cached address
    };
  }

  // Fetch wallet age (if Transfers API configured)
  const walletAgeDays = await fetchWalletAge(address);

  // Fetch RPC data (if RPC configured)
  const { txCount, balance } = await fetchRPCData(address);

  // Estimate tx count in last 90 days
  const txCount90d = estimateTxCount90d(txCount, walletAgeDays);

  // Determine active chains (simplified - only Ethereum for now)
  const chainsActive: string[] = [];
  if (txCount !== null && txCount > 0) {
    chainsActive.push('ethereum');
  }

  // Determine top assets (simplified - only ETH for now)
  const topAssets: Array<{ symbol: string; amount: number }> = [];
  if (balance !== null && balance > 0) {
    topAssets.push({ symbol: 'ETH', amount: balance });
  }

  // Estimate stablecoin holdings (not implemented - would require token balance calls)
  const stablecoinUsdEst = null;

  // Build signals object
  const signals: WalletSignals = {
    address, // Use original address (preserve case)
    wallet_age_days: walletAgeDays,
    tx_count_90d: txCount90d,
    chains_active: chainsActive,
    top_assets: topAssets,
    stablecoin_usd_est: stablecoinUsdEst,
  };

  // Cache signals (but preserve original address for return)
  cache.set(address, signals);

  return signals;
}

/**
 * Clear wallet signals cache (for testing)
 */
export function clearWalletSignalsCache(): void {
  cache.clear();
}
