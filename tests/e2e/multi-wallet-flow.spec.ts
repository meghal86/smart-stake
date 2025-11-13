/**
 * E2E Tests for Multi-Wallet Flow
 * 
 * Tests the complete multi-wallet experience including:
 * - Connecting multiple wallets
 * - Switching between wallets
 * - Feed personalization per wallet
 * - Eligibility updates per wallet
 * - Mobile wallet selector
 * - Keyboard navigation
 * - Accessibility with screen readers
 * - ENS + label display and restoration
 * 
 * Requirements: 17.1-17.9, 18.1-18.20
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const WALLET_1 = '0x1234567890123456789012345678901234567890';
const WALLET_2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
const WALLET_3 = '0x9876543210987654321098765432109876543210';
const ENS_NAME = 'vitalik.eth';
const ENS_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

// Helper to mock wallet connection
async function mockWalletConnection(page: Page, address: string) {
  await page.evaluate((addr) => {
    window.ethereum = {
      request: async ({ method }: { method: string }) => {
        if (method === 'eth_requestAccounts') {
          return [addr];
        }
        if (method === 'eth_accounts') {
          return [addr];
        }
        return null;
      },
      on: () => {},
      removeListener: () => {},
    };
  }, address);
}

// Helper to mock ENS resolution
async function mockENSResolution(page: Page, address: string, ensName: string) {
  await page.route('**/api/ens/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: ensName, address }),
    });
  });
}

test.describe('Multi-Wallet Flow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Hunter screen
    await page.goto('/hunter');
    
    // Mock API responses
    await page.route('**/api/hunter/opportunities**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              id: '1',
              slug: 'test-airdrop',
              title: 'Test Airdrop',
              protocol: { name: 'TestProtocol', logo: '/test-logo.png' },
              type: 'airdrop',
              chains: ['ethereum'],
              reward: { min: 100, max: 500, currency: 'USD', confidence: 'estimated' },
              trust: { score: 85, level: 'green', last_scanned_ts: new Date().toISOString() },
              difficulty: 'easy',
              featured: false,
              sponsored: false,
              badges: [],
            },
          ],
          cursor: null,
          ts: new Date().toISOString(),
        }),
      });
    });
  });

  test('should connect multiple wallets', async ({ page }) => {
    // Connect first wallet
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    // Wait for wallet selector to appear
    await expect(page.locator('[data-testid="wallet-selector"]')).toBeVisible();
    
    // Verify first wallet is displayed
    await expect(page.locator('[data-testid="wallet-selector"]')).toContainText('0x1234...7890');
    
    // Connect second wallet (simulate adding another wallet)
    await mockWalletConnection(page, WALLET_2);
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_2);
    
    // Open wallet selector dropdown
    await page.click('[data-testid="wallet-selector"]');
    
    // Verify both wallets are in the dropdown
    await expect(page.locator('[data-testid="wallet-option"]')).toHaveCount(2);
    await expect(page.locator(`[data-testid="wallet-option"]:has-text("0x1234...7890")`)).toBeVisible();
    await expect(page.locator(`[data-testid="wallet-option"]:has-text("0xabcd...abcd")`)).toBeVisible();
  });

  test('should switch between wallets', async ({ page }) => {
    // Setup multiple wallets
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    await page.waitForSelector('[data-testid="wallet-selector"]');
    
    // Add second wallet
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_2);
    
    // Open wallet selector
    await page.click('[data-testid="wallet-selector"]');
    
    // Switch to second wallet
    await page.click(`[data-testid="wallet-option"]:has-text("0xabcd...abcd")`);
    
    // Verify active wallet changed
    await expect(page.locator('[data-testid="wallet-selector"]')).toContainText('0xabcd...abcd');
    
    // Verify checkmark on active wallet
    await page.click('[data-testid="wallet-selector"]');
    await expect(page.locator(`[data-testid="wallet-option"]:has-text("0xabcd...abcd") [data-testid="active-indicator"]`)).toBeVisible();
  });

  test('should show feed personalization for each wallet', async ({ page }) => {
    // Connect first wallet
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    // Mock personalized feed for wallet 1
    await page.route('**/api/hunter/opportunities**', async (route) => {
      const url = new URL(route.request().url());
      const wallet = url.searchParams.get('wallet');
      
      const items = wallet === WALLET_1 
        ? [{ id: '1', title: 'Personalized for Wallet 1', type: 'airdrop' }]
        : [{ id: '2', title: 'Personalized for Wallet 2', type: 'quest' }];
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items, cursor: null, ts: new Date().toISOString() }),
      });
    });
    
    // Verify personalized content for wallet 1
    await expect(page.locator('text=Personalized for Wallet 1')).toBeVisible();
    
    // Add and switch to wallet 2
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_2);
    
    await page.click('[data-testid="wallet-selector"]');
    await page.click(`[data-testid="wallet-option"]:has-text("0xabcd...abcd")`);
    
    // Verify personalized content for wallet 2
    await expect(page.locator('text=Personalized for Wallet 2')).toBeVisible();
  });

  test('should update eligibility for each wallet', async ({ page }) => {
    // Connect first wallet
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    // Mock eligibility for wallet 1
    await page.route('**/api/eligibility/preview**', async (route) => {
      const url = new URL(route.request().url());
      const wallet = url.searchParams.get('wallet');
      
      const status = wallet === WALLET_1 ? 'likely' : 'unlikely';
      const reasons = wallet === WALLET_1 
        ? ['Wallet has sufficient transaction history']
        : ['Wallet is too new'];
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status, score: wallet === WALLET_1 ? 0.85 : 0.25, reasons, cached_until: new Date().toISOString() }),
      });
    });
    
    // Verify eligibility for wallet 1
    await expect(page.locator('[data-testid="eligibility-preview"]')).toContainText('Likely Eligible');
    
    // Add and switch to wallet 2
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_2);
    
    await page.click('[data-testid="wallet-selector"]');
    await page.click(`[data-testid="wallet-option"]:has-text("0xabcd...abcd")`);
    
    // Verify eligibility updated for wallet 2
    await expect(page.locator('[data-testid="eligibility-preview"]')).toContainText('Unlikely Eligible');
  });

  test('should display wallet selector correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Connect wallet
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    // Verify wallet selector is visible and responsive
    const selector = page.locator('[data-testid="wallet-selector"]');
    await expect(selector).toBeVisible();
    
    // Verify touch target size (minimum 44px)
    const box = await selector.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    
    // Open dropdown
    await selector.click();
    
    // Verify dropdown is visible and properly positioned
    await expect(page.locator('[data-testid="wallet-dropdown"]')).toBeVisible();
    
    // Verify dropdown items have proper touch targets
    const options = page.locator('[data-testid="wallet-option"]');
    const firstOption = options.first();
    const optionBox = await firstOption.boundingBox();
    expect(optionBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Connect multiple wallets
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_2);
    
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_3);
    
    // Focus on wallet selector using Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs depending on page structure
    
    // Open dropdown with Enter
    await page.keyboard.press('Enter');
    
    // Verify dropdown is open
    await expect(page.locator('[data-testid="wallet-dropdown"]')).toBeVisible();
    
    // Navigate through options with Arrow Down
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    
    // Select with Enter
    await page.keyboard.press('Enter');
    
    // Verify selection changed
    await expect(page.locator('[data-testid="wallet-selector"]')).toContainText('0x9876...3210');
    
    // Test Escape to close dropdown
    await page.keyboard.press('Enter'); // Open again
    await expect(page.locator('[data-testid="wallet-dropdown"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="wallet-dropdown"]')).not.toBeVisible();
  });

  test('should be accessible with screen readers', async ({ page }) => {
    // Connect wallet
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    // Verify ARIA attributes on wallet selector
    const selector = page.locator('[data-testid="wallet-selector"]');
    await expect(selector).toHaveAttribute('role', 'button');
    await expect(selector).toHaveAttribute('aria-haspopup', 'true');
    await expect(selector).toHaveAttribute('aria-expanded', 'false');
    
    // Open dropdown
    await selector.click();
    
    // Verify aria-expanded changed
    await expect(selector).toHaveAttribute('aria-expanded', 'true');
    
    // Verify dropdown has proper ARIA attributes
    const dropdown = page.locator('[data-testid="wallet-dropdown"]');
    await expect(dropdown).toHaveAttribute('role', 'menu');
    
    // Verify wallet options have proper ARIA attributes
    const options = page.locator('[data-testid="wallet-option"]');
    await expect(options.first()).toHaveAttribute('role', 'menuitem');
    
    // Verify active wallet has aria-current
    await expect(page.locator('[data-testid="wallet-option"][aria-current="true"]')).toBeVisible();
    
    // Verify labels are descriptive
    await expect(options.first()).toHaveAttribute('aria-label');
    const ariaLabel = await options.first().getAttribute('aria-label');
    expect(ariaLabel).toContain('0x1234');
  });

  test('should display ENS names when available', async ({ page }) => {
    // Mock ENS resolution
    await mockENSResolution(page, ENS_ADDRESS, ENS_NAME);
    
    // Connect wallet with ENS
    await mockWalletConnection(page, ENS_ADDRESS);
    await page.click('button:has-text("Connect Wallet")');
    
    // Wait for ENS resolution
    await page.waitForTimeout(500);
    
    // Verify ENS name is displayed instead of address
    await expect(page.locator('[data-testid="wallet-selector"]')).toContainText(ENS_NAME);
    
    // Open dropdown to verify full display
    await page.click('[data-testid="wallet-selector"]');
    
    // Verify ENS name in dropdown
    await expect(page.locator('[data-testid="wallet-option"]')).toContainText(ENS_NAME);
    
    // Hover to see full address in tooltip
    await page.hover('[data-testid="wallet-option"]');
    await expect(page.locator('[role="tooltip"]')).toContainText(ENS_ADDRESS);
  });

  test('should display and persist wallet labels', async ({ page }) => {
    // Connect wallet
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    // Mock label API
    await page.route('**/api/wallet-labels**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ labels: { [WALLET_1]: 'My Main Wallet' } }),
        });
      }
    });
    
    // Open wallet selector
    await page.click('[data-testid="wallet-selector"]');
    
    // Click edit label button
    await page.click('[data-testid="edit-label-button"]');
    
    // Enter label
    await page.fill('[data-testid="label-input"]', 'My Main Wallet');
    await page.click('[data-testid="save-label-button"]');
    
    // Verify label is displayed
    await expect(page.locator('[data-testid="wallet-selector"]')).toContainText('My Main Wallet');
    
    // Reload page
    await page.reload();
    
    // Verify label persisted
    await expect(page.locator('[data-testid="wallet-selector"]')).toContainText('My Main Wallet');
  });

  test('should restore last selected wallet on page load', async ({ page }) => {
    // Connect multiple wallets
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_2);
    
    // Switch to second wallet
    await page.click('[data-testid="wallet-selector"]');
    await page.click(`[data-testid="wallet-option"]:has-text("0xabcd...abcd")`);
    
    // Verify second wallet is active
    await expect(page.locator('[data-testid="wallet-selector"]')).toContainText('0xabcd...abcd');
    
    // Reload page
    await page.reload();
    
    // Verify second wallet is still active
    await expect(page.locator('[data-testid="wallet-selector"]')).toContainText('0xabcd...abcd');
  });

  test('should show loading state while switching wallets', async ({ page }) => {
    // Connect multiple wallets
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_2);
    
    // Mock slow API response
    await page.route('**/api/hunter/opportunities**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], cursor: null, ts: new Date().toISOString() }),
      });
    });
    
    // Switch wallet
    await page.click('[data-testid="wallet-selector"]');
    await page.click(`[data-testid="wallet-option"]:has-text("0xabcd...abcd")`);
    
    // Verify loading state is shown
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Wait for loading to complete
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible({ timeout: 5000 });
  });

  test('should handle wallet disconnection gracefully', async ({ page }) => {
    // Connect wallet
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_2);
    
    // Verify both wallets are connected
    await page.click('[data-testid="wallet-selector"]');
    await expect(page.locator('[data-testid="wallet-option"]')).toHaveCount(2);
    
    // Disconnect active wallet
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('wallet-disconnected'));
    });
    
    // Verify fallback to first available wallet
    await expect(page.locator('[data-testid="wallet-selector"]')).toContainText('0x1234...7890');
    
    // Disconnect all wallets
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('wallet-disconnected'));
    });
    
    // Verify Connect Wallet button is shown
    await expect(page.locator('button:has-text("Connect Wallet")')).toBeVisible();
  });

  test('should prevent layout shift when switching wallets', async ({ page }) => {
    // Connect multiple wallets
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_2);
    
    // Get initial position of wallet selector
    const selector = page.locator('[data-testid="wallet-selector"]');
    const initialBox = await selector.boundingBox();
    
    // Switch wallet
    await page.click('[data-testid="wallet-selector"]');
    await page.click(`[data-testid="wallet-option"]:has-text("0xabcd...abcd")`);
    
    // Wait for transition
    await page.waitForTimeout(300);
    
    // Get new position
    const newBox = await selector.boundingBox();
    
    // Verify no significant layout shift (allow 1px tolerance)
    expect(Math.abs((initialBox?.y || 0) - (newBox?.y || 0))).toBeLessThan(2);
    expect(Math.abs((initialBox?.x || 0) - (newBox?.x || 0))).toBeLessThan(2);
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    // Connect wallet
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    // Open dropdown
    await page.click('[data-testid="wallet-selector"]');
    await expect(page.locator('[data-testid="wallet-dropdown"]')).toBeVisible();
    
    // Click outside
    await page.click('body', { position: { x: 10, y: 10 } });
    
    // Verify dropdown closed
    await expect(page.locator('[data-testid="wallet-dropdown"]')).not.toBeVisible();
  });

  test('should display chain icons for each wallet', async ({ page }) => {
    // Connect wallet
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    // Mock wallet with multiple chains
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('wallet-chains-updated', { 
        detail: { chains: ['ethereum', 'polygon', 'arbitrum'] } 
      }));
    });
    
    // Open dropdown
    await page.click('[data-testid="wallet-selector"]');
    
    // Verify chain icons are displayed
    await expect(page.locator('[data-testid="chain-icon-ethereum"]')).toBeVisible();
    await expect(page.locator('[data-testid="chain-icon-polygon"]')).toBeVisible();
    await expect(page.locator('[data-testid="chain-icon-arbitrum"]')).toBeVisible();
  });

  test('should handle ENS resolution failure gracefully', async ({ page }) => {
    // Mock ENS resolution failure
    await page.route('**/api/ens/**', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'ENS name not found' }),
      });
    });
    
    // Connect wallet
    await mockWalletConnection(page, ENS_ADDRESS);
    await page.click('button:has-text("Connect Wallet")');
    
    // Wait for ENS resolution attempt
    await page.waitForTimeout(500);
    
    // Verify fallback to truncated address
    await expect(page.locator('[data-testid="wallet-selector"]')).toContainText('0xd8dA...6045');
  });

  test('should support wallet label editing from dropdown', async ({ page }) => {
    // Connect wallet
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    // Mock label API
    await page.route('**/api/wallet-labels**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    
    // Open dropdown
    await page.click('[data-testid="wallet-selector"]');
    
    // Click edit icon
    await page.click('[data-testid="edit-label-icon"]');
    
    // Verify inline editor appears
    await expect(page.locator('[data-testid="inline-label-editor"]')).toBeVisible();
    
    // Enter label
    await page.fill('[data-testid="inline-label-input"]', 'Trading Wallet');
    await page.keyboard.press('Enter');
    
    // Verify label saved
    await expect(page.locator('[data-testid="wallet-option"]')).toContainText('Trading Wallet');
  });
});

test.describe('Multi-Wallet Flow - Edge Cases', () => {
  test('should handle rapid wallet switching', async ({ page }) => {
    await page.goto('/hunter');
    
    // Connect multiple wallets
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_2);
    
    await page.evaluate((addr) => {
      window.dispatchEvent(new CustomEvent('wallet-connected', { detail: { address: addr } }));
    }, WALLET_3);
    
    // Rapidly switch between wallets
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="wallet-selector"]');
      await page.click('[data-testid="wallet-option"]', { timeout: 1000 });
    }
    
    // Verify no errors occurred
    const errors = await page.locator('[data-testid="error-message"]').count();
    expect(errors).toBe(0);
  });

  test('should handle very long wallet labels', async ({ page }) => {
    await page.goto('/hunter');
    
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    const longLabel = 'A'.repeat(100);
    
    await page.route('**/api/wallet-labels**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ labels: { [WALLET_1]: longLabel } }),
      });
    });
    
    // Verify label is truncated with ellipsis
    const selector = page.locator('[data-testid="wallet-selector"]');
    const text = await selector.textContent();
    expect(text?.length).toBeLessThan(longLabel.length);
    expect(text).toContain('...');
  });

  test('should handle wallet with no transaction history', async ({ page }) => {
    await page.goto('/hunter');
    
    await mockWalletConnection(page, WALLET_1);
    await page.click('button:has-text("Connect Wallet")');
    
    // Mock empty wallet history
    await page.route('**/api/wallet-history/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ transactions: [], chains: [] }),
      });
    });
    
    // Verify appropriate message is shown
    await expect(page.locator('[data-testid="eligibility-preview"]')).toContainText('Unknown');
  });
});
