/**
 * Price Service - Fetches token prices with aggressive caching
 * to avoid CORS and rate limiting issues
 */

interface PriceCache {
  prices: Record<string, number>;
  timestamp: number;
}

// Fallback prices (updated manually or from last successful fetch)
const FALLBACK_PRICES: Record<string, number> = {
  eth: 2500,
  matic: 0.85,
  arb: 0.75,
  op: 1.8,
  base: 2500, // Base uses ETH
};

class PriceService {
  private cache: PriceCache | null = null;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private fetchPromise: Promise<Record<string, number>> | null = null;

  /**
   * Get current token prices with aggressive caching
   */
  async getPrices(): Promise<Record<string, number>> {
    // Return cached prices if still valid
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_TTL) {
      console.log('💰 Using cached prices');
      return this.cache.prices;
    }

    // If a fetch is already in progress, wait for it
    if (this.fetchPromise) {
      console.log('⏳ Waiting for existing price fetch...');
      return this.fetchPromise;
    }

    // Start new fetch
    this.fetchPromise = this.fetchPricesFromAPI();

    try {
      const prices = await this.fetchPromise;
      return prices;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Fetch prices from CoinGecko API
   */
  private async fetchPricesFromAPI(): Promise<Record<string, number>> {
    try {
      console.log('🌐 Fetching fresh prices from CoinGecko...');

      // Use a CORS proxy or direct call (will fail in browser due to CORS)
      // For production, you'd use a backend proxy
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,matic-network,arbitrum,optimism,base&vs_currencies=usd',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      const prices = {
        eth: data.ethereum?.usd || FALLBACK_PRICES.eth,
        matic: data['matic-network']?.usd || FALLBACK_PRICES.matic,
        arb: data.arbitrum?.usd || FALLBACK_PRICES.arb,
        op: data.optimism?.usd || FALLBACK_PRICES.op,
        base: data.base?.usd || FALLBACK_PRICES.base,
      };

      // Update cache
      this.cache = {
        prices,
        timestamp: Date.now(),
      };

      console.log('✅ Prices fetched successfully:', prices);
      return prices;
    } catch (error) {
      console.warn('⚠️ Failed to fetch prices, using fallback:', error);

      // Return cached prices if available (even if expired)
      if (this.cache) {
        console.log('📦 Using stale cached prices');
        return this.cache.prices;
      }

      // Return fallback prices as last resort
      console.log('🔄 Using hardcoded fallback prices');
      return FALLBACK_PRICES;
    }
  }

  /**
   * Get price for a specific token symbol
   */
  async getPrice(symbol: string): Promise<number> {
    const prices = await this.getPrices();
    return prices[symbol.toLowerCase()] || 0;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.cache = null;
    console.log('🗑️ Price cache cleared');
  }

  /**
   * Get cache info
   */
  getCacheInfo() {
    if (!this.cache) {
      return { cached: false, age: 0 };
    }

    const age = Date.now() - this.cache.timestamp;
    return {
      cached: true,
      age,
      ageMinutes: Math.floor(age / 60000),
      prices: this.cache.prices,
    };
  }
}

export const priceService = new PriceService();
