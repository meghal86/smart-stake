/**
 * Adversarial Test: Simulation vs Execution Payload Mismatch
 * 
 * Tests detection and blocking of mismatched transaction payloads
 * Requirements: 13.3 (advanced adversarial), 6.6, 6.7, 8.1
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

interface SimulationReceipt {
  receiptId: string;
  targetContract: string;
  calldataClass: string;
  assetDeltas: Array<{
    token: string;
    amount: string;
    direction: 'in' | 'out';
  }>;
  timestamp: string;
}

interface ExecutionPayload {
  to: string;
  data: string;
  value: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createSimulationReceipt(overrides?: Partial<SimulationReceipt>): SimulationReceipt {
  return {
    receiptId: 'sim_123',
    targetContract: '0x1234567890123456789012345678901234567890',
    calldataClass: 'ERC20.approve',
    assetDeltas: [
      {
        token: 'USDC',
        amount: '1000',
        direction: 'out',
      },
    ],
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function createExecutionPayload(overrides?: Partial<ExecutionPayload>): ExecutionPayload {
  return {
    to: '0x1234567890123456789012345678901234567890',
    data: '0x095ea7b3', // approve function selector
    value: '0',
    ...overrides,
  };
}

async function setupPlanWithSimulation(page: any, receipt: SimulationReceipt) {
  // Mock plan creation
  await page.route('**/api/v1/portfolio/plan', async (route: any) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          apiVersion: 'v1',
          planId: 'plan_123',
          steps: [
            {
              stepId: 's1',
              kind: 'approve',
              chainId: 1,
              target: receipt.targetContract,
              status: 'pending',
            },
          ],
        },
      }),
    });
  });
  
  // Mock simulation
  await page.route('**/api/v1/portfolio/plan/*/simulate', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          apiVersion: 'v1',
          receiptId: receipt.receiptId,
          simulationResult: {
            success: true,
            receiptId: receipt.receiptId,
            assetDeltas: receipt.assetDeltas,
            permissionDeltas: [],
            warnings: [],
          },
          preFlightCard: {
            assetDeltas: receipt.assetDeltas,
            gasEstimate: 50000,
            warnings: [],
            confidence: 0.95,
          },
        },
      }),
    });
  });
}

async function attemptExecution(page: any, payload: ExecutionPayload) {
  // Mock execution attempt
  let executionBlocked = false;
  let auditEventLogged = false;
  
  await page.route('**/api/v1/portfolio/plan/*/execute', async (route: any) => {
    const request = route.request();
    const body = JSON.parse(request.postData() || '{}');
    
    // Check if payload matches simulation
    // In real implementation, this would be done server-side
    executionBlocked = true;
    
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'PAYLOAD_MISMATCH',
          message: 'Transaction payload does not match simulation',
          details: {
            reason: 'target_contract_mismatch',
            simulated: '0x1234567890123456789012345678901234567890',
            actual: payload.to,
          },
        },
      }),
    });
  });
  
  // Mock audit event logging
  await page.route('**/api/v1/portfolio/audit/events', async (route: any) => {
    if (route.request().method() === 'POST') {
      auditEventLogged = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            apiVersion: 'v1',
            eventId: 'evt_123',
          },
        }),
      });
    } else {
      await route.continue();
    }
  });
  
  return { executionBlocked, auditEventLogged };
}

// ============================================================================
// TESTS
// ============================================================================

test.describe('Target Contract Mismatch', () => {
  test('should block execution when target contract differs', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Setup simulation with contract A
    const receipt = createSimulationReceipt({
      targetContract: '0x1111111111111111111111111111111111111111',
    });
    await setupPlanWithSimulation(page, receipt);
    
    // Create plan
    await page.click('[data-testid="action-card-approve"]');
    await page.waitForSelector('[data-testid="intent-plan"]');
    
    // Simulate
    await page.click('[data-testid="simulate-plan"]');
    await page.waitForSelector('[data-testid="simulation-complete"]');
    
    // Attempt execution with different contract B
    const payload = createExecutionPayload({
      to: '0x2222222222222222222222222222222222222222', // Different contract!
    });
    
    const { executionBlocked, auditEventLogged } = await attemptExecution(page, payload);
    
    // Should block execution
    await page.click('[data-testid="execute-plan"]');
    await page.waitForSelector('[data-testid="execution-blocked"]');
    
    // Should show error message
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toContain('payload');
    expect(errorMessage).toContain('mismatch');
    
    // Should log audit event
    expect(auditEventLogged).toBe(true);
  });
});

test.describe('Calldata Class Mismatch', () => {
  test('should block execution when calldata class differs', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Setup simulation for approve
    const receipt = createSimulationReceipt({
      calldataClass: 'ERC20.approve',
    });
    await setupPlanWithSimulation(page, receipt);
    
    // Create and simulate plan
    await page.click('[data-testid="action-card-approve"]');
    await page.waitForSelector('[data-testid="intent-plan"]');
    await page.click('[data-testid="simulate-plan"]');
    await page.waitForSelector('[data-testid="simulation-complete"]');
    
    // Attempt execution with transfer calldata instead
    const payload = createExecutionPayload({
      data: '0xa9059cbb', // transfer function selector instead of approve
    });
    
    await attemptExecution(page, payload);
    
    // Should block execution
    await page.click('[data-testid="execute-plan"]');
    await page.waitForSelector('[data-testid="execution-blocked"]');
    
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toContain('calldata');
  });
});

test.describe('Asset Delta Mismatch', () => {
  test('should block execution when asset deltas exceed tolerance', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Setup simulation with 1000 USDC out
    const receipt = createSimulationReceipt({
      assetDeltas: [
        {
          token: 'USDC',
          amount: '1000',
          direction: 'out',
        },
      ],
    });
    await setupPlanWithSimulation(page, receipt);
    
    // Create and simulate plan
    await page.click('[data-testid="action-card-swap"]');
    await page.waitForSelector('[data-testid="intent-plan"]');
    await page.click('[data-testid="simulate-plan"]');
    await page.waitForSelector('[data-testid="simulation-complete"]');
    
    // Mock execution attempt with 10000 USDC out (10x more!)
    await page.route('**/api/v1/portfolio/plan/*/execute', async (route: any) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'PAYLOAD_MISMATCH',
            message: 'Asset deltas exceed tolerance',
            details: {
              reason: 'asset_delta_mismatch',
              simulated: '1000',
              actual: '10000',
              tolerance: '2%',
            },
          },
        }),
      });
    });
    
    // Should block execution
    await page.click('[data-testid="execute-plan"]');
    await page.waitForSelector('[data-testid="execution-blocked"]');
    
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toContain('asset');
    expect(errorMessage).toContain('tolerance');
  });
});

test.describe('Stale Simulation Receipt', () => {
  test('should block execution with expired simulation receipt', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Setup simulation with old timestamp (> 60 seconds ago)
    const oldTimestamp = new Date(Date.now() - 120000).toISOString(); // 2 minutes ago
    const receipt = createSimulationReceipt({
      timestamp: oldTimestamp,
    });
    await setupPlanWithSimulation(page, receipt);
    
    // Create and simulate plan
    await page.click('[data-testid="action-card-approve"]');
    await page.waitForSelector('[data-testid="intent-plan"]');
    await page.click('[data-testid="simulate-plan"]');
    await page.waitForSelector('[data-testid="simulation-complete"]');
    
    // Wait for receipt to expire
    await page.waitForTimeout(2000);
    
    // Mock execution attempt with stale receipt
    await page.route('**/api/v1/portfolio/plan/*/execute', async (route: any) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'STALE_RECEIPT',
            message: 'Simulation receipt has expired',
            details: {
              reason: 'receipt_expired',
              receiptAge: 120,
              maxAge: 60,
            },
          },
        }),
      });
    });
    
    // Should block execution
    await page.click('[data-testid="execute-plan"]');
    await page.waitForSelector('[data-testid="execution-blocked"]');
    
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toContain('expired');
    expect(errorMessage).toContain('simulate again');
  });
});

test.describe('TOCTOU Attack Prevention', () => {
  test('should prevent time-of-check-time-of-use attacks', async ({ page }) => {
    await page.goto('/portfolio');
    
    // Setup initial simulation (safe)
    const receipt = createSimulationReceipt({
      targetContract: '0x1111111111111111111111111111111111111111',
      assetDeltas: [
        {
          token: 'USDC',
          amount: '100',
          direction: 'out',
        },
      ],
    });
    await setupPlanWithSimulation(page, receipt);
    
    // Create and simulate plan
    await page.click('[data-testid="action-card-swap"]');
    await page.waitForSelector('[data-testid="intent-plan"]');
    await page.click('[data-testid="simulate-plan"]');
    await page.waitForSelector('[data-testid="simulation-complete"]');
    
    // Simulate state change between simulation and execution
    // (e.g., contract upgraded, price changed dramatically)
    await page.route('**/api/v1/portfolio/plan/*/execute', async (route: any) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'STATE_CHANGED',
            message: 'Contract state has changed since simulation',
            details: {
              reason: 'contract_upgraded',
              action: 'resimulate_required',
            },
          },
        }),
      });
    });
    
    // Should block execution and require re-simulation
    await page.click('[data-testid="execute-plan"]');
    await page.waitForSelector('[data-testid="execution-blocked"]');
    
    const errorMessage = await page.locator('[data-testid="error-message"]').textContent();
    expect(errorMessage).toContain('state');
    expect(errorMessage).toContain('changed');
    
    // Should show "Simulate Again" button
    const resimulateButton = page.locator('[data-testid="resimulate-button"]');
    await expect(resimulateButton).toBeVisible();
  });
});

test.describe('Audit Trail Verification', () => {
  test('should log all payload mismatch events', async ({ page }) => {
    await page.goto('/portfolio');
    
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
    
    // Setup and attempt mismatched execution
    const receipt = createSimulationReceipt();
    await setupPlanWithSimulation(page, receipt);
    
    await page.click('[data-testid="action-card-approve"]');
    await page.waitForSelector('[data-testid="intent-plan"]');
    await page.click('[data-testid="simulate-plan"]');
    await page.waitForSelector('[data-testid="simulation-complete"]');
    
    const payload = createExecutionPayload({
      to: '0x9999999999999999999999999999999999999999', // Different!
    });
    await attemptExecution(page, payload);
    
    await page.click('[data-testid="execute-plan"]');
    await page.waitForTimeout(1000);
    
    // Verify audit event was logged
    expect(auditEvents.length).toBeGreaterThan(0);
    
    const mismatchEvent = auditEvents.find(e => e.eventType === 'payload_mismatch_block');
    expect(mismatchEvent).toBeDefined();
    expect(mismatchEvent.severity).toBe('critical');
    expect(mismatchEvent.metadata).toHaveProperty('simulatedTarget');
    expect(mismatchEvent.metadata).toHaveProperty('actualTarget');
  });
});
