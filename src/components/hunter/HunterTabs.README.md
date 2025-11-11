# HunterTabs Component

## Overview

The `HunterTabs` component provides tab navigation for the Hunter Screen, allowing users to filter opportunities by category. It implements Requirement 7.1 from the Hunter Screen specification.

## Features

- **Six Tab Categories**: All, Airdrops, Quests, Yield, Points, Featured
- **URL Synchronization**: Active tab persists in URL query parameters
- **Filter Integration**: Updates filters when tabs change
- **Accessibility**: Full ARIA support with keyboard navigation
- **Responsive**: Horizontal scrolling on mobile devices
- **Theme Support**: Dark and light theme variants

## Usage

```tsx
import { HunterTabs, TabType } from '@/components/hunter/HunterTabs';

function MyComponent() {
  const [activeTab, setActiveTab] = useState<TabType>('All');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Update filters based on tab
  };

  return (
    <HunterTabs
      activeTab={activeTab}
      onTabChange={handleTabChange}
      isDarkTheme={true}
    />
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `activeTab` | `TabType` | Yes | - | Currently active tab |
| `onTabChange` | `(tab: TabType) => void` | Yes | - | Callback when tab is clicked |
| `isDarkTheme` | `boolean` | No | `true` | Enable dark theme styling |

## Tab Types

```typescript
type TabType = 'All' | 'Airdrops' | 'Quests' | 'Yield' | 'Points' | 'Featured';
```

### Tab Mappings

Each tab filters opportunities by type:

- **All**: Shows all opportunity types
- **Airdrops**: Filters to `airdrop` type
- **Quests**: Filters to `quest` and `testnet` types
- **Yield**: Filters to `staking` and `yield` types
- **Points**: Filters to `points` and `loyalty` types
- **Featured**: Shows opportunities with `featured` flag set to true

## URL Synchronization

The component automatically syncs the active tab with the URL query parameter `tab` using React Router:

- Clicking a tab updates the URL: `?tab=Airdrops`
- The "All" tab removes the query parameter
- Other query parameters are preserved
- On mount, the component reads the `tab` parameter and updates the active tab
- Uses `replace: true` to avoid adding to browser history

### Example URLs

```
/hunter                    # All tab (default)
/hunter?tab=Airdrops      # Airdrops tab
/hunter?tab=Yield&sort=newest  # Yield tab with sort parameter
```

### Implementation

The component uses React Router's `useNavigate` and `useSearchParams` hooks:

```tsx
import { useNavigate, useSearchParams } from 'react-router-dom';

const navigate = useNavigate();
const [searchParams] = useSearchParams();

// Update URL when tab changes
navigate(`?tab=Airdrops`, { replace: true });
```

## Accessibility

The component follows WCAG AA accessibility guidelines:

- **ARIA Roles**: `tablist` for navigation, `tab` for each button
- **ARIA States**: `aria-selected` indicates active tab
- **ARIA Controls**: Each tab has `aria-controls` pointing to its panel
- **Keyboard Navigation**: Full keyboard support with focus indicators
- **Screen Readers**: Proper announcements for all interactive elements

## Styling

The component uses Tailwind CSS with custom gradient effects:

- Active tab has a gradient underline (green to purple)
- Hover state shows semi-transparent gradient
- Smooth transitions for all state changes
- Responsive text sizing and spacing

## Integration with useHunterFeed

The HunterTabs component works seamlessly with the `useHunterFeed` hook:

```tsx
import { useHunterFeed } from '@/hooks/useHunterFeed';
import { HunterTabs, TabType } from '@/components/hunter/HunterTabs';

function HunterScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('All');

  const { opportunities, isLoading } = useHunterFeed({
    filter: activeTab,
    isDemo: false,
    copilotEnabled: false,
    realTimeEnabled: false,
  });

  return (
    <>
      <HunterTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      {/* Render opportunities */}
    </>
  );
}
```

## Requirements Met

This component implements **Requirement 7.1** from the Hunter Screen specification:

> WHEN the page loads THEN tabs SHALL display: All / Airdrops / Quests / Yield / Points / Featured

Additional requirements met:
- Tabs update filters when changed
- Active tab persists in URL query parameters
- Full accessibility support
- Responsive design for all screen sizes

## Testing

Comprehensive test coverage includes:

- Rendering all required tabs
- Active tab indication with ARIA attributes
- Tab click handling and filter updates
- URL synchronization (read and write)
- Query parameter preservation
- Accessibility features
- Theme variants
- All tab types

Run tests:
```bash
npm test -- src/__tests__/components/hunter/HunterTabs.test.tsx
```

## Related Components

- `Header`: Contains the HunterTabs component
- `useHunterFeed`: Hook that consumes tab filter changes
- `FilterDrawer`: Additional filtering options

## Future Enhancements

Potential improvements for future versions:

- Tab badges showing opportunity counts
- Swipe gestures for mobile tab navigation
- Tab animations and transitions
- Customizable tab order
- Saved tab preferences per user
