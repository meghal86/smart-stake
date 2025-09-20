import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PriceResponse {
  timestamp: string;
  provider: 'coingecko' | 'cmc' | 'stale';
  quality: 'ok' | 'degraded' | 'stale';
  assets: Record<string, { price_usd: number }>;
}

interface CircuitBreaker {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

class PriceService {
  private supabase: any;
  private memoryCache = new Map<string, { price: number; provider: string; timestamp: number }>();
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();
  
  private symbolMap = {
    'ETH': 'ethereum',
    'BTC': 'bitcoin'
  };

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Initialize circuit breakers
    this.circuitBreakers.set('coingecko', { failures: 0, lastFailure: 0, isOpen: false });
    this.circuitBreakers.set('cmc', { failures: 0, lastFailure: 0, isOpen: false });
    
    // Initialize token buckets (10 tokens per minute)
    this.tokenBuckets.set('coingecko', { tokens: 10, lastRefill: Date.now() });
    this.tokenBuckets.set('cmc', { tokens: 10, lastRefill: Date.now() });
  }

  async getPrices(assets: string[]): Promise<PriceResponse> {
    const result: PriceResponse = {
      timestamp: new Date().toISOString(),
      provider: 'coingecko',
      quality: 'ok',
      assets: {}
    };

    // Try memory cache first
    const cachedPrices = this.getFromMemoryCache(assets);
    if (cachedPrices.length === assets.length) {
      result.assets = Object.fromEntries(cachedPrices.map(p => [p.asset, { price_usd: p.price }]));
      result.provider = cachedPrices[0].provider as any;
      return result;
    }

    // Try database cache
    const dbPrices = await this.getFromDbCache(assets);
    if (dbPrices.length === assets.length) {
      // Warm memory cache
      dbPrices.forEach(p => {
        this.memoryCache.set(p.asset, {
          price: p.price,
          provider: p.provider,
          timestamp: Date.now()
        });
      });
      
      result.assets = Object.fromEntries(dbPrices.map(p => [p.asset, { price_usd: p.price }]));
      result.provider = dbPrices[0].provider as any;
      return result;
    }

    // Try CoinGecko
    try {
      if (!this.isCircuitBreakerOpen('coingecko') && this.hasTokens('coingecko')) {
        const prices = await this.fetchFromCoinGecko(assets);
        await this.storePrices(prices, 'coingecko');
        this.recordSuccess('coingecko');
        
        result.assets = Object.fromEntries(prices.map(p => [p.asset, { price_usd: p.price }]));
        result.provider = 'coingecko';
        return result;
      }
    } catch (error) {
      console.error('CoinGecko failed:', error);
      this.recordFailure('coingecko');
    }

    // Try CoinMarketCap fallback
    try {
      if (!this.isCircuitBreakerOpen('cmc') && this.hasTokens('cmc') && await this.checkCmcDailyQuota()) {
        const prices = await this.fetchFromCoinMarketCap(assets);
        await this.storePrices(prices, 'cmc');
        this.recordSuccess('cmc');
        
        result.assets = Object.fromEntries(prices.map(p => [p.asset, { price_usd: p.price }]));
        result.provider = 'cmc';
        result.quality = 'degraded';
        return result;
      }
    } catch (error) {
      console.error('CoinMarketCap failed:', error);
      this.recordFailure('cmc');
    }

    // Return stale cache if available (up to 2 minutes old)
    const stalePrices = await this.getStaleCache(assets);
    if (stalePrices.length > 0) {
      result.assets = Object.fromEntries(stalePrices.map(p => [p.asset, { price_usd: p.price }]));
      result.provider = 'stale';
      result.quality = 'stale';
      return result;
    }

    throw new Error('No price data available');
  }

  private getFromMemoryCache(assets: string[]) {
    const results = [];
    const now = Date.now();
    const ttl = 15000; // 15 seconds

    for (const asset of assets) {
      const cached = this.memoryCache.get(asset);
      if (cached && (now - cached.timestamp) < ttl) {
        results.push({ asset, price: cached.price, provider: cached.provider });
      }
    }

    return results;
  }

  private async getFromDbCache(assets: string[]) {
    const { data } = await this.supabase
      .from('price_cache')
      .select('asset, price_usd, provider, fetched_at')
      .in('asset', assets)
      .gte('fetched_at', new Date(Date.now() - 15000).toISOString())
      .order('fetched_at', { ascending: false });

    return data?.map((row: any) => ({
      asset: row.asset,
      price: parseFloat(row.price_usd),
      provider: row.provider
    })) || [];
  }

  private async getStaleCache(assets: string[]) {
    const { data } = await this.supabase
      .from('price_cache')
      .select('asset, price_usd, provider')
      .in('asset', assets)
      .gte('fetched_at', new Date(Date.now() - 120000).toISOString()) // 2 minutes
      .order('fetched_at', { ascending: false });

    return data?.map((row: any) => ({
      asset: row.asset,
      price: parseFloat(row.price_usd),
      provider: row.provider
    })) || [];
  }

  private async fetchFromCoinGecko(assets: string[]) {
    const ids = assets.map(asset => this.symbolMap[asset as keyof typeof this.symbolMap]).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
    
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(1500),
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
    
    const data = await response.json();
    this.consumeToken('coingecko');
    
    return assets.map(asset => ({
      asset,
      price: data[this.symbolMap[asset as keyof typeof this.symbolMap]]?.usd || 0
    }));
  }

  private async fetchFromCoinMarketCap(assets: string[]) {
    const symbols = assets.join(',');
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`;
    
    const response = await fetch(url, {
      signal: AbortSignal.timeout(1500),
      headers: {
        'X-CMC_PRO_API_KEY': Deno.env.get('CMC_API_KEY') ?? '',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`CoinMarketCap API error: ${response.status}`);
    
    const data = await response.json();
    this.consumeToken('cmc');
    await this.incrementCmcUsage();
    
    return assets.map(asset => ({
      asset,
      price: data.data[asset]?.quote?.USD?.price || 0
    }));
  }

  private async storePrices(prices: Array<{asset: string, price: number}>, provider: string) {
    // Store in memory cache
    prices.forEach(p => {
      this.memoryCache.set(p.asset, {
        price: p.price,
        provider,
        timestamp: Date.now()
      });
    });

    // Store in database
    const records = prices.map(p => ({
      asset: p.asset,
      price_usd: p.price,
      provider,
      ttl_seconds: 15
    }));

    await this.supabase.from('price_cache').insert(records);
  }

  private hasTokens(provider: string): boolean {
    const bucket = this.tokenBuckets.get(provider);
    if (!bucket) return false;

    // Refill tokens (10 per minute)
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(elapsed / 6000); // 6 seconds per token

    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(10, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }

    return bucket.tokens > 0;
  }

  private consumeToken(provider: string) {
    const bucket = this.tokenBuckets.get(provider);
    if (bucket && bucket.tokens > 0) {
      bucket.tokens--;
    }
  }

  private isCircuitBreakerOpen(provider: string): boolean {
    const breaker = this.circuitBreakers.get(provider);
    if (!breaker) return false;

    if (breaker.isOpen) {
      // Reset after 60 seconds
      if (Date.now() - breaker.lastFailure > 60000) {
        breaker.isOpen = false;
        breaker.failures = 0;
      }
    }

    return breaker.isOpen;
  }

  private recordFailure(provider: string) {
    const breaker = this.circuitBreakers.get(provider);
    if (breaker) {
      breaker.failures++;
      breaker.lastFailure = Date.now();
      
      if (breaker.failures >= 3) {
        breaker.isOpen = true;
      }
    }
  }

  private recordSuccess(provider: string) {
    const breaker = this.circuitBreakers.get(provider);
    if (breaker) {
      breaker.failures = 0;
      breaker.isOpen = false;
    }
  }

  private async checkCmcDailyQuota(): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data } = await this.supabase
      .from('provider_usage')
      .select('calls')
      .eq('provider', 'cmc')
      .eq('day_window', today)
      .single();

    const dailyUsage = data?.calls || 0;
    return dailyUsage < 320; // Conservative limit (333 - buffer)
  }

  private async incrementCmcUsage() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const minute = new Date(Math.floor(now.getTime() / 60000) * 60000).toISOString();

    await this.supabase
      .from('provider_usage')
      .upsert({
        provider: 'cmc',
        minute_window: minute,
        day_window: today,
        calls: 1
      }, {
        onConflict: 'provider,minute_window,day_window',
        ignoreDuplicates: false
      });
  }

  async getHealth() {
    const cgBreaker = this.circuitBreakers.get('coingecko');
    const cmcBreaker = this.circuitBreakers.get('cmc');
    const cgBucket = this.tokenBuckets.get('coingecko');
    const cmcBucket = this.tokenBuckets.get('cmc');

    const today = new Date().toISOString().split('T')[0];
    const { data: cmcUsage } = await this.supabase
      .from('provider_usage')
      .select('calls')
      .eq('provider', 'cmc')
      .eq('day_window', today)
      .single();

    return {
      coingecko: {
        breaker: cgBreaker?.isOpen ? 'open' : 'closed',
        minuteRemaining: cgBucket?.tokens || 0
      },
      cmc: {
        breaker: cmcBreaker?.isOpen ? 'open' : 'closed',
        minuteRemaining: cmcBucket?.tokens || 0,
        dayUsed: cmcUsage?.calls || 0,
        dayRemaining: 333 - (cmcUsage?.calls || 0)
      },
      cache: {
        memoryKeys: this.memoryCache.size,
        dbAgeSeconds: {} // Would need to query for each asset
      }
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url);
  const path = url.pathname;

  try {
    const service = new PriceService();

    if (path.endsWith('/health')) {
      const health = await service.getHealth();
      return new Response(JSON.stringify(health), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const assetsParam = url.searchParams.get('assets') || 'ETH,BTC';
    const assets = assetsParam.split(',').map(s => s.trim().toUpperCase());

    const result = await service.getPrices(assets);

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Provider': result.provider,
        'X-Cache': 'hit', // Simplified for now
        'X-Quality': result.quality
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})