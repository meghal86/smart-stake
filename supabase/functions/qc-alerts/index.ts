import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL');

async function checkDataQuality() {
  try {
    // Check invariants
    const { data: invariants } = await supabase
      .from('v_events_invariants')
      .select('*')
      .single();

    // Check freshness
    const { data: freshness } = await supabase
      .from('v_freshness')
      .select('*')
      .single();

    // Check provenance ratio for last 2 hours
    const { data: provenance } = await supabase
      .from('v_provenance_ratio_hourly')
      .select('*')
      .limit(2);

    const avgRealRatio = provenance?.length 
      ? provenance.reduce((sum, row) => sum + (row.real_ratio || 0), 0) / provenance.length
      : 1;

    return {
      invariants: invariants || { neg_usd: 0, missing_tx: 0, missing_wallet: 0 },
      freshness: freshness || { latest_event_age_sec: 0 },
      realRatio2h: avgRealRatio
    };
  } catch (error) {
    console.error('Data quality check failed:', error);
    return {
      invariants: { neg_usd: 0, missing_tx: 0, missing_wallet: 0 },
      freshness: { latest_event_age_sec: 999 },
      realRatio2h: 0
    };
  }
}

async function sendSlackAlert(issues: string[]) {
  if (!SLACK_WEBHOOK_URL || issues.length === 0) return;

  const message = `🚨 Data Quality Issues Detected\n\n${issues.join('\n')}\n\n• Status: /status\n• Ops Dashboard: /internal/ops`;

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '🚨 AlphaWhale Data Quality Alert',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View Status' },
                url: `${Deno.env.get('APP_URL')}/status`
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Ops Dashboard' },
                url: `${Deno.env.get('APP_URL')}/internal/ops`
              }
            ]
          }
        ]
      })
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

serve(async (req) => {
  try {
    const quality = await checkDataQuality();
    const issues: string[] = [];

    // Check invariants
    if (quality.invariants.neg_usd > 0) {
      issues.push(`❌ ${quality.invariants.neg_usd} events with negative USD amounts`);
    }
    if (quality.invariants.missing_tx > 0) {
      issues.push(`❌ ${quality.invariants.missing_tx} events missing transaction hash`);
    }
    if (quality.invariants.missing_wallet > 0) {
      issues.push(`❌ ${quality.invariants.missing_wallet} events missing wallet hash`);
    }

    // Check freshness
    if (quality.freshness.latest_event_age_sec > 600) {
      const ageMinutes = Math.floor(quality.freshness.latest_event_age_sec / 60);
      issues.push(`⏰ Data is ${ageMinutes} minutes stale (>10min threshold)`);
    }

    // Check provenance ratio
    if (quality.realRatio2h < 0.4) {
      const percentage = Math.round(quality.realRatio2h * 100);
      issues.push(`📊 Only ${percentage}% real data in last 2h (<40% threshold)`);
    }

    // Send alert if issues found
    if (issues.length > 0) {
      await sendSlackAlert(issues);
    }

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      status: issues.length === 0 ? 'healthy' : 'issues_detected',
      issues_count: issues.length,
      issues,
      metrics: {
        latest_event_age_sec: quality.freshness.latest_event_age_sec,
        neg_usd_count: quality.invariants.neg_usd,
        missing_tx_count: quality.invariants.missing_tx,
        missing_wallet_count: quality.invariants.missing_wallet,
        real_ratio_2h: quality.realRatio2h
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('QC alerts error:', error);

    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});