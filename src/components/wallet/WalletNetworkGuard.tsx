/**
 * WalletNetworkGuard Component
 * 
 * Displays "Not added on this network" UI when the active wallet is not registered
 * on the currently selected network. Provides an action to add the wallet to the network.
 * 
 * Validates: Requirements 6.2, 6.3, 15.7
 * 
 * @see .kiro/specs/multi-chain-wallet-system/requirements.md - Requirement 6
 * @see .kiro/specs/multi-chain-wallet-system/design.md - HARD LOCK 5
 */

'use client';

import React, { useCallback } from 'react';
import { useWalletNetworkAvailability } from '@/hooks/useWalletNetworkAvailability';
import { NotAddedOnNetwork } from './NotAddedOnNetwork';

interface WalletNetworkGuardProps {
  /**
   * Callback when user clicks "Add to [Network]" button.
   * Typically navigates to wallet settings or triggers add wallet flow.
   */
  onAddNetwork?: () => void;
  
  /**
   * Optional CSS class name
   */
  className?: string;
  
  /**
   * If true, only show the guard when wallet is missing (not when no wallet selected).
   * Default: false (show for both cases)
   */
  onlyShowWhenMissing?: boolean;
}

/**
 * Displays "Not added on this network" UI when appropriate.
 * 
 * Shows when:
 * - Active wallet is not registered on the active network
 * - User has at least one wallet connected
 * 
 * Does NOT show when:
 * - No wallet is selected
 * - Wallet is available on the current network
 */
export function WalletNetworkGuard({
  onAddNetwork,
  className,
  onlyShowWhenMissing = false,
}: WalletNetworkGuardProps) {
  const { isAvailable, activeWallet, activeNetwork, networkName, isMissing } =
    useWalletNetworkAvailability();

  // Handle add network action (must be before any returns)
  const handleAddNetwork = useCallback(() => {
    if (onAddNetwork) {
      onAddNetwork();
    } else {
      // Default behavior: navigate to wallet settings
      // This can be overridden by passing onAddNetwork prop
      window.location.href = '/settings?tab=wallets&action=add';
    }
  }, [onAddNetwork]);

  // Determine if we should show the guard
  const shouldShow = isMissing && activeWallet;
  
  // If onlyShowWhenMissing is true, only show when wallet is actually missing
  if (onlyShowWhenMissing && !shouldShow) {
    return null;
  }

  // Don't show if wallet is available on this network
  if (isAvailable) {
    return null;
  }

  // Don't show if no active wallet
  if (!activeWallet) {
    return null;
  }

  return (
    <NotAddedOnNetwork
      walletAddress={activeWallet}
      networkName={networkName}
      chainNamespace={activeNetwork}
      onAddNetwork={handleAddNetwork}
      className={className}
    />
  );
}

export default WalletNetworkGuard;
