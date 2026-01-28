/**
 * Yield Sync API Route
 * 
 * POST /api/sync/yield
 * 
 * Fetches yield opportunities from DeFiLlama and upserts them into the database.
 * Protected by CRON_SECRET for scheduled job execution.
 * 
 * Requirements: 2.1, 2.7, 2.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncYieldOpportunities } from '@/lib/hunter/sync/defillama';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate CRON_SECRET
    const secret = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error('[Sync/Yield] CRON_SECRET not configured');
      return NextResponse.json(
        {
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'Sync job not configured',
          },
        },
        { status: 500 }
      );
    }

    if (secret !== expectedSecret) {
      console.warn('[Sync/Yield] Invalid CRON_SECRET attempt');
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid cron secret',
          },
        },
        { status: 401 }
      );
    }

    // Execute sync
    console.log('[Sync/Yield] Starting sync job');
    const result = await syncYieldOpportunities();

    const duration = Date.now() - startTime;
    console.log(`[Sync/Yield] Completed in ${duration}ms: ${result.count} opportunities synced`);

    // Return result
    return NextResponse.json({
      ...result,
      ts: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Sync/Yield] Sync failed:', errorMessage);

    return NextResponse.json(
      {
        error: {
          code: 'SYNC_FAILED',
          message: errorMessage,
        },
        duration_ms: duration,
        ts: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Disable body parsing for this route (not needed for sync jobs)
export const config = {
  api: {
    bodyParser: false,
  },
};
