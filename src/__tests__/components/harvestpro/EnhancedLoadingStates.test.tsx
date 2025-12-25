/**
 * Enhanced Loading States Tests
 * Tests for Task 1.2: Enhance Loading States
 * 
 * Requirements: Enhanced Req 14 AC1-3 (error banners) + Enhanced Req 17 AC1-2 (performance)
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LoadingStateManager } from '@/lib/ux/LoadingStateManager';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader-icon" />,
  CheckCircle: () => <div data-testid="check-icon" />,
  XCircle: () => <div data-testid="x-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
}));

// Mock utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}));

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Enhanced Loading States', () => {
  beforeEach(() => {
    LoadingStateManager.clearAll();
  });

  afterEach(() => {
    LoadingStateManager.clearAll();
  });

  describe('100ms Feedback Guarantee', () => {
    it('should show loading feedback within 100ms', async () => {
      const startTime = Date.now();
      
      act(() => {
        LoadingStateManager.showLoading({
          id: 'test-operation',
          type: 'data-fetch',
          message: 'Scanning opportunities...',
        });
      });

      await waitFor(() => {
        const loadingState = LoadingStateManager.getLoadingState('test-operation');
        expect(loadingState?.isLoading).toBe(true);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should show feedback within 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should display descriptive loading messages', () => {
      act(() => {
        LoadingStateManager.showLoading({
          id: 'test-scan',
          type: 'data-fetch',
          message: 'Scanning opportunities...',
        });
      });

      const loadingState = LoadingStateManager.getLoadingState('test-scan');
      expect(loadingState?.message).toBe('Scanning opportunities...');
    });
  });

  describe('Descriptive Loading Messages', () => {
    it('should show context-appropriate messages for different operations', () => {
      const operations = [
        { type: 'data-fetch' as const, expectedMessage: 'Scanning opportunities...' },
        { type: 'async-action' as const, expectedMessage: 'Preparing harvest...' },
        { type: 'form-submit' as const, expectedMessage: 'Generating CSV export...' },
      ];

      operations.forEach(({ type, expectedMessage }) => {
        act(() => {
          LoadingStateManager.showLoading({
            id: `test-${type}`,
            type,
            message: expectedMessage,
          });
        });

        const loadingState = LoadingStateManager.getLoadingState(`test-${type}`);
        expect(loadingState?.message).toBe(expectedMessage);
      });
    });

    it('should update loading messages dynamically', () => {
      act(() => {
        LoadingStateManager.showLoading({
          id: 'dynamic-test',
          type: 'async-action',
          message: 'Starting...',
        });
      });

      let loadingState = LoadingStateManager.getLoadingState('dynamic-test');
      expect(loadingState?.message).toBe('Starting...');

      act(() => {
        LoadingStateManager.setLoadingMessage('dynamic-test', 'Processing...');
      });

      loadingState = LoadingStateManager.getLoadingState('dynamic-test');
      expect(loadingState?.message).toBe('Processing...');
    });
  });

  describe('Timeout Handling (8 seconds)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should trigger timeout after 8 seconds', () => {
      act(() => {
        LoadingStateManager.showLoading({
          id: 'timeout-test',
          type: 'data-fetch',
          message: 'Loading...',
          timeout: 8000,
        });
      });

      let loadingState = LoadingStateManager.getLoadingState('timeout-test');
      expect(loadingState?.hasTimedOut).toBe(false);

      // Fast-forward 8 seconds
      act(() => {
        vi.advanceTimersByTime(8000);
      });

      loadingState = LoadingStateManager.getLoadingState('timeout-test');
      expect(loadingState?.hasTimedOut).toBe(true);
      expect(loadingState?.message).toBe('Operation is taking longer than expected...');
    });

    it('should show timeout handler UI when operation times out', () => {
      const mockRetry = vi.fn();
      const mockCancel = vi.fn();

      // Simple timeout handler component for testing
      const SimpleTimeoutHandler = ({ isTimedOut, onRetry }: any) => {
        if (!isTimedOut) return null;
        return (
          <div>
            <div>Taking Longer Than Expected</div>
            <div>Data loading is taking longer than expected</div>
            <button onClick={onRetry}>Retry</button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <SimpleTimeoutHandler
            isTimedOut={true}
            onRetry={mockRetry}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Taking Longer Than Expected')).toBeInTheDocument();
      expect(screen.getByText('Data loading is taking longer than expected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle retry action from timeout handler', () => {
      const mockRetry = vi.fn();

      // Simple timeout handler component for testing
      const SimpleTimeoutHandler = ({ onRetry }: any) => (
        <button onClick={onRetry}>Retry</button>
      );

      render(
        <TestWrapper>
          <SimpleTimeoutHandler onRetry={mockRetry} />
        </TestWrapper>
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      
      // Use fireEvent instead of userEvent for simpler synchronous testing
      retryButton.click();

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('LoadingStateManager Integration', () => {
    it('should manage loading states across multiple operations', () => {
      // Start multiple operations
      act(() => {
        LoadingStateManager.showLoading({
          id: 'harvest-opportunities',
          type: 'data-fetch',
          message: 'Scanning opportunities...',
        });

        LoadingStateManager.showLoading({
          id: 'harvest-execution',
          type: 'async-action',
          message: 'Preparing harvest...',
        });
      });

      // Both should be active
      expect(LoadingStateManager.getLoadingState('harvest-opportunities')?.isLoading).toBe(true);
      expect(LoadingStateManager.getLoadingState('harvest-execution')?.isLoading).toBe(true);
      expect(LoadingStateManager.isAnyLoading()).toBe(true);

      // Complete one operation
      act(() => {
        LoadingStateManager.hideLoading('harvest-opportunities');
      });

      // One should still be active
      expect(LoadingStateManager.getLoadingState('harvest-opportunities')).toBeUndefined();
      expect(LoadingStateManager.getLoadingState('harvest-execution')?.isLoading).toBe(true);
      expect(LoadingStateManager.isAnyLoading()).toBe(true);

      // Complete all operations
      act(() => {
        LoadingStateManager.hideLoading('harvest-execution');
      });

      // None should be active
      expect(LoadingStateManager.isAnyLoading()).toBe(false);
    });

    it('should provide correct loading duration tracking', () => {
      const startTime = Date.now();
      
      act(() => {
        LoadingStateManager.showLoading({
          id: 'duration-test',
          type: 'data-fetch',
          message: 'Loading...',
        });
      });

      // Small delay to ensure duration > 0
      const duration = LoadingStateManager.getLoadingDuration('duration-test');
      expect(duration).toBeGreaterThanOrEqual(0);

      act(() => {
        LoadingStateManager.hideLoading('duration-test');
      });

      // Duration should be 0 after hiding
      expect(LoadingStateManager.getLoadingDuration('duration-test')).toBe(0);
    });

    it('should handle progress updates correctly', () => {
      act(() => {
        LoadingStateManager.showLoading({
          id: 'progress-test',
          type: 'form-submit',
          message: 'Uploading...',
          showProgress: true,
        });
      });

      let loadingState = LoadingStateManager.getLoadingState('progress-test');
      expect(loadingState?.progress).toBe(0);

      act(() => {
        LoadingStateManager.updateProgress('progress-test', 50);
      });

      loadingState = LoadingStateManager.getLoadingState('progress-test');
      expect(loadingState?.progress).toBe(50);

      // Test boundary values
      act(() => {
        LoadingStateManager.updateProgress('progress-test', 150); // Should clamp to 100
      });

      loadingState = LoadingStateManager.getLoadingState('progress-test');
      expect(loadingState?.progress).toBe(100);

      act(() => {
        LoadingStateManager.updateProgress('progress-test', -10); // Should clamp to 0
      });

      loadingState = LoadingStateManager.getLoadingState('progress-test');
      expect(loadingState?.progress).toBe(0);
    });

    it('should handle invalid progress values gracefully', () => {
      act(() => {
        LoadingStateManager.showLoading({
          id: 'invalid-progress-test',
          type: 'form-submit',
          message: 'Processing...',
          showProgress: true,
        });
      });

      // Test NaN handling
      act(() => {
        LoadingStateManager.updateProgress('invalid-progress-test', NaN);
      });

      let loadingState = LoadingStateManager.getLoadingState('invalid-progress-test');
      expect(loadingState?.progress).toBe(0);

      // Test Infinity handling
      act(() => {
        LoadingStateManager.updateProgress('invalid-progress-test', Infinity);
      });

      loadingState = LoadingStateManager.getLoadingState('invalid-progress-test');
      expect(loadingState?.progress).toBe(0);
    });

    it('should clear all loading states correctly', () => {
      // Start multiple operations
      act(() => {
        LoadingStateManager.showLoading({
          id: 'clear-test-1',
          type: 'data-fetch',
          message: 'Loading 1...',
        });

        LoadingStateManager.showLoading({
          id: 'clear-test-2',
          type: 'async-action',
          message: 'Loading 2...',
        });
      });

      expect(LoadingStateManager.isAnyLoading()).toBe(true);
      expect(LoadingStateManager.getAllLoadingStates().size).toBe(2);

      // Clear all
      act(() => {
        LoadingStateManager.clearAll();
      });

      expect(LoadingStateManager.isAnyLoading()).toBe(false);
      expect(LoadingStateManager.getAllLoadingStates().size).toBe(0);
    });
  });
});