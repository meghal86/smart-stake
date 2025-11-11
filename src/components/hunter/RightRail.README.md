# RightRail Component

Desktop-only sidebar component for the Hunter Screen that displays PersonalPicks, SavedItems, and SeasonProgress modules.

## Overview

The RightRail component provides contextual information and quick access to personalized content for desktop users (≥1280px). It is hidden on mobile and tablet devices to maintain optimal mobile UX.

## Requirements

- **7.5**: Right rail for desktop (≥1280px) with Personal picks, Saved items, Season progress

## Features

### 1. PersonalPicks Module
- Shows trending opportunities personalized for the user
- Displays top 3 recommended opportunities
- Shows trust scores and reward estimates
- Hover effects for better interactivity

### 2. SavedItems Module
- Lists user's saved opportunities (up to 5)
- Integrates with `useSavedOpportunities` hook
- Shows trust levels with color-coded indicators
- Empty state when no items are saved
- Only visible for authenticated users

### 3. SeasonProgress Module
- Displays current season information
- Shows user's progress percentage
- Displays rank and points earned
- Lists milestone achievements
- Shows time remaining in season

## Usage

```tsx
import { RightRail } from '@/components/hunter/RightRail';

function HunterPage() {
  return (
    <div className="flex gap-6">
      <main className="flex-1">
        {/* Main content */}
      </main>
      
      <RightRail />
    </div>
  );
}
```

## Props

```typescript
interface RightRailProps {
  className?: string; // Optional additional CSS classes
}
```

## Responsive Behavior

The component uses Tailwind's `xl:` breakpoint (1280px) to control visibility:

- **Mobile (<768px)**: Hidden
- **Tablet (768px-1279px)**: Hidden
- **Desktop (≥1280px)**: Visible

This is achieved with the `hidden xl:block` utility classes.

## Integration

### With useSavedOpportunities Hook

The SavedItems module automatically fetches and displays saved opportunities:

```tsx
const { savedOpportunities, isLoading } = useSavedOpportunities();
```

### With useAuth Hook

Authentication state determines whether to show the SavedItems module:

```tsx
const { isAuthenticated } = useAuth();

{isAuthenticated && <SavedItems />}
```

## Styling

The component uses:
- Glassmorphism effects (`backdrop-blur-sm`)
- Gradient backgrounds
- Smooth animations with Framer Motion
- Color-coded trust indicators (green/amber/red)
- Hover states for interactive elements

## Accessibility

- Proper ARIA labels (`aria-label="Right sidebar"`)
- Semantic HTML structure
- Keyboard-accessible interactive elements
- Screen reader friendly content

## Data Structure

### PersonalPicks Item
```typescript
{
  id: string;
  title: string;
  protocol: string;
  reward: string;
  trustScore: number;
  type: 'airdrop' | 'quest' | 'yield' | 'points';
}
```

### SavedItems Item
```typescript
{
  id: string;
  opportunity_id: string;
  saved_at: string;
  opportunity: {
    title: string;
    protocol_name: string;
    type: string;
    trust_score: number;
    trust_level: 'green' | 'amber' | 'red';
  };
}
```

### SeasonProgress Data
```typescript
{
  currentSeason: string;
  progress: number; // 0-100
  rank: number;
  totalUsers: number;
  pointsEarned: number;
  nextMilestone: number;
  daysLeft: number;
}
```

## Animation

The component uses Framer Motion for smooth entrance animations:

- **RightRail**: Fades in with upward motion
- **PersonalPicks**: Delayed fade-in (0.1s)
- **SavedItems**: Delayed fade-in (0.2s)
- **SeasonProgress**: Delayed fade-in (0.3s)
- **Individual items**: Staggered animations for list items

## Future Enhancements

1. **Real-time updates**: Subscribe to saved items changes
2. **Personalization**: Fetch actual personalized picks from API
3. **Season API**: Connect to real season progress data
4. **Click handlers**: Navigate to opportunity details
5. **Drag-to-reorder**: Allow users to reorder saved items
6. **Filters**: Add filtering options for saved items

## Testing

See `src/__tests__/components/hunter/RightRail.test.tsx` for comprehensive test coverage including:
- Responsive behavior
- Module rendering
- Authentication state handling
- Loading states
- Empty states
- Data display

## Related Components

- `useSavedOpportunities` - Hook for saved opportunities data
- `useAuth` - Hook for authentication state
- `OpportunityCard` - Main opportunity card component
- `Hunter` - Parent page component
