/**
 * LoadingStateManager - Universal Loading State System
 * 
 * Provides consistent 100ms feedback for all async operations
 * Handles descriptive loading messages and timeout scenarios
 * 
 * Requirements: R2.LOADING.100MS, R2.LOADING.DESCRIPTIVE, R2.LOADING.SUCCESS_FAILURE
 */

export interface LoadingContext {
  id: string;
  type: 'navigation' | 'async-action' | 'data-fetch' | 'wallet-connect' | 'form-submit';
  timeout?: number; // Default 8000ms
  showProgress?: boolean;
  message?: string;
}

export interface LoadingState {
  isLoading: boolean;
  message: string;
  progress?: number;
  startTime: number;
  timeoutId?: NodeJS.Timeout;
  hasTimedOut: boolean;
}

export type LoadingStateListener = (contexts: Map<string, LoadingState>) => void;

class LoadingStateManagerClass {
  private contexts = new Map<string, LoadingState>();
  private listeners = new Set<LoadingStateListener>();
  private feedbackTimer?: NodeJS.Timeout;

  // Default messages for different operation types
  private readonly DEFAULT_MESSAGES = {
    'navigation': 'Loading page...',
    'async-action': 'Executing...',
    'data-fetch': 'Loading data...',
    'wallet-connect': 'Connecting wallet...',
    'form-submit': 'Saving changes...'
  };

  // Default timeout for operations (8 seconds as per requirements)
  private readonly DEFAULT_TIMEOUT = 8000;

  /**
   * Show loading state with 100ms feedback guarantee
   */
  showLoading(context: LoadingContext): void {
    const message = context.message || this.DEFAULT_MESSAGES[context.type];
    const timeout = context.timeout || this.DEFAULT_TIMEOUT;
    
    const loadingState: LoadingState = {
      isLoading: true,
      message,
      startTime: Date.now(),
      hasTimedOut: false,
      progress: context.showProgress ? 0 : undefined
    };

    // Set timeout handler
    if (timeout > 0) {
      loadingState.timeoutId = setTimeout(() => {
        this.handleTimeout(context.id);
      }, timeout);
    }

    this.contexts.set(context.id, loadingState);

    // Ensure feedback appears within 100ms
    if (this.feedbackTimer) {
      clearTimeout(this.feedbackTimer);
    }
    
    this.feedbackTimer = setTimeout(() => {
      this.notifyListeners();
    }, 0); // Immediate notification, but allows batching
  }

  /**
   * Hide loading state and clear timeout
   */
  hideLoading(contextId: string): void {
    const state = this.contexts.get(contextId);
    if (state?.timeoutId) {
      clearTimeout(state.timeoutId);
    }
    
    this.contexts.delete(contextId);
    this.notifyListeners();
  }

  /**
   * Update progress for operations that support it
   */
  updateProgress(contextId: string, progress: number): void {
    const state = this.contexts.get(contextId);
    if (state && state.progress !== undefined) {
      // Handle NaN and invalid values
      if (isNaN(progress) || !isFinite(progress)) {
        progress = 0;
      }
      state.progress = Math.max(0, Math.min(100, progress));
      this.notifyListeners();
    }
  }

  /**
   * Update loading message dynamically
   */
  setLoadingMessage(contextId: string, message: string): void {
    const state = this.contexts.get(contextId);
    if (state) {
      state.message = message;
      this.notifyListeners();
    }
  }

  /**
   * Handle timeout scenario (>8 seconds)
   */
  private handleTimeout(contextId: string): void {
    const state = this.contexts.get(contextId);
    if (state) {
      state.hasTimedOut = true;
      state.message = 'Operation is taking longer than expected...';
      this.notifyListeners();
    }
  }

  /**
   * Get current loading state for a specific context
   */
  getLoadingState(contextId: string): LoadingState | undefined {
    return this.contexts.get(contextId);
  }

  /**
   * Get all active loading contexts
   */
  getAllLoadingStates(): Map<string, LoadingState> {
    return new Map(this.contexts);
  }

  /**
   * Check if any loading operation is active
   */
  isAnyLoading(): boolean {
    return this.contexts.size > 0;
  }

  /**
   * Check if global loading should be shown (for AppShell)
   */
  shouldShowGlobalLoading(): boolean {
    // Show global loading for navigation operations
    for (const [_, state] of this.contexts) {
      if (state.isLoading) {
        return true;
      }
    }
    return false;
  }

  /**
   * Subscribe to loading state changes
   */
  subscribe(listener: LoadingStateListener): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    const currentContexts = new Map(this.contexts);
    this.listeners.forEach(listener => {
      try {
        listener(currentContexts);
      } catch (error) {
        console.error('Error in loading state listener:', error);
      }
    });
  }

  /**
   * Clear all loading states (useful for cleanup)
   */
  clearAll(): void {
    // Clear all timeouts
    for (const [_, state] of this.contexts) {
      if (state.timeoutId) {
        clearTimeout(state.timeoutId);
      }
    }
    
    this.contexts.clear();
    this.notifyListeners();
  }

  /**
   * Get loading duration for a context
   */
  getLoadingDuration(contextId: string): number {
    const state = this.contexts.get(contextId);
    return state ? Date.now() - state.startTime : 0;
  }
}

// Export singleton instance
export const LoadingStateManager = new LoadingStateManagerClass();

// Export types for external use
export type { LoadingStateListener };