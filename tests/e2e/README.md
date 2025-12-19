# E2E Tests for UX Gap Requirements

This directory contains end-to-end tests for the UX Gap Requirements implementation using Playwright.

## Quick Start

### Run Active Navigation Tests

```bash
# Run tests in headless mode
npm run test:e2e:navigation

# Run tests with browser UI (visual)
npm run test:e2e:navigation:headed

# Run tests in debug mode
npm run test:e2e:navigation:debug

# Run using the custom script
./scripts/test-active-navigation.sh --headed
```

### Manual Testing

Open `tests/e2e/active-navigation-test-runner.html` in your browser for a visual test runner with:
- Copy-paste commands
- Manual testing checklist
- Direct links to test routes
- Troubleshooting guide

## Test Files

### `active-navigation-states.spec.ts`
Comprehensive E2E tests for Task 9: Active Navigation State System

**Requirements Tested:**
- **R9.NAV.ACTIVE_VISUAL:** Visual indicators (2px border, bold text, opacity)
- **R9.NAV.BROWSER_SYNC:** Browser navigation synchronization
- **R9.NAV.SMOOTH_TRANSITIONS:** 150ms ease-out transitions

**Test Categories:**
1. **Visual Indicators** - 2px top border, bold text, reduced opacity
2. **Browser Navigation Sync** - Back/forward buttons, refresh persistence
3. **Smooth Transitions** - Animation timing and smoothness
4. **Route-Specific Active States** - Each route shows correct active state
5. **Accessibility** - ARIA attributes, keyboard navigation
6. **Performance** - Response times, touch targets
7. **Error Handling** - Invalid routes, slow loads

## Configuration

Tests are configured in `playwright.config.ts` to:
- Run against `http://localhost:3000`
- Test multiple browsers (Chrome, Firefox, Safari)
- Include mobile testing (Pixel 5, iPhone 12)
- Auto-start development server

## Adding New E2E Tests

When implementing new UX Gap tasks, create corresponding E2E tests:

1. Create a new `.spec.ts` file in `tests/e2e/`
2. Follow the naming pattern: `{task-name}.spec.ts`
3. Include requirement references in comments
4. Add test runner script in `scripts/`
5. Update the task in `tasks.md` with test commands

### Template for New Tests

```typescript
/**
 * {Task Name} E2E Tests
 * 
 * Requirements: R{X}.{CATEGORY}.{SPECIFIC}
 * Design: {Design Section}
 * 
 * Task: {X}. {Task Name}
 */

import { test, expect } from '@playwright/test';

test.describe('{Task Name}', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('{Requirement Category}', () => {
    test('{specific test case}', async ({ page }) => {
      // Test implementation
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **Tests fail to start:**
   - Ensure development server is running on `http://localhost:3000`
   - Check that Playwright is installed: `npx playwright install`

2. **Navigation tests fail:**
   - Verify FooterNav component is properly imported
   - Check that NavigationRouter is integrated
   - Ensure all routes are configured correctly

3. **Visual tests fail:**
   - Confirm CSS classes are applied correctly
   - Check that Tailwind CSS is compiled
   - Verify transition timing matches requirements

4. **Accessibility tests fail:**
   - Ensure ARIA attributes are present
   - Check keyboard navigation implementation
   - Verify focus indicators are visible

### Debug Mode

Run tests in debug mode to step through them:

```bash
npm run test:e2e:navigation:debug
```

This opens the Playwright Inspector where you can:
- Step through each test action
- Inspect the page state
- View network requests
- Check console logs

## Browser Support

Tests run on:
- **Desktop:** Chrome, Firefox, Safari
- **Mobile:** Pixel 5 (Chrome), iPhone 12 (Safari)

All tests should pass on all supported browsers to ensure cross-browser compatibility.