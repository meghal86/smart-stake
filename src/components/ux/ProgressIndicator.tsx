/**
 * Progress Indicator Component
 * 
 * Shows progress for multi-step operations with step names and completion status.
 * Implements requirement R8.GATING.LOADING_STATES for progress indicators.
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8.6
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

import React from 'react';
import { CheckCircle, Circle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProgressStep {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  errorMessage?: string;
}

export interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  showStepNumbers?: boolean;
  showStepDescriptions?: boolean;
  className?: string;
  compact?: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  showStepNumbers = true,
  showStepDescriptions = false,
  className,
  compact = false,
}) => {
  const getStepIcon = (step: ProgressStep, index: number) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      default:
        return showStepNumbers ? (
          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
          </div>
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        );
    }
  };

  const getStepStatus = (step: ProgressStep, index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'active';
    return 'pending';
  };

  const getConnectorClass = (index: number) => {
    const isCompleted = index < currentStep;
    const baseClass = orientation === 'horizontal' 
      ? 'h-0.5 flex-1' 
      : 'w-0.5 h-8 ml-2.5';
    
    return cn(
      baseClass,
      isCompleted ? 'bg-green-500' : 'bg-muted-foreground/30'
    );
  };

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1">
          {steps.map((step, index) => {
            const status = step.status || getStepStatus(step, index);
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center justify-center">
                  {getStepIcon({ ...step, status }, index)}
                </div>
                {index < steps.length - 1 && (
                  <div className={getConnectorClass(index)} />
                )}
              </div>
            );
          })}
        </div>
        <span className="text-sm text-muted-foreground">
          Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
        </span>
      </div>
    );
  }

  if (orientation === 'horizontal') {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = step.status || getStepStatus(step, index);
            const isLast = index === steps.length - 1;
            
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center mb-2">
                    {getStepIcon({ ...step, status }, index)}
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      'text-sm font-medium',
                      status === 'completed' && 'text-green-600',
                      status === 'active' && 'text-blue-600',
                      status === 'error' && 'text-red-600',
                      status === 'pending' && 'text-muted-foreground'
                    )}>
                      {step.name}
                    </div>
                    {showStepDescriptions && step.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </div>
                    )}
                    {status === 'error' && step.errorMessage && (
                      <div className="text-xs text-red-600 mt-1">
                        {step.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
                
                {!isLast && (
                  <div className={cn('mx-4', getConnectorClass(index))} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical orientation
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => {
        const status = step.status || getStepStatus(step, index);
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.id} className="flex">
            <div className="flex flex-col items-center mr-4">
              <div className="flex items-center justify-center">
                {getStepIcon({ ...step, status }, index)}
              </div>
              {!isLast && (
                <div className={getConnectorClass(index)} />
              )}
            </div>
            
            <div className="flex-1 pb-8">
              <div className={cn(
                'text-sm font-medium',
                status === 'completed' && 'text-green-600',
                status === 'active' && 'text-blue-600',
                status === 'error' && 'text-red-600',
                status === 'pending' && 'text-muted-foreground'
              )}>
                {step.name}
              </div>
              
              {showStepDescriptions && step.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </div>
              )}
              
              {status === 'error' && step.errorMessage && (
                <div className="text-sm text-red-600 mt-1">
                  {step.errorMessage}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Convenience component for simple step counting
export interface SimpleProgressProps {
  current: number;
  total: number;
  stepName?: string;
  className?: string;
}

export const SimpleProgress: React.FC<SimpleProgressProps> = ({
  current,
  total,
  stepName,
  className,
}) => {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Step {current} of {total}
          {stepName && `: ${stepName}`}
        </span>
        <span className="text-muted-foreground">{percentage}%</span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Hook for managing progress state
export function useProgressIndicator(initialSteps: Omit<ProgressStep, 'status'>[]) {
  const [steps, setSteps] = React.useState<ProgressStep[]>(() =>
    initialSteps.map(step => ({ ...step, status: 'pending' as const }))
  );
  const [currentStep, setCurrentStep] = React.useState(0);

  const startStep = React.useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index === stepIndex ? 'active' : 
              index < stepIndex ? 'completed' : 'pending'
    })));
  }, []);

  const completeStep = React.useCallback((stepIndex: number) => {
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index === stepIndex ? 'completed' : step.status
    })));
  }, []);

  const errorStep = React.useCallback((stepIndex: number, errorMessage?: string) => {
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index === stepIndex ? 'error' : step.status,
      errorMessage: index === stepIndex ? errorMessage : step.errorMessage
    })));
  }, []);

  const reset = React.useCallback(() => {
    setCurrentStep(0);
    setSteps(prev => prev.map(step => ({ 
      ...step, 
      status: 'pending' as const,
      errorMessage: undefined
    })));
  }, []);

  const nextStep = React.useCallback(() => {
    setCurrentStep(prev => {
      const next = Math.min(prev + 1, steps.length - 1);
      startStep(next);
      return next;
    });
  }, [steps.length, startStep]);

  return {
    steps,
    currentStep,
    startStep,
    completeStep,
    errorStep,
    reset,
    nextStep,
    isComplete: currentStep >= steps.length - 1 && steps[steps.length - 1]?.status === 'completed',
    hasError: steps.some(step => step.status === 'error'),
  };
}