/**
 * Quest Sync API Route
 * 
 * Syncs quests from Galxe and admin seeds.
 * Requires CRON_SECRET for authorization.
 * 
 * Requirements: 2.3, 21.1-21.10
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncAllQuests } from '@/lib/hunter/sync/quests';

export async function POST(req: NextRequest) {
  // Validate CRON_SECRET
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  try {
    const result = await syncAllQuests();
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Quest sync failed:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'Quest sync failed',
        },
      },
      { status: 500 }
    );
  }
}
