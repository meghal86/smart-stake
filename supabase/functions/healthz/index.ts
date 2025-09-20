import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

class HealthService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async getSystemHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      data_freshness: await this.checkDataFreshness(),
      model_performance: await this.checkModelPerformance(),
      provider_status: await this.checkProviderStatus(),
      database_health: await this.checkDatabaseHealth(),
      uptime_metrics: await this.getUptimeMetrics()
    };

    // Determine overall status
    const issues = [
      health.data_freshness.status !== 'ok',
      health.model_performance.drift_detected,
      Object.values(health.provider_status).some(status => status !== 'healthy'),
      !health.database_health.connected
    ];

    if (issues.some(issue => issue)) {
      health.status = 'degraded';
    }

    return health;
  }

  private async checkDataFreshness() {
    try {
      const { data: latestFeature } = await this.supabase
        .from('feature_store')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestFeature) {
        const lastUpdate = new Date(latestFeature.created_at);
        const delayMinutes = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
        
        return {
          last_update: latestFeature.created_at,
          delay_minutes: Math.round(delayMinutes),
          status: delayMinutes < 10 ? 'ok' : 'stale'
        };
      }

      return {
        last_update: null,
        delay_minutes: null,
        status: 'no_data'
      };
    } catch (error) {
      return {
        last_update: null,
        delay_minutes: null,
        status: 'error',
        error: error.message
      };
    }
  }

  private async checkModelPerformance() {
    try {
      const { data: models } = await this.supabase
        .from('model_registry')
        .select('accuracy_7d, accuracy_30d')
        .eq('is_active', true);

      const { data: driftData } = await this.supabase
        .from('data_drift')
        .select('threshold_exceeded')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      const avgAccuracy7d = models?.reduce((sum, m) => sum + (m.accuracy_7d || 0), 0) / (models?.length || 1);
      const avgAccuracy30d = models?.reduce((sum, m) => sum + (m.accuracy_30d || 0), 0) / (models?.length || 1);
      const driftDetected = driftData?.some(d => d.threshold_exceeded) || false;

      return {
        accuracy_7d: Math.round(avgAccuracy7d * 100) / 100,
        accuracy_30d: Math.round(avgAccuracy30d * 100) / 100,
        drift_detected: driftDetected,
        model_count: models?.length || 0
      };
    } catch (error) {
      return {
        accuracy_7d: null,
        accuracy_30d: null,
        drift_detected: false,
        error: error.message
      };
    }
  }

  private async checkProviderStatus() {
    try {
      const { data: providers } = await this.supabase
        .from('provider_health')
        .select('provider_name, status')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      const status: Record<string, string> = {};
      const providerNames = ['alchemy', 'coingecko', 'quicknode'];

      for (const name of providerNames) {
        const providerData = providers?.filter(p => p.provider_name === name);
        if (providerData && providerData.length > 0) {
          status[name] = providerData[0].status;
        } else {
          status[name] = 'unknown';
        }
      }

      return status;
    } catch (error) {
      return {
        alchemy: 'error',
        coingecko: 'error',
        quicknode: 'error',
        error: error.message
      };
    }
  }

  private async checkDatabaseHealth() {
    try {
      const { data, error } = await this.supabase
        .from('feature_store')
        .select('count')
        .limit(1);

      return {
        connected: !error,
        error: error?.message
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  private async getUptimeMetrics() {
    // Mock uptime metrics - in production, integrate with monitoring service
    return {
      uptime_percentage: 99.7,
      avg_response_time_ms: 150,
      requests_per_minute: 45,
      error_rate_percentage: 0.3
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const healthService = new HealthService();
    const health = await healthService.getSystemHealth();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    return new Response(JSON.stringify(health), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})