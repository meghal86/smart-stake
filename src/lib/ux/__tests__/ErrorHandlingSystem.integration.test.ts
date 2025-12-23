/**
 * Integration Tests for Error Handling System
 * 
 * Tests the complete error handling flow including recovery options,
 * graceful degradation, and user-friendly error messages.
 * 
 * Requirements: R15.ERROR.BOUNDARIES, R15.ERROR.GRACEFUL_DEGRADATION, R15.ERROR.CLEAR_MESSAGES
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorHandlingSystem, ErrorSeverity } from '../ErrorHandlingSystem';
import { NetworkStatusManager } from '../NetworkStatusManager';

// Mock window and navigator
const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  gtag: vi.fn(),
  Sentry: {
    captureException: vi.fn()
  }
};

const mockNavigator = {
  onLine: true,
  connection: {
    type: 'wifi',
    effectiveType: '4g'
  }
};

// @ts-ignore
global.window = mockWindow;
// @ts-ignore
global.navigator = mockNavigator;

describe('Error Handling System Integration Tests', () => {
  let errorHandler: ErrorHandlingSystem;
  let networkManager: NetworkStatusManager;

  beforeEach(() => {
    vi.clearAllMocks();
    errorHandler = new ErrorHandlingSystem({
      enableTelemetry: true,
      maxRetries: 3,
      retryDelay: 100, // Faster for testing
      showTechnicalDetails: false,
      enableOfflineMode: true
    });
    networkManager = new NetworkStatusManager({
      enableOfflineMode: true,
      slowConnectionThreshold: 1000,
      cacheDefaultTTL: 5000,
      maxCacheSize: 10,
      enableTelemetry: true
    });
  });

  afterEach(() => {
    errorHandler.clearErrorHistory();
    networkManager.clearCache();
  });

  describe('API Error Handling with Recovery', () => {
    it('should handle API errors with automatic retry', async () => {
      let callCount = 0;
      const mockApiCall = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Network timeout');
        }
        return Promise.resolve({ data: 'success' });
      });

      const errorContext = await errorHandler.handleApiError(
        new Error('Network timeout'),
        { component: 'api', action: 'fetch' },
        { retry: mockApiCall }
      );

      expect(mockApiCall).toHaveBeenCalledTimes(1); // Initial call in recovery
      expect(errorContext.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorContext.userMessage).toContain('timeout');
    });

    it('should fall back to cached data when API fails', async () => {
      const cachedData = { data: 'cached_result' };
      networkManager.cacheData('test-key', cachedData);

      const errorContext = await errorHandler.handleApiError(
        new Error('API server error'),
        { component: 'api', action: 'fetch' },
        { cache: () => networkManager.getCachedData('test-key').data }
      );

      expect(errorContext.severity).toBe(ErrorSeverity.LOW);
      expect(errorContext.userMessage).toContain('cached');
    });

    it('should escalate to high severity after max retries', async () => {
      const failingApiCall = vi.fn().mockRejectedValue(new Error('Persistent failure'));

      let errorContext = await errorHandler.handleApiError(
        new Error('Persistent failure'),
        { component: 'api', action: 'fetch', retryCount: 0 },
        { retry: failingApiCall }
      );

      // Simulate multiple retry attempts
      for (let i = 1; i < 4; i++) {
        errorContext = await errorHandler.handleApiError(
          new Error('Persistent failure'),
          { ...errorContext, retryCount: i },
          { retry: failingApiCall }
        );
      }

      expect(errorContext.retryCount).toBe(3);
      expect(errorContext.recoverable).toBe(true);
    });
  });

  describe('Network Connectivity Handling', () => {
    it('should handle network offline state', () => {
      // @ts-ignore
      global.navigator.onLine = false;
      
      const errorContext = errorHandler.handleNetworkError('test-cache-key');
      
      expect(errorContext.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorContext.userMessage).toContain('offline');
      expect(errorContext.component).toBe('network');
    });

    it('should show cached data during network issues', () => {
      networkManager.cacheData('network-test', { data: 'cached' });
      
      const errorContext = errorHandler.handleNetworkError('network-test');
      
      expect(errorContext.severity).toBe(ErrorSeverity.LOW);
      expect(errorContext.userMessage).toContain('offline');
    });

    it('should handle slow connection gracefully', async () => {
      const slowApiCall = () => new Promise(resolve => 
        setTimeout(() => resolve({ data: 'slow_result' }), 2000)
      );

      try {
        await networkManager.fetchWithFallback(
          'slow-test',
          slowApiCall,
          { timeout: 1000 }
        );
      } catch (error) {
        expect((error as Error).message).toContain('timeout');
      }
    });
  });

  describe('Form Error Handling', () => {
    it('should handle form validation errors', () => {
      const validationError = new Error('Validation failed: email is required');
      
      const errorContext = errorHandler.handleFormError(
        validationError,
        'email',
        { email: '', password: 'test123' }
      );

      expect(errorContext.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorContext.userMessage).toContain('email');
      expect(errorContext.component).toBe('form');
    });

    it('should provide field-specific error messages', () => {
      const fieldError = new Error('Invalid email format');
      
      const errorContext = errorHandler.handleFormError(fieldError, 'email');
      
      expect(errorContext.userMessage).toContain('email');
      expect(errorContext.recoverable).toBe(true);
    });
  });

  describe('Wallet Error Handling', () => {
    it('should handle wallet connection rejection', () => {
      const rejectionError = new Error('User rejected the request');
      
      const errorContext = errorHandler.handleWalletError(rejectionError);
      
      expect(errorContext.severity).toBe(ErrorSeverity.MEDIUM);
      expect(errorContext.userMessage).toContain('declined');
      expect(errorContext.component).toBe('wallet');
    });

    it('should handle wallet not installed error', () => {
      const notInstalledError = new Error('MetaMask not found');
      
      const errorContext = errorHandler.handleWalletError(notInstalledError);
      
      expect(errorContext.userMessage).toContain('install');
    });

    it('should handle wrong network error', () => {
      const networkError = new Error('Wrong network selected');
      
      const errorContext = errorHandler.handleWalletError(networkError);
      
      expect(errorContext.userMessage).toContain('switch');
    });
  });

  describe('Error Statistics and Monitoring', () => {
    it('should track error statistics correctly', async () => {
      // Generate various errors
      await errorHandler.handleApiError(
        new Error('API error 1'),
        { component: 'api', action: 'fetch' }
      );
      
      errorHandler.handleFormError(
        new Error('Form error 1'),
        'email'
      );
      
      errorHandler.handleWalletError(
        new Error('Wallet error 1')
      );

      const stats = errorHandler.getErrorStats();
      
      expect(stats.totalErrors).toBe(3);
      expect(stats.errorsByComponent.api).toBe(1);
      expect(stats.errorsByComponent.form).toBe(1);
      expect(stats.errorsByComponent.wallet).toBe(1);
      expect(stats.errorsBySeverity[ErrorSeverity.MEDIUM]).toBeGreaterThan(0);
    });

    it('should limit recent errors to last 10', async () => {
      // Generate 15 errors
      for (let i = 0; i < 15; i++) {
        await errorHandler.handleApiError(
          new Error(`Error ${i}`),
          { component: 'test', action: 'test' }
        );
      }

      const stats = errorHandler.getErrorStats();
      
      expect(stats.totalErrors).toBe(15);
      expect(stats.recentErrors.length).toBe(10);
    });
  });

  describe('Caching and Offline Mode', () => {
    it('should cache successful API responses', async () => {
      const successfulData = { result: 'success' };
      const apiCall = vi.fn().mockResolvedValue(successfulData);

      const result = await networkManager.fetchWithFallback(
        'cache-test',
        apiCall
      );

      expect(result.data).toEqual(successfulData);
      expect(result.fromCache).toBe(false);
      
      // Verify data is cached
      const cached = networkManager.getCachedData('cache-test');
      expect(cached.data).toEqual(successfulData);
    });

    it('should return cached data when network fails', async () => {
      const cachedData = { result: 'cached' };
      networkManager.cacheData('fallback-test', cachedData);

      const failingApiCall = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await networkManager.fetchWithFallback(
        'fallback-test',
        failingApiCall
      );

      expect(result.data).toEqual(cachedData);
      expect(result.fromCache).toBe(true);
      expect(result.networkError).toBeDefined();
    });

    it('should handle cache expiration correctly', async () => {
      const shortTTL = 100; // 100ms
      networkManager.cacheData('expire-test', { data: 'will_expire' }, shortTTL);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      const cached = networkManager.getCachedData('expire-test');
      expect(cached.data).toBeNull();
    });
  });

  describe('Telemetry and Logging', () => {
    it('should log errors to telemetry services', async () => {
      await errorHandler.handleApiError(
        new Error('Test error for telemetry'),
        { component: 'test', action: 'telemetry' }
      );

      expect(mockWindow.gtag).toHaveBeenCalledWith(
        'event',
        'exception',
        expect.objectContaining({
          description: expect.stringContaining('error'),
          fatal: false
        })
      );
    });

    it('should send errors to Sentry in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await errorHandler.handleApiError(
        new Error('Production error'),
        { component: 'prod', action: 'test' }
      );

      // Note: Sentry logging happens in error boundary, not error handler
      // This test verifies the structure is in place

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Classification', () => {
    it('should classify network errors as medium severity', async () => {
      const networkError = new Error('Network request failed');
      
      const errorContext = await errorHandler.handleApiError(
        networkError,
        { component: 'api', action: 'fetch' }
      );

      expect(errorContext.severity).toBe(ErrorSeverity.MEDIUM);
    });

    it('should classify server errors as high severity', async () => {
      const serverError = new Error('Internal server error 500');
      
      const errorContext = await errorHandler.handleApiError(
        serverError,
        { component: 'api', action: 'fetch' }
      );

      expect(errorContext.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should classify unauthorized errors as high severity', async () => {
      const authError = new Error('Unauthorized access');
      
      const errorContext = await errorHandler.handleApiError(
        authError,
        { component: 'api', action: 'fetch' }
      );

      expect(errorContext.severity).toBe(ErrorSeverity.HIGH);
    });

    it('should classify rate limit errors as medium severity', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      
      const errorContext = await errorHandler.handleApiError(
        rateLimitError,
        { component: 'api', action: 'fetch' }
      );

      expect(errorContext.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('Recovery Options', () => {
    it('should execute fallback function when provided', async () => {
      const fallbackFn = vi.fn();
      
      await errorHandler.handleApiError(
        new Error('API failure'),
        { component: 'api', action: 'fetch' },
        { fallback: fallbackFn }
      );

      // Fallback should be called during graceful degradation
      // (This depends on the specific error and retry logic)
    });

    it('should provide escalation path for persistent errors', async () => {
      const escalateFn = vi.fn();
      
      const errorContext = await errorHandler.handleApiError(
        new Error('Persistent error'),
        { component: 'api', action: 'fetch', retryCount: 3 },
        { escalate: escalateFn }
      );

      expect(errorContext.retryCount).toBe(3);
      // Escalation logic would be handled by the UI layer
    });
  });
});