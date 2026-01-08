# React Query Integration - Standardized Query Keys

## Overview

This module provides standardized React Query key factories for the multi-chain wallet system. It ensures consistent query key patterns across all modules (Guardian, Hunter, HarvestPro) and enables proper cross-module invalidation.

**Feature**: multi-chain-wallet-system  
**Task**: 11 - React Query Integration  
**Validates**: Module Integration Contract

## Query Key Factories

### Wallet Registry Keys

```typescript
import { walletKeys } from '@/lib/query-keys';

// Get all wallet keys
walletKeys.all // ['wallets']

// Get wallet registry (all wallets for user)
walletKeys.registry() // ['wallets', 'registry']

// Get specific wallet by ID
walletKeys.byId('wallet-123') // ['wallets', 'byId', 'wallet-123']

// Get wallet by address
walletKeys.byAddress('0x1234567890abcdef') // ['wallets', 'byAddress', '0x1234567890abcdef']
```

### Guardian Module Keys

```typescript
import { guardianKeys } from '@/lib/query-keys';

// Guardian scan results for specific wallet/network
guardianKeys.scan('0xabc', 'eip155:1') // ['guardian', 'scan', '0xabc', 'eip155:1']

// Guardian scores for specific wallet/network
guardianKeys.scores('0xabc', 'eip155:137') // ['guardian', 'scores', '0xabc', 'eip155:137']

// Guardian summary for specific wallet
guardianKeys.summary('0xabc') // ['guardian', 'summary', '0xabc']
```

### Hunter Module Keys

```typescript
import { hunterKeys } from '@/lib/query-keys';

// Hunter feed for specific wallet/network
hunterKeys.feed('0xabc', 'eip155:1') // ['hunter', 'feed', '0xabc', 'eip155:1']

// Hunter opportunities for specific wallet/network
hunterKeys.opportunities('0xabc', 'eip155:137') // ['hunter', 'opportunities', '0xabc', 'eip155:137']

// Hunter alerts for specific wallet
hunterKeys.alerts('0xabc') // ['hunter', 'alerts', '0xabc']
```

### HarvestPro Module Keys

```typescript
import { harvestproKeys } from '@/lib/query-keys';

// HarvestPro opportunities for specific wallet/network
harvestproKeys.opportunities('0xabc', 'eip155:1') // ['harvestpro', 'opportunities', '0xabc', 'eip155:1']

// HarvestPro sessions for specific wallet
harvestproKeys.sessions('0xabc') // ['harvestpro', 'sessions', '0xabc']

// Specific HarvestPro session
harvestproKeys.session('session-123') // ['harvestpro', 'session', 'session-123']
```

### Portfolio Keys

```typescript
import { portfolioKeys } from '@/lib/query-keys';

// Portfolio balances for specific wallet/network
portfolioKeys.balances('0xabc', 'eip155:1') // ['portfolio', 'balances', '0xabc', 'eip155:1']

// Portfolio summary for specific wallet
portfolioKeys.summary('0xabc') // ['portfolio', 'summary', '0xabc']

// Portfolio NFTs for specific wallet/network
portfolioKeys.nfts('0xabc', 'eip155:137') // ['portfolio', 'nfts', '0xabc', 'eip155:137']
```

### Price Keys

```typescript
import { priceKeys } from '@/lib/query-keys';

// Price for specific token
priceKeys.token('ethereum') // ['prices', 'token', 'ethereum']

// Prices for multiple tokens (sorted for consistency)
priceKeys.tokens(['bitcoin', 'ethereum']) // ['prices', 'tokens', 'bitcoin', 'ethereum']
```

## Usage in Hooks

### Using Query Keys in useQuery

```typescript
import { useQuery } from '@tanstack/react-query';
import { guardianKeys } from '@/lib/query-keys';
import { useWallet } from '@/contexts/WalletContext';

export function useGuardianScan() {
  const { activeWallet, activeNetwork } = useWallet();

  return useQuery({
    queryKey: guardianKeys.scan(activeWallet, activeNetwork),
    queryFn: async () => {
      const response = await fetch(`/api/guardian/scan?wallet=${activeWallet}&network=${activeNetwork}`);
      return response.json();
    },
    enabled: !!activeWallet,
  });
}
```

### Using Query Keys in useInfiniteQuery

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';
import { hunterKeys } from '@/lib/query-keys';
import { useWallet } from '@/contexts/WalletContext';

export function useHunterFeed() {
  const { activeWallet, activeNetwork } = useWallet();

  return useInfiniteQuery({
    queryKey: hunterKeys.feed(activeWallet, activeNetwork),
    queryFn: async ({ pageParam }) => {
      const response = await fetch(
        `/api/hunter/feed?wallet=${activeWallet}&network=${activeNetwork}&cursor=${pageParam}`
      );
      return response.json();
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!activeWallet,
  });
}
```

## Invalidation Patterns

### Invalidate on Wallet Change

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { getWalletDependentQueryKeys } from '@/lib/query-keys';

export function useInvalidateOnWalletChange() {
  const queryClient = useQueryClient();
  const { activeWallet, activeNetwork } = useWallet();

  useEffect(() => {
    if (activeWallet) {
      const keysToInvalidate = getWalletDependentQueryKeys(activeWallet, activeNetwork);
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }
  }, [activeWallet, activeNetwork, queryClient]);
}
```

### Invalidate on Network Change

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { getNetworkDependentQueryKeys } from '@/lib/query-keys';

export function useInvalidateOnNetworkChange() {
  const queryClient = useQueryClient();
  const { activeWallet, activeNetwork } = useWallet();

  useEffect(() => {
    if (activeNetwork && activeWallet) {
      const keysToInvalidate = getNetworkDependentQueryKeys(activeWallet, activeNetwork);
      keysToInvalidate.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    }
  }, [activeNetwork, activeWallet, queryClient]);
}
```

### Invalidate on Wallet Mutation

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { walletKeys } from '@/lib/query-keys';

export function useAddWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wallet) => {
      const response = await fetch('/api/wallets/add', {
        method: 'POST',
        body: JSON.stringify(wallet),
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate wallet registry to trigger refetch
      queryClient.invalidateQueries({ queryKey: walletKeys.registry() });
    },
  });
}
```

## Hook: useWalletQueryInvalidation

The `useWalletQueryInvalidation` hook automatically handles invalidation when wallet or network changes:

```typescript
import { useWalletQueryInvalidation } from '@/hooks/useWalletQueryInvalidation';

export function RootLayout() {
  // This hook automatically invalidates queries on wallet/network changes
  useWalletQueryInvalidation();

  return (
    <div>
      Your app content
    </div>
  );
}
```

## Hook: useInvalidateWalletRegistry

The `useInvalidateWalletRegistry` hook provides a function to manually invalidate wallet registry:

```typescript
import { useInvalidateWalletRegistry } from '@/hooks/useWalletQueryInvalidation';

export function AddWalletButton() {
  const invalidateRegistry = useInvalidateWalletRegistry();

  const handleAddWallet = async () => {
    await addWallet(address, network);
    invalidateRegistry(); // Trigger refetch of wallet registry
  };

  return <button onClick={handleAddWallet}>Add Wallet</button>;
}
```

## Key Design Principles

### 1. Wallet and Network Context

All query keys include wallet and network context to ensure proper invalidation:

```typescript
// ✅ Good: Includes wallet and network
guardianKeys.scan('0xabc', 'eip155:1')

// ❌ Bad: Missing context
['guardian', 'scan']
```

### 2. Consistent Naming

Query key factories follow a consistent naming pattern:

```typescript
// Module name + operation
guardianKeys.scan()
hunterKeys.feed()
harvestproKeys.opportunities()
```

### 3. Automatic Refetch on Key Change

When query keys change (due to wallet/network change), React Query automatically refetches:

```typescript
// When activeWallet changes, this query automatically refetches
useQuery({
  queryKey: guardianKeys.scan(activeWallet, activeNetwork),
  queryFn: fetchGuardianData,
})
```

### 4. Explicit Invalidation for Mutations

After mutations, explicitly invalidate related queries:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: walletKeys.registry() });
}
```

## Testing

Query keys are tested in `src/lib/__tests__/query-integration.test.ts`:

```bash
npm test -- src/lib/__tests__/query-integration.test.ts --run
```

Tests verify:
- Query key consistency
- Proper wallet/network context inclusion
- Correct number of dependent keys
- Key changes on wallet/network changes

## Migration Guide

### From Old Pattern to New Pattern

**Before:**
```typescript
useQuery({
  queryKey: ['guardian-scan', activeWallet],
  queryFn: fetchGuardianData,
})
```

**After:**
```typescript
import { guardianKeys } from '@/lib/query-keys';

useQuery({
  queryKey: guardianKeys.scan(activeWallet, activeNetwork),
  queryFn: fetchGuardianData,
})
```

## References

- [React Query Documentation](https://tanstack.com/query/latest)
- [Query Key Factory Pattern](https://tkdodo.eu/blog/effective-react-query-keys)
- [Multi-Chain Wallet System Design](../../specs/multi-chain-wallet-system/design.md)
