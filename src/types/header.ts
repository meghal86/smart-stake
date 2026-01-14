/**
 * Unified Header System Types
 * 
 * Type definitions for the unified header system that integrates with
 * the multi-chain wallet system and provides deterministic session state management.
 */

import { LucideIcon } from 'lucide-react';

/**
 * Session State Model
 * 
 * Deterministic session states based on two independent boolean flags:
 * - hasJWT: Supabase session exists (Account_Session)
 * - hasWallet: wagmi connected address exists (Wallet_Session)
 */
export type SessionState = 'S0_GUEST' | 'S1_ACCOUNT' | 'S2_WALLET' | 'S3_BOTH';

/**
 * Device class for responsive behavior
 * - mobile: ≤430px
 * - tablet: 431-1024px
 * - desktop: ≥1025px
 */
export type DeviceClass = 'mobile' | 'tablet' | 'desktop';

/**
 * Header context configuration for page-specific titles and features
 */
export interface HeaderContext {
  /** Page title displayed in header */
  title: string;
  /** Optional subtitle (hidden on mobile) */
  subtitle?: string;
  /** Whether to show demo/live mode switcher */
  showModeSwitcher?: boolean;
  /** Whether to show feature badges */
  showBadges?: boolean;
  /** Whether wallet selector is enabled (only true on Portfolio) */
  enableWalletSelector?: boolean;
}

/**
 * User profile information for profile dropdown
 */
export interface UserProfile {
  id: string;
  displayName?: string;
  emailMasked?: string;
  avatarUrl?: string;
}

/**
 * Wallet pill model representing active wallet and signer state
 * 
 * This model distinguishes between:
 * - Active wallet: The wallet being viewed (from registry or signer fallback in S2)
 * - Signer: The connected wallet that can sign transactions
 */
export interface WalletPillModel {
  // Active wallet (view state)
  activeAddressShort: string;      // "0x12ab…90ef"
  activeAddressChecksum: string;   // Full checksummed address for copy/tooltip
  activeEnsName?: string;          // ENS name if available
  activeNetwork: string;           // CAIP-2 format (e.g., "eip155:1")
  activeChainName: string;         // Human-readable chain name (e.g., "Ethereum")
  activeChainIconKey?: string;     // Icon key for chain (e.g., "eth", "arb")
  
  // Signer wallet (connected provider)
  signerAddressShort?: string;     // "0xabcd…1234" if different from active
  signerAddressChecksum?: string;  // Full signer address
  signerNetwork?: number;          // wagmi chainId
  
  // Derived state
  canSignForActive: boolean;       // signerAddressChecksum === activeAddressChecksum
  isInteractive: boolean;          // Only true on Portfolio + S3
  showMismatchIndicator: boolean;  // signerNetwork doesn't match activeNetwork
  isSavedToRegistry: boolean;      // false in S2, true in S3 when active from registry
}

/**
 * Global header model containing all state needed for rendering
 */
export interface GlobalHeaderModel {
  sessionState: SessionState;
  deviceClass: DeviceClass;
  context: HeaderContext;
  user?: UserProfile;
  wallet?: WalletPillModel;
  walletCount?: number;
  
  // Provider loading states (not owned by header)
  authLoading: boolean;         // AuthProvider session resolving
  walletHydrating: boolean;     // WalletProvider registry fetch in-flight
  isResolvingSession: boolean;  // Computed: authLoading || (hasJWT && walletHydrating)
}

/**
 * Props for GlobalHeader component
 */
export interface GlobalHeaderProps {
  routeKey: string;
  className?: string;
}

/**
 * Props for WalletPill component
 */
export interface WalletPillProps {
  wallet: WalletPillModel;
  onCopy?: () => void;
  onSelectorOpen?: () => void;
  onNetworkSwitch?: (chainNamespace: string) => void;
  onConnectActiveSigner?: () => void;  // When canSignForActive is false
  onSaveWallet?: () => void;           // S2 save action
  className?: string;
}

/**
 * Props for Profile Dropdown component
 */
export interface ProfileDropdownProps {
  user: UserProfile;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onSignOutClick: () => void;
  className?: string;
}

/**
 * Props for Mobile Overflow Menu
 */
export interface MobileOverflowMenuProps {
  isOpen: boolean;
  onClose: () => void;
  sessionState: SessionState;
  showThemeToggle: boolean;
  showModeSwitcher: boolean;
  wallet?: WalletPillModel;
  user?: UserProfile;
  onThemeToggle: () => void;
  onModeSwitch: (mode: 'demo' | 'live') => void;
  onWalletAction: (action: 'copy' | 'switch') => void;
  onAuthAction: (action: 'signin' | 'signout' | 'profile' | 'settings') => void;
}

/**
 * Route context result with both key and context
 */
export interface RouteContextResult {
  key: string;
  context: HeaderContext;
}

/**
 * Telemetry event types for header analytics
 */
export interface HeaderTelemetryEvents {
  header_session_state_changed: {
    from_state: SessionState;
    to_state: SessionState;
    route_key: string;
    device_class: DeviceClass;
    timestamp: string;
  };
  
  header_wallet_pill_clicked: {
    session_state: SessionState;
    route_key: string;
    action: 'copy' | 'selector_open' | 'network_switch' | 'connect_active_signer';
    device_class: DeviceClass;
    wallet_present: boolean;
    wallet_count?: number;
    active_network?: string;
    signer_mismatch?: boolean;
  };
  
  header_auth_action: {
    action: 'signin_clicked' | 'signout_clicked' | 'profile_clicked' | 'add_wallet_clicked' | 'save_wallet_clicked';
    session_state: SessionState;
    route_key: string;
    device_class: DeviceClass;
    wallet_present: boolean;
  };
  
  header_hydration_completed: {
    session_state: SessionState;
    wallet_count?: number;
    hydration_time_ms: number;
    route_key: string;
    had_cached_state: boolean;
  };
  
  header_error_boundary_triggered: {
    error_type: 'auth' | 'network' | 'ui' | 'data';
    session_state: SessionState;
    route_key: string;
    retry_count: number;
    address_hash?: string;
  };
}
