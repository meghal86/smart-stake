/**
 * HarvestPro Error Boundary Tests - Memory Optimized
 * 
 * Tests error boundary functionality including recovery options,
 * graceful degradation, and user-friendly error messages.
 * 
 * Requirements: Enhanced Req 15 AC1-3 (error boundaries, graceful degradation)
 * Design: Error Handling → Recovery Mechanisms
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { HarvestProErrorBoundary, useHarvestProErrorHandler } from '../HarvestProErrorBoundary';

// Lightweight mocks to prevent memory leaks
vi.mock('@/lib/ux/ErrorHandlingSystem', () => ({
  ErrorSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  errorHandler: {
    handleApiError: vi.fn().mockResolvedValue({}),
    getCachedData: vi.fn().mockReturnValue(null),
    cacheData: vi.fn()
  }
}));

vi.mock('@/lib/harvestpro/service-availability', () => ({
  serviceAvailability: {
    startMonitoringAll: vi.fn(),
    cleanup: vi.fn(),
    getHealthSummary: vi.fn().mockReturnValue({ overallHealth: 'healthy' })
  },
  HarvestProService: {
    PRICE_ORACLE: 'price-oracle',
    GUARDIAN_API: 'guardian-api'
  }
}));

vi.mock('@/lib/constants/errorMessages', () => ({
  ERROR_MESSAGES: {
    COMPONENT_ERROR: 'Something went wrong'
  }
}));

vi.mock('@/components/ui/PrimaryButton', () => ({
  PrimaryButton: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="primary-button">
      {children}
    </button>
  )
}));

// Simple test components
const ThrowError: React.FC<{ shouldThrow: boolean; errorMessage?: string }> = ({ 
  shouldThrow, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="success-component">Component rendered successfully</div>;
};

const ComponentWithErrorHandler: React.FC<{ shouldError: boolean }> = ({ shouldError }) => {
  const { handleError } = useHarvestProErrorHandler();
  
  React.useEffect(() => {
    if (shouldError) {
      handleError(new Error('Hook error test'));
    }
  }, [shouldError, handleError]);
  
  return <div data-testid="hook-component">Hook component</div>;
};

describe('HarvestProErrorBoundary - Core Tests', () => {
  let consoleSpy: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock window objects
    Object.defineProperty(window, 'gtag', {
      value: vi.fn(),
      writable: true,
      configurable: true
    });
    
    Object.defineProperty(window, 'Sentry', {
      value: { captureException: vi.fn() },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    consoleSpy?.mockRestore();
    vi.restoreAllMocks();
    
    // Clean up window objects
    delete (window as any).gtag;
    delete (window as any).Sentry;
  });

  describe('Basic Error Boundary Functionality', () => {
    test('renders children when no error occurs', () => {
      render(
        <HarvestProErrorBoundary>
          <ThrowError shouldThrow={false} />
        </HarvestProErrorBoundary>
      );

      expect(screen.getByTestId('success-component')).toBeInTheDocument();
    });

    test('catches and displays error when child component throws', () => {
      render(
        <HarvestProErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test component error" />
        </HarvestProErrorBoundary>
      );

      expect(screen.getByText(/connection issue detected|harvestpro temporarily unavailable/i)).toBeInTheDocument();
    });

    test('displays retry button when recovery is enabled', () => {
      render(
        <HarvestProErrorBoundary enableRecovery={true}>
          <ThrowError shouldThrow={true} />
        </HarvestProErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    test('does not display retry button when recovery is disabled', () => {
      render(
        <HarvestProErrorBoundary enableRecovery={false}>
          <ThrowError shouldThrow={true} />
        </HarvestProErrorBoundary>
      );

      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });
  });

  describe('HarvestPro-Specific Error Classification', () => {
    test('classifies Guardian API errors as high severity', () => {
      render(
        <HarvestProErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Guardian API connection failed" />
        </HarvestProErrorBoundary>
      );

      expect(screen.getByText('HarvestPro Temporarily Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/Unable to load risk assessment data/)).toBeInTheDocument();
    });

    test('classifies price oracle errors as medium severity', () => {
      render(
        <HarvestProErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Price oracle timeout" />
        </HarvestProErrorBoundary>
      );

      expect(screen.getByText('Connection Issue Detected')).toBeInTheDocument();
      expect(screen.getByText(/Having trouble loading current prices/)).toBeInTheDocument();
    });

    test('classifies network errors as medium severity', () => {
      render(
        <HarvestProErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Network timeout occurred" />
        </HarvestProErrorBoundary>
      );

      expect(screen.getByText('Connection Issue Detected')).toBeInTheDocument();
      expect(screen.getByText(/Network connection is unstable/)).toBeInTheDocument();
    });
  });

  describe('Demo Mode Integration', () => {
    test('shows demo mode option for medium severity errors', () => {
      render(
        <HarvestProErrorBoundary enableDemoMode={true}>
          <ThrowError shouldThrow={true} errorMessage="Network error" />
        </HarvestProErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /try demo mode/i })).toBeInTheDocument();
    });

    test('does not show demo mode option for high severity errors', () => {
      render(
        <HarvestProErrorBoundary enableDemoMode={true}>
          <ThrowError shouldThrow={true} errorMessage="Guardian API failed" />
        </HarvestProErrorBoundary>
      );

      expect(screen.queryByRole('button', { name: /try demo mode/i })).not.toBeInTheDocument();
    });

    test('calls onEnterDemoMode when demo mode button is clicked', () => {
      const mockOnEnterDemoMode = vi.fn();
      
      render(
        <HarvestProErrorBoundary 
          enableDemoMode={true}
          onEnterDemoMode={mockOnEnterDemoMode}
        >
          <ThrowError shouldThrow={true} errorMessage="Network error" />
        </HarvestProErrorBoundary>
      );

      const demoButton = screen.getByRole('button', { name: /try demo mode/i });
      fireEvent.click(demoButton);

      expect(mockOnEnterDemoMode).toHaveBeenCalledTimes(1);
    });
  });

  describe('Basic Retry Functionality', () => {
    test('retry button shows retrying state', () => {
      render(
        <HarvestProErrorBoundary>
          <ThrowError shouldThrow={true} />
        </HarvestProErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(retryButton);

      // Should show retrying state immediately
      expect(screen.getByText('Retrying...')).toBeInTheDocument();
    });

    test('reset button is available', () => {
      render(
        <HarvestProErrorBoundary>
          <ThrowError shouldThrow={true} />
        </HarvestProErrorBoundary>
      );

      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('Custom Fallback Component', () => {
    const CustomFallback: React.FC<any> = ({ error, resetError }) => (
      <div data-testid="custom-fallback">
        <p>Custom error: {error.message}</p>
        <button onClick={resetError}>Custom Reset</button>
      </div>
    );

    test('uses custom fallback when provided', () => {
      render(
        <HarvestProErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} errorMessage="Custom error test" />
        </HarvestProErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom error: Custom error test')).toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    test('logs error to console in development', () => {
      render(
        <HarvestProErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test error" />
        </HarvestProErrorBoundary>
      );

      // React logs errors in development mode, so we just check that console.error was called
      expect(consoleSpy).toHaveBeenCalled();
    });

    test('calls custom onError handler when provided', () => {
      const mockOnError = vi.fn();
      
      render(
        <HarvestProErrorBoundary onError={mockOnError}>
          <ThrowError shouldThrow={true} errorMessage="Test error" />
        </HarvestProErrorBoundary>
      );

      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('useHarvestProErrorHandler Hook', () => {
    test('hook throws error to be caught by boundary', () => {
      render(
        <HarvestProErrorBoundary>
          <ComponentWithErrorHandler shouldError={true} />
        </HarvestProErrorBoundary>
      );

      expect(screen.getByText(/connection issue detected|harvestpro temporarily unavailable/i)).toBeInTheDocument();
    });

    test('hook does not throw when no error', () => {
      render(
        <HarvestProErrorBoundary>
          <ComponentWithErrorHandler shouldError={false} />
        </HarvestProErrorBoundary>
      );

      expect(screen.getByTestId('hook-component')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('error boundary maintains proper ARIA labels', () => {
      render(
        <HarvestProErrorBoundary>
          <ThrowError shouldThrow={true} />
        </HarvestProErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /try again/i });
      expect(retryButton).toBeInTheDocument();
      
      const resetButton = screen.getByRole('button', { name: /reset/i });
      expect(resetButton).toBeInTheDocument();
    });

    test('error messages are properly announced to screen readers', () => {
      render(
        <HarvestProErrorBoundary>
          <ThrowError shouldThrow={true} />
        </HarvestProErrorBoundary>
      );

      // Error title should be in a heading
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    });
  });
});