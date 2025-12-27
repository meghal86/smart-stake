/**
 * Enhanced Error Boundary Component
 * 
 * Comprehensive error boundary with recovery options, graceful degradation,
 * and user-friendly error messages with retry functionality.
 * 
 * Requirements: R15.ERROR.BOUNDARIES, R15.ERROR.GRACEFUL_DEGRADATION, R15.ERROR.CLEAR_MESSAGES
 */

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { ErrorSeverity, errorHandler } from '@/lib/ux/ErrorHandlingSystem';
import { ERROR_MESSAGES } from '@/lib/constants/errorMessages';

export interface EnhancedErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  enableRecovery?: boolean;
  enableTelemetry?: boolean;
  component?: string;
  severity?: ErrorSeverity;
}

export interface ErrorFallbackProps {
  error: Error;
  errorInfo?: React.ErrorInfo;
  resetError: () => void;
  severity: ErrorSeverity;
  component: string;
  enableRecovery: boolean;
}

interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isRetrying: boolean;
}

export class EnhancedErrorBoundary extends React.Component<
  EnhancedErrorBoundaryProps,
  EnhancedErrorBoundaryState
> {
  private maxRetries = 3;
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Handle error through error handling system
    errorHandler.handleApiError(
      error,
      {
        component: this.props.component || 'unknown',
        action: 'render',
        severity: this.props.severity || ErrorSeverity.HIGH
      }
    );

    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Enhanced Error Boundary caught an error:', error, errorInfo);
    }

    // Send to telemetry if enabled
    if (this.props.enableTelemetry !== false && typeof window !== 'undefined') {
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          custom_map: {
            component: this.props.component || 'unknown',
            componentStack: errorInfo.componentStack
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
            component: this.props.component || 'unknown',
            boundary: 'enhanced'
          }
        });
      }
    }
  }

  handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      return;
    }

    this.setState({ isRetrying: true });

    // Wait before retry with exponential backoff
    const delay = 1000 * Math.pow(2, this.state.retryCount);
    
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false
      }));
    }, delay);
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRetrying: false
    });
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  handleContactSupport = () => {
    const subject = encodeURIComponent('Error Report - AlphaWhale');
    const body = encodeURIComponent(
      `Error Details:\n\n` +
      `Component: ${this.props.component || 'unknown'}\n` +
      `Error: ${this.state.error?.message || 'Unknown error'}\n` +
      `Timestamp: ${new Date().toISOString()}\n` +
      `User Agent: ${navigator.userAgent}\n\n` +
      `Please describe what you were doing when this error occurred:`
    );
    
    window.open(`mailto:support@alphawhale.com?subject=${subject}&body=${body}`);
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      const severity = this.props.severity || this.classifyErrorSeverity(this.state.error);
      
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            errorInfo={this.state.errorInfo}
            resetError={this.handleReset}
            severity={severity}
            component={this.props.component || 'unknown'}
            enableRecovery={this.props.enableRecovery !== false}
          />
        );
      }

      // Default fallback UI based on severity
      return this.renderDefaultFallback(severity);
    }

    return this.props.children;
  }

  private classifyErrorSeverity(error: Error | null): ErrorSeverity {
    if (!error) return ErrorSeverity.MEDIUM;

    const message = error.message.toLowerCase();
    
    if (message.includes('chunk') || message.includes('loading')) {
      return ErrorSeverity.LOW;
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.HIGH;
  }

  private renderDefaultFallback(severity: ErrorSeverity) {
    const canRetry = this.props.enableRecovery !== false && 
                    this.state.retryCount < this.maxRetries;

    switch (severity) {
      case ErrorSeverity.LOW:
        return this.renderLowSeverityFallback(canRetry);
      case ErrorSeverity.MEDIUM:
        return this.renderMediumSeverityFallback(canRetry);
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return this.renderHighSeverityFallback(canRetry);
      default:
        return this.renderMediumSeverityFallback(canRetry);
    }
  }

  private renderLowSeverityFallback(canRetry: boolean) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/90">
                Something's not quite right here.
              </p>
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="mt-2 text-xs text-yellow-400 hover:text-yellow-300 disabled:opacity-50"
                >
                  {this.state.isRetrying ? 'Retrying...' : 'Try again'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  private renderMediumSeverityFallback(canRetry: boolean) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">
            Oops! Something went wrong
          </h3>
          
          <p className="text-sm text-white/70 mb-6">
            {this.state.error?.message || ERROR_MESSAGES.COMPONENT_ERROR}
          </p>
          
          <div className="flex flex-col space-y-3">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                <span>{this.state.isRetrying ? 'Retrying...' : 'Try Again'}</span>
              </button>
            )}
            
            <button
              onClick={this.handleReset}
              className="w-full px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-150"
            >
              Reset Component
            </button>
          </div>
          
          {this.state.retryCount >= this.maxRetries && (
            <p className="mt-4 text-xs text-white/50">
              Still having trouble? Try refreshing the page.
            </p>
          )}
        </div>
      </div>
    );
  }

  private renderHighSeverityFallback(canRetry: boolean) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="max-w-lg w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-3">
            We're experiencing technical difficulties
          </h2>
          
          <p className="text-white/70 mb-6">
            Don't worry - your data is safe. We're working to fix this issue.
          </p>
          
          <div className="space-y-3">
            {canRetry && (
              <button
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                <span>{this.state.isRetrying ? 'Retrying...' : 'Try Again'}</span>
              </button>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center space-x-2 flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-150"
              >
                <Home className="w-4 h-4" />
                <span>Go Home</span>
              </button>
              
              <button
                onClick={this.handleContactSupport}
                className="flex items-center justify-center space-x-2 flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors duration-150"
              >
                <Mail className="w-4 h-4" />
                <span>Contact Support</span>
              </button>
            </div>
          </div>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-left">
              <summary className="text-xs text-white/50 cursor-pointer hover:text-white/70">
                Technical Details (Development)
              </summary>
              <pre className="mt-2 text-xs text-white/60 bg-black/20 p-3 rounded overflow-auto">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}

/**
 * Hook for using error boundary functionality in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
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

/**
 * Higher-order component for wrapping components with enhanced error boundary
 */
export const withEnhancedErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<EnhancedErrorBoundaryProps> = {}
) => {
  return React.forwardRef<HTMLElement, P>((props, ref) => (
    <EnhancedErrorBoundary {...options}>
      <Component {...props} ref={ref} />
    </EnhancedErrorBoundary>
  ));
};

// Type augmentation for Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: Record<string, unknown>) => void;
    };
  }
}