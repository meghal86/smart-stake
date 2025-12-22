/**
 * Proof URL Verification Tests
 * 
 * Requirements: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R14.TRUST.METRICS_PROOF
 * 
 * Tests to ensure proof URLs are verified and honest unavailable states are shown
 * when destinations don't exist.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProofUrlVerificationManager, useProofUrlVerification } from '../ProofUrlVerification';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ProofUrlVerificationManager', () => {
  let manager: ProofUrlVerificationManager;

  beforeEach(() => {
    // Get fresh instance for each test
    manager = ProofUrlVerificationManager.getInstance();
    manager.clearCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    manager.clearCache();
  });

  describe('URL Verification', () => {
    test('verifies external URL exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await manager.verifyProofUrl('https://example.com/audit');

      expect(result.isAvailable).toBe(true);
      expect(result.status.exists).toBe(true);
      expect(result.status.statusCode).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith('https://example.com/audit', {
        method: 'HEAD',
        mode: 'no-cors'
      });
    });

    test('detects external URL does not exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await manager.verifyProofUrl('https://example.com/nonexistent');

      expect(result.isAvailable).toBe(false);
      expect(result.status.exists).toBe(false);
      expect(result.status.statusCode).toBe(404);
      expect(result.fallbackMessage).toContain('temporarily unavailable');
    });

    test('handles network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const result = await manager.verifyProofUrl('https://example.com/timeout');

      expect(result.isAvailable).toBe(false);
      expect(result.status.exists).toBe(false);
      expect(result.status.errorMessage).toBe('Network timeout');
      expect(result.fallbackMessage).toContain('network issues');
    });
  });

  describe('Internal Route Verification', () => {
    test('recognizes existing internal routes', async () => {
      const result = await manager.verifyProofUrl('/proof/guardian-methodology');

      expect(result.isAvailable).toBe(true);
      expect(result.status.exists).toBe(true);
      expect(result.status.statusCode).toBe(200);
      expect(mockFetch).not.toHaveBeenCalled(); // No external request
    });

    test('identifies planned but not implemented routes', async () => {
      const result = await manager.verifyProofUrl('/proof/assets-protected-sources');

      expect(result.isAvailable).toBe(false);
      expect(result.status.exists).toBe(false);
      expect(result.status.statusCode).toBe(404);
      expect(result.status.errorMessage).toContain('planned but not yet implemented');
      expect(result.fallbackMessage).toContain('being prepared');
    });

    test('handles unknown internal routes', async () => {
      const result = await manager.verifyProofUrl('/proof/unknown-route');

      expect(result.isAvailable).toBe(false);
      expect(result.status.exists).toBe(false);
      expect(result.status.statusCode).toBe(404);
      expect(result.fallbackMessage).toContain('being updated');
    });
  });

  describe('Caching', () => {
    test('caches verification results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      // First call
      const result1 = await manager.verifyProofUrl('https://example.com/cached');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await manager.verifyProofUrl('https://example.com/cached');
      expect(mockFetch).toHaveBeenCalledTimes(1); // No additional call
      expect(result1.status.lastChecked).toEqual(result2.status.lastChecked);
    });

    test('can clear cache manually', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      // First call
      await manager.verifyProofUrl('https://example.com/clear');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      manager.clearCache();

      // Second call should make new request
      await manager.verifyProofUrl('https://example.com/clear');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Fallback Messages', () => {
    test('provides appropriate message for planned routes', async () => {
      const result = await manager.verifyProofUrl('/proof/planned-feature');

      expect(result.fallbackMessage).toContain('being prepared');
      expect(result.fallbackMessage).toContain('available soon');
    });

    test('provides appropriate message for 404 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await manager.verifyProofUrl('https://example.com/404');

      expect(result.fallbackMessage).toContain('temporarily unavailable');
    });

    test('provides appropriate message for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await manager.verifyProofUrl('https://example.com/network');

      expect(result.fallbackMessage).toContain('network issues');
    });
  });

  describe('Preloading', () => {
    test('preloads common URLs', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      });

      await manager.preloadCommonUrls();

      // Should have made requests for external URLs
      expect(mockFetch).toHaveBeenCalledWith(
        'https://certik.com/projects/alphawhale',
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        'https://consensys.net/diligence/audits/alphawhale',
        expect.any(Object)
      );

      // Should have cached results
      const statuses = manager.getAllStatuses();
      expect(statuses.size).toBeGreaterThan(5); // Should have cached multiple URLs
    });
  });

  describe('Edge Cases', () => {
    test('handles invalid URLs gracefully', async () => {
      const result = await manager.verifyProofUrl('not-a-url');

      expect(result.isAvailable).toBe(false);
      expect(result.status.exists).toBe(false);
      expect(result.fallbackMessage).toContain('being updated');
    });

    test('handles empty URLs', async () => {
      const result = await manager.verifyProofUrl('');

      expect(result.isAvailable).toBe(false);
      expect(result.status.exists).toBe(false);
    });

    test('handles URLs with special characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const result = await manager.verifyProofUrl('https://example.com/path with spaces');

      expect(result.isAvailable).toBe(true);
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});

describe('useProofUrlVerification hook', () => {
  test('provides verification functions', () => {
    const hook = useProofUrlVerification();

    expect(hook.verifyUrl).toBeInstanceOf(Function);
    expect(hook.clearCache).toBeInstanceOf(Function);
    expect(hook.preloadCommonUrls).toBeInstanceOf(Function);
    expect(hook.getAllStatuses).toBeInstanceOf(Function);
  });

  test('verifyUrl function works', async () => {
    const hook = useProofUrlVerification();
    
    const result = await hook.verifyUrl('/proof/guardian-methodology');
    
    expect(result.isAvailable).toBe(true);
    expect(result.status.exists).toBe(true);
  });
});

describe('Honest Unavailable State Requirements', () => {
  let manager: ProofUrlVerificationManager;

  beforeEach(() => {
    manager = ProofUrlVerificationManager.getInstance();
    manager.clearCache();
  });

  test('never shows "Click for proof" when destination does not exist', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    const result = await manager.verifyProofUrl('https://example.com/fake-audit');

    // Should not be available
    expect(result.isAvailable).toBe(false);
    
    // Should provide honest fallback message
    expect(result.fallbackMessage).toBeTruthy();
    expect(result.fallbackMessage).not.toContain('Click for proof');
    expect(result.fallbackMessage).toContain('unavailable');
  });

  test('provides transparent explanation for unavailable content', async () => {
    const result = await manager.verifyProofUrl('/proof/nonexistent-docs');

    expect(result.isAvailable).toBe(false);
    expect(result.fallbackMessage).toBeTruthy();
    
    // Should be honest about the situation
    expect(result.fallbackMessage.toLowerCase()).toMatch(
      /unavailable|being updated|being prepared|temporarily/
    );
  });

  test('distinguishes between different types of unavailability', async () => {
    // Planned route
    const plannedResult = await manager.verifyProofUrl('/proof/assets-protected-sources');
    expect(plannedResult.fallbackMessage).toContain('being prepared');

    // Network error
    mockFetch.mockRejectedValueOnce(new Error('Network timeout'));
    const networkResult = await manager.verifyProofUrl('https://example.com/timeout');
    expect(networkResult.fallbackMessage).toContain('network issues');

    // 404 error
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const notFoundResult = await manager.verifyProofUrl('https://example.com/404');
    expect(notFoundResult.fallbackMessage).toContain('temporarily unavailable');
  });
});