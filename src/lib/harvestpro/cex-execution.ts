/**
 * CEX Manual Execution Service
 * Handles CEX execution flow, step tracking, and session management
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import type { ExecutionStep, HarvestSession } from '@/types/harvestpro';

/**
 * Generate CEX execution steps with detailed metadata
 * Requirement 9.2: Platform-specific instructions
 * Requirement 9.3: Include exact token pair, quantity, and order type
 */
export function generateCEXExecutionSteps(
  sessionId: string,
  exchange: string,
  token: string,
  quantity: number,
  tokenPair?: string
): ExecutionStep[] {
  const pair = tokenPair || `${token}/USDT`;
  const timestamp = new Date().toISOString();

  return [
    {
      id: `${sessionId}-cex-1`,
      sessionId,
      stepNumber: 1,
      description: `Log in to ${exchange}`,
      type: 'cex-manual',
      status: 'pending',
      transactionHash: null,
      cexPlatform: exchange,
      errorMessage: null,
      guardianScore: null,
      timestamp: null,
      createdAt: timestamp,
      metadata: {
        instruction: 'Access your account using your credentials',
        platform: exchange,
      },
    },
    {
      id: `${sessionId}-cex-2`,
      sessionId,
      stepNumber: 2,
      description: `Navigate to ${pair} trading pair`,
      type: 'cex-manual',
      status: 'pending',
      transactionHash: null,
      cexPlatform: exchange,
      errorMessage: null,
      guardianScore: null,
      timestamp: null,
      createdAt: timestamp,
      metadata: {
        instruction: `Find and select the ${pair} trading pair in the spot trading section`,
        tokenPair: pair,
        platform: exchange,
      },
    },
    {
      id: `${sessionId}-cex-3`,
      sessionId,
      stepNumber: 3,
      description: `Place market sell order for ${quantity.toFixed(8)} ${token}`,
      type: 'cex-manual',
      status: 'pending',
      transactionHash: null,
      cexPlatform: exchange,
      errorMessage: null,
      guardianScore: null,
      timestamp: null,
      createdAt: timestamp,
      metadata: {
        instruction: 'Prepare a market sell order at current market price',
        orderType: 'Market Sell',
        token,
        quantity,
        tokenPair: pair,
        platform: exchange,
      },
    },
    {
      id: `${sessionId}-cex-4`,
      sessionId,
      stepNumber: 4,
      description: `Confirm order execution`,
      type: 'cex-manual',
      status: 'pending',
      transactionHash: null,
      cexPlatform: exchange,
      errorMessage: null,
      guardianScore: null,
      timestamp: null,
      createdAt: timestamp,
      metadata: {
        instruction: 'Verify the order was filled successfully and note the execution price',
        platform: exchange,
      },
    },
  ];
}

/**
 * Mark a CEX step as complete
 * Requirement 9.4: Update step status when user marks complete
 */
export function markStepComplete(
  steps: ExecutionStep[],
  stepId: string
): ExecutionStep[] {
  return steps.map((step) => {
    if (step.id === stepId) {
      return {
        ...step,
        status: 'completed' as const,
        timestamp: new Date().toISOString(),
      };
    }
    return step;
  });
}

/**
 * Check if all CEX steps are complete
 * Requirement 9.5: Proceed to success screen when all steps complete
 */
export function areAllCEXStepsComplete(steps: ExecutionStep[]): boolean {
  const cexSteps = steps.filter((step) => step.type === 'cex-manual');
  if (cexSteps.length === 0) return false;
  return cexSteps.every((step) => step.status === 'completed');
}

/**
 * Get CEX steps from a session
 */
export function getCEXSteps(session: HarvestSession): ExecutionStep[] {
  return session.executionSteps.filter((step) => step.type === 'cex-manual');
}

/**
 * Get on-chain steps from a session
 */
export function getOnChainSteps(session: HarvestSession): ExecutionStep[] {
  return session.executionSteps.filter((step) => step.type === 'on-chain');
}

/**
 * Check if session has CEX steps
 * Requirement 9.1: Display CEX instruction panel when CEX holdings involved
 */
export function hasCEXSteps(session: HarvestSession): boolean {
  return session.executionSteps.some((step) => step.type === 'cex-manual');
}

/**
 * Get next pending CEX step
 */
export function getNextPendingCEXStep(
  steps: ExecutionStep[]
): ExecutionStep | null {
  const cexSteps = steps.filter((step) => step.type === 'cex-manual');
  return cexSteps.find((step) => step.status === 'pending') || null;
}

/**
 * Calculate CEX execution progress
 */
export function calculateCEXProgress(steps: ExecutionStep[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const cexSteps = steps.filter((step) => step.type === 'cex-manual');
  const completed = cexSteps.filter((step) => step.status === 'completed').length;
  const total = cexSteps.length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return { completed, total, percentage };
}

/**
 * Validate CEX step completion
 */
export function validateStepCompletion(
  step: ExecutionStep,
  previousSteps: ExecutionStep[]
): { valid: boolean; error?: string } {
  // Check if previous steps are completed
  const cexSteps = previousSteps.filter((s) => s.type === 'cex-manual');
  const currentStepIndex = cexSteps.findIndex((s) => s.id === step.id);

  if (currentStepIndex > 0) {
    const previousStep = cexSteps[currentStepIndex - 1];
    if (previousStep.status !== 'completed') {
      return {
        valid: false,
        error: 'Please complete previous steps first',
      };
    }
  }

  return { valid: true };
}

/**
 * Get platform-specific trade URL
 */
export function getPlatformTradeUrl(
  platform: string,
  tokenPair?: string
): string {
  const pair = tokenPair?.replace('/', '_') || '';

  const urls: Record<string, string> = {
    Binance: `https://www.binance.com/en/trade/${pair}`,
    Coinbase: `https://www.coinbase.com/trade/${pair}`,
    Kraken: `https://www.kraken.com/trade/${pair}`,
    'Binance.US': `https://www.binance.us/en/trade/${pair}`,
  };

  return urls[platform] || `https://www.google.com/search?q=${encodeURIComponent(platform + ' ' + pair)}`;
}

/**
 * Format CEX execution summary for display
 */
export function formatCEXExecutionSummary(steps: ExecutionStep[]): {
  platform: string;
  tokenPair: string;
  orderType: string;
  quantity: string;
  status: string;
} | null {
  const cexSteps = steps.filter((step) => step.type === 'cex-manual');
  if (cexSteps.length === 0) return null;

  const firstStep = cexSteps[0];
  const orderStep = cexSteps.find((step) => step.metadata?.orderType);

  const platform = firstStep.cexPlatform || 'Exchange';
  const tokenPair = orderStep?.metadata?.tokenPair as string || 'N/A';
  const orderType = orderStep?.metadata?.orderType as string || 'Market Sell';
  const quantity = orderStep?.metadata?.quantity
    ? `${(orderStep.metadata.quantity as number).toFixed(8)} ${orderStep.metadata.token}`
    : 'N/A';

  const progress = calculateCEXProgress(steps);
  const status = progress.percentage === 100 ? 'Completed' : `${progress.completed}/${progress.total} steps`;

  return {
    platform,
    tokenPair,
    orderType,
    quantity,
    status,
  };
}
