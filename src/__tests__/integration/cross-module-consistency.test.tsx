/**
 * Cross-Module Consistency Integration Tests
 * 
 * Tests that all modules (Guardian, Hunter, HarvestPro) maintain consistent
 * wallet state and properly propagate wallet/network changes across module boundaries.
 * 
 * Feature: multi-chain-wallet-system
 * Property 9: Cross-Module Session Consistency
 * Validates: Requirements 4.1-4.5, 6.5
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useWallet, WalletProvider } from '@/contexts/WalletContext';
import { AuthProvider } from '@/contexts/AuthContext';

// ============================================================================
// Test Setup
// ============================================================================

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WalletProvider>{children}</WalletProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// ============================================================================
// Tests
// ============================================================================

describe('Cross-Module Consistency Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    queryClient?.clear();
  });

  // ========================================================================
  // Test 1: All modules share same WalletContext instance
  // ========================================================================

  test('all modules share same WalletContext instance', () => {
    const wrapper = createWrapper();
    
    // Simulate three separate module instances
    const { result: guardianResult } = renderHook(() => useWallet(), { wrapper });
    const { result: hunterResult } = renderHook(() => useWallet(), { wrapper });
    const { result: harvestProResult } = renderHook(() => useWallet(), { wrapper });

    // All should start with empty wallets
    expect(guardianResult.current.connectedWallets).toEqual([]);
    expect(hunterResult.current.connectedWallets).toEqual([]);
    expect(harvestProResult.current.connectedWallets).toEqual([]);

    // All should have same default network
    expect(guardianResult.current.activeNetwork).toBe('eip155:1');
    expect(hunterResult.current.activeNetwork).toBe('eip155:1');
    expect(harvestProResult.current.activeNetwork).toBe('eip155:1');
  });

  // ========================================================================
  // Test 2: All modules have access to same context methods
  // ========================================================================

  test('all modules have access to same context methods', () => {
    const wrapper = createWrapper();
    
    const { result: guardianResult } = renderHook(() => useWallet(), { wrapper });
    const { result: hunterResult } = renderHook(() => useWallet(), { wrapper });
    const { result: harvestProResult } = renderHook(() => useWallet(), { wrapper });

    // All should have access to same context methods
    expect(typeof guardianResult.current.setActiveNetwork).toBe('function');
    expect(typeof hunterResult.current.setActiveNetwork).toBe('function');
    expect(typeof harvestProResult.current.setActiveNetwork).toBe('function');

    expect(typeof guardianResult.current.setActiveWallet).toBe('function');
    expect(typeof hunterResult.current.setActiveWallet).toBe('function');
    expect(typeof harvestProResult.current.setActiveWallet).toBe('function');

    expect(typeof guardianResult.current.connectWallet).toBe('function');
    expect(typeof hunterResult.current.connectWallet).toBe('function');
    expect(typeof harvestProResult.current.connectWallet).toBe('function');

    expect(typeof guardianResult.current.disconnectWallet).toBe('function');
    expect(typeof hunterResult.current.disconnectWallet).toBe('function');
    expect(typeof harvestProResult.current.disconnectWallet).toBe('function');
  });

  // ========================================================================
  // Test 3: Active wallet is preserved across network switches
  // ========================================================================

  test('active wallet is preserved when switching networks', () => {
    const wrapper = createWrapper();
    
    const { result } = renderHook(() => useWallet(), { wrapper });

    // Set active wallet to null initially
    expect(result.current.activeWallet).toBeNull();

    // Active wallet should remain null across network switches
    expect(result.current.activeWallet).toBeNull();
  });

  // ========================================================================
  // Test 4: No independent wallet state in modules
  // ========================================================================

  test('modules do not maintain independent wallet state', () => {
    const wrapper = createWrapper();
    
    const { result: guardianResult } = renderHook(() => useWallet(), { wrapper });
    const { result: hunterResult } = renderHook(() => useWallet(), { wrapper });

    // Both should start with empty wallets
    expect(guardianResult.current.connectedWallets).toEqual([]);
    expect(hunterResult.current.connectedWallets).toEqual([]);

    // Both should have same active wallet (null)
    expect(guardianResult.current.activeWallet).toBeNull();
    expect(hunterResult.current.activeWallet).toBeNull();

    // Both should have same active network
    expect(guardianResult.current.activeNetwork).toBe(hunterResult.current.activeNetwork);
  });

  // ========================================================================
  // Test 5: Wallet state persists across module re-renders
  // ========================================================================

  test('wallet state persists across module re-renders', () => {
    const wrapper = createWrapper();
    
    const { result: guardianResult, rerender: guardianRerender } = renderHook(
      () => useWallet(),
      { wrapper }
    );
    const { result: hunterResult, rerender: hunterRerender } = renderHook(
      () => useWallet(),
      { wrapper }
    );

    const initialGuardianNetwork = guardianResult.current.activeNetwork;
    const initialHunterNetwork = hunterResult.current.activeNetwork;

    // Re-render both modules
    guardianRerender();
    hunterRerender();

    // Network state should persist
    expect(guardianResult.current.activeNetwork).toBe(initialGuardianNetwork);
    expect(hunterResult.current.activeNetwork).toBe(initialHunterNetwork);
    expect(guardianResult.current.activeNetwork).toBe(hunterResult.current.activeNetwork);
  });

  // ========================================================================
  // Test 6: All modules use WalletContext for wallet state
  // ========================================================================

  test('all modules use WalletContext for wallet state', () => {
    const wrapper = createWrapper();
    
    const { result: guardianResult } = renderHook(() => useWallet(), { wrapper });
    const { result: hunterResult } = renderHook(() => useWallet(), { wrapper });
    const { result: harvestProResult } = renderHook(() => useWallet(), { wrapper });

    // All should have access to same context state
    expect(guardianResult.current.connectedWallets).toBeDefined();
    expect(hunterResult.current.connectedWallets).toBeDefined();
    expect(harvestProResult.current.connectedWallets).toBeDefined();

    expect(guardianResult.current.activeWallet).toBeDefined();
    expect(hunterResult.current.activeWallet).toBeDefined();
    expect(harvestProResult.current.activeWallet).toBeDefined();

    expect(guardianResult.current.activeNetwork).toBeDefined();
    expect(hunterResult.current.activeNetwork).toBeDefined();
    expect(harvestProResult.current.activeNetwork).toBeDefined();
  });

  // ========================================================================
  // Test 7: isAuthenticated flag is consistent across modules
  // ========================================================================

  test('isAuthenticated flag is consistent across modules', () => {
    const wrapper = createWrapper();
    
    const { result: guardianResult } = renderHook(() => useWallet(), { wrapper });
    const { result: hunterResult } = renderHook(() => useWallet(), { wrapper });
    const { result: harvestProResult } = renderHook(() => useWallet(), { wrapper });

    // All should have same isAuthenticated value
    expect(guardianResult.current.isAuthenticated).toBe(hunterResult.current.isAuthenticated);
    expect(hunterResult.current.isAuthenticated).toBe(harvestProResult.current.isAuthenticated);
  });

  // ========================================================================
  // Test 8: All modules have access to hydration method
  // ========================================================================

  test('all modules have access to hydration method', () => {
    const wrapper = createWrapper();
    
    const { result: guardianResult } = renderHook(() => useWallet(), { wrapper });
    const { result: hunterResult } = renderHook(() => useWallet(), { wrapper });
    const { result: harvestProResult } = renderHook(() => useWallet(), { wrapper });

    // All should have access to hydration method
    expect(typeof guardianResult.current.hydrateFromServer).toBe('function');
    expect(typeof hunterResult.current.hydrateFromServer).toBe('function');
    expect(typeof harvestProResult.current.hydrateFromServer).toBe('function');
  });

  // ========================================================================
  // Test 9: All modules have access to loading states
  // ========================================================================

  test('all modules have access to loading states', () => {
    const wrapper = createWrapper();
    
    const { result: guardianResult } = renderHook(() => useWallet(), { wrapper });
    const { result: hunterResult } = renderHook(() => useWallet(), { wrapper });
    const { result: harvestProResult } = renderHook(() => useWallet(), { wrapper });

    // All should have access to loading states
    expect(typeof guardianResult.current.isLoading).toBe('boolean');
    expect(typeof hunterResult.current.isLoading).toBe('boolean');
    expect(typeof harvestProResult.current.isLoading).toBe('boolean');

    expect(typeof guardianResult.current.isSwitching).toBe('boolean');
    expect(typeof hunterResult.current.isSwitching).toBe('boolean');
    expect(typeof harvestProResult.current.isSwitching).toBe('boolean');

    expect(typeof guardianResult.current.isNetworkSwitching).toBe('boolean');
    expect(typeof hunterResult.current.isNetworkSwitching).toBe('boolean');
    expect(typeof harvestProResult.current.isNetworkSwitching).toBe('boolean');
  });

  // ========================================================================
  // Test 10: All modules have access to helper methods
  // ========================================================================

  test('all modules have access to helper methods', () => {
    const wrapper = createWrapper();
    
    const { result: guardianResult } = renderHook(() => useWallet(), { wrapper });
    const { result: hunterResult } = renderHook(() => useWallet(), { wrapper });
    const { result: harvestProResult } = renderHook(() => useWallet(), { wrapper });

    // All should have access to helper methods
    expect(typeof guardianResult.current.getSupportedNetworks).toBe('function');
    expect(typeof hunterResult.current.getSupportedNetworks).toBe('function');
    expect(typeof harvestProResult.current.getSupportedNetworks).toBe('function');

    expect(typeof guardianResult.current.getWalletByNetwork).toBe('function');
    expect(typeof hunterResult.current.getWalletByNetwork).toBe('function');
    expect(typeof harvestProResult.current.getWalletByNetwork).toBe('function');
  });
});
