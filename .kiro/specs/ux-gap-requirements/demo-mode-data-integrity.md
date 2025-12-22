# Demo Mode & Data Integrity System Specification

## Overview

This specification details the implementation of Task 3: Demo Mode & Data Integrity System from the UX Gap Requirements. This task is foundational for establishing trust and data transparency across the AlphaWhale platform.

## Scope

### In Scope
- ✅ Create `DemoModeManager` with automatic mode switching based on wallet connection
- ✅ Add persistent demo banner component with "Connect Wallet for Live Data" CTA
- ✅ Integrate existing `useNetworkStatus` hook for gas validation (already prevents "0 gwei")
- ✅ Add data source validation for live mode readiness using existing infrastructure
- ✅ Create demo banner component that appears across all pages when in demo mode

### Out of Scope
- ❌ Creating new data sources or APIs
- ❌ Modifying existing demo data content
- ❌ Adding new data models or schemas
- ❌ Creating new backend infrastructure

## Requirements Mapping

This spec implements:
- **R3.DEMO.BANNER_PERSISTENT**: Persistent demo banner across all pages
- **R3.GAS.NONZERO**: Gas never displays "0 gwei" (already handled)
- **R3.GAS.FALLBACK**: Gas fallback handling with telemetry
- **R3.DEMO.AUTO_SWITCHING**: Automatic demo/live mode switching
- **R3.DEMO.LABELING**: Clear demo data labeling
- **R3.DEMO.NEVER_MIXED**: Demo and live data never mixed without indication

## Technical Implementation

### 1. Demo Mode Manager

**Location**: `src/lib/ux/DemoModeManager.ts`

```typescript
interface DemoModeManager {
  // Core state management
  isDemo(): boolean
  setMode(mode: 'demo' | 'live'): void
  getMode(): 'demo' | 'live'
  
  // Data source validation
  validateLiveDataSources(): Promise<DataSourceStatus>
  checkReadiness(): Promise<boolean>
  
  // Banner management
  shouldShowBanner(): boolean
  getBannerMessage(): string
  getBannerCTA(): string
  
  // Event handling
  onWalletConnect(): void
  onWalletDisconnect(): void
  onDataSourceChange(source: string, status: boolean): void
}

interface DataSourceStatus {
  gasOracle: boolean
  coreAPI: boolean
  guardianAPI: boolean
  hunterAPI: boolean
  harvestproAPI: boolean
  overall: boolean
}
```

**Live Mode Readiness Policy**:
```typescript
// Live mode enabled ONLY if:
// 1. Wallet is connected AND
// 2. gasOracle === true AND
// 3. coreAPI === true AND
// 4. At least one module API is reachable
const isLiveModeReady = (
  walletConnected: boolean,
  sources: DataSourceStatus
): boolean => {
  return walletConnected && 
         sources.gasOracle && 
         sources.coreAPI && 
         (sources.guardianAPI || sources.hunterAPI || sources.harvestproAPI)
}
```

### 2. Demo Banner Component

**Location**: `src/components/ux/DemoBanner.tsx`

```typescript
interface DemoBannerProps {
  message?: string
  ctaText?: string
  onCtaClick?: () => void
  variant?: 'demo' | 'unavailable'
  dismissible?: boolean
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  message = "Demo Mode — Data is simulated",
  ctaText = "Connect Wallet for Live Data",
  onCtaClick,
  variant = 'demo',
  dismissible = false
}) => {
  // Implementation with:
  // - Persistent positioning (top of viewport)
  // - Smooth slide-in/out animations
  // - Accessibility (ARIA labels, keyboard navigation)
  // - Mobile responsive design
}
```

**Banner Variants**:
- **Demo Mode**: "Demo Mode — Data is simulated" + "Connect Wallet for Live Data"
- **Unavailable**: "Demo Mode — Live data temporarily unavailable" + "Retry"
- **Connecting**: "Connecting to live data..." (loading state)

### 3. Gas Price Integration

**Location**: Integrate with existing `src/hooks/useNetworkStatus.ts`

**Current Implementation Check**:
```typescript
// Verify existing useNetworkStatus already handles:
// - Never returns "0 gwei"
// - Has fallback handling
// - Refreshes every 30 seconds
// - Shows "Gas unavailable" on failure

// If missing, enhance with:
interface GasOracleConfig {
  refreshInterval: number // 30 seconds
  cacheTimeout: number    // 60 seconds
  maxValidGwei: number    // 1000 gwei
  minValidGwei: number    // 1 gwei
  fallbackMessage: string // "Gas unavailable"
}
```

### 4. Data Source Validation

**Location**: `src/lib/ux/DataSourceValidator.ts`

```typescript
interface DataSourceValidator {
  validateGasOracle(): Promise<boolean>
  validateCoreAPI(): Promise<boolean>
  validateModuleAPI(module: 'guardian' | 'hunter' | 'harvestpro'): Promise<boolean>
  
  // Health check endpoints
  checkHealth(endpoint: string): Promise<boolean>
  
  // Telemetry
  logDataSourceStatus(source: string, status: boolean): void
}

// Health check implementation
const checkDataSourceHealth = async (source: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/health/${source}`, {
      method: 'GET',
      timeout: 5000
    })
    return response.ok
  } catch (error) {
    console.warn(`Data source ${source} unavailable:`, error)
    return false
  }
}
```

### 5. Global State Integration

**Location**: `src/contexts/DemoModeContext.tsx`

```typescript
interface DemoModeContextValue {
  mode: 'demo' | 'live'
  isDemo: boolean
  isLive: boolean
  dataSourceStatus: DataSourceStatus
  bannerVisible: boolean
  
  // Actions
  switchToDemo(): void
  switchToLive(): void
  refreshDataSources(): Promise<void>
  dismissBanner(): void
}

export const DemoModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  // Implementation with:
  // - Automatic mode switching on wallet connect/disconnect
  // - Periodic data source health checks
  // - Banner visibility management
  // - Telemetry integration
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
1. **Day 1-2**: Implement DemoModeManager with state management
2. **Day 3-4**: Create DataSourceValidator with health checks
3. **Day 5**: Build DemoModeContext for global state

### Phase 2: UI Components (Week 2)
1. **Day 1-2**: Create DemoBanner component with animations
2. **Day 3-4**: Integrate banner with existing layout components
3. **Day 5**: Test banner responsiveness and accessibility

### Phase 3: Integration (Week 3)
1. **Day 1-2**: Integrate with existing useNetworkStatus hook
2. **Day 3-4**: Add wallet connection event handlers
3. **Day 5**: Test automatic mode switching

### Phase 4: Testing & Validation (Week 4)
1. **Day 1-2**: Write property-based tests for data integrity
2. **Day 3-4**: Write integration tests for mode switching
3. **Day 5**: Performance testing and telemetry validation

## Testing Strategy

### Property-Based Tests

**Property 3: Data Integrity Validation**
```typescript
// Feature: ux-gap-requirements, Property 3: Data Integrity Validation
describe('Data integrity validation', () => {
  test('gas price never shows 0 gwei', () => {
    fc.assert(
      fc.property(
        fc.record({
          gasPrice: fc.oneof(fc.constant(null), fc.nat(), fc.constant(0)),
          apiResponse: fc.boolean()
        }),
        ({ gasPrice, apiResponse }) => {
          const displayValue = formatGasPrice(gasPrice, apiResponse)
          expect(displayValue).not.toBe('0 gwei')
          expect(displayValue).not.toBe('Gas: 0 gwei')
          
          if (!apiResponse || gasPrice === null || gasPrice === 0) {
            expect(displayValue).toBe('Gas unavailable')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Property 9: Demo Mode Clarity
describe('Demo mode clarity', () => {
  test('demo mode always clearly indicated', () => {
    fc.assert(
      fc.property(
        fc.record({
          walletConnected: fc.boolean(),
          dataSourcesReady: fc.boolean()
        }),
        ({ walletConnected, dataSourcesReady }) => {
          const mode = determineDemoMode(walletConnected, dataSourcesReady)
          const bannerVisible = shouldShowDemoBanner(mode)
          
          if (mode === 'demo') {
            expect(bannerVisible).toBe(true)
          }
          
          // Never mix demo and live data
          const dataLabels = getDataLabels(mode)
          expect(dataLabels.every(label => 
            label.includes('demo') || label.includes('live')
          )).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Integration Tests

**Mode Switching Integration**:
```typescript
describe('Demo mode integration', () => {
  test('automatic switching on wallet connect', async () => {
    render(<App />)
    
    // Initially demo mode
    expect(screen.getByText(/demo mode/i)).toBeInTheDocument()
    
    // Connect wallet
    fireEvent.click(screen.getByText(/connect wallet/i))
    await waitFor(() => {
      expect(mockWallet.connect).toHaveBeenCalled()
    })
    
    // Should switch to live mode if data sources ready
    await waitFor(() => {
      expect(screen.queryByText(/demo mode/i)).not.toBeInTheDocument()
    })
  })
  
  test('fallback to demo when data sources unavailable', async () => {
    // Mock data source failures
    mockDataSources({ gasOracle: false, coreAPI: true })
    
    render(<App />)
    connectWallet()
    
    // Should remain in demo mode
    await waitFor(() => {
      expect(screen.getByText(/demo mode.*temporarily unavailable/i)).toBeInTheDocument()
    })
  })
})
```

### Accessibility Tests

**Banner Accessibility**:
```typescript
describe('Demo banner accessibility', () => {
  test('banner has proper ARIA labels', () => {
    render(<DemoBanner />)
    
    const banner = screen.getByRole('banner')
    expect(banner).toHaveAttribute('aria-label', 'Demo mode notification')
    
    const ctaButton = screen.getByRole('button')
    expect(ctaButton).toHaveAttribute('aria-describedby')
  })
  
  test('banner keyboard navigation', () => {
    render(<DemoBanner dismissible />)
    
    // Tab to CTA button
    userEvent.tab()
    expect(screen.getByRole('button', { name: /connect wallet/i })).toHaveFocus()
    
    // Tab to dismiss button
    userEvent.tab()
    expect(screen.getByRole('button', { name: /dismiss/i })).toHaveFocus()
  })
})
```

## Success Criteria

### Functional Requirements
- [ ] Demo banner appears when wallet not connected
- [ ] Live mode only when readiness conditions satisfied
- [ ] Gas never displays "0 gwei" (verified existing implementation)
- [ ] On gas failure, shows "Gas unavailable" + telemetry event
- [ ] Timestamps avoid "0s ago" (use "Just now" under 1s)

### Performance Requirements
- [ ] Banner animations maintain 60fps
- [ ] Data source health checks complete within 5 seconds
- [ ] Mode switching has minimal UI delay (<200ms)

### Quality Requirements
- [ ] Property-based tests pass with 100+ iterations
- [ ] Integration tests cover all mode switching scenarios
- [ ] Accessibility tests pass WCAG AA compliance
- [ ] Telemetry events fire correctly for all state changes

## Evidence Requirements

### Screenshots
- [ ] Demo banner with "Connect Wallet for Live Data" CTA
- [ ] Gas fallback state showing "Gas unavailable"
- [ ] Live mode without banner (wallet connected)
- [ ] Unavailable state banner when data sources fail

### Test Results
- [ ] Property-based test results for data integrity
- [ ] Integration test results for mode switching
- [ ] Accessibility test results for banner component
- [ ] Performance test results for animations

### Telemetry Validation
- [ ] Gas fetch failure events logged
- [ ] Data source status change events logged
- [ ] Mode switching events logged
- [ ] Banner interaction events logged

## Risk Mitigation

### Data Source Failures
- **Risk**: All data sources fail, app becomes unusable
- **Mitigation**: Graceful fallback to demo mode with clear messaging

### Performance Impact
- **Risk**: Continuous health checks impact performance
- **Mitigation**: Efficient polling intervals, request debouncing

### User Confusion
- **Risk**: Users don't understand demo vs live modes
- **Mitigation**: Clear banner messaging, contextual help

## Dependencies

### Internal Dependencies
- Existing `useNetworkStatus` hook
- Existing wallet connection system
- Existing layout components for banner integration

### External Dependencies
- Health check endpoints for data sources
- Telemetry system for event logging
- Animation library (Framer Motion) for banner transitions

## Definition of Done

This task is complete when:

1. **Demo Mode Manager**: Automatic switching based on wallet + data source status
2. **Persistent Banner**: Shows across all pages in demo mode with clear CTA
3. **Gas Validation**: Never shows "0 gwei", falls back gracefully
4. **Data Source Health**: Validates readiness before enabling live mode
5. **Tests Passing**: Property-based + integration + accessibility tests
6. **Evidence Gathered**: Screenshots of all banner states and fallbacks
7. **Performance Validated**: Animations 60fps, health checks <5s
8. **Telemetry Working**: All state changes and failures logged

This specification provides the detailed roadmap for implementing demo mode and data integrity while maintaining user trust and system reliability.