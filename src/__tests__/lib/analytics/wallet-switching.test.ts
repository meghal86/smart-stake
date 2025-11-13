/**
 * Tests for Wallet Switching Analytics
 * 
 * Verifies that wallet connection, switching, and disconnection events
 * are tracked correctly with proper metrics and privacy safeguards.
 * 
 * Requirements: 10.1-10.14, Task 57
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  trackWalletConnected,
  trackWalletSwitched,
  trackWalletDisconnected,
  trackFeedPersonalized,
} from '@/lib/analytics/tracker';
import { analytics } from '@/lib/analytics/client';
import { hashWalletAddress } from '@/lib/analytics/hash';

// Mock analytics client
vi.mock('@/lib/analytics/client', () => ({
  analytics: {
    track: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock hash function
vi.mock('@/lib/analytics/hash', () => ({
  hashWalletAddress: vi.fn(async (address: string) => `hash_${address}`),
}));

describe('Wallet Switching Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock sessionStorage
    const sessionStorageMock = {
      getItem: vi.fn(() => 'test_session_id'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackWalletConnected', () => {
    it('should track wallet connection with correct properties', async () => {
      const walletAddress = '0x1234567890abcdef';
      
      await trackWalletConnected({
        walletAddress,
        walletCount: 1,
        isFirstWallet: true,
        chain: 'ethereum',
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'wallet_connected',
          user_id_hash: 'hash_0x1234567890abcdef',
          properties: {
            wallet_count: 1,
            is_first_wallet: true,
            chain: 'ethereum',
          },
        })
      );
    });

    it('should track second wallet connection', async () => {
      const walletAddress = '0xabcdef1234567890';
      
      await trackWalletConnected({
        walletAddress,
        walletCount: 2,
        isFirstWallet: false,
        chain: 'polygon',
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'wallet_connected',
          properties: {
            wallet_count: 2,
            is_first_wallet: false,
            chain: 'polygon',
          },
        })
      );
    });

    it('should hash wallet address for privacy', async () => {
      const walletAddress = '0x1234567890abcdef';
      
      await trackWalletConnected({
        walletAddress,
        walletCount: 1,
        isFirstWallet: true,
        chain: 'ethereum',
      });

      expect(hashWalletAddress).toHaveBeenCalledWith(walletAddress);
      
      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.user_id_hash).toBe('hash_0x1234567890abcdef');
      expect(trackCall.properties).not.toHaveProperty('wallet_address');
    });

    it('should include session_id and timestamp', async () => {
      await trackWalletConnected({
        walletAddress: '0x1234567890abcdef',
        walletCount: 1,
        isFirstWallet: true,
        chain: 'ethereum',
      });

      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.session_id).toBe('test_session_id');
      expect(trackCall.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('trackWalletSwitched', () => {
    it('should track wallet switch with duration metric', async () => {
      const fromWallet = '0x1111111111111111';
      const toWallet = '0x2222222222222222';
      
      await trackWalletSwitched({
        fromWalletAddress: fromWallet,
        toWalletAddress: toWallet,
        walletCount: 2,
        switchDurationMs: 150,
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'wallet_switched',
          user_id_hash: 'hash_0x2222222222222222',
          properties: {
            wallet_count: 2,
            wallet_switch_duration_ms: 150,
            from_wallet_hash: 'hash_0x1111111111111111',
            to_wallet_hash: 'hash_0x2222222222222222',
          },
        })
      );
    });

    it('should handle first wallet selection (no from wallet)', async () => {
      const toWallet = '0x2222222222222222';
      
      await trackWalletSwitched({
        fromWalletAddress: undefined,
        toWalletAddress: toWallet,
        walletCount: 1,
        switchDurationMs: 100,
      });

      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.properties.from_wallet_hash).toBeUndefined();
      expect(trackCall.properties.to_wallet_hash).toBe('hash_0x2222222222222222');
    });

    it('should track switch duration for performance benchmarking', async () => {
      await trackWalletSwitched({
        fromWalletAddress: '0x1111111111111111',
        toWalletAddress: '0x2222222222222222',
        walletCount: 2,
        switchDurationMs: 250,
      });

      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.properties.wallet_switch_duration_ms).toBe(250);
      expect(typeof trackCall.properties.wallet_switch_duration_ms).toBe('number');
    });

    it('should hash both wallet addresses', async () => {
      const fromWallet = '0x1111111111111111';
      const toWallet = '0x2222222222222222';
      
      await trackWalletSwitched({
        fromWalletAddress: fromWallet,
        toWalletAddress: toWallet,
        walletCount: 2,
        switchDurationMs: 150,
      });

      expect(hashWalletAddress).toHaveBeenCalledWith(fromWallet);
      expect(hashWalletAddress).toHaveBeenCalledWith(toWallet);
    });
  });

  describe('trackWalletDisconnected', () => {
    it('should track wallet disconnection', async () => {
      const walletAddress = '0x1234567890abcdef';
      
      await trackWalletDisconnected({
        walletAddress,
        walletCount: 1,
        hadActiveWallet: true,
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'wallet_disconnected',
          user_id_hash: 'hash_0x1234567890abcdef',
          properties: {
            wallet_count: 1,
            had_active_wallet: true,
          },
        })
      );
    });

    it('should track disconnection of non-active wallet', async () => {
      const walletAddress = '0xabcdef1234567890';
      
      await trackWalletDisconnected({
        walletAddress,
        walletCount: 2,
        hadActiveWallet: false,
      });

      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.properties.had_active_wallet).toBe(false);
      expect(trackCall.properties.wallet_count).toBe(2);
    });

    it('should hash wallet address for privacy', async () => {
      const walletAddress = '0x1234567890abcdef';
      
      await trackWalletDisconnected({
        walletAddress,
        walletCount: 0,
        hadActiveWallet: true,
      });

      expect(hashWalletAddress).toHaveBeenCalledWith(walletAddress);
      
      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.user_id_hash).toBe('hash_0x1234567890abcdef');
    });
  });

  describe('trackFeedPersonalized', () => {
    it('should track feed personalization with duration', async () => {
      const walletAddress = '0x1234567890abcdef';
      
      await trackFeedPersonalized({
        walletAddress,
        walletCount: 1,
        personalizationDurationMs: 180,
        hasWalletHistory: true,
      });

      expect(analytics.track).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'feed_personalized',
          user_id_hash: 'hash_0x1234567890abcdef',
          properties: {
            wallet_count: 1,
            personalization_duration_ms: 180,
            has_wallet_history: true,
          },
        })
      );
    });

    it('should track personalization for new wallet without history', async () => {
      const walletAddress = '0xabcdef1234567890';
      
      await trackFeedPersonalized({
        walletAddress,
        walletCount: 1,
        personalizationDurationMs: 120,
        hasWalletHistory: false,
      });

      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.properties.has_wallet_history).toBe(false);
    });

    it('should track personalization duration for performance benchmarking', async () => {
      await trackFeedPersonalized({
        walletAddress: '0x1234567890abcdef',
        walletCount: 1,
        personalizationDurationMs: 95,
        hasWalletHistory: true,
      });

      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.properties.personalization_duration_ms).toBe(95);
      expect(typeof trackCall.properties.personalization_duration_ms).toBe('number');
    });

    it('should hash wallet address for privacy', async () => {
      const walletAddress = '0x1234567890abcdef';
      
      await trackFeedPersonalized({
        walletAddress,
        walletCount: 1,
        personalizationDurationMs: 180,
        hasWalletHistory: true,
      });

      expect(hashWalletAddress).toHaveBeenCalledWith(walletAddress);
      
      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.user_id_hash).toBe('hash_0x1234567890abcdef');
    });
  });

  describe('Privacy and Security', () => {
    it('should never include plain wallet addresses in events', async () => {
      const walletAddress = '0x1234567890abcdef';
      
      await trackWalletConnected({
        walletAddress,
        walletCount: 1,
        isFirstWallet: true,
        chain: 'ethereum',
      });

      const trackCall = (analytics.track as any).mock.calls[0][0];
      
      // Ensure plain wallet address is not in properties
      expect(trackCall.properties).not.toHaveProperty('wallet_address');
      expect(trackCall.properties).not.toHaveProperty('walletAddress');
      
      // Ensure user_id_hash is hashed (contains 'hash_' prefix from mock)
      expect(trackCall.user_id_hash).toContain('hash_');
      expect(trackCall.user_id_hash).toBe('hash_0x1234567890abcdef');
    });

    it('should use consistent hashing for same wallet', async () => {
      const walletAddress = '0x1234567890abcdef';
      
      await trackWalletConnected({
        walletAddress,
        walletCount: 1,
        isFirstWallet: true,
        chain: 'ethereum',
      });

      await trackWalletSwitched({
        fromWalletAddress: undefined,
        toWalletAddress: walletAddress,
        walletCount: 1,
        switchDurationMs: 100,
      });

      const call1 = (analytics.track as any).mock.calls[0][0];
      const call2 = (analytics.track as any).mock.calls[1][0];
      
      expect(call1.user_id_hash).toBe(call2.user_id_hash);
    });
  });

  describe('Wallet Count Tracking', () => {
    it('should track wallet count in all events', async () => {
      const walletAddress = '0x1234567890abcdef';
      
      await trackWalletConnected({
        walletAddress,
        walletCount: 3,
        isFirstWallet: false,
        chain: 'ethereum',
      });

      await trackWalletSwitched({
        fromWalletAddress: '0x1111111111111111',
        toWalletAddress: walletAddress,
        walletCount: 3,
        switchDurationMs: 150,
      });

      await trackFeedPersonalized({
        walletAddress,
        walletCount: 3,
        personalizationDurationMs: 180,
        hasWalletHistory: true,
      });

      const calls = (analytics.track as any).mock.calls;
      expect(calls[0][0].properties.wallet_count).toBe(3);
      expect(calls[1][0].properties.wallet_count).toBe(3);
      expect(calls[2][0].properties.wallet_count).toBe(3);
    });
  });

  describe('Timing Metrics', () => {
    it('should capture wallet switch duration in milliseconds', async () => {
      await trackWalletSwitched({
        fromWalletAddress: '0x1111111111111111',
        toWalletAddress: '0x2222222222222222',
        walletCount: 2,
        switchDurationMs: 125,
      });

      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.properties.wallet_switch_duration_ms).toBe(125);
    });

    it('should capture feed personalization duration in milliseconds', async () => {
      await trackFeedPersonalized({
        walletAddress: '0x1234567890abcdef',
        walletCount: 1,
        personalizationDurationMs: 200,
        hasWalletHistory: true,
      });

      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.properties.personalization_duration_ms).toBe(200);
    });

    it('should handle zero duration gracefully', async () => {
      await trackWalletSwitched({
        fromWalletAddress: '0x1111111111111111',
        toWalletAddress: '0x2222222222222222',
        walletCount: 2,
        switchDurationMs: 0,
      });

      const trackCall = (analytics.track as any).mock.calls[0][0];
      expect(trackCall.properties.wallet_switch_duration_ms).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics client errors gracefully', async () => {
      (analytics.track as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(
        trackWalletConnected({
          walletAddress: '0x1234567890abcdef',
          walletCount: 1,
          isFirstWallet: true,
          chain: 'ethereum',
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle hash function errors gracefully', async () => {
      (hashWalletAddress as any).mockRejectedValueOnce(new Error('Hash error'));

      await expect(
        trackWalletConnected({
          walletAddress: '0x1234567890abcdef',
          walletCount: 1,
          isFirstWallet: true,
          chain: 'ethereum',
        })
      ).rejects.toThrow('Hash error');
    });
  });
});
