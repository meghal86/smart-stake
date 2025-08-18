import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const etherscanApiKey = Deno.env.get('ETHERSCAN_API_KEY');
    if (!etherscanApiKey) {
      throw new Error('ETHERSCAN_API_KEY not configured');
    }

    // Fetch latest whale transactions (large ETH transfers)
    const whaleThreshold = '1000'; // 1000 ETH minimum
    const etherscanUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=0x00000000219ab540356cBB839Cbe05303d7705Fa&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`;
    
    const response = await fetch(etherscanUrl);
    const data = await response.json();

    if (data.status !== '1') {
      throw new Error('Failed to fetch from Etherscan');
    }

    // Process whale transactions
    const whaleTransactions = data.result
      .filter((tx: any) => {
        const valueInEth = parseInt(tx.value) / Math.pow(10, 18);
        return valueInEth >= parseFloat(whaleThreshold);
      })
      .slice(0, 10); // Limit to 10 most recent

    // Insert alerts for whale transactions
    for (const tx of whaleTransactions) {
      const valueInEth = parseInt(tx.value) / Math.pow(10, 18);
      const valueInUsd = valueInEth * 3500; // Approximate ETH price
      
      const { error } = await supabaseClient
        .from('alerts')
        .insert({
          alert_type: 'whale_transaction',
          message: `Large transaction: ${valueInEth.toFixed(2)} ETH ($${valueInUsd.toLocaleString()})`,
          data: {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value_eth: valueInEth,
            value_usd: valueInUsd,
            gas_used: tx.gasUsed,
            timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString()
          },
          severity: valueInUsd > 50000000 ? 'high' : valueInUsd > 10000000 ? 'medium' : 'low'
        });

      if (error) {
        console.error('Error inserting alert:', error);
      }
    }

    // Get Pro users for push notifications
    const { data: proUsers } = await supabaseClient
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .eq('plan_type', 'pro');

    // TODO: Implement push notifications to Pro users for high-value transactions
    const highValueAlerts = whaleTransactions.filter((tx: any) => {
      const valueInEth = parseInt(tx.value) / Math.pow(10, 18);
      return valueInEth * 3500 > 50000000; // $50M+ transactions
    });

    return new Response(
      JSON.stringify({
        success: true,
        processedTransactions: whaleTransactions.length,
        highValueAlerts: highValueAlerts.length,
        proUsersNotified: proUsers?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in fetchWhales:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});