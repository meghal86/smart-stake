/**
 * Action Gating Hook
 * 
 * React hook that integrates Action Gating Manager with wallet context and other app state.
 * Provides real-time gating state updates based on wallet connection and other prerequisites.
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { 
  ActionGatingManager, 
  type ActionGatingConfig, 
  type ActionGatingState 
} from '@/lib/ux/ActionGatingManager';

// Global instance
const gatingManager = new ActionGatingManager();

export interface UseActionGatingOptions {
  config: ActionGatingConfig;
  autoUpdate?: boolean;
  onStateChange?: (state: ActionGatingState) => void;
}

export function useActionGating(
  config: ActionGatingConfig,
  options: Omit<UseActionGatingOptions, 'config'> = {}
) {
  const { autoUpdate = true, onStateChange } = options;
  const { activeWallet, connectedWallets, isLoading: walletLoading } = useWallet();
  
  // Initialize state
  const [state, setState] = useState<ActionGatingState>(() => {
    // Update manager with current wallet state
    gatingManager.updateWalletState(!!activeWallet, activeWallet || undefined);
    return gatingManager.evaluateAction(config);
  });

  // Update gating manager when wallet state changes
  useEffect(() => {
    gatingManager.updateWalletState(!!activeWallet, activeWallet || undefined);
    
    if (autoUpdate) {
      const newState = gatingManager.evaluateAction(config);
      setState(newState);
      onStateChange?.(newState);
    }
  }, [activeWallet, connectedWallets, config, autoUpdate, onStateChange]);

  // Re-evaluate when config changes
  useEffect(() => {
    if (autoUpdate) {
      const newState = gatingManager.evaluateAction(config);
      setState(newState);
      onStateChange?.(newState);
    }
  }, [config, autoUpdate, onStateChange]);

  // Listen for wallet events
  useEffect(() => {
    if (!autoUpdate) return;

    const handleWalletEvent = () => {
      const newState = gatingManager.evaluateAction(config);
      setState(newState);
      onStateChange?.(newState);
    };

    window.addEventListener('walletConnected', handleWalletEvent);
    window.addEventListener('walletDisconnected', handleWalletEvent);

    return () => {
      window.removeEventListener('walletConnected', handleWalletEvent);
      window.removeEventListener('walletDisconnected', handleWalletEvent);
    };
  }, [config, autoUpdate, onStateChange]);

  // Manual refresh function
  const refresh = useCallback(() => {
    gatingManager.updateWalletState(!!activeWallet, activeWallet || undefined);
    const newState = gatingManager.evaluateAction(config);
    setState(newState);
    onStateChange?.(newState);
  }, [activeWallet, config, onStateChange]);

  // Update loading state
  const updateLoading = useCallback((loading: boolean, loadingText?: string) => {
    setState(prev => ({ ...prev, loading, loadingText }));
  }, []);

  // Update progress
  const updateProgress = useCallback((current: number, total: number, stepName?: string) => {
    setState(prev => ({ 
      ...prev, 
      progress: { current, total, stepName } 
    }));
  }, []);

  // Clear progress
  const clearProgress = useCallback(() => {
    setState(prev => ({ ...prev, progress: undefined }));
  }, []);

  // Update token balances
  const updateTokenBalances = useCallback((balances: Record<string, string>) => {
    gatingManager.updateTokenBalances(balances);
    if (autoUpdate) {
      refresh();
    }
  }, [autoUpdate, refresh]);

  // Update token approvals
  const updateTokenApprovals = useCallback((approvals: Record<string, boolean>) => {
    gatingManager.updateTokenApprovals(approvals);
    if (autoUpdate) {
      refresh();
    }
  }, [autoUpdate, refresh]);

  // Set user region
  const setUserRegion = useCallback((region: string) => {
    gatingManager.setUserRegion(region);
    if (autoUpdate) {
      refresh();
    }
  }, [autoUpdate, refresh]);

  // Computed values
  const canExecute = useMemo(() => 
    state.enabled && !state.loading && !walletLoading, 
    [state.enabled, state.loading, walletLoading]
  );

  const prerequisiteSummary = useMemo(() => 
    gatingManager.getPrerequisiteSummary(state),
    [state]
  );

  const unmetPrerequisites = useMemo(() => 
    state.prerequisites.filter(p => p.required && !p.met),
    [state.prerequisites]
  );

  const metPrerequisites = useMemo(() => 
    state.prerequisites.filter(p => p.required && p.met),
    [state.prerequisites]
  );

  return {
    // State
    ...state,
    canExecute,
    prerequisiteSummary,
    unmetPrerequisites,
    metPrerequisites,
    
    // Actions
    refresh,
    updateLoading,
    updateProgress,
    clearProgress,
    updateTokenBalances,
    updateTokenApprovals,
    setUserRegion,
    
    // Wallet integration
    walletConnected: !!activeWallet,
    walletAddress: activeWallet,
    walletLoading,
  };
}

// Convenience hooks for common scenarios

export function useWalletGating() {
  return useActionGating({ requireWallet: true });
}

export function useApprovalGating(tokenAddresses: string[]) {
  return useActionGating({ 
    requireWallet: true, 
    requireApprovals: tokenAddresses 
  });
}

export function useBalanceGating(token: string, amount: string) {
  return useActionGating({ 
    requireWallet: true, 
    minimumBalance: { token, amount } 
  });
}

export function useGeoGating() {
  return useActionGating({ 
    requireWallet: true, 
    geoRestricted: true 
  });
}

export function useTimeGating(start?: Date, end?: Date) {
  return useActionGating({ 
    requireWallet: true, 
    timeConstraint: { start, end } 
  });
}

// Hook for managing multi-step actions with gating
export function useGatedAction(
  config: ActionGatingConfig,
  steps: string[] = []
) {
  const gating = useActionGating(config);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<Record<number, string>>({});

  const executeStep = useCallback(async (
    stepIndex: number, 
    action: () => Promise<void>
  ) => {
    if (!gating.canExecute) {
      throw new Error('Prerequisites not met');
    }

    try {
      setCurrentStep(stepIndex);
      gating.updateProgress(stepIndex + 1, steps.length, steps[stepIndex]);
      
      await action();
      
      // Clear any previous error for this step
      setStepErrors(prev => {
        const { [stepIndex]: _, ...rest } = prev;
        return rest;
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setStepErrors(prev => ({ ...prev, [stepIndex]: errorMessage }));
      throw error;
    }
  }, [gating, steps]);

  const executeAllSteps = useCallback(async (actions: (() => Promise<void>)[]) => {
    if (!gating.canExecute) {
      throw new Error('Prerequisites not met');
    }

    gating.updateLoading(true, 'Executing...');
    
    try {
      for (let i = 0; i < actions.length; i++) {
        await executeStep(i, actions[i]);
      }
    } finally {
      gating.updateLoading(false);
      gating.clearProgress();
    }
  }, [gating, executeStep]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setStepErrors({});
    gating.clearProgress();
  }, [gating]);

  return {
    ...gating,
    currentStep,
    stepErrors,
    executeStep,
    executeAllSteps,
    reset,
    isComplete: currentStep >= steps.length - 1,
    hasStepErrors: Object.keys(stepErrors).length > 0,
  };
}