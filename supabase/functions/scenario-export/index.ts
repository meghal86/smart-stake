import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { enforceTier } from '../_lib/tierGuard.ts'

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
    );

    // Enforce Premium+ tier for exports
    const { userId, tier } = await enforceTier(supabase, 'export');

    const { scenarioId, format } = await req.json();

    // Get scenario data
    const { data: scenario, error } = await supabase
      .from('scenarios')
      .select('name, inputs, last_result')
      .eq('id', scenarioId)
      .eq('user_id', userId)
      .single();

    if (error || !scenario) {
      throw new Error('Scenario not found');
    }

    // Generate CSV export
    if (format === 'csv') {
      const csvData = [
        'Name,Asset,Direction,Whale Count,Transaction Size,Timeframe,Market Condition,Delta %,Confidence,Liquidity Impact,Volatility Risk,Model Version',
        [
          scenario.name,
          scenario.inputs.asset,
          scenario.inputs.direction,
          scenario.inputs.whaleCount,
          scenario.inputs.txnSize,
          scenario.inputs.timeframe,
          scenario.inputs.marketCondition,
          scenario.last_result?.deltaPct || 0,
          scenario.last_result?.confidence || 0,
          scenario.last_result?.liquidityImpact || 0,
          scenario.last_result?.volatilityRisk || 0,
          'scn-0.3.1'
        ].join(',')
      ].join('\n');

      return new Response(csvData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${scenario.name}.csv"`
        }
      });
    }

    throw new Error('Unsupported format');

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})