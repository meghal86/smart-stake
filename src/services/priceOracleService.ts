/**
 * Price Oracle Service
 * 
 * Provides real-time cryptocurrency price data from multiple sources.
 * Implements fallback strategy: CoinGecko (primary) → CoinMarketCap (fallback) → Cache
 * 
 * Requirements: Real-time portfolio valuation
 */

interface TokenPrice {
  symbol: string;
  address?: string;
  priceUsd: number;
  priceChange24h: number;
  lastUpdated: Date;
  source: 'coingecko' | 'coinmarketcap' | 'cache';
}

interface PriceCache {
  [key: string]: {
    price: TokenPrice;
    expiresAt: number;
  };
}

class PriceOracleService {
  private cache: PriceCache = {};
  private readonly CACHE_TTL_MS = 60_000; // 1 minute cache
  private readonly REQUEST_TIMEOUT_MS = 5_000; // 5 second timeout

  /**
   * Get price for a single token
   */
  async getTokenPrice(symbol: string, address?: string): Promise<TokenPrice | null> {
    const cacheKey = address || symbol.toLowerCase();
    
    // Check cache first
    const cached = this.getCachedPrice(cacheKey);
    if (cached) {
      console.log(`💰 [PriceOracle] Cache hit for ${symbol}`);
      return cached;
    }

    // Try CoinGecko first
    try {
      const price = await this.fetchFromCoinGecko(symbol, address);
      if (price) {
        this.setCachedPrice(cacheKey, price);
        return price;
      }
    } catch (error) {
      console.warn(`⚠️ [PriceOracle] CoinGecko failed for ${symbol}:`, error);
    }

    // Fallback to CoinMarketCap
    try {
      const price = await this.fetchFromCoinMarketCap(symbol);
      if (price) {
        this.setCachedPrice(cacheKey, price);
        return price;
      }
    } catch (error) {
      console.warn(`⚠️ [PriceOracle] CoinMarketCap failed for ${symbol}:`, error);
    }

    console.error(`❌ [PriceOracle] All price sources failed for ${symbol}`);
    return null;
  }

  /**
   * Get prices for multiple tokens in batch
   */
  async getTokenPrices(tokens: Array<{ symbol: string; address?: string }>): Promise<Map<string, TokenPrice>> {
    const results = new Map<string, TokenPrice>();
    
    // Process in parallel with Promise.allSettled to handle failures gracefully
    const promises = tokens.map(async (token) => {
      const price = await this.getTokenPrice(token.symbol, token.address);
      if (price) {
        results.set(token.address || token.symbol.toLowerCase(), price);
      }
    });

    await Promise.allSettled(promises);
    
    console.log(`💰 [PriceOracle] Fetched ${results.size}/${tokens.length} prices`);
    return results;
  }

  /**
   * Fetch price from CoinGecko API
   */
  private async fetchFromCoinGecko(symbol: string, address?: string): Promise<TokenPrice | null> {
    const apiKey = process.env.COINGECKO_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ [PriceOracle] CoinGecko API key not configured');
      return null;
    }

    try {
      // Map common symbols to CoinGecko IDs
      const coinId = this.getCoinGeckoId(symbol);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
        {
          headers: {
            'x-cg-pro-api-key': apiKey,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data[coinId]) {
        return null;
      }

      console.log(`✅ [PriceOracle] CoinGecko price for ${symbol}: $${data[coinId].usd}`);

      return {
        symbol: symbol.toUpperCase(),
        address,
        priceUsd: data[coinId].usd,
        priceChange24h: data[coinId].usd_24h_change || 0,
        lastUpdated: new Date(),
        source: 'coingecko',
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`❌ [PriceOracle] CoinGecko request timeout for ${symbol}`);
      }
      throw error;
    }
  }

  /**
   * Fetch price from CoinMarketCap API
   */
  private async fetchFromCoinMarketCap(symbol: string): Promise<TokenPrice | null> {
    const apiKey = process.env.COINMARKETCAP_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ [PriceOracle] CoinMarketCap API key not configured');
      return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);

      const response = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol.toUpperCase()}`,
        {
          headers: {
            'X-CMC_PRO_API_KEY': apiKey,
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CoinMarketCap API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data[symbol.toUpperCase()]) {
        return null;
      }

      const tokenData = data.data[symbol.toUpperCase()];
      const quote = tokenData.quote.USD;

      console.log(`✅ [PriceOracle] CoinMarketCap price for ${symbol}: $${quote.price}`);

      return {
        symbol: symbol.toUpperCase(),
        priceUsd: quote.price,
        priceChange24h: quote.percent_change_24h || 0,
        lastUpdated: new Date(),
        source: 'coinmarketcap',
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`❌ [PriceOracle] CoinMarketCap request timeout for ${symbol}`);
      }
      throw error;
    }
  }

  /**
   * Get cached price if still valid
   */
  private getCachedPrice(key: string): TokenPrice | null {
    const cached = this.cache[key];
    
    if (!cached) {
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      delete this.cache[key];
      return null;
    }

    return {
      ...cached.price,
      source: 'cache' as const,
    };
  }

  /**
   * Cache price with TTL
   */
  private setCachedPrice(key: string, price: TokenPrice): void {
    this.cache[key] = {
      price,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    };
  }

  /**
   * Map common token symbols to CoinGecko IDs
   */
  private getCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'ETH': 'ethereum',
      'BTC': 'bitcoin',
      'WBTC': 'wrapped-bitcoin',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'DAI': 'dai',
      'WETH': 'weth',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'SOL': 'solana',
      'BNB': 'binancecoin',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AAVE': 'aave',
      'CRV': 'curve-dao-token',
      'SUSHI': 'sushi',
      'COMP': 'compound-governance-token',
      'MKR': 'maker',
      'SNX': 'synthetix-network-token',
      'YFI': 'yearn-finance',
      'BAL': 'balancer',
      '1INCH': '1inch',
      'LDO': 'lido-dao',
      'RPL': 'rocket-pool',
      'FXS': 'frax-share',
      'CVX': 'convex-finance',
    };

    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  /**
   * Clear all cached prices
   */
  clearCache(): void {
    this.cache = {};
    console.log('🗑️ [PriceOracle] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    const keys = Object.keys(this.cache);
    return {
      size: keys.length,
      keys,
    };
  }
}

export const priceOracleService = new PriceOracleService();
export type { TokenPrice };
