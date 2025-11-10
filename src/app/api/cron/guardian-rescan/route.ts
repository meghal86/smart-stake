/**
 * Guardian Staleness Cron Job
 * 
 * This endpoint is called by Vercel Cron to:
 * 1. Find opportunities with stale Guardian scans (>24h old)
 * 2. Queue them for rescan
 * 3. Purge CDN cache for opportunities with category changes
 * 
 * Requirements: 2.9, 8.13
 * Task: 28
 */

import { NextRequest, NextResponse } from 'next/server';
import { listStaleOpportunities, queueRescan, invalidateGuardianCache } from '@/lib/guardian/hunter-integration';
import { supabase } from '@/integrations/supabase/client';

/**
 * Verify the request is from Vercel Cron
 */
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('[Guardian Cron] CRON_SECRET not configured');
    return false;
  }

  if (!authHeader) {
    console.warn('[Guardian Cron] No authorization header');
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  return token === cronSecret;
}

/**
 * Find opportunities whose trust level changed in the last 5 minutes
 * These need CDN cache purging
 */
async function findCategoryFlips(windowMinutes: number = 5): Promise<Array<{ slug: string; oldLevel: string; newLevel: string }>> {
  const cutoffDate = new Date();
  cutoffDate.setMinutes(cutoffDate.getMinutes() - windowMinutes);
  const cutoffTs = cutoffDate.toISOString();

  // Query opportunities that have had trust level changes
  // We'll look for opportunities where the current trust_level differs from the previous scan
  const { data: opportunities, error } = await (supabase as any)
    .from('opportunities')
    .select(`
      id,
      slug,
      trust_level,
      guardian_scans!inner (
        level,
        scanned_at
      )
    `)
    .gte('guardian_scans.scanned_at', cutoffTs)
    .order('guardian_scans(scanned_at)', { ascending: false });

  if (error) {
    console.error('[Guardian Cron] Error finding category flips:', error);
    return [];
  }

  if (!opportunities || opportunities.length === 0) {
    return [];
  }

  const flips: Array<{ slug: string; oldLevel: string; newLevel: string }> = [];

  for (const opp of opportunities) {
    const scans = Array.isArray(opp.guardian_scans) ? opp.guardian_scans : [opp.guardian_scans];
    
    if (scans.length < 2) continue;

    // Sort by scanned_at descending
    const sortedScans = scans.sort((a: any, b: any) => 
      new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
    );

    const latestScan = sortedScans[0];
    const previousScan = sortedScans[1];

    // Check if trust level changed
    if (latestScan.level !== previousScan.level) {
      flips.push({
        slug: opp.slug,
        oldLevel: previousScan.level,
        newLevel: latestScan.level,
      });
    }
  }

  return flips;
}

/**
 * Purge CDN cache for specific opportunity slugs
 * 
 * This is a placeholder implementation. In production, you would:
 * - Call Vercel's cache purge API
 * - Or use Cloudflare's cache purge API
 * - Or use your CDN provider's purge mechanism
 */
async function purgeCDNCache(slugs: string[]): Promise<number> {
  if (slugs.length === 0) {
    return 0;
  }

  console.log(`[Guardian Cron] Would purge CDN cache for ${slugs.length} slugs:`, slugs);

  // TODO: Implement actual CDN cache purging
  // For Vercel, you would use:
  // await fetch(`https://api.vercel.com/v1/purge`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     paths: slugs.map(slug => `/api/hunter/opportunities?slug=${slug}`),
  //   }),
  // });

  // For now, we'll invalidate the Guardian cache for these opportunities
  // This will force fresh data on next request
  const { data: opportunities } = await (supabase as any)
    .from('opportunities')
    .select('id')
    .in('slug', slugs);

  if (opportunities && opportunities.length > 0) {
    const opportunityIds = opportunities.map((o: any) => o.id);
    await invalidateGuardianCache(opportunityIds);
  }

  return slugs.length;
}

/**
 * GET /api/cron/guardian-rescan
 * 
 * Cron job endpoint that:
 * 1. Finds stale opportunities (>24h since last scan)
 * 2. Queues them for rescan
 * 3. Finds opportunities with category changes
 * 4. Purges CDN cache for changed opportunities
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // Verify this is a legitimate cron request
  if (!verifyCronRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[Guardian Cron] Starting Guardian staleness check');

  try {
    // Step 1: Find stale opportunities (>24h old scans)
    const staleOpportunities = await listStaleOpportunities({
      olderThanHours: 24,
      limit: 100, // Process up to 100 per run
    });

    console.log(`[Guardian Cron] Found ${staleOpportunities.length} stale opportunities`);

    // Step 2: Queue each stale opportunity for rescan
    let queuedCount = 0;
    const queueErrors: string[] = [];

    for (const opportunity of staleOpportunities) {
      const success = await queueRescan(opportunity.id);
      if (success) {
        queuedCount++;
      } else {
        queueErrors.push(opportunity.id);
      }
    }

    console.log(`[Guardian Cron] Queued ${queuedCount}/${staleOpportunities.length} opportunities for rescan`);

    if (queueErrors.length > 0) {
      console.warn(`[Guardian Cron] Failed to queue ${queueErrors.length} opportunities:`, queueErrors);
    }

    // Step 3: Find opportunities with category changes in the last 5 minutes
    const categoryFlips = await findCategoryFlips(5);

    console.log(`[Guardian Cron] Found ${categoryFlips.length} opportunities with category changes`);

    // Step 4: Purge CDN cache for changed opportunities
    let purgedCount = 0;
    if (categoryFlips.length > 0) {
      const slugsToPurge = categoryFlips.map(f => f.slug);
      purgedCount = await purgeCDNCache(slugsToPurge);
      
      console.log(`[Guardian Cron] Purged cache for ${purgedCount} opportunities`);
    }

    const duration = Date.now() - startTime;

    // Return success response
    return NextResponse.json({
      success: true,
      stale_found: staleOpportunities.length,
      queued: queuedCount,
      queue_errors: queueErrors.length,
      category_flips: categoryFlips.length,
      cache_purged: purgedCount,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Guardian Cron] Error during execution:', error);
    
    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
