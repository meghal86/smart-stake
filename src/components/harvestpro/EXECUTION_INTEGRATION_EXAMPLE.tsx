/**
 * Action Engine Integration Example
 * Demonstrates how to integrate ActionEngineModal with HarvestDetailModal
 * 
 * This is a reference implementation showing the complete execution flow.
 * DO NOT import this file - it's for documentation purposes only.
 */

import React, { useState } from 'react';
import { ActionEngineModal, CEXExecutionPanel } from '@/components/harvestpro';
import { useActionEngine } from '@/hooks/useActionEngine';
import { createMockExecutionSteps, createCEXExecutionSteps } from '@/lib/harvestpro/action-engine-simulator';
import type { HarvestSession, HarvestOpportunity, ExecutionStep } from '@/types/harvestpro';

/**
 * Example 1: Basic Integration with HarvestDetailModal
 */
export function HarvestDetailModalWithExecution() {
  const [showActionEngine, setShowActionEngine] = useState(false);
  const [session, setSession] = useState<HarvestSession | null>(null);
  const [opportunity, setOpportunity] = useState<HarvestOpportunity | null>(null);

  const handleExecuteHarvest = async () => {
    if (!opportunity) return;

    // Create a harvest session
    const newSession: HarvestSession = {
      sessionId: `session-${Date.now()}`,
      userId: 'user-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      opportunitiesSelected: [opportunity],
      realizedLossesTotal: opportunity.unrealizedLoss,
      netBenefitTotal: opportunity.netTaxBenefit,
      executionSteps: createMockExecutionSteps(`session-${Date.now()}`, 1),
      exportUrl: null,
      proofHash: null,
    };

    setSession(newSession);
    setShowActionEngine(true);
  };

  const handleExecutionComplete = (updatedSession: HarvestSession) => {
    console.log('Harvest completed successfully!', updatedSession);
    setShowActionEngine(false);
    // Navigate to success screen
    // router.push(`/harvestpro/success/${updatedSession.sessionId}`);
  };

  const handleExecutionError = (error: string) => {
    console.error('Harvest execution failed:', error);
    // Show error toast
    // toast.error(error);
  };

  return (
    <div>
      {/* Your HarvestDetailModal content */}
      <button
        onClick={handleExecuteHarvest}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        Execute Harvest
      </button>

      {/* Action Engine Modal */}
      {session && (
        <ActionEngineModal
          session={session}
          isOpen={showActionEngine}
          onClose={() => setShowActionEngine(false)}
          onComplete={handleExecutionComplete}
          onError={handleExecutionError}
          useSimulator={true}
          simulatorConfig={{
            stepDelay: 2000,
            failureProbability: 0.1,
            verbose: true,
          }}
        />
      )}
    </div>
  );
}

/**
 * Example 2: Using the useActionEngine Hook
 */
export function CustomExecutionFlow() {
  const [session, setSession] = useState<HarvestSession | null>(null);

  const {
    isExecuting,
    currentStepIndex,
    logs,
    error,
    executeSession,
    retryExecution,
    clearError,
    generateMockSteps,
  } = useActionEngine({
    useSimulator: true,
    simulatorConfig: {
      stepDelay: 2000,
      failureProbability: 0.1,
    },
    onSuccess: (updatedSession) => {
      console.log('Success!', updatedSession);
      // Navigate to success screen
    },
    onError: (error, failedSession) => {
      console.error('Failed:', error);
      setSession(failedSession);
    },
  });

  const handleStartExecution = async () => {
    if (!session) return;
    await executeSession(session);
  };

  const handleRetry = async () => {
    if (!session) return;
    await retryExecution(session);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Custom Execution Flow</h2>

      {/* Execution Status */}
      {isExecuting && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-900">
            Executing step {currentStepIndex + 1} of {session?.executionSteps.length}...
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg">
          <p className="text-red-900 font-semibold">Error: {error}</p>
          <button
            onClick={handleRetry}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Retry Failed Step
          </button>
        </div>
      )}

      {/* Execution Logs */}
      {logs.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Execution Logs</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs max-h-48 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleStartExecution}
          disabled={isExecuting || !session}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {isExecuting ? 'Executing...' : 'Start Execution'}
        </button>
      </div>
    </div>
  );
}

/**
 * Example 3: CEX Manual Execution
 */
export function CEXExecutionExample() {
  const [steps, setSteps] = useState<ExecutionStep[]>([]);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Generate CEX execution steps
    const cexSteps = createCEXExecutionSteps('session-123', 'Binance', 'ETH');
    setSteps(cexSteps);
  }, []);

  const handleStepComplete = (stepId: string) => {
    console.log('Step completed:', stepId);
    setCompletedSteps((prev) => new Set([...prev, stepId]));
  };

  const handleAllComplete = () => {
    console.log('All CEX steps completed!');
    // Navigate to success screen
    // router.push('/harvestpro/success');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">CEX Manual Execution</h2>

      <CEXExecutionPanel
        steps={steps}
        onStepComplete={handleStepComplete}
        onAllComplete={handleAllComplete}
      />

      {/* Progress Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Completed: {completedSteps.size} / {steps.length} steps
        </p>
      </div>
    </div>
  );
}

/**
 * Example 4: Mixed Execution (On-Chain + CEX)
 */
export function MixedExecutionExample() {
  const [session, setSession] = useState<HarvestSession | null>(null);
  const [showActionEngine, setShowActionEngine] = useState(false);
  const [showCEXPanel, setShowCEXPanel] = useState(false);

  const handleExecute = () => {
    if (!session) return;

    // Check if session has CEX steps
    const hasCEXSteps = session.executionSteps.some((step) => step.type === 'cex-manual');
    const hasOnChainSteps = session.executionSteps.some((step) => step.type === 'on-chain');

    if (hasOnChainSteps) {
      setShowActionEngine(true);
    } else if (hasCEXSteps) {
      setShowCEXPanel(true);
    }
  };

  const handleOnChainComplete = (updatedSession: HarvestSession) => {
    setShowActionEngine(false);

    // Check if there are CEX steps remaining
    const cexSteps = updatedSession.executionSteps.filter((step) => step.type === 'cex-manual');
    if (cexSteps.length > 0) {
      setShowCEXPanel(true);
    } else {
      // All done, go to success screen
      console.log('All execution complete!');
    }
  };

  const handleCEXComplete = () => {
    setShowCEXPanel(false);
    console.log('All execution complete!');
    // Navigate to success screen
  };

  return (
    <div>
      <button onClick={handleExecute}>Execute Harvest</button>

      {/* On-Chain Execution */}
      {session && (
        <ActionEngineModal
          session={session}
          isOpen={showActionEngine}
          onClose={() => setShowActionEngine(false)}
          onComplete={handleOnChainComplete}
          onError={(error) => console.error(error)}
          useSimulator={true}
        />
      )}

      {/* CEX Manual Execution */}
      {showCEXPanel && session && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <CEXExecutionPanel
              steps={session.executionSteps.filter((step) => step.type === 'cex-manual')}
              onStepComplete={(stepId) => console.log('Step complete:', stepId)}
              onAllComplete={handleCEXComplete}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Testing with Different Configurations
 */
export function TestingExample() {
  const [config, setConfig] = useState({
    stepDelay: 2000,
    failureProbability: 0.1,
    slippageProbability: 0.15,
    verbose: true,
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Testing Configuration</h2>

      {/* Configuration Controls */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Step Delay (ms): {config.stepDelay}
          </label>
          <input
            type="range"
            min="100"
            max="5000"
            step="100"
            value={config.stepDelay}
            onChange={(e) => setConfig({ ...config, stepDelay: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Failure Probability: {(config.failureProbability * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.failureProbability}
            onChange={(e) => setConfig({ ...config, failureProbability: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Slippage Probability: {(config.slippageProbability * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.slippageProbability}
            onChange={(e) => setConfig({ ...config, slippageProbability: Number(e.target.value) })}
            className="w-full"
          />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.verbose}
              onChange={(e) => setConfig({ ...config, verbose: e.target.checked })}
            />
            <span className="text-sm font-medium">Verbose Logging</span>
          </label>
        </div>
      </div>

      {/* Test Execution */}
      <ActionEngineModal
        session={{} as HarvestSession} // Mock session
        isOpen={false}
        onClose={() => {}}
        onComplete={() => {}}
        onError={() => {}}
        useSimulator={true}
        simulatorConfig={config}
      />
    </div>
  );
}
