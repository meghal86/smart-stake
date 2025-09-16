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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get whale data age
    const { data: latestBalance } = await supabase
      .from('whale_balances')
      .select('ingested_at')
      .order('ingested_at', { ascending: false })
      .limit(1)
      .single()

    const dataAge = latestBalance 
      ? Math.floor((Date.now() - new Date(latestBalance.ingested_at).getTime()) / 1000)
      : null

    // Get event throughput (events per second in last hour)
    const { count: eventCount } = await supabase
      .from('whale_transfers')
      .select('*', { count: 'exact', head: true })
      .gte('ingested_at', new Date(Date.now() - 3600000).toISOString())

    const throughput = eventCount ? Math.round(eventCount / 3600) : 0

    // Get DLQ queue lag
    const { count: queueLag } = await supabase
      .from('whale_dlq_events')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false)

    // Get latest block parsed
    const { data: latestBlock } = await supabase
      .from('whale_transfers')
      .select('block_number')
      .not('block_number', 'is', null)
      .order('block_number', { ascending: false })
      .limit(1)
      .single()

    // Mock provider status check
    const providers = {
      alchemy: { status: 'healthy', latency: 120 },
      moralis: { status: 'healthy', latency: 95 },
      infura: { status: 'degraded', latency: 340 }
    }

    const healthMetrics = {
      timestamp: new Date().toISOString(),
      status: queueLag && queueLag > 100 ? 'degraded' : 'healthy',
      metrics: {
        dataAge: dataAge,
        throughputPerSec: throughput,
        queueLag: queueLag || 0,
        latestBlock: latestBlock?.block_number || null
      },
      providers,
      system: {
        uptime: Math.floor(Math.random() * 86400),
        memory: Math.floor(Math.random() * 100),
        cpu: Math.floor(Math.random() * 50)
      }
    }

    console.log('Health check completed:', healthMetrics)

    return new Response(
      JSON.stringify(healthMetrics),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Health check failed:', error)

    // Log to DLQ on critical errors
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase
        .from('whale_dlq_events')
        .insert({
          payload: { 
            function: 'health',
            request_url: req.url,
            timestamp: new Date().toISOString()
          },
          error_message: error.message,
          retry_count: 0
        })
    } catch (dlqError) {
      console.error('Failed to log to DLQ:', dlqError)
    }

    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})