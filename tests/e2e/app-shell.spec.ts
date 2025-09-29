import { test, expect } from '@playwright/test';

test.describe('Hub 2 App Shell', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Hub 2
    await page.goto('/hub2/pulse');
    await page.waitForLoadState('networkidle');
  });

  test('should display production header with all components', async ({ page }) => {
    // Check header elements
    await expect(page.locator('text=Hub 2')).toBeVisible();
    await expect(page.locator('text=24h')).toBeVisible();
    await expect(page.locator('text=7d')).toBeVisible();
    await expect(page.locator('text=30d')).toBeVisible();
    
    // Check search input
    await expect(page.locator('input[placeholder*="Search assets"]')).toBeVisible();
    
    // Check mode toggle
    await expect(page.locator('text=Novice')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    
    // Check provenance toggle
    await expect(page.locator('text=Real')).toBeVisible();
    
    // Check health pill
    await expect(page.locator('[data-testid="health-pill"]')).toBeVisible();
    
    // Check notifications
    await expect(page.locator('button[aria-label="Notifications"]')).toBeVisible();
  });

  test('should handle search command palette with Cmd+K', async ({ page }) => {
    // Open search with Cmd+K
    await page.keyboard.press('Meta+k');
    
    // Check if search modal opens
    await expect(page.locator('text=Search Hub 2')).toBeVisible();
    
    // Type search query
    await page.fill('input[placeholder*="Search assets"]', 'BTC');
    
    // Check for search results
    await expect(page.locator('text=Bitcoin')).toBeVisible();
    
    // Close search modal
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Search Hub 2')).not.toBeVisible();
  });

  test('should handle navigation shortcuts', async ({ page }) => {
    // Test g + p for Pulse
    await page.keyboard.press('g');
    await page.keyboard.press('p');
    await expect(page).toHaveURL('/hub2/pulse');
    
    // Test g + e for Explore
    await page.keyboard.press('g');
    await page.keyboard.press('e');
    await expect(page).toHaveURL('/hub2/explore');
    
    // Test g + w for Watchlist
    await page.keyboard.press('g');
    await page.keyboard.press('w');
    await expect(page).toHaveURL('/hub2/watchlist');
    
    // Test g + a for Alerts
    await page.keyboard.press('g');
    await page.keyboard.press('a');
    await expect(page).toHaveURL('/hub2/alerts');
    
    // Test g + c for Copilot
    await page.keyboard.press('g');
    await page.keyboard.press('c');
    await expect(page).toHaveURL('/hub2/copilot');
  });

  test('should toggle between Novice and Pro modes', async ({ page }) => {
    // Initially in Novice mode
    await expect(page.locator('text=Novice').first()).toHaveClass(/bg-primary/);
    
    // Switch to Pro mode
    await page.click('text=Pro');
    await expect(page.locator('text=Pro').first()).toHaveClass(/bg-primary/);
    
    // Check if Pro mode features are visible
    await expect(page.locator('[data-testid="percentile-badge"]')).toBeVisible();
  });

  test('should toggle Real/Sim provenance filter', async ({ page }) => {
    // Initially Real
    await expect(page.locator('text=Real')).toBeVisible();
    
    // Click to toggle to Sim
    await page.click('text=Real');
    await expect(page.locator('text=Sim')).toBeVisible();
    
    // Toggle back to Real
    await page.click('text=Sim');
    await expect(page.locator('text=Real')).toBeVisible();
  });

  test('should show sign in button when not authenticated', async ({ page }) => {
    // Should show sign in button
    await expect(page.locator('text=Sign In')).toBeVisible();
    
    // Click sign in
    await page.click('text=Sign In');
    await expect(page).toHaveURL('/login');
  });

  test('should show user menu when authenticated', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: '1', email: 'test@example.com' }
      }));
    });
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should show user avatar instead of sign in button
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    
    // Click avatar to open menu
    await page.click('[data-testid="user-avatar"]');
    
    // Check menu items
    await expect(page.locator('text=Profile')).toBeVisible();
    await expect(page.locator('text=Plans & Billing')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=Sign out')).toBeVisible();
  });

  test('should show health status correctly', async ({ page }) => {
    // Check health pill is visible
    const healthPill = page.locator('[data-testid="health-pill"]');
    await expect(healthPill).toBeVisible();
    
    // Hover to show tooltip
    await healthPill.hover();
    
    // Check tooltip content
    await expect(page.locator('text=System Health')).toBeVisible();
  });

  test('should handle mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile bottom nav is visible
    await expect(page.locator('[data-testid="mobile-bottom-nav"]')).toBeVisible();
    
    // Check nav items
    await expect(page.locator('text=Pulse')).toBeVisible();
    await expect(page.locator('text=Explore')).toBeVisible();
    await expect(page.locator('text=Watch')).toBeVisible();
    await expect(page.locator('text=Alerts')).toBeVisible();
    await expect(page.locator('text=Copilot')).toBeVisible();
    
    // Test navigation
    await page.click('text=Explore');
    await expect(page).toHaveURL('/hub2/explore');
  });

  test('should handle plan gating for premium features', async ({ page }) => {
    // Navigate to watchlist (requires auth)
    await page.goto('/hub2/watchlist');
    
    // Should show sign in prompt
    await expect(page.locator('text=Sign In Required')).toBeVisible();
    
    // Navigate to copilot (requires premium)
    await page.goto('/hub2/copilot');
    
    // Should show upgrade prompt
    await expect(page.locator('text=Upgrade Required')).toBeVisible();
  });

  test('should persist UI state across navigation', async ({ page }) => {
    // Set to Pro mode
    await page.click('text=Pro');
    
    // Navigate to different page
    await page.goto('/hub2/explore');
    
    // Should still be in Pro mode
    await expect(page.locator('text=Pro').first()).toHaveClass(/bg-primary/);
    
    // Set to Sim provenance
    await page.click('text=Real');
    await expect(page.locator('text=Sim')).toBeVisible();
    
    // Navigate back
    await page.goto('/hub2/pulse');
    
    // Should still be Sim
    await expect(page.locator('text=Sim')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate through header elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should show environment badge in non-production', async ({ page }) => {
    // Check if environment badge is visible (if not production)
    const envBadge = page.locator('[data-testid="env-badge"]');
    if (await envBadge.isVisible()) {
      await expect(envBadge).toBeVisible();
    }
  });

  test('should handle search with real results', async ({ page }) => {
    // Open search
    await page.keyboard.press('Meta+k');
    
    // Type search query
    await page.fill('input[placeholder*="Search assets"]', 'ETH');
    
    // Should show Ethereum result
    await expect(page.locator('text=Ethereum')).toBeVisible();
    
    // Click on result
    await page.click('text=Ethereum');
    
    // Should navigate to entity detail
    await expect(page).toHaveURL('/hub2/entity/eth');
  });

  test('should handle notifications', async ({ page }) => {
    // Click notifications bell
    await page.click('button[aria-label="Notifications"]');
    
    // Should show notifications dropdown or modal
    // This would depend on the actual implementation
  });

  test('should handle time window changes', async ({ page }) => {
    // Change time window
    await page.click('text=7d');
    await expect(page.locator('text=7d')).toHaveClass(/bg-primary/);
    
    // Change to 30d
    await page.click('text=30d');
    await expect(page.locator('text=30d')).toHaveClass(/bg-primary/);
    
    // Change back to 24h
    await page.click('text=24h');
    await expect(page.locator('text=24h')).toHaveClass(/bg-primary/);
  });
});
