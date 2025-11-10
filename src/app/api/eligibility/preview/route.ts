/**
 * GET /api/eligibility/preview
 * 
 * Eligibility preview endpoint for Hunter Screen
 * 
 * Features:
 * - Accepts wallet address and opportunity ID
 * - Returns eligibility status, score, reasons, and cache expiry
 * - Handles missing wallet gracefully
 * - Database caching with 60-minute TTL
 * - Rate limiting (60/hr anon, 120/hr auth)
 * - Structured error responses
 * 
 * Requirements: 6.1-6.8
 * Task: 14
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getEligibilityPreview } from '@/lib/eligibility-preview';
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
const EligibilityPreviewQuerySchema = z.object({
  // Wallet address (required)
  wallet: z
    .string()
    .min(1, 'Wallet address is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum wallet address format'),
  
  // Opportunity ID (required)
  opportunityId: z
    .string()
    .min(1, 'Opportunity ID is required')
    .uuid('Opportunity ID must be a valid UUID'),
  
  // Required chain for the opportunity (required)
  chain: z
    .string()
    .min(1, 'Chain is required')
    .regex(/^[a-z0-9_-]+$/, 'Invalid chain format'),
});

/**
 * GET handler for eligibility preview
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
    const wallet = searchParams.get('wallet');
    const opportunityId = searchParams.get('opportunityId');
    const chain = searchParams.get('chain');

    // Handle missing wallet gracefully (Requirement 6.8)
    if (!wallet) {
      return NextResponse.json(
        {
          status: 'unknown',
          score: 0,
          reasons: ['Wallet address is required to check eligibility'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        {
          status: 200,
          headers: {
            'X-API-Version': CURRENT_API_VERSION,
            'Cache-Control': 'no-cache',
          },
        }
      );
    }

    if (!opportunityId) {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.BAD_FILTER,
            message: 'Missing required parameter: opportunityId',
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

    if (!chain) {
      return NextResponse.json(
        {
          error: {
            code: ErrorCode.BAD_FILTER,
            message: 'Missing required parameter: chain',
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

    // Validate parameters
    try {
      const parsed = EligibilityPreviewQuerySchema.safeParse({
        wallet,
        opportunityId,
        chain,
      });

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

      console.log(`[Eligibility API] Checking eligibility for wallet ${parsed.data.wallet.substring(0, 10)}... on opportunity ${parsed.data.opportunityId}`);

      // Get eligibility preview (with database caching)
      const preview = await getEligibilityPreview(
        parsed.data.wallet,
        parsed.data.opportunityId,
        parsed.data.chain
      );

      console.log(`[Eligibility API] Result: ${preview.status} (score: ${preview.score})`);

      // Build response
      const responseBody = {
        status: preview.status,
        score: preview.score,
        reasons: preview.reasons,
        cachedUntil: preview.cachedUntil,
        ts: new Date().toISOString(),
      };

      // Return successful response
      const response = NextResponse.json(responseBody, { status: 200 });

      // Set cache headers
      // Cache for 5 minutes (eligibility is cached in DB for 60 minutes)
      // Use private cache since this is wallet-specific data
      response.headers.set('Cache-Control', 'private, max-age=300, stale-while-revalidate=600');
      response.headers.set('X-API-Version', CURRENT_API_VERSION);
      response.headers.set('Content-Type', 'application/json');

      return response;
    } catch (validationError) {
      console.error('[Eligibility API] Validation error:', validationError);
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

  } catch (error) {
    console.error('[Eligibility API] Error:', error);

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
