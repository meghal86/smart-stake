/**
 * Trust Badge with Fallback Tests
 * 
 * Requirements: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R10.TRUST.TIMESTAMPS
 * 
 * Tests to ensure trust badges never dead-end and always provide meaningful actions
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrustBadgeWithFallback } from '../TrustBadgeWithFallback';
import { TrustSignal } from '@/lib/ux/TrustSignalVerification';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('TrustBadgeWithFallback', () => {
  const mockTrustSignal: TrustSignal = {
    id: 'test-signal',
    type: 'audit',
    label: 'Test Audit',
    description: 'Test audit description',
    proofUrl: 'https://example.com/audit',
    verified: true,
    lastUpdated: new Date(),
    metadata: {
      auditFirm: 'Test Firm'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any modals that might be left open
    const modals = document.querySelectorAll('[role="dialog"]');
    modals.forEach(modal => modal.remove());
  });

  describe('Valid Trust Signals', () => {
    test('renders trust badge when verification is successful', async () => {
      // Mock successful verification
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: true,
          hasValidUrl: true,
          hasVerificationContent: true,
          hasTimestamp: true
        }),
        getProofConfig: vi.fn().mockReturnValue({
          title: 'Test Audit Report',
          content: ['Comprehensive security audit', 'No vulnerabilities found'],
          linkText: 'View Full Report',
          linkUrl: 'https://example.com/audit',
          type: 'external'
        })
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        expect(screen.getByText('Test Audit')).toBeInTheDocument();
        expect(screen.getByText('Test audit description')).toBeInTheDocument();
      });
    });

    test('shows "Click for proof →" text when verification is successful', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: true,
          hasValidUrl: true,
          hasVerificationContent: true,
          hasTimestamp: true
        }),
        getProofConfig: vi.fn().mockReturnValue({
          title: 'Test Audit Report',
          content: ['Test content'],
          linkText: 'View Report',
          linkUrl: 'https://example.com/audit',
          type: 'external'
        })
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        expect(screen.getByText('Click for proof →')).toBeInTheDocument();
      });
    });
  });

  describe('Unavailable Trust Signals', () => {
    test('shows fallback state when verification fails', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: false,
          hasValidUrl: true,
          hasVerificationContent: false,
          hasTimestamp: true,
          errorMessage: 'Proof content not available'
        }),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        expect(screen.getByText('Proof temporarily unavailable')).toBeInTheDocument();
      });
    });

    test('shows honest unavailable state instead of dead-end link', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: false,
          hasValidUrl: false,
          hasVerificationContent: false,
          hasTimestamp: false,
          errorMessage: 'Invalid proof URL format'
        }),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        // Should show unavailable state, not a broken link
        expect(screen.getByText('Proof temporarily unavailable')).toBeInTheDocument();
        expect(screen.queryByText('Click for proof →')).not.toBeInTheDocument();
      });
    });

    test('opens unavailable modal when clicked in unavailable state', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: false,
          hasValidUrl: true,
          hasVerificationContent: false,
          hasTimestamp: true,
          errorMessage: 'Proof content temporarily unavailable'
        }),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        expect(screen.getByText('Proof temporarily unavailable')).toBeInTheDocument();
      });

      // Click on the unavailable badge
      const badge = screen.getByRole('button');
      fireEvent.click(badge);

      await waitFor(() => {
        expect(screen.getByText('Proof Temporarily Unavailable')).toBeInTheDocument();
        expect(screen.getByText(/verification documentation.*temporarily unavailable/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    test('shows error state when verification throws error', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockRejectedValue(new Error('Network error')),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        expect(screen.getByText('Verification failed')).toBeInTheDocument();
      });
    });

    test('shows error modal with technical details', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockRejectedValue(new Error('Network timeout')),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        expect(screen.getByText('Verification failed')).toBeInTheDocument();
      });

      // Click on the error badge
      const badge = screen.getByRole('button');
      fireEvent.click(badge);

      await waitFor(() => {
        expect(screen.getByText('Verification Error')).toBeInTheDocument();
        expect(screen.getByText(/Unable to verify trust signal/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state during verification', async () => {
      let resolveVerification: (value: any) => void;
      const verificationPromise = new Promise(resolve => {
        resolveVerification = resolve;
      });

      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockReturnValue(verificationPromise),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      // Should show loading state initially
      expect(screen.getByText('Verifying...')).toBeInTheDocument();

      // Resolve the verification
      resolveVerification!({
        isValid: true,
        hasValidUrl: true,
        hasVerificationContent: true,
        hasTimestamp: true
      });

      await waitFor(() => {
        expect(screen.queryByText('Verifying...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels for unavailable state', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: false,
          hasValidUrl: false,
          hasVerificationContent: false,
          hasTimestamp: false,
          errorMessage: 'Proof not available'
        }),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        const badge = screen.getByRole('button');
        expect(badge).toHaveAttribute('aria-label', expect.stringContaining('Proof temporarily unavailable'));
      });
    });

    test('modal has proper ARIA attributes', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: false,
          hasValidUrl: false,
          hasVerificationContent: false,
          hasTimestamp: false,
          errorMessage: 'Proof not available'
        }),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        expect(screen.getByText('Proof temporarily unavailable')).toBeInTheDocument();
      });

      // Click to open modal
      const badge = screen.getByRole('button');
      fireEvent.click(badge);

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toHaveAttribute('aria-modal', 'true');
        expect(modal).toHaveAttribute('aria-labelledby', 'unavailable-modal-title');
        expect(modal).toHaveAttribute('aria-describedby', 'unavailable-modal-description');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    test('can be activated with Enter key', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: false,
          hasValidUrl: false,
          hasVerificationContent: false,
          hasTimestamp: false,
          errorMessage: 'Proof not available'
        }),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        expect(screen.getByText('Proof temporarily unavailable')).toBeInTheDocument();
      });

      // Press Enter key
      const badge = screen.getByRole('button');
      fireEvent.keyDown(badge, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByText('Proof Temporarily Unavailable')).toBeInTheDocument();
      });
    });

    test('can be activated with Space key', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: false,
          hasValidUrl: false,
          hasVerificationContent: false,
          hasTimestamp: false,
          errorMessage: 'Proof not available'
        }),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        expect(screen.getByText('Proof temporarily unavailable')).toBeInTheDocument();
      });

      // Press Space key
      const badge = screen.getByRole('button');
      fireEvent.keyDown(badge, { key: ' ' });

      await waitFor(() => {
        expect(screen.getByText('Proof Temporarily Unavailable')).toBeInTheDocument();
      });
    });
  });

  describe('No Dead-End Guarantee', () => {
    test('never shows "Click for proof" without valid destination or fallback', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: false,
          hasValidUrl: false,
          hasVerificationContent: false,
          hasTimestamp: false,
          errorMessage: 'No proof available'
        }),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        // Should NOT show "Click for proof" when there's no valid destination
        expect(screen.queryByText('Click for proof →')).not.toBeInTheDocument();
        // Should show honest unavailable state instead
        expect(screen.getByText('Proof temporarily unavailable')).toBeInTheDocument();
      });
    });

    test('always provides meaningful action when clicked', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: false,
          hasValidUrl: false,
          hasVerificationContent: false,
          hasTimestamp: false,
          errorMessage: 'Proof not available'
        }),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        expect(screen.getByText('Proof temporarily unavailable')).toBeInTheDocument();
      });

      // Click should always result in meaningful action (modal)
      const badge = screen.getByRole('button');
      fireEvent.click(badge);

      await waitFor(() => {
        // Should open modal with explanation, not dead-end
        expect(screen.getByText('Proof Temporarily Unavailable')).toBeInTheDocument();
        expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
      });
    });

    test('provides transparency message about unavailable content', async () => {
      const mockVerificationManager = {
        verifyTrustSignal: vi.fn().mockResolvedValue({
          isValid: false,
          hasValidUrl: false,
          hasVerificationContent: false,
          hasTimestamp: false,
          errorMessage: 'Proof not available'
        }),
        getProofConfig: vi.fn().mockReturnValue(null)
      };

      vi.doMock('@/lib/ux/TrustSignalVerification', () => ({
        TrustSignalVerificationManager: {
          getInstance: () => mockVerificationManager
        }
      }));

      render(<TrustBadgeWithFallback trustSignal={mockTrustSignal} />);

      await waitFor(() => {
        expect(screen.getByText('Proof temporarily unavailable')).toBeInTheDocument();
      });

      // Click to open modal
      const badge = screen.getByRole('button');
      fireEvent.click(badge);

      await waitFor(() => {
        // Should show transparency message
        expect(screen.getByText(/We believe in transparency/i)).toBeInTheDocument();
        expect(screen.getByText(/rather than showing broken links/i)).toBeInTheDocument();
      });
    });
  });
});