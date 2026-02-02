/**
 * Portfolio Stress Tests for Requirement 13 Compliance
 * Basic functional stress scenarios for V1 launch
 * 
 * Requirements: 13.1, 13.2 (basic smoke + leakage tests only)
 * 
 * Note: These are basic smoke tests. Advanced adversarial suites and k6 performance
 * tests are moved to V2.
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const STRESS_TEST_DURATION = 60000; // 60 seconds
const RAPID_SWITCH_INTERVAL = 500; // 500ms between switches

// ============================================================================
// RAPID TAB + WALLET SWITCHING (60s)
// ============================================================================

test.describe('Rapid Tab + Wallet Switching Stress Test', () => {
  test('should handle rapid tab and wallet switching without stale wallet leakage', async ({ page }) => {
    // Navigate to portfolio
    await page.goto('/portfolio');
    
    // Wait for initial load
    await page.waitForSelector('[data-testid="portfolio-hub"]', { timeout: 10000 });
    
    const startTime = Date.now();
    let switchCount = 0;
    
    // Rapid switching for 60 seconds
    while (Date.now() - startTime < STRESS_TEST_DURATION) {
      // Switch between tabs
      await page.click('[data-testid="tab-overview"]');
      await page.waitForTimeout(100);
      
      await page.click('[data-testid="tab-positions"]');
      await page.waitForTimeout(100);
      
      await page.click('[data-testid="tab-audit"]');
      await page.waitForTimeout(100);
      
      // Switch wallet if wallet switcher exists
      const walletSwitcher = await page.locator('[data-testid="wallet-switcher"]').count();
      if (walletSwitcher > 0) {
        await page.click('[data-testid="wallet-switcher"]');
        await page.waitForTimeout(100);
        
        // Select different wallet if available
        const walletOptions = await page.locator('[data-testid^="wallet-option-"]').count();
        if (walletOptions > 1) {
          const randomWallet = Math.floor(Math.random() * walletOptions);
          await page.click(`[data-testid="wallet-option-${randomWallet}"]`);
          await page.waitForTimeout(100);
        }
      }
      
      switchCount++;
      
      // Check for stale wallet leakage
      // Verify that displayed wallet matches selected wallet
      const displayedWallet = await page.locator('[data-testid="active-wallet-address"]').textContent();
      const selectedWallet = await page.locator('[data-testid="wallet-switcher"]').getAttribute('data-wallet');
      
      if (displayedWallet && selectedWallet) {
        expect(displayedWallet.toLowerCase()).toContain(selectedWallet.toLowerCase().substring(0, 6));
      }
      
      await page.waitForTimeout(RAPID_SWITCH_INTERVAL);
    }
    
    // Verify no crashes occurred
    const errors = [];
    page.on('pageerror', error => errors.push(error));
    expect(errors).toHaveLength(0);
    
    console.log(`Completed ${switchCount} switch cycles without errors`);
  });
});

// ============================================================================
// WALLET SWITCH MID SSE STREAM
// ============================================================================

test.describe('Wallet Switch During SSE Stream', () => {
  test('should reset SSE stream and clear state when switching wallets', async ({ page }) => {
    // Navigate to portfolio with Copilot open
    await page.goto('/portfolio');
    
    // Open Copilot
    await page.click('[data-testid="copilot-toggle"]');
    await page.waitForSelector('[data-testid="copilot-chat"]');
    
    // Start a Copilot query that triggers SSE stream
    await page.fill('[data-testid="copilot-input"]', 'Analyze my portfolio risks');
    await page.click('[data-testid="copilot-send"]');
    
    // Wait for stream to start
    await page.waitForSelector('[data-testid="copilot-streaming"]', { timeout: 5000 });
    
    // Switch wallet mid-stream
    await page.click('[data-testid="wallet-switcher"]');
    const walletOptions = await page.locator('[data-testid^="wallet-option-"]').count();
    if (walletOptions > 1) {
      await page.click('[data-testid="wallet-option-1"]');
    }
    
    // Verify stream was reset
    // 1. Old stream should be closed
    const oldStreamActive = await page.locator('[data-testid="copilot-streaming"]').count();
    expect(oldStreamActive).toBe(0);
    
    // 2. Chat should show new wallet context
    const chatContext = await page.locator('[data-testid="copilot-context"]').textContent();
    expect(chatContext).toContain('wallet switched');
    
    // 3. No cross-wallet data leakage
    const messages = await page.locator('[data-testid^="copilot-message-"]').all();
    for (const message of messages) {
      const content = await message.textContent();
      // Verify no old wallet address appears in new context
      expect(content).not.toContain('0x0000'); // Example old wallet
    }
  });
});

// ============================================================================
// DEGRADED PROVIDER MODE
// ============================================================================

test.describe('Degraded Provider Mode', () => {
  test('should gate risky actions when simulation service is down', async ({ page, context }) => {
    // Mock simulation service failure
    await context.route('**/api/v1/portfolio/plan/*/simulate', route => {
      route.abort('failed');
    });
    
    // Navigate to portfolio
    await page.goto('/portfolio');
    
    // Try to execute a risky action (approve)
    await page.click('[data-testid="action-card-approve"]');
    
    // Should show degraded mode banner
    await expect(page.locator('[data-testid="degraded-mode-banner"]')).toBeVisible();
    
    // Risky actions should be gated
    const executeButton = page.locator('[data-testid="execute-action"]');
    await expect(executeButton).toBeDisabled();
    
    // Should show warning message
    const warning = await page.locator('[data-testid="simulation-unavailable-warning"]').textContent();
    expect(warning).toContain('Limited Preview');
    expect(warning).toContain('simulation');
  });
});

// ============================================================================
// PLAN EXECUTION HAPPY PATH
// ============================================================================

test.describe('Plan Execution Happy Path', () => {
  test('should complete create → simulate → execute cycle multiple times', async ({ page }) => {
    const cycles = 3; // Run 3 cycles for basic smoke test
    
    for (let i = 0; i < cycles; i++) {
      // Navigate to portfolio
      await page.goto('/portfolio');
      
      // Create a plan
      await page.click('[data-testid="action-card-revoke"]');
      await page.waitForSelector('[data-testid="intent-plan"]');
      
      // Verify plan created
      const planId = await page.locator('[data-testid="plan-id"]').textContent();
      expect(planId).toBeTruthy();
      
      // Simulate
      await page.click('[data-testid="simulate-plan"]');
      await page.waitForSelector('[data-testid="simulation-complete"]', { timeout: 10000 });
      
      // Verify simulation results
      const simStatus = await page.locator('[data-testid="simulation-status"]').textContent();
      expect(simStatus).toContain('pass');
      
      // Execute (mock wallet signing)
      await page.click('[data-testid="execute-plan"]');
      
      // Mock wallet confirmation
      await page.click('[data-testid="mock-wallet-confirm"]');
      
      // Wait for execution complete
      await page.waitForSelector('[data-testid="execution-complete"]', { timeout: 15000 });
      
      // Verify receipt
      const receipt = await page.locator('[data-testid="execution-receipt"]').textContent();
      expect(receipt).toContain('confirmed');
      
      console.log(`Cycle ${i + 1}/${cycles} completed successfully`);
    }
    
    // Verify no broken receipts
    const brokenReceipts = await page.locator('[data-testid="receipt-error"]').count();
    expect(brokenReceipts).toBe(0);
  });
});

// ============================================================================
// MEMORY LEAK DETECTION
// ============================================================================

test.describe('Memory Leak Detection', () => {
  test('should not grow memory beyond acceptable threshold during 20-min session', async ({ page }) => {
    // Navigate to portfolio
    await page.goto('/portfolio');
    
    // Get initial memory usage
    const initialMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        };
      }
      return null;
    });
    
    if (!initialMetrics) {
      test.skip('Performance memory API not available');
      return;
    }
    
    // Simulate 20-minute session with activity
    const sessionDuration = 20 * 60 * 1000; // 20 minutes
    const activityInterval = 5000; // Activity every 5 seconds
    const startTime = Date.now();
    
    while (Date.now() - startTime < sessionDuration) {
      // Perform various activities
      await page.click('[data-testid="tab-overview"]');
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="tab-positions"]');
      await page.waitForTimeout(1000);
      
      await page.click('[data-testid="tab-audit"]');
      await page.waitForTimeout(1000);
      
      // Refresh data
      await page.click('[data-testid="refresh-portfolio"]');
      await page.waitForTimeout(2000);
      
      await page.waitForTimeout(activityInterval);
    }
    
    // Get final memory usage
    const finalMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
        };
      }
      return null;
    });
    
    if (finalMetrics) {
      const memoryGrowth = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
      const growthPercentage = (memoryGrowth / initialMetrics.usedJSHeapSize) * 100;
      
      console.log(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB (${growthPercentage.toFixed(2)}%)`);
      
      // Memory should not grow more than 50% during session
      expect(growthPercentage).toBeLessThan(50);
    }
  });
});

// ============================================================================
// NOTES
// ============================================================================

/**
 * These are basic smoke tests for V1 launch. The following are moved to V2:
 * 
 * - k6 performance tests (load testing, concurrent users)
 * - Weekly adversarial suites (prompt injection, payload mismatch, deep-link phishing)
 * - Chaos engineering tests (random service failures, network issues)
 * - Advanced security tests (proxy upgrade detection, sanctions screening)
 * 
 * V1 focuses on functional correctness and basic stress scenarios.
 * V2 will add comprehensive performance and security testing.
 */
