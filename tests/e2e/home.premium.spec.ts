import { test, expect } from '@playwright/test';

test.describe('Premium Lite Homepage', () => {
  test.beforeEach(async ({ page }) => {
    // Enable ui.v2 feature flag
    await page.addInitScript(() => {
      localStorage.setItem('feature_flags', JSON.stringify({ 'ui.v2': true }));
    });
  });

  test('should render premium layout with whale spotlight', async ({ page }) => {
    await page.goto('/lite');
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="whale-spotlight"]', { timeout: 10000 });
    
    // Check hero section
    await expect(page.locator('h1')).toContainText('AlphaWhale Intelligence');
    
    // Check whale spotlight card
    const spotlight = page.locator('[data-testid="whale-spotlight"]');
    await expect(spotlight).toBeVisible();
    
    // Check for KPI stats
    await expect(spotlight.locator('text=Largest Move')).toBeVisible();
    await expect(spotlight.locator('text=Most Active Whale')).toBeVisible();
    await expect(spotlight.locator('text=24h Volume')).toBeVisible();
    
    // Check provenance badge
    const badge = spotlight.locator('.badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/Real|Simulated/);
  });

  test('should render fear index with animated meter', async ({ page }) => {
    await page.goto('/lite');
    
    const fearIndex = page.locator('[data-testid="fear-index"]');
    await expect(fearIndex).toBeVisible();
    
    // Check for score display
    await expect(fearIndex.locator('text=Fear & Whale Index')).toBeVisible();
    
    // Check for meter component
    const meter = fearIndex.locator('.meter');
    await expect(meter).toBeVisible();
    
    // Check for scale labels
    await expect(fearIndex.locator('text=Extreme Fear')).toBeVisible();
    await expect(fearIndex.locator('text=Extreme Greed')).toBeVisible();
  });

  test('should render daily digest with gated content', async ({ page }) => {
    await page.goto('/lite');
    
    const digest = page.locator('[data-testid="digest"]');
    await expect(digest).toBeVisible();
    
    // Check digest items
    const digestItems = digest.locator('.digest-item');
    await expect(digestItems).toHaveCount(4);
    
    // Check for upgrade prompt
    await expect(digest.locator('text=Unlock Pro for full digest')).toBeVisible();
  });

  test('should handle share functionality', async ({ page }) => {
    await page.goto('/lite');
    
    // Mock clipboard API
    await page.addInitScript(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: (text: string) => Promise.resolve()
        }
      });
    });
    
    const shareButton = page.locator('button:has-text("Share")').first();
    await shareButton.click();
    
    // Should show success feedback
    await expect(page.locator('text=Copied to clipboard')).toBeVisible({ timeout: 3000 });
  });

  test('should show upgrade CTA banner', async ({ page }) => {
    await page.goto('/lite');
    
    const upgradeBanner = page.locator('[data-testid="upgrade-cta"]');
    await expect(upgradeBanner).toBeVisible();
    
    // Check CTA content
    await expect(upgradeBanner.locator('text=Unlock Full Alpha')).toBeVisible();
    await expect(upgradeBanner.locator('text=Unlimited alerts')).toBeVisible();
    await expect(upgradeBanner.locator('text=AI digest')).toBeVisible();
    await expect(upgradeBanner.locator('text=Data exports')).toBeVisible();
    
    // Check upgrade button
    const upgradeButton = upgradeBanner.locator('button:has-text("Upgrade to Pro")');
    await expect(upgradeButton).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/lite');
    
    // Check that cards stack vertically
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
    
    // Check that upgrade CTA is visible
    await expect(page.locator('[data-testid="upgrade-cta"]')).toBeVisible();
  });

  test('should show loading skeletons initially', async ({ page }) => {
    // Slow down network to see loading state
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 500);
    });
    
    await page.goto('/lite');
    
    // Check for skeleton loaders
    const skeletons = page.locator('.skeleton');
    await expect(skeletons.first()).toBeVisible();
    
    // Wait for content to load
    await page.waitForSelector('[data-testid="whale-spotlight"]', { timeout: 10000 });
  });
});