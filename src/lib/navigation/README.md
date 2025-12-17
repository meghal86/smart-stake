# Navigation System - Deterministic Browser Navigation

## Overview

The Navigation System implements deterministic browser back/forward behavior to ensure that deep links restore correctly and navigation state is preserved across browser history operations.

**Requirements:** R1.ROUTING.DETERMINISTIC, R1.ROUTING.CANONICAL, R1.ROUTING.INVALID_PARAMS  
**Design:** Navigation Architecture → Route Canonicalization & Enforcement

## Key Features

### 1. Deterministic Route Canonicalization
- All routes are validated and canonicalized to prevent routing conflicts
- Invalid routes are automatically redirected to their canonical equivalents
- Tab parameters are validated and fall back to defaults when invalid

### 2. Browser Navigation Event Handling
- Listens for `popstate` events to handle browser back/forward navigation
- Automatically canonicalizes routes when users navigate via browser buttons
- Maintains consistent navigation state across all navigation methods

### 3. State Preservation
- Tracks current canonical route state
- Preserves tab selections during navigation
- Ensures deterministic restoration of deep links

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Navigation                        │
├─────────────────────────────────────────────────────────────┤
│  NavigationRouter    │  useBrowserNavigation │  Provider     │
│  - Route validation  │  - React integration  │  - Global     │
│  - Canonicalization  │  - Hook interface     │    setup      │
│  - Event handling    │  - State management   │  - Toast      │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    React Router                             │
├─────────────────────────────────────────────────────────────┤
│  BrowserRouter       │  Routes              │  Navigation   │
│  - History API       │  - Route matching    │  - useNavigate│
│  - URL management    │  - Component render  │  - useLocation│
└─────────────────────────────────────────────────────────────┘
```

## Usage

### 1. Global Setup (App.tsx)

```typescript
import { BrowserNavigationProvider } from '@/components/navigation/BrowserNavigationProvider';

function App() {
  return (
    <BrowserRouter>
      <BrowserNavigationProvider>
        <Routes>
          {/* Your routes */}
        </Routes>
      </BrowserNavigationProvider>
    </BrowserRouter>
  );
}
```

### 2. Using the Hook

```typescript
import { useBrowserNavigation } from '@/hooks/useBrowserNavigation';

function MyComponent() {
  const { navigateToCanonical, navigateToPath, getCurrentRoute } = useBrowserNavigation({
    showToast: (message) => toast(message)
  });

  const handleNavigation = () => {
    // Navigate to canonical route for a nav item
    navigateToCanonical('guardian');
    
    // Or navigate to a specific path with validation
    navigateToPath('/hunter?tab=quests');
  };

  const currentRoute = getCurrentRoute();
  
  return (
    <div>
      <p>Current route: {currentRoute?.canonicalUrl}</p>
      <button onClick={handleNavigation}>Navigate</button>
    </div>
  );
}
```

### 3. Direct NavigationRouter Usage

```typescript
import { NavigationRouter } from '@/lib/navigation/NavigationRouter';

// Initialize browser navigation (done automatically by the hook)
NavigationRouter.initializeBrowserNavigation(navigate, showToast);

// Validate a route
const validation = NavigationRouter.validateRoute('/guardian?tab=invalid');
if (!validation.isValid) {
  console.log(validation.errorMessage); // "Invalid tab 'invalid' for guardian — showing scan"
  console.log(validation.canonicalPath); // "/guardian?tab=scan"
}

// Canonicalize a route
const canonical = NavigationRouter.canonicalize('/hunter?tab=nonexistent');
console.log(canonical.canonicalUrl); // "/hunter?tab=all"
```

## Canonical Routes

The system enforces these canonical route mappings:

| Route | Default Tab | Allowed Tabs | Canonical URL |
|-------|-------------|--------------|---------------|
| `/` | N/A | N/A | `/` |
| `/guardian` | `scan` | `scan`, `risks`, `alerts`, `history` | `/guardian?tab=scan` |
| `/hunter` | `all` | `all`, `airdrops`, `quests`, `yield` | `/hunter?tab=all` |
| `/harvestpro` | N/A | N/A | `/harvestpro` |
| `/portfolio` | N/A | N/A | `/portfolio` |
| `/settings` | N/A | N/A | `/settings` |

## Browser Navigation Behavior

### Valid Navigation
1. User navigates to `/guardian?tab=risks`
2. Route is valid, no canonicalization needed
3. Navigation proceeds normally
4. Browser back/forward works as expected

### Invalid Navigation with Canonicalization
1. User navigates to `/guardian?tab=invalid`
2. Route validation fails
3. Route is canonicalized to `/guardian?tab=scan`
4. User sees toast: "Invalid tab 'invalid' for guardian — showing scan"
5. URL is updated to canonical form
6. Browser back/forward maintains canonical routes

### Browser Back/Forward Handling
1. User clicks browser back/forward button
2. `popstate` event is triggered
3. NavigationRouter validates the current URL
4. If invalid, URL is canonicalized and user is notified
5. If valid, navigation state is updated
6. Component re-renders with correct state

## Testing

The system includes comprehensive tests:

### Property-Based Tests
- **Navigation Route Consistency**: Verifies all navigation produces canonical routes
- **Route Canonicalization Determinism**: Ensures same input always produces same output
- **Invalid Parameter Handling**: Tests that invalid tabs redirect to valid defaults
- **Navigation State Transitions**: Verifies consistent state management
- **Browser Navigation State Updates**: Tests deterministic route updates

### Integration Tests
- Browser navigation event listener setup
- Valid and invalid popstate event handling
- Route state management
- Deterministic behavior verification

### Unit Tests
- Hook initialization and functionality
- NavigationRouter method behavior
- React Router integration

### E2E Simulation Tests
- Browser back/forward navigation simulation
- Invalid route handling during navigation
- Navigation state restoration
- Tab state preservation

## Error Handling

### Invalid Routes
- Invalid paths redirect to home (`/`)
- Invalid tabs redirect to default tab for that route
- User receives informative toast messages
- Browser history is updated with canonical URL

### Navigation Failures
- Graceful fallback to home route
- Error logging for debugging
- User feedback via toast notifications
- Maintains application stability

## Performance Considerations

### Event Listener Management
- Single global popstate listener
- Automatic cleanup on unmount
- Prevents memory leaks

### Route Validation
- Fast regex-based validation
- Cached canonical route mappings
- Minimal computational overhead

### State Management
- Lightweight state tracking
- Only updates when necessary
- Efficient React re-renders

## Browser Compatibility

The system works with all modern browsers that support:
- HTML5 History API
- `popstate` events
- ES6+ JavaScript features
- React 18+

## Debugging

### Development Mode
- Console logging for route validation
- Toast notifications for canonicalization
- Error boundaries for graceful failure

### Production Mode
- Silent canonicalization
- Error tracking integration
- Performance monitoring

## Future Enhancements

### Planned Features
- Route transition animations
- Advanced state preservation
- Navigation analytics
- A/B testing integration

### Extensibility
- Custom validation rules
- Plugin architecture
- Third-party router support
- Mobile app integration

## Related Files

- `NavigationRouter.ts` - Core navigation logic
- `useBrowserNavigation.ts` - React hook interface
- `BrowserNavigationProvider.tsx` - Global provider component
- `__tests__/` - Comprehensive test suite
- `README.md` - This documentation

## Contributing

When modifying the navigation system:

1. **Maintain Determinism**: All navigation must be predictable
2. **Preserve Canonicalization**: Invalid routes must redirect properly
3. **Update Tests**: Add tests for new functionality
4. **Document Changes**: Update this README and inline comments
5. **Test Browser Navigation**: Verify back/forward buttons work correctly

The navigation system is critical for user experience and SEO. Changes should be thoroughly tested across different browsers and navigation patterns.