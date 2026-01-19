# AlphaWhale Balance Architecture

## Core Principle: Wallet Provider = Signer, AlphaWhale RPC = Source of Truth

AlphaWhale follows the recommended DeFi pattern where:
- **Wallet providers** (MetaMask, Rainbow, Coinbase) are used **only for signing transactions**
- **AlphaWhale's configured RPCs** are the **source of truth** for all balance and portfolio data

## Why This Architecture?

### Problems with Wallet RPC Endpoints
- **Opaque**: You can't see or control the RPC configuration
- **Rate Limited**: Wallet providers impose their own limits
- **No MEV Protection**: Can't configure MEV-resistant endpoints
- **Inconsistent**: Different wallets may show different data
- **No Fallbacks**: Single point of failure
- **No Observability**: Can't monitor or debug RPC issues

### Benefits of AlphaWhale RPC Stack
- **Consistent Data**: Same data across Guardian/Hunter/HarvestPro
- **MEV Protection**: Can use Flashbots, Eden, etc.
- **Multiple Providers**: Alchemy + QuickNode + Chainstack fallbacks
- **Rate Limit Control**: Configure your own limits
- **Observability**: Monitor RPC health and performance
- **Cost Optimization**: Choose cost-effective providers
- **Latency Optimization**: Use geographically close endpoints

## Implementation Architecture

### 1. RPC Provider Configuration
**File:** `src/lib/rpc/providers.ts`

```typescript
// Multi-provider fallback configuration
const RPC_ENDPOINTS = {
  ethereum: [
    'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',      // Primary
    'https://ethereum-mainnet.core.chainstack.com/YOUR_KEY', // Fallback 1
    'https://ethereum.publicnode.com',                    // Fallback 2
  ],
  // ... other chains
};

// Viem clients with automatic fallback
export const ethereumClient = createPublicClient({
  chain: mainnet,
  transport: fallback(RPC_ENDPOINTS.ethereum.map(url => http(url)))
});
```

### 2. Balance Service Layer
**File:** `src/lib/balance/balanceService.ts`

```typescript
class BalanceService {
  // Uses AlphaWhale RPCs, not wallet RPCs
  async getNativeBalance(address: string, chainId: number) {
    const client = getClientForChain(chainId);
    const balance = await client.getBalance({ address });
    return formatBalance(balance);
  }
}
```

### 3. Frontend Integration
**File:** `src/components/wallet/WalletBalanceDisplay.tsx`

```typescript
// Get addresses from wallet (for signer)
const { address } = useAccount();

// Get balances from AlphaWhale RPC (for data)
const balance = await balanceService.getNativeBalance(address, chainId);
```

## Data Flow

### ✅ Correct Flow (AlphaWhale)
```
1. User connects MetaMask → Get addresses for signing
2. AlphaWhale RPC → Get balance data via provider.getBalance()
3. AlphaWhale API → Cache and aggregate portfolio data
4. Frontend → Display consistent data across all features
```

### ❌ Wrong Flow (Wallet-dependent)
```
1. User connects MetaMask → Get addresses
2. MetaMask RPC → Get balance via wallet's internal RPC
3. Frontend → Show inconsistent data, rate limits, no fallbacks
```

## Multi-Chain Support

### Supported Chains
- **Ethereum** (Chain ID: 1)
- **Polygon** (Chain ID: 137)
- **Arbitrum** (Chain ID: 42161)
- **Optimism** (Chain ID: 10)
- **Base** (Chain ID: 8453)

### Chain Configuration
```typescript
export const chainClients: Record<number, PublicClient> = {
  1: ethereumClient,     // Ethereum Mainnet
  137: polygonClient,    // Polygon
  42161: arbitrumClient, // Arbitrum One
  10: optimismClient,    // Optimism
  8453: baseClient,      // Base
};
```

## Environment Variables

### Required RPC Configuration
```bash
# Primary Providers (Recommended)
NEXT_PUBLIC_ALCHEMY_ETH_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_QUICKNODE_ETH_URL=https://your-endpoint.quiknode.pro/YOUR_KEY
NEXT_PUBLIC_CHAINSTACK_ETH_URL=https://ethereum-mainnet.core.chainstack.com/YOUR_KEY

# Multi-chain Support
NEXT_PUBLIC_ALCHEMY_POLYGON_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_ALCHEMY_ARB_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_ALCHEMY_OP_URL=https://opt-mainnet.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_ALCHEMY_BASE_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
```

## Backend Integration Pattern

### Scheduled Balance Refresher
```typescript
// Supabase Edge Function: balance-refresher
export default async function handler(req: Request) {
  const users = await getUsersWithWallets();
  
  for (const user of users) {
    for (const wallet of user.wallets) {
      // Use AlphaWhale RPC, not wallet RPC
      const balance = await balanceService.getNativeBalance(
        wallet.address, 
        wallet.chainId
      );
      
      // Store in unified portfolio table
      await supabase
        .from('portfolio_balances')
        .upsert({
          user_id: user.id,
          address: wallet.address,
          chain_id: wallet.chainId,
          balance: balance.balance,
          usd_value: balance.usdValue,
          updated_at: new Date(),
        });
    }
  }
}
```

### Unified Portfolio API
```typescript
// API Route: /api/portfolio/balances
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  
  // Get aggregated balance data (not from wallet RPC)
  const { data } = await supabase
    .from('portfolio_balances')
    .select('*')
    .eq('user_id', userId)
    .order('usd_value', { ascending: false });
  
  return NextResponse.json({ data });
}
```

## Caching Strategy

### Frontend Caching
- **React Query**: 30-second cache for balance data
- **Service Worker**: Cache RPC responses for offline support

### Backend Caching
- **Supabase**: Store aggregated portfolio data
- **Redis/Upstash**: Cache frequently accessed balances
- **Edge Functions**: Scheduled refresh every 5 minutes

## Error Handling & Fallbacks

### RPC Fallback Chain
```typescript
// Automatic fallback if primary RPC fails
const transport = fallback([
  http('https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY'),    // Primary
  http('https://ethereum-mainnet.core.chainstack.com/YOUR_KEY'), // Fallback 1
  http('https://ethereum.publicnode.com'),                  // Fallback 2
]);
```

### Circuit Breaker Pattern
```typescript
class BalanceService {
  private circuitBreaker = new CircuitBreaker();
  
  async getNativeBalance(address: string, chainId: number) {
    return this.circuitBreaker.execute(async () => {
      const client = getClientForChain(chainId);
      return await client.getBalance({ address });
    });
  }
}
```

## Monitoring & Observability

### RPC Health Checks
```typescript
export async function checkRPCHealth() {
  const results = [];
  
  for (const [chainName, client] of Object.entries(chainClients)) {
    try {
      const blockNumber = await client.getBlockNumber();
      results.push({
        chain: chainName,
        status: 'healthy',
        blockNumber: Number(blockNumber),
        latency: Date.now() - start,
      });
    } catch (error) {
      results.push({
        chain: chainName,
        status: 'unhealthy',
        error: error.message,
      });
    }
  }
  
  return results;
}
```

### Performance Metrics
- **RPC Latency**: Track response times per provider
- **Success Rate**: Monitor RPC call success/failure rates
- **Cache Hit Rate**: Track balance cache effectiveness
- **Cost Tracking**: Monitor RPC usage and costs

## Security Considerations

### Private Key Separation
- **Wallet Provider**: Holds private keys, signs transactions
- **AlphaWhale**: Never touches private keys, only reads public data

### RPC Security
- **API Keys**: Secure storage of RPC provider API keys
- **Rate Limiting**: Prevent abuse of RPC endpoints
- **CORS**: Restrict RPC access to AlphaWhale domains

## Migration from Wallet RPC

### Phase 1: Dual Mode
- Keep existing wallet RPC calls
- Add AlphaWhale RPC calls in parallel
- Compare results for accuracy

### Phase 2: Switch Over
- Use AlphaWhale RPC as primary
- Keep wallet RPC as fallback
- Monitor for any discrepancies

### Phase 3: Full Migration
- Remove wallet RPC dependencies
- Use AlphaWhale RPC exclusively
- Implement full caching and aggregation

## Testing Strategy

### Unit Tests
```typescript
describe('BalanceService', () => {
  test('fetches balance via AlphaWhale RPC', async () => {
    const balance = await balanceService.getNativeBalance(
      '0x1234...', 
      1
    );
    
    expect(balance.chainId).toBe(1);
    expect(balance.symbol).toBe('ETH');
  });
});
```

### Integration Tests
```typescript
test('multi-chain balance aggregation', async () => {
  const balances = await balanceService.getMultiChainBalances(
    ['0x1234...'],
    [1, 137, 42161]
  );
  
  expect(balances).toHaveLength(3);
  expect(balances.map(b => b.chainId)).toEqual([1, 137, 42161]);
});
```

## Performance Benchmarks

### Target Metrics
- **Balance Fetch**: < 500ms per address per chain
- **Multi-chain Aggregation**: < 2s for 5 chains
- **Cache Hit Rate**: > 80% for frequently accessed addresses
- **RPC Uptime**: > 99.9% with fallbacks

## Future Enhancements

### Advanced Features
- **MEV Protection**: Integrate Flashbots Protect for sensitive reads
- **Private Mempools**: Use private RPCs for Guardian scanning
- **Cross-chain Aggregation**: Unified portfolio across all chains
- **Real-time Updates**: WebSocket connections for live balance updates

### Optimization
- **Batch Requests**: Group multiple balance calls
- **Predictive Caching**: Pre-fetch likely-needed balances
- **Edge Caching**: CDN-level caching for static balance data

---

**Implementation Status:** ✅ Core architecture implemented
**Next Steps:** Configure production RPC endpoints and implement backend aggregation
**Documentation:** This architecture ensures AlphaWhale has full control over data consistency and reliability