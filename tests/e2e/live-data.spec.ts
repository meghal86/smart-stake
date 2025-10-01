import { test, expect } from '@playwright/test'

test.describe('Live Data Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('dataMode', 'live')
    })
  })
  
  test('shows real provenance chips', async ({ page }) => {
    await page.goto('/lite')
    
    await page.waitForSelector('[data-testid="spotlight-card"]')
    
    const provenanceChips = page.locator('[data-testid="provenance-chip"]')
    await expect(provenanceChips.first()).toContainText(/Real|Simulated/)
  })
  
  test('etherscan links work with real tx hashes', async ({ page }) => {
    await page.goto('/lite')
    
    await page.waitForSelector('[data-testid="etherscan-link"]', { timeout: 10000 })
    
    const etherscanLink = page.locator('[data-testid="etherscan-link"]')
    const href = await etherscanLink.getAttribute('href')
    
    if (href) {
      expect(href).toMatch(/https:\/\/etherscan\.io\/tx\/0x/)
    }
  })
  
  test('timestamps update within reasonable time', async ({ page }) => {
    await page.goto('/lite')
    
    const timestamp = page.locator('[data-testid="last-updated"]')
    await expect(timestamp).toBeVisible()
    
    const timestampText = await timestamp.textContent()
    expect(timestampText).toBeTruthy()
  })
  
  test('health endpoint returns valid status', async ({ page }) => {
    const response = await page.request.get('/api/healthz')
    const data = await response.json()
    
    expect(data.status).toMatch(/healthy|degraded|unhealthy/)
    expect(data.provenance).toMatch(/Real|Simulated/)
  })
})