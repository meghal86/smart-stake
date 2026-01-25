import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Position, WalletScope, FreshnessConfidence, ListResponse } from '@/types/portfolio';
import { portfolioValuationService } from '@/services/PortfolioValuationService';
import { riskAwareCache } from '@/lib/cache/RiskAwareCacheService';

/**
 * GET /api/v1/portfolio/positions
 * 
 * Returns paginated list of Position objects with asset breakdown, chain distribution,
 * and protocol exposure. Supports filtering by chain and cursor pagination.
 * 
 * Requirements: 15.2, 15.3
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const scope = searchParams.get('scope') as 'active_wallet' | 'all_wallets' || 'active_wallet';
    const wallet = searchParams.get('wallet');
    const chainId = searchParams.get('chain') ? parseInt(searchParams.get('chain')!) : null;
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Validate required parameters
    if (scope === 'active_wallet' && !wallet) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_WALLET',
            message: 'wallet parameter is required when scope=active_wallet'
          }
        },
        { status: 400 }
      );
    }

    // Get user ID from auth
    const userId = await getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        },
        { status: 401 }
      );
    }

    // Build wallet scope
    const walletScope: WalletScope = scope === 'active_wallet' 
      ? { mode: 'active_wallet', address: wallet as `0x${string}` }
      : { mode: 'all_wallets' };

    // Generate cache key
    const cacheKey = generateCacheKey(userId, walletScope, chainId, cursor, limit);
    
    // Try cache first
    const cached = riskAwareCache.get<ListResponse<Position>>(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        apiVersion: 'v1'
      });
    }

    // Get positions data
    const result = await getPositions(userId, walletScope, {
      chainId,
      cursor,
      limit
    });

    // Cache the result
    riskAwareCache.set(cacheKey, result, 'medium');

    return NextResponse.json({
      ...result,
      apiVersion: 'v1'
    });

  } catch (error) {
    console.error('Portfolio positions API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch positions'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Get positions with filtering and pagination
 */
async function getPositions(
  userId: string,
  walletScope: WalletScope,
  options: {
    chainId?: number | null;
    cursor?: string | null;
    limit: number;
  }
): Promise<ListResponse<Position>> {
  const startTime = Date.now();
  
  try {
    // Resolve wallet addresses
    const addresses = await resolveWalletAddresses(userId, walletScope);
    
    if (addresses.length === 0) {
      return {
        items: [],
        freshness: createDefaultFreshness(),
        nextCursor: undefined
      };
    }

    // Get portfolio valuation data
    const valuation = await portfolioValuationService.valuatePortfolio(addresses);
    
    // Map holdings to positions
    const positions: Position[] = valuation.holdings.map((holding, index) => ({
      id: `${holding.token}-${holding.source}-${index}`,
      token: holding.token,
      symbol: holding.token,
      amount: holding.qty.toString(),
      valueUsd: holding.value,
      chainId: getChainIdFromSource(holding.source),
      protocol: holding.source,
      category: categorizeHolding(holding)
    }));

    // Apply filters
    let filteredPositions = positions;
    
    if (options.chainId) {
      filteredPositions = filteredPositions.filter(position => 
        position.chainId === options.chainId
      );
    }

    // Sort by value (highest first)
    filteredPositions.sort((a, b) => b.valueUsd - a.valueUsd);

    // Apply cursor pagination
    let startIndex = 0;
    if (options.cursor) {
      const cursorIndex = filteredPositions.findIndex(position => position.id === options.cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedPositions = filteredPositions.slice(startIndex, startIndex + options.limit);
    const nextCursor = paginatedPositions.length === options.limit 
      ? paginatedPositions[paginatedPositions.length - 1].id 
      : undefined;

    // Calculate freshness
    const freshness = calculateFreshness(startTime);

    return {
      items: paginatedPositions,
      freshness,
      nextCursor
    };

  } catch (error) {
    console.error('Error fetching positions:', error);
    throw error;
  }
}

/**
 * Resolve wallet addresses based on scope
 */
async function resolveWalletAddresses(userId: string, walletScope: WalletScope): Promise<string[]> {
  if (walletScope.mode === 'active_wallet') {
    return [walletScope.address];
  }
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    const { data: wallets, error } = await supabase
      .from('user_portfolio_addresses')
      .select('address')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user wallets:', error);
      return [];
    }
    
    return wallets?.map(w => w.address) || [];
  } catch (error) {
    console.error('Database error fetching wallets:', error);
    return [];
  }
}

/**
 * Get user ID from authentication
 */
async function getUserIdFromAuth(request: NextRequest): Promise<string | null> {
  // TODO: Implement proper authentication
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  
  return 'mock-user-id';
}

/**
 * Generate cache key for positions
 */
function generateCacheKey(
  userId: string,
  walletScope: WalletScope,
  chainId?: number | null,
  cursor?: string | null,
  limit?: number
): string {
  const scopeKey = walletScope.mode === 'active_wallet' 
    ? `${walletScope.mode}_${walletScope.address}`
    : walletScope.mode;
  
  const filterKey = [
    chainId && `chain_${chainId}`,
    cursor && `cursor_${cursor}`,
    limit && `limit_${limit}`
  ].filter(Boolean).join('_');
  
  return `positions_${userId}_${scopeKey}_${filterKey}`;
}

/**
 * Calculate freshness metadata
 */
function calculateFreshness(startTime: number): FreshnessConfidence {
  const freshnessSec = Math.floor((Date.now() - startTime) / 1000);
  
  return {
    freshnessSec,
    confidence: 0.95, // High confidence for portfolio valuation
    confidenceThreshold: 0.70,
    degraded: false
  };
}

/**
 * Create default freshness for empty results
 */
function createDefaultFreshness(): FreshnessConfidence {
  return {
    freshnessSec: 0,
    confidence: 1.0,
    confidenceThreshold: 0.70,
    degraded: false
  };
}

/**
 * Get chain ID from source/protocol name
 */
function getChainIdFromSource(source: string): number {
  // Map common sources to chain IDs
  const sourceToChain: Record<string, number> = {
    'ethereum': 1,
    'polygon': 137,
    'bsc': 56,
    'avalanche': 43114,
    'arbitrum': 42161,
    'optimism': 10,
    'fantom': 250
  };
  
  const lowerSource = source.toLowerCase();
  for (const [key, chainId] of Object.entries(sourceToChain)) {
    if (lowerSource.includes(key)) {
      return chainId;
    }
  }
  
  return 1; // Default to Ethereum
}

/**
 * Categorize holding type
 */
function categorizeHolding(holding: any): 'token' | 'lp' | 'nft' | 'defi' {
  const source = holding.source?.toLowerCase() || '';
  
  if (source.includes('uniswap') || source.includes('sushiswap') || source.includes('lp')) {
    return 'lp';
  }
  
  if (source.includes('aave') || source.includes('compound') || source.includes('defi')) {
    return 'defi';
  }
  
  if (source.includes('nft') || source.includes('opensea')) {
    return 'nft';
  }
  
  return 'token';
}