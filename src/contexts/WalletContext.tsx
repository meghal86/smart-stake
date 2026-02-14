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
import { useWalletRegistry } from '@/hooks/useWalletRegistry';
import { 
  legacyChainToCAIP2, 
  caip2ToLegacyChain,
  getSupportedNetworks
} from '@/lib/networks/config';
import { getNetworkDependentQueryKeys } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';

// Chain ID to name mapping
const chainIdToName: Record<number, string> = {
  1: 'ethereum',
  137: 'polygon',
  42161: 'arbitrum',
  8453: 'base',
  10: 'optimism',
};
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

interface ServerWallet {
  address: string;
  chain_namespace?: string;
  balance_cache?: Record<string, TokenBalance[]>;
  guardian_scores?: Record<string, number>;
  label?: string;
  created_at?: string;
  is_primary?: boolean;
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
  // Use the persistent wallet registry instead of local state
  const {
    wallets: registryWallets,
    isLoading: registryLoading,
    addWallet: addToRegistry,
    removeWallet: removeFromRegistry,
    updateWallet: updateInRegistry,
    userId,
    connectedAddress,
    isConnected,
  } = useWalletRegistry();

  const [activeWallet, setActiveWalletState] = useState<string | null>(null);
  const [activeNetwork, setActiveNetworkState] = useState<string>('eip155:1'); // Default to Ethereum
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, startTransition] = useTransition();
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  const [hydratedForUserId, setHydratedForUserId] = useState<string | null>(null);
  const [addingWallets, setAddingWallets] = useState<Set<string>>(new Set()); // Track wallets being added
  const [failedWallets, setFailedWallets] = useState<Set<string>>(new Set()); // Track wallets that failed to add
  const queryClient = useQueryClient();
  const { labels: walletLabels, getLabel } = useWalletLabels();
  const { session, isAuthenticated, loading: authLoading } = useAuth();

  // Convert registry wallets to ConnectedWallet format
  const connectedWallets: ConnectedWallet[] = registryWallets.map(wallet => ({
    address: wallet.address,
    label: wallet.label,
    chain: caip2ToLegacyChain(wallet.chain_namespace),
    chainNamespace: wallet.chain_namespace,
    supportedNetworks: [wallet.chain_namespace],
    balancesByNetwork: wallet.balance_cache as Record<string, TokenBalance[]> || {},
    guardianScoresByNetwork: wallet.guardian_scores as Record<string, number> || {},
    lastUsed: new Date(wallet.updated_at),
  }));

  // ============================================================================
  // Sync with wagmi's active wallet
  // ============================================================================
  
  // Import wagmi hooks dynamically to avoid circular dependencies
  const [wagmiAddress, setWagmiAddress] = useState<string | null>(null);
  const [wagmiChainId, setWagmiChainId] = useState<number | null>(null);
  
  useEffect(() => {
    // Listen to wagmi account changes
    const handleAccountChange = (event: CustomEvent) => {
      const { address, chainId } = event.detail;
      setWagmiAddress(address);
      setWagmiChainId(chainId);
    };
    
    window.addEventListener('wagmiAccountChanged' as any, handleAccountChange);
    
    return () => {
      window.removeEventListener('wagmiAccountChanged' as any, handleAccountChange);
    };
  }, []);
  
  // When wagmi connects a new wallet, add it to our registry
  useEffect(() => {
    if (wagmiAddress && wagmiChainId && userId) {
      const address = wagmiAddress.toLowerCase();
      
      // Check if wallet is already in our registry, currently being added, or previously failed
      const existingWallet = connectedWallets.find(
        w => w.address.toLowerCase() === address
      );
      
      if (!existingWallet && !addingWallets.has(address) && !failedWallets.has(address)) {
        // New wallet - add it to the registry (only once)
        const chainName = chainIdToName[wagmiChainId] || 'ethereum';
        const chainNamespace = legacyChainToCAIP2(chainName);
        
        console.log('Adding new wagmi wallet to registry:', address);
        
        // Mark as being added to prevent duplicates
        setAddingWallets(prev => new Set(prev).add(address));
        
        addToRegistry({
          address,
          label: `Connected Wallet`,
          chain_namespace: chainNamespace,
        }).then(() => {
          console.log('Successfully added wagmi wallet to registry:', address);
          // Remove from adding set
          setAddingWallets(prev => {
            const newSet = new Set(prev);
            newSet.delete(address);
            return newSet;
          });
        }).catch(err => {
          console.error('Failed to add wagmi wallet to registry:', err);
          
          // Handle different error types
          const errorCode = err?.code || err?.error?.code;
          const errorMessage = err?.message || err?.error?.message || '';
          
          // If it's a duplicate key error, treat as success
          if (errorCode === '23505' || 
              errorMessage.includes('duplicate key') || 
              errorMessage.includes('uq_user_wallets_user_addr_chain')) {
            console.log('✅ Wallet already exists in database, treating as success');
          } else {
            // Add to failed set to prevent retry loops for other errors
            setFailedWallets(prev => new Set(prev).add(address));
            
            // If it's a permission error, show user-friendly message
            if (errorCode === '42501' || errorMessage.includes('permission denied')) {
              console.error('❌ Database permission error. Please check RLS policies.');
            }
          }
          
          // Remove from adding set
          setAddingWallets(prev => {
            const newSet = new Set(prev);
            newSet.delete(address);
            return newSet;
          });
        });
      }
      
      // Set as active if no active wallet exists
      if (!activeWallet) {
        setActiveWalletState(address);
        console.log('Set wagmi wallet as active:', address);
      }
    }
  }, [wagmiAddress, wagmiChainId, userId, addToRegistry, connectedWallets, activeWallet, addingWallets, failedWallets]);

  // ============================================================================
  // Immediate localStorage Restoration (Fix for active wallet display)
  // ============================================================================
  
  useEffect(() => {
    // Immediately restore from localStorage on mount (before server hydration)
    // This ensures the active wallet shows immediately on page load
    try {
      const savedAddress = localStorage.getItem('aw_active_address');
      const savedNetwork = localStorage.getItem('aw_active_network');
      
      if (savedAddress) {
        console.log('🔄 Immediately restoring active wallet from localStorage:', savedAddress);
        setActiveWalletState(savedAddress);
      }
      
      if (savedNetwork && getSupportedNetworks().includes(savedNetwork)) {
        console.log('🔄 Immediately restoring active network from localStorage:', savedNetwork);
        setActiveNetworkState(savedNetwork);
      }
    } catch (error) {
      console.warn('Failed to restore from localStorage:', error);
    }
  }, []); // Run once on mount

  // ============================================================================
  // Active Selection Restoration (Task 10)
  // ============================================================================

  /**
   * Restore active selection using priority order:
   * 1. localStorage (aw_active_address, aw_active_network) if valid in server data
   * 2. server primary wallet + default network
   * 3. ordered-first wallet (deterministic ordering: is_primary DESC, created_at DESC, id ASC)
   * 
   * CROSS-BROWSER FIX: Enhanced fallback logic for when localStorage is empty (new browser)
   * 
   * Validates: Requirements 15.4, 15.5, 15.6
   */
  const restoreActiveSelection = useCallback((
    wallets: ConnectedWallet[],
    serverWallets: any[]
  ): { address: string | null; network: string } => {
    console.log('🔍 CROSS-BROWSER DEBUG - restoreActiveSelection called:', {
      walletsCount: wallets.length,
      serverWalletsCount: serverWallets.length,
      hasLocalStorage: typeof localStorage !== 'undefined',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });

    if (wallets.length === 0) {
      console.log('❌ No wallets available, returning null selection');
      return { address: null, network: 'eip155:1' };
    }

    // Priority 1: Check localStorage for saved selection
    let savedAddress: string | null = null;
    let savedNetwork: string | null = null;
    
    try {
      savedAddress = localStorage.getItem('aw_active_address');
      savedNetwork = localStorage.getItem('aw_active_network');
      
      console.log('📱 localStorage values:', {
        savedAddress,
        savedNetwork,
        isNewBrowser: !savedAddress && !savedNetwork
      });
    } catch (error) {
      console.warn('⚠️ localStorage access failed (private browsing?):', error);
    }

    // Validate localStorage selection exists in server data
    if (savedAddress && savedNetwork) {
      const isValidInServerData = serverWallets.some(
        (w: any) => 
          w.address.toLowerCase() === savedAddress.toLowerCase() &&
          w.chain_namespace === savedNetwork
      );

      if (isValidInServerData) {
        console.log('✅ localStorage selection is valid, using it:', { savedAddress, savedNetwork });
        return { address: savedAddress, network: savedNetwork };
      } else {
        console.log('🔄 localStorage selection is invalid, clearing and falling back:', {
          savedAddress,
          savedNetwork,
          serverWallets: serverWallets.map(w => ({ address: w.address, chain: w.chain_namespace }))
        });
        
        // localStorage selection is invalid - self-heal by clearing it
        try {
          localStorage.removeItem('aw_active_address');
          localStorage.removeItem('aw_active_network');
        } catch (error) {
          console.warn('Failed to clear invalid localStorage:', error);
        }
      }
    }

    // Priority 2: Use server primary wallet + default network
    const primaryWallet = serverWallets.find((w: any) => w.is_primary);
    if (primaryWallet) {
      console.log('✅ Using server primary wallet:', {
        address: primaryWallet.address,
        network: primaryWallet.chain_namespace
      });
      return { 
        address: primaryWallet.address, 
        network: primaryWallet.chain_namespace || 'eip155:1' 
      };
    }

    // Priority 3: Use ordered-first wallet (deterministic ordering)
    // Server returns wallets sorted by: is_primary DESC, created_at DESC, id ASC
    if (wallets.length > 0) {
      const firstWallet = wallets[0];
      console.log('✅ Using first available wallet (cross-browser fallback):', {
        address: firstWallet.address,
        network: firstWallet.chainNamespace,
        label: firstWallet.label,
        isNewBrowser: !savedAddress && !savedNetwork
      });
      
      // CROSS-BROWSER FIX: Immediately save this selection to localStorage
      // so it persists for future visits in this browser
      try {
        localStorage.setItem('aw_active_address', firstWallet.address);
        localStorage.setItem('aw_active_network', firstWallet.chainNamespace || 'eip155:1');
        console.log('💾 Saved active selection to localStorage for future visits');
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
      
      return { 
        address: firstWallet.address, 
        network: firstWallet.chainNamespace || 'eip155:1' 
      };
    }

    console.log('❌ No valid wallet selection found');
    return { address: null, network: 'eip155:1' };
  }, []);

  // ============================================================================
  // Hydrate from server when auth session changes
  // ============================================================================

  const hydrateFromServer = useCallback(async () => {
    console.log('🔄 CROSS-BROWSER DEBUG - hydrateFromServer called:', {
      isAuthenticated,
      userId: session?.user?.id,
      hydratedForUserId,
      connectedWalletsCount: connectedWallets.length,
      currentActiveWallet: activeWallet
    });

    if (!isAuthenticated || !session?.user?.id) {
      console.log('❌ Not authenticated, clearing wallet state');
      // Clear wallet state if not authenticated
      setActiveWalletState(null);
      setHydratedForUserId(null);
      return;
    }

    // Skip if already hydrated for this user
    if (hydratedForUserId === session.user.id) {
      console.log('✅ Already hydrated for this user, skipping');
      return;
    }

    console.log('🚀 Starting wallet hydration for user:', session.user.id);
    setIsLoading(true);
    
    try {
      // Mark as hydrated for this user to prevent repeated attempts
      setHydratedForUserId(session.user.id);
      
      console.log('💾 Wallets loaded from registry, restoring active selection:', {
        walletsCount: connectedWallets.length,
        registryWalletsCount: registryWallets.length,
        currentActiveWallet: activeWallet,
        wallets: connectedWallets.map(w => ({ address: w.address, label: w.label }))
      });
      
      if (connectedWallets.length > 0) {
        // Use the enhanced restoreActiveSelection logic
        const { address: restoredAddress, network: restoredNetwork } = restoreActiveSelection(
          connectedWallets,
          registryWallets
        );
        
        console.log('🎯 Restored selection:', {
          address: restoredAddress,
          network: restoredNetwork,
          isNewBrowser: !localStorage.getItem('aw_active_address')
        });
        
        // Only set activeWallet if it's different from current (avoid unnecessary re-renders)
        if (restoredAddress && restoredAddress !== activeWallet) {
          setActiveWalletState(restoredAddress);
          console.log('✅ Set active wallet:', restoredAddress);
        } else if (restoredAddress) {
          console.log('✅ Active wallet already set correctly:', restoredAddress);
        }
        
        if (restoredNetwork && getSupportedNetworks().includes(restoredNetwork)) {
          setActiveNetworkState(restoredNetwork);
          console.log('✅ Set active network:', restoredNetwork);
        }
        
        // Emit wallet connected event for other components
        if (restoredAddress) {
          const event = new CustomEvent('walletConnected', {
            detail: { 
              address: restoredAddress, 
              timestamp: new Date().toISOString(),
              source: 'cross-browser-hydration'
            }
          });
          window.dispatchEvent(event);
        }
        
      } else {
        console.log('⚠️ No wallets found in registry, user needs to connect');
        // Only clear activeWallet if it's currently set (avoid unnecessary re-renders)
        if (activeWallet !== null) {
          setActiveWalletState(null);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to hydrate wallets from server:', error);
      // Fall back to localStorage data - don't block app loading
      setHydratedForUserId(session.user.id);
      
      // Try localStorage fallback
      try {
        const savedAddress = localStorage.getItem('aw_active_address');
        const savedNetwork = localStorage.getItem('aw_active_network');
        
        if (savedAddress && connectedWallets.some(w => w.address.toLowerCase() === savedAddress.toLowerCase())) {
          console.log('🔄 Using localStorage fallback:', savedAddress);
          setActiveWalletState(savedAddress);
        }
        
        if (savedNetwork && getSupportedNetworks().includes(savedNetwork)) {
          setActiveNetworkState(savedNetwork);
        }
      } catch (localStorageError) {
        console.warn('localStorage fallback also failed:', localStorageError);
      }
    } finally {
      setIsLoading(false);
      console.log('✅ Wallet hydration completed');
    }
  }, [isAuthenticated, session, hydratedForUserId, connectedWallets, registryWallets, restoreActiveSelection]);

  // Trigger hydration when auth session changes AND wallets have loaded
  useEffect(() => {
    if (!authLoading && !registryLoading) {
      hydrateFromServer();
    }
  }, [isAuthenticated, session?.user?.id, authLoading, registryLoading, hydrateFromServer]);

  // ============================================================================
  // Save active wallet/network to localStorage on change
  // ============================================================================

  useEffect(() => {
    try {
      if (activeWallet) {
        localStorage.setItem('aw_active_address', activeWallet);
      } else {
        localStorage.removeItem('aw_active_address');
      }
      
      if (activeNetwork) {
        localStorage.setItem('aw_active_network', activeNetwork);
      }
    } catch (error) {
      console.error('Failed to save wallet state to localStorage:', error);
    }
  }, [activeWallet, activeNetwork]);

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
      
      // Invalidate queries that depend on network using standardized query keys
      // This ensures all modules (Guardian, Hunter, HarvestPro, Portfolio) refetch
      // when the network changes
      const keysToInvalidate = getNetworkDependentQueryKeys(activeWallet, chainNamespace);
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

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
    console.log('🚨 AGGRESSIVE DEBUG - setActiveWallet ENTRY:', {
      targetAddress: address,
      currentActiveWallet: activeWallet,
      timestamp: Date.now(),
      connectedWalletsCount: connectedWallets.length
    });
    
    // Validate wallet exists (case-insensitive comparison)
    const walletExists = connectedWallets.some(w => w.address.toLowerCase() === address.toLowerCase());
    if (!walletExists) {
      console.error(`❌ VALIDATION FAILED: Wallet ${address} not found in connected wallets`)
      console.error('Available wallets:', connectedWallets.map(w => w.address))
      return;
    }

    console.log('✅ VALIDATION PASSED: Wallet found, proceeding with switch...')

    // Track the current state before any changes
    const stateBeforeChange = activeWallet;
    console.log('🔍 STATE BEFORE CHANGE:', stateBeforeChange);

    // EMERGENCY: Try direct state update first (bypass useTransition)
    console.log('🚨 EMERGENCY: Attempting direct state update (no useTransition)');
    
    setActiveWalletState(prevActive => {
      console.log('🚨 DIRECT FUNCTIONAL UPDATE CALLED:', {
        prevActive,
        newActive: address,
        areEqual: prevActive === address,
        timestamp: Date.now()
      });
      
      if (prevActive === address) {
        console.log('⚠️ WARNING: New address same as previous, but continuing...');
      }
      
      return address;
    });
    
    console.log('🚨 DIRECT STATE UPDATE COMPLETED');
    
    // Update is_primary in database - SIMPLE DIRECT UPDATE
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // First, set all wallets to NOT primary
          const { error: clearError } = await supabase
            .from('user_wallets')
            .update({ is_primary: false })
            .eq('user_id', user.id);
          
          if (clearError) {
            console.error('Failed to clear primary flags:', clearError);
            return;
          }
          
          // Then, set this wallet to primary
          const { error: setPrimaryError } = await supabase
            .from('user_wallets')
            .update({ is_primary: true })
            .eq('user_id', user.id)
            .ilike('address', address);
          
          if (setPrimaryError) {
            console.error('Failed to set primary wallet:', setPrimaryError);
          } else {
            console.log('✅ Primary wallet updated in database');
          }
        }
      } catch (error) {
        console.error('Error updating primary wallet:', error);
      }
    })();
    
    // Check state after a short delay
    setTimeout(() => {
      console.log('🚨 STATE CHECK AFTER 100ms - Current activeWallet should be:', address);
      // Note: We can't access activeWallet here due to closure, but React DevTools will show the real value
    }, 100);
    
    // Update lastUsed timestamp in registry - this is handled automatically by the database trigger
    // No need to manually update updated_at field
    
    // Emit custom event for inter-module reactivity
    const event = new CustomEvent('walletConnected', {
      detail: { address, timestamp: new Date().toISOString() }
    });
    window.dispatchEvent(event);
    
    console.log('🚨 setActiveWallet COMPLETED - Check React DevTools for state change');
    
  }, [connectedWallets, activeWallet, registryWallets]);

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

      // Add to persistent registry instead of local state
      await addToRegistry({
        address,
        label: `Connected Wallet`,
        chain_namespace: chainNamespace,
      });

      // Set as active wallet
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

    } finally {
      setIsLoading(false);
    }
  }, [connectedWallets, setActiveWallet, addToRegistry]);

  // ============================================================================
  // Resolve Wallet Name
  // ============================================================================

  const resolveWalletName = useCallback(async (address: string) => {
    const resolved = await resolveName(address);
    
    if (resolved && resolved.name) {
      // Find the wallet in the registry and update it
      const walletToUpdate = registryWallets.find(w => w.address.toLowerCase() === address.toLowerCase());
      if (walletToUpdate) {
        // Update the label with the resolved name
        await updateInRegistry(walletToUpdate.id, { 
          label: resolved.name 
        });
      }
    }
  }, [registryWallets, updateInRegistry]);

  // ============================================================================
  // Disconnect Wallet
  // ============================================================================

  const disconnectWallet = useCallback(async (address: string) => {
    setIsLoading(true);
    
    try {
      const hadActiveWallet = activeWallet === address;
      const remainingCount = connectedWallets.filter(w => w.address !== address).length;
      
      // Find the wallet in the registry to get its ID
      const walletToRemove = registryWallets.find(w => w.address.toLowerCase() === address.toLowerCase());
      if (walletToRemove) {
        // Remove from persistent registry
        await removeFromRegistry(walletToRemove.id);
      }
      
      // If disconnecting active wallet, switch to another or null
      if (activeWallet === address) {
        const remaining = connectedWallets.filter(w => w.address !== address);
        if (remaining.length > 0) {
          setActiveWallet(remaining[0].address);
        } else {
          setActiveWalletState(null);
          localStorage.removeItem('aw_active_address');
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
  }, [activeWallet, connectedWallets, registryWallets, removeFromRegistry, setActiveWallet]);

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
    isLoading: isLoading || registryLoading,
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
