import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhaleTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  gasUsed: string;
  gasPrice: string;
}

interface WhaleClassification {
  address: string;
  type: 'trader' | 'hodler' | 'liquidity_provider';
  confidence: number;
  signals: string[];
  riskScore: number;
  lastUpdated: string;
}

class WhaleClassificationEngine {
  private readonly TRADER_VOLUME_THRESHOLD = 1000000; // $1M
  private readonly HODLER_ACTIVITY_THRESHOLD = 2; // 2 tx/day
  private readonly HIGH_RISK_THRESHOLD = 7;

  classifyWhale(transactions: WhaleTransaction[], balance: number): WhaleClassification {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const recentTxs = transactions.filter(tx => now - tx.timestamp < 30 * dayMs);
    
    // Calculate metrics
    const dailyTxCount = recentTxs.length / 30;
    const totalVolume = recentTxs.reduce((sum, tx) => sum + parseFloat(tx.value), 0);
    const avgTxSize = totalVolume / recentTxs.length || 0;
    const uniqueCounterparties = new Set(recentTxs.flatMap(tx => [tx.from, tx.to])).size;
    
    // Classification logic
    let type: 'trader' | 'hodler' | 'liquidity_provider' = 'hodler';
    let confidence = 0.5;
    let signals: string[] = [];
    let riskScore = 5;

    // Trader classification
    if (totalVolume > this.TRADER_VOLUME_THRESHOLD && dailyTxCount > 5) {
      type = 'trader';
      confidence = 0.8;
      signals.push('High Volume Trading');
      riskScore = Math.min(10, 6 + Math.floor(dailyTxCount / 10));
    }
    
    // Hodler classification
    else if (dailyTxCount < this.HODLER_ACTIVITY_THRESHOLD && balance > 1000) {
      type = 'hodler';
      confidence = 0.9;
      signals.push('Low Activity Pattern');
      riskScore = Math.max(1, 5 - Math.floor(balance / 5000));
    }
    
    // LP classification
    else if (uniqueCounterparties > 10 && avgTxSize > 10000) {
      type = 'liquidity_provider';
      confidence = 0.7;
      signals.push('Multiple DEX Interactions');
      riskScore = 4 + Math.floor(uniqueCounterparties / 20);
    }

    // Risk signals
    if (dailyTxCount > 20) signals.push('ESCALATING');
    if (recentTxs.some(tx => parseFloat(tx.value) > 100000)) signals.push('Large Transaction Alert');
    if (riskScore >= this.HIGH_RISK_THRESHOLD) signals.push('HIGH_RISK');
    
    // New pattern detection
    const oldClassification = this.getPreviousClassification(transactions[0]?.from);
    if (oldClassification && oldClassification.type !== type) {
      signals.push('NEW');
    }

    return {
      address: transactions[0]?.from || '',
      type,
      confidence,
      signals,
      riskScore,
      lastUpdated: new Date().toISOString()
    };
  }

  private getPreviousClassification(address: string): WhaleClassification | null {
    // This would query the database for previous classification
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { address, transactions } = await req.json()
    
    if (!address || !transactions) {
      throw new Error('Address and transactions are required')
    }

    const engine = new WhaleClassificationEngine();
    const classification = engine.classifyWhale(transactions, 10000); // Mock balance

    // Store classification in database
    const { error } = await supabaseClient
      .from('whale_classifications')
      .upsert({
        address: classification.address,
        type: classification.type,
        confidence: classification.confidence,
        signals: classification.signals,
        risk_score: classification.riskScore,
        last_updated: classification.lastUpdated,
        created_at: new Date().toISOString()
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        classification 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})