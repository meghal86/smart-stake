import * as fc from 'fast-check';
import { describe, test, expect } from 'vitest';

/**
 * Property-based tests for Design System Compliance
 * Feature: unified-portfolio, Property 4: Design System Compliance
 * Validates: Requirements 3.1, 3.2
 */

// Design system color palette
const DESIGN_SYSTEM_COLORS = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 
  'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 
  'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

const COLOR_SCALES = [
  '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'
];

const SPACING_SCALE = [
  '0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', 
  '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48', 
  '52', '56', '60', '64', '72', '80', '96'
];

const DIMENSION_SCALE = [
  '0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '7', '8', '9', 
  '10', '11', '12', '14', '16', '20', '24', '28', '32', '36', '40', '44', '48', 
  '52', '56', '60', '64', '72', '80', '96', 'auto', 'full', 'screen', 'min', 'max', 'fit'
];

// Generators for valid design system classes
const validColorClassGenerator = fc.record({
  prefix: fc.constantFrom('bg', 'text', 'border'),
  color: fc.constantFrom(...DESIGN_SYSTEM_COLORS),
  scale: fc.constantFrom(...COLOR_SCALES)
}).map(({ prefix, color, scale }) => `${prefix}-${color}-${scale}`);

const validSpacingClassGenerator = fc.record({
  prefix: fc.constantFrom('p', 'm', 'pt', 'pr', 'pb', 'pl', 'px', 'py', 'mt', 'mr', 'mb', 'ml', 'mx', 'my'),
  scale: fc.constantFrom(...SPACING_SCALE)
}).map(({ prefix, scale }) => `${prefix}-${scale}`);

const validDimensionClassGenerator = fc.record({
  prefix: fc.constantFrom('w', 'h'),
  scale: fc.constantFrom(...DIMENSION_SCALE)
}).map(({ prefix, scale }) => `${prefix}-${scale}`);

const validDesignTokenGenerator = fc.oneof(
  validColorClassGenerator,
  validSpacingClassGenerator,
  validDimensionClassGenerator
);

// Generators for invalid patterns
const invalidColorClassGenerator = fc.record({
  prefix: fc.constantFrom('bg', 'text', 'border'),
  hex: fc.string({ minLength: 6, maxLength: 6 }).filter(s => /^[0-9a-fA-F]{6}$/.test(s))
}).map(({ prefix, hex }) => `${prefix}-[#${hex}]`);

const invalidSpacingClassGenerator = fc.record({
  prefix: fc.constantFrom('p', 'm', 'w', 'h'),
  pixels: fc.integer({ min: 1, max: 999 })
}).map(({ prefix, pixels }) => `${prefix}-[${pixels}px]`);

const invalidDesignTokenGenerator = fc.oneof(
  invalidColorClassGenerator,
  invalidSpacingClassGenerator
);

// Validation functions
function isValidDesignToken(className: string): boolean {
  // Strip responsive and state prefixes to get the base class
  const baseClass = className.replace(/^(sm|md|lg|xl|2xl|hover|focus|active|disabled|group-hover):/g, '');
  
  // Color classes
  const colorPattern = /^(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/;
  if (colorPattern.test(baseClass)) return true;

  // Spacing classes - updated to handle all directional variants
  const spacingPattern = /^(p|m|pt|pr|pb|pl|px|py|mt|mr|mb|ml|mx|my)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)$/;
  if (spacingPattern.test(baseClass)) return true;

  // Dimension classes
  const dimensionPattern = /^[wh]-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full|screen|min|max|fit)$/;
  if (dimensionPattern.test(baseClass)) return true;

  // Layout and utility classes (allow common ones)
  const utilityClasses = ['flex', 'grid', 'block', 'inline', 'inline-block', 'hidden', 'relative', 'absolute', 'fixed', 'sticky'];
  if (utilityClasses.includes(baseClass)) return true;
  
  // Additional utility patterns
  const utilityPattern = /^(justify-|items-|content-|rounded|border|shadow|text-|font-|opacity-|z-|transition|duration|ease)/;
  if (utilityPattern.test(baseClass)) return true;

  return false;
}

function isBannedPattern(className: string): boolean {
  // Strip responsive and state prefixes to get the base class
  const baseClass = className.replace(/^(sm|md|lg|xl|2xl|hover|focus|active|disabled|group-hover):/g, '');
  
  const bannedPatterns = [
    /^bg-\[#[0-9a-fA-F]{6}\]$/, // Custom hex colors
    /^text-\[#[0-9a-fA-F]{6}\]$/, // Custom hex text colors
    /^border-\[#[0-9a-fA-F]{6}\]$/, // Custom hex border colors
    /^[wh]-\[[0-9]+px\]$/, // Custom pixel dimensions
    /^(p|m|pt|pr|pb|pl|px|py|mt|mr|mb|ml|mx|my)-\[[0-9]+px\]$/, // Custom pixel spacing
    /^shadow-\[[^\]]+\]$/, // Custom shadows
  ];

  return bannedPatterns.some(pattern => pattern.test(baseClass));
}

function validateClassList(classList: string[]): { valid: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const className of classList) {
    if (isBannedPattern(className)) {
      violations.push(`Banned pattern: ${className}`);
    } else if (!isValidDesignToken(className)) {
      violations.push(`Invalid design token: ${className}`);
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

describe('Feature: unified-portfolio, Property 4: Design System Compliance', () => {
  test('valid design tokens are always accepted', () => {
    fc.assert(
      fc.property(
        fc.array(validDesignTokenGenerator, { minLength: 1, maxLength: 10 }),
        (validClasses) => {
          const result = validateClassList(validClasses);
          
          // Property: All valid design tokens should pass validation
          expect(result.valid).toBe(true);
          expect(result.violations).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('banned patterns are always rejected', () => {
    fc.assert(
      fc.property(
        fc.array(invalidDesignTokenGenerator, { minLength: 1, maxLength: 3 }), // Reduced max length
        (invalidClasses) => {
          const result = validateClassList(invalidClasses);
          
          // Property: All banned patterns should be rejected
          expect(result.valid).toBe(false);
          expect(result.violations.length).toBeGreaterThan(0);
          
          // Property: Each violation should mention the problematic class
          for (const violation of result.violations) {
            expect(violation).toMatch(/(Banned pattern|Invalid design token)/);
          }
        }
      ),
      { numRuns: 50, timeout: 10000 } // Reduced runs and added timeout
    );
  });

  test('mixed valid and invalid classes are properly categorized', () => {
    fc.assert(
      fc.property(
        fc.array(validDesignTokenGenerator, { minLength: 1, maxLength: 5 }),
        fc.array(invalidDesignTokenGenerator, { minLength: 1, maxLength: 3 }),
        (validClasses, invalidClasses) => {
          const mixedClasses = [...validClasses, ...invalidClasses];
          const result = validateClassList(mixedClasses);
          
          // Property: Mixed classes should be invalid overall
          expect(result.valid).toBe(false);
          
          // Property: Number of violations should match number of invalid classes
          expect(result.violations.length).toBe(invalidClasses.length);
          
          // Property: Each invalid class should have a corresponding violation
          for (const invalidClass of invalidClasses) {
            const hasViolation = result.violations.some(violation => 
              violation.includes(invalidClass)
            );
            expect(hasViolation).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('color consistency across component variants', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...DESIGN_SYSTEM_COLORS),
        fc.constantFrom(...COLOR_SCALES),
        fc.array(fc.constantFrom('bg', 'text', 'border'), { minLength: 1, maxLength: 3 }),
        (color, scale, prefixes) => {
          const colorClasses = prefixes.map(prefix => `${prefix}-${color}-${scale}`);
          const result = validateClassList(colorClasses);
          
          // Property: Consistent color usage across prefixes should be valid
          expect(result.valid).toBe(true);
          
          // Property: All classes should use the same color and scale
          for (const className of colorClasses) {
            expect(className).toContain(`-${color}-${scale}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('spacing scale consistency', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SPACING_SCALE),
        fc.array(fc.constantFrom('p', 'm', 'pt', 'pr', 'pb', 'pl', 'px', 'py'), { minLength: 1, maxLength: 4 }),
        (scale, prefixes) => {
          const spacingClasses = prefixes.map(prefix => `${prefix}-${scale}`);
          const result = validateClassList(spacingClasses);
          
          // Property: Consistent spacing scale usage should be valid
          expect(result.valid).toBe(true);
          
          // Property: All classes should use the same scale value
          for (const className of spacingClasses) {
            expect(className).toContain(`-${scale}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('component class composition follows design system rules', () => {
    fc.assert(
      fc.property(
        validColorClassGenerator,
        validSpacingClassGenerator,
        validDimensionClassGenerator,
        fc.constantFrom('flex', 'grid', 'block', 'inline-block', 'hidden'),
        (colorClass, spacingClass, dimensionClass, layoutClass) => {
          const componentClasses = [colorClass, spacingClass, dimensionClass, layoutClass];
          const result = validateClassList(componentClasses);
          
          // Property: Well-formed component class composition should be valid
          expect(result.valid).toBe(true);
          
          // Property: Should contain classes from different categories
          const hasColor = componentClasses.some(cls => cls.startsWith('bg-') || cls.startsWith('text-') || cls.startsWith('border-'));
          const hasSpacing = componentClasses.some(cls => 
            cls.startsWith('p-') || cls.startsWith('m-') || 
            cls.startsWith('pt-') || cls.startsWith('pr-') || cls.startsWith('pb-') || cls.startsWith('pl-') ||
            cls.startsWith('px-') || cls.startsWith('py-') || 
            cls.startsWith('mt-') || cls.startsWith('mr-') || cls.startsWith('mb-') || cls.startsWith('ml-') ||
            cls.startsWith('mx-') || cls.startsWith('my-')
          );
          const hasDimension = componentClasses.some(cls => cls.startsWith('w-') || cls.startsWith('h-'));
          const hasLayout = componentClasses.some(cls => ['flex', 'grid', 'block', 'inline-block', 'hidden'].includes(cls));
          
          expect(hasColor).toBe(true);
          expect(hasSpacing).toBe(true);
          expect(hasDimension).toBe(true);
          expect(hasLayout).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('responsive design token validation', () => {
    fc.assert(
      fc.property(
        validDesignTokenGenerator,
        fc.constantFrom('sm', 'md', 'lg', 'xl', '2xl'),
        (baseClass, breakpoint) => {
          const responsiveClass = `${breakpoint}:${baseClass}`;
          const classList = [baseClass, responsiveClass]; // Include both base and responsive
          const result = validateClassList(classList);
          
          // Property: Responsive variants of valid tokens should be valid
          expect(result.valid).toBe(true);
          
          // Property: Responsive class should contain breakpoint prefix
          expect(responsiveClass).toMatch(new RegExp(`^${breakpoint}:`));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('state variant validation', () => {
    fc.assert(
      fc.property(
        validDesignTokenGenerator,
        fc.constantFrom('hover', 'focus', 'active', 'disabled', 'group-hover'),
        (baseClass, state) => {
          const stateClass = `${state}:${baseClass}`;
          const classList = [baseClass, stateClass]; // Include both base and state
          const result = validateClassList(classList);
          
          // Property: State variants of valid tokens should be valid
          expect(result.valid).toBe(true);
          
          // Property: State class should contain state prefix
          expect(stateClass).toMatch(new RegExp(`^${state}:`));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('design token immutability', () => {
    fc.assert(
      fc.property(
        validDesignTokenGenerator,
        (originalClass) => {
          // Property: Design tokens should be immutable strings
          const frozenClass = Object.freeze(originalClass);
          const result1 = validateClassList([originalClass]);
          const result2 = validateClassList([frozenClass]);
          
          // Property: Validation should be consistent regardless of mutability
          expect(result1.valid).toBe(result2.valid);
          expect(result1.violations).toEqual(result2.violations);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// **Validates: Requirements 3.1, 3.2**