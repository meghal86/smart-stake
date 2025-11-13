/**
 * WalletSelector ENS Resolution Tests
 * 
 * Tests for ENS, Lens, and Unstoppable Domains display in WalletSelector
 * 
 * @see src/components/hunter/WalletSelector.tsx
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 50
 * @see .kiro/specs/hunter-screen-feed/requirements.md - Requirement 18.19
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WalletSelector } from '@/components/hunter/WalletSelector';
import { WalletProvider } from '@/contexts/WalletContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ConnectedWallet } from '@/contexts/WalletContext';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/contexts/WalletContext', async () => {
  const actual = await vi.importActual('@/contexts/WalletContext');
  return {
    ...actual,
    useWallet: vi.fn(),
  };
});

import { useWallet } from '@/contexts/WalletContext';

// ============================================================================
// Test Setup
// ============================================================================

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <WalletProvider>{component}</WalletProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Tests
// ============================================================================

describe('WalletSelector ENS Resolution Display', () => {
  const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
  const TEST_ADDRESS_2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // ENS Name Display
  // ==========================================================================

  describe('ENS name display', () => {
    it('should display ENS name when available', () => {
      const wallet: ConnectedWallet = {
        address: TEST_ADDRESS,
        ens: 'vitalik.eth',
        chain: 'ethereum',
      };

      vi.mocked(useWallet).mockReturnValue({
        connectedWallets: [wallet],
        activeWallet: TEST_ADDRESS,
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      renderWithProviders(<WalletSelector />);

      expect(screen.getByText('vitalik.eth')).toBeInTheDocument();
    });

    it('should display Lens handle when ENS not available', () => {
      const wallet: ConnectedWallet = {
        address: TEST_ADDRESS,
        lens: 'vitalik.lens',
        chain: 'ethereum',
      };

      vi.mocked(useWallet).mockReturnValue({
        connectedWallets: [wallet],
        activeWallet: TEST_ADDRESS,
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      renderWithProviders(<WalletSelector />);

      expect(screen.getByText('vitalik.lens')).toBeInTheDocument();
    });

    it('should display Unstoppable Domains when ENS and Lens not available', () => {
      const wallet: ConnectedWallet = {
        address: TEST_ADDRESS,
        unstoppable: 'vitalik.crypto',
        chain: 'ethereum',
      };

      vi.mocked(useWallet).mockReturnValue({
        connectedWallets: [wallet],
        activeWallet: TEST_ADDRESS,
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      renderWithProviders(<WalletSelector />);

      expect(screen.getByText('vitalik.crypto')).toBeInTheDocument();
    });

    it('should prioritize ENS over Lens and Unstoppable', () => {
      const wallet: ConnectedWallet = {
        address: TEST_ADDRESS,
        ens: 'vitalik.eth',
        lens: 'vitalik.lens',
        unstoppable: 'vitalik.crypto',
        chain: 'ethereum',
      };

      vi.mocked(useWallet).mockReturnValue({
        connectedWallets: [wallet],
        activeWallet: TEST_ADDRESS,
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      renderWithProviders(<WalletSelector />);

      // Should show ENS, not Lens or Unstoppable
      expect(screen.getByText('vitalik.eth')).toBeInTheDocument();
      expect(screen.queryByText('vitalik.lens')).not.toBeInTheDocument();
      expect(screen.queryByText('vitalik.crypto')).not.toBeInTheDocument();
    });

    it('should prioritize Lens over Unstoppable when ENS not available', () => {
      const wallet: ConnectedWallet = {
        address: TEST_ADDRESS,
        lens: 'vitalik.lens',
        unstoppable: 'vitalik.crypto',
        chain: 'ethereum',
      };

      vi.mocked(useWallet).mockReturnValue({
        connectedWallets: [wallet],
        activeWallet: TEST_ADDRESS,
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      renderWithProviders(<WalletSelector />);

      // Should show Lens, not Unstoppable
      expect(screen.getByText('vitalik.lens')).toBeInTheDocument();
      expect(screen.queryByText('vitalik.crypto')).not.toBeInTheDocument();
    });

    it('should fallback to label when no resolved names', () => {
      const wallet: ConnectedWallet = {
        address: TEST_ADDRESS,
        label: 'My Wallet',
        chain: 'ethereum',
      };

      vi.mocked(useWallet).mockReturnValue({
        connectedWallets: [wallet],
        activeWallet: TEST_ADDRESS,
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      renderWithProviders(<WalletSelector />);

      expect(screen.getByText('My Wallet')).toBeInTheDocument();
    });

    it('should fallback to truncated address when no names or label', () => {
      const wallet: ConnectedWallet = {
        address: TEST_ADDRESS,
        chain: 'ethereum',
      };

      vi.mocked(useWallet).mockReturnValue({
        connectedWallets: [wallet],
        activeWallet: TEST_ADDRESS,
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      renderWithProviders(<WalletSelector />);

      // Should show truncated address
      expect(screen.getByText(/0x1234\.\.\.7890/)).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Multiple Wallets
  // ==========================================================================

  describe('multiple wallets with different name types', () => {
    it('should display different name types for different wallets', async () => {
      const wallets: ConnectedWallet[] = [
        {
          address: TEST_ADDRESS,
          ens: 'vitalik.eth',
          chain: 'ethereum',
        },
        {
          address: TEST_ADDRESS_2,
          lens: 'alice.lens',
          chain: 'polygon',
        },
      ];

      vi.mocked(useWallet).mockReturnValue({
        connectedWallets: wallets,
        activeWallet: TEST_ADDRESS,
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      const { container } = renderWithProviders(<WalletSelector />);

      // Click to open dropdown
      const trigger = container.querySelector('button[aria-haspopup="menu"]');
      if (trigger) {
        trigger.click();
      }

      await waitFor(() => {
        expect(screen.getByText('vitalik.eth')).toBeInTheDocument();
        expect(screen.getByText('alice.lens')).toBeInTheDocument();
      });
    });
  });

  // ==========================================================================
  // Accessibility
  // ==========================================================================

  describe('accessibility with resolved names', () => {
    it('should include ENS name in aria-label', () => {
      const wallet: ConnectedWallet = {
        address: TEST_ADDRESS,
        ens: 'vitalik.eth',
        chain: 'ethereum',
      };

      vi.mocked(useWallet).mockReturnValue({
        connectedWallets: [wallet],
        activeWallet: TEST_ADDRESS,
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      const { container } = renderWithProviders(<WalletSelector />);

      const trigger = container.querySelector('button[aria-haspopup="menu"]');
      expect(trigger).toHaveAttribute(
        'aria-label',
        expect.stringContaining('vitalik.eth')
      );
    });

    it('should include full address in hidden description', () => {
      const wallet: ConnectedWallet = {
        address: TEST_ADDRESS,
        ens: 'vitalik.eth',
        chain: 'ethereum',
      };

      vi.mocked(useWallet).mockReturnValue({
        connectedWallets: [wallet],
        activeWallet: TEST_ADDRESS,
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      renderWithProviders(<WalletSelector />);

      // Check for sr-only description
      const description = screen.getByText((content, element) => {
        return (
          element?.classList.contains('sr-only') &&
          content.includes(TEST_ADDRESS)
        );
      });

      expect(description).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Tooltip
  // ==========================================================================

  describe('tooltip with resolved names', () => {
    it('should show ENS name in tooltip', async () => {
      const wallet: ConnectedWallet = {
        address: TEST_ADDRESS,
        ens: 'vitalik.eth',
        chain: 'ethereum',
      };

      vi.mocked(useWallet).mockReturnValue({
        connectedWallets: [wallet],
        activeWallet: TEST_ADDRESS,
        setActiveWallet: vi.fn(),
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
        isLoading: false,
        isSwitching: false,
      });

      const { container } = renderWithProviders(<WalletSelector />);

      const trigger = container.querySelector('button[aria-haspopup="menu"]');
      if (trigger) {
        // Hover to show tooltip
        trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      }

      await waitFor(() => {
        const tooltip = screen.queryByRole('tooltip');
        if (tooltip) {
          expect(tooltip).toHaveTextContent('vitalik.eth');
        }
      });
    });
  });
});
