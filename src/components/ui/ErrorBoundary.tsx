/**
 * Error Boundary Component for Home Page
 * 
 * React Error Boundary that catches JavaScript errors anywhere in the component tree,
 * logs them to Sentry, and displays a fallback UI.
 * 
 * This is specifically designed for the AlphaWhale Home page with Sentry integration.
 * 
 * Usage:
 * <HomeErrorBoundary>
 *   <YourComponent />
 * </HomeErrorBoundary>
 */

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ERROR_MESSAGES } from '@/lib/constants/errorMessages';
import type { ErrorBoundaryProps, ErrorBoundaryState } from '@/types/home';

export class HomeErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('HomeErrorBoundary caught an error:', error, errorInfo);

    // Log to Sentry in production
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
        tags: {
          component: 'home-page',
        },
      });
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-2">
              {ERROR_MESSAGES.COMPONENT_ERROR}
            </h3>
            
            <p className="text-sm text-white/70 mb-6">
              {this.state.error?.message || ERROR_MESSAGES.UNKNOWN_ERROR}
            </p>
            
            <button
              onClick={this.handleRetry}
              className="w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150"
              aria-label="Retry loading component"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper for Error Boundary
 * 
 * Provides a more convenient API for using the Error Boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  return (props: P) => (
    <HomeErrorBoundary fallback={fallback}>
      <Component {...props} />
    </HomeErrorBoundary>
  );
};

/**
 * Type augmentation for window.Sentry
 */
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: Record<string, unknown>) => void;
    };
  }
}
