import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface HealthResponse {
  mode: string;
  providers: Record<string, string>;
  lastUpdateISO: string;
  version: string;
}

const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL');
const APP_URL = Deno.env.get('APP_URL') || 'https://alphawhale.com';

async function checkHealth(): Promise<{ ok: boolean; latency: number; data?: HealthResponse }> {
  const start = Date.now();
  
  try {
    const response = await fetch(`${APP_URL}/api/healthz`, {
      headers: { 'User-Agent': 'AlphaWhale-Monitor/1.0' }
    });
    
    const latency = Date.now() - start;
    const data = await response.json();
    
    return {
      ok: response.ok && data.mode !== 'down',
      latency,
      data
    };
  } catch (error) {
    return {
      ok: false,
      latency: Date.now() - start
    };
  }
}

async function sendSlackAlert(message: string, health?: HealthResponse) {
  if (!SLACK_WEBHOOK_URL) return;
  
  const payload = {
    text: `🚨 AlphaWhale Alert`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      },
      ...(health ? [{
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Mode:* ${health.mode}` },
          { type: 'mrkdwn', text: `*Version:* ${health.version}` },
          { type: 'mrkdwn', text: `*Etherscan:* ${health.providers?.etherscan || 'unknown'}` },
          { type: 'mrkdwn', text: `*CoinGecko:* ${health.providers?.coingecko || 'unknown'}` }
        ]
      }] : [])
    ]
  };
  
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

serve(async (req) => {
  try {
    const { ok, latency, data } = await checkHealth();
    
    if (!ok) {
      await sendSlackAlert(
        `❌ Health check failed\n• URL: ${APP_URL}\n• Latency: ${latency}ms`,
        data
      );
    } else if (latency > 800) {
      await sendSlackAlert(
        `⚠️ High latency detected\n• URL: ${APP_URL}\n• Latency: ${latency}ms\n• Mode: ${data?.mode}`,
        data
      );
    }
    
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      status: ok ? 'ok' : 'failed',
      latency,
      health: data
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    await sendSlackAlert(`💥 Monitor error: ${error.message}`);
    
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});