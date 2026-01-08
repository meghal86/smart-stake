/**
 * useWalletChangeListener - Listen to wallet/network changes across modules
 * 
 * This hook allows modules to listen to wallet and network changes and respond immediately.
 * It's used to ensure that when one module changes the wallet or network, all other modules
 * are notified and can update their UI immediately.
 * 
 * Feature: multi-chain-wallet-system
 * Property 9: Cross-Module Session Consistency
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 6.5
 */

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface WalletChangeEvent {
  address: string;
  timestamp: string;
}

export interface NetworkChangeEvent {
  chainNamespace: string;
  previousNetwork: string;
  timestamp: string;
}

/**
 * Hook to listen to wallet changes across modules
 * 
 * @param onWalletChange - Callback when wallet changes
 * @param onNetworkChange - Callback when network changes
 * 
 * @example
 * ```typescript
 * useWalletChangeListener(
 *   (event) => console.log('Wallet changed:', event.address),
 *   (event) => console.log('Network changed:', event.chainNamespace)
 * );
 * ```
 */
export function useWalletChangeListener(
  onWalletChange?: (event: WalletChangeEvent) => void,
  onNetworkChange?: (event: NetworkChangeEvent) => void
): void {
  const queryClient = useQueryClient();

  // Handle wallet change events
  const handleWalletChange = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<WalletChangeEvent>;
    
    // Trigger callback if provided
    if (onWalletChange) {
      onWalletChange(customEvent.detail);
    }

    // Invalidate all queries that depend on wallet
    // This ensures all modules refetch data with the new wallet
    queryClient.invalidateQueries({ queryKey: ['hunter-feed'] });
    queryClient.invalidateQueries({ queryKey: ['eligibility'] });
    queryClient.invalidateQueries({ queryKey: ['saved-opportunities'] });
    queryClient.invalidateQueries({ queryKey: ['guardian-scan'] });
    queryClient.invalidateQueries({ queryKey: ['harvest-opportunities'] });
    queryClient.invalidateQueries({ queryKey: ['portfolio-balances'] });
  }, [onWalletChange, queryClient]);

  // Handle network change events
  const handleNetworkChange = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<NetworkChangeEvent>;
    
    // Trigger callback if provided
    if (onNetworkChange) {
      onNetworkChange(customEvent.detail);
    }

    // Invalidate all queries that depend on network
    // This ensures all modules refetch data with the new network
    queryClient.invalidateQueries({ queryKey: ['hunter-feed'] });
    queryClient.invalidateQueries({ queryKey: ['portfolio-balances'] });
    queryClient.invalidateQueries({ queryKey: ['guardian-scores'] });
    queryClient.invalidateQueries({ queryKey: ['harvest-opportunities'] });
  }, [onNetworkChange, queryClient]);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('walletConnected', handleWalletChange);
    window.addEventListener('networkSwitched', handleNetworkChange);

    return () => {
      window.removeEventListener('walletConnected', handleWalletChange);
      window.removeEventListener('networkSwitched', handleNetworkChange);
    };
  }, [handleWalletChange, handleNetworkChange]);
}
