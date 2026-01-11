/**
 * Error Boundary Component for Cockpit
 * 
 * Provides error boundaries for major sections to prevent cascade failures.
 * Each section has specific fallback behavior as per requirements.
 * 
 * Requirements: Error boundary behavior
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackType: 'today-card' | 'action-preview' | 'peek-drawer' | 'insights-sheet';
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// ============================================================================
// Fallback Components
// ============================================================================

const TodayCardErrorFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <Card className="relative overflow-hidden bg-red-500/10 backdrop-blur-md border border-red-500/20 p-6">
    <div className="flex items-center gap-3 mb-4">
      <AlertTriangle className="w-5 h-5 text-red-400" />
      <span className="text-sm text-red-100">Today Card Error</span>
    </div>
    
    <div className="text-2xl font-semibold text-white mb-2">
      Unable to load dashboard
    </div>
    
    <div className="text-sm text-slate-300 mb-6">
      There was an error loading your dashboard. Please try again.
    </div>
    
    {onRetry && (
      <Button
        onClick={onRetry}
        variant="outline"
        size="sm"
        className="border-red-500/30 text-red-100 hover:bg-red-500/20"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    )}
  </Card>
);

const ActionPreviewErrorFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <Card className="bg-red-500/10 backdrop-blur-md border border-red-500/20 p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-white">Action Preview</h3>
      <AlertTriangle className="w-5 h-5 text-red-400" />
    </div>
    
    <div className="text-center py-8">
      <div className="text-white font-medium mb-2">Unable to load actions</div>
      <div className="text-sm text-slate-300 mb-4">
        There was an error loading your actions. Please try again.
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="border-red-500/30 text-red-100 hover:bg-red-500/20"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  </Card>
);

const GenericErrorFallback: React.FC<{ 
  title: string; 
  onRetry?: () => void; 
}> = ({ title, onRetry }) => (
  <div className="bg-red-500/10 backdrop-blur-md border border-red-500/20 rounded-lg p-6">
    <div className="flex items-center gap-3 mb-4">
      <AlertTriangle className="w-5 h-5 text-red-400" />
      <span className="text-sm text-red-100">{title} Error</span>
    </div>
    
    <div className="text-white font-medium mb-2">Something went wrong</div>
    <div className="text-sm text-slate-300 mb-4">
      There was an error loading this section. Please try again.
    </div>
    
    {onRetry && (
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="border-red-500/30 text-red-100 hover:bg-red-500/20"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Retry
      </Button>
    )}
  </div>
);

// ============================================================================
// Error Boundary Class Component
// ============================================================================

export class CockpitErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Cockpit ${this.props.fallbackType} error:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      switch (this.props.fallbackType) {
        case 'today-card':
          return <TodayCardErrorFallback onRetry={this.handleRetry} />;
        
        case 'action-preview':
          return <ActionPreviewErrorFallback onRetry={this.handleRetry} />;
        
        case 'peek-drawer':
          // Peek drawer errors: disable drawer but preserve main surface
          return null;
        
        case 'insights-sheet':
          return (
            <GenericErrorFallback 
              title="Insights Sheet" 
              onRetry={this.handleRetry} 
            />
          );
        
        default:
          return (
            <GenericErrorFallback 
              title="Component" 
              onRetry={this.handleRetry} 
            />
          );
      }
    }

    return this.props.children;
  }
}

// ============================================================================
// Convenience Wrapper Components
// ============================================================================

export const TodayCardErrorBoundary: React.FC<{ 
  children: ReactNode; 
  onRetry?: () => void; 
}> = ({ children, onRetry }) => (
  <CockpitErrorBoundary fallbackType="today-card" onRetry={onRetry}>
    {children}
  </CockpitErrorBoundary>
);

export const ActionPreviewErrorBoundary: React.FC<{ 
  children: ReactNode; 
  onRetry?: () => void; 
}> = ({ children, onRetry }) => (
  <CockpitErrorBoundary fallbackType="action-preview" onRetry={onRetry}>
    {children}
  </CockpitErrorBoundary>
);

export const PeekDrawerErrorBoundary: React.FC<{ 
  children: ReactNode; 
  onRetry?: () => void; 
}> = ({ children, onRetry }) => (
  <CockpitErrorBoundary fallbackType="peek-drawer" onRetry={onRetry}>
    {children}
  </CockpitErrorBoundary>
);

export const InsightsSheetErrorBoundary: React.FC<{ 
  children: ReactNode; 
  onRetry?: () => void; 
}> = ({ children, onRetry }) => (
  <CockpitErrorBoundary fallbackType="insights-sheet" onRetry={onRetry}>
    {children}
  </CockpitErrorBoundary>
);

export default CockpitErrorBoundary;