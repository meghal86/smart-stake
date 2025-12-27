/**
 * useLoadingState - React hook for LoadingStateManager
 * 
 * Provides React integration for the universal loading state system
 * Ensures 100ms feedback and proper cleanup
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { LoadingStateManager, LoadingContext, LoadingState } from '@/lib/ux/LoadingStateManager';

export interface UseLoadingStateReturn {
  // State
  isLoading: boolean;
  loadingStates: Map<string, LoadingState>;
  globalLoading: boolean;
  
  // Actions
  showLoading: (context: LoadingContext) => void;
  hideLoading: (contextId: string) => void;
  updateProgress: (contextId: string, progress: number) => void;
  setLoadingMessage: (contextId: string, message: string) => void;
  
  // Utilities
  getLoadingState: (contextId: string) => LoadingState | undefined;
  getLoadingDuration: (contextId: string) => number;
}

/**
 * Hook for managing loading states with automatic cleanup
 */
export function useLoadingState(): UseLoadingStateReturn {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(
    () => LoadingStateManager.getAllLoadingStates()
  );
  
  const mountedRef = useRef(true);

  // Subscribe to loading state changes
  useEffect(() => {
    const unsubscribe = LoadingStateManager.subscribe((states) => {
      if (mountedRef.current) {
        setLoadingStates(new Map(states));
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Memoized actions
  const showLoading = useCallback((context: LoadingContext) => {
    LoadingStateManager.showLoading(context);
  }, []);

  const hideLoading = useCallback((contextId: string) => {
    LoadingStateManager.hideLoading(contextId);
  }, []);

  const updateProgress = useCallback((contextId: string, progress: number) => {
    LoadingStateManager.updateProgress(contextId, progress);
  }, []);

  const setLoadingMessage = useCallback((contextId: string, message: string) => {
    LoadingStateManager.setLoadingMessage(contextId, message);
  }, []);

  const getLoadingState = useCallback((contextId: string) => {
    return LoadingStateManager.getLoadingState(contextId);
  }, []);

  const getLoadingDuration = useCallback((contextId: string) => {
    return LoadingStateManager.getLoadingDuration(contextId);
  }, []);

  // Computed values
  const isLoading = loadingStates.size > 0;
  const globalLoading = LoadingStateManager.shouldShowGlobalLoading();

  return {
    isLoading,
    loadingStates,
    globalLoading,
    showLoading,
    hideLoading,
    updateProgress,
    setLoadingMessage,
    getLoadingState,
    getLoadingDuration
  };
}

/**
 * Hook for managing a single loading operation
 */
export function useSingleLoadingState(contextId: string, type: LoadingContext['type']) {
  const { showLoading, hideLoading, updateProgress, setLoadingMessage, getLoadingState } = useLoadingState();
  
  const start = useCallback((message?: string, options?: Partial<LoadingContext>) => {
    showLoading({
      id: contextId,
      type,
      message,
      ...options
    });
  }, [contextId, type, showLoading]);

  const stop = useCallback(() => {
    hideLoading(contextId);
  }, [contextId, hideLoading]);

  const updateProgressValue = useCallback((progress: number) => {
    updateProgress(contextId, progress);
  }, [contextId, updateProgress]);

  const updateMessage = useCallback((message: string) => {
    setLoadingMessage(contextId, message);
  }, [contextId, setLoadingMessage]);

  const state = getLoadingState(contextId);

  return {
    isLoading: !!state?.isLoading,
    hasTimedOut: !!state?.hasTimedOut,
    message: state?.message || '',
    progress: state?.progress,
    start,
    stop,
    updateProgress: updateProgressValue,
    updateMessage
  };
}

/**
 * Hook for async operations with automatic loading state management
 */
export function useAsyncOperation<T = unknown>(
  contextId: string,
  type: LoadingContext['type'] = 'async-action'
) {
  const { start, stop, isLoading, hasTimedOut } = useSingleLoadingState(contextId, type);
  
  const execute = useCallback(async (
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    try {
      start(message);
      const result = await operation();
      return result;
    } finally {
      stop();
    }
  }, [start, stop]);

  return {
    execute,
    isLoading,
    hasTimedOut
  };
}