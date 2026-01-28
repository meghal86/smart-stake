/**
 * Airdrops Sync Orchestrator
 * 
 * Combines airdrops from multiple sources (Galxe, DeFiLlama, admin seeds)
 * with deduplication logic.
 * 
 * Requirements: 2.2, 21.1-21.10, 23.1-23.6
 */

import { createClient } from '@supabase/supabase-js';
import { syncGalxeOpportunities, type SyncOpportunity } from './galxe';
import { syncDefiLlamaAirdrops } from './defillama-airdrops';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface AirdropSyncResult {
  count: number;
  sources: string[];
  breakdown: {
    galxe: number;
    defillama: number;
    admin: number;
  };
  duration_ms: number;
  errors?: string[];
}

/**
 * Get admin-seeded airdrops from database
 */
async function getAdminAirdrops(): Promise<SyncOpportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('type', 'airdrop')
      .eq('source', 'admin');

    if (error) {
      console.error('❌ Error fetching admin airdrops:', error);
      return [];
    }

    console.log(`✅ Fetched ${data?.length || 0} admin airdrops`);
    return (data || []) as SyncOpportunity[];
  } catch (error) {
    console.error('❌ Error fetching admin airdrops:', error);
    return [];
  }
}

/**
 * Deduplicate airdrops from multiple sources
 * 
 * Priority order (highest trust first):
 * 1. DeFiLlama (trust_score = 90)
 * 2. Admin (trust_score = 95 for curated, but lower volume)
 * 3. Galxe (trust_score = 85)
 * 
 * Deduplication key: protocol.name + chains[0]
 */
function deduplicateAirdrops(
  galxe: SyncOpportunity[],
  defillama: SyncOpportunity[],
  admin: SyncOpportunity[]
): SyncOpportunity[] {
  const map = new Map<string, SyncOpportunity>();

  // Process in reverse priority order (lowest to highest)
  
  // 1. Galxe (lowest priority)
  for (const opp of galxe) {
    const key = `${opp.protocol_name}-${opp.chains[0]}`;
    map.set(key, opp);
  }

  // 2. Admin (medium priority - curated but may overlap)
  for (const opp of admin) {
    const key = `${opp.protocol_name}-${opp.chains[0]}`;
    // Only override if Galxe or not exists
    if (!map.has(key) || map.get(key)!.source === 'galxe') {
      map.set(key, opp);
    }
  }

  // 3. DeFiLlama (highest priority - most trusted)
  for (const opp of defillama) {
    const key = `${opp.protocol_name}-${opp.chains[0]}`;
    // Always use DeFiLlama if exists (highest trust)
    map.set(key, opp);
  }

  return Array.from(map.values());
}

/**
 * Sync all airdrops from multiple sources
 */
export async function syncAllAirdrops(): Promise<AirdropSyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  console.log('🔄 Starting airdrop sync from all sources...\n');

  // Fetch from all sources in parallel
  const [galxeResult, defiLlamaAirdrops, adminAirdrops] = await Promise.all([
    syncGalxeOpportunities(5).catch(error => {
      errors.push(`Galxe sync failed: ${error.message}`);
      return { airdrops: [], quests: [], total_fetched: 0, pages_fetched: 0 };
    }),
    syncDefiLlamaAirdrops().catch(error => {
      errors.push(`DeFiLlama sync failed: ${error.message}`);
      return [];
    }),
    getAdminAirdrops().catch(error => {
      errors.push(`Admin airdrops fetch failed: ${error.message}`);
      return [];
    }),
  ]);

  const galxeAirdrops = galxeResult.airdrops;

  console.log('\n📊 Source breakdown:');
  console.log(`  - Galxe: ${galxeAirdrops.length} airdrops`);
  console.log(`  - DeFiLlama: ${defiLlamaAirdrops.length} airdrops`);
  console.log(`  - Admin: ${adminAirdrops.length} airdrops`);

  // Deduplicate across sources
  const dedupedAirdrops = deduplicateAirdrops(galxeAirdrops, defiLlamaAirdrops, adminAirdrops);

  console.log(`\n🔄 After deduplication: ${dedupedAirdrops.length} unique airdrops`);

  // Upsert to database
  let upsertCount = 0;
  for (const airdrop of dedupedAirdrops) {
    try {
      const { error } = await supabase
        .from('opportunities')
        .upsert(
          {
            ...airdrop,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'source,source_ref',
          }
        );

      if (error) {
        errors.push(`Failed to upsert ${airdrop.title}: ${error.message}`);
      } else {
        upsertCount++;
      }
    } catch (error) {
      errors.push(`Failed to upsert ${airdrop.title}: ${error}`);
    }
  }

  const duration_ms = Date.now() - startTime;

  console.log(`\n✅ Upserted ${upsertCount} airdrops to database`);
  console.log(`⏱️  Duration: ${duration_ms}ms`);

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors occurred:`);
    errors.forEach(err => console.log(`  - ${err}`));
  }

  return {
    count: upsertCount,
    sources: ['galxe', 'defillama', 'admin'],
    breakdown: {
      galxe: galxeAirdrops.length,
      defillama: defiLlamaAirdrops.length,
      admin: adminAirdrops.length,
    },
    duration_ms,
    errors: errors.length > 0 ? errors : undefined,
  };
}
