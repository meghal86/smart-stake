/**
 * GET /api/v1/portfolio/actions
 * 
 * Returns prioritized recommended actions for a user's portfolio.
 * Implements ActionScore prioritization with cursor pagination.
 * 
 * Requirements: 4.1, 4.3, 15.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RecommendedAction, ApiResponse, ListResponse, FreshnessConfidence } from '@/types/portfolio';
import { 
  calculateActionScore, 
  sortActionsByScore, 
  validateActionTypes,
  type ActionScoringParams 
} from '@/services/ActionScoringService';

// Mock data for development - replace with actual data sources
const MOCK_ACTIONS_DATA = [
  {
    id: 'action-1',
    title: 'Revoke Risky Approval',
    severity: 'critical' as const,
    why: [
      'Unlimited approval to unknown contract',
      'Contract has no verified source code',
      'High value at risk ($2,500)'
    ],
    exposureUsd: 2500,
    ageInHours: 48,
    gasEstimateUsd: 8,
    timeEstimateSec: 30,
    confidence: 0.92,
    intent: 'revoke_approval',
    params: { tokenAddress: '0x...', spenderAddress: '0x...' }
  },
  {
    id: 'action-2',
    title: 'Claim Pending Rewards',
    severity: 'medium' as const,
    why: [
      'Unclaimed rewards worth $150',
      'Rewards expire in 7 days',
      'Low gas cost to claim'
    ],
    exposureUsd: 150,
    ageInHours: 12,
    gasEstimateUsd: 5,
    timeEstimateSec: 45,
    confidence: 0.88,
    intent: 'claim_rewards',
    params: { protocol: 'compound', amount: '150' }
  },
  {
    id: 'action-3',
    title: 'Reduce Exposure Risk',
    severity: 'high' as const,
    why: [
      'Over-concentrated in single protocol',
      '80% of portfolio in one DeFi protocol',
      'Diversification recommended'
    ],
    exposureUsd: 5000,
    ageInHours: 6,
    gasEstimateUsd: 15,
    timeEstimateSec: 120,
    confidence: 0.75,
    intent: 'reduce_exposure',
    params: { protocol: 'aave', targetPercentage: 40 }
  },
  {
    id: 'action-4',
    title: 'Optimize Route',
    severity: 'low' as const,
    why: [
      'Better swap route available',
      'Save $12 in fees',
      'Same execution time'
    ],
    exposureUsd: 12,
    ageInHours: 2,
    gasEstimateUsd: 3,
    timeEstimateSec: 20,
    confidence: 0.95,
    intent: 'optimize_routing',
    params: { fromToken: 'USDC', toToken: 'ETH', amount: '1000' }
  },
  {
    id: 'action-5',
    title: 'Update Approval Hygiene',
    severity: 'medium' as const,
    why: [
      'Old approvals to deprecated contracts',
      'Reduce attack surface',
      'Best practice maintenance'
    ],
    exposureUsd: 800,
    ageInHours: 72,
    gasEstimateUsd: 12,
    timeEstimateSec: 60,
    confidence: 0.82,
    intent: 'approval_hygiene',
    params: { contractsToRevoke: ['0x...', '0x...'] }
  }
];

function generateMockActions(userId: string, walletAddress?: string): RecommendedAction[] {
  return MOCK_ACTIONS_DATA.map(mockData => {
    // Calculate ActionScore using the service
    const scoringParams: ActionScoringParams = {
      severity: mockData.severity,
      exposureUsd: mockData.exposureUsd,
      ageInHours: mockData.ageInHours,
      gasEstimateUsd: mockData.gasEstimateUsd,
      timeEstimateSec: mockData.timeEstimateSec,
      confidence: mockData.confidence,
    };
    
    const actionScore = calculateActionScore(scoringParams);
    
    return {
      id: mockData.id,
      title: mockData.title,
      severity: mockData.severity,
      why: mockData.why,
      impactPreview: {
        riskDelta: mockData.severity === 'critical' ? -0.3 : mockData.severity === 'high' ? -0.2 : -0.1,
        preventedLossP50Usd: mockData.severity === 'critical' ? mockData.exposureUsd * 0.1 : 0,
        expectedGainUsd: mockData.intent === 'claim_rewards' ? mockData.exposureUsd : 0,
        gasEstimateUsd: mockData.gasEstimateUsd,
        timeEstimateSec: mockData.timeEstimateSec,
        confidence: mockData.confidence,
      },
      actionScore,
      cta: {
        label: getCtaLabel(mockData.intent),
        intent: mockData.intent,
        params: mockData.params,
      },
      walletScope: walletAddress 
        ? { mode: 'active_wallet', address: walletAddress as `0x${string}` }
        : { mode: 'all_wallets' },
    };
  });
}

function getCtaLabel(intent: string): string {
  switch (intent) {
    case 'revoke_approval': return 'Review & Revoke';
    case 'claim_rewards': return 'Claim Rewards';
    case 'reduce_exposure': return 'Rebalance';
    case 'optimize_routing': return 'Optimize Route';
    case 'approval_hygiene': return 'Clean Up Approvals';
    default: return 'Take Action';
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'active_wallet';
    const wallet = searchParams.get('wallet');
    const cursor = searchParams.get('cursor');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20); // Max 20 actions

    // Validate scope parameter
    if (!['active_wallet', 'all_wallets'].includes(scope)) {
      return NextResponse.json(
        { error: { code: 'INVALID_SCOPE', message: 'Scope must be active_wallet or all_wallets' } },
        { status: 400 }
      );
    }

    // Validate wallet parameter for active_wallet scope
    if (scope === 'active_wallet' && !wallet) {
      return NextResponse.json(
        { error: { code: 'MISSING_WALLET', message: 'Wallet address required for active_wallet scope' } },
        { status: 400 }
      );
    }

    // Generate mock actions (replace with actual data fetching)
    const allActions = generateMockActions(user.id, wallet || undefined);
    
    // Sort actions by ActionScore
    const sortedActions = sortActionsByScore(allActions);
    
    // Apply cursor pagination
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = sortedActions.findIndex(action => action.id === cursor);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }
    
    const paginatedActions = sortedActions.slice(startIndex, startIndex + limit);
    const nextCursor = paginatedActions.length === limit && startIndex + limit < sortedActions.length
      ? paginatedActions[paginatedActions.length - 1].id
      : undefined;

    // Validate action types
    const validation = validateActionTypes(sortedActions);
    
    // Create freshness metadata
    const freshness: FreshnessConfidence = {
      freshnessSec: 30, // Mock: 30 seconds fresh
      confidence: 0.85, // Mock: 85% confidence
      confidenceThreshold: 0.70,
      degraded: false,
    };

    // Prepare response
    const responseData: ListResponse<RecommendedAction> = {
      items: paginatedActions,
      nextCursor,
      freshness,
    };

    const apiResponse: ApiResponse<ListResponse<RecommendedAction>> = {
      data: responseData,
      apiVersion: 'v1',
      ts: new Date().toISOString(),
    };

    // Add validation metadata to response headers
    const response = NextResponse.json(apiResponse);
    response.headers.set('X-Action-Types-Complete', validation.allMinimumTypesPresent.toString());
    response.headers.set('X-Total-Actions', sortedActions.length.toString());
    
    return response;

  } catch (error) {
    console.error('Error fetching portfolio actions:', error);
    
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'Failed to fetch portfolio actions' 
        } 
      },
      { status: 500 }
    );
  }
}