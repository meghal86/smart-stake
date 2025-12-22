import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, test, vi } from 'vitest';
import { ActionableEmptyState, type EmptyStateType, type EmptyStateAction, type ScanChecklist } from '../ActionableEmptyState';
import React from 'react';

// Mock framer-motion for property tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Feature: ux-gap-requirements, Property 15: Empty State Actionability
// Validates: R11.EMPTY.HELPFUL_MESSAGES, R11.EMPTY.CLEAR_ACTIONS, R11.EMPTY.ACCESSIBILITY
describe('Feature: ux-gap-requirements, Property 15: Empty State Actionability', () => {
  
  // Generators for property-based testing
  const emptyStateTypeGen = fc.constantFrom(
    'no-risks-detected',
    'no-opportunities', 
    'no-search-results',
    'no-data-available',
    'scanning-in-progress',
    'filters-no-match',
    'temporary-unavailable'
  );

  // More restrictive generators that produce meaningful content
  const meaningfulStringGen = fc.string({ minLength: 5, maxLength: 50 })
    .filter(s => s.trim().length >= 5 && /[a-zA-Z]/.test(s.trim()));
  
  const shortMeaningfulStringGen = fc.string({ minLength: 3, maxLength: 20 })
    .filter(s => s.trim().length >= 3 && /[a-zA-Z]/.test(s.trim()));

  const actionGen = fc.record({
    label: meaningfulStringGen,
    onClick: fc.constant(vi.fn()),
    variant: fc.constantFrom('default', 'outline', 'ghost'),
    external: fc.boolean()
  });

  const checklistItemGen = fc.record({
    item: meaningfulStringGen,
    checked: fc.boolean(),
    description: fc.option(shortMeaningfulStringGen)
  });

  const emptyStatePropsGen = fc.record({
    type: emptyStateTypeGen,
    title: fc.option(meaningfulStringGen),
    description: fc.option(fc.string({ minLength: 15, maxLength: 200 })
      .filter(s => s.trim().length >= 15 && /[a-zA-Z]/.test(s.trim()))),
    actions: fc.array(actionGen, { minLength: 0, maxLength: 3 }),
    scanChecklist: fc.array(checklistItemGen, { minLength: 0, maxLength: 8 }),
    showRefresh: fc.boolean(),
    isRefreshing: fc.boolean(),
    estimatedWaitTime: fc.option(shortMeaningfulStringGen)
  });

  test('empty states always provide helpful messages', () => {
    fc.assert(
      fc.property(
        emptyStatePropsGen,
        (props) => {
          const { unmount } = render(React.createElement(ActionableEmptyState, props));
          
          // Property: Every empty state must have a helpful title
          const headings = screen.getAllByRole('heading', { level: 2 });
          expect(headings.length).toBeGreaterThanOrEqual(1);
          
          const title = headings[0];
          expect(title.textContent).toBeTruthy();
          expect(title.textContent!.length).toBeGreaterThan(0);
          
          // Property: Title should not be generic or unhelpful
          const unhelpfulTitles = ['Error', 'Empty', 'Nothing', ''];
          expect(unhelpfulTitles).not.toContain(title.textContent);
          
          // Property: There should be some descriptive text content
          // This could be either a custom description or the default description
          const paragraphs = screen.getAllByRole('paragraph');
          const hasDescription = paragraphs.some(p => 
            p.textContent && p.textContent.trim().length > 10
          );
          expect(hasDescription).toBe(true);
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('empty states always provide clear actionable buttons', () => {
    fc.assert(
      fc.property(
        emptyStatePropsGen,
        (props) => {
          const mockRefresh = props.showRefresh ? vi.fn() : undefined;
          const propsWithRefresh = { ...props, onRefresh: mockRefresh };
          
          const { unmount } = render(React.createElement(ActionableEmptyState, propsWithRefresh));
          
          // Property: If there are actions or refresh is enabled, there should be buttons
          const hasValidActions = props.actions.some(action => 
            action.label && action.label.trim().length > 0
          );
          const shouldHaveButtons = hasValidActions || props.showRefresh;
          
          if (shouldHaveButtons) {
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThan(0);
            
            buttons.forEach(button => {
              // Button must have text content
              expect(button.textContent).toBeTruthy();
              expect(button.textContent!.trim().length).toBeGreaterThan(0);
              
              // Button text should be actionable (not vague)
              const vagueLables = ['Click', 'Button', 'Action', ''];
              expect(vagueLables).not.toContain(button.textContent!.trim());
              
              // Button should have proper ARIA label
              expect(button).toHaveAttribute('aria-label');
              const ariaLabel = button.getAttribute('aria-label');
              expect(ariaLabel).toBeTruthy();
              expect(ariaLabel!.trim().length).toBeGreaterThan(0);
            });
          }
          
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  test('empty states maintain WCAG AA accessibility compliance', () => {
    fc.assert(
      fc.property(
        emptyStatePropsGen,
        (props) => {
          const { unmount } = render(React.createElement(ActionableEmptyState, props));
          
          // Property: All interactive elements must have proper ARIA labels
          const buttons = screen.queryAllByRole('button');
          buttons.forEach(button => {
            expect(button).toHaveAttribute('aria-label');
            const ariaLabel = button.getAttribute('aria-label');
            expect(ariaLabel).toBeTruthy();
            expect(ariaLabel!.trim().length).toBeGreaterThan(0);
          });
          
          // Property: Heading hierarchy must be proper
          const headings = screen.getAllByRole('heading');
          headings.forEach(heading => {
            const level = heading.getAttribute('aria-level') || 
                         heading.tagName.match(/H(\d)/)?.[1];
            expect(level).toBeTruthy();
            expect(parseInt(level!)).toBeGreaterThanOrEqual(1);
            expect(parseInt(level!)).toBeLessThanOrEqual(6);
          });
          
          // Property: Text content must use proper contrast classes
          const title = screen.getByRole('heading', { level: 2 });
          expect(title).toHaveClass('text-foreground');
          
          // Property: Icons must have proper accessibility labels when used as status indicators
          const checkIcons = screen.queryAllByLabelText(/Completed|Not completed/);
          checkIcons.forEach(icon => {
            const label = icon.getAttribute('aria-label');
            expect(['Completed', 'Not completed']).toContain(label);
          });
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('scan checklists provide meaningful information when present', () => {
    fc.assert(
      fc.property(
        emptyStatePropsGen.filter(props => props.scanChecklist && props.scanChecklist.length > 0),
        (props) => {
          const { unmount } = render(React.createElement(ActionableEmptyState, props));
          
          // Property: Checklist must have a clear heading
          const checklistHeadings = screen.queryAllByText('Items Scanned:');
          expect(checklistHeadings.length).toBeGreaterThanOrEqual(1);
          
          // Property: There should be some checklist items displayed
          // Either from the provided checklist (if valid) or from defaults
          const statusIcons = screen.getAllByLabelText(/Completed|Not completed/);
          expect(statusIcons.length).toBeGreaterThan(0);
          
          // Property: Each displayed item should have meaningful content
          // We check that there are text elements that look like checklist items
          const checklistItems = screen.getAllByText(/\w+/).filter(el => 
            el.textContent && 
            el.textContent.length > 3 &&
            el.closest('[class*="flex items-start gap-3"]')
          );
          expect(checklistItems.length).toBeGreaterThan(0);
          
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  test('refresh functionality provides proper user feedback', () => {
    fc.assert(
      fc.property(
        emptyStatePropsGen.filter(props => props.showRefresh),
        (props) => {
          const mockRefresh = vi.fn();
          const propsWithRefresh = { ...props, onRefresh: mockRefresh };
          
          const { unmount } = render(React.createElement(ActionableEmptyState, propsWithRefresh));
          
          // Property: Refresh button must be present and labeled
          const refreshButton = screen.getByLabelText('Refresh data');
          expect(refreshButton).toBeInTheDocument();
          
          // Property: Refresh button state must reflect loading state
          if (props.isRefreshing) {
            expect(refreshButton).toBeDisabled();
            expect(refreshButton.textContent).toContain('Refreshing');
          } else {
            expect(refreshButton).not.toBeDisabled();
            expect(refreshButton.textContent).toContain('Refresh');
          }
          
          unmount();
        }
      ),
      { numRuns: 50 }
    );
  });

  test('empty state types provide contextually appropriate messaging', () => {
    fc.assert(
      fc.property(
        emptyStateTypeGen,
        (type) => {
          const { unmount } = render(React.createElement(ActionableEmptyState, { type }));
          
          const title = screen.getByRole('heading', { level: 2 });
          const titleText = title.textContent!.toLowerCase();
          
          // Property: Each type must have contextually appropriate messaging
          switch (type) {
            case 'no-risks-detected':
              expect(titleText).toContain('risk');
              expect(titleText).toMatch(/no.*risk|secure|safe/);
              break;
            case 'no-opportunities':
              expect(titleText).toContain('opportunit');
              break;
            case 'no-search-results':
              expect(titleText).toMatch(/no.*result|not.*found/);
              break;
            case 'no-data-available':
              expect(titleText).toMatch(/no.*data|unavailable/);
              break;
            case 'scanning-in-progress':
              expect(titleText).toMatch(/scanning|progress/);
              break;
            case 'filters-no-match':
              expect(titleText).toMatch(/filter|match/);
              break;
            case 'temporary-unavailable':
              expect(titleText).toMatch(/temporary|unavailable/);
              break;
          }
          
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('external links open in new tabs with proper security', () => {
    fc.assert(
      fc.property(
        actionGen.filter(action => action.external && action.label.trim().length > 0),
        (action) => {
          const mockOpen = vi.fn();
          Object.defineProperty(window, 'open', { value: mockOpen });
          
          const actionWithHref = { ...action, href: 'https://example.com' };
          const props = { type: 'no-data-available' as EmptyStateType, actions: [actionWithHref] };
          
          const { unmount } = render(React.createElement(ActionableEmptyState, props));
          
          const button = screen.getByLabelText(action.label.trim());
          button.click();
          
          // Property: External links must open with proper security attributes
          expect(mockOpen).toHaveBeenCalledWith(
            'https://example.com',
            '_blank',
            'noopener,noreferrer'
          );
          
          unmount();
        }
      ),
      { numRuns: 30 }
    );
  });
});