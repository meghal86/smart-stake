/**
 * Integration tests for Hunter Opportunities API - Fixtures Mode
 * 
 * Requirements:
 * - 15.1: Deterministic dataset for E2E testing
 * - 15.2: All opportunity types included
 * - 15.3: Various trust levels and eligibility states
 * - 15.4: Edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/hunter/opportunities/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue(undefined),
  getIdentifierFromHeaders: vi.fn().mockReturnValue('test-identifier'),
  isAuthenticatedFromHeaders: vi.fn().mockReturnValue(false),
  RateLimitError: class RateLimitError extends Error {
    constructor(public retryAfter: number, public limit: number, public remaining: number, public reset: number) {
      super('Rate limit exceeded');
    }
  },
}));

vi.mock('@/lib/api-version', () => ({
  checkClientVersion: vi.fn(),
  getEffectiveApiVersion: vi.fn().mockReturnValue('1.0.0'),
  shouldEnforceVersion: vi.fn().mockReturnValue(false),
  CURRENT_API_VERSION: '1.0.0',
  VersionError: class VersionError extends Error {},
}));

describe('GET /api/hunter/opportunities - Fixtures Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic fixtures functionality', () => {
    it('should return fixtures when mode=fixtures', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('cursor');
      expect(data).toHaveProperty('ts');
      expect(data.items).toHaveLength(15);
      expect(data.cursor).toBeNull();
    });

    it('should return deterministic data on multiple calls', async () => {
      const request1 = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );
      const request2 = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response1 = await GET(request1);
      const response2 = await GET(request2);
      
      const data1 = await response1.json();
      const data2 = await response2.json();

      // Items should be identical (excluding timestamp)
      expect(data1.items).toEqual(data2.items);
      expect(data1.items.length).toBe(data2.items.length);
    });

    it('should set no-cache headers for fixtures', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers.get('X-API-Version')).toBe('1.0.0');
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Fixtures content validation', () => {
    it('should include all opportunity types', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);
      const data = await response.json();

      const types = new Set(data.items.map((item: any) => item.type));
      
      expect(types).toContain('airdrop');
      expect(types).toContain('quest');
      expect(types).toContain('staking');
      expect(types).toContain('yield');
      expect(types).toContain('points');
      expect(types).toContain('loyalty');
      expect(types).toContain('testnet');
    });

    it('should include all trust levels', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);
      const data = await response.json();

      const trustLevels = new Set(data.items.map((item: any) => item.trust.level));
      
      expect(trustLevels).toContain('green');
      expect(trustLevels).toContain('amber');
      expect(trustLevels).toContain('red');
    });

    it('should include various eligibility states', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);
      const data = await response.json();

      const eligibilityStates = new Set(
        data.items
          .filter((item: any) => item.eligibility_preview)
          .map((item: any) => item.eligibility_preview.status)
      );
      
      expect(eligibilityStates).toContain('likely');
      expect(eligibilityStates).toContain('maybe');
      expect(eligibilityStates).toContain('unlikely');
    });

    it('should include sponsored opportunities', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);
      const data = await response.json();

      const sponsored = data.items.filter((item: any) => item.sponsored);
      
      expect(sponsored.length).toBeGreaterThanOrEqual(3);
      sponsored.forEach((item: any) => {
        expect(item.badges.some((b: any) => b.type === 'sponsored')).toBe(true);
      });
    });

    it('should include expired opportunity', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);
      const data = await response.json();

      const expired = data.items.filter((item: any) => item.status === 'expired');
      
      expect(expired.length).toBeGreaterThan(0);
      expired.forEach((item: any) => {
        expect(item.time_left_sec).toBe(0);
      });
    });

    it('should include zero reward opportunity', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);
      const data = await response.json();

      const zeroReward = data.items.filter(
        (item: any) => item.reward.min === 0 && item.reward.max === 0
      );
      
      expect(zeroReward.length).toBeGreaterThan(0);
    });
  });

  describe('Response structure validation', () => {
    it('should have valid opportunity structure', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);
      const data = await response.json();

      data.items.forEach((item: any) => {
        // Required fields
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('slug');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('protocol');
        expect(item).toHaveProperty('type');
        expect(item).toHaveProperty('chains');
        expect(item).toHaveProperty('reward');
        expect(item).toHaveProperty('trust');
        expect(item).toHaveProperty('difficulty');
        expect(item).toHaveProperty('featured');
        expect(item).toHaveProperty('sponsored');
        expect(item).toHaveProperty('badges');
        expect(item).toHaveProperty('status');
        expect(item).toHaveProperty('created_at');
        expect(item).toHaveProperty('updated_at');

        // Protocol structure
        expect(item.protocol).toHaveProperty('name');
        expect(item.protocol).toHaveProperty('logo');

        // Reward structure
        expect(item.reward).toHaveProperty('min');
        expect(item.reward).toHaveProperty('max');
        expect(item.reward).toHaveProperty('currency');
        expect(item.reward).toHaveProperty('confidence');

        // Trust structure
        expect(item.trust).toHaveProperty('score');
        expect(item.trust).toHaveProperty('level');
        expect(item.trust).toHaveProperty('last_scanned_ts');
      });
    });

    it('should have valid ISO 8601 timestamps', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);
      const data = await response.json();

      // Response timestamp
      expect(() => new Date(data.ts)).not.toThrow();

      // Item timestamps
      data.items.forEach((item: any) => {
        expect(() => new Date(item.created_at)).not.toThrow();
        expect(() => new Date(item.updated_at)).not.toThrow();
        expect(() => new Date(item.trust.last_scanned_ts)).not.toThrow();
      });
    });

    it('should have valid URLs', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);
      const data = await response.json();

      data.items.forEach((item: any) => {
        expect(() => new URL(item.protocol.logo)).not.toThrow();
        
        if (item.external_url) {
          expect(() => new URL(item.external_url)).not.toThrow();
        }
      });
    });
  });

  describe('Fixtures with other query parameters', () => {
    it('should ignore filter parameters in fixtures mode', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures&type=airdrop&trust_min=90'
      );

      const response = await GET(request);
      const data = await response.json();

      // Should return all fixtures, not filtered
      expect(data.items).toHaveLength(15);
      
      // Should include non-airdrop types
      const types = new Set(data.items.map((item: any) => item.type));
      expect(types.size).toBeGreaterThan(1);
      
      // Should include trust scores below 90
      const lowTrust = data.items.filter((item: any) => item.trust.score < 90);
      expect(lowTrust.length).toBeGreaterThan(0);
    });

    it('should ignore cursor parameter in fixtures mode', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures&cursor=abc123'
      );

      const response = await GET(request);
      const data = await response.json();

      // Should return all fixtures with null cursor
      expect(data.items).toHaveLength(15);
      expect(data.cursor).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should still respect rate limiting in fixtures mode', async () => {
      const { checkRateLimit, RateLimitError } = await import('@/lib/rate-limit');
      
      vi.mocked(checkRateLimit).mockRejectedValueOnce(
        new RateLimitError(60, 60, 0, Date.now() + 60000)
      );

      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.code).toBe('RATE_LIMITED');
    });

    it('should handle invalid mode parameter gracefully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=invalid'
      );

      const response = await GET(request);

      // Should fail validation
      expect(response.status).toBe(400);
    });
  });

  describe('Performance', () => {
    it('should return fixtures quickly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/hunter/opportunities?mode=fixtures'
      );

      const startTime = Date.now();
      const response = await GET(request);
      await response.json();
      const endTime = Date.now();

      const duration = endTime - startTime;
      
      // Should be very fast since no database queries
      expect(duration).toBeLessThan(100); // 100ms
    });
  });
});
