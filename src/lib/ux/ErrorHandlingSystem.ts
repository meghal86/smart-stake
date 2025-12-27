/**
 * Cross-Application Error Handling System
 * 
 * Comprehensive error handling with recovery options, graceful degradation,
 * and user-friendly error messages with retry functionality.
 * 
 * Requirements: R15.ERROR.BOUNDARIES, R15.ERROR.GRACEFUL_DEGRADATION, R15.ERROR.CLEAR_MESSAGES
 */

import { ERROR_MESSAGES, getErrorMessage } from '@/lib/constants/errorMessages';

export enum ErrorSeverity {
  LOW = 'low',        // Non-blocking, show toast
  MEDIUM = 'medium',  // Blocking, show modal with retry
  HIGH = 'high',      // Critical, show error page with support
  CRITICAL = 'critical' // System failure, show maintenance page
}

export interface ErrorContext {
  severity: ErrorSeverity;
  component: string;
  action: string;
  recoverable: boolean;
  userMessage: string;
  technicalDetails: string;
  timestamp: Date;
  retryCount?: number;
  maxRetries?: number;
}

export interface RecoveryOptions {
  retry?: () => Promise<void>;
  fallback?: () => void;
  escalate?: () => void;
  cache?: () => unknown;
}

export interface ErrorHandlingConfig {
  enableTelemetry: boolean;
  maxRetries: number;
  retryDelay: number;
  showTechnicalDetails: boolean;
  enableOfflineMode: boolean;
}

/**
 * Enhanced Error Handling Manager
 * 
 * Provides comprehensive error handling with recovery options,
 * graceful degradation, and user-friendly messaging.
 */
export class ErrorHandlingSystem {
  private config: ErrorHandlingConfig;
  private errorHistory: ErrorContext[] = [];
  private offlineMode: boolean = false;
  private cachedData: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = {
      enableTelemetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      showTechnicalDetails: false,
      enableOfflineMode: true,
      ...config
    };

    // Listen for network status changes
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      this.offlineMode = !navigator.onLine;
    }
  }

  /**
   * Handle API errors with automatic retry and fallback
   */
  async handleApiError(
    error: Error,
    context: Partial<ErrorContext>,
    recoveryOptions: RecoveryOptions = {}
  ): Promise<ErrorContext> {
    const errorContext: ErrorContext = {
      severity: this.classifyErrorSeverity(error),
      component: context.component || 'unknown',
      action: context.action || 'unknown',
      recoverable: this.isRecoverable(error),
      userMessage: this.humanizeError(error),
      technicalDetails: error.message,
      timestamp: new Date(),
      retryCount: context.retryCount || 0,
      maxRetries: this.config.maxRetries,
      ...context
    };

    // Log error for telemetry
    this.logError(errorContext);

    // Add to error history
    this.errorHistory.push(errorContext);

    // Handle based on severity and recoverability
    if (errorContext.recoverable && errorContext.retryCount! < this.config.maxRetries) {
      return this.attemptRecovery(errorContext, recoveryOptions);
    }

    // If not recoverable or max retries reached, try graceful degradation
    if (this.config.enableOfflineMode && recoveryOptions.cache) {
      return this.gracefulDegradation(errorContext, recoveryOptions);
    }

    return errorContext;
  }

  /**
   * Handle network connectivity issues
   */
  handleNetworkError(cacheKey?: string): ErrorContext {
    const errorContext: ErrorContext = {
      severity: this.offlineMode ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH,
      component: 'network',
      action: 'fetch',
      recoverable: true,
      userMessage: this.offlineMode 
        ? ERROR_MESSAGES.NETWORK_OFFLINE 
        : ERROR_MESSAGES.NETWORK_UNREACHABLE,
      technicalDetails: 'Network connectivity issue',
      timestamp: new Date()
    };

    // Show cached data if available
    if (cacheKey && this.cachedData.has(cacheKey)) {
      errorContext.userMessage = ERROR_MESSAGES.NETWORK_OFFLINE;
      errorContext.severity = ErrorSeverity.LOW;
    }

    this.logError(errorContext);
    return errorContext;
  }

  /**
   * Handle form submission errors
   */
  handleFormError(
    error: Error,
    fieldName?: string,
    formData?: Record<string, unknown>
  ): ErrorContext {
    const errorContext: ErrorContext = {
      severity: ErrorSeverity.MEDIUM,
      component: 'form',
      action: 'submit',
      recoverable: true,
      userMessage: this.getFormErrorMessage(error, fieldName),
      technicalDetails: error.message,
      timestamp: new Date()
    };

    this.logError(errorContext);
    return errorContext;
  }

  /**
   * Handle wallet connection errors
   */
  handleWalletError(error: Error): ErrorContext {
    const errorContext: ErrorContext = {
      severity: ErrorSeverity.MEDIUM,
      component: 'wallet',
      action: 'connect',
      recoverable: true,
      userMessage: this.getWalletErrorMessage(error),
      technicalDetails: error.message,
      timestamp: new Date()
    };

    this.logError(errorContext);
    return errorContext;
  }

  /**
   * Cache data for offline access
   */
  cacheData(key: string, data: unknown, ttl: number = 300000): void {
    this.cachedData.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cached data if available and not expired
   */
  getCachedData(key: string): unknown | null {
    const cached = this.cachedData.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cachedData.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Get error statistics for monitoring
   */
  getErrorStats(): {
    totalErrors: number;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByComponent: Record<string, number>;
    recentErrors: ErrorContext[];
  } {
    const errorsBySeverity = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 0,
      [ErrorSeverity.HIGH]: 0,
      [ErrorSeverity.CRITICAL]: 0
    };

    const errorsByComponent: Record<string, number> = {};

    this.errorHistory.forEach(error => {
      errorsBySeverity[error.severity]++;
      errorsByComponent[error.component] = (errorsByComponent[error.component] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      errorsBySeverity,
      errorsByComponent,
      recentErrors: this.errorHistory.slice(-10)
    };
  }

  /**
   * Clear error history (for testing or privacy)
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  // Private methods

  private classifyErrorSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('timeout')) {
      return ErrorSeverity.MEDIUM;
    }

    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return ErrorSeverity.HIGH;
    }

    if (message.includes('server') || message.includes('500')) {
      return ErrorSeverity.HIGH;
    }

    if (message.includes('rate limit')) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  private isRecoverable(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    // Non-recoverable errors
    const nonRecoverable = [
      'unauthorized', 'forbidden', 'not found', 'invalid', 'malformed'
    ];

    return !nonRecoverable.some(term => message.includes(term));
  }

  private humanizeError(error: Error): string {
    const message = error.message.toLowerCase();

    // Map technical errors to user-friendly messages
    if (message.includes('fetch') || message.includes('network')) {
      return ERROR_MESSAGES.API_NETWORK_ERROR;
    }

    if (message.includes('timeout')) {
      return ERROR_MESSAGES.API_TIMEOUT;
    }

    if (message.includes('500') || message.includes('server')) {
      return ERROR_MESSAGES.API_SERVER_ERROR;
    }

    if (message.includes('401') || message.includes('unauthorized')) {
      return ERROR_MESSAGES.API_UNAUTHORIZED;
    }

    if (message.includes('429') || message.includes('rate limit')) {
      return ERROR_MESSAGES.API_RATE_LIMITED;
    }

    if (message.includes('404') || message.includes('not found')) {
      return ERROR_MESSAGES.API_FAILED;
    }

    return ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  private getFormErrorMessage(error: Error, fieldName?: string): string {
    const message = error.message.toLowerCase();

    if (message.includes('validation') || message.includes('invalid')) {
      return fieldName 
        ? `Please check the ${fieldName} field and try again.`
        : 'Please check your input and try again.';
    }

    if (message.includes('required')) {
      return fieldName
        ? `${fieldName} is required. Please fill it out.`
        : 'Please fill out all required fields.';
    }

    return 'There was an issue with your submission. Please try again.';
  }

  private getWalletErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes('rejected') || message.includes('denied')) {
      return ERROR_MESSAGES.WALLET_SIGNATURE_REJECTED;
    }

    if (message.includes('not found') || message.includes('not installed')) {
      return ERROR_MESSAGES.WALLET_NOT_INSTALLED;
    }

    if (message.includes('network') || message.includes('chain')) {
      return ERROR_MESSAGES.WALLET_WRONG_NETWORK;
    }

    if (message.includes('cancelled') || message.includes('canceled')) {
      return ERROR_MESSAGES.WALLET_USER_CANCELLED;
    }

    return ERROR_MESSAGES.WALLET_CONNECTION_FAILED;
  }

  private async attemptRecovery(
    errorContext: ErrorContext,
    recoveryOptions: RecoveryOptions
  ): Promise<ErrorContext> {
    if (recoveryOptions.retry) {
      try {
        // Wait before retry with exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, errorContext.retryCount!);
        await new Promise(resolve => setTimeout(resolve, delay));

        await recoveryOptions.retry();
        
        // Success - return updated context
        return {
          ...errorContext,
          severity: ErrorSeverity.LOW,
          userMessage: 'Connection restored successfully.',
          recoverable: false // No more retries needed
        };
      } catch (retryError) {
        // Retry failed - increment count and try again or give up
        const updatedContext = {
          ...errorContext,
          retryCount: (errorContext.retryCount || 0) + 1,
          technicalDetails: `${errorContext.technicalDetails}; Retry ${errorContext.retryCount! + 1} failed: ${(retryError as Error).message}`
        };

        if (updatedContext.retryCount! < this.config.maxRetries) {
          return this.attemptRecovery(updatedContext, recoveryOptions);
        }

        return updatedContext;
      }
    }

    return errorContext;
  }

  private gracefulDegradation(
    errorContext: ErrorContext,
    recoveryOptions: RecoveryOptions
  ): ErrorContext {
    if (recoveryOptions.cache) {
      const cachedData = recoveryOptions.cache();
      if (cachedData) {
        return {
          ...errorContext,
          severity: ErrorSeverity.LOW,
          userMessage: 'Showing cached data. Some information may be outdated.',
          recoverable: false
        };
      }
    }

    if (recoveryOptions.fallback) {
      recoveryOptions.fallback();
      return {
        ...errorContext,
        severity: ErrorSeverity.LOW,
        userMessage: 'Using simplified mode. Some features may be limited.',
        recoverable: false
      };
    }

    return errorContext;
  }

  private logError(errorContext: ErrorContext): void {
    if (!this.config.enableTelemetry) return;

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', errorContext);
    }

    // Send to telemetry service in production
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: errorContext.userMessage,
        fatal: errorContext.severity === ErrorSeverity.CRITICAL,
        custom_map: {
          component: errorContext.component,
          action: errorContext.action,
          severity: errorContext.severity
        } as Record<string, unknown>
      });
    }
  }

  private handleOnline(): void {
    this.offlineMode = false;
    console.log('Network connection restored');
  }

  private handleOffline(): void {
    this.offlineMode = true;
    console.log('Network connection lost - entering offline mode');
  }
}

// Global error handling instance
export const errorHandler = new ErrorHandlingSystem();

// Helper functions for common error scenarios

export const handleApiCall = async <T>(
  apiCall: () => Promise<T>,
  cacheKey?: string,
  component?: string
): Promise<T> => {
  try {
    const result = await apiCall();
    
    // Cache successful results
    if (cacheKey) {
      errorHandler.cacheData(cacheKey, result);
    }
    
    return result;
  } catch (error) {
    const errorContext = await errorHandler.handleApiError(
      error as Error,
      { component, action: 'api-call' },
      {
        cache: cacheKey ? () => errorHandler.getCachedData(cacheKey) : undefined,
        retry: apiCall
      }
    );

    // If we have cached data, return it
    if (cacheKey) {
      const cached = errorHandler.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }
    }

    throw new Error(errorContext.userMessage);
  }
};

export const handleFormSubmission = async <T>(
  submitFn: () => Promise<T>,
  formData?: Record<string, unknown>
): Promise<T> => {
  try {
    return await submitFn();
  } catch (error) {
    const errorContext = errorHandler.handleFormError(error as Error, undefined, formData);
    throw new Error(errorContext.userMessage);
  }
};

export const handleWalletConnection = async <T>(
  connectFn: () => Promise<T>
): Promise<T> => {
  try {
    return await connectFn();
  } catch (error) {
    const errorContext = errorHandler.handleWalletError(error as Error);
    throw new Error(errorContext.userMessage);
  }
};

// Type augmentation for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      parameters: Record<string, unknown>
    ) => void;
  }
}