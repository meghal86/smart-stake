import { test, expect } from '@playwright/test';

test('landing → lite navigation', async ({ page }) => {
  await page.goto('http://localhost:3000/?tier=lite');
  await expect(page.getByText(/AlphaWhale Lite/)).toBeVisible();
  await page.getByRole('link', { name: /Open Lite App|Continue/ }).click();
  await expect(page).toHaveURL(/\/lite/);
  await expect(page.getByText(/Whale Spotlight|Daily Whale Digest|Fear & Whale Index/)).toBeVisible();
});

test('tier gating redirect', async ({ page }) => {
  await page.goto('http://localhost:3000/pro?tier=lite');
  await expect(page).toHaveURL(/\/upgrade/);
});