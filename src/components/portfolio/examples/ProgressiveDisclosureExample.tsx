/**
 * Progressive Disclosure Usage Examples
 * 
 * Demonstrates how to use ProgressiveDisclosureList with portfolio components.
 * Shows all required states: loading, error, empty, success.
 * 
 * Validates: Requirements 10.1, 10.2
 */

'use client';

import React from 'react';
import { ProgressiveDisclosureList } from '../ProgressiveDisclosureList';
import { 
  ActionCardSkeleton, 
  ApprovalRiskCardSkeleton,
  PositionCardSkeleton,
  SkeletonGrid
} from '../PortfolioSkeletons';
import {
  NoActionsEmptyState,
  NoApprovalsEmptyState,
  NoPositionsEmptyState,
  DegradedModeBanner,
  ErrorState
} from '../PortfolioEmptyStates';

// Mock data types
interface RecommendedAction {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  why: string[];
  impactPreview: {
    riskDelta: number;
    preventedLossP50Usd: number;
    gasEstimateUsd: number;
  };
}

interface ApprovalRisk {
  id: string;
  token: string;
  spender: string;
  riskScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  valueAtRisk: number;
}

/**
 * Example 1: Recommended Actions Feed
 */
export function RecommendedActionsFeedExample() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [actions, setActions] = React.useState<RecommendedAction[]>([]);

  // Render individual action card
  const renderAction = (action: RecommendedAction, index: number) => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          action.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
          action.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
          action.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {action.severity.toUpperCase()}
        </span>
      </div>
      
      <h3 className="text-white font-semibold mb-2">{action.title}</h3>
      
      <ul className="text-sm text-white/70 space-y-1 mb-4">
        {action.why.map((reason, i) => (
          <li key={i}>• {reason}</li>
        ))}
      </ul>
      
      <div className="flex gap-4 text-xs text-white/60 mb-4">
        <div>
          <span className="text-white/40">Risk Δ:</span> {action.impactPreview.riskDelta.toFixed(2)}
        </div>
        <div>
          <span className="text-white/40">Prevented Loss:</span> ${action.impactPreview.preventedLossP50Usd}
        </div>
        <div>
          <span className="text-white/40">Gas:</span> ${action.impactPreview.gasEstimateUsd}
        </div>
      </div>
      
      <button className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors duration-150">
        Review Plan
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Recommended Actions</h2>
      
      <ProgressiveDisclosureList
        items={actions}
        renderItem={renderAction}
        initialCount={5}
        isLoading={isLoading}
        error={error}
        emptyState={<NoActionsEmptyState onAction={() => setIsLoading(true)} />}
        loadingSkeleton={<SkeletonGrid count={5} SkeletonComponent={ActionCardSkeleton} />}
        viewAllText="View all actions"
        showLessText="Show top 5"
        componentName="RecommendedActionsFeed"
        onExpansionChange={(isExpanded) => {
          console.log('Actions feed expanded:', isExpanded);
        }}
      />
    </div>
  );
}

/**
 * Example 2: Approval Risks List
 */
export function ApprovalRisksListExample() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [approvals, setApprovals] = React.useState<ApprovalRisk[]>([]);

  // Render individual approval card
  const renderApproval = (approval: ApprovalRisk, index: number) => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {approval.token.slice(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{approval.token}</h3>
            <p className="text-xs text-white/60">{approval.spender.slice(0, 10)}...</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
          approval.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
          approval.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
          approval.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-blue-500/20 text-blue-400'
        }`}>
          {approval.severity.toUpperCase()}
        </span>
      </div>
      
      <div className="text-sm text-white/70 mb-4">
        <div className="flex justify-between">
          <span>Risk Score:</span>
          <span className="text-white">{(approval.riskScore * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Value at Risk:</span>
          <span className="text-white">${approval.valueAtRisk.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors duration-150">
          Revoke
        </button>
        <button className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-150">
          Details
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Approval Risks</h2>
      
      <ProgressiveDisclosureList
        items={approvals}
        renderItem={renderApproval}
        initialCount={5}
        isLoading={isLoading}
        error={error}
        emptyState={<NoApprovalsEmptyState onAction={() => console.log('Connect wallet')} />}
        loadingSkeleton={<SkeletonGrid count={5} SkeletonComponent={ApprovalRiskCardSkeleton} />}
        componentName="ApprovalRisksList"
      />
    </div>
  );
}

/**
 * Example 3: With Degraded Mode Banner
 */
export function DegradedModeExample() {
  const confidence = 0.65;
  const threshold = 0.70;
  const [actions, setActions] = React.useState<RecommendedAction[]>([]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Portfolio Overview</h2>
      
      {/* Show degraded mode banner when confidence < threshold */}
      {confidence < threshold && (
        <DegradedModeBanner
          confidence={confidence}
          threshold={threshold}
          reasons={[
            'Guardian security scan is temporarily unavailable',
            'Some price feeds are delayed',
            'Risky actions are temporarily restricted'
          ]}
        />
      )}
      
      <ProgressiveDisclosureList
        items={actions}
        renderItem={(action) => <div>Action: {action.title}</div>}
        initialCount={5}
        componentName="DegradedModeActions"
      />
    </div>
  );
}

/**
 * Example 4: Error State with Retry
 */
export function ErrorStateExample() {
  const [error, setError] = React.useState<Error | null>(new Error('Failed to load data'));
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    // Simulate retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    setError(null);
    setIsRetrying(false);
  };

  if (error) {
    return (
      <ErrorState
        title="Failed to Load Actions"
        message="We couldn't load your recommended actions. This might be a temporary issue."
        onRetry={handleRetry}
        retryLabel={isRetrying ? 'Retrying...' : 'Try Again'}
      />
    );
  }

  return <div>Content loaded successfully</div>;
}
