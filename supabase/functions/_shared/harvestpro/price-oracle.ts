/**
 * Price Oracle Integration with Failover Chain (Deno/Edge Functions)
 * HarvestPro Tax-Loss Harvesting Module
 * 
 * Implements a robust price fetching system with:
 * - Primary: CoinGecko Free Public API (no key required)
 * - Fallback: CoinMarketCap API (optional, requires key)
 * - Final fallback: Internal cache
 * - 1 minute TTL caching
 * 
 * Note: CoinGecko free API has rate limits (10-50 calls/min)
 * For production, consider CoinMarketCap fallback or caching strategy
 * 
 * Migrated from src/lib/harvestpro/price-oracle.ts for Deno runtime
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PriceOracleConfig {
  coinGeckoApiKey?: string;
  coinMarketCapApiKey?: string;
  cacheTTL?: number; // milliseconds
}

export interface PriceData {
  price: number;
  timestamp: number;
  source: 'coingecko' | 'coinmarketcap' | 'cache';
}

export interface CachedPrice {
  price: number;
  timestamp: number;
  source: string;
}

// ============================================================================
// CACHE IMPLEMENTATION
// ============================================================================

class PriceCache {
  private cache: Map<string, CachedPrice> = new Map();
  private ttl: number;

  constructor(ttl: number = 60000) { // Default 1 minute
    this.ttl = ttl;
  }

  set(token: string, price: number, source: string): void {
    this.cache.set(token.toUpperCase(), {
      price,
      timestamp: Date.now(),
      source,
    });
  }

  get(token: string): CachedPrice | null {
    const cached = this.cache.get(token.toUpperCase());
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(token.toUpperCase());
      return null;
    }

    return cached;
  }

  has(token: string): boolean {
    return this.get(token) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// COINGECKO API CLIENT
// ============================================================================

class CoinGeckoClient {
  private apiKey?: string;
  private baseUrl = 'https://api.coingecko.com/api/v3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getPrice(token: string): Promise<number> {
    // Use free public API (no key required)
    const url = `${this.baseUrl}/simple/price?ids=${this.mapTokenToId(token)}&vs_currencies=usd`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const tokenId = this.mapTokenToId(token);
    
    if (!data[tokenId] || !data[tokenId].usd) {
      throw new Error(`Price not found for token: ${token}`);
    }

    return data[tokenId].usd;
  }

  async getPrices(tokens: string[]): Promise<Record<string, number>> {
    const ids = tokens.map(t => this.mapTokenToId(t)).join(',');
    // Use free public API (no key required)
    const url = `${this.baseUrl}/simple/price?ids=${ids}&vs_currencies=usd`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result: Record<string, number> = {};

    for (const token of tokens) {
      const tokenId = this.mapTokenToId(token);
      if (data[tokenId] && data[tokenId].usd) {
        result[token.toUpperCase()] = data[tokenId].usd;
      }
    }

    return result;
  }

  private mapTokenToId(token: string): string {
    // Map common token symbols to CoinGecko IDs
    const mapping: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'BNB': 'binancecoin',
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOGE': 'dogecoin',
      'MATIC': 'matic-network',
      'DOT': 'polkadot',
      'AVAX': 'avalanche-2',
      'UNI': 'uniswap',
      'LINK': 'chainlink',
      'ATOM': 'cosmos',
      'XRP': 'ripple',
    };

    return mapping[token.toUpperCase()] || token.toLowerCase();
  }
}

// ============================================================================
// COINMARKETCAP API CLIENT
// ============================================================================

class CoinMarketCapClient {
  private apiKey: string;
  private baseUrl = 'https://pro-api.coinmarketcap.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getPrice(token: string): Promise<number> {
    const url = `${this.baseUrl}/cryptocurrency/quotes/latest?symbol=${token.toUpperCase()}&convert=USD`;

    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': this.apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const tokenUpper = token.toUpperCase();
    
    if (!data.data || !data.data[tokenUpper] || !data.data[tokenUpper].quote || !data.data[tokenUpper].quote.USD) {
      throw new Error(`Price not found for token: ${token}`);
    }

    return data.data[tokenUpper].quote.USD.price;
  }

  async getPrices(tokens: string[]): Promise<Record<string, number>> {
    const symbols = tokens.map(t => t.toUpperCase()).join(',');
    const url = `${this.baseUrl}/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`;

    const response = await fetch(url, {
      headers: {
        'X-CMC_PRO_API_KEY': this.apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result: Record<string, number> = {};

    for (const token of tokens) {
      const tokenUpper = token.toUpperCase();
      if (data.data && data.data[tokenUpper] && data.data[tokenUpper].quote && data.data[tokenUpper].quote.USD) {
        result[tokenUpper] = data.data[tokenUpper].quote.USD.price;
      }
    }

    return result;
  }
}

// ============================================================================
// PRICE ORACLE WITH FAILOVER
// ============================================================================

export class PriceOracle {
  private coinGecko: CoinGeckoClient;
  private coinMarketCap?: CoinMarketCapClient;
  private cache: PriceCache;

  constructor(config: PriceOracleConfig = {}) {
    this.coinGecko = new CoinGeckoClient(config.coinGeckoApiKey);
    
    if (config.coinMarketCapApiKey) {
      this.coinMarketCap = new CoinMarketCapClient(config.coinMarketCapApiKey);
    }
    
    this.cache = new PriceCache(config.cacheTTL);
  }

  /**
   * Get price for a single token with failover chain
   */
  async getPrice(token: string): Promise<PriceData> {
    // Check cache first
    const cached = this.cache.get(token);
    if (cached) {
      return {
        price: cached.price,
        timestamp: cached.timestamp,
        source: 'cache',
      };
    }

    // Try CoinGecko (primary)
    try {
      const price = await this.coinGecko.getPrice(token);
      this.cache.set(token, price, 'coingecko');
      return {
        price,
        timestamp: Date.now(),
        source: 'coingecko',
      };
    } catch (error) {
      console.warn(`CoinGecko failed for ${token}:`, error);
    }

    // Try CoinMarketCap (fallback)
    if (this.coinMarketCap) {
      try {
        const price = await this.coinMarketCap.getPrice(token);
        this.cache.set(token, price, 'coinmarketcap');
        return {
          price,
          timestamp: Date.now(),
          source: 'coinmarketcap',
        };
      } catch (error) {
        console.warn(`CoinMarketCap failed for ${token}:`, error);
      }
    }

    // Final fallback: check cache even if expired
    const expiredCache = this.cache.get(token);
    if (expiredCache) {
      console.warn(`Using expired cache for ${token}`);
      return {
        price: expiredCache.price,
        timestamp: expiredCache.timestamp,
        source: 'cache',
      };
    }

    throw new Error(`Unable to fetch price for ${token} from any source`);
  }

  /**
   * Get prices for multiple tokens with failover chain
   */
  async getPrices(tokens: string[]): Promise<Record<string, PriceData>> {
    const result: Record<string, PriceData> = {};
    const tokensToFetch: string[] = [];

    // Check cache first
    for (const token of tokens) {
      const cached = this.cache.get(token);
      if (cached) {
        result[token.toUpperCase()] = {
          price: cached.price,
          timestamp: cached.timestamp,
          source: 'cache',
        };
      } else {
        tokensToFetch.push(token);
      }
    }

    if (tokensToFetch.length === 0) {
      return result;
    }

    // Try CoinGecko (primary)
    try {
      const prices = await this.coinGecko.getPrices(tokensToFetch);
      for (const [token, price] of Object.entries(prices)) {
        this.cache.set(token, price, 'coingecko');
        result[token] = {
          price,
          timestamp: Date.now(),
          source: 'coingecko',
        };
      }
      
      // Remove successfully fetched tokens
      const remaining = tokensToFetch.filter(t => !prices[t.toUpperCase()]);
      if (remaining.length === 0) {
        return result;
      }
    } catch (error) {
      console.warn('CoinGecko batch fetch failed:', error);
    }

    // Try CoinMarketCap for remaining tokens (fallback)
    const remaining = tokensToFetch.filter(t => !result[t.toUpperCase()]);
    if (this.coinMarketCap && remaining.length > 0) {
      try {
        const prices = await this.coinMarketCap.getPrices(remaining);
        for (const [token, price] of Object.entries(prices)) {
          this.cache.set(token, price, 'coinmarketcap');
          result[token] = {
            price,
            timestamp: Date.now(),
            source: 'coinmarketcap',
          };
        }
      } catch (error) {
        console.warn('CoinMarketCap batch fetch failed:', error);
      }
    }

    // For any remaining tokens, try individual fetches
    const stillMissing = tokensToFetch.filter(t => !result[t.toUpperCase()]);
    for (const token of stillMissing) {
      try {
        const priceData = await this.getPrice(token);
        result[token.toUpperCase()] = priceData;
      } catch (error) {
        console.error(`Failed to fetch price for ${token}:`, error);
      }
    }

    return result;
  }

  /**
   * Clear the price cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number } {
    return {
      size: this.cache.size(),
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE (Deno-compatible)
// ============================================================================

let priceOracleInstance: PriceOracle | null = null;

export function getPriceOracle(): PriceOracle {
  if (!priceOracleInstance) {
    priceOracleInstance = new PriceOracle({
      // CoinGecko API key is optional - free public API works without it
      coinGeckoApiKey: undefined,
      // CoinMarketCap is optional fallback (requires API key)
      coinMarketCapApiKey: Deno.env.get('COINMARKETCAP_API_KEY'),
      cacheTTL: 60000, // 1 minute
    });
  }
  return priceOracleInstance;
}
