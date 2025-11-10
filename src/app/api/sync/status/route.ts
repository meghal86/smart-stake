/**
 * Sync Status Endpoint
 * 
 * Provides observability into sync scheduler state.
 * Shows circuit breaker states, rate limits, and retry counts.
 * 
 * Requirements: 12.1-12.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScheduler } from '@/lib/sync/scheduler';

/**
 * GET /api/sync/status
 * 
 * Returns current state of all sync sources.
 * Protected by API key for internal monitoring.
 */
export async function GET(request: NextRequest) {
  // Verify API key (for internal monitoring tools)
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const scheduler = getScheduler();
    const allStates = scheduler.getAllStates();

    // Format response for monitoring
    const status = Object.entries(allStates).map(([source, state]) => ({
      source,
      circuitBreaker: {
        state: state.circuitBreaker.state,
        failureCount: state.circuitBreaker.failureCount,
        lastFailureTime: state.circuitBreaker.lastFailureTime
          ? new Date(state.circuitBreaker.lastFailureTime).toISOString()
          : null,
        nextAttemptTime: state.circuitBreaker.nextAttemptTime
          ? new Date(state.circuitBreaker.nextAttemptTime).toISOString()
          : null,
        halfOpenAttempts: state.circuitBreaker.halfOpenAttempts,
      },
      rateLimit: {
        currentRequests: state.rateLimit.requests.length,
        lastReset: new Date(state.rateLimit.lastReset).toISOString(),
      },
      retryCount: state.retryCount,
      healthy: state.circuitBreaker.state === 'closed' && state.retryCount === 0,
    }));

    // Calculate overall health
    const healthySources = status.filter(s => s.healthy).length;
    const totalSources = status.length;
    const overallHealth = healthySources / totalSources;

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overallHealth: {
        percentage: Math.round(overallHealth * 100),
        healthy: healthySources,
        total: totalSources,
        status: overallHealth >= 0.8 ? 'healthy' : overallHealth >= 0.5 ? 'degraded' : 'unhealthy',
      },
      sources: status,
    });
  } catch (error) {
    console.error('[Sync Status] Error getting status:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
