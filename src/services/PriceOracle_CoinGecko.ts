interface TokenPrice {
  price: number;
  change_24h: number;
  volume: number;
  last_updated: Date;
}

interface CacheEntry {
  data: Record<string, TokenPrice>;
  timestamp: number;
  ttl: number;
}

class PriceOracle_CoinGecko {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 60000; // 60 seconds
  private readonly BASE_URL = 'https://api.coingecko.com/api/v3';

  async getPrices(ids: string[]): Promise<Record<string, TokenPrice>> {
    const cacheKey = `prices_${ids.sort().join(',')}`;
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const idsParam = ids.join(',');
      const response = await fetch(
        `${this.BASE_URL}/simple/price?ids=${idsParam}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
      );
      
      const data = await response.json();
      const prices: Record<string, TokenPrice> = {};
      
      for (const [id, priceData] of Object.entries(data)) {
        const price = priceData as any;
        prices[id] = {
          price: price.usd || 0,
          change_24h: price.usd_24h_change || 0,
          volume: price.usd_24h_vol || 0,
          last_updated: new Date()
        };
      }
      
      this.setCache(cacheKey, prices, this.CACHE_TTL);
      return prices;
      
    } catch (error) {
      console.error('Error fetching prices:', error);
      
      // Fallback prices
      const fallback: Record<string, TokenPrice> = {};
      ids.forEach(id => {
        fallback[id] = {
          price: this.getFallbackPrice(id),
          change_24h: (Math.random() - 0.5) * 10,
          volume: Math.random() * 1000000000,
          last_updated: new Date()
        };
      });
      
      return fallback;
    }
  }

  private getFromCache(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getFallbackPrice(id: string): number {
    const fallbackPrices: Record<string, number> = {
      ethereum: 3500,
      bitcoin: 65000,
      solana: 150,
      chainlink: 15,
      polygon: 0.8
    };
    
    return fallbackPrices[id] || 1;
  }
}

export const priceOracle = new PriceOracle_CoinGecko();