/**
 * LoadingSystem - Comprehensive Loading State Components
 * 
 * Provides consistent loading feedback across the application
 * Integrates LoadingStateManager, Skeleton, and TimeoutHandler
 * 
 * Requirements: R2.LOADING.100MS, R2.LOADING.DESCRIPTIVE, R2.LOADING.SUCCESS_FAILURE
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useLoadingState, useSingleLoadingState } from '@/hooks/useLoadingState';
import { Skeleton } from '@/components/ux/Skeleton';
import { TimeoutHandler } from '@/components/ux/TimeoutHandler';
import { cn } from '@/lib/utils';

export interface LoadingIndicatorProps {
  /**
   * Loading state
   */
  isLoading?: boolean;
  
  /**
   * Loading message
   */
  message?: string;
  
  /**
   * Show progress bar
   */
  progress?: number;
  
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Visual variant
   */
  variant?: 'spinner' | 'dots' | 'pulse';
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Basic loading indicator with spinner
 */
export const LoadingIndicator = ({
  isLoading = true,
  message,
  progress,
  size = 'md',
  variant = 'spinner',
  className
}: LoadingIndicatorProps) => {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('flex items-center space-x-2', className)}
    >
      {variant === 'spinner' && (
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      )}
      
      {variant === 'dots' && (
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'bg-primary rounded-full animate-pulse',
                size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
      
      {variant === 'pulse' && (
        <div className={cn(
          'bg-primary rounded-full animate-pulse',
          sizeClasses[size]
        )} />
      )}
      
      {message && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          {message}
        </span>
      )}
      
      {progress !== undefined && (
        <div className="flex-1 max-w-32">
          <div className="w-full bg-secondary rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className={cn('text-muted-foreground', textSizeClasses[size])}>
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Success/Error feedback component
 */
export interface FeedbackIndicatorProps {
  /**
   * Feedback type
   */
  type: 'success' | 'error';
  
  /**
   * Feedback message
   */
  message: string;
  
  /**
   * Auto-hide duration (ms)
   */
  duration?: number;
  
  /**
   * Callback when dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const FeedbackIndicator = ({
  type,
  message,
  duration = 3000,
  onDismiss,
  className
}: FeedbackIndicatorProps) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  const Icon = type === 'success' ? CheckCircle : XCircle;
  const colorClasses = type === 'success' 
    ? 'text-green-600 dark:text-green-400' 
    : 'text-red-600 dark:text-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn('flex items-center space-x-2', className)}
    >
      <Icon className={cn('w-5 h-5', colorClasses)} />
      <span className="text-sm text-foreground">{message}</span>
    </motion.div>
  );
};

/**
 * Comprehensive loading wrapper component
 */
export interface LoadingWrapperProps {
  /**
   * Context ID for loading state management
   */
  contextId: string;
  
  /**
   * Loading operation type
   */
  type: 'navigation' | 'async-action' | 'data-fetch' | 'wallet-connect' | 'form-submit';
  
  /**
   * Children to render when not loading
   */
  children: React.ReactNode;
  
  /**
   * Custom loading component
   */
  loadingComponent?: React.ReactNode;
  
  /**
   * Custom skeleton component
   */
  skeletonComponent?: React.ReactNode;
  
  /**
   * Show skeleton instead of spinner
   */
  useSkeleton?: boolean;
  
  /**
   * Retry callback for timeout scenarios
   */
  onRetry?: () => void;
  
  /**
   * Cancel callback for timeout scenarios
   */
  onCancel?: () => void;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

export const LoadingWrapper = ({
  contextId,
  type,
  children,
  loadingComponent,
  skeletonComponent,
  useSkeleton = false,
  onRetry,
  onCancel,
  className
}: LoadingWrapperProps) => {
  const { isLoading, hasTimedOut, message } = useSingleLoadingState(contextId, type);

  // Show timeout handler if operation has timed out
  if (hasTimedOut) {
    return (
      <TimeoutHandler
        isTimedOut={true}
        operationType={type}
        onRetry={onRetry}
        onCancel={onCancel}
        variant="inline"
        className={className}
      />
    );
  }

  // Show loading state
  if (isLoading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    if (useSkeleton && skeletonComponent) {
      return <>{skeletonComponent}</>;
    }
    
    if (useSkeleton) {
      return (
        <div className={cn('space-y-4', className)}>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      );
    }
    
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <LoadingIndicator message={message} />
      </div>
    );
  }

  // Show children when not loading
  return <>{children}</>;
};

/**
 * Button with integrated loading state
 */
export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Loading state
   */
  isLoading?: boolean;
  
  /**
   * Loading text
   */
  loadingText?: string;
  
  /**
   * Success state
   */
  isSuccess?: boolean;
  
  /**
   * Success text
   */
  successText?: string;
  
  /**
   * Error state
   */
  isError?: boolean;
  
  /**
   * Error text
   */
  errorText?: string;
  
  /**
   * Button variant
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  
  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({
    children,
    isLoading = false,
    loadingText,
    isSuccess = false,
    successText,
    isError = false,
    errorText,
    disabled,
    className,
    ...props
  }, ref) => {
    const getButtonContent = () => {
      if (isLoading) {
        return (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            {loadingText || 'Executing...'}
          </>
        );
      }
      
      if (isSuccess) {
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
            {successText || 'Success!'}
          </>
        );
      }
      
      if (isError) {
        return (
          <>
            <XCircle className="w-4 h-4 mr-2 text-red-600" />
            {errorText || 'Error'}
          </>
        );
      }
      
      return children;
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          'h-10 px-4 py-2',
          className
        )}
        {...props}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={isLoading ? 'loading' : isSuccess ? 'success' : isError ? 'error' : 'default'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center"
          >
            {getButtonContent()}
          </motion.span>
        </AnimatePresence>
      </button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';