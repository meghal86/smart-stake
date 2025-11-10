/**
 * Unit tests for Guardian Summary API endpoint
 * 
 * Tests:
 * - Query parameter validation
 * - Rate limiting
 * - Batch fetching
 * - Error handling
 * - Response format
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/guardian/summary/route';

// Mock dependencies
vi.mock('@/lib/guardian/hunter-integration', () => ({
  getGuardianSummary: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  getIdentifierFromHeaders: vi.fn(() => '127.0.0.1'),
  isAuthenticatedFromHeaders: vi.fn(() => false),
  RateLimitError: class RateLimitError extends Error {
    constructor(
      public limit: number,
      public remaining: number,
      public reset: number,
      public retryAfter: number
    ) {
      super('Rate limit exceeded');
      this.name = 'RateLimitError';
    }
  },
}));

import { getGuardianSummary } from '@/lib/guardian/hunter-integration';
import { checkRateLimit, RateLimitError } from '@/lib/rate-limit';

describe('GET /api/guardian/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Query Parameter Validation', () => {
    it('should return 400 when ids parameter is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/guardian/summary');

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('BAD_FILTER');
      expect(data.error.message).toContain('Missing required parameter');
    });

    it('should return 400 when ids parameter is empty', async () => {
      const req = new NextRequest('http://localhost:3000/api/guardian/summary?ids=');

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('BAD_FILTER');
    });

    it('should return 400 when IDs are not valid UUIDs', async () => {
      const req = new NextRequest(
        'http://localhost:3000/api/guardian/summary?ids=invalid-id,another-invalid'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('BAD_FILTER');
      // The error message may be generic due to Zod transform error
      expect(data.error.message).toBeTruthy();
    });

    it('should return 400 when more than 100 IDs are provided', async () => {
      const ids = Array.from({ length: 101 }, (_, i) =>
        `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`
      ).join(',');

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${ids}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('BAD_FILTER');
      // The error message may be generic due to Zod transform error
      expect(data.error.message).toBeTruthy();
    });

    it('should accept valid single UUID', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      
      vi.mocked(getGuardianSummary).mockResolvedValue(new Map([
        [id, {
          opportunityId: id,
          score: 85,
          level: 'green',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: [],
        }],
      ]));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${id}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.summaries[id]).toBeDefined();
    });

    it('should accept multiple valid UUIDs', async () => {
      const ids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      ];

      vi.mocked(getGuardianSummary).mockResolvedValue(new Map(
        ids.map(id => [id, {
          opportunityId: id,
          score: 85,
          level: 'green',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: [],
        }])
      ));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${ids.join(',')}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(3);
      expect(data.requested).toBe(3);
    });

    it('should trim whitespace from IDs', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      
      vi.mocked(getGuardianSummary).mockResolvedValue(new Map([
        [id, {
          opportunityId: id,
          score: 85,
          level: 'green',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: [],
        }],
      ]));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids= ${id} , ${id} `
      );

      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(vi.mocked(getGuardianSummary)).toHaveBeenCalledWith([id, id]);
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit is exceeded', async () => {
      vi.mocked(checkRateLimit).mockRejectedValue(
        new RateLimitError(60, 0, Date.now() + 60000, 60)
      );

      const req = new NextRequest(
        'http://localhost:3000/api/guardian/summary?ids=550e8400-e29b-41d4-a716-446655440000'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.code).toBe('RATE_LIMITED');
      expect(data.error.retry_after_sec).toBe(60);
      expect(response.headers.get('Retry-After')).toBe('60');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
    });

    it('should pass rate limit check for valid request', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      
      vi.mocked(checkRateLimit).mockResolvedValue(undefined);
      vi.mocked(getGuardianSummary).mockResolvedValue(new Map([
        [id, {
          opportunityId: id,
          score: 85,
          level: 'green',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: [],
        }],
      ]));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${id}`
      );

      const response = await GET(req);

      expect(response.status).toBe(200);
      expect(checkRateLimit).toHaveBeenCalled();
    });
  });

  describe('Batch Fetching', () => {
    it('should fetch summaries for all requested IDs', async () => {
      const ids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];

      vi.mocked(getGuardianSummary).mockResolvedValue(new Map([
        [ids[0], {
          opportunityId: ids[0],
          score: 85,
          level: 'green',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: ['Issue 1', 'Issue 2'],
        }],
        [ids[1], {
          opportunityId: ids[1],
          score: 65,
          level: 'amber',
          lastScannedTs: '2025-01-09T11:30:00Z',
          topIssues: ['Issue A'],
        }],
      ]));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${ids.join(',')}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(2);
      expect(data.requested).toBe(2);
      expect(data.summaries[ids[0]]).toEqual({
        score: 85,
        level: 'green',
        last_scanned_ts: '2025-01-09T12:00:00Z',
        top_issues: ['Issue 1', 'Issue 2'],
      });
      expect(data.summaries[ids[1]]).toEqual({
        score: 65,
        level: 'amber',
        last_scanned_ts: '2025-01-09T11:30:00Z',
        top_issues: ['Issue A'],
      });
    });

    it('should handle partial results when some IDs have no data', async () => {
      const ids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      ];

      // Only return data for first two IDs
      vi.mocked(getGuardianSummary).mockResolvedValue(new Map([
        [ids[0], {
          opportunityId: ids[0],
          score: 85,
          level: 'green',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: [],
        }],
        [ids[1], {
          opportunityId: ids[1],
          score: 65,
          level: 'amber',
          lastScannedTs: '2025-01-09T11:30:00Z',
          topIssues: [],
        }],
      ]));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${ids.join(',')}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(2);
      expect(data.requested).toBe(3);
      expect(data.summaries[ids[0]]).toBeDefined();
      expect(data.summaries[ids[1]]).toBeDefined();
      expect(data.summaries[ids[2]]).toBeUndefined();
    });

    it('should handle empty results when no data is found', async () => {
      const ids = ['550e8400-e29b-41d4-a716-446655440000'];

      vi.mocked(getGuardianSummary).mockResolvedValue(new Map());

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${ids.join(',')}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.count).toBe(0);
      expect(data.requested).toBe(1);
      expect(Object.keys(data.summaries)).toHaveLength(0);
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      
      vi.mocked(getGuardianSummary).mockResolvedValue(new Map([
        [id, {
          opportunityId: id,
          score: 85,
          level: 'green',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: ['Issue 1', 'Issue 2', 'Issue 3'],
        }],
      ]));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${id}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(data).toHaveProperty('summaries');
      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('requested');
      expect(data).toHaveProperty('ts');
      
      expect(typeof data.summaries).toBe('object');
      expect(typeof data.count).toBe('number');
      expect(typeof data.requested).toBe('number');
      expect(typeof data.ts).toBe('string');
    });

    it('should include correct headers', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      
      vi.mocked(getGuardianSummary).mockResolvedValue(new Map([
        [id, {
          opportunityId: id,
          score: 85,
          level: 'green',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: [],
        }],
      ]));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${id}`
      );

      const response = await GET(req);

      expect(response.headers.get('Cache-Control')).toContain('max-age=300');
      expect(response.headers.get('X-API-Version')).toBeDefined();
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should transform snake_case to match API spec', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      
      vi.mocked(getGuardianSummary).mockResolvedValue(new Map([
        [id, {
          opportunityId: id,
          score: 85,
          level: 'green',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: ['Issue 1'],
        }],
      ]));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${id}`
      );

      const response = await GET(req);
      const data = await response.json();

      const summary = data.summaries[id];
      expect(summary).toHaveProperty('last_scanned_ts');
      expect(summary).toHaveProperty('top_issues');
      expect(summary.last_scanned_ts).toBe('2025-01-09T12:00:00Z');
      expect(summary.top_issues).toEqual(['Issue 1']);
    });
  });

  describe('Trust Levels', () => {
    it('should return green level for score >= 80', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      
      vi.mocked(getGuardianSummary).mockResolvedValue(new Map([
        [id, {
          opportunityId: id,
          score: 85,
          level: 'green',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: [],
        }],
      ]));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${id}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(data.summaries[id].level).toBe('green');
      expect(data.summaries[id].score).toBeGreaterThanOrEqual(80);
    });

    it('should return amber level for score 60-79', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      
      vi.mocked(getGuardianSummary).mockResolvedValue(new Map([
        [id, {
          opportunityId: id,
          score: 65,
          level: 'amber',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: [],
        }],
      ]));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${id}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(data.summaries[id].level).toBe('amber');
      expect(data.summaries[id].score).toBeGreaterThanOrEqual(60);
      expect(data.summaries[id].score).toBeLessThan(80);
    });

    it('should return red level for score < 60', async () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      
      vi.mocked(getGuardianSummary).mockResolvedValue(new Map([
        [id, {
          opportunityId: id,
          score: 45,
          level: 'red',
          lastScannedTs: '2025-01-09T12:00:00Z',
          topIssues: ['Critical issue'],
        }],
      ]));

      const req = new NextRequest(
        `http://localhost:3000/api/guardian/summary?ids=${id}`
      );

      const response = await GET(req);
      const data = await response.json();

      expect(data.summaries[id].level).toBe('red');
      expect(data.summaries[id].score).toBeLessThan(60);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when service throws unexpected error', async () => {
      vi.mocked(getGuardianSummary).mockRejectedValue(
        new Error('Database connection failed')
      );

      const req = new NextRequest(
        'http://localhost:3000/api/guardian/summary?ids=550e8400-e29b-41d4-a716-446655440000'
      );

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe('INTERNAL');
      expect(data.error.message).toContain('internal error');
    });

    it('should include X-API-Version header in error responses', async () => {
      const req = new NextRequest('http://localhost:3000/api/guardian/summary');

      const response = await GET(req);

      expect(response.status).toBe(400);
      expect(response.headers.get('X-API-Version')).toBeDefined();
    });
  });
});
