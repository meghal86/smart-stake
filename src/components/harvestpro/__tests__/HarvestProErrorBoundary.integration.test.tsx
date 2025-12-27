/**
 * HarvestPro Error Boundary Integration Tests
 * 
 * Tests error boundary integration with HarvestPro components.
 * 
 * Requirements: Enhanced Req 15 AC1-3 (error boundaries, graceful degradation)
 * Design: Error Handling → Recovery Mechanisms
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { HarvestProErrorBoundary } from '../HarvestProErrorBoundary';

// Mock all dependencies
vi.mock('@/lib/ux/ErrorHandlingSystem', () => ({
  ErrorSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
  },
  errorHandler: {
    handleApiError: vi.fn(),
    getCachedData: vi.fn(),
    cacheData: vi.fn()
  }
}));

vi.mock('@/lib/harvestpro/service-availability', () => ({
  serviceAvailability: {
    startMonitoringAll: vi.fn(),
    cleanup: vi.fn(),
    getHealthSummary: vi.fn(() => ({
      overallHealth: 'healthy'
    }))
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

// Mock HarvestPro components that might fail
const MockHarvestSummaryCard = ({ shouldFail = false }: { shouldFail?: boolean }) => {
  if (shouldFail) {
    throw new Error('Price oracle connection failed');
  }
  return <div data-testid="summary-card">Summary Card</div>;
};

const MockHarvestOpportunityCard = ({ shouldFail = false }: { shouldFail?: boolean }) => {
  if (shouldFail) {
    throw new Error('Guardian API timeout');
  }
  return <div data-testid="opportunity-card">Opportunity Card</div>;
};

describe('HarvestProErrorBoundary Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('wraps summary card and handles price oracle errors', () => {
    render(
      <HarvestProErrorBoundary
        component="summary-card"
        enableDemoMode={true}
        cacheKey="harvestpro-summary"
      >
        <MockHarvestSummaryCard shouldFail={true} />
      </HarvestProErrorBoundary>
    );

    // Should show error UI for price oracle error
    expect(screen.queryByTestId('summary-card')).not.toBeInTheDocument();
    expect(screen.getByText(/having trouble loading current prices/i)).toBeInTheDocument();
    
    // Should offer demo mode for medium severity error
    expect(screen.getByRole('button', { name: /try demo mode/i })).toBeInTheDocument();
  });

  test('wraps opportunity cards and handles Guardian API errors', () => {
    render(
      <HarvestProErrorBoundary
        component="opportunity-card"
        enableRecovery={true}
      >
        <MockHarvestOpportunityCard shouldFail={true} />
      </HarvestProErrorBoundary>
    );

    // Should show error UI for Guardian API error
    expect(screen.queryByTestId('opportunity-card')).not.toBeInTheDocument();
    expect(screen.getByText(/unable to load risk assessment data/i)).toBeInTheDocument();
    
    // Should show retry for high severity error but not demo mode
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /try demo mode/i })).not.toBeInTheDocument();
  });

  test('handles demo mode transition correctly', () => {
    const mockOnEnterDemoMode = vi.fn();
    
    render(
      <HarvestProErrorBoundary
        component="opportunities-feed"
        enableDemoMode={true}
        onEnterDemoMode={mockOnEnterDemoMode}
      >
        <MockHarvestSummaryCard shouldFail={true} />
      </HarvestProErrorBoundary>
    );

    // Click demo mode button
    const demoButton = screen.getByRole('button', { name: /try demo mode/i });
    fireEvent.click(demoButton);

    // Should call the demo mode handler
    expect(mockOnEnterDemoMode).toHaveBeenCalledTimes(1);
  });

  test('handles retry functionality', () => {
    const { rerender } = render(
      <HarvestProErrorBoundary
        component="opportunity-card"
        enableRecovery={true}
      >
        <MockHarvestOpportunityCard shouldFail={true} />
      </HarvestProErrorBoundary>
    );

    // Should show retry button
    const retryButton = screen.getByRole('button', { name: /try again/i });
    expect(retryButton).toBeInTheDocument();

    // Click retry
    fireEvent.click(retryButton);

    // Should show retrying state
    expect(screen.getByText('Retrying...')).toBeInTheDocument();

    // Simulate successful retry by rerendering with working component
    setTimeout(() => {
      rerender(
        <HarvestProErrorBoundary
          component="opportunity-card"
          enableRecovery={true}
        >
          <MockHarvestOpportunityCard shouldFail={false} />
        </HarvestProErrorBoundary>
      );
    }, 100);
  });

  test('shows appropriate error messages for different error types', () => {
    const testCases = [
      {
        error: 'Network timeout occurred',
        expectedMessage: /network connection is unstable/i,
        expectedSeverity: 'medium'
      },
      {
        error: 'Wallet connection lost',
        expectedMessage: /wallet connection issue detected/i,
        expectedSeverity: 'high'
      },
      {
        error: 'Gas estimation failed',
        expectedMessage: /unable to estimate transaction costs/i,
        expectedSeverity: 'medium'
      }
    ];

    testCases.forEach(({ error, expectedMessage }) => {
      const FailingComponent = () => {
        throw new Error(error);
      };

      const { unmount } = render(
        <HarvestProErrorBoundary>
          <FailingComponent />
        </HarvestProErrorBoundary>
      );

      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      unmount();
    });
  });

  test('provides development details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const FailingComponent = () => {
      throw new Error('Development test error');
    };

    render(
      <HarvestProErrorBoundary>
        <FailingComponent />
      </HarvestProErrorBoundary>
    );

    // Should show technical details in development
    expect(screen.getByText('Technical Details (Development)')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  test('handles multiple error boundaries independently', () => {
    render(
      <div>
        <HarvestProErrorBoundary component="summary">
          <MockHarvestSummaryCard shouldFail={true} />
        </HarvestProErrorBoundary>
        
        <HarvestProErrorBoundary component="opportunities">
          <MockHarvestOpportunityCard shouldFail={false} />
        </HarvestProErrorBoundary>
      </div>
    );

    // First boundary should show error
    expect(screen.getByText(/having trouble loading current prices/i)).toBeInTheDocument();
    
    // Second boundary should show working component
    expect(screen.getByTestId('opportunity-card')).toBeInTheDocument();
  });
});