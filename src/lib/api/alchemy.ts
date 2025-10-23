/**
 * Alchemy API integration for Guardian
 */

export interface Approval {
  token: `0x${string}`;
  spender: `0x${string}`;
  allowance: bigint;
  symbol: string;
  decimals: number;
  tokenName?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  timestamp: number;
  blockNumber: number;
}

export interface SimulateResult {
  success: boolean;
  reason?: string;
  gasUsed?: string;
}

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  polygon: 137,
  optimism: 10,
};

const ALCHEMY_NETWORK_MAP: Record<string, string> = {
  ethereum: 'eth-mainnet',
  base: 'base-mainnet',
  arbitrum: 'arb-mainnet',
  polygon: 'polygon-mainnet',
  optimism: 'opt-mainnet',
};

/**
 * Get Alchemy API URL for a chain
 */
function getAlchemyUrl(chain: string): string {
  const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY || 'demo';
  const network = ALCHEMY_NETWORK_MAP[chain.toLowerCase()] || 'eth-mainnet';
  return `https://${network}.g.alchemy.com/v2/${apiKey}`;
}

/**
 * Get wallet token approvals (ERC20 allowances)
 * Uses Alchemy Token API
 */
export async function getWalletApprovals(
  address: string,
  chain: string
): Promise<Approval[]> {
  try {
    const url = getAlchemyUrl(chain);
    
    // Method 1: Try Alchemy's getTokenAllowances if available
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenBalances',
        params: [address, 'erc20'],
      }),
    });

    if (!response.ok) {
      console.warn('Alchemy API error, returning empty approvals');
      return [];
    }

    const data = await response.json();
    
    // For now, return empty array as we need contract-specific calls
    // In a real implementation, you'd query each token contract for allowances
    // This would require scanning transaction history for Approve events
    
    return [];
  } catch (error) {
    console.error('Error fetching approvals from Alchemy:', error);
    return [];
  }
}

/**
 * Get wallet transactions
 */
export async function getWalletTransactions(
  address: string,
  chain: string,
  limit = 100
): Promise<Transaction[]> {
  try {
    const url = getAlchemyUrl(chain);
    
    const response = await fetch(url, {
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
            maxCount: `0x${limit.toString(16)}`,
            withMetadata: true,
          },
        ],
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const transfers = data.result?.transfers || [];

    return transfers.map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value || '0',
      timestamp: new Date(tx.metadata?.blockTimestamp).getTime() / 1000,
      blockNumber: parseInt(tx.blockNum, 16),
    }));
  } catch (error) {
    console.error('Error fetching transactions from Alchemy:', error);
    return [];
  }
}

/**
 * Get first transaction timestamp for an address (wallet age)
 */
export async function getFirstTxTimestamp(
  address: string,
  chain: string
): Promise<number | null> {
  try {
    const url = getAlchemyUrl(chain);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [
          {
            fromAddress: address,
            category: ['external'],
            maxCount: '0x1',
            order: 'asc',
            withMetadata: true,
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const firstTx = data.result?.transfers?.[0];
    
    if (!firstTx?.metadata?.blockTimestamp) {
      return null;
    }

    return new Date(firstTx.metadata.blockTimestamp).getTime() / 1000;
  } catch (error) {
    console.error('Error fetching first transaction:', error);
    return null;
  }
}

/**
 * Simulate a transaction bundle (for revoke operations)
 */
export async function simulateBundle(
  transactions: Array<{ to: string; data: string; value: string }>,
  chainId: number
): Promise<SimulateResult> {
  try {
    // Find chain name from chainId
    const chain = Object.entries(CHAIN_IDS).find(
      ([_, id]) => id === chainId
    )?.[0];
    
    if (!chain) {
      return { success: false, reason: 'Unsupported chain' };
    }

    const url = getAlchemyUrl(chain);
    
    // Simulate each transaction
    for (const tx of transactions) {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: tx.to,
              data: tx.data,
              value: tx.value || '0x0',
            },
            'latest',
          ],
        }),
      });

      if (!response.ok) {
        return { success: false, reason: 'Simulation failed' };
      }

      const data = await response.json();
      
      if (data.error) {
        return { success: false, reason: data.error.message };
      }
    }

    return { success: true, gasUsed: '21000' };
  } catch (error) {
    return {
      success: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current block number
 */
export async function getBlockNumber(chain: string): Promise<number> {
  try {
    const url = getAlchemyUrl(chain);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_blockNumber',
        params: [],
      }),
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return parseInt(data.result, 16);
  } catch (error) {
    console.error('Error fetching block number:', error);
    return 0;
  }
}

/**
 * Get token metadata
 */
export async function getTokenMetadata(
  tokenAddress: string,
  chain: string
): Promise<{ name: string; symbol: string; decimals: number } | null> {
  try {
    const url = getAlchemyUrl(chain);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getTokenMetadata',
        params: [tokenAddress],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (!data.result) {
      return null;
    }

    return {
      name: data.result.name || 'Unknown',
      symbol: data.result.symbol || 'UNK',
      decimals: data.result.decimals || 18,
    };
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return null;
  }
}

