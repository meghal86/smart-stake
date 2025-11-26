/**
 * GET /api/harvest/sync/status
 * Get sync status for wallets and CEX accounts
 * 
 * Architecture: Next.js API Route → Database (Simple Read)
 * 
 * Responsibilities:
 * - Validate authentication
 * - Query harvest_sync_status table
 * - Format response for UI consumption
 * - Handle errors gracefully
 * 
 * Note: This is a simple database read, no Edge Function needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/integrations/supabase/server';
import type { ErrorResponse } from '@/types/harvestpro';

export const runtime = 'edge';

// ============================================================================
// TYPES
// ============================================================================

interface SyncStatusItem {
  lastSyncAt: string | null;
  walletsProcessed?: number;
  accountsProcessed?: number;
  transactionsFound?: number;
  tradesFound?: number;
  status: 'success' | 'partial' | 'failed' | 'never_synced';
  errors?: string[];
}

interface SyncStatusResponse {
  wallets: SyncStatusItem;
  cex: SyncStatusItem;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * GET /api/harvest/sync/status
 * Retrieve sync status for user's wallets and CEX accounts
 */
export async function GET(req: NextRequest) {
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

    // Step 2: Query sync status from database (simple read, no Edge Function needed)
    const { data: syncStatus, error: queryError } = await supabase
      .from('harvest_sync_status')
      .select('*')
      .eq('user_id', user.id);

    if (queryError) {
      console.error('Sync status query error:', queryError);
      const errorResponse: ErrorResponse = {
        error: {
          code: 'INTERNAL',
          message: 'Failed to fetch sync status',
        },
      };
      return NextResponse.json(errorResponse, { status: 500 });
    }

    // Step 3: Format response
    const walletSync = syncStatus?.find((s) => s.sync_type === 'wallets');
    const cexSync = syncStatus?.find((s) => s.sync_type === 'cex');

    const response: SyncStatusResponse = {
      wallets: {
        lastSyncAt: walletSync?.last_sync_at || null,
        walletsProcessed: walletSync?.wallets_processed || 0,
        transactionsFound: walletSync?.transactions_found || 0,
        status: walletSync?.status || 'never_synced',
        errors: walletSync?.errors || [],
      },
      cex: {
        lastSyncAt: cexSync?.last_sync_at || null,
        accountsProcessed: cexSync?.accounts_processed || 0,
        tradesFound: cexSync?.trades_found || 0,
        status: cexSync?.status || 'never_synced',
        errors: cexSync?.errors || [],
      },
    };

    // Step 4: Return response with caching headers
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Sync status API error:', error);

    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
