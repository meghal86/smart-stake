# Unified Header System Design Document

## Overview

The Unified Header System provides a consistent, world-class fintech header experience across all AlphaWhale pages. The system integrates seamlessly with the multi-chain wallet system (v2.4.2) to provide deterministic session state management, wallet display, and navigation controls while maintaining the professional aesthetic of institutional-grade financial applications.

## Architecture

### System Integration

The header system operates as a presentation layer that integrates with existing AlphaWhale infrastructure:

```
AuthProvider (Supabase JWT via SIWE)
  ↓
QueryProvider (React Query for API calls)
  ↓
WalletProvider (Multi-chain wallet system v2.4.2)
  ↓
GlobalHeader (Unified header system)
  ↓
Page Content
```

**CRITICAL: Provider Order Fix**
```typescript
// MANDATORY: QueryProvider must wrap WalletProvider if WalletProvider fetches/invalidate queries.
function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>           {/* 1. Auth session first */}
      <QueryProvider>        {/* 2. React Query for API calls */}
        <WalletProvider>     {/* 3. Wallet context uses queries */}
          <GlobalHeader>     {/* 4. Header reads from contexts */}
            {children}
          </GlobalHeader>
        </WalletProvider>
      </QueryProvider>
    </AuthProvider>
  );
}
```

**Why this order matters**: WalletProvider uses React Query invalidation/fetching, so it must be inside QueryProvider to prevent runtime errors or silent cache failures.

**Key Integration Points:**
- **AuthProvider**: Provides Supabase JWT session state (authenticated vs guest)
- **WalletProvider**: Provides multi-chain wallet state (connected wallets, active selections)
- **HEADER_CONTEXT_MAP**: Centralized page context configuration
- **Theme System**: Global theme state management

### Session State Architecture

The header implements a deterministic session state model based on two independent boolean states:

```typescript
type SessionState = 'S0_GUEST' | 'S1_ACCOUNT' | 'S2_WALLET' | 'S3_BOTH';

function deriveSessionState(
  hasJWT: boolean,      // Supabase session exists (Account_Session)
  hasWallet: boolean    // wagmi connected address exists (Wallet_Session)
): SessionState {
  if (!hasJWT && !hasWallet) return 'S0_GUEST';
  if (hasJWT && !hasWallet) return 'S1_ACCOUNT';
  if (!hasJWT && hasWallet) return 'S2_WALLET';
  return 'S3_BOTH';
}
```

**State Rendering Rules:**
- **S0 (Guest)**: Sign In (ghost) + Connect Wallet (primary)
- **S1 (Account Only)**: Profile dropdown + "Add wallet" CTA (primary) + Connect Wallet (secondary)
- **S2 (Wallet Only)**: WalletPill (non-interactive) + "Save wallet" CTA + Sign In (ghost)
- **S3 (Both)**: WalletPill (interactive) + Profile dropdown

**S1 Enhancement - Productive Account-Only State**:
- Show "Add wallet" CTA (opens add modal) as primary action
- Connect Wallet becomes secondary option
- Removes forced wallet-connect friction for watch-only users

**Add Wallet Behavior (LOCKED)**:
```typescript
async function handleAddWallet(address_or_ens: string, chain_namespace: string, label?: string) {
  // Disable button + show spinner
  setAdding(true);
  
  try {
    const response = await fetch('/functions/v1/wallets-add-watch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': generateUUID(),
      },
      body: JSON.stringify({
        address_or_ens,
        chain_namespace,
        label
      })
    });
    
    if (response.status === 409) {
      // Treat duplicate as success
      showToast('Wallet added successfully');
      queryClient.invalidateQueries(['wallets', 'registry']);
      closeModal();
      return;
    }
    
    if (response.status === 422) {
      const error = await response.json();
      if (error.error.code === 'QUOTA_EXCEEDED') {
        showError('Wallet limit reached. Upgrade your plan to add more wallets.');
        return;
      }
      if (error.error.code === 'PRIVATE_KEY_DETECTED') {
        showError('Private keys not allowed. Please enter a wallet address.');
        return;
      }
      if (error.error.code === 'SEED_PHRASE_DETECTED') {
        showError('Seed phrases not allowed. Please enter a wallet address.');
        return;
      }
    }
    
    // Success
    showToast('Wallet added successfully');
    queryClient.invalidateQueries(['wallets', 'registry']);
    closeModal();
    
  } finally {
    setAdding(false);
  }
}
```

**S2 Enhancement - "Connected but not saved" Support**:
- Show WalletPill + "Save wallet" CTA (small) or one-time toast/banner
- Save action calls wallets-add-watch with current signer chain mapped to CAIP-2
- If quota exceeded → show actionable error, maintain S2 state
- Aligns with RainbowKit prompting requirement

**Save Wallet Behavior (LOCKED)**:
```typescript
async function handleSaveWallet() {
  // Disable button + show spinner
  setSaving(true);
  
  try {
    const response = await fetch('/functions/v1/wallets-add-watch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': generateUUID(), // Prevent double-click
      },
      body: JSON.stringify({
        address_or_ens: signerAddress,
        chain_namespace: chainIdToCaip2(signerNetwork),
        label: null
      })
    });
    
    if (response.status === 409) {
      // Treat duplicate as success
      showToast('Wallet saved successfully');
      queryClient.invalidateQueries(['wallets', 'registry']);
      return;
    }
    
    if (response.status === 422 && response.json().error.code === 'QUOTA_EXCEEDED') {
      showError('Wallet limit reached. Upgrade your plan to add more wallets.');
      return; // Stay in S2 state
    }
    
    // Success
    showToast('Wallet saved successfully');
    queryClient.invalidateQueries(['wallets', 'registry']);
    
  } finally {
    setSaving(false);
  }
}
```

**Header ↔ Wallet System Contract**:
- Header session state is derived from:
  - Account_Session: Supabase session exists
  - Wallet_Session: wagmi connected address exists
- Header shows wallet pill whenever Wallet_Session exists (even if Account_Session missing)
- Wallet selector enabled only on Portfolio route, pill-only elsewhere

**Deterministic Hydration Contract**:
- WalletProvider hydrates registry keyed by user_id (not header responsibility)
- Header renders based on provider state and shows skeletons until providers settle
- AuthProvider and WalletProvider manage their own loading states
- Header computes: `isResolvingSession = authLoading || (hasJWT && walletHydrating)`

## Components and Interfaces

### GlobalHeader Component

```typescript
interface GlobalHeaderProps {
  routeKey: string;
  className?: string;
}

interface HeaderContext {
  title: string;
  subtitle?: string;
  showModeSwitcher?: boolean;
  showBadges?: boolean;
  enableWalletSelector?: boolean; // Only true on Portfolio
}

interface GlobalHeaderModel {
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
```

### WalletPill Component

```typescript
interface WalletPillModel {
  // "Active view" (server-authoritative from wallet registry OR signer fallback in S2)
  activeAddressShort: string;      // "0x12ab…90ef"
  activeAddressChecksum: string;   // Full address for copy/tooltip
  activeEnsName?: string;          // ENS for active wallet
  activeNetwork: string;           // CAIP-2 view network
  activeChainName: string;         // "Ethereum", "Arbitrum"
  activeChainIconKey?: string;     // "eth", "arb"
  
  // "Signer" (wagmi connected wallet)
  signerAddressShort?: string;     // "0xabcd…1234" if different
  signerAddressChecksum?: string;  // Full signer address
  signerNetwork?: number;          // wagmi chainId
  
  // Derived state
  canSignForActive: boolean;       // signerAddressChecksum === activeAddressChecksum
  isInteractive: boolean;          // Only true on Portfolio + S3
  showMismatchIndicator: boolean;  // signerNetwork doesn't match activeNetwork
  isSavedToRegistry: boolean;      // false in S2, true in S3 when active from registry
}

interface WalletPillProps {
  wallet: WalletPillModel;
  onCopy?: () => void;
  onSelectorOpen?: () => void;
  onNetworkSwitch?: (chainNamespace: string) => void;
  onConnectActiveSigner?: () => void;  // When canSignForActive is false
  onSaveWallet?: () => void;           // S2 save action
  className?: string;
}
```

**S2_WALLET Active Wallet Fallback Rule (LOCKED)**:
```typescript
// In S2_WALLET state (no server registry), use deterministic fallback:
if (sessionState === 'S2_WALLET') {
  activeAddress = signerAddress;
  activeNetwork = chainIdToCaip2(signerNetwork) || 'eip155:1';
  canSignForActive = true;
  isSavedToRegistry = false;
}
```

**Display Rules**:
- Pill always shows Active (watch) wallet + view network
- If signer exists but differs, show subtle "Signer: 0x…" sublabel in tooltip/dropdown
- If `showMismatchIndicator`, display "Viewing Arbitrum • Signer on Ethereum"
- Any signing CTA checks `canSignForActive`; if false → "Connect this wallet to sign"
- Header never silently switches signer chain - only prompts at signing moment

**CAIP-2 ↔ ChainId Mapping Utility (LOCKED)**:
```typescript
function caip2ToChainId(caip: string): number | null {
  const m = /^eip155:(\d+)$/.exec(caip);
  return m ? Number(m[1]) : null;
}

function chainIdToCaip2(chainId: number): string {
  return `eip155:${chainId}`;
}

// Mismatch detection rule:
showMismatchIndicator = signerNetwork != null && 
                       caip2ToChainId(activeNetwork) != null && 
                       signerNetwork !== caip2ToChainId(activeNetwork);
```

### Profile Dropdown Component

```typescript
interface UserProfile {
  id: string;
  displayName?: string;
  emailMasked?: string;
  avatarUrl?: string;
}

interface ProfileDropdownProps {
  user: UserProfile;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onSignOutClick: () => void;
  className?: string;
}
```

### Mobile Overflow Menu

```typescript
interface MobileOverflowMenuProps {
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
```

## Data Models

### HEADER_CONTEXT_MAP Configuration

```typescript
export const HEADER_CONTEXT_MAP: Record<string, HeaderContext> = {
  '/': {
    title: 'AlphaWhale',
    subtitle: 'Institutional-Grade DeFi Risk Management'
  },
  '/guardian': {
    title: 'Guardian',
    subtitle: 'Trust & Safety'
  },
  '/hunter': {
    title: 'Hunter',
    subtitle: 'High-confidence opportunities'
  },
  '/harvestpro': {  // Fixed: was /harvest, now matches protected route
    title: 'Harvest',
    subtitle: 'Tax-optimized outcomes'
  },
  '/portfolio': {
    title: 'Portfolio',
    subtitle: 'Overview',
    enableWalletSelector: true  // Only Portfolio enables full wallet selector
  }
};

// Support for nested routes with longest-prefix match
function getRouteContext(pathname: string): HeaderContext {
  // Try exact match first
  if (HEADER_CONTEXT_MAP[pathname]) {
    return HEADER_CONTEXT_MAP[pathname];
  }
  
  // Try longest-prefix match for nested routes
  const candidates = Object.keys(HEADER_CONTEXT_MAP)
    .filter(route => pathname.startsWith(route + '/'))
    .sort((a, b) => b.length - a.length); // Longest first
    
  if (candidates.length > 0) {
    return HEADER_CONTEXT_MAP[candidates[0]];
  }
  
  // Fallback to home context
  return HEADER_CONTEXT_MAP['/'];
}
```

**Route Context Rules**:
- Exact match takes precedence
- Nested routes (/guardian/scan, /harvestpro/opportunities) inherit parent context
- Longest-prefix matching prevents route context drift
- Fallback to home context for unknown routes

### Breakpoint Configuration

```typescript
export const BREAKPOINTS = {
  mobile: { max: 430 },
  tablet: { min: 431, max: 1024 },
  desktop: { min: 1025 }
} as const;

type DeviceClass = 'mobile' | 'tablet' | 'desktop';

function getDeviceClass(width: number): DeviceClass {
  if (width <= BREAKPOINTS.mobile.max) return 'mobile';
  if (width <= BREAKPOINTS.tablet.max) return 'tablet';
  return 'desktop';
}
```

### Layout Stability (CLS Prevention)

**Reserved Widths for Stable Layout**:
```typescript
export const HEADER_LAYOUT = {
  height: '64px',           // ±4px acceptable
  reservedWidths: {
    desktop: {
      walletPillSlot: '180px',    // min-width reserved
      profileSlot: '40px',        // profile avatar + dropdown
      titleSlot: 'flex-1',        // truncates, no pushing actions
    },
    mobile: {
      walletPillSlot: '140px',    // min-width reserved
      profileSlot: '40px',
      titleSlot: 'flex-1',
    }
  }
} as const;
```

**CLS Prevention Rules**:
- Header maintains stable 64px height across all states
- Wallet pill slot reserves minimum width even when empty
- Profile slot reserves space for avatar
- Title truncates rather than pushing action buttons
- Skeleton placeholders match final element dimensions

### Theme Configuration

```typescript
interface ThemeConfig {
  colors: {
    background: string;
    border: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    accent: {
      primary: string;
      secondary: string;
    };
  };
  typography: {
    fontFamily: string;
    sizes: {
      title: string;
      subtitle: string;
      body: string;
    };
  };
  spacing: {
    headerHeight: string;
    padding: {
      desktop: string;
      tablet: string;
      mobile: string;
    };
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Session State Determinism
*For any* combination of JWT and wallet connection states, the derived session state should be deterministic and the header should render the correct UI elements for that state.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 2: Layout Stability
*For any* session state transition or data loading event, the header should maintain stable dimensions (64px ±4px height) and prevent cumulative layout shift through reserved widths and skeleton placeholders.
**Validates: Requirements 1.2, 8.1, 8.4, 11.2, 11.6**

### Property 3: Multi-Chain Integration Consistency
*For any* wallet or network change in the multi-chain wallet system, the header should reflect the change immediately and consistently across all pages without maintaining independent state.
**Validates: Requirements 2.1.1, 2.1.2, 2.1.4, 2.1.6, 15.1, 15.2**

### Property 4: Breakpoint Responsiveness
*For any* viewport width, the header should apply the correct breakpoint rules (mobile ≤430px, tablet 431-1024px, desktop ≥1025px) and show/hide elements according to the responsive design specifications.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.8**

### Property 5: Context Configuration Consistency
*For any* route key, the header should display the correct title and subtitle from HEADER_CONTEXT_MAP, and enable the correct features (wallet selector, mode switcher) based on the page configuration.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 6: Authentication State Accuracy
*For any* authentication event (sign in, sign out, session expiry), the header should update the session state correctly and show the appropriate UI elements without flicker or incorrect intermediate states.
**Validates: Requirements 2.1, 2.1.5, 8.4, 8.5, 14.4, 14.5**

### Property 7: Wallet Display Correctness
*For any* wallet connection state, the WalletPill should display the correct truncated address, chain icon, and interactivity state based on the session state and page context.
**Validates: Requirements 2.6, 2.7, 2.8, 2.9, 2.10, 2.1.2, 2.1.7**

### Property 8: Mobile Overflow Menu Completeness
*For any* mobile viewport, the overflow menu should contain all necessary controls in the correct order and support keyboard navigation with proper focus management.
**Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**

### Property 9: Theme Toggle Consistency
*For any* theme change event, the header should update immediately across all components and persist the preference correctly while respecting system preferences.
**Validates: Requirements 5.1, 5.4, 8.7**

### Property 10: Security Display Standards
*For any* wallet address or user information display, the header should follow security standards (truncated addresses, ENS handling, avatar sanitization) and never expose sensitive information.
**Validates: Requirements 13.1, 13.2, 13.3, 13.5, 13.6**

### Property 11: Accessibility Compliance
*For any* interactive element in the header, it should have proper ARIA labels, support keyboard navigation, meet WCAG AA contrast requirements, and announce state changes to assistive technologies.
**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7**

### Property 12: Performance Standards
*For any* route transition or header interaction, the header should render within 100ms, maintain stable performance metrics, and use efficient caching strategies to prevent unnecessary re-renders.
**Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

### Property 13: Telemetry Event Accuracy
*For any* user interaction with header elements, the system should emit the correct analytics events with required fields (route_key, session_state, device_class) while excluding sensitive PII.
**Validates: Requirements 12.1, 12.2, 12.3, 12.4**

### Property 14: Error State Resilience
*For any* error condition (network failure, authentication error, data loading failure), the header should maintain functionality with appropriate fallback states and recovery mechanisms.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### Property 15: Brand Navigation Consistency
*For any* brand section click event, the header should navigate to the canonical home route (/) consistently across all pages and session states.
**Validates: Requirements 3.2, 3.3, 3.5**

## Error Handling

### Security Telemetry Events (no PII)

The header system emits structured events for monitoring and debugging:

```typescript
// Header-specific events (no PII)
interface HeaderTelemetryEvents {
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
    active_network?: string;        // CAIP-2 format
    signer_mismatch?: boolean;      // canSignForActive === false
    // NO raw addresses, ENS, or email
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
    // Optional hashed address (sha256 + salt) for correlation if needed
    address_hash?: string;
  };
}
```

**Security Rules - No PII in Telemetry**:
- ✅ Include: wallet_present (boolean), wallet_count, active_network (CAIP-2)
- ✅ Optional: hashed address (sha256 + salt) for correlation only
- ❌ Never log: full addresses, ENS names, email addresses, user names

**Integration with Multi-Chain Wallet System Events**:
- wallet_registry_hydrate_started → header shows loading skeleton
- wallet_registry_hydrate_succeeded → header updates wallet pill
- wallet_registry_hydrate_failed → header shows error state
- wallet_mutation_attempted → header shows pending state
- wallet_mutation_blocked → header shows error message

### Error Categories

**Authentication Errors:**
- JWT token expiry → Clear session state, redirect to login
- Invalid session → Show sign-in prompt, maintain navigation
- SIWE signature failure → Display retry option with clear messaging

**Network Errors:**
- Multi-chain wallet system unavailable → Show cached state with offline indicator
- RPC failures → Display network status, offer retry
- ENS resolution failures → Fall back to address display

**UI State Errors:**
- Invalid route context → Use default header context
- Missing user profile → Show skeleton with retry option
- Avatar loading failure → Use default avatar with fallback

**Data Consistency Errors:**
- Wallet state mismatch → Refresh from WalletContext
- Session state conflicts → Re-derive from auth and wallet states
- Cache invalidation → Clear affected caches, reload

### Error Recovery Patterns

```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  errorType: 'auth' | 'network' | 'ui' | 'data';
  retryCount: number;
  lastError?: Error;
}

class HeaderErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      errorType: classifyError(error),
      lastError: error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry with context
    Sentry.captureException(error, {
      tags: { component: 'GlobalHeader' },
      extra: { errorInfo, sessionState: this.props.sessionState }
    });
  }

  render() {
    if (this.state.hasError) {
      return <HeaderFallback 
        errorType={this.state.errorType}
        onRetry={this.handleRetry}
      />;
    }

    return this.props.children;
  }
}
```

## Testing Strategy

### Property-Based Testing (Primary)

**Library**: fast-check for comprehensive property validation

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature and property reference
- Smart generators for realistic input constraints

**Example Property Test**:
```typescript
// Feature: unified-header-system, Property 1: Session State Determinism
test('session state derivation is deterministic', () => {
  fc.assert(
    fc.property(
      fc.record({
        hasJWT: fc.boolean(),
        hasWallet: fc.boolean()
      }),
      ({ hasJWT, hasWallet }) => {
        const state1 = deriveSessionState(hasJWT, hasWallet);
        const state2 = deriveSessionState(hasJWT, hasWallet);
        
        // Property: Same inputs always produce same output
        expect(state1).toBe(state2);
        
        // Property: State matches expected mapping
        if (!hasJWT && !hasWallet) expect(state1).toBe('S0_GUEST');
        if (hasJWT && !hasWallet) expect(state1).toBe('S1_ACCOUNT');
        if (!hasJWT && hasWallet) expect(state1).toBe('S2_WALLET');
        if (hasJWT && hasWallet) expect(state1).toBe('S3_BOTH');
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing (Complementary)

**Focus Areas**:
- Component rendering for specific states
- Event handler behavior
- Error boundary functionality
- Utility function correctness

**Example Unit Test**:
```typescript
describe('WalletPill Component', () => {
  test('renders non-interactive state in S2', () => {
    const wallet: WalletPillModel = {
      activeAddressShort: '0x12ab…90ef',
      activeAddressChecksum: '0x12ab...90ef',
      activeNetwork: 'eip155:1',
      activeChainName: 'Ethereum',
      canSignForActive: true,
      isInteractive: false,
      showMismatchIndicator: false,
      isSavedToRegistry: false,
    };

    render(<WalletPill wallet={wallet} />);
    
    expect(screen.getByText('0x12ab…90ef')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  
  test('shows mismatch indicator when signer on different chain', () => {
    const wallet: WalletPillModel = {
      activeAddressShort: '0x12ab…90ef',
      activeAddressChecksum: '0x12ab...90ef',
      activeNetwork: 'eip155:42161', // Arbitrum
      activeChainName: 'Arbitrum',
      signerAddressShort: '0x12ab…90ef',
      signerAddressChecksum: '0x12ab...90ef',
      signerNetwork: 1, // Ethereum
      canSignForActive: true,
      isInteractive: true,
      showMismatchIndicator: true,
      isSavedToRegistry: true,
    };

    render(<WalletPill wallet={wallet} />);
    
    expect(screen.getByText(/Viewing Arbitrum.*Signer on Ethereum/)).toBeInTheDocument();
  });
});
```

### Integration Testing

**Critical Flows**:
1. **Session State Transitions** - Auth changes trigger correct header updates
2. **Multi-Chain Integration** - Wallet/network changes reflect immediately
3. **Responsive Behavior** - Breakpoint changes show/hide correct elements
4. **Error Recovery** - Network failures gracefully degrade

### End-to-End Testing

**User Journeys**:
1. **Guest Navigation** - Browse pages, see consistent header, sign in flow
2. **Authenticated User** - Sign in, connect wallet, navigate between pages
3. **Mobile Experience** - Test overflow menu, touch targets, responsive design
4. **Error Scenarios** - Network failures, auth expiry, recovery flows

**Test Configuration**:
```typescript
// Playwright E2E test example
test('complete header user journey', async ({ page }) => {
  // Start as guest (S0)
  await page.goto('/');
  await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();
  await expect(page.locator('[data-testid="connect-wallet-button"]')).toBeVisible();

  // Connect wallet (S2)
  await page.click('[data-testid="connect-wallet-button"]');
  await page.click('[data-testid="metamask-option"]');
  await expect(page.locator('[data-testid="wallet-pill"]')).toBeVisible();
  await expect(page.locator('[data-testid="sign-in-button"]')).toBeVisible();

  // Sign in via SIWE (S3)
  await page.click('[data-testid="sign-in-button"]');
  await page.click('[data-testid="sign-with-wallet"]');
  await expect(page.locator('[data-testid="profile-dropdown"]')).toBeVisible();
  await expect(page.locator('[data-testid="wallet-pill"]')).toBeVisible();

  // Navigate between pages
  await page.click('[data-testid="brand-logo"]');
  await expect(page).toHaveURL('/');
  
  // Test mobile responsive
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('[data-testid="mobile-overflow-trigger"]')).toBeVisible();
});
```

## Implementation Roadmap

### 30/60/90 Build Plan

**Days 0–30 (ship "works every time")**:
- Fix provider order (QueryProvider → WalletProvider → GlobalHeader)
- Implement deterministic session state derivation (S0-S3)
- Add fixed-width skeleton placeholders to prevent CLS
- Implement header ↔ wallet system contract
- Add structured telemetry events
- Create responsive breakpoint system (mobile/tablet/desktop)

**Days 31–60 (make it enterprise-grade)**:
- Add comprehensive error boundaries with recovery
- Implement accessibility compliance (WCAG AA)
- Add performance monitoring and optimization
- Expand property-based tests for all state transitions
- Add mobile overflow menu with keyboard navigation
- Implement theme system integration

**Days 61–90 (hardening + moat)**:
- Add advanced security features (CSP, sanitization)
- Implement analytics integration with privacy controls
- Add A/B testing framework for header variations
- Performance optimization (sub-100ms render times)
- Advanced error recovery and offline support

### Acceptance Criteria + Scenario Tests

### Acceptance Criteria + Scenario Tests

**Must-pass scenarios (matches system invariants)**:

1. **S0 → S2: Connect wallet only**
   - Header shows pill + "Save wallet" CTA
   - Pill displays signer wallet (non-interactive)
   - Save action calls wallets-add-watch with current chain

2. **S2 → S3: SIWE sign-in**
   - Registry hydrates once (keyed by user_id)
   - Header shows active watch wallet (may differ from signer)
   - If signer ≠ active: show mismatch indicator + signer info in tooltip

3. **S3 with signer ≠ active wallet**
   - Header indicates mismatch ("Viewing Arbitrum • Signer on Ethereum")
   - Signing CTA shows "Connect this wallet to sign" gate
   - No automatic signer chain switching

4. **S3 network view switch**
   - activeNetwork changes; signerNetwork unchanged
   - Mismatch indicator updates accordingly
   - No wallet provider chain switching

5. **Auth expiry (S3 → S2 or S0 depending on signer)**
   - Header updates without flicker
   - No broken controls or intermediate states
   - Maintains signer connection if present

6. **Route context /harvestpro renders correct title/subtitle**
   - Nested routes (/harvestpro/opportunities) inherit parent context
   - Longest-prefix matching prevents drift

7. **Mobile overflow: keyboard navigation + focus trap works**
   - Tab order logical and complete
   - Escape closes menu and returns focus
   - All actions accessible via keyboard

8. **CLS prevention**
   - Header maintains 64px height across all state transitions
   - Reserved widths prevent layout shift when wallet count appears
   - Skeleton placeholders match final element dimensions

9. **S1 productive state**
   - Shows "Add wallet" CTA as primary action
   - Connect Wallet as secondary option
   - No forced wallet-connect friction for watch-only users

## Implementation Requirements (Kiro-Ready)

### Scope
Implement Unified Header System v1 across all pages, integrated with:
- AuthProvider (Supabase session)
- WalletProvider (server-authoritative registry + active selection)
- wagmi signer connection

### Hard Locks

**Provider Order**:
```
AuthProvider → QueryProvider → WalletProvider → GlobalHeader
```

**Header Does Not Hydrate**:
- WalletProvider owns registry hydration keyed by user_id
- Header renders based on provider state only

**Signer vs Active Wallet Are Distinct**:
- Header pill shows Active (watch) wallet
- Signer only affects signing gates + mismatch indicator
- Wallet selector only enabled on Portfolio route

**No CLS**:
- 64px height stable, reserved widths locked
- Skeleton placeholders match final dimensions

### Session State Model

- **S0_GUEST**: Sign In (ghost) + Connect Wallet (primary)
- **S1_ACCOUNT**: Profile dropdown + Add wallet (primary) + Connect Wallet (secondary)
- **S2_WALLET**: WalletPill (non-interactive) + Save wallet + Sign In
- **S3_BOTH**: WalletPill (interactive on Portfolio) + Profile dropdown

### Wallet Pill Rules

- Always display Active wallet + activeNetwork label (CAIP-2)
- If signer exists but differs:
  - Show tooltip/dropdown: "Signer: 0x…"
  - `canSignForActive = false`
- If chain mismatch:
  - Show "Viewing X • Signer on Y"
- Header never auto-switches provider chain; only gate at signing time

### S2 Save Wallet Behavior

Clicking Save wallet:
- Calls `POST /functions/v1/wallets-add-watch`
- Uses `Idempotency-Key`
- Maps signer chainId to CAIP-2 (`eip155:${chainId}`)
- On success or 409: refresh registry → transition to S3 if JWT present
- On `QUOTA_EXCEEDED`: show error, remain in S2

### S1 Add Wallet Behavior

Add wallet opens modal:
- Accepts `address_or_ens`, `chain_namespace`, optional `label`
- Rejects seed/private key patterns (per wallet system)
- On success: invalidate `['wallets','registry']`
- Idempotent with proper error handling

### Route Context

- Use `getRouteContext(pathname)` with longest-prefix match
- Must include `/harvestpro` (fixed) and nested routes
- Fallback to home context for unknown routes

### Layout Stability

- Height: 64px ±4px
- Reserved widths:
  - Wallet slot: 180px desktop / 140px mobile
  - Profile slot: 40px
  - Title truncates, never pushes actions
- Skeleton placeholders match final dimensions

### Telemetry (No PII)

Emit events:
- `header_session_state_changed`
- `header_wallet_pill_clicked`
- `header_auth_action`
- `header_hydration_completed`
- `header_error_boundary_triggered`

Include: `route_key`, `device_class`, `session_state`, `wallet_present`, `wallet_count`, `active_network`
Never include: raw address, ENS, email
Optional: salted hash if needed

### Must-Pass Tests (Playwright)

1. **S0 → S2 connect wallet**: Header shows pill + "Save wallet" CTA
2. **S2 Save wallet**: Idempotent double-click does not duplicate
3. **S2 → S3 SIWE sign-in**: Registry hydrates once, pill shows active watch wallet
4. **S3 signer ≠ active**: Mismatch indicator + "connect/switch wallet required" gate
5. **S3 network view switch**: activeNetwork changes, signerNetwork unchanged
6. **Auth expiry**: S3 → S2/S0 without flicker
7. **/harvestpro and nested route context correctness**
8. **CLS**: Header height + reserved widths stable through transitions
9. **Mobile overflow focus trap + escape restores focus**

## Summary

The Unified Header System provides a robust, accessible, and performant header experience that integrates seamlessly with AlphaWhale's multi-chain wallet system. The design emphasizes:

1. **Deterministic Behavior** - Clear session state model with predictable UI rendering
2. **Multi-Chain Integration** - Seamless integration with wallet system v2.4.2
3. **Responsive Design** - Mobile-first approach with explicit breakpoints
4. **Security Standards** - Proper handling of sensitive information and authentication
5. **Performance Optimization** - Stable layouts, efficient caching, minimal re-renders
6. **Accessibility Compliance** - WCAG AA standards with full keyboard support
7. **Error Resilience** - Graceful degradation and recovery mechanisms
8. **Comprehensive Testing** - Property-based tests with unit and E2E coverage

The system is designed to scale with AlphaWhale's growth while maintaining the professional, institutional-grade aesthetic that builds user trust and confidence.