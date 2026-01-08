/**
 * useWalletNetworkAvailability Hook
 * 
 * Detects if the active wallet is available on the currently selected network.
 * Returns information about missing wallet-network combinations.
 * 
 * Validates: Requirements 6.2, 6.3, 15.7
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 6
 * @see .kiro/specs/multi-chain-wallet-system/design.md - HARD LOCK 5
 */

import { useMemo } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { getSupportedNetworks, SUPPORTED_NETWORKS } from '@/lib/networks/config';

export interface WalletNetworkAvailability {
  isAvailable: boolean;
  activeWallet: string | null;
  activeNetwork: string;
  networkName: string;
  isMissing: boolean;
}

/**
 * Check if the active wallet is available on the active network.
 * 
 * Returns:
 * - isAvailable: true if wallet is registered on the network
 * - isMissing: true if wallet exists but not on this network
 * - networkName: human-readable network name
 */
export function useWalletNetworkAvailability(): WalletNetworkAvailability {
  const { connectedWallets, activeWallet, activeNetwork } = useWallet();

  return useMemo(() => {
    // If no active wallet, it's not available
    if (!activeWallet) {
      const networkConfig = SUPPORTED_NETWORKS[activeNetwork];
      return {
        isAvailable: false,
        activeWallet: null,
        activeNetwork,
        networkName: networkConfig?.name || activeNetwork,
        isMissing: false,
      };
    }

    // Find the active wallet
    const wallet = connectedWallets.find(
      (w) => w.address.toLowerCase() === activeWallet.toLowerCase()
    );

    // If wallet not found in connected wallets, it's not available
    if (!wallet) {
      const networkConfig = SUPPORTED_NETWORKS[activeNetwork];
      return {
        isAvailable: false,
        activeWallet,
        activeNetwork,
        networkName: networkConfig?.name || activeNetwork,
        isMissing: false,
      };
    }

    // Check if wallet is available on the active network
    const isAvailable = wallet.supportedNetworks.includes(activeNetwork);
    const networkConfig = SUPPORTED_NETWORKS[activeNetwork];

    return {
      isAvailable,
      activeWallet,
      activeNetwork,
      networkName: networkConfig?.name || activeNetwork,
      isMissing: !isAvailable && wallet.supportedNetworks.length > 0,
    };
  }, [connectedWallets, activeWallet, activeNetwork]);
}

export default useWalletNetworkAvailability;
