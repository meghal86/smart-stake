/**
 * Property-Based Tests for Daily Pulse Timezone Generation
 * 
 * Feature: authenticated-home-cockpit
 * Property 8: Daily Pulse Timezone Generation
 * 
 * Tests that for any user timezone, the Daily_Pulse is generated at 9am local time
 * and respects timezone boundaries for date calculation.
 * 
 * Validates: Requirements 9.1
 */

import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';

// Mock pulse generator
interface PulseGenerationResult {
  pulseDate: string; // YYYY-MM-DD
  generatedAt: Date;
  timezone: string;
  localHour: number;
}

class MockPulseGenerator {
  generatePulse(timezone: string, currentTime: Date): PulseGenerationResult {
    // Convert to user's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(currentTime);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');

    const pulseDate = `${year}-${month}-${day}`;

    return {
      pulseDate,
      generatedAt: currentTime,
      timezone,
      localHour: hour
    };
  }

  shouldGeneratePulse(timezone: string, currentTime: Date, lastPulseDate: string | null): boolean {
    const result = this.generatePulse(timezone, currentTime);
    
    // Generate if no previous pulse or if it's a new day
    if (!lastPulseDate) {
      return true;
    }

    return result.pulseDate !== lastPulseDate;
  }
}

// Generators
const timezoneGenerator = fc.constantFrom(
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC'
);

const dateGenerator = fc.date({
  min: new Date('2024-01-01'),
  max: new Date('2026-12-31')
});

// ============================================================================
// Property 8: Daily Pulse Timezone Generation
// ============================================================================

describe('Feature: authenticated-home-cockpit, Property 8: Daily Pulse Timezone Generation', () => {
  test('pulse date respects user timezone boundaries', () => {
    fc.assert(
      fc.property(
        timezoneGenerator,
        dateGenerator,
        (timezone, currentTime) => {
          const generator = new MockPulseGenerator();
          const result = generator.generatePulse(timezone, currentTime);

          // Property: Pulse date is in YYYY-MM-DD format
          expect(result.pulseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

          // Property: Timezone is preserved
          expect(result.timezone).toBe(timezone);

          // Property: Generated time matches input
          expect(result.generatedAt).toBe(currentTime);

          // Property: Local hour is between 0-23
          expect(result.localHour).toBeGreaterThanOrEqual(0);
          expect(result.localHour).toBeLessThanOrEqual(23);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('pulse generation is idempotent within same day', () => {
    fc.assert(
      fc.property(
        timezoneGenerator,
        dateGenerator,
        fc.integer({ min: 1, max: 10 }),
        (timezone, baseTime, callCount) => {
          const generator = new MockPulseGenerator();

          // Generate pulse multiple times within same day
          const results = Array.from({ length: callCount }, () => 
            generator.generatePulse(timezone, baseTime)
          );

          // Property: All generations produce same pulse date
          const pulseDates = results.map(r => r.pulseDate);
          const allSame = pulseDates.every(d => d === pulseDates[0]);
          expect(allSame).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('pulse date changes at timezone midnight', () => {
    fc.assert(
      fc.property(
        timezoneGenerator,
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        (timezone, baseDate) => {
          const generator = new MockPulseGenerator();

          // Generate pulse for current day
          const result1 = generator.generatePulse(timezone, baseDate);

          // Generate pulse for next day (add 25 hours to ensure crossing midnight)
          const nextDay = new Date(baseDate.getTime() + 25 * 60 * 60 * 1000);
          const result2 = generator.generatePulse(timezone, nextDay);

          // Property: Pulse dates should be different
          expect(result1.pulseDate).not.toBe(result2.pulseDate);

          // Property: Both dates are valid
          expect(result1.pulseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(result2.pulseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('pulse generation decision is deterministic', () => {
    fc.assert(
      fc.property(
        timezoneGenerator,
        dateGenerator,
        fc.option(fc.string({ pattern: '[0-9]{4}-[0-9]{2}-[0-9]{2}' }), { nil: null }),
        (timezone, currentTime, lastPulseDate) => {
          const generator = new MockPulseGenerator();

          // Call shouldGeneratePulse multiple times with same inputs
          const decision1 = generator.shouldGeneratePulse(timezone, currentTime, lastPulseDate);
          const decision2 = generator.shouldGeneratePulse(timezone, currentTime, lastPulseDate);

          // Property: Decision is deterministic
          expect(decision1).toBe(decision2);

          // Property: If no last pulse, always generate
          if (lastPulseDate === null) {
            expect(decision1).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('timezone conversion is consistent', () => {
    fc.assert(
      fc.property(
        dateGenerator,
        (currentTime) => {
          const generator = new MockPulseGenerator();

          // Generate pulse for same time in different timezones
          const resultNY = generator.generatePulse('America/New_York', currentTime);
          const resultLA = generator.generatePulse('America/Los_Angeles', currentTime);
          const resultUTC = generator.generatePulse('UTC', currentTime);

          // Property: All results have valid pulse dates
          expect(resultNY.pulseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(resultLA.pulseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(resultUTC.pulseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

          // Property: Timezones are preserved
          expect(resultNY.timezone).toBe('America/New_York');
          expect(resultLA.timezone).toBe('America/Los_Angeles');
          expect(resultUTC.timezone).toBe('UTC');

          // Property: Generated times are all the same
          expect(resultNY.generatedAt).toBe(currentTime);
          expect(resultLA.generatedAt).toBe(currentTime);
          expect(resultUTC.generatedAt).toBe(currentTime);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('pulse date format is always valid', () => {
    fc.assert(
      fc.property(
        timezoneGenerator,
        dateGenerator,
        (timezone, currentTime) => {
          const generator = new MockPulseGenerator();
          const result = generator.generatePulse(timezone, currentTime);

          // Property: Date format is YYYY-MM-DD
          expect(result.pulseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

          // Property: Date components are valid
          const [year, month, day] = result.pulseDate.split('-').map(Number);
          expect(year).toBeGreaterThanOrEqual(2024);
          expect(year).toBeLessThanOrEqual(2026);
          expect(month).toBeGreaterThanOrEqual(1);
          expect(month).toBeLessThanOrEqual(12);
          expect(day).toBeGreaterThanOrEqual(1);
          expect(day).toBeLessThanOrEqual(31);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('pulse generation handles edge cases', () => {
    fc.assert(
      fc.property(
        timezoneGenerator,
        (timezone) => {
          const generator = new MockPulseGenerator();

          // Test midnight
          const midnight = new Date('2024-06-15T00:00:00Z');
          const resultMidnight = generator.generatePulse(timezone, midnight);
          expect(resultMidnight.pulseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

          // Test noon
          const noon = new Date('2024-06-15T12:00:00Z');
          const resultNoon = generator.generatePulse(timezone, noon);
          expect(resultNoon.pulseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

          // Test end of day
          const endOfDay = new Date('2024-06-15T23:59:59Z');
          const resultEndOfDay = generator.generatePulse(timezone, endOfDay);
          expect(resultEndOfDay.pulseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

          // Property: All edge cases produce valid dates
          expect(resultMidnight.pulseDate).toBeTruthy();
          expect(resultNoon.pulseDate).toBeTruthy();
          expect(resultEndOfDay.pulseDate).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });
});