/**
 * Contrast Ratio Tests
 * 
 * Tests for WCAG AA contrast compliance on AlphaWhale Home page.
 * 
 * Requirements: 1.4, 8.3
 */

import { describe, test, expect } from 'vitest';
import {
  calculateContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  getContrastLevel,
  verifyHomePageContrast,
  HOME_COLORS,
} from '../contrast';

describe('calculateContrastRatio', () => {
  test('calculates correct ratio for black and white', () => {
    const ratio = calculateContrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBeCloseTo(21, 1);
  });
  
  test('calculates correct ratio for same colors', () => {
    const ratio = calculateContrastRatio('#FFFFFF', '#FFFFFF');
    expect(ratio).toBeCloseTo(1, 1);
  });
  
  test('handles 3-digit hex colors', () => {
    const ratio = calculateContrastRatio('#000', '#FFF');
    expect(ratio).toBeCloseTo(21, 1);
  });
  
  test('handles colors without # prefix', () => {
    const ratio = calculateContrastRatio('000000', 'FFFFFF');
    expect(ratio).toBeCloseTo(21, 1);
  });
  
  test('throws error for invalid hex', () => {
    expect(() => calculateContrastRatio('invalid', '#FFFFFF')).toThrow();
  });
});

describe('meetsWCAGAA', () => {
  test('normal text requires 4.5:1 ratio', () => {
    expect(meetsWCAGAA(4.5, false)).toBe(true);
    expect(meetsWCAGAA(4.4, false)).toBe(false);
  });
  
  test('large text requires 3:1 ratio', () => {
    expect(meetsWCAGAA(3.0, true)).toBe(true);
    expect(meetsWCAGAA(2.9, true)).toBe(false);
  });
});

describe('meetsWCAGAAA', () => {
  test('normal text requires 7:1 ratio', () => {
    expect(meetsWCAGAAA(7.0, false)).toBe(true);
    expect(meetsWCAGAAA(6.9, false)).toBe(false);
  });
  
  test('large text requires 4.5:1 ratio', () => {
    expect(meetsWCAGAAA(4.5, true)).toBe(true);
    expect(meetsWCAGAAA(4.4, true)).toBe(false);
  });
});

describe('getContrastLevel', () => {
  test('returns AAA for high contrast', () => {
    expect(getContrastLevel(21, false)).toBe('AAA');
  });
  
  test('returns AA for medium contrast', () => {
    expect(getContrastLevel(5, false)).toBe('AA');
  });
  
  test('returns Fail for low contrast', () => {
    expect(getContrastLevel(2, false)).toBe('Fail');
  });
});

describe('verifyHomePageContrast', () => {
  test('all home page color combinations meet WCAG AA', () => {
    const { passed, results } = verifyHomePageContrast();
    
    console.log('\n=== AlphaWhale Home Page Contrast Report ===\n');
    results.forEach(result => {
      const status = result.passes ? '✅' : '❌';
      console.log(`${status} ${result.combination}`);
      console.log(`   Ratio: ${result.ratio}:1 (${result.level})`);
    });
    console.log('\n');
    
    // All combinations should pass
    expect(passed).toBe(true);
    
    // Verify each result individually
    results.forEach(result => {
      expect(result.passes).toBe(true);
    });
  });
  
  test('white text on slate-950 meets WCAG AA', () => {
    const ratio = calculateContrastRatio(HOME_COLORS.textPrimary, HOME_COLORS.bgPrimary);
    expect(meetsWCAGAA(ratio, false)).toBe(true);
  });
  
  test('gray-400 text on slate-950 meets WCAG AA', () => {
    const ratio = calculateContrastRatio(HOME_COLORS.textSecondary, HOME_COLORS.bgPrimary);
    expect(meetsWCAGAA(ratio, false)).toBe(true);
  });
  
  test('cyan-400 text/icons on slate-950 meets WCAG AA', () => {
    const ratio = calculateContrastRatio(HOME_COLORS.accentCyan, HOME_COLORS.bgPrimary);
    expect(meetsWCAGAA(ratio, false)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

describe('Specific Home Page Elements', () => {
  test('Hero headline (white on slate-950) meets WCAG AA for large text', () => {
    const ratio = calculateContrastRatio('#FFFFFF', '#0A0F1F');
    expect(meetsWCAGAA(ratio, true)).toBe(true);
  });
  
  test('Hero subheading (gray-300 on slate-950) meets WCAG AA', () => {
    const ratio = calculateContrastRatio('#D1D5DB', '#0A0F1F');
    expect(meetsWCAGAA(ratio, false)).toBe(true);
  });
  
  test('Feature card title (white on card background) meets WCAG AA', () => {
    // Card background is white/5 on slate-950, which is very close to slate-950
    const ratio = calculateContrastRatio('#FFFFFF', '#0A0F1F');
    expect(meetsWCAGAA(ratio, false)).toBe(true);
  });
  
  test('Feature card tagline (gray-400 on card background) meets WCAG AA', () => {
    const ratio = calculateContrastRatio('#9CA3AF', '#0A0F1F');
    expect(meetsWCAGAA(ratio, false)).toBe(true);
  });
  
  test('CTA button (white on cyan-700) meets WCAG AA', () => {
    const ratio = calculateContrastRatio('#FFFFFF', '#0E7490');
    expect(meetsWCAGAA(ratio, false)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
  
  test('Demo badge (purple-300 on purple-500/20) has sufficient contrast', () => {
    // Purple-500/20 on slate-950 is very close to slate-950
    const ratio = calculateContrastRatio('#D8B4FE', '#0A0F1F');
    expect(meetsWCAGAA(ratio, false)).toBe(true);
  });
});
