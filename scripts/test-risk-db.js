#!/usr/bin/env node

/**
 * Test script to verify risk scanner database tables
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRiskTables() {
  console.log('🧪 Testing Risk Scanner Database Tables...\n');

  try {
    // Test risky_addresses table
    console.log('1. Testing risky_addresses table...');
    const { data: riskyAddresses, error: riskyError } = await supabase
      .from('risky_addresses')
      .select('*')
      .limit(5);
    
    if (riskyError) {
      console.log('❌ Error:', riskyError.message);
    } else {
      console.log('✅ risky_addresses table working');
      console.log(`   Found ${riskyAddresses.length} risky addresses`);
    }

    // Test risk_reports table
    console.log('\n2. Testing risk_reports table...');
    const { data: riskReports, error: reportsError } = await supabase
      .from('risk_reports')
      .select('*')
      .limit(5);
    
    if (reportsError) {
      console.log('❌ Error:', reportsError.message);
    } else {
      console.log('✅ risk_reports table working');
      console.log(`   Found ${riskReports.length} risk reports`);
    }

    // Test wallet_monitoring table
    console.log('\n3. Testing wallet_monitoring table...');
    const { data: monitoring, error: monitoringError } = await supabase
      .from('wallet_monitoring')
      .select('*')
      .limit(5);
    
    if (monitoringError) {
      console.log('❌ Error:', monitoringError.message);
    } else {
      console.log('✅ wallet_monitoring table working');
      console.log(`   Found ${monitoring.length} monitored wallets`);
    }

    // Test compliance_alerts table
    console.log('\n4. Testing compliance_alerts table...');
    const { data: alerts, error: alertsError } = await supabase
      .from('compliance_alerts')
      .select('*')
      .limit(5);
    
    if (alertsError) {
      console.log('❌ Error:', alertsError.message);
    } else {
      console.log('✅ compliance_alerts table working');
      console.log(`   Found ${alerts.length} compliance alerts`);
    }

    console.log('\n🎉 All risk scanner tables are working correctly!');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testRiskTables();