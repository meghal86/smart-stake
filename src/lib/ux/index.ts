/**
 * Universal UX System Exports
 * 
 * Centralized exports for the universal loading state system
 * and other UX components
 */

// Loading State Manager
export { LoadingStateManager } from './LoadingStateManager';
export type { 
  LoadingContext, 
  LoadingState, 
  LoadingStateListener 
} from './LoadingStateManager';

// React Hooks
export { 
  useLoadingState, 
  useSingleLoadingState, 
  useAsyncOperation 
} from '../../hooks/useLoadingState';

// Components
export { Skeleton } from '../../components/ux/Skeleton';
export type { SkeletonProps } from '../../components/ux/Skeleton';

export { AppShell, withAppShell, useAppShellLoading } from '../../components/ux/AppShell';
export type { AppShellProps } from '../../components/ux/AppShell';

export { TimeoutHandler, useTimeoutHandler } from '../../components/ux/TimeoutHandler';
export type { TimeoutHandlerProps } from '../../components/ux/TimeoutHandler';

export {
  LoadingIndicator,
  FeedbackIndicator,
  LoadingWrapper,
  LoadingButton
} from '../../components/ux/LoadingSystem';
export type {
  LoadingIndicatorProps,
  FeedbackIndicatorProps,
  LoadingWrapperProps,
  LoadingButtonProps
} from '../../components/ux/LoadingSystem';