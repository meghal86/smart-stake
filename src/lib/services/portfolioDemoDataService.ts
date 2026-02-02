/**
 * Portfolio Demo Data Service
 * 
 * Provides realistic sample portfolio data for demo mode.
 * All data is hardcoded and deterministic for consistency.
 * Returns instantly (< 200ms) with no API calls.
 */

import { PortfolioSnapshot, RecommendedAction, ApprovalRisk, FreshnessConfidence } from '@/types/portfolio';

/**
 * Get demo portfolio snapshot
 * 
 * Returns hardcoded sample values that demonstrate portfolio capabilities
 * without requiring authentication or API calls.
 */
export const getDemoPortfolioSnapshot = (): PortfolioSnapshot => {
  return {
    netWorth: 2450000,
    delta24h: 125000,
    trustScore: 89,
    riskScore: 0.23,
    criticalIssues: 0,
    freshness: {
      freshnessSec: 0,
      confidence: 1.0,
      confidenceThreshold: 0.70,
      degraded: false
    } as FreshnessConfidence,
    positions: [
      {
        token: 'ETH',
        balance: 45.5,
        valueUsd: 150000,
        chain: 'ethereum',
        protocol: 'native'
      },
      {
        token: 'USDC',
        balance: 500000,
        valueUsd: 500000,
        chain: 'ethereum',
        protocol: 'native'
      },
      {
        token: 'WBTC',
        balance: 2.5,
        valueUsd: 125000,
        chain: 'ethereum',
        protocol: 'wrapped'
      }
    ],
    chains: [
      { chain: 'ethereum', valueUsd: 1800000, percentage: 73.5 },
      { chain: 'polygon', valueUsd: 400000, percentage: 16.3 },
      { chain: 'arbitrum', valueUsd: 250000, percentage: 10.2 }
    ],
    protocols: [
      { protocol: 'Uniswap', valueUsd: 800000, percentage: 32.7 },
      { protocol: 'Aave', valueUsd: 600000, percentage: 24.5 },
      { protocol: 'Native', valueUsd: 1050000, percentage: 42.8 }
    ]
  };
};

/**
 * Get demo recommended actions
 */
export const getDemoRecommendedActions = (): RecommendedAction[] => {
  return [
    {
      id: 'action-1',
      type: 'revoke_approval',
      severity: 'high',
      title: 'Revoke Risky Approval',
      description: 'Unlimited approval to unknown contract detected',
      impactUsd: 50000,
      confidence: 0.95,
      actionScore: 0.85,
      estimatedGasUsd: 5,
      friction: 'low'
    },
    {
      id: 'action-2',
      type: 'claim_rewards',
      severity: 'medium',
      title: 'Claim Pending Rewards',
      description: 'Unclaimed rewards available on Aave',
      impactUsd: 1200,
      confidence: 0.98,
      actionScore: 0.75,
      estimatedGasUsd: 3,
      friction: 'low'
    },
    {
      id: 'action-3',
      type: 'optimize_routing',
      severity: 'low',
      title: 'Optimize Swap Route',
      description: 'Better routing available for your next swap',
      impactUsd: 150,
      confidence: 0.85,
      actionScore: 0.45,
      estimatedGasUsd: 2,
      friction: 'medium'
    }
  ];
};

/**
 * Get demo approval risks
 */
export const getDemoApprovalRisks = (): ApprovalRisk[] => {
  return [
    {
      id: 'approval-1',
      spender: '0x1234567890123456789012345678901234567890',
      spenderLabel: 'Unknown Contract',
      token: 'USDC',
      amount: 'unlimited',
      valueAtRisk: 500000,
      riskScore: 0.85,
      severity: 'critical',
      confidence: 0.92,
      reasons: [
        'Unlimited approval to unverified contract',
        'Contract not audited',
        'High value at risk'
      ],
      chainId: 1,
      approvedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      lastUsed: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
    },
    {
      id: 'approval-2',
      spender: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      spenderLabel: 'Uniswap V2 Router',
      token: 'WETH',
      amount: 'unlimited',
      valueAtRisk: 150000,
      riskScore: 0.35,
      severity: 'medium',
      confidence: 0.88,
      reasons: [
        'Unlimited approval to known DEX',
        'Contract is audited',
        'Consider limiting approval amount'
      ],
      chainId: 1,
      approvedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
      lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }
  ];
};

/**
 * Check if portfolio data is from demo mode
 */
export const isDemoPortfolioData = (snapshot: PortfolioSnapshot | null | undefined): boolean => {
  if (!snapshot) return false;
  // Demo data has exactly 0 freshness seconds and 1.0 confidence
  return snapshot.freshness.freshnessSec === 0 && snapshot.freshness.confidence === 1.0;
};

/**
 * Get demo portfolio snapshot with custom overrides
 */
export const getDemoPortfolioSnapshotWithOverrides = (
  overrides: Partial<PortfolioSnapshot>
): PortfolioSnapshot => {
  return {
    ...getDemoPortfolioSnapshot(),
    ...overrides,
    freshness: {
      ...getDemoPortfolioSnapshot().freshness,
      ...(overrides.freshness || {})
    }
  };
};
