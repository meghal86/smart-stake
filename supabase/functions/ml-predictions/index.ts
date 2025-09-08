import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: models } = await supabase
      .from('ml_models')
      .select('*')
      .eq('status', 'active')

    const { data: predictions } = await supabase
      .from('ml_predictions')
      .select(`
        *,
        ml_models(name, type)
      `)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    if (action === 'simulate') {
      const whaleCount = parseInt(url.searchParams.get('whaleCount') || '5')
      const sellAmount = parseInt(url.searchParams.get('sellAmount') || '1000')
      const timeframe = url.searchParams.get('timeframe') || '24h'
      
      const baseImpact = (whaleCount * sellAmount) / 10000
      const timeMultiplier = timeframe === '1h' ? 2 : timeframe === '6h' ? 1.5 : 1
      
      const simulation = {
        priceImpact: (baseImpact * timeMultiplier).toFixed(1),
        volumeSpike: Math.round(baseImpact * 50 + 100),
        recoveryHours: Math.round(baseImpact * 2 + 4)
      }
      
      return new Response(JSON.stringify(simulation), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ models, predictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})