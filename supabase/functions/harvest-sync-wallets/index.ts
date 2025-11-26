/**
 * HarvestPro Edge Function: Sync Wallet Transactions
 * 
 * Syncs transactions from connected wallets and updates the database.
 * Uses the migrated wallet-connection and data-aggregation logic.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';
import { syncWalletTransactions } from '../_shared/harvestpro/wallet-connection.ts';
import { aggregateWalletData } from '../_shared/harvestpro/data-aggregation.ts';

interface SyncWalletsRequest {
  userId: string;
  walletAddresses: string[];
  forceRefresh?: boolean;
}

interface SyncWalletsResponse {
  success: boolean;
  walletsProcessed: number;
  transactionsFound: number;
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

    const body: SyncWalletsRequest = await req.json();
    
    if (!body.userId || !body.walletAddresses || body.walletAddresses.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, walletAddresses' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Starting wallet sync for user ${body.userId}, ${body.walletAddresses.length} wallets`);

    let totalTransactions = 0;
    let walletsProcessed = 0;
    const errors: string[] = [];

    // Process each wallet
    for (const walletAddress of body.walletAddresses) {
      try {
        console.log(`Syncing wallet: ${walletAddress}`);
        
        // Sync transactions for this wallet
        const syncResult = await syncWalletTransactions({
          walletAddress,
          userId: body.userId,
          forceRefresh: body.forceRefresh || false,
        }, supabaseClient);

        if (syncResult.success) {
          totalTransactions += syncResult.transactionsProcessed;
          walletsProcessed++;
          
          console.log(`Wallet ${walletAddress}: ${syncResult.transactionsProcessed} transactions`);
        } else {
          errors.push(`Wallet ${walletAddress}: ${syncResult.error}`);
          console.error(`Failed to sync wallet ${walletAddress}:`, syncResult.error);
        }
      } catch (error) {
        const errorMsg = `Wallet ${walletAddress}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(`Error syncing wallet ${walletAddress}:`, error);
      }
    }

    // Aggregate data after syncing all wallets
    if (walletsProcessed > 0) {
      try {
        console.log('Aggregating wallet data...');
        
        const aggregationResult = await aggregateWalletData({
          userId: body.userId,
          walletAddresses: body.walletAddresses,
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
        sync_type: 'wallets',
        last_sync_at: new Date().toISOString(),
        wallets_processed: walletsProcessed,
        transactions_found: totalTransactions,
        errors: errors.length > 0 ? errors : null,
        status: errors.length === body.walletAddresses.length ? 'failed' : 
                errors.length > 0 ? 'partial' : 'success'
      });

    if (updateError) {
      console.error('Failed to update sync status:', updateError);
    }

    const response: SyncWalletsResponse = {
      success: walletsProcessed > 0,
      walletsProcessed,
      transactionsFound: totalTransactions,
      lastSyncAt: new Date().toISOString(),
      ...(errors.length > 0 && { error: errors.join('; ') })
    };

    console.log(`Wallet sync completed:`, response);

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Wallet sync error:', error);
    
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
