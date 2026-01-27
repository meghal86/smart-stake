import { useState } from 'react';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { TransactionTimeline } from '../TransactionTimeline';
import { ApprovalsRiskList } from '../ApprovalsRiskList';
import { GraphLiteVisualizer } from '../GraphLiteVisualizer';
import { PlannedVsExecutedReceipts } from '../PlannedVsExecutedReceipts';
import { StressTestPanel } from '../StressTestPanel';

interface AuditTabProps {
  walletScope: WalletScope;
  freshness: FreshnessConfidence;
  onWalletScopeChange?: (scope: WalletScope) => void;
}

export function AuditTab({ walletScope, freshness }: AuditTabProps) {
  // Mock data - will be replaced with real API integration
  const [mockTransactions] = useState([
    {
      id: 'tx-1',
      hash: '0x1234567890abcdef1234567890abcdef12345678',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      type: 'swap' as const,
      from: walletScope.mode === 'active_wallet' ? walletScope.address : '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      to: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      value: 1500,
      gasUsed: 150000,
      gasPrice: 20,
      status: 'success' as const,
      aiTags: ['high-value', 'dex-interaction', 'price-impact-low'],
      riskScore: 0.2,
      description: 'Swapped 1 ETH for 1,500 USDC on Uniswap V3'
    },
    {
      id: 'tx-2',
      hash: '0xabcdef1234567890abcdef1234567890abcdef12',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      type: 'approval' as const,
      from: walletScope.mode === 'active_wallet' ? walletScope.address : '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      value: 0,
      gasUsed: 46000,
      gasPrice: 25,
      status: 'success' as const,
      aiTags: ['approval', 'unlimited-allowance', 'router-contract'],
      riskScore: 0.6,
      description: 'Approved unlimited USDC spending for Uniswap Router'
    }
  ]);

  const [mockApprovals] = useState([
    {
      id: 'approval-1',
      token: 'USDC',
      tokenAddress: '0xA0b86a33E6c3b4c6c7c8c9c0c1c2c3c4c5c6c7c8',
      spender: 'Uniswap V3 Router',
      spenderAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      amount: 'unlimited',
      riskScore: 0.6,
      severity: 'medium' as const,
      valueAtRisk: 25000,
      riskReasons: ['UNLIMITED_ALLOWANCE', 'HIGH_VALUE_EXPOSURE'],
      contributingFactors: [
        { factor: 'Unlimited Approval', weight: 0.4, description: 'No spending limit set' },
        { factor: 'High Value Exposure', weight: 0.3, description: '$25K+ at risk' },
        { factor: 'Router Contract', weight: 0.2, description: 'Automated trading contract' }
      ],
      ageInDays: 15,
      isPermit2: false,
      chainId: 1
    },
    {
      id: 'approval-2',
      token: 'ETH',
      tokenAddress: '0x0000000000000000000000000000000000000000',
      spender: 'Compound V3',
      spenderAddress: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
      amount: '5.0',
      riskScore: 0.3,
      severity: 'low' as const,
      valueAtRisk: 12500,
      riskReasons: ['LIMITED_ALLOWANCE', 'VERIFIED_PROTOCOL'],
      contributingFactors: [
        { factor: 'Limited Approval', weight: 0.2, description: 'Specific amount approved' },
        { factor: 'Verified Protocol', weight: 0.1, description: 'Well-known lending protocol' }
      ],
      ageInDays: 5,
      isPermit2: false,
      chainId: 1
    }
  ]);

  const [mockFlowData] = useState({
    nodes: [
      { id: 'wallet', label: 'Your Wallet', type: 'wallet', riskLevel: 'low' },
      { id: 'uniswap', label: 'Uniswap V3', type: 'protocol', riskLevel: 'low' },
      { id: 'compound', label: 'Compound', type: 'protocol', riskLevel: 'low' },
      { id: 'unknown', label: 'Unknown Contract', type: 'contract', riskLevel: 'high' }
    ],
    edges: [
      { from: 'wallet', to: 'uniswap', type: 'approval', amount: 'unlimited', risk: 'medium' },
      { from: 'wallet', to: 'compound', type: 'approval', amount: '5.0 ETH', risk: 'low' },
      { from: 'wallet', to: 'unknown', type: 'interaction', amount: '0.1 ETH', risk: 'high' }
    ]
  });

  const [mockReceipts] = useState([
    {
      id: 'plan-1',
      planId: 'plan_abc123',
      intent: 'revoke_approvals',
      plannedSteps: 2,
      executedSteps: 2,
      status: 'completed' as const,
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      completedAt: new Date(Date.now() - 86300000),
      gasEstimated: 92000,
      gasActual: 89500,
      description: 'Revoked risky USDC and DAI approvals'
    },
    {
      id: 'plan-2',
      planId: 'plan_def456',
      intent: 'claim_rewards',
      plannedSteps: 1,
      executedSteps: 0,
      status: 'failed' as const,
      createdAt: new Date(Date.now() - 43200000), // 12 hours ago
      completedAt: null,
      gasEstimated: 45000,
      gasActual: null,
      description: 'Claim pending Compound rewards',
      failureReason: 'Insufficient gas for execution'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Stress Test Simulator - New comprehensive feature */}
      <StressTestPanel
        portfolioValue={2450000} // This should come from actual portfolio data
        onRunTest={(scenarios) => {
          console.log('Running stress test with scenarios:', scenarios);
          // TODO: Integrate with backend stress test API
        }}
      />

      {/* Transaction Timeline - Extended existing component */}
      <TransactionTimeline
        transactions={mockTransactions}
        walletScope={walletScope}
        freshness={freshness}
      />

      {/* Approvals Risk List - New component with VAR + severity display */}
      <ApprovalsRiskList
        approvals={mockApprovals}
        freshness={freshness}
        walletScope={walletScope}
      />

      {/* Graph-Lite Visualizer - V1: Static mini diagram/list-based flow */}
      <GraphLiteVisualizer
        flowData={mockFlowData}
        freshness={freshness}
        walletScope={walletScope}
        version="v0" // V1: static placeholder, V1.1: full interactive
      />

      {/* Planned vs Executed Receipts - New component */}
      <PlannedVsExecutedReceipts
        receipts={mockReceipts}
        freshness={freshness}
        walletScope={walletScope}
      />
    </div>
  );
}