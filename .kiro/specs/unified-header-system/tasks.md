# Implementation Plan: Unified Header System (v2.4.2)

## Overview

This implementation plan creates a world-class fintech header that integrates seamlessly with the multi-chain wallet system. The plan follows strict architectural constraints to prevent common integration bugs and ensures deterministic behavior across all session states.

## Tasks

### 0. Critical Infrastructure Locks

- [ ] 0.1 Provider order fix (hard lock)
  - Ensure: AuthProvider → QueryProvider → WalletProvider → GlobalHeader
  - Blocks everything else until correct order is established
  - _Requirements: 2.1, 15.1_

- [ ] 0.2 Hydration ownership contract (hard lock)
  - WalletProvider hydrates registry keyed by user_id
  - Header never fetches registry directly
  - Header reads: authLoading, walletHydrating, computes: isResolvingSession = authLoading || (hasJWT && walletHydrating)
  - _Requirements: 2.1.1, 15.2_

### 1. Core Types + Context Map + Utilities

- [ ] 1. Set up core header infrastructure and types
  - Create TypeScript interfaces for all header components (WalletPillModel with isSavedToRegistry)
  - Implement SessionState enum and deriveSessionState function
  - Create HEADER_CONTEXT_MAP + getRouteContextKey helper that returns both key and context
  - Add breakpoints configuration and useDeviceClass hook (SSR-safe)
  - Implement CAIP utilities: chainIdToCaip2, caip2ToChainId
  - Create buildWalletPillModel as pure function (no hidden reads)
  - **SSR Safety Lock**: JS-derived deviceClass MUST NOT change rendered DOM structure between SSR and client. DOM differences must be CSS-only. Use CSS breakpoints (Tailwind) for hide/show. During SSR, default deviceClass = 'desktop' and don't branch DOM structure on it.
  - **Route Context Helper Lock**: getRouteContextKey(pathname) returns { key, context }. All telemetry uses key from this helper. UI uses context.
  - **WalletPill Model Purity Lock**: buildWalletPillModel(...) must be pure function of sessionState, routeContext.enableWalletSelector, activeWalletFromRegistry?, signerAddress?, signerChainId?
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 4.1, 7.1_

- [ ] 1.3 Add unit tests for route context helper
  - Test: /harvestpro/opportunities → key '/harvestpro'
  - Test: /guardian/scan/123 → key '/guardian'  
  - Test: /random → key '/'
  - _Requirements: 4.1, 4.2_

- [ ] 1.1 Write property test for session state determinism
  - **Property 1: Session State Determinism**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [ ] 1.2 Write property test for context configuration consistency
  - **Property 5: Context Configuration Consistency**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### 2. GlobalHeader Skeleton + Layout Stability (No CLS)

- [ ] 2. Implement GlobalHeader layout (Brand | Context | Actions)
  - Create three-section layout with sticky positioning
  - Implement fixed height: 64px ±4px
  - Add reserved widths: wallet slot (180px desktop/140px mobile), profile slot (40px)
  - Create skeleton placeholders that match final dimensions
  - GlobalHeader renders on all protected routes + home via shared layout
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 14.1_

- [ ] 2.1 Write property test for layout stability
  - **Property 2: Layout Stability**
  - **Validates: Requirements 1.2, 8.1, 8.4, 11.2, 11.6**

- [ ] 2.2 Add CLS test for wallet count loading
  - **CLS Lock**: When walletCount transitions undefined → number, header must not shift (reserved widths handle it)
  - Add Playwright check for bounding box stability across wallet count loading
  - _Requirements: 1.2, 11.2, 11.6_

### 3. Brand Section

- [ ] 3. Brand component
  - Implement AlphaWhale logo with click navigation to /
  - Hide wordmark on mobile ≤430px
  - Add reduced-motion hover animations
  - Ensure 44px minimum touch target
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 3.1 Write property test for brand navigation consistency
  - **Property 15: Brand Navigation Consistency**
  - **Validates: Requirements 3.2, 3.3, 3.5**

### 4. Context Section (Route-aware)

- [ ] 4. Context title/subtitle from getRouteContext(pathname)
  - Display page-specific titles and subtitles
  - Hide subtitle on mobile
  - Ensure /harvestpro (and nested routes like /harvestpro/opportunities) uses correct context
  - Title truncates, never pushes action buttons
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 4.1 Add unit tests for route context
  - Test: /harvestpro/opportunities inherits Harvest context
  - Test: unknown route → / context fallback
  - _Requirements: 4.1, 4.2_

### 5. WalletPill (Active vs Signer, mismatch rules)

- [ ] 5. WalletPill component + model builder
  - Always display Active wallet + activeNetwork (CAIP-2)
  - Show mismatch indicator when signerNetwork !== caip2ToChainId(activeNetwork)
  - Tooltip: show signer info only when differs from active
  - S2 fallback (locked): active = signer, isSavedToRegistry=false, canSignForActive=true
  - **Copy functionality**: Copy defaults to active wallet address (activeAddressChecksum), never signer unless explicitly selected
  - _Requirements: 2.6, 2.7, 2.8, 2.9, 2.10, 2.1.2, 2.1.7, 13.1, 13.2_

- [ ] 5.1 Write property test for wallet display correctness
  - **Property 7: Wallet Display Correctness**
  - **Validates: Requirements 2.6, 2.7, 2.8, 2.9, 2.10, 2.1.2, 2.1.7**

- [ ] 5.2 Add unit test for mismatch indicator
  - Test: active Arbitrum (eip155:42161), signer Ethereum (chainId: 1) shows "Viewing Arbitrum • Signer on Ethereum"
  - _Requirements: 2.1.3, 2.1.4_

### 6. Profile Dropdown (S1/S3 only)

- [ ] 6. Profile dropdown
  - Create user profile dropdown with avatar, displayName + emailMasked only (never raw email)
  - Implement dropdown menu (Profile, Settings, Sign Out)
  - Add ARIA labels and keyboard navigation
  - Implement avatar fallback and sanitization
  - _Requirements: 2.1, 9.1, 9.2, 9.4, 9.6, 13.5, 13.6_

- [ ] 6.1 Write property test for authentication state accuracy
  - **Property 6: Authentication State Accuracy**
  - **Validates: Requirements 2.1, 2.1.5, 8.4, 8.5, 14.4, 14.5**

- [ ] 6.2 Implement sign out behavior (S3 → S2 data/cache handling)
  - **Sign Out Lock**: Supabase sign out clears JWT/session only; Wallet (wagmi) stays connected
  - Clear registry query cache: queryClient.removeQueries(['wallets','registry']) to prevent "ghost primary wallet"
  - Header transitions S3 → S2 showing wallet pill + "Save wallet" if registry no longer available
  - _Requirements: 2.1, 2.4, 15.2_

### 7. Actions Section (S0–S3 matrix + Add/Save wallet CTAs)

- [ ] 7. Implement session-state rendering (LOCKED UI matrix)
  - S0: Sign In (ghost) + Connect Wallet (primary)
  - S1: Profile + Add wallet (primary) + Connect Wallet (secondary)
  - S2: WalletPill (non-interactive) + Save wallet + Sign In
  - S3: WalletPill (+ selector only on Portfolio) + Profile
  - Portfolio-only selector rule: isInteractive only when routeContext.enableWalletSelector === true AND sessionState === S3_BOTH
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.4, 5.5_

#### 7A. Add Wallet Modal (S1 primary)

- [ ] 7.1 Implement Add Wallet modal + mutation
  - Create modal accepting address_or_ens, chain_namespace, optional label
  - POST /functions/v1/wallets-add-watch with Idempotency-Key
  - Handle errors by error.code (status-agnostic): QUOTA_EXCEEDED, PRIVATE_KEY_DETECTED, SEED_PHRASE_DETECTED
  - 409 duplicate = success, show "Wallet added successfully"
  - On success: invalidate ['wallets','registry']
  - _Requirements: 5.2, 5.3, 7.1, 7.4, 7.5_

#### 7B. Save Wallet CTA (S2) with pending intent (CRITICAL)

- [ ] 7.2 Implement Save Wallet CTA with auth gating
  - If hasJWT: call wallets-add-watch (idempotent with Idempotency-Key)
  - If !hasJWT: trigger SIWE sign-in and store pending_intent=SAVE_SIGNER_WALLET in sessionStorage
  - After auth resolves (S2→S3), auto-run the save once, then clear pending intent
  - Map signer chainId to CAIP-2 format (eip155:${chainId})
  - QUOTA_EXCEEDED → show upgrade message, remain in S2
  - **Pending Intent Edge Cases (LOCKED)**:
    - If user cancels SIWE / auth fails → clear pending_intent and show "Sign in required to save wallet"
    - If wallet disconnects before save runs → clear pending_intent and show "Wallet not connected"
    - Save should only auto-run when: hasJWT === true AND hasWallet === true AND walletHydrating === false
    - Use useEffect watcher + inFlightRef so it runs exactly once
  - **Pending Intent Keying Lock**: When setting pending intent, also store pending_signer_address + pending_signer_chainId. After auth resolves, only auto-run save if current signer matches those values; otherwise clear + show "Wallet changed; please click Save again."
  - _Requirements: 2.4, 5.2, 7.4, 7.5, 7.8_

### 8. Mobile Overflow Menu + Responsive Behavior

- [ ] 8. Overflow menu (mobile)
  - Create mobile overflow menu with proper content hierarchy
  - Implement focus trap, ESC closes and returns focus
  - Add 44px touch targets and safe-area padding for iOS
  - Include all session-state actions in logical order
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [ ] 8.1 Write property test for breakpoint responsiveness
  - **Property 4: Breakpoint Responsiveness**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.8**

- [ ] 8.2 Write property test for mobile overflow menu completeness
  - **Property 8: Mobile Overflow Menu Completeness**
  - **Validates: Requirements 6.2, 6.3, 6.4, 6.5, 6.6, 6.7**

### 9. Multi-chain Integration Consistency (WalletProvider contract)

- [ ] 9. Enforce single source of truth
  - Header does not maintain independent wallet state
  - Wallet/network changes propagate immediately via WalletContext
  - Portfolio-only selector enablement hard rule enforced
  - Handle Active_Network vs Signer_Network distinction properly
  - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.4, 2.1.5, 2.1.6, 2.1.8, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 9.1 Write property test for multi-chain integration consistency
  - **Property 3: Multi-Chain Integration Consistency**
  - **Validates: Requirements 2.1.1, 2.1.2, 2.1.4, 2.1.6, 15.1, 15.2**

### 10. Theming + Motion (Tokenized, professional)

- [ ] 10. Apply typography + tokens + transitions
  - Implement Inter/SF Pro typography system
  - Apply professional dark theme with WCAG AA contrast
  - Add smooth micro-interactions (150-220ms transitions)
  - Implement reduced motion support
  - Avoid heavy glass/gradients in header (keep clean, institutional)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.3, 9.4_

- [ ] 10.1 Write property test for theme toggle consistency
  - **Property 9: Theme Toggle Consistency**
  - **Validates: Requirements 5.1, 5.4, 8.7**

### 11. Accessibility (Global)

- [ ] 11. ARIA labels + keyboard nav + focus rings + announcements
  - Implement ARIA labels on all interactive elements
  - Add full keyboard navigation support with logical tab order
  - Create visible focus indicators
  - Add screen reader state change announcements
  - Test with axe-core for WCAG AA compliance
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 11.1 Write property test for accessibility compliance
  - **Property 11: Accessibility Compliance**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7**

### 12. Resilience + Error Boundaries

- [ ] 12. Error boundary + fallback header (still 64px height)
  - Create error boundaries for header components
  - Add loading states with skeleton placeholders
  - Implement fallback states for network failures
  - Add retry mechanisms for failed operations
  - Maintain 64px height even in error states
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12.1 Write property test for error state resilience
  - **Property 14: Error State Resilience**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

### 13. Performance

- [ ] 13. Memoization + stable keys + avoid remounts
  - Implement stable component keys to prevent re-mounts
  - Add proper memoization for expensive computations
  - Create efficient re-render prevention strategies
  - Add performance monitoring for <100ms render times
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 14.3, 14.5, 14.7_

- [ ] 13.1 Write property test for performance standards
  - **Property 12: Performance Standards**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4, 11.5**

### 14. Telemetry (No PII)

- [ ] 14. Emit events with required fields only
  - Implement analytics events: header_session_state_changed, header_wallet_pill_clicked, header_auth_action, header_hydration_completed, header_error_boundary_triggered
  - Include: route_key (matched key from getRouteContext, not pathname), device_class, session_state, wallet_present, wallet_count?, active_network?
  - Never include: raw address, ENS, email
  - Optional: salted hash for correlation if needed
  - **Telemetry Lock**: route_key = matched key from getRouteContext (e.g., '/harvestpro') not '/harvestpro/opportunities'
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 14.1 Write property test for telemetry event accuracy
  - **Property 13: Telemetry Event Accuracy**
  - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

### 15. Playwright Must-Pass Suite (System Invariants)

- [ ] 15. Add comprehensive E2E test scenarios
  - S0 → S2 connect wallet: shows pill + Save wallet CTA
  - S2 Save wallet when NOT logged in: triggers SIWE → then saves post-auth ✅ (critical)
  - S2 → S3 sign-in: hydrates registry once, pill shows active watch wallet
  - S3 signer ≠ active: shows mismatch indicator + "connect/switch wallet required" gate CTA
  - S3 network view switch: changes activeNetwork only, signerNetwork unchanged
  - Auth expiry S3 → S2/S0: transitions without flicker
  - /harvestpro and nested routes: render correct context
  - CLS invariance: header height + reserved widths stable through transitions
  - Mobile overflow focus trap + ESC restores focus
  - **Additional E2E Invariants**: Sign out from S3 → S2 keeps wallet pill (wallet stays connected) and shows "Save wallet" if registry no longer available
  - **Idempotency Test**: Double click Save wallet does not create duplicates (Idempotency-Key + 409 treated as success)
  - _Requirements: All system invariants_

### 16. Security + Anti-Phishing (LOCKED)

- [ ] 16. Security display standards
  - **Address Truncation**: Enforce address truncation everywhere (no full addr in UI)
  - **ENS Display Rules**: Detect confusable chars / mixed scripts → fall back to truncated address; show ENS only if passes safety check
  - **Avatar Safety**: Allowlist/proxy or force next/image safe loader; fallback to initials if invalid/blocked
  - **External Link Safety** (if any): rel=noopener, warning chip for unknown domains
  - _Requirements: 13.1, 13.2, 13.3, 13.5, 13.6_

- [ ] 16.1 Write property test for security display standards
  - **Property 10: Security Display Standards**
  - **Validates: Requirements 13.1, 13.2, 13.3, 13.5, 13.6**

## Notes

- Tasks marked with "*" are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties using fast-check (100+ iterations)
- Unit tests validate specific examples and edge cases using Vitest
- The implementation follows strict architectural constraints from v2.4.2 design
- Critical infrastructure locks (0.1, 0.2) must be completed before any other work