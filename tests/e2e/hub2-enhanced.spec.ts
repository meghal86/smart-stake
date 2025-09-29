import { test, expect } from '@playwright/test';

test.describe('Hub 2 Enhanced Features', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Hub 2 Pulse page
    await page.goto('/hub2/pulse');
    await page.waitForLoadState('networkidle');
  });

  test('should display health banner and system status', async ({ page }) => {
    // Check if health banner is present
    const healthBanner = page.locator('[data-testid="health-banner"]');
    await expect(healthBanner).toBeVisible();
    
    // Check for system status indicators
    await expect(page.locator('text=System Status')).toBeVisible();
  });

  test('should toggle between Novice and Pro modes', async ({ page }) => {
    // Initially in Novice mode
    await expect(page.locator('text=Simplified view')).toBeVisible();
    
    // Switch to Pro mode
    await page.click('text=Pro');
    await expect(page.locator('text=Advanced market intelligence')).toBeVisible();
    
    // Should show percentile badges in Pro mode
    await expect(page.locator('[data-testid="percentile-badge"]')).toBeVisible();
    
    // Switch back to Novice mode
    await page.click('text=Novice');
    await expect(page.locator('text=Real-time market signals')).toBeVisible();
  });

  test('should display enhanced AI digest with CTAs', async ({ page }) => {
    // Check AI digest section
    await expect(page.locator('text=AI Market Digest')).toBeVisible();
    
    // Check for provenance chip
    await expect(page.locator('text=Real')).toBeVisible();
    
    // Check for timestamp
    await expect(page.locator('text=As of')).toBeVisible();
    
    // Check action CTAs
    await expect(page.locator('text=Watch all')).toBeVisible();
    await expect(page.locator('text=Create alert')).toBeVisible();
    await expect(page.locator('text=Show transactions')).toBeVisible();
  });

  test('should navigate to correct pages from CTAs', async ({ page }) => {
    // Click Watch all CTA
    await page.click('text=Watch all');
    await expect(page).toHaveURL('/hub2/watchlist');
    
    // Go back to pulse
    await page.goto('/hub2/pulse');
    
    // Click Create alert CTA
    await page.click('text=Create alert');
    await expect(page).toHaveURL('/hub2/alerts');
  });

  test('should show evidence transactions modal', async ({ page }) => {
    // Click Show transactions CTA
    await page.click('text=Show transactions');
    
    // Check if modal opens
    await expect(page.locator('[data-testid="evidence-modal"]')).toBeVisible();
    
    // Check for transaction data
    await expect(page.locator('text=Transaction Hash')).toBeVisible();
    await expect(page.locator('text=Amount')).toBeVisible();
    
    // Close modal
    await page.click('[data-testid="close-modal"]');
    await expect(page.locator('[data-testid="evidence-modal"]')).not.toBeVisible();
  });

  test('should display top signals with enhanced data', async ({ page }) => {
    // Check top signals section
    await expect(page.locator('text=Top Signals')).toBeVisible();
    
    // Check for entity cards
    const entityCards = page.locator('[data-testid="entity-card"]');
    await expect(entityCards).toHaveCount(6);
    
    // Check for provenance chips on cards
    await expect(page.locator('[data-testid="provenance-chip"]')).toBeVisible();
    
    // Check for sentiment badges
    await expect(page.locator('[data-testid="sentiment-badge"]')).toBeVisible();
  });

  test('should show signal stack with show more functionality', async ({ page }) => {
    // Check signal stack section
    await expect(page.locator('text=Signal Stack')).toBeVisible();
    
    // Check for show more button
    const showMoreButton = page.locator('text=Show more');
    if (await showMoreButton.isVisible()) {
      await showMoreButton.click();
      await expect(page.locator('text=Show less')).toBeVisible();
    }
  });

  test('should display venue data in Pro mode', async ({ page }) => {
    // Switch to Pro mode
    await page.click('text=Pro');
    
    // Check for venue list
    await expect(page.locator('[data-testid="venue-list"]')).toBeVisible();
    
    // Check for venue badges
    await expect(page.locator('[data-testid="venue-badge"]')).toBeVisible();
  });

  test('should show percentile badges in Pro mode', async ({ page }) => {
    // Switch to Pro mode
    await page.click('text=Pro');
    
    // Check for percentile badges
    await expect(page.locator('[data-testid="percentile-badge"]')).toBeVisible();
    
    // Check for percentile tooltips
    await page.hover('[data-testid="percentile-badge"]');
    await expect(page.locator('text=vs last 30d')).toBeVisible();
  });

  test('should handle time window changes', async ({ page }) => {
    // Check time window toggle
    await expect(page.locator('text=24h')).toBeVisible();
    
    // Change to 7d
    await page.click('text=7d');
    await expect(page.locator('text=7d')).toHaveClass(/bg-primary/);
    
    // Change to 30d
    await page.click('text=30d');
    await expect(page.locator('text=30d')).toHaveClass(/bg-primary/);
  });

  test('should show loading states correctly', async ({ page }) => {
    // Simulate slow network
    await page.route('**/whale-alerts', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    // Reload page
    await page.reload();
    
    // Check for skeleton loaders
    await expect(page.locator('[data-testid="skeleton"]')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/whale-alerts', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Reload page
    await page.reload();
    
    // Check for error message
    await expect(page.locator('text=Failed to load pulse data')).toBeVisible();
    await expect(page.locator('text=Try Again')).toBeVisible();
  });

  test('should maintain state across navigation', async ({ page }) => {
    // Set to Pro mode
    await page.click('text=Pro');
    
    // Navigate to Explore
    await page.click('text=Watch all');
    await page.goto('/hub2/explore');
    
    // Go back to Pulse
    await page.goto('/hub2/pulse');
    
    // Should still be in Pro mode
    await expect(page.locator('text=Pro')).toHaveClass(/bg-primary/);
  });

  test('should be accessible with proper ARIA labels', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.locator('[aria-label="Mode toggle"]')).toBeVisible();
    await expect(page.locator('[aria-label="Time window selector"]')).toBeVisible();
    
    // Check for tooltip accessibility
    await page.hover('[data-testid="provenance-chip"]');
    await expect(page.locator('[role="tooltip"]')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if components are properly stacked
    await expect(page.locator('text=Market Pulse')).toBeVisible();
    
    // Check if mode toggle is accessible
    await expect(page.locator('text=Novice')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    
    // Check if CTAs are properly sized for mobile
    const ctaButtons = page.locator('text=Watch all, text=Create alert, text=Show transactions');
    await expect(ctaButtons).toBeVisible();
  });
});
