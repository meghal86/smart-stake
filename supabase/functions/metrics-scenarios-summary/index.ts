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
    );

    const today = new Date().toISOString().split('T')[0];

    // Get latest metrics for active models
    const { data: latestMetrics } = await supabase
      .from('model_daily_metrics')
      .select('*')
      .eq('day', today)
      .order('model_version');

    // Get today's run count
    const { count: runsToday } = await supabase
      .from('scenario_runs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0]);

    // Aggregate metrics across all active models
    let totalHitRate7d = 0;
    let totalHitRate30d = 0;
    let totalHitRate90d = 0;
    let totalConfidence = 0;
    let modelCount = 0;

    if (latestMetrics?.length) {
      for (const metric of latestMetrics) {
        totalHitRate7d += metric.hit_rate_7d || 0;
        totalHitRate30d += metric.hit_rate_30d || 0;
        totalHitRate90d += metric.hit_rate_90d || 0;
        totalConfidence += metric.avg_confidence || 0;
        modelCount++;
      }
    }

    const summary = {
      accuracy_7d: modelCount > 0 ? (totalHitRate7d / modelCount * 100).toFixed(1) : '0.0',
      accuracy_30d: modelCount > 0 ? (totalHitRate30d / modelCount * 100).toFixed(1) : '0.0',
      accuracy_90d: modelCount > 0 ? (totalHitRate90d / modelCount * 100).toFixed(1) : '0.0',
      avg_confidence: modelCount > 0 ? (totalConfidence / modelCount * 100).toFixed(1) : '0.0',
      runs_today: runsToday || 0,
      last_updated: new Date().toISOString()
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Metrics summary failed:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch metrics',
      accuracy_7d: '0.0',
      accuracy_30d: '0.0', 
      accuracy_90d: '0.0',
      avg_confidence: '0.0',
      runs_today: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})