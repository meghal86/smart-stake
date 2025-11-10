/**
 * Hunter Schema Tests
 * 
 * Tests for TypeScript types and Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  OpportunitySchema,
  OpportunitiesResponseSchema,
  ErrorResponseSchema,
  GuardianSummaryResponseSchema,
  EligibilityPreviewResponseSchema,
  FilterStateSchema,
  OpportunitiesQuerySchema,
  ErrorCodeSchema,
} from '../../schemas/hunter';
import { ErrorCode } from '../../types/hunter';

describe('Hunter Schemas', () => {
  describe('OpportunitySchema', () => {
    it('should validate a valid opportunity', () => {
      const validOpportunity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test-opportunity',
        title: 'Test Opportunity',
        description: 'A test opportunity',
        protocol: {
          name: 'Test Protocol',
          logo: 'https://example.com/logo.png',
        },
        type: 'airdrop',
        chains: ['ethereum', 'base'],
        reward: {
          min: 100,
          max: 500,
          currency: 'USD',
          confidence: 'estimated',
        },
        apr: 5.5,
        trust: {
          score: 85,
          level: 'green',
          last_scanned_ts: '2025-01-01T00:00:00Z',
          issues: [],
        },
        urgency: 'new',
        difficulty: 'easy',
        featured: false,
        sponsored: false,
        badges: [],
        status: 'published',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        published_at: '2025-01-01T00:00:00Z',
      };

      const result = OpportunitySchema.safeParse(validOpportunity);
      expect(result.success).toBe(true);
    });

    it('should reject invalid trust score', () => {
      const invalidOpportunity = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'test-opportunity',
        title: 'Test Opportunity',
        protocol: {
          name: 'Test Protocol',
          logo: 'https://example.com/logo.png',
        },
        type: 'airdrop',
        chains: ['ethereum'],
        reward: {
          min: 100,
          max: 500,
          currency: 'USD',
          confidence: 'estimated',
        },
        trust: {
          score: 150, // Invalid: > 100
          level: 'green',
          last_scanned_ts: '2025-01-01T00:00:00Z',
        },
        difficulty: 'easy',
        featured: false,
        sponsored: false,
        badges: [],
        status: 'published',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const result = OpportunitySchema.safeParse(invalidOpportunity);
      expect(result.success).toBe(false);
    });
  });

  describe('OpportunitiesResponseSchema', () => {
    it('should validate a valid response', () => {
      const validResponse = {
        items: [],
        cursor: null,
        ts: '2025-01-01T00:00:00Z',
      };

      const result = OpportunitiesResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate response with cursor', () => {
      const validResponse = {
        items: [],
        cursor: 'eyJyYW5rIjo5MCwidHJ1c3QiOjg1fQ==',
        ts: '2025-01-01T00:00:00Z',
      };

      const result = OpportunitiesResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('ErrorResponseSchema', () => {
    it('should validate error response with all fields', () => {
      const validError = {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          retry_after_sec: 60,
        },
      };

      const result = ErrorResponseSchema.safeParse(validError);
      expect(result.success).toBe(true);
    });

    it('should validate error response without retry_after_sec', () => {
      const validError = {
        error: {
          code: 'INTERNAL',
          message: 'Internal server error',
        },
      };

      const result = ErrorResponseSchema.safeParse(validError);
      expect(result.success).toBe(true);
    });

    it('should reject invalid error code', () => {
      const invalidError = {
        error: {
          code: 'INVALID_CODE',
          message: 'Some error',
        },
      };

      const result = ErrorResponseSchema.safeParse(invalidError);
      expect(result.success).toBe(false);
    });
  });

  describe('ErrorCode enum', () => {
    it('should have all required error codes', () => {
      expect(ErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
      expect(ErrorCode.BAD_FILTER).toBe('BAD_FILTER');
      expect(ErrorCode.INTERNAL).toBe('INTERNAL');
      expect(ErrorCode.UNAVAILABLE).toBe('UNAVAILABLE');
      expect(ErrorCode.NOT_ALLOWED_GEO).toBe('NOT_ALLOWED_GEO');
      expect(ErrorCode.NOT_ALLOWED_KYC).toBe('NOT_ALLOWED_KYC');
    });
  });

  describe('GuardianSummaryResponseSchema', () => {
    it('should validate guardian summary response', () => {
      const validResponse = {
        summaries: {
          '123e4567-e89b-12d3-a456-426614174000': {
            score: 85,
            level: 'green',
            last_scanned_ts: '2025-01-01T00:00:00Z',
            top_issues: ['Issue 1', 'Issue 2'],
          },
        },
      };

      const result = GuardianSummaryResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('EligibilityPreviewResponseSchema', () => {
    it('should validate eligibility preview response', () => {
      const validResponse = {
        status: 'likely',
        score: 0.85,
        reasons: ['Wallet has sufficient age', 'Active on required chain'],
        cached_until: '2025-01-01T01:00:00Z',
      };

      const result = EligibilityPreviewResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should require at least one reason', () => {
      const invalidResponse = {
        status: 'likely',
        score: 0.85,
        reasons: [], // Invalid: empty array
        cached_until: '2025-01-01T01:00:00Z',
      };

      const result = EligibilityPreviewResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('FilterStateSchema', () => {
    it('should validate filter state', () => {
      const validFilters = {
        search: '',
        types: ['airdrop', 'quest'],
        chains: ['ethereum', 'base'],
        trustMin: 80,
        rewardMin: 0,
        rewardMax: 10000,
        urgency: ['new', 'hot'],
        eligibleOnly: false,
        difficulty: ['easy', 'medium'],
        sort: 'recommended',
        showRisky: false,
      };

      const result = FilterStateSchema.safeParse(validFilters);
      expect(result.success).toBe(true);
    });

    it('should reject invalid trust min', () => {
      const invalidFilters = {
        search: '',
        types: [],
        chains: [],
        trustMin: 150, // Invalid: > 100
        rewardMin: 0,
        rewardMax: 10000,
        urgency: [],
        eligibleOnly: false,
        difficulty: [],
        sort: 'recommended',
        showRisky: false,
      };

      const result = FilterStateSchema.safeParse(invalidFilters);
      expect(result.success).toBe(false);
    });
  });

  describe('OpportunitiesQuerySchema', () => {
    it('should validate query with defaults', () => {
      const query = {};

      const result = OpportunitiesQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.trust_min).toBe(80);
        expect(result.data.sort).toBe('recommended');
      }
    });

    it('should validate query with all parameters', () => {
      const query = {
        q: 'test',
        type: ['airdrop'],
        chains: ['ethereum'],
        trust_min: '60',
        reward_min: '100',
        reward_max: '1000',
        urgency: ['new'],
        eligible: 'true',
        difficulty: ['easy'],
        sort: 'newest',
        cursor: 'abc123',
      };

      const result = OpportunitiesQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.trust_min).toBe(60);
        expect(result.data.eligible).toBe(true);
      }
    });

    it('should coerce string numbers to numbers', () => {
      const query = {
        trust_min: '75',
        reward_min: '500',
      };

      const result = OpportunitiesQuerySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.trust_min).toBe('number');
        expect(result.data.trust_min).toBe(75);
      }
    });
  });
});
