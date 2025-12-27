/**
 * HarvestPro Error Boundary Component
 * 
 * Specialized error boundary for HarvestPro components with recovery options,
 * graceful degradation when external services are unavailable, and user-friendly
 * error messages with retry functionality.
 * 
 * Requirements: Enhanced Req 15 AC1-3 (error boundaries, graceful degradation)
 * Design: Error Handling → Recovery Mechanisms
 */

import React from 'react';
import { AlertTriangle, RefreshCw, TrendingDown, Shield, Zap } from 'lucide-react';
import { ErrorSeverity, errorHandler } from '@/lib/ux/ErrorHandlingSystem';
import { ERROR_MESSAGES } from '@/lib/constants/errorMessages';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

export interface HarvestProErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<HarvestProErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableRecovery?: boolean;
  enableGracefulDegradation?: boolean;
  component?: string;
  severity?: ErrorSeverity;
  // HarvestPro-specific props
  enableDemoMode?: boolean;
  onEnterDemoMode?: () => void;
  cacheKey?: string;
}

export interface HarvestProErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  resetError: () => void;
  severity: ErrorSeverity;
  component: string;
  enableRecovery: boolean;
  enableGracefulDegradation: boolean;
  enableDemoMode: boolean;
  onEnterDemoMode?: () => void;
  onRetry: () => void;
  isRetrying: boolean;
  retryCount: number;
  maxRetries: number;
}

interface HarvestProErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
  isDemoMode: boolean;
  lastErrorTime: number;
}

export class HarvestProErrorBoundary extends React.Component<
  HarvestProErrorBoundaryProps,
  HarvestProErrorBoundaryState
> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;
  private gracefulDegradationTimeout: NodeJS.Timeout | null = null;
  private errorInfo: React.ErrorInfo | null = null; // Store errorInfo separately

  constructor(props: HarvestProErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      isDemoMode: false,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<HarvestProErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorInfo: null, // Will be set in componentDidCatch
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Store errorInfo without triggering setState
    this.errorInfo = errorInfo;

    // Handle error through error handling system
    errorHandler.handleApiError(
      error,
      {
        component: this.props.component || 'harvestpro',
        action: 'render',
        severity: this.props.severity || this.classifyHarvestProErrorSeverity(error)
      }
    );

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('HarvestPro Error Boundary caught an error:', error, errorInfo);
    }

    // Send to telemetry
    if (typeof window !== 'undefined') {
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          custom_map: {
            component: this.props.component || 'harvestpro',
            componentStack: errorInfo.componentStack,
            feature: 'tax-loss-harvesting'
          }
        });
      }

      if (window.Sentry) {
        window.Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack
            }
          },
          tags: {
            component: this.props.component || 'harvestpro',
            boundary: 'harvestpro',
            feature: 'tax-loss-harvesting'
          }
        });
      }
    }

    // Attempt graceful degradation after a delay
    if (this.props.enableGracefulDegradation !== false) {
      this.gracefulDegradationTimeout = setTimeout(() => {
        this.attemptGracefulDegradation();
      }, 2000);
    }
  }

  private classifyHarvestProErrorSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    // HarvestPro-specific error classification
    if (message.includes('guardian') || message.includes('risk')) {
      return ErrorSeverity.HIGH; // Risk assessment failures are critical
    }
    
    if (message.includes('price') || message.includes('oracle')) {
      return ErrorSeverity.MEDIUM; // Price data issues can use cached data
    }
    
    if (message.includes('gas') || message.includes('slippage')) {
      return ErrorSeverity.MEDIUM; // Estimation failures can use defaults
    }
    
    if (message.includes('wallet') || message.includes('connection')) {
      return ErrorSeverity.HIGH; // Wallet issues prevent core functionality
    }
    
    if (message.includes('network') || message.includes('timeout')) {
      return ErrorSeverity.MEDIUM; // Network issues can use demo mode
    }
    
    return ErrorSeverity.MEDIUM;
  }

  private attemptGracefulDegradation = () => {
    // Prevent multiple calls during the same error cycle
    if (this.state.isDemoMode || !this.state.hasError) {
      return;
    }
    
    const severity = this.classifyHarvestProErrorSeverity(this.state.error!);
    
    // For network/API errors, offer demo mode
    if (severity === ErrorSeverity.MEDIUM && this.props.enableDemoMode !== false) {
      this.setState({ isDemoMode: true });
      return;
    }
    
    // For other errors, try to use cached data
    if (this.props.cacheKey) {
      const cachedData = errorHandler.getCachedData(this.props.cacheKey);
      if (cachedData) {
        // Reset error state and use cached data
        this.errorInfo = null; // Clear stored errorInfo
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          isDemoMode: false
        });
        return;
      }
    }
  };

  private handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries || this.state.isRetrying) {
      return;
    }

    this.setState({ isRetrying: true });

    // Wait before retry with exponential backoff
    const delay = 1000 * Math.pow(2, this.state.retryCount);
    
    this.retryTimeout = setTimeout(() => {
      this.errorInfo = null; // Clear stored errorInfo
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
        isDemoMode: false
      }));
    }, delay);
  };

  private handleReset = () => {
    this.errorInfo = null; // Clear stored errorInfo
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false,
      isDemoMode: false
    });
  };

  private handleEnterDemoMode = () => {
    if (this.props.onEnterDemoMode) {
      this.props.onEnterDemoMode();
    }
    this.errorInfo = null; // Clear stored errorInfo
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isDemoMode: true
    });
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    if (this.gracefulDegradationTimeout) {
      clearTimeout(this.gracefulDegradationTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      const severity = this.classifyHarvestProErrorSeverity(this.state.error!);
      
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            errorInfo={this.errorInfo}
            resetError={this.handleReset}
            severity={severity}
            component={this.props.component || 'harvestpro'}
            enableRecovery={this.props.enableRecovery !== false}
            enableGracefulDegradation={this.props.enableGracefulDegradation !== false}
            enableDemoMode={this.props.enableDemoMode !== false}
            onEnterDemoMode={this.props.onEnterDemoMode}
            onRetry={this.handleRetry}
            isRetrying={this.state.isRetrying}
            retryCount={this.state.retryCount}
            maxRetries={this.maxRetries}
          />
        );
      }

      // Default HarvestPro-specific fallback UI
      return this.renderHarvestProFallback(severity);
    }

    return this.props.children;
  }

  private renderHarvestProFallback(severity: ErrorSeverity) {
    const canRetry = this.props.enableRecovery !== false && 
                    this.state.retryCount < this.maxRetries;
    const canUseDemoMode = this.props.enableDemoMode !== false;
    const errorMessage = this.getHarvestProErrorMessage(this.state.error!);

    return (
      <div className="flex items-center justify-center p-6 min-h-[400px]">
        <div className="max-w-lg w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 text-center">
          {/* Icon based on error type */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
              {this.getErrorIcon(severity)}
            </div>
          </div>
          
          {/* Title */}
          <h2 className="text-xl font-semibold text-white mb-3">
            {this.getErrorTitle(severity)}
          </h2>
          
          {/* Error Message */}
          <p className="text-white/70 mb-6 leading-relaxed">
            {errorMessage}
          </p>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Primary Action - Retry */}
            {canRetry && (
              <PrimaryButton
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                className="w-full"
                size="lg"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                {this.state.isRetrying ? 'Retrying...' : 'Try Again'}
              </PrimaryButton>
            )}
            
            {/* Secondary Actions */}
            <div className="flex space-x-3">
              {/* Demo Mode Option */}
              {canUseDemoMode && severity === ErrorSeverity.MEDIUM && (
                <button
                  onClick={this.handleEnterDemoMode}
                  className="flex items-center justify-center space-x-2 flex-1 px-4 py-3 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors duration-150 border border-cyan-500/30"
                >
                  <Zap className="w-4 h-4" />
                  <span>Try Demo Mode</span>
                </button>
              )}
              
              {/* Reset Component */}
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center space-x-2 flex-1 px-4 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-150"
              >
                <span>Reset</span>
              </button>
            </div>
            
            {/* Go Home for Critical Errors */}
            {severity === ErrorSeverity.HIGH && (
              <button
                onClick={this.handleGoHome}
                className="w-full px-4 py-2 text-white/60 hover:text-white/80 transition-colors duration-150 text-sm"
              >
                Return to Home
              </button>
            )}
          </div>
          
          {/* Retry Limit Message */}
          {this.state.retryCount >= this.maxRetries && (
            <p className="mt-6 text-xs text-white/50">
              Still having trouble? Try refreshing the page or contact support.
            </p>
          )}
          
          {/* Development Details */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-left">
              <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70">
                Technical Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-white/60 bg-black/20 p-3 rounded overflow-auto">
                {this.state.error.stack}
                {this.errorInfo && (
                  <>
                    {'\n\nComponent Stack:'}
                    {this.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  private getErrorIcon(severity: ErrorSeverity) {
    switch (severity) {
      case ErrorSeverity.HIGH:
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      case ErrorSeverity.MEDIUM:
        return <TrendingDown className="w-8 h-8 text-orange-500" />;
      default:
        return <Shield className="w-8 h-8 text-yellow-500" />;
    }
  }

  private getErrorTitle(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.HIGH:
        return 'HarvestPro Temporarily Unavailable';
      case ErrorSeverity.MEDIUM:
        return 'Connection Issue Detected';
      default:
        return 'Minor Issue Detected';
    }
  }

  private getHarvestProErrorMessage(error: Error): string {
    const message = error.message.toLowerCase();
    
    // HarvestPro-specific error messages
    if (message.includes('guardian') || message.includes('risk')) {
      return 'Unable to load risk assessment data. This is required for safe tax-loss harvesting. Please try again or contact support.';
    }
    
    if (message.includes('price') || message.includes('oracle')) {
      return 'Having trouble loading current prices. We can show you demo data while we work on reconnecting to price feeds.';
    }
    
    if (message.includes('gas') || message.includes('slippage')) {
      return 'Unable to estimate transaction costs right now. Please try again in a moment for accurate gas and slippage estimates.';
    }
    
    if (message.includes('wallet') || message.includes('connection')) {
      return 'Wallet connection issue detected. Please check your wallet connection and try again.';
    }
    
    if (message.includes('network') || message.includes('timeout')) {
      return 'Network connection is unstable. You can explore with demo data while we restore the connection.';
    }
    
    if (message.includes('opportunities') || message.includes('harvest')) {
      return 'Unable to load your harvest opportunities right now. Please try again or explore with demo data.';
    }
    
    return ERROR_MESSAGES.COMPONENT_ERROR;
  }
}

/**
 * Higher-order component for wrapping HarvestPro components with error boundary
 */
export const withHarvestProErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<HarvestProErrorBoundaryProps> = {}
) => {
  return React.forwardRef<HTMLElement, P>((props, ref) => (
    <HarvestProErrorBoundary {...options}>
      <Component {...props} ref={ref} />
    </HarvestProErrorBoundary>
  ));
};

/**
 * Hook for handling errors in HarvestPro functional components
 */
export const useHarvestProErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error, context?: string) => {
    // Log to error handling system
    errorHandler.handleApiError(error, {
      component: context || 'harvestpro',
      action: 'hook-error',
      severity: ErrorSeverity.MEDIUM
    });
    
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return { handleError, resetError };
};