# Hunter Screen Layout - Quick Reference

## Component Import Map

```typescript
// Core Layout Components
import { SearchBar } from '@/components/hunter/SearchBar';
import { FilterDrawer } from '@/components/hunter/FilterDrawer';
import { HunterTabs } from '@/components/hunter/HunterTabs';
import { StickySubFilters } from '@/components/hunter/StickySubFilters';
import { RightRail } from '@/components/hunter/RightRail';
import { OpportunityCard } from '@/components/hunter/OpportunityCard';

// Types
import { FilterState, TabType } from '@/types/hunter';

// Hooks
import { useHunterFeed } from '@/hooks/useHunterFeed';
import { useSavedOpportunities } from '@/hooks/useSavedOpportunities';
```

## State Management

```typescript
// Filter State
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

// UI State
const [activeTab, setActiveTab] = useState<TabType>('All');
const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
const [isDarkTheme, setIsDarkTheme] = useState(true);

// Data Fetching
const { 
  opportunities, 
  isLoading, 
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useHunterFeed({
  filter: activeTab,
  sort: filters.sort,
});
```

## Layout Classes

### Container
```typescript
className="max-w-7xl mx-auto px-4"
```

### Header (Fixed)
```typescript
className="fixed top-0 left-0 right-0 z-40 bg-[#0A0E1A]/95 backdrop-blur-xl border-b border-white/10"
```

### Sticky Sub-Filters
```typescript
className="sticky top-20 z-30 bg-[#0A0E1A]/95 backdrop-blur-xl"
```

### Main Content Grid
```typescript
className="flex gap-6"
```

### Opportunity Feed
```typescript
className="flex-1 min-w-0"
```

### RightRail (Desktop Only)
```typescript
className="hidden xl:block w-80 flex-shrink-0"
```

## Responsive Utilities

### Hide on Mobile/Tablet
```typescript
className="hidden xl:block"  // Show only on desktop (≥1280px)
```

### Show on Mobile Only
```typescript
className="block xl:hidden"  // Hide on desktop
```

### Responsive Grid
```typescript
className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
```

### Responsive Text
```typescript
className="text-sm sm:text-base lg:text-lg"
```

## Common Patterns

### Filter Change Handler
```typescript
const handleFilterChange = (newFilters: Partial<FilterState>) => {
  setFilters(prev => ({ ...prev, ...newFilters }));
};
```

### Filter Reset Handler
```typescript
const handleFilterReset = () => {
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
```

### Infinite Scroll
```typescript
useEffect(() => {
  const handleScroll = () => {
    if (!hasNextPage || isFetchingNextPage) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight * 0.7;
    
    if (scrollPosition >= threshold) {
      fetchNextPage();
    }
  };

  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);
```

## Styling Conventions

### Card Background (Dark Theme)
```typescript
className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
```

### Card Background (Light Theme)
```typescript
className="bg-gray-50 rounded-2xl p-6 border border-gray-200"
```

### Primary Button
```typescript
className="bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white hover:opacity-90"
```

### Secondary Button
```typescript
className="bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
```

### Text Colors (Dark Theme)
```typescript
// Primary
className="text-white"

// Secondary
className="text-gray-300"

// Muted
className="text-gray-400"

// Accent
className="text-[#00F5A0]"
```

## Accessibility Checklist

- [ ] All interactive elements have `aria-label`
- [ ] Semantic HTML (`<header>`, `<main>`, `<footer>`, `<nav>`)
- [ ] Keyboard navigation works (Tab, Enter, ESC)
- [ ] Focus indicators visible
- [ ] Color contrast meets AA standards
- [ ] Screen reader tested
- [ ] ARIA roles for tabs and navigation

## Performance Checklist

- [ ] Images lazy loaded
- [ ] Code splitting for heavy components
- [ ] React.memo for expensive components
- [ ] Debounced search (300ms)
- [ ] Virtual scrolling for long lists
- [ ] Edge caching for anonymous users
- [ ] Redis caching for hot data

## Testing Checklist

- [ ] Header renders correctly
- [ ] SearchBar works with debouncing
- [ ] FilterDrawer opens and closes
- [ ] Tabs change active state
- [ ] StickySubFilters become sticky on scroll
- [ ] RightRail hidden on mobile/tablet
- [ ] Footer links work
- [ ] Responsive layouts tested
- [ ] Accessibility features work
- [ ] Infinite scroll works

## Common Issues & Solutions

### Issue: RightRail showing on mobile
**Solution**: Ensure `hidden xl:block` classes are applied
```typescript
<RightRail className="hidden xl:block" />
```

### Issue: Sticky filters not sticking
**Solution**: Check z-index and top offset
```typescript
className="sticky top-20 z-30"
```

### Issue: Filter state not updating
**Solution**: Use functional setState
```typescript
setFilters(prev => ({ ...prev, ...newFilters }));
```

### Issue: Infinite scroll triggering too early
**Solution**: Adjust threshold percentage
```typescript
const threshold = document.documentElement.scrollHeight * 0.7; // 70%
```

### Issue: SearchBar not debouncing
**Solution**: Check debounceMs prop
```typescript
<SearchBar debounceMs={300} />
```

## File Locations

```
src/
├── pages/
│   └── Hunter.tsx                          # Main page component
├── components/
│   └── hunter/
│       ├── SearchBar.tsx                   # Search component
│       ├── FilterDrawer.tsx                # Filter modal
│       ├── HunterTabs.tsx                  # Tab navigation
│       ├── StickySubFilters.tsx            # Quick filters
│       ├── RightRail.tsx                   # Desktop sidebar
│       ├── OpportunityCard.tsx             # Card component
│       └── OpportunityActions.tsx          # Card actions
├── hooks/
│   ├── useHunterFeed.ts                    # Data fetching
│   └── useSavedOpportunities.ts            # Saved items
├── types/
│   └── hunter.ts                           # Type definitions
└── __tests__/
    └── pages/
        └── Hunter.layout.test.tsx          # Layout tests
```

## Quick Commands

### Run Tests
```bash
npm test -- src/__tests__/pages/Hunter.layout.test.tsx --run
```

### Type Check
```bash
npx tsc --noEmit src/pages/Hunter.tsx
```

### Lint
```bash
npm run lint src/pages/Hunter.tsx
```

### Build
```bash
npm run build
```

## Environment Variables

```env
# Required for Hunter Screen
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## API Endpoints Used

```
GET  /api/hunter/opportunities      # Fetch opportunities
GET  /api/guardian/summary          # Guardian trust scores
GET  /api/eligibility/preview       # Eligibility status
POST /api/hunter/save               # Save opportunity
POST /api/hunter/report             # Report opportunity
GET  /api/cron/guardian-rescan      # Rescan stale opportunities
```

## Feature Flags

```typescript
// Check if feature is enabled
const isRankingV2Enabled = await getFeatureFlag('rankingModelV2');
const isEligibilityV2Enabled = await getFeatureFlag('eligibilityPreviewV2');
```

## Monitoring

### Key Metrics
- FCP (First Contentful Paint): < 1.0s
- API P95 Latency: < 200ms
- Interaction Response: < 150ms
- Error Rate: < 1%

### Alerts
- API latency > 200ms for 5 minutes
- Error rate > 1% for 5 minutes
- Frontend TTI > 2s at P95

## Support

For questions or issues:
1. Check this quick reference
2. Review the full design doc: `.kiro/specs/hunter-screen-feed/design.md`
3. Check the requirements: `.kiro/specs/hunter-screen-feed/requirements.md`
4. Review the layout diagram: `.kiro/specs/hunter-screen-feed/HUNTER_LAYOUT_DIAGRAM.md`
5. Check the completion summary: `.kiro/specs/hunter-screen-feed/TASK_30G_COMPLETION.md`
