# Whale Behavior Clusters - Data Coherence Fix

## 🎯 Problem Summary

The QA audit identified critical data coherence issues in the Whale Behavior Clusters section:

1. **"No transactions found" while values ≠ 0** - Clusters showing large net flows but empty transaction lists
2. **"% of total" > 100%** - Share calculations exceeding 100% (e.g., 297.3%)
3. **Direction labeling mismatch** - Inconsistent flow directions and cluster descriptions
4. **Confidence vs Rules** - 0% confidence clusters still showing classifications
5. **Formatting issues** - Too many decimals, missing signs, inconsistent units
6. **Alert linkage broken** - No visual connection between alerts and clusters

## ✅ Solution Implemented

### 1. Unified Data Layer with Fallbacks (`src/lib/market/data.ts`)

```typescript
export async function getClusterBundle(clusterId: string, window: Window): Promise<ClusterBundle> {
  // Step 1: Try tx_events for metrics + samples
  // Step 2: Fallback to balance deltas if no tx data  
  // Step 3: Final fallback - insufficient data state
}
```

**Key Features:**
- Primary source: `whale_alert_events` table for real transaction data
- Fallback: Balance delta aggregation with "Top Movers" display
- Honest empty state: "No activity in last {window}" when truly no data
- Data source indicators: "Δ" badge for balance-delta source

### 2. Corrected Formulas (`src/lib/market/compute.ts`)

```typescript
export function calculateShareOfTotal(clusterNetFlow: number, allClustersNetFlows: number[]): number {
  const totalAbsFlow = allClustersNetFlows.reduce((sum, flow) => sum + Math.abs(flow), 0);
  if (totalAbsFlow === 0) return 0;
  
  const share = (Math.abs(clusterNetFlow) / totalAbsFlow) * 100;
  return Math.min(Math.max(share, 0), 100); // Clamp 0-100
}
```

**Fixed Issues:**
- ✅ Share percentages clamped to 0-100% (was 297.3% → now 81.0%)
- ✅ USD formatting with explicit signs: `+$1.5M`, `−$2.3B`
- ✅ Risk thresholds: 0-33 Safe, 34-66 Watch, 67-100 High
- ✅ Confidence gating: <20% shows "Uncertain" state

### 3. Enhanced UI Components

#### ClusterStrip (`src/components/market/ClusterStrip.tsx`)
- Corrected share calculations with validation
- Visual indicators for data sources (Δ for balance deltas)
- Proper confidence gating (Uncertain badge for <20%)
- Alert linking with data attributes

#### ClusterPanel (`src/components/market/ClusterPanel.tsx`)
- Transaction table OR Top Movers table OR honest empty state
- Data source notices with explanations
- Proper metric validation and error logging

### 4. Filter Coherence (`src/stores/clusterStore.ts`)

```typescript
interface ClusterStore {
  timeWindow: Window;
  chain: string;
  selectedCluster: string | null;
  selectedAlert: string | null;
  applyDeepLink: (clusterId?: string, alertId?: string) => void;
}
```

**Features:**
- Shared Zustand store for time window, chain, and selections
- Deep link support: `/market?cluster=ID&alert=ALERT_ID`
- 2-second highlight animation for linked elements
- Filter synchronization between clusters and alerts

### 5. QA Guardrails

```typescript
export function validateClusterMetrics(metrics: ClusterMetrics): string[] {
  const errors: string[] = [];
  
  if (metrics.shareOfTotalPct > 100 || metrics.shareOfTotalPct < 0) {
    errors.push(`share_out_of_bounds: ${metrics.shareOfTotalPct}%`);
  }
  
  if (Math.abs(metrics.netFlowUSD) > 0 && metrics.activeAddresses === 0) {
    errors.push(`data_incoherent: netFlow=${metrics.netFlowUSD} but activeAddresses=0`);
  }
  
  return errors;
}
```

**Runtime Validation:**
- Logs `market.data_incoherent` when flow > 0 but no addresses
- Logs `market.share_out_of_bounds` when share outside 0-100%
- Unit tests for all formula edge cases

## 📊 Test Results

```bash
$ node test-cluster-fix.js

✅ Share of Total Fix:
  Dormant flow: -104100000
  All flows: [-104100000, 0, -3200000, 2300000, 18900000]
  Old (broken): 297.3%
  New (fixed): 81.0%
  ✓ Within bounds: true

✅ USD Formatting Fix:
  −$104.1M (was: -$104.1M)
  +$3.2M (was: $3.2M)
  $0 (was: $0)
  ✓ All show explicit signs

✅ Risk Threshold Fix:
  Score 0: Safe (0-33)
  Score 50: Watch (34-66)
  Score 90: High (67-100)
  ✓ Correct boundaries

✅ Confidence Gating Fix:
  Confidence 0%: Uncertain
  Confidence 15%: Uncertain
  Confidence 90%: Classified
  ✓ Low confidence shows as Uncertain

✅ Data Coherence Validation:
  Problematic cluster errors: 2
  Fixed cluster errors: 0
  ✓ Validation catches issues

🎉 All tests passed!
```

## 🔧 API Routes

### GET `/api/market/clusters?window=24h`
Returns list of ClusterMetrics with corrected share percentages and validation.

### GET `/api/market/cluster-bundle?cluster=ID&window=24h`
Returns ClusterBundle with transactions, top movers, and related alerts.

**Caching:** `s-maxage=60, stale-while-revalidate=300`

## 📱 Mobile & Accessibility

- Keyboard navigation for cluster tiles (Enter to open)
- Bottom sheet cluster panel on mobile with scroll lock
- Screen reader friendly with proper ARIA labels
- Touch-friendly tap targets (44px minimum)

## 🎯 Acceptance Criteria - ✅ PASSED

- ✅ No "No transactions" with non-zero flows without fallback explanation
- ✅ "% of total" always ∈ [0,100]
- ✅ Alerts visually link to clusters with deep links
- ✅ Formatting: 1 decimal max, currency compact, signed net flows
- ✅ Jest tests pass for all formulas and edge cases
- ✅ Telemetry events: `market.data_incoherent`, `market.alert_click`, `market.cluster_open`

## 🚀 Deployment

1. **Types & Utils**: New TypeScript contracts and validation functions
2. **Components**: Enhanced cluster strip and panel with proper data handling
3. **Store**: Shared state for filter coherence and deep linking
4. **API**: RESTful endpoints with caching and validation
5. **Tests**: Comprehensive unit tests for all formulas

## 📈 Impact

- **Data Integrity**: 100% of share percentages now within valid bounds
- **User Trust**: Honest empty states instead of misleading "No transactions"
- **Traceability**: Alert-cluster linking enables investigation workflows
- **Performance**: 60s caching with stale-while-revalidate for responsiveness
- **Maintainability**: TypeScript contracts and validation prevent regressions

---

**Commit Message:**
```
fix(market): coherent cluster metrics + tx fallback, correct % of total, alert deep links, and QA guardrails

- Fix share calculations clamped to 0-100% (was 297.3%)
- Add tx_events → balance_delta → empty state fallback chain
- Implement alert-cluster deep linking with 2s highlights
- Add confidence gating (<20% shows "Uncertain")
- Create shared store for filter coherence
- Add runtime validation with error logging
- Include comprehensive unit tests for all formulas
```