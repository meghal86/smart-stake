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

    const etherscanApiKey = Deno.env.get('ETHERSCAN_API_KEY');
    if (!etherscanApiKey) {
      throw new Error('ETHERSCAN_API_KEY not configured');
    }

    // Fetch wallet transaction history
    const etherscanUrl = `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${etherscanApiKey}`;
    const response = await fetch(etherscanUrl);
    const txData = await response.json();

    if (txData.status !== '1') {
      throw new Error('Failed to fetch wallet transactions');
    }

    // Fetch wallet balance
    const balanceUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${etherscanApiKey}`;
    const balanceResponse = await fetch(balanceUrl);
    const balanceData = await balanceResponse.json();

    const balance = balanceData.status === '1' ? 
      parseInt(balanceData.result) / Math.pow(10, 18) : 0;

    // Analyze transaction patterns
    const transactions = txData.result || [];
    const recentTxs = transactions.slice(0, 100); // Last 100 transactions
    
    // Calculate risk metrics
    const riskAnalysis = {
      // Transaction volume analysis
      totalTransactions: transactions.length,
      recentActivity: recentTxs.length,
      avgTxValue: recentTxs.reduce((sum: number, tx: any) => 
        sum + (parseInt(tx.value) / Math.pow(10, 18)), 0) / recentTxs.length,
      
      // Wallet age (first transaction)
      walletAge: transactions.length > 0 ? 
        Math.floor((Date.now() - parseInt(transactions[transactions.length - 1].timeStamp) * 1000) / (1000 * 60 * 60 * 24)) : 0,
      
      // Balance analysis
      currentBalance: balance,
      
      // Interaction patterns
      uniqueContracts: [...new Set(recentTxs
        .filter((tx: any) => tx.to && tx.input !== '0x')
        .map((tx: any) => tx.to))].length,
      
      // Failed transaction ratio
      failedTxRatio: recentTxs.filter((tx: any) => tx.txreceipt_status === '0').length / recentTxs.length,
      
      // Gas usage patterns
      avgGasUsed: recentTxs.reduce((sum: number, tx: any) => 
        sum + parseInt(tx.gasUsed || '0'), 0) / recentTxs.length,
    };

    // Calculate overall risk score (1-10, where 10 is highest risk)
    let riskScore = 1;
    
    // New wallet risk
    if (riskAnalysis.walletAge < 30) riskScore += 2;
    else if (riskAnalysis.walletAge < 90) riskScore += 1;
    
    // Low activity risk
    if (riskAnalysis.totalTransactions < 10) riskScore += 2;
    else if (riskAnalysis.totalTransactions < 50) riskScore += 1;
    
    // High failed transaction ratio
    if (riskAnalysis.failedTxRatio > 0.1) riskScore += 2;
    else if (riskAnalysis.failedTxRatio > 0.05) riskScore += 1;
    
    // Contract interaction patterns
    if (riskAnalysis.uniqueContracts > 20) riskScore += 1; // High contract interaction might indicate bot behavior
    
    // Balance risk
    if (riskAnalysis.currentBalance < 0.1) riskScore += 1; // Very low balance
    
    // Normalize risk score
    riskScore = Math.min(10, Math.max(1, riskScore));

    // Determine risk level
    let riskLevel = 'low';
    if (riskScore >= 7) riskLevel = 'high';
    else if (riskScore >= 4) riskLevel = 'medium';

    // Generate risk factors
    const riskFactors = [];
    if (riskAnalysis.walletAge < 30) riskFactors.push('New wallet (less than 30 days old)');
    if (riskAnalysis.totalTransactions < 10) riskFactors.push('Low transaction history');
    if (riskAnalysis.failedTxRatio > 0.1) riskFactors.push('High failed transaction ratio');
    if (riskAnalysis.currentBalance < 0.1) riskFactors.push('Very low ETH balance');
    if (riskAnalysis.uniqueContracts > 20) riskFactors.push('High smart contract interaction frequency');

    const scanResult = {
      wallet_address: walletAddress,
      risk_score: riskScore,
      risk_level: riskLevel,
      analysis: riskAnalysis,
      risk_factors: riskFactors,
      recommendations: riskLevel === 'high' ? 
        ['Proceed with extreme caution', 'Verify wallet ownership', 'Start with small amounts'] :
        riskLevel === 'medium' ?
        ['Monitor transactions closely', 'Verify recent activity'] :
        ['Wallet appears safe for normal interactions'],
      scan_timestamp: new Date().toISOString()
    };

    // Store scan result
    const { error } = await supabaseClient
      .from('risk_scans')
      .insert({
        wallet_address: walletAddress,
        user_id: userId || null,
        risk_score: riskScore,
        risk_level: riskLevel,
        scan_data: scanResult
      });

    if (error) {
      console.error('Error storing risk scan:', error);
    }

    // Create alert if high risk
    if (riskLevel === 'high') {
      await supabaseClient
        .from('alerts')
        .insert({
          alert_type: 'risk_warning',
          message: `High-risk wallet detected: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`,
          data: {
            wallet_address: walletAddress,
            risk_score: riskScore,
            risk_factors: riskFactors
          },
          severity: 'high'
        });
    }

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