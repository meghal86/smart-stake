# Portfolio Progressive Disclosure Components

## Overview

This directory contains progressive disclosure UI components for the Unified Portfolio System. These components implement Requirements 10.1 and 10.2, providing consistent patterns for showing top 5 items with "View all" expansion, along with all required UI states (loading, empty, error, degraded).

## Reuse-First Audit

**Existing Components Reused:**
- `ExpandableCard` (`src/components/ux/ExpandableCard.tsx`) - Full progressive disclosure with animations
- `EnhancedErrorBoundary` (`src/components/ux/EnhancedErrorBoundary.tsx`) - Comprehensive error handling
- `OpportunityCardSkeleton` (`src/components/hunter/OpportunityCardSkeleton.tsx`) - Skeleton loading pattern

**Why New Components Were Created:**
- Portfolio-specific skeleton variants needed (ActionCard, ApprovalRisk, Position, Transaction)
- Portfolio-specific empty states needed (NoActions, NoApprovals, NoPositions, NoTransactions)
- Generic `ProgressiveDisclosureList` wrapper needed to standardize the "top 5 + View all" pattern across all portfolio sections

## Components

### ProgressiveDisclosureList

Generic list component that implements progressive disclosure pattern.

**Features:**
- Shows top N items by default (configurable, default: 5)
- "View all" button to expand
- "Show less" button to collapse
- Smooth animations with Framer Motion
- Loading, error, and empty states
- Touch-friendly (44px minimum touch targets)
- Keyboard accessible
- Screen reader friendly

**Usage:**

```tsx
import { ProgressiveDisclosureList } from '@/components/portfolio';

<ProgressiveDisclosureList
  items={actions}
  renderItem={(action, index) => <ActionCard action={action} />}
  initialCount={5}
  isLoading={isLoading}
  error={error}
  emptyState={<NoActionsEmptyState />}
  loadingSkeleton={<SkeletonGrid count={5} SkeletonComponent={ActionCardSkeleton} />}
  viewAllText="View all actions"
  showLessText="Show top 5"
  componentName="RecommendedActionsFeed"
  onExpansionChange={(isExpanded) => console.log('Expanded:', isExpanded)}
/>
```

### Portfolio Skeletons

Skeleton loading states for portfolio sections.

**Components:**
- `ActionCardSkeleton` - For recommended actions feed
- `ApprovalRiskCardSkeleton` - For approvals list
- `PositionCardSkeleton` - For positions tab
- `TransactionTimelineItemSkeleton` - For audit tab
- `SkeletonGrid` - Generic grid wrapper

**Usage:**

```tsx
import { ActionCardSkeleton, SkeletonGrid } from '@/components/portfolio';

// Single skeleton
<ActionCardSkeleton isDarkTheme={true} />

// Grid of skeletons
<SkeletonGrid count={5} SkeletonComponent={ActionCardSkeleton} />
```

### Portfolio Empty States

Empty state components for portfolio sections.

**Components:**
- `NoActionsEmptyState` - When no recommended actions
- `NoApprovalsEmptyState` - When no token approvals
- `NoPositionsEmptyState` - When no positions
- `NoTransactionsEmptyState` - When no transactions
- `DegradedModeBanner` - When confidence < threshold
- `ErrorState` - Generic error display

**Usage:**

```tsx
import { NoActionsEmptyState, DegradedModeBanner } from '@/components/portfolio';

// Empty state with action
<NoActionsEmptyState 
  onAction={() => handleRefresh()} 
  actionLabel="Refresh"
/>

// Degraded mode banner
<DegradedModeBanner
  confidence={0.65}
  threshold={0.70}
  reasons={[
    'Guardian security scan is temporarily unavailable',
    'Some price feeds are delayed'
  ]}
/>
```

## Property-Based Testing

The progressive disclosure pattern is validated through Property 23:

**Property 23: Progressive Disclosure Consistency**

*For any section in the UI, it should show the top 5 items by default with a "View all" option, and provide all required UI states (loading, empty, error, degraded-mode)*

**Test Coverage:**
- ✅ Shows top N items by default
- ✅ Provides "View all" option when items exceed initial count
- ✅ No "View all" when items ≤ initial count
- ✅ All required UI states present (loading, empty, error, degraded)
- ✅ Maintains correct item order when expanding/collapsing
- ✅ Handles edge cases (empty, single item, exactly N items)
- ✅ Calculates remaining items count correctly
- ✅ Handles expansion state transitions correctly

**Run tests:**

```bash
npm test -- progressive-disclosure.property.test.ts
```

## Design System Compliance

All components follow AlphaWhale design system:

**Colors:**
- Background: `bg-white/5` (dark), `bg-white/90` (light)
- Borders: `border-white/10` (dark), `border-gray-200` (light)
- Text: `text-white` (primary), `text-white/70` (secondary), `text-white/40` (tertiary)
- Accents: `text-cyan-400` (primary action), severity colors (red, orange, yellow, blue)

**Spacing:**
- Padding: `p-6` (cards), `p-4` (compact)
- Gaps: `gap-4` (default), `gap-6` (sections)
- Margins: `mb-4` (sections), `mb-2` (elements)

**Typography:**
- Headings: `text-lg font-semibold` (section), `text-xl font-semibold` (page)
- Body: `text-sm` (default), `text-xs` (metadata)
- Font weights: `font-semibold` (headings), `font-medium` (buttons)

**Animations:**
- Duration: `duration-150` (fast), `duration-200` (default), `duration-300` (slow)
- Easing: `ease-out` (default)
- Hover: `scale: 1.02` (buttons)
- Tap: `scale: 0.98` (buttons)

**Accessibility:**
- Touch targets: Minimum 44px height
- ARIA labels: All interactive elements
- Screen reader text: `sr-only` for loading states
- Keyboard navigation: Focus rings on all interactive elements
- Color contrast: WCAG AA compliant

## Mobile-First Responsive

All components are mobile-first:

**Breakpoints:**
- `< 480px`: Single column, compact spacing
- `480-768px`: Single column, denser layout
- `> 768px`: Optional split view

**Touch Targets:**
- Minimum 44×44px for all interactive elements
- Adequate spacing between touch targets
- No hover-only interactions

**Performance:**
- Lazy loading for non-critical content
- Optimistic UI updates
- Smooth animations (respects `prefers-reduced-motion`)

## Examples

See `examples/ProgressiveDisclosureExample.tsx` for complete usage examples:

1. **Recommended Actions Feed** - Shows how to use with action cards
2. **Approval Risks List** - Shows how to use with approval cards
3. **Degraded Mode** - Shows how to display degraded mode banner
4. **Error State** - Shows how to handle errors with retry

## Integration

To integrate these components into your portfolio sections:

1. **Import components:**
```tsx
import { 
  ProgressiveDisclosureList,
  ActionCardSkeleton,
  NoActionsEmptyState,
  SkeletonGrid
} from '@/components/portfolio';
```

2. **Wrap your list:**
```tsx
<ProgressiveDisclosureList
  items={yourItems}
  renderItem={yourRenderFunction}
  initialCount={5}
  isLoading={isLoading}
  error={error}
  emptyState={<YourEmptyState />}
  loadingSkeleton={<SkeletonGrid count={5} SkeletonComponent={YourSkeleton} />}
/>
```

3. **Handle states:**
- Loading: Automatically shows skeleton
- Error: Automatically shows error state
- Empty: Automatically shows empty state
- Success: Renders your items with progressive disclosure

## Validation

**Requirements Validated:**
- ✅ R10.1: Progressive disclosure with top 5 items
- ✅ R10.2: All UI states (loading, empty, error, degraded)

**Property Validated:**
- ✅ Property 23: Progressive Disclosure Consistency

**Design System:**
- ✅ Uses existing AlphaWhale design tokens
- ✅ No custom CSS patterns
- ✅ Mobile-first responsive
- ✅ Accessibility compliant (WCAG AA)

## Future Enhancements (V1.1+)

- Virtualized scrolling for very large lists (1000+ items)
- Customizable animation presets
- Sticky headers for grouped lists
- Search/filter integration
- Bulk actions for selected items
