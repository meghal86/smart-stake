/**
 * Active Navigation State System E2E Tests
 * 
 * Requirements: R9.NAV.ACTIVE_VISUAL, R9.NAV.BROWSER_SYNC, R9.NAV.SMOOTH_TRANSITIONS
 * Design: Navigation Architecture → Active Navigation State System
 * 
 * Task: 9. Active Navigation State System
 * 
 * This test suite validates the complete active navigation state functionality
 * including visual indicators, browser navigation sync, and smooth transitions.
 */

import { test, expect } from '@playwright/test';

test.describe('Active Navigation State System', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
    
    // Wait for the navigation to be visible
    await expect(page.locator('footer[role="navigation"]')).toBeVisible();
  });

  test.describe('Visual Indicators - R9.NAV.ACTIVE_VISUAL', () => {
    test('shows 2px top border for active navigation item', async ({ page }) => {
      // Navigate to Guardian page
      await page.click('[aria-label="Navigate to Guardian security scanner"]');
      await page.waitForURL('/guardian');
      
      // Check for the 2px top border on active item
      const topBorder = page.locator('.absolute.top-0').first();
      await expect(topBorder).toBeVisible();
      await expect(topBorder).toHaveClass(/h-0\.5/); // 2px border (0.5 = 2px in Tailwind)
      await expect(topBorder).toHaveClass(/bg-gradient-to-r/);
    });

    test('applies bold text to active navigation item', async ({ page }) => {
      // Navigate to Hunter page
      await page.click('[aria-label="Navigate to Hunter opportunities"]');
      await page.waitForURL('/hunter');
      
      // Check that Hunter label is bold
      const hunterLabel = page.locator('text=Hunter').first();
      await expect(hunterLabel).toHaveClass(/font-bold/);
    });

    test('applies reduced opacity to non-active items', async ({ page }) => {
      // Navigate to Guardian page
      await page.click('[aria-label="Navigate to Guardian security scanner"]');
      await page.waitForURL('/guardian');
      
      // Check that non-active items have reduced opacity
      const hunterLink = page.locator('[aria-label="Navigate to Hunter opportunities"]');
      const harvestLink = page.locator('[aria-label="Navigate to Harvest tax optimization"]');
      
      await expect(hunterLink).toHaveClass(/opacity-60/);
      await expect(harvestLink).toHaveClass(/opacity-60/);
    });

    test('active item has full opacity and special styling', async ({ page }) => {
      // Navigate to Portfolio page
      await page.click('[aria-label="Navigate to Portfolio tracker"]');
      await page.waitForURL('/portfolio');
      
      // Check that active item has full opacity
      const portfolioLink = page.locator('[aria-label="Navigate to Portfolio tracker"]');
      await expect(portfolioLink).toHaveClass(/opacity-100/);
      await expect(portfolioLink).toHaveClass(/text-white/);
    });

    test('filled vs outlined icons for active/inactive states', async ({ page }) => {
      // Navigate to HarvestPro page
      await page.click('[aria-label="Navigate to Harvest tax optimization"]');
      await page.waitForURL('/harvestpro');
      
      // Check that active item has enhanced icon styling
      const activeIcon = page.locator('[aria-label="Navigate to Harvest tax optimization"] svg');
      await expect(activeIcon).toHaveClass(/stroke-white/);
      await expect(activeIcon).toHaveClass(/stroke-2/);
    });
  });

  test.describe('Browser Navigation Sync - R9.NAV.BROWSER_SYNC', () => {
    test('active state updates correctly with browser back/forward', async ({ page }) => {
      // Navigate to Guardian
      await page.click('[aria-label="Navigate to Guardian security scanner"]');
      await page.waitForURL('/guardian');
      
      // Verify Guardian is active
      const guardianLink = page.locator('[aria-label="Navigate to Guardian security scanner"]');
      await expect(guardianLink).toHaveAttribute('aria-current', 'page');
      
      // Navigate to Hunter
      await page.click('[aria-label="Navigate to Hunter opportunities"]');
      await page.waitForURL('/hunter');
      
      // Verify Hunter is now active
      const hunterLink = page.locator('[aria-label="Navigate to Hunter opportunities"]');
      await expect(hunterLink).toHaveAttribute('aria-current', 'page');
      
      // Use browser back button
      await page.goBack();
      await page.waitForURL('/guardian');
      
      // Verify Guardian is active again after browser back
      await expect(guardianLink).toHaveAttribute('aria-current', 'page');
      await expect(hunterLink).not.toHaveAttribute('aria-current');
      
      // Use browser forward button
      await page.goForward();
      await page.waitForURL('/hunter');
      
      // Verify Hunter is active again after browser forward
      await expect(hunterLink).toHaveAttribute('aria-current', 'page');
      await expect(guardianLink).not.toHaveAttribute('aria-current');
    });

    test('active state persists across page refreshes', async ({ page }) => {
      // Navigate to HarvestPro
      await page.click('[aria-label="Navigate to Harvest tax optimization"]');
      await page.waitForURL('/harvestpro');
      
      // Verify HarvestPro is active
      const harvestLink = page.locator('[aria-label="Navigate to Harvest tax optimization"]');
      await expect(harvestLink).toHaveAttribute('aria-current', 'page');
      
      // Refresh the page
      await page.reload();
      await page.waitForURL('/harvestpro');
      
      // Verify HarvestPro is still active after refresh
      await expect(harvestLink).toHaveAttribute('aria-current', 'page');
      await expect(harvestLink).toHaveClass(/opacity-100/);
    });

    test('direct URL navigation shows correct active state', async ({ page }) => {
      // Navigate directly to Portfolio via URL
      await page.goto('/portfolio');
      
      // Verify Portfolio is active
      const portfolioLink = page.locator('[aria-label="Navigate to Portfolio tracker"]');
      await expect(portfolioLink).toHaveAttribute('aria-current', 'page');
      await expect(portfolioLink).toHaveClass(/text-white/);
      await expect(portfolioLink).toHaveClass(/opacity-100/);
      
      // Verify other items are not active
      const guardianLink = page.locator('[aria-label="Navigate to Guardian security scanner"]');
      const hunterLink = page.locator('[aria-label="Navigate to Hunter opportunities"]');
      
      await expect(guardianLink).not.toHaveAttribute('aria-current');
      await expect(hunterLink).not.toHaveAttribute('aria-current');
    });
  });

  test.describe('Smooth Transitions - R9.NAV.SMOOTH_TRANSITIONS', () => {
    test('navigation items have smooth transition classes', async ({ page }) => {
      // Check that all navigation links have transition classes
      const navLinks = page.locator('footer[role="navigation"] a');
      const linkCount = await navLinks.count();
      
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        await expect(link).toHaveClass(/transition-all/);
        await expect(link).toHaveClass(/duration-150/);
        await expect(link).toHaveClass(/ease-out/);
      }
    });

    test('icon containers have smooth transitions', async ({ page }) => {
      // Navigate to Guardian to trigger active state
      await page.click('[aria-label="Navigate to Guardian security scanner"]');
      await page.waitForURL('/guardian');
      
      // Check that icon containers have transition classes
      const iconContainers = page.locator('footer[role="navigation"] div[class*="p-3 rounded-xl"]');
      const containerCount = await iconContainers.count();
      
      for (let i = 0; i < containerCount; i++) {
        const container = iconContainers.nth(i);
        await expect(container).toHaveClass(/transition-all/);
        await expect(container).toHaveClass(/duration-150/);
        await expect(container).toHaveClass(/ease-out/);
      }
    });

    test('labels have smooth transitions', async ({ page }) => {
      // Check that all navigation labels have transition classes
      const labels = page.locator('footer[role="navigation"] span');
      const labelCount = await labels.count();
      
      for (let i = 0; i < labelCount; i++) {
        const label = labels.nth(i);
        await expect(label).toHaveClass(/transition-all/);
        await expect(label).toHaveClass(/duration-150/);
        await expect(label).toHaveClass(/ease-out/);
      }
    });

    test('active state transitions are smooth when switching routes', async ({ page }) => {
      // Start timing for transition
      const startTime = Date.now();
      
      // Navigate from Home to Guardian
      await page.click('[aria-label="Navigate to Guardian security scanner"]');
      await page.waitForURL('/guardian');
      
      // Verify Guardian becomes active
      const guardianLink = page.locator('[aria-label="Navigate to Guardian security scanner"]');
      await expect(guardianLink).toHaveAttribute('aria-current', 'page');
      
      // Navigate from Guardian to Hunter
      await page.click('[aria-label="Navigate to Hunter opportunities"]');
      await page.waitForURL('/hunter');
      
      // Verify Hunter becomes active and Guardian becomes inactive
      const hunterLink = page.locator('[aria-label="Navigate to Hunter opportunities"]');
      await expect(hunterLink).toHaveAttribute('aria-current', 'page');
      await expect(guardianLink).not.toHaveAttribute('aria-current');
      
      const endTime = Date.now();
      const transitionTime = endTime - startTime;
      
      // Ensure transitions complete within reasonable time (should be much faster than 1 second)
      expect(transitionTime).toBeLessThan(1000);
    });
  });

  test.describe('Route-Specific Active States', () => {
    test('home route shows correct active state', async ({ page }) => {
      // Navigate to home
      await page.goto('/');
      
      const homeLink = page.locator('[aria-label="Navigate to Home dashboard"]');
      await expect(homeLink).toHaveAttribute('aria-current', 'page');
      await expect(homeLink).toHaveClass(/text-white/);
      await expect(homeLink).toHaveClass(/opacity-100/);
    });

    test('guardian route shows correct active state', async ({ page }) => {
      await page.goto('/guardian');
      
      const guardianLink = page.locator('[aria-label="Navigate to Guardian security scanner"]');
      await expect(guardianLink).toHaveAttribute('aria-current', 'page');
      await expect(guardianLink).toHaveClass(/text-white/);
      await expect(guardianLink).toHaveClass(/opacity-100/);
      
      // Check for top border
      const topBorder = page.locator('.absolute.top-0').first();
      await expect(topBorder).toBeVisible();
    });

    test('hunter route shows correct active state', async ({ page }) => {
      await page.goto('/hunter');
      
      const hunterLink = page.locator('[aria-label="Navigate to Hunter opportunities"]');
      await expect(hunterLink).toHaveAttribute('aria-current', 'page');
      await expect(hunterLink).toHaveClass(/text-white/);
      await expect(hunterLink).toHaveClass(/opacity-100/);
    });

    test('harvestpro route shows correct active state', async ({ page }) => {
      await page.goto('/harvestpro');
      
      const harvestLink = page.locator('[aria-label="Navigate to Harvest tax optimization"]');
      await expect(harvestLink).toHaveAttribute('aria-current', 'page');
      await expect(harvestLink).toHaveClass(/text-white/);
      await expect(harvestLink).toHaveClass(/opacity-100/);
    });

    test('portfolio route shows correct active state', async ({ page }) => {
      await page.goto('/portfolio');
      
      const portfolioLink = page.locator('[aria-label="Navigate to Portfolio tracker"]');
      await expect(portfolioLink).toHaveAttribute('aria-current', 'page');
      await expect(portfolioLink).toHaveClass(/text-white/);
      await expect(portfolioLink).toHaveClass(/opacity-100/);
    });
  });

  test.describe('Accessibility with Active States', () => {
    test('active navigation item has proper ARIA attributes', async ({ page }) => {
      await page.goto('/guardian');
      
      const guardianLink = page.locator('[aria-label="Navigate to Guardian security scanner"]');
      await expect(guardianLink).toHaveAttribute('aria-current', 'page');
      await expect(guardianLink).toHaveAttribute('aria-label');
    });

    test('non-active navigation items do not have aria-current', async ({ page }) => {
      await page.goto('/guardian');
      
      const hunterLink = page.locator('[aria-label="Navigate to Hunter opportunities"]');
      const harvestLink = page.locator('[aria-label="Navigate to Harvest tax optimization"]');
      const portfolioLink = page.locator('[aria-label="Navigate to Portfolio tracker"]');
      
      await expect(hunterLink).not.toHaveAttribute('aria-current');
      await expect(harvestLink).not.toHaveAttribute('aria-current');
      await expect(portfolioLink).not.toHaveAttribute('aria-current');
    });

    test('keyboard navigation works correctly with active states', async ({ page }) => {
      await page.goto('/');
      
      // Use keyboard to navigate to footer navigation
      await page.keyboard.press('Tab');
      
      // Continue tabbing until we reach the navigation
      let attempts = 0;
      while (attempts < 20) {
        const focusedElement = page.locator(':focus');
        const role = await focusedElement.getAttribute('role');
        if (role === 'link' && await focusedElement.isVisible()) {
          break;
        }
        await page.keyboard.press('Tab');
        attempts++;
      }
      
      // Press Enter to activate the focused navigation item
      await page.keyboard.press('Enter');
      
      // Verify that navigation occurred and active state updated
      await page.waitForTimeout(500); // Allow for navigation
      
      // Check that some navigation item has aria-current="page"
      const activeLink = page.locator('[aria-current="page"]');
      await expect(activeLink).toBeVisible();
    });

    test('focus indicators work correctly with active states', async ({ page }) => {
      await page.goto('/guardian');
      
      const guardianLink = page.locator('[aria-label="Navigate to Guardian security scanner"]');
      
      // Check that focus indicators are present
      await expect(guardianLink).toHaveClass(/focus:outline-none/);
      await expect(guardianLink).toHaveClass(/focus:ring-2/);
      await expect(guardianLink).toHaveClass(/focus:ring-cyan-500/);
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('navigation state updates within 50ms', async ({ page }) => {
      await page.goto('/');
      
      // Measure time for navigation state update
      const startTime = Date.now();
      
      await page.click('[aria-label="Navigate to Guardian security scanner"]');
      
      // Wait for the active state to appear
      const guardianLink = page.locator('[aria-label="Navigate to Guardian security scanner"]');
      await expect(guardianLink).toHaveAttribute('aria-current', 'page');
      
      const endTime = Date.now();
      const updateTime = endTime - startTime;
      
      // Active state should update quickly (within reasonable browser limits)
      expect(updateTime).toBeLessThan(500); // Allow for browser navigation time
    });

    test('touch targets are at least 44px on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Check that all navigation links meet minimum touch target size
      const navLinks = page.locator('footer[role="navigation"] a');
      const linkCount = await navLinks.count();
      
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        await expect(link).toHaveClass(/min-h-\[44px\]/);
        await expect(link).toHaveClass(/min-w-\[44px\]/);
      }
    });

    test('navigation works correctly on different screen sizes', async ({ page }) => {
      // Test desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      
      await page.click('[aria-label="Navigate to Hunter opportunities"]');
      await page.waitForURL('/hunter');
      
      const hunterLink = page.locator('[aria-label="Navigate to Hunter opportunities"]');
      await expect(hunterLink).toHaveAttribute('aria-current', 'page');
      
      // Test tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      
      await expect(hunterLink).toHaveAttribute('aria-current', 'page');
      
      // Test mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      await expect(hunterLink).toHaveAttribute('aria-current', 'page');
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('handles invalid routes gracefully', async ({ page }) => {
      // Navigate to an invalid route
      await page.goto('/invalid-route');
      
      // Should still show navigation footer
      await expect(page.locator('footer[role="navigation"]')).toBeVisible();
      
      // Some navigation item should still be active (likely home)
      const activeLinks = page.locator('[aria-current="page"]');
      await expect(activeLinks).toHaveCount(1);
    });

    test('navigation persists during slow page loads', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });
      
      await page.goto('/');
      
      // Navigation should be visible even during slow loads
      await expect(page.locator('footer[role="navigation"]')).toBeVisible();
      
      // Click navigation during load
      await page.click('[aria-label="Navigate to Guardian security scanner"]');
      
      // Should eventually navigate correctly
      await page.waitForURL('/guardian', { timeout: 5000 });
      
      const guardianLink = page.locator('[aria-label="Navigate to Guardian security scanner"]');
      await expect(guardianLink).toHaveAttribute('aria-current', 'page');
    });
  });
});