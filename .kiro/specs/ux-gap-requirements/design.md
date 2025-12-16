# Design Document: AlphaWhale UX Gap Improvements

## 🚨 SCOPE LOCK — READ BEFORE IMPLEMENTATION

This work is strictly limited to UX gap remediation and quality fixes.

### ABSOLUTELY FORBIDDEN
- ❌ Creating new pages, screens, or routes
- ❌ Creating new product features or flows  
- ❌ Creating new data models, schemas, or APIs
- ❌ Adding new widgets, dashboards, or analytics
- ❌ Renaming or restructuring existing product concepts
- ❌ Introducing new demo data beyond labeling existing demo data

### ALLOWED ONLY
- ✅ Fixing incorrect routing to canonical routes
- ✅ Adding loading, skeleton, error, and disabled states
- ✅ Standardizing existing components (button, skeleton, toast)
- ✅ Validating and guarding existing data display (e.g., gas, metrics)
- ✅ Adding banners, tooltips, microcopy, and transitions
- ✅ Adding tests that enforce existing requirements

### TRACEABILITY RULE
Every code change MUST reference:
- A Requirement ID (e.g. `R3.GAS.NONZERO`)
- A Design section (e.g. `Design → Data Integrity → Gas Oracle Rules`)

If a change cannot be traced to an explicit requirement or design section, **IT MUST NOT BE IMPLEMENTED.**

### FAILURE MODE
If the implementation requires guessing, inventing, or adding new structures:
- STOP
- ASK for clarification  
- DO NOT PROCEED

## Overview

This design document outlines the technical architecture and implementation approach for addressing critical UX gaps in the AlphaWhale platform. The design focuses on creating a premium, trustworthy user experience through systematic improvements to navigation, data integrity, loading states, micro-interactions, and user feedback systems.

The solution employs a layered architecture with global UX foundations, component standardization, and comprehensive error handling to transform AlphaWhale from a functional DeFi tool into a billion-dollar-quality platform.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Global UX Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Navigation Router │  Loading Manager │  Error Boundary     │
│  Demo/Live Toggle  │  Animation System│  Toast System       │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Component Standards Layer                   │
├─────────────────────────────────────────────────────────────┤
│  PrimaryButton    │  Skeleton System │  Trust Signals      │
│  Form Validation  │  Micro-copy      │  Progress Indicators │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Integrity Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Gas Oracle       │  Demo Data       │  Proof Links        │
│  Timestamp System │  Cache Manager   │  Telemetry          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Home Dashboard   │  Hunter Feed     │  Guardian Scan      │
│  Settings Panel   │  Portfolio View  │  HarvestPro         │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Architecture

The navigation system implements a centralized router with strict route enforcement based on the Canonical Routes table from requirements:

| Route | Destination | Default Tab | Allowed Tabs |
|-------|-------------|-------------|--------------|
| `/` | Home Dashboard | N/A | N/A |
| `/guardian` | Guardian Scan | `scan` | `scan`, `risks`, `alerts`, `history` |
| `/hunter` | Hunter Feed | `all` | `all`, `airdrops`, `quests`, `yield` |
| `/harvestpro` | HarvestPro Dashboard | N/A | N/A |
| `/portfolio` | Portfolio Overview | N/A | N/A |
| `/settings` | User Settings | N/A | N/A |

#### Route Canonicalization & Enforcement

```typescript
type RouteId = "home" | "guardian" | "hunter" | "harvestpro" | "portfolio" | "settings";
type CanonicalTab = "scan" | "risks" | "alerts" | "history" | "all" | "airdrops" | "quests" | "yield";

interface CanonicalRoute {
  id: RouteId;
  path: string;          // e.g. "/hunter"
  tab?: CanonicalTab;    // normalized from query param
  canonicalUrl: string;  // e.g. "/hunter?tab=quests"
}

interface RouteCanonicalizer {
  canonicalize(inputUrl: string): CanonicalRoute;
  isValid(inputUrl: string): boolean;
}
```

**Canonicalization Rules:**
1. **Missing tabs**: `/guardian` → `/guardian?tab=scan`
2. **Invalid tabs**: `/hunter?tab=foo` → `/hunter?tab=all` + toast: "Invalid tab — showing All opportunities"
3. **Deterministic**: Canonicalization MUST NOT be overridden by stale UI state

### Data Flow Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   UI Layer  │───▶│ UX Manager  │───▶│ Data Layer  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Interactions│    │Loading/Error│    │ Live/Demo   │
│ Animations  │    │ States      │    │ Data        │
│ Feedback    │    │ Validation  │    │ Sources     │
└─────────────┘    └─────────────┘    └─────────────┘
```

### No Silent Clicks Contract

All interactive elements MUST resolve to one of: navigation, modal, toast, tooltip, loading, or disabled explanation.

**Implementation Requirements:**
- Any element with `role="button"` or `<button>` MUST have:
  - `onClick` (with real effect), OR
  - `href`, OR  
  - `disabledReason` (tooltip content) if disabled
- In dev mode, violations MUST log error and highlight the element
- Runtime validation prevents "Click for proof →" doing nothing

```typescript
interface ClickableContract {
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  disabledReason?: string;
  loading?: boolean;
}
```

### AppShell Persistence (No White Flash)

**Implementation Guarantee:**
- AppShell layout persists across route changes
- Route content transitions inside `<main>` only
- Skeleton shows inside `<main>` while shell remains stable
- Header and bottom nav NEVER unmount during navigation

## Components and Interfaces

### Core UX Manager

```typescript
interface UXManager {
  // Navigation Management
  router: NavigationRouter;
  routeValidator: RouteValidator;
  
  // Loading State Management
  loadingManager: LoadingStateManager;
  skeletonSystem: SkeletonSystem;
  
  // Data Integrity
  demoModeManager: DemoModeManager;
  dataValidator: DataValidator;
  
  // User Feedback
  toastSystem: ToastSystem;
  animationSystem: AnimationSystem;
  microcopyManager: MicrocopyManager;
}
```

### Navigation Router Interface

```typescript
interface NavigationRouter {
  navigate(path: string, options?: NavigationOptions): Promise<void>;
  validateRoute(path: string): RouteValidationResult;
  getCurrentRoute(): RouteInfo;
  handleBrowserNavigation(): void;
  enforceCanonicalRoutes(): void;
}

interface RouteValidationResult {
  isValid: boolean;
  canonicalPath?: string;
  redirectRequired?: boolean;
  errorMessage?: string;
}
```

### Loading State Manager

```typescript
interface LoadingStateManager {
  showLoading(context: LoadingContext): void;
  hideLoading(context: LoadingContext): void;
  updateProgress(context: LoadingContext, progress: number): void;
  setLoadingMessage(context: LoadingContext, message: string): void;
}

interface LoadingContext {
  id: string;
  type: 'navigation' | 'async-action' | 'data-fetch';
  timeout?: number;
  showProgress?: boolean;
}
```

### Demo Mode Manager

```typescript
interface DemoModeManager {
  isDemo(): boolean;
  setMode(mode: 'demo' | 'live'): void;
  getDemoData(key: string): any;
  validateLiveDataSources(): Promise<DataSourceStatus>;
  showDemoBanner(): void;
  hideDemoBanner(): void;
}

interface DataSourceStatus {
  gasOracle: boolean;
  coreAPI: boolean;
  moduleAPIs: Record<string, boolean>;
  overall: boolean;
}
```

#### Live Mode Readiness Policy

Live mode is enabled automatically ONLY if:
- Wallet is connected, AND
- `gasOracle === true`, AND  
- `coreAPI === true`, AND
- At least one module API is reachable (`guardian` OR `hunter` OR `harvestpro`)

If not ready, force Demo Mode with banner: "Demo Mode — live data temporarily unavailable" + CTA to retry/connect.

#### Gas Oracle Rules
- Refresh every 30 seconds
- Cache TTL 60 seconds  
- Reject `null`/`0`/`>1000 gwei` → display "Gas unavailable" and emit telemetry

## Data Models

### UX State Model

```typescript
interface UXState {
  navigation: {
    currentRoute: string;
    activeTab?: string;
    isNavigating: boolean;
    routeHistory: string[];
  };
  
  loading: {
    activeContexts: LoadingContext[];
    globalLoading: boolean;
  };
  
  dataMode: {
    mode: 'demo' | 'live';
    bannerVisible: boolean;
    dataSourceStatus: DataSourceStatus;
  };
  
  interactions: {
    animations: {
      reducedMotion: boolean;
      globalAnimationState: boolean;
    };
    feedback: {
      toasts: ToastMessage[];
      celebrations: CelebrationState[];
    };
  };
}
```

### Component State Models

```typescript
interface ButtonState {
  variant: 'primary' | 'secondary' | 'ghost';
  loading: boolean;
  disabled: boolean;
  size: 'sm' | 'md' | 'lg';
  animation: {
    scale: number;
    duration: number;
  };
}

interface FormFieldState {
  value: any;
  error?: string;
  touched: boolean;
  validating: boolean;
  valid: boolean;
}

interface TrustSignalState {
  type: 'audit' | 'methodology' | 'certification';
  verified: boolean;
  proofUrl?: string;
  lastUpdated: Date;
  loading: boolean;
}
```

### Component Standardization Enforcement

**Import Path Standards:**
- `@/components/ux/PrimaryButton` - Single source for all primary CTAs
- `@/components/ux/Skeleton` - Unified loading states with consistent shimmer
- `@/components/ux/Toast` - Standardized success/error/info notifications

**ESLint Rules:**
- Disallow `<button className="...">` for primary CTAs unless inside PrimaryButton
- Require `loadingText` and `successText` props for all async buttons
- Enforce consistent animation timing across components

**Design Decisions:**
- All async buttons must support `loading`, `success`, and `error` states
- All skeleton loaders must use the same shimmer animation and border radius
- All toast notifications must use predefined templates (success=green, error=red, info=blue)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Navigation Route Consistency
*For any* navigation action, the resulting route must match the canonical route mapping and never redirect to incorrect destinations
**Validates: R1.ROUTING.CANONICAL, R1.ROUTING.DETERMINISTIC, R1.ROUTING.INVALID_PARAMS**

### Property 2: Loading State Responsiveness  
*For any* async action, loading feedback must appear within 100ms and provide appropriate user feedback throughout the operation
**Validates: R2.LOADING.100MS, R2.LOADING.DESCRIPTIVE, R2.LOADING.SUCCESS_FAILURE**

### Property 3: Data Integrity Validation
*For any* displayed data value, it must never show placeholder values (like "0 gwei") and must clearly indicate its source (demo vs live)
**Validates: R3.GAS.NONZERO, R3.GAS.FALLBACK, R3.DEMO.LABELING**

### Property 4: Animation Consistency
*For any* interactive element, animations must follow consistent timing, easing, and visual feedback patterns across the application
**Validates: R4.ANIMATION.BUTTON_SCALE, R4.ANIMATION.CARD_LIFT, R4.ANIMATION.TIMING**

### Property 5: Form Validation Immediacy
*For any* form field interaction, validation feedback must appear immediately on blur and provide clear, actionable error messages
**Validates: R6.VALIDATION.IMMEDIATE, R6.VALIDATION.CLEAR_MESSAGES, R6.VALIDATION.SAVE_STATES**

### Property 6: Component Standardization
*For any* UI component type (buttons, skeletons, toasts), all instances must use the same underlying component system and styling
**Validates: R13.COMPONENTS.SINGLE_BUTTON, R13.COMPONENTS.SINGLE_SKELETON, R13.COMPONENTS.SINGLE_TOAST**

### Property 7: Trust Signal Verification
*For any* trust badge or proof link, it must resolve to actual verification content and never be a broken or placeholder link
**Validates: R10.TRUST.AUDIT_LINKS, R10.TRUST.METHODOLOGY, R14.TRUST.METRICS_PROOF**

### Property 8: Error Message Humanization
*For any* error condition, the displayed message must use encouraging, human-friendly language rather than technical jargon
**Validates: R16.MICROCOPY.HUMANIZED_ERRORS, R16.MICROCOPY.ENCOURAGING, R15.ERROR.CLEAR_MESSAGES**

### Property 9: Demo Mode Clarity
*For any* demo state, the mode must be clearly indicated with persistent banners and never mixed with live data without indication
**Validates: R3.DEMO.BANNER_PERSISTENT, R3.DEMO.NEVER_MIXED, R3.DEMO.AUTO_SWITCHING**

### Property 10: Interaction Feedback Completeness
*For any* clickable element, it must provide immediate feedback through navigation, modal, toast, tooltip, loading state, or disabled explanation
**Validates: R13.NO_SILENT_CLICKS, R2.LOADING.CTA_FEEDBACK, R8.GATING.DISABLED_TOOLTIPS**

## Error Handling

### Error Boundary Strategy

```typescript
interface ErrorBoundaryConfig {
  fallbackComponent: React.ComponentType<ErrorFallbackProps>;
  onError: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  isolateErrors?: boolean;
}

// Global Error Boundary
<ErrorBoundary config={globalErrorConfig}>
  <App />
</ErrorBoundary>

// Feature-Level Error Boundaries
<ErrorBoundary config={featureErrorConfig}>
  <HunterFeed />
</ErrorBoundary>
```

### Error Recovery Mechanisms

```typescript
interface ErrorRecoverySystem {
  // Automatic Recovery
  retryFailedRequests(maxRetries: number): Promise<void>;
  fallbackToCache(): void;
  gracefulDegradation(): void;
  
  // User-Initiated Recovery
  showRetryButton(): void;
  provideFallbackActions(): void;
  escalateToSupport(): void;
}
```

### Error Classification

```typescript
enum ErrorSeverity {
  LOW = 'low',        // Non-blocking, show toast
  MEDIUM = 'medium',  // Blocking, show modal with retry
  HIGH = 'high',      // Critical, show error page with support
  CRITICAL = 'critical' // System failure, show maintenance page
}

interface ErrorContext {
  severity: ErrorSeverity;
  component: string;
  action: string;
  recoverable: boolean;
  userMessage: string;
  technicalDetails: string;
}
```

## Testing Strategy

### Unit Testing Approach

**Component Testing:**
- Test each standardized component (PrimaryButton, Skeleton, Toast) in isolation
- Verify animation properties and timing
- Test loading and disabled states
- Validate accessibility attributes

**State Management Testing:**
- Test UX state transitions
- Verify demo/live mode switching
- Test navigation state management
- Validate form state handling

**Utility Function Testing:**
- Test route validation logic
- Test data validation functions
- Test animation timing calculations
- Test error message generation

### Property-Based Testing Implementation

Using **fast-check** library for property-based testing:

```typescript
import * as fc from 'fast-check';

// Property 1: Navigation Route Consistency
describe('Feature: ux-gap-requirements, Property 1: Navigation Route Consistency', () => {
  test('navigation always routes to correct canonical paths', () => {
    fc.assert(
      fc.property(
        fc.oneof(...Object.keys(CANONICAL_ROUTES).map(fc.constant)),
        (routePath) => {
          const result = navigationRouter.navigate(routePath);
          const canonicalRoute = CANONICAL_ROUTES[routePath];
          expect(result.finalPath).toBe(canonicalRoute.path);
          expect(result.component).toBe(canonicalRoute.component);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Property 2: Loading State Responsiveness
describe('Feature: ux-gap-requirements, Property 2: Loading State Responsiveness', () => {
  test('async actions show loading feedback within 100ms', () => {
    fc.assert(
      fc.property(
        fc.record({
          actionType: fc.oneof(fc.constant('navigation'), fc.constant('wallet-connect'), fc.constant('data-fetch')),
          timeout: fc.integer({ min: 1000, max: 10000 })
        }),
        async (action) => {
          const startTime = performance.now();
          const loadingPromise = triggerAsyncAction(action);
          
          // Wait for loading state to appear
          await waitFor(() => {
            expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
          });
          
          const loadingTime = performance.now() - startTime;
          expect(loadingTime).toBeLessThan(100);
        }
      ),
      { numRuns: 50 }
    );
  });
});
```

### Integration Testing Strategy

**Cross-Component Integration:**
- Test navigation + loading state coordination
- Test demo mode + data display integration
- Test error handling + user feedback integration
- Test animation + accessibility integration

**API Integration Testing:**
- Test gas oracle integration with fallback handling
- Test demo/live data source switching
- Test proof link resolution
- Test telemetry event firing

### End-to-End Testing Approach

**Critical User Flows:**
- Complete navigation journey across all major routes
- Demo to live mode transition with wallet connection
- Error recovery flows with retry mechanisms
- Form submission with validation and feedback
- Trust signal verification flows

**Performance Testing:**
- Page load time measurements
- Animation performance monitoring
- Loading state timing validation
- Memory usage during state transitions

### Accessibility Testing

**Automated Testing:**
- axe-core integration for WCAG compliance
- Keyboard navigation testing
- Screen reader compatibility testing
- Color contrast validation

**Manual Testing:**
- Focus management during navigation
- Animation respect for reduced motion preferences
- Error message clarity for assistive technologies
- Touch target size validation on mobile devices

## Implementation Phases

### Phase 1: Foundation Layer (Weeks 1-2)
- Implement NavigationRouter with canonical route enforcement
- Create LoadingStateManager with universal feedback system
- Build DemoModeManager with clear mode switching
- Establish error boundary system with recovery mechanisms

### Phase 2: Component Standardization (Weeks 3-4)
- Develop unified PrimaryButton component with animations
- Create Skeleton system with consistent styling
- Build Toast system with success/error/info templates
- Implement form validation system with immediate feedback

### Phase 3: Data Integrity (Weeks 5-6)
- Integrate gas oracle with validation and fallback
- Implement proof link system with methodology modals
- Create timestamp system with relative/absolute display
- Build telemetry system for error tracking

### Phase 4: Polish & Delight (Weeks 7-8)
- Implement micro-interaction animations
- Add celebration states and humanized copy
- Create trust signal verification system
- Optimize performance and accessibility

### Phase 5: Testing & Validation (Weeks 9-10)
- Comprehensive property-based test implementation
- Integration and E2E test coverage
- Performance optimization and monitoring
- Accessibility compliance validation

## Performance Considerations

### Loading Performance
- Skeleton states must render within 200ms
- Page transitions should complete within 1 second
- Animation frame rates must maintain 60fps
- Bundle size impact should be minimized

### Memory Management
- UX state should be efficiently managed
- Animation cleanup to prevent memory leaks
- Event listener cleanup on component unmount
- Cache management for demo/live data

### Network Optimization
- Gas oracle requests should be batched and cached
- Proof link prefetching for trust signals
- Graceful degradation for slow connections
- Retry logic with exponential backoff

## Security Considerations

### Data Validation
- All external data sources must be validated
- User input sanitization in forms
- URL validation for proof links
- XSS prevention in dynamic content

### Privacy Protection
- No sensitive data in error logs
- Anonymized telemetry events
- Secure handling of wallet connection states
- GDPR compliance for user preferences

### Trust Signal Integrity
- Verification of audit report authenticity
- Secure proof link resolution
- Protection against spoofed trust badges
- Regular validation of external certifications

## Monitoring and Observability

### Performance Metrics
- Page load times (P95 < 1s)
- Animation frame rates (>60fps)
- Loading state response times (<100ms)
- Error recovery success rates

### User Experience Metrics
- Navigation success rates
- Form completion rates
- Error message effectiveness
- Trust signal engagement

### Technical Metrics
- API response times
- Cache hit rates
- Error boundary activation rates
- Accessibility compliance scores

This design provides a comprehensive foundation for implementing the UX gap improvements while maintaining system reliability, performance, and user trust.