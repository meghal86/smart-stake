import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BlockchainProvider {
  name: string;
  getTransactions(address: string): Promise<any[]>;
  getBalance(address: string): Promise<string>;
}

class AlchemyProvider implements BlockchainProvider {
  name = 'Alchemy';
  private apiKey = Deno.env.get('ALCHEMY_API_KEY') || '';
  private baseUrl = `https://eth-mainnet.g.alchemy.com/v2/${this.apiKey}`;

  async getTransactions(address: string): Promise<any[]> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromAddress: address,
          category: ['external', 'erc20', 'erc721'],
          maxCount: 100,
          order: 'desc'
        }]
      })
    });
    
    const data = await response.json();
    return data.result?.transfers || [];
  }

  async getBalance(address: string): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
    });
    
    const data = await response.json();
    return data.result || '0x0';
  }
}

class MoralisProvider implements BlockchainProvider {
  name = 'Moralis';
  private apiKey = Deno.env.get('MORALIS_API_KEY') || '';
  private baseUrl = 'https://deep-index.moralis.io/api/v2.2';

  async getTransactions(address: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/${address}?chain=eth&limit=100`, {
      headers: { 'X-API-Key': this.apiKey }
    });
    
    const data = await response.json();
    return data.result || [];
  }

  async getBalance(address: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/${address}/balance?chain=eth`, {
      headers: { 'X-API-Key': this.apiKey }
    });
    
    const data = await response.json();
    return data.balance || '0';
  }
}

class BlockchainMonitor {
  private providers: BlockchainProvider[] = [
    new AlchemyProvider(),
    new MoralisProvider()
  ];

  async getWhaleData(address: string) {
    // Try providers in order until one succeeds
    for (const provider of this.providers) {
      try {
        console.log(`Trying ${provider.name} for ${address}`);
        
        const [transactions, balance] = await Promise.all([
          provider.getTransactions(address),
          provider.getBalance(address)
        ]);

        return {
          address,
          transactions: this.normalizeTransactions(transactions),
          balance: this.hexToEth(balance),
          provider: provider.name,
          timestamp: Date.now()
        };
      } catch (error) {
        console.error(`${provider.name} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All blockchain providers failed');
  }

  private normalizeTransactions(transactions: any[]): any[] {
    return transactions.map(tx => ({
      hash: tx.hash || tx.uniqueId,
      from: tx.from,
      to: tx.to,
      value: tx.value || '0',
      timestamp: new Date(tx.metadata?.blockTimestamp || Date.now()).getTime(),
      gasUsed: tx.gasUsed || '0',
      gasPrice: tx.gasPrice || '0',
      asset: tx.asset || 'ETH'
    }));
  }

  private hexToEth(hexValue: string): number {
    return parseInt(hexValue, 16) / Math.pow(10, 18);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const { addresses } = await req.json()
    
    if (!addresses || !Array.isArray(addresses)) {
      throw new Error('Addresses array is required')
    }

    const monitor = new BlockchainMonitor();
    const results = [];

    // Process addresses in parallel
    const promises = addresses.map(async (address: string) => {
      try {
        const whaleData = await monitor.getWhaleData(address);
        
        // Store raw transaction data
        await supabaseClient
          .from('whale_transactions')
          .upsert({
            address: whaleData.address,
            transactions: whaleData.transactions,
            balance: whaleData.balance,
            provider: whaleData.provider,
            last_updated: new Date().toISOString()
          });

        // Trigger classification
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/whale-behavior-engine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify({
            address: whaleData.address,
            transactions: whaleData.transactions
          })
        });

        return whaleData;
      } catch (error) {
        console.error(`Failed to process ${address}:`, error.message);
        return { address, error: error.message };
      }
    });

    const whaleDataResults = await Promise.allSettled(promises);
    
    whaleDataResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({ address: addresses[index], error: result.reason });
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})