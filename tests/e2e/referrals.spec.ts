import { test, expect } from '@playwright/test';

test.describe('Referrals Page', () => {
  test('should render referrals page with invite form', async ({ page }) => {
    await page.goto('/referrals');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Invite Friends');
    
    // Check progress card
    const progressCard = page.locator('.bg-gradient-to-r');
    await expect(progressCard).toBeVisible();
    await expect(progressCard).toContainText('0/3 friends invited');
    
    // Check invite form
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    
    const sendButton = page.locator('button:has-text("Send Invite")');
    await expect(sendButton).toBeVisible();
  });

  test('should handle invite form submission', async ({ page }) => {
    await page.goto('/referrals');
    
    // Fill and submit form
    await page.fill('input[type="email"]', 'friend@example.com');
    await page.click('button:has-text("Send Invite")');
    
    // Should show success message
    await expect(page.locator('text=Invite sent')).toBeVisible({ timeout: 5000 });
    
    // Progress should update
    await expect(page.locator('text=1/3 friends invited')).toBeVisible();
  });

  test('should copy invite link', async ({ page }) => {
    await page.goto('/referrals');
    
    // Mock clipboard API
    await page.addInitScript(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: (text: string) => Promise.resolve()
        }
      });
    });
    
    const copyButton = page.locator('button:has-text("Copy")');
    await copyButton.click();
    
    // Should show success message
    await expect(page.locator('text=copied')).toBeVisible({ timeout: 3000 });
  });

  test('should show social share buttons', async ({ page }) => {
    await page.goto('/referrals');
    
    const twitterButton = page.locator('button:has-text("Twitter")');
    await expect(twitterButton).toBeVisible();
    
    const discordButton = page.locator('button:has-text("Discord")');
    await expect(discordButton).toBeVisible();
  });

  test('should show congratulations when target reached', async ({ page }) => {
    await page.goto('/referrals');
    
    // Simulate sending 3 invites
    for (let i = 0; i < 3; i++) {
      await page.fill('input[type="email"]', `friend${i}@example.com`);
      await page.click('button:has-text("Send Invite")');
      await page.waitForTimeout(1100); // Wait for animation
    }
    
    // Should show congratulations
    await expect(page.locator('text=Congratulations')).toBeVisible();
    await expect(page.locator('text=7 days Pro')).toBeVisible();
  });
});