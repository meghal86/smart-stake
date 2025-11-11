# FilterDrawer Component

Comprehensive filter drawer for the Hunter Screen with all filter options.

## Overview

The FilterDrawer component provides a mobile-friendly drawer interface for filtering opportunities in the Hunter Screen. It includes all required filter types with proper accessibility, Red trust consent modal, and integration with the useHunterFeed hook.

## Features

- **Type Filter**: Multi-select for all opportunity types (Airdrops, Quests, Staking, Yield, Points, Loyalty, Testnet)
- **Chain Filter**: Multi-select for supported chains (Ethereum, Base, Arbitrum, Optimism, Polygon, Solana, Avalanche)
- **Trust Level Filter**: Radio buttons for Green (≥80), Amber (60-79), Red (<60)
- **Reward Range Filter**: Min/max sliders for USD reward amounts
- **Urgency Filter**: Multi-select for Ending Soon, New, Hot
- **Eligibility Toggle**: Show only "Likely Eligible" opportunities
- **Difficulty Filter**: Multi-select for Easy, Medium, Advanced
- **Sort Selector**: Dropdown for sort options (Recommended, Ends Soon, Highest Reward, Newest, Trust)
- **Red Consent Modal**: Safety confirmation when enabling Red trust items

## Requirements Satisfied

- **4.1-4.19**: All comprehensive filtering requirements
- **4.17**: Red consent modal when Red trust is enabled
- **4.18**: Consent persisted in sessionStorage for the session
- **9.1-9.12**: Accessibility with proper aria-labels and keyboard navigation

## Usage

```tsx
import { FilterDrawer } from '@/components/hunter/FilterDrawer';
import { FilterState } from '@/types/hunter';

function HunterScreen() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    chains: [],
    trustMin: 80,
    rewardMin: 0,
    rewardMax: 100000,
    urgency: [],
    eligibleOnly: false,
    difficulty: [],
    sort: 'recommended',
    showRisky: false,
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleReset = () => {
    setFilters({
      search: '',
      types: [],
      chains: [],
      trustMin: 80,
      rewardMin: 0,
      rewardMax: 100000,
      urgency: [],
      eligibleOnly: false,
      difficulty: [],
      sort: 'recommended',
      showRisky: false,
    });
  };

  return (
    <>
      <button onClick={() => setIsFilterOpen(true)}>
        Open Filters
      </button>
      
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
      />
    </>
  );
}
```

## Props

```typescript
interface FilterDrawerProps {
  isOpen: boolean;              // Controls drawer visibility
  onClose: () => void;          // Called when drawer should close
  filters: FilterState;         // Current filter state
  onFilterChange: (filters: Partial<FilterState>) => void;  // Called when filters change
  onReset: () => void;          // Called when Reset button is clicked
}
```

## Filter State

```typescript
interface FilterState {
  search: string;                    // Search query
  types: OpportunityType[];          // Selected opportunity types
  chains: Chain[];                   // Selected chains
  trustMin: number;                  // Minimum trust score (0, 60, or 80)
  rewardMin: number;                 // Minimum reward in USD
  rewardMax: number;                 // Maximum reward in USD
  urgency: UrgencyType[];            // Selected urgency filters
  eligibleOnly: boolean;             // Show only likely eligible
  difficulty: DifficultyLevel[];     // Selected difficulty levels
  sort: SortOption;                  // Sort option
  showRisky: boolean;                // Whether Red trust items are shown
}
```

## Red Consent Modal

When a user attempts to enable Red trust items (trust score < 60), a safety confirmation modal appears:

- **First Time**: Modal shows warning about risky opportunities
- **Consent Given**: User clicks "I Understand, Show Risky" and consent is stored in sessionStorage
- **Session Persistence**: Consent persists for the browser session
- **Cancel**: Resets trust level to Green (80)

The modal includes:
- Warning icon
- Clear explanation of risks
- List of potential dangers (phishing, unverified contracts, loss of funds)
- Cancel and Confirm buttons

## Accessibility

- All interactive elements have proper aria-labels
- Radio buttons and checkboxes are keyboard accessible
- Drawer can be dismissed with ESC key
- Focus management handled by Radix UI primitives
- Color-coded trust levels include text labels (not color-only)
- Screen reader friendly

## Integration with useHunterFeed

The FilterDrawer is designed to work seamlessly with the useHunterFeed hook:

```tsx
import { useHunterFeed } from '@/hooks/useHunterFeed';

function HunterScreen() {
  const [filters, setFilters] = useState<FilterState>({...});
  
  const { opportunities, isLoading, fetchNextPage } = useHunterFeed({
    filter: 'All',
    isDemo: false,
    copilotEnabled: false,
    realTimeEnabled: true,
    sort: filters.sort,
    search: filters.search,
    trustMin: filters.trustMin,
    showRisky: filters.showRisky,
  });

  // FilterDrawer updates filters state
  // useHunterFeed reacts to filter changes
}
```

## Testing

Comprehensive test suite covers:
- All filter types (Type, Chain, Trust, Reward, Urgency, Eligibility, Difficulty, Sort)
- Red consent modal flow
- Filter persistence
- Accessibility features
- Actions (Reset, Apply)

Run tests:
```bash
npm test -- src/__tests__/components/hunter/FilterDrawer.test.tsx
```

## Dependencies

- `@radix-ui/react-drawer` (via vaul)
- `@radix-ui/react-dialog`
- `@radix-ui/react-select`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-slider`
- `lucide-react` (icons)

## Related Components

- `useHunterFeed` - Hook for fetching filtered opportunities
- `OpportunityCard` - Displays individual opportunities
- `HunterScreen` - Main page that uses FilterDrawer

## Notes

- Filter state should be persisted in URL query parameters (handled by parent component)
- Red consent is stored in sessionStorage and resets on new browser session
- Drawer is mobile-optimized with bottom sheet behavior
- All filters are optional and can be combined
