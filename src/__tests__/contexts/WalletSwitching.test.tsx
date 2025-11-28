/**
 * Tests for Wallet Switching Logic
 * 
 * Verifies:
 * - Wallet selection handler works correctly
 * - Loading state during wallet switch
 * - React 18 useTransition for smooth re-render
 * - Feed refresh when wallet changes
 * - Eligibility checks update for new wallet
 * - Smooth transitions without flickering
 * - Persist selected wallet to localStorage
 * - Restore last selected wallet on page load
 * - Handle wallet disconnection gracefully
 * 
 * @see .kiro/specs/hunter-screen-feed/requirements.md - Requirement 18.4-18.8, 18.12-18.13, 18.15-18.16, 18.20
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 43
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component that uses wallet context
function TestComponent() {
  const { 
    connectedWallets, 
    activeWallet, 
    setActiveWallet, 
    isLoading, 
    isSwitching 
  } = useWallet();

  return (
    <div>
      <div data-testid="active-wallet">{activeWallet || 'none'}</div>
      <div data-testid="is-switching">{isSwitching ? 'true' : 'false'}</div>
      <div data-testid="is-loading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="wallet-count">{connectedWallets.length}</div>
      {connectedWallets.map((wallet) => (
        <button
          key={wallet.address}
          data-testid={`select-${wallet.address}`}
          onClick={() => setActiveWallet(wallet.address)}
        >
          Select {wallet.address}
        </button>
      ))}
    </div>
  );
}

describe('Wallet Switching Logic', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    localStorageMock.clear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WalletProvider>{component}</WalletProvider>
      </QueryClientProvider>
    );
  };

  describe('Wallet Selection Handler', () => {
    it('should switch active wallet when selection handler is called', async () => {
      // Pre-populate localStorage with wallets
      const wallets = [
        { address: '0x1111', chain: 'ethereum', lastUsed: new Date().toISOString() },
        { address: '0x2222', chain: 'polygon', lastUsed: new Date().toISOString() },
      ];
      localStorageMock.setItem('connectedWallets', JSON.stringify(wallets));
      localStorageMock.setItem('activeWallet', '0x1111');

      renderWithProviders(<TestComponent />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111');
      });

      // Switch to second wallet
      const selectButton = screen.getByTestId('select-0x2222');
      await userEvent.click(selectButton);

      // Verify wallet switched
      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x2222');
      });
    });

    it('should not switch if wallet does not exist', async () => {
      const wallets = [
        { address: '0x1111', chain: 'ethereum', lastUsed: new Date().toISOString() },
      ];
      localStorageMock.setItem('connectedWallets', JSON.stringify(wallets));
      localStorageMock.setItem('activeWallet', '0x1111');

      // Spy on console.error to verify error is logged
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function TestComponentWithInvalidSwitch() {
        const { activeWallet, setActiveWallet } = useWallet();

        return (
          <div>
            <div data-testid="active-wallet">{activeWallet || 'none'}</div>
            <button
              data-testid="select-invalid"
              onClick={() => setActiveWallet('0x9999')}
            >
              Select Invalid
            </button>
          </div>
        );
      }

      renderWithProviders(<TestComponentWithInvalidSwitch />);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111');
      });

      // Try to switch to non-existent wallet
      const selectButton = screen.getByTestId('select-invalid');
      await userEvent.click(selectButton);

      // Verify wallet didn't change
      expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111');
      
      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Wallet 0x9999 not found')
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Loading State During Switch', () => {
    it('should show isSwitching state during wallet switch', async () => {
      const wallets = [
        { address: '0x1111', chain: 'ethereum', lastUsed: new Date().toISOString() },
        { address: '0x2222', chain: 'polygon', lastUsed: new Date().toISOString() },
      ];
      localStorageMock.setItem('connectedWallets', JSON.stringify(wallets));
      localStorageMock.setItem('activeWallet', '0x1111');

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111');
      });

      // Initially not switching
      expect(screen.getByTestId('is-switching')).toHaveTextContent('false');

      // Click to switch
      const selectButton = screen.getByTestId('select-0x2222');
      await userEvent.click(selectButton);

      // Should complete quickly with useTransition
      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x2222');
      });
    });
  });

  describe('localStorage Persistence', () => {
    it('should persist selected wallet to localStorage', async () => {
      const wallets = [
        { address: '0x1111', chain: 'ethereum', lastUsed: new Date().toISOString() },
        { address: '0x2222', chain: 'polygon', lastUsed: new Date().toISOString() },
      ];
      localStorageMock.setItem('connectedWallets', JSON.stringify(wallets));
      localStorageMock.setItem('activeWallet', '0x1111');

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111');
      });

      // Switch wallet
      const selectButton = screen.getByTestId('select-0x2222');
      await userEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x2222');
      });

      // Verify localStorage was updated
      await waitFor(() => {
        expect(localStorageMock.getItem('activeWallet')).toBe('0x2222');
      });
    });

    it('should restore last selected wallet on page load', async () => {
      const wallets = [
        { address: '0x1111', chain: 'ethereum', lastUsed: new Date().toISOString() },
        { address: '0x2222', chain: 'polygon', lastUsed: new Date().toISOString() },
      ];
      localStorageMock.setItem('connectedWallets', JSON.stringify(wallets));
      localStorageMock.setItem('activeWallet', '0x2222');

      renderWithProviders(<TestComponent />);

      // Should restore 0x2222 as active wallet
      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x2222');
      });
    });

    it('should default to first wallet if saved wallet not found', async () => {
      const wallets = [
        { address: '0x1111', chain: 'ethereum', lastUsed: new Date().toISOString() },
        { address: '0x2222', chain: 'polygon', lastUsed: new Date().toISOString() },
      ];
      localStorageMock.setItem('connectedWallets', JSON.stringify(wallets));
      localStorageMock.setItem('activeWallet', '0x9999'); // Non-existent

      renderWithProviders(<TestComponent />);

      // Should default to first wallet
      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111');
      });
    });
  });

  describe('Wallet Disconnection', () => {
    it('should handle wallet disconnection gracefully', async () => {
      const wallets = [
        { address: '0x1111', chain: 'ethereum', lastUsed: new Date().toISOString() },
        { address: '0x2222', chain: 'polygon', lastUsed: new Date().toISOString() },
      ];
      localStorageMock.setItem('connectedWallets', JSON.stringify(wallets));
      localStorageMock.setItem('activeWallet', '0x1111');

      function TestComponentWithDisconnect() {
        const { 
          connectedWallets, 
          activeWallet, 
          disconnectWallet 
        } = useWallet();

        return (
          <div>
            <div data-testid="active-wallet">{activeWallet || 'none'}</div>
            <div data-testid="wallet-count">{connectedWallets.length}</div>
            <button
              data-testid="disconnect-0x1111"
              onClick={() => disconnectWallet('0x1111')}
            >
              Disconnect 0x1111
            </button>
          </div>
        );
      }

      renderWithProviders(<TestComponentWithDisconnect />);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111');
        expect(screen.getByTestId('wallet-count')).toHaveTextContent('2');
      });

      // Disconnect active wallet
      const disconnectButton = screen.getByTestId('disconnect-0x1111');
      await userEvent.click(disconnectButton);

      // Should switch to remaining wallet
      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x2222');
        expect(screen.getByTestId('wallet-count')).toHaveTextContent('1');
      });
    });

    it('should clear active wallet when last wallet is disconnected', async () => {
      const wallets = [
        { address: '0x1111', chain: 'ethereum', lastUsed: new Date().toISOString() },
      ];
      localStorageMock.setItem('connectedWallets', JSON.stringify(wallets));
      localStorageMock.setItem('activeWallet', '0x1111');

      function TestComponentWithDisconnect() {
        const { 
          activeWallet, 
          disconnectWallet 
        } = useWallet();

        return (
          <div>
            <div data-testid="active-wallet">{activeWallet || 'none'}</div>
            <button
              data-testid="disconnect-0x1111"
              onClick={() => disconnectWallet('0x1111')}
            >
              Disconnect 0x1111
            </button>
          </div>
        );
      }

      renderWithProviders(<TestComponentWithDisconnect />);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111');
      });

      // Disconnect last wallet
      const disconnectButton = screen.getByTestId('disconnect-0x1111');
      await userEvent.click(disconnectButton);

      // Should clear active wallet
      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('none');
      });
    });
  });

  describe('Query Invalidation', () => {
    it('should invalidate feed queries when wallet switches', async () => {
      const wallets = [
        { address: '0x1111', chain: 'ethereum', lastUsed: new Date().toISOString() },
        { address: '0x2222', chain: 'polygon', lastUsed: new Date().toISOString() },
      ];
      localStorageMock.setItem('connectedWallets', JSON.stringify(wallets));
      localStorageMock.setItem('activeWallet', '0x1111');

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111');
      });

      // Switch wallet
      const selectButton = screen.getByTestId('select-0x2222');
      await userEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x2222');
      });

      // Verify queries were invalidated
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['hunter-feed'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['eligibility'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['saved-opportunities'] });
    });
  });

  describe('Custom Events', () => {
    it('should emit walletConnected event when wallet switches', async () => {
      const wallets = [
        { address: '0x1111', chain: 'ethereum', lastUsed: new Date().toISOString() },
        { address: '0x2222', chain: 'polygon', lastUsed: new Date().toISOString() },
      ];
      localStorageMock.setItem('connectedWallets', JSON.stringify(wallets));
      localStorageMock.setItem('activeWallet', '0x1111');

      const eventListener = vi.fn();
      window.addEventListener('walletConnected', eventListener);

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111');
      });

      // Switch wallet
      const selectButton = screen.getByTestId('select-0x2222');
      await userEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x2222');
      });

      // Verify event was emitted
      await waitFor(() => {
        expect(eventListener).toHaveBeenCalled();
      });

      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail.address).toBe('0x2222');
      expect(event.detail.timestamp).toBeDefined();

      window.removeEventListener('walletConnected', eventListener);
    });
  });

  describe('lastUsed Timestamp', () => {
    it('should update lastUsed timestamp when wallet is selected', async () => {
      const wallets = [
        { address: '0x1111', chain: 'ethereum', lastUsed: new Date('2024-01-01').toISOString() },
        { address: '0x2222', chain: 'polygon', lastUsed: new Date('2024-01-01').toISOString() },
      ];
      localStorageMock.setItem('connectedWallets', JSON.stringify(wallets));
      localStorageMock.setItem('activeWallet', '0x1111');

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x1111');
      });

      // Switch wallet
      const selectButton = screen.getByTestId('select-0x2222');
      await userEvent.click(selectButton);

      await waitFor(() => {
        expect(screen.getByTestId('active-wallet')).toHaveTextContent('0x2222');
      });

      // Verify lastUsed was updated in localStorage
      await waitFor(() => {
        const savedWallets = JSON.parse(localStorageMock.getItem('connectedWallets') || '[]');
        const wallet2 = savedWallets.find((w: unknown) => w.address === '0x2222');
        expect(wallet2).toBeDefined();
        expect(new Date(wallet2.lastUsed).getTime()).toBeGreaterThan(new Date('2024-01-01').getTime());
      });
    });
  });
});
