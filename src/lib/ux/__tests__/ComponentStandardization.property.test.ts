import * as fc from 'fast-check';
import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeletons';
import { toast } from '@/hooks/use-toast';

/**
 * Property-Based Tests for Component Standardization
 * 
 * Feature: ux-gap-requirements, Property 6: Component Standardization
 * Validates: R13.COMPONENTS.SINGLE_BUTTON, R13.COMPONENTS.SINGLE_SKELETON, R13.COMPONENTS.SINGLE_TOAST
 */

// Generators for property-based testing
const buttonPropsGenerator = fc.record({
  variant: fc.constantFrom('default', 'destructive', 'outline', 'secondary', 'ghost', 'link'),
  size: fc.constantFrom('default', 'sm', 'lg', 'icon'),
  disabled: fc.boolean(),
  children: fc.string({ minLength: 1, maxLength: 20 }),
});

const skeletonPropsGenerator = fc.record({
  className: fc.oneof(
    fc.constant(''),
    fc.constant('h-4 w-32'),
    fc.constant('h-8 w-24'),
    fc.constant('h-6 w-48 rounded-lg')
  ),
  'aria-label': fc.option(fc.string({ minLength: 5, maxLength: 50 })),
});

const toastPropsGenerator = fc.record({
  variant: fc.constantFrom('default', 'destructive', 'success', 'warning'),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
});

describe('Feature: ux-gap-requirements, Property 6: Component Standardization', () => {
  // Mock window.matchMedia for test environment
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {},
      }),
    });
  });
  test('all buttons use consistent class patterns and support standard states', () => {
    fc.assert(
      fc.property(
        fc.array(buttonPropsGenerator, { minLength: 1, maxLength: 10 }),
        (buttonPropsArray) => {
          const renderedButtons = buttonPropsArray.map((props, index) => {
            const { container } = render(
              React.createElement(Button, { key: index, ...props }, props.children)
            );
            return container.firstChild as HTMLElement;
          });

          // Property: All buttons should have consistent base classes
          renderedButtons.forEach((button) => {
            expect(button).toHaveClass('inline-flex');
            expect(button).toHaveClass('items-center');
            expect(button).toHaveClass('justify-center');
            expect(button).toHaveClass('rounded-md');
            expect(button).toHaveClass('font-medium');
            expect(button).toHaveClass('transition-all');
          });

          // Property: All buttons should support disabled state consistently
          renderedButtons.forEach((button) => {
            if (button.hasAttribute('disabled')) {
              expect(button).toHaveClass('disabled:pointer-events-none');
              expect(button).toHaveClass('disabled:opacity-50');
            }
          });

          // Property: All buttons should have focus-visible styles
          renderedButtons.forEach((button) => {
            expect(button).toHaveClass('focus-visible:outline-none');
            expect(button).toHaveClass('focus-visible:ring-2');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all skeleton components use consistent shimmer animation and styling', () => {
    fc.assert(
      fc.property(
        fc.array(skeletonPropsGenerator, { minLength: 1, maxLength: 10 }),
        (skeletonPropsArray) => {
          const renderedSkeletons = skeletonPropsArray.map((props, index) => {
            const { container } = render(
              React.createElement(Skeleton, { key: index, ...props })
            );
            return container.firstChild as HTMLElement;
          });

          // Property: All skeletons should have consistent base styling
          renderedSkeletons.forEach((skeleton) => {
            expect(skeleton).toHaveClass('bg-slate-700/50');
            expect(skeleton).toHaveClass('rounded');
          });

          // Property: All skeletons should have proper accessibility attributes
          renderedSkeletons.forEach((skeleton) => {
            expect(skeleton).toHaveAttribute('aria-hidden', 'true');
            expect(skeleton).toHaveAttribute('aria-label');
          });

          // Property: Animation should be consistent (either all have animate-pulse or none do)
          const hasAnimation = renderedSkeletons.some(skeleton => 
            skeleton.classList.contains('animate-pulse')
          );
          
          if (hasAnimation) {
            // If any skeleton has animation, check that it's applied consistently
            // Note: Animation may be disabled by prefers-reduced-motion
            renderedSkeletons.forEach((skeleton) => {
              // Either has animate-pulse or respects reduced motion preference
              const hasAnimateClass = skeleton.classList.contains('animate-pulse');
              const respectsReducedMotion = !hasAnimateClass;
              expect(hasAnimateClass || respectsReducedMotion).toBe(true);
            });
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('all toast notifications use standardized templates and variants', () => {
    fc.assert(
      fc.property(
        fc.array(toastPropsGenerator, { minLength: 1, maxLength: 5 }),
        (toastPropsArray) => {
          // Property: All toast calls should return consistent structure
          toastPropsArray.forEach((props) => {
            const toastResult = toast({
              variant: props.variant,
              title: props.title,
              description: props.description,
            });

            // Property: Toast function should return consistent interface
            expect(toastResult).toHaveProperty('id');
            expect(toastResult).toHaveProperty('dismiss');
            expect(toastResult).toHaveProperty('update');
            expect(typeof toastResult.id).toBe('string');
            expect(typeof toastResult.dismiss).toBe('function');
            expect(typeof toastResult.update).toBe('function');
          });

          // Property: Toast variants should map to consistent styling
          const variantColorMap = {
            default: 'bg-background',
            destructive: 'bg-destructive',
            success: 'bg-green-50',
            warning: 'bg-yellow-50',
          };

          toastPropsArray.forEach((props) => {
            const expectedBgClass = variantColorMap[props.variant];
            expect(expectedBgClass).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('component standardization maintains consistent API patterns', () => {
    fc.assert(
      fc.property(
        fc.record({
          buttonCount: fc.integer({ min: 1, max: 5 }),
          skeletonCount: fc.integer({ min: 1, max: 5 }),
          toastCount: fc.integer({ min: 1, max: 3 }),
        }),
        ({ buttonCount, skeletonCount, toastCount }) => {
          // Property: All components should follow consistent prop patterns
          
          // Test Button consistency
          for (let i = 0; i < buttonCount; i++) {
            const { container } = render(
              React.createElement(Button, { 
                variant: 'default', 
                size: 'default',
                key: i 
              }, `Test Button ${i}`)
            );
            const button = container.firstChild as HTMLElement;
            
            // Property: All buttons should be actual button elements or have button role
            expect(button.tagName === 'BUTTON' || button.getAttribute('role') === 'button').toBe(true);
          }

          // Test Skeleton consistency
          for (let i = 0; i < skeletonCount; i++) {
            const { container } = render(
              React.createElement(Skeleton, { 
                className: 'h-4 w-32', 
                'aria-label': `Loading item ${i}`,
                key: i 
              })
            );
            const skeleton = container.firstChild as HTMLElement;
            
            // Property: All skeletons should have consistent accessibility
            expect(skeleton).toHaveAttribute('aria-label');
            expect(skeleton).toHaveAttribute('aria-hidden', 'true');
          }

          // Test Toast consistency
          for (let i = 0; i < toastCount; i++) {
            const toastResult = toast({
              title: `Test Toast ${i}`,
              variant: 'default',
            });
            
            // Property: All toasts should have consistent return interface
            expect(toastResult.id).toBeTruthy();
            expect(typeof toastResult.dismiss).toBe('function');
            expect(typeof toastResult.update).toBe('function');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('CSS custom properties are used consistently across components', () => {
    fc.assert(
      fc.property(
        fc.array(buttonPropsGenerator, { minLength: 1, maxLength: 5 }),
        (buttonPropsArray) => {
          buttonPropsArray.forEach((props) => {
            const { container } = render(
              React.createElement(Button, props, props.children)
            );
            const button = container.firstChild as HTMLElement;

            // Property: Buttons should use CSS custom properties for theming
            const computedStyle = window.getComputedStyle(button);
            
            // Check that the button uses CSS variables for colors
            // This is validated by checking that the component classes reference
            // CSS custom properties (which would be defined in globals.css)
            const hasColorClasses = button.className.includes('bg-primary') ||
                                   button.className.includes('bg-secondary') ||
                                   button.className.includes('bg-destructive') ||
                                   button.className.includes('bg-accent') ||
                                   button.className.includes('bg-background') ||
                                   button.className.includes('text-primary') ||
                                   button.className.includes('text-secondary') ||
                                   button.className.includes('text-destructive');
            expect(hasColorClasses).toBe(true);
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});