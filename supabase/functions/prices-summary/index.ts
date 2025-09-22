import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PriceSummary {
  symbol: string;
  price: number;
  pct_1h: number;
  pct_24h: number;
  ts: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now();
  
  try {
    const url = new URL(req.url);
    const symbols = url.searchParams.get('symbols')?.split(',') || ['BTC', 'ETH'];
    
    // Fetch from CoinGecko
    const coinGeckoIds = symbols.map(s => {
      switch(s.toUpperCase()) {
        case 'BTC': return 'bitcoin';
        case 'ETH': return 'ethereum';
        case 'SOL': return 'solana';
        case 'MATIC': return 'matic-network';
        default: return s.toLowerCase();
      }
    }).join(',');
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoIds}&vs_currencies=usd&include_24hr_change=true&include_1h_change=true`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const now = new Date().toISOString();
    
    const summary: PriceSummary[] = symbols.map(symbol => {
      const coinId = symbol.toLowerCase() === 'btc' ? 'bitcoin' : 
                     symbol.toLowerCase() === 'eth' ? 'ethereum' :
                     symbol.toLowerCase() === 'sol' ? 'solana' :
                     symbol.toLowerCase() === 'matic' ? 'matic-network' :
                     symbol.toLowerCase();
      
      const coinData = data[coinId];
      
      return {
        symbol: symbol.toUpperCase(),
        price: coinData?.usd || 0,
        pct_1h: coinData?.usd_1h_change || 0,
        pct_24h: coinData?.usd_24h_change || 0,
        ts: now
      };
    });
    
    const latencyMs = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        success: true,
        data: summary,
        meta: {
          symbols: symbols.length,
          cached: false,
          refreshed_at: now
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'MISS',
          'X-Latency-Ms': latencyMs.toString(),
          'X-Data-Age-Sec': '0'
        }
      }
    );

  } catch (error) {
    console.error('Prices summary error:', error);
    
    const latencyMs = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fallback: true,
        data: [
          { symbol: 'BTC', price: 43500, pct_1h: 0.5, pct_24h: 2.1, ts: new Date().toISOString() },
          { symbol: 'ETH', price: 2650, pct_1h: -0.2, pct_24h: 1.8, ts: new Date().toISOString() }
        ]
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'FALLBACK',
          'X-Latency-Ms': latencyMs.toString(),
          'X-Data-Age-Sec': '300'
        }
      }
    );
  }
})