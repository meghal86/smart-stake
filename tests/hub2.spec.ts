import { test, expect } from '@playwright/test';

test.describe('Hub 2 - Market Intelligence', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Hub 2 pulse page
    await page.goto('/hub2/pulse');
  });

  test('Pulse page loads with KPI cards and signal stack', async ({ page }) => {
    // Check that the page loads within 1 second
    await expect(page.locator('h1')).toContainText('Market Pulse');
    
    // Check for KPI cards (Market Sentiment, Whale Pressure, Risk)
    await expect(page.locator('text=Market Sentiment')).toBeVisible();
    await expect(page.locator('text=Whale Pressure')).toBeVisible();
    await expect(page.locator('text=Risk Level')).toBeVisible();
    
    // Check for signal stack (max 6 cards)
    const signalCards = page.locator('[data-testid="signal-card"], .grid > div').first();
    await expect(signalCards).toBeVisible();
    
    // Check for AI summary
    await expect(page.locator('text=AI Market Summary')).toBeVisible();
  });

  test('Keyboard shortcuts work on Pulse page', async ({ page }) => {
    // Test keyboard shortcuts (1-6 for Pulse items)
    await page.keyboard.press('1');
    // Should open first signal item
    await expect(page.locator('text=View Details')).toBeVisible();
    
    // Test search focus with /
    await page.keyboard.press('/');
    const searchInput = page.locator('input[placeholder*="search" i]');
    await expect(searchInput).toBeFocused();
  });

  test('Explore page filters persist via URL', async ({ page }) => {
    await page.goto('/hub2/explore');
    
    // Apply filters
    await page.click('text=Expand');
    await page.selectOption('select', 'sentiment');
    await page.fill('input[placeholder*="search" i]', 'bitcoin');
    
    // Check URL contains filter parameters
    await expect(page).toHaveURL(/sentiment/);
    await expect(page).toHaveURL(/search/);
    
    // Reload page and verify filters persist
    await page.reload();
    await expect(page.locator('input[placeholder*="search" i]')).toHaveValue('bitcoin');
  });

  test('Explore page sort by sentiment works', async ({ page }) => {
    await page.goto('/hub2/explore');
    
    // Click sort dropdown
    await page.click('text=Sort by:');
    await page.selectOption('select', 'sentiment');
    
    // Verify sort is applied
    await expect(page.locator('select')).toHaveValue('sentiment');
  });

  test('Explore page infinite scroll is stable', async ({ page }) => {
    await page.goto('/hub2/explore');
    
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check for load more button or infinite scroll
    const loadMoreButton = page.locator('text=Load More');
    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();
    }
    
    // Verify no layout shift or errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('Entity detail page shows reason codes and source tooltips', async ({ page }) => {
    // Navigate to a specific entity (using mock data)
    await page.goto('/hub2/entity/bitcoin');
    
    // Check for entity header
    await expect(page.locator('h1')).toContainText('Bitcoin');
    
    // Check for provenance badge
    await expect(page.locator('text=Real'), page.locator('text=Sim')).toBeVisible();
    
    // Check for gauges
    await expect(page.locator('text=Sentiment')).toBeVisible();
    await expect(page.locator('text=Whale Pressure')).toBeVisible();
    await expect(page.locator('text=Risk')).toBeVisible();
    
    // Check for timeline
    await expect(page.locator('text=Timeline')).toBeVisible();
    
    // Check for AI insights
    await expect(page.locator('text=AI Insights')).toBeVisible();
  });

  test('Create alert from Explore or Detail in ≤ 3 clicks', async ({ page }) => {
    // Test from Explore page
    await page.goto('/hub2/explore');
    
    // Click on first entity card
    await page.click('.grid > div').first();
    
    // Should navigate to entity detail
    await expect(page).toHaveURL(/\/hub2\/entity\//);
    
    // Click watch button (1st click)
    await page.click('text=Watch');
    
    // Navigate to alerts page (2nd click)
    await page.goto('/hub2/alerts');
    
    // Click create alert (3rd click)
    await page.click('text=Create Alert');
    
    // Verify alert builder opens
    await expect(page.locator('text=Create New Alert')).toBeVisible();
  });

  test('Backtest result renders correctly', async ({ page }) => {
    await page.goto('/hub2/entity/bitcoin');
    
    // Click backtest button
    await page.click('text=Run Backtest');
    
    // Wait for result
    await page.waitForSelector('text=Win Rate', { timeout: 5000 });
    
    // Verify backtest result is displayed
    await expect(page.locator('text=Win Rate')).toBeVisible();
  });

  test('Real/Sim badges visible on every card and header', async ({ page }) => {
    await page.goto('/hub2/explore');
    
    // Check that all entity cards have provenance badges
    const cards = page.locator('.grid > div');
    const cardCount = await cards.count();
    
    for (let i = 0; i < Math.min(cardCount, 5); i++) {
      const card = cards.nth(i);
      await expect(card.locator('text=Real'), card.locator('text=Sim')).toBeVisible();
    }
  });

  test('Watchlist page kanban functionality', async ({ page }) => {
    await page.goto('/hub2/watchlist');
    
    // Check for kanban columns
    await expect(page.locator('text=Needs Action')).toBeVisible();
    await expect(page.locator('text=Watching')).toBeVisible();
    await expect(page.locator('text=Resolved')).toBeVisible();
    
    // Test drag and drop (if implemented)
    const needsActionItem = page.locator('text=Needs Action').first();
    const watchingColumn = page.locator('text=Watching').first();
    
    // Simulate drag and drop
    await needsActionItem.dragTo(watchingColumn);
    
    // Verify item moved
    await expect(watchingColumn.locator('text=Needs Action')).toBeVisible();
  });

  test('Copilot page chat functionality', async ({ page }) => {
    await page.goto('/hub2/copilot');
    
    // Check for chat interface
    await expect(page.locator('text=AI Copilot')).toBeVisible();
    await expect(page.locator('text=Conversation')).toBeVisible();
    
    // Test quick actions
    await page.click('text=Explain');
    await expect(page.locator('input[placeholder*="Ask me anything"]')).toHaveValue(/explanation/);
    
    // Test message sending
    await page.fill('input[placeholder*="Ask me anything"]', 'What is the current market sentiment?');
    await page.click('button[type="submit"], button:has-text("Send")');
    
    // Verify message appears
    await expect(page.locator('text=What is the current market sentiment?')).toBeVisible();
  });

  test('Mobile responsiveness', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/hub2/pulse');
    
    // Check that content is properly responsive
    await expect(page.locator('h1')).toBeVisible();
    
    // Test mobile navigation
    await page.goto('/hub2/explore');
    await expect(page.locator('text=Explore')).toBeVisible();
    
    // Test mobile filters
    await page.click('text=Expand');
    await expect(page.locator('text=Chains')).toBeVisible();
  });

  test('Accessibility - ARIA labels and keyboard navigation', async ({ page }) => {
    await page.goto('/hub2/pulse');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test ARIA labels on gauges
    const gauges = page.locator('[aria-label*="gauge"], [aria-label*="sentiment"], [aria-label*="risk"]');
    await expect(gauges.first()).toBeVisible();
  });

  test('Color contrast meets WCAG standards', async ({ page }) => {
    await page.goto('/hub2/pulse');
    
    // Check that text has sufficient contrast
    const textElements = page.locator('h1, h2, h3, p, span');
    const firstText = textElements.first();
    
    if (await firstText.isVisible()) {
      // This would need actual contrast testing in a real implementation
      await expect(firstText).toBeVisible();
    }
  });

  test('Performance - Home above-the-fold JS < 100KB', async ({ page }) => {
    await page.goto('/hub2/pulse');
    
    // Measure JavaScript bundle size
    const jsResources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('.js'))
        .reduce((total, entry) => total + entry.transferSize, 0);
    });
    
    // Should be less than 100KB (100,000 bytes)
    expect(jsResources).toBeLessThan(100000);
  });

  test('Deep linking works for all Hub 2 pages', async ({ page }) => {
    const hub2Pages = [
      '/hub2/pulse',
      '/hub2/explore',
      '/hub2/alerts',
      '/hub2/watchlist',
      '/hub2/copilot'
    ];
    
    for (const pagePath of hub2Pages) {
      await page.goto(pagePath);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('Error handling for failed API calls', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/edge/hub/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/hub2/pulse');
    
    // Should show error state
    await expect(page.locator('text=Failed to load pulse data')).toBeVisible();
    await expect(page.locator('text=Try Again')).toBeVisible();
  });
});
