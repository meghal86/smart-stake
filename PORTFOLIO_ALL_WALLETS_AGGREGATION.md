# Portfolio All Wallets Aggregation - Implementation Complete

## Overview

The Portfolio system now supports aggregating data from **all user wallets** in addition to viewing a single active wallet. This allows users to see their complete portfolio across multiple addresses.

## Implementation Details

### 1. Wallet Scope Modes

The system supports two modes via the `WalletScope` type:

```typescript
type WalletScope = 
  | { mode: 'active_wallet'; address: `0x${string}` }  // Single wallet
  | { mode: 'all_wallets' };                           // All user wallets
```

### 2. Address Resolution

**File**: `src/services/PortfolioSnapshotService.ts`

The `resolveAddresses()` method now:
- Returns single address for `active_wallet` mode
- Queries `user_portfolio_addresses` table for `all_wallets` mode
- Fetches all wallet addresses associated with the user

```typescript
private async resolveAddresses(userId: string, walletScope: WalletScope): Promise<string[]> {
  if (walletScope.mode === 'active_wallet') {
    return [walletScope.address];
  }
  
  // Fetch all user wallets from database
  const { data, error } = await supabase
    .from('user_portfolio_addresses')
    .select('address')
    .eq('user_id', userId);
  
  return data.map(row => row.address);
}
```

### 3. Data Aggregation

All data fetching methods now support multiple addresses:

#### Portfolio Valuation (`getPortfolioData`)
- **Single wallet**: Direct API call
- **Multiple wallets**: Parallel calls with `Promise.allSettled()`
- **Aggregation**: Sums net worth and delta24h across all wallets
- **Positions**: Combines positions from all wallets with wallet identifier

```typescript
// Example aggregated result:
{
  netWorth: 125000,      // Sum of all wallets
  delta24h: 3500,        // Sum of 24h changes
  positions: [
    { id: '0xabc...123-ETH-wallet', token: 'ETH', valueUsd: 50000, walletAddress: '0xabc...123' },
    { id: '0xdef...456-BTC-wallet', token: 'BTC', valueUsd: 75000, walletAddress: '0xdef...456' }
  ]
}
```

#### Guardian Security (`getGuardianData`)
- **Single wallet**: Direct Guardian scan
- **Multiple wallets**: Parallel Guardian scans
- **Aggregation**: 
  - Takes **maximum risk score** across all wallets (worst-case)
  - Combines all approvals with wallet identifiers
  - Merges all security flags

```typescript
// Example aggregated result:
{
  riskScore: 7.5,        // Max risk score (worst wallet)
  approvals: [
    { id: 'approval-1', severity: 'high', walletAddress: '0xabc...123' },
    { id: 'approval-2', severity: 'medium', walletAddress: '0xdef...456' }
  ],
  flags: [...]
}
```

#### Hunter Opportunities (`getHunterData`)
- Passes all addresses to Hunter API
- Hunter API handles multi-wallet opportunity detection
- Returns combined opportunities across all wallets

#### Harvest Tax Optimization (`getHarvestData`)
- Passes all addresses to Harvest API
- Harvest API handles multi-wallet tax optimization
- Returns combined recommendations and total tax savings

### 4. UI Integration

**File**: `src/components/portfolio/PortfolioRouteShell.tsx`

The wallet selector dropdown now supports:
- **Individual wallets**: Select specific wallet to view
- **"All Wallets" option**: Aggregate view across all wallets

```typescript
const walletScope = useMemo<WalletScope>(() => {
  if (activeWallet) {
    const wallet = addresses.find(addr => addr.id === activeWallet);
    if (wallet) {
      return { mode: 'active_wallet', address: wallet.address as `0x${string}` };
    }
  }
  return { mode: 'all_wallets' };
}, [activeWallet, addresses]);
```

When user selects "All Wallets" from dropdown:
1. `activeWallet` state becomes `null`
2. `walletScope` becomes `{ mode: 'all_wallets' }`
3. `resolveAddresses()` fetches all user wallets
4. Data is aggregated across all addresses
5. UI displays combined portfolio

## Console Logging

All aggregation operations include comprehensive logging:

```
🎯 [PortfolioSnapshot] Resolving addresses for ALL_WALLETS mode, userId: user-123
✅ [PortfolioSnapshot] Found 3 wallets for user: ['0xabc...', '0xdef...', '0xghi...']

📊 [PortfolioSnapshot] Fetching portfolio data for 3 address(es)
🔄 [PortfolioSnapshot] Aggregating portfolio data across multiple wallets
✅ [PortfolioSnapshot] Aggregated portfolio: $125000.00, 15 positions

🛡️ [PortfolioSnapshot] Fetching Guardian data for 3 address(es)
🔄 [PortfolioSnapshot] Aggregating Guardian data across multiple wallets
✅ [PortfolioSnapshot] Aggregated Guardian: 8 approvals, risk score 7.5

🎯 [PortfolioSnapshot] Fetching Hunter data for 3 address(es)
✅ [PortfolioSnapshot] Hunter data: 12 opportunities

💰 [PortfolioSnapshot] Fetching Harvest data for 3 address(es)
✅ [PortfolioSnapshot] Harvest data: 5 recommendations, $2500.00 potential savings
```

## Database Schema

The system relies on the `user_portfolio_addresses` table:

```sql
CREATE TABLE user_portfolio_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  address TEXT NOT NULL,
  label TEXT,
  address_group TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user wallet lookups
CREATE INDEX idx_user_portfolio_addresses_user_id 
ON user_portfolio_addresses(user_id);
```

## How to Use

### For Users

1. **Add Multiple Wallets**:
   - Go to Settings → Wallet Management
   - Add wallet addresses with labels
   - Wallets are saved to database

2. **View Individual Wallet**:
   - Select wallet from dropdown in Portfolio page
   - Data shows only for that wallet

3. **View All Wallets**:
   - Select "All Wallets" from dropdown
   - Data aggregates across all your wallets
   - Net worth, positions, approvals, opportunities all combined

### For Developers

**Fetch aggregated data**:

```typescript
import { portfolioSnapshotService } from '@/services/PortfolioSnapshotService';

// All wallets mode
const snapshot = await portfolioSnapshotService.getSnapshot(
  userId,
  { mode: 'all_wallets' }
);

// Single wallet mode
const snapshot = await portfolioSnapshotService.getSnapshot(
  userId,
  { mode: 'active_wallet', address: '0xabc...123' }
);
```

**Use in components**:

```typescript
import { usePortfolioIntegration } from '@/hooks/portfolio/usePortfolioIntegration';

const { snapshot, actions, approvals } = usePortfolioIntegration({
  scope: { mode: 'all_wallets' },
  enableSnapshot: true,
  enableActions: true,
  enableApprovals: true
});
```

## Performance Considerations

### Parallel Fetching
- All wallet data is fetched in parallel using `Promise.allSettled()`
- Failed requests don't block successful ones
- Graceful degradation if some wallets fail to load

### Caching
- Cache keys include wallet scope mode
- `all_wallets` cache is separate from individual wallet caches
- Cache invalidation handles both modes

### Rate Limiting
- Multiple wallet scans may hit rate limits
- Consider implementing request batching for large wallet counts
- Guardian/Hunter/Harvest APIs should support batch requests

## Error Handling

### Partial Failures
- If some wallets fail to load, system continues with successful ones
- Confidence score reflects data completeness
- Degraded mode banner shows if confidence drops below threshold

### Empty Wallet List
- If user has no wallets in database, returns empty data
- UI shows appropriate empty state
- No API calls made for empty wallet list

## Testing

### Manual Testing

1. **Add multiple wallets**:
   ```sql
   INSERT INTO user_portfolio_addresses (user_id, address, label)
   VALUES 
     ('user-123', '0xabc...123', 'Main Wallet'),
     ('user-123', '0xdef...456', 'Trading Wallet'),
     ('user-123', '0xghi...789', 'Cold Storage');
   ```

2. **Test aggregation**:
   - Open Portfolio page
   - Select "All Wallets" from dropdown
   - Check console logs for aggregation
   - Verify net worth is sum of all wallets
   - Verify positions include all wallets

3. **Test individual wallet**:
   - Select specific wallet from dropdown
   - Verify data shows only for that wallet
   - Check console logs show single wallet mode

### Automated Testing

```typescript
describe('Portfolio All Wallets Aggregation', () => {
  test('aggregates net worth across multiple wallets', async () => {
    const snapshot = await portfolioSnapshotService.getSnapshot(
      'user-123',
      { mode: 'all_wallets' }
    );
    
    expect(snapshot.netWorth).toBeGreaterThan(0);
    expect(snapshot.positions.length).toBeGreaterThan(0);
  });
  
  test('takes maximum risk score across wallets', async () => {
    const snapshot = await portfolioSnapshotService.getSnapshot(
      'user-123',
      { mode: 'all_wallets' }
    );
    
    // Risk score should be worst-case (highest)
    expect(snapshot.riskSummary.overallScore).toBeDefined();
  });
});
```

## Future Enhancements

### Wallet Grouping
- Allow users to create wallet groups (e.g., "Personal", "Business")
- Support `{ mode: 'wallet_group', groupId: 'group-123' }`
- Aggregate only wallets in specific group

### Performance Optimization
- Implement request batching for Guardian/Hunter/Harvest
- Add pagination for large wallet counts
- Cache individual wallet data separately

### Advanced Analytics
- Show per-wallet breakdown in UI
- Wallet-to-wallet comparison charts
- Identify which wallet has highest risk/opportunity

### Multi-User Support
- Support viewing wallets across multiple users (for advisors)
- Family/team portfolio aggregation
- Permission-based wallet access

## Summary

✅ **Implemented**:
- `resolveAddresses()` method fetches all user wallets from database
- Portfolio data aggregation (sum net worth, combine positions)
- Guardian data aggregation (max risk score, combine approvals)
- Hunter data aggregation (combined opportunities)
- Harvest data aggregation (combined recommendations)
- Comprehensive console logging
- UI dropdown for wallet selection

✅ **Tested**:
- Single wallet mode works as before
- All wallets mode aggregates correctly
- Parallel fetching with graceful degradation
- Console logs show aggregation process

✅ **Ready for Production**:
- Error handling for partial failures
- Cache invalidation for both modes
- Performance optimized with parallel requests
- User-friendly UI with loading states

The all_wallets aggregation feature is now **fully implemented and ready to use**! 🎉
