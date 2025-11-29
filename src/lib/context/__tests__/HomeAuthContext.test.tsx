import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { HomeAuthProvider, useHomeAuth } from '../HomeAuthContext';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: null,
    isConnected: false,
  })),
  useSignMessage: vi.fn(() => ({
    signMessageAsync: vi.fn(),
  })),
  useDisconnect: vi.fn(() => ({
    disconnect: vi.fn(),
  })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('HomeAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document.cookie
    document.cookie = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <HomeAuthProvider>{children}</HomeAuthProvider>
  );

  describe('Initial auth state', () => {
    test('should start with unauthenticated state', () => {
      const { result } = renderHook(() => useHomeAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.walletAddress).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    test('should check for existing JWT on mount', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authenticated: true, walletAddress: '0x123' }),
      });
      global.fetch = mockFetch;

      renderHook(() => useHomeAuth(), { wrapper });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
          credentials: 'include',
        });
      });
    });

    test('should clear auth if JWT check fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('Wallet connection flow', () => {
    test('should handle successful wallet connection and signature', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      const mockSignature = '0xabcdef...';

      // Mock wagmi hooks
      const { useAccount, useSignMessage } = await import('wagmi');
      vi.mocked(useAccount).mockReturnValue({
        address: mockAddress,
        isConnected: true,
      } as any);

      const mockSignMessageAsync = vi.fn().mockResolvedValue(mockSignature);
      vi.mocked(useSignMessage).mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
      } as any);

      // Mock successful auth verification
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false, // Initial JWT check fails
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, walletAddress: mockAddress }),
        });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.walletAddress).toBe(mockAddress);
      });

      expect(mockSignMessageAsync).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/verify',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    test('should handle signature rejection', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';

      const { useAccount, useSignMessage } = await import('wagmi');
      vi.mocked(useAccount).mockReturnValue({
        address: mockAddress,
        isConnected: true,
      } as any);

      const mockSignMessageAsync = vi.fn().mockRejectedValue(
        new Error('User rejected the request')
      );
      vi.mocked(useSignMessage).mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
      } as any);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toContain('declined the signature request');
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    test('should handle connection timeout', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';

      const { useAccount, useSignMessage } = await import('wagmi');
      vi.mocked(useAccount).mockReturnValue({
        address: mockAddress,
        isConnected: true,
      } as any);

      const mockSignMessageAsync = vi.fn().mockRejectedValue(
        new Error('Connection timeout')
      );
      vi.mocked(useSignMessage).mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
      } as any);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toContain('took too long');
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('JWT validation', () => {
    test('should validate JWT on mount', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authenticated: true, walletAddress: '0x123' }),
      });
      global.fetch = mockFetch;

      renderHook(() => useHomeAuth(), { wrapper });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/me', {
          credentials: 'include',
        });
      });
    });

    test('should handle expired JWT', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('Disconnect functionality', () => {
    test('should clear JWT and disconnect wallet', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';
      const mockDisconnect = vi.fn();

      const { useAccount, useDisconnect } = await import('wagmi');
      vi.mocked(useAccount).mockReturnValue({
        address: mockAddress,
        isConnected: true,
      } as any);
      vi.mocked(useDisconnect).mockReturnValue({
        disconnect: mockDisconnect,
      } as any);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authenticated: true }),
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeAuth(), { wrapper });

      await act(async () => {
        result.current.disconnectWallet();
      });

      expect(mockDisconnect).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Error handling', () => {
    test('should handle network errors', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';

      const { useAccount, useSignMessage } = await import('wagmi');
      vi.mocked(useAccount).mockReturnValue({
        address: mockAddress,
        isConnected: true,
      } as any);

      const mockSignMessageAsync = vi.fn().mockRejectedValue(
        new Error('Network error')
      );
      vi.mocked(useSignMessage).mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
      } as any);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toContain('Network error');
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    test('should handle unsupported chain error', async () => {
      const mockAddress = '0x1234567890123456789012345678901234567890';

      const { useAccount, useSignMessage } = await import('wagmi');
      vi.mocked(useAccount).mockReturnValue({
        address: mockAddress,
        isConnected: true,
      } as any);

      const mockSignMessageAsync = vi.fn().mockRejectedValue(
        new Error('unsupported chain')
      );
      vi.mocked(useSignMessage).mockReturnValue({
        signMessageAsync: mockSignMessageAsync,
      } as any);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
      });
      global.fetch = mockFetch;

      const { result } = renderHook(() => useHomeAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toContain('Ethereum Mainnet or Sepolia');
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('useHomeAuth hook', () => {
    test('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useHomeAuth());
      }).toThrow('useHomeAuth must be used within HomeAuthProvider');
    });
  });
});
