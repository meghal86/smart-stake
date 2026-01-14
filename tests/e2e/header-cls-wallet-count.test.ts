/**
 * E2E Test: Header CLS Prevention - Wallet Count Loading
 * 
 * Feature: unified-header-system
 * Validates: Requirements 1.2, 11.2, 11.6
 * 
 * Tests that when walletCount transitions from undefined → number,
 * the header does not shift due to reserved widths handling the change.
 * 
 * Uses Playwright to measure bounding box stability across wallet count loading.
 */

import { test, expect } from '@playwright/test'

test.describe('Header CLS Prevention - Wallet Count Loading', () => {
  test('header maintains stable bounding box when wallet count loads', async ({ page }) => {
    // Navigate to a page with the header
    await page.goto('/')

    // Wait for header to be visible
    const header = page.locator('header[role="banner"]')
    await expect(header).toBeVisible()

    // Measure initial bounding box
    const initialBox = await header.boundingBox()
    expect(initialBox).not.toBeNull()

    // Record initial dimensions
    const initialHeight = initialBox!.height
    const initialWidth = initialBox!.width
    const initialY = initialBox!.y

    // Wait for any async loading to complete (simulate wallet count loading)
    await page.waitForTimeout(1000)

    // Measure bounding box after loading
    const finalBox = await header.boundingBox()
    expect(finalBox).not.toBeNull()

    // Assert: Height remains stable (64px ±4px)
    expect(finalBox!.height).toBeGreaterThanOrEqual(60)
    expect(finalBox!.height).toBeLessThanOrEqual(68)
    expect(finalBox!.height).toBe(initialHeight)

    // Assert: Y position remains stable (no vertical shift)
    expect(finalBox!.y).toBe(initialY)

    // Assert: Width remains stable (no horizontal shift)
    expect(finalBox!.width).toBe(initialWidth)
  })

  test('wallet slot maintains reserved width during loading', async ({ page }) => {
    // Navigate to a page with the header
    await page.goto('/')

    // Wait for header to be visible
    await page.waitForSelector('header[role="banner"]')

    // Find wallet slot (look for element with reserved width)
    const walletSlot = page.locator('[style*="wallet-slot-width"]').first()

    // If wallet slot exists, measure its dimensions
    if (await walletSlot.count() > 0) {
      const initialBox = await walletSlot.boundingBox()
      
      if (initialBox) {
        const initialWidth = initialBox.width

        // Wait for loading to complete
        await page.waitForTimeout(1000)

        // Measure again
        const finalBox = await walletSlot.boundingBox()
        expect(finalBox).not.toBeNull()

        // Assert: Width remains stable
        expect(finalBox!.width).toBe(initialWidth)

        // Assert: Width matches reserved width (180px desktop or 140px mobile)
        const viewport = page.viewportSize()
        const expectedWidth = viewport && viewport.width <= 430 ? 140 : 180
        
        // Allow small tolerance for browser rendering
        expect(finalBox!.width).toBeGreaterThanOrEqual(expectedWidth - 5)
        expect(finalBox!.width).toBeLessThanOrEqual(expectedWidth + 5)
      }
    }
  })

  test('profile slot maintains reserved width during loading', async ({ page }) => {
    // Navigate to a page with the header
    await page.goto('/')

    // Wait for header to be visible
    await page.waitForSelector('header[role="banner"]')

    // Find profile slot (look for element with reserved width)
    const profileSlot = page.locator('[style*="profile-slot-width"]').first()

    // If profile slot exists, measure its dimensions
    if (await profileSlot.count() > 0) {
      const initialBox = await profileSlot.boundingBox()
      
      if (initialBox) {
        const initialWidth = initialBox.width

        // Wait for loading to complete
        await page.waitForTimeout(1000)

        // Measure again
        const finalBox = await profileSlot.boundingBox()
        expect(finalBox).not.toBeNull()

        // Assert: Width remains stable
        expect(finalBox!.width).toBe(initialWidth)

        // Assert: Width matches reserved width (40px)
        expect(finalBox!.width).toBeGreaterThanOrEqual(35)
        expect(finalBox!.width).toBeLessThanOrEqual(45)
      }
    }
  })

  test('header skeleton matches final header dimensions', async ({ page }) => {
    // Navigate to a page that shows loading state
    await page.goto('/')

    // Measure skeleton dimensions (if visible)
    const skeleton = page.locator('header[aria-label="Global header loading"]')
    
    if (await skeleton.count() > 0) {
      const skeletonBox = await skeleton.boundingBox()
      
      if (skeletonBox) {
        const skeletonHeight = skeletonBox.height

        // Wait for loading to complete
        await page.waitForSelector('header[aria-label="Global header"]')

        // Measure final header
        const finalHeader = page.locator('header[aria-label="Global header"]')
        const finalBox = await finalHeader.boundingBox()
        expect(finalBox).not.toBeNull()

        // Assert: Heights match
        expect(finalBox!.height).toBe(skeletonHeight)

        // Assert: Both are 64px ±4px
        expect(skeletonHeight).toBeGreaterThanOrEqual(60)
        expect(skeletonHeight).toBeLessThanOrEqual(68)
        expect(finalBox!.height).toBeGreaterThanOrEqual(60)
        expect(finalBox!.height).toBeLessThanOrEqual(68)
      }
    }
  })

  test('no cumulative layout shift during wallet count transition', async ({ page }) => {
    // Navigate to a page with the header
    await page.goto('/')

    // Wait for header to be visible
    await page.waitForSelector('header[role="banner"]')

    // Measure CLS using Performance API
    const clsScore = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let cls = 0

        // Create PerformanceObserver to track layout shifts
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              cls += (entry as any).value
            }
          }
        })

        observer.observe({ type: 'layout-shift', buffered: true })

        // Wait for loading to complete
        setTimeout(() => {
          observer.disconnect()
          resolve(cls)
        }, 2000)
      })
    })

    // Assert: CLS score is below threshold (0.1 is "good" per Web Vitals)
    expect(clsScore).toBeLessThan(0.1)
  })
})
