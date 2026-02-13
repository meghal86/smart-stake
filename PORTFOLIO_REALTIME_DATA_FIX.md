# Portfolio Real-Time Data Implementation

## Problem Statement

The Portfolio tab (Overview, Positions, Audit, Stress Test) must show **real-time data** for the selected wallet and only display mock data when in **demo mode** (wallet not connected).

## Current State Analysis

### ✅ What's Working
1. **Demo Mode Detection**: `useDemoMode()` hook correctly detects when wallet is not connected
2. **Data Fetching Infrastructure**: `usePortfolioIntegration()` hook properly switches between demo and live data
3. **Wallet Scope Tracking**: System tracks active wallet via `WalletScope` type

### ❌ What's Broken
1. **OverviewTab**: Uses real data from props but has hardcoded `mockWhaleInteractions`
2. **PositionsTab**: Uses 100% mock data (`mockAssets`, `mockChainData`, `mockProtocols`, `mockBenchmarkData`)
3. **AuditTab**: Uses real approvals but has hardcoded `mockFlowData` and `mockReceipts`
4. **StressTestTab**: Uses real portfolio value but calculations are client-side (should be Edge Function)

## Architecture Principles (from Steering Rules)

### Golden Rule: UI is Presentation Only
- ❌ **NEVER** write business logic in React components
- ✅ **ALWAYS** fetch data via API calls through React Query hooks
- ✅ **ALWAYS** use Edge Functions for complex calculations

### Demo Mode First
- All pages must work in demo mode without authentication
- Demo data loads instantly (< 200ms)
- No API calls in demo mode
- Clear "Demo Mode" badges visible

## Solution Architecture

### 1. Data Flow Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                     Portfolio Tab Component                  │
│  (OverviewTab, PositionsTab, AuditTab, StressTestTab)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              usePortfolioIntegration() Hook                  │
│  • Detects demo mode via useDemoMode()                      │
│  • Switches between demo and live data sources              │
│  • Invalidates queries when wallet changes                  │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
        ┌──────────────────┐  ┌──────────────────┐
        │   Demo Mode      │  │   Live Mode      │
        │   (Instant)      │  │   (API Calls)    │
        └──────────────────┘  └──────────────────┘
                │                       │
                ▼                       ▼
    getDemoPortfolioData()    /api/v1/portfolio/*
                                        │
                                        ▼
                              Supabase Edge Functions
                                        │
                                        ▼
                                  Database (RLS)
```

### 2. Required API Endpoints

#### Already Implemented ✅
- `/api/v1/portfolio/snapshot` - Portfolio overview data
- `/api/v1/portfolio/actions` - Recommended actions
- `/api/v1/portfolio/approvals` - Approval risks

#### Need to Implement 🔨
- `/api/v1/portfolio/positions` - Asset breakdown, chain distribution, protocol exposure
- `/api/v1/portfolio/transactions` - Transaction timeline (already has Edge Function)
- `/api/v1/portfolio/flow-graph` - Graph visualization data
- `/api/v1/portfolio/receipts` - Execution receipts
- `/api/v1/portfolio/stress-test` - Stress test calculations (Edge Function)

### 3. Required Edge Functions

#### Already Implemented ✅
- `portfolio-snapshot` - Aggregates Guardian, Hunter, Harvest data
- `wallet-transactions` - Fetches transaction history

#### Need to Implement 🔨
- `portfolio-positions` - Calculates asset breakdown, chain distribution, protocol exposure
- `portfolio-flow-graph` - Generates graph visualization data
- `portfolio-stress-test` - Runs stress test simulations (CRITICAL: calculations must be server-side)

## Implementation Plan

### Phase 1: Fix OverviewTab (Easiest)

**File**: `src/components/portfolio/tabs/OverviewTab.tsx`

**Changes**:
```typescript
// ❌ Remove this
const mockWhaleInteractions = [...];

// ✅ Add this
const whaleInteractions = snapshot?.whaleInteractions || [];
```

**Result**: OverviewTab will show real whale interactions from snapshot

---

### Phase 2: Fix PositionsTab (Medium Complexity)

**File**: `src/components/portfolio/tabs/PositionsTab.tsx`

**Changes**:
1. Create `usePortfolioPositions()` hook
2. Create `/api/v1/portfolio/positions` endpoint
3. Create `portfolio-positions` Edge Function
4. Replace all mock data with real data from hook

**New Hook**: `src/hooks/portfolio/usePortfolioPositions.ts`
```typescript
export function usePortfolioPositions({ scope, enabled = true }: UsePortfolioPositionsOptions) {
  const { isDemo } = useDemoMode();

  return useQuery({
    queryKey: [...portfolioKeys.positions(scope), isDemo],
    queryFn: async () => {
      if (isDemo) {
        return getDemoPositionsData(); // Instant demo data
      }
      
      // Live mode: API call
      const response = await fetch(`/api/v1/portfolio/positions?${params}`, {
        credentials: 'include',
      });
      return response.json();
    },
    staleTime: isDemo ? Infinity : 60_000,
    refetchInterval: isDemo ? false : 30_000,
  });
}
```

**New API Route**: `src/app/api/v1/portfolio/positions/route.ts`
```typescript
export async function GET(request: NextRequest) {
  // Validate auth
  const userId = await getUserId(request);
  
  // Parse wallet scope
  const { scope, wallet } = parseQueryParams(request);
  
  // Call Edge Function
  const { data, error } = await supabase.functions.invoke('portfolio-positions', {
    body: { userId, scope, wallet }
  });
  
  return NextResponse.json({ data, apiVersion: 'v1', ts: new Date().toISOString() });
}
```

**New Edge Function**: `supabase/functions/portfolio-positions/index.ts`
```typescript
serve(async (req) => {
  const { userId, scope, wallet } = await req.json();
  
  // Fetch positions from database
  const positions = await fetchUserPositions(userId, wallet);
  
  // Calculate asset breakdown
  const assets = calculateAssetBreakdown(positions);
  
  // Calculate chain distribution
  const chains = calculateChainDistribution(positions);
  
  // Calculate protocol exposure
  const protocols = calculateProtocolExposure(positions);
  
  // Calculate benchmark comparison
  const benchmarks = calculateBenchmarkComparison(positions);
  
  return new Response(JSON.stringify({
    assets,
    chains,
    protocols,
    benchmarks,
    totalValue: positions.reduce((sum, p) => sum + p.valueUsd, 0)
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Update Component**: `src/components/portfolio/tabs/PositionsTab.tsx`
```typescript
export function PositionsTab({ walletScope, freshness }: PositionsTabProps) {
  const { isDemo } = useDemoMode();
  
  // ✅ Use real data hook
  const { data, isLoading } = usePortfolioPositions({ 
    scope: walletScope, 
    enabled: true 
  });
  
  // ❌ Remove all mock data
  // const [mockAssets] = useState([...]);
  
  // ✅ Use real data
  const assets = data?.assets || [];
  const chains = data?.chains || [];
  const protocols = data?.protocols || [];
  const benchmarks = data?.benchmarks || [];
  const totalValue = data?.totalValue || 0;
  
  return (
    <div className="space-y-6">
      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <>
          <AssetBreakdown assets={assets} totalValue={totalValue} />
          <ChainBreakdownChart data={chains} totalValue={totalValue} />
          <ProtocolExposure protocols={protocols} totalValue={totalValue} />
          <BenchmarkComparison data={benchmarks} />
        </>
      )}
    </div>
  );
}
```

---

### Phase 3: Fix AuditTab (Medium Complexity)

**File**: `src/components/portfolio/tabs/AuditTab.tsx`

**Changes**:
1. Create `usePortfolioFlowGraph()` hook
2. Create `usePortfolioReceipts()` hook
3. Create `/api/v1/portfolio/flow-graph` endpoint
4. Create `/api/v1/portfolio/receipts` endpoint
5. Replace mock data with real data from hooks

**Implementation**: Similar pattern to PositionsTab

---

### Phase 4: Fix StressTestTab (CRITICAL - High Complexity)

**File**: `src/components/portfolio/tabs/StressTestTab.tsx`

**CRITICAL ISSUE**: Stress test calculations are currently done in the React component. This violates the architecture rule: **UI is Presentation Only**.

**Changes**:
1. Move ALL calculations to Edge Function
2. Create `usePortfolioStressTest()` hook
3. Create `/api/v1/portfolio/stress-test` endpoint
4. Create `portfolio-stress-test` Edge Function
5. Component only displays results

**New Hook**: `src/hooks/portfolio/usePortfolioStressTest.ts`
```typescript
export function usePortfolioStressTest() {
  const { isDemo } = useDemoMode();
  
  return useMutation({
    mutationFn: async (scenarios: ScenarioConfig) => {
      if (isDemo) {
        // Demo mode: instant calculation with demo data
        return calculateDemoStressTest(scenarios);
      }
      
      // Live mode: Edge Function
      const response = await fetch('/api/v1/portfolio/stress-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scenarios })
      });
      
      return response.json();
    }
  });
}
```

**New Edge Function**: `supabase/functions/portfolio-stress-test/index.ts`
```typescript
serve(async (req) => {
  const { userId, scenarios, portfolioValue } = await req.json();
  
  // ✅ ALL calculations happen here (server-side)
  const results = {
    worstCase: calculateWorstCase(scenarios, portfolioValue),
    expectedLoss: calculateExpectedLoss(scenarios, portfolioValue),
    var95: calculateVaR95(scenarios, portfolioValue),
    bestCase: calculateBestCase(scenarios, portfolioValue),
    recoveryMonths: calculateRecoveryTime(scenarios),
    riskLevel: classifyRiskLevel(scenarios),
    volatility: calculateVolatility(scenarios),
    recommendations: generateRecommendations(scenarios, portfolioValue)
  };
  
  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Update Component**: `src/components/portfolio/tabs/StressTestTab.tsx`
```typescript
export function StressTestTab({ walletScope, freshness }: StressTestTabProps) {
  const { data: portfolioData } = usePortfolioSummary();
  const stressTestMutation = usePortfolioStressTest();
  
  const handleRunStressTest = async () => {
    // ✅ Just trigger the mutation - NO calculations here
    const results = await stressTestMutation.mutateAsync(scenarios);
    setResults(results);
    setView('results');
  };
  
  // ❌ Remove ALL calculation logic from component
  // const avgLoss = scenarioValues.reduce(...);
  // const worstCase = Math.min(...);
  // etc.
  
  return (
    <div>
      {/* UI only displays results */}
      <button onClick={handleRunStressTest}>
        Run Stress Test
      </button>
      
      {results && (
        <StressTestResults results={results} />
      )}
    </div>
  );
}
```

---

## Demo Data Service

**File**: `src/lib/services/portfolioDemoDataService.ts`

**Add missing demo data functions**:
```typescript
export function getDemoPositionsData() {
  return {
    assets: [
      { id: 'eth', symbol: 'ETH', amount: 15.5, valueUsd: 38750, ... },
      { id: 'usdc', symbol: 'USDC', amount: 25000, valueUsd: 25000, ... },
    ],
    chains: [
      { name: 'Ethereum', value: 63750, percentage: 60, ... },
    ],
    protocols: [
      { id: 'uniswap', name: 'Uniswap V3', valueUsd: 15000, ... },
    ],
    benchmarks: [
      { date: '2024-01-01', portfolio: 0, ethereum: 0, ... },
    ],
    totalValue: 105000
  };
}

export function getDemoFlowGraphData() {
  return {
    nodes: [
      { id: 'wallet', label: 'Your Wallet', type: 'wallet', ... },
    ],
    edges: [
      { from: 'wallet', to: 'uniswap', type: 'approval', ... },
    ]
  };
}

export function getDemoReceiptsData() {
  return [
    { id: 'plan-1', intent: 'revoke_approvals', status: 'completed', ... },
  ];
}

export function calculateDemoStressTest(scenarios: ScenarioConfig) {
  const portfolioValue = 2450000;
  const avgLoss = Object.values(scenarios).reduce((sum, val) => sum + val, 0) / 6;
  
  return {
    worstCase: portfolioValue * (1 + Math.min(...Object.values(scenarios)) / 100),
    expectedLoss: portfolioValue * (1 + avgLoss / 100),
    var95: portfolioValue * (1 + (avgLoss - 10) / 100),
    bestCase: portfolioValue * (1 + Math.max(...Object.values(scenarios)) / 100),
    recoveryMonths: Math.ceil(Math.abs(avgLoss) / 2.5),
    riskLevel: avgLoss < -40 ? 'CRITICAL' : avgLoss < -25 ? 'HIGH' : 'MODERATE',
    volatility: 15.2,
    recommendations: [
      '🚨 CRITICAL: Consider immediate portfolio rebalancing',
      'Increase stablecoin allocation to 30-40% of portfolio'
    ]
  };
}
```

---

## Testing Checklist

### Demo Mode Testing
- [ ] Disconnect wallet → All tabs show demo data instantly
- [ ] Demo badge visible on all components
- [ ] No API calls made in demo mode
- [ ] Demo data loads < 200ms

### Live Mode Testing
- [ ] Connect wallet → All tabs fetch real data
- [ ] Switch active wallet → Data updates immediately
- [ ] Real-time updates every 30 seconds
- [ ] Loading skeletons show during fetch

### Wallet Switching Testing
- [ ] Switch from Wallet A to Wallet B → Data updates
- [ ] Switch from "Active Wallet" to "All Wallets" → Data aggregates
- [ ] No stale data displayed during transition

### Error Handling Testing
- [ ] API failure → Show cached data + error message
- [ ] Network offline → Graceful degradation to demo mode
- [ ] Invalid wallet address → Show error state

---

## Implementation Priority

### P0 (Critical - Do First)
1. **StressTestTab**: Move calculations to Edge Function (architecture violation)
2. **OverviewTab**: Fix whale interactions (easiest win)

### P1 (High - Do Next)
3. **PositionsTab**: Implement real data fetching
4. **AuditTab**: Implement flow graph and receipts

### P2 (Medium - Do Later)
5. Add real-time WebSocket updates for live data
6. Implement optimistic updates for better UX

---

## Code Review Checklist

Before merging, verify:
- [ ] Zero business logic in React components
- [ ] All calculations in Edge Functions
- [ ] Demo mode works without API calls
- [ ] Real-time data updates on wallet change
- [ ] Loading states show skeletons
- [ ] Error states show fallback UI
- [ ] No console errors or warnings
- [ ] TypeScript strict mode passes
- [ ] All tests passing

---

## Success Criteria

✅ **Demo Mode**:
- All tabs show demo data when wallet not connected
- Demo data loads instantly (< 200ms)
- Clear "Demo Mode" badges visible

✅ **Live Mode**:
- All tabs show real-time data for selected wallet
- Data updates when wallet changes
- Auto-refresh every 30 seconds

✅ **Architecture**:
- Zero business logic in UI components
- All calculations in Edge Functions
- Clean separation of concerns

---

## Files to Modify

### Components
- `src/components/portfolio/tabs/OverviewTab.tsx`
- `src/components/portfolio/tabs/PositionsTab.tsx`
- `src/components/portfolio/tabs/AuditTab.tsx`
- `src/components/portfolio/tabs/StressTestTab.tsx`

### Hooks
- `src/hooks/portfolio/usePortfolioPositions.ts` (new)
- `src/hooks/portfolio/usePortfolioFlowGraph.ts` (new)
- `src/hooks/portfolio/usePortfolioReceipts.ts` (new)
- `src/hooks/portfolio/usePortfolioStressTest.ts` (new)

### API Routes
- `src/app/api/v1/portfolio/positions/route.ts` (new)
- `src/app/api/v1/portfolio/flow-graph/route.ts` (new)
- `src/app/api/v1/portfolio/receipts/route.ts` (new)
- `src/app/api/v1/portfolio/stress-test/route.ts` (new)

### Edge Functions
- `supabase/functions/portfolio-positions/index.ts` (new)
- `supabase/functions/portfolio-flow-graph/index.ts` (new)
- `supabase/functions/portfolio-stress-test/index.ts` (new)

### Services
- `src/lib/services/portfolioDemoDataService.ts` (extend)

---

## Summary

The fix requires:
1. **Remove all mock data** from tab components
2. **Create data fetching hooks** that switch between demo and live data
3. **Implement API endpoints** that call Edge Functions
4. **Move calculations to Edge Functions** (especially stress test)
5. **Extend demo data service** with missing demo data

This ensures:
- ✅ Real-time data for selected wallet in live mode
- ✅ Instant demo data when wallet not connected
- ✅ Clean architecture (UI is presentation only)
- ✅ Proper separation of concerns
