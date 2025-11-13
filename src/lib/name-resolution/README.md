# Name Resolution Service

Resolves wallet addresses to human-readable names using ENS, Lens Protocol, and Unstoppable Domains.

## Features

- **Multi-Provider Resolution**: Tries ENS first, then Lens Protocol, then Unstoppable Domains
- **Automatic Caching**: 24-hour TTL to reduce API calls
- **Batch Resolution**: Resolve multiple addresses in parallel
- **Avatar Support**: Fetches avatar URLs when available (ENS and Lens)
- **Type-Safe**: Full TypeScript support
- **Error Handling**: Graceful fallback on provider failures

## Usage

### Basic Resolution

```typescript
import { resolveName } from '@/lib/name-resolution';

// Resolve a single address
const result = await resolveName('0x1234...');

if (result) {
  console.log(result.name); // 'vitalik.eth'
  console.log(result.provider); // 'ens'
  console.log(result.avatar); // 'https://...'
}
```

### Batch Resolution

```typescript
import { resolveNames } from '@/lib/name-resolution';

const addresses = ['0x1234...', '0x5678...', '0x9abc...'];
const results = await resolveNames(addresses);

results.forEach((result, address) => {
  if (result) {
    console.log(`${address} -> ${result.name}`);
  }
});
```

### Provider Selection

```typescript
// Only try ENS
const ensOnly = await resolveName('0x1234...', {
  providers: ['ens']
});

// Try ENS and Lens only (skip Unstoppable)
const ensAndLens = await resolveName('0x1234...', {
  providers: ['ens', 'lens']
});
```

### Cache Management

```typescript
import { clearCache, getCacheSize, preloadNames } from '@/lib/name-resolution';

// Clear all cached names
clearCache();

// Get cache size
const size = getCacheSize();

// Preload names for a list of addresses
await preloadNames(['0x1234...', '0x5678...']);
```

### Skip Cache

```typescript
// Force fresh resolution (bypass cache)
const fresh = await resolveName('0x1234...', {
  skipCache: true
});
```

## Integration with WalletContext

The name resolution service integrates seamlessly with the WalletContext:

```typescript
import { useWallet } from '@/contexts/WalletContext';
import { resolveName } from '@/lib/name-resolution';
import { useEffect, useState } from 'react';

function MyComponent() {
  const { connectedWallets, setConnectedWallets } = useWallet();
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    async function resolveWalletNames() {
      setIsResolving(true);
      
      // Resolve names for all connected wallets
      const addresses = connectedWallets.map(w => w.address);
      const results = await resolveNames(addresses);
      
      // Update wallet metadata with resolved names
      const updatedWallets = connectedWallets.map(wallet => {
        const resolved = results.get(wallet.address.toLowerCase());
        return {
          ...wallet,
          ens: resolved?.name || wallet.ens,
        };
      });
      
      setConnectedWallets(updatedWallets);
      setIsResolving(false);
    }

    if (connectedWallets.length > 0) {
      resolveWalletNames();
    }
  }, [connectedWallets.length]);

  return <div>...</div>;
}
```

## Provider Details

### ENS (Ethereum Name Service)

- **Network**: Ethereum Mainnet
- **Priority**: 1 (tried first)
- **Features**: Name + Avatar
- **Example**: `vitalik.eth`

### Lens Protocol

- **Network**: Polygon
- **Priority**: 2 (fallback)
- **Features**: Handle + Avatar
- **Example**: `vitalik.lens`

### Unstoppable Domains

- **Network**: Polygon
- **Priority**: 3 (last fallback)
- **Features**: Domain name
- **Example**: `vitalik.crypto`

## Performance

- **Cache TTL**: 24 hours
- **Timeout**: 5 seconds per provider
- **Parallel Resolution**: Batch requests run concurrently
- **Memory**: Efficient in-memory cache with automatic expiration

## Error Handling

The service handles errors gracefully:

- Provider failures don't crash the app
- Timeouts prevent hanging requests
- Failed resolutions are cached to avoid repeated attempts
- Logs debug messages for troubleshooting

## Testing

See `src/__tests__/lib/name-resolution/index.test.ts` for comprehensive test coverage.

## Requirements

- Requirement 18.19: Display ENS name in wallet selector if available
- Task 50: Implement ENS Name Resolution with Lens and UD fallback
