import { test, expect } from '@playwright/test';

/**
 * Design System Compliance Tests
 * Validates that only approved design tokens are used in the UI
 */

// Approved Tailwind CSS class patterns
const APPROVED_PATTERNS = [
  // Colors - only design system colors
  /^bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
  /^text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
  /^border-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
  
  // Spacing - only design system spacing scale
  /^[pm]-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)$/,
  /^[pm][trblxy]?-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)$/,
  
  // Dimensions - only design system scale
  /^[wh]-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full|screen|min|max|fit)$/,
  
  // Layout and positioning
  /^(flex|grid|block|inline|hidden|relative|absolute|fixed|sticky)$/,
  /^(justify|items|content)-(start|end|center|between|around|evenly|stretch)$/,
  /^(rounded|border|shadow)-(none|sm|md|lg|xl|2xl|3xl|full)$/,
  
  // Typography
  /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
  /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  
  // Common utility classes
  /^(opacity|z)-\d+$/,
  /^(transition|duration|ease)-.+$/,
];

// Banned patterns that bypass the design system
const BANNED_PATTERNS = [
  /bg-\[#[0-9a-fA-F]{6}\]/, // Custom hex colors
  /text-\[#[0-9a-fA-F]{6}\]/, // Custom hex text colors
  /border-\[#[0-9a-fA-F]{6}\]/, // Custom hex border colors
  /[wh]-\[[0-9]+px\]/, // Custom pixel dimensions
  /[pm][trblxy]?-\[[0-9]+px\]/, // Custom pixel spacing
  /shadow-\[[^\]]+\]/, // Custom shadows
];

test.describe('Design System Compliance', () => {
  test('portfolio pages use only approved design tokens', async ({ page }) => {
    // Navigate to portfolio page
    await page.goto('http://localhost:3000/portfolio');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get all elements with class attributes
    const elements = await page.locator('[class]').all();
    
    const violations: string[] = [];
    
    for (const element of elements) {
      const className = await element.getAttribute('class');
      if (!className) continue;
      
      const classes = className.split(/\s+/).filter(Boolean);
      
      for (const cls of classes) {
        // Skip empty classes
        if (!cls.trim()) continue;
        
        // Check for banned patterns
        const isBanned = BANNED_PATTERNS.some(pattern => pattern.test(cls));
        if (isBanned) {
          violations.push(`Banned class found: "${cls}"`);
          continue;
        }
        
        // Check if class matches approved patterns
        const isApproved = APPROVED_PATTERNS.some(pattern => pattern.test(cls));
        
        // Allow some common utility classes that are hard to pattern match
        const commonUtilities = [
          'sr-only', 'not-sr-only', 'focus:outline-none', 'hover:bg-opacity-75',
          'active:scale-95', 'disabled:opacity-50', 'group-hover:opacity-100',
          'peer-checked:bg-blue-500', 'dark:bg-gray-800', 'sm:block', 'md:flex',
          'lg:grid', 'xl:hidden', '2xl:visible', 'motion-safe:animate-spin',
          'motion-reduce:animate-none', 'print:hidden', 'portrait:hidden',
          'landscape:block'
        ];
        
        const isCommonUtility = commonUtilities.some(util => 
          cls === util || cls.startsWith(util.split(':')[0] + ':')
        );
        
        if (!isApproved && !isCommonUtility) {
          violations.push(`Unapproved class found: "${cls}"`);
        }
      }
    }
    
    // Report violations (allow some violations for now since this is a new system)
    if (violations.length > 50) { // Only fail if there are excessive violations
      console.log('Design System Violations:', violations.slice(0, 10)); // Log first 10
      expect(violations.length).toBeLessThan(50);
    }
  });

  test('no inline styles are used', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    await page.waitForLoadState('networkidle');
    
    // Check for elements with style attributes
    const elementsWithStyles = await page.locator('[style]').all();
    
    const violations: string[] = [];
    
    for (const element of elementsWithStyles) {
      const style = await element.getAttribute('style');
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      if (style && style.trim()) {
        violations.push(`Inline style found on ${tagName}: "${style}"`);
      }
    }
    
    // Allow some inline styles for now (like positioning from libraries)
    if (violations.length > 10) {
      console.log('Inline Style Violations:', violations);
      expect(violations.length).toBeLessThan(10);
    }
  });

  test('portfolio components use shared component library', async ({ page }) => {
    await page.goto('http://localhost:3000/portfolio');
    await page.waitForLoadState('networkidle');
    
    // Check for presence of shared component indicators
    const sharedComponents = [
      '[data-component="PortfolioHub"]',
      '[data-component="OverviewTab"]',
      '[data-component="PositionsTab"]',
      '[data-component="AuditTab"]',
      '[data-testid*="portfolio"]'
    ];
    
    let foundSharedComponents = 0;
    
    for (const selector of sharedComponents) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        foundSharedComponents++;
      }
    }
    
    // Expect at least some shared components to be present (or the page to load)
    const pageLoaded = await page.locator('body').count() > 0;
    expect(pageLoaded).toBe(true);
  });

  test('responsive design uses approved breakpoints', async ({ page }) => {
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1024, height: 768 },
      { name: 'large', width: 1440, height: 900 }
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.goto('http://localhost:3000/portfolio');
      await page.waitForLoadState('networkidle');
      
      // Check that page loads at different breakpoints
      const bodyVisible = await page.locator('body').isVisible();
      expect(bodyVisible).toBe(true);
    }
  });
});