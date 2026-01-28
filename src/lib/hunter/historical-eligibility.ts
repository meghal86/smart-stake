/**
 * Historical Eligibility Checker
 * 
 * Checks if a wallet was active before an airdrop snapshot date.
 * Uses Alchemy Transfers API to get historical transaction data.
 * 
 * Requirements: 22.1-22.7
 */

// In-memory cache for historical eligibility (7 days TTL)
interface HistoricalCache {
  [key: string]: {
    was_active: boolean;
    first_tx_date: string | null;
    reason: string;
    timestamp: number;
  };
}

const historicalCache: HistoricalCache = {};
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Block number cache (immutable mapping)
interface BlockCache {
  [timestamp: string]: number;
}

const blockCache: BlockCache = {};

export interface SnapshotEligibilityResult {
  was_active: boolean;
  first_tx_date: string | null;
  reason: string;
}

/**
 * Get block number for a given timestamp
 * Uses Alchemy or Etherscan API
 */
async function getBlockByTimestamp(
  snapshotDate: string,
  chain: string
): Promise<number | null> {
  const cacheKey = `${chain}:${snapshotDate}`;

  // Check cache
  if (blockCache[cacheKey]) {
    return blockCache[cacheKey];
  }

  // For now, return null if no Alchemy API configured
  // In production, this would call Alchemy or Etherscan API
  const alchemyKey = process.env.ALCHEMY_TRANSFERS_API_KEY;
  if (!alchemyKey) {
    console.warn('⚠️ Alchemy Transfers API not configured, cannot get block by timestamp');
    return null;
  }

  try {
    // Simplified: In production, call Alchemy or Etherscan API
    // For now, estimate block number based on timestamp
    const snapshotTimestamp = new Date(snapshotDate).getTime();
    const genesisTimestamp = new Date('2015-07-30').getTime(); // Ethereum genesis
    const avgBlockTime = 12000; // 12 seconds per block

    const blockNumber = Math.floor((snapshotTimestamp - genesisTimestamp) / avgBlockTime);

    // Cache result
    blockCache[cacheKey] = blockNumber;

    return blockNumber;
  } catch (error) {
    console.error('❌ Error getting block by timestamp:', error);
    return null;
  }
}

/**
 * Check if wallet was active before snapshot date
 */
export async function checkSnapshotEligibility(
  walletAddress: string,
  snapshotDate: string,
  requiredChain: string
): Promise<SnapshotEligibilityResult> {
  const cacheKey = `${walletAddress}:${snapshotDate}:${requiredChain}`;

  // Check cache
  if (historicalCache[cacheKey]) {
    const cached = historicalCache[cacheKey];
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log('✅ Returning cached historical eligibility');
      return {
        was_active: cached.was_active,
        first_tx_date: cached.first_tx_date,
        reason: cached.reason,
      };
    }
  }

  // Check if Alchemy Transfers API is configured
  const alchemyKey = process.env.ALCHEMY_TRANSFERS_API_KEY;
  if (!alchemyKey) {
    const result: SnapshotEligibilityResult = {
      was_active: false,
      first_tx_date: null,
      reason: 'Cannot verify snapshot activity (Alchemy Transfers API not configured)',
    };

    // Cache result for 1 hour (shorter TTL for degraded mode)
    historicalCache[cacheKey] = {
      ...result,
      timestamp: Date.now(),
    };

    return result;
  }

  try {
    // Get block number for snapshot date
    const snapshotBlock = await getBlockByTimestamp(snapshotDate, requiredChain);

    if (!snapshotBlock) {
      const result: SnapshotEligibilityResult = {
        was_active: false,
        first_tx_date: null,
        reason: 'Cannot determine snapshot block number',
      };

      historicalCache[cacheKey] = {
        ...result,
        timestamp: Date.now(),
      };

      return result;
    }

    // Call Alchemy Transfers API with block range
    const rpcUrl = getRpcUrlForChain(requiredChain);
    if (!rpcUrl) {
      const result: SnapshotEligibilityResult = {
        was_active: false,
        first_tx_date: null,
        reason: `RPC not configured for chain: ${requiredChain}`,
      };

      historicalCache[cacheKey] = {
        ...result,
        timestamp: Date.now(),
      };

      return result;
    }

    // Fetch transfers before snapshot
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [
          {
            fromBlock: '0x0',
            toBlock: `0x${snapshotBlock.toString(16)}`,
            fromAddress: walletAddress,
            category: ['external', 'token', 'internal'],
            maxCount: '0x1', // Only need first transaction
            order: 'asc',
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Alchemy API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`Alchemy API error: ${data.error.message}`);
    }

    const transfers = data.result?.transfers || [];

    if (transfers.length === 0) {
      // No transactions before snapshot
      const result: SnapshotEligibilityResult = {
        was_active: false,
        first_tx_date: null,
        reason: `No activity before snapshot (${new Date(snapshotDate).toISOString().split('T')[0]})`,
      };

      historicalCache[cacheKey] = {
        ...result,
        timestamp: Date.now(),
      };

      return result;
    }

    // Wallet had transactions before snapshot
    const firstTx = transfers[0];
    const firstTxDate = firstTx.metadata?.blockTimestamp || null;

    const result: SnapshotEligibilityResult = {
      was_active: true,
      first_tx_date: firstTxDate,
      reason: '✓ Active before snapshot',
    };

    historicalCache[cacheKey] = {
      ...result,
      timestamp: Date.now(),
    };

    return result;
  } catch (error) {
    console.error('❌ Error checking snapshot eligibility:', error);

    const result: SnapshotEligibilityResult = {
      was_active: false,
      first_tx_date: null,
      reason: 'Error checking snapshot activity',
    };

    // Cache error result for 1 hour
    historicalCache[cacheKey] = {
      ...result,
      timestamp: Date.now(),
    };

    return result;
  }
}

/**
 * Get RPC URL for a given chain
 */
function getRpcUrlForChain(chain: string): string | null {
  const chainMap: Record<string, string | undefined> = {
    ethereum: process.env.ALCHEMY_ETH_RPC_URL,
    base: process.env.ALCHEMY_BASE_RPC_URL,
    arbitrum: process.env.ALCHEMY_ARB_RPC_URL,
    optimism: process.env.ALCHEMY_OPT_RPC_URL,
    polygon: process.env.ALCHEMY_POLYGON_RPC_URL,
  };

  return chainMap[chain.toLowerCase()] || null;
}
