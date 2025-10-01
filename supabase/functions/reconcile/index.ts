import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL');
const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY');

interface ReconciliationWindow {
  start: string;
  end: string;
  our_count: number;
  our_volume: number;
  provider_count: number;
  provider_volume: number;
  variance_count: number;
  variance_volume: number;
}

async function sampleWindows(): Promise<{ start: Date; end: Date }[]> {
  const now = new Date();
  const windows = [];
  
  // Sample 3 five-minute windows from last 24h
  for (let i = 0; i < 3; i++) {
    const hoursBack = Math.floor(Math.random() * 24) + 1;
    const minutesBack = Math.floor(Math.random() * 55);
    
    const end = new Date(now.getTime() - (hoursBack * 60 + minutesBack) * 60 * 1000);
    const start = new Date(end.getTime() - 5 * 60 * 1000); // 5 minutes
    
    windows.push({ start, end });
  }
  
  return windows;
}

async function getOurData(start: Date, end: Date) {
  const { data, error } = await supabase
    .from('events_whale')
    .select('amount_usd')
    .gte('ts', start.toISOString())
    .lt('ts', end.toISOString());
    
  if (error) throw error;
  
  return {
    count: data.length,
    volume: data.reduce((sum, row) => sum + (row.amount_usd || 0), 0)
  };
}

async function getProviderData(start: Date, end: Date) {
  // Mock provider data - replace with actual Alchemy/Etherscan calls
  try {
    const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: 'latest',
          toBlock: 'latest',
          category: ['erc20'],
          maxCount: 1000
        }],
        id: 1
      })
    });
    
    const result = await response.json();
    
    // Simplified - in production, filter by time window and calculate volume
    return {
      count: result.result?.transfers?.length || 0,
      volume: Math.random() * 1000000 // Mock volume
    };
  } catch (error) {
    console.error('Provider API error:', error);
    return { count: 0, volume: 0 };
  }
}

async function sendSlackAlert(message: string) {
  if (!SLACK_WEBHOOK_URL) return;
  
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '🔍 Data Quality Alert',
        blocks: [{
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }]
      })
    });
  } catch (error) {
    console.error('Slack alert failed:', error);
  }
}

serve(async (req) => {
  try {
    const windows = await sampleWindows();
    const results: ReconciliationWindow[] = [];
    
    for (const window of windows) {
      const [ourData, providerData] = await Promise.all([
        getOurData(window.start, window.end),
        getProviderData(window.start, window.end)
      ]);
      
      const varianceCount = Math.abs(ourData.count - providerData.count);
      const varianceVolume = Math.abs(ourData.volume - providerData.volume);
      
      results.push({
        start: window.start.toISOString(),
        end: window.end.toISOString(),
        our_count: ourData.count,
        our_volume: ourData.volume,
        provider_count: providerData.count,
        provider_volume: providerData.volume,
        variance_count: varianceCount,
        variance_volume: varianceVolume
      });
    }
    
    // Check tolerances
    const highVariance = results.some(r => 
      r.variance_count > 10 || r.variance_volume > 100000
    );
    
    const status = highVariance ? 'failed' : 'success';
    const notes = highVariance ? 'High variance detected in reconciliation' : 'All windows within tolerance';
    
    // Store results
    await supabase
      .from('qc_runs')
      .insert({
        windows: results,
        status,
        notes
      });
    
    // Send alert if needed
    if (highVariance) {
      await sendSlackAlert(
        `❌ Reconciliation failed\n• High variance in ${results.length} windows\n• Check /internal/ops for details`
      );
    }
    
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      status,
      windows_checked: results.length,
      notes
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    await sendSlackAlert(`💥 Reconciliation error: ${error.message}`);
    
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});