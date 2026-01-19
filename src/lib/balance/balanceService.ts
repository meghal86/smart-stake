import { getClientForChain } from '@/lib/rpc/providers';
import { formatEther } from 'viem';

export interface BalanceData {
  address: string;
  chainId: number;
  balance: bigint;
  formattedBalance: string;
  decimals: number;
  symbol: string;
  usdValue?: number;
  lastUpdated: Date;
}

export interface TokenBalance extends BalanceData {
  tokenAddress: string;
  tokenName: string;
}

class BalanceService {
  private cache = new Map<string, BalanceData>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  /**
   * Get native token balance for an address on a specific chain
   * Uses AlphaWhale's configured RPC providers, not wallet RPC
   */
  async getNativeBalance(address: string, chainId: number): Promise<BalanceData | null> {
    const cacheKey = `${address}-${chainId}-native`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_TTL) {
      return cached;
    }

    try {
      const client = getClientForChain(chainId);
      if (!client) {
        console.warn(`No RPC client configured for chain ${chainId}`);
        return null;
      }

      console.log(`Fetching balance for ${address} on chain ${chainId} via AlphaWhale RPC`);
      
      const balance = await client.getBalance({
        address: address as `0x${string}`,
      });

      const balanceData: BalanceData = {
        address,
        chainId,
        balance,
        formattedBalance: formatEther(balance),
        decimals: 18,
        symbol: this.getChainSymbol(chainId),
        lastUpdated: new Date(),
      };

      // Cache the result
      this.cache.set(cacheKey, balanceData);
      
      console.log(`Balance fetched: ${balanceData.formattedBalance} ${balanceData.symbol}`);
      return balanceData;
    } catch (error) {
      console.error(`Error fetching balance for ${address} on chain ${chainId}:`, error);
      return null;
    }
  }

  /**
   * Get balances for multiple addresses across multiple chains
   */
  async getMultiChainBalances(
    addresses: string[], 
    chainIds: number[] = [1, 137, 42161, 10, 8453]
  ): Promise<BalanceData[]> {
    const balances: BalanceData[] = [];
    
    for (const address of addresses) {
      for (const chainId of chainIds) {
        const balance = await this.getNativeBalance(address, chainId);
        if (balance) {
          balances.push(balance);
        }
      }
    }
    
    return balances;
  }

  /**
   * Get USD value for balances using current prices
   */
  async enrichWithUSDValues(balances: BalanceData[]): Promise<BalanceData[]> {
    try {
      // Get current prices for all chains
      const prices = await this.fetchTokenPrices();
      
      return balances.map(balance => ({
        ...balance,
        usdValue: parseFloat(balance.formattedBalance) * (prices[balance.symbol.toLowerCase()] || 0),
      }));
    } catch (error) {
      console.error('Error fetching USD prices:', error);
      return balances;
    }
  }

  /**
   * Fetch current token prices from CoinGecko
   */
  private async fetchTokenPrices(): Promise<Record<string, number>> {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,matic-network,arbitrum,optimism,base&vs_currencies=usd'
      );
      
      const data = await response.json();
      
      return {
        eth: data.ethereum?.usd || 0,
        matic: data['matic-network']?.usd || 0,
        arb: data.arbitrum?.usd || 0,
        op: data.optimism?.usd || 0,
        base: data.base?.usd || 0,
      };
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return {};
    }
  }

  /**
   * Get native token symbol for chain
   */
  private getChainSymbol(chainId: number): string {
    const symbols: Record<number, string> = {
      1: 'ETH',      // Ethereum
      137: 'MATIC',  // Polygon
      42161: 'ETH',  // Arbitrum (uses ETH)
      10: 'ETH',     // Optimism (uses ETH)
      8453: 'ETH',   // Base (uses ETH)
    };
    
    return symbols[chainId] || 'ETH';
  }

  /**
   * Clear cache for specific address or all
   */
  clearCache(address?: string) {
    if (address) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(address)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

export const balanceService = new BalanceService();