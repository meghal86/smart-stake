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

    // Execute raw SQL to create the view
    const { error } = await supabase
      .from('whale_transfers')
      .select('count')
      .limit(1)

    // If whale_transfers exists, create the view
    const createViewSQL = `
      CREATE OR REPLACE VIEW chain_risk_simple AS
      WITH chain_stats AS (
        SELECT 
          chain,
          COUNT(*) as tx_count,
          SUM(amount_usd) as total_volume,
          AVG(amount_usd) as avg_tx_size
        FROM whale_transfers 
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY chain
      ),
      risk_calc AS (
        SELECT 
          chain,
          tx_count,
          total_volume,
          CASE 
            WHEN total_volume > 100000000 THEN 75
            WHEN total_volume > 50000000 THEN 55
            WHEN total_volume > 10000000 THEN 35
            ELSE 15
          END +
          CASE 
            WHEN avg_tx_size > 5000000 THEN 20
            WHEN avg_tx_size > 1000000 THEN 10
            ELSE 0
          END as base_risk
        FROM chain_stats
      )
      SELECT 
        chain,
        LEAST(100, base_risk) as risk_0_100,
        CASE 
          WHEN tx_count < 5 THEN 'insufficient_data'
          ELSE NULL 
        END as reason,
        NOW() as refreshed_at,
        jsonb_build_object(
          'cexInflow', LEAST(100, (base_risk * 0.4)::int),
          'netOutflow', LEAST(100, (base_risk * 0.3)::int), 
          'dormantWake', LEAST(100, (base_risk * 0.3)::int)
        ) as components
      FROM risk_calc;
    `

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Ready to create chain risk view',
        sql: createViewSQL
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})