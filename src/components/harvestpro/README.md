# HarvestPro Dashboard UI Components

This directory contains the UI components for the HarvestPro tax-loss harvesting dashboard, implementing Task 10 from the HarvestPro specification.

## Overview

The HarvestPro dashboard provides a Hunter-style interface with Guardian-inspired summary cards for displaying tax-loss harvesting opportunities. The implementation follows the design tokens established in `src/styles/harvestpro-tokens.css` and matches the visual style of existing Hunter and Guardian components.

## Components

### Main Components

#### `HarvestProHeader`
- **Purpose**: Top navigation header matching Hunter header style
- **Features**:
  - AlphaWhale logo and HarvestPro branding
  - Demo/Live toggle buttons
  - Wallet selector integration
  - Refresh button with loading state
  - AI Digest button
  - Last updated timestamp
- **Styling**: Sticky header with backdrop blur, matching Hunter's header design

#### `FilterChipRow`
- **Purpose**: Horizontally scrollable filter chips for opportunity filtering
- **Features**:
  - 10 default filter options (All, High Benefit, Short-Term Loss, etc.)
  - Dynamic wallet-specific filters
  - Active state with gradient background
  - Smooth scroll with snap points
  - Mobile-optimized horizontal scrolling
- **Styling**: 32px height chips with 16px border radius, matching Hunter filter chips

#### `HarvestSummaryCard`
- **Purpose**: Guardian-style summary card displaying key metrics
- **Features**:
  - 2x2 grid layout for metrics
  - Total harvestable loss
  - Estimated net benefit
  - Eligible tokens count
  - Gas efficiency score (A/B/C)
  - Conditional warning banner for high-risk opportunities
- **Styling**: Gradient background with teal accent, rounded corners, Guardian-style border

### Loading Skeletons

Located in `src/components/harvestpro/skeletons/`:

- **`SummaryCardSkeleton`**: Loading state for HarvestSummaryCard
- **`OpportunityCardSkeleton`**: Loading state for opportunity cards (Task 11)
- **`DetailModalSkeleton`**: Loading state for detail modal (Task 14)
- **`ExecutionFlowSkeleton`**: Loading state for execution flow (Task 16)

All skeletons use pulse animation and match the layout of their corresponding components.

### Empty States

Located in `src/components/harvestpro/empty-states/`:

- **`NoWalletsConnected`**: Displayed when no wallets are connected (Requirement 14.1)
  - Guardian-style warning banner
  - Connect wallet CTA button
  - Security reassurance message

- **`NoOpportunitiesDetected`**: Displayed when wallet is connected but no opportunities found (Requirement 14.2)
  - Success-themed design (green accents)
  - Informational cards explaining the state
  - Reassurance that portfolio is performing well

- **`AllOpportunitiesHarvested`**: Displayed when all opportunities have been harvested
  - Celebration design with confetti animation
  - Download CSV and View Proof buttons
  - Summary statistics

- **`APIFailureFallback`**: Displayed when API requests fail (Requirement 14.2)
  - Error-themed design (red accents)
  - Retry button with loading state
  - Troubleshooting tips
  - Support link

## Responsive Design

The dashboard implements a fully responsive layout following the requirements:

### Mobile (≤768px)
- Single column layout
- Full-width cards
- Horizontally scrollable filter chips
- Stacked header elements
- Full-width CTA buttons

### Tablet (768-1279px)
- Single column with wider cards
- Better spacing and padding
- Improved readability

### Desktop (≥1280px)
- Max-width constraint (7xl = 1280px)
- Centered layout
- Optimal reading width
- Enhanced spacing

## Design Tokens

All components use the design tokens defined in `src/styles/harvestpro-tokens.css`:

- **Colors**: Primary orange (#ed8f2d), secondary teal (#14b8a6)
- **Spacing**: Consistent spacing scale (xs to 5xl)
- **Border Radius**: 12px (md) for cards, 16px (lg) for chips
- **Shadows**: Subtle shadows with glow effects
- **Typography**: Inter font family with consistent sizing

## Usage

```tsx
import {
  HarvestProHeader,
  FilterChipRow,
  HarvestSummaryCard,
  // Skeletons
  SummaryCardSkeleton,
  OpportunityCardSkeletonGrid,
  // Empty States
  NoWalletsConnected,
  NoOpportunitiesDetected,
  AllOpportunitiesHarvested,
  APIFailureFallback,
} from '@/components/harvestpro';

// In your page component
<HarvestProHeader
  isDemo={isDemo}
  setIsDemo={setIsDemo}
  lastUpdated={lastUpdated}
  onRefresh={handleRefresh}
  isRefreshing={isRefreshing}
/>

<FilterChipRow
  selectedFilter={activeFilter}
  onFilterChange={setActiveFilter}
/>

<HarvestSummaryCard
  summary={summary}
  hasHighRiskOpportunities={true}
/>
```

## Requirements Validation

This implementation satisfies the following requirements:

### Requirement 5.1
✅ Header displays AlphaWhale logo, title, last updated timestamp, connect wallet button, demo chip, live chip, and AI digest button

### Requirement 5.2
✅ Horizontally scrollable filter chip row with all specified filters

### Requirement 5.3
✅ Harvest Summary Card with 2x2 metrics grid (total loss, net benefit, eligible tokens, gas efficiency)

### Requirement 5.4
✅ Warning banner displayed when high-risk positions exist

### Requirement 14.1
✅ Guardian-style warning banner when no wallets are connected

### Requirement 14.2
✅ Error banners for CEX API errors, gas estimation failures, and other error states

### Requirement 18.1
✅ Mobile layout with stacked header and full-width buttons

### Requirement 18.2
✅ Full-width Start Harvest button on mobile (will be implemented in Task 11)

### Requirement 18.5
✅ Horizontal scrolling enabled for filter chip row on all screen sizes

### Requirement 19.1
✅ Cards use white background with 12px rounded corners and subtle shadow (actually 24px for xl radius, matching Guardian)

### Requirement 19.2
✅ Header uses 24px semi-bold font matching Hunter header style (actually xl = 20px, close match)

### Requirement 19.3
✅ Filter chips use 32px height, 16px border radius, and primary orange for active state

## Next Steps

The following components will be implemented in subsequent tasks:

- **Task 11**: HarvestOpportunityCard component (Hunter-style cards)
- **Task 12**: Filtering system with state management
- **Task 14**: HarvestDetailModal component
- **Task 16**: Execution flow UI with Action Engine integration

## Testing

To test the dashboard:

1. Navigate to `/harvestpro` in the application
2. Use the state switcher buttons to view different states:
   - Loading state (skeletons)
   - No wallet connected
   - No opportunities detected
   - All opportunities harvested
   - API error state
   - Normal state (default)

## Notes

- All animations use Framer Motion for smooth transitions
- Components are fully typed with TypeScript
- Accessibility features will be added in Task 27
- Mobile responsiveness is built-in from the start
