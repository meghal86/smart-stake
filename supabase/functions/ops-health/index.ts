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
    // Use service role key for health checks (no user auth required)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const startTime = Date.now();

    // Fetch health metrics in parallel
    const [outcomesData, metricsData, cooldownsData] = await Promise.all([
      // Outcomes labeled in last hour
      supabase
        .from('scenario_outcomes')
        .select('correct')
        .gte('recorded_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()),
      
      // Model performance metrics
      supabase
        .from('model_daily_metrics')
        .select('hit_rate_7d, avg_confidence')
        .eq('day', new Date().toISOString().split('T')[0])
        .single(),
      
      // Active cooldowns
      supabase
        .from('alert_cooldowns')
        .select('asset')
        .gte('last_alert_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    ]);

    // Calculate health metrics
    const outcomesCount = outcomesData.data?.length || 0;
    const hitRate7d = metricsData.data?.hit_rate_7d || 0;
    const avgConfidence = metricsData.data?.avg_confidence || 0;
    const activeCooldowns = cooldownsData.data?.length || 0;

    // Determine overall status
    let status = 'healthy';
    if (hitRate7d < 0.6 || activeCooldowns > 3) {
      status = 'degraded';
    }
    if (outcomesCount === 0 && Date.now() > new Date().setHours(0, 0, 0, 0) + 2 * 60 * 60 * 1000) {
      status = 'down'; // No outcomes after 2 AM (when cron should run)
    }

    // Mock latency and cache data (would come from request_metrics in production)
    const mockLatency = Math.floor(Math.random() * 200) + 300;
    const mockCacheRate = Math.floor(Math.random() * 20) + 75;

    const healthResponse = {
      status,
      timestamp: new Date().toISOString(),
      slo_metrics: {
        hit_rate_7d: Math.round(hitRate7d * 100 * 100) / 100,
        p95_latency_ms: mockLatency,
        cache_hit_rate: mockCacheRate,
        outcomes_labeled_1h: outcomesCount
      },
      alerts: {
        active_cooldowns: activeCooldowns,
        storm_detected: activeCooldowns > 2,
        orphaned_predictions: 0 // Would query v_orphaned_predictions in production
      },
      uptime_seconds: Math.floor((Date.now() - startTime) / 1000)
    };

    return new Response(JSON.stringify(healthResponse), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return new Response(JSON.stringify({
      status: 'down',
      timestamp: new Date().toISOString(),
      error: error.message,
      slo_metrics: {
        hit_rate_7d: 0,
        p95_latency_ms: 0,
        cache_hit_rate: 0,
        outcomes_labeled_1h: 0
      },
      alerts: {
        active_cooldowns: 0,
        storm_detected: false,
        orphaned_predictions: 0
      },
      uptime_seconds: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})