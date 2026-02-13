# Portfolio Import Error Fix

## ✅ Fixed: Missing portfolioEdgeFunctions Module

### Error
```
Failed to resolve import "@/lib/services/portfolioEdgeFunctions" from "src/components/portfolio/tabs/AuditTab.tsx". Does the file exist?
```

### Solution
Created the missing file: `src/lib/services/portfolioEdgeFunctions.ts`

### What This File Does

This service module provides client-side functions for calling Supabase Edge Functions and database queries related to portfolio data.

### Functions Included

1. **fetchWalletTransactions(walletAddress, limit)**
   - Fetches transaction history for a wallet from database
   - Used by AuditTab to display transaction timeline
   - Returns array of WalletTransaction objects

2. **fetchPortfolioPositions(userId, walletAddress)**
   - Calls portfolio-positions Edge Function
   - Used for fetching asset breakdown, chain distribution, protocol exposure
   - Will be used by PositionsTab (when implemented)

3. **runStressTest(scenarios, portfolioValue)**
   - Calls portfolio-stress-test Edge Function
   - Used for running stress test simulations
   - Will be used by StressTestTab (when refactored)

4. **fetchFlowGraph(walletAddress)**
   - Calls portfolio-flow-graph Edge Function
   - Used for generating wallet interaction graph
   - Will be used by AuditTab (when implemented)

5. **fetchExecutionReceipts(userId, limit)**
   - Fetches execution receipts from database
   - Used for displaying planned vs executed actions
   - Will be used by AuditTab (when implemented)

### Database Schema Expected

The functions expect these tables to exist:

```sql
-- Wallet transactions table
CREATE TABLE wallet_transactions (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  transaction_type TEXT,
  from_address TEXT,
  to_address TEXT,
  value_usd NUMERIC,
  gas_used BIGINT,
  gas_price BIGINT,
  status TEXT,
  ai_tags TEXT[],
  risk_score NUMERIC,
  description TEXT
);

-- Execution receipts table
CREATE TABLE execution_receipts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT,
  intent TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  gas_estimated BIGINT,
  gas_actual BIGINT,
  description TEXT,
  failure_reason TEXT
);
```

### How It's Used

**AuditTab** (current usage):
```typescript
import { fetchWalletTransactions } from '@/lib/services/portfolioEdgeFunctions';

const { data: transactions = [] } = useQuery({
  queryKey: ['wallet-transactions', walletScope, isDemo],
  queryFn: async () => {
    if (isDemo) {
      return demoTransactions;
    }
    
    if (walletScope.mode === 'active_wallet') {
      return await fetchWalletTransactions(walletScope.address, 50);
    }
    
    return [];
  }
});
```

### Next Steps

1. **Create database tables** (if they don't exist)
   - Run the SQL schema above in Supabase
   - Add indexes for performance

2. **Populate transaction data**
   - Set up blockchain indexer to populate wallet_transactions
   - Or use existing transaction sync mechanism

3. **Test the fix**
   - Connect wallet in Portfolio tab
   - Navigate to Audit tab
   - Verify transactions load (or show empty state if no data)

### Testing

**Demo Mode** (wallet not connected):
```bash
# Should show demo transactions instantly
# No database queries made
```

**Live Mode** (wallet connected):
```bash
# Should query database for real transactions
# If no transactions found, shows empty state
# If database error, returns empty array (graceful degradation)
```

### Error Handling

The functions include error handling:
- Logs errors to console
- Returns empty arrays on failure (prevents UI crashes)
- Graceful degradation to empty states

### Status

✅ **File created**: `src/lib/services/portfolioEdgeFunctions.ts`
✅ **Import error resolved**: AuditTab can now import the module
✅ **Functions ready**: All portfolio Edge Function wrappers available

### Related Files

- `src/components/portfolio/tabs/AuditTab.tsx` - Uses fetchWalletTransactions
- `src/components/portfolio/tabs/PositionsTab.tsx` - Will use fetchPortfolioPositions
- `src/components/portfolio/tabs/StressTestTab.tsx` - Will use runStressTest

---

**The import error should now be resolved. The app should compile successfully.**
