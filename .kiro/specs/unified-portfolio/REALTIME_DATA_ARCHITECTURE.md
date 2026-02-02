# Portfolio Real-Time Data Architecture

## Overview

The portfolio system ensures **real-time data accuracy** when users switch between wallets. Every wallet switch triggers immediate cache invalidation and fresh data fetching to prevent stale data display.

## Core Principles

1. **Immediate Cache Invalidation**: All cached data is cleared when wallet scope changes
2. **Fresh Data Fetching**: New data is fetched immediately after wallet switch
3. **Loading State Management**: UI shows loading indicators during data refresh
4. **No Stale Data Display**: Previous wallet's data is cleared before new data loads

## Implementation Details

### 1. Portfolio Integration Hook (`usePortfolioIntegration`)

**Location**: `src/hooks/portfolio/usePortfolioIntegration.ts`

**Key Changes**:
```typescript
// Invalidate all queries when wallet scope changes
useEffect(() => {
  // Clear all portfolio queries for the previous scope
  queryClient.invalidateQueries({ queryKey: portfolioKeys.all });
  
  // Refetch immediately with new scope
  if (enableSnapshot) snapshot.refetch();
  if (enableActions) actions.refetch();
  if (enableApprovals) approvals.refetch();
}, [scope.mode, scope.mode === 'active_wallet' ? scope.address : null]);
```

**What This Does**:
- Monitors `scope.mode` and `scope.address` for changes
- When wallet switches, invalidates ALL portfolio queries
- Immediately refetches snapshot, actions, and approvals with new wallet scope
- Ensures React Query cache is cleared and fresh data is loaded

### 2. Portfolio Summary Hook (`usePortfolioSummary`)

**Location**: `src/hooks/portfolio/usePortfolioSummary.ts`

**Key Changes**:
```typescript
const { activeWallet } = useWalletSwitching();

// Refetch when active wallet changes
useEffect(() => {
  fetchSummary();
}, [activeWallet]);
```

**What This Does**:
- Tracks the active wallet from `useWalletSwitching` hook
- Automatically refetches portfolio summary when `activeWallet` changes
- Clears previous data before fetching to prevent stale display
- Returns `refetch` function for manual refresh

### 3. Portfolio Data Hook (`usePortfolioData`)

**Location**: `src/hooks/usePortfolioData.ts`

**Key Changes**:
```typescript
useEffect(() => {
  // Clear previous data immediately to prevent stale data display
  setData({});
  fetchPortfolioData();
}, [addressesStr]);
```

**What This Does**:
- Monitors address list changes (stringified for deep comparison)
- Immediately clears previous data when addresses change
- Fetches fresh data for new address set
- Prevents displaying old wallet's data during transition

## Data Flow on Wallet Switch

```
User Clicks Wallet Switch
         ↓
useWalletSwitching.switchWallet(newWalletId)
         ↓
activeWallet state updates
         ↓
┌────────────────────────────────────────┐
│  All Portfolio Hooks Detect Change     │
├────────────────────────────────────────┤
│  1. usePortfolioIntegration            │
│     - Invalidates React Query cache    │
│     - Refetches snapshot, actions,     │
│       approvals with new scope         │
│                                        │
│  2. usePortfolioSummary                │
│     - Clears previous summary data     │
│     - Fetches new summary              │
│                                        │
│  3. usePortfolioData                   │
│     - Clears previous portfolio data   │
│     - Fetches data for new addresses   │
└────────────────────────────────────────┘
         ↓
UI Shows Loading States
         ↓
Fresh Data Arrives
         ↓
UI Displays New Wallet's Data
```

## React Query Configuration

### Query Keys Structure

```typescript
export const portfolioKeys = {
  all: ['portfolio'] as const,
  snapshot: (scope: WalletScope) => [...portfolioKeys.all, 'snapshot', scope] as const,
  actions: (scope: WalletScope) => [...portfolioKeys.all, 'actions', scope] as const,
  approvals: (scope: WalletScope, cursor?: string) => [...portfolioKeys.all, 'approvals', scope, cursor] as const,
  positions: (scope: WalletScope, cursor?: string) => [...portfolioKeys.all, 'positions', scope, cursor] as const,
  plan: (planId: string) => [...portfolioKeys.all, 'plan', planId] as const,
  planSteps: (planId: string) => [...portfolioKeys.all, 'plan', planId, 'steps'] as const,
};
```

**Why This Matters**:
- Query keys include wallet scope, so different wallets have different cache entries
- Invalidating `portfolioKeys.all` clears ALL portfolio data across all wallets
- Ensures no cross-wallet data contamination

### Refetch Configuration

```typescript
const query = useQuery({
  queryKey: portfolioKeys.snapshot(scope),
  queryFn: () => fetchPortfolioSnapshot(scope),
  enabled,
  staleTime: 60_000,      // 1 minute
  refetchInterval: 30_000, // 30 seconds
  retry: 2,
});
```

**Configuration Explained**:
- `staleTime: 60_000`: Data considered fresh for 1 minute
- `refetchInterval: 30_000`: Auto-refresh every 30 seconds
- `retry: 2`: Retry failed requests twice before showing error
- `enabled`: Can be toggled to pause queries

## Wallet Switching Hook

**Location**: `src/hooks/useWalletSwitching.ts`

**Key Features**:
```typescript
const switchWallet = useCallback(async (walletId: string) => {
  setState(prev => ({
    ...prev,
    isLoading: true,
    error: null,
    previousWallet: prev.activeWallet
  }));

  // Validate wallet exists
  const wallet = addresses.find(addr => addr.id === walletId);
  if (!wallet) {
    throw new Error(`Wallet with id ${walletId} not found`);
  }

  // Update active wallet
  setState(prev => ({
    ...prev,
    activeWallet: walletId,
    isLoading: false
  }));

  // Clear wallet-specific cache
  if (typeof window !== 'undefined') {
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.includes('portfolio-') || key.includes('wallet-')
    );
    cacheKeys.forEach(key => {
      if (key.includes(state.activeWallet || '')) {
        localStorage.removeItem(key);
      }
    });
  }
}, [addresses, state.activeWallet]);
```

**Security Features**:
- Validates wallet exists before switching
- Clears localStorage cache for previous wallet
- Prevents data leakage between wallets (Property S3)
- Tracks previous wallet for audit trail

## API Endpoint Requirements

All portfolio API endpoints MUST support wallet scope parameter:

### GET /api/v1/portfolio/snapshot

```typescript
// Query parameters
?scope=active_wallet&wallet=0x1234...
?scope=all_wallets
```

### GET /api/v1/portfolio/actions

```typescript
// Query parameters
?scope=active_wallet&wallet=0x1234...
?scope=all_wallets
```

### GET /api/v1/portfolio/approvals

```typescript
// Query parameters
?scope=active_wallet&wallet=0x1234...
?scope=all_wallets
?cursor=abc123  // For pagination
```

**Response Format**:
```json
{
  "apiVersion": "v1",
  "data": { ... },
  "ts": "2026-02-02T10:30:00Z"
}
```

## Testing Real-Time Updates

### Property Test: Wallet Switch Data Isolation (Property S3)

**Location**: `src/lib/portfolio/__tests__/properties/wallet-switching.property.test.ts`

```typescript
test('wallet switch data isolation', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        id: fc.string(),
        address: fc.hexaString({ minLength: 40, maxLength: 40 }),
        balance: fc.nat()
      }), { minLength: 2, maxLength: 5 }),
      (wallets) => {
        // Switch between wallets
        const wallet1Data = fetchPortfolioData(wallets[0].id);
        const wallet2Data = fetchPortfolioData(wallets[1].id);
        
        // Assert no data leakage
        expect(wallet1Data).not.toEqual(wallet2Data);
        expect(wallet1Data.address).toBe(wallets[0].address);
        expect(wallet2Data.address).toBe(wallets[1].address);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Test: Wallet Switch Triggers Refetch

```typescript
test('wallet switch triggers immediate data refetch', async () => {
  const { result } = renderHook(() => usePortfolioIntegration({
    scope: { mode: 'active_wallet', address: '0x1234...' }
  }));
  
  // Initial data loaded
  await waitFor(() => {
    expect(result.current.snapshot).toBeDefined();
  });
  
  const initialSnapshot = result.current.snapshot;
  
  // Switch wallet
  act(() => {
    result.rerender({
      scope: { mode: 'active_wallet', address: '0x5678...' }
    });
  });
  
  // Loading state should be true
  expect(result.current.isLoading).toBe(true);
  
  // New data should be different
  await waitFor(() => {
    expect(result.current.snapshot).toBeDefined();
    expect(result.current.snapshot).not.toEqual(initialSnapshot);
  });
});
```

## Performance Considerations

### Cache Strategy

1. **Stale-While-Revalidate**: Show cached data while fetching fresh data
2. **Aggressive Invalidation**: Clear cache on wallet switch to prevent stale data
3. **Background Refetch**: Auto-refresh every 30 seconds for active wallet

### Optimization Techniques

1. **Cursor Pagination**: Large datasets use cursor-based pagination
2. **Selective Refetch**: Only refetch enabled queries (snapshot, actions, approvals)
3. **Debounced Switching**: Prevent rapid wallet switches from overwhelming API

### Performance Targets

- **P95 Latency**: < 600ms for cached data, < 1200ms for fresh data
- **Cache Hit Rate**: > 80% for repeated queries within 1 minute
- **Wallet Switch Time**: < 500ms from click to loading state

## Monitoring & Telemetry

### Events Tracked

```typescript
// Wallet switch event
analytics.track('wallet_switched', {
  from_wallet: previousWallet,
  to_wallet: newWallet,
  switch_duration_ms: duration,
  cache_cleared: true
});

// Portfolio snapshot loaded
analytics.track('portfolio_snapshot_loaded', {
  wallet_scope: scope.mode,
  cache_hit: wasCached,
  latency_ms: loadTime,
  data_freshness_sec: freshnessAge
});
```

### Metrics Dashboard

Monitor these metrics in production:

- **Wallet Switch Rate**: Switches per user per session
- **Data Freshness**: Age of displayed data
- **Cache Hit Rate**: Percentage of queries served from cache
- **API Latency**: P50, P95, P99 response times
- **Error Rate**: Failed API calls per 1000 requests

## Troubleshooting

### Issue: Stale Data After Wallet Switch

**Symptoms**: Old wallet's data still visible after switching

**Solution**:
1. Check `useEffect` dependencies in portfolio hooks
2. Verify `queryClient.invalidateQueries` is called
3. Ensure wallet scope includes address in query key
4. Clear browser cache and localStorage

### Issue: Slow Wallet Switching

**Symptoms**: Long delay between click and new data display

**Solution**:
1. Check API response times in Network tab
2. Verify database indexes on `user_id` and `scope_key`
3. Enable React Query DevTools to inspect cache
4. Consider implementing optimistic updates

### Issue: Data Leakage Between Wallets

**Symptoms**: Wallet A's data appears briefly when switching to Wallet B

**Solution**:
1. Ensure `setData({})` is called before fetching new data
2. Verify query keys include wallet-specific identifiers
3. Check localStorage is cleared for previous wallet
4. Run Property S3 test to validate isolation

## Best Practices

### For Component Developers

1. **Always use hooks**: Never fetch portfolio data directly in components
2. **Show loading states**: Display skeletons during wallet switch
3. **Handle errors gracefully**: Show user-friendly error messages
4. **Clear previous data**: Set data to `undefined` before refetch
5. **Use React Query DevTools**: Debug cache behavior in development

### For API Developers

1. **Include wallet scope**: All endpoints must accept `scope` and `wallet` params
2. **Return fresh data**: Don't cache responses longer than 1 minute
3. **Add timestamps**: Include `ts` field in all responses
4. **Validate scope**: Ensure user owns the requested wallet
5. **Log wallet switches**: Track for security and debugging

### For QA Engineers

1. **Test rapid switching**: Switch wallets quickly to catch race conditions
2. **Verify data isolation**: Ensure no cross-wallet data leakage
3. **Check loading states**: Confirm UI shows loading during switch
4. **Test error recovery**: Simulate API failures during switch
5. **Monitor performance**: Measure wallet switch latency

## Summary

The portfolio system ensures real-time data accuracy through:

✅ **Immediate cache invalidation** on wallet switch
✅ **Fresh data fetching** with new wallet scope
✅ **Loading state management** for smooth UX
✅ **Data isolation** between wallets (Property S3)
✅ **Auto-refresh** every 30 seconds for active wallet
✅ **Performance optimization** with React Query caching
✅ **Comprehensive testing** with property-based tests

This architecture guarantees users always see accurate, up-to-date data for their selected wallet.
