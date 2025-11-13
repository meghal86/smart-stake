/**
 * WalletContext ENS Resolution Tests
 * 
 * Tests for ENS, Lens, and Unstoppable Domains name resolution in WalletContext
 * 
 * @see src/contexts/WalletContext.tsx
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 50
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as nameResolution from '@/lib/name-resolution';

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@/lib/name-resolution', () => ({
  resolveName: vi.fn(),
  resolveNames: vi.fn(),
  clearCache: vi.fn(),
  getCacheSize: vi.fn(),
  preloadNames: vi.fn(),
  initializeProvider: vi.fn(),
}));

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

// ============================================================================
// Test Component
// ============================================================================

function TestComponent() {
  const { connectedWallets, activeWallet, connectWallet, isLoading } = useWallet();
  
  const activeWalletData = connectedWallets.find(w => w.address === activeWallet);

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Ready'}</div>
      <div data-testid="wallet-count">{connectedWallets.length}</div>
      {activeWalletData && (
        <>
          <div data-testid="active-address">{activeWalletData.address}</div>
          <div data-testid="active-ens">{activeWalletData.ens || 'none'}</div>
          <div data-testid="active-lens">{activeWalletData.lens || 'none'}</div>
          <div data-testid="active-unstoppable">{activeWalletData.unstoppable || 'none'}</div>
        </>
      )}
      <button onClick={connectWallet} data-testid="connect-button">
        Connect
      </button>
    </div>
  );
}

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

describe('WalletContext ENS Resolution', () => {
  const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    
    // Setup window.ethereum mock
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ==========================================================================
  // ENS Resolution on Connect
  // ==========================================================================

  describe('ENS resolution on wallet connect', () => {
    it('should resolve ENS name after connecting wallet', async () => {
      mockEthereum.request
        .mockResolvedValueOnce([TEST_ADDRESS]) // eth_requestAccounts
        .mockResolvedValueOnce('0x1'); // eth_chainId

      vi.mocked(nameResolution.resolveName).mockResolvedValue({
        name: 'vitalik.eth',
        provider: 'ens',
        resolvedAt: new Date(),
      });

      renderWithProviders(<TestComponent />);

      // Connect wallet
      const connectButton = screen.getByTestId('connect-button');
      await act(async () => {
        connectButton.click();
      });

      // Wait for ENS resolution
      await waitFor(() => {
        expect(screen.getByTestId('active-ens')).toHaveTextContent('vitalik.eth');
      });

      expect(nameResolution.resolveName).toHaveBeenCalledWith(TEST_ADDRESS);
    });

    it('should resolve Lens handle when ENS not available', async () => {
      mockEthereum.request
        .mockResolvedValueOnce([TEST_ADDRESS])
        .mockResolvedValueOnce('0x1');

      vi.mocked(nameResolution.resolveName).mockResolvedValue({
        name: 'vitalik.lens',
        provider: 'lens',
        resolvedAt: new Date(),
      });

      renderWithProviders(<TestComponent />);

      const connectButton = screen.getByTestId('connect-button');
      await act(async () => {
        connectButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-lens')).toHaveTextContent('vitalik.lens');
      });
    });

    it('should resolve Unstoppable Domains when ENS and Lens not available', async () => {
      mockEthereum.request
        .mockResolvedValueOnce([TEST_ADDRESS])
        .mockResolvedValueOnce('0x1');

      vi.mocked(nameResolution.resolveName).mockResolvedValue({
        name: 'vitalik.crypto',
        provider: 'unstoppable',
        resolvedAt: new Date(),
      });

      renderWithProviders(<TestComponent />);

      const connectButton = screen.getByTestId('connect-button');
      await act(async () => {
        connectButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-unstoppable')).toHaveTextContent('vitalik.crypto');
      });
    });

    it('should handle resolution failure gracefully', async () => {
      mockEthereum.request
        .mockResolvedValueOnce([TEST_ADDRESS])
        .mockResolvedValueOnce('0x1');

      vi.mocked(nameResolution.resolveName).mockResolvedValue(null);

      renderWithProviders(<TestComponent />);

      const connectButton = screen.getByTestId('connect-button');
      await act(async () => {
        connectButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-address')).toHaveTextContent(TEST_ADDRESS);
      });

      // Should still show wallet without name
      expect(screen.getByTestId('active-ens')).toHaveTextContent('none');
      expect(screen.getByTestId('active-lens')).toHaveTextContent('none');
      expect(screen.getByTestId('active-unstoppable')).toHaveTextContent('none');
    });

    it('should not block wallet connection on resolution error', async () => {
      mockEthereum.request
        .mockResolvedValueOnce([TEST_ADDRESS])
        .mockResolvedValueOnce('0x1');

      vi.mocked(nameResolution.resolveName).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(<TestComponent />);

      const connectButton = screen.getByTestId('connect-button');
      await act(async () => {
        connectButton.click();
      });

      // Wallet should still be connected
      await waitFor(() => {
        expect(screen.getByTestId('active-address')).toHaveTextContent(TEST_ADDRESS);
      });

      expect(screen.getByTestId('wallet-count')).toHaveTextContent('1');
    });
  });

  // ==========================================================================
  // ENS Resolution on Load
  // ==========================================================================

  describe('ENS resolution on wallet load from localStorage', () => {
    it('should resolve names for wallets loaded from localStorage', async () => {
      const savedWallets = [
        {
          address: TEST_ADDRESS,
          chain: 'ethereum',
          lastUsed: new Date().toISOString(),
        },
      ];

      localStorage.setItem('connectedWallets', JSON.stringify(savedWallets));
      localStorage.setItem('activeWallet', TEST_ADDRESS);

      vi.mocked(nameResolution.resolveName).mockResolvedValue({
        name: 'vitalik.eth',
        provider: 'ens',
        resolvedAt: new Date(),
      });

      renderWithProviders(<TestComponent />);

      // Wait for resolution
      await waitFor(() => {
        expect(screen.getByTestId('active-ens')).toHaveTextContent('vitalik.eth');
      });

      expect(nameResolution.resolveName).toHaveBeenCalledWith(TEST_ADDRESS);
    });

    it('should not resolve if name already cached', async () => {
      const savedWallets = [
        {
          address: TEST_ADDRESS,
          chain: 'ethereum',
          ens: 'vitalik.eth',
          lastUsed: new Date().toISOString(),
        },
      ];

      localStorage.setItem('connectedWallets', JSON.stringify(savedWallets));
      localStorage.setItem('activeWallet', TEST_ADDRESS);

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('active-ens')).toHaveTextContent('vitalik.eth');
      });

      // Should not call resolveName since we already have ENS
      expect(nameResolution.resolveName).not.toHaveBeenCalled();
    });

    it('should resolve for multiple wallets', async () => {
      const TEST_ADDRESS_2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

      const savedWallets = [
        {
          address: TEST_ADDRESS,
          chain: 'ethereum',
          lastUsed: new Date().toISOString(),
        },
        {
          address: TEST_ADDRESS_2,
          chain: 'ethereum',
          lastUsed: new Date().toISOString(),
        },
      ];

      localStorage.setItem('connectedWallets', JSON.stringify(savedWallets));
      localStorage.setItem('activeWallet', TEST_ADDRESS);

      vi.mocked(nameResolution.resolveName)
        .mockResolvedValueOnce({
          name: 'vitalik.eth',
          provider: 'ens',
          resolvedAt: new Date(),
        })
        .mockResolvedValueOnce({
          name: 'alice.lens',
          provider: 'lens',
          resolvedAt: new Date(),
        });

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(nameResolution.resolveName).toHaveBeenCalledTimes(2);
      });

      expect(nameResolution.resolveName).toHaveBeenCalledWith(TEST_ADDRESS);
      expect(nameResolution.resolveName).toHaveBeenCalledWith(TEST_ADDRESS_2);
    });
  });

  // ==========================================================================
  // Resolved Name Data
  // ==========================================================================

  describe('resolved name data storage', () => {
    it('should store full resolved name data', async () => {
      mockEthereum.request
        .mockResolvedValueOnce([TEST_ADDRESS])
        .mockResolvedValueOnce('0x1');

      const resolvedData = {
        name: 'vitalik.eth',
        provider: 'ens' as const,
        avatar: 'https://avatar.url',
        resolvedAt: new Date(),
      };

      vi.mocked(nameResolution.resolveName).mockResolvedValue(resolvedData);

      renderWithProviders(<TestComponent />);

      const connectButton = screen.getByTestId('connect-button');
      await act(async () => {
        connectButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('active-ens')).toHaveTextContent('vitalik.eth');
      });

      // Check localStorage has full data
      const savedWallets = JSON.parse(localStorage.getItem('connectedWallets') || '[]');
      expect(savedWallets[0].resolvedName).toBeDefined();
      expect(savedWallets[0].resolvedName.name).toBe('vitalik.eth');
      expect(savedWallets[0].resolvedName.provider).toBe('ens');
      expect(savedWallets[0].resolvedName.avatar).toBe('https://avatar.url');
    });
  });
});
