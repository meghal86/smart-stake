import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

class FeatureEngineeringService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async computeFeatures(asset: string = 'ETH') {
    const features = await Promise.all([
      this.computeWhaleVolume(asset),
      this.computeAccumulationPattern(asset),
      this.computeTimeClustering(asset),
      this.computeMarketSentiment(asset),
      this.computeTechnicalIndicators(asset)
    ]);

    const featureVector = {
      whale_volume: features[0],
      accumulation_pattern: features[1],
      time_clustering: features[2],
      market_sentiment: features[3],
      technical_indicators: features[4]
    };

    await this.storeFeatures(asset, featureVector);
    return featureVector;
  }

  private async computeWhaleVolume(asset: string) {
    const { data: transactions } = await this.supabase
      .from('whale_transactions')
      .select('value_eth')
      .gte('timestamp', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .gte('value_eth', 50);

    const totalVolume = transactions?.reduce((sum, tx) => sum + tx.value_eth, 0) || 0;
    const normalizedScore = Math.min(totalVolume / 10000, 1); // Normalize to 0-1

    return { score: normalizedScore, threshold: 50 };
  }

  private async computeAccumulationPattern(asset: string) {
    const { data: transactions } = await this.supabase
      .from('whale_transactions')
      .select('value_eth, from_address, to_address')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Simple accumulation logic - more sophisticated in production
    const inflows = transactions?.filter(tx => this.isExchangeAddress(tx.from_address)).length || 0;
    const outflows = transactions?.filter(tx => this.isExchangeAddress(tx.to_address)).length || 0;
    
    const ratio = inflows > 0 ? (inflows - outflows) / inflows : 0.5;
    const score = Math.max(0, Math.min(1, (ratio + 1) / 2));

    return { score, window: '24h' };
  }

  private async computeTimeClustering(asset: string) {
    const { data: transactions } = await this.supabase
      .from('whale_transactions')
      .select('timestamp')
      .gte('timestamp', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });

    if (!transactions || transactions.length < 2) {
      return { score: 0.5, burst_detection: false };
    }

    // Detect clustering by analyzing time gaps
    const gaps = [];
    for (let i = 1; i < transactions.length; i++) {
      const gap = new Date(transactions[i].timestamp).getTime() - new Date(transactions[i-1].timestamp).getTime();
      gaps.push(gap);
    }

    const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const shortGaps = gaps.filter(gap => gap < avgGap * 0.5).length;
    const clusteringScore = shortGaps / gaps.length;

    return { 
      score: clusteringScore, 
      burst_detection: clusteringScore > 0.3 
    };
  }

  private async computeMarketSentiment(asset: string) {
    // Fetch sentiment from CoinGecko or other sources
    try {
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true`);
      const data = await response.json();
      
      const priceChange = data.ethereum?.usd_24h_change || 0;
      const sentimentScore = Math.max(0, Math.min(1, (priceChange + 10) / 20)); // Normalize -10% to +10%

      return { 
        score: sentimentScore, 
        sources: ['coingecko'] 
      };
    } catch (error) {
      return { score: 0.5, sources: [] };
    }
  }

  private async computeTechnicalIndicators(asset: string) {
    // Simplified technical indicators
    const rsi = 0.6 + Math.random() * 0.3; // Mock RSI
    const ema = 0.5 + Math.random() * 0.4; // Mock EMA signal
    
    const score = (rsi + ema) / 2;
    return { 
      score, 
      indicators: ['rsi', 'ema'] 
    };
  }

  private isExchangeAddress(address: string): boolean {
    const exchangeAddresses = [
      '0x28c6c06298d514db089934071355e5743bf21d60', // Binance
      '0x21a31ee1afc51d94c2efccaa2092ad1028285549', // Binance 2
      '0x564286362092d8e7936f0549571a803b203aaced'  // Binance 3
    ];
    return exchangeAddresses.includes(address.toLowerCase());
  }

  private async storeFeatures(asset: string, features: any) {
    const windowStart = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const windowEnd = new Date();

    for (const [featureName, featureData] of Object.entries(features)) {
      await this.supabase
        .from('feature_store')
        .upsert({
          asset,
          chain: 'ethereum',
          feature_name: featureName,
          feature_value: (featureData as any).score,
          window_start: windowStart.toISOString(),
          window_end: windowEnd.toISOString()
        }, { onConflict: 'asset,chain,feature_name,window_start' });
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { asset = 'ETH' } = await req.json().catch(() => ({}));
    
    const service = new FeatureEngineeringService();
    const features = await service.computeFeatures(asset);

    return new Response(JSON.stringify({ 
      success: true, 
      features,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})