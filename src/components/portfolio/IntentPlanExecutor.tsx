import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw,
  Shield,
  Zap,
  DollarSign,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { GatedButton } from '@/components/ux/GatedButton';
import type { 
  IntentPlan, 
  ExecutionStep, 
  WalletScope, 
  FreshnessConfidence,
  SimulationReceipt,
  PolicyEngineConfig 
} from '@/types/portfolio';

interface IntentPlanExecutorProps {
  plan: IntentPlan;
  walletScope: WalletScope;
  freshness: FreshnessConfidence;
  onExecuteStep?: (stepId: string) => Promise<void>;
  onRetryStep?: (stepId: string) => Promise<void>;
  onCancelPlan?: () => Promise<void>;
  onReplan?: () => Promise<void>;
  className?: string;
}

interface PreFlightCardProps {
  simulation: SimulationReceipt;
  freshness: FreshnessConfidence;
}

const PreFlightCard: React.FC<PreFlightCardProps> = ({ simulation, freshness }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          Pre-Flight Simulation
          <Badge 
            variant="outline" 
            className={`text-xs ${getConfidenceColor(freshness.confidence)}`}
          >
            {(freshness.confidence * 100).toFixed(0)}% confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Asset Deltas */}
        {simulation.assetDeltas && simulation.assetDeltas.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-300 mb-2">Asset Changes</h4>
            <div className="space-y-1">
              {simulation.assetDeltas.map((delta, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{delta.token}</span>
                  <span className={`font-medium ${
                    delta.amount > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {delta.amount > 0 ? '+' : ''}{delta.amount.toFixed(6)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gas Estimate */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Gas Estimate</span>
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-gray-400" />
            <span className="text-sm font-medium text-white">
              ${simulation.gasEstimateUsd?.toFixed(2) || '—'}
            </span>
          </div>
        </div>

        {/* Time Estimate */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Time Estimate</span>
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3 text-gray-400" />
            <span className="text-sm font-medium text-white">
              {simulation.timeEstimateSec ? `${simulation.timeEstimateSec}s` : '—'}
            </span>
          </div>
        </div>

        {/* Warnings */}
        {simulation.warnings && simulation.warnings.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-200 mb-1">Warnings</h4>
                <ul className="text-xs text-yellow-300 space-y-1">
                  {simulation.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface PolicyCheckResultsProps {
  policy: IntentPlan['policy'];
}

const PolicyCheckResults: React.FC<PolicyCheckResultsProps> = ({ policy }) => {
  const isBlocked = policy.status === 'blocked';
  
  return (
    <Card className={`border ${
      isBlocked ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
          <Shield className={`w-4 h-4 ${isBlocked ? 'text-red-400' : 'text-green-400'}`} />
          Policy Check
          <Badge 
            variant="outline" 
            className={`text-xs ${isBlocked ? 'text-red-400' : 'text-green-400'}`}
          >
            {policy.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isBlocked && policy.violations && policy.violations.length > 0 ? (
          <div>
            <h4 className="text-sm font-medium text-red-200 mb-2">Policy Violations</h4>
            <ul className="text-sm text-red-300 space-y-1">
              {policy.violations.map((violation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  {violation}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-green-300">
            <CheckCircle className="w-4 h-4 text-green-400" />
            All policy checks passed
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const getStepStatusIcon = (status: ExecutionStep['status']) => {
  switch (status) {
    case 'completed':
    case 'confirmed':
      return CheckCircle;
    case 'failed':
      return XCircle;
    case 'signing':
    case 'submitted':
      return Clock;
    case 'blocked':
      return AlertTriangle;
    default:
      return Clock;
  }
};

const getStepStatusColor = (status: ExecutionStep['status']) => {
  switch (status) {
    case 'completed':
    case 'confirmed':
      return 'text-green-400';
    case 'failed':
      return 'text-red-400';
    case 'signing':
    case 'submitted':
      return 'text-blue-400';
    case 'blocked':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
};

export const IntentPlanExecutor: React.FC<IntentPlanExecutorProps> = ({
  plan,
  walletScope,
  freshness,
  onExecuteStep,
  onRetryStep,
  onCancelPlan,
  onReplan,
  className
}) => {
  const [executingStepId, setExecutingStepId] = useState<string | null>(null);

  const handleExecuteStep = useCallback(async (stepId: string) => {
    if (!onExecuteStep) return;
    
    setExecutingStepId(stepId);
    try {
      await onExecuteStep(stepId);
    } finally {
      setExecutingStepId(null);
    }
  }, [onExecuteStep]);

  const handleRetryStep = useCallback(async (stepId: string) => {
    if (!onRetryStep) return;
    
    setExecutingStepId(stepId);
    try {
      await onRetryStep(stepId);
    } finally {
      setExecutingStepId(null);
    }
  }, [onRetryStep]);

  const canExecuteStep = (step: ExecutionStep) => {
    return step.status === 'ready' && plan.policy.status === 'allowed';
  };

  const canRetryStep = (step: ExecutionStep) => {
    return step.status === 'failed';
  };

  const hasFailedSteps = plan.steps.some(step => step.status === 'failed');
  const hasBlockedSteps = plan.steps.some(step => step.status === 'blocked');
  const completedSteps = plan.steps.filter(step => 
    step.status === 'completed' || step.status === 'confirmed'
  ).length;
  const totalSteps = plan.steps.length;

  // Convert steps to progress indicator format
  const progressSteps = plan.steps.map(step => ({
    id: step.stepId,
    name: `${step.kind} on ${step.chainId}`,
    description: step.target_address ? `Target: ${step.target_address.slice(0, 8)}...` : '',
    status: step.status === 'completed' || step.status === 'confirmed' ? 'completed' as const :
            step.status === 'failed' ? 'error' as const :
            step.status === 'signing' || step.status === 'submitted' ? 'active' as const :
            'pending' as const,
    errorMessage: step.error_message
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Plan Header */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-white">
                Intent Plan: {plan.intent}
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {completedSteps}/{totalSteps} steps completed
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {plan.status}
              </Badge>
              {walletScope.mode === 'active_wallet' && (
                <Badge variant="outline" className="text-xs">
                  {walletScope.address.slice(0, 8)}...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProgressIndicator 
            steps={progressSteps}
            currentStep={completedSteps}
            className="mb-4"
          />
          
          {/* Impact Preview */}
          {plan.impactPreview && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  ${plan.impactPreview.gasEstimateUsd?.toFixed(2) || '—'}
                </div>
                <div className="text-xs text-gray-400">Gas Cost</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-white">
                  {plan.impactPreview.timeEstimateSec || '—'}s
                </div>
                <div className="text-xs text-gray-400">Time Est.</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${
                  (plan.impactPreview.riskDelta || 0) < 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {plan.impactPreview.riskDelta ? 
                    `${plan.impactPreview.riskDelta > 0 ? '+' : ''}${plan.impactPreview.riskDelta.toFixed(2)}` : 
                    '—'
                  }
                </div>
                <div className="text-xs text-gray-400">Risk Δ</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-400">
                  {freshness.confidence ? `${(freshness.confidence * 100).toFixed(0)}%` : '—'}
                </div>
                <div className="text-xs text-gray-400">Confidence</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Check Results */}
      <PolicyCheckResults policy={plan.policy} />

      {/* Pre-Flight Simulation */}
      {plan.simulation.status !== 'pass' && plan.simulation.receiptId && (
        <PreFlightCard 
          simulation={{
            id: plan.simulation.receiptId,
            assetDeltas: [],
            gasEstimateUsd: plan.impactPreview?.gasEstimateUsd,
            timeEstimateSec: plan.impactPreview?.timeEstimateSec,
            warnings: plan.simulation.status === 'warn' ? ['Simulation warnings detected'] : 
                     plan.simulation.status === 'block' ? ['Simulation blocked execution'] : []
          }}
          freshness={freshness}
        />
      )}

      {/* Execution Steps */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Execution Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AnimatePresence>
            {plan.steps.map((step, index) => {
              const StatusIcon = getStepStatusIcon(step.status);
              const statusColor = getStepStatusColor(step.status);
              const isExecuting = executingStepId === step.stepId;
              
              return (
                <motion.div
                  key={step.stepId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  className="bg-gray-700/30 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                      <div>
                        <h4 className="font-medium text-white">
                          {step.kind} on Chain {step.chainId}
                        </h4>
                        <p className="text-sm text-gray-400">
                          Target: {step.target_address?.slice(0, 8)}...{step.target_address?.slice(-6)}
                        </p>
                        {step.gas_estimate && (
                          <p className="text-xs text-gray-500">
                            Gas: {step.gas_estimate.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${statusColor}`}>
                        {step.status}
                      </Badge>
                      
                      {canExecuteStep(step) && (
                        <GatedButton
                          size="sm"
                          onClick={() => handleExecuteStep(step.stepId)}
                          loading={isExecuting}
                          gatingConfig={{ requireWallet: true }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Execute
                        </GatedButton>
                      )}
                      
                      {canRetryStep(step) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetryStep(step.stepId)}
                          disabled={isExecuting}
                          className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {step.error_message && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h5 className="text-sm font-medium text-red-200">Error</h5>
                          <p className="text-sm text-red-300 mt-1">{step.error_message}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {step.transaction_hash && (
                    <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <div>
                          <h5 className="text-sm font-medium text-green-200">Transaction Hash</h5>
                          <p className="text-sm text-green-300 font-mono">
                            {step.transaction_hash}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {hasFailedSteps && onReplan && (
            <Button
              variant="outline"
              onClick={onReplan}
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Replan
            </Button>
          )}
          
          {onCancelPlan && (
            <Button
              variant="outline"
              onClick={onCancelPlan}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Pause className="w-4 h-4 mr-2" />
              Cancel Plan
            </Button>
          )}
        </div>
        
        <div className="text-sm text-gray-400">
          Plan ID: {plan.id.slice(0, 8)}...
        </div>
      </div>

      {/* Degraded Mode Warning */}
      {freshness.degraded && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-200 mb-1">Degraded Mode Active</h4>
              <p className="text-sm text-yellow-300">
                Execution data may be incomplete due to low confidence ({(freshness.confidence * 100).toFixed(0)}%).
                {freshness.degradedReasons && freshness.degradedReasons.length > 0 && (
                  <span className="block mt-1">
                    Reasons: {freshness.degradedReasons.join(', ')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntentPlanExecutor;