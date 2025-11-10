/**
 * Unit tests for GET /api/eligibility/preview endpoint
 * 
 * Tests:
 * - Query parameter validation
 * - Missing wallet handling (graceful)
 * - Rate limiting
 * - Error responses
 * - Response structure
 * - Cache headers
 * 
 * Requirements: 6.1-6.8
 * Task: 14
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { ErrorCode } from '@/types/hunter';
import { CURRENT_API_VERSION } from '@/lib/api-version';

// Mock dependencies before imports
vi.mock('@/lib/eligibility-preview');
vi.mock('@/lib/rate-limit');
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
  },
}));

// Import after mocks
import { GET } from '@/app/api/eligibility/preview/route';
import * as eligibilityPreview from '@/lib/eligibility-preview';
import * as rateLimit from '@/lib/rate-limit';

describe('GET /api/eligibility/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(rateLimit.getIdentifierFromHeaders).mockReturnValue('test-ip');
    vi.mocked(rateLimit.isAuthenticatedFromHeaders).mockReturnValue(false);
    vi.mocked(rateLimit.checkRateLimit).mockResolvedValue(undefined);
  });

  describe('Query Parameter Validation', () => {
    it('should accept valid query parameters', async () => {
      const mockPreview = {
        status: 'likely' as const,
        score: 0.85,
        reasons: ['Active on ethereum', 'Wallet age 30+ days'],
        cachedUntil: '2025-01-08T12:00:00.000Z',
      };

      vi.mocked(eligibilityPreview.getEligibilityPreview).mockResolvedValue(mockPreview);

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('likely');
      expect(data.score).toBe(0.85);
      expect(data.reasons).toEqual(['Active on ethereum', 'Wallet age 30+ days']);
      expect(data.cachedUntil).toBe('2025-01-08T12:00:00.000Z');
      expect(data.ts).toBeDefined();
    });

    it('should reject invalid wallet address format', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=invalid&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe(ErrorCode.BAD_FILTER);
      expect(data.error.message).toContain('Invalid Ethereum wallet address format');
    });

    it('should reject invalid opportunity ID format', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=not-a-uuid&chain=ethereum'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe(ErrorCode.BAD_FILTER);
      expect(data.error.message).toContain('UUID');
    });

    it('should reject invalid chain format', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=invalid@chain'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe(ErrorCode.BAD_FILTER);
      expect(data.error.message).toContain('Invalid chain format');
    });

    it('should return error when opportunityId is missing', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&chain=ethereum'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe(ErrorCode.BAD_FILTER);
      expect(data.error.message).toContain('opportunityId');
    });

    it('should return error when chain is missing', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe(ErrorCode.BAD_FILTER);
      expect(data.error.message).toContain('chain');
    });
  });

  describe('Missing Wallet Handling', () => {
    it('should handle missing wallet gracefully with unknown status', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('unknown');
      expect(data.score).toBe(0);
      expect(data.reasons).toEqual(['Wallet address is required to check eligibility']);
      expect(data.cachedUntil).toBeDefined();
      
      // Should not call the eligibility service
      expect(eligibilityPreview.getEligibilityPreview).not.toHaveBeenCalled();
    });

    it('should include no-cache header for missing wallet response', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);

      expect(response.headers.get('Cache-Control')).toBe('no-cache');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const rateLimitError = new rateLimit.RateLimitError({
        limit: 60,
        remaining: 0,
        reset: Date.now() + 3600000,
        retryAfter: 3600,
      });

      vi.mocked(rateLimit.checkRateLimit).mockRejectedValue(rateLimitError);

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.code).toBe(ErrorCode.RATE_LIMITED);
      expect(data.error.retry_after_sec).toBe(3600);
      expect(response.headers.get('Retry-After')).toBe('3600');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    });

    it('should use different rate limits for authenticated users', async () => {
      vi.mocked(rateLimit.isAuthenticatedFromHeaders).mockReturnValue(true);

      const mockPreview = {
        status: 'likely' as const,
        score: 0.85,
        reasons: ['Active on ethereum'],
        cachedUntil: '2025-01-08T12:00:00.000Z',
      };

      vi.mocked(eligibilityPreview.getEligibilityPreview).mockResolvedValue(mockPreview);

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      await GET(req);

      expect(rateLimit.checkRateLimit).toHaveBeenCalledWith('test-ip', true);
    });
  });

  describe('Response Structure', () => {
    it('should return all required fields', async () => {
      const mockPreview = {
        status: 'maybe' as const,
        score: 0.55,
        reasons: ['Wallet age < 30 days', 'Low transaction count'],
        cachedUntil: '2025-01-08T12:00:00.000Z',
      };

      vi.mocked(eligibilityPreview.getEligibilityPreview).mockResolvedValue(mockPreview);

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('score');
      expect(data).toHaveProperty('reasons');
      expect(data).toHaveProperty('cachedUntil');
      expect(data).toHaveProperty('ts');
    });

    it('should handle unlikely status', async () => {
      const mockPreview = {
        status: 'unlikely' as const,
        score: 0.25,
        reasons: ['No activity on required chain', 'New wallet'],
        cachedUntil: '2025-01-08T12:00:00.000Z',
      };

      vi.mocked(eligibilityPreview.getEligibilityPreview).mockResolvedValue(mockPreview);

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('unlikely');
      expect(data.score).toBe(0.25);
    });

    it('should handle unknown status from service', async () => {
      const mockPreview = {
        status: 'unknown' as const,
        score: 0,
        reasons: ['Unable to fetch wallet data'],
        cachedUntil: '2025-01-08T12:00:00.000Z',
      };

      vi.mocked(eligibilityPreview.getEligibilityPreview).mockResolvedValue(mockPreview);

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('unknown');
      expect(data.score).toBe(0);
      expect(data.reasons).toContain('Unable to fetch wallet data');
    });
  });

  describe('Cache Headers', () => {
    it('should set private cache headers for wallet-specific data', async () => {
      const mockPreview = {
        status: 'likely' as const,
        score: 0.85,
        reasons: ['Active on ethereum'],
        cachedUntil: '2025-01-08T12:00:00.000Z',
      };

      vi.mocked(eligibilityPreview.getEligibilityPreview).mockResolvedValue(mockPreview);

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);

      expect(response.headers.get('Cache-Control')).toBe(
        'private, max-age=300, stale-while-revalidate=600'
      );
    });

    it('should include API version header', async () => {
      const mockPreview = {
        status: 'likely' as const,
        score: 0.85,
        reasons: ['Active on ethereum'],
        cachedUntil: '2025-01-08T12:00:00.000Z',
      };

      vi.mocked(eligibilityPreview.getEligibilityPreview).mockResolvedValue(mockPreview);

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);

      expect(response.headers.get('X-API-Version')).toBe(CURRENT_API_VERSION);
    });

    it('should set content-type header', async () => {
      const mockPreview = {
        status: 'likely' as const,
        score: 0.85,
        reasons: ['Active on ethereum'],
        cachedUntil: '2025-01-08T12:00:00.000Z',
      };

      vi.mocked(eligibilityPreview.getEligibilityPreview).mockResolvedValue(mockPreview);

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);

      expect(response.headers.get('Content-Type')).toContain('application/json');
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      vi.mocked(eligibilityPreview.getEligibilityPreview).mockRejectedValue(
        new Error('Database connection failed')
      );

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe(ErrorCode.INTERNAL);
      expect(data.error.message).toContain('internal error');
    });

    it('should include API version in error responses', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=invalid&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      const response = await GET(req);

      expect(response.headers.get('X-API-Version')).toBe(CURRENT_API_VERSION);
    });
  });

  describe('Service Integration', () => {
    it('should call eligibility service with correct parameters', async () => {
      const mockPreview = {
        status: 'likely' as const,
        score: 0.85,
        reasons: ['Active on ethereum'],
        cachedUntil: '2025-01-08T12:00:00.000Z',
      };

      vi.mocked(eligibilityPreview.getEligibilityPreview).mockResolvedValue(mockPreview);

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=ethereum'
      );

      await GET(req);

      expect(eligibilityPreview.getEligibilityPreview).toHaveBeenCalledWith(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '123e4567-e89b-12d3-a456-426614174000',
        'ethereum'
      );
    });

    it('should handle different chain names', async () => {
      const mockPreview = {
        status: 'likely' as const,
        score: 0.85,
        reasons: ['Active on base'],
        cachedUntil: '2025-01-08T12:00:00.000Z',
      };

      vi.mocked(eligibilityPreview.getEligibilityPreview).mockResolvedValue(mockPreview);

      const req = new NextRequest(
        'http://localhost:3000/api/eligibility/preview?wallet=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb&opportunityId=123e4567-e89b-12d3-a456-426614174000&chain=base'
      );

      await GET(req);

      expect(eligibilityPreview.getEligibilityPreview).toHaveBeenCalledWith(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        '123e4567-e89b-12d3-a456-426614174000',
        'base'
      );
    });
  });
});
