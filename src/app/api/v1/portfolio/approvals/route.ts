import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ApprovalRisk, WalletScope, FreshnessConfidence, ListResponse } from '@/types/portfolio';
import { createApprovalRisk } from '@/lib/portfolio/approvalRiskEngine';
import { requestGuardianScan } from '@/services/guardianService';
import { riskAwareCache } from '@/lib/cache/RiskAwareCacheService';

/**
 * GET /api/v1/portfolio/approvals
 * 
 * Returns paginated list of ApprovalRisk objects with risk scores, severity, VAR, and contributing factors.
 * Supports filtering by severity and chain, with cursor pagination for large datasets.
 * 
 * Requirements: 5.1, 5.2, 5.3, 15.3
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const scope = searchParams.get('scope') as 'active_wallet' | 'all_wallets' || 'active_wallet';
    const wallet = searchParams.get('wallet');
    const severity = searchParams.get('severity') as 'critical' | 'high' | 'medium' | 'low' | null;
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

    // Get user ID from auth (placeholder - implement actual auth)
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
    const cacheKey = generateCacheKey(userId, walletScope, severity, chainId, cursor, limit);
    
    // Try cache first
    const cached = riskAwareCache.get<ListResponse<ApprovalRisk>>(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        apiVersion: 'v1'
      });
    }

    // Get approval data
    const result = await getApprovalRisks(userId, walletScope, {
      severity,
      chainId,
      cursor,
      limit
    });

    // Cache the result
    const cacheSeverity = determineCacheSeverity(result.items);
    riskAwareCache.set(cacheKey, result, cacheSeverity);

    return NextResponse.json({
      ...result,
      apiVersion: 'v1'
    });

  } catch (error) {
    console.error('Portfolio approvals API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch approval risks'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Get approval risks with filtering and pagination
 */
async function getApprovalRisks(
  userId: string,
  walletScope: WalletScope,
  options: {
    severity?: string | null;
    chainId?: number | null;
    cursor?: string | null;
    limit: number;
  }
): Promise<ListResponse<ApprovalRisk>> {
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

    // Get approval data from Guardian for each address
    const approvalPromises = addresses.map(async (address) => {
      try {
        const scanResult = await requestGuardianScan({
          walletAddress: address,
          network: 'ethereum' // TODO: Support multiple networks
        });
        
        return mapGuardianToApprovalRisks(scanResult, address);
      } catch (error) {
        console.error(`Failed to get approvals for ${address}:`, error);
        return [];
      }
    });

    const approvalArrays = await Promise.allSettled(approvalPromises);
    
    // Flatten and combine all approvals
    const allApprovals: ApprovalRisk[] = [];
    let successfulScans = 0;
    
    for (const result of approvalArrays) {
      if (result.status === 'fulfilled') {
        allApprovals.push(...result.value);
        successfulScans++;
      }
    }

    // Apply filters
    let filteredApprovals = allApprovals;
    
    if (options.severity) {
      filteredApprovals = filteredApprovals.filter(approval => 
        approval.severity === options.severity
      );
    }
    
    if (options.chainId) {
      filteredApprovals = filteredApprovals.filter(approval => 
        approval.chainId === options.chainId
      );
    }

    // Sort by risk score (highest first)
    filteredApprovals.sort((a, b) => b.riskScore - a.riskScore);

    // Apply cursor pagination
    let startIndex = 0;
    if (options.cursor) {
      const cursorIndex = filteredApprovals.findIndex(approval => approval.id === options.cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const paginatedApprovals = filteredApprovals.slice(startIndex, startIndex + options.limit);
    const nextCursor = paginatedApprovals.length === options.limit 
      ? paginatedApprovals[paginatedApprovals.length - 1].id 
      : undefined;

    // Calculate freshness and confidence
    const freshness = calculateFreshness(successfulScans, addresses.length, startTime);

    return {
      items: paginatedApprovals,
      freshness,
      nextCursor
    };

  } catch (error) {
    console.error('Error fetching approval risks:', error);
    throw error;
  }
}

/**
 * Map Guardian scan results to ApprovalRisk objects
 */
function mapGuardianToApprovalRisks(scanResult: any, walletAddress: string): ApprovalRisk[] {
  const approvals: ApprovalRisk[] = [];
  
  // TODO: Implement proper Guardian API response mapping
  // This is a placeholder implementation
  
  if (scanResult.approvals && Array.isArray(scanResult.approvals)) {
    for (const approval of scanResult.approvals) {
      try {
        const approvalRisk = createApprovalRisk(
          `${walletAddress}_${approval.token}_${approval.spender}`,
          approval.token || 'UNKNOWN',
          approval.spender || '0x0000000000000000000000000000000000000000',
          approval.amount || 'unlimited',
          approval.ageInDays || 0,
          approval.chainId || 1,
          approval.tokenPriceUsd,
          approval.tokenDecimals
        );
        
        approvals.push(approvalRisk);
      } catch (error) {
        console.error('Error creating approval risk:', error);
        // Continue processing other approvals
      }
    }
  }
  
  return approvals;
}

/**
 * Resolve wallet addresses based on scope
 */
async function resolveWalletAddresses(userId: string, walletScope: WalletScope): Promise<string[]> {
  if (walletScope.mode === 'active_wallet') {
    return [walletScope.address];
  }
  
  // TODO: Implement database lookup for all user wallets
  // For now, return empty array as placeholder
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
  // This is a placeholder implementation
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  
  // For now, return a mock user ID
  return 'mock-user-id';
}

/**
 * Generate cache key for approval risks
 */
function generateCacheKey(
  userId: string,
  walletScope: WalletScope,
  severity?: string | null,
  chainId?: number | null,
  cursor?: string | null,
  limit?: number
): string {
  const scopeKey = walletScope.mode === 'active_wallet' 
    ? `${walletScope.mode}_${walletScope.address}`
    : walletScope.mode;
  
  const filterKey = [
    severity && `sev_${severity}`,
    chainId && `chain_${chainId}`,
    cursor && `cursor_${cursor}`,
    limit && `limit_${limit}`
  ].filter(Boolean).join('_');
  
  return `approvals_${userId}_${scopeKey}_${filterKey}`;
}

/**
 * Calculate freshness and confidence metadata
 */
function calculateFreshness(successfulScans: number, totalAddresses: number, startTime: number): FreshnessConfidence {
  const confidence = totalAddresses > 0 ? successfulScans / totalAddresses : 0;
  const freshnessSec = Math.floor((Date.now() - startTime) / 1000);
  
  return {
    freshnessSec,
    confidence: Math.max(0.50, confidence), // Min confidence threshold
    confidenceThreshold: 0.70,
    degraded: confidence < 0.70,
    degradedReasons: confidence < 0.70 ? ['Some wallet scans failed'] : undefined
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
 * Determine cache severity based on approval risks
 */
function determineCacheSeverity(approvals: ApprovalRisk[]): 'critical' | 'high' | 'medium' | 'low' {
  const criticalCount = approvals.filter(a => a.severity === 'critical').length;
  const highCount = approvals.filter(a => a.severity === 'high').length;
  
  if (criticalCount > 0) return 'critical';
  if (highCount > 0) return 'high';
  if (approvals.length > 0) return 'medium';
  return 'low';
}