/**
 * Unit Tests for Demo Mode Manager
 * 
 * Tests the core functionality of the DemoModeManager class
 * and its integration with wallet connection and data sources.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { DemoModeManager } from '../DemoModeManager';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock AbortSignal.timeout
global.AbortSignal.timeout = vi.fn(() => new AbortController().signal);

describe('DemoModeManager', () => {
  let manager: DemoModeManager;

  beforeEach(() => {
    // Get fresh instance for each test
    manager = DemoModeManager.getInstance();
    manager.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('singleton pattern', () => {
    test('returns same instance', () => {
      const instance1 = DemoModeManager.getInstance();
      const instance2 = DemoModeManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initial state', () => {
    test('starts in demo mode', () => {
      const state = manager.getCurrentState();
      expect(state.isDemo).toBe(true);
      expect(state.reason).toBe('wallet_not_connected');
      expect(state.bannerVisible).toBe(true);
    });

    test('provides correct banner messages', () => {
      expect(manager.getBannerMessage()).toBe('Demo Mode — Data is simulated');
      expect(manager.getBannerCTA()).toBe('Connect Wallet for Live Data');
    });
  });

  describe('wallet connection handling', () => {
    test('stays in demo mode when wallet not connected', async () => {
      await manager.updateDemoMode(false);
      
      const state = manager.getCurrentState();
      expect(state.isDemo).toBe(true);
      expect(state.reason).toBe('wallet_not_connected');
      expect(state.bannerVisible).toBe(true);
    });

    test('checks data sources when wallet connected', async () => {
      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: '0x1234567890' })
        }) // Gas oracle
        .mockResolvedValueOnce({
          ok: true
        }) // Core API
        .mockResolvedValueOnce({
          ok: true
        }) // Guardian API
        .mockResolvedValueOnce({
          ok: true
        }) // Hunter API
        .mockResolvedValueOnce({
          ok: true
        }); // HarvestPro API

      await manager.updateDemoMode(true);
      
      const state = manager.getCurrentState();
      expect(state.isDemo).toBe(false);
      expect(state.reason).toBe('live_mode');
      expect(state.bannerVisible).toBe(false);
    });

    test('stays in demo mode when data sources unavailable', async () => {
      // Mock failed API responses
      mockFetch
        .mockRejectedValueOnce(new Error('Network error')) // Gas oracle
        .mockRejectedValueOnce(new Error('Network error')) // Core API
        .mockRejectedValueOnce(new Error('Network error')) // Guardian API
        .mockRejectedValueOnce(new Error('Network error')) // Hunter API
        .mockRejectedValueOnce(new Error('Network error')); // HarvestPro API

      await manager.updateDemoMode(true);
      
      const state = manager.getCurrentState();
      expect(state.isDemo).toBe(true);
      expect(state.reason).toBe('data_sources_unavailable');
      expect(state.bannerVisible).toBe(true);
    });
  });

  describe('data source validation', () => {
    test('validates gas oracle correctly', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: '0x1234567890' })
        })
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'))
        .mockRejectedValueOnce(new Error('API error'));

      const status = await manager.validateDataSources();
      
      expect(status.gasOracle).toBe(true);
      expect(status.coreAPI).toBe(false);
      expect(status.overall).toBe(false);
    });

    test('requires at least one module API for live mode', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: '0x1234567890' })
        }) // Gas oracle
        .mockResolvedValueOnce({
          ok: true
        }) // Core API
        .mockRejectedValueOnce(new Error('API error')) // Guardian API
        .mockRejectedValueOnce(new Error('API error')) // Hunter API
        .mockRejectedValueOnce(new Error('API error')); // HarvestPro API

      const status = await manager.validateDataSources();
      
      expect(status.gasOracle).toBe(true);
      expect(status.coreAPI).toBe(true);
      expect(status.moduleAPIs.guardian).toBe(false);
      expect(status.moduleAPIs.hunter).toBe(false);
      expect(status.moduleAPIs.harvestpro).toBe(false);
      expect(status.overall).toBe(false);
    });

    test('handles 401 responses as available APIs', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: '0x1234567890' })
        }) // Gas oracle
        .mockResolvedValueOnce({
          ok: true
        }) // Core API
        .mockResolvedValueOnce({
          ok: false,
          status: 401
        }) // Guardian API (needs auth)
        .mockRejectedValueOnce(new Error('API error')) // Hunter API
        .mockRejectedValueOnce(new Error('API error')); // HarvestPro API

      const status = await manager.validateDataSources();
      
      expect(status.moduleAPIs.guardian).toBe(true); // 401 means API exists
      expect(status.overall).toBe(true); // Should be true now
    });
  });

  describe('state management', () => {
    test('notifies listeners of state changes', async () => {
      const listener = vi.fn();
      const unsubscribe = manager.subscribe(listener);
      
      // Should be called immediately with current state
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          isDemo: true,
          reason: 'wallet_not_connected'
        })
      );
      
      // Clear the initial call
      listener.mockClear();
      
      // Change state
      manager.setDemoMode(false);
      
      // Should be called with new state
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          isDemo: false,
          reason: 'live_mode'
        })
      );
      
      unsubscribe();
    });

    test('handles listener errors gracefully', () => {
      // Create a listener that only throws on the second call (not the initial subscription call)
      let callCount = 0;
      const badListener = vi.fn(() => {
        callCount++;
        if (callCount > 1) {
          throw new Error('Listener error');
        }
      });
      const goodListener = vi.fn();
      
      // Subscribe listeners (they will be called immediately with current state)
      manager.subscribe(badListener);
      manager.subscribe(goodListener);
      
      // Clear the initial calls
      badListener.mockClear();
      goodListener.mockClear();
      
      // Should not throw and should still call good listener
      expect(() => manager.setDemoMode(false)).not.toThrow();
      expect(goodListener).toHaveBeenCalled();
    });
  });

  describe('force demo mode', () => {
    test('can force demo mode regardless of wallet state', async () => {
      // Mock successful APIs
      mockFetch
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ result: '0x1234567890' })
        });

      // Force demo mode even with wallet connected
      await manager.updateDemoMode(true, true);
      
      const state = manager.getCurrentState();
      expect(state.isDemo).toBe(true);
      expect(state.reason).toBe('user_preference');
    });

    test('provides correct messages for user preference', () => {
      manager.setDemoMode(true);
      
      expect(manager.getBannerMessage()).toBe('Demo Mode — Data is simulated');
      expect(manager.getBannerCTA()).toBe('Switch to Live Data');
    });
  });

  describe('banner messages', () => {
    test('provides correct messages for different states', async () => {
      // Wallet not connected
      await manager.updateDemoMode(false);
      expect(manager.getBannerMessage()).toBe('Demo Mode — Data is simulated');
      expect(manager.getBannerCTA()).toBe('Connect Wallet for Live Data');
      
      // Data sources unavailable
      mockFetch.mockRejectedValue(new Error('Network error'));
      await manager.updateDemoMode(true);
      expect(manager.getBannerMessage()).toBe('Demo Mode — Live data temporarily unavailable');
      expect(manager.getBannerCTA()).toBe('Retry Live Data');
      
      // User preference
      manager.setDemoMode(true);
      expect(manager.getBannerMessage()).toBe('Demo Mode — Data is simulated');
      expect(manager.getBannerCTA()).toBe('Switch to Live Data');
    });
  });

  describe('reset functionality', () => {
    test('resets to initial state', () => {
      // Change state
      manager.setDemoMode(false);
      expect(manager.isDemo()).toBe(false);
      
      // Reset
      manager.reset();
      
      const state = manager.getCurrentState();
      expect(state.isDemo).toBe(true);
      expect(state.reason).toBe('wallet_not_connected');
      expect(state.bannerVisible).toBe(true);
    });
  });
});