/**
 * HarvestPro Error Boundary Simple Tests
 * 
 * Basic tests for error boundary functionality.
 * 
 * Requirements: Enhanced Req 15 AC1-3 (error boundaries, graceful degradation)
 * Design: Error Handling → Recovery Mechanisms
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { HarvestProErrorBoundary } from '../HarvestProErrorBoundary';

// Mock the error handling system
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

// Mock the service availability
vi.mock('@/lib/harvestpro/service-availability', () => ({
  serviceAvailability: {
    startMonitoringAll: vi.fn(),
    cleanup: vi.fn(),
    getHealthSummary: vi.fn(() => ({
      overallHealth: 'healthy'
    }))
  },
  HarvestProService: {
    PRICE_ORACLE: 'price-oracle',
    GUARDIAN_API: 'guardian-api'
  }
}));

// Mock error messages
vi.mock('@/lib/constants/errorMessages', () => ({
  ERROR_MESSAGES: {
    COMPONENT_ERROR: 'Something went wrong'
  }
}));

// Mock PrimaryButton
vi.mock('@/components/ui/PrimaryButton', () => ({
  PrimaryButton: ({ children, onClick, disabled, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      className={className}
      data-testid="primary-button"
    >
      {children}
    </button>
  )
}));

// Test component that can throw errors
const ThrowError: React.FC<{ shouldThrow: boolean; errorMessage?: string }> = ({ 
  shouldThrow, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div data-testid="success-component">Component rendered successfully</div>;
};

describe('HarvestProErrorBoundary - Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

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

    // Should show error UI instead of the component
    expect(screen.queryByTestId('success-component')).not.toBeInTheDocument();
    
    // Should show some error content
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

  test('shows demo mode option for network errors', () => {
    render(
      <HarvestProErrorBoundary enableDemoMode={true}>
        <ThrowError shouldThrow={true} errorMessage="Network error" />
      </HarvestProErrorBoundary>
    );

    expect(screen.getByRole('button', { name: /try demo mode/i })).toBeInTheDocument();
  });

  test('does not show demo mode option when disabled', () => {
    render(
      <HarvestProErrorBoundary enableDemoMode={false}>
        <ThrowError shouldThrow={true} errorMessage="Network error" />
      </HarvestProErrorBoundary>
    );

    expect(screen.queryByRole('button', { name: /try demo mode/i })).not.toBeInTheDocument();
  });
});