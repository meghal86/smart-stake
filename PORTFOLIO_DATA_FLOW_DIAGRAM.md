# Portfolio Data Flow Architecture

## Current State (After Initial Fixes)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Portfolio Hub Component                     │
│  • Manages wallet scope (active_wallet | all_wallets)          │
│  • Detects demo mode via useDemoMode()                          │
│  • Passes data to tab components                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────┐
        │   usePortfolioIntegration() Hook        │
        │  • Detects isDemo from useDemoMode()    │
        │  • Switches data source automatically   │
        │  • Invalidates on wallet change         │
        └─────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   Demo Mode      │  │   Live Mode      │
        │   (isDemo=true)  │  │   (isDemo=false) │
        └──────────────────┘  └──────────────────┘
                │                       │
                ▼                       ▼
    getDemoPortfolioData()    /api/v1/portfolio/*
    • Instant return          • Validates auth
    • No API calls            • Calls Edge Function
    • Hardcoded data          • Returns real data
                                        │
                                        ▼
                              Supabase Edge Functions
                              • portfolio-snapshot
                              • wallet-transactions
                              • portfolio-positions (TODO)
                              • portfolio-stress-test (TODO)
                                        │
                                        ▼
                                  PostgreSQL DB
                                  • RLS policies
                                  • Real-time data
```

---

## Tab-Specific Data Flow

### ✅ OverviewTab (WORKING)

```
OverviewTab Component
    │
    ├─► snapshot (from parent)
    │   └─► whaleInteractions ✅ REAL DATA
    │
    ├─► actions (from parent)
    │   └─► RecommendedActionsFeed ✅ REAL DATA
    │
    └─► approvals (from parent)
        └─► RiskSummaryCard ✅ REAL DATA
```

**Status**: ✅ All data is real in live mode, demo in demo mode

---

### ✅ AuditTab (WORKING)

```
AuditTab Component
    │
    ├─► useQuery('wallet-transactions')
    │   │
    │   ├─► isDemo=true → Demo transactions
    │   └─► isDemo=false → fetchWalletTransactions()
    │       └─► Supabase Edge Function
    │           └─► Database query ✅ REAL DATA
    │
    ├─► approvals (from parent)
    │   └─► ApprovalsRiskList ✅ REAL DATA
    │
    ├─► mockFlowData ⚠️ TODO
    │   └─► GraphLiteVisualizer
    │
    └─► mockReceipts ⚠️ TODO
        └─► PlannedVsExecutedReceipts
```

**Status**: ✅ Transactions and approvals are real, flow graph and receipts still mock

---

### ❌ PositionsTab (NEEDS WORK)

```
PositionsTab Component
    │
    ├─► mockAssets ❌ MOCK DATA
    │   └─► AssetBreakdown
    │
    ├─► mockChainData ❌ MOCK DATA
    │   └─► ChainBreakdownChart
    │
    ├─► mockProtocols ❌ MOCK DATA
    │   └─► ProtocolExposure
    │
    └─► mockBenchmarkData ❌ MOCK DATA
        └─► BenchmarkComparison
```

**Should Be**:
```
PositionsTab Component
    │
    └─► usePortfolioPositions({ scope: walletScope })
        │
        ├─► isDemo=true → getDemoPositionsData()
        └─► isDemo=false → /api/v1/portfolio/positions
            └─► portfolio-positions Edge Function
                └─► Database aggregation ✅ REAL DATA
```

---

### ❌ StressTestTab (ARCHITECTURE VIOLATION!)

```
StressTestTab Component
    │
    ├─► portfolioValue (from usePortfolioSummary) ✅ REAL
    │
    └─► handleRunStressTest()
        │
        └─► ❌ CALCULATIONS IN COMPONENT (WRONG!)
            • avgLoss = scenarioValues.reduce(...)
            • worstCase = Math.min(...)
            • variance = scenarioValues.reduce(...)
            • stdDev = Math.sqrt(variance)
            • var95 = avgLoss - (1.645 * stdDev)
            • recoveryMonths = Math.ceil(...)
            • recommendations = [...]
```

**Should Be**:
```
StressTestTab Component
    │
    ├─► portfolioValue (from usePortfolioSummary) ✅ REAL
    │
    └─► usePortfolioStressTest()
        │
        ├─► isDemo=true → calculateDemoStressTest()
        └─► isDemo=false → /api/v1/portfolio/stress-test
            └─► portfolio-stress-test Edge Function
                │
                └─► ✅ ALL CALCULATIONS HERE (CORRECT!)
                    • avgLoss = scenarioValues.reduce(...)
                    • worstCase = Math.min(...)
                    • variance = scenarioValues.reduce(...)
                    • stdDev = Math.sqrt(variance)
                    • var95 = avgLoss - (1.645 * stdDev)
                    • recoveryMonths = Math.ceil(...)
                    • recommendations = [...]
```

---

## Demo Mode vs Live Mode Comparison

### Demo Mode (Wallet Not Connected)

```
User Action: Navigate to Portfolio
    │
    ▼
useDemoMode() → { isDemo: true, reason: 'wallet_not_connected' }
    │
    ▼
usePortfolioIntegration({ scope: walletScope })
    │
    ├─► queryFn checks isDemo
    │   └─► isDemo=true → return getDemoPortfolioSnapshot()
    │       • Instant return (< 200ms)
    │       • No API calls
    │       • Hardcoded demo data
    │
    └─► Component receives demo data
        └─► Displays with "Demo Mode" badge
```

### Live Mode (Wallet Connected)

```
User Action: Connect Wallet
    │
    ▼
useDemoMode() → { isDemo: false, reason: 'live_mode' }
    │
    ▼
usePortfolioIntegration({ scope: walletScope })
    │
    ├─► queryFn checks isDemo
    │   └─► isDemo=false → fetch('/api/v1/portfolio/snapshot')
    │       │
    │       ├─► API validates auth
    │       ├─► Calls Edge Function
    │       ├─► Edge Function queries database
    │       └─► Returns real data
    │
    └─► Component receives real data
        └─► Displays without demo badge
```

---

## Wallet Switching Flow

```
User Action: Switch from Wallet A to Wallet B
    │
    ▼
WalletScope changes: { mode: 'active_wallet', address: '0xB...' }
    │
    ▼
usePortfolioIntegration() detects scope change
    │
    ├─► Invalidates all portfolio queries
    │   └─► queryClient.invalidateQueries({ queryKey: portfolioKeys.all })
    │
    └─► Refetches with new wallet address
        │
        ├─► /api/v1/portfolio/snapshot?wallet=0xB...
        ├─► /api/v1/portfolio/actions?wallet=0xB...
        └─► /api/v1/portfolio/approvals?wallet=0xB...
            │
            └─► Edge Functions query database for Wallet B
                └─► Component displays Wallet B data
```

---

## Error Handling Flow

```
API Call Fails
    │
    ├─► Network Error
    │   └─► React Query retry (2 attempts)
    │       └─► Still fails
    │           └─► Show cached data + error toast
    │
    ├─► 401 Unauthorized
    │   └─► Redirect to login
    │
    ├─► 429 Rate Limited
    │   └─► Show "Too many requests" + retry_after_sec
    │
    └─► 500 Internal Error
        └─► Show "Service unavailable" + fallback to demo mode
```

---

## Data Freshness & Caching

```
React Query Configuration:
    │
    ├─► Demo Mode
    │   • staleTime: Infinity (never stale)
    │   • refetchInterval: false (no auto-refetch)
    │   • retry: 0 (no retries)
    │
    └─► Live Mode
        • staleTime: 60_000 (1 minute)
        • refetchInterval: 30_000 (30 seconds)
        • retry: 2 (2 retry attempts)
```

---

## Architecture Compliance Checklist

### ✅ Following Rules
- [x] OverviewTab: UI is presentation only
- [x] AuditTab: UI is presentation only
- [x] Demo mode works without API calls
- [x] Real-time data updates on wallet change
- [x] React Query for all data fetching
- [x] Edge Functions for server-side logic

### ❌ Violating Rules
- [ ] StressTestTab: Business logic in React component
- [ ] PositionsTab: Using mock data instead of real API
- [ ] AuditTab: Flow graph and receipts still mock

---

## Implementation Priority

```
Priority 1 (CRITICAL): StressTestTab
    └─► Move calculations to Edge Function
        • Violates "UI is Presentation Only" rule
        • Security risk (calculations can be manipulated)
        • Performance issue (heavy calculations on client)

Priority 2 (HIGH): PositionsTab
    └─► Implement real data fetching
        • Most visible tab after Overview
        • Users expect real asset breakdown
        • Affects trust in platform

Priority 3 (MEDIUM): AuditTab Flow Graph & Receipts
    └─► Complete remaining mock data
        • Less critical than positions
        • Can be phased implementation
```

---

## Success Metrics

### Demo Mode
- ✅ Data loads < 200ms
- ✅ No API calls made
- ✅ Demo badge visible
- ✅ Smooth transition to live mode

### Live Mode
- ✅ Real data for selected wallet
- ✅ Updates on wallet change
- ✅ Auto-refresh every 30s
- ✅ Loading states show skeletons

### Architecture
- ✅ Zero business logic in UI
- ✅ All calculations in Edge Functions
- ✅ Clean separation of concerns
- ✅ Testable and maintainable

---

## Visual Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    CURRENT STATUS                            │
├─────────────────────────────────────────────────────────────┤
│ OverviewTab:    ✅ REAL DATA (whale interactions)           │
│ AuditTab:       ✅ REAL DATA (transactions, approvals)      │
│ PositionsTab:   ❌ MOCK DATA (assets, chains, protocols)    │
│ StressTestTab:  ⚠️  REAL DATA but WRONG ARCHITECTURE        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    TARGET STATE                              │
├─────────────────────────────────────────────────────────────┤
│ OverviewTab:    ✅ REAL DATA (all components)               │
│ AuditTab:       ✅ REAL DATA (all components)               │
│ PositionsTab:   ✅ REAL DATA (all components)               │
│ StressTestTab:  ✅ REAL DATA + CORRECT ARCHITECTURE         │
└─────────────────────────────────────────────────────────────┘
```
