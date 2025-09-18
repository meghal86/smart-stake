import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

interface EnhancedErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId: string;
}

interface EnhancedErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ 
    error?: Error; 
    errorInfo?: ErrorInfo;
    retry: () => void;
    goHome: () => void;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class EnhancedErrorBoundary extends React.Component<
  EnhancedErrorBoundaryProps, 
  EnhancedErrorBoundaryState
> {
  constructor(props: EnhancedErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<EnhancedErrorBoundaryState> {
    return { 
      hasError: true, 
      error,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const enhancedErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name
    };

    this.setState({ errorInfo: enhancedErrorInfo });

    // Log error for monitoring
    console.error('Enhanced Error Boundary caught an error:', {
      error,
      errorInfo: enhancedErrorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, enhancedErrorInfo);
    }
  }

  retry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: ''
    });
  };

  goHome = () => {
    window.location.href = '/';
  };

  reportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Copy to clipboard for easy reporting
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2));
    alert('Error details copied to clipboard');
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent 
            error={this.state.error} 
            errorInfo={this.state.errorInfo}
            retry={this.retry}
            goHome={this.goHome}
          />
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
          <Card className="max-w-lg w-full p-6">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="p-3 bg-red-100 dark:bg-red-950/20 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              {/* Error Title */}
              <div>
                <h1 className="text-xl font-semibold text-foreground mb-2">
                  Something went wrong
                </h1>
                <p className="text-muted-foreground text-sm">
                  We encountered an unexpected error. Our team has been notified.
                </p>
              </div>

              {/* Error ID */}
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {this.state.errorId}
                </Badge>
              </div>

              {/* Error Message */}
              {this.state.error?.message && (
                <div className="p-3 bg-muted/50 rounded-lg text-left">
                  <div className="text-sm font-medium mb-1">Error Details:</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {this.state.error.message}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.retry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.goHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
                <Button variant="outline" onClick={this.reportError} className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Report Issue
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-xs text-muted-foreground">
                If this problem persists, please contact support with the error ID above.
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}