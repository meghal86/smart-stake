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

// Demo Mode Manager
export { DemoModeManager, useDemoMode, demoModeManager } from './DemoModeManager';
export type { 
  DataSourceStatus, 
  DemoModeState 
} from './DemoModeManager';

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

// Demo Banner Components
export { DemoBanner, DemoBannerSpacer } from '../../components/ux/DemoBanner';
export type { DemoBannerProps } from '../../components/ux/DemoBanner';

// Timestamp utilities that ensure "Just now" is used instead of "0s ago"
export { 
  formatRelativeTime, 
  formatUpdatedTime, 
  formatAbsoluteTime,
  formatTimestampWithTooltip,
  validateTimestampFormat 
} from './timestampUtils';

// Form Validation System
export {
  useFormValidation,
  formatCharacterCounter,
  commonValidationSchemas,
  validationMessages,
  createFieldValidation,
  createOptionalField,
  formValidationUtils
} from './FormValidation';
export type {
  FormValidationConfig,
  CharacterCounterConfig,
  FieldValidationState,
  FormValidationState,
  CharacterCounterProps
} from './FormValidation';

// Action Gating & Prerequisites System
export { ActionGatingManager, actionGatingManager, useActionGating } from './ActionGatingManager';
export type {
  ActionPrerequisite,
  ActionGatingState,
  ActionGatingConfig
} from './ActionGatingManager';
// Human Microcopy & Delight Moments System
export {
  MicrocopyManager,
  microcopyManager,
  celebrateWalletConnection,
  celebrateQuestJoined,
  celebrateScanComplete,
  showWelcomeMessage,
  getEmptyStateMessage,
  humanizeError,
  celebrateAchievement,
  celebrateMilestone
} from './MicrocopyManager';
export type {
  CelebrationConfig,
  WelcomeMessageConfig,
  EmptyStateConfig
} from './MicrocopyManager';

// Humanized Error Handler
export {
  HumanizedErrorHandler,
  humanizedErrorHandler,
  handleHumanizedApiError,
  handleHumanizedFormError,
  handleHumanizedWalletError,
  showRetryEncouragement,
  showRecoverySuccess,
  HUMANIZED_ERROR_MESSAGES
} from './HumanizedErrorHandler';
export type {
  HumanizedErrorConfig
} from './HumanizedErrorHandler';

// Celebration Messages Constants
export {
  CELEBRATION_MESSAGES,
  MILESTONE_MESSAGES,
  WELCOME_MESSAGES,
  EMPTY_STATE_MESSAGES,
  getCelebrationMessage,
  getMilestoneMessage,
  getWelcomeMessage,
  getEmptyStateMessage as getEmptyStateMessageConstant
} from '../constants/celebrationMessages';

// UX Components for Microcopy & Celebrations
export { 
  CelebrationToast, 
  showCelebrationToast, 
  ConfettiCelebration, 
  celebrationPresets 
} from '../../components/ux/CelebrationToast';
export type { CelebrationToastProps } from '../../components/ux/CelebrationToast';

export { 
  EncouragingEmptyState 
} from '../../components/ux/EncouragingEmptyState';
export type { EncouragingEmptyStateProps } from '../../components/ux/EncouragingEmptyState';

export { 
  WelcomeMessage, 
  showWelcomeToast, 
  useWelcomeMessage 
} from '../../components/ux/WelcomeMessage';
export type { WelcomeMessageProps } from '../../components/ux/WelcomeMessage';