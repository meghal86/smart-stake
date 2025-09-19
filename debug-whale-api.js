import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWhaleAPI() {
  try {
    console.log('Testing whale-alerts function...');
    
    const { data, error } = await supabase.functions.invoke('whale-alerts');
    
    console.log('Response data:', JSON.stringify(data, null, 2));
    console.log('Response error:', error);
    
    if (data?.transactions) {
      console.log(`\nFound ${data.transactions.length} transactions`);
      console.log('First transaction:', data.transactions[0]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugWhaleAPI();