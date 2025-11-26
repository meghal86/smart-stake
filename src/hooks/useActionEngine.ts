/**
 * React Hook for Action Engine Execution
 * Manages execution state and provides execution controls
 */

import { useState, useCallback } from 'react';
import type { HarvestSession, ExecutionStep } from '@/types/harvestpro';
import {
  simulateSessionExecution,
  createMockExecutionSteps,
  type SimulationConfig,
} from '@/lib/harvestpro/action-engine-simulator';

export interface UseActionEngineOptions {
  /** Use simulator for development/testing */
  useSimulator?: boolean;
  /** Simulator configuration */
  simulatorConfig?: SimulationConfig;
  /** Callback when execution completes successfully */
  onSuccess?: (session: HarvestSession) => void;
  /** Callback when execution fails */
  onError?: (error: string, session: HarvestSession) => void;
}

export interface UseActionEngineReturn {
  /** Current execution state */
  isExecuting: boolean;
  /** Current step being executed (0-indexed) */
  currentStepIndex: number;
  /** Execution logs */
  logs: string[];
  /** Error message if execution failed */
  error: string | null;
  /** Execute a harvest session */
  executeSession: (session: HarvestSession) => Promise<void>;
  /** Retry a failed execution */
  retryExecution: (session: HarvestSession) => Promise<void>;
  /** Cancel ongoing execution */
  cancelExecution: () => void;
  /** Clear error state */
  clearError: () => void;
  /** Generate mock execution steps for testing */
  generateMockSteps: (sessionId: string, opportunityCount?: number) => ExecutionStep[];
}

export function useActionEngine(options: UseActionEngineOptions = {}): UseActionEngineReturn {
  const {
    useSimulator = true,
    simulatorConfig,
    onSuccess,
    onError,
  } = options;

  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cancelRequested, setCancelRequested] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cancelExecution = useCallback(() => {
    setCancelRequested(true);
  }, []);

  const executeSession = useCallback(
    async (session: HarvestSession) => {
      if (isExecuting) {
        console.warn('Execution already in progress');
        return;
      }

      setIsExecuting(true);
      setCurrentStepIndex(0);
      setLogs([]);
      setError(null);
      setCancelRequested(false);

      try {
        if (useSimulator) {
          // Use simulator for development
          const result = await simulateSessionExecution(
            session.executionSteps,
            { ...simulatorConfig, verbose: true },
            (updatedStep, index) => {
              if (cancelRequested) {
                throw new Error('Execution cancelled by user');
              }
              setCurrentStepIndex(index);
            }
          );

          setLogs(result.logs);

          if (result.success) {
            // All steps completed successfully
            const updatedSession: HarvestSession = {
              ...session,
              status: 'completed',
              executionSteps: result.completedSteps,
              updatedAt: new Date().toISOString(),
            };

            if (onSuccess) {
              onSuccess(updatedSession);
            }
          } else {
            // Execution failed
            const errorMessage = result.failedStep?.errorMessage || 'Execution failed';
            setError(errorMessage);

            const updatedSession: HarvestSession = {
              ...session,
              status: 'failed',
              executionSteps: [
                ...result.completedSteps,
                result.failedStep!,
                ...session.executionSteps.slice(result.completedSteps.length + 1),
              ],
              updatedAt: new Date().toISOString(),
            };

            if (onError) {
              onError(errorMessage, updatedSession);
            }
          }
        } else {
          // TODO: Integrate with real Action Engine
          // This will be implemented when the real Action Engine is available
          throw new Error('Real Action Engine integration not yet implemented');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);

        const failedSession: HarvestSession = {
          ...session,
          status: 'failed',
          updatedAt: new Date().toISOString(),
        };

        if (onError) {
          onError(errorMessage, failedSession);
        }
      } finally {
        setIsExecuting(false);
        setCurrentStepIndex(-1);
        setCancelRequested(false);
      }
    },
    [isExecuting, useSimulator, simulatorConfig, cancelRequested, onSuccess, onError]
  );

  const retryExecution = useCallback(
    async (session: HarvestSession) => {
      // Find the failed step
      const failedStepIndex = session.executionSteps.findIndex(
        (step) => step.status === 'failed'
      );

      if (failedStepIndex === -1) {
        console.warn('No failed step found to retry');
        return;
      }

      setIsExecuting(true);
      setCurrentStepIndex(failedStepIndex);
      setError(null);
      setCancelRequested(false);

      // Reset failed step and all subsequent steps
      const resetSteps = session.executionSteps.map((step, index) => {
        if (index >= failedStepIndex) {
          return {
            ...step,
            status: 'pending' as const,
            errorMessage: null,
            transactionHash: null,
          };
        }
        return step;
      });

      try {
        if (useSimulator) {
          const stepsToExecute = resetSteps.slice(failedStepIndex);
          const result = await simulateSessionExecution(
            stepsToExecute,
            { ...simulatorConfig, verbose: true, failureProbability: 0.05 }, // Lower failure rate on retry
            (updatedStep, relativeIndex) => {
              if (cancelRequested) {
                throw new Error('Retry cancelled by user');
              }
              setCurrentStepIndex(failedStepIndex + relativeIndex);
            }
          );

          setLogs((prev) => [...prev, ...result.logs]);

          if (result.success) {
            const allCompletedSteps = [
              ...resetSteps.slice(0, failedStepIndex),
              ...result.completedSteps,
            ];

            const updatedSession: HarvestSession = {
              ...session,
              status: 'completed',
              executionSteps: allCompletedSteps,
              updatedAt: new Date().toISOString(),
            };

            if (onSuccess) {
              onSuccess(updatedSession);
            }
          } else {
            const errorMessage = result.failedStep?.errorMessage || 'Retry failed';
            setError(errorMessage);

            const failedSession: HarvestSession = {
              ...session,
              status: 'failed',
              executionSteps: [
                ...resetSteps.slice(0, failedStepIndex),
                ...result.completedSteps,
                result.failedStep!,
                ...resetSteps.slice(failedStepIndex + result.completedSteps.length + 1),
              ],
              updatedAt: new Date().toISOString(),
            };

            if (onError) {
              onError(errorMessage, failedSession);
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Retry failed';
        setError(errorMessage);

        if (onError) {
          onError(errorMessage, session);
        }
      } finally {
        setIsExecuting(false);
        setCurrentStepIndex(-1);
        setCancelRequested(false);
      }
    },
    [isExecuting, useSimulator, simulatorConfig, cancelRequested, onSuccess, onError]
  );

  const generateMockSteps = useCallback(
    (sessionId: string, opportunityCount: number = 1): ExecutionStep[] => {
      return createMockExecutionSteps(sessionId, opportunityCount);
    },
    []
  );

  return {
    isExecuting,
    currentStepIndex,
    logs,
    error,
    executeSession,
    retryExecution,
    cancelExecution,
    clearError,
    generateMockSteps,
  };
}
