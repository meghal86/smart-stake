# Requirements Document — Global Header v1.1 (Fintech-Grade)

## Introduction

This specification defines the requirements for redesigning AlphaWhale's header system to achieve a unified, elegant, world-class fintech aesthetic inspired by Robinhood, Coinbase, and Apple. The goal is to create a cohesive header experience that conveys institutional-grade professionalism and trustworthiness across all pages.

## Scope Lock

**In scope (v1.1):**
- A single GlobalHeader component used across all pages (no duplicates)
- Deterministic rendering across session states (guest / signed-in / wallet-connected)
- Desktop + mobile behavior, including overflow handling and menu IA
- A11y + perf + telemetry requirements
- Primary navigation is handled by mobile bottom tabs + desktop sidebar/top tabs (not inside header). Header SHALL NOT introduce its own route nav outside the chosen system.
- Canonical home route is `/` (root). Brand click navigates to `/`.
- **Auth Model**: Wallet-first SIWE login that issues Supabase JWT. Wallet registry requires JWT; wallet connect alone is not authentication.
- **Network Model**: Active_Network is read/view selection. Signing actions require provider chain match and must gate + optionally request chain switch.

**Out of scope (post v1.1):**
- Full "command palette" search, notifications center, enterprise policy banners
- Multi-tenant org switching (unless already present)

## Glossary

- **Account_Session**: Supabase JWT issued via SIWE (Sign-In With Ethereum) or other auth methods
- **Wallet_Session**: EVM wallet connection state (address + chain) via wagmi
- **Guest**: No Supabase JWT; may browse but cannot access wallet registry
- **Active_Network**: Read/view network selection for displaying data (balances, Guardian scores)
- **Signer_Network**: Provider chain that wallet can sign transactions on (wagmi connected chain)
- **Signing_Gate**: UI pattern requiring provider.chainId == Active_Network.chainId for transaction execution
- **GlobalHeader**: Unified header component with stable layout + slots
- **Session_State**: Explicit state model (S0-S3) defining authentication combinations
- **HEADER_CONTEXT_MAP**: Centralized configuration for page titles/subtitles
- **Profile_Dropdown**: User menu showing profile information and actions
- **Theme_Toggle**: Control for switching between light/dark themes
- **Mode_Switcher**: Demo/Live toggle buttons where applicable
- **Wallet_Selector**: Dropdown for selecting active wallet in portfolio context

## Requirements

### Requirement 1: Unified Layout & Behavior

**User Story:** As a user navigating between different pages, I want a consistent header layout with stable dimensions, so that the application feels cohesive and professional without layout shifts.

#### Acceptance Criteria

1. THE header SHALL be a single GlobalHeader component used across all routes
2. THE header SHALL have fixed height 64px (±4px allowed only with design approval)
3. THE header SHALL have 3 sections: Left (Brand), Center (Context), Right (Actions)
4. THE header SHALL be sticky at top with z-index above page content
5. THE header SHALL use a subtle bottom border OR hairline divider and optional translucent blur (no heavy shadows)
6. ON scroll, THE header background SHALL remain readable (no transparency that reduces contrast)
7. THE header SHALL NOT change height on scroll in v1.1 (avoid layout shift)
8. WHEN reduced-motion preference is set, THE system SHALL disable non-essential animations

### Requirement 2: Session State Model (Deterministic Rendering)

**User Story:** As a user, I want clear indication of my authentication status with consistent UI behavior, so that I understand my session state and available actions.

#### Acceptance Criteria

1. THE system SHALL implement these explicit session states:
   - S0: Guest (no Supabase JWT, no wallet connection)
   - S1: Authenticated only (Supabase JWT via SIWE or other, no wallet connection)
   - S2: Wallet connected only (wagmi connected, no Supabase JWT)
   - S3: Authenticated + Wallet connected (Supabase JWT + wagmi connected)
2. IN S0, THE Actions_Section SHALL show: Sign In (ghost) + Connect Wallet (primary)
3. IN S1, THE Actions_Section SHALL show: Profile dropdown + Connect Wallet
4. IN S2, THE Actions_Section SHALL show: WalletPill (non-interactive) + Sign In (ghost)
5. IN S3, THE Actions_Section SHALL show: WalletPill + Profile dropdown
6. THE WalletPill SHALL always be visible when wallet is connected (S2/S3) on all pages
7. THE WalletSelectorDropdown SHALL be enabled only on Portfolio page; elsewhere WalletPill is non-interactive
8. THE WalletPill SHALL display active wallet address (truncated) and Active_Network (chain icon + name)
9. THE WalletPill SHALL read wallet state from authenticated WalletContext (multi-chain-wallet-system)
10. THE WalletPill SHALL be non-interactive in S2 (no JWT) and show "Sign In to manage wallets" on hover
11. THE system SHALL NOT display "Guest" badges in the header chrome
9. ANY state-dependent control SHALL reserve width to prevent layout shift (skeletons/placeholder widths required)

### Requirement 2.1: Multi-Chain Wallet System Integration

**User Story:** As a user with multiple wallets across different networks, I want the header to display my active wallet and network consistently with the multi-chain wallet system, so that I have a unified experience across all pages.

#### Acceptance Criteria

1. THE header SHALL integrate with the multi-chain-wallet-system WalletContext as the single source of truth
2. THE WalletPill SHALL display activeWallet address (truncated) and Active_Network (chain icon + name) from WalletContext
3. THE WalletSelectorDropdown SHALL use connectedWallets array from WalletContext for wallet selection
4. WHEN wallet or network changes in WalletContext, THE header SHALL reflect changes immediately
5. THE header SHALL respect the multi-chain wallet system's SIWE authentication flow and session states
6. THE header SHALL NOT maintain independent wallet state or bypass WalletContext
7. THE WalletPill SHALL show "Not added on this network" state when activeWallet is not registered on Active_Network
8. THE header SHALL distinguish between Active_Network (view) and Signer_Network (provider chain)
9. THE header SHALL emit wallet_switched and network_switched events consistent with multi-chain wallet system

### Requirement 3: Brand Section

**User Story:** As a user, I want consistent AlphaWhale branding that allows easy navigation to home, so that I always know which platform I'm using.

#### Acceptance Criteria

1. THE Brand_Section SHALL show logo + wordmark on desktop
2. WHEN Brand_Section is clicked, THE system SHALL navigate to canonical home route
3. THE Brand_Section SHALL implement subtle hover/focus styles (no neon glow)
4. ON mobile devices (≤ 430px), THE Brand_Section SHALL hide wordmark while preserving accessible label
5. THE Brand_Section SHALL meet hit target ≥ 44px height
6. THE Brand_Section SHALL use elegant, crisp typography consistent with the brand

### Requirement 4: Context Section (Title/Subtitles)

**User Story:** As a user, I want to understand which section of the application I'm in through clear page context, so that I can orient myself effectively.

#### Acceptance Criteria

1. THE titles/subtitles SHALL be sourced from a single HEADER_CONTEXT_MAP configuration
2. THE Context_Section SHALL display page-specific titles and subtitles from this map
3. THE HEADER_CONTEXT_MAP SHALL define these default contexts:
   - Home: Title + Subtitle (marketing line)
   - Guardian: "Guardian" + "Trust & Safety"
   - Hunter: "Hunter" + "High-confidence opportunities"
   - Harvest: "Harvest" + "Tax-optimized outcomes"
   - Portfolio: "Portfolio" + "Overview" + wallet selector enabled
4. ON mobile devices, THE Context_Section SHALL hide subtitles to preserve space
5. THE Context_Section typography SHALL be stable across routes (no per-page custom fonts)

### Requirement 5: Feature Controls Integration

**User Story:** As a user, I want access to relevant page controls and features positioned consistently, so that I can efficiently use the application's functionality.

#### Acceptance Criteria

1. THE Theme_Toggle SHALL always be present on desktop
2. THE Mode_Switcher (Demo/Live) SHALL appear only on routes where it applies
3. IF a control is hidden on mobile, THE control SHALL be accessible via hamburger menu
4. THE controls order (desktop, right → left) SHALL be: ThemeToggle → optional ModeSwitcher → optional Badges → Wallet → Profile/Auth CTA
5. WHERE applicable, THE Actions_Section SHALL display feature badges like "AI Digest"

### Requirement 6: Mobile Navigation & Overflow (Hamburger)

**User Story:** As a mobile user, I want access to all header functionality through a well-organized overflow menu, so that I can use the application effectively on small screens.

#### Acceptance Criteria

1. THE system SHALL use these explicit breakpoints:
   - Mobile: ≤ 430px
   - Tablet: 431–1024px  
   - Desktop: ≥ 1025px
2. THE mobile header SHALL show: Brand (compact), Title, and an overflow trigger (hamburger or "More")
3. THE mobile overflow menu contents (top to bottom) SHALL include:
   - Theme toggle
   - Mode switcher (if applicable)
   - Wallet actions (copy address; switch wallet only on Portfolio)
   - Account actions (Profile/Settings/Sign in/Sign out)
   - Help/Legal (optional)
4. THE overflow menu SHALL NOT duplicate primary navigation (bottom tabs / desktop sidebar own nav)
5. THE menu SHALL support keyboard navigation and focus trap
6. THE tap targets SHALL be ≥ 44px with safe-area padding applied on iOS
7. THE Profile_Dropdown SHALL collapse to icon-only display on mobile devices
8. ON tablet devices, THE Brand_Section SHALL keep wordmark and hide subtitle if needed
9. ON tablet devices, THE ThemeToggle SHALL remain visible; other controls may collapse to overflow

### Requirement 7: Visual Standards (Fintech-Grade)

**User Story:** As a user, I want the header to convey professionalism and trustworthiness through refined visual design, so that I feel confident using the platform for financial activities.

#### Acceptance Criteria

1. THE typography SHALL use Inter/SF Pro system stack
2. THE color scheme SHALL use dark theme with restrained accents (no gaming neon)
3. THE icons SHALL use single icon set (Lucide recommended) across header
4. THE micro-interactions SHALL use 150–220ms transitions with ease-out timing
5. THE system SHALL respect reduced-motion preferences
6. THE gradients SHALL be limited to primary CTA only (if kept) and remain subtle

### Requirement 8: Loading, Error, Offline States

**User Story:** As a user, I want the header to remain stable and functional even when backend services fail, so that I can continue navigating the application.

#### Acceptance Criteria

1. WHILE session/profile is loading, THE header SHALL render skeleton placeholders (no layout jump)
2. IF profile fetch fails, THE Profile_Dropdown SHALL fall back to "Account" icon + retry option
3. IF wallet list fails, THE wallet selector SHALL show "Wallet" with disabled dropdown and retry
4. THE header MUST remain usable even if backend calls fail (nav + theme still work)
5. ANY session fetch MUST be cached (client) to avoid re-fetching on every route change

### Requirement 9: Accessibility (WCAG AA)

**User Story:** As a user with accessibility needs, I want the header to be fully accessible, so that I can navigate and use the application effectively.

#### Acceptance Criteria

1. ALL interactive elements SHALL have ARIA labels
2. THE header SHALL support full keyboard navigation (Tab order deterministic)
3. THE dropdowns SHALL use correct roles and announce open/close states
4. THE color contrast SHALL meet WCAG AA standards for text and icons
5. THE focus indicators SHALL be visible (not removed)
6. THE Profile_Dropdown SHALL be accessible via keyboard and screen readers
7. THE Theme_Toggle SHALL announce state changes to assistive technologies

### Requirement 10: Page-Specific Fixes

**User Story:** As a user, I want consistent header behavior across all pages without duplicate or missing elements, so that the navigation experience is seamless.

#### Acceptance Criteria

1. THE Guardian page SHALL remove any duplicate header implementations
2. THE Portfolio page SHALL display full AlphaWhale brand presence
3. ALL pages SHALL use standardized authentication UI without inconsistencies
4. ALL pages SHALL position page-specific controls consistently within the Actions_Section
5. THE system SHALL eliminate any "Guest" badge displays in favor of proper authentication states

### Requirement 11: Non-Functional Requirements (Performance + Reliability)

**User Story:** As a user, I want the header to load quickly and perform smoothly, so that navigation feels responsive and professional.

#### Acceptance Criteria

1. THE header SHALL render within 100ms of route transition on modern devices (excluding network)
2. THE header SHALL have no CLS (Cumulative Layout Shift) after initial paint
3. THE header SHALL reserve widths for avatar/wallet to prevent layout jumps
4. ANY session fetch MUST be cached (client) to avoid re-fetching on every route change
5. THE header SHALL maintain performance standards across all supported devices

### Requirement 13: Security & Anti-Phishing UI

**User Story:** As a user, I want the header to protect me from phishing attacks and clearly indicate security-relevant information, so that I can trust the interface with my financial data.

#### Acceptance Criteria

1. THE wallet address in header SHALL always be truncated (e.g., 0x12ab…90ef) with a copy action
2. IF ENS/name is shown, THE UI SHALL also provide a way to view the underlying address (tooltip/secondary line)
3. THE wallet UI SHALL display chain context (icon + chain name) when connected
4. ANY external destination triggered from header SHALL be clearly marked and never open silently in a new context on mobile
5. IF ENS/display name contains non-ASCII or confusable characters, THE UI SHALL show the truncated address more prominently (and optionally warn via tooltip)
6. THE avatar images SHALL be loaded only from an allowlisted domain set or proxied through backend to prevent tracking/leaks
7. THE Profile_Dropdown SHALL not render remote HTML; sanitize avatars; use strict CSP-compatible patterns

### Requirement 14: Implementation Contract (Next.js)

**User Story:** As a developer, I want clear implementation guidelines to ensure consistent behavior and prevent common issues, so that the header works reliably across the application.

#### Acceptance Criteria

1. THE GlobalHeader SHALL be rendered from a single layout (e.g., app/(shell)/layout.tsx) to prevent duplicates
2. THE session state SHALL be derived from a single client store (or server session) to prevent hydration flicker
3. THE header SHALL not re-fetch session data on every route transition; use SWR/stale-while-revalidate with TTL
4. THE header SHALL render a stable "resolving" state on first paint until session state is known (skeletons with reserved widths)
5. THE header SHALL NOT render S0 controls if a cached session exists and is being revalidated (SWR stale-while-revalidate)
6. THE session resolution MUST complete without visible CLS
7. THE header SHALL maintain stable component keys to prevent unnecessary re-mounts

### Requirement 12: Telemetry (Analytics Events)

**User Story:** As a product team, we want to track header interactions to understand user behavior and optimize the experience.

#### Acceptance Criteria

1. THE system SHALL emit these analytics events:
   - header_brand_clicked
   - header_theme_toggled
   - header_mode_changed (demo/live)
   - header_wallet_selector_opened
   - header_wallet_switched
   - header_profile_opened
   - header_signin_clicked
   - header_connect_wallet_clicked
2. ALL events MUST exclude sensitive PII (no full email; no full wallet unless already standard)
3. THE events SHALL include these required fields for analysis:
   - route_key
   - session_state
   - device_class (mobile/desktop)
   - chain_id (only if wallet connected)
   - wallet_count (integer, no addresses)
4. THE events SHALL be compatible with multi-chain wallet system telemetry and not duplicate events
### Requirement 15: Multi-Chain Wallet System Compatibility

**User Story:** As a developer, I want the header system to be fully compatible with the multi-chain wallet system, so that there are no conflicts or breaking changes when both systems are deployed.

#### Acceptance Criteria

1. THE header SHALL depend on multi-chain-wallet-system WalletContext and AuthProvider
2. THE header SHALL NOT duplicate wallet management functionality from multi-chain-wallet-system
3. THE header SHALL use CAIP-2 format chain namespaces (eip155:chainId) consistent with multi-chain wallet system
4. THE header SHALL support all networks defined in multi-chain wallet system SUPPORTED_NETWORKS config
5. THE header SHALL respect multi-chain wallet system route protection and SIWE authentication flows
6. THE header SHALL use the same session state model as multi-chain wallet system (S0-S3 states with JWT requirement)
7. THE header SHALL support the Active_Network (view) vs Signer_Network (provider) distinction
8. THE header SHALL NOT interfere with multi-chain wallet system Edge Function calls or database operations
8. THE header implementation SHALL be tested with multi-chain wallet system integration to prevent regressions