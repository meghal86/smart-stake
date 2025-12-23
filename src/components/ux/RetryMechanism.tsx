/**
 * Retry Mechanism Component
 * 
 * Provides user-friendly retry functionality with exponential backoff,
 * progress indicators, and clear error messaging.
 * 
 * Requirements: R15.ERROR.CLEAR_MESSAGES, R15.ERROR.GRACEFUL_DEGRADATION
 */

import React, { useState, useCallback, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { ErrorSeverity } from '@/lib/ux/ErrorHandlingSystem';
import { ERROR_MESSAGES } from '@/lib/constants/errorMessages';

export interface RetryMechanismProps {
  onRetry: () => Promise<void>;
  maxRetries?: number;
  initialDelay?: number;
  backoffMultiplier?: number;
  showProgress?: boolean;
  errorMessage?: string;
  successMessage?: string;
  severity?: ErrorSeverity;
  className?: string;
  disabled?: boolean;
  autoRetry?: boolean;
  autoRetryDelay?: number;
}

export interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
  isSuccess: boolean;
  nextRetryIn: number;
}

export const RetryMechanism: React.FC<RetryMechanismProps> = ({
  onRetry,
  maxRetries = 3,
  initialDelay = 1000,
  backoffMultiplier = 2,
  showProgress = true,
  errorMessage,
  successMessage,
  severity = ErrorSeverity.MEDIUM,
  className = '',
  disabled = false,
  autoRetry = false,
  autoRetryDelay = 5000
}) => {
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    isSuccess: false,
    nextRetryIn: 0
  });

  const [countdownTimer, setCountdownTimer] = useState<NodeJS.Timeout | null>(null);
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null);

  const calculateDelay = useCallback((retryCount: number): number => {
    return initialDelay * Math.pow(backoffMultiplier, retryCount);
  }, [initialDelay, backoffMultiplier]);

  const startCountdown = useCallback((delay: number) => {
    setState(prev => ({ ...prev, nextRetryIn: delay }));
    
    const interval = setInterval(() => {
      setState(prev => {
        const newTime = prev.nextRetryIn - 1000;
        if (newTime <= 0) {
          clearInterval(interval);
          return { ...prev, nextRetryIn: 0 };
        }
        return { ...prev, nextRetryIn: newTime };
      });
    }, 1000);

    setCountdownTimer(interval);
  }, []);

  const executeRetry = useCallback(async () => {
    if (state.isRetrying || state.retryCount >= maxRetries || disabled) {
      return;
    }

    setState(prev => ({
      ...prev,
      isRetrying: true,
      lastError: null,
      isSuccess: false
    }));

    try {
      await onRetry();
      
      setState(prev => ({
        ...prev,
        isRetrying: false,
        isSuccess: true,
        lastError: null
      }));

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, isSuccess: false }));
      }, 3000);

    } catch (error) {
      const newRetryCount = state.retryCount + 1;
      
      setState(prev => ({
        ...prev,
        isRetrying: false,
        retryCount: newRetryCount,
        lastError: error as Error
      }));

      // Schedule auto-retry if enabled and not at max retries
      if (autoRetry && newRetryCount < maxRetries) {
        const delay = calculateDelay(newRetryCount);
        startCountdown(delay);
        
        const timer = setTimeout(() => {
          executeRetry();
        }, delay);
        
        setRetryTimer(timer);
      }
    }
  }, [
    state.isRetrying,
    state.retryCount,
    maxRetries,
    disabled,
    onRetry,
    autoRetry,
    calculateDelay,
    startCountdown
  ]);

  const handleManualRetry = useCallback(() => {
    // Clear any existing timers
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
    if (retryTimer) {
      clearTimeout(retryTimer);
      setRetryTimer(null);
    }

    setState(prev => ({ ...prev, nextRetryIn: 0 }));
    executeRetry();
  }, [countdownTimer, retryTimer, executeRetry]);

  const reset = useCallback(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      setCountdownTimer(null);
    }
    if (retryTimer) {
      clearTimeout(retryTimer);
      setRetryTimer(null);
    }

    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      isSuccess: false,
      nextRetryIn: 0
    });
  }, [countdownTimer, retryTimer]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (countdownTimer) clearInterval(countdownTimer);
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [countdownTimer, retryTimer]);

  const canRetry = state.retryCount < maxRetries && !disabled;
  const isWaitingForRetry = state.nextRetryIn > 0;

  const getButtonText = (): string => {
    if (state.isRetrying) return 'Retrying...';
    if (state.isSuccess) return 'Success!';
    if (isWaitingForRetry) return `Retry in ${Math.ceil(state.nextRetryIn / 1000)}s`;
    if (state.retryCount === 0) return 'Retry';
    return `Retry (${state.retryCount}/${maxRetries})`;
  };

  const getErrorMessage = (): string => {
    if (errorMessage) return errorMessage;
    if (state.lastError) return state.lastError.message;
    return ERROR_MESSAGES.UNKNOWN_ERROR;
  };

  const getSeverityStyles = (): string => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'border-yellow-500/20 bg-yellow-500/10';
      case ErrorSeverity.MEDIUM:
        return 'border-orange-500/20 bg-orange-500/10';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'border-red-500/20 bg-red-500/10';
      default:
        return 'border-white/10 bg-white/5';
    }
  };

  const getIconColor = (): string => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'text-yellow-500';
      case ErrorSeverity.MEDIUM:
        return 'text-orange-500';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'text-red-500';
      default:
        return 'text-white/70';
    }
  };

  return (
    <div className={`rounded-lg border backdrop-blur-sm p-4 ${getSeverityStyles()} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {state.isSuccess ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : state.isRetrying ? (
            <RefreshCw className="w-5 h-5 text-cyan-500 animate-spin" />
          ) : isWaitingForRetry ? (
            <Clock className="w-5 h-5 text-blue-500" />
          ) : (
            <AlertCircle className={`w-5 h-5 ${getIconColor()}`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">
              {state.isSuccess ? (
                successMessage || 'Operation completed successfully!'
              ) : state.isRetrying ? (
                'Retrying operation...'
              ) : isWaitingForRetry ? (
                'Waiting to retry...'
              ) : (
                'Operation failed'
              )}
            </p>

            {canRetry && !state.isSuccess && (
              <button
                onClick={handleManualRetry}
                disabled={state.isRetrying || isWaitingForRetry}
                className="ml-3 flex items-center space-x-1 px-3 py-1 text-xs bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${state.isRetrying ? 'animate-spin' : ''}`} />
                <span>{getButtonText()}</span>
              </button>
            )}
          </div>

          {!state.isSuccess && (
            <p className="mt-1 text-xs text-white/70">
              {getErrorMessage()}
            </p>
          )}

          {showProgress && state.retryCount > 0 && !state.isSuccess && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Retry Progress</span>
                <span>{state.retryCount}/{maxRetries}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1">
                <div
                  className="bg-cyan-500 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${(state.retryCount / maxRetries) * 100}%` }}
                />
              </div>
            </div>
          )}

          {state.retryCount >= maxRetries && !state.isSuccess && (
            <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
              Maximum retry attempts reached. Please refresh the page or contact support if the issue persists.
            </div>
          )}

          {autoRetry && isWaitingForRetry && (
            <div className="mt-2 text-xs text-blue-400">
              Auto-retry in {Math.ceil(state.nextRetryIn / 1000)} seconds...
            </div>
          )}
        </div>
      </div>

      {(state.retryCount > 0 || state.isSuccess) && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={reset}
            className="text-xs text-white/50 hover:text-white/70 transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for using retry mechanism functionality
 */
export const useRetryMechanism = (
  operation: () => Promise<void>,
  options: Partial<RetryMechanismProps> = {}
) => {
  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    isSuccess: false,
    nextRetryIn: 0
  });

  const retry = useCallback(async () => {
    setState(prev => ({ ...prev, isRetrying: true, lastError: null }));
    
    try {
      await operation();
      setState(prev => ({ ...prev, isRetrying: false, isSuccess: true }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRetrying: false,
        retryCount: prev.retryCount + 1,
        lastError: error as Error
      }));
    }
  }, [operation]);

  const reset = useCallback(() => {
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      isSuccess: false,
      nextRetryIn: 0
    });
  }, []);

  return {
    ...state,
    retry,
    reset,
    canRetry: state.retryCount < (options.maxRetries || 3)
  };
};