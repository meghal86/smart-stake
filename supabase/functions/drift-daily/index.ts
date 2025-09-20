import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DriftMetrics {
  model_version: string;
  hit_rate_7d: number;
  hit_rate_30d: number;
  hit_rate_90d: number;
  avg_confidence: number;
  runs: number;
}

class DriftMonitor {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async computeDailyMetrics(): Promise<DriftMetrics[]> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get scenario runs with outcomes for last 90 days
    const { data: runsWithOutcomes } = await this.supabase
      .from('scenario_runs')
      .select(`
        model_version,
        confidence,
        created_at,
        scenario_outcomes!inner(correct, recorded_at)
      `)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    if (!runsWithOutcomes?.length) return [];

    // Group by model version and compute metrics
    const modelMetrics = new Map<string, DriftMetrics>();

    for (const run of runsWithOutcomes) {
      const version = run.model_version || 'scn-v1.0';
      
      if (!modelMetrics.has(version)) {
        modelMetrics.set(version, {
          model_version: version,
          hit_rate_7d: 0,
          hit_rate_30d: 0,
          hit_rate_90d: 0,
          avg_confidence: 0,
          runs: 0
        });
      }

      const metrics = modelMetrics.get(version)!;
      metrics.runs++;
      metrics.avg_confidence += run.confidence;

      // Calculate hit rates for different windows
      const runDate = new Date(run.created_at);
      const daysDiff = (Date.now() - runDate.getTime()) / (1000 * 60 * 60 * 24);
      
      const isCorrect = run.scenario_outcomes[0]?.correct ? 1 : 0;
      
      if (daysDiff <= 7) metrics.hit_rate_7d += isCorrect;
      if (daysDiff <= 30) metrics.hit_rate_30d += isCorrect;
      if (daysDiff <= 90) metrics.hit_rate_90d += isCorrect;
    }

    // Normalize metrics
    const results: DriftMetrics[] = [];
    for (const [version, metrics] of modelMetrics) {
      const runs7d = runsWithOutcomes.filter(r => 
        r.model_version === version && 
        (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 7
      ).length;
      
      const runs30d = runsWithOutcomes.filter(r => 
        r.model_version === version && 
        (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24) <= 30
      ).length;

      results.push({
        model_version: version,
        hit_rate_7d: runs7d > 0 ? metrics.hit_rate_7d / runs7d : 0,
        hit_rate_30d: runs30d > 0 ? metrics.hit_rate_30d / runs30d : 0,
        hit_rate_90d: metrics.runs > 0 ? metrics.hit_rate_90d / metrics.runs : 0,
        avg_confidence: metrics.runs > 0 ? metrics.avg_confidence / metrics.runs : 0,
        runs: metrics.runs
      });
    }

    return results;
  }

  async upsertMetrics(metrics: DriftMetrics[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    for (const metric of metrics) {
      await this.supabase
        .from('model_daily_metrics')
        .upsert({
          day: today,
          model_version: metric.model_version,
          hit_rate_7d: metric.hit_rate_7d,
          hit_rate_30d: metric.hit_rate_30d,
          hit_rate_90d: metric.hit_rate_90d,
          avg_confidence: metric.avg_confidence,
          runs: metric.runs
        });
    }
  }

  async checkDriftAlerts(metrics: DriftMetrics[]): Promise<void> {
    for (const metric of metrics) {
      // Get baseline for this model
      const { data: modelData } = await this.supabase
        .from('model_versions')
        .select('baseline_hit_rate_30d')
        .eq('name', metric.model_version)
        .single();

      const baseline = modelData?.baseline_hit_rate_30d || 0.72;
      const delta = baseline - metric.hit_rate_30d;

      if (delta > 0.05) { // 5pp drop
        await this.handleDriftAlert(metric.model_version, metric.hit_rate_30d, baseline, delta);
      }
    }
  }

  async handleDriftAlert(modelVersion: string, currentRate: number, baseline: number, delta: number): Promise<void> {
    // Check if we already have an unresolved alert for this model
    const { data: existingAlert } = await this.supabase
      .from('drift_alerts')
      .select('consecutive_days')
      .eq('model_version', modelVersion)
      .eq('alert_type', 'hit_rate_drop')
      .is('resolved_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const consecutiveDays = (existingAlert?.consecutive_days || 0) + 1;

    // Create/update alert
    await this.supabase
      .from('drift_alerts')
      .insert({
        model_version: modelVersion,
        alert_type: 'hit_rate_drop',
        current_value: currentRate,
        baseline_value: baseline,
        delta: delta,
        consecutive_days: consecutiveDays
      });

    // If 2+ consecutive days, take action
    if (consecutiveDays >= 2) {
      await this.sendSlackAlert(modelVersion, currentRate, baseline, delta, consecutiveDays);
      await this.disableModel(modelVersion);
    }
  }

  async sendSlackAlert(modelVersion: string, currentRate: number, baseline: number, delta: number, days: number): Promise<void> {
    const webhookUrl = Deno.env.get('SLACK_WEBHOOK_URL');
    if (!webhookUrl) return;

    const message = {
      text: `🚨 Model Drift Alert: ${modelVersion}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Model Drift Detected*\n• Model: ${modelVersion}\n• Current 30d hit rate: ${(currentRate * 100).toFixed(1)}%\n• Baseline: ${(baseline * 100).toFixed(1)}%\n• Drop: ${(delta * 100).toFixed(1)}pp\n• Consecutive days: ${days}`
          }
        }
      ]
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  async disableModel(modelVersion: string): Promise<void> {
    await this.supabase
      .from('model_versions')
      .update({ rollout_percent: 0 })
      .eq('name', modelVersion);
    
    console.log(`Disabled model ${modelVersion} due to drift`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const monitor = new DriftMonitor();
    
    console.log('Computing daily drift metrics...');
    const metrics = await monitor.computeDailyMetrics();
    
    console.log('Upserting metrics...');
    await monitor.upsertMetrics(metrics);
    
    console.log('Checking drift alerts...');
    await monitor.checkDriftAlerts(metrics);

    return new Response(JSON.stringify({ 
      success: true, 
      metrics_computed: metrics.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Drift monitoring failed:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})