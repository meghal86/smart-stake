/**
 * Smoke Test Cron Job
 * 
 * This endpoint runs synthetic smoke tests from multiple regions
 * to ensure the Hunter Screen API is available and performant.
 * 
 * Scheduled to run every 5 minutes via Vercel Cron.
 * 
 * Requirements: 14.1-14.6
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  runAllSmokeTests,
  shouldAlert,
  formatReport,
  sendAlert,
  DEFAULT_CONFIG,
} from '@/lib/monitoring/smoke-tests';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Get base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    `https://${req.headers.get('host')}`;

    // Run smoke tests from all regions
    const report = await runAllSmokeTests(baseUrl, DEFAULT_CONFIG);

    // Check if we should alert
    const { alert, reasons } = shouldAlert(report, DEFAULT_CONFIG);

    // Log the report
    console.log(formatReport(report));

    // Send alert if needed
    if (alert) {
      await sendAlert(report, reasons);
    }

    // Return the report
    return NextResponse.json({
      success: !alert,
      report,
      alert: alert ? { triggered: true, reasons } : { triggered: false },
    });
  } catch (error) {
    console.error('Smoke test cron job failed:', error);
    
    // Send critical alert for cron job failure
    await sendAlert(
      {
        testId: `smoke-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        results: [],
        summary: {
          totalTests: 0,
          passed: 0,
          failed: 0,
          avgLatency: 0,
          maxLatency: 0,
        },
      },
      ['Smoke test cron job failed to execute']
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
