// Insert NFT Collections
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rebeznxivaxgserswhbn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlYmV6bnhpdmF4Z3NlcnN3aGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MDc0NDIsImV4cCI6MjA3MDk4MzQ0Mn0.u2t2SEmm3rTpseRRdgym3jnaOq7lRLHW531PxPmu6xo'
)

async function insertNFTCollections() {
  console.log('🖼️ Inserting NFT Collections...')

  const collections = [
    {
      contract_address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      name: 'Bored Ape Yacht Club',
      slug: 'boredapeyachtclub',
      is_monitored: true,
      whale_threshold_usd: 100000
    },
    {
      contract_address: '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
      name: 'Mutant Ape Yacht Club',
      slug: 'mutant-ape-yacht-club',
      is_monitored: true,
      whale_threshold_usd: 50000
    },
    {
      contract_address: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
      name: 'Azuki',
      slug: 'azuki',
      is_monitored: true,
      whale_threshold_usd: 75000
    },
    {
      contract_address: '0x23581767a106ae21c074b2276D25e5C3e136a68b',
      name: 'Moonbirds',
      slug: 'proof-moonbirds',
      is_monitored: true,
      whale_threshold_usd: 60000
    }
  ]

  try {
    const { data, error } = await supabase
      .from('nft_collections')
      .upsert(collections, { onConflict: 'contract_address' })
      .select()

    if (error) {
      console.error('❌ Error inserting NFT collections:', error)
    } else {
      console.log('✅ Successfully inserted', data.length, 'NFT collections')
      data.forEach(collection => {
        console.log(`  - ${collection.name} (${collection.slug})`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

insertNFTCollections()