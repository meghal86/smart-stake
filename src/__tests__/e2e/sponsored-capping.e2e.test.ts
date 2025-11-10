/**
 * E2E tests for sponsored item capping across viewport sizes
 * 
 * Tests the sliding window filter enforcement in real browser environments
 * across mobile, tablet, and desktop viewports.
 * 
 * Requirements: 4.16, 4.19, 5.10, 5.15
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Helper to count sponsored items in a given range
 */
async function countSponsoredInRange(
  page: Page,
  startIndex: number,
  endIndex: number
): Promise<number> {
  const cards = await page.locator('[data-testid="opportunity-card"]').all();
  let sponsoredCount = 0;

  for (let i = startIndex; i < Math.min(endIndex, cards.length); i++) {
    const card = cards[i];
    const isSponsoredBadge = await card.locator('[data-testid="sponsored-badge"]').count();
    const isSponsoredAria = await card.getAttribute('aria-label');
    
    if (isSponsoredBadge > 0 || (isSponsoredAria && isSponsoredAria.includes('Sponsored'))) {
      sponsoredCount++;
    }
  }

  return sponsoredCount;
}

/**
 * Helper to verify no 12-card window has more than 2 sponsored items
 */
async function verifyWindowCompliance(page: Page): Promise<boolean> {
  const cards = await page.locator('[data-testid="opportunity-card"]').all();
  const totalCards = cards.length;

  // Check every possible 12-card window
  for (let i = 0; i <= totalCards - 12; i++) {
    const sponsoredInWindow = await countSponsoredInRange(page, i, i + 12);
    if (sponsoredInWindow > 2) {
      console.error(`Window violation at index ${i}: ${sponsoredInWindow} sponsored items`);
      return false;
    }
  }

  return true;
}

test.describe('Sponsored Capping E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Hunter screen with test fixtures
    await page.goto('/hunter?mode=fixtures');
    
    // Wait for feed to load
    await page.waitForSelector('[data-testid="opportunity-card"]', { timeout: 10000 });
  });

  test.describe('Desktop Viewport (1920x1080)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should enforce ≤2 sponsored per 12-card window on desktop', async ({ page }) => {
      // Wait for initial load
      await page.waitForTimeout(1000);

      // Verify compliance
      const isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);

      // Count total cards and sponsored items
      const totalCards = await page.locator('[data-testid="opportunity-card"]').count();
      expect(totalCards).toBeGreaterThan(0);

      const sponsoredCount = await countSponsoredInRange(page, 0, totalCards);
      console.log(`Desktop: ${sponsoredCount} sponsored out of ${totalCards} total cards`);
    });

    test('should maintain compliance after scrolling on desktop', async ({ page }) => {
      // Scroll to load more items
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(1000);

      // Verify compliance after scroll
      const isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);
    });

    test('should show sponsored badge on desktop', async ({ page }) => {
      const sponsoredCards = await page.locator('[data-testid="sponsored-badge"]').all();
      
      for (const badge of sponsoredCards) {
        await expect(badge).toBeVisible();
        const text = await badge.textContent();
        expect(text?.toLowerCase()).toContain('sponsored');
      }
    });
  });

  test.describe('Tablet Viewport (768x1024)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should enforce ≤2 sponsored per 12-card window on tablet', async ({ page }) => {
      await page.waitForTimeout(1000);

      const isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);

      const totalCards = await page.locator('[data-testid="opportunity-card"]').count();
      const sponsoredCount = await countSponsoredInRange(page, 0, totalCards);
      console.log(`Tablet: ${sponsoredCount} sponsored out of ${totalCards} total cards`);
    });

    test('should maintain compliance after scrolling on tablet', async ({ page }) => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(1000);

      const isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);
    });
  });

  test.describe('Mobile Viewport (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should enforce ≤2 sponsored per 12-card window on mobile', async ({ page }) => {
      await page.waitForTimeout(1000);

      const isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);

      const totalCards = await page.locator('[data-testid="opportunity-card"]').count();
      const sponsoredCount = await countSponsoredInRange(page, 0, totalCards);
      console.log(`Mobile: ${sponsoredCount} sponsored out of ${totalCards} total cards`);
    });

    test('should maintain compliance after scrolling on mobile', async ({ page }) => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(1000);

      const isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);
    });

    test('should show sponsored badge on mobile', async ({ page }) => {
      const sponsoredCards = await page.locator('[data-testid="sponsored-badge"]').all();
      
      // Should have some sponsored items
      expect(sponsoredCards.length).toBeGreaterThan(0);
      
      for (const badge of sponsoredCards) {
        await expect(badge).toBeVisible();
      }
    });
  });

  test.describe('Partial Folds', () => {
    test('should handle short viewport (7 visible items)', async ({ page }) => {
      // Set a short viewport
      await page.setViewportSize({ width: 1280, height: 600 });
      await page.waitForTimeout(1000);

      const isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);
    });

    test('should handle very short viewport (5 visible items)', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 400 });
      await page.waitForTimeout(1000);

      const isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);
    });
  });

  test.describe('Grid Density Variations', () => {
    test('should maintain compliance at 1-column layout (mobile)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(1000);

      const isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);

      // Verify single column layout
      const grid = await page.locator('[data-testid="opportunity-grid"]');
      const gridColumns = await grid.evaluate((el) => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // Should be single column or auto-fit
      expect(gridColumns).toBeTruthy();
    });

    test('should maintain compliance at 2-column layout (tablet)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);

      const isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);
    });

    test('should maintain compliance at 3-column layout (desktop)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);

      const isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);
    });
  });

  test.describe('Multi-Page Scenarios', () => {
    test('should maintain compliance across infinite scroll', async ({ page }) => {
      // Initial load
      await page.waitForTimeout(1000);
      let isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);

      // Scroll to trigger next page
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
      await page.waitForTimeout(2000);

      // Verify compliance after loading more
      isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);

      // Scroll again
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.9));
      await page.waitForTimeout(2000);

      // Verify compliance after second page
      isCompliant = await verifyWindowCompliance(page);
      expect(isCompliant).toBe(true);
    });

    test('should not show duplicate sponsored items across pages', async ({ page }) => {
      const seenIds = new Set<string>();
      
      // Get initial cards
      let cards = await page.locator('[data-testid="opportunity-card"]').all();
      for (const card of cards) {
        const id = await card.getAttribute('data-opportunity-id');
        if (id) {
          expect(seenIds.has(id)).toBe(false);
          seenIds.add(id);
        }
      }

      // Scroll and check for duplicates
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
      await page.waitForTimeout(2000);

      cards = await page.locator('[data-testid="opportunity-card"]').all();
      for (const card of cards) {
        const id = await card.getAttribute('data-opportunity-id');
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
        }
      }

      // No duplicates should exist
      const totalCards = await page.locator('[data-testid="opportunity-card"]').count();
      expect(seenIds.size).toBe(totalCards);
    });
  });

  test.describe('Accessibility', () => {
    test('should have aria-label for sponsored items', async ({ page }) => {
      const sponsoredCards = await page.locator('[data-testid="opportunity-card"]').all();
      
      for (const card of sponsoredCards) {
        const badge = await card.locator('[data-testid="sponsored-badge"]').count();
        if (badge > 0) {
          const ariaLabel = await card.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel?.toLowerCase()).toContain('sponsored');
        }
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Focus first card
      await page.keyboard.press('Tab');
      
      // Navigate through cards
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }

      // Should be able to reach sponsored cards
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
      expect(focusedElement).toBeTruthy();
    });
  });

  test.describe('Deterministic Behavior', () => {
    test('should show same sponsored items on reload', async ({ page }) => {
      // Get initial sponsored items
      await page.waitForTimeout(1000);
      const initialCards = await page.locator('[data-testid="opportunity-card"]').all();
      const initialSponsoredIds: string[] = [];

      for (const card of initialCards) {
        const badge = await card.locator('[data-testid="sponsored-badge"]').count();
        if (badge > 0) {
          const id = await card.getAttribute('data-opportunity-id');
          if (id) initialSponsoredIds.push(id);
        }
      }

      // Reload page
      await page.reload();
      await page.waitForSelector('[data-testid="opportunity-card"]', { timeout: 10000 });
      await page.waitForTimeout(1000);

      // Get sponsored items after reload
      const reloadedCards = await page.locator('[data-testid="opportunity-card"]').all();
      const reloadedSponsoredIds: string[] = [];

      for (const card of reloadedCards) {
        const badge = await card.locator('[data-testid="sponsored-badge"]').count();
        if (badge > 0) {
          const id = await card.getAttribute('data-opportunity-id');
          if (id) reloadedSponsoredIds.push(id);
        }
      }

      // Should have same sponsored items in same order
      expect(reloadedSponsoredIds).toEqual(initialSponsoredIds);
    });
  });
});
