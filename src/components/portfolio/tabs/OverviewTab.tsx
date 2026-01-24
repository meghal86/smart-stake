import { useState } from 'react';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { NetWorthCard } from '../NetWorthCard';
import { RecommendedActionsFeed } from '../RecommendedActionsFeed';
import { RiskSummaryCard } from '../RiskSummaryCard';
import { WhaleInteractionLog } from '../WhaleInteractionLog';

interface OverviewTabProps {
  walletScope: WalletScope;
  freshness: FreshnessConfidence;
  onWalletScopeChange?: (scope: WalletScope) => void;
}

export function OverviewTab({ walletScope, freshness }: OverviewTabProps) {
  // Mock data - will be replaced with real API integration
  const [mockNetWorth] = useState({
    totalValue: 2450000,
    delta24h: 125000,
    deltaPercent: 5.38,
    breakdown: [
      { chain: 'Ethereum', value: 1470000, percentage: 60 },
      { chain: 'Bitcoin', value: 490000, percentage: 20 },
      { chain: 'Solana', value: 294000, percentage: 12 },
      { chain: 'Polygon', value: 196000, percentage: 8 }
    ]
  });

  const [mockActions] = useState([
    {
      id: 'action-1',
      title: 'Revoke risky USDC approval',
      severity: 'critical' as const,
      why: ['Unlimited approval to unknown spender', 'Contract upgraded recently', 'High value at risk'],
      impactPreview: {
        riskDelta: -0.45,
        preventedLossP50Usd: 25000,
        expectedGainUsd: 0,
        gasEstimateUsd: 12,
        timeEstimateSec: 30,
        confidence: 0.89
      },
      actionScore: 95.2,
      cta: { label: 'Review & Revoke', intent: 'revoke_approval', params: {} },
      walletScope
    },
    {
      id: 'action-2', 
      title: 'Claim pending rewards',
      severity: 'medium' as const,
      why: ['$2,400 in unclaimed rewards', 'Rewards accumulating daily', 'Low gas cost to claim'],
      impactPreview: {
        riskDelta: 0,
        preventedLossP50Usd: 0,
        expectedGainUsd: 2400,
        gasEstimateUsd: 8,
        timeEstimateSec: 45,
        confidence: 0.92
      },
      actionScore: 78.5,
      cta: { label: 'Claim Rewards', intent: 'claim_rewards', params: {} },
      walletScope
    }
  ]);

  const [mockRiskSummary] = useState({
    overallScore: 0.23,
    criticalIssues: 1,
    highRiskApprovals: 3,
    mediumRiskApprovals: 7,
    lowRiskApprovals: 12,
    riskFactors: [
      { name: 'Unlimited Approvals', score: 0.8, trend: 'stable' },
      { name: 'Contract Age Risk', score: 0.4, trend: 'improving' },
      { name: 'Concentration Risk', score: 0.15, trend: 'worsening' }
    ]
  });

  const [mockWhaleInteractions] = useState([
    {
      id: 'whale-1',
      timestamp: new Date(Date.now() - 1800000), // 30 min ago
      type: 'CEX_OUTFLOW' as const,
      token: 'ETH',
      amount: 15000,
      value: 45000000,
      whaleAddress: '0x8ba1f109551bD432803012645Hac136c22C501e',
      impact: 'high' as const,
      portfolioEffect: 2.3,
      description: 'Large ETH withdrawal from Binance by known whale',
      txHash: '0x123...'
    },
    {
      id: 'whale-2',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      type: 'DEX_SWAP' as const,
      token: 'USDC',
      amount: 5000000,
      value: 5000000,
      whaleAddress: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      impact: 'medium' as const,
      portfolioEffect: -0.8,
      description: 'Large USDC to ETH swap on Uniswap',
      txHash: '0x456...'
    }
  ]);

  const [actionsFilter, setActionsFilter] = useState('all');
  const [whaleFilter, setWhaleFilter] = useState('all');

  return (
    <div className="space-y-6">
      {/* Net Worth Card - Extended existing component */}
      <NetWorthCard
        netWorth={mockNetWorth}
        freshness={freshness}
        walletScope={walletScope}
      />

      {/* Recommended Actions Feed - New component with progressive disclosure */}
      <RecommendedActionsFeed
        actions={mockActions}
        freshness={freshness}
        currentFilter={actionsFilter}
        onFilterChange={setActionsFilter}
        showTopN={5}
      />

      {/* Risk Summary Card - Extended existing component */}
      <RiskSummaryCard
        riskSummary={mockRiskSummary}
        freshness={freshness}
        walletScope={walletScope}
      />

      {/* Recent Activity Timeline - Reuse existing WhaleInteractionLog */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity Timeline</h3>
        <WhaleInteractionLog
          interactions={mockWhaleInteractions}
          currentFilter={whaleFilter}
          onFilterChange={setWhaleFilter}
        />
      </div>
    </div>
  );
}