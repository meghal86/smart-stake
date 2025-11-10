/**
 * Example Usage of Rate Limiting Middleware
 * 
 * This file demonstrates how to use the rate limiting middleware
 * in Next.js API routes for the Hunter Screen feature.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  checkRateLimit,
  getIdentifierFromHeaders,
  isAuthenticatedFromHeaders,
  RateLimitError,
} from './index';

/**
 * Example API Route Handler with Rate Limiting
 * 
 * This demonstrates the complete pattern for implementing
 * rate limiting in a Next.js API route.
 */
export async function exampleAPIRoute(req: NextRequest) {
  // Step 1: Extract identifier from request headers
  const identifier = getIdentifierFromHeaders(req.headers);
  
  // Step 2: Check if user is authenticated
  const isAuthenticated = isAuthenticatedFromHeaders(req.headers);
  
  // Step 3: Check rate limit
  try {
    const rateLimitResult = await checkRateLimit(identifier, isAuthenticated);
    
    // Optional: Add rate limit headers to successful responses
    const headers = new Headers({
      'X-RateLimit-Limit': String(rateLimitResult.limit),
      'X-RateLimit-Remaining': String(rateLimitResult.remaining),
      'X-RateLimit-Reset': String(rateLimitResult.reset),
    });
    
    // Continue with your API logic...
    const data = {
      message: 'Success',
      // ... your response data
    };
    
    return NextResponse.json(data, { headers });
    
  } catch (error) {
    // Step 4: Handle rate limit errors
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
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
          },
        }
      );
    }
    
    // Handle other errors
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Simplified Rate Limiting Middleware
 * 
 * This can be used as a reusable middleware function
 * that wraps your API route handlers.
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const identifier = getIdentifierFromHeaders(req.headers);
    const isAuthenticated = isAuthenticatedFromHeaders(req.headers);
    
    try {
      await checkRateLimit(identifier, isAuthenticated);
      return await handler(req);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          {
            error: {
              code: 'RATE_LIMITED',
              message: 'Too many requests',
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
            },
          }
        );
      }
      throw error;
    }
  };
}

/**
 * Example usage with the middleware wrapper:
 * 
 * ```typescript
 * // app/api/hunter/opportunities/route.ts
 * import { withRateLimit } from '@/lib/rate-limit/example-usage';
 * 
 * async function handler(req: NextRequest) {
 *   // Your API logic here
 *   return NextResponse.json({ data: 'success' });
 * }
 * 
 * export const GET = withRateLimit(handler);
 * ```
 */

/**
 * Example with custom identifier (e.g., user ID instead of IP)
 */
export async function exampleWithCustomIdentifier(
  req: NextRequest,
  userId?: string
) {
  // Use user ID if available, otherwise fall back to IP
  const identifier = userId || getIdentifierFromHeaders(req.headers);
  const isAuthenticated = !!userId;
  
  try {
    await checkRateLimit(identifier, isAuthenticated);
    
    // Your API logic...
    return NextResponse.json({ success: true });
    
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: 'Rate limit exceeded',
            retry_after_sec: error.retryAfter,
          },
        },
        {
          status: 429,
          headers: { 'Retry-After': String(error.retryAfter) },
        }
      );
    }
    throw error;
  }
}
