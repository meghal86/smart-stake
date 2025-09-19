import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateSampleAlerts() {
  try {
    // First, get real data from the whale-alerts API
    const { data: apiData, error: apiError } = await supabase.functions.invoke('whale-alerts');
    
    if (apiError) {
      console.error('API Error:', apiError);
      return;
    }

    console.log(`Got ${apiData.transactions?.length || 0} transactions from API`);

    // Transform and insert the first 20 transactions into the database
    const transactions = apiData.transactions?.slice(0, 20) || [];
    
    const alertsToInsert = transactions.map(tx => ({
      tx_hash: tx.hash,
      from_addr: tx.from?.address || '0x0000000000000000000000000000000000000000',
      to_addr: tx.to?.address || '0x0000000000000000000000000000000000000000',
      amount_usd: tx.amount_usd,
      token: tx.symbol?.toUpperCase() || 'UNKNOWN',
      chain: tx.blockchain || 'unknown',
      detected_at: new Date(tx.timestamp * 1000).toISOString()
    }));

    console.log('Inserting alerts into database...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('alerts')
      .insert(alertsToInsert)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return;
    }

    console.log(`Successfully inserted ${insertData?.length || 0} alerts`);
    
    // Verify the data
    const { data: verifyData, error: verifyError } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (verifyError) {
      console.error('Verify error:', verifyError);
      return;
    }

    console.log('\nLatest 5 alerts in database:');
    verifyData?.forEach((alert, i) => {
      console.log(`${i + 1}. ${alert.token} - $${alert.amount_usd} - ${alert.chain} - ${alert.timestamp}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

populateSampleAlerts();