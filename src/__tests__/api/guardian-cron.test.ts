/**
 * Unit tests for Guardian Staleness Cron Job
 * 
 * Requirements: 2.9, 8.13
 * Task: 28
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/cron/guardian-rescan/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/guardian/hunter-integration', () => ({
  listStaleOpportunities: vi.fn(),
  queueRescan: vi.fn(),
  invalidateGuardianCache: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                data: [],
                error: null,
              })),
            })),
          })),
        })),
        gte: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('Guardian Staleness Cron Job', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set CRON_SECRET for tests
    process.env.CRON_SECRET = 'test-secret';
  });

  describe('Authentication', () => {
    it('should reject requests without authorization header', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject requests with invalid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer wrong-token',
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should accept requests with valid token', async () => {
      const { listStaleOpportunities } = await import('@/lib/guardian/hunter-integration');
      vi.mocked(listStaleOpportunities).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer test-secret',
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject when CRON_SECRET is not configured', async () => {
      delete process.env.CRON_SECRET;

      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer test-secret',
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');

      // Restore for other tests
      process.env.CRON_SECRET = 'test-secret';
    });
  });

  describe('Stale Opportunity Processing', () => {
    it('should find and queue stale opportunities', async () => {
      const { listStaleOpportunities, queueRescan } = await import('@/lib/guardian/hunter-integration');
      
      const staleOpps = [
        { id: 'opp-1', slug: 'test-1', lastScannedTs: '2025-01-01T00:00:00Z', hoursSinceLastScan: 48 },
        { id: 'opp-2', slug: 'test-2', lastScannedTs: '2025-01-01T00:00:00Z', hoursSinceLastScan: 36 },
      ];

      vi.mocked(listStaleOpportunities).mockResolvedValue(staleOpps);
      vi.mocked(queueRescan).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer test-secret',
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stale_found).toBe(2);
      expect(data.queued).toBe(2);
      expect(data.queue_errors).toBe(0);

      expect(listStaleOpportunities).toHaveBeenCalledWith({
        olderThanHours: 24,
        limit: 100,
      });
      expect(queueRescan).toHaveBeenCalledTimes(2);
      expect(queueRescan).toHaveBeenCalledWith('opp-1');
      expect(queueRescan).toHaveBeenCalledWith('opp-2');
    });

    it('should handle queue failures gracefully', async () => {
      const { listStaleOpportunities, queueRescan } = await import('@/lib/guardian/hunter-integration');
      
      const staleOpps = [
        { id: 'opp-1', slug: 'test-1', lastScannedTs: '2025-01-01T00:00:00Z', hoursSinceLastScan: 48 },
        { id: 'opp-2', slug: 'test-2', lastScannedTs: '2025-01-01T00:00:00Z', hoursSinceLastScan: 36 },
        { id: 'opp-3', slug: 'test-3', lastScannedTs: '2025-01-01T00:00:00Z', hoursSinceLastScan: 30 },
      ];

      vi.mocked(listStaleOpportunities).mockResolvedValue(staleOpps);
      vi.mocked(queueRescan)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer test-secret',
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stale_found).toBe(3);
      expect(data.queued).toBe(2);
      expect(data.queue_errors).toBe(1);
    });

    it('should handle no stale opportunities', async () => {
      const { listStaleOpportunities } = await import('@/lib/guardian/hunter-integration');
      
      vi.mocked(listStaleOpportunities).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer test-secret',
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stale_found).toBe(0);
      expect(data.queued).toBe(0);
      expect(data.queue_errors).toBe(0);
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      const { listStaleOpportunities } = await import('@/lib/guardian/hunter-integration');
      vi.mocked(listStaleOpportunities).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer test-secret',
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('stale_found');
      expect(data).toHaveProperty('queued');
      expect(data).toHaveProperty('queue_errors');
      expect(data).toHaveProperty('category_flips');
      expect(data).toHaveProperty('cache_purged');
      expect(data).toHaveProperty('duration_ms');
      expect(data).toHaveProperty('timestamp');

      expect(typeof data.success).toBe('boolean');
      expect(typeof data.stale_found).toBe('number');
      expect(typeof data.queued).toBe('number');
      expect(typeof data.queue_errors).toBe('number');
      expect(typeof data.category_flips).toBe('number');
      expect(typeof data.cache_purged).toBe('number');
      expect(typeof data.duration_ms).toBe('number');
      expect(typeof data.timestamp).toBe('string');
    });

    it('should include execution duration', async () => {
      const { listStaleOpportunities } = await import('@/lib/guardian/hunter-integration');
      vi.mocked(listStaleOpportunities).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer test-secret',
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(data.duration_ms).toBeGreaterThanOrEqual(0);
      expect(data.duration_ms).toBeLessThan(10000); // Should complete in less than 10 seconds
    });

    it('should include ISO timestamp', async () => {
      const { listStaleOpportunities } = await import('@/lib/guardian/hunter-integration');
      vi.mocked(listStaleOpportunities).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer test-secret',
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      // Verify timestamp is valid ISO 8601
      const timestamp = new Date(data.timestamp);
      expect(timestamp.toISOString()).toBe(data.timestamp);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { listStaleOpportunities } = await import('@/lib/guardian/hunter-integration');
      
      vi.mocked(listStaleOpportunities).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer test-secret',
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database connection failed');
      expect(data).toHaveProperty('duration_ms');
      expect(data).toHaveProperty('timestamp');
    });

    it('should handle unknown errors', async () => {
      const { listStaleOpportunities } = await import('@/lib/guardian/hunter-integration');
      
      vi.mocked(listStaleOpportunities).mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer test-secret',
        },
      });
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unknown error');
    });
  });

  describe('Performance', () => {
    it('should complete within reasonable time', async () => {
      const { listStaleOpportunities, queueRescan } = await import('@/lib/guardian/hunter-integration');
      
      const staleOpps = Array.from({ length: 50 }, (_, i) => ({
        id: `opp-${i}`,
        slug: `test-${i}`,
        lastScannedTs: '2025-01-01T00:00:00Z',
        hoursSinceLastScan: 48,
      }));

      vi.mocked(listStaleOpportunities).mockResolvedValue(staleOpps);
      vi.mocked(queueRescan).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/cron/guardian-rescan', {
        headers: {
          'Authorization': 'Bearer test-secret',
        },
      });
      
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stale_found).toBe(50);
      expect(data.queued).toBe(50);

      // Should complete in less than 5 seconds for 50 items
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000);
    });
  });
});
