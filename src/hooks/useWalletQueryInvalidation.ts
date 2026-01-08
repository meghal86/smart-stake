/**
 * useWalletQueryInvalidation - Coordinate React Query invalidation on wallet/network changes
 * 
 * This hook ensures that React Query queries are properly invalidated when wallet or network
 * changes occur, triggering automatic refetches across all modules.
 * 
 * Feature: multi-chain-wallet-system
 * Property 9: Cross-Module Session Consistency
 * Validates: Requirements 4.1-4.5, 6.5
 * Task: 11 - React Query Integration
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from '@/contexts/WalletContext';
import {
  getWalletDependentQueryKeys,
  getNetworkDependentQueryKeys,
  walletKeys,
} from '@/lib/query-keys';

/**
 * Hook to coordinate React Query invalidation on wallet/network changes
 * 
 * This hook should be used at the root level (in a layout or provider) to ensure
 * that all modules receive invalidation events when wallet or network changes.
 * 
 * Invalidation Strategy:
 * - When wallet changes: Invalidate all wallet-dependent queries
 * - When network changes: Invalidate all network-dependent queries
 * - When wallet registry changes: Invalidate wallet registry queries
 * 
 * @example
 * ```typescript
 * // In your root layout or provider
 * export function RootLayout() {
 *   useWalletQueryInvalidation();
 *   
 *   return (
 *     <div>
 *       Your app content
 *     </div>
 *   );
 * }
 * ```
 */
export function useWalletQueryInvalidation(): void {
  const queryClient = useQueryClient();
  const { activeWallet, activeNetwork } = useWallet();

  // Invalidate queries when active wallet changes
  useEffect(() => {
    if (activeWallet) {
      // Invalidate all wallet-dependent queries
      const keysToInvalidate = getWalletDependentQueryKeys(activeWallet, activeNetwork);
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }
  }, [activeWallet, activeNetwork, queryClient]);

  // Invalidate queries when active network changes
  useEffect(() => {
    if (activeNetwork && activeWallet) {
      // Invalidate all network-dependent queries
      const keysToInvalidate = getNetworkDependentQueryKeys(activeWallet, activeNetwork);
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }
  }, [activeNetwork, activeWallet, queryClient]);
}

/**
 * Hook to invalidate wallet registry queries
 * Call this after wallet mutations (add, remove, set primary)
 * 
 * @example
 * ```typescript
 * const invalidateWalletRegistry = useInvalidateWalletRegistry();
 * 
 * // After adding a wallet
 * await addWallet(address, network);
 * invalidateWalletRegistry();
 * ```
 */
export function useInvalidateWalletRegistry(): () => void {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: walletKeys.registry() });
  };
}
