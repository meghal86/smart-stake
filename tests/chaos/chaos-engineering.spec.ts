/**
 * Chaos Engineering Tests
 * 
 * Tests system resilience under various failure conditions
 * Requirements: 13.3 (advanced adversarial), 10.2, 10.6
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const CHAOS_SCENARIOS = [
  {
    name: 'Random API Failures',
    failureRate: 0.3, // 30% of requests fail
    duration: 60000, // 60 seconds
  },
  {
    name: 'Intermittent Network Issues',
    failureRate: 0.5, // 50% of requests fail
    duration: 30000, // 30 seconds
  },
  {
    name: 'Slow API Responses',
    delayMs: 5000, // 5 second delay
    duration: 45000, // 45 seconds
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function injectRandomFailures(page: any, failureRate: number, duration: number) {
  const startTime = Date.now();
  
  await page.route('**/api/v1/portfolio/**', async (route: any) => {
    if (Date.now() - startTime > duration) {
      // Stop injecting failures after duration
      await route.continue();
      return;
    }
    
    if (Math.random() < failureRate) {
      // Randomly fail request
      await route.abort('failed');
    } else {
      await route.continue();
    }
  });
}

async function injectSlowResponses(page: any, delayMs: number, duration: number) {
  const startTime = Date.now();
  
  await page.route('**/api/v1/portfolio/**', async (route: any) => {
    if (Date.now() - startTime > duration) {
      await route.continue();
      return;
    }
    
    // Add delay before responding
    await new Promise(resolve => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

async function injectServiceOutage(page: any, service: string, duration: number) {
  const startTime = Date.now();
  
  await page.route(`**/${service}/**`, async (route: any) => {
    if (Date.now() - startTime > duration) {
      await route.continue();
      return;
    }
    
    // Service is down
    await route.abort('failed');
  });
}

async function checkSystemStability(page: any) {
  // Check for crashes
  const errors: any[] = [];
  page.on('pageerror', error => errors.push(error));
  
  // Check for UI responsiveness
  const isResponsive = await page.locator('[data-testid="portfolio-hub"]').isVisible();
  
  // Check for error boundaries
  const errorBoundary = await page.locator('[data-testid="error-boundary"]').count();
  
  return {
    noCrashes: errors.length === 0,
    isResponsive,
    hasErrorBoundary: errorBoundary > 0,
  };
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('Random API Failures', () => {
  test('should remain stable with 30% API failure rate', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Inject random failures
    await injectRandomFailures(page, 0.3, 60000);
    
    // Perform various actions during chaos
    const startTime = Date.now();
    let actionCount = 0;
    
    while (Date.now() - startTime < 60000) {
      // Switch tabs
      await page.click('[data-testid="tab-overview"]').catch(() => {});
      await page.waitForTimeout(500);
      
      await page.click('[data-testid="tab-positions"]').catch(() => {});
      await page.waitForTimeout(500);
      
      await page.click('[data-testid="tab-audit"]').catch(() => {});
      await page.waitForTimeout(500);
      
      // Refresh data
      await page.click('[data-testid="refresh-portfolio"]').catch(() => {});
      await page.waitForTimeout(1000);
      
      actionCount++;
    }
    
    // Check system stability
    const stability = await checkSystemStability(page);
    
    expect(stability.noCrashes).toBe(true);
    expect(stability.isResponsive).toBe(true);
    
    console.log(`Completed ${actionCount} actions during chaos`);
  });
});

test.describe('Service Outages', () => {
  test('should handle Guardian service outage gracefully', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Simulate Guardian service down
    await injectServiceOutage(page, 'guardian', 30000);
    
    // Try to view approvals (requires Guardian)
    await page.click('[data-testid="tab-audit"]');
    await page.waitForTimeout(2000);
    
    // Should show degraded mode banner
    const degradedBanner = await page.locator('[data-testid="degraded-mode-banner"]').count();
    expect(degradedBanner).toBeGreaterThan(0);
    
    // Should show cached data if available
    const cachedDataIndicator = await page.locator('[data-testid="cached-data-indicator"]').count();
    expect(cachedDataIndicator).toBeGreaterThan(0);
    
    // Should not crash
    const stability = await checkSystemStability(page);
    expect(stability.noCrashes).toBe(true);
  });
  
  test('should handle simulation service outage', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Simulate simulation service down
    await page.route('**/api/v1/portfolio/plan/*/simulate', async (route: any) => {
      await route.abort('failed');
    });
    
    // Try to create and simulate a plan
    await page.click('[data-testid="action-card-approve"]');
    await page.waitForSelector('[data-testid="intent-plan"]');
    
    await page.click('[data-testid="simulate-plan"]');
    await page.waitForTimeout(2000);
    
    // Should show "Limited Preview" banner
    const limitedPreview = await page.locator('[data-testid="limited-preview-banner"]').count();
    expect(limitedPreview).toBeGreaterThan(0);
    
    // Should gate risky actions
    const executeButton = page.locator('[data-testid="execute-action"]');
    await expect(executeButton).toBeDisabled();
  });
  
  test('should handle multiple simultaneous service outages', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Simulate multiple services down
    await injectServiceOutage(page, 'guardian', 30000);
    await injectServiceOutage(page, 'hunter', 30000);
    await page.route('**/api/v1/portfolio/plan/*/simulate', async (route: any) => {
      await route.abort('failed');
    });
    
    // System should still be usable
    await page.click('[data-testid="tab-overview"]');
    await page.waitForTimeout(1000);
    
    // Should show comprehensive degraded mode message
    const degradedMessage = await page.locator('[data-testid="degraded-mode-banner"]').textContent();
    expect(degradedMessage).toContain('limited');
    expect(degradedMessage).toContain('functionality');
    
    // Should not crash
    const stability = await checkSystemStability(page);
    expect(stability.noCrashes).toBe(true);
    expect(stability.isResponsive).toBe(true);
  });
});

test.describe('Network Instability', () => {
  test('should handle intermittent network issues', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Inject intermittent failures
    await injectRandomFailures(page, 0.5, 30000);
    
    // Perform actions
    for (let i = 0; i < 10; i++) {
      await page.click('[data-testid="refresh-portfolio"]').catch(() => {});
      await page.waitForTimeout(3000);
    }
    
    // Should show retry options
    const retryButton = await page.locator('[data-testid="retry-button"]').count();
    expect(retryButton).toBeGreaterThan(0);
    
    // Should not crash
    const stability = await checkSystemStability(page);
    expect(stability.noCrashes).toBe(true);
  });
  
  test('should handle slow API responses', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Inject slow responses
    await injectSlowResponses(page, 5000, 45000);
    
    // Try to load data
    await page.click('[data-testid="refresh-portfolio"]');
    
    // Should show loading state
    const loadingIndicator = await page.locator('[data-testid="loading-skeleton"]').count();
    expect(loadingIndicator).toBeGreaterThan(0);
    
    // Should eventually load or timeout gracefully
    await page.waitForTimeout(10000);
    
    const stability = await checkSystemStability(page);
    expect(stability.noCrashes).toBe(true);
  });
});

test.describe('Cache Resilience', () => {
  test('should serve cached data during outages', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Load data normally first
    await page.waitForSelector('[data-testid="portfolio-hub"]');
    await page.waitForTimeout(2000);
    
    // Get initial data
    const initialNetWorth = await page.locator('[data-testid="net-worth"]').textContent();
    
    // Simulate complete API outage
    await page.route('**/api/v1/portfolio/**', async (route: any) => {
      await route.abort('failed');
    });
    
    // Refresh page
    await page.reload();
    await page.waitForSelector('[data-testid="portfolio-hub"]');
    
    // Should show cached data
    const cachedNetWorth = await page.locator('[data-testid="net-worth"]').textContent();
    expect(cachedNetWorth).toBe(initialNetWorth);
    
    // Should indicate data is cached
    const cachedIndicator = await page.locator('[data-testid="cached-data-indicator"]').count();
    expect(cachedIndicator).toBeGreaterThan(0);
  });
  
  test('should invalidate cache on wallet switch during outage', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Load data for wallet 1
    await page.waitForSelector('[data-testid="portfolio-hub"]');
    const wallet1Data = await page.locator('[data-testid="net-worth"]').textContent();
    
    // Simulate API outage
    await page.route('**/api/v1/portfolio/**', async (route: any) => {
      await route.abort('failed');
    });
    
    // Switch wallet
    await page.click('[data-testid="wallet-switcher"]');
    const walletOptions = await page.locator('[data-testid^="wallet-option-"]').count();
    if (walletOptions > 1) {
      await page.click('[data-testid="wallet-option-1"]');
      await page.waitForTimeout(1000);
      
      // Should show loading or error, not stale data from wallet 1
      const currentData = await page.locator('[data-testid="net-worth"]').textContent();
      expect(currentData).not.toBe(wallet1Data);
    }
  });
});

test.describe('Recovery and Retry', () => {
  test('should automatically retry failed requests', async ({ page }) => {
    let requestCount = 0;
    
    await page.route('**/api/v1/portfolio/snapshot*', async (route: any) => {
      requestCount++;
      
      if (requestCount < 3) {
        // Fail first 2 attempts
        await route.abort('failed');
      } else {
        // Succeed on 3rd attempt
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              apiVersion: 'v1',
              netWorth: 10000,
              delta24h: 100,
              freshness: {
                freshnessSec: 10,
                confidence: 0.95,
                confidenceThreshold: 0.70,
                degraded: false,
              },
            },
          }),
        });
      }
    });
    
    await page.goto('/portfolio');
    
    // Should eventually succeed after retries
    await page.waitForSelector('[data-testid="net-worth"]', { timeout: 15000 });
    
    const netWorth = await page.locator('[data-testid="net-worth"]').textContent();
    expect(netWorth).toContain('10000');
    
    // Should have retried at least twice
    expect(requestCount).toBeGreaterThanOrEqual(3);
  });
  
  test('should recover gracefully after service restoration', async ({ page }) => {
    await page.goto('/portfolio');
    
    let serviceDown = true;
    
    // Simulate service outage then restoration
    await page.route('**/api/v1/portfolio/**', async (route: any) => {
      if (serviceDown) {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });
    
    // Wait for degraded mode
    await page.waitForTimeout(2000);
    
    // Restore service
    serviceDown = false;
    
    // Trigger refresh
    await page.click('[data-testid="refresh-portfolio"]');
    await page.waitForTimeout(2000);
    
    // Should exit degraded mode
    const degradedBanner = await page.locator('[data-testid="degraded-mode-banner"]').count();
    expect(degradedBanner).toBe(0);
    
    // Should show fresh data
    const freshIndicator = await page.locator('[data-testid="fresh-data-indicator"]').count();
    expect(freshIndicator).toBeGreaterThan(0);
  });
});

test.describe('Error Boundary Protection', () => {
  test('should catch and display component errors', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Inject error in component
    await page.evaluate(() => {
      // Simulate component error
      const event = new ErrorEvent('error', {
        error: new Error('Component render error'),
        message: 'Component render error',
      });
      window.dispatchEvent(event);
    });
    
    await page.waitForTimeout(1000);
    
    // Should show error boundary
    const errorBoundary = await page.locator('[data-testid="error-boundary"]').count();
    expect(errorBoundary).toBeGreaterThan(0);
    
    // Should offer recovery options
    const reloadButton = page.locator('[data-testid="reload-component"]');
    await expect(reloadButton).toBeVisible();
  });
});
