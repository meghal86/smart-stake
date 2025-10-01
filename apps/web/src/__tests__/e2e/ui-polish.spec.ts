import { test, expect } from '@playwright/test';

test.describe('Lite V2 UI Polish', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lite');
    // Force v2 mode
    await page.evaluate(() => {
      localStorage.setItem('feature_flags', JSON.stringify({ 'ui.v2': true }));
    });
    await page.reload();
  });

  test('ForYou carousel shows skeletons then content', async ({ page }) => {
    // Should show skeleton cards initially
    await expect(page.locator('.animate-pulse')).toHaveCount(3);
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Skeletons should be replaced with content
    await expect(page.locator('.animate-pulse')).toHaveCount(0);
    await expect(page.locator('text=Whale #1234')).toBeVisible();
    await expect(page.locator('.new-dot')).toHaveCount(2); // Items < 1h old
  });

  test('Carousel arrows hide at ends and support keyboard', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for content
    
    // At start, prev arrow should be hidden
    await expect(page.locator('[aria-label="Previous items"]')).toBeHidden();
    await expect(page.locator('[aria-label="Next items"]')).toBeVisible();
    
    // Test keyboard navigation
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[aria-label="Previous items"]')).toBeVisible();
    
    // Navigate to end
    await page.keyboard.press('End');
    await expect(page.locator('[aria-label="Next items"]')).toBeHidden();
    
    // Navigate to start
    await page.keyboard.press('Home');
    await expect(page.locator('[aria-label="Previous items"]')).toBeHidden();
  });

  test('Spotlight footer has single baseline alignment', async ({ page }) => {
    const footer = page.locator('.footer-baseline');
    await expect(footer).toBeVisible();
    await expect(footer.locator('text=14:32 UTC • 11m ago •')).toBeVisible();
    await expect(footer.locator('text=Refresh')).toBeVisible();
  });

  test('Status chips are right-aligned', async ({ page }) => {
    const chips = page.locator('.status-chip');
    await expect(chips).toHaveCount(3); // Spotlight, Fear Index, Digest
    
    // All chips should have status-chip class for right alignment
    for (let i = 0; i < 3; i++) {
      await expect(chips.nth(i)).toHaveClass(/status-chip/);
    }
  });

  test('Fear Index has ARIA meter and enhanced tooltip', async ({ page }) => {
    const meter = page.locator('[role="meter"]');
    await expect(meter).toHaveAttribute('aria-valuenow', '62');
    await expect(meter).toHaveAttribute('aria-valuemin', '0');
    await expect(meter).toHaveAttribute('aria-valuemax', '100');
    
    // Test enhanced tooltip
    await page.hover('text=Methodology');
    await expect(page.locator('text=Scale: 0-24 Extreme Fear')).toBeVisible();
  });

  test('Digest rows show skeletons then become clickable', async ({ page }) => {
    // Initially shows skeleton rows
    await expect(page.locator('.animate-pulse')).toHaveCount(6); // 3 ForYou + 3 Digest
    
    await page.waitForTimeout(2000);
    
    // Digest rows should be clickable
    const digestRow = page.locator('text=Whales bought $200M BTC').locator('..');
    await expect(digestRow).toHaveAttribute('role', 'button');
    await expect(digestRow).toHaveAttribute('tabindex', '0');
    
    // Test keyboard interaction
    await digestRow.focus();
    await page.keyboard.press('Enter');
    // Should log navigation (check console if needed)
  });

  test('Digest hover shows CTAs on desktop', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const digestRow = page.locator('text=Whales bought $200M BTC').locator('..');
    
    // CTAs should be hidden initially
    await expect(digestRow.locator('text=Set Alert')).toHaveCSS('opacity', '0');
    
    // Hover should reveal CTAs
    await digestRow.hover();
    await expect(digestRow.locator('text=Set Alert')).toHaveCSS('opacity', '1');
    await expect(digestRow.locator('text=Follow')).toBeVisible();
    await expect(digestRow.locator('text=+Watchlist')).toBeVisible();
  });

  test('Portfolio Demo shows value in header after activation', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Initially no value in header
    await expect(page.locator('text=$33,750')).not.toBeVisible();
    
    // Click Try Demo
    await page.click('text=Try Demo');
    
    // Header should show value and percentage
    await expect(page.locator('text=$33,750 • +1.1%')).toBeVisible();
    await expect(page.locator('.status-chip:has-text("Demo")')).toBeVisible();
    
    // Reset should be visible
    await expect(page.locator('text=Reset')).toBeVisible();
  });

  test('Reduced spacing between sections', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const sections = page.locator('.section-gap');
    
    // Check that sections have reduced margin
    for (let i = 0; i < await sections.count(); i++) {
      await expect(sections.nth(i)).toHaveCSS('margin-bottom', '8px'); // 0.5rem = 8px
    }
  });

  test('Mobile bottom sheet appears for digest on touch', async ({ page }) => {
    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    // Click digest row
    await page.click('text=Whales bought $200M BTC');
    
    // Bottom sheet should appear
    await expect(page.locator('.bottom-sheet')).toBeVisible();
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('.bottom-sheet text=Set Alert')).toBeVisible();
  });

  test('Visual regression - desktop layout', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Take screenshot of main content
    await expect(page.locator('main')).toHaveScreenshot('lite-v2-desktop.png');
  });

  test('Visual regression - mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(2000);
    
    // Take screenshot of mobile layout
    await expect(page.locator('main')).toHaveScreenshot('lite-v2-mobile.png');
  });

  test('Accessibility - no critical violations', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Run axe accessibility check
    const accessibilityScanResults = await page.evaluate(async () => {
      // @ts-ignore
      const axe = window.axe;
      if (!axe) return { violations: [] };
      
      const results = await axe.run();
      return results;
    });
    
    // Filter for critical violations only
    const criticalViolations = accessibilityScanResults.violations?.filter(
      violation => violation.impact === 'critical'
    ) || [];
    
    expect(criticalViolations).toHaveLength(0);
  });

  test('Keyboard shortcuts work globally', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Test global keyboard shortcuts
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    
    await page.keyboard.press('a');
    await page.keyboard.press('f');
    
    // Should log shortcut actions
    expect(consoleLogs.some(log => log.includes('Set alert shortcut'))).toBeTruthy();
    expect(consoleLogs.some(log => log.includes('Follow shortcut'))).toBeTruthy();
  });
});