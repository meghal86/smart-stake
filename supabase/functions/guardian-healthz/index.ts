/**
 * Guardian Health Check Edge Function
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const checks = {
      alchemy: false,
      etherscan: false,
      db: false,
    };

    let latestEventAgeSec = 0;
    const startTime = Date.now();

    // Check Alchemy
    try {
      const alchemyKey = Deno.env.get('ALCHEMY_API_KEY') || 'demo';
      const alchemyUrl = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
      
      const alchemyStart = Date.now();
      const response = await fetch(alchemyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_blockNumber',
          params: [],
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        checks.alchemy = true;
        const alchemyLatency = (Date.now() - alchemyStart) / 1000;
        latestEventAgeSec = Math.max(latestEventAgeSec, alchemyLatency);
      }
    } catch (error) {
      console.error('Alchemy check failed:', error);
    }

    // Check Etherscan
    try {
      const etherscanKey = Deno.env.get('ETHERSCAN_API_KEY') || 'YourApiKeyToken';
      const etherscanStart = Date.now();
      
      const response = await fetch(
        `https://api.etherscan.io/api?module=stats&action=ethsupply&apikey=${etherscanKey}`,
        { signal: AbortSignal.timeout(5000) }
      );

      if (response.ok) {
        checks.etherscan = true;
        const etherscanLatency = (Date.now() - etherscanStart) / 1000;
        latestEventAgeSec = Math.max(latestEventAgeSec, etherscanLatency);
      }
    } catch (error) {
      console.error('Etherscan check failed:', error);
    }

    // Check Database
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const dbStart = Date.now();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { count } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo);

      checks.db = true;
      const dbLatency = (Date.now() - dbStart) / 1000;
      latestEventAgeSec = Math.max(latestEventAgeSec, dbLatency);
    } catch (error) {
      console.error('DB check failed:', error);
    }

    const ok = checks.alchemy && checks.etherscan && checks.db;

    return new Response(
      JSON.stringify({
        ok,
        latestEventAgeSec,
        checks,
        timestamp: new Date().toISOString(),
      }),
      {
        status: ok ? 200 : 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

