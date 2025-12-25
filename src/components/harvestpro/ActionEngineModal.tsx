/**
 * Action Engine Modal
 * Transaction confirmation and execution tracking modal
 * Requirements: 8.2, 8.3, 8.4, 8.5
 */

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import type { ExecutionStep, HarvestSession } from '@/types/harvestpro';
import { simulateSessionExecution, type SimulationConfig } from '@/lib/harvestpro/action-engine-simulator';

export interface ActionEngineModalProps {
  session: HarvestSession;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (session: HarvestSession) => void;
  onError: (error: string) => void;
  /** Use simulator for development/testing */
  useSimulator?: boolean;
  simulatorConfig?: SimulationConfig;
}

export function ActionEngineModal({
  session,
  isOpen,
  onClose,
  onComplete,
  onError,
  useSimulator = true,
  simulatorConfig,
}: ActionEngineModalProps) {
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>(session.executionSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);

  // Reset state when session changes
  useEffect(() => {
    setExecutionSteps(session.executionSteps);
    setCurrentStepIndex(-1);
    setIsExecuting(false);
    setHasStarted(false);
    setLogs([]);
  }, [session.sessionId]);

  const handlePrepare = async () => {
    setIsExecuting(true);
    setHasStarted(true);
    setCurrentStepIndex(0);

    try {
      if (useSimulator) {
        // Use simulator for development
        const result = await simulateSessionExecution(
          executionSteps,
          { ...simulatorConfig, verbose: true },
          (updatedStep, index) => {
            setCurrentStepIndex(index);
            setExecutionSteps((prev) => {
              const updated = [...prev];
              updated[index] = updatedStep;
              return updated;
            });
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
          onComplete(updatedSession);
        } else {
          // Execution failed
          const updatedSession: HarvestSession = {
            ...session,
            status: 'failed',
            executionSteps: [
              ...result.completedSteps,
              result.failedStep!,
              ...executionSteps.slice(result.completedSteps.length + 1),
            ],
            updatedAt: new Date().toISOString(),
          };
          setExecutionSteps(updatedSession.executionSteps);
          onError(result.failedStep?.errorMessage || 'Execution failed');
        }
      } else {
        // TODO: Integrate with real Action Engine
        // This will be implemented when the real Action Engine is available
        onError('Real Action Engine integration not yet implemented');
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRetry = async () => {
    // Find the failed step
    const failedStepIndex = executionSteps.findIndex((step) => step.status === 'failed');
    if (failedStepIndex === -1) return;

    setIsExecuting(true);
    setCurrentStepIndex(failedStepIndex);

    // Reset failed step and all subsequent steps
    const resetSteps = executionSteps.map((step, index) => {
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

    setExecutionSteps(resetSteps);

    // Continue execution from failed step
    try {
      if (useSimulator) {
        const stepsToPrepare = resetSteps.slice(failedStepIndex);
        const result = await simulateSessionExecution(
          stepsToPrepare,
          { ...simulatorConfig, verbose: true, failureProbability: 0.05 }, // Lower failure rate on retry
          (updatedStep, relativeIndex) => {
            const absoluteIndex = failedStepIndex + relativeIndex;
            setCurrentStepIndex(absoluteIndex);
            setExecutionSteps((prev) => {
              const updated = [...prev];
              updated[absoluteIndex] = updatedStep;
              return updated;
            });
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
          onComplete(updatedSession);
        } else {
          onError(result.failedStep?.errorMessage || 'Retry failed');
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Retry failed');
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  const hasFailedStep = executionSteps.some((step) => step.status === 'failed');
  const allCompleted = executionSteps.every((step) => step.status === 'completed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Prepare Harvest
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {session.opportunitiesSelected.length} opportunit{session.opportunitiesSelected.length === 1 ? 'y' : 'ies'} • {executionSteps.length} steps
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Loss</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${session.realizedLossesTotal.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Net Benefit</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  ${session.netBenefitTotal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Execution Steps */}
          <div className="space-y-3">
            {executionSteps.map((step, index) => (
              <ExecutionStepCard
                key={step.id}
                step={step}
                isActive={index === currentStepIndex}
                isExecuting={isExecuting && index === currentStepIndex}
              />
            ))}
          </div>

          {/* Logs Panel */}
          {logs.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2"
              >
                {showLogs ? 'Hide' : 'Show'} execution logs ({logs.length})
              </button>
              {showLogs && (
                <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {allCompleted && '✓ All steps completed'}
            {hasFailedStep && !isExecuting && '⚠ Execution failed'}
            {isExecuting && `Executing step ${currentStepIndex + 1} of ${executionSteps.length}...`}
            {!hasStarted && !allCompleted && 'Ready to prepare'}
          </div>
          <div className="flex gap-3">
            {!hasStarted && !allCompleted && (
              <PrimaryButton
                onClick={handlePrepare}
                isLoading={isExecuting}
                loadingText="Preparing..."
                variant="primary"
                className="px-6 py-2 font-medium"
              >
                Prepare Harvest
              </PrimaryButton>
            )}
            {hasFailedStep && !isExecuting && (
              <PrimaryButton
                onClick={handleRetry}
                variant="secondary"
                className="px-6 py-2 font-medium bg-orange-600 hover:bg-orange-700"
              >
                Retry Failed Step
              </PrimaryButton>
            )}
            {allCompleted && (
              <PrimaryButton
                onClick={onClose}
                variant="primary"
                className="px-6 py-2 font-medium bg-green-600 hover:bg-green-700"
              >
                Done
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ExecutionStepCardProps {
  step: ExecutionStep;
  isActive: boolean;
  isExecuting: boolean;
}

function ExecutionStepCard({ step, isActive, isExecuting }: ExecutionStepCardProps) {
  const getStatusIcon = () => {
    if (step.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (step.status === 'failed') {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }
    if (isExecuting) {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }
    return (
      <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
    );
  };

  const getStatusColor = () => {
    if (step.status === 'completed') return 'border-green-200 bg-green-50 dark:bg-green-900/20';
    if (step.status === 'failed') return 'border-red-200 bg-red-50 dark:bg-red-900/20';
    if (isActive) return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20';
    return 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700';
  };

  return (
    <div className={`border rounded-lg p-4 transition-all ${getStatusColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900 dark:text-white">
              Step {step.stepNumber}: {step.description}
            </p>
            {step.guardianScore !== null && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-600 dark:text-gray-400">Guardian:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {step.guardianScore.toFixed(1)}/10
                </span>
              </div>
            )}
          </div>

          {step.type === 'cex-manual' && step.cexPlatform && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Platform: {step.cexPlatform}
            </p>
          )}

          {step.transactionHash && (
            <a
              href={`https://etherscan.io/tx/${step.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-flex items-center gap-1"
            >
              View transaction <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {step.errorMessage && (
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-sm text-red-800 dark:text-red-200">
              {step.errorMessage}
            </div>
          )}

          {step.durationMs && step.status === 'completed' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Completed in {(step.durationMs / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
