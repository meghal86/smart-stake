# Wallet Switching Quick Reference

## For Component Developers

### ✅ DO: Use Portfolio Hooks

```typescript
import { usePortfolioIntegration } from '@/hooks/portfolio/usePortfolioIntegration';
import { useWalletSwitching } from '@/hooks/useWalletSwitching';

function MyPortfolioComponent() {
  const { getCurrentWalletScope } = useWalletSwitching();
  const scope = getCurrentWalletScope();
  
  const { snapshot, actions, approvals, isLoading } = usePortfolioIntegration({
    scope,
    enableSnapshot: true,
    enableActions: true,
    enableApprovals: true
  });
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      <h2>Net Worth: ${snapshot?.netWorth}</h2>
      <ActionsList actions={actions} />
      <ApprovalsList approvals={approvals} />
    </div>
  );
}
```

**Why**: Hooks automatically handle wallet switching, cache invalidation, and data refetching.

### ❌ DON'T: Fetch Data Directly

```typescript
// ❌ BAD - No automatic updates on wallet switch
function BadComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/v1/portfolio/snapshot')
      .then(res => res.json())
      .then(setData);
  }, []); // Missing wallet dependency!
  
  return <div>{data?.netWorth}</div>;
}
```

**Why**: Direct fetching doesn't respond to wallet changes and causes stale data.

---

## For Hook Developers

### ✅ DO: Track Active Wallet

```typescript
import { useWalletSwitching } from '@/hooks/useWalletSwitching';

export function useMyPortfolioHook() {
  const { activeWallet } = useWalletSwitching();
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // Clear previous data
    setData(null);
    
    // Fetch new data
    fetchData(activeWallet).then(setData);
  }, [activeWallet]); // ✅ Refetch when wallet changes
  
  return { data };
}
```

**Why**: Ensures data updates when user switches wallets.

### ❌ DON'T: Ignore Wallet Changes

```typescript
// ❌ BAD - Doesn't update on wallet switch
export function useBadHook() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []); // ❌ No wallet dependency
  
  return { data };
}
```

**Why**: Data becomes stale when wallet changes.

---

## For API Developers

### ✅ DO: Accept Wallet Scope Parameter

```typescript
// app/api/v1/portfolio/snapshot/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope'); // 'active_wallet' | 'all_wallets'
  const wallet = searchParams.get('wallet'); // '0x1234...'
  
  // Validate scope
  if (scope === 'active_wallet' && !wallet) {
    return NextResponse.json(
      { error: { code: 'INVALID_SCOPE', message: 'wallet required for active_wallet scope' } },
      { status: 400 }
    );
  }
  
  // Fetch data for specific wallet or all wallets
  const data = await fetchPortfolioData(scope, wallet);
  
  return NextResponse.json({
    apiVersion: 'v1',
    data,
    ts: new Date().toISOString()
  });
}
```

**Why**: Enables wallet-specific data fetching and proper cache invalidation.

### ❌ DON'T: Ignore Wallet Context

```typescript
// ❌ BAD - Returns data for all wallets regardless of request
export async function GET(request: NextRequest) {
  const data = await fetchAllPortfolioData(); // ❌ No wallet filtering
  return NextResponse.json({ data });
}
```

**Why**: Returns wrong data when user switches to specific wallet.

---

## Common Patterns

### Pattern 1: Wallet Switcher Component

```typescript
import { useWalletSwitching } from '@/hooks/useWalletSwitching';

function WalletSwitcher() {
  const { activeWallet, availableWallets, switchWallet, isLoading } = useWalletSwitching();
  
  return (
    <select 
      value={activeWallet || ''} 
      onChange={(e) => switchWallet(e.target.value)}
      disabled={isLoading}
    >
      {availableWallets.map(wallet => (
        <option key={wallet.id} value={wallet.id}>
          {wallet.label || wallet.address}
        </option>
      ))}
    </select>
  );
}
```

### Pattern 2: Loading State During Switch

```typescript
function PortfolioOverview() {
  const { getCurrentWalletScope } = useWalletSwitching();
  const { snapshot, isLoading } = usePortfolioIntegration({
    scope: getCurrentWalletScope()
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  
  return <PortfolioContent snapshot={snapshot} />;
}
```

### Pattern 3: Manual Refetch on Demand

```typescript
function PortfolioWithRefresh() {
  const { getCurrentWalletScope } = useWalletSwitching();
  const { snapshot, invalidateAll } = usePortfolioIntegration({
    scope: getCurrentWalletScope()
  });
  
  return (
    <div>
      <button onClick={invalidateAll}>
        Refresh Data
      </button>
      <PortfolioContent snapshot={snapshot} />
    </div>
  );
}
```

---

## Testing Checklist

When implementing wallet-aware features, test:

- [ ] Data updates when switching between wallets
- [ ] Loading state shows during wallet switch
- [ ] No stale data from previous wallet appears
- [ ] Error handling works during wallet switch
- [ ] Rapid wallet switching doesn't cause race conditions
- [ ] Cache is properly invalidated
- [ ] API receives correct wallet scope parameter

---

## Debugging Tips

### Check React Query Cache

```typescript
import { useQueryClient } from '@tanstack/react-query';

function DebugCache() {
  const queryClient = useQueryClient();
  
  console.log('All queries:', queryClient.getQueryCache().getAll());
  console.log('Portfolio queries:', 
    queryClient.getQueryCache()
      .getAll()
      .filter(q => q.queryKey[0] === 'portfolio')
  );
  
  return null;
}
```

### Monitor Wallet Changes

```typescript
import { useWalletSwitching } from '@/hooks/useWalletSwitching';

function DebugWallet() {
  const { activeWallet, previousWallet } = useWalletSwitching();
  
  useEffect(() => {
    console.log('Wallet changed:', {
      from: previousWallet,
      to: activeWallet,
      timestamp: new Date().toISOString()
    });
  }, [activeWallet]);
  
  return null;
}
```

### Verify API Calls

Open DevTools Network tab and check:
- ✅ API calls include `?scope=active_wallet&wallet=0x...`
- ✅ New API call made after wallet switch
- ✅ Response includes `apiVersion: "v1"`
- ✅ Response timestamp is recent

---

## Performance Tips

### 1. Use Selective Enabling

```typescript
// Only fetch what you need
const { snapshot, actions } = usePortfolioIntegration({
  scope,
  enableSnapshot: true,
  enableActions: true,
  enableApprovals: false // ❌ Don't fetch if not displayed
});
```

### 2. Implement Optimistic Updates

```typescript
const { invalidateAll } = usePortfolioIntegration({ scope });

async function handleAction() {
  // Show optimistic UI immediately
  setOptimisticState(newState);
  
  try {
    await executeAction();
    invalidateAll(); // Refetch real data
  } catch (error) {
    // Revert optimistic state
    setOptimisticState(previousState);
  }
}
```

### 3. Debounce Rapid Switches

```typescript
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

function PortfolioWithDebounce() {
  const { activeWallet } = useWalletSwitching();
  const debouncedWallet = useDebouncedValue(activeWallet, 300);
  
  const { snapshot } = usePortfolioIntegration({
    scope: { mode: 'active_wallet', address: debouncedWallet }
  });
  
  return <PortfolioContent snapshot={snapshot} />;
}
```

---

## Summary

✅ **Always use portfolio hooks** - they handle wallet switching automatically
✅ **Track activeWallet** - refetch data when it changes
✅ **Clear stale data** - set to `null`/`undefined` before fetching
✅ **Show loading states** - use skeletons during transitions
✅ **Accept wallet scope** - all APIs must support wallet filtering
✅ **Test thoroughly** - verify no data leakage between wallets

For detailed architecture, see `REALTIME_DATA_ARCHITECTURE.md`.
