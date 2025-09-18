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
    const { address } = await req.json()
    
    if (!address) {
      return new Response(JSON.stringify({ error: 'Address required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Calculate risk score based on blockchain data
    const riskFactors = await calculateRiskFactors(address)
    const riskScore = calculateOverallRisk(riskFactors)
    const riskLevel = getRiskLevel(riskScore)

    // Store in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabase
      .from('risk_scores')
      .upsert({
        address,
        risk_score: riskScore,
        risk_level: riskLevel,
        factors: riskFactors,
        last_updated: new Date().toISOString()
      })

    if (error) throw error

    return new Response(JSON.stringify({
      address,
      risk_score: riskScore,
      risk_level: riskLevel,
      factors: riskFactors
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function calculateRiskFactors(address: string) {
  const factors = {
    balance_risk: 0,
    exchange_interaction: 0,
    transaction_count: 0,
    address_age: 0
  }

  try {
    // Get balance using Alchemy API
    const alchemyKey = Deno.env.get('ALCHEMY_API_KEY')
    if (alchemyKey) {
      const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [address, 'latest'],
          id: 1
        })
      })
      
      const data = await response.json()
      if (data.result) {
        const balance = parseInt(data.result, 16) / 1e18
        factors.balance_risk = balance > 1000 ? 20 : balance > 100 ? 10 : 5
      }
    }

    // Check known exchange addresses
    const exchanges = ['0x28c6c06298d514db089934071355e5743bf21d60']
    factors.exchange_interaction = exchanges.includes(address.toLowerCase()) ? 30 : 0

    // Simulate other factors
    factors.transaction_count = Math.floor(Math.random() * 20)
    factors.address_age = Math.floor(Math.random() * 15)

  } catch (error) {
    console.error('Risk calculation error:', error)
  }

  return factors
}

function calculateOverallRisk(factors: any): number {
  return Math.min(
    factors.balance_risk + 
    factors.exchange_interaction + 
    factors.transaction_count + 
    factors.address_age, 
    100
  )
}

function getRiskLevel(score: number): string {
  if (score >= 70) return 'high'
  if (score >= 40) return 'medium'
  return 'low'
}