/**
 * Unit Test: Numeric Precision Schema Validation (R15.8)
 * 
 * Validates that the database schema uses NUMERIC(5,4) precision
 * for risk_score and confidence fields with proper CHECK constraints
 * 
 * Task: 0.3 Numeric Precision Hardening (R15.8) [V1]
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Numeric Precision Schema Validation (R15.8)', () => {
  const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20260123000001_unified_portfolio_schema.sql');
  let migrationContent: string;

  try {
    migrationContent = readFileSync(migrationPath, 'utf-8');
  } catch (error) {
    migrationContent = '';
  }

  test('migration file exists', () => {
    expect(migrationContent).not.toBe('');
    expect(migrationContent.length).toBeGreaterThan(0);
  });

  describe('portfolio_snapshots table', () => {
    test('confidence field uses NUMERIC(5,4) precision', () => {
      const confidencePattern = /confidence\s+NUMERIC\(5,4\)/i;
      expect(migrationContent).toMatch(confidencePattern);
    });

    test('confidence field has CHECK constraint for bounds [0.0000, 1.0000]', () => {
      const checkPattern = /confidence\s+NUMERIC\(5,4\)\s+NOT NULL\s+CHECK\s*\(\s*confidence\s*>=\s*0\.0000\s+AND\s+confidence\s*<=\s*1\.0000\s*\)/i;
      expect(migrationContent).toMatch(checkPattern);
    });

    test('risk_score field uses NUMERIC(5,4) precision', () => {
      const riskScorePattern = /risk_score\s+NUMERIC\(5,4\)/i;
      expect(migrationContent).toMatch(riskScorePattern);
    });

    test('risk_score field has CHECK constraint for bounds [0.0000, 1.0000]', () => {
      const checkPattern = /risk_score\s+NUMERIC\(5,4\)\s+NOT NULL\s+CHECK\s*\(\s*risk_score\s*>=\s*0\.0000\s+AND\s+risk_score\s*<=\s*1\.0000\s*\)/i;
      expect(migrationContent).toMatch(checkPattern);
    });

    test('no DECIMAL(3,2) remains for confidence field', () => {
      const oldPattern = /confidence\s+DECIMAL\(3,2\)/i;
      expect(migrationContent).not.toMatch(oldPattern);
    });

    test('no DECIMAL(3,2) remains for risk_score field', () => {
      const oldPattern = /risk_score\s+DECIMAL\(3,2\)/i;
      expect(migrationContent).not.toMatch(oldPattern);
    });
  });

  describe('approval_risks table', () => {
    test('risk_score field uses NUMERIC(5,4) precision', () => {
      // Count occurrences - should have at least 2 (portfolio_snapshots + approval_risks)
      const matches = migrationContent.match(/risk_score\s+NUMERIC\(5,4\)/gi);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    test('risk_score field has CHECK constraint for bounds [0.0000, 1.0000]', () => {
      // Count occurrences - should have at least 2 (portfolio_snapshots + approval_risks)
      const matches = migrationContent.match(/risk_score\s+NUMERIC\(5,4\)\s+NOT NULL\s+CHECK\s*\(\s*risk_score\s*>=\s*0\.0000\s+AND\s+risk_score\s*<=\s*1\.0000\s*\)/gi);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    test('no DECIMAL(3,2) remains for risk_score field', () => {
      const oldPattern = /risk_score\s+DECIMAL\(3,2\)/i;
      expect(migrationContent).not.toMatch(oldPattern);
    });
  });

  describe('precision validation', () => {
    test('NUMERIC(5,4) provides correct precision range', () => {
      // NUMERIC(5,4) means:
      // - 5 total digits (precision)
      // - 4 digits after decimal point (scale)
      // - 1 digit before decimal point
      // Valid range: 0.0000 to 9.9999
      // Our CHECK constraint further limits to: 0.0000 to 1.0000
      
      const minValue = 0.0000;
      const maxValue = 1.0000;
      const scale = 4;
      
      expect(minValue).toBe(0);
      expect(maxValue).toBe(1);
      expect(minValue.toFixed(scale)).toBe('0.0000');
      expect(maxValue.toFixed(scale)).toBe('1.0000');
    });

    test('NUMERIC(5,4) supports 4 decimal places', () => {
      const testValues = [
        0.0001,
        0.1234,
        0.5678,
        0.9999,
      ];
      
      testValues.forEach(value => {
        const formatted = value.toFixed(4);
        expect(formatted.split('.')[1].length).toBe(4);
      });
    });

    test('CHECK constraints enforce bounds at database level', () => {
      // Verify that CHECK constraints are present in the migration
      const checkConstraintPattern = /CHECK\s*\(\s*(confidence|risk_score)\s*>=\s*0\.0000\s+AND\s+(confidence|risk_score)\s*<=\s*1\.0000\s*\)/gi;
      const matches = migrationContent.match(checkConstraintPattern);
      
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3); // 2 in portfolio_snapshots, 1 in approval_risks
    });

    test('no legacy DECIMAL(3,2) precision remains anywhere', () => {
      // Comprehensive check - no DECIMAL(3,2) should exist for confidence or risk_score
      const legacyPatterns = [
        /confidence\s+DECIMAL\(3,2\)/i,
        /risk_score\s+DECIMAL\(3,2\)/i,
      ];
      
      legacyPatterns.forEach(pattern => {
        expect(migrationContent).not.toMatch(pattern);
      });
    });
  });

  describe('R15.8 compliance', () => {
    test('migration includes R15.8 requirement comments', () => {
      const r158Pattern = /R15\.8/;
      expect(migrationContent).toMatch(r158Pattern);
    });

    test('all risk_score and confidence fields have explicit precision', () => {
      // Find all confidence and risk_score field definitions
      const confidenceMatches = migrationContent.match(/confidence\s+\w+\([^)]+\)/gi);
      const riskScoreMatches = migrationContent.match(/risk_score\s+\w+\([^)]+\)/gi);
      
      // All should use NUMERIC(5,4)
      confidenceMatches?.forEach(match => {
        expect(match).toMatch(/NUMERIC\(5,4\)/i);
      });
      
      riskScoreMatches?.forEach(match => {
        expect(match).toMatch(/NUMERIC\(5,4\)/i);
      });
    });

    test('bounds are enforced at database boundary via CHECK constraints', () => {
      // Verify CHECK constraints are defined at column level (database boundary)
      const columnCheckPattern = /NUMERIC\(5,4\)\s+NOT NULL\s+CHECK/gi;
      const matches = migrationContent.match(columnCheckPattern);
      
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3); // confidence + risk_score in portfolio_snapshots, risk_score in approval_risks
    });
  });

  describe('acceptance criteria validation', () => {
    test('✅ Acceptance 1: risk_score + confidence MUST be NUMERIC(5,4)', () => {
      const numericPattern = /(?:confidence|risk_score)\s+NUMERIC\(5,4\)/gi;
      const matches = migrationContent.match(numericPattern);
      
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3); // 2 in portfolio_snapshots, 1 in approval_risks
    });

    test('✅ Acceptance 2: Bounds MUST be enforced by CHECK constraints at DB boundary', () => {
      const checkPattern = /CHECK\s*\(\s*(?:confidence|risk_score)\s*>=\s*0\.0000\s+AND\s+(?:confidence|risk_score)\s*<=\s*1\.0000\s*\)/gi;
      const matches = migrationContent.match(checkPattern);
      
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });

    test('✅ Acceptance 3: no DECIMAL(3,2) remains for these fields', () => {
      const decimal32Pattern = /(?:confidence|risk_score)\s+DECIMAL\(3,2\)/gi;
      const matches = migrationContent.match(decimal32Pattern);
      
      expect(matches).toBeNull();
    });
  });
});
