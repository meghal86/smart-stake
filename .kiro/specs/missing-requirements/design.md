# Design Document

## Overview

This design addresses 24 critical missing requirements identified through comprehensive UX audit for AlphaWhale's v1 launch, organized by screen-by-screen implementation mapping. The solution focuses on extending existing components and patterns rather than creating new ones, ensuring consistency and maintainability while achieving Apple-level trust, Robinhood-level reliability, and Stripe-grade QA.

## Implementation Strategy

### Search-First Approach (CRITICAL)
**Rule:** Only create new providers/components if a repo-wide search confirms none exist.

Before implementing any requirement:
1. **Search for existing implementation** (component/hook/provider/route)
2. **If found:** Extend/fix/wire the existing code
3. **If not found:** Only then create new implementation
4. **Verify:** No duplicates were introduced

### Component Reuse Priority
1. **Extend existing UI patterns** (banner, toast, modal, chip, skeleton)
2. **Modify over create** - prefer extending existing components
3. **Single source of truth** - global state lives in one provider/store
4. **Remove/disable broken affordances** - never leave inert interactions

### Guardrail Language Updates
- **Demo Mode:** Search for existing demo mode state/provider. If found, extend it. Only create a provider if none exists.
- **Performance Monitoring:** Search for existing performance utilities in `src/lib/performance/`. Extend existing monitoring.
- **System States:** Search for existing loading/error/empty components. Standardize using existing primitives.
- **Transaction Previews:** Search for existing modal components and transaction flows. Extend existing modals.

## Architecture

### Global State Management (Screen 0 - GLOBAL)

**Identity + Persistence System (Requirements 2, 16)**
```typescript
// Search for: src/contexts/AuthContext.tsx, src/lib/auth/, existing auth providers
// Extend existing auth provider to include identity visibility
interface IdentityState {
  status: 'guest' | 'authenticated';
  identifier?: string;
  persistsData: boolean;
  showTooltip: boolean;
}
```

**Wallet Context System (Requirements 3, 17)**
```typescript
// Search for: src/contexts/WalletContext.tsx, existing wallet providers
// Extend to include multi-wallet management and persistence
interface WalletState {
  active?: {
    address: string;
    label?: string; // ENS or nickname
    shortAddress: string;
  };
  list: WalletInfo[];
  isLoading: boolean;
  isSwitching: boolean;
}
```

**Demo Mode System (Requirement 4)**
```typescript
// Search for: existing demo/banner components, demo state management
// Only create DemoModeProvider if none exists after thorough search
interface DemoModeState {
  isActive: boolean;
  canExit: boolean;
  bannerVisible: boolean;
}
```

**Performance Monitoring (Requirements 1, 22)**
```typescript
// Search for: src/lib/performance/, existing monitoring utilities
// Extend existing performance monitoring - do not create parallel system
interface PerformanceState {
  memoryUsage: number;
  renderCount: number;
  // Track intervals/request dedupe in provider-local useRef registries (non-persisted)
  // Prefer React Query's request deduping/caching instead of custom requestQueue
}
```

### Global System States (R23) - Concrete Implementation

**Search Targets:**
- **Loading/Skeleton:** Skeleton, LoadingSpinner, Suspense, RouteLoader, PageShell
- **Empty state:** EmptyState, NoResults, ZeroState  
- **Error UI:** ErrorBoundary, InlineError, Toast, Alert
- **Disabled tooltip:** existing tooltip component (shadcn Tooltip) and button variants

**Implementation Pattern (no new parallel state):**

**Route Transitions:**
- Use existing App Router `loading.tsx` per route OR existing route loader in shell
- Requirement: loading feedback within 200ms

**Data Loads:**
- If using React Query/TanStack Query: rely on `isLoading/isFetching/isError` rather than new systemStates map
- Use consistent existing components:
  - LoadingState (skeleton)
  - ErrorState (message + retry)
  - EmptyState (explain + CTA)

**Disabled Interactions:**
- For "coming soon" / "requires wallet" / "requires sign-in":
  - Disable the control
  - Attach tooltip or inline helper text
  - Never leave clickable-but-inert UI

### Global Footer + About (R24) - Minimal v1

**Search Targets:** Footer, AppShell, Layout, Settings → About, existing legal link components

**v1 Placement Options (pick the one that already exists):**
- **Option A:** Add footer in main layout shell (best)
- **Option B:** Add "Legal & Support" section inside Settings (acceptable for v1 if no footer exists)

**Required Items:**
- Terms of Service
- Privacy Policy  
- Contact Support
- Report a Bug
- App version/build (Settings → About recommended)

**Note:** Legal pages may be new routes if they don't exist; everything else must reuse existing components.

### Monetization Pattern (R15) - Single Reusable Paywall

**Search Targets:** Pricing, Upgrade, Billing, Paywall, PlanBadge, Stripe, Modal/Drawer

**v1 Standard Pattern (one implementation only):**
1. Feature shows Pro badge
2. Click shows PaywallSheet (modal/drawer) with:
   - What's included
   - Why it's valuable (outcome framing)
   - Optional preview allowance (if applicable)
3. After preview limit: show upgrade CTA

**Rule:** Only one paywall component for the entire app.

## Screen-by-Screen Component Extensions

### Screen → Requirements Mapping (Implementation Guardrail)

- **GLOBAL:** R1–R7, R15, R19, R20, R21, R23, R24
- **HOME:** R8, R9 (+ identity/wallet/demo from GLOBAL)
- **GUARDIAN:** R10, R19 (+ wallet/identity/demo/system states from GLOBAL)
- **HUNTER:** R11, R18 (+ wallet/identity/demo/paywall/system states from GLOBAL)
- **HARVEST:** R12 (+ R19 intent preview + GLOBAL system states)
- **PORTFOLIO:** R13 (+ wallet/identity/demo/system states from GLOBAL)
- **SETTINGS:** R14, R15, R16, R17, R20, R21 (+ GLOBAL footer/about)

### 1. HOME (/) - Requirements 8, 9

**Search for existing:** `src/pages/Home.tsx` or `src/app/page.tsx`

**First-run + Outcomes System**
```typescript
// Extend existing home components
interface OutcomeTileProps {
  outcome: 'reduce-risk' | 'earn-safely' | 'save-taxes';
  nextAction: string;
  isAboveFold: boolean;
}

// Search for: existing CTA components, hero sections
// Extend existing home layout to include outcome tiles
```

**Metrics Transparency System**
```typescript
// Extend existing metrics components
interface MetricWithMethodologyProps {
  value: string | number;
  label: string;
  methodology: {
    definition: string;
    source: string;
    lastUpdated: Date;
  };
  showModal: boolean;
}

// Search for: existing metric cards, stat displays
// Extend to include methodology modals
```

### 2. GUARDIAN (/guardian) - Requirements 10, 19

**Search for existing:** `src/pages/Guardian.tsx`, `src/components/guardian/`

**Risk Education System**
```typescript
// Extend existing risk card components
interface RiskCardWithEducationProps {
  risk: RiskData;
  impact: {
    explanation: string; // Plain language
    severity: 'low' | 'medium' | 'high';
  };
  recommendedAction: {
    label: string;
    action: () => void;
    requiresPreview: boolean;
  };
}

// Search for: existing risk cards, security components
// Extend to include education and action guidance
```

**Transaction Preview System**
```typescript
// Extend existing modal components for transaction previews
interface TransactionPreviewModalProps {
  transaction: {
    chain: string;
    target?: string;
    action: string;
    value?: string;
    riskLevel: 'low' | 'medium' | 'high';
    riskExplanation: string;
  };
  walletScope: string; // "This affects Wallet X"
  onConfirm: () => void;
  onCancel: () => void;
}

// Search for: existing modals, confirmation dialogs
// Extend for pre-transaction confirmation
```

### 3. HUNTER (/hunter) - Requirements 11, 18

**Search for existing:** `src/pages/Hunter.tsx`, `src/components/hunter/`

**Quest Transparency System**
```typescript
// Extend existing opportunity/quest components
interface QuestPreviewModalProps {
  quest: QuestData;
  preview: {
    steps: string[];
    eligibility: string[];
    network: string;
    estimatedTime: string;
    outcome: string;
  };
  confidence: {
    percentage: number;
    explanation: string;
    factors: string[];
  };
}

// Search for: existing opportunity cards, quest components
// Extend to include preview modal before participation
```

**Filter Completeness System**
```typescript
// Extend existing filter components
interface FilterSystemProps {
  filters: {
    network: FilterOption[] | null; // null = hidden
    duration: FilterOption[] | null;
    minAPY: RangeFilter | null;
  };
  onClearAll: () => void;
  emptyState: {
    show: boolean;
    onReset: () => void;
  };
}

// Search for: existing filter components, search bars
// Extend or hide incomplete filters
```

### 4. HARVEST (/harvestpro) - Requirements 12

**Search for existing:** `src/pages/HarvestPro.tsx`, `src/components/harvestpro/`

**Tax Compliance System**
```typescript
// Extend existing harvest components
interface HarvestWithComplianceProps {
  disclaimer: {
    visible: boolean;
    text: string;
  };
  preview: {
    whatSells: string[];
    estimatedBenefit: number;
    estimatedCosts: {
      gas: number;
      slippage: number;
    };
    warnings: string[];
  };
  walletScope: string;
}

// Search for: existing harvest modals, opportunity cards
// Extend to include compliance and preview
```

### 5. PORTFOLIO (/portfolio) - Requirements 13

**Search for existing:** `src/pages/Portfolio.tsx`, `src/components/portfolio/`

**Scope + Freshness System**
```typescript
// Extend existing portfolio components
interface PortfolioWithScopeProps {
  scope: {
    current: 'single-wallet' | 'all-wallets';
    toggle: () => void;
    comingSoon: boolean;
  };
  freshness: {
    lastUpdated: Date;
    onRefresh: () => void;
    isRefreshing: boolean;
  };
  search: {
    enabled: boolean;
    placeholder?: string;
    disabledTooltip?: string;
  };
}

// Search for: existing portfolio layout, data displays
// Extend to include scope toggle and freshness indicators
```

### 6. SETTINGS (/settings) - Requirements 14, 15

**Search for existing:** `src/pages/Settings.tsx`, `src/components/settings/`

**Account Management System**
```typescript
// Extend existing settings components
interface AccountSectionProps {
  identity: {
    status: 'guest' | 'authenticated';
    explanation: string;
    recovery: {
      method: string;
      instructions: string;
    };
  };
  billing: {
    plan: 'free' | 'pro';
    boundaries: string[];
    upgradeAction?: () => void;
    comingSoon: boolean;
  };
  saveState: {
    isLoading: boolean;
    showToast: boolean;
    toastType: 'success' | 'error';
  };
}

// Search for: existing settings sections, account components
// Extend to include identity management and billing
```

## Components and Interfaces

### Global Component Extensions

**Extend Existing Banner Component**
```typescript
// Search for: existing banner/notification components
interface ExtendedBannerProps {
  type: 'demo' | 'info' | 'warning' | 'error';
  sticky?: boolean;
  dismissible?: boolean;
  content: {
    icon?: string;
    text: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}
```

**Extend Existing Modal Component**
```typescript
// Search for: existing modal components
interface ExtendedModalProps {
  type: 'confirmation' | 'preview' | 'info' | 'methodology';
  riskLevel?: 'low' | 'medium' | 'high';
  walletScope?: string;
  methodology?: {
    definition: string;
    source: string;
    calculation: string;
  };
}
```

**Extend Existing Button Component**
```typescript
// Search for: existing button components
interface ExtendedButtonProps {
  disabled?: boolean;
  disabledTooltip?: string;
  loading?: boolean;
  loadingText?: string;
  feedback: {
    type: 'toast' | 'modal' | 'state-change';
    message?: string;
  };
}
```

**Extend Existing Toast Component**
```typescript
// Search for: existing toast/notification components
interface ExtendedToastProps {
  type: 'success' | 'error' | 'info' | 'warning';
  context?: {
    screen: string;
    action: string;
  };
  retry?: {
    enabled: boolean;
    action: () => void;
  };
}
```

## Data Models

### Global State Schema Extensions

```typescript
// Extend existing app state - do not create parallel global state
interface ExtendedGlobalState {
  identity: {
    status: 'guest' | 'authenticated';
    identifier?: string;
    persistsData: boolean;
    tooltipShown: boolean;
  };
  
  wallet: {
    active?: WalletInfo;
    list: WalletInfo[];
    isLoading: boolean;
    isSwitching: boolean;
    lastSwitchTime?: Date;
  };
  
  demo: {
    isActive: boolean;
    bannerDismissed: boolean;
    canExit: boolean;
  };
  
  performance: {
    memoryBaseline: number;
    currentMemory: number;
    renderCount: number;
    // Use provider-local useRef registries for intervals/timers (non-persisted)
  };
  
  // Use React Query/TanStack Query isLoading/isFetching/isError/data and existing Skeleton/Error/Empty components
  // If not using React Query, use component-local state only; do not build a global systemStates store
}
```

### Screen-Specific State Extensions

```typescript
// Home screen state extensions
interface HomeStateExtensions {
  outcomes: {
    tiles: OutcomeTile[];
    aboveFold: boolean;
  };
  metrics: {
    values: Map<string, MetricWithMethodology>;
    methodologyModals: Map<string, boolean>;
  };
}

// Guardian screen state extensions
interface GuardianStateExtensions {
  risks: {
    cards: RiskCardWithEducation[];
    walletScope: string;
  };
  transactions: {
    pendingPreview?: TransactionPreview;
    previewRequired: boolean;
  };
}

// Hunter screen state extensions
interface HunterStateExtensions {
  quests: {
    items: QuestWithPreview[];
    previewModal?: QuestPreview;
  };
  filters: {
    available: FilterConfig;
    applied: FilterState;
    emptyState: boolean;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: System Performance Stability
*For any* continuous user session lasting 5+ minutes with repeated interactions, the system response time should remain within acceptable bounds without degradation
**Validates: Requirements R1-AC1, R22-AC1**

### Property 2: Memory Consumption Stability  
*For any* extended user session, memory usage should remain stable without continuous growth indicating memory leaks
**Validates: Requirements R1-AC2**

### Property 3: Route Transition Responsiveness
*For any* route transition, loading feedback should appear within 200ms to prevent blank screens
**Validates: Requirements R1-AC3**

### Property 4: Identity Indicator Consistency
*For any* screen in the application, the identity indicator should be present and show correct status (guest/authenticated)
**Validates: Requirements R2-AC1**

### Property 5: Wallet Indicator Consistency
*For any* screen in the application, when a wallet is connected, the active wallet indicator should be present with correct format (ENS/nickname + short address)
**Validates: Requirements R3-AC1**

### Property 6: Wallet Switching State Reset
*For any* wallet switch operation, all wallet-scoped data should be cleared and refreshed to prevent stale cross-wallet information
**Validates: Requirements R3-AC2**

### Property 7: Demo Mode Banner Consistency
*For any* screen when demo mode is active, the demo banner should be visible with consistent messaging
**Validates: Requirements R4-AC1**

### Property 8: Interactive Element Feedback
*For any* interactive element in the application, clicking should produce immediate visible feedback (action/modal/toast/disabled tooltip)
**Validates: Requirements R5-AC1**

### Property 9: Focus State Accessibility
*For any* interactive element, keyboard focus should produce visible focus state for accessibility compliance
**Validates: Requirements R7-AC1**

### Property 10: Metrics Definition Completeness
*For any* headline metric displayed, there should be an associated definition and source available to the user
**Validates: Requirements R9-AC1**

### Property 11: Authentication Accessibility
*For any* screen in the application, authentication entry point should be reachable within 2 taps maximum
**Validates: Requirements R16-AC1**

### Property 12: Transaction Preview Security
*For any* wallet signature/approval/transaction request, an intent preview modal should appear before the wallet interaction
**Validates: Requirements R19-AC1**

### Property 13: Loading State Responsiveness
*For any* data loading operation, loading state should appear within 200ms to provide immediate user feedback
**Validates: Requirements R23-AC1**

### Property 14: Empty State Clarity
*For any* empty data condition, an explicit empty state with clear next action should be displayed
**Validates: Requirements R23-AC2**

### Property 15: Global Footer Consistency
*For any* screen in the application, the global footer should be accessible with all required links (Terms, Privacy, Support, Bug Report)
**Validates: Requirements R24-AC1**

## Error Handling

### Performance Error Recovery
- Memory leak detection with automatic cleanup
- Render loop detection with circuit breaker
- Request deduplication to prevent storms
- Graceful degradation when performance thresholds exceeded

### State Management Error Recovery
- Wallet switching failures with rollback to previous state
- Demo mode toggle failures with clear error messaging
- Authentication failures with retry mechanisms
- Data loading failures with cached fallbacks

### UI Error Recovery
- Missing component fallbacks with error boundaries
- Broken interactive elements disabled with explanatory tooltips
- Failed route transitions with navigation recovery
- Accessibility failures with keyboard navigation fallbacks

## Testing Strategy

### Property-Based Testing
- Use fast-check library for universal property validation
- Test performance properties with automated interaction simulation
- Test UI consistency properties across all screens
- Test state management properties with random state transitions
- Minimum 100 iterations per property test

### Unit Testing
- Test individual component extensions and modifications
- Test state management utilities and context providers
- Test performance monitoring utilities
- Test error handling and recovery mechanisms
- Focus on edge cases and error conditions

### Integration Testing
- Test complete user flows across multiple screens
- Test wallet switching with data refresh
- Test demo mode transitions
- Test authentication flows
- Test transaction preview flows

### End-to-End Testing
- Test critical user journeys from first visit to task completion
- Test accessibility compliance with keyboard navigation
- Test performance under realistic usage patterns
- Test error recovery scenarios
- Test mobile and desktop responsive behavior

### Manual Testing Checklist
- "Touch everything" audit to verify no inert interactions
- Performance testing with 5+ minute continuous usage
- Memory profiling during extended sessions
- Accessibility testing with screen readers
- Cross-browser and cross-device compatibility testing

## Implementation Workflow

### Required Workflow for Each Requirement

For each requirement (R#):
1. **Locate existing implementation** (component/hook/provider)
2. **Decide:** Fix/Wire vs Extend vs New (only if none exists)
3. **Implement** using existing UI primitives (buttons, modals, toasts, skeletons)
4. **Add verification** (unit/E2E/manual checklist)
5. **Confirm no duplicates** were introduced

### Acceptance Standard
If the code already exists anywhere, the final change must be a refactor/extension of that code — not a new parallel version.

## Implementation Phases

### Phase 0: P0 Critical (Launch Gate Requirements)
**Must Pass Before Launch:**
- [ ] PERF-01 stable (no freezes) - R1, R22
- [ ] No inert CTAs anywhere - R5
- [ ] Terms + Privacy live and linked - R6
- [ ] Harvest tax disclaimer + pre-action preview - R12
- [ ] Guardian pre-transaction confirmation - R10, R19
- [ ] Identity state visible (Guest/Signed in) - R2
- [ ] Active wallet visible everywhere - R3
- [ ] Demo mode consistent banner - R4

### Phase 1: Global Infrastructure (Requirements R2-R7)
1. Identity state visibility and management
2. Active wallet consistency across screens
3. Demo mode clarity and consistency
4. Interactive element reliability
5. Support and compliance infrastructure
6. Accessibility baseline implementation

### Phase 2: Screen-Specific UX (Requirements R8-R15)
1. **Home (/):** First-run experience + metrics transparency
2. **Guardian (/guardian):** Risk education + wallet scope
3. **Hunter (/hunter):** Quest transparency + filters
4. **Harvest (/harvestpro):** Tax compliance + preview
5. **Portfolio (/portfolio):** Scope clarity + freshness
6. **Settings (/settings):** Account management + billing

### Phase 3: Advanced Features (Requirements R16-R21)
1. Authentication flows and session management
2. Multi-wallet management and persistence
3. Transaction intent and risk preview system
4. Privacy, analytics, and telemetry disclosure
5. Launch support readiness (FAQ + status)

## Success Metrics

### Performance Metrics
- Zero application freezes during 5+ minute sessions
- Memory usage remains stable (no continuous growth)
- Route transitions show loading within 200ms
- Interactive elements respond within 100ms

### User Experience Metrics
- 100% of interactive elements provide feedback
- Identity status visible on 100% of screens
- Demo mode clearly indicated when active
- Support accessible within 2 taps from any screen

### Compliance Metrics
- All accessibility requirements met (WCAG AA)
- All legal/privacy requirements implemented
- All transaction previews show before wallet interactions
- All metrics have methodology explanations

### Quality Metrics
- Zero inert interactive elements
- Zero silent failures (all actions provide feedback)
- 100% test coverage for correctness properties
- All error states have recovery paths

## Screen Implementation Priority

Based on user impact and launch criticality:

1. **Global Infrastructure** (affects all screens) - R1-R7, R22-R24
2. **Home** (first impression, highest traffic) - R8-R9
3. **Guardian** (security-critical, transaction safety) - R10, R19
4. **Harvest** (financial compliance, legal requirements) - R12
5. **Hunter** (engagement, monetization) - R11, R18
6. **Portfolio** (data clarity, trust) - R13
7. **Settings** (account management, support) - R14-R17, R20-R21

## Implementation Workflow Template

### For Each Requirement (R#):
1. **Search Phase:**
   - Search codebase for existing implementation
   - Document what exists vs what's missing
   - Identify extension points

2. **Decision Phase:**
   - Fix/Wire existing code (preferred)
   - Extend existing component (acceptable)
   - Create new (only if none exists)

3. **Implementation Phase:**
   - Use existing UI primitives
   - Follow established patterns
   - Maintain consistency

4. **Verification Phase:**
   - Add test or manual checklist
   - Verify no duplicates created
   - Confirm requirement satisfied

5. **Documentation Phase:**
   - Update component documentation
   - Note any breaking changes
   - Record implementation decisions
