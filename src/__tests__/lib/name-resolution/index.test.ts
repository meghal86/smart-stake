/**
 * Name Resolution Service Tests
 * 
 * Tests for ENS, Lens Protocol, and Unstoppable Domains name resolution
 * 
 * @see src/lib/name-resolution/index.ts
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 50
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  resolveName,
  resolveNames,
  clearCache,
  getCacheSize,
  preloadNames,
  initializeProvider,
  type ResolvedName,
} from '@/lib/name-resolution';
import { ethers } from 'ethers';

// ============================================================================
// Mocks
// ============================================================================

// Mock ethers provider
const mockProvider = {
  lookupAddress: vi.fn(),
  getResolver: vi.fn(),
};

// Mock Lens contract
const mockLensContract = {
  defaultProfile: vi.fn(),
  getProfile: vi.fn(),
};

// Mock UD contract
const mockUDContract = {
  reverseOf: vi.fn(),
};

vi.mock('ethers', async () => {
  const actual = await vi.importActual('ethers');
  return {
    ...actual,
    ethers: {
      ...actual.ethers,
      providers: {
        JsonRpcProvider: vi.fn(() => mockProvider),
        Web3Provider: vi.fn(() => mockProvider),
      },
      Contract: vi.fn((address, abi, provider) => {
        // Return appropriate mock based on address
        if (address === '0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d') {
          return mockLensContract;
        }
        if (address === '0xa9a6A3626993D487d2Dbda3173cf58cA1a9D9e9f') {
          return mockUDContract;
        }
        return {};
      }),
    },
  };
});

// ============================================================================
// Test Data
// ============================================================================

const TEST_ADDRESS = '0x1234567890123456789012345678901234567890';
const TEST_ADDRESS_2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const INVALID_ADDRESS = 'not-an-address';

// ============================================================================
// Tests
// ============================================================================

describe('Name Resolution Service', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearCache();
  });

  // ==========================================================================
  // Basic Resolution
  // ==========================================================================

  describe('resolveName', () => {
    it('should return null for invalid address', async () => {
      const result = await resolveName(INVALID_ADDRESS);
      expect(result).toBeNull();
    });

    it('should return null for empty address', async () => {
      const result = await resolveName('');
      expect(result).toBeNull();
    });

    it('should resolve ENS name successfully', async () => {
      mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');
      mockProvider.getResolver.mockResolvedValue({
        getText: vi.fn().mockResolvedValue('https://avatar.url'),
      });

      const result = await resolveName(TEST_ADDRESS);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('vitalik.eth');
      expect(result?.provider).toBe('ens');
      expect(result?.avatar).toBe('https://avatar.url');
      expect(result?.resolvedAt).toBeInstanceOf(Date);
    });

    it('should resolve ENS name without avatar', async () => {
      mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');
      mockProvider.getResolver.mockResolvedValue(null);

      const result = await resolveName(TEST_ADDRESS);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('vitalik.eth');
      expect(result?.provider).toBe('ens');
      expect(result?.avatar).toBeUndefined();
    });

    it('should fallback to Lens when ENS fails', async () => {
      mockProvider.lookupAddress.mockResolvedValue(null);
      mockLensContract.defaultProfile.mockResolvedValue(ethers.BigNumber.from(123));
      mockLensContract.getProfile.mockResolvedValue({
        handle: 'vitalik.lens',
        imageURI: 'https://lens-avatar.url',
      });

      const result = await resolveName(TEST_ADDRESS);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('vitalik.lens');
      expect(result?.provider).toBe('lens');
      expect(result?.avatar).toBe('https://lens-avatar.url');
    });

    it('should fallback to Unstoppable when ENS and Lens fail', async () => {
      mockProvider.lookupAddress.mockResolvedValue(null);
      mockLensContract.defaultProfile.mockResolvedValue(ethers.BigNumber.from(0));
      mockUDContract.reverseOf.mockResolvedValue('vitalik.crypto');

      const result = await resolveName(TEST_ADDRESS);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('vitalik.crypto');
      expect(result?.provider).toBe('unstoppable');
    });

    it('should return null when all providers fail', async () => {
      mockProvider.lookupAddress.mockResolvedValue(null);
      mockLensContract.defaultProfile.mockResolvedValue(ethers.BigNumber.from(0));
      mockUDContract.reverseOf.mockResolvedValue(null);

      const result = await resolveName(TEST_ADDRESS);

      expect(result).toBeNull();
    });

    it('should handle provider errors gracefully', async () => {
      mockProvider.lookupAddress.mockRejectedValue(new Error('Network error'));
      mockLensContract.defaultProfile.mockRejectedValue(new Error('Network error'));
      mockUDContract.reverseOf.mockRejectedValue(new Error('Network error'));

      const result = await resolveName(TEST_ADDRESS);

      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // Provider Selection
  // ==========================================================================

  describe('provider selection', () => {
    it('should only try ENS when specified', async () => {
      mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');

      const result = await resolveName(TEST_ADDRESS, {
        providers: ['ens'],
      });

      expect(result?.provider).toBe('ens');
      expect(mockLensContract.defaultProfile).not.toHaveBeenCalled();
      expect(mockUDContract.reverseOf).not.toHaveBeenCalled();
    });

    it('should only try Lens when specified', async () => {
      mockLensContract.defaultProfile.mockResolvedValue(ethers.BigNumber.from(123));
      mockLensContract.getProfile.mockResolvedValue({
        handle: 'vitalik.lens',
      });

      const result = await resolveName(TEST_ADDRESS, {
        providers: ['lens'],
      });

      expect(result?.provider).toBe('lens');
      expect(mockProvider.lookupAddress).not.toHaveBeenCalled();
      expect(mockUDContract.reverseOf).not.toHaveBeenCalled();
    });

    it('should try multiple providers in order', async () => {
      mockProvider.lookupAddress.mockResolvedValue(null);
      mockLensContract.defaultProfile.mockResolvedValue(ethers.BigNumber.from(123));
      mockLensContract.getProfile.mockResolvedValue({
        handle: 'vitalik.lens',
      });

      const result = await resolveName(TEST_ADDRESS, {
        providers: ['ens', 'lens'],
      });

      expect(result?.provider).toBe('lens');
      expect(mockProvider.lookupAddress).toHaveBeenCalled();
      expect(mockLensContract.defaultProfile).toHaveBeenCalled();
      expect(mockUDContract.reverseOf).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Caching
  // ==========================================================================

  describe('caching', () => {
    it('should cache resolved names', async () => {
      mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');

      // First call
      const result1 = await resolveName(TEST_ADDRESS);
      expect(result1?.name).toBe('vitalik.eth');
      expect(mockProvider.lookupAddress).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await resolveName(TEST_ADDRESS);
      expect(result2?.name).toBe('vitalik.eth');
      expect(mockProvider.lookupAddress).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should not cache null results (allows retry)', async () => {
      mockProvider.lookupAddress.mockResolvedValue(null);
      mockLensContract.defaultProfile.mockResolvedValue(ethers.BigNumber.from(0));
      mockUDContract.reverseOf.mockResolvedValue(null);

      // First call
      const result1 = await resolveName(TEST_ADDRESS);
      expect(result1).toBeNull();

      // Second call should retry (not cached)
      const result2 = await resolveName(TEST_ADDRESS);
      expect(result2).toBeNull();
      expect(mockProvider.lookupAddress).toHaveBeenCalledTimes(2); // Called twice, not cached
    });

    it('should skip cache when requested', async () => {
      mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');

      // First call
      await resolveName(TEST_ADDRESS);
      expect(mockProvider.lookupAddress).toHaveBeenCalledTimes(1);

      // Second call with skipCache
      await resolveName(TEST_ADDRESS, { skipCache: true });
      expect(mockProvider.lookupAddress).toHaveBeenCalledTimes(2);
    });

    it('should normalize addresses for cache lookup', async () => {
      mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');

      // Resolve with lowercase
      await resolveName(TEST_ADDRESS.toLowerCase());
      expect(mockProvider.lookupAddress).toHaveBeenCalledTimes(1);

      // Resolve with uppercase (should use cache)
      await resolveName(TEST_ADDRESS.toUpperCase());
      expect(mockProvider.lookupAddress).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', async () => {
      mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');

      // Resolve and cache
      await resolveName(TEST_ADDRESS);
      expect(getCacheSize()).toBe(1);

      // Clear cache
      clearCache();
      expect(getCacheSize()).toBe(0);

      // Next call should hit provider again
      await resolveName(TEST_ADDRESS);
      expect(mockProvider.lookupAddress).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // Batch Resolution
  // ==========================================================================

  describe('resolveNames', () => {
    it('should resolve multiple addresses', async () => {
      mockProvider.lookupAddress
        .mockResolvedValueOnce('vitalik.eth')
        .mockResolvedValueOnce('alice.eth');

      const addresses = [TEST_ADDRESS, TEST_ADDRESS_2];
      const results = await resolveNames(addresses);

      expect(results.size).toBe(2);
      expect(results.get(TEST_ADDRESS.toLowerCase())?.name).toBe('vitalik.eth');
      expect(results.get(TEST_ADDRESS_2.toLowerCase())?.name).toBe('alice.eth');
    });

    it('should handle mixed success and failure', async () => {
      mockProvider.lookupAddress
        .mockResolvedValueOnce('vitalik.eth')
        .mockResolvedValueOnce(null);
      mockLensContract.defaultProfile.mockResolvedValue(ethers.BigNumber.from(0));
      mockUDContract.reverseOf.mockResolvedValue(null);

      const addresses = [TEST_ADDRESS, TEST_ADDRESS_2];
      const results = await resolveNames(addresses);

      expect(results.size).toBe(2);
      expect(results.get(TEST_ADDRESS.toLowerCase())?.name).toBe('vitalik.eth');
      expect(results.get(TEST_ADDRESS_2.toLowerCase())).toBeNull();
    });

    it('should resolve addresses in parallel', async () => {
      const startTime = Date.now();
      
      mockProvider.lookupAddress.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('test.eth'), 100))
      );

      const addresses = [TEST_ADDRESS, TEST_ADDRESS_2];
      await resolveNames(addresses);

      const duration = Date.now() - startTime;
      
      // Should take ~100ms (parallel), not ~200ms (sequential)
      expect(duration).toBeLessThan(150);
    });
  });

  // ==========================================================================
  // Preloading
  // ==========================================================================

  describe('preloadNames', () => {
    it('should preload names into cache', async () => {
      mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');

      const addresses = [TEST_ADDRESS];
      await preloadNames(addresses);

      expect(getCacheSize()).toBe(1);

      // Next call should use cache
      await resolveName(TEST_ADDRESS);
      expect(mockProvider.lookupAddress).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle Lens profile with no handle', async () => {
      mockProvider.lookupAddress.mockResolvedValue(null);
      mockLensContract.defaultProfile.mockResolvedValue(ethers.BigNumber.from(123));
      mockLensContract.getProfile.mockResolvedValue({
        handle: '',
      });
      mockUDContract.reverseOf.mockResolvedValue(null);

      const result = await resolveName(TEST_ADDRESS);

      expect(result).toBeNull();
    });

    it('should handle Lens profile ID of 0', async () => {
      mockProvider.lookupAddress.mockResolvedValue(null);
      mockLensContract.defaultProfile.mockResolvedValue(ethers.BigNumber.from(0));

      const result = await resolveName(TEST_ADDRESS, {
        providers: ['lens'],
      });

      expect(result).toBeNull();
    });

    it('should handle resolver without getText method', async () => {
      mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');
      mockProvider.getResolver.mockResolvedValue({
        getText: vi.fn().mockRejectedValue(new Error('Not supported')),
      });

      const result = await resolveName(TEST_ADDRESS);

      expect(result?.name).toBe('vitalik.eth');
      expect(result?.avatar).toBeUndefined();
    });

    it('should handle timeout gracefully', async () => {
      mockProvider.lookupAddress.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('vitalik.eth'), 10000))
      );

      const result = await resolveName(TEST_ADDRESS);

      // Should timeout and return null
      expect(result).toBeNull();
    }, 10000);
  });

  // ==========================================================================
  // Cache Size
  // ==========================================================================

  describe('getCacheSize', () => {
    it('should return 0 for empty cache', () => {
      expect(getCacheSize()).toBe(0);
    });

    it('should return correct size after caching', async () => {
      mockProvider.lookupAddress.mockResolvedValue('vitalik.eth');

      await resolveName(TEST_ADDRESS);
      expect(getCacheSize()).toBe(1);

      await resolveName(TEST_ADDRESS_2);
      expect(getCacheSize()).toBe(2);
    });
  });
});
