import { NextRequest, NextResponse } from 'next/server';
import { portfolioSnapshotService } from '@/services/PortfolioSnapshotService';
import { z } from 'zod';

// Request validation schema
const snapshotRequestSchema = z.object({
  scope: z.enum(['active_wallet', 'all_wallets']).default('active_wallet'),
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
});

/**
 * GET /api/v1/portfolio/snapshot
 * 
 * Retrieves unified portfolio snapshot with data from Guardian, Hunter, and Harvest systems.
 * Includes freshness and confidence metadata for risk-aware caching.
 * 
 * Query Parameters:
 * - scope: 'active_wallet' | 'all_wallets' (default: 'active_wallet')
 * - wallet: wallet address (required when scope='active_wallet')
 * 
 * Requirements: 1.6, 1.8, 1.9, 15.3
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate query parameters
    const validationResult = snapshotRequestSchema.safeParse({
      scope: searchParams.get('scope'),
      wallet: searchParams.get('wallet'),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_PARAMETERS',
            message: 'Invalid query parameters',
            details: validationResult.error.errors,
          },
        },
        { status: 400 }
      );
    }

    const { scope, wallet } = validationResult.data;

    // Validate wallet address is provided for active_wallet scope
    if (scope === 'active_wallet' && !wallet) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_WALLET',
            message: 'Wallet address is required when scope is active_wallet',
          },
        },
        { status: 400 }
      );
    }

    // TODO: Add authentication and get user ID
    // For now, using a placeholder user ID
    const userId = 'placeholder-user-id';

    // Build wallet scope
    const walletScope = scope === 'active_wallet' 
      ? { mode: 'active_wallet' as const, address: wallet as `0x${string}` }
      : { mode: 'all_wallets' as const };

    // Get portfolio snapshot
    const snapshot = await portfolioSnapshotService.getSnapshot(userId, walletScope);

    // Return response with required API version
    return NextResponse.json({
      data: snapshot,
      apiVersion: 'v1',
      ts: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Portfolio snapshot API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve portfolio snapshot',
        },
      },
      { status: 500 }
    );
  }
}