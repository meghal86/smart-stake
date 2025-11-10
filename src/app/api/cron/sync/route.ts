/**
 * Cron endpoint for scheduled syncs
 * 
 * This endpoint is called by Vercel Cron to trigger syncs for each source.
 * Uses the sync scheduler with backoff and circuit breaker.
 * 
 * Requirements: 12.1-12.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScheduler, type SyncSource } from '@/lib/sync/scheduler';

/**
 * GET /api/cron/sync?source=<source>
 * 
 * Triggers a sync for the specified source.
 * Protected by CRON_SECRET environment variable.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get source from query params
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') as SyncSource | null;

  if (!source) {
    return NextResponse.json(
      { error: 'Missing source parameter' },
      { status: 400 }
    );
  }

  // Validate source
  const validSources: SyncSource[] = [
    'airdrops',
    'airdrops_upcoming',
    'quests',
    'yield',
    'points',
    'sponsored',
    'community',
  ];

  if (!validSources.includes(source)) {
    return NextResponse.json(
      { error: `Invalid source: ${source}` },
      { status: 400 }
    );
  }

  try {
    // Get scheduler instance
    const scheduler = getScheduler();

    // Execute sync
    const result = await scheduler.executeSync(source);

    // Return result
    return NextResponse.json({
      success: result.success,
      source: result.source,
      itemsProcessed: result.itemsProcessed,
      duration: result.duration,
      timestamp: result.timestamp,
      retryCount: result.retryCount,
      error: result.error,
      circuitBreakerState: scheduler.getCircuitBreakerState(source),
    });
  } catch (error) {
    console.error(`[Cron Sync] Error syncing ${source}:`, error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        source,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/sync/reset
 * 
 * Manually reset circuit breaker for a source.
 * Useful for operations when you know the external service is back up.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { source } = body as { source?: SyncSource };

    if (!source) {
      return NextResponse.json(
        { error: 'Missing source in request body' },
        { status: 400 }
      );
    }

    // Get scheduler instance
    const scheduler = getScheduler();

    // Reset circuit breaker
    scheduler.resetCircuitBreaker(source);

    return NextResponse.json({
      success: true,
      source,
      message: `Circuit breaker reset for ${source}`,
      state: scheduler.getCircuitBreakerState(source),
    });
  } catch (error) {
    console.error('[Cron Sync] Error resetting circuit breaker:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
