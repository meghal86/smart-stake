import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HealthData {
  status: string;
  timestamp: string;
  slo_metrics: {
    hit_rate_7d: number;
    p95_latency_ms: number;
    cache_hit_rate: number;
    outcomes_labeled_1h: number;
  };
  alerts: {
    active_cooldowns: number;
    storm_detected: boolean;
    orphaned_predictions: number;
  };
  uptime_seconds: number;
}

export default function HealthEndpoint() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    try {
      const startTime = Date.now();

      // Fetch real health metrics
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
      const activeCooldowns = cooldownsData.data?.length || 0;

      // Determine overall status
      let status = 'healthy';
      if (hitRate7d < 0.6 || activeCooldowns > 3) {
        status = 'degraded';
      }
      if (outcomesCount === 0 && new Date().getHours() > 2) {
        status = 'down'; // No outcomes after 2 AM
      }

      const healthResponse: HealthData = {
        status,
        timestamp: new Date().toISOString(),
        slo_metrics: {
          hit_rate_7d: Math.round(hitRate7d * 100 * 100) / 100,
          p95_latency_ms: Math.floor(Math.random() * 200) + 300, // Mock latency
          cache_hit_rate: Math.floor(Math.random() * 20) + 75, // Mock cache rate
          outcomes_labeled_1h: outcomesCount
        },
        alerts: {
          active_cooldowns: activeCooldowns,
          storm_detected: activeCooldowns > 2,
          orphaned_predictions: 0 // Would query in production
        },
        uptime_seconds: Math.floor((Date.now() - startTime) / 1000)
      };

      setHealthData(healthResponse);
    } catch (error) {
      console.error('Health check failed:', error);
      
      // Fallback health data on error
      setHealthData({
        status: 'down',
        timestamp: new Date().toISOString(),
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
      });
    }
  };

  // Return JSON response for API calls
  if (healthData) {
    return (
      <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        {JSON.stringify(healthData, null, 2)}
      </div>
    );
  }

  return <div>Loading health data...</div>;
}