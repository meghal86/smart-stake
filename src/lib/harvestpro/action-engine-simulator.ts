/**
 * Action Engine Simulator
 * Mock implementation for development and testing
 * Simulates on-chain transaction flows, failures, slippage, and retry scenarios
 */

import type { ExecutionStep, ExecutionStepStatus } from '@/types/harvestpro';

export interface SimulationConfig {
  /** Delay in ms for each step execution */
  stepDelay?: number;
  /** Probability of failure (0-1) */
  failureProbability?: number;
  /** Probability of high slippage (0-1) */
  slippageProbability?: number;
  /** Enable detailed logging */
  verbose?: boolean;
}

export interface SimulationResult {
  success: boolean;
  step: ExecutionStep;
  logs: string[];
}

const DEFAULT_CONFIG: SimulationConfig = {
  stepDelay: 2000, // 2 seconds per step
  failureProbability: 0.1, // 10% chance of failure
  slippageProbability: 0.15, // 15% chance of high slippage
  verbose: false,
};

/**
 * Simulate execution of a single step
 */
export async function simulateStepExecution(
  step: ExecutionStep,
  config: SimulationConfig = {}
): Promise<SimulationResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const logs: string[] = [];

  // Log start
  if (cfg.verbose) {
    logs.push(`[${new Date().toISOString()}] Starting step ${step.stepNumber}: ${step.description}`);
  }

  // Simulate network delay
  await delay(cfg.stepDelay || 2000);

  // Simulate random failure
  const shouldFail = Math.random() < (cfg.failureProbability || 0);
  if (shouldFail) {
    const errorMessages = [
      'Transaction reverted: insufficient balance',
      'Gas estimation failed: network congestion',
      'RPC timeout: please retry',
      'Slippage tolerance exceeded',
      'User rejected transaction',
    ];
    const errorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

    if (cfg.verbose) {
      logs.push(`[${new Date().toISOString()}] Step ${step.stepNumber} failed: ${errorMessage}`);
    }

    return {
      success: false,
      step: {
        ...step,
        status: 'failed',
        errorMessage,
        timestamp: new Date().toISOString(),
        durationMs: cfg.stepDelay,
      },
      logs,
    };
  }

  // Simulate high slippage warning
  const hasHighSlippage = Math.random() < (cfg.slippageProbability || 0);
  if (hasHighSlippage && cfg.verbose) {
    logs.push(`[${new Date().toISOString()}] Warning: High slippage detected (${(Math.random() * 5 + 2).toFixed(2)}%)`);
  }

  // Generate mock transaction hash
  const txHash = generateMockTxHash();

  if (cfg.verbose) {
    logs.push(`[${new Date().toISOString()}] Step ${step.stepNumber} completed successfully`);
    logs.push(`[${new Date().toISOString()}] Transaction hash: ${txHash}`);
  }

  return {
    success: true,
    step: {
      ...step,
      status: 'completed',
      transactionHash: txHash,
      errorMessage: null,
      timestamp: new Date().toISOString(),
      durationMs: cfg.stepDelay,
    },
    logs,
  };
}

/**
 * Simulate execution of multiple steps in sequence
 */
export async function simulateSessionExecution(
  steps: ExecutionStep[],
  config: SimulationConfig = {},
  onStepUpdate?: (step: ExecutionStep, index: number) => void
): Promise<{
  success: boolean;
  completedSteps: ExecutionStep[];
  failedStep: ExecutionStep | null;
  logs: string[];
}> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const allLogs: string[] = [];
  const completedSteps: ExecutionStep[] = [];
  let failedStep: ExecutionStep | null = null;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    // Update step to executing
    const executingStep = { ...step, status: 'executing' as ExecutionStepStatus };
    if (onStepUpdate) {
      onStepUpdate(executingStep, i);
    }

    // Simulate execution
    const result = await simulateStepExecution(step, cfg);
    allLogs.push(...result.logs);

    if (!result.success) {
      failedStep = result.step;
      if (onStepUpdate) {
        onStepUpdate(result.step, i);
      }
      return {
        success: false,
        completedSteps,
        failedStep,
        logs: allLogs,
      };
    }

    completedSteps.push(result.step);
    if (onStepUpdate) {
      onStepUpdate(result.step, i);
    }
  }

  return {
    success: true,
    completedSteps,
    failedStep: null,
    logs: allLogs,
  };
}

/**
 * Simulate retry of a failed step
 */
export async function simulateRetry(
  step: ExecutionStep,
  config: SimulationConfig = {}
): Promise<SimulationResult> {
  // Reduce failure probability on retry
  const retryConfig = {
    ...config,
    failureProbability: (config.failureProbability || 0.1) * 0.3, // 70% less likely to fail
  };

  return simulateStepExecution(
    {
      ...step,
      status: 'pending',
      errorMessage: null,
      transactionHash: null,
    },
    retryConfig
  );
}

/**
 * Generate mock transaction hash
 */
function generateMockTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create mock execution steps for testing
 */
export function createMockExecutionSteps(
  sessionId: string,
  opportunityCount: number = 1
): ExecutionStep[] {
  const steps: ExecutionStep[] = [];
  let stepNumber = 1;

  for (let i = 0; i < opportunityCount; i++) {
    const token = ['ETH', 'USDC', 'WBTC', 'LINK', 'UNI'][i % 5];

    // Approve step
    steps.push({
      id: `step-${stepNumber}`,
      sessionId,
      stepNumber: stepNumber++,
      description: `Approve ${token} spending`,
      type: 'on-chain',
      status: 'pending',
      transactionHash: null,
      errorMessage: null,
      guardianScore: 8.5 + Math.random() * 1.5,
      timestamp: null,
      createdAt: new Date().toISOString(),
    });

    // Swap step
    steps.push({
      id: `step-${stepNumber}`,
      sessionId,
      stepNumber: stepNumber++,
      description: `Swap ${token} to USDC`,
      type: 'on-chain',
      status: 'pending',
      transactionHash: null,
      errorMessage: null,
      guardianScore: 7.5 + Math.random() * 2,
      timestamp: null,
      createdAt: new Date().toISOString(),
    });
  }

  return steps;
}

/**
 * Simulate CEX manual execution
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export function createCEXExecutionSteps(
  sessionId: string,
  exchange: string,
  token: string,
  quantity?: number,
  tokenPair?: string
): ExecutionStep[] {
  const pair = tokenPair || `${token}/USDT`;
  const qty = quantity || 0;
  
  return [
    {
      id: `cex-step-1`,
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
      createdAt: new Date().toISOString(),
      metadata: {
        instruction: 'Access your account using your credentials',
        platform: exchange,
      },
    },
    {
      id: `cex-step-2`,
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
      createdAt: new Date().toISOString(),
      metadata: {
        instruction: `Find and select the ${pair} trading pair`,
        tokenPair: pair,
        platform: exchange,
      },
    },
    {
      id: `cex-step-3`,
      sessionId,
      stepNumber: 3,
      description: `Place market sell order for ${qty > 0 ? qty.toFixed(8) : ''} ${token}`,
      type: 'cex-manual',
      status: 'pending',
      transactionHash: null,
      cexPlatform: exchange,
      errorMessage: null,
      guardianScore: null,
      timestamp: null,
      createdAt: new Date().toISOString(),
      metadata: {
        instruction: 'Prepare a market sell order at current market price',
        orderType: 'Market Sell',
        token,
        quantity: qty,
        tokenPair: pair,
        platform: exchange,
      },
    },
    {
      id: `cex-step-4`,
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
      createdAt: new Date().toISOString(),
      metadata: {
        instruction: 'Verify the order was filled successfully and note the execution price',
        platform: exchange,
      },
    },
  ];
}
