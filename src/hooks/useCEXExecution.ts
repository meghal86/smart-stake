/**
 * CEX Execution Hook
 * Manages CEX manual execution state and step completion
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import { useState, useCallback, useEffect } from 'react';
import type { ExecutionStep, HarvestSession } from '@/types/harvestpro';
import {
  markStepComplete,
  areAllCEXStepsComplete,
  getCEXSteps,
  calculateCEXProgress,
  validateStepCompletion,
} from '@/lib/harvestpro/cex-execution';

export interface UseCEXExecutionOptions {
  session: HarvestSession;
  onStepComplete?: (stepId: string) => void;
  onAllComplete?: () => void;
  onError?: (error: string) => void;
}

export interface UseCEXExecutionReturn {
  cexSteps: ExecutionStep[];
  completedSteps: Set<string>;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  isAllComplete: boolean;
  completeStep: (stepId: string) => Promise<void>;
  uncompleteStep: (stepId: string) => void;
  resetProgress: () => void;
}

/**
 * Hook for managing CEX execution flow
 */
export function useCEXExecution({
  session,
  onStepComplete,
  onAllComplete,
  onError,
}: UseCEXExecutionOptions): UseCEXExecutionReturn {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [cexSteps, setCexSteps] = useState<ExecutionStep[]>(() => getCEXSteps(session));

  // Update CEX steps when session changes
  useEffect(() => {
    const steps = getCEXSteps(session);
    setCexSteps(steps);

    // Initialize completed steps from session
    const completed = new Set(
      steps.filter((step) => step.status === 'completed').map((step) => step.id)
    );
    setCompletedSteps(completed);
  }, [session]);

  // Calculate progress
  const progress = calculateCEXProgress(cexSteps);
  const isAllComplete = areAllCEXStepsComplete(cexSteps);

  // Check if all steps are complete and trigger callback
  useEffect(() => {
    if (isAllComplete && onAllComplete) {
      onAllComplete();
    }
  }, [isAllComplete, onAllComplete]);

  /**
   * Complete a CEX step
   * Requirement 9.4: Update step status when user marks complete
   */
  const completeStep = useCallback(
    async (stepId: string) => {
      try {
        const step = cexSteps.find((s) => s.id === stepId);
        if (!step) {
          throw new Error('Step not found');
        }

        // Validate step completion
        const validation = validateStepCompletion(step, cexSteps);
        if (!validation.valid) {
          if (onError) {
            onError(validation.error || 'Cannot complete this step');
          }
          return;
        }

        // Mark step as complete
        const updatedSteps = markStepComplete(cexSteps, stepId);
        setCexSteps(updatedSteps);

        // Update completed steps set
        setCompletedSteps((prev) => new Set([...prev, stepId]));

        // Trigger callback
        if (onStepComplete) {
          onStepComplete(stepId);
        }
      } catch (error) {
        if (onError) {
          onError(error instanceof Error ? error.message : 'Failed to complete step');
        }
      }
    },
    [cexSteps, onStepComplete, onError]
  );

  /**
   * Uncomplete a CEX step (allow users to undo)
   */
  const uncompleteStep = useCallback(
    (stepId: string) => {
      const updatedSteps = cexSteps.map((step) => {
        if (step.id === stepId) {
          return {
            ...step,
            status: 'pending' as const,
            timestamp: null,
          };
        }
        return step;
      });

      setCexSteps(updatedSteps);
      setCompletedSteps((prev) => {
        const newSet = new Set(prev);
        newSet.delete(stepId);
        return newSet;
      });
    },
    [cexSteps]
  );

  /**
   * Reset all progress
   */
  const resetProgress = useCallback(() => {
    const resetSteps = cexSteps.map((step) => ({
      ...step,
      status: 'pending' as const,
      timestamp: null,
    }));
    setCexSteps(resetSteps);
    setCompletedSteps(new Set());
  }, [cexSteps]);

  return {
    cexSteps,
    completedSteps,
    progress,
    isAllComplete,
    completeStep,
    uncompleteStep,
    resetProgress,
  };
}
