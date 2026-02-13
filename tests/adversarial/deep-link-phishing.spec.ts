/**
 * Adversarial Test: Deep-Link and QR Code Phishing Protection
 * 
 * Tests protection against phishing attacks via deep links and QR codes
 * Requirements: 13.3 (advanced adversarial), 14.1
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const PHISHING_DEEP_LINKS = [
  // Direct execution attempt
  {
    name: 'Direct Execution',
    url: '/portfolio?action=execute&planId=malicious_plan_123&autoSign=true',
    expectedWarning: true,
    expectedBlock: true,
  },
  // Approval phishing
  {
    name: 'Approval Phishing',
    url: '/portfolio?action=approve&token=0x123&spender=0xmalicious&amount=unlimited',
    expectedWarning: true,
    expectedBlock: true,
  },
  // Transfer phishing
  {
    name: 'Transfer Phishing',
    url: '/portfolio?action=transfer&to=0xmalicious&amount=1000&token=USDC',
    expectedWarning: true,
    expectedBlock: true,
  },
  // Disguised as legitimate action
  {
    name: 'Disguised Action',
    url: '/portfolio?action=claim_rewards&contract=0xmalicious',
    expectedWarning: true,
    expectedBlock: false, // Should warn but allow after verification
  },
  // QR code simulation
  {
    name: 'QR Code Link',
    url: '/portfolio?source=qr&action=sign&data=0xmalicious_calldata',
    expectedWarning: true,
    expectedBlock: true,
  },
  // Social engineering
  {
    name: 'Social Engineering',
    url: '/portfolio?urgent=true&action=revoke&message=Your%20wallet%20is%20at%20risk',
    expectedWarning: true,
    expectedBlock: false,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function navigateViaDeepLink(page: any, url: string) {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
}

async function checkForWarningGate(page: any) {
  // Check if warning modal/banner is displayed
  const warningModal = await page.locator('[data-testid="deep-link-warning"]').count();
  const warningBanner = await page.locator('[data-testid="phishing-warning"]').count();
  
  return warningModal > 0 || warningBanner > 0;
}

async function checkForExecutionBlock(page: any) {
  // Check if execution is blocked
  const blockedMessage = await page.locator('[data-testid="execution-blocked"]').count();
  const disabledButton = await page.locator('[data-testid="execute-action"]:disabled').count();
  
  return blockedMessage > 0 || disabledButton > 0;
}

async function getWarningDetails(page: any) {
  const warningElement = page.locator('[data-testid="deep-link-warning"]').or(
    page.locator('[data-testid="phishing-warning"]')
  );
  
  if (await warningElement.count() === 0) {
    return null;
  }
  
  const title = await warningElement.locator('[data-testid="warning-title"]').textContent();
  const message = await warningElement.locator('[data-testid="warning-message"]').textContent();
  const risks = await warningElement.locator('[data-testid="warning-risks"]').allTextContents();
  
  return { title, message, risks };
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('Deep-Link Phishing Protection', () => {
  for (const link of PHISHING_DEEP_LINKS) {
    test(`should protect against ${link.name}`, async ({ page }) => {
      // Navigate via deep link
      await navigateViaDeepLink(page, link.url);
      
      // Check for warning gate
      const hasWarning = await checkForWarningGate(page);
      expect(hasWarning).toBe(link.expectedWarning);
      
      if (link.expectedWarning) {
        // Verify warning details
        const warning = await getWarningDetails(page);
        expect(warning).not.toBeNull();
        expect(warning?.title).toContain('Warning');
        expect(warning?.message).toBeTruthy();
        
        // Warning should explain the risks
        expect(warning?.risks.length).toBeGreaterThan(0);
      }
      
      // Check if execution is blocked
      const isBlocked = await checkForExecutionBlock(page);
      expect(isBlocked).toBe(link.expectedBlock);
      
      if (link.expectedBlock) {
        // Should not be able to execute without explicit verification
        const executeButton = page.locator('[data-testid="execute-action"]');
        await expect(executeButton).toBeDisabled();
      }
    });
  }
});

test.describe('QR Code Entry Protection', () => {
  test('should show verification gate for QR code entries', async ({ page }) => {
    const qrUrl = '/portfolio?source=qr&action=approve&spender=0x123';
    
    await navigateViaDeepLink(page, qrUrl);
    
    // Should show QR-specific warning
    const qrWarning = await page.locator('[data-testid="qr-entry-warning"]').count();
    expect(qrWarning).toBeGreaterThan(0);
    
    // Should require manual verification
    const verifyButton = page.locator('[data-testid="verify-qr-action"]');
    await expect(verifyButton).toBeVisible();
    
    // Should show source information
    const sourceInfo = await page.locator('[data-testid="entry-source"]').textContent();
    expect(sourceInfo).toContain('QR');
  });
  
  test('should require user confirmation for QR actions', async ({ page }) => {
    const qrUrl = '/portfolio?source=qr&action=transfer&to=0x123&amount=100';
    
    await navigateViaDeepLink(page, qrUrl);
    
    // Should show action details for review
    const actionDetails = page.locator('[data-testid="action-details"]');
    await expect(actionDetails).toBeVisible();
    
    // Should show all parameters
    const params = await page.locator('[data-testid="action-param"]').allTextContents();
    expect(params.some(p => p.includes('to'))).toBe(true);
    expect(params.some(p => p.includes('amount'))).toBe(true);
    
    // Should require explicit "I understand the risks" checkbox
    const riskCheckbox = page.locator('[data-testid="acknowledge-risks"]');
    await expect(riskCheckbox).toBeVisible();
    await expect(riskCheckbox).not.toBeChecked();
    
    // Execute button should be disabled until checkbox is checked
    const executeButton = page.locator('[data-testid="execute-action"]');
    await expect(executeButton).toBeDisabled();
    
    // After checking, should enable
    await riskCheckbox.check();
    await expect(executeButton).toBeEnabled();
  });
});

test.describe('Social Engineering Protection', () => {
  test('should detect urgency manipulation', async ({ page }) => {
    const urgentUrl = '/portfolio?urgent=true&action=revoke&message=Act%20now%20or%20lose%20funds';
    
    await navigateViaDeepLink(page, urgentUrl);
    
    // Should detect and warn about urgency tactics
    const urgencyWarning = await page.locator('[data-testid="urgency-warning"]').count();
    expect(urgencyWarning).toBeGreaterThan(0);
    
    const warningText = await page.locator('[data-testid="urgency-warning"]').textContent();
    expect(warningText).toContain('urgency');
    expect(warningText).toContain('scam');
  });
  
  test('should detect authority impersonation', async ({ page }) => {
    const authorityUrl = '/portfolio?from=support&action=approve&message=AlphaWhale%20Support';
    
    await navigateViaDeepLink(page, authorityUrl);
    
    // Should warn about impersonation
    const impersonationWarning = await page.locator('[data-testid="impersonation-warning"]').count();
    expect(impersonationWarning).toBeGreaterThan(0);
    
    const warningText = await page.locator('[data-testid="impersonation-warning"]').textContent();
    expect(warningText).toContain('never');
    expect(warningText).toContain('link');
  });
});

test.describe('Legitimate Deep-Link Handling', () => {
  test('should allow legitimate navigation deep links', async ({ page }) => {
    const legitimateUrl = '/portfolio?tab=audit';
    
    await navigateViaDeepLink(page, legitimateUrl);
    
    // Should not show warning for navigation-only links
    const hasWarning = await checkForWarningGate(page);
    expect(hasWarning).toBe(false);
    
    // Should navigate to correct tab
    const activeTab = await page.locator('[data-testid="tab-audit"][aria-selected="true"]').count();
    expect(activeTab).toBeGreaterThan(0);
  });
  
  test('should allow legitimate filter deep links', async ({ page }) => {
    const filterUrl = '/portfolio?tab=approvals&severity=critical';
    
    await navigateViaDeepLink(page, filterUrl);
    
    // Should not show warning for filter links
    const hasWarning = await checkForWarningGate(page);
    expect(hasWarning).toBe(false);
    
    // Should apply filters
    const activeFilter = await page.locator('[data-testid="filter-severity-critical"]').count();
    expect(activeFilter).toBeGreaterThan(0);
  });
});

test.describe('Audit Trail for Deep-Link Entries', () => {
  test('should log all deep-link entries', async ({ page }) => {
    const auditEvents: any[] = [];
    
    // Capture audit events
    await page.route('**/api/v1/portfolio/audit/events', async (route: any) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        auditEvents.push(body);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              apiVersion: 'v1',
              eventId: `evt_${auditEvents.length}`,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });
    
    // Navigate via deep link
    const deepLinkUrl = '/portfolio?action=approve&spender=0x123';
    await navigateViaDeepLink(page, deepLinkUrl);
    
    await page.waitForTimeout(1000);
    
    // Verify audit event was logged
    expect(auditEvents.length).toBeGreaterThan(0);
    
    const entryEvent = auditEvents.find(e => e.eventType === 'deep_link_entry');
    expect(entryEvent).toBeDefined();
    expect(entryEvent.metadata).toHaveProperty('url');
    expect(entryEvent.metadata).toHaveProperty('action');
    expect(entryEvent.metadata).toHaveProperty('timestamp');
  });
  
  test('should log warning dismissals', async ({ page }) => {
    const auditEvents: any[] = [];
    
    await page.route('**/api/v1/portfolio/audit/events', async (route: any) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}');
        auditEvents.push(body);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              apiVersion: 'v1',
              eventId: `evt_${auditEvents.length}`,
            },
          }),
        });
      } else {
        await route.continue();
      }
    });
    
    // Navigate via suspicious deep link
    const suspiciousUrl = '/portfolio?action=approve&spender=0xmalicious';
    await navigateViaDeepLink(page, suspiciousUrl);
    
    // Dismiss warning
    const dismissButton = page.locator('[data-testid="dismiss-warning"]');
    if (await dismissButton.count() > 0) {
      await dismissButton.click();
      await page.waitForTimeout(500);
    }
    
    // Verify dismissal was logged
    const dismissalEvent = auditEvents.find(e => e.eventType === 'warning_dismissed');
    expect(dismissalEvent).toBeDefined();
    expect(dismissalEvent.severity).toBe('high');
  });
});

test.describe('User Education', () => {
  test('should provide educational content on first deep-link warning', async ({ page }) => {
    const deepLinkUrl = '/portfolio?action=approve&spender=0x123';
    
    await navigateViaDeepLink(page, deepLinkUrl);
    
    // Should show educational modal on first warning
    const educationModal = await page.locator('[data-testid="phishing-education"]').count();
    expect(educationModal).toBeGreaterThan(0);
    
    // Should explain common phishing tactics
    const content = await page.locator('[data-testid="phishing-education"]').textContent();
    expect(content).toContain('phishing');
    expect(content).toContain('verify');
    expect(content).toContain('never');
    
    // Should have "Don't show again" option
    const dontShowAgain = page.locator('[data-testid="dont-show-education"]');
    await expect(dontShowAgain).toBeVisible();
  });
});
