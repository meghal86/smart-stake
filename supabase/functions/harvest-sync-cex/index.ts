/**
 * HarvestPro Edge Function: Sync CEX Trades
 * 
 * Syncs trades from connected CEX accounts and updates the database.
 * Uses the migrated cex-integration and data-aggregation logic.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { syncCEXTrades } from '../_shared/harvestpro/cex-integration.ts';
import { aggregateCEXData } from '../_shared/harvestpro/data-aggregation.ts';

interface SyncCEXRequest {
  userId: string;
  cexAccounts: Array<{
    id: string;
    exchange: string;
    isActive: boolean;
  }>;
  forceRefresh?: boolean;
}

interface SyncCEXResponse {
  success: boolean;
  accountsProcessed: number;
  tradesFound: number;
  lastSyncAt: string;
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    const body: SyncCEXRequest = await req.json();
    
    if (!body.userId || !body.cexAccounts || body.cexAccounts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, cexAccounts' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Starting CEX sync for user ${body.userId}, ${body.cexAccounts.length} accounts`);

    let totalTrades = 0;
    let accountsProcessed = 0;
    const errors: string[] = [];

    // Process each CEX account
    for (const account of body.cexAccounts) {
      if (!account.isActive) {
        console.log(`Skipping inactive account: ${account.exchange} (${account.id})`);
        continue;
      }

      try {
        console.log(`Syncing CEX account: ${account.exchange} (${account.id})`);
        
        // Sync trades for this account
        const syncResult = await syncCEXTrades({
          accountId: account.id,
          exchange: account.exchange,
          userId: body.userId,
          forceRefresh: body.forceRefresh || false,
        }, supabaseClient);

        if (syncResult.success) {
          totalTrades += syncResult.tradesProcessed;
          accountsProcessed++;
          
          console.log(`CEX ${account.exchange}: ${syncResult.tradesProcessed} trades`);
        } else {
          errors.push(`${account.exchange}: ${syncResult.error}`);
          console.error(`Failed to sync CEX ${account.exchange}:`, syncResult.error);
        }
      } catch (error) {
        const errorMsg = `${account.exchange}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(`Error syncing CEX ${account.exchange}:`, error);
      }
    }

    // Aggregate data after syncing all accounts
    if (accountsProcessed > 0) {
      try {
        console.log('Aggregating CEX data...');
        
        const aggregationResult = await aggregateCEXData({
          userId: body.userId,
          cexAccountIds: body.cexAccounts.map(acc => acc.id),
        }, supabaseClient);

        if (!aggregationResult.success) {
          errors.push(`Data aggregation failed: ${aggregationResult.error}`);
        }
      } catch (error) {
        errors.push(`Data aggregation error: ${error instanceof Error ? error.message : String(error)}`);
        console.error('Data aggregation error:', error);
      }
    }

    // Update sync status in database
    const { error: updateError } = await supabaseClient
      .from('harvest_sync_status')
      .upsert({
        user_id: body.userId,
        sync_type: 'cex',
        last_sync_at: new Date().toISOString(),
        accounts_processed: accountsProcessed,
        trades_found: totalTrades,
        errors: errors.length > 0 ? errors : null,
        status: errors.length === body.cexAccounts.filter(acc => acc.isActive).length ? 'failed' : 
                errors.length > 0 ? 'partial' : 'success'
      });

    if (updateError) {
      console.error('Failed to update sync status:', updateError);
    }

    const response: SyncCEXResponse = {
      success: accountsProcessed > 0,
      accountsProcessed,
      tradesFound: totalTrades,
      lastSyncAt: new Date().toISOString(),
      ...(errors.length > 0 && { error: errors.join('; ') })
    };

    console.log(`CEX sync completed:`, response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('CEX sync error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
