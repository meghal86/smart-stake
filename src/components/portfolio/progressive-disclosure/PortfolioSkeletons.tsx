/**
 * Portfolio-Specific Skeleton Components
 * 
 * Extends existing Skeleton component with portfolio-specific layouts.
 * Ensures consistent loading states across all portfolio views.
 * 
 * REUSES: src/components/ux/Skeleton.tsx
 * 
 * Validates: Requirements 10.1, 10.2
 */

import React from 'react';
import { 
  Skeleton, 
  CircularSkeleton, 
  TextSkeleton,
  CardSkeleton 
} from '@/components/ux/Skeleton';
import { cn } from '@/lib/utils';

/**
 * Action Card Skeleton
 * Used in RecommendedActionsFeed
 */
export const ActionCardSkeleton = () => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
    {/* Header: Icon + Title */}
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <CircularSkeleton size={40} />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    
    {/* Description */}
    <TextSkeleton lines={2} />
    
    {/* Metrics */}
    <div className="flex items-center justify-between pt-2">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-16" />
    </div>
    
    {/* Action Button */}
    <Skeleton className="h-10 w-full rounded-lg" />
  </div>
);

/**
 * Approval Risk Card Skeleton
 * Used in ApprovalRiskList
 */
export const ApprovalRiskCardSkeleton = () => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
    {/* Header: Protocol + Risk Badge */}
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <CircularSkeleton size={32} />
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    
    {/* Risk Score & VAR */}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-12" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
    
    {/* Contributing Factors */}
    <div className="space-y-2">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

/**
 * Asset Breakdown Skeleton
 * Used in AssetBreakdown component
 */
export const AssetBreakdownSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div 
        key={i}
        className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg"
      >
        <div className="flex items-center space-x-3">
          <CircularSkeleton size={36} />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Transaction Card Skeleton
 * Used in TransactionTimeline
 */
export const TransactionCardSkeleton = () => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 space-y-3">
    {/* Header: Type + Status */}
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <CircularSkeleton size={24} />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    
    {/* Details */}
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
    
    {/* Footer: Time + Value */}
    <div className="flex items-center justify-between pt-2 border-t border-white/10">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

/**
 * Protocol Exposure Skeleton
 * Used in ProtocolExposure component
 */
export const ProtocolExposureSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <div 
        key={i}
        className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg"
      >
        <div className="flex items-center space-x-3">
          <CircularSkeleton size={32} />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Net Worth Card Skeleton
 * Used in NetWorthCard component
 */
export const NetWorthCardSkeleton = () => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 space-y-4">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    
    {/* Net Worth Value */}
    <Skeleton className="h-10 w-48" />
    
    {/* 24h Change */}
    <div className="flex items-center space-x-2">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
    
    {/* Freshness Indicator */}
    <div className="flex items-center space-x-2 pt-2 border-t border-white/10">
      <CircularSkeleton size={16} />
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
);

/**
 * Risk Summary Card Skeleton
 * Used in RiskSummaryCard component
 */
export const RiskSummaryCardSkeleton = () => (
  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 space-y-4">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
    
    {/* Risk Score */}
    <div className="flex items-center space-x-4">
      <CircularSkeleton size={64} />
      <div className="space-y-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
    
    {/* Risk Factors */}
    <div className="space-y-2 pt-2 border-t border-white/10">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

/**
 * Chain Distribution Skeleton
 * Used in ChainDistribution component
 */
export const ChainDistributionSkeleton = () => (
  <div className="space-y-4">
    {/* Chart Placeholder */}
    <div className="h-48 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg flex items-center justify-center">
      <CircularSkeleton size={120} />
    </div>
    
    {/* Legend */}
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Performance Metrics Skeleton
 * Used in PerformanceMetrics component
 */
export const PerformanceMetricsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div 
        key={i}
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 space-y-2"
      >
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    ))}
  </div>
);

/**
 * Intent Plan Executor Skeleton
 * Used in IntentPlanExecutor component
 */
export const IntentPlanExecutorSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-8 w-24 rounded-full" />
    </div>
    
    {/* Steps */}
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-center space-x-3">
            <CircularSkeleton size={32} />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
    
    {/* Action Buttons */}
    <div className="flex space-x-3">
      <Skeleton className="h-10 flex-1 rounded-lg" />
      <Skeleton className="h-10 flex-1 rounded-lg" />
    </div>
  </div>
);

/**
 * Copilot Chat Skeleton
 * Used in CopilotChatDrawer component
 */
export const CopilotChatSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div 
        key={i}
        className={cn(
          'flex',
          i % 2 === 0 ? 'justify-start' : 'justify-end'
        )}
      >
        <div 
          className={cn(
            'max-w-[80%] rounded-lg p-4 space-y-2',
            i % 2 === 0 
              ? 'bg-white/5 border border-white/10' 
              : 'bg-cyan-500/20 border border-cyan-500/30'
          )}
        >
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Graph Lite Visualizer Skeleton
 * Used in GraphLiteVisualizer component
 */
export const GraphLiteVisualizerSkeleton = () => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-24 rounded-lg" />
    </div>
    
    {/* Graph Placeholder */}
    <div className="h-64 bg-white/5 rounded-lg flex items-center justify-center">
      <div className="space-y-4 text-center">
        <CircularSkeleton size={80} />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
    
    {/* Legend */}
    <div className="flex items-center justify-center space-x-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  </div>
);

/**
 * Composite Skeleton for Full Portfolio View
 * Shows all major sections in loading state
 */
export const PortfolioViewSkeleton = () => (
  <div className="space-y-6">
    {/* Net Worth Card */}
    <NetWorthCardSkeleton />
    
    {/* Risk Summary */}
    <RiskSummaryCardSkeleton />
    
    {/* Recommended Actions */}
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <ActionCardSkeleton />
      <ActionCardSkeleton />
      <ActionCardSkeleton />
    </div>
    
    {/* Asset Breakdown */}
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <AssetBreakdownSkeleton />
    </div>
  </div>
);

/**
 * Export all skeletons for easy import
 */
export const PortfolioSkeletons = {
  ActionCard: ActionCardSkeleton,
  ApprovalRiskCard: ApprovalRiskCardSkeleton,
  AssetBreakdown: AssetBreakdownSkeleton,
  TransactionCard: TransactionCardSkeleton,
  ProtocolExposure: ProtocolExposureSkeleton,
  NetWorthCard: NetWorthCardSkeleton,
  RiskSummaryCard: RiskSummaryCardSkeleton,
  ChainDistribution: ChainDistributionSkeleton,
  PerformanceMetrics: PerformanceMetricsSkeleton,
  IntentPlanExecutor: IntentPlanExecutorSkeleton,
  CopilotChat: CopilotChatSkeleton,
  GraphLiteVisualizer: GraphLiteVisualizerSkeleton,
  PortfolioView: PortfolioViewSkeleton
};
