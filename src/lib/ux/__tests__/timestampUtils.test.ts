/**
 * UX Gap Requirements - Timestamp Utilities Tests
 * 
 * Tests that timestamps never display "0s ago" and use "Just now" for < 1 second
 * 
 * Requirements: R3.GAS.NONZERO (Requirement 3.11)
 * Design: Data Integrity → Timestamp System
 */

import { describe, test, expect } from 'vitest';
import { 
  formatRelativeTime, 
  formatUpdatedTime, 
  formatAbsoluteTime,
  formatTimestampWithTooltip,
  validateTimestampFormat 
} from '../timestampUtils';

describe('timestampUtils', () => {
  describe('formatRelativeTime', () => {
    test('should return "Just now" for timestamps less than 1 second ago', () => {
      const now = Date.now();
      const halfSecondAgo = now - 500; // 0.5 seconds ago
      
      expect(formatRelativeTime(halfSecondAgo)).toBe('Just now');
    });

    test('should return "Just now" for timestamps less than 60 seconds ago', () => {
      const now = Date.now();
      const thirtySecondsAgo = now - 30000; // 30 seconds ago
      
      expect(formatRelativeTime(thirtySecondsAgo)).toBe('Just now');
    });

    test('should never return "0s ago"', () => {
      const now = Date.now();
      
      // Test various recent timestamps
      for (let i = 0; i < 60; i++) {
        const timestamp = now - (i * 1000); // i seconds ago
        const result = formatRelativeTime(timestamp);
        
        expect(result).not.toBe('0s ago');
        expect(result).not.toMatch(/^0s ago$/);
      }
    });

    test('should format minutes correctly', () => {
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
    });

    test('should format hours correctly', () => {
      const now = Date.now();
      const twoHoursAgo = now - (2 * 60 * 60 * 1000);
      
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
    });

    test('should format days correctly', () => {
      const now = Date.now();
      const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);
      
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
    });

    test('should handle Date objects', () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - (5 * 60 * 1000));
      
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
    });

    test('should handle string timestamps', () => {
      const now = Date.now();
      const fiveMinutesAgo = new Date(now - (5 * 60 * 1000)).toISOString();
      
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
    });
  });

  describe('formatUpdatedTime', () => {
    test('should return "Updated just now" for recent timestamps', () => {
      const now = Date.now();
      const recentTimestamp = now - 500; // 0.5 seconds ago
      
      expect(formatUpdatedTime(recentTimestamp)).toBe('Updated just now');
    });

    test('should return "Updated X ago" for older timestamps', () => {
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      expect(formatUpdatedTime(fiveMinutesAgo)).toBe('Updated 5m ago');
    });

    test('should never contain "0s ago"', () => {
      const now = Date.now();
      
      for (let i = 0; i < 60; i++) {
        const timestamp = now - (i * 1000);
        const result = formatUpdatedTime(timestamp);
        
        expect(result).not.toContain('0s ago');
      }
    });
  });

  describe('formatAbsoluteTime', () => {
    test('should format absolute time correctly', () => {
      const timestamp = new Date('2023-12-25T10:30:00Z');
      const result = formatAbsoluteTime(timestamp);
      
      // Should contain date components (time will vary by timezone)
      expect(result).toContain('Dec');
      expect(result).toContain('25');
      expect(result).toContain('2023');
      // Time format varies by timezone, so just check it has time components
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('formatTimestampWithTooltip', () => {
    test('should return all three formats', () => {
      const now = Date.now();
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      
      const result = formatTimestampWithTooltip(fiveMinutesAgo);
      
      expect(result.relative).toBe('5m ago');
      expect(result.updated).toBe('Updated 5m ago');
      expect(result.absolute).toContain('2025'); // Should contain current year
    });

    test('should handle recent timestamps correctly', () => {
      const now = Date.now();
      const recentTimestamp = now - 500;
      
      const result = formatTimestampWithTooltip(recentTimestamp);
      
      expect(result.relative).toBe('Just now');
      expect(result.updated).toBe('Updated just now');
    });
  });

  describe('validateTimestampFormat', () => {
    test('should reject "0s ago" format', () => {
      expect(validateTimestampFormat('0s ago')).toBe(false);
      expect(validateTimestampFormat('0S AGO')).toBe(false);
    });

    test('should accept "Just now" format', () => {
      expect(validateTimestampFormat('Just now')).toBe(true);
      expect(validateTimestampFormat('just now')).toBe(true);
    });

    test('should accept valid relative formats', () => {
      expect(validateTimestampFormat('5m ago')).toBe(true);
      expect(validateTimestampFormat('2h ago')).toBe(true);
      expect(validateTimestampFormat('3d ago')).toBe(true);
      expect(validateTimestampFormat('1mo ago')).toBe(true);
      expect(validateTimestampFormat('2y ago')).toBe(true);
    });

    test('should accept valid updated formats', () => {
      expect(validateTimestampFormat('Updated just now')).toBe(true);
      expect(validateTimestampFormat('Updated 5m ago')).toBe(true);
      expect(validateTimestampFormat('Updated 2h ago')).toBe(true);
    });

    test('should reject invalid formats', () => {
      expect(validateTimestampFormat('invalid format')).toBe(false);
      expect(validateTimestampFormat('5 minutes ago')).toBe(false);
      expect(validateTimestampFormat('2 hours ago')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle future timestamps gracefully', () => {
      const now = Date.now();
      const futureTimestamp = now + (5 * 60 * 1000); // 5 minutes in future
      
      // Future timestamps should be handled gracefully (shows as time ago from future perspective)
      const result = formatRelativeTime(futureTimestamp);
      expect(result).toMatch(/^\d+m ago$|^Just now$/);
    });

    test('should handle very old timestamps', () => {
      const veryOld = new Date('2020-01-01').getTime();
      const result = formatRelativeTime(veryOld);
      
      // Should return years format
      expect(result).toMatch(/^\d+y ago$/);
    });

    test('should handle invalid timestamps gracefully', () => {
      expect(() => formatRelativeTime('invalid')).not.toThrow();
    });
  });
});