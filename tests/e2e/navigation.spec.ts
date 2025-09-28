import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('mobile footer navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    const pages = [
      { path: '/hub', name: 'Hub' },
      { path: '/portfolio', name: 'Portfolio' },
      { path: '/reports', name: 'Reports' },
      { path: '/settings', name: 'Settings' }
    ]

    for (const { path, name } of pages) {
      await page.goto(path)
      await expect(page.getByRole('link', { name })).toBeVisible()
      
      // Test navigation to other pages
      const otherPages = pages.filter(p => p.path !== path)
      for (const otherPage of otherPages) {
        await page.getByRole('link', { name: otherPage.name }).click()
        await expect(page).toHaveURL(otherPage.path)
      }
    }
  })

  test('desktop sidebar navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    
    const pages = [
      { path: '/hub', name: 'Hub' },
      { path: '/portfolio', name: 'Portfolio' },
      { path: '/reports', name: 'Reports' },
      { path: '/settings', name: 'Settings' }
    ]

    for (const { path, name } of pages) {
      await page.goto(path)
      await expect(page.getByRole('link', { name })).toBeVisible()
      
      // Test navigation to other pages
      const otherPages = pages.filter(p => p.path !== path)
      for (const otherPage of otherPages) {
        await page.getByRole('link', { name: otherPage.name }).click()
        await expect(page).toHaveURL(otherPage.path)
      }
    }
  })

  test('active page is highlighted', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    
    await page.goto('/hub')
    const hubLink = page.getByRole('link', { name: 'Hub' })
    await expect(hubLink).toHaveClass(/bg-primary/)
    
    await page.goto('/portfolio')
    const portfolioLink = page.getByRole('link', { name: 'Portfolio' })
    await expect(portfolioLink).toHaveClass(/bg-primary/)
  })
})
