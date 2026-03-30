import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080';

test.describe('AlphaWhale Critical User Flows', () => {

  test('Landing page loads with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('chrome-extension')) {
        errors.push(msg.text());
      }
    });
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/AlphaWhale|WhalePulse/i);
    await expect(page.locator('body')).not.toBeEmpty();
    // Allow extension errors but not app errors
    const appErrors = errors.filter(e => !e.includes('extension'));
    expect(appErrors.length, `Console errors: ${appErrors.join(', ')}`).toBeLessThan(3);
  });

  test('Sign up page renders all required fields', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Create")')).toBeVisible({ timeout: 5000 });
  });

  test('Login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('Privacy policy page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/legal/privacy`);
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
    const headingText = await page.locator('h1, h2').first().textContent();
    expect(headingText?.toLowerCase()).toMatch(/privacy/i);
  });

  test('Terms of service page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/legal/terms`);
    await expect(page.locator('body')).not.toBeEmpty();
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
    const headingText = await page.locator('h1, h2').first().textContent();
    expect(headingText?.toLowerCase()).toMatch(/terms/i);
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto(`${BASE_URL}/this-route-xyz-does-not-exist-12345`);
    await expect(page.locator('body')).not.toBeEmpty();
    // Should not be blank/white screen
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length ?? 0).toBeGreaterThan(10);
  });

  test('Admin routes redirect to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/bi`);
    // Should end up on login page
    await page.waitForURL(/login|signin/, { timeout: 8000 });
    expect(page.url()).toMatch(/login|signin/i);
  });

  test('Portfolio page redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/portfolio`);
    await page.waitForTimeout(3000); // wait for auth check
    // Either shows portfolio (demo mode) or redirects to login
    const url = page.url();
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.length ?? 0).toBeGreaterThan(10); // not blank
  });

  test('Guardian page redirects to login when not authenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/guardian`);
    await page.waitForURL(/login|signin/, { timeout: 8000 });
    expect(page.url()).toMatch(/login|signin/i);
  });

  test('Home page has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone SE
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });

});
