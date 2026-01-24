import { useState, useCallback, useEffect } from 'react';
import { useUserAddresses } from './useUserAddresses';
import { WalletScope } from '@/types/portfolio';

interface WalletSwitchingState {
  activeWallet: string | null;
  previousWallet: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useWalletSwitching() {
  const { addresses } = useUserAddresses();
  const [state, setState] = useState<WalletSwitchingState>({
    activeWallet: null,
    previousWallet: null,
    isLoading: false,
    error: null
  });

  // Initialize with first wallet if available
  useEffect(() => {
    if (addresses.length > 0 && !state.activeWallet) {
      setState(prev => ({
        ...prev,
        activeWallet: addresses[0].id
      }));
    }
  }, [addresses, state.activeWallet]);

  const switchWallet = useCallback(async (walletId: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      previousWallet: prev.activeWallet
    }));

    try {
      // Validate wallet exists
      const wallet = addresses.find(addr => addr.id === walletId);
      if (!wallet) {
        throw new Error(`Wallet with id ${walletId} not found`);
      }

      // Simulate async wallet switching (e.g., clearing caches, updating context)
      await new Promise(resolve => setTimeout(resolve, 100));

      setState(prev => ({
        ...prev,
        activeWallet: walletId,
        isLoading: false
      }));

      // Clear any cached data that might leak between wallets
      // This is critical for data isolation (Property S3)
      if (typeof window !== 'undefined') {
        // Clear any wallet-specific cache keys
        const cacheKeys = Object.keys(localStorage).filter(key => 
          key.includes('portfolio-') || key.includes('wallet-')
        );
        cacheKeys.forEach(key => {
          if (key.includes(state.activeWallet || '')) {
            localStorage.removeItem(key);
          }
        });
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to switch wallet'
      }));
    }
  }, [addresses, state.activeWallet]);

  const validateWalletScope = useCallback((scope: WalletScope): boolean => {
    if (scope.mode === 'all_wallets') {
      return true; // All wallets mode is always valid
    }

    if (scope.mode === 'active_wallet') {
      // Validate that the address exists in user's addresses
      return addresses.some(addr => 
        addr.address.toLowerCase() === scope.address.toLowerCase()
      );
    }

    return false;
  }, [addresses]);

  const getCurrentWalletScope = useCallback((): WalletScope => {
    if (!state.activeWallet) {
      return { mode: 'all_wallets' };
    }

    const wallet = addresses.find(addr => addr.id === state.activeWallet);
    if (!wallet) {
      return { mode: 'all_wallets' };
    }

    return {
      mode: 'active_wallet',
      address: wallet.address as `0x${string}`
    };
  }, [state.activeWallet, addresses]);

  const clearWalletData = useCallback(() => {
    // Clear all wallet-specific data to prevent leakage
    setState({
      activeWallet: null,
      previousWallet: null,
      isLoading: false,
      error: null
    });

    if (typeof window !== 'undefined') {
      // Clear all wallet-related cache
      const cacheKeys = Object.keys(localStorage).filter(key => 
        key.includes('portfolio-') || key.includes('wallet-')
      );
      cacheKeys.forEach(key => localStorage.removeItem(key));
    }
  }, []);

  return {
    activeWallet: state.activeWallet,
    previousWallet: state.previousWallet,
    isLoading: state.isLoading,
    error: state.error,
    switchWallet,
    validateWalletScope,
    getCurrentWalletScope,
    clearWalletData,
    availableWallets: addresses
  };
}