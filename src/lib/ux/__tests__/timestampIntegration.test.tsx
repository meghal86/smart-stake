/**
 * Integration test to verify timestamp formatting across components
 * 
 * Requirements: R3.GAS.NONZERO (Requirement 3.11)
 * Design: Data Integrity → Timestamp System
 */

import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { formatRelativeTime, formatUpdatedTime } from '../timestampUtils';

// Mock components to test timestamp integration
const MockComponent = ({ timestamp }: { timestamp: Date }) => {
  return (
    <div>
      <span data-testid="relative-time">{formatRelativeTime(timestamp)}</span>
      <span data-testid="updated-time">{formatUpdatedTime(timestamp)}</span>
    </div>
  );
};

describe('Timestamp Integration', () => {
  test('should never display "0s ago" in any component', () => {
    const now = Date.now();
    
    // Test various recent timestamps that could potentially show "0s ago"
    const testTimestamps = [
      now,                    // Right now
      now - 100,             // 0.1 seconds ago
      now - 500,             // 0.5 seconds ago
      now - 999,             // 0.999 seconds ago
      now - 1000,            // 1 second ago
      now - 30000,           // 30 seconds ago
      now - 59000,           // 59 seconds ago
    ];

    testTimestamps.forEach((timestamp, index) => {
      const { unmount } = render(<MockComponent timestamp={new Date(timestamp)} />);
      
      const relativeTime = screen.getByTestId('relative-time').textContent;
      const updatedTime = screen.getByTestId('updated-time').textContent;
      
      // Should never contain "0s ago"
      expect(relativeTime).not.toBe('0s ago');
      expect(relativeTime).not.toMatch(/^0s ago$/);
      expect(updatedTime).not.toContain('0s ago');
      
      // For very recent timestamps, should show "Just now"
      if (timestamp >= now - 60000) { // Less than 60 seconds ago
        expect(relativeTime).toBe('Just now');
        expect(updatedTime).toMatch(/^Updated just now$/i);
      }
      
      unmount();
    });
  });

  test('should handle edge cases gracefully', () => {
    const edgeCases = [
      new Date(Date.now() - 1),      // 1ms ago
      new Date(Date.now() - 999),    // 999ms ago
      new Date(Date.now() + 1000),   // 1s in future (edge case)
    ];

    edgeCases.forEach((timestamp) => {
      const { unmount } = render(<MockComponent timestamp={timestamp} />);
      
      const relativeTime = screen.getByTestId('relative-time').textContent;
      const updatedTime = screen.getByTestId('updated-time').textContent;
      
      // Should never show "0s ago"
      expect(relativeTime).not.toBe('0s ago');
      expect(updatedTime).not.toContain('0s ago');
      
      unmount();
    });
  });

  test('should format longer durations correctly', () => {
    const now = Date.now();
    const testCases = [
      { timestamp: now - (5 * 60 * 1000), expected: '5m ago' },
      { timestamp: now - (2 * 60 * 60 * 1000), expected: '2h ago' },
      { timestamp: now - (3 * 24 * 60 * 60 * 1000), expected: '3d ago' },
    ];

    testCases.forEach(({ timestamp, expected }) => {
      const { unmount } = render(<MockComponent timestamp={new Date(timestamp)} />);
      
      const relativeTime = screen.getByTestId('relative-time').textContent;
      expect(relativeTime).toBe(expected);
      
      const updatedTime = screen.getByTestId('updated-time').textContent;
      expect(updatedTime).toBe(`Updated ${expected}`);
      
      unmount();
    });
  });
});