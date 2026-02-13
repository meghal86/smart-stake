import { useState } from 'react';
import { WalletScope, FreshnessConfidence, PortfolioSnapshot, RecommendedAction, ApprovalRisk } from '@/types/portfolio';
import { NetWorthCard } from '../NetWorthCard';
import { RecommendedActionsFeed } from '../RecommendedActionsFeed';
import { RiskSummaryCard } from '../RiskSummaryCard';
import { WhaleInteractionLog } from '../WhaleInteractionLog';

interface OverviewTabProps {
  walletScope: WalletScope;
  freshness: FreshnessConfidence;
  onWalletScopeChange?: (scope: WalletScope) => void;
  snapshot?: PortfolioSnapshot;
  actions: RecommendedAction[];
  approvals: ApprovalRisk[];
  isLoading: boolean;
}

export function OverviewTab({ 
  walletScope, 
  freshness, 
  snapshot, 
  actions, 
  approvals,
  isLoading 
}: OverviewTabProps) {
  console.log('📊 OverviewTab rendering with real data:', {
    hasSnapshot: !!snapshot,
    actionsCount: actions.length,
    approvalsCount: approvals.length,
    isLoading
  });

  // Use real data from props (passed from PortfolioRouteShell)
  const realActions = actions.map(action => ({
    id: action.id,
    title: action.title,
    severity: action.severity,
    why: action.why || [],
    impactPreview: action.impactPreview || {
      riskDelta: 0,
      preventedLossP50Usd: 0,
      expectedGainUsd: 0,
      gasEstimateUsd: 0,
      timeEstimateSec: 0,
      confidence: 0
    },
    actionScore: action.actionScore || 0,
    cta: action.cta || { label: 'View Details', intent: 'view_details', params: {} },
    walletScope
  }));

  // Calculate real risk summary from approvals
  const realRiskSummary = {
    overallScore: snapshot?.riskScore || 0,
    criticalIssues: approvals.filter(a => a.severity === 'critical').length,
    highRiskApprovals: approvals.filter(a => a.severity === 'high').length,
    mediumRiskApprovals: approvals.filter(a => a.severity === 'medium').length,
    lowRiskApprovals: approvals.filter(a => a.severity === 'low').length,
    riskFactors: [
      { 
        name: 'Unlimited Approvals', 
        score: approvals.filter(a => a.riskReasons?.includes('UNLIMITED_ALLOWANCE')).length / Math.max(approvals.length, 1), 
        trend: 'stable' as const
      },
      { 
        name: 'High Value Exposure', 
        score: approvals.filter(a => a.valueAtRisk > 10000).length / Math.max(approvals.length, 1), 
        trend: 'improving' as const
      },
      { 
        name: 'Contract Risk', 
        score: approvals.filter(a => a.riskScore > 0.5).length / Math.max(approvals.length, 1), 
        trend: 'worsening' as const
      }
    ]
  };

  // Whale interactions from snapshot (real data when available)
  const whaleInteractions = snapshot?.whaleInteractions || [];

  const [actionsFilter, setActionsFilter] = useState('all');
  const [whaleFilter, setWhaleFilter] = useState('all');

  console.log('🐋 Whale interactions:', {
    hasSnapshot: !!snapshot,
    whaleInteractionsCount: whaleInteractions.length
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Recommended Actions Feed - Top Priority per Requirements */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
          <span className="text-[#00F5A0]">⚡</span>
          <span>Recommended Actions</span>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin ml-2" />
          )}
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : realActions.length > 0 ? (
          <RecommendedActionsFeed
            actions={realActions}
            freshness={freshness}
            currentFilter={actionsFilter}
            onFilterChange={setActionsFilter}
            showTopN={5}
          />
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No recommended actions at this time</p>
            <p className="text-sm mt-2">Your portfolio looks good!</p>
          </div>
        )}
      </div>

      {/* Risk Summary Card */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
          <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
          <span>Risk Summary</span>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin ml-2" />
          )}
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
          </div>
        ) : (
          <RiskSummaryCard
            riskSummary={realRiskSummary}
            freshness={freshness}
            walletScope={walletScope}
          />
        )}
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white/90 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400">📊</span>
          <span>Recent Activity Timeline</span>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin ml-2" />
          )}
        </h3>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : whaleInteractions.length > 0 ? (
          <WhaleInteractionLog
            interactions={whaleInteractions}
            currentFilter={whaleFilter}
            onFilterChange={setWhaleFilter}
          />
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No whale interactions detected</p>
            <p className="text-sm mt-2">Your wallet hasn't interacted with any whale addresses recently</p>
          </div>
        )}
      </div>
    </div>
  );
}