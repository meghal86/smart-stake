import { test, expect } from '@playwright/test';

test.describe('Enhanced Lite Homepage', () => {
  test('should render whale spotlight with provenance badge', async ({ page }) => {
    await page.goto('/lite');
    
    // Wait for data to load
    await page.waitForSelector('[data-testid="whale-spotlight"]', { timeout: 10000 });
    
    // Check whale spotlight section
    const spotlight = page.locator('[data-testid="whale-spotlight"]');
    await expect(spotlight).toBeVisible();
    
    // Check for provenance badge
    const provenanceBadge = spotlight.locator('.provenance-badge');
    await expect(provenanceBadge).toBeVisible();
    await expect(provenanceBadge).toContainText(/Real|Simulated/);
    
    // Check share button
    const shareButton = spotlight.locator('button:has-text("Share")');
    await expect(shareButton).toBeVisible();
  });

  test('should render fear index with dial', async ({ page }) => {
    await page.goto('/lite');
    
    const fearIndex = page.locator('[data-testid="fear-index"]');
    await expect(fearIndex).toBeVisible();
    
    // Check for gradient bar
    const gradientBar = fearIndex.locator('.bg-gradient-to-r');
    await expect(gradientBar).toBeVisible();
    
    // Check for score and label
    await expect(fearIndex).toContainText(/\d+.*–/);
  });

  test('should render digest with upgrade CTA', async ({ page }) => {
    await page.goto('/lite');
    
    const digest = page.locator('[data-testid="digest"]');
    await expect(digest).toBeVisible();
    
    // Check for digest items
    const digestItems = digest.locator('li');
    await expect(digestItems).toHaveCount(3);
    
    // Check for upgrade link
    const upgradeLink = digest.locator('a:has-text("Unlock Pro")');
    await expect(upgradeLink).toBeVisible();
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
    
    // Should show some feedback (alert or toast)
    // This depends on implementation - adjust as needed
  });

  test('should show portfolio lite with connect wallet', async ({ page }) => {
    await page.goto('/lite');
    
    const portfolio = page.locator('[data-testid="portfolio-lite"]');
    await expect(portfolio).toBeVisible();
    
    const connectButton = portfolio.locator('button:has-text("Connect Wallet")');
    await expect(connectButton).toBeVisible();
  });
});