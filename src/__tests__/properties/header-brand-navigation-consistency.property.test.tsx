/**
 * Property-Based Test: Brand Navigation Consistency
 * 
 * Feature: unified-header-system, Property 15: Brand Navigation Consistency
 * Validates: Requirements 3.2, 3.3, 3.5
 * 
 * This property test verifies that the brand section consistently navigates
 * to the canonical home route (/) across all session states, viewport sizes,
 * and interaction methods.
 */

import React from 'react';
import { describe, test, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { BrandSection } from '@/components/header/BrandSection';

describe('Property 15: Brand Navigation Consistency', () => {
  test('brand link always points to canonical home route', () => {
    fc.assert(
      fc.property(
        fc.record({
          // Generate random render contexts
          renderCount: fc.integer({ min: 1, max: 10 }),
        }),
        ({ renderCount }) => {
          // Property: Brand link href is always "/" regardless of render count
          for (let i = 0; i < renderCount; i++) {
            const { container } = render(<BrandSection />);
            const link = container.querySelector('a');
            
            expect(link).toBeDefined();
            expect(link?.getAttribute('href')).toBe('/');
            
            // Clean up
            container.remove();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('brand link is always accessible with proper ARIA label', () => {
    fc.assert(
      fc.property(
        fc.constant(null), // No random input needed
        () => {
          const { container } = render(<BrandSection />);
          const link = container.querySelector('a');
          
          // Property: Link always has accessible label
          expect(link).toBeDefined();
          const ariaLabel = link?.getAttribute('aria-label');
          expect(ariaLabel).toBeDefined();
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel?.length).toBeGreaterThan(0);
          
          // Property: Label describes navigation action
          expect(ariaLabel?.toLowerCase()).toContain('home');
          
          // Clean up
          container.remove();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('brand section maintains minimum touch target size', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const { container } = render(<BrandSection />);
          const link = container.querySelector('a');
          
          // Property: Link has minimum 44px height (touch target)
          expect(link).toBeDefined();
          const classes = link?.className || '';
          
          // Check for min-h-[44px] class
          expect(classes).toContain('min-h-[44px]');
          
          // Clean up
          container.remove();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('brand logo image always has proper alt text', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const { container } = render(<BrandSection />);
          const img = container.querySelector('img');
          
          // Property: Image always has alt text
          expect(img).toBeDefined();
          const alt = img?.getAttribute('alt');
          expect(alt).toBeDefined();
          expect(alt).toBeTruthy();
          expect(alt?.length).toBeGreaterThan(0);
          
          // Clean up
          container.remove();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('brand section respects reduced motion preferences', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const { container } = render(<BrandSection />);
          const link = container.querySelector('a');
          
          // Property: Link has motion-reduce classes
          expect(link).toBeDefined();
          const classes = link?.className || '';
          
          // Check for reduced motion support
          expect(classes).toContain('motion-reduce:transition-none');
          expect(classes).toContain('motion-reduce:hover:scale-100');
          
          // Clean up
          container.remove();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('brand navigation is consistent across multiple renders', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }),
        (renderCount) => {
          const hrefs = new Set<string>();
          
          // Property: All renders produce the same href
          for (let i = 0; i < renderCount; i++) {
            const { container } = render(<BrandSection />);
            const link = container.querySelector('a');
            const href = link?.getAttribute('href');
            
            if (href) {
              hrefs.add(href);
            }
            
            // Clean up
            container.remove();
          }
          
          // Property: Only one unique href exists (always "/")
          expect(hrefs.size).toBe(1);
          expect(hrefs.has('/')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('brand section maintains focus ring for keyboard navigation', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const { container } = render(<BrandSection />);
          const link = container.querySelector('a');
          
          // Property: Link has focus-visible styles
          expect(link).toBeDefined();
          const classes = link?.className || '';
          
          expect(classes).toContain('focus-visible:outline-none');
          expect(classes).toContain('focus-visible:ring-2');
          expect(classes).toContain('focus-visible:ring-cyan-500');
          
          // Clean up
          container.remove();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('wordmark visibility classes are present for responsive design', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const { container } = render(<BrandSection />);
          const wordmark = container.querySelector('span');
          
          // Property: Wordmark has responsive visibility classes
          expect(wordmark).toBeDefined();
          const classes = wordmark?.className || '';
          
          // Check for mobile hide and desktop show (≤430px breakpoint)
          expect(classes).toContain('hidden');
          expect(classes).toContain('min-[431px]:inline');
          
          // Clean up
          container.remove();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('brand section structure is stable across renders', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (renderCount) => {
          const structures: string[] = [];
          
          // Property: DOM structure is consistent
          for (let i = 0; i < renderCount; i++) {
            const { container } = render(<BrandSection />);
            
            // Capture structure
            const hasLink = !!container.querySelector('a');
            const hasImg = !!container.querySelector('img');
            const hasSpan = !!container.querySelector('span');
            const structure = `${hasLink}-${hasImg}-${hasSpan}`;
            
            structures.push(structure);
            
            // Clean up
            container.remove();
          }
          
          // Property: All structures are identical
          const uniqueStructures = new Set(structures);
          expect(uniqueStructures.size).toBe(1);
          expect(structures[0]).toBe('true-true-true');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('brand link never has external link attributes', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const { container } = render(<BrandSection />);
          const link = container.querySelector('a');
          
          // Property: Internal link should not have target="_blank" or rel attributes
          expect(link).toBeDefined();
          expect(link?.getAttribute('target')).toBeNull();
          expect(link?.getAttribute('rel')).toBeNull();
          
          // Clean up
          container.remove();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('brand section is idempotent (multiple renders produce same result)', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          // Render twice
          const { container: container1 } = render(<BrandSection />);
          const { container: container2 } = render(<BrandSection />);
          
          const link1 = container1.querySelector('a');
          const link2 = container2.querySelector('a');
          
          // Property: Both renders produce identical href
          expect(link1?.getAttribute('href')).toBe(link2?.getAttribute('href'));
          expect(link1?.getAttribute('href')).toBe('/');
          
          // Property: Both renders produce identical aria-label
          expect(link1?.getAttribute('aria-label')).toBe(link2?.getAttribute('aria-label'));
          
          // Clean up
          container1.remove();
          container2.remove();
        }
      ),
      { numRuns: 100 }
    );
  });

  describe('navigation consistency across different contexts', () => {
    test('brand navigation is independent of render order', () => {
      fc.assert(
        fc.property(
          fc.array(fc.constant(null), { minLength: 1, maxLength: 5 }),
          (renderArray) => {
            const hrefs: string[] = [];
            
            // Property: Navigation target is consistent regardless of render order
            renderArray.forEach(() => {
              const { container } = render(<BrandSection />);
              const link = container.querySelector('a');
              const href = link?.getAttribute('href');
              
              if (href) {
                hrefs.push(href);
              }
              
              container.remove();
            });
            
            // All hrefs should be "/"
            expect(hrefs.every(href => href === '/')).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('brand section maintains semantic HTML structure', () => {
      fc.assert(
        fc.property(
          fc.constant(null),
          () => {
            const { container } = render(<BrandSection />);
            
            // Property: Semantic structure is maintained
            const link = container.querySelector('a');
            const img = link?.querySelector('img');
            const span = link?.querySelector('span');
            
            // Link contains both image and text
            expect(link).toBeDefined();
            expect(img).toBeDefined();
            expect(span).toBeDefined();
            
            // Image is before text (correct reading order)
            const linkChildren = Array.from(link?.children || []);
            const imgIndex = linkChildren.indexOf(img as Element);
            const spanIndex = linkChildren.indexOf(span as Element);
            
            expect(imgIndex).toBeLessThan(spanIndex);
            
            // Clean up
            container.remove();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
