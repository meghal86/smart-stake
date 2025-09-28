import { supabaseAdmin } from '../src/lib/supabase'

async function seedDatabase() {
  console.log('🌱 Starting database seeding...')

  try {
    // Clear existing data
    await supabaseAdmin.from('whale_digest').delete().neq('id', 0)
    await supabaseAdmin.from('whale_index').delete().neq('id', 0)
    await supabaseAdmin.from('token_unlocks').delete().neq('id', 0)

    // Seed whale digest events
    const digestEvents = [
      {
        event_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        asset: 'ETH',
        summary: 'Large ETH transfer to Binance (15,000 ETH)',
        severity: 4,
        source: 'Etherscan'
      },
      {
        event_time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        asset: 'USDT',
        summary: 'USDT Treasury minted 50M tokens',
        severity: 3,
        source: 'Tether Treasury'
      },
      {
        event_time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        asset: 'BTC',
        summary: 'Bitcoin whale moved 1,200 BTC to cold storage',
        severity: 2,
        source: 'Bitcoin Explorer'
      },
      {
        event_time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        asset: 'SOL',
        summary: 'Solana whale transferred 500K SOL to exchange',
        severity: 5,
        source: 'Solscan'
      },
      {
        event_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        asset: 'AVAX',
        summary: 'Avalanche whale staked 2M AVAX tokens',
        severity: 1,
        source: 'Avalanche Explorer'
      },
      {
        event_time: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
        asset: 'MATIC',
        summary: 'Polygon whale moved 10M MATIC to DeFi protocol',
        severity: 3,
        source: 'PolygonScan'
      }
    ]

    const { error: digestError } = await supabaseAdmin
      .from('whale_digest')
      .insert(digestEvents)

    if (digestError) {
      console.error('Error seeding whale_digest:', digestError)
    } else {
      console.log('✅ Seeded whale_digest table')
    }

    // Seed whale index
    const today = new Date().toISOString().split('T')[0]
    const whaleIndexData = {
      date: today,
      score: 67,
      label: 'Elevated'
    }

    const { error: indexError } = await supabaseAdmin
      .from('whale_index')
      .insert(whaleIndexData)

    if (indexError) {
      console.error('Error seeding whale_index:', indexError)
    } else {
      console.log('✅ Seeded whale_index table')
    }

    // Seed token unlocks
    const tokenUnlocks = [
      {
        token: 'APT',
        chain: 'Aptos',
        unlock_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        amount_usd: 25000000,
        source: 'TokenUnlocks'
      },
      {
        token: 'DYDX',
        chain: 'Ethereum',
        unlock_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        amount_usd: 15000000,
        source: 'TokenUnlocks'
      },
      {
        token: 'SUI',
        chain: 'Sui',
        unlock_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        amount_usd: 8000000,
        source: 'TokenUnlocks'
      }
    ]

    const { error: unlocksError } = await supabaseAdmin
      .from('token_unlocks')
      .insert(tokenUnlocks)

    if (unlocksError) {
      console.error('Error seeding token_unlocks:', unlocksError)
    } else {
      console.log('✅ Seeded token_unlocks table')
    }

    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

// Run the seed function
seedDatabase()
