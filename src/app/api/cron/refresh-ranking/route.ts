/**
 * Vercel Cron API Route for Refreshing Ranking Materialized View
 * 
 * This endpoint is called by Vercel Cron every 3 minutes to refresh
 * the mv_opportunity_rank materialized view.
 * 
 * Requirements: 3.1-3.6 (Personalized Feed Ranking)
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/refresh-ranking",
 *     "schedule": "*/3 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/integrations/supabase/service';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabase = createServiceClient();
    const startTime = Date.now();

    // Refresh the materialized view
    const { error } = await supabase.rpc('refresh_opportunity_rank_view');

    if (error) {
      console.error('Failed to refresh ranking view:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    const duration = Date.now() - startTime;

    console.log(`✅ Refreshed mv_opportunity_rank in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
