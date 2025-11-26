/**
 * POST /api/harvest/sync/wallets
 * Sync wallet transactions via Edge Function
 * 
 * This is a thin orchestration layer that calls the harvest-sync-wallets Edge Function.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import { z } from 'zod';
import type { ErrorResponse } from '@/types/harvestpro';

export const runtime = 'edge';

// Validation schema
const SyncWalletsRequestSchema = z.object({
  walletAddresses: z.array(z.string()).min(1, 'At least one wallet address required'),
  forceRefresh: z.boolean().optional().default(false),
});

interface SyncWalletsResponse {
  success: boolean;
  walletsProcessed: number;
  transactionsFound: number;
  lastSyncAt: string;
  error?: string;
}

/**
 * POST /api/harvest/sync/wallets
 * Trigger wallet sync via Edge Function
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
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

    // Parse and validate request body
    const body = await req.json();
    const parsed = SyncWalletsRequestSchema.safeParse(body);

    if (!parsed.success) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'BAD_REQUEST',
          message: `Invalid request: ${parsed.error.message}`,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke<SyncWalletsResponse>(
      'harvest-sync-wallets',
      {
        body: {
          userId: user.id,
          walletAddresses: parsed.data.walletAddresses,
          forceRefresh: parsed.data.forceRefresh,
        },
      }
    );

    if (error) {
      console.error('Edge Function error:', error);
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INTERNAL',
          message: 'Failed to sync wallets',
        },
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Wallet sync API error:', error);

    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
