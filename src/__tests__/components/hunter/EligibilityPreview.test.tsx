/**
 * Tests for EligibilityPreview Component
 * 
 * Tests:
 * - Rendering with different eligibility statuses
 * - Loading states
 * - Error states
 * - Recalculate button functionality
 * - Throttling behavior
 * - Theme support
 * 
 * Requirements: 5.6, 6.1-6.8, 17.5, 18.5
 * Task: 47
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EligibilityPreview } from '@/components/hunter/EligibilityPreview';
import { useEligibilityCheck } from '@/hooks/useEligibilityCheck';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the useEligibilityCheck hook
vi.mock('@/hooks/useEligibilityCheck');

const mockUseEligibilityCheck = useEligibilityCheck as any;

describe('EligibilityPreview', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Rendering', () => {
    it('should not render when no wallet is connected', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: undefined,
        isLoading: false,
        isRecalculating: false,
        error: null,
        recalculate: vi.fn(),
        hasWallet: false,
      });

      const { container } = render(
        <EligibilityPreview opportunityId="opp-123" chain="ethereum" />,
        { wrapper }
      );

      expect(container.firstChild).toBeNull();
    });

    it('should show loading state', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: undefined,
        isLoading: true,
        isRecalculating: false,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      expect(screen.getByText('Checking eligibility...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: undefined,
        isLoading: false,
        isRecalculating: false,
        error: new Error('API error'),
        recalculate: vi.fn(),
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      expect(screen.getByText('Failed to check eligibility')).toBeInTheDocument();
    });

    it('should render "Likely Eligible" status', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'likely',
          score: 0.85,
          reasons: ['Wallet has activity on required chain', 'Wallet age > 30 days'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: false,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      expect(screen.getByText('Likely Eligible')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('Wallet has activity on required chain')).toBeInTheDocument();
      expect(screen.getByText('Wallet age > 30 days')).toBeInTheDocument();
    });

    it('should render "Maybe Eligible" status', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'maybe',
          score: 0.55,
          reasons: ['Some requirements met'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: false,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      expect(screen.getByText('Maybe Eligible')).toBeInTheDocument();
      expect(screen.getByText('55%')).toBeInTheDocument();
    });

    it('should render "Unlikely Eligible" status', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'unlikely',
          score: 0.25,
          reasons: ['Wallet does not meet requirements'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: false,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      expect(screen.getByText('Unlikely Eligible')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should render "Unknown" status', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'unknown',
          score: 0,
          reasons: ['Unable to determine eligibility'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: false,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      expect(screen.getByText('Unknown')).toBeInTheDocument();
      expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument(); // No score shown for 0
    });

    it('should limit reasons to 2 items', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'likely',
          score: 0.85,
          reasons: ['Reason 1', 'Reason 2', 'Reason 3', 'Reason 4'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: false,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      expect(screen.getByText('Reason 1')).toBeInTheDocument();
      expect(screen.getByText('Reason 2')).toBeInTheDocument();
      expect(screen.queryByText('Reason 3')).not.toBeInTheDocument();
      expect(screen.queryByText('Reason 4')).not.toBeInTheDocument();
    });
  });

  describe('Recalculate Button', () => {
    it('should call recalculate when button is clicked', () => {
      const mockRecalculate = vi.fn();

      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'likely',
          score: 0.85,
          reasons: ['Test'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: false,
        error: null,
        recalculate: mockRecalculate,
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      const recalculateButton = screen.getByRole('button', {
        name: /recalculate eligibility/i,
      });

      fireEvent.click(recalculateButton);

      expect(mockRecalculate).toHaveBeenCalledTimes(1);
    });

    it('should show spinner when recalculating', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'likely',
          score: 0.85,
          reasons: ['Test'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: true,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      const recalculateButton = screen.getByRole('button', {
        name: /recalculate eligibility/i,
      });

      // Button should be disabled
      expect(recalculateButton).toBeDisabled();

      // Icon should have animate-spin class
      const icon = recalculateButton.querySelector('svg');
      expect(icon).toHaveClass('animate-spin');
    });

    it('should disable button when recalculating', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'likely',
          score: 0.85,
          reasons: ['Test'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: true,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      const recalculateButton = screen.getByRole('button', {
        name: /recalculate eligibility/i,
      });

      expect(recalculateButton).toBeDisabled();
    });
  });

  describe('Theme Support', () => {
    it('should apply dark theme styles', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'likely',
          score: 0.85,
          reasons: ['Test'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: false,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      const { container } = render(
        <EligibilityPreview
          opportunityId="opp-123"
          chain="ethereum"
          isDarkTheme={true}
        />,
        { wrapper }
      );

      const previewDiv = container.firstChild as HTMLElement;
      expect(previewDiv).toHaveClass('text-emerald-400');
      expect(previewDiv).toHaveClass('bg-emerald-400/10');
    });

    it('should apply light theme styles', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'likely',
          score: 0.85,
          reasons: ['Test'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: false,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      const { container } = render(
        <EligibilityPreview
          opportunityId="opp-123"
          chain="ethereum"
          isDarkTheme={false}
        />,
        { wrapper }
      );

      const previewDiv = container.firstChild as HTMLElement;
      expect(previewDiv).toHaveClass('text-emerald-600');
      expect(previewDiv).toHaveClass('bg-emerald-50');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on recalculate button', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'likely',
          score: 0.85,
          reasons: ['Test'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: false,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      const recalculateButton = screen.getByRole('button', {
        name: /recalculate eligibility/i,
      });

      expect(recalculateButton).toHaveAttribute('aria-label', 'Recalculate eligibility');
    });

    it('should have proper title on recalculate button', () => {
      mockUseEligibilityCheck.mockReturnValue({
        eligibility: {
          status: 'likely',
          score: 0.85,
          reasons: ['Test'],
          cachedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        },
        isLoading: false,
        isRecalculating: false,
        error: null,
        recalculate: vi.fn(),
        hasWallet: true,
      });

      render(<EligibilityPreview opportunityId="opp-123" chain="ethereum" />, {
        wrapper,
      });

      const recalculateButton = screen.getByRole('button', {
        name: /recalculate eligibility/i,
      });

      expect(recalculateButton).toHaveAttribute(
        'title',
        'Recalculate eligibility (throttled to 1 per 5s)'
      );
    });
  });
});
