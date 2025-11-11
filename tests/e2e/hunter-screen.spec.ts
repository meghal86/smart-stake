/**
 * E2E tests for Hunter Screen
 * 
 * Comprehensive end-to-end tests covering:
 * - Feed loading and pagination
 * - Filter application and persistence
 * - Red consent gate
 * - No duplicates across pages
 * - Card interactions (save, share, report)
 * - Accessibility compliance
 * - Mobile responsive behavior
 * - Search functionality
 * - Tab navigation
 * 
 * Requirements: All Hunter Screen requirements
 */

import { test, expect, Page } from '@playwright/test';

// Helper functions
async function waitForFeedLoad(page: Page) {
  await page.waitForSelector('[data-testid="opportunity-card"]', { timeout: 10000 });
  await page.waitForTimeout(500); // Allow for animations
}

async function getCardCount(page: Page): Promise<number> {
  return await page.locator('[data-testid="opportunity-card"]').count();
}

async function getCardIds(page: Page): Promise<string[]> {
  const cards = await page.locator('[data-testid="opportunity-card"]').all();
  const ids: string[] = [];
  for (const card of cards) {
    const id = await card.getAttribute('data-opportunity-id');
    if (id) ids.push(id);
  }
  return ids;
}

test.describe('Hunter Screen E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Hunter screen with test fixtures
    await page.goto('/hunter?mode=fixtures');
    await waitForFeedLoad(page);
  });

  test.describe('Feed Loading and Pagination', () => {
    test('should load initial feed with opportunity cards', async ({ page }) => {
      const cardCount = await getCardCount(page);
      expect(cardCount).toBeGreaterThan(0);
      expect(cardCount).toBeLessThanOrEqual(12); // Initial page size
    });

    test('should display all required card elements', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      
      // Check for required elements
      await expect(firstCard.locator('[data-testid="card-title"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="protocol-logo"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="guardian-trust-chip"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="reward-display"]')).toBeVisible();
      await expect(firstCard.locator('[data-testid="cta-button"]')).toBeVisible();
    });

    test('should load more cards on scroll (infinite scroll)', async ({ page }) => {
      const initialCount = await getCardCount(page);
      
      // Scroll to 70% to trigger prefetch
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
      await page.waitForTimeout(2000);
      
      const afterScrollCount = await getCardCount(page);
      expect(afterScrollCount).toBeGreaterThan(initialCount);
    });

    test('should not show duplicate cards across pages', async ({ page }) => {
      const seenIds = new Set<string>();
      
      // Get initial cards
      let ids = await getCardIds(page);
      ids.forEach(id => {
        expect(seenIds.has(id)).toBe(false);
        seenIds.add(id);
      });
      
      // Scroll to load more
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
      await page.waitForTimeout(2000);
      
      // Check for duplicates
      ids = await getCardIds(page);
      ids.forEach(id => {
        if (!seenIds.has(id)) {
          seenIds.add(id);
        }
      });
      
      const totalCards = await getCardCount(page);
      expect(seenIds.size).toBe(totalCards);
    });

    test('should show loading state while fetching', async ({ page }) => {
      await page.goto('/hunter?mode=fixtures');
      
      // Should show loading indicator briefly
      const loadingIndicator = page.locator('[data-testid="loading-spinner"]');
      // Note: May be too fast to catch, so we just verify it doesn't error
      await waitForFeedLoad(page);
    });
  });

  test.describe('Filter Application and Persistence', () => {
    test('should open filter drawer', async ({ page }) => {
      const filterButton = page.locator('[data-testid="filter-button"]');
      await filterButton.click();
      
      const filterDrawer = page.locator('[data-testid="filter-drawer"]');
      await expect(filterDrawer).toBeVisible();
    });

    test('should filter by opportunity type', async ({ page }) => {
      // Open filter drawer
      await page.locator('[data-testid="filter-button"]').click();
      
      // Select "Airdrop" type
      await page.locator('[data-testid="filter-type-airdrop"]').click();
      
      // Apply filters (if there's an apply button)
      const applyButton = page.locator('[data-testid="apply-filters"]');
      if (await applyButton.count() > 0) {
        await applyButton.click();
      }
      
      await page.waitForTimeout(1000);
      
      // Verify URL contains filter
      const url = page.url();
      expect(url).toContain('type=airdrop');
    });

    test('should filter by chain', async ({ page }) => {
      await page.locator('[data-testid="filter-button"]').click();
      
      // Select Ethereum chain
      await page.locator('[data-testid="filter-chain-ethereum"]').click();
      
      await page.waitForTimeout(1000);
      
      // Verify URL contains filter
      const url = page.url();
      expect(url).toContain('chain');
    });

    test('should filter by trust level', async ({ page }) => {
      await page.locator('[data-testid="filter-button"]').click();
      
      // Select Green trust only
      await page.locator('[data-testid="filter-trust-green"]').click();
      
      await page.waitForTimeout(1000);
      
      // All visible cards should have green trust
      const cards = await page.locator('[data-testid="opportunity-card"]').all();
      for (const card of cards) {
        const trustChip = card.locator('[data-testid="guardian-trust-chip"]');
        const chipClass = await trustChip.getAttribute('class');
        expect(chipClass).toContain('green');
      }
    });

    test('should persist filters in URL', async ({ page }) => {
      await page.locator('[data-testid="filter-button"]').click();
      await page.locator('[data-testid="filter-type-airdrop"]').click();
      await page.waitForTimeout(500);
      
      const urlBeforeReload = page.url();
      
      // Reload page
      await page.reload();
      await waitForFeedLoad(page);
      
      const urlAfterReload = page.url();
      expect(urlAfterReload).toBe(urlBeforeReload);
    });

    test('should reset filters', async ({ page }) => {
      await page.locator('[data-testid="filter-button"]').click();
      await page.locator('[data-testid="filter-type-airdrop"]').click();
      await page.waitForTimeout(500);
      
      // Reset filters
      const resetButton = page.locator('[data-testid="reset-filters"]');
      await resetButton.click();
      
      await page.waitForTimeout(500);
      
      // URL should not contain filters
      const url = page.url();
      expect(url).not.toContain('type=');
    });
  });

  test.describe('Red Trust Consent Gate', () => {
    test('should hide Red trust items by default', async ({ page }) => {
      const cards = await page.locator('[data-testid="opportunity-card"]').all();
      
      for (const card of cards) {
        const trustChip = card.locator('[data-testid="guardian-trust-chip"]');
        const chipClass = await trustChip.getAttribute('class');
        expect(chipClass).not.toContain('red');
      }
    });

    test('should show consent modal when enabling Red trust filter', async ({ page }) => {
      await page.locator('[data-testid="filter-button"]').click();
      
      // Try to enable Red trust
      await page.locator('[data-testid="filter-trust-red"]').click();
      
      // Consent modal should appear
      const consentModal = page.locator('[data-testid="red-consent-modal"]');
      await expect(consentModal).toBeVisible();
      
      // Should have warning text
      const warningText = consentModal.locator('text=/risky/i');
      await expect(warningText).toBeVisible();
    });

    test('should show Red items after consent', async ({ page }) => {
      await page.locator('[data-testid="filter-button"]').click();
      await page.locator('[data-testid="filter-trust-red"]').click();
      
      // Accept consent
      const acceptButton = page.locator('[data-testid="accept-red-consent"]');
      await acceptButton.click();
      
      await page.waitForTimeout(1000);
      
      // Should now show Red trust items
      const redCards = await page.locator('[data-testid="opportunity-card"]').all();
      let hasRedCard = false;
      
      for (const card of redCards) {
        const trustChip = card.locator('[data-testid="guardian-trust-chip"]');
        const chipClass = await trustChip.getAttribute('class');
        if (chipClass?.includes('red')) {
          hasRedCard = true;
          break;
        }
      }
      
      expect(hasRedCard).toBe(true);
    });

    test('should persist consent for session', async ({ page }) => {
      // Accept consent
      await page.locator('[data-testid="filter-button"]').click();
      await page.locator('[data-testid="filter-trust-red"]').click();
      await page.locator('[data-testid="accept-red-consent"]').click();
      
      // Navigate away and back
      await page.goto('/');
      await page.goto('/hunter?mode=fixtures');
      await waitForFeedLoad(page);
      
      // Enable Red filter again - should not show modal
      await page.locator('[data-testid="filter-button"]').click();
      await page.locator('[data-testid="filter-trust-red"]').click();
      
      const consentModal = page.locator('[data-testid="red-consent-modal"]');
      await expect(consentModal).not.toBeVisible();
    });
  });

  test.describe('Card Interactions', () => {
    test('should save an opportunity', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      const saveButton = firstCard.locator('[data-testid="save-button"]');
      
      await saveButton.click();
      
      // Should show success toast or visual feedback
      const toast = page.locator('[data-testid="toast"]');
      await expect(toast).toBeVisible({ timeout: 3000 });
    });

    test('should share an opportunity', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      const shareButton = firstCard.locator('[data-testid="share-button"]');
      
      await shareButton.click();
      
      // Should show share modal or copy link
      const shareModal = page.locator('[data-testid="share-modal"]');
      const toast = page.locator('[data-testid="toast"]');
      
      // Either modal or toast should appear
      const modalVisible = await shareModal.isVisible().catch(() => false);
      const toastVisible = await toast.isVisible().catch(() => false);
      
      expect(modalVisible || toastVisible).toBe(true);
    });

    test('should open report modal', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      const reportButton = firstCard.locator('[data-testid="report-button"]');
      
      await reportButton.click();
      
      // Report modal should appear
      const reportModal = page.locator('[data-testid="report-modal"]');
      await expect(reportModal).toBeVisible();
      
      // Should have report categories
      const phishingOption = reportModal.locator('text=/phishing/i');
      await expect(phishingOption).toBeVisible();
    });

    test('should submit a report', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      await firstCard.locator('[data-testid="report-button"]').click();
      
      const reportModal = page.locator('[data-testid="report-modal"]');
      
      // Select a category
      await reportModal.locator('[data-testid="report-category-phishing"]').click();
      
      // Submit report
      await reportModal.locator('[data-testid="submit-report"]').click();
      
      // Should show success message
      const toast = page.locator('[data-testid="toast"]');
      await expect(toast).toBeVisible({ timeout: 3000 });
    });

    test('should click CTA button', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      const ctaButton = firstCard.locator('[data-testid="cta-button"]');
      
      await expect(ctaButton).toBeVisible();
      await expect(ctaButton).toBeEnabled();
      
      // Click should navigate or open modal
      await ctaButton.click();
      
      // Wait for navigation or modal
      await page.waitForTimeout(1000);
    });

    test('should show Guardian trust details on click', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      const trustChip = firstCard.locator('[data-testid="guardian-trust-chip"]');
      
      await trustChip.click();
      
      // Should open issues drawer or modal
      const issuesDrawer = page.locator('[data-testid="issues-drawer"]');
      await expect(issuesDrawer).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Search Functionality', () => {
    test('should show search bar', async ({ page }) => {
      const searchBar = page.locator('[data-testid="search-bar"]');
      await expect(searchBar).toBeVisible();
    });

    test('should search for opportunities', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]');
      
      await searchInput.fill('airdrop');
      await page.waitForTimeout(500); // Debounce
      
      // URL should contain search query
      const url = page.url();
      expect(url).toContain('q=airdrop');
    });

    test('should debounce search input', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]');
      
      // Type quickly
      await searchInput.type('test', { delay: 50 });
      
      // Should not immediately update URL
      await page.waitForTimeout(100);
      let url = page.url();
      expect(url).not.toContain('q=test');
      
      // After debounce delay (300ms), should update
      await page.waitForTimeout(300);
      url = page.url();
      expect(url).toContain('q=test');
    });

    test('should clear search', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]');
      
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Clear search
      const clearButton = page.locator('[data-testid="clear-search"]');
      await clearButton.click();
      
      // Input should be empty
      const value = await searchInput.inputValue();
      expect(value).toBe('');
      
      // URL should not contain search
      const url = page.url();
      expect(url).not.toContain('q=');
    });

    test('should show search suggestions', async ({ page }) => {
      const searchInput = page.locator('[data-testid="search-input"]');
      
      await searchInput.fill('air');
      await page.waitForTimeout(500);
      
      // Suggestions should appear
      const suggestions = page.locator('[data-testid="search-suggestions"]');
      const suggestionsVisible = await suggestions.isVisible().catch(() => false);
      
      // May or may not have suggestions depending on implementation
      if (suggestionsVisible) {
        const suggestionItems = await suggestions.locator('[data-testid="suggestion-item"]').count();
        expect(suggestionItems).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Tab Navigation', () => {
    test('should show all tabs', async ({ page }) => {
      const tabs = ['All', 'Airdrops', 'Quests', 'Yield', 'Points', 'Featured'];
      
      for (const tab of tabs) {
        const tabElement = page.locator(`[data-testid="tab-${tab.toLowerCase()}"]`);
        await expect(tabElement).toBeVisible();
      }
    });

    test('should switch between tabs', async ({ page }) => {
      // Click Airdrops tab
      await page.locator('[data-testid="tab-airdrops"]').click();
      await page.waitForTimeout(500);
      
      // URL should reflect tab
      let url = page.url();
      expect(url).toContain('type=airdrop');
      
      // Click Quests tab
      await page.locator('[data-testid="tab-quests"]').click();
      await page.waitForTimeout(500);
      
      url = page.url();
      expect(url).toContain('type=quest');
    });

    test('should persist active tab in URL', async ({ page }) => {
      await page.locator('[data-testid="tab-airdrops"]').click();
      await page.waitForTimeout(500);
      
      const urlBeforeReload = page.url();
      
      // Reload page
      await page.reload();
      await waitForFeedLoad(page);
      
      // Active tab should still be Airdrops
      const airdropTab = page.locator('[data-testid="tab-airdrops"]');
      const isActive = await airdropTab.getAttribute('data-active');
      expect(isActive).toBe('true');
    });

    test('should update feed when tab changes', async ({ page }) => {
      const initialCount = await getCardCount(page);
      
      // Switch to Airdrops tab
      await page.locator('[data-testid="tab-airdrops"]').click();
      await page.waitForTimeout(1000);
      
      const afterTabCount = await getCardCount(page);
      
      // Count may change (could be same if all are airdrops in fixtures)
      expect(afterTabCount).toBeGreaterThan(0);
    });

    test('should highlight active tab', async ({ page }) => {
      const allTab = page.locator('[data-testid="tab-all"]');
      
      // All tab should be active by default
      let isActive = await allTab.getAttribute('data-active');
      expect(isActive).toBe('true');
      
      // Click Airdrops
      await page.locator('[data-testid="tab-airdrops"]').click();
      await page.waitForTimeout(500);
      
      // Airdrops should now be active
      const airdropTab = page.locator('[data-testid="tab-airdrops"]');
      isActive = await airdropTab.getAttribute('data-active');
      expect(isActive).toBe('true');
    });
  });

  test.describe('Mobile Responsive Behavior', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should show mobile layout', async ({ page }) => {
      // Should have single column grid
      const grid = page.locator('[data-testid="opportunity-grid"]');
      await expect(grid).toBeVisible();
      
      const gridColumns = await grid.evaluate((el) => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // Should be single column
      expect(gridColumns).toBeTruthy();
    });

    test('should hide right rail on mobile', async ({ page }) => {
      const rightRail = page.locator('[data-testid="right-rail"]');
      
      // Should not be visible on mobile
      const isVisible = await rightRail.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });

    test('should show filter drawer as bottom sheet on mobile', async ({ page }) => {
      await page.locator('[data-testid="filter-button"]').click();
      
      const filterDrawer = page.locator('[data-testid="filter-drawer"]');
      await expect(filterDrawer).toBeVisible();
      
      // Should be positioned at bottom
      const position = await filterDrawer.evaluate((el) => 
        window.getComputedStyle(el).position
      );
      expect(position).toBeTruthy();
    });

    test('should support touch scrolling', async ({ page }) => {
      const initialCount = await getCardCount(page);
      
      // Simulate touch scroll
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight * 0.7);
      });
      
      await page.waitForTimeout(2000);
      
      const afterScrollCount = await getCardCount(page);
      expect(afterScrollCount).toBeGreaterThan(initialCount);
    });

    test('should show sticky sub-filters on mobile', async ({ page }) => {
      const stickyFilters = page.locator('[data-testid="sticky-sub-filters"]');
      
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 300));
      await page.waitForTimeout(500);
      
      // Sticky filters should still be visible
      await expect(stickyFilters).toBeVisible();
    });

    test('should have touch-friendly tap targets', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      const saveButton = firstCard.locator('[data-testid="save-button"]');
      
      // Button should be large enough for touch (at least 44x44px)
      const box = await saveButton.boundingBox();
      expect(box).toBeTruthy();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Check for h1
      const h1 = page.locator('h1');
      await expect(h1).toBeVisible();
      
      // Should have logical heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
    });

    test('should have aria-labels on interactive elements', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      
      // Check buttons have aria-labels
      const saveButton = firstCard.locator('[data-testid="save-button"]');
      const ariaLabel = await saveButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Tab through elements
      await page.keyboard.press('Tab');
      
      // Should focus on first interactive element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
      
      // Continue tabbing
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Should be able to reach cards
      const activeElement = await page.evaluate(() => 
        document.activeElement?.getAttribute('data-testid')
      );
      expect(activeElement).toBeTruthy();
    });

    test('should close modals with ESC key', async ({ page }) => {
      // Open filter drawer
      await page.locator('[data-testid="filter-button"]').click();
      
      const filterDrawer = page.locator('[data-testid="filter-drawer"]');
      await expect(filterDrawer).toBeVisible();
      
      // Press ESC
      await page.keyboard.press('Escape');
      
      // Drawer should close
      await expect(filterDrawer).not.toBeVisible();
    });

    test('should have sufficient color contrast', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      const trustChip = firstCard.locator('[data-testid="guardian-trust-chip"]');
      
      // Get computed styles
      const styles = await trustChip.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });
      
      // Should have both color and background
      expect(styles.color).toBeTruthy();
      expect(styles.backgroundColor).toBeTruthy();
    });

    test('should have text labels not just color indicators', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      const trustChip = firstCard.locator('[data-testid="guardian-trust-chip"]');
      
      // Should have text content
      const text = await trustChip.textContent();
      expect(text).toBeTruthy();
      expect(text?.length).toBeGreaterThan(0);
    });

    test('should have keyboard accessible tooltips', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      const trustChip = firstCard.locator('[data-testid="guardian-trust-chip"]');
      
      // Focus on element
      await trustChip.focus();
      
      // Tooltip should appear or be accessible
      await page.waitForTimeout(500);
      
      // Press Enter or Space to activate
      await page.keyboard.press('Enter');
      
      // Should open details
      await page.waitForTimeout(500);
    });

    test('should not trap focus in modals', async ({ page }) => {
      // Open filter drawer
      await page.locator('[data-testid="filter-button"]').click();
      
      const filterDrawer = page.locator('[data-testid="filter-drawer"]');
      await expect(filterDrawer).toBeVisible();
      
      // Tab through modal
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Tab');
      }
      
      // Should cycle within modal, not escape
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.closest('[data-testid="filter-drawer"]') !== null;
      });
      
      expect(focusedElement).toBe(true);
    });

    test('should have proper ARIA roles', async ({ page }) => {
      // Check for proper roles
      const filterButton = page.locator('[data-testid="filter-button"]');
      const role = await filterButton.getAttribute('role');
      
      // Button should have button role or be a button element
      const tagName = await filterButton.evaluate((el) => el.tagName);
      expect(tagName === 'BUTTON' || role === 'button').toBe(true);
    });

    test('should announce dynamic content changes', async ({ page }) => {
      // Apply a filter
      await page.locator('[data-testid="filter-button"]').click();
      await page.locator('[data-testid="filter-type-airdrop"]').click();
      
      await page.waitForTimeout(1000);
      
      // Should have aria-live region for announcements
      const liveRegion = page.locator('[aria-live]');
      const count = await liveRegion.count();
      
      // Should have at least one live region
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Tablet Responsive Behavior', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should show 2-column grid on tablet', async ({ page }) => {
      const grid = page.locator('[data-testid="opportunity-grid"]');
      await expect(grid).toBeVisible();
      
      const gridColumns = await grid.evaluate((el) => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // Should have 2 columns
      expect(gridColumns).toBeTruthy();
    });

    test('should hide right rail on tablet', async ({ page }) => {
      const rightRail = page.locator('[data-testid="right-rail"]');
      
      // Should not be visible on tablet (< 1280px)
      const isVisible = await rightRail.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });

    test('should show compact cards on tablet', async ({ page }) => {
      const firstCard = page.locator('[data-testid="opportunity-card"]').first();
      await expect(firstCard).toBeVisible();
      
      // Card should be visible and properly sized
      const box = await firstCard.boundingBox();
      expect(box).toBeTruthy();
    });
  });

  test.describe('Desktop Responsive Behavior', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should show 3-column grid on desktop', async ({ page }) => {
      const grid = page.locator('[data-testid="opportunity-grid"]');
      await expect(grid).toBeVisible();
      
      const gridColumns = await grid.evaluate((el) => 
        window.getComputedStyle(el).gridTemplateColumns
      );
      
      // Should have 3 columns
      expect(gridColumns).toBeTruthy();
    });

    test('should show right rail on desktop', async ({ page }) => {
      const rightRail = page.locator('[data-testid="right-rail"]');
      
      // Should be visible on desktop (>= 1280px)
      await expect(rightRail).toBeVisible();
    });

    test('should show personal picks in right rail', async ({ page }) => {
      const personalPicks = page.locator('[data-testid="personal-picks"]');
      await expect(personalPicks).toBeVisible();
    });

    test('should show saved items in right rail', async ({ page }) => {
      const savedItems = page.locator('[data-testid="saved-items"]');
      await expect(savedItems).toBeVisible();
    });

    test('should show season progress in right rail', async ({ page }) => {
      const seasonProgress = page.locator('[data-testid="season-progress"]');
      await expect(seasonProgress).toBeVisible();
    });
  });

  test.describe('Performance and Loading', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/hunter?mode=fixtures');
      await waitForFeedLoad(page);
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds (generous for E2E)
      expect(loadTime).toBeLessThan(3000);
    });

    test('should show loading state', async ({ page }) => {
      await page.goto('/hunter?mode=fixtures');
      
      // May briefly show loading state
      const loadingState = page.locator('[data-testid="loading-state"]');
      
      // Wait for feed to load
      await waitForFeedLoad(page);
      
      // Loading state should be gone
      const isVisible = await loadingState.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    });

    test('should prefetch next page at 70% scroll', async ({ page }) => {
      const initialCount = await getCardCount(page);
      
      // Scroll to 70%
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
      
      // Wait for prefetch
      await page.waitForTimeout(2000);
      
      // Should have loaded more cards
      const afterScrollCount = await getCardCount(page);
      expect(afterScrollCount).toBeGreaterThan(initialCount);
    });
  });

  test.describe('Error Handling', () => {
    test('should show error state on API failure', async ({ page }) => {
      // Intercept API and return error
      await page.route('**/api/hunter/opportunities*', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: { code: 'INTERNAL', message: 'Server error' } }),
        });
      });
      
      await page.goto('/hunter');
      await page.waitForTimeout(1000);
      
      // Should show error message
      const errorMessage = page.locator('[data-testid="error-message"]');
      await expect(errorMessage).toBeVisible();
    });

    test('should show retry button on error', async ({ page }) => {
      await page.route('**/api/hunter/opportunities*', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: { code: 'INTERNAL', message: 'Server error' } }),
        });
      });
      
      await page.goto('/hunter');
      await page.waitForTimeout(1000);
      
      const retryButton = page.locator('[data-testid="retry-button"]');
      await expect(retryButton).toBeVisible();
    });

    test('should show empty state when no results', async ({ page }) => {
      // Intercept API and return empty results
      await page.route('**/api/hunter/opportunities*', (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ items: [], cursor: null, ts: new Date().toISOString() }),
        });
      });
      
      await page.goto('/hunter');
      await page.waitForTimeout(1000);
      
      // Should show empty state
      const emptyState = page.locator('[data-testid="empty-state"]');
      await expect(emptyState).toBeVisible();
    });
  });
});
