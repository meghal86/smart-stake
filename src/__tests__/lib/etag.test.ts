/**
 * Tests for ETag utilities
 */

import { describe, it, expect } from 'vitest';
import { hashETag, compareETags, hashWeakETag } from '@/lib/etag';

describe('ETag Utilities', () => {
  describe('hashETag', () => {
    it('should generate a quoted hash string', () => {
      const data = { test: 'data' };
      const etag = hashETag(data);

      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);
    });

    it('should generate consistent hashes for same data', () => {
      const data = { test: 'data', number: 123 };
      const etag1 = hashETag(data);
      const etag2 = hashETag(data);

      expect(etag1).toBe(etag2);
    });

    it('should generate different hashes for different data', () => {
      const data1 = { test: 'data1' };
      const data2 = { test: 'data2' };
      const etag1 = hashETag(data1);
      const etag2 = hashETag(data2);

      expect(etag1).not.toBe(etag2);
    });

    it('should handle complex nested objects', () => {
      const data = {
        items: [
          { id: 1, name: 'Item 1', nested: { value: 'test' } },
          { id: 2, name: 'Item 2', nested: { value: 'test2' } },
        ],
        cursor: 'next-page',
        ts: '2025-01-01T00:00:00Z',
      };

      const etag = hashETag(data);
      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3, 4, 5];
      const etag = hashETag(data);

      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);
    });

    it('should handle null and undefined', () => {
      const etag1 = hashETag(null);
      const etag2 = hashETag(undefined);

      expect(etag1).toMatch(/^"[a-f0-9]{32}"$/);
      expect(etag2).toMatch(/^"[a-f0-9]{32}"$/);
      expect(etag1).not.toBe(etag2);
    });

    it('should be sensitive to property order', () => {
      // Note: JSON.stringify maintains insertion order
      const data1 = { a: 1, b: 2 };
      const data2 = { b: 2, a: 1 };
      const etag1 = hashETag(data1);
      const etag2 = hashETag(data2);

      // These will be different because JSON.stringify preserves order
      expect(etag1).not.toBe(etag2);
    });
  });

  describe('compareETags', () => {
    it('should return true for matching ETags', () => {
      const etag1 = '"abc123"';
      const etag2 = '"abc123"';

      expect(compareETags(etag1, etag2)).toBe(true);
    });

    it('should return false for different ETags', () => {
      const etag1 = '"abc123"';
      const etag2 = '"def456"';

      expect(compareETags(etag1, etag2)).toBe(false);
    });

    it('should handle ETags with and without quotes', () => {
      const etag1 = '"abc123"';
      const etag2 = 'abc123';

      expect(compareETags(etag1, etag2)).toBe(true);
    });

    it('should return false for null ETags', () => {
      expect(compareETags(null, '"abc123"')).toBe(false);
      expect(compareETags('"abc123"', null)).toBe(false);
      expect(compareETags(null, null)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(compareETags('', '')).toBe(true);
      expect(compareETags('', '"abc123"')).toBe(false);
    });

    it('should be case-sensitive', () => {
      const etag1 = '"ABC123"';
      const etag2 = '"abc123"';

      expect(compareETags(etag1, etag2)).toBe(false);
    });
  });

  describe('hashWeakETag', () => {
    it('should generate a weak ETag with W/ prefix', () => {
      const data = { test: 'data' };
      const weakETag = hashWeakETag(data);

      expect(weakETag).toMatch(/^W\/"[a-f0-9]{32}"$/);
    });

    it('should generate consistent weak ETags for same data', () => {
      const data = { test: 'data' };
      const weakETag1 = hashWeakETag(data);
      const weakETag2 = hashWeakETag(data);

      expect(weakETag1).toBe(weakETag2);
    });

    it('should generate different weak ETags for different data', () => {
      const data1 = { test: 'data1' };
      const data2 = { test: 'data2' };
      const weakETag1 = hashWeakETag(data1);
      const weakETag2 = hashWeakETag(data2);

      expect(weakETag1).not.toBe(weakETag2);
    });

    it('should differ from strong ETag only by W/ prefix', () => {
      const data = { test: 'data' };
      const strongETag = hashETag(data);
      const weakETag = hashWeakETag(data);

      expect(weakETag).toBe(`W/${strongETag}`);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical API response', () => {
      const response = {
        items: [
          {
            id: '123',
            title: 'Test Opportunity',
            trust: { score: 85, level: 'green' },
          },
        ],
        cursor: 'next-page-token',
        ts: '2025-01-01T00:00:00Z',
      };

      const etag = hashETag(response);
      expect(etag).toMatch(/^"[a-f0-9]{32}"$/);

      // Same response should generate same ETag
      const etag2 = hashETag(response);
      expect(etag).toBe(etag2);
    });

    it('should detect changes in response data', () => {
      const response1 = {
        items: [{ id: '123', title: 'Test' }],
        cursor: null,
        ts: '2025-01-01T00:00:00Z',
      };

      const response2 = {
        items: [{ id: '123', title: 'Test Updated' }],
        cursor: null,
        ts: '2025-01-01T00:00:00Z',
      };

      const etag1 = hashETag(response1);
      const etag2 = hashETag(response2);

      expect(etag1).not.toBe(etag2);
    });

    it('should handle If-None-Match header comparison', () => {
      const response = { data: 'test' };
      const etag = hashETag(response);

      // Simulate client sending If-None-Match header
      const ifNoneMatch = etag;

      expect(compareETags(ifNoneMatch, etag)).toBe(true);
    });
  });
});
