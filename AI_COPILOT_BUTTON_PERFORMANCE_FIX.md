# AI Copilot Button Performance Fix

## Issues Identified

### 1. **Infinite Rotation Animation**
- The Sparkles icon had a continuous rotation animation running infinitely
- This caused constant re-renders and GPU usage even when the drawer was closed
- **Impact**: High CPU/GPU usage, battery drain, general UI lag

### 2. **Drawer Always Mounted**
- The CopilotChatDrawer component was always mounted in the DOM
- EventSource connections were being established even when drawer was closed
- **Impact**: Unnecessary network connections, memory usage

### 3. **Excessive Re-renders**
- useEffect dependencies included entire objects instead of specific values
- No memoization of expensive operations
- **Impact**: Unnecessary component re-renders causing lag

### 4. **EventSource Reconnection Issues**
- Hook reconnected on every walletScope object change (even if values were the same)
- No enabled/disabled flag to control connection lifecycle
- **Impact**: Unnecessary network reconnections, API calls

### 5. **Heavy Transition Animations**
- `transition-all` was animating all properties including expensive ones
- No GPU acceleration hints
- **Impact**: Janky animations, layout thrashing

## Fixes Applied

### 1. **Removed Infinite Animation**
```tsx
// ❌ Before: Continuous rotation
<motion.div
  animate={{ rotate: [0, 360] }}
  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
>
  <Sparkles className="w-5 h-5" />
</motion.div>

// ✅ After: Static icon
<Sparkles className="w-5 h-5" />
```

### 2. **Conditional Drawer Rendering**
```tsx
// ❌ Before: Always mounted
<CopilotChatDrawer isOpen={isCopilotOpen} ... />

// ✅ After: Only render when open
{isCopilotOpen && (
  <CopilotChatDrawer isOpen={isCopilotOpen} ... />
)}
```

### 3. **Optimized Re-renders**
```tsx
// Added useCallback for event handlers
const handleSendMessage = useCallback(() => { ... }, [inputMessage, isConnected, sendMessage]);
const handleKeyPress = useCallback((e) => { ... }, [handleSendMessage]);

// Added useMemo for computed values
const hasContent = useMemo(() => 
  messages.length > 0 || actionCards.length > 0 || intentPlans.length > 0,
  [messages.length, actionCards.length, intentPlans.length]
);

// Debounced scroll effect
useEffect(() => {
  if (!isOpen) return;
  
  const timeoutId = setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
  
  return () => clearTimeout(timeoutId);
}, [messages.length, actionCards.length, intentPlans.length, capabilityNotices.length, isOpen]);
```

### 4. **Smart EventSource Connection**
```tsx
// Added enabled flag to hook
export interface UseCopilotSSEOptions {
  walletScope: WalletScope;
  enabled?: boolean; // Only connect when enabled
  // ...
}

// Only connect when drawer is open
const { ... } = useCopilotSSE({
  walletScope,
  enabled: isOpen,
  onError: (err) => { ... },
});

// Optimized dependency array
useEffect(() => {
  if (!enabled) {
    disconnect();
    return;
  }
  
  connect();
  
  return () => disconnect();
}, [enabled, walletScope.mode, walletScope.mode === 'active_wallet' ? walletScope.address : null]);
```

### 5. **Optimized Button Animations**
```tsx
// ❌ Before: Animates all properties
className="... transition-all duration-300"

// ✅ After: Only animate colors, add GPU acceleration
className="... transition-colors duration-200 will-change-transform"
whileHover={{ scale: 1.05, y: -2 }}
whileTap={{ scale: 0.95 }}
transition={{ type: "spring", stiffness: 400, damping: 17 }}
```

## Performance Improvements

### Before
- ❌ Continuous 60fps animation running
- ❌ EventSource connection always active
- ❌ Drawer component always in DOM
- ❌ Multiple unnecessary re-renders per second
- ❌ Heavy transition animations

### After
- ✅ No animations when drawer closed
- ✅ EventSource only connects when drawer opens
- ✅ Drawer only mounts when needed
- ✅ Minimal re-renders with memoization
- ✅ Optimized GPU-accelerated animations

## Expected Results

1. **Reduced CPU Usage**: No continuous animations when idle
2. **Reduced Memory**: Drawer unmounts when closed
3. **Reduced Network**: No EventSource connections when closed
4. **Smoother UI**: Optimized animations and fewer re-renders
5. **Better Battery Life**: Less background processing

## Testing Checklist

- [ ] Click AI Copilot button - drawer opens smoothly
- [ ] Close drawer - no lag or stuttering
- [ ] Navigate between tabs - no performance degradation
- [ ] Open/close drawer multiple times - consistent performance
- [ ] Check browser DevTools Performance tab - no continuous activity when drawer closed
- [ ] Check Network tab - EventSource only connects when drawer opens
- [ ] Test on mobile device - smooth interactions
- [ ] Test with React DevTools Profiler - minimal re-renders

## Files Modified

1. `src/components/portfolio/PortfolioRouteShell.tsx`
   - Removed infinite rotation animation
   - Added conditional rendering for drawer
   - Optimized button transitions

2. `src/components/portfolio/CopilotChatDrawer.tsx`
   - Added useCallback for event handlers
   - Added useMemo for computed values
   - Debounced scroll effect
   - Fixed prop name (onOpenChange → onClose)

3. `src/hooks/useCopilotSSE.ts`
   - Added `enabled` option
   - Optimized dependency arrays
   - Improved memoization

## Additional Recommendations

1. **Monitor Performance**: Use React DevTools Profiler to track component render times
2. **Lazy Load**: Consider lazy loading the drawer component if it's large
3. **Virtual Scrolling**: If message list grows large, implement virtual scrolling
4. **Throttle Updates**: If SSE sends many rapid updates, throttle state updates
5. **Error Boundaries**: Add error boundary around drawer to prevent crashes

## Notes

- All changes follow React best practices
- No breaking changes to API or functionality
- Maintains accessibility and user experience
- Compatible with existing codebase patterns
