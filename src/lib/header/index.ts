/**
 * Unified Header System Utilities
 * 
 * Core utilities for session state derivation, route context mapping,
 * CAIP-2 conversions, wallet pill model building, and sign out handling.
 */

// Re-export types for convenience
export type {
  SessionState,
  DeviceClass,
  HeaderContext,
  RouteContextResult,
  WalletPillModel,
  UserProfile,
  GlobalHeaderModel,
  GlobalHeaderProps,
  WalletPillProps,
  ProfileDropdownProps,
  MobileOverflowMenuProps,
  HeaderTelemetryEvents,
} from '@/types/header';

// Re-export sign out utilities
export {
  handleSignOut,
  shouldShowSaveWalletAfterSignOut,
  getSessionStateAfterSignOut,
} from './sign-out';

import type {
  SessionState,
  DeviceClass,
  HeaderContext,
  RouteContextResult,
  WalletPillModel,
} from '@/types/header';

/**
 * Breakpoint configuration for responsive behavior
 */
export const BREAKPOINTS = {
  mobile: { max: 430 },
  tablet: { min: 431, max: 1024 },
  desktop: { min: 1025 },
} as const;

/**
 * Layout stability constants for CLS prevention
 */
export const HEADER_LAYOUT = {
  height: '64px',
  reservedWidths: {
    desktop: {
      walletPillSlot: '180px',
      profileSlot: '40px',
      titleSlot: 'flex-1',
    },
    mobile: {
      walletPillSlot: '140px',
      profileSlot: '40px',
      titleSlot: 'flex-1',
    },
  },
} as const;

/**
 * Header context map for page-specific titles and features
 * 
 * Uses longest-prefix matching for nested routes
 */
export const HEADER_CONTEXT_MAP: Record<string, HeaderContext> = {
  '/': {
    title: 'AlphaWhale',
    subtitle: 'Institutional-Grade DeFi Risk Management',
  },
  '/guardian': {
    title: 'Guardian',
    subtitle: 'Trust & Safety',
  },
  '/hunter': {
    title: 'Hunter',
    subtitle: 'High-confidence opportunities',
  },
  '/harvestpro': {
    title: 'Harvest',
    subtitle: 'Tax-optimized outcomes',
  },
  '/portfolio': {
    title: 'Portfolio',
    subtitle: 'Overview',
    enableWalletSelector: true,
  },
};

/**
 * Derive session state from authentication and wallet connection flags
 * 
 * This is a pure function that deterministically maps two boolean inputs
 * to one of four session states.
 * 
 * @param hasJWT - Whether Supabase session exists (Account_Session)
 * @param hasWallet - Whether wagmi connected address exists (Wallet_Session)
 * @returns SessionState enum value
 * 
 * @example
 * deriveSessionState(false, false) // 'S0_GUEST'
 * deriveSessionState(true, false)  // 'S1_ACCOUNT'
 * deriveSessionState(false, true)  // 'S2_WALLET'
 * deriveSessionState(true, true)   // 'S3_BOTH'
 */
export function deriveSessionState(
  hasJWT: boolean,
  hasWallet: boolean
): SessionState {
  if (!hasJWT && !hasWallet) return 'S0_GUEST';
  if (hasJWT && !hasWallet) return 'S1_ACCOUNT';
  if (!hasJWT && hasWallet) return 'S2_WALLET';
  return 'S3_BOTH';
}

/**
 * Get device class from viewport width
 * 
 * SSR-safe: During SSR, defaults to 'desktop' to prevent hydration mismatches.
 * DOM structure should not branch on deviceClass - use CSS breakpoints instead.
 * 
 * @param width - Viewport width in pixels
 * @returns DeviceClass enum value
 */
export function getDeviceClass(width: number): DeviceClass {
  if (width <= BREAKPOINTS.mobile.max) return 'mobile';
  if (width <= BREAKPOINTS.tablet.max) return 'tablet';
  return 'desktop';
}

/**
 * Get route context with longest-prefix matching
 * 
 * Returns both the matched key (for telemetry) and the context (for UI).
 * 
 * Matching rules:
 * 1. Try exact match first
 * 2. Try longest-prefix match for nested routes
 * 3. Fallback to home context
 * 
 * @param pathname - Current route pathname
 * @returns RouteContextResult with key and context
 * 
 * @example
 * getRouteContextKey('/harvestpro/opportunities')
 * // { key: '/harvestpro', context: { title: 'Harvest', ... } }
 * 
 * getRouteContextKey('/guardian/scan/123')
 * // { key: '/guardian', context: { title: 'Guardian', ... } }
 * 
 * getRouteContextKey('/unknown')
 * // { key: '/', context: { title: 'AlphaWhale', ... } }
 */
export function getRouteContextKey(pathname: string): RouteContextResult {
  // Try exact match first (use hasOwnProperty to avoid prototype pollution)
  if (Object.prototype.hasOwnProperty.call(HEADER_CONTEXT_MAP, pathname)) {
    return {
      key: pathname,
      context: HEADER_CONTEXT_MAP[pathname],
    };
  }
  
  // Try longest-prefix match for nested routes
  const candidates = Object.keys(HEADER_CONTEXT_MAP)
    .filter(route => route !== '/' && pathname.startsWith(route + '/'))
    .sort((a, b) => b.length - a.length); // Longest first
    
  if (candidates.length > 0) {
    const key = candidates[0];
    return {
      key,
      context: HEADER_CONTEXT_MAP[key],
    };
  }
  
  // Fallback to home context
  return {
    key: '/',
    context: HEADER_CONTEXT_MAP['/'],
  };
}

/**
 * Get route context (convenience function for UI)
 * 
 * Returns just the context object for UI rendering.
 * For telemetry, use getRouteContextKey() to get both key and context.
 * 
 * @param pathname - Current route pathname
 * @returns HeaderContext for the matched route
 * 
 * @example
 * getRouteContext('/harvestpro/opportunities')
 * // { title: 'Harvest', subtitle: 'Tax-optimized outcomes' }
 */
export function getRouteContext(pathname: string): HeaderContext {
  return getRouteContextKey(pathname).context;
}

/**
 * Convert CAIP-2 chain namespace to numeric chainId
 * 
 * @param caip - CAIP-2 format string (e.g., "eip155:1")
 * @returns Numeric chainId or null if invalid format
 * 
 * @example
 * caip2ToChainId('eip155:1') // 1
 * caip2ToChainId('eip155:42161') // 42161
 * caip2ToChainId('invalid') // null
 */
export function caip2ToChainId(caip: string): number | null {
  const match = /^eip155:(\d+)$/.exec(caip);
  return match ? Number(match[1]) : null;
}

/**
 * Convert numeric chainId to CAIP-2 format
 * 
 * @param chainId - Numeric chain ID
 * @returns CAIP-2 format string
 * 
 * @example
 * chainIdToCaip2(1) // 'eip155:1'
 * chainIdToCaip2(42161) // 'eip155:42161'
 */
export function chainIdToCaip2(chainId: number): string {
  return `eip155:${chainId}`;
}

/**
 * Build wallet pill model from provider state
 * 
 * This is a pure function with no hidden reads. All inputs must be explicitly passed.
 * 
 * Rules:
 * - In S2_WALLET (no registry), use signer as active wallet (fallback)
 * - In S3_BOTH, use registry active wallet
 * - isInteractive only when S3 + enableWalletSelector
 * - showMismatchIndicator when signer chain differs from active network
 * 
 * @param params - All required state for building the model
 * @returns WalletPillModel or null if no wallet data
 */
export function buildWalletPillModel(params: {
  sessionState: SessionState;
  enableWalletSelector: boolean;
  activeWalletFromRegistry?: {
    address: string;
    ensName?: string;
    network: string; // CAIP-2
    chainName: string;
    chainIconKey?: string;
  };
  signerAddress?: string;
  signerChainId?: number;
}): WalletPillModel | null {
  const {
    sessionState,
    enableWalletSelector,
    activeWalletFromRegistry,
    signerAddress,
    signerChainId,
  } = params;

  // S2_WALLET: Use signer as active wallet (fallback)
  if (sessionState === 'S2_WALLET' && signerAddress && signerChainId) {
    const activeNetwork = chainIdToCaip2(signerChainId);
    const activeAddressShort = truncateAddress(signerAddress);
    
    return {
      activeAddressShort,
      activeAddressChecksum: signerAddress,
      activeNetwork,
      activeChainName: getChainName(signerChainId),
      activeChainIconKey: getChainIconKey(signerChainId),
      canSignForActive: true,
      isInteractive: false, // Never interactive in S2
      showMismatchIndicator: false, // No mismatch in S2 (signer = active)
      isSavedToRegistry: false,
    };
  }

  // S3_BOTH: Use registry active wallet
  if (sessionState === 'S3_BOTH' && activeWalletFromRegistry) {
    const activeAddressShort = truncateAddress(activeWalletFromRegistry.address);
    const activeNetworkChainId = caip2ToChainId(activeWalletFromRegistry.network);
    
    // Check if signer matches active wallet
    const canSignForActive = signerAddress?.toLowerCase() === activeWalletFromRegistry.address.toLowerCase();
    
    // Check for network mismatch
    const showMismatchIndicator = 
      signerChainId != null &&
      activeNetworkChainId != null &&
      signerChainId !== activeNetworkChainId;
    
    return {
      activeAddressShort,
      activeAddressChecksum: activeWalletFromRegistry.address,
      activeEnsName: activeWalletFromRegistry.ensName,
      activeNetwork: activeWalletFromRegistry.network,
      activeChainName: activeWalletFromRegistry.chainName,
      activeChainIconKey: activeWalletFromRegistry.chainIconKey,
      signerAddressShort: signerAddress && !canSignForActive ? truncateAddress(signerAddress) : undefined,
      signerAddressChecksum: signerAddress && !canSignForActive ? signerAddress : undefined,
      signerNetwork: signerChainId,
      canSignForActive,
      isInteractive: enableWalletSelector, // Only interactive on Portfolio
      showMismatchIndicator,
      isSavedToRegistry: true,
    };
  }

  return null;
}

/**
 * Truncate Ethereum address for display
 * 
 * @param address - Full Ethereum address
 * @returns Truncated address (e.g., "0x12ab…90ef")
 */
function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * Get human-readable chain name from chainId
 * 
 * @param chainId - Numeric chain ID
 * @returns Chain name
 */
function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    10: 'Optimism',
    56: 'BNB Chain',
    137: 'Polygon',
    8453: 'Base',
    42161: 'Arbitrum',
    43114: 'Avalanche',
  };
  return chainNames[chainId] || `Chain ${chainId}`;
}

/**
 * Get chain icon key from chainId
 * 
 * @param chainId - Numeric chain ID
 * @returns Icon key for chain
 */
function getChainIconKey(chainId: number): string | undefined {
  const iconKeys: Record<number, string> = {
    1: 'eth',
    10: 'op',
    56: 'bnb',
    137: 'matic',
    8453: 'base',
    42161: 'arb',
    43114: 'avax',
  };
  return iconKeys[chainId];
}
