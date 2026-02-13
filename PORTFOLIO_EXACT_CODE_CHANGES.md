# Portfolio Real-Time Data - Exact Code Changes

## ✅ COMPLETED: OverviewTab Fix

### File: `src/components/portfolio/tabs/OverviewTab.tsx`

**Line 88-90**: Changed from mock to real data
```typescript
// ❌ BEFORE
const mockWhaleInteractions = [...hardcoded data...];

// ✅ AFTER  
const whaleInteractions = snapshot?.whaleInteractions || [];
console.log('🐋 Whale interactions:', {
  hasSnapshot: !!snapshot,
  whaleInteractionsCount: whaleInteractions.length,
  isDemo
});
```

**Line 145-155**: Updated component to use real data
```typescript
// ❌ BEFORE
<WhaleInteractionLog
  interactions={mockWhaleInteractions}
  currentFilter={whaleFilter}
  onFilterChange={setWhaleFilter}
/>

// ✅ AFTER
{isLoading ? (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
    ))}
  </div>
) : whaleInteractions.length > 0 ? (
  <WhaleInteractionLog
    interactions={whaleInteractions}
    currentFilter={whaleFilter}
    onFilterChange={setWhaleFilter}
  />
) : (
  <div className="text-center py-8 text-gray-400">
    <p>No whale interactions detected</p>
    <p className="text-sm mt-2">Your wallet hasn't interacted with any whale addresses recently</p>
  </div>
)}
```

---

## ✅ COMPLETED: AuditTab Fix

### File: `src/components/portfolio/tabs/AuditTab.tsx`

**Line 70-75**: Changed from mock to real data
```typescript
// ❌ BEFORE
<TransactionTimeline
  transactions={mockTransactions}
  walletScope={walletScope}
  freshness={freshness}
/>

<ApprovalsRiskList
  approvals={mockApprovals}
  freshness={freshness}
  walletScope={walletScope}
/>

// ✅ AFTER
<TransactionTimeline
  transactions={transactions}
  walletScope={walletScope}
  freshness={freshness}
/>

<ApprovalsRiskList
  approvals={approvals}
  freshness={freshness}
  walletScope={walletScope}
/>
```

---

## 🔨 TODO: PositionsTab Fix

### Step 1: Create Hook
**File**: `src/hooks/portfolio/usePortfolioPositions.ts` (NEW FILE)

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { WalletScope } from '@/types/portfolio';
import { useDemoMode } from '@/lib/ux/DemoModeManager';
import { getDemoPositionsData } from '@/lib/services/portfolioDemoDataService';
import { portfolioKeys } from './usePortfolioIntegration';

export interface UsePortfolioPositionsOptions {
  scope: WalletScope;
  enabled?: boolean;
}

async function fetchPortfolioPositions(scope: WalletScope, isDemo: boolean) {
  if (isDemo) {
    return getDemoPositionsData();
  }

  const params = new URLSearchParams();
  params.set('scope', scope.mode);
  if (scope.mode === 'active_wallet') {
    params.set('wallet', scope.address);
  }

  const response = await fetch(`/api/v1/portfolio/positions?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch portfolio positions: ${response.statusText}`);
  }

  return response.json();
}

export function usePortfolioPositions({ scope, enabled = true }: UsePortfolioPositionsOptions) {
  const queryClient = useQueryClient();
  const { isDemo } = useDemoMode();

  const query = useQuery({
    queryKey: [...portfolioKeys.positions(scope), isDemo],
    queryFn: () => fetchPortfolioPositions(scope, isDemo),
    enabled,
    staleTime: isDemo ? Infinity : 60_000,
    refetchInterval: isDemo ? false : 30_000,
    retry: isDemo ? 0 : 2,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: portfolioKeys.positions(scope) });
  }, [queryClient, scope]);

  return {
    ...query,
    positions: query.data,
    invalidate,
  };
}
```

### Step 2: Create API Route
**File**: `src/app/api/v1/portfolio/positions/route.ts` (NEW FILE)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const positionsRequestSchema = z.object({
  scope: z.enum(['active_wallet', 'all_wallets']).default('active_wallet'),
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const validationResult = positionsRequestSchema.safeParse({
      scope: searchParams.get('scope'),
      wallet: searchParams.get('wallet'),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: { code: 'INVALID_PARAMETERS', message: 'Invalid query parameters' } },
        { status: 400 }
      );
    }

    const { scope, wallet } = validationResult.data;

    if (scope === 'active_wallet' && !wallet) {
      return NextResponse.json(
        { error: { code: 'MISSING_WALLET', message: 'Wallet address required' } },
        { status: 400 }
      );
    }

    // TODO: Get user ID from auth
    const userId = 'placeholder-user-id';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.functions.invoke('portfolio-positions', {
      body: { userId, scope, wallet }
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      data,
      apiVersion: 'v1',
      ts: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Portfolio positions API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve positions' } },
      { status: 500 }
    );
  }
}
```

### Step 3: Create Edge Function
**File**: `supabase/functions/portfolio-positions/index.ts` (NEW FILE)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { userId, scope, wallet } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch user's positions from database
    let query = supabase
      .from('user_positions')
      .select('*')
      .eq('user_id', userId);

    if (scope === 'active_wallet' && wallet) {
      query = query.eq('wallet_address', wallet);
    }

    const { data: positions, error } = await query;

    if (error) throw error;

    // Calculate asset breakdown
    const assetMap = new Map();
    let totalValue = 0;

    positions.forEach(pos => {
      const existing = assetMap.get(pos.symbol) || {
        id: pos.token_address,
        symbol: pos.symbol,
        name: pos.token_name,
        amount: 0,
        valueUsd: 0,
        priceChange24h: pos.price_change_24h || 0,
        allocation: 0,
        category: 'token',
        chainId: pos.chain_id,
        riskScore: pos.risk_score || 0
      };

      existing.amount += pos.amount;
      existing.valueUsd += pos.value_usd;
      assetMap.set(pos.symbol, existing);
      totalValue += pos.value_usd;
    });

    // Calculate allocations
    const assets = Array.from(assetMap.values()).map(asset => ({
      ...asset,
      allocation: (asset.valueUsd / totalValue) * 100
    }));

    // Calculate chain distribution
    const chainMap = new Map();
    positions.forEach(pos => {
      const existing = chainMap.get(pos.chain_id) || { value: 0, name: pos.chain_name };
      existing.value += pos.value_usd;
      chainMap.set(pos.chain_id, existing);
    });

    const chains = Array.from(chainMap.entries()).map(([chainId, data]) => ({
      name: data.name,
      value: data.value,
      percentage: (data.value / totalValue) * 100,
      color: getChainColor(chainId)
    }));

    // Calculate protocol exposure
    const protocolMap = new Map();
    positions.forEach(pos => {
      if (pos.protocol_id) {
        const existing = protocolMap.get(pos.protocol_id) || {
          id: pos.protocol_id,
          name: pos.protocol_name,
          category: pos.protocol_category,
          valueUsd: 0,
          allocation: 0,
          positions: [],
          riskLevel: 'medium'
        };

        existing.valueUsd += pos.value_usd;
        existing.positions.push({
          pair: pos.pair_name || pos.symbol,
          valueUsd: pos.value_usd,
          apy: pos.apy || 0
        });

        protocolMap.set(pos.protocol_id, existing);
      }
    });

    const protocols = Array.from(protocolMap.values()).map(protocol => ({
      ...protocol,
      allocation: (protocol.valueUsd / totalValue) * 100
    }));

    // TODO: Calculate benchmark comparison (requires historical data)
    const benchmarks = [];

    return new Response(
      JSON.stringify({
        assets,
        chains,
        protocols,
        benchmarks,
        totalValue
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function getChainColor(chainId: number): string {
  const colors: Record<number, string> = {
    1: '#627EEA',    // Ethereum
    137: '#8247E5',  // Polygon
    56: '#F3BA2F',   // BSC
    43114: '#E84142', // Avalanche
    250: '#1969FF',  // Fantom
    42161: '#28A0F0', // Arbitrum
    10: '#FF0420',   // Optimism
  };
  return colors[chainId] || '#6B7280';
}
```

### Step 4: Update Component
**File**: `src/components/portfolio/tabs/PositionsTab.tsx`

```typescript
// ❌ DELETE ALL MOCK DATA (lines 15-120)
// const [mockAssets] = useState([...]);
// const [mockChainData] = useState([...]);
// const [mockProtocols] = useState([...]);
// const [mockBenchmarkData] = useState([...]);
// const [mockComparisons] = useState([...]);

// ✅ ADD THIS
import { usePortfolioPositions } from '@/hooks/portfolio/usePortfolioPositions';
import { useDemoMode } from '@/lib/ux/DemoModeManager';

export function PositionsTab({ walletScope, freshness }: PositionsTabProps) {
  const { isDemo } = useDemoMode();
  const { positions, isLoading } = usePortfolioPositions({ 
    scope: walletScope, 
    enabled: true 
  });

  const assets = positions?.assets || [];
  const chains = positions?.chains || [];
  const protocols = positions?.protocols || [];
  const benchmarks = positions?.benchmarks || [];
  const totalValue = positions?.totalValue || 0;

  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '30D' | '90D'>('30D');

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-64 bg-white/5 rounded-3xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AssetBreakdown
        assets={assets}
        totalValue={totalValue}
        freshness={freshness}
        walletScope={walletScope}
      />

      <ChainBreakdownChart
        data={chains}
        totalValue={totalValue}
      />

      <ProtocolExposure
        protocols={protocols}
        totalValue={totalValue}
        freshness={freshness}
      />

      {benchmarks.length > 0 && (
        <BenchmarkComparison
          data={benchmarks}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />
      )}
    </div>
  );
}
```

### Step 5: Add Demo Data
**File**: `src/lib/services/portfolioDemoDataService.ts`

```typescript
// ADD THIS FUNCTION
export function getDemoPositionsData() {
  return {
    assets: [
      {
        id: 'eth',
        symbol: 'ETH',
        name: 'Ethereum',
        amount: 15.5,
        valueUsd: 38750,
        priceChange24h: 2.3,
        allocation: 60,
        category: 'token' as const,
        chainId: 1,
        riskScore: 0.1
      },
      {
        id: 'usdc',
        symbol: 'USDC',
        name: 'USD Coin',
        amount: 25000,
        valueUsd: 25000,
        priceChange24h: 0.1,
        allocation: 20,
        category: 'token' as const,
        chainId: 1,
        riskScore: 0.05
      },
      {
        id: 'sol',
        symbol: 'SOL',
        name: 'Solana',
        amount: 150,
        valueUsd: 12000,
        priceChange24h: -1.8,
        allocation: 12,
        category: 'token' as const,
        chainId: 101,
        riskScore: 0.25
      },
      {
        id: 'matic',
        symbol: 'MATIC',
        name: 'Polygon',
        amount: 8000,
        valueUsd: 8000,
        priceChange24h: 4.2,
        allocation: 8,
        category: 'token' as const,
        chainId: 137,
        riskScore: 0.2
      }
    ],
    chains: [
      { name: 'Ethereum', value: 63750, percentage: 60, color: '#627EEA' },
      { name: 'Solana', value: 12000, percentage: 12, color: '#9945FF' },
      { name: 'Polygon', value: 8000, percentage: 8, color: '#8247E5' },
      { name: 'Others', value: 21250, percentage: 20, color: '#6B7280' }
    ],
    protocols: [
      {
        id: 'uniswap',
        name: 'Uniswap V3',
        category: 'DEX',
        valueUsd: 15000,
        allocation: 15,
        positions: [
          { pair: 'ETH/USDC', valueUsd: 10000, apy: 12.5 },
          { pair: 'USDC/DAI', valueUsd: 5000, apy: 8.2 }
        ],
        riskLevel: 'medium' as const
      },
      {
        id: 'aave',
        name: 'Aave V3',
        category: 'Lending',
        valueUsd: 8000,
        allocation: 8,
        positions: [
          { asset: 'USDC', valueUsd: 8000, apy: 4.2 }
        ],
        riskLevel: 'low' as const
      }
    ],
    benchmarks: [
      { date: '2024-01-01', portfolio: 0, ethereum: 0, bitcoin: 0, solana: 0 },
      { date: '2024-01-07', portfolio: 2.1, ethereum: 1.8, bitcoin: 1.2, solana: 3.5 },
      { date: '2024-01-14', portfolio: 5.3, ethereum: 4.2, bitcoin: 2.8, solana: 8.1 },
      { date: '2024-01-21', portfolio: 8.7, ethereum: 6.5, bitcoin: 4.1, solana: 12.3 },
      { date: '2024-01-28', portfolio: 12.4, ethereum: 9.2, bitcoin: 6.8, solana: 15.7 }
    ],
    totalValue: 105000
  };
}
```

---

## Summary of Changes

### ✅ Completed (2/4 tabs)
1. **OverviewTab**: Real whale interactions
2. **AuditTab**: Real transactions and approvals

### 🔨 Remaining (2/4 tabs)
3. **PositionsTab**: Need to implement 5 files
4. **StressTestTab**: Need to refactor architecture

### Files Created/Modified
- ✅ `src/components/portfolio/tabs/OverviewTab.tsx` (modified)
- ✅ `src/components/portfolio/tabs/AuditTab.tsx` (modified)
- ⏳ `src/hooks/portfolio/usePortfolioPositions.ts` (create)
- ⏳ `src/app/api/v1/portfolio/positions/route.ts` (create)
- ⏳ `supabase/functions/portfolio-positions/index.ts` (create)
- ⏳ `src/components/portfolio/tabs/PositionsTab.tsx` (modify)
- ⏳ `src/lib/services/portfolioDemoDataService.ts` (extend)

### Next Action
Implement PositionsTab by creating the 5 files listed above in order.
