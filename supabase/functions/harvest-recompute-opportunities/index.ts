/**
 * HarvestPro Edge Function: Recompute Opportunities
 * 
 * Calculates tax loss harvesting opportunities using the migrated business logic.
 * This is the core function that brings together all the migrated modules.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { detectOpportunities } from '../_shared/harvestpro/opportunity-detection.ts';
import { calculateFIFOLots } from '../_shared/harvestpro/fifo.ts';
import { calculateNetBenefit } from '../_shared/harvestpro/net-benefit.ts';
import { applyEligibilityFilters } from '../_shared/harvestpro/eligibility.ts';
import { classifyRisk } from '../_shared/harvestpro/risk-classification.ts';
import { estimateGasCosts } from '../_shared/harvestpro/gas-estimation.ts';
import { estimateSlippage } from '../_shared/harvestpro/slippage-estimation.ts';
import { getCurrentPrices } from '../_shared/harvestpro/price-oracle.ts';

interface RecomputeOpportunitiesRequest {
  userId: string;
  taxRate?: number;
  minLossThreshold?: number;
  maxRiskLevel?: 'low' | 'medium' | 'high';
  excludeWashSale?: boolean;
  forceRefresh?: boolean;
}

interface RecomputeOpportunitiesResponse {
  success: boolean;
  opportunitiesFound: number;
  totalPotentialSavings: number;
  computationTime: number;
  lastComputedAt: string;
  opportunities?: Array<{
    id: string;
    token: string;
    unrealizedLoss: number;
    taxSavings: number;
    netBenefit: number;
    riskLevel: string;
    gasCost: number;
    slippageCost: number;
  }>;
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Parse request
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body: RecomputeOpportunitiesRequest = await req.json();
    
    if (!body.userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userId' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Starting opportunity computation for user ${body.userId}`);

    // Step 1: Get user's aggregated transaction data
    const { data: transactions, error: transactionError } = await supabaseClient
      .from('harvest_transactions')
      .select('*')
      .eq('user_id', body.userId)
      .order('timestamp', { ascending: true });

    if (transactionError) {
      throw new Error(`Failed to fetch transactions: ${transactionError.message}`);
    }

    if (!transactions || transactions.length === 0) {
      console.log('No transactions found for user');
      return new Response(
        JSON.stringify({
          success: true,
          opportunitiesFound: 0,
          totalPotentialSavings: 0,
          computationTime: Date.now() - startTime,
          lastComputedAt: new Date().toISOString(),
          opportunities: []
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Processing ${transactions.length} transactions`);

    // Step 2: Calculate FIFO lots for cost basis
    const fifoResult = calculateFIFOLots(transactions);
    console.log(`FIFO calculation: ${fifoResult.lots.length} lots, ${fifoResult.totalRemaining} total remaining`);

    // Step 3: Get current prices for all tokens
    const uniqueTokens = [...new Set(transactions.map(tx => tx.token))];
    const priceResult = await getCurrentPrices(uniqueTokens, supabaseClient);
    
    if (!priceResult.success) {
      throw new Error(`Failed to get current prices: ${priceResult.error}`);
    }

    console.log(`Got prices for ${Object.keys(priceResult.prices).length} tokens`);

    // Step 4: Detect opportunities
    const opportunityResult = await detectOpportunities({
      lots: fifoResult.lots,
      currentPrices: priceResult.prices,
      minLossThreshold: body.minLossThreshold || 100, // $100 minimum loss
    }, supabaseClient);

    if (!opportunityResult.success) {
      throw new Error(`Failed to detect opportunities: ${opportunityResult.error}`);
    }

    console.log(`Detected ${opportunityResult.opportunities.length} potential opportunities`);

    // Step 5: Calculate costs and net benefits for each opportunity
    const enrichedOpportunities = [];
    const taxRate = body.taxRate || 0.24; // Default 24% tax rate

    for (const opportunity of opportunityResult.opportunities) {
      try {
        // Estimate gas costs
        const gasResult = await estimateGasCosts({
          token: opportunity.token,
          amount: opportunity.quantity,
          operation: 'sell',
        }, supabaseClient);

        // Estimate slippage
        const slippageResult = await estimateSlippage({
          token: opportunity.token,
          amount: opportunity.quantity,
          operation: 'sell',
        }, supabaseClient);

        // Calculate net benefit
        const netBenefit = calculateNetBenefit({
          unrealizedLoss: opportunity.unrealizedLoss,
          taxRate,
          gasEstimate: gasResult.success ? gasResult.gasCostUsd : 50, // Default $50
          slippageEstimate: slippageResult.success ? slippageResult.slippageCostUsd : 20, // Default $20
          tradingFees: 10, // Default $10
        });

        // Classify risk
        const riskResult = await classifyRisk({
          token: opportunity.token,
          amount: opportunity.quantity,
          unrealizedLoss: opportunity.unrealizedLoss,
        }, supabaseClient);

        enrichedOpportunities.push({
          id: `${opportunity.token}-${Date.now()}`,
          token: opportunity.token,
          quantity: opportunity.quantity,
          unrealizedLoss: opportunity.unrealizedLoss,
          taxSavings: opportunity.unrealizedLoss * taxRate,
          netBenefit,
          riskLevel: riskResult.success ? riskResult.riskLevel : 'medium',
          gasCost: gasResult.success ? gasResult.gasCostUsd : 50,
          slippageCost: slippageResult.success ? slippageResult.slippageCostUsd : 20,
          currentPrice: priceResult.prices[opportunity.token] || 0,
          costBasis: opportunity.costBasis,
          holdingPeriod: opportunity.holdingPeriod,
        });
      } catch (error) {
        console.error(`Error processing opportunity for ${opportunity.token}:`, error);
        // Continue with other opportunities
      }
    }

    console.log(`Enriched ${enrichedOpportunities.length} opportunities with costs and benefits`);

    // Step 6: Apply eligibility filters
    const eligibilityFilters = {
      minLoss: body.minLossThreshold || 100,
      minNetBenefit: 0, // Include all positive net benefits
      maxRiskLevel: body.maxRiskLevel || 'high',
      excludeWashSale: body.excludeWashSale || false,
      excludeIlliquid: true, // Always exclude illiquid tokens
    };

    const filteredOpportunities = applyEligibilityFilters(enrichedOpportunities, eligibilityFilters);
    console.log(`${filteredOpportunities.length} opportunities passed eligibility filters`);

    // Step 7: Sort by net benefit (highest first)
    filteredOpportunities.sort((a, b) => b.netBenefit - a.netBenefit);

    // Step 8: Store results in database
    const { error: storeError } = await supabaseClient
      .from('harvest_opportunities')
      .upsert({
        user_id: body.userId,
        computed_at: new Date().toISOString(),
        opportunities: filteredOpportunities,
        total_opportunities: filteredOpportunities.length,
        total_potential_savings: filteredOpportunities.reduce((sum, opp) => sum + opp.netBenefit, 0),
        computation_time_ms: Date.now() - startTime,
        filters_applied: eligibilityFilters,
      });

    if (storeError) {
      console.error('Failed to store opportunities:', storeError);
      // Don't fail the request, just log the error
    }

    const totalPotentialSavings = filteredOpportunities.reduce((sum, opp) => sum + opp.netBenefit, 0);
    const computationTime = Date.now() - startTime;

    const response: RecomputeOpportunitiesResponse = {
      success: true,
      opportunitiesFound: filteredOpportunities.length,
      totalPotentialSavings,
      computationTime,
      lastComputedAt: new Date().toISOString(),
      opportunities: filteredOpportunities.map(opp => ({
        id: opp.id,
        token: opp.token,
        unrealizedLoss: opp.unrealizedLoss,
        taxSavings: opp.taxSavings,
        netBenefit: opp.netBenefit,
        riskLevel: opp.riskLevel,
        gasCost: opp.gasCost,
        slippageCost: opp.slippageCost,
      }))
    };

    console.log(`Opportunity computation completed:`, {
      opportunitiesFound: response.opportunitiesFound,
      totalPotentialSavings: response.totalPotentialSavings,
      computationTime: response.computationTime
    });

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Opportunity computation error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        opportunitiesFound: 0,
        totalPotentialSavings: 0,
        computationTime: Date.now() - startTime,
        lastComputedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
