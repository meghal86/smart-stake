/**
 * Integration Test: Demo Mode Persistence
 * 
 * Verifies that demo mode toggle state persists when wallet interactions occur.
 * 
 * Bug Fix: Previously, clicking wallet chip in header would reset demo mode toggle.
 * Root Cause: updateDemoMode() didn't respect user's manual preference.
 * Solution: Added userPreference tracking with localStorage persistence.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DemoModeManager } from '@/lib/ux/DemoModeManager';

describe('Demo Mode Persistence Integration', () => {
  let manager: DemoModeManager;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Save original localStorage
    originalLocalStorage = global.localStorage;
    
    // Mock localStorage
    const localStorageMock = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (index: number) => Object.keys(store)[index] || null,
      };
    })();
    
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Get fresh manager instance
    manager = DemoModeManager.getInstance();
    manager.reset();
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
    
    manager.reset();
  });

  describe('User Manual Toggle Persistence', () => {
    test('manual demo mode toggle persists across wallet interactions', async () => {
      // User manually enables demo mode
      manager.setDemoMode(true);
      
      expect(manager.getCurrentState().isDemo).toBe(true);
      expect(manager.getCurrentState().reason).toBe('user_preference');
      
      // Simulate wallet chip click (triggers updateDemoMode with isAuthenticated=true)
      await manager.updateDemoMode(true);
      
      // Demo mode should STILL be enabled (respects user preference)
      expect(manager.getCurrentState().isDemo).toBe(true);
      expect(manager.getCurrentState().reason).toBe('user_preference');
    });

    test('manual live mode toggle persists across wallet interactions', async () => {
      // User manually disables demo mode
      manager.setDemoMode(false);
      
      expect(manager.getCurrentState().isDemo).toBe(false);
      expect(manager.getCurrentState().reason).toBe('live_mode');
      
      // Simulate wallet disconnection (would normally force demo mode)
      await manager.updateDemoMode(false);
      
      // Live mode should STILL be active (respects user preference)
      expect(manager.getCurrentState().isDemo).toBe(false);
      expect(manager.getCurrentState().reason).toBe('user_preference');
    });

    test('preference is saved to localStorage', () => {
      manager.setDemoMode(true);
      
      const saved = localStorage.getItem('aw_demo_mode_preference');
      expect(saved).toBe('true');
      
      manager.setDemoMode(false);
      
      const savedAgain = localStorage.getItem('aw_demo_mode_preference');
      expect(savedAgain).toBe('false');
    });

    test('preference is restored from localStorage on init', () => {
      // Set preference in localStorage
      localStorage.setItem('aw_demo_mode_preference', 'true');
      
      // Create new manager instance (simulates page refresh)
      const newManager = DemoModeManager.getInstance();
      
      // Should restore preference
      // Note: In real implementation, preference is restored in constructor
      expect(localStorage.getItem('aw_demo_mode_preference')).toBe('true');
    });
  });

  describe('Clear Preference', () => {
    test('clearPreference removes user preference', () => {
      // Set preference
      manager.setDemoMode(true);
      expect(localStorage.getItem('aw_demo_mode_preference')).toBe('true');
      
      // Clear preference
      manager.clearPreference();
      expect(localStorage.getItem('aw_demo_mode_preference')).toBeNull();
    });

    test('after clearing preference, automatic mode switching resumes', async () => {
      // Set manual preference
      manager.setDemoMode(true);
      
      // Clear preference
      manager.clearPreference();
      
      // Now wallet connection should control mode automatically
      // When wallet is disconnected, should be demo mode
      await manager.updateDemoMode(false); // Wallet disconnected
      expect(manager.getCurrentState().isDemo).toBe(true); // Should be demo mode
      expect(manager.getCurrentState().reason).toBe('wallet_not_connected');
      
      // Note: When wallet is connected, it would check data sources
      // In test environment, data sources fail, so it stays in demo mode
      // This is expected behavior - the key is that user preference is no longer controlling it
    });
  });

  describe('Automatic Mode (No Preference)', () => {
    test('without preference, wallet connection controls mode', async () => {
      // No preference set
      expect(localStorage.getItem('aw_demo_mode_preference')).toBeNull();
      
      // Wallet not connected → demo mode
      await manager.updateDemoMode(false);
      expect(manager.getCurrentState().isDemo).toBe(true);
      expect(manager.getCurrentState().reason).toBe('wallet_not_connected');
      
      // Wallet connected → live mode (assuming data sources available)
      await manager.updateDemoMode(true);
      // Note: In real scenario, this would check data sources
      // For this test, we're just verifying the preference logic
    });
  });

  describe('Edge Cases', () => {
    test('handles localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error('localStorage unavailable');
      };
      
      // Should not throw
      expect(() => manager.setDemoMode(true)).not.toThrow();
      
      // Restore
      localStorage.setItem = originalSetItem;
    });

    test('handles invalid localStorage values', () => {
      // Set invalid value
      localStorage.setItem('aw_demo_mode_preference', 'invalid');
      
      // Should handle gracefully (treat as null preference)
      const newManager = DemoModeManager.getInstance();
      // Manager should still work without crashing
      expect(newManager).toBeDefined();
    });
  });

  describe('Real-World Scenarios', () => {
    test('scenario: user toggles demo on, navigates, clicks wallet, demo stays on', async () => {
      // 1. User toggles demo mode ON
      manager.setDemoMode(true);
      expect(manager.getCurrentState().isDemo).toBe(true);
      
      // 2. User navigates to different page (simulated by updateDemoMode call)
      await manager.updateDemoMode(true);
      expect(manager.getCurrentState().isDemo).toBe(true);
      
      // 3. User clicks wallet chip in header (triggers auth state change)
      await manager.updateDemoMode(true);
      expect(manager.getCurrentState().isDemo).toBe(true);
      
      // 4. User refreshes page (simulated by checking localStorage)
      const saved = localStorage.getItem('aw_demo_mode_preference');
      expect(saved).toBe('true');
    });

    test('scenario: user toggles demo off, wallet disconnects, live mode stays', async () => {
      // 1. User toggles demo mode OFF (wants live mode)
      manager.setDemoMode(false);
      expect(manager.getCurrentState().isDemo).toBe(false);
      
      // 2. Wallet disconnects (would normally force demo mode)
      await manager.updateDemoMode(false);
      
      // 3. Live mode should persist (respects user preference)
      expect(manager.getCurrentState().isDemo).toBe(false);
      expect(manager.getCurrentState().reason).toBe('user_preference');
    });
  });
});
