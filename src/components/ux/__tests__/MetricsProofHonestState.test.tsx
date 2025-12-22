/**
 * Metrics Proof Honest State Tests
 * 
 * Requirements: R14.TRUST.METRICS_PROOF, R10.TRUST.METHODOLOGY
 * 
 * Tests to ensure MetricsProof component shows honest unavailable states
 * instead of fake links when proof destinations don't exist.
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MetricsProof, InlineMetricsProof } from '../MetricsProof';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock the ProofUrlVerification hook
const mockVerifyUrl = vi.fn();
vi.mock('@/lib/ux/ProofUrlVerification', () => ({
  useProofUrlVerification: () => ({
    verifyUrl: mockVerifyUrl,
    clearCache: vi.fn(),
    preloadCommonUrls: vi.fn(),
    getAllStatuses: vi.fn()
  })
}));

describe('MetricsProof Honest Unavailable States', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any modals that might be left open
    const modals = document.querySelectorAll('[role="dialog"]');
    modals.forEach(modal => modal.remove());
  });

  describe('Available Documentation', () => {
    test('shows "How it\'s calculated" when documentation is available', async () => {
      mockVerifyUrl.mockResolvedValue({
        isAvailable: true,
        status: {
          url: '/proof/guardian-methodology',
          exists: true,
          lastChecked: new Date(),
          statusCode: 200
        },
        fallbackMessage: ''
      });

      render(
        <MetricsProof
          metricType="guardian_score"
          value="89"
          label="Guardian Score"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('How it\'s calculated')).toBeInTheDocument();
      });

      // Should not show unavailable indicators
      expect(screen.queryByText('Documentation unavailable')).not.toBeInTheDocument();
      expect(screen.queryByText('Verifying...')).not.toBeInTheDocument();
    });

    test('opens working proof modal when documentation is available', async () => {
      mockVerifyUrl.mockResolvedValue({
        isAvailable: true,
        status: {
          url: '/proof/guardian-methodology',
          exists: true,
          lastChecked: new Date(),
          statusCode: 200
        },
        fallbackMessage: ''
      });

      render(
        <MetricsProof
          metricType="guardian_score"
          value="89"
          label="Guardian Score"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('How it\'s calculated')).toBeInTheDocument();
      });

      // Click the button
      fireEvent.click(screen.getByText('How it\'s calculated'));

      await waitFor(() => {
        expect(screen.getByText('Guardian Score Methodology')).toBeInTheDocument();
        expect(screen.getByText('View Full Methodology')).toBeInTheDocument();
      });
    });
  });

  describe('Unavailable Documentation', () => {
    test('shows "Documentation unavailable" when proof URL does not exist', async () => {
      mockVerifyUrl.mockResolvedValue({
        isAvailable: false,
        status: {
          url: '/proof/nonexistent-docs',
          exists: false,
          lastChecked: new Date(),
          statusCode: 404,
          errorMessage: 'Route planned but not yet implemented'
        },
        fallbackMessage: 'Documentation is being prepared and will be available soon'
      });

      render(
        <MetricsProof
          metricType="assets_protected"
          value="$142M"
          label="Assets Protected"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Documentation unavailable')).toBeInTheDocument();
      });

      // Should not show the working state text
      expect(screen.queryByText('How it\'s calculated')).not.toBeInTheDocument();
    });

    test('shows warning icon for unavailable documentation', async () => {
      mockVerifyUrl.mockResolvedValue({
        isAvailable: false,
        status: {
          url: '/proof/broken-link',
          exists: false,
          lastChecked: new Date(),
          statusCode: 404
        },
        fallbackMessage: 'Documentation temporarily unavailable'
      });

      render(
        <MetricsProof
          metricType="scans_run"
          value="25,847"
          label="Scans Completed"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Documentation unavailable')).toBeInTheDocument();
      });

      // Should have warning styling (yellow text)
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-yellow-400');
    });

    test('opens honest unavailable modal instead of broken link', async () => {
      mockVerifyUrl.mockResolvedValue({
        isAvailable: false,
        status: {
          url: 'https://example.com/fake-audit',
          exists: false,
          lastChecked: new Date(),
          statusCode: 404,
          errorMessage: 'Network error'
        },
        fallbackMessage: 'Unable to verify documentation availability due to network issues'
      });

      render(
        <MetricsProof
          metricType="wallets_protected"
          value="12,543"
          label="Wallets Protected"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Documentation unavailable')).toBeInTheDocument();
      });

      // Click the unavailable button
      fireEvent.click(screen.getByText('Documentation unavailable'));

      await waitFor(() => {
        // Should show unavailable modal, not the original proof modal
        expect(screen.getByText('Wallets Protected Count - Unavailable')).toBeInTheDocument();
        expect(screen.getByText(/Unable to verify documentation availability/)).toBeInTheDocument();
        expect(screen.getByText(/maintain transparency/)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('shows "Verifying..." during URL verification', async () => {
      // Create a promise that won't resolve immediately
      let resolveVerification: (value: any) => void;
      const verificationPromise = new Promise(resolve => {
        resolveVerification = resolve;
      });
      mockVerifyUrl.mockReturnValue(verificationPromise);

      render(
        <MetricsProof
          metricType="yield_optimized"
          value="$89M"
          label="Yield Optimized"
        />
      );

      // Should show loading state
      expect(screen.getByText('Verifying...')).toBeInTheDocument();
      expect(screen.queryByText('How it\'s calculated')).not.toBeInTheDocument();
      expect(screen.queryByText('Documentation unavailable')).not.toBeInTheDocument();

      // Resolve the verification
      resolveVerification!({
        isAvailable: true,
        status: {
          url: '/proof/yield-optimized',
          exists: true,
          lastChecked: new Date(),
          statusCode: 200
        },
        fallbackMessage: ''
      });

      await waitFor(() => {
        expect(screen.queryByText('Verifying...')).not.toBeInTheDocument();
        expect(screen.getByText('How it\'s calculated')).toBeInTheDocument();
      });
    });

    test('shows pulsing animation during verification', async () => {
      let resolveVerification: (value: any) => void;
      const verificationPromise = new Promise(resolve => {
        resolveVerification = resolve;
      });
      mockVerifyUrl.mockReturnValue(verificationPromise);

      render(
        <MetricsProof
          metricType="guardian_score"
          value="89"
          label="Guardian Score"
        />
      );

      // Should show loading state with appropriate styling
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-yellow-400');
      expect(screen.getByText('Verifying...')).toBeInTheDocument();

      // Resolve
      resolveVerification!({
        isAvailable: false,
        status: { url: '/test', exists: false, lastChecked: new Date() },
        fallbackMessage: 'Test unavailable'
      });

      await waitFor(() => {
        expect(screen.queryByText('Verifying...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles verification errors gracefully', async () => {
      mockVerifyUrl.mockRejectedValue(new Error('Network timeout'));

      render(
        <MetricsProof
          metricType="assets_protected"
          value="$142M"
          label="Assets Protected"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Documentation unavailable')).toBeInTheDocument();
      });

      // Click to see error details
      fireEvent.click(screen.getByText('Documentation unavailable'));

      await waitFor(() => {
        expect(screen.getByText(/Unable to verify documentation availability/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for available state', async () => {
      mockVerifyUrl.mockResolvedValue({
        isAvailable: true,
        status: {
          url: '/proof/test',
          exists: true,
          lastChecked: new Date(),
          statusCode: 200
        },
        fallbackMessage: ''
      });

      render(
        <MetricsProof
          metricType="guardian_score"
          value="89"
          label="Guardian Score"
        />
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'How guardian score is calculated');
      });
    });

    test('has proper ARIA labels for unavailable state', async () => {
      mockVerifyUrl.mockResolvedValue({
        isAvailable: false,
        status: {
          url: '/proof/test',
          exists: false,
          lastChecked: new Date(),
          statusCode: 404
        },
        fallbackMessage: 'Documentation temporarily unavailable'
      });

      render(
        <MetricsProof
          metricType="assets_protected"
          value="$142M"
          label="Assets Protected"
        />
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', 'Documentation temporarily unavailable');
      });
    });

    test('has proper ARIA labels for loading state', async () => {
      let resolveVerification: (value: any) => void;
      const verificationPromise = new Promise(resolve => {
        resolveVerification = resolve;
      });
      mockVerifyUrl.mockReturnValue(verificationPromise);

      render(
        <MetricsProof
          metricType="scans_run"
          value="25,847"
          label="Scans Completed"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Verifying documentation availability');

      // Clean up
      resolveVerification!({
        isAvailable: true,
        status: { url: '/test', exists: true, lastChecked: new Date() },
        fallbackMessage: ''
      });
    });
  });
});

describe('InlineMetricsProof Honest States', () => {
  test('shows warning icon for unavailable inline proof', async () => {
    mockVerifyUrl.mockResolvedValue({
      isAvailable: false,
      status: {
        url: '/proof/unavailable',
        exists: false,
        lastChecked: new Date(),
        statusCode: 404
      },
      fallbackMessage: 'Documentation temporarily unavailable'
    });

    render(
      <InlineMetricsProof metricType="assets_protected">
        $142M Assets Protected
      </InlineMetricsProof>
    );

    await waitFor(() => {
      expect(screen.getByText('$142M Assets Protected')).toBeInTheDocument();
    });

    // Should show warning icon instead of help icon
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-yellow-400');
  });

  test('shows pulsing help icon during verification', async () => {
    let resolveVerification: (value: any) => void;
    const verificationPromise = new Promise(resolve => {
      resolveVerification = resolve;
    });
    mockVerifyUrl.mockReturnValue(verificationPromise);

    render(
      <InlineMetricsProof metricType="guardian_score">
        Guardian Score: 89
      </InlineMetricsProof>
    );

    // Should show loading state
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-yellow-400');

    // Clean up
    resolveVerification!({
      isAvailable: true,
      status: { url: '/test', exists: true, lastChecked: new Date() },
      fallbackMessage: ''
    });
  });
});

describe('No Dead-End Links Guarantee', () => {
  test('never shows working link text when destination does not exist', async () => {
    mockVerifyUrl.mockResolvedValue({
      isAvailable: false,
      status: {
        url: 'https://example.com/fake-proof',
        exists: false,
        lastChecked: new Date(),
        statusCode: 404
      },
      fallbackMessage: 'Proof documentation not available'
    });

    render(
      <MetricsProof
        metricType="assets_protected"
        value="$142M"
        label="Assets Protected"
      />
    );

    await waitFor(() => {
      // Should NOT show "How it's calculated" when destination doesn't exist
      expect(screen.queryByText('How it\'s calculated')).not.toBeInTheDocument();
      
      // Should show honest unavailable state
      expect(screen.getByText('Documentation unavailable')).toBeInTheDocument();
    });
  });

  test('always provides meaningful action when clicked', async () => {
    mockVerifyUrl.mockResolvedValue({
      isAvailable: false,
      status: {
        url: '/proof/nonexistent',
        exists: false,
        lastChecked: new Date(),
        statusCode: 404
      },
      fallbackMessage: 'Documentation is being prepared'
    });

    render(
      <MetricsProof
        metricType="wallets_protected"
        value="12,543"
        label="Wallets Protected"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documentation unavailable')).toBeInTheDocument();
    });

    // Click should always result in meaningful action (modal with explanation)
    fireEvent.click(screen.getByText('Documentation unavailable'));

    await waitFor(() => {
      // Should open modal with honest explanation, not dead-end
      expect(screen.getByText('Wallets Protected Count - Unavailable')).toBeInTheDocument();
      expect(screen.getByText(/Documentation is being prepared/)).toBeInTheDocument();
      expect(screen.getByText(/maintain transparency/)).toBeInTheDocument();
    });
  });

  test('provides different fallback messages for different error types', async () => {
    // Test planned route
    mockVerifyUrl.mockResolvedValueOnce({
      isAvailable: false,
      status: {
        url: '/proof/planned-feature',
        exists: false,
        lastChecked: new Date(),
        statusCode: 404,
        errorMessage: 'Route planned but not yet implemented'
      },
      fallbackMessage: 'Documentation is being prepared and will be available soon'
    });

    const { rerender } = render(
      <MetricsProof
        metricType="assets_protected"
        value="$142M"
        label="Assets Protected"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documentation unavailable')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Documentation unavailable'));

    await waitFor(() => {
      expect(screen.getByText(/being prepared and will be available soon/)).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByLabelText('Close proof modal'));

    // Test network error
    mockVerifyUrl.mockResolvedValueOnce({
      isAvailable: false,
      status: {
        url: 'https://example.com/network-error',
        exists: false,
        lastChecked: new Date(),
        errorMessage: 'Network timeout'
      },
      fallbackMessage: 'Unable to verify documentation availability due to network issues'
    });

    rerender(
      <MetricsProof
        metricType="guardian_score"
        value="89"
        label="Guardian Score"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Documentation unavailable')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Documentation unavailable'));

    await waitFor(() => {
      expect(screen.getByText(/network issues/)).toBeInTheDocument();
    });
  });
});