# SearchBar Component

A fully-featured search input component with debouncing, suggestions, and keyboard navigation for the Hunter Screen.

## Features

- ✅ **300ms Debouncing**: Reduces API calls by debouncing user input (configurable)
- ✅ **Search Suggestions**: Dropdown with clickable suggestions
- ✅ **Clear Functionality**: One-click clear button
- ✅ **Keyboard Navigation**: Full keyboard support (Arrow keys, Enter, Escape)
- ✅ **Accessibility**: WCAG AA compliant with proper ARIA attributes
- ✅ **Click Outside**: Auto-close suggestions when clicking outside
- ✅ **Integration Ready**: Works seamlessly with useHunterFeed hook

## Requirements

Implements **Requirement 4.2**:
- WHEN searching THEN the search SHALL be debounced by 300ms and cached

## Usage

### Basic Usage

```tsx
import { SearchBar } from '@/components/hunter/SearchBar';

function MyComponent() {
  const [search, setSearch] = useState('');

  return (
    <SearchBar
      value={search}
      onChange={setSearch}
      placeholder="Search opportunities..."
    />
  );
}
```

### With Suggestions

```tsx
import { SearchBar } from '@/components/hunter/SearchBar';

function MyComponent() {
  const [search, setSearch] = useState('');
  const suggestions = [
    'Ethereum Staking',
    'LayerZero Airdrop',
    'Uniswap Quest',
  ];

  return (
    <SearchBar
      value={search}
      onChange={setSearch}
      suggestions={suggestions}
      onSuggestionClick={(suggestion) => {
        console.log('Selected:', suggestion);
      }}
    />
  );
}
```

### Integration with useHunterFeed

```tsx
import { SearchBar } from '@/components/hunter/SearchBar';
import { useHunterFeed } from '@/hooks/useHunterFeed';

function HunterScreen() {
  const [search, setSearch] = useState('');
  
  const { opportunities, isLoading } = useHunterFeed({
    filter: 'All',
    isDemo: false,
    copilotEnabled: false,
    realTimeEnabled: false,
    search, // Pass search to hook
  });

  return (
    <div>
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search opportunities..."
      />
      {/* Render opportunities */}
    </div>
  );
}
```

### Custom Debounce Time

```tsx
<SearchBar
  value={search}
  onChange={setSearch}
  debounceMs={500} // 500ms instead of default 300ms
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | Required | Current search value |
| `onChange` | `(value: string) => void` | Required | Callback when search value changes (debounced) |
| `placeholder` | `string` | `'Search opportunities...'` | Input placeholder text |
| `debounceMs` | `number` | `300` | Debounce delay in milliseconds |
| `suggestions` | `string[]` | `[]` | Array of search suggestions |
| `onSuggestionClick` | `(suggestion: string) => void` | `undefined` | Callback when suggestion is clicked |
| `className` | `string` | `undefined` | Additional CSS classes |
| `disabled` | `boolean` | `false` | Disable the input |

## Keyboard Navigation

- **Arrow Down**: Navigate to next suggestion
- **Arrow Up**: Navigate to previous suggestion
- **Enter**: Select highlighted suggestion
- **Escape**: Close suggestions dropdown (or clear search if no suggestions)

## Accessibility

The SearchBar component is fully accessible:

- ✅ **ARIA Labels**: Proper `aria-label`, `aria-autocomplete`, `aria-expanded`
- ✅ **Role Attributes**: `combobox` for input, `listbox` for suggestions, `option` for items
- ✅ **Keyboard Navigation**: Full keyboard support
- ✅ **Screen Reader Support**: All interactive elements are properly announced
- ✅ **Focus Management**: Focus returns to input after actions

## Testing

Run tests:

```bash
npm test SearchBar.test.tsx
```

Test coverage includes:
- Basic rendering
- Input handling
- 300ms debouncing
- Clear functionality
- Search suggestions
- Keyboard navigation
- Click outside behavior
- Accessibility compliance
- Integration with useHunterFeed

## Implementation Details

### Debouncing

The component uses a `useRef` to store the debounce timer and clears it on each keystroke:

```typescript
const debouncedOnChange = useCallback(
  (newValue: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  },
  [onChange, debounceMs]
);
```

### Suggestions State

Suggestions are shown when:
1. Input has a value (not empty)
2. Suggestions array is not empty
3. User hasn't explicitly closed the dropdown

### Keyboard Navigation State

The component tracks the selected suggestion index and updates it based on arrow key presses:

```typescript
const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
```

## Examples

### With Dynamic Suggestions

```tsx
function SearchWithDynamicSuggestions() {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (search.length > 2) {
      // Fetch suggestions from API
      fetchSuggestions(search).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [search]);

  return (
    <SearchBar
      value={search}
      onChange={setSearch}
      suggestions={suggestions}
    />
  );
}
```

### With Analytics Tracking

```tsx
function SearchWithAnalytics() {
  const [search, setSearch] = useState('');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Track search event
    trackEvent('search_query', { query: value });
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Track suggestion click
    trackEvent('search_suggestion_click', { suggestion });
  };

  return (
    <SearchBar
      value={search}
      onChange={handleSearchChange}
      suggestions={['Ethereum', 'Solana', 'Polygon']}
      onSuggestionClick={handleSuggestionClick}
    />
  );
}
```

## Related Components

- `FilterDrawer`: Comprehensive filtering UI
- `HunterTabs`: Tab navigation for opportunity types
- `OpportunityGrid`: Grid display with infinite scroll

## Related Hooks

- `useHunterFeed`: Main hook for fetching opportunities with search support

## Status

✅ **Complete** - All requirements implemented and tested

## Next Steps

This component is ready for integration into the Hunter Screen. Next tasks:
- Task 30d: Update HunterTabs to match spec
- Task 30e: Create StickySubFilters component
- Task 30f: Create RightRail component
- Task 30g: Update Hunter page layout to match spec
