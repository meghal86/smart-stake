/**
 * Contrast Ratio Utilities
 * 
 * Utilities for calculating and verifying WCAG AA contrast ratios.
 * 
 * WCAG AA Requirements:
 * - Normal text (< 18px): 4.5:1 minimum
 * - Large text (≥ 18px or ≥ 14px bold): 3:1 minimum
 * 
 * Requirements: 1.4, 8.3
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG20-TECHS/G17.html
 * 
 * @param color1 - First color (hex format)
 * @param color2 - Second color (hex format)
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid hex color format');
  }
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 * 
 * @param ratio - Contrast ratio to check
 * @param isLargeText - Whether text is large (≥18px or ≥14px bold)
 * @returns Whether ratio meets WCAG AA
 */
export function meetsWCAGAA(ratio: number, isLargeText: boolean = false): boolean {
  const minRatio = isLargeText ? 3 : 4.5;
  return ratio >= minRatio;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 * 
 * @param ratio - Contrast ratio to check
 * @param isLargeText - Whether text is large (≥18px or ≥14px bold)
 * @returns Whether ratio meets WCAG AAA
 */
export function meetsWCAGAAA(ratio: number, isLargeText: boolean = false): boolean {
  const minRatio = isLargeText ? 4.5 : 7;
  return ratio >= minRatio;
}

/**
 * Get contrast level description
 */
export function getContrastLevel(ratio: number, isLargeText: boolean = false): string {
  if (meetsWCAGAAA(ratio, isLargeText)) {
    return 'AAA';
  }
  if (meetsWCAGAA(ratio, isLargeText)) {
    return 'AA';
  }
  return 'Fail';
}

/**
 * AlphaWhale Home Page Color Palette
 * 
 * These are the colors used in the home page components.
 * All combinations should meet WCAG AA standards.
 * 
 * WCAG AA Compliance Notes:
 * - Normal text requires 4.5:1 contrast ratio
 * - Large text (≥18px or ≥14px bold) requires 3:1 contrast ratio
 * - All colors have been verified against backgrounds
 */
export const HOME_COLORS = {
  // Backgrounds
  bgPrimary: '#0A0F1F',      // slate-950
  bgSecondary: '#0F172A',    // slate-900
  bgCard: 'rgba(255, 255, 255, 0.05)', // white/5
  
  // Text
  textPrimary: '#FFFFFF',    // white (19.07:1 on slate-950) ✅
  textSecondary: '#9CA3AF',  // gray-400 (7.51:1 on slate-950) ✅
  textMuted: '#9CA3AF',      // gray-400 (was gray-500, updated for WCAG AA)
  
  // Accents
  accentCyan: '#22D3EE',     // cyan-400 (10.55:1 on slate-950 for text/icons) ✅
  accentCyanButton: '#0E7490', // cyan-700 (5.36:1 with white text for buttons) ✅
  accentPurple: '#A855F7',   // purple-500
  
  // Borders
  borderLight: 'rgba(255, 255, 255, 0.1)', // white/10
};

/**
 * Verify all critical color combinations meet WCAG AA
 */
export function verifyHomePageContrast(): {
  passed: boolean;
  results: Array<{
    combination: string;
    ratio: number;
    level: string;
    passes: boolean;
  }>;
} {
  const combinations = [
    // Primary text on backgrounds
    { name: 'White text on slate-950', fg: HOME_COLORS.textPrimary, bg: HOME_COLORS.bgPrimary, isLarge: false },
    { name: 'White text on slate-900', fg: HOME_COLORS.textPrimary, bg: HOME_COLORS.bgSecondary, isLarge: false },
    
    // Secondary text on backgrounds
    { name: 'Gray-400 text on slate-950', fg: HOME_COLORS.textSecondary, bg: HOME_COLORS.bgPrimary, isLarge: false },
    { name: 'Gray-400 muted text on slate-950', fg: HOME_COLORS.textMuted, bg: HOME_COLORS.bgPrimary, isLarge: false },
    
    // Accent colors on backgrounds (for text/icons)
    { name: 'Cyan-400 text/icons on slate-950', fg: HOME_COLORS.accentCyan, bg: HOME_COLORS.bgPrimary, isLarge: false },
    
    // Button combinations (white text on cyan background)
    { name: 'White text on cyan-700 button', fg: HOME_COLORS.textPrimary, bg: HOME_COLORS.accentCyanButton, isLarge: false },
    
    // Large text (headings)
    { name: 'White heading on slate-950', fg: HOME_COLORS.textPrimary, bg: HOME_COLORS.bgPrimary, isLarge: true },
  ];
  
  const results = combinations.map(({ name, fg, bg, isLarge }) => {
    const ratio = calculateContrastRatio(fg, bg);
    const passes = meetsWCAGAA(ratio, isLarge);
    const level = getContrastLevel(ratio, isLarge);
    
    return {
      combination: name,
      ratio: Math.round(ratio * 100) / 100,
      level,
      passes,
    };
  });
  
  const passed = results.every(r => r.passes);
  
  return { passed, results };
}
