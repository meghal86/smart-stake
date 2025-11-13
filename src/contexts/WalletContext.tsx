/**
 * WalletContext - Multi-Wallet Management
 * 
 * Provides context for managing multiple connected wallets and switching between them.
 * Persists wallet selection to localStorage and emits events for inter-module reactivity.
 * 
 * @see .kiro/specs/hunter-screen-feed/requirements.md - Requirement 18
 * @see .kiro/specs/hunter-screen-feed/design.md - Section 18
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useTransition, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { resolveName, type ResolvedName } from '@/lib/name-resolution';
import { useWalletLabels } from '@/hooks/useWalletLabels';

// ============================================================================
// Types
// ============================================================================

export interface ConnectedWallet {
  address: string;           // Ethereum address
  label?: string;            // User-defined label (from user_preferences.wallet_labels)
  ens?: string;              // ENS name if available
  lens?: string;             // Lens Protocol handle if available
  unstoppable?: string;      // Unstoppable Domains name if available
  resolvedName?: ResolvedName; // Full resolved name data
  chain: string;             // Primary chain (ethereum, polygon, arbitrum, etc.)
  balance?: string;          // Optional balance display
  lastUsed?: Date;           // Last time this wallet was active
}

export interface WalletContextValue {
  connectedWallets: ConnectedWallet[];
  activeWallet: string | null;
  setActiveWallet: (address: string) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: (address: string) => Promise<void>;
  isLoading: boolean;
  isSwitching: boolean;      // Indicates wallet switch in progress
}

// ============================================================================
// Context
// ============================================================================

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [connectedWallets, setConnectedWallets] = useState<ConnectedWallet[]>([]);
  const [activeWallet, setActiveWalletState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { labels: walletLabels, getLabel } = useWalletLabels();

  // ============================================================================
  // Load from localStorage on mount
  // ============================================================================

  useEffect(() => {
    try {
      const savedWallet = localStorage.getItem('activeWallet');
      const savedWallets = localStorage.getItem('connectedWallets');
      
      if (savedWallets) {
        const wallets: ConnectedWallet[] = JSON.parse(savedWallets);
        
        // Convert lastUsed strings back to Date objects
        const walletsWithDates = wallets.map(w => ({
          ...w,
          lastUsed: w.lastUsed ? new Date(w.lastUsed) : undefined,
        }));
        
        setConnectedWallets(walletsWithDates);
        
        // Restore active wallet if it's still in the list
        if (savedWallet && walletsWithDates.some(w => w.address === savedWallet)) {
          setActiveWalletState(savedWallet);
        } else if (walletsWithDates.length > 0) {
          // Default to first wallet if saved wallet is not found
          setActiveWalletState(walletsWithDates[0].address);
        }

        // Resolve names for all wallets in background
        walletsWithDates.forEach(wallet => {
          // Only resolve if we don't have a cached name
          if (!wallet.ens && !wallet.lens && !wallet.unstoppable) {
            resolveWalletName(wallet.address).catch(err => {
              console.debug('Failed to resolve wallet name:', err);
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to load wallet state from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('activeWallet');
      localStorage.removeItem('connectedWallets');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // Save to localStorage on change
  // ============================================================================

  useEffect(() => {
    try {
      if (activeWallet) {
        localStorage.setItem('activeWallet', activeWallet);
      } else {
        localStorage.removeItem('activeWallet');
      }
      
      if (connectedWallets.length > 0) {
        localStorage.setItem('connectedWallets', JSON.stringify(connectedWallets));
      } else {
        localStorage.removeItem('connectedWallets');
      }
    } catch (error) {
      console.error('Failed to save wallet state to localStorage:', error);
    }
  }, [activeWallet, connectedWallets]);

  // ============================================================================
  // Set Active Wallet
  // ============================================================================

  const setActiveWallet = useCallback((address: string) => {
    // Validate wallet exists
    const walletExists = connectedWallets.some(w => w.address === address);
    if (!walletExists) {
      console.error(`Wallet ${address} not found in connected wallets`);
      return;
    }

    // Use React 18 useTransition for smooth re-render during feed refresh
    // This prevents UI from blocking during the wallet switch
    startTransition(() => {
      // Update active wallet state
      setActiveWalletState(address);
      
      // Update lastUsed timestamp
      setConnectedWallets(prev => 
        prev.map(w => 
          w.address === address 
            ? { ...w, lastUsed: new Date() }
            : w
        )
      );
      
      // Emit custom event for inter-module reactivity (Guardian, Action Engine, etc.)
      const event = new CustomEvent('walletConnected', {
        detail: { address, timestamp: new Date().toISOString() }
      });
      window.dispatchEvent(event);
      
      // Invalidate feed queries to trigger refresh with new wallet
      // This will cause useHunterFeed to refetch with the new wallet context
      queryClient.invalidateQueries({ queryKey: ['hunter-feed'] });
      queryClient.invalidateQueries({ queryKey: ['eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['saved-opportunities'] });
    });
  }, [connectedWallets, queryClient, startTransition]);

  // ============================================================================
  // Connect Wallet
  // ============================================================================

  const connectWallet = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Check if window.ethereum is available
      if (typeof window.ethereum === 'undefined') {
        throw new Error('No Ethereum wallet detected. Please install MetaMask or another Web3 wallet.');
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      
      // Check if wallet is already connected
      if (connectedWallets.some(w => w.address.toLowerCase() === address.toLowerCase())) {
        // Just set it as active
        setActiveWallet(address);
        return;
      }

      // Get chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainName = getChainName(chainId);

      // Create new wallet entry with label from user preferences
      const newWallet: ConnectedWallet = {
        address,
        chain: chainName,
        lastUsed: new Date(),
        label: getLabel(address), // Get label from user preferences
      };

      // Add to connected wallets
      setConnectedWallets(prev => [...prev, newWallet]);
      
      // Set as active wallet directly (bypass validation since we just added it)
      setActiveWalletState(address);

      // Emit connection event
      const event = new CustomEvent('walletConnected', {
        detail: { address, timestamp: new Date().toISOString() }
      });
      window.dispatchEvent(event);

      // Resolve ENS/Lens/UD name in background (non-blocking)
      resolveWalletName(address).catch(err => {
        console.debug('Failed to resolve wallet name:', err);
      });

    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [connectedWallets, setActiveWallet]);

  // ============================================================================
  // Sync wallet labels from user preferences
  // ============================================================================

  useEffect(() => {
    // Update wallet labels when they change in user preferences
    setConnectedWallets(prev => 
      prev.map(w => ({
        ...w,
        label: getLabel(w.address),
      }))
    );
  }, [walletLabels, getLabel]);

  // ============================================================================
  // Resolve Wallet Name
  // ============================================================================

  const resolveWalletName = useCallback(async (address: string) => {
    try {
      const resolved = await resolveName(address);
      
      if (resolved && resolved.name) {
        // Update wallet with resolved name
        setConnectedWallets(prev => 
          prev.map(w => 
            w.address.toLowerCase() === address.toLowerCase()
              ? {
                  ...w,
                  resolvedName: resolved,
                  // Set specific fields based on provider
                  ens: resolved.provider === 'ens' ? resolved.name : w.ens,
                  lens: resolved.provider === 'lens' ? resolved.name : w.lens,
                  unstoppable: resolved.provider === 'unstoppable' ? resolved.name : w.unstoppable,
                }
              : w
          )
        );
      }
    } catch (error) {
      console.debug('Failed to resolve wallet name:', error);
    }
  }, []);

  // ============================================================================
  // Disconnect Wallet
  // ============================================================================

  const disconnectWallet = useCallback(async (address: string) => {
    setIsLoading(true);
    
    try {
      // Remove wallet from connected wallets
      setConnectedWallets(prev => prev.filter(w => w.address !== address));
      
      // If disconnecting active wallet, switch to another or null
      if (activeWallet === address) {
        const remaining = connectedWallets.filter(w => w.address !== address);
        if (remaining.length > 0) {
          setActiveWallet(remaining[0].address);
        } else {
          setActiveWalletState(null);
          localStorage.removeItem('activeWallet');
        }
      }
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [activeWallet, connectedWallets, setActiveWallet]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: WalletContextValue = {
    connectedWallets,
    activeWallet,
    setActiveWallet,
    connectWallet,
    disconnectWallet,
    isLoading,
    isSwitching,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

export const useWallet = (): WalletContextValue => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get human-readable chain name from chain ID
 */
function getChainName(chainId: string): string {
  const chainMap: Record<string, string> = {
    '0x1': 'ethereum',
    '0x89': 'polygon',
    '0xa4b1': 'arbitrum',
    '0xa': 'optimism',
    '0x38': 'bsc',
    '0xa86a': 'avalanche',
    '0xfa': 'fantom',
    '0x2105': 'base',
  };
  
  return chainMap[chainId] || 'ethereum';
}

/**
 * Truncate Ethereum address for display
 * @example truncateAddress('0x1234567890abcdef') => '0x1234...cdef'
 */
export function truncateAddress(address: string | undefined, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

// ============================================================================
// Type Augmentation for window.ethereum
// ============================================================================

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}
