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
import { useAuth } from '@/contexts/AuthContext';
import { 
  legacyChainToCAIP2, 
  caip2ToLegacyChain,
  getSupportedNetworks
} from '@/lib/networks/config';

// ============================================================================
// Types
// ============================================================================

export interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  usdValue?: number;
}

export interface ConnectedWallet {
  address: string;           // Ethereum address
  label?: string;            // User-defined label (from user_preferences.wallet_labels)
  ens?: string;              // ENS name if available
  lens?: string;             // Lens Protocol handle if available
  unstoppable?: string;      // Unstoppable Domains name if available
  resolvedName?: ResolvedName; // Full resolved name data
  chain: string;             // Primary chain (ethereum, polygon, arbitrum, etc.) - LEGACY
  chainNamespace: string;    // CAIP-2 format: eip155:1, eip155:137, etc.
  supportedNetworks: string[]; // All networks this wallet supports
  balancesByNetwork: Record<string, TokenBalance[]>; // Balances per network
  guardianScoresByNetwork: Record<string, number>;   // Guardian scores per network
  balance?: string;          // Optional balance display (LEGACY - use balancesByNetwork)
  lastUsed?: Date;           // Last time this wallet was active
}

export interface WalletContextValue {
  connectedWallets: ConnectedWallet[];
  activeWallet: string | null;
  activeNetwork: string;     // Current CAIP-2 network (e.g., eip155:1)
  setActiveWallet: (address: string) => void;
  setActiveNetwork: (chainNamespace: string) => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: (address: string) => Promise<void>;
  getSupportedNetworks: (address: string) => string[];
  getWalletByNetwork: (address: string, network: string) => ConnectedWallet | null;
  isLoading: boolean;
  isSwitching: boolean;      // Indicates wallet switch in progress
  isNetworkSwitching: boolean; // Indicates network switch in progress
  isAuthenticated: boolean;  // Whether user is authenticated
  hydrateFromServer: () => Promise<void>; // Hydrate wallets from server
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
  const [activeNetwork, setActiveNetworkState] = useState<string>('eip155:1'); // Default to Ethereum
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, startTransition] = useTransition();
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  const [hydratedForUserId, setHydratedForUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { labels: walletLabels, getLabel } = useWalletLabels();
  const { session, isAuthenticated, loading: authLoading } = useAuth();

  // ============================================================================
  // Load from localStorage on mount
  // ============================================================================

  useEffect(() => {
    try {
      const savedWallet = localStorage.getItem('activeWallet');
      const savedNetwork = localStorage.getItem('activeNetwork');
      const savedWallets = localStorage.getItem('connectedWallets');
      
      // Restore active network
      if (savedNetwork && getSupportedNetworks().includes(savedNetwork)) {
        setActiveNetworkState(savedNetwork);
      }
      
      if (savedWallets) {
        const wallets: ConnectedWallet[] = JSON.parse(savedWallets);
        
        // Convert lastUsed strings back to Date objects and migrate legacy data
        const walletsWithDates = wallets.map(w => {
          // Migrate legacy chain to chainNamespace if needed
          const chainNamespace = w.chainNamespace || legacyChainToCAIP2(w.chain);
          
          return {
            ...w,
            chainNamespace,
            supportedNetworks: w.supportedNetworks || [chainNamespace], // Default to current network
            balancesByNetwork: w.balancesByNetwork || {},
            guardianScoresByNetwork: w.guardianScoresByNetwork || {},
            lastUsed: w.lastUsed ? new Date(w.lastUsed) : undefined,
          };
        });
        
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
      localStorage.removeItem('activeNetwork');
      localStorage.removeItem('connectedWallets');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // Hydrate from server when auth session changes
  // ============================================================================

  const hydrateFromServer = useCallback(async () => {
    if (!isAuthenticated || !session?.user?.id) {
      // Clear wallet state if not authenticated
      setConnectedWallets([]);
      setActiveWalletState(null);
      setHydratedForUserId(null);
      return;
    }

    // Skip if already hydrated for this user
    if (hydratedForUserId === session.user.id) {
      return;
    }

    setIsLoading(true);
    try {
      // Call API to get wallet list
      // For now, this is a placeholder - in production, call GET /functions/v1/wallets-list
      const response = await fetch('/api/wallets/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired, clear state
          setConnectedWallets([]);
          setActiveWalletState(null);
          setHydratedForUserId(null);
          return;
        }
        // API endpoint doesn't exist yet - this is expected during development
        console.debug('Wallet list API not available yet, using empty wallet list');
        setConnectedWallets([]);
        setHydratedForUserId(session.user.id);
        return;
      }

      const data = await response.json();
      const wallets = data.wallets || [];

      // Transform server data to ConnectedWallet format
      const transformedWallets: ConnectedWallet[] = wallets.map((w: any) => {
        // Validate chain_namespace format
        const chainNamespace = w.chain_namespace || 'eip155:1';
        
        // Ensure it's a valid CAIP-2 format
        if (!chainNamespace.match(/^eip155:\d+$/)) {
          console.warn(`Invalid chain namespace: ${chainNamespace}, using default eip155:1`);
          return {
            address: w.address,
            chainNamespace: 'eip155:1',
            chain: 'ethereum',
            supportedNetworks: ['eip155:1'],
            balancesByNetwork: w.balance_cache || {},
            guardianScoresByNetwork: w.guardian_scores || {},
            label: w.label,
            lastUsed: w.created_at ? new Date(w.created_at) : undefined,
          };
        }
        
        return {
          address: w.address,
          chainNamespace: chainNamespace,
          chain: caip2ToLegacyChain(chainNamespace),
          supportedNetworks: [chainNamespace],
          balancesByNetwork: w.balance_cache || {},
          guardianScoresByNetwork: w.guardian_scores || {},
          label: w.label,
          lastUsed: w.created_at ? new Date(w.created_at) : undefined,
        };
      });

      setConnectedWallets(transformedWallets);
      setHydratedForUserId(session.user.id);

      // Restore active wallet from localStorage if valid, otherwise use primary or first
      const savedWallet = localStorage.getItem('activeWallet');
      if (savedWallet && transformedWallets.some(w => w.address === savedWallet)) {
        setActiveWalletState(savedWallet);
      } else {
        // Find primary wallet or use first
        const primaryWallet = wallets.find((w: any) => w.is_primary);
        if (primaryWallet) {
          setActiveWalletState(primaryWallet.address);
        } else if (transformedWallets.length > 0) {
          setActiveWalletState(transformedWallets[0].address);
        }
      }
    } catch (error) {
      console.error('Failed to hydrate wallets from server:', error);
      // Fall back to localStorage data - don't block app loading
      setHydratedForUserId(session.user.id);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, session, hydratedForUserId]);

  // Trigger hydration when auth session changes
  useEffect(() => {
    if (!authLoading) {
      hydrateFromServer();
    }
  }, [isAuthenticated, session?.user?.id, authLoading, hydrateFromServer]);

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
      
      if (activeNetwork) {
        localStorage.setItem('activeNetwork', activeNetwork);
      }
      
      if (connectedWallets.length > 0) {
        localStorage.setItem('connectedWallets', JSON.stringify(connectedWallets));
      } else {
        localStorage.removeItem('connectedWallets');
      }
    } catch (error) {
      console.error('Failed to save wallet state to localStorage:', error);
    }
  }, [activeWallet, activeNetwork, connectedWallets]);

  // ============================================================================
  // Set Active Network
  // ============================================================================

  const setActiveNetwork = useCallback((chainNamespace: string) => {
    // Validate network is supported
    const allSupportedNetworks = getSupportedNetworks();
    if (!allSupportedNetworks.includes(chainNamespace)) {
      console.error(`Network ${chainNamespace} not supported`);
      return;
    }

    // Track network switch start time for performance monitoring
    const switchStartTime = performance.now();
    const previousNetwork = activeNetwork;

    setIsNetworkSwitching(true);

    // Use React 18 useTransition for smooth re-render during network switch
    startTransition(() => {
      setActiveNetworkState(chainNamespace);
      
      // Emit custom event for inter-module reactivity
      const event = new CustomEvent('networkSwitched', {
        detail: { 
          chainNamespace, 
          previousNetwork,
          timestamp: new Date().toISOString() 
        }
      });
      window.dispatchEvent(event);
      
      // Invalidate queries that depend on network
      queryClient.invalidateQueries({ queryKey: ['hunter-feed'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-balances'] });
      queryClient.invalidateQueries({ queryKey: ['guardian-scores'] });

      // Track network switch analytics
      const switchDurationMs = Math.round(performance.now() - switchStartTime);
      
      import('@/lib/analytics/tracker').then((module) => {
        // Check if trackNetworkSwitched exists, otherwise skip
        if ('trackNetworkSwitched' in module) {
          const trackFn = (module as { trackNetworkSwitched?: (params: {
            fromNetwork: string;
            toNetwork: string;
            switchDurationMs: number;
            activeWallet: string | null;
          }) => Promise<void> }).trackNetworkSwitched;
          
          if (trackFn) {
            trackFn({
              fromNetwork: previousNetwork,
              toNetwork: chainNamespace,
              switchDurationMs,
              activeWallet,
            }).catch((err: Error) => {
              console.debug('Failed to track network switch:', err);
            });
          }
        }
      }).catch((err: Error) => {
        console.debug('Failed to load analytics tracker:', err);
      });

      // Reset network switching state after a short delay
      setTimeout(() => {
        setIsNetworkSwitching(false);
      }, 500);
    });
  }, [activeNetwork, activeWallet, queryClient, startTransition]);

  // ============================================================================
  // Multi-Chain Helper Methods
  // ============================================================================

  const getWalletSupportedNetworks = useCallback((address: string) => {
    const wallet = connectedWallets.find(w => w.address.toLowerCase() === address.toLowerCase());
    return wallet?.supportedNetworks || ['eip155:1']; // Default to Ethereum
  }, [connectedWallets]);

  const getWalletByNetwork = useCallback((address: string, network: string) => {
    const wallet = connectedWallets.find(w => 
      w.address.toLowerCase() === address.toLowerCase() &&
      w.supportedNetworks.includes(network)
    );
    
    if (!wallet) return null;
    
    // Return wallet with network-specific data
    return {
      ...wallet,
      chainNamespace: network,
      chain: caip2ToLegacyChain(network),
      balance: wallet.balancesByNetwork[network]?.[0]?.balance,
    };
  }, [connectedWallets]);

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

    // Track wallet switch start time for duration metric
    const switchStartTime = performance.now();
    const previousWallet = activeWallet;

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

      // Track wallet switch analytics (after state updates)
      const switchDurationMs = Math.round(performance.now() - switchStartTime);
      
      // Import dynamically to avoid circular dependencies
      import('@/lib/analytics/tracker').then(({ trackWalletSwitched }) => {
        trackWalletSwitched({
          fromWalletAddress: previousWallet || undefined,
          toWalletAddress: address,
          walletCount: connectedWallets.length,
          switchDurationMs,
        }).catch((err: Error) => {
          console.debug('Failed to track wallet switch:', err);
        });
      }).catch((err: Error) => {
        console.debug('Failed to load analytics tracker:', err);
      });
    });
  }, [connectedWallets, activeWallet, queryClient, startTransition]);

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
      }) as string[];
      
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
      const chainId = await window.ethereum.request({ method: 'eth_chainId' }) as string;
      const chainName = getChainName(chainId);
      const chainNamespace = legacyChainToCAIP2(chainName);

      // Create new wallet entry with label from user preferences
      const newWallet: ConnectedWallet = {
        address,
        chain: chainName,
        chainNamespace,
        supportedNetworks: [chainNamespace],
        balancesByNetwork: {},
        guardianScoresByNetwork: {},
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

      // Track wallet connection analytics
      const isFirstWallet = connectedWallets.length === 0;
      const newWalletCount = connectedWallets.length + 1;
      
      import('@/lib/analytics/tracker').then((module) => {
        if ('trackWalletConnected' in module) {
          const trackFn = (module as { trackWalletConnected?: (params: {
            walletAddress: string;
            walletCount: number;
            isFirstWallet: boolean;
            chain: string;
          }) => Promise<void> }).trackWalletConnected;
          
          if (trackFn) {
            trackFn({
              walletAddress: address,
              walletCount: newWalletCount,
              isFirstWallet,
              chain: chainName,
            }).catch((err: Error) => {
              console.debug('Failed to track wallet connection:', err);
            });
          }
        }
      }).catch((err: Error) => {
        console.debug('Failed to load analytics tracker:', err);
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
    // Only update if labels actually changed to prevent infinite loops
    setConnectedWallets(prev => {
      const updated = prev.map(w => ({
        ...w,
        label: getLabel(w.address),
      }));
      
      // Check if any labels actually changed
      const hasChanges = updated.some((w, i) => w.label !== prev[i].label);
      
      return hasChanges ? updated : prev;
    });
  }, [walletLabels]); // Only depend on walletLabels, not getLabel

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
      const hadActiveWallet = activeWallet === address;
      const remainingCount = connectedWallets.filter(w => w.address !== address).length;
      
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

      // Track wallet disconnection analytics
      import('@/lib/analytics/tracker').then((module) => {
        if ('trackWalletDisconnected' in module) {
          const trackFn = (module as { trackWalletDisconnected?: (params: {
            walletAddress: string;
            walletCount: number;
            hadActiveWallet: boolean;
          }) => Promise<void> }).trackWalletDisconnected;
          
          if (trackFn) {
            trackFn({
              walletAddress: address,
              walletCount: remainingCount,
              hadActiveWallet,
            }).catch((err: Error) => {
              console.debug('Failed to track wallet disconnection:', err);
            });
          }
        }
      }).catch((err: Error) => {
        console.debug('Failed to load analytics tracker:', err);
      });
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
    activeNetwork,
    setActiveWallet,
    setActiveNetwork,
    connectWallet,
    disconnectWallet,
    getSupportedNetworks: getWalletSupportedNetworks,
    getWalletByNetwork,
    isLoading,
    isSwitching,
    isNetworkSwitching,
    isAuthenticated,
    hydrateFromServer,
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
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
