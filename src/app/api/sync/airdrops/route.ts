/**
 * Airdrop Sync API Route
 * 
 * POST /api/sync/airdrops
 * 
 * Syncs airdrops from multiple sources (Galxe, DeFiLlama, admin seeds).
 * Requires CRON_SECRET for authorization.
 * 
 * Requirements: 2.2, 2.8, 21.1-21.10, 23.1-23.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllAirdrops } from '@/lib/hunter/sync/airdrops';

export async function POST(req: NextRequest) {
  // Validate CRON_SECRET
  const secret = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      {
        error: {
          code: 'MISCONFIGURED',
          message: 'CRON_SECRET not configured',
        },
      },
      { status: 500 }
    );
  }

  if (secret !== expectedSecret) {
    console.warn('⚠️ Unauthorized airdrop sync attempt');
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

  try {
    const result = await syncAllAirdrops();

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Airdrop sync failed:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Airdrop sync failed',
        },
      },
      { status: 500 }
    );
  }
}
