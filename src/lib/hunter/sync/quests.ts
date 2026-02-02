/**
 * Quests Sync Orchestrator
 * 
 * Combines quests from multiple sources (Galxe, admin seeds)
 * with deduplication logic.
 * 
 * Requirements: 2.3, 21.1-21.10
 */

import { createClient } from '@supabase/supabase-js';
import { syncGalxeOpportunities, type SyncOpportunity } from './galxe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface QuestSyncResult {
  count: number;
  sources: string[];
  breakdown: {
    galxe: number;
    admin: number;
  };
  duration_ms: number;
  errors?: string[];
}

/**
 * Get admin-seeded quests from database
 */
async function getAdminQuests(): Promise<SyncOpportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('type', 'quest')
      .eq('source', 'admin');

    if (error) {
      console.error('❌ Error fetching admin quests:', error);
      return [];
    }

    console.log(`✅ Fetched ${data?.length || 0} admin quests`);
    return (data || []) as SyncOpportunity[];
  } catch (error) {
    console.error('❌ Error fetching admin quests:', error);
    return [];
  }
}

/**
 * Deduplicate quests from multiple sources
 * 
 * Priority order (highest trust first):
 * 1. Admin (trust_score = 95 for curated)
 * 2. Galxe (trust_score = 85)
 * 
 * Deduplication key: protocol.name + chains[0]
 */
function deduplicateQuests(
  galxe: SyncOpportunity[],
  admin: SyncOpportunity[]
): SyncOpportunity[] {
  const map = new Map<string, SyncOpportunity>();

  // Process in reverse priority order (lowest to highest)
  
  // 1. Galxe (lowest priority)
  for (const opp of galxe) {
    const key = `${opp.protocol_name}-${opp.chains[0]}`;
    map.set(key, opp);
  }

  // 2. Admin (highest priority - curated)
  for (const opp of admin) {
    const key = `${opp.protocol_name}-${opp.chains[0]}`;
    // Always use admin if exists (highest trust)
    map.set(key, opp);
  }

  return Array.from(map.values());
}

/**
 * Sync all quests from multiple sources
 */
export async function syncAllQuests(): Promise<QuestSyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  console.log('🔄 Starting quest sync from all sources...\n');

  // Fetch from all sources in parallel
  const [galxeResult, adminQuests] = await Promise.all([
    syncGalxeOpportunities(5).catch(error => {
      errors.push(`Galxe sync failed: ${error.message}`);
      return { airdrops: [], quests: [], total_fetched: 0, pages_fetched: 0 };
    }),
    getAdminQuests().catch(error => {
      errors.push(`Admin quests fetch failed: ${error.message}`);
      return [];
    }),
  ]);

  const galxeQuests = galxeResult.quests;

  console.log('\n📊 Source breakdown:');
  console.log(`  - Galxe: ${galxeQuests.length} quests`);
  console.log(`  - Admin: ${adminQuests.length} quests`);

  // Deduplicate across sources
  const dedupedQuests = deduplicateQuests(galxeQuests, adminQuests);

  console.log(`\n🔄 After deduplication: ${dedupedQuests.length} unique quests`);

  // Upsert to database
  let upsertCount = 0;
  for (const quest of dedupedQuests) {
    try {
      const { error } = await supabase
        .from('opportunities')
        .upsert(
          {
            ...quest,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'source,source_ref',
          }
        );

      if (error) {
        errors.push(`Failed to upsert ${quest.title}: ${error.message}`);
      } else {
        upsertCount++;
      }
    } catch (error) {
      errors.push(`Failed to upsert ${quest.title}: ${error}`);
    }
  }

  const duration_ms = Date.now() - startTime;

  console.log(`\n✅ Upserted ${upsertCount} quests to database`);
  console.log(`⏱️  Duration: ${duration_ms}ms`);

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors occurred:`);
    errors.forEach(err => console.log(`  - ${err}`));
  }

  return {
    count: upsertCount,
    sources: ['galxe', 'admin'],
    breakdown: {
      galxe: galxeQuests.length,
      admin: adminQuests.length,
    },
    duration_ms,
    errors: errors.length > 0 ? errors : undefined,
  };
}
