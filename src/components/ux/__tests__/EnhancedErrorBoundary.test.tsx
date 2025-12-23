/**
 * Unit Tests for Enhanced Error Boundary
 * 
 * Tests error boundary functionality including recovery options,
 * severity-based fallbacks, and telemetry integration.
 * 
 * Requirements: R15.ERROR.BOUNDARIES, R15.ERROR.CLEAR_MESSAGES
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedErrorBoundary } from '../EnhancedErrorBoundary';
import { ErrorSeverity } from '@/lib/ux/ErrorHandlingSystem';

// Mock window objects
const mockWindow = {
  gtag: vi.fn(),
  Sentry: {
    captureException: vi.fn()
  },
  location: {
    href: '/'
  }
};

// @ts-ignore
global.window = mockWindow;

// Mock component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = false, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="success-component">Component rendered successfully</div>;
};

// Mock component for custom fallback
const CustomFallback: React.FC<any> = ({ error, resetError, severity }) => (
  <div data-testid="custom-fallback">
    <p>Custom fallback for {severity} error</p>
    <p>{error.message}</p>
    <button onClick={resetError} data-testid="custom-reset">
      Reset
    </button>
  </div>
);

describe('EnhancedErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Error Boundary Functionality', () => {
    it('should render children when no error occurs', () => {
      render(
        <EnhancedErrorBoundary>
          <ThrowError shouldThrow={false} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByTestId('success-component')).toBeInTheDocument();
    });

    it('should catch and display error when child component throws', () => {
      render(
        <EnhancedErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test component error" />
        </EnhancedErrorBoundary>
      );

      expect(screen.queryByTestId('success-component')).not.toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText('Test component error')).toBeInTheDocument();
    });

    it('should reset error state when retry button is clicked', async () => {
      const { rerender } = render(
        <EnhancedErrorBoundary>
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      // Error should be displayed
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Click retry button
      const retryButton = screen.getByText(/try again/i);
      fireEvent.click(retryButton);

      // Wait for retry delay
      await waitFor(() => {
        // Re-render with non-throwing component
        rerender(
          <EnhancedErrorBoundary>
            <ThrowError shouldThrow={false} />
          </EnhancedErrorBoundary>
        );
      });

      // Success component should be rendered after retry
      expect(screen.getByTestId('success-component')).toBeInTheDocument();
    });
  });

  describe('Severity-Based Fallbacks', () => {
    it('should render low severity fallback for minor errors', () => {
      render(
        <EnhancedErrorBoundary severity={ErrorSeverity.LOW}>
          <ThrowError shouldThrow={true} errorMessage="Minor loading error" />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText(/something's not quite right/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
    });

    it('should render medium severity fallback for moderate errors', () => {
      render(
        <EnhancedErrorBoundary severity={ErrorSeverity.MEDIUM}>
          <ThrowError shouldThrow={true} errorMessage="Network error" />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText(/oops! something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/try again/i)).toBeInTheDocument();
      expect(screen.getByText(/reset component/i)).toBeInTheDocument();
    });

    it('should render high severity fallback for critical errors', () => {
      render(
        <EnhancedErrorBoundary severity={ErrorSeverity.HIGH}>
          <ThrowError shouldThrow={true} errorMessage="Critical system error" />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText(/technical difficulties/i)).toBeInTheDocument();
      expect(screen.getByText(/go home/i)).toBeInTheDocument();
      expect(screen.getByText(/contact support/i)).toBeInTheDocument();
    });

    it('should auto-classify error severity based on error message', () => {
      render(
        <EnhancedErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="ChunkLoadError: Loading chunk failed" />
        </EnhancedErrorBoundary>
      );

      // Chunk errors should be classified as low severity
      expect(screen.getByText(/something's not quite right/i)).toBeInTheDocument();
    });
  });

  describe('Custom Fallback Components', () => {
    it('should render custom fallback when provided', () => {
      render(
        <EnhancedErrorBoundary 
          fallback={CustomFallback}
          severity={ErrorSeverity.MEDIUM}
          component="test-component"
        >
          <ThrowError shouldThrow={true} errorMessage="Custom fallback test" />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom fallback for medium error')).toBeInTheDocument();
      expect(screen.getByText('Custom fallback test')).toBeInTheDocument();
    });

    it('should call resetError from custom fallback', () => {
      const { rerender } = render(
        <EnhancedErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      const resetButton = screen.getByTestId('custom-reset');
      fireEvent.click(resetButton);

      rerender(
        <EnhancedErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={false} />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByTestId('success-component')).toBeInTheDocument();
    });
  });

  describe('Retry Mechanism', () => {
    it('should disable retry after max attempts', async () => {
      render(
        <EnhancedErrorBoundary enableRecovery={true}>
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      const retryButton = screen.getByText(/try again/i);
      
      // Click retry multiple times to exceed max retries
      for (let i = 0; i < 4; i++) {
        fireEvent.click(retryButton);
        await waitFor(() => {
          // Wait for retry delay
        }, { timeout: 2000 });
      }

      // Should show message about max retries
      expect(screen.getByText(/still having trouble/i)).toBeInTheDocument();
    });

    it('should show retrying state during retry', async () => {
      render(
        <EnhancedErrorBoundary>
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      const retryButton = screen.getByText(/try again/i);
      fireEvent.click(retryButton);

      // Should show retrying state
      expect(screen.getByText(/retrying/i)).toBeInTheDocument();
    });

    it('should disable retry when enableRecovery is false', () => {
      render(
        <EnhancedErrorBoundary enableRecovery={false}>
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(screen.queryByText(/try again/i)).not.toBeInTheDocument();
    });
  });

  describe('Telemetry Integration', () => {
    it('should send error to Google Analytics when enabled', () => {
      render(
        <EnhancedErrorBoundary 
          enableTelemetry={true}
          component="test-component"
        >
          <ThrowError shouldThrow={true} errorMessage="Analytics test error" />
        </EnhancedErrorBoundary>
      );

      expect(mockWindow.gtag).toHaveBeenCalledWith(
        'event',
        'exception',
        expect.objectContaining({
          description: 'Analytics test error',
          fatal: false,
          custom_map: expect.objectContaining({
            component: 'test-component'
          })
        })
      );
    });

    it('should send error to Sentry when available', () => {
      render(
        <EnhancedErrorBoundary 
          enableTelemetry={true}
          component="sentry-test"
        >
          <ThrowError shouldThrow={true} errorMessage="Sentry test error" />
        </EnhancedErrorBoundary>
      );

      expect(mockWindow.Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          contexts: expect.objectContaining({
            react: expect.any(Object)
          }),
          tags: expect.objectContaining({
            component: 'sentry-test',
            boundary: 'enhanced'
          })
        })
      );
    });

    it('should not send telemetry when disabled', () => {
      render(
        <EnhancedErrorBoundary enableTelemetry={false}>
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      expect(mockWindow.gtag).not.toHaveBeenCalled();
      expect(mockWindow.Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Actions', () => {
    it('should navigate to home when Go Home button is clicked', () => {
      const originalHref = mockWindow.location.href;
      
      render(
        <EnhancedErrorBoundary severity={ErrorSeverity.HIGH}>
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      const goHomeButton = screen.getByText(/go home/i);
      fireEvent.click(goHomeButton);

      expect(mockWindow.location.href).toBe('/');
      
      // Restore original href
      mockWindow.location.href = originalHref;
    });

    it('should open support email when Contact Support is clicked', () => {
      // Mock window.open
      const mockOpen = vi.fn();
      // @ts-ignore
      global.window.open = mockOpen;

      render(
        <EnhancedErrorBoundary 
          severity={ErrorSeverity.HIGH}
          component="support-test"
        >
          <ThrowError shouldThrow={true} errorMessage="Support needed" />
        </EnhancedErrorBoundary>
      );

      const supportButton = screen.getByText(/contact support/i);
      fireEvent.click(supportButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('mailto:support@alphawhale.com')
      );
    });
  });

  describe('Development Mode Features', () => {
    it('should show technical details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <EnhancedErrorBoundary severity={ErrorSeverity.HIGH}>
          <ThrowError shouldThrow={true} errorMessage="Dev mode error" />
        </EnhancedErrorBoundary>
      );

      expect(screen.getByText(/technical details/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should hide technical details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <EnhancedErrorBoundary severity={ErrorSeverity.HIGH}>
          <ThrowError shouldThrow={true} errorMessage="Prod mode error" />
        </EnhancedErrorBoundary>
      );

      expect(screen.queryByText(/technical details/i)).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Handler Callback', () => {
    it('should call custom error handler when provided', () => {
      const mockErrorHandler = vi.fn();

      render(
        <EnhancedErrorBoundary onError={mockErrorHandler}>
          <ThrowError shouldThrow={true} errorMessage="Callback test" />
        </EnhancedErrorBoundary>
      );

      expect(mockErrorHandler).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });
  });

  describe('Component Cleanup', () => {
    it('should cleanup timers on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(
        <EnhancedErrorBoundary>
          <ThrowError shouldThrow={true} />
        </EnhancedErrorBoundary>
      );

      // Trigger retry to create timeout
      const retryButton = screen.getByText(/try again/i);
      fireEvent.click(retryButton);

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});