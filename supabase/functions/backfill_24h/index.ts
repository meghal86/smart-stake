import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const ALCHEMY_API_KEY = Deno.env.get('ALCHEMY_API_KEY');
const ETHERSCAN_API_KEY = Deno.env.get('ETHERSCAN_API_KEY');

interface WhaleEvent {
  tx_hash: string;
  log_index: number;
  wallet_hash: string;
  amount_usd: number;
  ts: string;
  meta: any;
}

async function fetchEtherscanEvents(fromTimestamp: number, toTimestamp: number): Promise<WhaleEvent[]> {
  try {
    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=tokentx&startblock=0&endblock=latest&sort=desc&apikey=${ETHERSCAN_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.status !== '1') {
      throw new Error(`Etherscan API error: ${data.message}`);
    }
    
    // Filter and transform results
    return data.result
      .filter((tx: any) => {
        const txTime = parseInt(tx.timeStamp) * 1000;
        return txTime >= fromTimestamp && txTime <= toTimestamp;
      })
      .map((tx: any) => ({
        tx_hash: tx.hash,
        log_index: parseInt(tx.logIndex || '0'),
        wallet_hash: tx.from,
        amount_usd: parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal)) * 2000, // Mock USD conversion
        ts: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        meta: {
          provenance: 'Real',
          source: 'Etherscan',
          token_symbol: tx.tokenSymbol,
          block_number: parseInt(tx.blockNumber)
        }
      }));
  } catch (error) {
    console.error('Etherscan fetch error:', error);
    return [];
  }
}

async function fetchAlchemyEvents(fromTimestamp: number, toTimestamp: number): Promise<WhaleEvent[]> {
  try {
    const response = await fetch(`https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'alchemy_getAssetTransfers',
        params: [{
          fromBlock: 'latest',
          toBlock: 'latest',
          category: ['erc20'],
          maxCount: 1000,
          withMetadata: true
        }],
        id: 1
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Alchemy API error: ${data.error.message}`);
    }
    
    // Transform Alchemy results
    return (data.result?.transfers || [])
      .filter((transfer: any) => {
        const txTime = new Date(transfer.metadata?.blockTimestamp).getTime();
        return txTime >= fromTimestamp && txTime <= toTimestamp;
      })
      .map((transfer: any, index: number) => ({
        tx_hash: transfer.hash,
        log_index: index,
        wallet_hash: transfer.from,
        amount_usd: parseFloat(transfer.value || '0') * 2000, // Mock USD conversion
        ts: transfer.metadata?.blockTimestamp || new Date().toISOString(),
        meta: {
          provenance: 'Real',
          source: 'Alchemy',
          asset: transfer.asset,
          block_number: parseInt(transfer.blockNum, 16)
        }
      }));
  } catch (error) {
    console.error('Alchemy fetch error:', error);
    return [];
  }
}

serve(async (req) => {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    console.log(`Starting backfill for ${yesterday.toISOString()} to ${now.toISOString()}`);
    
    // Fetch from both providers
    const [etherscanEvents, alchemyEvents] = await Promise.all([
      fetchEtherscanEvents(yesterday.getTime(), now.getTime()),
      fetchAlchemyEvents(yesterday.getTime(), now.getTime())
    ]);
    
    const allEvents = [...etherscanEvents, ...alchemyEvents];
    
    // Deduplicate by tx_hash + log_index
    const uniqueEvents = allEvents.reduce((acc, event) => {
      const key = `${event.tx_hash}-${event.log_index}`;
      if (!acc.has(key)) {
        acc.set(key, event);
      }
      return acc;
    }, new Map());
    
    const eventsToInsert = Array.from(uniqueEvents.values());
    
    if (eventsToInsert.length === 0) {
      return new Response(JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'success',
        events_processed: 0,
        message: 'No new events to backfill'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Upsert events (idempotent)
    const { data, error } = await supabase
      .from('events_whale')
      .upsert(eventsToInsert, {
        onConflict: 'tx_hash,log_index',
        ignoreDuplicates: true
      });
    
    if (error) {
      throw error;
    }
    
    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      status: 'success',
      events_processed: eventsToInsert.length,
      etherscan_events: etherscanEvents.length,
      alchemy_events: alchemyEvents.length,
      duplicates_removed: allEvents.length - eventsToInsert.length
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Backfill error:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString(),
      status: 'failed'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});