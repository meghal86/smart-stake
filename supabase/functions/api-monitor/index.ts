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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Test API endpoints and record metrics
    const metrics = await Promise.allSettled([
      testEtherscanAPI(),
      testCoinGeckoAPI(),
      testDatabaseHealth(supabaseClient)
    ])

    // Record metrics in database
    for (const [index, result] of metrics.entries()) {
      const apiSource = ['etherscan', 'coingecko', 'database'][index]
      const isSuccess = result.status === 'fulfilled'
      
      await supabaseClient
        .from('data_quality_metrics')
        .insert({
          api_source: apiSource,
          success_rate: isSuccess ? 100 : 0,
          avg_response_time: isSuccess ? result.value?.responseTime || 0 : 0,
          error_count: isSuccess ? 0 : 1,
          total_requests: 1
        })
    }

    // Get recent metrics for dashboard
    const { data: recentMetrics } = await supabaseClient
      .from('data_quality_metrics')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })

    return new Response(
      JSON.stringify({
        success: true,
        currentStatus: {
          etherscan: metrics[0].status === 'fulfilled' ? 'healthy' : 'down',
          coingecko: metrics[1].status === 'fulfilled' ? 'healthy' : 'down',
          database: metrics[2].status === 'fulfilled' ? 'healthy' : 'down'
        },
        metrics: recentMetrics?.slice(0, 100) || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('API monitor error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

async function testEtherscanAPI() {
  const start = Date.now()
  const response = await fetch(
    `https://api.etherscan.io/api?module=stats&action=ethprice&apikey=${Deno.env.get('ETHERSCAN_API_KEY')}`
  )
  const responseTime = Date.now() - start
  
  if (!response.ok) throw new Error('Etherscan API failed')
  
  const data = await response.json()
  if (data.status !== '1') throw new Error('Etherscan API error')
  
  return { responseTime }
}

async function testCoinGeckoAPI() {
  const start = Date.now()
  const response = await fetch('https://api.coingecko.com/api/v3/ping')
  const responseTime = Date.now() - start
  
  if (!response.ok) throw new Error('CoinGecko API failed')
  
  return { responseTime }
}

async function testDatabaseHealth(supabaseClient: any) {
  const start = Date.now()
  const { error } = await supabaseClient
    .from('alerts')
    .select('count')
    .limit(1)
  
  const responseTime = Date.now() - start
  
  if (error) throw new Error('Database health check failed')
  
  return { responseTime }
}