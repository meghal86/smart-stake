#!/usr/bin/env node

/**
 * Whale Monitoring Setup Script
 * Sets up live whale behavior analytics with blockchain data providers
 */

const { createClient } = require('@supabase/supabase-js');

const WHALE_ADDRESSES = [
  '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503', // Binance Hot Wallet
  '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a', // Bitfinex Hot Wallet  
  '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Huobi Hot Wallet
  '0x1522900b6dafac587d499a862861c0869be6e428', // Large ETH Holder
  '0x4e9ce36e442e55ecd9025b9a6e0d88485d628a67', // DeFi Whale
];

async function setupWhaleMonitoring() {
  console.log('🐋 Setting up Whale Behavior Analytics...\n');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Run database migrations
    console.log('📊 Setting up database tables...');
    // Migrations are handled by Supabase CLI
    
    // 2. Deploy Edge Functions
    console.log('🚀 Deploying Edge Functions...');
    console.log('Run: supabase functions deploy whale-behavior-engine');
    console.log('Run: supabase functions deploy blockchain-monitor');
    console.log('Run: supabase functions deploy whale-analytics\n');

    // 3. Set up environment secrets
    console.log('🔐 Setting up secrets...');
    console.log('Run these commands:');
    console.log('supabase secrets set ALCHEMY_API_KEY="your-alchemy-key"');
    console.log('supabase secrets set MORALIS_API_KEY="your-moralis-key"');
    console.log('supabase secrets set INFURA_PROJECT_ID="your-infura-id"\n');

    // 4. Initialize whale monitoring
    console.log('🔍 Initializing whale monitoring for sample addresses...');
    
    const { data, error } = await supabase.functions.invoke('blockchain-monitor', {
      body: { addresses: WHALE_ADDRESSES }
    });

    if (error) {
      console.error('❌ Error initializing monitoring:', error);
    } else {
      console.log('✅ Successfully initialized monitoring for', data.processed, 'addresses');
    }

    // 5. Set up periodic monitoring (cron job)
    console.log('\n⏰ Setting up periodic monitoring...');
    console.log('Add this to your cron jobs (every 10 minutes):');
    console.log('*/10 * * * * curl -X POST "https://your-project.supabase.co/functions/v1/blockchain-monitor" -H "Authorization: Bearer YOUR_ANON_KEY" -d \'{"addresses":' + JSON.stringify(WHALE_ADDRESSES) + '}\'');

    console.log('\n🎉 Whale Behavior Analytics setup complete!');
    console.log('\nNext steps:');
    console.log('1. Get API keys from Alchemy/Moralis');
    console.log('2. Deploy the Edge Functions');
    console.log('3. Set up the secrets');
    console.log('4. Configure periodic monitoring');
    console.log('5. Test the whale analytics endpoint');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupWhaleMonitoring();
}

module.exports = { setupWhaleMonitoring, WHALE_ADDRESSES };