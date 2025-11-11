# StickySubFilters Component

## Overview

The `StickySubFilters` component provides quick access to common filters that become sticky when scrolling. It displays below the main tabs and offers one-click filtering for Chain, Trust Level, Reward Amount, and Time Remaining.

## Requirements

- **Requirement 7.2**: WHEN scrolling THEN sub-filters SHALL become sticky: Chain, Trust, Reward, Time Left

## Features

- **Sticky Behavior**: Becomes fixed at the top of the viewport when scrolling past threshold
- **Quick Filters**: Provides dropdowns for the most commonly used filters
- **Active Filter Count**: Shows badge with number of active filters
- **Clear All**: One-click button to reset all quick filters
- **Responsive**: Horizontal scroll on mobile devices
- **Theme Support**: Works with both dark and light themes
- **Accessibility**: Full keyboard navigation and screen reader support

## Usage

```tsx
import { StickySubFilters } from '@/components/hunter/StickySubFilters';
import { FilterState } from '@/types/hunter';

function HunterPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    chains: [],
    trustMin: 80,
    rewardMin: 0,
    rewardMax: 1000000,
    urgency: [],
    eligibleOnly: false,
    difficulty: [],
    sort: 'recommended',
    showRisky: false,
  });

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  return (
    <div>
      <HunterTabs activeTab="All" onTabChange={handleTabChange} />
      
      <StickySubFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        isDarkTheme={true}
      />
      
      <OpportunityGrid opportunities={opportunities} />
    </div>
  );
}
```

## Props

### `StickySubFiltersProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `filters` | `FilterState` | Yes | - | Current filter state |
| `onFilterChange` | `(filters: Partial<FilterState>) => void` | Yes | - | Callback when filters change |
| `isDarkTheme` | `boolean` | No | `true` | Whether to use dark theme styling |

## Filter Options

### Chain Filter
- All Chains (default)
- Ethereum
- Base
- Arbitrum
- Optimism
- Polygon
- Solana
- Avalanche

### Trust Level Filter
- All Trust Levels (trustMin: 0)
- Green (≥80) - trustMin: 80 (default)
- Amber (≥60) - trustMin: 60

### Reward Filter
- Any Reward (rewardMin: 0, default)
- $100+ (rewardMin: 100)
- $500+ (rewardMin: 500)
- $1,000+ (rewardMin: 1000)
- $5,000+ (rewardMin: 5000)

### Time Left Filter
- Any Time (urgency: [], default)
- <24 hours (urgency: ['new'])
- <48 hours (urgency: ['ending_soon'])
- <1 week (urgency: ['ending_soon'])

## Behavior

### Sticky Activation
The component becomes sticky when:
1. User scrolls past the component's initial position
2. Threshold is set to account for header height (80px)
3. Component transitions smoothly to fixed position

### Filter Updates
When a filter is changed:
1. `onFilterChange` is called with partial filter state
2. Parent component merges updates with existing filters
3. Feed query is triggered with new filters
4. Active filter count updates automatically

### Clear All
Clicking "Clear" button resets:
- `chains` to `[]`
- `trustMin` to `80` (default)
- `rewardMin` to `0`
- `urgency` to `[]`

## Styling

### Dark Theme (default)
- Background: `bg-[#0A0E1A]/95` with backdrop blur
- Borders: `border-white/10`
- Text: `text-gray-300`
- Dropdowns: `bg-white/5`

### Light Theme
- Background: `bg-white/95` with backdrop blur
- Borders: `border-gray-200`
- Text: `text-gray-700`
- Dropdowns: `bg-gray-50`

### Sticky State
- Position: `fixed top-20 left-0 right-0`
- Shadow: `shadow-lg`
- Z-index: `z-30`
- Border bottom: `border-b`

## Accessibility

### ARIA Labels
- Chain filter: `aria-label="Filter by chain"`
- Trust filter: `aria-label="Filter by trust level"`
- Reward filter: `aria-label="Filter by minimum reward"`
- Time filter: `aria-label="Filter by time remaining"`
- Clear button: `aria-label="Clear all quick filters"`

### Keyboard Navigation
- All dropdowns are keyboard accessible
- Tab order follows visual order
- Enter/Space to open dropdowns
- Arrow keys to navigate options
- Escape to close dropdowns

### Screen Readers
- Spacer element has `aria-hidden="true"`
- Trust level options include color indicators
- Active filter count is announced
- Clear button announces action

## Integration with Main Filters

The StickySubFilters component is designed to work alongside the main FilterDrawer:

1. **Complementary**: Quick filters for common use cases
2. **Synchronized**: Updates same FilterState object
3. **Non-conflicting**: Changes from either component update the same state
4. **Additive**: Quick filters don't override advanced filters

Example integration:
```tsx
<FilterDrawer
  isOpen={isDrawerOpen}
  onClose={() => setIsDrawerOpen(false)}
  filters={filters}
  onFilterChange={handleFilterChange}
  onReset={handleReset}
/>

<StickySubFilters
  filters={filters}
  onFilterChange={handleFilterChange}
  isDarkTheme={isDarkTheme}
/>
```

## Performance Considerations

### Scroll Listener
- Uses passive event listener for better performance
- Debounced to prevent excessive re-renders
- Cleaned up on component unmount

### Spacer Element
- Prevents content jump when component becomes sticky
- Only rendered when sticky state is active
- Height matches component height (60px)

### Animations
- Uses Framer Motion for smooth transitions
- AnimatePresence for enter/exit animations
- Hardware-accelerated transforms

## Testing

The component includes comprehensive tests for:
- Rendering with different filter states
- Filter change callbacks
- Sticky behavior on scroll
- Active filter count calculation
- Clear all functionality
- Accessibility features
- Theme variations

Run tests:
```bash
npm test StickySubFilters.test.tsx
```

## Examples

### Basic Usage
```tsx
<StickySubFilters
  filters={filters}
  onFilterChange={handleFilterChange}
/>
```

### With Light Theme
```tsx
<StickySubFilters
  filters={filters}
  onFilterChange={handleFilterChange}
  isDarkTheme={false}
/>
```

### With Active Filters
```tsx
const filters = {
  ...defaultFilters,
  chains: ['ethereum', 'base'],
  trustMin: 60,
  rewardMin: 100,
};

<StickySubFilters
  filters={filters}
  onFilterChange={handleFilterChange}
/>
// Shows "3 active" badge and Clear button
```

## Related Components

- `HunterTabs` - Main tab navigation above sticky filters
- `FilterDrawer` - Comprehensive filter drawer with all options
- `SearchBar` - Search input component
- `OpportunityGrid` - Grid displaying filtered opportunities

## Future Enhancements

Potential improvements for future versions:
- [ ] Preset filter combinations (e.g., "High Value", "Quick Wins")
- [ ] Filter history/favorites
- [ ] Drag-to-reorder filter priority
- [ ] Mobile-optimized bottom sheet variant
- [ ] Filter suggestions based on user behavior
