# Progressive Disclosure Components - Usage Examples

## Overview

This document provides practical examples of using progressive disclosure components in the Unified Portfolio System. All examples follow the **reuse-first** architecture principle.

## Quick Start

```typescript
import {
  ProgressiveDisclosureList,
  EnhancedErrorBoundary,
  ActionCardSkeleton,
  NoActionsEmptyState
} from '@/components/portfolio/progressive-disclosure';
```

## Example 1: Recommended Actions Feed

Shows top 5 actions with "View all" button, loading states, and error handling.

```typescript
// src/components/portfolio/RecommendedActionsFeed.tsx
import React from 'react';
import {
  ProgressiveDisclosureList,
  EnhancedErrorBoundary,
  ActionCardSkeleton,
  NoActionsEmptyState
} from '@/components/portfolio/progressive-disclosure';
import { useActions } from '@/hooks/portfolio/useActions';
import { ActionCard } from './ActionCard';

export function RecommendedActionsFeed() {
  const { data: actions, isLoading, error, refetch } = useActions();

  return (
    <EnhancedErrorBoundary
      component="RecommendedActionsFeed"
      enableRecovery={true}
      severity="medium"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Recommended Actions
          </h2>
          {!isLoading && actions && actions.length > 0 && (
            <span className="text-sm text-white/70">
              {actions.length} action{actions.length !== 1 ? 's' : ''} available
            </span>
          )}
        </div>

        <ProgressiveDisclosureList
          items={actions || []}
          renderItem={(action, index) => (
            <ActionCard 
              key={action.id} 
              action={action} 
              index={index} 
            />
          )}
          initialCount={5}
          isLoading={isLoading}
          error={error}
          loadingSkeleton={
            <>
              <ActionCardSkeleton />
              <ActionCardSkeleton />
              <ActionCardSkeleton />
              <ActionCardSkeleton />
              <ActionCardSkeleton />
            </>
          }
          emptyState={<NoActionsEmptyState />}
          viewAllText="View all actions"
          showLessText="Show top 5"
          onExpansionChange={(isExpanded) => {
            console.log('Actions expanded:', isExpanded);
          }}
          componentName="RecommendedActionsFeed"
        />
      </div>
    </EnhancedErrorBoundary>
  );
}
```

## Example 2: Approval Risk List

Shows top 5 risky approvals with expandable details.

```typescript
// src/components/portfolio/ApprovalRiskList.tsx
import React from 'react';
import {
  ProgressiveDisclosureList,
  EnhancedErrorBoundary,
  ApprovalRiskCardSkeleton,
  NoApprovalsEmptyState
} from '@/components/portfolio/progressive-disclosure';
import { useApprovals } from '@/hooks/portfolio/useApprovals';
import { ApprovalRiskCard } from './ApprovalRiskCard';

export function ApprovalRiskList() {
  const { data: approvals, isLoading, error } = useApprovals();

  // Filter by severity
  const riskyApprovals = approvals?.filter(
    a => a.severity === 'high' || a.severity === 'critical'
  ) || [];

  return (
    <EnhancedErrorBoundary
      component="ApprovalRiskList"
      enableRecovery={true}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Risky Approvals
          </h2>
          {riskyApprovals.length > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
              {riskyApprovals.length} risk{riskyApprovals.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <ProgressiveDisclosureList
          items={riskyApprovals}
          renderItem={(approval, index) => (
            <ApprovalRiskCard 
              key={approval.id} 
              approval={approval} 
            />
          )}
          initialCount={5}
          isLoading={isLoading}
          error={error}
          loadingSkeleton={
            <>
              {[...Array(5)].map((_, i) => (
                <ApprovalRiskCardSkeleton key={i} />
              ))}
            </>
          }
          emptyState={<NoApprovalsEmptyState />}
          viewAllText="View all approvals"
          componentName="ApprovalRiskList"
        />
      </div>
    </EnhancedErrorBoundary>
  );
}
```

## Example 3: Asset Breakdown with Expandable Details

Shows asset summary with expandable breakdown.

```typescript
// src/components/portfolio/AssetBreakdown.tsx
import React from 'react';
import {
  ExpandableCard,
  ExpandableCardSection,
  EnhancedErrorBoundary,
  AssetBreakdownSkeleton,
  NoAssetsEmptyState
} from '@/components/portfolio/progressive-disclosure';
import { useAssets } from '@/hooks/portfolio/useAssets';
import { AssetRow } from './AssetRow';

export function AssetBreakdown() {
  const { data: assets, isLoading, error } = useAssets();

  if (isLoading) {
    return <AssetBreakdownSkeleton />;
  }

  if (error) {
    return (
      <EnhancedErrorBoundary
        component="AssetBreakdown"
        enableRecovery={true}
      >
        <div className="text-center py-8 text-white/70">
          Failed to load assets
        </div>
      </EnhancedErrorBoundary>
    );
  }

  if (!assets || assets.length === 0) {
    return <NoAssetsEmptyState />;
  }

  const topAssets = assets.slice(0, 5);
  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);

  return (
    <ExpandableCard
      id="asset-breakdown"
      header={
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Asset Breakdown
          </h3>
          <span className="text-sm text-white/70">
            ${totalValue.toLocaleString()}
          </span>
        </div>
      }
      autoCollapse={false}
    >
      {/* Always visible: Top 5 assets */}
      <div className="space-y-3">
        {topAssets.map(asset => (
          <AssetRow key={asset.id} asset={asset} />
        ))}
      </div>
    </ExpandableCard>
  );
}
```

## Example 4: Transaction Timeline

Shows recent transactions with progressive disclosure.

```typescript
// src/components/portfolio/TransactionTimeline.tsx
import React from 'react';
import {
  ProgressiveDisclosureList,
  EnhancedErrorBoundary,
  TransactionCardSkeleton,
  NoTransactionsEmptyState
} from '@/components/portfolio/progressive-disclosure';
import { useTransactions } from '@/hooks/portfolio/useTransactions';
import { TransactionCard } from './TransactionCard';

export function TransactionTimeline() {
  const { data: transactions, isLoading, error } = useTransactions();

  return (
    <EnhancedErrorBoundary
      component="TransactionTimeline"
      enableRecovery={true}
    >
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">
          Recent Transactions
        </h2>

        <ProgressiveDisclosureList
          items={transactions || []}
          renderItem={(tx, index) => (
            <TransactionCard 
              key={tx.hash} 
              transaction={tx} 
            />
          )}
          initialCount={5}
          isLoading={isLoading}
          error={error}
          loadingSkeleton={
            <>
              {[...Array(5)].map((_, i) => (
                <TransactionCardSkeleton key={i} />
              ))}
            </>
          }
          emptyState={<NoTransactionsEmptyState />}
          viewAllText="View all transactions"
          componentName="TransactionTimeline"
        />
      </div>
    </EnhancedErrorBoundary>
  );
}
```

## Example 5: Protocol Exposure

Shows protocol exposure with expandable details.

```typescript
// src/components/portfolio/ProtocolExposure.tsx
import React from 'react';
import {
  ExpandableCard,
  ExpandableCardSection,
  ProtocolExposureSkeleton,
  NoProtocolExposureEmptyState
} from '@/components/portfolio/progressive-disclosure';
import { useProtocolExposure } from '@/hooks/portfolio/useProtocolExposure';
import { ProtocolRow } from './ProtocolRow';

export function ProtocolExposure() {
  const { data: protocols, isLoading } = useProtocolExposure();

  if (isLoading) {
    return <ProtocolExposureSkeleton />;
  }

  if (!protocols || protocols.length === 0) {
    return <NoProtocolExposureEmptyState />;
  }

  return (
    <ExpandableCard
      id="protocol-exposure"
      header={
        <h3 className="text-lg font-semibold text-white">
          Protocol Exposure
        </h3>
      }
    >
      {/* Key info: Top 5 protocols */}
      <div className="space-y-3">
        {protocols.slice(0, 5).map(protocol => (
          <ProtocolRow key={protocol.id} protocol={protocol} />
        ))}
      </div>
    </ExpandableCard>
  );
}
```

## Example 6: Custom Empty State with Actions

Create custom empty states with specific actions.

```typescript
// src/components/portfolio/CustomEmptyState.tsx
import React from 'react';
import { Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CustomEmptyState() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
      <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
        <Wallet className="w-8 h-8 text-cyan-500" />
      </div>
      
      <h3 className="text-lg font-semibold text-white mb-2">
        Get Started
      </h3>
      
      <p className="text-white/70 text-sm max-w-md mb-6">
        Connect your wallet to start tracking your portfolio and
        get personalized recommendations.
      </p>
      
      <button 
        onClick={() => router.push('/onboarding')}
        className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-150"
      >
        Connect Wallet
      </button>
    </div>
  );
}
```

## Example 7: Nested Progressive Disclosure

Combine ExpandableCard with ProgressiveDisclosureList.

```typescript
// src/components/portfolio/NestedDisclosure.tsx
import React from 'react';
import {
  ExpandableCard,
  ProgressiveDisclosureList,
  ActionCardSkeleton
} from '@/components/portfolio/progressive-disclosure';
import { useActions } from '@/hooks/portfolio/useActions';

export function NestedDisclosure() {
  const { data: actions, isLoading } = useActions();

  return (
    <ExpandableCard
      id="nested-actions"
      header={<h3>Action Categories</h3>}
    >
      {/* Always visible: Summary */}
      <div className="space-y-2">
        <p className="text-white/70 text-sm">
          {actions?.length || 0} actions available
        </p>
      </div>
    </ExpandableCard>
  );
}
```

## Best Practices

### 1. Always Wrap with Error Boundary

```typescript
// ✅ GOOD
<EnhancedErrorBoundary component="MyComponent">
  <ProgressiveDisclosureList {...props} />
</EnhancedErrorBoundary>

// ❌ BAD
<ProgressiveDisclosureList {...props} />
```

### 2. Provide Loading Skeletons

```typescript
// ✅ GOOD
<ProgressiveDisclosureList
  loadingSkeleton={<ActionCardSkeleton />}
  {...props}
/>

// ❌ BAD
<ProgressiveDisclosureList {...props} />
```

### 3. Use Meaningful Empty States

```typescript
// ✅ GOOD
<ProgressiveDisclosureList
  emptyState={<NoActionsEmptyState />}
  {...props}
/>

// ❌ BAD
<ProgressiveDisclosureList
  emptyState={<div>No data</div>}
  {...props}
/>
```

### 4. Set Initial Count to 5

```typescript
// ✅ GOOD
<ProgressiveDisclosureList
  initialCount={5}
  {...props}
/>

// ❌ BAD
<ProgressiveDisclosureList
  initialCount={10}
  {...props}
/>
```

### 5. Provide Descriptive View All Text

```typescript
// ✅ GOOD
<ProgressiveDisclosureList
  viewAllText="View all 15 actions"
  {...props}
/>

// ❌ BAD
<ProgressiveDisclosureList
  viewAllText="More"
  {...props}
/>
```

## Accessibility Checklist

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation (Tab, Enter, Space)
- ✅ Focus indicators visible
- ✅ Screen reader support
- ✅ Touch targets ≥44px
- ✅ Semantic HTML

## Performance Tips

1. **Memoize render functions**
   ```typescript
   const renderItem = React.useCallback((item, index) => (
     <ItemCard key={item.id} item={item} />
   ), []);
   ```

2. **Use React.memo for list items**
   ```typescript
   export const ItemCard = React.memo(({ item }) => {
     // ...
   });
   ```

3. **Lazy load heavy components**
   ```typescript
   const HeavyComponent = React.lazy(() => import('./HeavyComponent'));
   ```

## Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { RecommendedActionsFeed } from './RecommendedActionsFeed';

describe('RecommendedActionsFeed', () => {
  it('shows top 5 actions by default', () => {
    render(<RecommendedActionsFeed />);
    const items = screen.getAllByRole('article');
    expect(items).toHaveLength(5);
  });

  it('expands to show all actions', () => {
    render(<RecommendedActionsFeed />);
    const viewAllButton = screen.getByText(/view all/i);
    fireEvent.click(viewAllButton);
    const items = screen.getAllByRole('article');
    expect(items.length).toBeGreaterThan(5);
  });

  it('shows loading skeleton', () => {
    render(<RecommendedActionsFeed />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows empty state when no actions', () => {
    render(<RecommendedActionsFeed />);
    expect(screen.getByText(/all clear/i)).toBeInTheDocument();
  });
});
```

## Conclusion

These examples demonstrate how to use progressive disclosure components following the reuse-first architecture. All components are designed to work together seamlessly while maintaining consistency across the portfolio system.

For more information, see:
- `README.md` - Implementation summary
- `PortfolioSkeletons.tsx` - Skeleton components
- `PortfolioEmptyStates.tsx` - Empty state components
