/**
 * Unit tests for cursor pagination utilities
 * 
 * Tests Requirements: 3.7, 7.9, 7.10
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  encodeCursor,
  decodeCursor,
  isValidCursor,
  createCursorFromOpportunity,
  getSnapshotFromCursor,
  createSnapshot,
  hashSlug,
  type CursorTuple,
} from '../../lib/cursor';

describe('Cursor Pagination Utilities', () => {
  const mockSnapshotTs = 1704067200; // 2024-01-01 00:00:00 UTC
  const mockSlugHash = 123456789;

  describe('hashSlug', () => {
    it('should generate consistent hash for same slug', () => {
      const slug = 'test-opportunity';
      const hash1 = hashSlug(slug);
      const hash2 = hashSlug(slug);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('number');
    });

    it('should generate different hashes for different slugs', () => {
      const hash1 = hashSlug('opportunity-1');
      const hash2 = hashSlug('opportunity-2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should generate positive integers', () => {
      const hash = hashSlug('test-slug');
      
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(hash)).toBe(true);
    });
  });

  describe('encodeCursor', () => {
    it('should encode a valid cursor tuple to base64url', () => {
      const tuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(tuple);
      
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
      // Should be base64url (no +, /, or = characters)
      expect(encoded).not.toMatch(/[+/=]/);
    });

    it('should encode cursor with integer scores', () => {
      const tuple: CursorTuple = [100, 80, '2025-01-01T00:00:00Z', 'id-001', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(tuple);
      
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });

    it('should encode cursor with decimal scores', () => {
      const tuple: CursorTuple = [95.75, 82.3, '2025-06-15T12:30:00Z', 'id-002', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(tuple);
      
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });

    it('should encode cursor with zero scores', () => {
      const tuple: CursorTuple = [0, 0, '2025-01-01T00:00:00Z', 'id-003', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(tuple);
      
      expect(encoded).toBeTruthy();
      expect(typeof encoded).toBe('string');
    });

    it('should throw error for invalid tuple length', () => {
      const invalidTuple = [95.5, 85, '2025-12-31T23:59:59Z'] as any;
      
      expect(() => encodeCursor(invalidTuple)).toThrow('Cursor tuple must be an array of 6 elements');
    });

    it('should throw error for non-array input', () => {
      const invalidInput = 'not-an-array' as any;
      
      expect(() => encodeCursor(invalidInput)).toThrow('Cursor tuple must be an array of 6 elements');
    });

    it('should throw error for invalid rank score', () => {
      const invalidTuple: unknown = ['not-a-number', 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      
      expect(() => encodeCursor(invalidTuple)).toThrow('Rank score must be a valid number');
    });

    it('should throw error for NaN rank score', () => {
      const invalidTuple: unknown = [NaN, 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      
      expect(() => encodeCursor(invalidTuple)).toThrow('Rank score must be a valid number');
    });

    it('should throw error for invalid trust score', () => {
      const invalidTuple: unknown = [95.5, 'not-a-number', '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      
      expect(() => encodeCursor(invalidTuple)).toThrow('Trust score must be a valid number');
    });

    it('should throw error for empty expires_at', () => {
      const invalidTuple: unknown = [95.5, 85, '', 'abc-123', mockSnapshotTs, mockSlugHash];
      
      expect(() => encodeCursor(invalidTuple)).toThrow('Expires at must be a non-empty string');
    });

    it('should throw error for empty id', () => {
      const invalidTuple: unknown = [95.5, 85, '2025-12-31T23:59:59Z', '', mockSnapshotTs, mockSlugHash];
      
      expect(() => encodeCursor(invalidTuple)).toThrow('ID must be a non-empty string');
    });

    it('should throw error for invalid snapshot timestamp', () => {
      const invalidTuple: unknown = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', 'not-a-number', mockSlugHash];
      
      expect(() => encodeCursor(invalidTuple)).toThrow('Snapshot timestamp must be a valid positive number');
    });

    it('should throw error for negative snapshot timestamp', () => {
      const invalidTuple: unknown = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', -100, mockSlugHash];
      
      expect(() => encodeCursor(invalidTuple)).toThrow('Snapshot timestamp must be a valid positive number');
    });

    it('should throw error for invalid slug hash', () => {
      const invalidTuple: unknown = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, 'not-a-number'];
      
      expect(() => encodeCursor(invalidTuple)).toThrow('Slug hash must be a valid number');
    });
  });

  describe('decodeCursor', () => {
    it('should decode a valid cursor back to tuple', () => {
      const originalTuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(originalTuple);
      const decoded = decodeCursor(encoded);
      
      expect(decoded).toEqual(originalTuple);
    });

    it('should decode cursor with integer scores', () => {
      const originalTuple: CursorTuple = [100, 80, '2025-01-01T00:00:00Z', 'id-001', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(originalTuple);
      const decoded = decodeCursor(encoded);
      
      expect(decoded).toEqual(originalTuple);
    });

    it('should decode cursor with decimal scores', () => {
      const originalTuple: CursorTuple = [95.75, 82.3, '2025-06-15T12:30:00Z', 'id-002', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(originalTuple);
      const decoded = decodeCursor(encoded);
      
      expect(decoded).toEqual(originalTuple);
    });

    it('should decode cursor with special characters in ID', () => {
      const originalTuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123-def_456', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(originalTuple);
      const decoded = decodeCursor(encoded);
      
      expect(decoded).toEqual(originalTuple);
    });

    it('should throw error for empty cursor', () => {
      expect(() => decodeCursor('')).toThrow('Cursor must be a non-empty string');
    });

    it('should throw error for invalid base64url', () => {
      expect(() => decodeCursor('not-valid-base64!!!')).toThrow('Failed to decode cursor');
    });

    it('should throw error for malformed JSON', () => {
      const invalidBase64 = Buffer.from('not-json', 'utf-8').toString('base64url');
      
      expect(() => decodeCursor(invalidBase64)).toThrow('Failed to decode cursor');
    });

    it('should throw error for wrong tuple length', () => {
      const invalidTuple = [95.5, 85, '2025-12-31T23:59:59Z']; // Only 3 elements
      const encoded = Buffer.from(JSON.stringify(invalidTuple), 'utf-8').toString('base64url');
      
      expect(() => decodeCursor(encoded)).toThrow('Invalid cursor structure');
    });

    it('should throw error for invalid rank score type', () => {
      const invalidTuple = ['not-a-number', 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      const encoded = Buffer.from(JSON.stringify(invalidTuple), 'utf-8').toString('base64url');
      
      expect(() => decodeCursor(encoded)).toThrow('Invalid rank score in cursor');
    });

    it('should throw error for invalid trust score type', () => {
      const invalidTuple = [95.5, 'not-a-number', '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      const encoded = Buffer.from(JSON.stringify(invalidTuple), 'utf-8').toString('base64url');
      
      expect(() => decodeCursor(encoded)).toThrow('Invalid trust score in cursor');
    });

    it('should throw error for invalid snapshot timestamp', () => {
      const invalidTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', 'not-a-number', mockSlugHash];
      const encoded = Buffer.from(JSON.stringify(invalidTuple), 'utf-8').toString('base64url');
      
      expect(() => decodeCursor(encoded)).toThrow('Invalid snapshot timestamp in cursor');
    });

    it('should throw error for negative snapshot timestamp', () => {
      const invalidTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', -100, mockSlugHash];
      const encoded = Buffer.from(JSON.stringify(invalidTuple), 'utf-8').toString('base64url');
      
      expect(() => decodeCursor(encoded)).toThrow('Invalid snapshot timestamp in cursor');
    });
  });

  describe('isValidCursor', () => {
    it('should return true for valid cursor', () => {
      const tuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(tuple);
      
      expect(isValidCursor(encoded)).toBe(true);
    });

    it('should return false for invalid cursor', () => {
      expect(isValidCursor('invalid-cursor')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidCursor('')).toBe(false);
    });

    it('should return false for malformed base64', () => {
      expect(isValidCursor('not-valid-base64!!!')).toBe(false);
    });
  });

  describe('createCursorFromOpportunity', () => {
    it('should create cursor from opportunity with all fields', () => {
      const opportunity = {
        rank_score: 95.5,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'abc-123',
        slug: 'test-opportunity',
      };
      
      const cursor = createCursorFromOpportunity(opportunity, mockSnapshotTs);
      
      expect(cursor[0]).toBe(95.5);
      expect(cursor[1]).toBe(85);
      expect(cursor[2]).toBe('2025-12-31T23:59:59Z');
      expect(cursor[3]).toBe('abc-123');
      expect(cursor[4]).toBe(mockSnapshotTs);
      expect(cursor[5]).toBe(hashSlug('test-opportunity'));
    });

    it('should use trust_score as rank_score when rank_score is missing', () => {
      const opportunity = {
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'abc-123',
        slug: 'test-opportunity',
      };
      
      const cursor = createCursorFromOpportunity(opportunity, mockSnapshotTs);
      
      expect(cursor[0]).toBe(85);
      expect(cursor[1]).toBe(85);
    });

    it('should use far future date when expires_at is null', () => {
      const opportunity = {
        rank_score: 95.5,
        trust_score: 85,
        expires_at: null,
        id: 'abc-123',
        slug: 'test-opportunity',
      };
      
      const cursor = createCursorFromOpportunity(opportunity, mockSnapshotTs);
      
      expect(cursor[2]).toBe('9999-12-31T23:59:59Z');
    });

    it('should handle opportunity with rank_score of 0', () => {
      const opportunity = {
        rank_score: 0,
        trust_score: 50,
        expires_at: '2025-01-01T00:00:00Z',
        id: 'id-001',
        slug: 'test-opportunity',
      };
      
      const cursor = createCursorFromOpportunity(opportunity, mockSnapshotTs);
      
      expect(cursor[0]).toBe(0);
      expect(cursor[1]).toBe(50);
    });

    it('should use current time when snapshot not provided', () => {
      const opportunity = {
        rank_score: 95.5,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'abc-123',
        slug: 'test-opportunity',
      };
      
      const beforeTs = Math.floor(Date.now() / 1000);
      const cursor = createCursorFromOpportunity(opportunity);
      const afterTs = Math.floor(Date.now() / 1000);
      
      expect(cursor[4]).toBeGreaterThanOrEqual(beforeTs);
      expect(cursor[4]).toBeLessThanOrEqual(afterTs);
    });

    it('should generate consistent slug hash for same slug', () => {
      const opportunity1 = {
        rank_score: 95.5,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'abc-123',
        slug: 'same-slug',
      };
      
      const opportunity2 = {
        rank_score: 90.0,
        trust_score: 80,
        expires_at: '2025-11-30T23:59:59Z',
        id: 'def-456',
        slug: 'same-slug',
      };
      
      const cursor1 = createCursorFromOpportunity(opportunity1, mockSnapshotTs);
      const cursor2 = createCursorFromOpportunity(opportunity2, mockSnapshotTs);
      
      expect(cursor1[5]).toBe(cursor2[5]);
    });

    it('should generate different slug hashes for different slugs', () => {
      const opportunity1 = {
        rank_score: 95.5,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'abc-123',
        slug: 'slug-1',
      };
      
      const opportunity2 = {
        rank_score: 95.5,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'abc-123',
        slug: 'slug-2',
      };
      
      const cursor1 = createCursorFromOpportunity(opportunity1, mockSnapshotTs);
      const cursor2 = createCursorFromOpportunity(opportunity2, mockSnapshotTs);
      
      expect(cursor1[5]).not.toBe(cursor2[5]);
    });
  });

  describe('getSnapshotFromCursor', () => {
    it('should extract snapshot timestamp from cursor', () => {
      const tuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(tuple);
      
      const snapshot = getSnapshotFromCursor(encoded);
      
      expect(snapshot).toBe(mockSnapshotTs);
    });

    it('should work with different snapshot values', () => {
      const customSnapshot = 1735689600; // 2025-01-01 00:00:00 UTC
      const tuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', customSnapshot, mockSlugHash];
      const encoded = encodeCursor(tuple);
      
      const snapshot = getSnapshotFromCursor(encoded);
      
      expect(snapshot).toBe(customSnapshot);
    });
  });

  describe('createSnapshot', () => {
    it('should create snapshot with provided timestamp', () => {
      const customTs = 1735689600;
      const snapshot = createSnapshot(customTs);
      
      expect(snapshot).toBe(customTs);
    });

    it('should create snapshot with current time when not provided', () => {
      const beforeTs = Math.floor(Date.now() / 1000);
      const snapshot = createSnapshot();
      const afterTs = Math.floor(Date.now() / 1000);
      
      expect(snapshot).toBeGreaterThanOrEqual(beforeTs);
      expect(snapshot).toBeLessThanOrEqual(afterTs);
    });
  });

  describe('Cursor Stability', () => {
    it('should produce same cursor for same input', () => {
      const tuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      
      const encoded1 = encodeCursor(tuple);
      const encoded2 = encodeCursor(tuple);
      
      expect(encoded1).toBe(encoded2);
    });

    it('should be reversible (encode -> decode -> encode)', () => {
      const originalTuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      
      const encoded1 = encodeCursor(originalTuple);
      const decoded = decodeCursor(encoded1);
      const encoded2 = encodeCursor(decoded);
      
      expect(encoded1).toBe(encoded2);
      expect(decoded).toEqual(originalTuple);
    });

    it('should handle multiple encode/decode cycles', () => {
      const originalTuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      
      let current = originalTuple;
      for (let i = 0; i < 10; i++) {
        const encoded = encodeCursor(current);
        current = decodeCursor(encoded);
      }
      
      expect(current).toEqual(originalTuple);
    });

    it('should produce different cursors for different tuples', () => {
      const tuple1: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      const tuple2: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-124', mockSnapshotTs, mockSlugHash];
      
      const encoded1 = encodeCursor(tuple1);
      const encoded2 = encodeCursor(tuple2);
      
      expect(encoded1).not.toBe(encoded2);
    });

    it('should maintain precision for decimal scores', () => {
      const tuple: CursorTuple = [95.123456789, 85.987654321, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      
      const encoded = encodeCursor(tuple);
      const decoded = decodeCursor(encoded);
      
      expect(decoded[0]).toBe(95.123456789);
      expect(decoded[1]).toBe(85.987654321);
    });

    it('should maintain same snapshot across pages', () => {
      const snapshot = 1704067200;
      
      const page1Cursor: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'page1-last', snapshot, mockSlugHash];
      const page2Cursor: CursorTuple = [90.0, 80, '2025-11-30T23:59:59Z', 'page2-last', snapshot, mockSlugHash];
      const page3Cursor: CursorTuple = [85.0, 75, '2025-10-31T23:59:59Z', 'page3-last', snapshot, mockSlugHash];
      
      expect(page1Cursor[4]).toBe(snapshot);
      expect(page2Cursor[4]).toBe(snapshot);
      expect(page3Cursor[4]).toBe(snapshot);
    });
  });

  describe('Pagination Simulation', () => {
    it('should handle cursor across multiple pages with same snapshot', () => {
      const snapshot = 1704067200;
      
      // Simulate 3 pages of results
      const page1LastItem = {
        rank_score: 95.5,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'page1-last',
        slug: 'opportunity-1',
      };
      
      const page2LastItem = {
        rank_score: 90.0,
        trust_score: 80,
        expires_at: '2025-11-30T23:59:59Z',
        id: 'page2-last',
        slug: 'opportunity-2',
      };
      
      const page3LastItem = {
        rank_score: 85.0,
        trust_score: 75,
        expires_at: '2025-10-31T23:59:59Z',
        id: 'page3-last',
        slug: 'opportunity-3',
      };
      
      // Create cursors for each page with same snapshot
      const cursor1 = createCursorFromOpportunity(page1LastItem, snapshot);
      const cursor2 = createCursorFromOpportunity(page2LastItem, snapshot);
      const cursor3 = createCursorFromOpportunity(page3LastItem, snapshot);
      
      // Encode cursors
      const encoded1 = encodeCursor(cursor1);
      const encoded2 = encodeCursor(cursor2);
      const encoded3 = encodeCursor(cursor3);
      
      // Verify all cursors are unique
      expect(encoded1).not.toBe(encoded2);
      expect(encoded2).not.toBe(encoded3);
      expect(encoded1).not.toBe(encoded3);
      
      // Verify all cursors can be decoded
      expect(decodeCursor(encoded1)).toEqual(cursor1);
      expect(decodeCursor(encoded2)).toEqual(cursor2);
      expect(decodeCursor(encoded3)).toEqual(cursor3);
      
      // Verify all have same snapshot
      expect(cursor1[4]).toBe(snapshot);
      expect(cursor2[4]).toBe(snapshot);
      expect(cursor3[4]).toBe(snapshot);
    });

    it('should handle items with same rank but different trust scores', () => {
      const item1 = {
        rank_score: 95.0,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'item-1',
        slug: 'opportunity-1',
      };
      
      const item2 = {
        rank_score: 95.0,
        trust_score: 80,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'item-2',
        slug: 'opportunity-2',
      };
      
      const cursor1 = encodeCursor(createCursorFromOpportunity(item1, mockSnapshotTs));
      const cursor2 = encodeCursor(createCursorFromOpportunity(item2, mockSnapshotTs));
      
      expect(cursor1).not.toBe(cursor2);
    });

    it('should handle items with same rank and trust but different expiry', () => {
      const item1 = {
        rank_score: 95.0,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'item-1',
        slug: 'opportunity-1',
      };
      
      const item2 = {
        rank_score: 95.0,
        trust_score: 85,
        expires_at: '2025-11-30T23:59:59Z',
        id: 'item-2',
        slug: 'opportunity-2',
      };
      
      const cursor1 = encodeCursor(createCursorFromOpportunity(item1, mockSnapshotTs));
      const cursor2 = encodeCursor(createCursorFromOpportunity(item2, mockSnapshotTs));
      
      expect(cursor1).not.toBe(cursor2);
    });

    it('should handle items with all same values but different IDs', () => {
      const item1 = {
        rank_score: 95.0,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'item-1',
        slug: 'opportunity-1',
      };
      
      const item2 = {
        rank_score: 95.0,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'item-2',
        slug: 'opportunity-2',
      };
      
      const cursor1 = encodeCursor(createCursorFromOpportunity(item1, mockSnapshotTs));
      const cursor2 = encodeCursor(createCursorFromOpportunity(item2, mockSnapshotTs));
      
      // IDs ensure uniqueness
      expect(cursor1).not.toBe(cursor2);
    });

    it('should use slug hash as final tiebreaker for identical sort values', () => {
      // Items with identical rank, trust, expiry, and ID (edge case)
      const item1 = {
        rank_score: 95.0,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'same-id',
        slug: 'slug-a',
      };
      
      const item2 = {
        rank_score: 95.0,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
        id: 'same-id',
        slug: 'slug-b',
      };
      
      const cursor1 = createCursorFromOpportunity(item1, mockSnapshotTs);
      const cursor2 = createCursorFromOpportunity(item2, mockSnapshotTs);
      
      // Slug hashes should differ
      expect(cursor1[5]).not.toBe(cursor2[5]);
      
      // Encoded cursors should differ
      expect(encodeCursor(cursor1)).not.toBe(encodeCursor(cursor2));
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large rank scores', () => {
      const tuple: CursorTuple = [999999.99, 100, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(tuple);
      const decoded = decodeCursor(encoded);
      
      expect(decoded).toEqual(tuple);
    });

    it('should handle negative scores', () => {
      const tuple: CursorTuple = [-10.5, -5, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(tuple);
      const decoded = decodeCursor(encoded);
      
      expect(decoded).toEqual(tuple);
    });

    it('should handle very long IDs', () => {
      const longId = 'a'.repeat(1000);
      const tuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', longId, mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(tuple);
      const decoded = decodeCursor(encoded);
      
      expect(decoded).toEqual(tuple);
    });

    it('should handle IDs with special characters', () => {
      const specialId = 'abc-123_def.456@test#hash';
      const tuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', specialId, mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(tuple);
      const decoded = decodeCursor(encoded);
      
      expect(decoded).toEqual(tuple);
    });

    it('should handle different date formats', () => {
      const dates = [
        '2025-12-31T23:59:59Z',
        '2025-12-31T23:59:59.000Z',
        '2025-01-01T00:00:00+00:00',
      ];
      
      dates.forEach(date => {
        const tuple: CursorTuple = [95.5, 85, date, 'abc-123', mockSnapshotTs, mockSlugHash];
        const encoded = encodeCursor(tuple);
        const decoded = decodeCursor(encoded);
        
        expect(decoded).toEqual(tuple);
      });
    });

    it('should keep cursor URL-safe and compact', () => {
      const tuple: CursorTuple = [95.5, 85, '2025-12-31T23:59:59Z', 'abc-123', mockSnapshotTs, mockSlugHash];
      const encoded = encodeCursor(tuple);
      
      // Should be base64url (no +, /, or = characters)
      expect(encoded).not.toMatch(/[+/=]/);
      
      // Should be reasonably compact (less than 200 chars for typical data)
      expect(encoded.length).toBeLessThan(200);
      
      // Should be URL-safe (can be used in query params)
      const urlEncoded = encodeURIComponent(encoded);
      expect(urlEncoded).toBe(encoded); // No encoding needed
    });
  });

  describe('Snapshot Watermark - Mutation Test', () => {
    it('should prevent duplicates across 3 pages when data changes mid-scroll', () => {
      // Initial snapshot timestamp
      const snapshot = 1704067200; // 2024-01-01 00:00:00 UTC
      
      // Page 1: Initial state
      const page1Items = [
        { id: 'opp-1', slug: 'opp-1', rank_score: 100, trust_score: 90, expires_at: '2025-12-31T23:59:59Z' },
        { id: 'opp-2', slug: 'opp-2', rank_score: 95, trust_score: 85, expires_at: '2025-12-31T23:59:59Z' },
        { id: 'opp-3', slug: 'opp-3', rank_score: 90, trust_score: 80, expires_at: '2025-12-31T23:59:59Z' },
      ];
      
      // Create cursor from last item of page 1
      const page1Cursor = createCursorFromOpportunity(page1Items[2], snapshot);
      const page1CursorEncoded = encodeCursor(page1Cursor);
      
      // Verify snapshot is preserved
      expect(getSnapshotFromCursor(page1CursorEncoded)).toBe(snapshot);
      
      // Page 2: Data changes (trust scores updated), but we use same snapshot
      const page2Items = [
        { id: 'opp-4', slug: 'opp-4', rank_score: 85, trust_score: 75, expires_at: '2025-11-30T23:59:59Z' },
        { id: 'opp-5', slug: 'opp-5', rank_score: 80, trust_score: 70, expires_at: '2025-11-30T23:59:59Z' },
        { id: 'opp-6', slug: 'opp-6', rank_score: 75, trust_score: 65, expires_at: '2025-11-30T23:59:59Z' },
      ];
      
      // Create cursor from last item of page 2 - MUST use same snapshot
      const page2Cursor = createCursorFromOpportunity(page2Items[2], snapshot);
      const page2CursorEncoded = encodeCursor(page2Cursor);
      
      // Verify snapshot is preserved
      expect(getSnapshotFromCursor(page2CursorEncoded)).toBe(snapshot);
      
      // Page 3: More data changes, still use same snapshot
      const page3Items = [
        { id: 'opp-7', slug: 'opp-7', rank_score: 70, trust_score: 60, expires_at: '2025-10-31T23:59:59Z' },
        { id: 'opp-8', slug: 'opp-8', rank_score: 65, trust_score: 55, expires_at: '2025-10-31T23:59:59Z' },
        { id: 'opp-9', slug: 'opp-9', rank_score: 60, trust_score: 50, expires_at: '2025-10-31T23:59:59Z' },
      ];
      
      // Create cursor from last item of page 3 - MUST use same snapshot
      const page3Cursor = createCursorFromOpportunity(page3Items[2], snapshot);
      const page3CursorEncoded = encodeCursor(page3Cursor);
      
      // Verify snapshot is preserved
      expect(getSnapshotFromCursor(page3CursorEncoded)).toBe(snapshot);
      
      // Collect all IDs across pages
      const allIds = [
        ...page1Items.map(i => i.id),
        ...page2Items.map(i => i.id),
        ...page3Items.map(i => i.id),
      ];
      
      // Verify no duplicates
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
      
      // Verify all cursors have same snapshot
      expect(page1Cursor[4]).toBe(snapshot);
      expect(page2Cursor[4]).toBe(snapshot);
      expect(page3Cursor[4]).toBe(snapshot);
    });

    it('should maintain consistent ordering with snapshot watermark', () => {
      const snapshot = 1704067200;
      
      // Create opportunities with same rank/trust but different slugs
      const opportunities = [
        { id: 'id-1', slug: 'alpha', rank_score: 90, trust_score: 80, expires_at: '2025-12-31T23:59:59Z' },
        { id: 'id-2', slug: 'beta', rank_score: 90, trust_score: 80, expires_at: '2025-12-31T23:59:59Z' },
        { id: 'id-3', slug: 'gamma', rank_score: 90, trust_score: 80, expires_at: '2025-12-31T23:59:59Z' },
      ];
      
      // Create cursors with same snapshot
      const cursors = opportunities.map(opp => createCursorFromOpportunity(opp, snapshot));
      
      // All should have same snapshot
      cursors.forEach(cursor => {
        expect(cursor[4]).toBe(snapshot);
      });
      
      // But different slug hashes for tiebreaking
      expect(cursors[0][5]).not.toBe(cursors[1][5]);
      expect(cursors[1][5]).not.toBe(cursors[2][5]);
      expect(cursors[0][5]).not.toBe(cursors[2][5]);
    });

    it('should handle new scroll session with different snapshot', () => {
      const snapshot1 = 1704067200; // First session
      const snapshot2 = 1704153600; // Second session (24 hours later)
      
      const opportunity = {
        id: 'opp-1',
        slug: 'test-opp',
        rank_score: 95,
        trust_score: 85,
        expires_at: '2025-12-31T23:59:59Z',
      };
      
      // Create cursor for first session
      const cursor1 = createCursorFromOpportunity(opportunity, snapshot1);
      const encoded1 = encodeCursor(cursor1);
      
      // Create cursor for second session
      const cursor2 = createCursorFromOpportunity(opportunity, snapshot2);
      const encoded2 = encodeCursor(cursor2);
      
      // Cursors should differ due to different snapshots
      expect(encoded1).not.toBe(encoded2);
      expect(cursor1[4]).toBe(snapshot1);
      expect(cursor2[4]).toBe(snapshot2);
      
      // But other values should be the same
      expect(cursor1[0]).toBe(cursor2[0]); // rank_score
      expect(cursor1[1]).toBe(cursor2[1]); // trust_score
      expect(cursor1[2]).toBe(cursor2[2]); // expires_at
      expect(cursor1[3]).toBe(cursor2[3]); // id
      expect(cursor1[5]).toBe(cursor2[5]); // slug_hash
    });
  });
});
