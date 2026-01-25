import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WalletScope, FreshnessConfidence, ListResponse } from '@/types/portfolio';
import { riskAwareCache } from '@/lib/cache/RiskAwareCacheService';

/**
 * Audit Event interface
 */
interface AuditEvent {
  id: string;
  userId: string;
  walletScope: WalletScope;
  eventType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  planId?: string;
  stepId?: string;
  metadata: Record<string, any>;
  createdAt: string;
}

/**
 * GET /api/v1/portfolio/audit/events
 * 
 * Returns paginated list of audit events with filtering by scope and cursor pagination.
 * Includes plan creation, execution events, policy blocks, and simulation failures.
 * 
 * Requirements: 15.2, 15.3
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const scope = searchParams.get('scope') as 'active_wallet' | 'all_wallets' || 'active_wallet';
    const wallet = searchParams.get('wallet');
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity') as 'critical' | 'high' | 'medium' | 'low' | null;
    const planId = searchParams.get('planId');
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
    const cacheKey = generateCacheKey(userId, walletScope, eventType, severity, planId, cursor, limit);
    
    // Try cache first
    const cached = riskAwareCache.get<ListResponse<AuditEvent>>(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        apiVersion: 'v1'
      });
    }

    // Get audit events
    const result = await getAuditEvents(userId, walletScope, {
      eventType,
      severity,
      planId,
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
    console.error('Portfolio audit events API error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch audit events'
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Get audit events with filtering and pagination
 */
async function getAuditEvents(
  userId: string,
  walletScope: WalletScope,
  options: {
    eventType?: string | null;
    severity?: string | null;
    planId?: string | null;
    cursor?: string | null;
    limit: number;
  }
): Promise<ListResponse<AuditEvent>> {
  const startTime = Date.now();
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build query
    let query = supabase
      .from('audit_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply wallet scope filter
    if (walletScope.mode === 'active_wallet') {
      query = query.contains('wallet_scope', { address: walletScope.address });
    }

    // Apply filters
    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options.severity) {
      query = query.eq('severity', options.severity);
    }

    if (options.planId) {
      query = query.eq('plan_id', options.planId);
    }

    // Apply cursor pagination
    if (options.cursor) {
      query = query.lt('created_at', options.cursor);
    }

    // Apply limit
    query = query.limit(options.limit + 1); // +1 to check for next page

    const { data: events, error } = await query;

    if (error) {
      console.error('Database error fetching audit events:', error);
      throw error;
    }

    // Process results
    const hasNextPage = events && events.length > options.limit;
    const items = hasNextPage ? events.slice(0, -1) : (events || []);
    const nextCursor = hasNextPage ? events[events.length - 2].created_at : undefined;

    // Map to AuditEvent interface
    const auditEvents: AuditEvent[] = items.map(event => ({
      id: event.id,
      userId: event.user_id,
      walletScope: event.wallet_scope,
      eventType: event.event_type,
      severity: event.severity,
      planId: event.plan_id,
      stepId: event.step_id,
      metadata: event.metadata || {},
      createdAt: event.created_at
    }));

    // Calculate freshness
    const freshness = calculateFreshness(startTime);

    return {
      items: auditEvents,
      freshness,
      nextCursor
    };

  } catch (error) {
    console.error('Error fetching audit events:', error);
    throw error;
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
 * Generate cache key for audit events
 */
function generateCacheKey(
  userId: string,
  walletScope: WalletScope,
  eventType?: string | null,
  severity?: string | null,
  planId?: string | null,
  cursor?: string | null,
  limit?: number
): string {
  const scopeKey = walletScope.mode === 'active_wallet' 
    ? `${walletScope.mode}_${walletScope.address}`
    : walletScope.mode;
  
  const filterKey = [
    eventType && `type_${eventType}`,
    severity && `sev_${severity}`,
    planId && `plan_${planId}`,
    cursor && `cursor_${cursor}`,
    limit && `limit_${limit}`
  ].filter(Boolean).join('_');
  
  return `audit_events_${userId}_${scopeKey}_${filterKey}`;
}

/**
 * Calculate freshness metadata
 */
function calculateFreshness(startTime: number): FreshnessConfidence {
  const freshnessSec = Math.floor((Date.now() - startTime) / 1000);
  
  return {
    freshnessSec,
    confidence: 0.98, // High confidence for database queries
    confidenceThreshold: 0.70,
    degraded: false
  };
}

/**
 * Determine cache severity based on audit events
 */
function determineCacheSeverity(events: AuditEvent[]): 'critical' | 'high' | 'medium' | 'low' {
  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const highCount = events.filter(e => e.severity === 'high').length;
  
  if (criticalCount > 0) return 'critical';
  if (highCount > 0) return 'high';
  if (events.length > 0) return 'medium';
  return 'low';
}