import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAlerts() {
  try {
    // Check alerts table
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching alerts:', error);
      return;
    }

    console.log(`Found ${alerts?.length || 0} alerts in database:`);
    if (alerts && alerts.length > 0) {
      alerts.forEach((alert, i) => {
        console.log(`${i + 1}. ${alert.token} - $${alert.amount_usd} - ${alert.chain} - ${alert.created_at}`);
      });
    } else {
      console.log('No alerts found in database');
    }

    // Check if whale-alerts function works
    console.log('\nTesting whale-alerts function...');
    const { data: functionData, error: functionError } = await supabase.functions.invoke('whale-alerts');
    
    if (functionError) {
      console.error('Function error:', functionError);
    } else {
      console.log('Function response:', functionData);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAlerts();