/**
 * GET /api/hunter/opportunities
 * 
 * Main feed endpoint for Hunter Screen opportunities
 * 
 * Features:
 * - Query parameter validation with Zod
 * - Rate limiting (60/hr anon, 120/hr auth)
 * - Cursor-based pagination with snapshot consistency
 * - ETag support for 304 Not Modified
 * - Structured error responses
 * - Proper cache headers
 * 
 * Requirements:
 * - 1.7: API response structure
 * - 1.8: Cursor pagination
 * - 1.9: ETag generation
 * - 1.10: 304 Not Modified support
 * - 1.11: API versioning
 * - 4.13-4.15: Rate limiting
 * - 8.10, 8.11: Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFeedPage } from '@/lib/feed/query';
import { 
  checkRateLimit, 
  RateLimitError,
  getIdentifierFromHeaders,
  isAuthenticatedFromHeaders 
} from '@/lib/rate-limit';
import { hashETag, compareETags } from '@/lib/etag';
import { OpportunitiesQuerySchema } from '@/schemas/hunter';
import { ErrorCode } from '@/types/hunter';
import {
  checkClientVersion,
  getEffectiveApiVersion,
  shouldEnforceVersion,
  VersionError,
  CURRENT_API_VERSION,
} from '@/lib/api-version';

/**
 * GET handler for opportunities feed
 */
export async function GET(req: NextRequest) {
  try {
    // Check client version (required in production, optional in dev)
    try {
      checkClientVersion(req, {
        required: shouldEnforceVersion(),
        allowQueryOverride: true,
      });
    } catch (error) {
      if (error instanceof VersionError) {
        return NextResponse.json(
          {
            error: {
              code: 'VERSION_UNSUPPORTED' as ErrorCode,
              message: error.message,
              details: {
                client_version: error.clientVersion,
                min_version: error.minVersion,
                current_version: error.currentVersion,
              },
            },
          },
          {
            status: 412, // Precondition Failed
            headers: {
              'X-API-Version': getEffectiveApiVersion(req),
            },
          }
        );
      }
      throw error;
    }

    // Get effective API version (supports canary testing via query param)
    const apiVersion = getEffectiveApiVersion(req);

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
              'X-API-Version': apiVersion,
            },
          }
        );
      }
      throw error;
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    
    // Convert searchParams to object for Zod validation
    const queryObject: any = {};
    searchParams.forEach((value, key) => {
      // Handle array parameters (type, chains, urgency, difficulty)
      if (['type', 'chains', 'urgency', 'difficulty'].includes(key)) {
        if (!queryObject[key]) {
          queryObject[key] = [];
        }
        queryObject[key].push(value);
      } else {
        queryObject[key] = value;
      }
    });

    const parsed = OpportunitiesQuerySchema.safeParse(queryObject);
    
    if (!parsed.success) {
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
            'X-API-Version': apiVersion,
          },
        }
      );
    }

    const params = parsed.data;

    // Fetch feed data
    const feedResult = await getFeedPage({
      search: params.q,
      types: params.type,
      chains: params.chains,
      trustMin: params.trust_min,
      rewardMin: params.reward_min,
      rewardMax: params.reward_max,
      urgency: params.urgency,
      eligibleOnly: params.eligible,
      difficulty: params.difficulty,
      sort: params.sort,
      cursor: params.cursor ?? undefined,
    });

    // Build response body
    const responseBody = {
      items: feedResult.items,
      cursor: feedResult.nextCursor,
      ts: new Date().toISOString(),
    };

    // Generate ETag for cache validation
    const etag = hashETag(responseBody);

    // Check If-None-Match header for 304 Not Modified
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch && compareETags(ifNoneMatch, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'X-API-Version': apiVersion,
        },
      });
    }

    // Return successful response with proper headers
    const response = NextResponse.json(responseBody, { status: 200 });
    
    // Set cache headers
    // Anonymous users: cache for 60s with stale-while-revalidate
    // Authenticated users: no cache (personalized content)
    if (isAuthenticated) {
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    } else {
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
    
    response.headers.set('ETag', etag);
    response.headers.set('X-API-Version', apiVersion);
    response.headers.set('Content-Type', 'application/json');

    return response;

  } catch (error) {
    console.error('Hunter opportunities API error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Invalid cursor')) {
        return NextResponse.json(
          {
            error: {
              code: ErrorCode.BAD_FILTER,
              message: 'Invalid cursor format',
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
    }

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
