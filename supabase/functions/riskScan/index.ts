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
    const { walletAddress, userId } = await req.json();
    
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Simple mock analysis for now
    const scanResult = {
      wallet_address: walletAddress,
      risk_score: 3,
      risk_level: 'low',
      analysis: {
        totalTransactions: 150,
        recentActivity: 25,
        avgTxValue: 0.5,
        walletAge: 365,
        currentBalance: 2.5,
        uniqueContracts: 8,
        failedTxRatio: 0.02,
        avgGasUsed: 21000
      },
      risk_factors: ['Normal transaction patterns'],
      recommendations: ['✅ Wallet appears safe for normal interactions'],
      wallet_category: { type: 'personal', name: 'Personal Wallet', custodial: false },
      compliance_status: {
        sanctioned: false,
        aml_risk: 'low',
        kyc_required: false
      },
      monitoring_alerts: {
        address_poisoning: false,
        suspicious_patterns: false,
        risky_connections: false
      },
      scan_timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify({
        success: true,
        ...scanResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in riskScan:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});