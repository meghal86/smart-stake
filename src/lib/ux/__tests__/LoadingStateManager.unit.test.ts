/**
 * Unit Tests for LoadingStateManager
 * 
 * Complementary unit tests for specific examples and edge cases
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { LoadingStateManager, LoadingContext } from '../LoadingStateManager';

describe('LoadingStateManager Unit Tests', () => {
  beforeEach(() => {
    LoadingStateManager.clearAll();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    LoadingStateManager.clearAll();
    vi.useRealTimers();
  });

  describe('Basic Loading Operations', () => {
    test('shows loading state immediately', () => {
      const context: LoadingContext = {
        id: 'test-operation',
        type: 'async-action',
        message: 'Testing...'
      };

      LoadingStateManager.showLoading(context);

      const state = LoadingStateManager.getLoadingState('test-operation');
      expect(state).toBeDefined();
      expect(state!.isLoading).toBe(true);
      expect(state!.message).toBe('Testing...');
      expect(state!.hasTimedOut).toBe(false);
    });

    test('uses default messages for operation types', () => {
      const operations = [
        { type: 'navigation' as const, expectedPattern: /loading|page/i },
        { type: 'data-fetch' as const, expectedPattern: /loading|data/i },
        { type: 'wallet-connect' as const, expectedPattern: /connect|wallet/i },
        { type: 'form-submit' as const, expectedPattern: /sav|submit/i },
        { type: 'async-action' as const, expectedPattern: /execut|action/i }
      ];

      operations.forEach(({ type, expectedPattern }) => {
        const context: LoadingContext = { id: `test-${type}`, type };
        LoadingStateManager.showLoading(context);
        
        const state = LoadingStateManager.getLoadingState(`test-${type}`);
        expect(state!.message).toMatch(expectedPattern);
      });
    });

    test('hides loading state and cleans up', () => {
      const context: LoadingContext = {
        id: 'test-cleanup',
        type: 'async-action'
      };

      LoadingStateManager.showLoading(context);
      expect(LoadingStateManager.getLoadingState('test-cleanup')).toBeDefined();

      LoadingStateManager.hideLoading('test-cleanup');
      expect(LoadingStateManager.getLoadingState('test-cleanup')).toBeUndefined();
      expect(LoadingStateManager.isAnyLoading()).toBe(false);
    });
  });

  describe('Timeout Handling', () => {
    test('triggers timeout after specified duration', () => {
      const context: LoadingContext = {
        id: 'timeout-test',
        type: 'async-action',
        timeout: 5000
      };

      LoadingStateManager.showLoading(context);
      
      // Initially not timed out
      let state = LoadingStateManager.getLoadingState('timeout-test');
      expect(state!.hasTimedOut).toBe(false);

      // Advance time past timeout
      vi.advanceTimersByTime(5001);
      
      state = LoadingStateManager.getLoadingState('timeout-test');
      expect(state!.hasTimedOut).toBe(true);
      expect(state!.message).toMatch(/longer.*expected/i);
    });

    test('uses default timeout of 8 seconds', () => {
      const context: LoadingContext = {
        id: 'default-timeout',
        type: 'async-action'
      };

      LoadingStateManager.showLoading(context);
      
      // Should not timeout before 8 seconds
      vi.advanceTimersByTime(7999);
      let state = LoadingStateManager.getLoadingState('default-timeout');
      expect(state!.hasTimedOut).toBe(false);

      // Should timeout after 8 seconds
      vi.advanceTimersByTime(2);
      state = LoadingStateManager.getLoadingState('default-timeout');
      expect(state!.hasTimedOut).toBe(true);
    });

    test('clears timeout when loading is hidden', () => {
      const context: LoadingContext = {
        id: 'timeout-clear',
        type: 'async-action',
        timeout: 5000
      };

      LoadingStateManager.showLoading(context);
      LoadingStateManager.hideLoading('timeout-clear');
      
      // Advance time past timeout - should not trigger since loading was hidden
      vi.advanceTimersByTime(5001);
      
      expect(LoadingStateManager.getLoadingState('timeout-clear')).toBeUndefined();
    });
  });

  describe('Progress Updates', () => {
    test('updates progress within valid range', () => {
      const context: LoadingContext = {
        id: 'progress-test',
        type: 'async-action',
        showProgress: true
      };

      LoadingStateManager.showLoading(context);
      
      // Test various progress values
      LoadingStateManager.updateProgress('progress-test', 25);
      let state = LoadingStateManager.getLoadingState('progress-test');
      expect(state!.progress).toBe(25);

      LoadingStateManager.updateProgress('progress-test', 150); // Should clamp to 100
      state = LoadingStateManager.getLoadingState('progress-test');
      expect(state!.progress).toBe(100);

      LoadingStateManager.updateProgress('progress-test', -10); // Should clamp to 0
      state = LoadingStateManager.getLoadingState('progress-test');
      expect(state!.progress).toBe(0);
    });

    test('handles invalid progress values', () => {
      const context: LoadingContext = {
        id: 'invalid-progress',
        type: 'async-action',
        showProgress: true
      };

      LoadingStateManager.showLoading(context);
      
      // Test NaN
      LoadingStateManager.updateProgress('invalid-progress', NaN);
      let state = LoadingStateManager.getLoadingState('invalid-progress');
      expect(state!.progress).toBe(0);

      // Test Infinity
      LoadingStateManager.updateProgress('invalid-progress', Infinity);
      state = LoadingStateManager.getLoadingState('invalid-progress');
      expect(state!.progress).toBe(0);

      // Test -Infinity
      LoadingStateManager.updateProgress('invalid-progress', -Infinity);
      state = LoadingStateManager.getLoadingState('invalid-progress');
      expect(state!.progress).toBe(0);
    });

    test('ignores progress updates for non-progress operations', () => {
      const context: LoadingContext = {
        id: 'no-progress',
        type: 'async-action'
        // showProgress not set
      };

      LoadingStateManager.showLoading(context);
      
      LoadingStateManager.updateProgress('no-progress', 50);
      const state = LoadingStateManager.getLoadingState('no-progress');
      expect(state!.progress).toBeUndefined();
    });
  });

  describe('Message Updates', () => {
    test('updates loading message dynamically', () => {
      const context: LoadingContext = {
        id: 'message-test',
        type: 'async-action',
        message: 'Initial message'
      };

      LoadingStateManager.showLoading(context);
      
      let state = LoadingStateManager.getLoadingState('message-test');
      expect(state!.message).toBe('Initial message');

      LoadingStateManager.setLoadingMessage('message-test', 'Updated message');
      state = LoadingStateManager.getLoadingState('message-test');
      expect(state!.message).toBe('Updated message');
    });

    test('ignores message updates for non-existent contexts', () => {
      // Should not throw error
      expect(() => {
        LoadingStateManager.setLoadingMessage('non-existent', 'New message');
      }).not.toThrow();
    });
  });

  describe('Listener Notifications', () => {
    test('notifies listeners on state changes', () => {
      const listener = vi.fn();
      const unsubscribe = LoadingStateManager.subscribe(listener);

      const context: LoadingContext = {
        id: 'listener-test',
        type: 'async-action'
      };

      LoadingStateManager.showLoading(context);
      vi.advanceTimersByTime(0); // Trigger immediate notification

      expect(listener).toHaveBeenCalled();
      
      unsubscribe();
    });

    test('handles listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();

      LoadingStateManager.subscribe(errorListener);
      LoadingStateManager.subscribe(goodListener);

      const context: LoadingContext = {
        id: 'error-test',
        type: 'async-action'
      };

      // Should not throw despite error in listener
      expect(() => {
        LoadingStateManager.showLoading(context);
        vi.advanceTimersByTime(0);
      }).not.toThrow();

      expect(goodListener).toHaveBeenCalled();
    });

    test('unsubscribe removes listener', () => {
      const listener = vi.fn();
      const unsubscribe = LoadingStateManager.subscribe(listener);

      unsubscribe();

      const context: LoadingContext = {
        id: 'unsubscribe-test',
        type: 'async-action'
      };

      LoadingStateManager.showLoading(context);
      vi.advanceTimersByTime(0);

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Utility Methods', () => {
    test('tracks loading duration', () => {
      const context: LoadingContext = {
        id: 'duration-test',
        type: 'async-action'
      };

      const startTime = Date.now();
      LoadingStateManager.showLoading(context);
      
      vi.advanceTimersByTime(1000);
      
      const duration = LoadingStateManager.getLoadingDuration('duration-test');
      expect(duration).toBeGreaterThanOrEqual(1000);
    });

    test('returns 0 duration for non-existent contexts', () => {
      const duration = LoadingStateManager.getLoadingDuration('non-existent');
      expect(duration).toBe(0);
    });

    test('detects global loading state', () => {
      expect(LoadingStateManager.shouldShowGlobalLoading()).toBe(false);

      const context: LoadingContext = {
        id: 'global-test',
        type: 'navigation'
      };

      LoadingStateManager.showLoading(context);
      expect(LoadingStateManager.shouldShowGlobalLoading()).toBe(true);

      LoadingStateManager.hideLoading('global-test');
      expect(LoadingStateManager.shouldShowGlobalLoading()).toBe(false);
    });

    test('clears all loading states', () => {
      const contexts = [
        { id: 'test1', type: 'async-action' as const },
        { id: 'test2', type: 'navigation' as const },
        { id: 'test3', type: 'data-fetch' as const }
      ];

      contexts.forEach(context => {
        LoadingStateManager.showLoading(context);
      });

      expect(LoadingStateManager.getAllLoadingStates().size).toBe(3);

      LoadingStateManager.clearAll();

      expect(LoadingStateManager.getAllLoadingStates().size).toBe(0);
      expect(LoadingStateManager.isAnyLoading()).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty string IDs', () => {
      const context: LoadingContext = {
        id: '',
        type: 'async-action'
      };

      LoadingStateManager.showLoading(context);
      const state = LoadingStateManager.getLoadingState('');
      expect(state).toBeDefined();
    });

    test('handles very long IDs', () => {
      const longId = 'a'.repeat(1000);
      const context: LoadingContext = {
        id: longId,
        type: 'async-action'
      };

      LoadingStateManager.showLoading(context);
      const state = LoadingStateManager.getLoadingState(longId);
      expect(state).toBeDefined();
    });

    test('handles zero timeout', () => {
      const context: LoadingContext = {
        id: 'zero-timeout',
        type: 'async-action',
        timeout: 0
      };

      LoadingStateManager.showLoading(context);
      
      // Should not set up timeout
      vi.advanceTimersByTime(1000);
      const state = LoadingStateManager.getLoadingState('zero-timeout');
      expect(state!.hasTimedOut).toBe(false);
    });

    test('handles negative timeout', () => {
      const context: LoadingContext = {
        id: 'negative-timeout',
        type: 'async-action',
        timeout: -1000
      };

      LoadingStateManager.showLoading(context);
      
      // Should not set up timeout
      vi.advanceTimersByTime(1000);
      const state = LoadingStateManager.getLoadingState('negative-timeout');
      expect(state!.hasTimedOut).toBe(false);
    });
  });
});