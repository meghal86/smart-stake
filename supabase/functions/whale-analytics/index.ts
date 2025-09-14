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
    // Return hardcoded whale data for now
    const whales = [
      {
        id: 'whale-1',
        address: '0x47ac0F...a6D503',
        fullAddress: '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
        label: 'Whale 1',
        balance: 1250.5,
        type: 'investment',
        riskScore: 8.5,
        roi: 145,
        recentActivity: 45,
        chain: 'ethereum',
        activityData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 50) + 10),
        isWatched: false
      },
      {
        id: 'whale-2', 
        address: '0x8315177a...Ed4DBd7ed3a',
        fullAddress: '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a',
        label: 'Whale 2',
        balance: 890.2,
        type: 'trading',
        riskScore: 6.2,
        roi: 78,
        recentActivity: 78,
        chain: 'ethereum',
        activityData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 50) + 10),
        isWatched: false
      }
    ]
    
    return new Response(
      JSON.stringify({ 
        success: true,
        whales,
        marketSignals: { highRisk: 1, clustering: 0, accumulation: 1 },
        totalWhales: whales.length,
        lastUpdated: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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