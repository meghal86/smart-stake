import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get live whale classifications from database
    const { data: classifications, error: classError } = await supabaseClient
      .from('whale_classifications')
      .select('*')
      .order('risk_score', { ascending: false })
      .limit(50)

    if (classError) throw classError

    // Get active signals
    const { data: signals, error: signalsError } = await supabaseClient
      .from('whale_signals')
      .select('*')
      .eq('is_active', true)
      .order('triggered_at', { ascending: false })

    if (signalsError) throw signalsError

    // Get whale transaction data separately
    const { data: transactions } = await supabaseClient
      .from('whale_transactions')
      .select('*')
      .limit(50)

    // Transform data for frontend
    const whales = classifications?.map(whale => {
      const whaleTransactions = transactions?.find(t => t.address === whale.address);
      return {
        id: whale.id,
        address: whale.address,
        balance: `${whaleTransactions?.balance || 0} ETH`,
        type: whale.type,
        riskScore: whale.risk_score,
        activity: {
          volume24h: calculateVolume24h(whaleTransactions?.transactions || []),
          transactions24h: calculateTx24h(whaleTransactions?.transactions || []),
          lastActive: whaleTransactions?.last_updated || whale.last_updated
        },
        signals: whale.signals || [],
        confidence: whale.confidence
      };
    }) || []

    // Calculate market signals
    const marketSignals = {
      highRisk: classifications?.filter(w => w.risk_score >= 7).length || 0,
      clustering: signals?.filter(s => s.signal_type === 'clustering').length || 0,
      accumulation: classifications?.filter(w => w.type === 'hodler' && w.signals?.includes('Accumulation Phase')).length || 0
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        whales,
        marketSignals,
        totalWhales: classifications?.length || 0,
        lastUpdated: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Whale analytics error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        whales: [],
        marketSignals: { highRisk: 0, clustering: 0, accumulation: 0 }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})

function calculateVolume24h(transactions: any[]): string {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  
  const volume = transactions
    .filter(tx => now - tx.timestamp < dayMs)
    .reduce((sum, tx) => sum + parseFloat(tx.value || '0'), 0)
  
  return volume > 1000000 ? `$${(volume / 1000000).toFixed(1)}M` : `$${(volume / 1000).toFixed(0)}K`
}

function calculateTx24h(transactions: any[]): number {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  
  return transactions.filter(tx => now - tx.timestamp < dayMs).length
}