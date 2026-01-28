/**
 * Progressive Disclosure Components - Barrel Export
 * 
 * Centralized exports for all progressive disclosure components.
 * 
 * REUSES:
 * - ExpandableCard from src/components/ux/ExpandableCard.tsx
 * - ProgressiveDisclosureList from src/components/portfolio/ProgressiveDisclosureList.tsx
 * - EnhancedErrorBoundary from src/components/ux/EnhancedErrorBoundary.tsx
 * - Skeleton from src/components/ux/Skeleton.tsx
 * 
 * Validates: Requirements 10.1, 10.2
 */

// Re-export existing components (REUSE)
export {
  ExpandableCard,
  ExpandableCardSection,
  ExpandableCardGrid,
  type ExpandableCardProps,
  type ExpandableCardSectionProps,
  type ExpandableCardGridProps
} from '@/components/ux/ExpandableCard';

export {
  ProgressiveDisclosureList,
  type ProgressiveDisclosureListProps
} from '@/components/portfolio/ProgressiveDisclosureList';

export {
  EnhancedErrorBoundary,
  useErrorHandler,
  withEnhancedErrorBoundary,
  type EnhancedErrorBoundaryProps,
  type ErrorFallbackProps
} from '@/components/ux/EnhancedErrorBoundary';

export {
  Skeleton,
  TextSkeleton,
  CircularSkeleton,
  CardSkeleton,
  ButtonSkeleton,
  OpportunityCardSkeleton,
  FeatureCardSkeleton,
  NavigationSkeleton,
  type SkeletonProps
} from '@/components/ux/Skeleton';

export {
  useProgressiveDisclosure,
  getDisclosureStyles,
  createDisclosureClasses,
  type DisclosureState,
  type DisclosureOptions,
  type DisclosureManager
} from '@/lib/ux/ProgressiveDisclosure';

// Export portfolio-specific components (NEW)
export {
  PortfolioSkeletons,
  ActionCardSkeleton,
  ApprovalRiskCardSkeleton,
  AssetBreakdownSkeleton,
  TransactionCardSkeleton,
  ProtocolExposureSkeleton,
  NetWorthCardSkeleton,
  RiskSummaryCardSkeleton,
  ChainDistributionSkeleton,
  PerformanceMetricsSkeleton,
  IntentPlanExecutorSkeleton,
  CopilotChatSkeleton,
  GraphLiteVisualizerSkeleton,
  PortfolioViewSkeleton
} from './PortfolioSkeletons';

export {
  PortfolioEmptyStates,
  NoActionsEmptyState,
  NoApprovalsEmptyState,
  NoAssetsEmptyState,
  NoTransactionsEmptyState,
  NoProtocolExposureEmptyState,
  NoPlansEmptyState,
  NoAuditEventsEmptyState,
  DataLoadFailedEmptyState,
  WalletNotConnectedEmptyState,
  SyncInProgressEmptyState
} from './PortfolioEmptyStates';
