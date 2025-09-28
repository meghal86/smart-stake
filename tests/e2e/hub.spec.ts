import { test, expect } from '@playwright/test'

test.describe('Hub Page', () => {
  test('renders all main cards', async ({ page }) => {
    await page.goto('/hub')
    
    // Check for main cards
    await expect(page.getByText('Daily Whale Digest')).toBeVisible()
    await expect(page.getByText('Whale Index')).toBeVisible()
    await expect(page.getByText('Token Unlock Calendar')).toBeVisible()
    await expect(page.getByText('Daily Streak')).toBeVisible()
  })

  test('shows upgrade banner for LITE users', async ({ page }) => {
    await page.goto('/hub')
    
    await expect(page.getByText('Unlock Pro Features')).toBeVisible()
    await expect(page.getByText('Upgrade Now')).toBeVisible()
  })

  test('mobile navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/hub')
    
    // Check mobile footer nav is visible
    await expect(page.locator('nav').filter({ hasText: 'Hub' })).toBeVisible()
    
    // Test navigation
    await page.getByRole('link', { name: 'Portfolio' }).click()
    await expect(page).toHaveURL('/portfolio')
  })

  test('desktop sidebar navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/hub')
    
    // Check sidebar is visible
    await expect(page.getByText('AlphaWhale')).toBeVisible()
    
    // Test navigation
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL('/settings')
  })

  test('responsive layout adapts correctly', async ({ page }) => {
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/hub')
    
    // Cards should stack vertically on mobile
    const cards = page.locator('[class*="grid"]')
    await expect(cards).toHaveCount(2) // Two grid containers
    
    // Test desktop layout
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.reload()
    
    // Should have sidebar
    await expect(page.locator('aside')).toBeVisible()
  })
})
