/**
 * Portfolio Execution Step State Management
 * Handles execution step tracking, state transitions, and validation
 * Requirements: 7.1
 */

import type { ExecutionStep } from '@/types/portfolio';

// Valid state transitions for execution steps
const VALID_TRANSITIONS: Record<ExecutionStep['status'], ExecutionStep['status'][]> = {
  'pending': ['simulated', 'blocked', 'failed'],
  'simulated': ['blocked', 'ready', 'failed'],
  'blocked': ['pending', 'failed'], // Can retry from blocked
  'ready': ['signing', 'failed'],
  'signing': ['submitted', 'failed'],
  'submitted': ['confirmed', 'failed'],
  'confirmed': [], // Terminal state
  'failed': ['pending'], // Can retry from failed
};

export interface StateTransitionResult {
  success: boolean;
  error?: string;
  newStep?: ExecutionStep;
}

export interface ExecutionStepUpdate {
  status?: ExecutionStep['status'];
  payload?: string;
  gas_estimate?: number;
  error_message?: string;
  transaction_hash?: string;
  block_number?: number;
}

/**
 * Validates if a state transition is allowed
 */
export function isValidStateTransition(
  currentStatus: ExecutionStep['status'],
  newStatus: ExecutionStep['status']
): boolean {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Updates an execution step with validation
 */
export function updateExecutionStep(
  step: ExecutionStep,
  update: ExecutionStepUpdate
): StateTransitionResult {
  // If status is being updated, validate the transition
  if (update.status && update.status !== step.status) {
    if (!isValidStateTransition(step.status, update.status)) {
      return {
        success: false,
        error: `Invalid state transition from ${step.status} to ${update.status}`,
      };
    }
  }

  // Validate required fields for certain states
  if (update.status === 'submitted' && !update.transaction_hash) {
    return {
      success: false,
      error: 'Transaction hash is required when status is submitted',
    };
  }

  if (update.status === 'confirmed' && (!update.transaction_hash || !update.block_number)) {
    return {
      success: false,
      error: 'Transaction hash and block number are required when status is confirmed',
    };
  }

  if (update.status === 'failed' && !update.error_message) {
    return {
      success: false,
      error: 'Error message is required when status is failed',
    };
  }

  // Create updated step
  const newStep: ExecutionStep = {
    ...step,
    ...update,
  };

  return {
    success: true,
    newStep,
  };
}

/**
 * Tracks step progression through valid states
 */
export function trackStepProgression(steps: ExecutionStep[]): {
  totalSteps: number;
  pendingSteps: number;
  simulatedSteps: number;
  readySteps: number;
  executingSteps: number; // signing + submitted
  completedSteps: number; // confirmed
  failedSteps: number;
  blockedSteps: number;
  canProceed: boolean;
} {
  const totalSteps = steps.length;
  const pendingSteps = steps.filter(s => s.status === 'pending').length;
  const simulatedSteps = steps.filter(s => s.status === 'simulated').length;
  const readySteps = steps.filter(s => s.status === 'ready').length;
  const executingSteps = steps.filter(s => ['signing', 'submitted'].includes(s.status)).length;
  const completedSteps = steps.filter(s => s.status === 'confirmed').length;
  const failedSteps = steps.filter(s => s.status === 'failed').length;
  const blockedSteps = steps.filter(s => s.status === 'blocked').length;

  // Can proceed if there are ready steps and no currently executing steps
  const canProceed = readySteps > 0 && executingSteps === 0;

  return {
    totalSteps,
    pendingSteps,
    simulatedSteps,
    readySteps,
    executingSteps,
    completedSteps,
    failedSteps,
    blockedSteps,
    canProceed,
  };
}

/**
 * Gets the next step that can be executed
 */
export function getNextExecutableStep(steps: ExecutionStep[]): ExecutionStep | null {
  // Find the first ready step
  return steps.find(step => step.status === 'ready') || null;
}

/**
 * Checks if all steps are in a terminal state (confirmed or failed)
 */
export function areAllStepsComplete(steps: ExecutionStep[]): boolean {
  return steps.every(step => ['confirmed', 'failed'].includes(step.status));
}

/**
 * Gets steps that can be retried (failed or blocked)
 */
export function getRetryableSteps(steps: ExecutionStep[]): ExecutionStep[] {
  return steps.filter(step => ['failed', 'blocked'].includes(step.status));
}

/**
 * Validates step dependencies (if any step depends on another)
 */
export function validateStepDependencies(
  steps: ExecutionStep[],
  stepToExecute: ExecutionStep
): { valid: boolean; error?: string } {
  // For now, we assume steps can be executed independently
  // This can be extended to support dependency chains
  const stepIndex = steps.findIndex(s => s.stepId === stepToExecute.stepId);
  
  if (stepIndex === -1) {
    return {
      valid: false,
      error: 'Step not found in execution plan',
    };
  }

  // Basic validation: step must be in ready state
  if (stepToExecute.status !== 'ready') {
    return {
      valid: false,
      error: `Step must be in ready state, currently ${stepToExecute.status}`,
    };
  }

  return { valid: true };
}

/**
 * Adds transaction hash and block number tracking
 */
export function addTransactionTracking(
  step: ExecutionStep,
  transactionHash: string,
  blockNumber?: number
): StateTransitionResult {
  const update: ExecutionStepUpdate = {
    transaction_hash: transactionHash,
  };

  if (blockNumber) {
    update.block_number = blockNumber;
    update.status = 'confirmed';
  } else {
    update.status = 'submitted';
  }

  return updateExecutionStep(step, update);
}

/**
 * Marks a step as failed with error message
 */
export function markStepFailed(
  step: ExecutionStep,
  errorMessage: string
): StateTransitionResult {
  return updateExecutionStep(step, {
    status: 'failed',
    error_message: errorMessage,
  });
}

/**
 * Marks a step as ready for execution
 */
export function markStepReady(
  step: ExecutionStep,
  payload?: string,
  gasEstimate?: number
): StateTransitionResult {
  return updateExecutionStep(step, {
    status: 'ready',
    payload,
    gas_estimate: gasEstimate,
  });
}

/**
 * Marks a step as blocked (e.g., by policy or simulation)
 */
export function markStepBlocked(
  step: ExecutionStep,
  reason: string
): StateTransitionResult {
  return updateExecutionStep(step, {
    status: 'blocked',
    error_message: reason,
  });
}

/**
 * Gets execution summary for display
 */
export function getExecutionSummary(steps: ExecutionStep[]): {
  progress: number; // 0-100
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'mixed';
  message: string;
} {
  const progression = trackStepProgression(steps);
  const { totalSteps, completedSteps, failedSteps, executingSteps } = progression;

  if (totalSteps === 0) {
    return {
      progress: 0,
      status: 'pending',
      message: 'No steps to execute',
    };
  }

  const progress = Math.round((completedSteps / totalSteps) * 100);

  if (completedSteps === totalSteps) {
    return {
      progress: 100,
      status: 'completed',
      message: 'All steps completed successfully',
    };
  }

  if (failedSteps > 0 && completedSteps + failedSteps === totalSteps) {
    return {
      progress,
      status: 'failed',
      message: `${failedSteps} step(s) failed`,
    };
  }

  if (failedSteps > 0) {
    return {
      progress,
      status: 'mixed',
      message: `${completedSteps} completed, ${failedSteps} failed`,
    };
  }

  if (executingSteps > 0) {
    return {
      progress,
      status: 'executing',
      message: `Executing ${executingSteps} step(s)`,
    };
  }

  return {
    progress,
    status: 'pending',
    message: `${completedSteps}/${totalSteps} steps completed`,
  };
}