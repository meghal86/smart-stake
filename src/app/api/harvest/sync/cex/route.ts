/**
 * POST /api/harvest/sync/cex
 * Sync CEX trades via Edge Function
 * 
 * Architecture: Next.js API Route (THIN LAYER) → Edge Function (BUSINESS LOGIC)
 * 
 * Responsibilities:
 * - Validate authentication
 * - Parse and validate request parameters
 * - Call harvest-sync-cex Edge Function
 * - Format response for UI consumption
 * - Handle errors gracefully
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { z } from 'zod';
import type { ErrorResponse } from '@/types/harvestpro';

export const runtime = 'edge';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CEXAccountSchema = z.object({
  id: z.string(),
  exchange: z.string(),
  isActive: z.boolean(),
});

const SyncCEXRequestSchema = z.object({
  cexAccounts: z.array(CEXAccountSchema).min(1, 'At least one CEX account required'),
  forceRefresh: z.boolean().optional().default(false),
});

// ============================================================================
// TYPES
// ============================================================================

interface SyncCEXResponse {
  success: boolean;
  accountsProcessed: number;
  tradesFound: number;
  lastSyncAt: string;
  error?: string;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * POST /api/harvest/sync/cex
 * Trigger CEX trade sync via Edge Function
 */
export async function POST(req: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Step 2: Parse and validate request body
    const body = await req.json();
    const parsed = SyncCEXRequestSchema.safeParse(body);

    if (!parsed.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'BAD_REQUEST',
          message: `Invalid request: ${parsed.error.message}`,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Step 3: Call Edge Function (ALL BUSINESS LOGIC HAPPENS HERE)
    const { data, error } = await supabase.functions.invoke<SyncCEXResponse>(
      'harvest-sync-cex',
      {
        body: {
          userId: user.id,
          cexAccounts: parsed.data.cexAccounts,
          forceRefresh: parsed.data.forceRefresh,
        },
      }
    );

    if (error) {
      console.error('Edge Function error:', error);
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INTERNAL',
          message: 'Failed to sync CEX accounts',
        },
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Step 4: Return response
    return NextResponse.json(data);
  } catch (error) {
    console.error('CEX sync API error:', error);

    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
