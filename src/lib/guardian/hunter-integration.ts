/**
 * Guardian Integration Service for Hunter Screen
 * 
 * Provides batch Guardian summary fetching, caching, and staleness detection
 * for opportunity cards in the Hunter Screen feed.
 * 
 * Requirements: 2.1-2.8, 2.9
 * Task: 10
 */

import { supabase } from '@/integrations/supabase/client';
import { cacheGet, cacheSet, cacheMGet, cacheMSet } from '@/lib/redis/cache';
import { RedisKeys, RedisTTL } from '@/lib/redis/keys';

/**
 * Guardian summary for an opportunity
 */
export interface GuardianSummary {
  opportunityId: string;
  score: number;
  level: 'green' | 'amber' | 'red';
  lastScannedTs: string;
  topIssues: string[];
}

/**
 * Stale opportunity that needs rescanning
 */
export interface StaleOpportunity {
  id: string;
  slug: string;
  lastScannedTs: string;
  hoursSinceLastScan: number;
}

/**
 * Get Guardian summaries for multiple opportunities (batch fetch)
 * 
 * This function:
 * 1. Checks Redis cache for each opportunity
 * 2. Fetches missing data from database
 * 3. Caches results in Redis with 1 hour TTL
 * 
 * @param opportunityIds - Array of opportunity UUIDs
 * @returns Map of opportunity ID to Guardian summary
 */
export async function getGuardianSummary(
  opportunityIds: string[]
): Promise<Map<string, GuardianSummary>> {
  const result = new Map<string, GuardianSummary>();
  
  if (opportunityIds.length === 0) {
    return result;
  }

  // Step 1: Check Redis cache for all opportunities
  const cacheKeys = opportunityIds.map(id => RedisKeys.guardianScan(id));
  const cachedData = await cacheMGet<GuardianSummary>(cacheKeys);
  
  const missingIds: string[] = [];
  
  opportunityIds.forEach((id, index) => {
    const cached = cachedData.get(cacheKeys[index]);
    if (cached) {
      result.set(id, cached);
    } else {
      missingIds.push(id);
    }
  });

  // If all data was cached, return early
  if (missingIds.length === 0) {
    console.log(`[Guardian] All ${opportunityIds.length} summaries served from cache`);
    return result;
  }

  console.log(`[Guardian] Cache miss for ${missingIds.length}/${opportunityIds.length} opportunities, fetching from DB`);

  // Step 2: Fetch missing data from database
  // Get the latest Guardian scan for each opportunity
  const { data: scans, error } = await supabase
    .from('guardian_scans')
    .select('opportunity_id, score, level, issues, scanned_at')
    .in('opportunity_id', missingIds)
    .order('scanned_at', { ascending: false });

  if (error) {
    console.error('[Guardian] Error fetching scans from database:', error);
    return result;
  }

  if (!scans || scans.length === 0) {
    console.log('[Guardian] No scans found in database for missing opportunities');
    return result;
  }

  // Group scans by opportunity_id and take the most recent
  const latestScans = new Map<string, typeof scans[0]>();
  
  for (const scan of scans) {
    const existing = latestScans.get(scan.opportunity_id);
    if (!existing || new Date(scan.scanned_at) > new Date(existing.scanned_at)) {
      latestScans.set(scan.opportunity_id, scan);
    }
  }

  // Step 3: Transform and cache results
  const cacheEntries: Array<[string, GuardianSummary, number]> = [];

  for (const [opportunityId, scan] of latestScans.entries()) {
    const issues = Array.isArray(scan.issues) ? scan.issues : [];
    const topIssues = issues
      .slice(0, 3)
      .map((issue: unknown) => issue.type || issue.message || 'Unknown issue');

    const summary: GuardianSummary = {
      opportunityId,
      score: scan.score,
      level: scan.level as 'green' | 'amber' | 'red',
      lastScannedTs: scan.scanned_at,
      topIssues,
    };

    result.set(opportunityId, summary);
    
    // Prepare for batch cache set
    cacheEntries.push([
      RedisKeys.guardianScan(opportunityId),
      summary,
      RedisTTL.guardianScan,
    ]);
  }

  // Batch cache the results
  if (cacheEntries.length > 0) {
    await cacheMSet(cacheEntries);
    console.log(`[Guardian] Cached ${cacheEntries.length} summaries in Redis`);
  }

  console.log(`[Guardian] Returning ${result.size} summaries (${opportunityIds.length - result.size} not found)`);
  
  return result;
}

/**
 * List opportunities with stale Guardian scans (>24h old)
 * 
 * This function finds opportunities that need rescanning based on:
 * - Last scan timestamp is older than the specified threshold
 * - Opportunity is still published and not expired
 * 
 * @param options - Configuration options
 * @returns Array of stale opportunities
 */
export async function listStaleOpportunities(options: {
  olderThanHours?: number;
  limit?: number;
} = {}): Promise<StaleOpportunity[]> {
  const { olderThanHours = 24, limit = 100 } = options;
  
  // Calculate the cutoff timestamp
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);
  const cutoffTs = cutoffDate.toISOString();

  console.log(`[Guardian] Finding opportunities with scans older than ${cutoffTs} (${olderThanHours}h ago)`);

  // Query opportunities with stale scans
  // We need to join with guardian_scans to get the last scan timestamp
  const { data: opportunities, error } = await supabase
    .from('opportunities')
    .select(`
      id,
      slug,
      status,
      expires_at,
      guardian_scans!inner (
        scanned_at
      )
    `)
    .eq('status', 'published')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('guardian_scans(scanned_at)', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[Guardian] Error fetching stale opportunities:', error);
    return [];
  }

  if (!opportunities || opportunities.length === 0) {
    console.log('[Guardian] No opportunities found');
    return [];
  }

  // Filter and transform results
  const staleOpportunities: StaleOpportunity[] = [];
  
  for (const opp of opportunities) {
    // Get the most recent scan for this opportunity
    const scans = Array.isArray(opp.guardian_scans) ? opp.guardian_scans : [opp.guardian_scans];
    if (scans.length === 0) continue;
    
    // Sort by scanned_at descending to get the latest
    const sortedScans = scans.sort((a: unknown, b: unknown) => 
      new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
    );
    
    const lastScan = sortedScans[0];
    const lastScannedDate = new Date(lastScan.scanned_at);
    
    // Check if it's stale
    if (lastScannedDate < cutoffDate) {
      const hoursSinceLastScan = Math.floor(
        (Date.now() - lastScannedDate.getTime()) / (1000 * 60 * 60)
      );
      
      staleOpportunities.push({
        id: opp.id,
        slug: opp.slug,
        lastScannedTs: lastScan.scanned_at,
        hoursSinceLastScan,
      });
    }
  }

  console.log(`[Guardian] Found ${staleOpportunities.length} stale opportunities`);
  
  return staleOpportunities;
}

/**
 * Queue an opportunity for Guardian rescan
 * 
 * This function adds an opportunity to the Guardian rescan queue.
 * The actual rescanning is handled by a cron job (Task 28).
 * 
 * For now, this creates a placeholder record that the cron job will process.
 * 
 * @param opportunityId - Opportunity UUID to rescan
 * @returns Success status
 */
export async function queueRescan(opportunityId: string): Promise<boolean> {
  try {
    // For now, we'll use a simple approach: create a marker in Redis
    // The cron job will check for these markers and process them
    const queueKey = `guardian:rescan:queue:${opportunityId}`;
    const queueData = {
      opportunityId,
      queuedAt: new Date().toISOString(),
      status: 'pending',
    };
    
    // Set with 48 hour TTL (gives plenty of time for cron to process)
    const success = await cacheSet(queueKey, queueData, { ttl: 48 * 60 * 60 });
    
    if (success) {
      console.log(`[Guardian] Queued opportunity ${opportunityId} for rescan`);
    } else {
      console.warn(`[Guardian] Failed to queue opportunity ${opportunityId} for rescan`);
    }
    
    return success;
  } catch (error) {
    console.error(`[Guardian] Error queueing rescan for ${opportunityId}:`, error);
    return false;
  }
}

/**
 * Invalidate Guardian cache for specific opportunities
 * 
 * This should be called when:
 * - A new Guardian scan completes
 * - Trust score changes category (green ↔ amber ↔ red)
 * 
 * @param opportunityIds - Array of opportunity UUIDs
 * @returns Number of cache entries invalidated
 */
export async function invalidateGuardianCache(
  opportunityIds: string[]
): Promise<number> {
  if (opportunityIds.length === 0) {
    return 0;
  }

  const keys = opportunityIds.map(id => RedisKeys.guardianScan(id));
  
  try {
    const { cacheDel } = await import('@/lib/redis/cache');
    const deleted = await cacheDel(keys);
    
    console.log(`[Guardian] Invalidated ${deleted} cache entries`);
    return deleted;
  } catch (error) {
    console.error('[Guardian] Error invalidating cache:', error);
    return 0;
  }
}

/**
 * Get Guardian summary for a single opportunity (convenience wrapper)
 * 
 * @param opportunityId - Opportunity UUID
 * @returns Guardian summary or null if not found
 */
export async function getGuardianSummarySingle(
  opportunityId: string
): Promise<GuardianSummary | null> {
  const summaries = await getGuardianSummary([opportunityId]);
  return summaries.get(opportunityId) || null;
}

/**
 * Check if an opportunity needs rescanning
 * 
 * @param opportunityId - Opportunity UUID
 * @param thresholdHours - Hours threshold (default: 24)
 * @returns True if needs rescanning
 */
export async function needsRescan(
  opportunityId: string,
  thresholdHours: number = 24
): Promise<boolean> {
  const summary = await getGuardianSummarySingle(opportunityId);
  
  if (!summary) {
    return true; // No scan found, needs scanning
  }
  
  const lastScannedDate = new Date(summary.lastScannedTs);
  const hoursSinceLastScan = (Date.now() - lastScannedDate.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastScan > thresholdHours;
}
