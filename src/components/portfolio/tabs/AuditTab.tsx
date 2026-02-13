import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WalletScope, FreshnessConfidence, ApprovalRisk } from '@/types/portfolio';
import { TransactionTimeline } from '../TransactionTimeline';
import { ApprovalsRiskList } from '../ApprovalsRiskList';
import { GraphLiteVisualizer } from '../GraphLiteVisualizer';
import { PlannedVsExecutedReceipts } from '../PlannedVsExecutedReceipts';
import { fetchWalletTransactions } from '@/lib/services/portfolioEdgeFunctions';
import { useDemoMode } from '@/lib/ux/DemoModeManager';

interface AuditTabProps {
  walletScope: WalletScope;
  freshness: FreshnessConfidence;
  approvals: ApprovalRisk[]; // Real approvals from parent
  onWalletScopeChange?: (scope: WalletScope) => void;
}

export function AuditTab({ walletScope, freshness, approvals }: AuditTabProps) {
  const { isDemo } = useDemoMode();

  console.log('🔍 AuditTab rendering with real data:', {
    hasApprovals: approvals.length > 0,
    approvalsCount: approvals.length,
    walletScope,
    isDemo
  });

  // Fetch real transactions from database
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions', walletScope, isDemo],
    queryFn: async () => {
      if (isDemo) {
        // Return demo transactions
        return [
          {
            id: 'tx-demo-1',
            hash: '0x1234567890abcdef1234567890abcdef12345678',
            timestamp: new Date(Date.now() - 3600000),
            type: 'swap' as const,
            from: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
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
            id: 'tx-demo-2',
            hash: '0xabcdef1234567890abcdef1234567890abcdef12',
            timestamp: new Date(Date.now() - 7200000),
            type: 'approval' as const,
            from: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
            to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
            value: 0,
            gasUsed: 46000,
            gasPrice: 25,
            status: 'success' as const,
            aiTags: ['approval', 'unlimited-allowance', 'router-contract'],
            riskScore: 0.6,
            description: 'Approved unlimited USDC spending for Uniswap Router'
          }
        ];
      }

      // Fetch real transactions for active wallet
      if (walletScope.mode === 'active_wallet') {
        console.log('📜 Fetching real transactions for:', walletScope.address);
        return await fetchWalletTransactions(walletScope.address, 50);
      }

      // For all wallets mode, we'd need to aggregate (not implemented yet)
      return [];
    },
    enabled: true,
    staleTime: 60_000,
    refetchInterval: isDemo ? false : 5 * 60_000,
  });

  // Mock flow data for graph visualizer (TODO: implement real graph data)
  const [mockFlowData] = useState({
    nodes: [
      { id: 'wallet', label: 'Your Wallet', type: 'wallet' as const, riskLevel: 'low' as const, x: 400, y: 250 },
      { id: 'uniswap', label: 'Uniswap V3', type: 'protocol' as const, riskLevel: 'low' as const, x: 250, y: 150 },
      { id: 'compound', label: 'Compound', type: 'protocol' as const, riskLevel: 'low' as const, x: 550, y: 150 },
      { id: 'unknown', label: 'Unknown Contract', type: 'contract' as const, riskLevel: 'high' as const, x: 400, y: 400 }
    ],
    edges: [
      { from: 'wallet', to: 'uniswap', type: 'approval' as const, amount: 'unlimited', risk: 'medium' as const },
      { from: 'wallet', to: 'compound', type: 'approval' as const, amount: '5.0 ETH', risk: 'low' as const },
      { from: 'wallet', to: 'unknown', type: 'interaction' as const, amount: '0.1 ETH', risk: 'high' as const }
    ]
  });

  // Mock receipts (TODO: implement real receipts from database)
  const [mockReceipts] = useState([
    {
      id: 'plan-1',
      planId: 'plan_abc123',
      intent: 'revoke_approvals',
      plannedSteps: 2,
      executedSteps: 2,
      status: 'completed' as const,
      createdAt: new Date(Date.now() - 86400000),
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
      createdAt: new Date(Date.now() - 43200000),
      completedAt: null,
      gasEstimated: 45000,
      gasActual: null,
      description: 'Claim pending Compound rewards',
      failureReason: 'Insufficient gas for execution'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Transaction Timeline - Extended existing component */}
      <TransactionTimeline
        transactions={transactions}
        walletScope={walletScope}
        freshness={freshness}
      />

      {/* Approvals Risk List - New component with VAR + severity display */}
      <ApprovalsRiskList
        approvals={approvals}
        freshness={freshness}
        walletScope={walletScope}
      />

      {/* Graph-Lite Visualizer - V1.1: Full interactive graph */}
      <GraphLiteVisualizer
        flowData={mockFlowData}
        freshness={freshness}
        walletScope={walletScope}
        version="v1" // V1.1: full interactive graph with zoom, pan, and filtering
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