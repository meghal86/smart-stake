/**
 * Tests for Hunter Save API
 * 
 * Requirements:
 * - 5.8: Save functionality
 * - 11.4: Rate limiting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, DELETE } from '@/app/api/hunter/save/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    })),
  })),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

describe('Hunter Save API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/hunter/save', () => {
    it('should require authentication', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = createClient('', '');
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      } as any);

      const req = new NextRequest('http://localhost/api/hunter/save', {
        method: 'POST',
        body: JSON.stringify({ opportunity_id: '123e4567-e89b-12d3-a456-426614174000' }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should validate request body', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = createClient('', '');
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      const { checkRateLimit } = await import('@/lib/rate-limit');
      vi.mocked(checkRateLimit).mockResolvedValue(undefined);

      const req = new NextRequest('http://localhost/api/hunter/save', {
        method: 'POST',
        body: JSON.stringify({ opportunity_id: 'invalid-uuid' }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('BAD_REQUEST');
    });

    it('should enforce rate limiting', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = createClient('', '');
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      const { checkRateLimit } = await import('@/lib/rate-limit');
      const rateLimitError = new Error('Rate limited') as any;
      rateLimitError.retryAfter = 60;
      vi.mocked(checkRateLimit).mockRejectedValue(rateLimitError);

      const req = new NextRequest('http://localhost/api/hunter/save', {
        method: 'POST',
        body: JSON.stringify({ opportunity_id: '123e4567-e89b-12d3-a456-426614174000' }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.code).toBe('RATE_LIMITED');
      expect(response.headers.get('Retry-After')).toBe('60');
    });

    it('should save opportunity successfully', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = createClient('', '');
      
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      const mockOpportunity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Opportunity',
      };

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockOpportunity, error: null }),
          })),
        })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { saved_at: '2025-01-01T00:00:00Z' },
              error: null,
            }),
          })),
        })),
      }));

      vi.mocked(mockSupabase.from).mockImplementation(mockFrom as any);

      const { checkRateLimit } = await import('@/lib/rate-limit');
      vi.mocked(checkRateLimit).mockResolvedValue(undefined);

      const req = new NextRequest('http://localhost/api/hunter/save', {
        method: 'POST',
        body: JSON.stringify({ opportunity_id: '123e4567-e89b-12d3-a456-426614174000' }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.opportunity.id).toBe(mockOpportunity.id);
    });
  });

  describe('DELETE /api/hunter/save', () => {
    it('should require authentication', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = createClient('', '');
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      } as any);

      const req = new NextRequest('http://localhost/api/hunter/save?opportunity_id=123e4567-e89b-12d3-a456-426614174000', {
        method: 'DELETE',
      });

      const response = await DELETE(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should unsave opportunity successfully', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = createClient('', '');
      
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      } as any);

      const mockFrom = vi.fn(() => ({
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ error: null }),
          })),
        })),
      }));

      vi.mocked(mockSupabase.from).mockImplementation(mockFrom as any);

      const req = new NextRequest('http://localhost/api/hunter/save?opportunity_id=123e4567-e89b-12d3-a456-426614174000', {
        method: 'DELETE',
      });

      const response = await DELETE(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
