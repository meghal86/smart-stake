/**
 * Integration tests for /api/harvest/opportunities endpoint
 * 
 * Tests:
 * - Query parameter validation
 * - Rate limiting
 * - Pagination
 * - Caching behavior
 * - Authentication
 * - Filtering
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/harvest/opportunities/route';
import * as rateLimit from '@/lib/rate-limit';

// Mock rate limiting
vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  getIdentifierFromHeaders: vi.fn(() => 'test-ip'),
  isAuthenticatedFromHeaders: vi.fn(() => true),
  RateLimitError: class RateLimitError extends Error {
    limit: number;
    reset: number;
    remaining: number;
    retryAfter: number;
    
    constructor(data: { limit: number; reset: number; remaining: number; retryAfter: number }) {
      super('Rate limit exceeded');
      this.limit = data.limit;
      this.reset = data.reset;
      this.remaining = data.remaining;
      this.retryAfter = data.retryAfter;
    }
  },
}));

// Mock Supabase
vi.mock('@/integrations/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            or: vi.fn(function(this: unknown) { return this; }),
            gte: vi.fn(function(this: unknown) { return this; }),
            in: vi.fn(function(this: unknown) { return this; }),
            lt: vi.fn(function(this: unknown) { return this; }),
            limit: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
}));

describe('GET /api/harvest/opportunities - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: rate limit passes
    vi.mocked(rateLimit.checkRateLimit).mockResolvedValue({
      success: true,
      limit: 120,
      remaining: 119,
      reset: Date.now() + 3600000,
    });
  });
  
  describe('Query Parameter Validation', () => {
    it('should accept valid query parameters', async () => {
      const req = new NextRequest(
        'http://localhost/api/harvest/opportunities?minBenefit=100&limit=10'
      );
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('cursor');
      expect(data).toHaveProperty('ts');
      expect(data).toHaveProperty('summary');
    });
    
    it('should reject negative minBenefit', async () => {
      const req = new NextRequest(
        'http://localhost/api/harvest/opportunities?minBenefit=-100'
      );
      
      const response = await GET(req);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('BAD_REQUEST');
    });
    
    it('should reject limit > 100', async () => {
      const req = new NextRequest(
        'http://localhost/api/harvest/opportunities?limit=101'
      );
      
      const response = await GET(req);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('BAD_REQUEST');
    });
    
    it('should reject limit < 1', async () => {
      const req = new NextRequest(
        'http://localhost/api/harvest/opportunities?limit=0'
      );
      
      const response = await GET(req);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('BAD_REQUEST');
    });
    
    it('should accept multiple wallet filters', async () => {
      const req = new NextRequest(
        'http://localhost/api/harvest/opportunities?wallet=0x123&wallet=0x456'
      );
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
    });
    
    it('should accept multiple risk level filters', async () => {
      const req = new NextRequest(
        'http://localhost/api/harvest/opportunities?riskLevel=LOW&riskLevel=MEDIUM'
      );
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
    });
    
    it('should reject invalid risk levels', async () => {
      const req = new NextRequest(
        'http://localhost/api/harvest/opportunities?riskLevel=INVALID'
      );
      
      const response = await GET(req);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('BAD_REQUEST');
    });
  });
  
  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const rateLimitError = new rateLimit.RateLimitError({
        limit: 60,
        reset: Date.now() + 3600000,
        remaining: 0,
        retryAfter: 60,
      });
      
      vi.mocked(rateLimit.checkRateLimit).mockRejectedValue(rateLimitError);
      
      const req = new NextRequest('http://localhost/api/harvest/opportunities');
      const response = await GET(req);
      
      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error.code).toBe('RATE_LIMITED');
      expect(data.error.retry_after_sec).toBe(60);
      
      // Check headers
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });
    
    it('should call checkRateLimit with correct parameters', async () => {
      const req = new NextRequest('http://localhost/api/harvest/opportunities');
      await GET(req);
      
      expect(rateLimit.checkRateLimit).toHaveBeenCalledWith('test-ip', true);
    });
  });
  
  describe('Pagination', () => {
    it('should accept cursor parameter', async () => {
      const cursor = Buffer.from(JSON.stringify({ netTaxBenefit: 100 })).toString('base64');
      const req = new NextRequest(
        `http://localhost/api/harvest/opportunities?cursor=${cursor}`
      );
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
    });
    
    it('should reject invalid cursor format', async () => {
      const req = new NextRequest(
        'http://localhost/api/harvest/opportunities?cursor=invalid-cursor'
      );
      
      const response = await GET(req);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error.code).toBe('BAD_REQUEST');
      expect(data.error.message).toContain('cursor');
    });
    
    it('should use default limit of 20', async () => {
      const req = new NextRequest('http://localhost/api/harvest/opportunities');
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      // The query should have been called with limit 21 (20 + 1 for hasMore check)
    });
    
    it('should respect custom limit', async () => {
      const req = new NextRequest('http://localhost/api/harvest/opportunities?limit=50');
      const response = await GET(req);
      
      expect(response.status).toBe(200);
    });
  });
  
  describe('Caching Behavior', () => {
    it('should include cache control headers', async () => {
      const req = new NextRequest('http://localhost/api/harvest/opportunities');
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('private');
      expect(cacheControl).toContain('max-age=300'); // 5 minutes
    });
    
    it('should include processing time header', async () => {
      const req = new NextRequest('http://localhost/api/harvest/opportunities');
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const processingTime = response.headers.get('X-Processing-Time');
      expect(processingTime).toBeTruthy();
      expect(parseInt(processingTime!, 10)).toBeGreaterThanOrEqual(0);
    });
  });
  
  describe('Authentication', () => {
    it('should require authentication', async () => {
      const { createClient } = await import('@/integrations/supabase/server');
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn(() => ({
            data: { user: null },
            error: new Error('Not authenticated'),
          })),
        },
      } as any);
      
      const req = new NextRequest('http://localhost/api/harvest/opportunities');
      const response = await GET(req);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error.code).toBe('UNAUTHORIZED');
    });
  });
  
  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      // Reset mock to default behavior
      const { createClient } = await import('@/integrations/supabase/server');
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn(() => ({
            data: { user: { id: 'test-user-id' } },
            error: null,
          })),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                or: vi.fn(function(this: unknown) { return this; }),
                gte: vi.fn(function(this: unknown) { return this; }),
                in: vi.fn(function(this: unknown) { return this; }),
                lt: vi.fn(function(this: unknown) { return this; }),
                limit: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      } as any);
      
      const req = new NextRequest('http://localhost/api/harvest/opportunities');
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Check structure
      expect(data).toHaveProperty('items');
      expect(data).toHaveProperty('cursor');
      expect(data).toHaveProperty('ts');
      expect(data).toHaveProperty('summary');
      
      // Check summary structure
      expect(data.summary).toHaveProperty('totalHarvestableLoss');
      expect(data.summary).toHaveProperty('estimatedNetBenefit');
      expect(data.summary).toHaveProperty('eligibleTokensCount');
      expect(data.summary).toHaveProperty('gasEfficiencyScore');
      
      // Check types
      expect(Array.isArray(data.items)).toBe(true);
      expect(typeof data.ts).toBe('string');
      expect(typeof data.summary.totalHarvestableLoss).toBe('number');
      expect(typeof data.summary.estimatedNetBenefit).toBe('number');
      expect(typeof data.summary.eligibleTokensCount).toBe('number');
      expect(['A', 'B', 'C']).toContain(data.summary.gasEfficiencyScore);
    });
    
    it('should return ISO 8601 timestamp', async () => {
      // Reset mock to default behavior
      const { createClient } = await import('@/integrations/supabase/server');
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn(() => ({
            data: { user: { id: 'test-user-id' } },
            error: null,
          })),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                or: vi.fn(function(this: unknown) { return this; }),
                gte: vi.fn(function(this: unknown) { return this; }),
                in: vi.fn(function(this: unknown) { return this; }),
                lt: vi.fn(function(this: unknown) { return this; }),
                limit: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      } as any);
      
      const req = new NextRequest('http://localhost/api/harvest/opportunities');
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Check if timestamp is valid ISO 8601
      const timestamp = new Date(data.ts);
      expect(timestamp.toISOString()).toBe(data.ts);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { createClient } = await import('@/integrations/supabase/server');
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn(() => ({
            data: { user: { id: 'test-user-id' } },
            error: null,
          })),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                or: vi.fn(function(this: unknown) { return this; }),
                gte: vi.fn(function(this: unknown) { return this; }),
                in: vi.fn(function(this: unknown) { return this; }),
                lt: vi.fn(function(this: unknown) { return this; }),
                limit: vi.fn(() => ({
                  data: null,
                  error: new Error('Database error'),
                })),
              })),
            })),
          })),
        })),
      } as any);
      
      const req = new NextRequest('http://localhost/api/harvest/opportunities');
      const response = await GET(req);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.code).toBe('INTERNAL');
    });
    
    it('should handle unexpected errors', async () => {
      const { createClient } = await import('@/integrations/supabase/server');
      vi.mocked(createClient).mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const req = new NextRequest('http://localhost/api/harvest/opportunities');
      const response = await GET(req);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error.code).toBe('INTERNAL');
    });
  });
  
  describe('Performance', () => {
    it('should log warning for slow queries', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Mock a slow query by adding delay
      const { createClient } = await import('@/integrations/supabase/server');
      vi.mocked(createClient).mockReturnValue({
        auth: {
          getUser: vi.fn(async () => {
            await new Promise(resolve => setTimeout(resolve, 250)); // 250ms delay
            return {
              data: { user: { id: 'test-user-id' } },
              error: null,
            };
          }),
        },
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                or: vi.fn(function(this: unknown) { return this; }),
                gte: vi.fn(function(this: unknown) { return this; }),
                in: vi.fn(function(this: unknown) { return this; }),
                lt: vi.fn(function(this: unknown) { return this; }),
                limit: vi.fn(() => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      } as any);
      
      const req = new NextRequest('http://localhost/api/harvest/opportunities');
      await GET(req);
      
      // Should log warning for queries > 200ms
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Slow opportunities query'));
      
      consoleSpy.mockRestore();
    });
  });
});
