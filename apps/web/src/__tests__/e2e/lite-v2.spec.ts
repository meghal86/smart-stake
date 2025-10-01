import { test, expect } from '@playwright/test';

test.describe('AlphaWhale Lite V2', () => {
  test.beforeEach(async ({ page }) => {
    // Enable ui.v2 flag
    await page.goto('/lite');
    await page.evaluate(() => {
      localStorage.setItem('feature_flags', JSON.stringify({ 'ui.v2': true }));
    });
    await page.reload();
  });

  test('Fear Index renders with score on marker', async ({ page }) => {
    await expect(page.locator('text=🧭 Fear & Whale Index')).toBeVisible();
    await expect(page.locator('text=62')).toBeVisible();
    await expect(page.locator('text=Methodology')).toBeVisible();
  });

  test('Fear Index methodology link navigates correctly', async ({ page }) => {
    await page.click('text=Methodology');
    await expect(page).toHaveURL(/.*\/docs\/methodology/);
    await expect(page.locator('text=Fear & Whale Index Formula')).toBeVisible();
  });

  test('Daily Digest rows are clickable', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    
    await page.hover('text=Whales bought $200M BTC');
    await page.click('text=Whales bought $200M BTC');
    
    expect(consoleLogs.some(log => log.includes('Navigate to details'))).toBeTruthy();
  });

  test('Daily Digest CTAs appear on hover', async ({ page }) => {
    await page.hover('text=Whales bought $200M BTC');
    
    await expect(page.locator('text=Set Alert')).toBeVisible();
    await expect(page.locator('text=Follow')).toBeVisible();
    await expect(page.locator('text=+Watchlist')).toBeVisible();
  });

  test('Daily Digest keyboard shortcuts work', async ({ page }) => {
    const consoleLogs: string[] = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    
    await page.keyboard.press('a');
    expect(consoleLogs.some(log => log.includes('Set alert triggered'))).toBeTruthy();
    
    await page.keyboard.press('f');
    expect(consoleLogs.some(log => log.includes('Follow triggered'))).toBeTruthy();
  });

  test('For You carousel has scroll arrows', async ({ page }) => {
    await expect(page.locator('text=🎯 For You')).toBeVisible();
    await expect(page.locator('text=←')).toBeVisible();
    await expect(page.locator('text=→')).toBeVisible();
  });

  test('For You carousel shows New dots', async ({ page }) => {
    await expect(page.locator('.new-dot')).toHaveCount({ min: 1 });
  });

  test('For You context menu works', async ({ page }) => {
    await page.click('text=⋯');
    
    await expect(page.locator('text=Follow')).toBeVisible();
    await expect(page.locator('text=Set Alert')).toBeVisible();
    await expect(page.locator('text=Share')).toBeVisible();
  });

  test('Portfolio Demo seeds and shows P&L', async ({ page }) => {
    await page.click('text=Try Demo');
    
    await expect(page.locator('text=Demo')).toBeVisible();
    await expect(page.locator('text=BTC')).toBeVisible();
    await expect(page.locator('text=ETH')).toBeVisible();
    await expect(page.locator('text=$33,750')).toBeVisible();
    await expect(page.locator('text=24h')).toBeVisible();
  });

  test('Portfolio Demo reset works', async ({ page }) => {
    await page.click('text=Try Demo');
    await expect(page.locator('text=Demo')).toBeVisible();
    
    await page.click('text=Reset');
    await expect(page.locator('text=Try Demo')).toBeVisible();
    await expect(page.locator('text=Demo')).not.toBeVisible();
  });

  test('Set Alert is visually dominant (primary CTA)', async ({ page }) => {
    await page.hover('text=Whales bought $200M BTC');
    
    const setAlertBtn = page.locator('text=Set Alert').first();
    const followBtn = page.locator('text=Follow').first();
    
    // Primary CTA should have teal background
    await expect(setAlertBtn).toHaveClass(/cta-primary/);
    await expect(followBtn).toHaveClass(/cta-secondary/);
  });

  test('Simulated tooltip is present', async ({ page }) => {
    const simulatedBadge = page.locator('text=Simulated').first();
    await expect(simulatedBadge).toHaveAttribute('title', /This is simulated until live sources/);
  });

  test('Spacing tokens are applied correctly', async ({ page }) => {
    // Check that sections have proper spacing
    const sections = page.locator('.section-gap');
    await expect(sections).toHaveCount({ min: 3 });
    
    // Check that cards have proper padding
    const cards = page.locator('.card-padding');
    await expect(cards).toHaveCount({ min: 3 });
  });

  test('Mobile responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Components should still be visible on mobile
    await expect(page.locator('text=🎯 For You')).toBeVisible();
    await expect(page.locator('text=🧭 Fear & Whale Index')).toBeVisible();
    await expect(page.locator('text=📩 Daily Whale Digest')).toBeVisible();
  });
});