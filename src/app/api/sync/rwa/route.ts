/**
 * RWA Sync API Route (Stub)
 * 
 * This is a stub endpoint for RWA vault sync jobs.
 * Currently uses admin-seeded data from scripts/seed-rwa.ts
 * 
 * Future: Integrate with RWA.xyz API or other RWA data providers
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Validate CRON_SECRET
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
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

  // Stub response - admin seeding required
  return NextResponse.json({
    count: 0,
    source: 'stub',
    message:
      'Admin seeding required. Run: npm run seed:rwa. Future: RWA.xyz API integration pending partnership approval.',
    duration_ms: 0,
  });
}
