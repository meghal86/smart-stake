/**
 * GET /api/guardian/summary
 * 
 * Batch Guardian summary endpoint for Hunter Screen
 * 
 * Features:
 * - Batch fetching for multiple opportunities
 * - Redis caching with 1-hour TTL
 * - Rate limiting (60/hr anon, 120/hr auth)
 * - Structured error responses
 * - Leverages existing Guardian service layer
 * 
 * Requirements: 2.1-2.7
 * Task: 13
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getGuardianSummary } from '@/lib/guardian/hunter-integration';
import {
  checkRateLimit,
  RateLimitError,
  getIdentifierFromHeaders,
  isAuthenticatedFromHeaders,
} from '@/lib/rate-limit';
import { ErrorCode } from '@/types/hunter';
import { CURRENT_API_VERSION } from '@/lib/api-version';

/**
 * Query parameter schema
 */
const GuardianSummaryQuerySchema = z.object({
  // Comma-separated list of opportunity IDs
  ids: z
    .string()
    .min(1, 'At least one opportunity ID is required')
    .transform((val) => val.split(',').map((id) => id.trim()))
    .refine((ids) => ids.length > 0, 'At least one opportunity ID is required')
    .refine((ids) => ids.length <= 100, 'Maximum 100 opportunity IDs allowed')
    .refine(
      (ids) => ids.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)),
      'All IDs must be valid UUIDs'
    ),
});

/**
 * GET handler for Guardian summaries
 */
export async function GET(req: NextRequest) {
  try {
    // Extract identifier for rate limiting
    const identifier = getIdentifierFromHeaders(req.headers);
    const isAuthenticated = isAuthenticatedFromHeaders(req.headers);

    // Check rate limit
    try {
      await checkRateLimit(identifier, isAuthenticated);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          {
            error: {
              code: ErrorCode.RATE_LIMITED,
              message: 'Too many requests. Please try again later.',
              retry_after_sec: error.retryAfter,
            },
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(error.retryAfter),
              'X-RateLimit-Limit': String(error.limit),
              'X-RateLimit-Remaining': String(error.remaining),
              'X-RateLimit-Reset': String(error.reset),
              'X-API-Version': CURRENT_API_VERSION,
            },
          }
        );
      }
      throw error;
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.BAD_FILTER,
            message: 'Missing required parameter: ids',
          },
        },
        {
          status: 400,
          headers: {
            'X-API-Version': CURRENT_API_VERSION,
          },
        }
      );
    }

    let opportunityIds: string[];
    
    try {
      const parsed = GuardianSummaryQuerySchema.safeParse({ ids: idsParam });

      if (!parsed.success) {
        const errors = parsed.error?.errors || [];
        const firstError = errors.length > 0 ? errors[0] : null;
        const errorMessage = firstError?.message || 'Invalid query parameters';
        
        return NextResponse.json(
          {
            error: {
              code: ErrorCode.BAD_FILTER,
              message: errorMessage,
            },
          },
          {
            status: 400,
            headers: {
              'X-API-Version': CURRENT_API_VERSION,
            },
          }
        );
      }

      opportunityIds = parsed.data.ids;
    } catch (validationError) {
      console.error('[Guardian API] Validation error:', validationError);
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.BAD_FILTER,
            message: 'Invalid query parameters',
          },
        },
        {
          status: 400,
          headers: {
            'X-API-Version': CURRENT_API_VERSION,
          },
        }
      );
    }

    console.log(`[Guardian API] Fetching summaries for ${opportunityIds.length} opportunities`);

    // Fetch Guardian summaries (with Redis caching)
    const summariesMap = await getGuardianSummary(opportunityIds);

    // Transform Map to object for JSON response
    const summaries: Record<string, {
      score: number;
      level: 'green' | 'amber' | 'red';
      last_scanned_ts: string;
      top_issues: string[];
    }> = {};

    for (const [opportunityId, summary] of summariesMap.entries()) {
      summaries[opportunityId] = {
        score: summary.score,
        level: summary.level,
        last_scanned_ts: summary.lastScannedTs,
        top_issues: summary.topIssues,
      };
    }

    // Build response
    const responseBody = {
      summaries,
      count: Object.keys(summaries).length,
      requested: opportunityIds.length,
      ts: new Date().toISOString(),
    };

    console.log(`[Guardian API] Returning ${responseBody.count}/${responseBody.requested} summaries`);

    // Return successful response
    const response = NextResponse.json(responseBody, { status: 200 });

    // Set cache headers
    // Cache for 5 minutes (Guardian data is cached in Redis for 1 hour)
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    response.headers.set('X-API-Version', CURRENT_API_VERSION);
    response.headers.set('Content-Type', 'application/json');

    return response;
  } catch (error) {
    console.error('[Guardian API] Error:', error);

    // Generic internal error
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.INTERNAL,
          message: 'An internal error occurred. Please try again later.',
        },
      },
      {
        status: 500,
        headers: {
          'X-API-Version': CURRENT_API_VERSION,
        },
      }
    );
  }
}
