# AlphaWhale Component Standardization Guide

## Overview

This guide documents the standardized component system for AlphaWhale, implementing the UX Gap Requirements for component consistency and the "No Silent Clicks" rule.

**Requirements**: R13.COMPONENTS.SINGLE_BUTTON, R13.COMPONENTS.SINGLE_SKELETON, R13.COMPONENTS.SINGLE_TOAST, R13.NO_SILENT_CLICKS

## Core Principles

### 1. Single Source of Truth
- **One Button Component**: All primary CTAs use `src/components/ui/button.tsx`
- **One Skeleton System**: All loading states use `src/components/ui/Skeletons.tsx`
- **One Toast System**: All notifications use `src/components/ui/toast.tsx` with `src/hooks/use-toast.ts`

### 2. No Silent Clicks
Every clickable element MUST provide observable feedback:
- **Navigation**: Link to a route
- **Modal**: Open a dialog or modal
- **Toast**: Show a notification
- **Tooltip**: Display information
- **Loading**: Show loading state
- **Disabled**: Explain why it's disabled

## Enhanced Button Component

### Basic Usage

```tsx
import { Button } from '@/components/ui/button';

// Standard button
<Button onClick={handleClick}>
  Click Me
</Button>

// With variant and size
<Button variant="destructive" size="lg" onClick={handleDelete}>
  Delete
</Button>
```

### Loading States

```tsx
// Button with loading state
<Button 
  loading={isLoading}
  loadingText="Saving..."
  onClick={handleSave}
>
  Save Changes
</Button>

// Loading state automatically disables the button
// and shows a spinner icon
```

### Success and Error States

```tsx
// Success state
<Button 
  successState={showSuccess}
  successText="Saved ✓"
  onClick={handleSave}
>
  Save
</Button>

// Error state
<Button 
  errorState={showError}
  errorText="Failed to save"
  onClick={handleSave}
>
  Save
</Button>
```

### Disabled with Explanation (No Silent Clicks)

```tsx
// ✅ CORRECT: Disabled button with explanation
<Button 
  disabled={!isValid}
  disabledReason="Please fill in all required fields"
  onClick={handleSubmit}
>
  Submit
</Button>

// ❌ WRONG: Disabled button without explanation
<Button disabled={!isValid} onClick={handleSubmit}>
  Submit
</Button>
```

### Animation Controls

```tsx
// Disable press animation
<Button scaleOnPress={false} onClick={handleClick}>
  No Animation
</Button>

// Custom animation duration
<Button animationDuration={300} onClick={handleClick}>
  Slower Animation
</Button>

// Animations automatically respect prefers-reduced-motion
```

### Complete Example

```tsx
const MyForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await submitForm();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSubmit}
      loading={isLoading}
      loadingText="Submitting..."
      successState={showSuccess}
      successText="Submitted ✓"
      disabled={!isValid}
      disabledReason="Please complete all required fields"
    >
      Submit Form
    </Button>
  );
};
```

## Skeleton System

### Basic Usage

```tsx
import { Skeleton } from '@/components/ui/Skeletons';

// Simple skeleton
<Skeleton className="h-4 w-32" aria-label="Loading title" />

// Multiple skeletons
<div className="space-y-2">
  <Skeleton className="h-6 w-48" aria-label="Loading heading" />
  <Skeleton className="h-4 w-full" aria-label="Loading description" />
  <Skeleton className="h-4 w-3/4" aria-label="Loading description line 2" />
</div>
```

### Specialized Skeletons

```tsx
import { 
  FeatureCardSkeleton,
  TrustStatsSkeleton,
  OnboardingStepsSkeleton 
} from '@/components/ui/Skeletons';

// Feature card loading state
<FeatureCardSkeleton loadingMessage="Loading Guardian data..." />

// Trust stats loading state
<TrustStatsSkeleton loadingMessage="Loading platform statistics..." />

// Onboarding steps loading state
<OnboardingStepsSkeleton loadingMessage="Loading onboarding steps..." />
```

### Best Practices

1. **Match Final Content**: Skeleton dimensions should match the final content layout
2. **Descriptive Messages**: Provide specific loading messages, not generic "Loading..."
3. **Accessibility**: Always include `aria-label` for screen readers
4. **Reduced Motion**: Skeletons automatically respect `prefers-reduced-motion`

## Toast System

### Basic Usage

```tsx
import { useToast } from '@/hooks/use-toast';

const MyComponent = () => {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      variant: 'success',
      title: 'Changes saved ✓',
      description: 'Your settings have been updated.',
    });
  };

  const handleError = () => {
    toast({
      variant: 'destructive',
      title: 'Failed to save',
      description: 'Please try again or contact support.',
    });
  };

  return (
    <>
      <Button onClick={handleSuccess}>Save</Button>
      <Button onClick={handleError}>Trigger Error</Button>
    </>
  );
};
```

### Toast Variants

```tsx
// Success (green)
toast({
  variant: 'success',
  title: 'Success!',
  description: 'Operation completed successfully.',
});

// Error (red)
toast({
  variant: 'destructive',
  title: 'Error',
  description: 'Something went wrong.',
});

// Warning (yellow)
toast({
  variant: 'warning',
  title: 'Warning',
  description: 'Please review your input.',
});

// Info (default)
toast({
  title: 'Information',
  description: 'Here is some helpful information.',
});
```

### Toast with Actions

```tsx
toast({
  title: 'Undo available',
  description: 'Your changes have been saved.',
  action: (
    <Button variant="outline" size="sm" onClick={handleUndo}>
      Undo
    </Button>
  ),
});
```

## CSS Custom Properties

### Available Variables

```css
/* Primary colors */
--aw-primary: hsl(var(--primary));
--aw-primary-foreground: hsl(var(--primary-foreground));
--aw-secondary: hsl(var(--secondary));
--aw-secondary-foreground: hsl(var(--secondary-foreground));

/* Animation timing */
--aw-animation-fast: 120ms;
--aw-animation-normal: 200ms;
--aw-animation-slow: 300ms;

/* Component sizing */
--aw-button-padding-x: 1rem;
--aw-button-padding-y: 0.5rem;
--aw-button-border-radius: 0.375rem;
--aw-button-scale-press: 0.98;

/* Skeleton animation */
--aw-skeleton-shimmer-duration: 2s;

/* Toast timing */
--aw-toast-duration-success: 3000ms;
--aw-toast-duration-error: 5000ms;
--aw-toast-duration-info: 4000ms;
```

### Usage in Components

```tsx
// ✅ CORRECT: Use CSS custom properties
<div style={{ 
  backgroundColor: 'var(--aw-primary)',
  transitionDuration: 'var(--aw-animation-normal)'
}}>
  Content
</div>

// ❌ WRONG: Hardcoded values
<div style={{ 
  backgroundColor: '#00F5A0',
  transitionDuration: '200ms'
}}>
  Content
</div>
```

## No Silent Clicks Enforcement

### Development Mode Validation

The No Silent Clicks validator runs automatically in development mode:

```typescript
// Automatically enabled in development
// Access via browser console:
window.noSilentClicksValidator.validate();

// Highlight violations:
window.noSilentClicksValidator.highlightViolations();

// Clear highlights:
window.noSilentClicksValidator.clearHighlights();
```

### ESLint Rule

The custom ESLint rule catches violations at build time:

```tsx
// ✅ CORRECT: Button with action
<button onClick={handleClick}>Click Me</button>

// ✅ CORRECT: Disabled with explanation
<button disabled disabledReason="Form is incomplete">
  Submit
</button>

// ❌ WRONG: Button without action (ESLint error)
<button>Click Me</button>

// ❌ WRONG: Disabled without explanation (ESLint error)
<button disabled>Submit</button>
```

### Common Patterns

#### Navigation

```tsx
// Link with href
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>

// Button that navigates
<Button onClick={() => router.push('/settings')}>
  Settings
</Button>
```

#### Modal Triggers

```tsx
<Button onClick={() => setModalOpen(true)}>
  Open Modal
</Button>
```

#### Toast Notifications

```tsx
<Button onClick={() => toast({ title: 'Action completed' })}>
  Complete Action
</Button>
```

#### Loading States

```tsx
<Button 
  loading={isLoading}
  onClick={handleAsyncAction}
>
  Save
</Button>
```

#### Disabled with Explanation

```tsx
<Button 
  disabled={!canSubmit}
  disabledReason="Please complete all required fields"
  onClick={handleSubmit}
>
  Submit
</Button>
```

## Migration Guide

### Replacing Custom Buttons

```tsx
// Before: Custom button implementation
<div 
  className="custom-button" 
  onClick={handleClick}
  style={{ opacity: isDisabled ? 0.5 : 1 }}
>
  {isLoading ? 'Loading...' : 'Click Me'}
</div>

// After: Standardized Button component
<Button 
  onClick={handleClick}
  disabled={isDisabled}
  disabledReason="Action not available"
  loading={isLoading}
  loadingText="Loading..."
>
  Click Me
</Button>
```

### Replacing Custom Skeletons

```tsx
// Before: Custom skeleton
<div className="animate-pulse bg-gray-700 h-4 w-32 rounded" />

// After: Standardized Skeleton
<Skeleton className="h-4 w-32" aria-label="Loading content" />
```

### Replacing Custom Toasts

```tsx
// Before: Custom notification
setNotification({ type: 'success', message: 'Saved!' });

// After: Standardized Toast
toast({
  variant: 'success',
  title: 'Changes saved ✓',
  description: 'Your settings have been updated.',
});
```

## Testing

### Property-Based Tests

Component standardization is validated with property-based tests:

```bash
# Run component standardization tests
npm test -- ComponentStandardization.property.test.ts

# Run interaction feedback tests
npm test -- InteractionFeedback.property.test.ts
```

### Manual Testing Checklist

- [ ] All buttons use the Button component
- [ ] All loading states use Skeleton components
- [ ] All notifications use Toast system
- [ ] No clickable elements without feedback
- [ ] Disabled elements have explanations
- [ ] Animations respect reduced motion preference
- [ ] CSS custom properties used consistently

## Accessibility

### Keyboard Navigation

All standardized components support keyboard navigation:

- **Button**: Tab to focus, Enter/Space to activate
- **Skeleton**: Properly labeled for screen readers
- **Toast**: Announced by screen readers, dismissible

### Screen Reader Support

- Buttons announce their state (loading, disabled, success)
- Skeletons have descriptive `aria-label` attributes
- Toasts are announced with appropriate urgency

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are disabled or significantly reduced */
}
```

## Performance

### Bundle Size Impact

Component standardization has minimal bundle size impact:

- Enhanced Button: +2KB (includes loading spinner icon)
- Skeleton System: Already existed, no change
- Toast System: Already existed, no change
- No Silent Clicks Validator: Development only, not in production bundle

### Animation Performance

All animations maintain 60fps:

- Button press animation: 120ms (--aw-animation-fast)
- Card hover animation: 200ms (--aw-animation-normal)
- Modal transitions: 300ms (--aw-animation-slow)

## Support

For questions or issues with component standardization:

1. Check this documentation
2. Review the component source code
3. Run the No Silent Clicks validator in development
4. Check ESLint errors for violations
5. Review property-based test results

## Summary

The standardized component system ensures:

✅ Consistent user experience across the application
✅ No silent clicks - all interactions provide feedback
✅ Accessibility compliance (WCAG AA)
✅ Performance optimization (60fps animations)
✅ Maintainability through single source of truth
✅ Developer experience with clear patterns and validation