/**
 * TimeoutHandler - Handles operations exceeding 8 seconds
 * 
 * Shows error state with retry functionality when operations timeout
 * Provides user-friendly messaging and recovery options
 * 
 * Requirements: R2.LOADING.TIMEOUT_HANDLING, R15.ERROR.GRACEFUL_DEGRADATION
 */

import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface TimeoutHandlerProps {
  /**
   * Whether the timeout state is active
   */
  isTimedOut: boolean;
  
  /**
   * Custom timeout message
   */
  message?: string;
  
  /**
   * Retry callback
   */
  onRetry?: () => void;
  
  /**
   * Cancel/dismiss callback
   */
  onCancel?: () => void;
  
  /**
   * Show as overlay or inline
   */
  variant?: 'overlay' | 'inline' | 'toast';
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Operation type for contextual messaging
   */
  operationType?: 'navigation' | 'data-fetch' | 'wallet-connect' | 'form-submit' | 'async-action';
}

const DEFAULT_MESSAGES = {
  'navigation': 'Page is taking longer than expected to load',
  'data-fetch': 'Data is taking longer than expected to load',
  'wallet-connect': 'Wallet connection is taking longer than expected',
  'form-submit': 'Form submission is taking longer than expected',
  'async-action': 'Operation is taking longer than expected'
};

const RETRY_SUGGESTIONS = {
  'navigation': 'Try refreshing the page or check your internet connection',
  'data-fetch': 'Try refreshing the data or check your internet connection',
  'wallet-connect': 'Try disconnecting and reconnecting your wallet',
  'form-submit': 'Try submitting the form again or check your input',
  'async-action': 'Try the operation again or check your internet connection'
};

/**
 * Timeout content component
 */
const TimeoutContent = ({
  message,
  operationType = 'async-action',
  onRetry,
  onCancel,
  showCancel = true
}: {
  message?: string;
  operationType: TimeoutHandlerProps['operationType'];
  onRetry?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}) => {
  const defaultMessage = DEFAULT_MESSAGES[operationType!];
  const suggestion = RETRY_SUGGESTIONS[operationType!];

  return (
    <div className="flex flex-col items-center text-center space-y-4 p-6">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
        <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">
          Taking Longer Than Expected
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {message || defaultMessage}
        </p>
        <p className="text-xs text-muted-foreground max-w-sm">
          {suggestion}
        </p>
      </div>
      
      <div className="flex space-x-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </Button>
        )}
        
        {showCancel && onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Main TimeoutHandler component
 */
export const TimeoutHandler = ({
  isTimedOut,
  message,
  onRetry,
  onCancel,
  variant = 'overlay',
  className,
  operationType = 'async-action'
}: TimeoutHandlerProps) => {
  if (!isTimedOut) return null;

  // Overlay variant
  if (variant === 'overlay') {
    return (
      <div className={cn(
        'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
        'flex items-center justify-center p-4',
        className
      )}>
        <Card className="w-full max-w-md">
          <CardContent className="p-0">
            <TimeoutContent
              message={message}
              operationType={operationType}
              onRetry={onRetry}
              onCancel={onCancel}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Toast variant
  if (variant === 'toast') {
    return (
      <div className={cn(
        'fixed top-4 right-4 z-50',
        'bg-card border border-border rounded-lg shadow-lg',
        'max-w-sm',
        className
      )}>
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">Taking longer than expected</p>
              <p className="text-xs text-muted-foreground">
                {message || DEFAULT_MESSAGES[operationType!]}
              </p>
              <div className="flex space-x-2">
                {onRetry && (
                  <Button onClick={onRetry} size="sm" variant="outline">
                    Retry
                  </Button>
                )}
                {onCancel && (
                  <Button onClick={onCancel} size="sm" variant="ghost">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div className={cn('w-full', className)}>
      <Card>
        <CardContent className="p-0">
          <TimeoutContent
            message={message}
            operationType={operationType}
            onRetry={onRetry}
            onCancel={onCancel}
            showCancel={false}
          />
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Hook for handling timeout states
 */
export const useTimeoutHandler = (
  contextId: string,
  onRetry?: () => void,
  onCancel?: () => void
) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return {
    handleRetry,
    handleCancel
  };
};