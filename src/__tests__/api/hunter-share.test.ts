/**
 * Tests for Hunter Share API
 * 
 * Requirements:
 * - 5.8: Share functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/hunter/share/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  })),
}));

describe('Hunter Share API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/hunter/share', () => {
    it('should validate opportunity_id parameter', async () => {
      const req = new NextRequest('http://localhost/api/hunter/share?opportunity_id=invalid');

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('BAD_REQUEST');
    });

    it('should return 404 for non-existent opportunity', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = createClient('', '');
      
      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') }),
            })),
          })),
        })),
      }));

      vi.mocked(mockSupabase.from).mockImplementation(mockFrom as any);

      const req = new NextRequest('http://localhost/api/hunter/share?opportunity_id=123e4567-e89b-12d3-a456-426614174000');

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe('NOT_FOUND');
    });

    it('should generate share data successfully', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = createClient('', '');
      
      const mockOpportunity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test-opportunity',
        title: 'Test Opportunity',
        protocol_name: 'Test Protocol',
        protocol_logo: 'https://example.com/logo.png',
        type: 'airdrop',
        reward_min: 100,
        reward_max: 500,
        reward_currency: 'USD',
        trust_score: 85,
        trust_level: 'green',
      };

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockOpportunity, error: null }),
            })),
          })),
        })),
      }));

      vi.mocked(mockSupabase.from).mockImplementation(mockFrom as any);

      const req = new NextRequest('http://localhost/api/hunter/share?opportunity_id=123e4567-e89b-12d3-a456-426614174000');

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toContain('/hunter/test-opportunity');
      expect(data.text).toContain('Test Opportunity');
      expect(data.text).toContain('Test Protocol');
      expect(data.opportunity.id).toBe(mockOpportunity.id);
      expect(data.meta.og_title).toContain('Test Opportunity');
      expect(data.meta.og_image).toBe(mockOpportunity.protocol_logo);
    });

    it('should handle opportunities without reward range', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const mockSupabase = createClient('', '');
      
      const mockOpportunity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test-opportunity',
        title: 'Test Opportunity',
        protocol_name: 'Test Protocol',
        protocol_logo: null,
        type: 'quest',
        reward_min: null,
        reward_max: null,
        reward_currency: null,
        trust_score: 85,
        trust_level: 'green',
      };

      const mockFrom = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: mockOpportunity, error: null }),
            })),
          })),
        })),
      }));

      vi.mocked(mockSupabase.from).mockImplementation(mockFrom as any);

      const req = new NextRequest('http://localhost/api/hunter/share?opportunity_id=123e4567-e89b-12d3-a456-426614174000');

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.text).toContain('Rewards available');
    });
  });
});
