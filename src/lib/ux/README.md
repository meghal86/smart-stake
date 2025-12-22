# Universal Loading State System

A comprehensive loading state management system that provides consistent 100ms feedback for all async operations across the AlphaWhale platform.

## Features

- **100ms Feedback Guarantee**: Loading states appear within 100ms for all async operations
- **AppShell Persistence**: Prevents white flash during navigation by maintaining persistent header/navigation
- **Descriptive Messages**: Context-aware loading messages for different operation types
- **Timeout Handling**: Graceful handling of operations exceeding 8 seconds with retry options
- **Progress Support**: Built-in progress tracking for long-running operations
- **React Integration**: Seamless React hooks for state management
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions

## Requirements Validation

This system validates the following requirements:
- **R2.LOADING.100MS**: Loading feedback appears within 100ms
- **R2.LOADING.DESCRIPTIVE**: Descriptive loading messages for different operation types
- **R2.LOADING.SUCCESS_FAILURE**: Clear success/failure feedback with recovery options

## Quick Start

### Basic Usage with React Hooks

```tsx
import { useSingleLoadingState } from '@/hooks/useLoadingState';

function MyComponent() {
  const { start, stop, isLoading, hasTimedOut, message } = useSingleLoadingState(
    'my-operation',
    'async-action'
  );

  const handleAsyncOperation = async () => {
    try {
      start('Processing your request...');
      await someAsyncOperation();
    } finally {
      stop();
    }
  };

  if (hasTimedOut) {
    return <div>Operation timed out. Please try again.</div>;
  }

  return (
    <div>
      <button onClick={handleAsyncOperation} disabled={isLoading}>
        {isLoading ? message : 'Start Operation'}
      </button>
    </div>
  );
}
```

### Using LoadingWrapper

```tsx
import { LoadingWrapper } from '@/components/ux/LoadingSystem';
import { useSingleLoadingState } from '@/hooks/useLoadingState';

function DataComponent() {
  const { start, stop } = useSingleLoadingState('data-fetch', 'data-fetch');

  const fetchData = () => {
    start('Loading data...');
    // Your async operation here
    // Call stop() when done
  };

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      
      <LoadingWrapper
        contextId="data-fetch"
        type="data-fetch"
        useSkeleton={true}
        onRetry={fetchData}
      >
        <div>Your data content here</div>
      </LoadingWrapper>
    </div>
  );
}
```

### Using AppShell for Navigation

```tsx
import { AppShell } from '@/components/ux/AppShell';

function App() {
  return (
    <AppShell showHeader={true} showNavigation={true}>
      {/* Your page content */}
      <div>Page content that transitions smoothly</div>
    </AppShell>
  );
}
```

### Direct LoadingStateManager Usage

```tsx
import { LoadingStateManager } from '@/lib/ux/LoadingStateManager';

// Show loading
LoadingStateManager.showLoading({
  id: 'wallet-connect',
  type: 'wallet-connect',
  message: 'Connecting to MetaMask...',
  timeout: 10000
});

// Update progress (if supported)
LoadingStateManager.updateProgress('wallet-connect', 50);

// Update message
LoadingStateManager.setLoadingMessage('wallet-connect', 'Confirming connection...');

// Hide loading
LoadingStateManager.hideLoading('wallet-connect');
```

## Operation Types

The system supports different operation types with contextual default messages:

- **navigation**: "Loading page..."
- **async-action**: "Executing..."
- **data-fetch**: "Loading data..."
- **wallet-connect**: "Connecting wallet..."
- **form-submit**: "Saving changes..."

## Components

### LoadingIndicator

Basic loading spinner with message and progress support:

```tsx
<LoadingIndicator
  isLoading={true}
  message="Custom loading message"
  progress={75}
  size="md"
  variant="spinner"
/>
```

### Skeleton System

Unified skeleton loaders with consistent styling:

```tsx
import { Skeleton, TextSkeleton, CardSkeleton } from '@/components/ux/Skeleton';

// Basic skeleton
<Skeleton className="h-4 w-48" />

// Text skeleton with multiple lines
<TextSkeleton lines={3} />

// Card skeleton
<CardSkeleton />

// Predefined skeletons
<OpportunityCardSkeleton />
<FeatureCardSkeleton />
```

### TimeoutHandler

Handles operations that exceed timeout limits:

```tsx
<TimeoutHandler
  isTimedOut={hasTimedOut}
  operationType="data-fetch"
  onRetry={handleRetry}
  onCancel={handleCancel}
  variant="overlay"
/>
```

### LoadingButton

Button with integrated loading states:

```tsx
<LoadingButton
  isLoading={isSubmitting}
  loadingText="Saving..."
  isSuccess={isSuccess}
  successText="Saved!"
  onClick={handleSubmit}
>
  Save Changes
</LoadingButton>
```

## Testing

The system includes comprehensive tests:

### Property-Based Tests

Tests universal properties that must hold for all inputs:

```bash
npm test -- src/lib/ux/__tests__/LoadingStateManager.property.test.ts
```

### Unit Tests

Tests specific examples and edge cases:

```bash
npm test -- src/lib/ux/__tests__/LoadingStateManager.unit.test.ts
```

## Architecture

The system follows a layered architecture:

1. **LoadingStateManager**: Core singleton managing all loading states
2. **React Hooks**: Integration layer for React components
3. **UI Components**: Reusable loading UI components
4. **AppShell**: Persistent layout preventing white flash

## Best Practices

1. **Use Descriptive Messages**: Always provide context-specific loading messages
2. **Handle Timeouts**: Implement retry logic for operations that may timeout
3. **Cleanup**: Always call `stop()` or `hideLoading()` when operations complete
4. **Progress Updates**: Use progress indicators for long-running operations
5. **Error Handling**: Provide clear error messages and recovery options

## Performance Considerations

- Loading states are managed efficiently with minimal re-renders
- Skeleton loaders prevent layout shifts
- AppShell persistence eliminates navigation flash
- Timeout handling prevents hanging operations
- Memory cleanup prevents leaks

## Accessibility

- All loading states include appropriate ARIA labels
- Skeleton loaders have proper accessibility attributes
- Timeout handlers provide clear user feedback
- Loading buttons maintain focus management
- Progress indicators are screen reader accessible