/**
 * WagmiAccountSync - Syncs wagmi account changes with WalletContext
 * 
 * This component listens to wagmi's useAccount hook and emits custom events
 * that WalletContext can listen to for multi-wallet support.
 */

import { useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';

export function WagmiAccountSync() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  useEffect(() => {
    if (isConnected && address) {
      // Emit custom event that WalletContext listens to
      const event = new CustomEvent('wagmiAccountChanged', {
        detail: { address, chainId, isConnected }
      });
      window.dispatchEvent(event);
      
      console.log('Wagmi account changed:', { address, chainId });
    }
  }, [address, chainId, isConnected]);

  // This component doesn't render anything
  return null;
}
