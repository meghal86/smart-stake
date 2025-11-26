/**
 * GET /api/harvest/opportunities
 * Thin wrapper around harvest-recompute-opportunities Edge Function
 * 
 * Architecture: Next.js API Route (THIN LAYER) → Edge Function (BUSINESS LOGIC)
 * 
 * Responsibilities:
 * - Validate authentication
 * - Parse and validate request parameters
 * - Call harvest-recompute-opportunities Edge Function
 * - Format response for UI consumption
 * - Handle errors gracefully
 * 
 * Requirements:
 * - 2.5: Complete scan within 10s for P95
 * - 3.1-3.5: Eligibility filtering
 * - 4.1-4.5: Net benefit calculation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/integrations/supabase/server';
import {
  checkRateLimit,
  getIdentifierFromHeaders,
  isAuthenticatedFromHeaders,
  RateLimitError,
} from '@/lib/rate-limit';
import type {
  OpportunitiesResponse,
  OpportunitiesQueryParams,
  ErrorResponse,
  HarvestOpportunity,
  GasEfficiencyGrade,
} from '@/types/harvestpro';

export const runtime = 'edge';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const QueryParamsSchema = z.object({
  taxRate: z.coerce.number().min(0).max(1).optional().default(0.24),
  minLossThreshold: z.coerce.number().min(0).optional().default(100),
  maxRiskLevel: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  excludeWashSale: z.coerce.boolean().optional().default(true),
  forceRecompute: z.coerce.boolean().optional().default(false),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate gas efficiency grade based on opportunities
 */
function calculateGasEfficiencyGrade(opportunities: HarvestOpportunity[]): GasEfficiencyGrade {
  if (opportunities.length === 0) return 'C';
  
  const avgGasPercentage = opportunities.reduce((sum, opp) => {
    const gasPercentage = (opp.gasEstimate / opp.unrealizedLoss) * 100;
    return sum + gasPercentage;
  }, 0) / opportunities.length;
  
  if (avgGasPercentage < 5) return 'A';
  if (avgGasPercentage < 15) return 'B';
  return 'C';
}

/**
 * Parse query parameters from URL
 */
function parseQueryParams(searchParams: URLSearchParams) {
  return {
    taxRate: searchParams.get('taxRate'),
    minLossThreshold: searchParams.get('minLossThreshold'),
    maxRiskLevel: searchParams.get('maxRiskLevel'),
    excludeWashSale: searchParams.get('excludeWashSale'),
    forceRecompute: searchParams.get('forceRecompute'),
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Step 1: Rate limiting
    const identifier = getIdentifierFromHeaders(req.headers);
    const isAuthenticated = isAuthenticatedFromHeaders(req.headers);
    
    try {
      await checkRateLimit(identifier, isAuthenticated);
    } catch (error) {
      if (error instanceof RateLimitError) {
        const errorResponse: ErrorResponse = {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
            retry_after_sec: error.retryAfter,
          },
        };
        
        return NextResponse.json(errorResponse, {
          status: 429,
          headers: {
            'Retry-After': String(error.retryAfter),
            'X-RateLimit-Limit': String(error.limit),
            'X-RateLimit-Remaining': String(error.remaining),
            'X-RateLimit-Reset': String(error.reset),
          },
        });
      }
      throw error;
    }
    
    // Step 2: Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const rawParams = parseQueryParams(searchParams);
    
    const validationResult = QueryParamsSchema.safeParse(rawParams);
    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'BAD_REQUEST',
          message: `Invalid query parameters: ${validationResult.error.message}`,
        },
      };
      
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    const params = validationResult.data;
    
    // Step 3: Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      
      return NextResponse.json(errorResponse, { status: 401 });
    }
    
    // Step 4: Call Edge Function (ALL BUSINESS LOGIC HAPPENS HERE)
    const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke(
      'harvest-recompute-opportunities',
      {
        body: {
          userId: user.id,
          taxRate: params.taxRate,
          minLossThreshold: params.minLossThreshold,
          maxRiskLevel: params.maxRiskLevel,
          excludeWashSale: params.excludeWashSale,
        },
      }
    );
    
    if (edgeFunctionError) {
      console.error('Edge Function error:', edgeFunctionError);
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INTERNAL',
          message: 'Failed to compute opportunities',
        },
      };
      
      return NextResponse.json(errorResponse, { status: 500 });
    }
    
    // Step 5: Format response for UI consumption
    const opportunities = edgeFunctionData.opportunities || [];
    
    const summary = {
      totalHarvestableLoss: edgeFunctionData.totalPotentialSavings || 0,
      estimatedNetBenefit: edgeFunctionData.totalPotentialSavings || 0,
      eligibleTokensCount: edgeFunctionData.opportunitiesFound || 0,
      gasEfficiencyScore: calculateGasEfficiencyGrade(opportunities),
    };
    
    const response: OpportunitiesResponse = {
      items: opportunities,
      cursor: null, // Edge Function returns all opportunities, no pagination needed
      ts: edgeFunctionData.lastComputedAt || new Date().toISOString(),
      summary,
    };
    
    // Step 6: Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Log performance warning if > 200ms (P95 target)
    if (processingTime > 200) {
      console.warn(`Slow opportunities query: ${processingTime}ms`);
    }
    
    // Step 7: Return response with caching headers
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=300, s-maxage=300', // 5 minutes
        'X-Processing-Time': String(processingTime),
        'X-Edge-Function-Time': String(edgeFunctionData.computationTime || 0),
      },
    });
    
  } catch (error) {
    console.error('Opportunities API error:', error);
    
    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
