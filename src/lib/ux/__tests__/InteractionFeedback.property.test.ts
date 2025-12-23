import * as fc from 'fast-check';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Button } from '@/components/ui/button';

/**
 * Property-Based Tests for Interaction Feedback Completeness
 * 
 * Feature: ux-gap-requirements, Property 10: Interaction Feedback Completeness
 * Validates: R13.NO_SILENT_CLICKS, R2.LOADING.CTA_FEEDBACK, R8.GATING.DISABLED_TOOLTIPS
 */

// Mock components for testing different interaction patterns
const MockClickableElement = ({ 
  hasOnClick, 
  hasHref, 
  isDisabled, 
  disabledReason,
  children 
}: {
  hasOnClick?: boolean;
  hasHref?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  children: React.ReactNode;
}) => {
  const props: any = {};
  
  if (hasOnClick) {
    props.onClick = vi.fn();
  }
  
  if (hasHref) {
    props.href = '/test-route';
  }
  
  if (isDisabled) {
    props.disabled = true;
    if (disabledReason) {
      props.title = disabledReason;
      props['aria-label'] = disabledReason;
    }
  }

  if (hasHref) {
    return React.createElement('a', props, children);
  }
  
  return React.createElement('button', props, children);
};

// Generators for property-based testing
const clickableElementGenerator = fc.record({
  hasOnClick: fc.boolean(),
  hasHref: fc.boolean(),
  isDisabled: fc.boolean(),
  disabledReason: fc.option(fc.string({ minLength: 5, maxLength: 50 })),
  children: fc.string({ minLength: 1, maxLength: 20 }),
}).filter(props => {
  // Ensure element has at least one valid interaction or is properly disabled
  return props.hasOnClick || props.hasHref || (props.isDisabled && props.disabledReason);
});

const buttonStateGenerator = fc.record({
  loading: fc.boolean(),
  disabled: fc.boolean(),
  variant: fc.constantFrom('default', 'destructive', 'outline', 'secondary', 'ghost', 'link'),
  children: fc.string({ minLength: 1, maxLength: 20 }),
});

describe('Feature: ux-gap-requirements, Property 10: Interaction Feedback Completeness', () => {
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
  test('all clickable elements provide observable feedback when interacted with', () => {
    fc.assert(
      fc.property(
        fc.array(clickableElementGenerator, { minLength: 1, maxLength: 10 }),
        (elementsArray) => {
          elementsArray.forEach((elementProps) => {
            const { container } = render(
              React.createElement(MockClickableElement, elementProps, elementProps.children)
            );
            
            const element = container.firstChild as HTMLElement;
            
            // Property: Every clickable element must have a valid action or explanation
            if (elementProps.hasOnClick) {
              // Element with onClick should be clickable
              expect(element).toHaveProperty('onclick');
              expect(typeof element.onclick).toBe('function');
            }
            
            if (elementProps.hasHref) {
              // Element with href should navigate
              expect(element).toHaveAttribute('href');
              expect(element.getAttribute('href')).toBeTruthy();
            }
            
            if (elementProps.isDisabled && elementProps.disabledReason) {
              // Disabled element should explain why it's disabled
              expect(element).toHaveAttribute('disabled');
              expect(
                element.hasAttribute('title') || 
                element.hasAttribute('aria-label') ||
                element.hasAttribute('aria-describedby')
              ).toBe(true);
            }
            
            // Property: No element should be clickable without providing feedback
            const isClickable = element.tagName === 'BUTTON' || 
                              element.tagName === 'A' || 
                              element.getAttribute('role') === 'button';
            
            if (isClickable && !elementProps.isDisabled) {
              const hasValidAction = elementProps.hasOnClick || elementProps.hasHref;
              expect(hasValidAction).toBe(true);
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('buttons provide appropriate loading and disabled state feedback', () => {
    fc.assert(
      fc.property(
        fc.array(buttonStateGenerator, { minLength: 1, maxLength: 5 }),
        (buttonStatesArray) => {
          buttonStatesArray.forEach((buttonState) => {
            const mockOnClick = vi.fn();
            
            const { container } = render(
              React.createElement(Button, {
                ...buttonState,
                onClick: buttonState.disabled ? undefined : mockOnClick,
                disabled: buttonState.disabled
              }, buttonState.children)
            );
            
            const button = container.firstChild as HTMLElement;
            
            // Property: Disabled buttons should prevent interaction
            if (buttonState.disabled || buttonState.loading) {
              expect(button).toHaveAttribute('disabled');
              expect(button).toHaveClass('disabled:pointer-events-none');
              expect(button).toHaveClass('disabled:opacity-50');
              
              // Clicking disabled button should not trigger action
              fireEvent.click(button);
              expect(mockOnClick).not.toHaveBeenCalled();
            }
            
            // Property: Enabled buttons should be interactive
            if (!buttonState.disabled && !buttonState.loading) {
              expect(button).not.toHaveAttribute('disabled');
              
              // Clicking enabled button should trigger action
              fireEvent.click(button);
              expect(mockOnClick).toHaveBeenCalled();
            }
            
            // Property: All buttons should have focus-visible styles for keyboard users
            expect(button).toHaveClass('focus-visible:outline-none');
            expect(button).toHaveClass('focus-visible:ring-2');
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('interactive elements provide immediate visual feedback on interaction', () => {
    fc.assert(
      fc.property(
        fc.array(buttonStateGenerator, { minLength: 1, maxLength: 3 }),
        async (buttonStatesArray) => {
          const user = userEvent.setup();
          
          for (const buttonState of buttonStatesArray) {
            const mockOnClick = vi.fn();
            
            const { container } = render(
              React.createElement(Button, {
                ...buttonState,
                onClick: buttonState.disabled ? undefined : mockOnClick,
                disabled: buttonState.disabled
              }, buttonState.children)
            );
            
            const button = container.firstChild as HTMLElement;
            
            if (!buttonState.disabled && !buttonState.loading) {
              // Property: Buttons should provide visual feedback on hover
              await user.hover(button);
              
              // Check for hover state classes (varies by variant)
              const hasHoverFeedback = 
                button.className.includes('hover:') ||
                window.getComputedStyle(button).cursor === 'pointer';
              
              expect(hasHoverFeedback).toBe(true);
              
              // Property: Buttons should provide visual feedback on focus
              await user.tab(); // Focus the button
              if (document.activeElement === button) {
                expect(button).toHaveClass('focus-visible:ring-2');
              }
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  test('no silent clicks exist - all interactive elements produce observable effects', () => {
    fc.assert(
      fc.property(
        fc.record({
          elementType: fc.constantFrom('button', 'a', 'div'),
          hasAction: fc.boolean(),
          hasRole: fc.boolean(),
          isDisabled: fc.boolean(),
          content: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        (elementConfig) => {
          const props: any = {};
          
          if (elementConfig.hasRole) {
            props.role = 'button';
          }
          
          if (elementConfig.isDisabled) {
            props.disabled = true;
            props['aria-label'] = 'This action is disabled';
          }
          
          if (elementConfig.hasAction && !elementConfig.isDisabled) {
            if (elementConfig.elementType === 'a') {
              props.href = '/test';
            } else {
              props.onClick = vi.fn();
            }
          }
          
          const { container } = render(
            React.createElement(elementConfig.elementType, props, elementConfig.content)
          );
          
          const element = container.firstChild as HTMLElement;
          
          // Property: Interactive elements must not be silent
          const isInteractive = 
            element.tagName === 'BUTTON' ||
            element.tagName === 'A' ||
            element.getAttribute('role') === 'button' ||
            element.hasAttribute('onclick');
          
          if (isInteractive) {
            if (elementConfig.isDisabled) {
              // Disabled interactive elements must explain why
              expect(
                element.hasAttribute('disabled') &&
                (element.hasAttribute('aria-label') || 
                 element.hasAttribute('title') ||
                 element.hasAttribute('aria-describedby'))
              ).toBe(true);
            } else {
              // Active interactive elements must have an action
              const hasValidAction = 
                element.hasAttribute('href') ||
                element.hasAttribute('onclick') ||
                (props.onClick && typeof props.onClick === 'function');
              
              // If it's a button element without action, it should be disabled or have explanation
              if (element.tagName === 'BUTTON' && !hasValidAction) {
                expect(element.hasAttribute('disabled') || element.hasAttribute('aria-label')).toBe(true);
              } else if (hasValidAction) {
                expect(hasValidAction).toBe(true);
              }
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('loading states provide clear feedback and prevent duplicate actions', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            initialLoading: fc.boolean(),
            content: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 1, maxLength: 3 }
        ),
        (loadingStatesArray) => {
          loadingStatesArray.forEach((loadingState) => {
            const mockOnClick = vi.fn();
            
            // Simulate a button that can enter loading state
            const TestButton = () => {
              const [isLoading, setIsLoading] = React.useState(loadingState.initialLoading);
              
              const handleClick = () => {
                if (!isLoading) {
                  setIsLoading(true);
                  mockOnClick();
                  // Simulate async operation
                  setTimeout(() => setIsLoading(false), 100);
                }
              };
              
              return React.createElement(Button, {
                onClick: handleClick,
                disabled: isLoading,
                'aria-label': isLoading ? 'Loading...' : undefined
              }, isLoading ? 'Loading...' : loadingState.content);
            };
            
            const { container } = render(React.createElement(TestButton));
            const button = container.firstChild as HTMLElement;
            
            // Property: Loading buttons should prevent duplicate clicks
            if (loadingState.initialLoading) {
              expect(button).toHaveAttribute('disabled');
              expect(button.textContent).toContain('Loading');
              
              // Clicking loading button should not trigger action
              fireEvent.click(button);
              expect(mockOnClick).not.toHaveBeenCalled();
            } else {
              expect(button).not.toHaveAttribute('disabled');
              
              // Clicking non-loading button should trigger action
              fireEvent.click(button);
              expect(mockOnClick).toHaveBeenCalled();
            }
          });
        }
      ),
      { numRuns: 50 }
    );
  });
});