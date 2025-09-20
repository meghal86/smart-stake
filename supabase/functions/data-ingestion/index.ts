import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

class DataIngestionService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async fetchWhaleTransactions() {
    try {
      const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${Deno.env.get('ALCHEMY_API_KEY')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [{
            fromBlock: 'latest',
            category: ['external'],
            minValue: 50,
            maxCount: 50
          }],
          id: 1
        })
      });

      const data = await response.json();
      const transactions = data.result?.transfers || [];
      
      return this.processTransactions(transactions);
    } catch (error) {
      await this.updateProviderHealth('alchemy', 'degraded');
      throw error;
    }
  }

  private async processTransactions(transactions: any[]) {
    const processed = [];
    
    for (const tx of transactions) {
      const processedTx = {
        hash: tx.hash,
        from_address: tx.from,
        to_address: tx.to,
        value_eth: parseFloat(tx.value || '0'),
        block_number: parseInt(tx.blockNum, 16),
        timestamp: new Date().toISOString()
      };

      processed.push(processedTx);
    }

    if (processed.length > 0) {
      await this.supabase
        .from('whale_transactions')
        .upsert(processed, { onConflict: 'hash' });
    }

    await this.updateProviderHealth('alchemy', 'healthy');
    return processed;
  }

  private async updateProviderHealth(name: string, status: string) {
    await this.supabase
      .from('provider_health')
      .insert({
        provider_name: name,
        status,
        last_success: status === 'healthy' ? new Date().toISOString() : null
      });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const service = new DataIngestionService();
    const transactions = await service.fetchWhaleTransactions();

    return new Response(JSON.stringify({ 
      success: true, 
      transactions_processed: transactions.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})